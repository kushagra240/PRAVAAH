# PRAVAAH — Limitations & Operational Disclaimers

---

## 1. Non-Hydrodynamic Surge Disclaimer
PRAVAAH uses a **first-order parametric screening surge model** combined with connected hydraulic elevation attenuation on Copernicus GLO-30 DEM.
- **NOT** a full 3D hydrodynamic numerical simulation (e.g. ADCIRC, Delft3D-FM, SLOSH).
- Suitable for rapid relative prioritisation, emergency screening, and anticipatory planning — **not** for structural engineering design or legal flood plain determination.

---

## 2. Spatial Grid Resolution
Operational analysis is conducted at **H3 Resolution 8** (~0.46 km² per hexagonal cell).
- Sub-cell micro-topography smaller than ~460m is averaged.
- Localized urban drainage blockages or culvert-scale failures below cell resolution are not explicitly resolved.

---

## 3. Data Completeness Disclaimers
- **Power Grid**: OpenStreetMap power coverage in coastal India is partial. Substation backup generator status defaults to `unknown` and is explicitly flagged in the UI.
- **Parametric Insurance**: Trigger monitoring outputs are indicative only.

---

## 4. Flood Susceptibility Model Disclaimer (`ASSUMPTION`)
- The active flood susceptibility engine uses `HeuristicFloodScreeningModel` — a calibrated logit screening formula combining terrain wetness index (TWI), HAND, elevation, surge depth, and rainfall intensity (`provenance_class = "ASSUMPTION"`).
- It serves as a rapid physical screening placeholder pending full offline XGBoost training on Sentinel-1 SAR change detection inundation labels per §9.4 of the master specification.
