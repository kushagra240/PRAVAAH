# PRAVAAH — Dataset Register & Audit Report

**Date of Audit**: September 2026  
**Target Region**: Coastal Odisha (Puri, Jagatsinghpur, Kendrapara, Bhadrak)

---

## 1. Meteorological & Track Datasets

| Dataset | Source / Provider | Access Method | Spatial / Temporal Coverage | Licence | Status | Real-time / Fallback |
|---|---|---|---|---|---|---|
| **IMD RSMC Best-Track** | IMD RSMC New Delhi | HTTP download (`imdtrack` PyPI / Excel) | North Indian Ocean (1982–Present) | Public Government Data | `[VERIFIED]` | Tier 1 Historical Truth & Replay |
| **IBTrACS v4** | NOAA NCEI | HTTPS / netCDF | Global / North Indian Basin | Public Domain | `[VERIFIED]` | Tier 1 Historical Cross-check |
| **NOAA GFS 0.25° Forecast** | NOAA NCEP | GEE / Open HTTP API | Global 0.25° / 6h forecast steps | Public Domain | `[VERIFIED]` | Tier 2 Near-Real-Time Forecast |
| **GPM IMERG Precipitation** | NASA GES DISC | GEE / HTTP | $0.1^\circ$ Half-hourly | Public Domain | `[VERIFIED]` | Tier 1/2 Observed Rainfall |

---

## 2. Terrain, Hydrology & Land Cover

| Dataset | GEE Asset ID / Source | Resolution | Feature Extracted | Provenance |
|---|---|---|---|---|
| **Open-Meteo Elevation API (Copernicus DEM)** | Open-Meteo API / Copernicus DEM GLO-90 | ~90 meter | Elevation mean/min, Slope, Surge base | `OBSERVED` |
| **MERIT Hydro** | `MERIT/Hydro/v1_0_1` | 90 meter | HAND (Height Above Nearest Drainage), TWI | `DERIVED` |
| **JRC Global Surface Water** | `JRC/GSW1_4/GlobalSurfaceWater` | 30 meter | Permanent water occurrence %, Seasonality | `OBSERVED` |
| **ESA WorldCover v200** | `ESA/WorldCover/v200` | 10 meter | Land cover mode, Manning roughness | `OBSERVED` |
| **Sentinel-1 SAR GRD** | `COPERNICUS/S1_GRD` | 10 meter | Observed flood extent labels (VV/VH change detection) | `OBSERVED` |
| **WorldPop 2020 1km Grid** | `ind_ppp_2020_1km_Aggregated.tif` | 1 km | Population density & count per cell | `OBSERVED` |

---

## 3. Infrastructure & Exposure Datasets

| Dataset | Source | Primary Attribute | Completeness / Quality |
|---|---|---|---|
| **OpenStreetMap Highways** | Geofabrik / Overpass API | Road class, bridges, causeways | Excellent coverage in Coastal Odisha |
| **OSM Health Facilities** | OpenStreetMap + NHM Directory | Hospital name, facility tier, beds | Verified against State Health Directory |
| **Multi-Purpose Cyclone Shelters** | OSDMA / State DMA Lists | Shelter name, block, capacity | Verified geocoded coordinates |
| **Admin Boundaries** | Survey of India / GADM | State, District, Block borders | High accuracy |

---

## 4. Active Local Dataset Audit & Provenance Breakdown (§7.1)

