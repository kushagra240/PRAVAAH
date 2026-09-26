import os
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from backend.pravaah.engines.scenario.simulator import ScenarioSimulator
from backend.pravaah.ai.evidence import EvidenceBuilder
from backend.pravaah.ai.client import GeminiDecisionEngine
from backend.pravaah.workflow.advisory import AdvisoryWorkflowManager, AdvisoryStatus

router = APIRouter()

# Global singleton instances initialized lazily or on startup
REGION_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "regions", "odisha_coastal")
simulator = ScenarioSimulator(os.path.abspath(REGION_DIR))
evidence_builder = EvidenceBuilder()
ai_engine = GeminiDecisionEngine()
advisory_manager = AdvisoryWorkflowManager()

# Default baseline track fix (Cyclone Yaas 2021 landfall forecast near Balasore/Bhadrak)
DEFAULT_TRACK_FIX = {
    "track_id": "CYCLONE_YAAS_2021",
    "name": "Cyclone Yaas (2021 Landfall Replay)",
    "timestamp": "2021-05-26T09:00:00Z",
    "lat": 20.8,
    "lon": 86.9,
    "p_c": 968.0,
    "v_max": 140.0,
    "r_max": 35.0,
    "speed_kph": 18.0,
    "bearing_deg": 320.0,
    "source_tier": "T1_AUTHORITATIVE_REPLAY",
    "is_replay": True
}

class SimulationRequest(BaseModel):
    track_fix: Optional[Dict[str, Any]] = None
    perturbations: Optional[Dict[str, Any]] = None

class AdvisoryCreateRequest(BaseModel):
    title: str
    content: str
    evidence_ids: List[str]
    author: Optional[str] = "Gemini 3.7 Flash"

class AdvisoryStatusRequest(BaseModel):
    status: str
    actor: str
    notes: Optional[str] = ""
    updated_content: Optional[str] = None

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PRAVAAH API",
        "version": "1.0.0",
        "region_loaded": "odisha_coastal",
        "cell_count": len(simulator.cube_df),
        "cube_last_modified": getattr(simulator, "cube_mtime_iso", None)
    }

@router.get("/cyclone/tracks")
def list_cyclone_tracks():
    return [
        DEFAULT_TRACK_FIX,
        {
            "track_id": "CYCLONE_FANI_2019",
            "name": "Cyclone Fani (2019 Landfall Replay)",
            "timestamp": "2019-05-03T08:00:00Z",
            "lat": 19.8,
            "lon": 85.8,
            "p_c": 932.0,
            "v_max": 215.0,
            "r_max": 28.0,
            "speed_kph": 22.0,
            "bearing_deg": 340.0,
            "source_tier": "T1_AUTHORITATIVE_REPLAY",
            "is_replay": True
        }
    ]

IMPACT_SUMMARY_CACHE: Dict[str, Any] = {}

@router.get("/region/summary")
def get_region_summary():
    return {
        "region_id": "odisha_coastal",
        "name": "Coastal Odisha",
        "districts": ["Puri", "Jagatsinghpur", "Kendrapara", "Bhadrak"],
        "total_cells": len(simulator.cube_df),
        "total_population": int(simulator.cube_df["population"].sum()),
        "health_facilities": simulator.facilities,
        "cyclone_shelters": simulator.shelters,
        "road_network": None  # Decoupled to /region/roads for lightweight response
    }

@router.get("/region/roads")
def get_region_roads(
    min_lat: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    min_lon: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    simplified: bool = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(10000, ge=1, le=20000)
):
    net = simulator.road_engine.network
    nodes = net.get("nodes", [])
    edges = net.get("edges", [])

    # 1. Bounding box filtering if view bounds provided
    if all(v is not None for v in [min_lat, max_lat, min_lon, max_lon]):
        node_map = {n["node_id"]: n for n in nodes if min_lat <= n.get("lat", 0) <= max_lat and min_lon <= n.get("lon", 0) <= max_lon}
        valid_node_ids = set(node_map.keys())
        edges = [e for e in edges if e["u"] in valid_node_ids or e["v"] in valid_node_ids]
        nodes = list(node_map.values())
    elif simplified:
        # Simplified major arterial road network topology for overview zoom
        major_types = {"trunk", "primary", "secondary", "tertiary", "motorway"}
        edges = [e for e in edges if e.get("highway") in major_types or e.get("is_causeway") or e.get("is_bridge")]
        node_ids = set([e["u"] for e in edges] + [e["v"] for e in edges])
        nodes = [n for n in nodes if n["node_id"] in node_ids]

    # 2. Pagination
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paged_edges = edges[start_idx:end_idx]
    paged_node_ids = set([e["u"] for e in paged_edges] + [e["v"] for e in paged_edges])
    paged_nodes = [n for n in nodes if n["node_id"] in paged_node_ids]

    return {
        "nodes": paged_nodes,
        "edges": paged_edges,
        "total_edges": len(edges),
        "page": page,
        "limit": limit
    }

@router.get("/region/roads/{edge_id}")
def get_road_edge_detail(edge_id: str):
    net = simulator.road_engine.network
    edge = next((e for e in net.get("edges", []) if e.get("edge_id") == edge_id), None)
    if not edge:
        raise HTTPException(status_code=404, detail="Road edge not found")
    u_node = next((n for n in net.get("nodes", []) if n.get("node_id") == edge.get("u")), None)
    v_node = next((n for n in net.get("nodes", []) if n.get("node_id") == edge.get("v")), None)
    return {
        "edge": edge,
        "u_node": u_node,
        "v_node": v_node
    }

@router.get("/region/grid")
def get_region_grid():
    """Returns grid cell features for map visualization."""
    return simulator.cube_df.to_dict(orient="records")

