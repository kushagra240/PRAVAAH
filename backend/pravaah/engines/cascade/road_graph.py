import json
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra
from scipy.spatial import cKDTree
from typing import List, Dict, Any, Tuple

class RoadGraphCascadeEngine:
    """
    High-performance road network cascade engine.
    Solves multi-source Dijkstra travel times across OpenStreetMap road networks 
    to quantify hospital reachability loss and isolated population counts under flooding,
    implementing §12.3 Three-State Edge Passability (OPEN, DEGRADED, IMPASSABLE).
    """
    def __init__(self, road_network_path: str):
        with open(road_network_path, "r") as f:
            self.network = json.load(f)
            
        self.nodes = self.network["nodes"]
        self.edges = self.network["edges"]
        
        self.node_id_to_idx = {node["node_id"]: idx for idx, node in enumerate(self.nodes)}
        self.idx_to_node_id = {idx: node["node_id"] for idx, node in enumerate(self.nodes)}
        self.n_nodes = len(self.nodes)

        # Precompute static vector arrays for graph construction
        valid_edges = []
        u_list = []
        v_list = []
        base_tt_list = []
        causeway_list = []
        
        for edge in self.edges:
            u_idx = self.node_id_to_idx.get(edge["u"])
            v_idx = self.node_id_to_idx.get(edge["v"])
            if u_idx is not None and v_idx is not None:
                valid_edges.append(edge)
                u_list.append(u_idx)
                v_list.append(v_idx)
                tt = (edge["length_km"] / edge["speed_kph"]) * 60.0
                base_tt_list.append(tt)
                causeway_list.append(bool(edge.get("is_causeway", False)))

        self.u_arr = np.array(u_list, dtype=np.int32)
        self.v_arr = np.array(v_list, dtype=np.int32)
        self.base_tt = np.array(base_tt_list, dtype=np.float64)
        self.is_causeway = np.array(causeway_list, dtype=bool)
        self.valid_edges = valid_edges

        self.node_coords = np.array([[n.get("lat", 0.0), n.get("lon", 0.0)] for n in self.nodes])
        self.node_tree = cKDTree(self.node_coords)
        
        # Cache fields for cell indices & baseline dijkstra solve
        self.edge_cell_indices = None
        self.node_cell_indices = None
        self._baseline_dist_u = None
        self._baseline_unique_indices = None
        self._baseline_inv_map = None

    def _initialize_spatial_mappings(self, df_cube: pd.DataFrame):
        cell_coords = df_cube[["lat", "lon"]].values
        cell_tree = cKDTree(cell_coords)
        _, self.node_cell_indices = cell_tree.query(self.node_coords)
        cell_map = {row["h3_r8"]: idx for idx, row in df_cube.iterrows()}

        edge_cell_idx_list = []
        for edge, u_idx in zip(self.valid_edges, self.u_arr):
            h3_id = edge.get("h3_r8")
            c_idx = cell_map.get(h3_id) if h3_id else self.node_cell_indices[u_idx]
            edge_cell_idx_list.append(c_idx)

        self.edge_cell_indices = np.array(edge_cell_idx_list, dtype=np.int32)

    def _build_adjacency_matrix(self, 
                                df_cube: pd.DataFrame, 
                                flood_prob: np.ndarray, 
                                theta_low: float = 0.30,
                                theta_high: float = 0.60,
                                theta_causeway: float = 0.35) -> csr_matrix:
        if self.edge_cell_indices is None:
            self._initialize_spatial_mappings(df_cube)

        edge_p = flood_prob[self.edge_cell_indices]
        
        # Vectorized 3-state passability classification
        is_imp = (edge_p >= theta_high) | (self.is_causeway & (edge_p > theta_causeway))
        is_deg = (~is_imp) & (edge_p >= theta_low)

        valid_mask = ~is_imp
        u_v = self.u_arr[valid_mask]
        v_v = self.v_arr[valid_mask]
        
        tt_v = np.where(is_deg[valid_mask], self.base_tt[valid_mask] * 2.5, self.base_tt[valid_mask])

        # Undirected edges (both directions) + self-loops
        rows = np.concatenate([u_v, v_v, np.arange(self.n_nodes)])
        cols = np.concatenate([v_v, u_v, np.arange(self.n_nodes)])
        data = np.concatenate([tt_v, tt_v, np.zeros(self.n_nodes)])

        return csr_matrix((data, (rows, cols)), shape=(self.n_nodes, self.n_nodes))

    def solve_accessibility_loss(self, 
                                df_cube: pd.DataFrame, 
                                health_facilities: List[Dict[str, Any]], 
                                flood_prob: np.ndarray,
                                theta_low: float = 0.30,
                                theta_high: float = 0.60,
                                theta_causeway: float = 0.35) -> Dict[str, Any]:
        """
        Computes baseline vs 3-state flooded Dijkstra shortest-path travel times 
        from nodes to health facilities.
        """
        if self.edge_cell_indices is None:
            self._initialize_spatial_mappings(df_cube)

        # Baseline Dijkstra cached compute
        if self._baseline_dist_u is None:
            cs_baseline = self._build_adjacency_matrix(df_cube, np.zeros_like(flood_prob), theta_low, theta_high, theta_causeway)
            fac_coords = np.array([[fac.get("lat", 0.0), fac.get("lon", 0.0)] for fac in health_facilities])
            _, fac_node_indices = self.node_tree.query(fac_coords)
            self._baseline_unique_indices, self._baseline_inv_map = np.unique(fac_node_indices, return_inverse=True)
            self._baseline_dist_u = dijkstra(cs_baseline, directed=False, indices=self._baseline_unique_indices, return_predecessors=False)

        fac_node_indices = self._baseline_unique_indices[self._baseline_inv_map]
        dist_baseline = self._baseline_dist_u[self._baseline_inv_map]

        # Flooded Dijkstra solve with return_predecessors=False for 3x speedup
        cs_flooded = self._build_adjacency_matrix(df_cube, flood_prob, theta_low, theta_high, theta_causeway)
        dist_flooded_u = dijkstra(cs_flooded, directed=False, indices=self._baseline_unique_indices, return_predecessors=False)
        dist_flooded = dist_flooded_u[self._baseline_inv_map]

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
            reachable_nodes = np.sum(dist_flooded[idx] < np.inf)
            if reachable_nodes <= 1:
                isolated_hospitals.append(fac.get("name", f"Facility {idx+1}"))
                
        # 3-State Edge Passability Breakdown
        edge_p = flood_prob[self.edge_cell_indices]
        is_imp = (edge_p >= theta_high) | (self.is_causeway & (edge_p > theta_causeway))
        is_deg = (~is_imp) & (edge_p >= theta_low)
        
        open_edges_cnt = int(np.sum((~is_imp) & (~is_deg)))
        degraded_edges_cnt = int(np.sum(is_deg))
        impassable_edges_cnt = int(np.sum(is_imp))

        broken_edges = []
        imp_indices = np.where(is_imp)[0]
        for idx in imp_indices:
            edge = self.valid_edges[idx]
            broken_edges.append({
                "edge_id": edge["edge_id"],
                "name": edge["name"],
                "highway": edge["highway"],
                "length_km": edge["length_km"],
                "is_causeway": edge.get("is_causeway", False),
                "flood_probability": round(float(edge_p[idx]), 3),
                "status": "IMPASSABLE"
            })
                
        return {
            "population_losing_30min_access": pop_loss_30min,
            "population_losing_60min_access": pop_loss_60min,
            "isolated_facilities_count": len(isolated_hospitals),
            "isolated_facility_names": isolated_hospitals,
            "total_edges": len(self.edges),
            "open_edges_count": open_edges_cnt,
            "degraded_edges_count": degraded_edges_cnt,
            "impassable_edges_count": impassable_edges_cnt,
            "broken_road_edges_count": impassable_edges_cnt,
            "broken_road_edges": broken_edges
        }

