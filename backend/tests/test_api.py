import pytest
from fastapi.testclient import TestClient
from backend.pravaah.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "PRAVAAH API"
    assert data["cell_count"] > 0

def test_tracks_endpoint():
    response = client.get("/api/v1/cyclone/tracks")
    assert response.status_code == 200
    tracks = response.json()
    assert len(tracks) >= 2
    assert tracks[0]["track_id"] == "CYCLONE_YAAS_2021"

def test_region_summary_endpoint():
    response = client.get("/api/v1/region/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["region_id"] == "odisha_coastal"
    assert len(data["health_facilities"]) > 0
    assert len(data["cyclone_shelters"]) > 0

def test_simulation_run_endpoint():
    payload = {
        "track_fix": None,
        "perturbations": {
            "v_max_multiplier": 1.1,
            "rain_multiplier": 1.2
        }
    }
    response = client.post("/api/v1/simulation/run", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "exposure" in res
    assert "cascade" in res
    assert res["provenance"] == "SIMULATED"
    assert res["computation_time_ms"] < 5000.0 # Sub-5s performance assertion on test runner

def test_ai_brief_endpoint():
    response = client.post("/api/v1/ai/brief", json={})
    assert response.status_code == 200
    data = response.json()
    assert "evidence_bundle" in data
    assert "brief" in data
    assert data["brief"]["citation_validated"] is True

def test_advisory_workflow_endpoint():
    # 1. Create draft
    draft_res = client.post("/api/v1/advisories/draft", json={
        "title": "Test Evacuation Advisory",
        "content": "Evacuate low lying coastal blocks [EVID_PEAK_SURGE].",
        "evidence_ids": ["EVID_PEAK_SURGE"],
        "author": "Test Agent"
    })
    assert draft_res.status_code == 200
    draft = draft_res.json()
    adv_id = draft["advisory_id"]
    assert draft["status"] == "DRAFT"

    # 2. Update status to APPROVED
    appr_res = client.post(f"/api/v1/advisories/{adv_id}/status", json={
        "status": "APPROVED",
        "actor": "District Collector",
        "notes": "Approved for dispatch."
    })
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "APPROVED"

    # 3. Check audit trail
    audit_res = client.get("/api/v1/advisories/audit")
    assert audit_res.status_code == 200
    trail = audit_res.json()
    assert len(trail) >= 2
    assert "current_hash" in trail[-1]

def test_impact_summary_endpoint():
    response = client.get("/api/v1/runs/yaas/impact-summary")
    assert response.status_code == 200
    data = response.json()
    assert data["run_id"] == "yaas"
    assert "isolated_facilities_count" in data
    assert "population_losing_30min_access" in data
    assert isinstance(data["population_losing_30min_access"], int)
    assert data["total_facilities"] > 0
    assert data["provenance_class"] == "OBSERVED"
    assert data["provenance_breakdown"]["road_network"] == "OBSERVED"
    assert data["provenance_breakdown"]["health_facilities"] == "OBSERVED"
    assert data["provenance_breakdown"]["flood_model"] == "ASSUMPTION"

    # Test perturbation via query param changes output
    response_shifted = client.get("/api/v1/runs/yaas/impact-summary?v_max=180.0")
    assert response_shifted.status_code == 200
    data_shifted = response_shifted.json()
    assert data_shifted["max_wind_kph"] >= 180.0