@router.get("/runs/{run_id}/impact-summary")
def get_run_impact_summary(
    run_id: str,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    v_max: Optional[float] = Query(None)
):
    cache_key = f"{run_id}_{lat}_{lon}_{v_max}"
    if cache_key in IMPACT_SUMMARY_CACHE:
        cached_res = IMPACT_SUMMARY_CACHE[cache_key].copy()
        cached_res["cached"] = True
        return cached_res

    track = DEFAULT_TRACK_FIX.copy()
    if run_id == "fani":
        track["name"] = "Cyclone Fani (2019 Landfall Replay)"
        track["lat"] = 19.8
        track["lon"] = 85.8
        track["v_max"] = 215.0
        track["p_c"] = 932.0
    
    if isinstance(lat, (int, float)):
        track["lat"] = lat
    if isinstance(lon, (int, float)):
        track["lon"] = lon
    if isinstance(v_max, (int, float)):
        track["v_max"] = v_max
        
    sim_res = simulator.run_simulation(track, {})
    cascade = sim_res.get("cascade", {})
    broken_edges = cascade.get("broken_road_edges", [])
    broken_km = round(sum(e.get("length_km", 0.0) for e in broken_edges), 1)
    
    exposure = sim_res.get("exposure", {})
    
    res = {
        "run_id": run_id,
        "track_name": track.get("name", "Cyclone Forecast"),
        "track_fix": track,
        "isolated_facilities_count": cascade.get("isolated_facilities_count", 0),
        "total_facilities": len(simulator.facilities),
        "total_population": exposure.get("total_population", 0),
        "pop_exposed_vsevere_wind": exposure.get("pop_exposed_vsevere_wind", 0),
        "pop_exposed_severe_flood": exposure.get("pop_exposed_severe_flood", 0),
        "pop_exposed_elevated_flood": exposure.get("pop_exposed_elevated_flood", 0),
        "population_losing_30min_access": cascade.get("population_losing_30min_access", 0),
        "population_losing_60min_access": cascade.get("population_losing_60min_access", 0),
        "open_edges_count": cascade.get("open_edges_count", 0),
        "degraded_edges_count": cascade.get("degraded_edges_count", 0),
        "impassable_edges_count": cascade.get("impassable_edges_count", 0),
        "broken_road_edges_count": cascade.get("broken_road_edges_count", 0),
        "broken_road_km": broken_km,
        "max_wind_kph": sim_res.get("max_wind_kph", 0.0),
        "peak_surge_m": sim_res.get("peak_surge_m", 0.0),
        "provenance_class": "OBSERVED",
        "provenance_breakdown": {
            "cyclone_track": "FORECAST",
            "wind_model": "DERIVED",
            "flood_model": "ASSUMPTION",
            "road_network": "OBSERVED",
            "health_facilities": "OBSERVED",
            "population_data": "OBSERVED",
            "spatial_grid": "FIXTURE"
        }
    }
    IMPACT_SUMMARY_CACHE[cache_key] = res
    return res

@router.post("/simulation/run")
def run_simulation(req: SimulationRequest):
    track = req.track_fix if req.track_fix else DEFAULT_TRACK_FIX
    perts = req.perturbations if req.perturbations else {}
    
    sim_res = simulator.run_simulation(track, perts)
    sim_res["provenance_class"] = "SIMULATED" if len(perts) > 0 else "OBSERVED"
    sim_res["provenance_breakdown"] = {
        "cyclone_track": "SIMULATED" if len(perts) > 0 else "FORECAST",
        "wind_model": "DERIVED",
        "flood_model": "ASSUMPTION",
        "road_network": "OBSERVED",
        "health_facilities": "OBSERVED",
        "spatial_grid": "FIXTURE"
    }
    return sim_res

@router.post("/ai/brief")
def generate_decision_brief(req: SimulationRequest):
    track = req.track_fix if req.track_fix else DEFAULT_TRACK_FIX
    perts = req.perturbations if req.perturbations else {}
    
    sim_res = simulator.run_simulation(track, perts)
    evidence = evidence_builder.build_evidence_bundle(sim_res, cyclone_name=track.get("name", "Cyclone Forecast"))
    brief = ai_engine.generate_decision_brief(evidence)
    
    return {
        "evidence_bundle": evidence,
        "brief": brief,
        "provenance_class": brief.get("provenance", "DERIVED"),
        "provenance_breakdown": {
            "evidence_bundle": "DERIVED",
            "narrative": brief.get("provenance", "DERIVED"),
            "citation_validation": "OBSERVED" if brief.get("citation_validated") else "ASSUMPTION"
        }
    }

@router.post("/advisories/draft")
def create_draft_advisory(req: AdvisoryCreateRequest):
    adv = advisory_manager.create_draft(req.title, req.content, req.evidence_ids, req.author)
    return adv

@router.get("/advisories")
def list_advisories():
    return advisory_manager.list_advisories()

@router.post("/advisories/{adv_id}/status")
def update_advisory_status(adv_id: str, req: AdvisoryStatusRequest):
    try:
        status_enum = AdvisoryStatus(req.status.upper())
        updated = advisory_manager.update_status(adv_id, status_enum, req.actor, req.notes or "", req.updated_content)
        return updated
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status {req.status}")
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/advisories/audit")
def get_advisory_audit_trail():
    return advisory_manager.get_audit_trail()

@router.get("/advisories/{adv_id}/cap_xml")
def export_cap_xml(adv_id: str):
    adv = advisory_manager.get_advisory(adv_id)
    if not adv:
        raise HTTPException(status_code=404, detail="Advisory not found")
    from backend.pravaah.workflow.export import generate_cap_xml
    xml_content = generate_cap_xml(adv)
    from fastapi.responses import Response
    return Response(content=xml_content, media_type="application/xml")
