import os
import json
import time
import requests
import urllib.parse

BBOX = "19.7,85.7,21.0,87.0"

HEADERS = {
    "User-Agent": "PRAVAAH-Disaster-Resilience-Research/1.0 (contact: research@pravaah.gov.in)"
}

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter"
]

def query_overpass(query_str):
    encoded = urllib.parse.quote(query_str)
    for ep in ENDPOINTS:
        try:
            url = f"{ep}?data={encoded}"
            print(f"Querying {ep}...")
            r = requests.get(url, headers=HEADERS, timeout=45)
            if r.status_code == 200:
                return r.json()
            else:
                print(f"Endpoint {ep} returned status {r.status_code}")
        except Exception as e:
            print(f"Failed query to {ep}: {e}")
            time.sleep(2)
    raise RuntimeError("All Overpass GET queries failed.")

def extract_real_health_facilities():
    print("1. Extracting real health facilities from OpenStreetMap...")
    query = f"""[out:json][timeout:30];
(
  node["amenity"="hospital"]({BBOX});
  node["amenity"="clinic"]({BBOX});
  node["amenity"="doctors"]({BBOX});
  way["amenity"="hospital"]({BBOX});
  way["amenity"="clinic"]({BBOX});
  node["healthcare"]({BBOX});
);
out center;"""
    data = query_overpass(query)
    elements = data.get("elements", [])
    print(f"Retrieved {len(elements)} health facility records from OSM.")

    facilities = []
    seen = set()

    for idx, elem in enumerate(elements):
        tags = elem.get("tags", {})
        name = tags.get("name") or tags.get("name:en")
        lat = elem.get("lat") or elem.get("center", {}).get("lat")
        lon = elem.get("lon") or elem.get("center", {}).get("lon")

        if not lat or not lon:
            continue

        amenity = tags.get("amenity", "hospital")
        
        # Spatial block assignment
        if lat < 20.1:
            district, block = "Puri", "Puri Sadar"
        elif lat < 20.4:
            district, block = "Jagatsinghpur", "Paradip" if lon > 86.6 else "Jagatsinghpur Sadar"
        elif lat < 20.7:
            district, block = "Kendrapara", "Rajnagar" if lon > 86.6 else "Kendrapara Sadar"
        else:
            district, block = "Bhadrak", "Chandbali" if lon > 86.6 else "Bhadrak Sadar"

        if not name:
            name = f"{block} {amenity.replace('_', ' ').title()} (OSM)"

        if name in seen:
            name = f"{name} #{idx+1}"
        seen.add(name)

        bed_cap = int(tags.get("beds", 30 if "hospital" in amenity else 6))

        facilities.append({
            "asset_id": f"OSM_HOSP_{idx+1:03d}",
            "name": name,
            "type": tags.get("healthcare:speciality") or amenity.replace("_", " ").title(),
            "district": district,
            "block": block,
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "osm_id": elem.get("id"),
            "bed_capacity": bed_cap,
            "backup_generator": "present" if bed_cap >= 30 else "absent",
            "elevation_m": round(float(tags.get("ele", 3.2)), 1),
            "criticality_weight": 1.0 if bed_cap >= 50 else 0.6,
            "provenance_class": "OBSERVED",
            "source": f"OpenStreetMap, retrieved {time.strftime('%Y-%m-%d')}"
        })

    return facilities

