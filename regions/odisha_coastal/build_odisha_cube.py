import os
import json
import pandas as pd
import numpy as np
from geospatial.grid.h3_grid import generate_hexagons_for_bbox, cell_to_latlon

# Bounding box for Coastal Odisha (Puri, Jagatsinghpur, Kendrapara, Bhadrak)
BBOX = {
    "min_lat": 19.7,
    "max_lat": 21.0,
    "min_lon": 85.7,
    "max_lon": 87.0
}

DISTRICTS = ["Puri", "Jagatsinghpur", "Kendrapara", "Bhadrak"]
BLOCKS = {
    "Puri": ["Puri Sadar", "Kakaratpur", "Astaranga", "Gop", "Brahmagiri"],
    "Jagatsinghpur": ["Erasama", "Kujang", "Paradip", "Balikuda", "Jagatsinghpur Sadar"],
    "Kendrapara": ["Rajnagar", "Rajkanika", "Mahakalapada", "Pattamundai", "Kendrapara Sadar"],
    "Bhadrak": ["Dhamra", "Chandbali", "Basudevpur", "Bhadrak Sadar"]
}

def generate_region_yaml(output_dir: str):
    config = {
        "region_id": "odisha_coastal",
        "name": "Coastal Odisha (Puri, Jagatsinghpur, Kendrapara, Bhadrak)",
        "state": "Odisha",
        "bounding_box": BBOX,
        "districts": DISTRICTS,
        "h3_resolution": 8,
        "crs": "EPSG:4326",
        "calibration_cyclones": ["Phailin (2013)", "Fani (2019)", "Amphan (2020)", "Yaas (2021)"]
    }
    with open(os.path.join(output_dir, "region.yaml"), "w") as f:
        json.dump(config, f, indent=2)

def generate_feature_cube(output_dir: str):
    # Sample subset of cells for fast, responsive demo cube (~2500 H3 cells)
    print("Generating H3 cells...")
    # Step sampling across lat/lon bounding box for crisp coverage
    lats = np.linspace(BBOX["min_lat"], BBOX["max_lat"], 50)
    lons = np.linspace(BBOX["min_lon"], BBOX["max_lon"], 50)
    
    cell_set = set()
    for lat in lats:
        for lon in lons:
            cells = generate_hexagons_for_bbox(lat - 0.02, lon - 0.02, lat + 0.02, lon + 0.02, resolution=8)
            cell_set.update(cells)
            
    cell_list = list(cell_set)[:3000]
    print(f"Total H3 cells generated: {len(cell_list)}")
    
    data = []
    np.random.seed(42)
    
    for h3_id in cell_list:
        lat, lon = cell_to_latlon(h3_id)
        
        # Spatial assignment to district & block based on lat/lon
        if lat < 20.1:
            district = "Puri"
        elif lat < 20.4:
            district = "Jagatsinghpur"
        elif lat < 20.7:
            district = "Kendrapara"
        else:
            district = "Bhadrak"
            
        blocks = BLOCKS[district]
        block = np.random.choice(blocks)
        
        # Physical features simulation based on realistic coastal geography
        dist_coast_m = (lon - 85.5) * 80000 + np.random.uniform(-2000, 2000) # distance from coast
        dist_coast_m = max(100.0, float(dist_coast_m))
        
        elev_mean = max(0.5, float((dist_coast_m / 1000.0) * 0.8 + np.random.normal(2.5, 1.2)))
        hand_m = max(0.1, float(elev_mean * 0.6 + np.random.uniform(-0.5, 0.5))) # height above nearest drainage
        twi = float(np.random.uniform(6.0, 14.0)) # topographic wetness index
        slope_mean = float(np.random.uniform(0.1, 2.5))
        
        water_occurrence = max(0.0, min(100.0, float(np.random.choice([0, 5, 15, 80], p=[0.7, 0.15, 0.1, 0.05]))))
        builtup_frac = max(0.01, min(0.9, float(np.random.uniform(0.02, 0.35))))
        pop_density = float(np.random.uniform(200, 1500)) if builtup_frac > 0.1 else float(np.random.uniform(30, 250))
        population = int(pop_density * 0.46) # ~0.46 km2 area
        
        data.append({
            "h3_r8": h3_id,
            "lat": lat,
            "lon": lon,
            "admin_state": "Odisha",
            "admin_district": district,
            "admin_block": block,
            "elev_mean": elev_mean,
            "elev_min": max(0.0, elev_mean - 1.0),
            "slope_mean": slope_mean,
            "hand_m": hand_m,
            "twi": twi,
            "dist_coast_m": dist_coast_m,
            "dist_drainage_m": float(np.random.uniform(50, 1500)),
            "dist_road_m": float(np.random.uniform(20, 800)),
            "coastal_bathy_slope": 0.002,
            "landcover_mode": 10 if water_occurrence > 50 else (50 if builtup_frac > 0.2 else 30),
            "roughness_manning": 0.045,
            "water_occurrence_pct": water_occurrence,
            "builtup_fraction": builtup_frac,
            "population": population,
            "pop_density": pop_density,
            "hist_flood_freq": int(np.random.choice([0, 1, 2, 3], p=[0.6, 0.25, 0.1, 0.05]))
        })
        
    df = pd.DataFrame(data)
    df.to_parquet(os.path.join(output_dir, "feature_cube.parquet"))
    print(f"Exported feature_cube.parquet with {len(df)} rows.")
    return df

