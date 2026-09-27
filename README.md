# PRAVAAH

> **Predictive Resilience & Vulnerability Analytics for Anticipatory Action Hub**  
> *From predicting where a cyclone goes, to predicting what it will disrupt.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![Node.js Version](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Hackathon](https://img.shields.io/badge/Track%205-Cyclone%20Resilience-orange.svg)]()

---

## Executive Summary

Official cyclone bulletins provide precise landfall locations and wind speeds, but fail to answer the most critical operational question for emergency authorities: **what infrastructure will fail, when will it fail, and who will lose access to critical services?**

**PRAVAAH** converts official cyclone forecast bulletins into real-time, physical-unit statements of infrastructure disruption. By combining deterministic physics (Holland wind profiles, storm surge inundation), graph-based road accessibility loss (OpenStreetMap Dijkstra cascade solvers), and **Google Gemini 3.7 Flash** AI decision support, PRAVAAH equips District Emergency Operation Centres (DEOC) with citation-grounded, human-approved action advisories hours before landfall.

---

## Links & Media

- 🌐 **Live Web Application**: [https://pravaah-wvd6.onrender.com](https://pravaah-wvd6.onrender.com)
  > *Note: free-tier hosting may take 30-60s to respond on first load after inactivity.*
- 📹 **Demo Video (3 Min)**: `[Link to YouTube / Video Walkthrough]` *(To be added upon recording)*
- 📑 **Detailed Engineering Specification**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Application Preview

```
+-------------------------------------------------------------------------------------------------------+
|  PRAVAAH -- EMERGENCY OPERATIONS COMMAND CENTRE (COASTAL ODISHA SECTOR)                                |
|-------------------------------------------------------------------------------------------------------|
| [ Map View: Leaflet 2D GIS ]          | [ AI Decision Brief -- Gemini 3.7 Flash ]                     |
|  - Active Storm Track: Cyclone Yaas   |  Headline: Impassable Access to PHC Sanatpur & UGPHC Tangi   |
|  - Inundation Cells: H3 Res 8 Hexagons|  Evidence Citations: [EVD-ISO-01], [EVD-FL-02]               |
|  - Severed Links: SH-9A Overtopped    |                                                               |
|  - High Risk: PHC Sanatpur Isolated   | [ Action Advisory Generator ]                                 |
|                                       |  Status: DRAFT -- Pending Human Approval                      |
+-------------------------------------------------------------------------------------------------------+
```
*(Placeholder image: Add `docs/screenshots/pravaah_command_center.png` to preview the live interactive GIS dashboard).*

---

## Key Features

- **Sub-3.5s Recomputation Latency**: Vectorised NumPy/SciPy/Pandas execution across 3,000+ Uber H3 spatial resolution 8 hexagonal cells for real-time scenario slider perturbation.
- **Dijkstra Road Network Cascade Engine**: Simulates OpenStreetMap road edge flood overtopping to compute exact shortest-path travel time degradation and facility isolation.
- **Evidence-Grounded AI Briefs**: Integrates **Google Gemini 3.7 Flash** to synthesize complex multi-engine telemetry into structured operational briefs backed by machine-verified `evidence_id` tags.
- **Human-in-the-Loop Authority Workflow**: Mandatory review step for all AI-generated advisories with cryptographic SHA-256 audit log tracking to ensure strict operational accountability.
- **Multi-Hazard Physical Modeling**: Includes Holland (1980) radial wind fields, parametric storm surge height equations, and elevation-aware inundation screening.

---

## Architecture Overview

```
                          [ OFFICIAL CYCLONE FORECAST BULLETIN ]
                                             │
                                             ▼
                 ┌──────────────────────────────────────────────────────┐
                 │       PRAVAAH PHYSICAL CALCULATION ENGINES           │
                 ├──────────────────────────────────────────────────────┤
                 │  - Holland Wind Profile Model (1980)                 │
                 │  - Parametric Surge & Attenuated Inundation          │
                 │  - OpenStreetMap Dijkstra Road Graph Cascade         │
                 └──────────────────────────┬───────────────────────────┘
                                            │
                                  Produces EvidenceBundle
                                            │
                                            ▼
                 ┌──────────────────────────────────────────────────────┐
                 │             GEMINI 3.7 FLASH DECISION LAYER          │
                 ├──────────────────────────────────────────────────────┤
                 │  - Reasons over numerical evidence bundle           │
                 │  - Generates structured briefs & evidence-cited tags │
                 └──────────────────────────┬───────────────────────────┘
                                            │
                                    Draft Action Advisory
                                            │
                                            ▼
                 ┌──────────────────────────────────────────────────────┐
                 │          HUMAN AUTHORITY APPROVAL & AUDIT LOG        │
                 ├──────────────────────────────────────────────────────┤
                 │  - Review, edit, or reject AI advisories             │
                 │  - SHA-256 hash-chained immutable log audit          │
                 └──────────────────────────────────────────────────────┘
```

For the complete deep-dive engineering specification, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Tech Stack

### Backend & Core Analytics
- **Python 3.12** & **FastAPI** — High-performance async REST API microservice framework.
- **Uvicorn** — Production ASGI web server.
- **NumPy**, **SciPy**, **Pandas**, **PyArrow** — Vectorised numerical calculation and Parquet data streaming.
- **Shapely**, **GeoPandas**, **H3-Py** — Spatial joins, polygon operations, and Uber H3 hexagonal spatial indexing.

### Frontend & GIS Command Centre
- **React 18** & **Vite 5** — Modern component-driven UI and lightning-fast asset bundler.
- **Leaflet** & **React-Leaflet** — Lightweight interactive 2D GIS cartography map interface.
- **TailwindCSS** — Sleek Emergency Operation Centre dark/light theme design system.
- **Lucide React** — Crisp vector telemetry icon library.

### Artificial Intelligence & LLM Integration
- **Google Gemini 3.7 Flash** (`google-genai` SDK) — Citation-grounded decision support and advisory drafting.

### Data Sources & GIS Infrastructure
- **OpenStreetMap (OSM)** — Real coastal Odisha road network graph and critical infrastructure geometry.
- **Copernicus GLO-30 DEM** — 30m global Digital Elevation Model for coastal inundation screening.
- **WorldPop** — High-resolution 100m grid population distribution.

---

## Data Provenance & Methodology Transparency

PRAVAAH enforces strict data provenance discipline across all engine outputs:

| Tag | Category | Meaning & Scope |
| :--- | :--- | :--- |
| `OBSERVED` | Real Data | Measured geometries, facility coordinates, and elevation benchmarks. |
| `FORECAST` | Bulletin Data | Official IMD storm track parameters (coordinates, central pressure deficit, $V_{max}$). |
| `DERIVED` | Physics Calculation | Deterministic Holland wind vectors, surge depth, and Dijkstra travel time loss. |
| `MODELLED` | Statistical ML | Flood susceptibility probability computed via regional terrain screening. |
| `SIMULATED` | Scenario Slider | User-defined perturbations ($V_{max}$ multiplier, rainfall intensity, track offset). |

> ℹ️ **Methodology Note**: Flood susceptibility is currently calculated via a calibrated terrain-elevation screening heuristic while historical Sentinel-1 SAR change-detection training dataset pipeline is finalized.

---

## Data Sources & License Attribution

PRAVAAH uses open data in compliance with their respective licenses:

- **OpenStreetMap**: Open Database License (ODbL) — Data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
- **WorldPop**: Creative Commons Attribution 4.0 International (CC BY 4.0) — WorldPop / University of Southampton.
- **Open-Meteo**: Creative Commons Attribution 4.0 International (CC BY 4.0) — [Open-Meteo.com](https://open-meteo.com/).
- **IBTrACS / IMD**: Public domain scientific storm track records provided by NOAA NCEI and India Meteorological Department.

---

## Local Setup & Quickstart Guide

### Prerequisites
- Python 3.12+
- Node.js 20+ & `npm`
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/PRAVAAH.git
cd PRAVAAH
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-3.7-flash
```

### 3. Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run pytest verification suite
python -m pytest backend/tests
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run build
cd ..
```

### 5. Launch the Application
Run the unified Uvicorn server serving both FastAPI endpoints and static React assets:
```bash
python -m uvicorn backend.pravaah.main:app --host 0.0.0.0 --port 8000
```
Open your browser and navigate to `http://localhost:8000`.

---

## Project Directory Structure

```
PRAVAAH/
├── .gitignore                    # Exclusion rules (.env, node_modules, pycache)
├── Dockerfile                    # Multi-stage production container definition
├── render.yaml                   # Render platform infrastructure blueprint
├── Procfile                      # Process file for production deployment
├── README.md                     # Public hackathon submission document
├── docs/                         # Engineering documentation
│   └── ARCHITECTURE.md           # Master architecture & technical specification
├── backend/                      # Python FastAPI microservice & calculation engines
│   ├── main.py                   # Server entrypoint & static frontend mounting
│   ├── requirements.txt          # Backend dependencies
│   ├── pravaah/                  # Engine packages (cyclone, hazard, exposure, cascade)
│   └── tests/                    # Integration & unit test suite
├── regions/                      # Regional datasets (Odisha Coastal feature cube)
├── frontend/                     # React + Vite GIS Command Centre application
│   ├── package.json              # Frontend dependencies & build scripts
│   ├── src/                      # React UI components & Leaflet maps
│   └── dist/                     # Production static build output
└── tests/                        # Playwright E2E automation tests
```

---

## Hackathon Submission Metadata

- **Event**: Build with AI — Code for Communities (2nd Edition)
- **Track**: Track 5 — Cyclone Impact & Infrastructure Vulnerability Forecaster
- **Theme**: Community Resilience & Anticipatory Disaster Action

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