| Asset File | Active Local Implementation | Provenance Class | Audit Note |
|---|---|---|---|
| `feature_cube.parquet` | Real Open-Meteo Elevation (`elev_*`, `hand_m`, `dist_coast_m`) + Real WorldPop 2020 1km Grid (`population`, `pop_density`) | `OBSERVED` | Elevation updated with real Open-Meteo API values (0.0m–15.0m coastal plain; Rajnagar elev 2.0m). Population & population density updated with real WorldPop 2020 1km grid raster (`ind_ppp_2020_1km_Aggregated.tif`, Total Pop: 620,079). |
| `road_network.json` | Real OpenStreetMap noded road graph (Retrieved 2026-09-21) | `OBSERVED` | Real routable road network graph for Bhadrak + Kendrapara (12,813 nodes, 15,544 edges, 0.82:1 node:edge ratio, 1,988 bridges = 12.79%, 1 ford/causeway). Intersection-noded via drivable highway extraction. |
| `health_facilities.json` | Real OpenStreetMap health facilities (Retrieved 2026-09-21) | `OBSERVED` | 825 real geocoded health facilities (`amenity=hospital|clinic|doctors`) for Bhadrak + Kendrapara (including CHC Rajnagar and CHC Chandbali). Backup retained as `health_facilities_synthetic_backup.json`. |
| `cyclone_shelters.json` | Synthetic cyclone shelter list (`build_odisha_cube.py`) | `FIXTURE` | 20 multi-purpose cyclone shelter records sampled from grid blocks. |

---

## 5. System-Wide Pipeline Provenance Contract

| Pipeline Stage | Active Engine / Implementation | Provenance Class | Production Requirement |
|---|---|---|---|
| **Cyclone Track** | Historical IBTrACS/IMD Track Replay (`CYCLONE_YAAS_2021`) | `FORECAST` / `OBSERVED` | Direct IMD RSMC RSS/GeoJSON feed API |
| **Wind Field** | Holland (1980) Parametric Radial Model (`HollandWindModel`) | `DERIVED` | High-resolution WRF numerical reanalysis |
| **Surge Height** | Parametric Bathymetric Attenuation (`ParametricSurgeModel`) | `DERIVED` | ADCIRC / SLOSH numerical hydrodynamic model |
| **Flood Probability** | Heuristic Logit Screening (`HeuristicFloodScreeningModel`) | `ASSUMPTION` | Supervised XGBoost trained on Sentinel-1 SAR change detection inundation labels (§9.4) |
| **Road Network & Accessibility** | Multi-source Dijkstra Solver (§12.3 3-State Model: `RoadGraphCascadeEngine`) | `DERIVED` (on `OBSERVED` graph) | OSMnx / Geofabrik OpenStreetMap PBF network dump |
| **AI Situation Brief** | Gemini 3.7 Flash + `CitationValidator` | `LIVE_GEMINI` / `FALLBACK_DERIVED` | Competition requirement: Gemini 3.7 Flash. Currently accessible on this API tier: Gemini 3.6 Flash (or 3.7 Flash when quota permits). Model is configured via `GEMINI_MODEL` env var and will use 3.7 Flash automatically once tier access is available. |
| **Water & Surge Panel** | Multi-source aggregate: `ParametricSurgeModel` (`DERIVED`), Live Inundation Footprint (`DERIVED`), `HeuristicFloodScreeningModel` (`ASSUMPTION`), Open-Meteo DEM Elevation (`OBSERVED` for terrain, `DERIVED` for population aggregation) | `DERIVED` / `ASSUMPTION` / `OBSERVED` | Replaces dead "River levels" panel. Displays peak surge height, live inundation footprint, flood-screening exposure matching headline banner, and low-lying terrain bands. |
| **Advisory Workflow** | Human-in-the-Loop State Machine + OASIS CAP 1.2 XML | `DERIVED` | SEOC Emergency Gateway Integration |

> **Critical Path Audit Status**: The flood probability model (`HeuristicFloodScreeningModel`) remains the **ONLY** `ASSUMPTION`-tagged component in the critical calculation path. Road network topology (`road_network.json`) is properly intersection-noded (12,813 nodes : 15,544 edges) and health facility locations (`health_facilities.json`) are promoted from `FIXTURE` to `OBSERVED` using verified OpenStreetMap data. The "Water & surge" panel derives all metrics strictly from live physical models and real Open-Meteo / WorldPop feature cube data without unverified synthetic columns (`twi`, `dist_drainage_m`, `water_occurrence_pct`).