def generate_assets(output_dir: str, df_cube: pd.DataFrame):
    # Select random cells for health facilities and cyclone shelters
    sample_cells = df_cube.sample(n=40, random_state=42).to_dict('records')
    
    hospitals = []
    shelters = []
    
    fac_types = [
        ("District Headquarter Hospital (DHH)", 250, "present"),
        ("Community Health Centre (CHC)", 30, "present"),
        ("Primary Health Centre (PHC)", 6, "absent"),
        ("Sub-Divisional Hospital (SDH)", 100, "present")
    ]
    
    for idx, cell in enumerate(sample_cells[:20]):
        f_type, beds, gen = fac_types[idx % len(fac_types)]
        hospitals.append({
            "asset_id": f"HOSP_{idx+1:03d}",
            "name": f"{cell['admin_block']} {f_type}",
            "type": f_type,
            "district": cell['admin_district'],
            "block": cell['admin_block'],
            "lat": cell['lat'],
            "lon": cell['lon'],
            "h3_r8": cell['h3_r8'],
            "bed_capacity": beds,
            "backup_generator": gen,
            "elevation_m": cell['elev_mean'],
            "criticality_weight": 1.0 if beds > 50 else 0.6
        })
        
    for idx, cell in enumerate(sample_cells[20:]):
        shelters.append({
            "asset_id": f"SHELTER_{idx+1:03d}",
            "name": f"{cell['admin_block']} Multi-Purpose Cyclone Shelter #{idx+1}",
            "type": "MPCS",
            "district": cell['admin_district'],
            "block": cell['admin_block'],
            "lat": cell['lat'],
            "lon": cell['lon'],
            "h3_r8": cell['h3_r8'],
            "capacity": int(np.random.choice([1000, 1500, 2000, 3000])),
            "elevation_m": cell['elev_mean'] + 2.0, # Elevated structure
            "status": "operational"
        })
        
    with open(os.path.join(output_dir, "health_facilities.json"), "w") as f:
        json.dump(hospitals, f, indent=2)
        
    with open(os.path.join(output_dir, "cyclone_shelters.json"), "w") as f:
        json.dump(shelters, f, indent=2)
        
    print(f"Generated {len(hospitals)} health facilities and {len(shelters)} shelters.")

def generate_road_network(output_dir: str, df_cube: pd.DataFrame):
    # Generate arterial road network connecting admin blocks and hospitals
    nodes = []
    edges = []
    
    unique_blocks = df_cube.groupby('admin_block')[['lat', 'lon']].mean().reset_index()
    
    node_map = {}
    for idx, row in unique_blocks.iterrows():
        node_id = f"NODE_{idx+1:03d}"
        c_block = df_cube[df_cube['admin_block'] == row['admin_block']].iloc[0]
        nodes.append({
            "node_id": node_id,
            "block": row['admin_block'],
            "lat": row['lat'],
            "lon": row['lon'],
            "h3_r8": c_block['h3_r8']
        })
        node_map[row['admin_block']] = node_id
        
    # Connect adjacent blocks into road edges (arterial highways & coastal causeways)
    edge_idx = 1
    block_names = list(node_map.keys())
    for i in range(len(block_names)):
        for j in range(i+1, min(i+4, len(block_names))):
            b1 = block_names[i]
            b2 = block_names[j]
            n1 = node_map[b1]
            n2 = node_map[b2]
            
            # Find representative cell
            c1 = df_cube[df_cube['admin_block'] == b1].iloc[0]
            
            is_causeway = True if c1['dist_coast_m'] < 3000 and edge_idx % 2 == 0 else False
            is_bridge = True if c1['hand_m'] < 1.0 and edge_idx % 3 == 0 else False
            
            edges.append({
                "edge_id": f"EDGE_{edge_idx:03d}",
                "u": n1,
                "v": n2,
                "highway": "primary" if not is_causeway else "secondary",
                "name": f"SH-60 ({b1} - {b2} Link)" if not is_causeway else f"Coastal Causeway ({b1} - {b2})",
                "length_km": float(np.random.uniform(8.0, 25.0)),
                "speed_kph": 60.0 if not is_causeway else 40.0,
                "is_causeway": is_causeway,
                "is_bridge": is_bridge,
                "h3_r8": c1['h3_r8'],
                "elev_min": c1['elev_min']
            })
            edge_idx += 1
            
    network = {"nodes": nodes, "edges": edges}
    with open(os.path.join(output_dir, "road_network.json"), "w") as f:
        json.dump(network, f, indent=2)
        
    print(f"Generated road network with {len(nodes)} nodes and {len(edges)} edges.")

if __name__ == "__main__":
    out_dir = os.path.dirname(__file__)
    generate_region_yaml(out_dir)
    cube_df = generate_feature_cube(out_dir)
    generate_assets(out_dir, cube_df)
    generate_road_network(out_dir, cube_df)
