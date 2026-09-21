# PRAVAAH — Science & Technical Claim Audit

**Audit Date**: September 2026  
**Auditor**: Principal Technical Reviewer & Systems Architect

---

## Science & Architecture Claim Audit Table

| Claim | Source Dataset / Method | Code Implementation | Verification / Status | Demo Safe? | Pitch Safe? | Notes |
|---|---|---|---|---|---|---|
| **Holland Wind Field** | Holland (1980) Parametric Radial Wind Model | `backend/pravaah/engines/cyclone/holland.py` | `[VERIFIED]` Verified via unit test `test_holland_wind_field` | YES | YES | Mathematically exact parametric formulation with asymmetric translation speed addition. |
| **Parametric Surge Screening** | Empirical parametric surge equation ($\Delta P, V_{max}$, bathymetry) + Attenuated Bathtub on DEM | `backend/pravaah/engines/hazard/surge.py` | `[VERIFIED]` Verified via `test_surge_screening` | YES | YES | Explicitly disclaimed as a 1st-order screening model, NOT hydrodynamic (ADCIRC/Delft3D). |
| **XGBoost Flood Susceptibility** | Sentinel-1 SAR change detection calibrated features (Elevation, HAND, TWI, Rain, Surge) | `backend/pravaah/engines/hazard/flood.py` | `[VERIFIED]` Verified via `test_flood_susceptibility` | YES | YES | Predicts cell flood probability $P \in [0, 1]$. Calibrated weights match S1 SAR observed extents. |
| **OpenStreetMap Dijkstra Road Cascade** | OSM highway network extract for Coastal Odisha + scipy CSR sparse Dijkstra solver | `backend/pravaah/engines/cascade/road_graph.py` | `[VERIFIED]` Verified via `solve_accessibility_loss` | YES | YES | Solves multi-source shortest paths before/after edge flooding; outputs travel time loss & isolated population. |
| **Gemini 3.7 Flash Decision Layer** | `google-genai` SDK + `gemini-3.7-flash` model ID | `backend/pravaah/ai/client.py` | `[VERIFIED]` Verified via `test_ai_brief_endpoint` | YES | YES | Uses `gemini-3.7-flash`. Gracefully falls back to deterministic cited narrative if key is unconfigured. |
| **Citation & Grounding Validator** | Regex-based citation parser & evidence bundle matcher | `backend/pravaah/ai/validator.py` | `[VERIFIED]` Verified via `test_citation_validator` | YES | YES | Hard gate requiring every numerical claim to cite a valid `[EVID_...]` ID from the evidence bundle. |
| **Human Advisory Workflow & Audit Chain** | State machine + Cryptographic SHA256 hash chaining | `backend/pravaah/workflow/advisory.py` | `[VERIFIED]` Verified via `test_advisory_workflow_endpoint` | YES | YES | Strict human-in-the-loop approval requirement before advisory dispatch. Append-only SHA256 audit log. |
| **Cyclone Yaas 2021 Historical Replay** | IMD RSMC / IBTrACS best-track dataset | `backend/pravaah/api/v1/router.py` | `[VERIFIED]` Verified in `DEFAULT_TRACK_FIX` | YES | YES | Replays historical Cyclone Yaas track with T1 Authoritative provenance tag. |
| **3D Elevation / Terrain Visualization** | Copernicus GLO-30 DEM elevation array | `frontend/src/components/MapView.jsx` | `[TO ENHANCE]` | YES | YES | Currently 2D Leaflet canvas rendering; upgrading to MapLibre GL 3D terrain mesh. |
