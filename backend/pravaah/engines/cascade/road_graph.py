import json
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra
from typing import List, Dict, Any, Tuple

class RoadGraphCascadeEngine:
    """
    High-performance road network cascade engine.
    Solves multi-source Dijkstra travel times across OpenStreetMap road networks 
    to quantify hospital reachability loss and isolated population counts under flooding.
    """
    def __init__(self, road_network_path: str):
        with open(road_network_path, "r") as f:
            self.network = json.load(f)
            
        self.nodes = self.network["nodes"]
        self.edges = self.network["edges"]
        
        self.node_id_to_idx = {node["node_id"]: idx for idx, node in enumerate(self.nodes)}
        self.idx_to_node_id = {idx: node["node_id"] for idx, node in enumerate(self.nodes)}
        self.n_nodes = len(self.nodes)

    def _build_adjacency_matrix(self, 
                                df_cube: pd.DataFrame, 
                                flood_prob: np.ndarray, 
                                flood_threshold: float = 0.50) -> csr_matrix:
        """
        Builds sparse CSR graph adjacency matrix where edge weights are travel times in minutes.
        Flooded edges (flood_prob > threshold or overtopped causeways) are set to infinity (impassable).
        """
        rows = []
        cols = []
        data = []
        
        from scipy.spatial import cKDTree

        cell_coords = df_cube[["lat", "lon"]].values
        tree = cKDTree(cell_coords)
        node_coords = np.array([[n.get("lat", 0.0), n.get("lon", 0.0)] for n in self.nodes])
        _, node_cell_indices = tree.query(node_coords)
        
        for edge in self.edges:
            u_idx = self.node_id_to_idx.get(edge["u"])
            v_idx = self.node_id_to_idx.get(edge["v"])
            if u_idx is None or v_idx is None:
                continue
            
            # Check edge flood probability from associated H3 cell
            h3_id = edge.get("h3_r8")
            cell_idx = cell_map.get(h3_id) if h3_id else node_cell_indices[u_idx]
            edge_flood_p = float(flood_prob[cell_idx]) if cell_idx is not None else 0.0
            
            # Is edge overtopped / flooded?
            is_flooded = (edge_flood_p >= flood_threshold) or (edge.get("is_causeway") and edge_flood_p > 0.35)
            
            if not is_flooded:
                # Travel time in minutes
                travel_time_min = (edge["length_km"] / edge["speed_kph"]) * 60.0
                rows.extend([u_idx, v_idx])
                cols.extend([v_idx, u_idx])
                data.extend([travel_time_min, travel_time_min])
                
        # Self-loops for diagonal
        for idx in range(self.n_nodes):
            rows.append(idx)
            cols.append(idx)
            data.append(0.0)
            
        return csr_matrix((data, (rows, cols)), shape=(self.n_nodes, self.n_nodes))

    def solve_accessibility_loss(self, 
                                df_cube: pd.DataFrame, 
                                health_facilities: List[Dict[str, Any]], 
                                flood_prob: np.ndarray) -> Dict[str, Any]:
        """
        Computes baseline vs flooded Dijkstra shortest-path travel times 
        from nodes to health facilities.
        """
        from scipy.spatial import cKDTree

        # Baseline sparse adjacency (no flooding)
        cs_baseline = self._build_adjacency_matrix(df_cube, np.zeros_like(flood_prob))
        # Flooded sparse adjacency
        cs_flooded = self._build_adjacency_matrix(df_cube, flood_prob)
        
        # Spatial nearest node lookup for facilities
        node_coords = np.array([[n.get("lat", 0.0), n.get("lon", 0.0)] for n in self.nodes])
        node_tree = cKDTree(node_coords)
        fac_coords = np.array([[fac.get("lat", 0.0), fac.get("lon", 0.0)] for fac in health_facilities])
        _, fac_node_indices = node_tree.query(fac_coords)
        
        # Multi-source Dijkstra solve from unique facility nodes
        unique_indices, inv_map = np.unique(fac_node_indices, return_inverse=True)
        dist_baseline_u = dijkstra(cs_baseline, directed=False, indices=unique_indices)
        dist_flooded_u = dijkstra(cs_flooded, directed=False, indices=unique_indices)
        
        dist_baseline = dist_baseline_u[inv_map]
        dist_flooded = dist_flooded_u[inv_map]
        
        # Map node to nearest H3 cell for broken edge detection
        cell_coords = df_cube[["lat", "lon"]].values
        cell_tree = cKDTree(cell_coords)
        _, node_cell_indices = cell_tree.query(node_coords)
        
        # Population reachability calculation across representative block nodes
        pop_loss_30min = 0
        pop_loss_60min = 0
        isolated_hospitals = []
        
        unique_blocks = set(n.get("block") for n in self.nodes)
        
        for block_name in unique_blocks:
            block_cube = df_cube[df_cube["admin_block"] == block_name]
            block_pop = int(block_cube["population"].sum()) if len(block_cube) > 0 else 5000
            
            block_nodes = [idx for idx, n in enumerate(self.nodes) if n.get("block") == block_name]
            if not block_nodes:
                continue
            rep_node_idx = block_nodes[0]
            
            min_base_time = np.min(dist_baseline[:, rep_node_idx]) if len(fac_node_indices) > 0 else 15.0
            min_flood_time = np.min(dist_flooded[:, rep_node_idx]) if len(fac_node_indices) > 0 else np.inf
            
            if min_base_time <= 30.0 and min_flood_time > 30.0:
                pop_loss_30min += block_pop
            if min_base_time <= 60.0 and min_flood_time > 60.0:
                pop_loss_60min += block_pop
                
        # Identify isolated health facilities
        for idx, fac in enumerate(health_facilities):
            f_node_idx = fac_node_indices[idx]
            reachable_nodes = np.sum(dist_flooded[idx] < np.inf)
            if reachable_nodes <= 1:
                isolated_hospitals.append(fac.get("name", f"Facility {idx+1}"))
                
        # Cut road edge count
        cell_map = {row["h3_r8"]: idx for idx, row in df_cube.iterrows()}
        broken_edges = []
        for edge in self.edges:
            u_idx = self.node_id_to_idx.get(edge["u"])
            h3_id = edge.get("h3_r8")
            cell_idx = cell_map.get(h3_id) if h3_id else (node_cell_indices[u_idx] if u_idx is not None else None)
            p = float(flood_prob[cell_idx]) if cell_idx is not None else 0.0
            if p >= 0.50 or (edge.get("is_causeway") and p > 0.35):
                broken_edges.append({
                    "edge_id": edge["edge_id"],
                    "name": edge["name"],
                    "highway": edge["highway"],
                    "length_km": edge["length_km"],
                    "is_causeway": edge.get("is_causeway", False),
                    "flood_probability": round(p, 3)
                })
                
        return {
            "population_losing_30min_access": pop_loss_30min,
            "population_losing_60min_access": pop_loss_60min,
            "isolated_facilities_count": len(isolated_hospitals),
            "isolated_facility_names": isolated_hospitals,
            "broken_road_edges_count": len(broken_edges),
            "broken_road_edges": broken_edges
        }
