# PRAVAAH

**Predictive Resilience & Vulnerability Analytics for Anticipatory Action Hub**

> From predicting *where* a cyclone goes to predicting *what it will disrupt.*

**Master Build Document / Engineering Specification — v1.0**
Target: BUILD WITH AI — CODE FOR COMMUNITIES (2nd Edition) · Track 5 — Cyclone Impact & Infrastructure Vulnerability Forecaster · Theme: Resilience

---

## 0. How to read this document

This file is the **source of truth** for the PRAVAAH repository. It is written for human engineers and AI coding agents (Google Antigravity).

Conventions used throughout:
- `[VERIFIED]` — confirmed against a live source.
- `[TO VERIFY]` — plausible but must be confirmed during data audit.
- `[ASSUMPTION]` — a documented modelling choice, not a fact.
- `[DERIVED]` / `[SIMULATED]` — data provenance classes.

---

## 1. Executive summary

A cyclone bulletin tells a District Collector that a Very Severe Cyclonic Storm will make landfall near Puri in 42 hours with 130 km/h winds. It does **not** tell them that the causeway on SH-60 is the only road link for four coastal blocks, that it is likely to be overtopped six hours before landfall, and that 90,000 people will consequently lose sub-30-minute access to a functioning hospital.

PRAVAAH computes the second thing.

It is a pre-landfall decision-support platform that converts an official cyclone forecast into **quantified, physical-unit statements of infrastructure disruption**, and then into evidence-linked, human-approved advisories.

**Architecture in one line:**
```
Deterministic physics + calibrated ML  →  computes evidence (numbers)
Gemini 3.7 Flash                       →  reasons over evidence (narrative, priorities, drafts)
Human authority                        →  approves consequential action (advisory dispatch)
```

---

## 2. System Architecture & Science Foundation

- **Parametric Wind Field**: Holland (1980) radial wind profile model adjusted for translation speed asymmetry across H3 cell centroids.
- **Flood Susceptibility**: Supervised XGBoost model trained on Sentinel-1 SAR change detection inundation labels for Bay of Bengal cyclones.
- **Surge Screening**: Peak parametric surge height equation (pressure deficit, radius of maximum winds, approach angle, bathymetry) + connected attenuated bathtub on Copernicus GLO-30 DEM.
- **Road Network Cascade**: Multi-source Dijkstra shortest-path travel time solver on OpenStreetMap road graph (flooded edge removal $\to$ population & facility isolation).
- **Gemini 3.7 Flash Decision Layer**: Reads structured `EvidenceBundle` JSON + map renders, generates briefs and draft advisories with machine-checked `evidence_id` citations.
- **Human-in-the-Loop Workflow**: Draft $\to$ Review $\to$ Approve/Reject $\to$ Hash-chained Audit Log.

---

## 3. Data Provenance Model

Every dataset, field, and API response carries an explicit provenance tag:
- `OBSERVED`: Measured by authoritative source.
- `FORECAST`: Official forecast product (e.g., IMD track forecast).
- `DERIVED`: Computed by PRAVAAH via documented deterministic formulation.
- `MODELLED`: Output of ML statistical model (e.g., XGBoost flood probability).
- `SIMULATED`: User-perturbed scenario slider parameter.
- `PLACEHOLDER`: Explicit stand-in when data is missing (visually flagged, cannot back advisories).

---

## 4. Repository Structure

```
pravaah/
├── README.md                     ← Master Specification v1.0
├── docs/                         ← Documentation, Methodologies, Data Audits, ADRs
├── backend/                      ← FastAPI backend & core calculation engines
├── geospatial/                   ← H3 grid generation & OSM pipeline
├── ml/                           ← XGBoost flood susceptibility training & evaluation
├── regions/                      ← Region configurations (Odisha Coastal demo)
└── frontend/                     ← React + Vite + MapLibre GL Command Centre UI
```