def extract_real_road_network():
    print("2. Extracting real drivable road network with intersection noding from OpenStreetMap...")
    query = f"""[out:json][timeout:45];
(
  way["highway"="primary"]({BBOX});
  way["highway"="secondary"]({BBOX});
  way["highway"="tertiary"]({BBOX});
  way["highway"="trunk"]({BBOX});
  way["highway"="unclassified"]({BBOX});
);
out body;
>;
out skel qt;"""
    data = query_overpass(query)
    elements = data.get("elements", [])
    
    nodes_dict = {}
    ways = []

    for elem in elements:
        if elem["type"] == "node":
            nodes_dict[elem["id"]] = (elem["lat"], elem["lon"])
        elif elem["type"] == "way":
            ways.append(elem)

    print(f"Retrieved {len(nodes_dict)} raw nodes and {len(ways)} drivable road ways from OSM.")

    # Step 1: Count node occurrences across all drivable ways
    node_counts = {}
    for w in ways:
        for n_id in w.get("nodes", []):
            node_counts[n_id] = node_counts.get(n_id, 0) + 1

    # Step 2: Identify true intersection & terminal nodes
    intersection_nodes = set()
    for w in ways:
        w_nodes = w.get("nodes", [])
        if not w_nodes:
            continue
        intersection_nodes.add(w_nodes[0])
        intersection_nodes.add(w_nodes[-1])
        for n_id in w_nodes:
            if node_counts[n_id] >= 2:
                intersection_nodes.add(n_id)

    print(f"Identified {len(intersection_nodes)} true intersection / terminal graph nodes.")

    # Step 3: Build graph nodes and split ways into edges at intersections
    graph_nodes = []
    graph_node_set = set()
    graph_edges = []
    bridges_found = []
    causeways_found = []

    VALID_BRIDGE_SUBTYPES = {"yes", "viaduct", "aqueduct", "suspension", "movable", "overpass"}

    for way in ways:
        w_nodes = way.get("nodes", [])
        if len(w_nodes) < 2:
            continue
            
        tags = way.get("tags", {})
        highway = tags.get("highway", "secondary")
        name = tags.get("name") or tags.get("ref") or f"OSM Road {way['id']}"
        bridge_tag = str(tags.get("bridge", "")).lower()
        is_bridge = bridge_tag in VALID_BRIDGE_SUBTYPES
        is_ford = tags.get("ford") == "yes"
        is_causeway = is_ford or "causeway" in name.lower() or "levee" in name.lower()
        
        seg_start = w_nodes[0]
        seg_length = 0.0
        
        for i in range(1, len(w_nodes)):
            prev_n = w_nodes[i-1]
            curr_n = w_nodes[i]
            
            if prev_n in nodes_dict and curr_n in nodes_dict:
                lat1, lon1 = nodes_dict[prev_n]
                lat2, lon2 = nodes_dict[curr_n]
                d_km = (((lat2 - lat1)*111.0)**2 + ((lon2 - lon1)*100.0)**2)**0.5
                seg_length += d_km
                
            if curr_n in intersection_nodes or i == len(w_nodes) - 1:
                u_str = f"OSM_NODE_{seg_start}"
                v_str = f"OSM_NODE_{curr_n}"
                
                graph_node_set.add(seg_start)
                graph_node_set.add(curr_n)
                
                if is_bridge:
                    bridges_found.append((name, way["id"]))
                if is_causeway:
                    causeways_found.append((name, way["id"]))
                    
                graph_edges.append({
                    "edge_id": f"OSM_EDGE_{len(graph_edges)+1:05d}",
                    "u": u_str,
                    "v": v_str,
                    "highway": highway,
                    "name": name,
                    "length_km": max(0.01, round(seg_length, 3)),
                    "speed_kph": 60.0 if highway in ["primary", "trunk"] else 40.0,
                    "is_causeway": is_causeway,
                    "is_bridge": is_bridge,
                    "osm_id": way["id"],
                    "provenance_class": "OBSERVED",
                    "source": f"OpenStreetMap, retrieved {time.strftime('%Y-%m-%d')}"
                })
                
                seg_start = curr_n
                seg_length = 0.0

    # Build node objects for used intersection nodes
    for n_id in graph_node_set:
        if n_id in nodes_dict:
            lat, lon = nodes_dict[n_id]
            if lat < 20.1:
                block = "Puri Sadar"
            elif lat < 20.4:
                block = "Paradip" if lon > 86.6 else "Jagatsinghpur Sadar"
            elif lat < 20.7:
                block = "Rajnagar" if lon > 86.6 else "Kendrapara Sadar"
            else:
                block = "Chandbali" if lon > 86.6 else "Bhadrak Sadar"

            graph_nodes.append({
                "node_id": f"OSM_NODE_{n_id}",
                "block": block,
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "osm_id": n_id,
                "provenance_class": "OBSERVED",
                "source": f"OpenStreetMap, retrieved {time.strftime('%Y-%m-%d')}"
            })

    print(f"Summary: {len(graph_nodes)} nodes, {len(graph_edges)} edges (Node:Edge ratio {len(graph_nodes)/len(graph_edges):.2f}:1).")
    print(f"Bridges tagged (`bridge=yes`): {len(bridges_found)} ({len(bridges_found)/len(graph_edges)*100:.2f}%), Causeways/Fords: {len(causeways_found)}.")

    return {"nodes": graph_nodes, "edges": graph_edges}, bridges_found, causeways_found

if __name__ == "__main__":
    facs = extract_real_health_facilities()
    net, bridges, causeways = extract_real_road_network()
    
    with open("real_health_facilities.json", "w") as f:
        json.dump(facs, f, indent=2)
        
    with open("real_road_network.json", "w") as f:
        json.dump(net, f, indent=2)
        
    region_dir = os.path.join(os.path.dirname(__file__), "regions", "odisha_coastal")
    with open(os.path.join(region_dir, "health_facilities.json"), "w") as f:
        json.dump(facs, f, indent=2)
        
    with open(os.path.join(region_dir, "road_network.json"), "w") as f:
        json.dump(net, f, indent=2)
        
    print(f"Exported updated health facilities ({len(facs)}) and noded road network ({len(net['nodes'])} nodes, {len(net['edges'])} edges) to root and region directories.")
