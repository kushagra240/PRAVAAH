# PRAVAAH — Limitations & Operational Disclaimers

---

## 1. Non-Hydrodynamic Surge Disclaimer
PRAVAAH uses a **first-order parametric screening surge model** combined with connected hydraulic elevation attenuation on Open-Meteo Elevation API (Copernicus DEM GLO-90, ~90 m).
- **NOT** a full 3D hydrodynamic numerical simulation (e.g. ADCIRC, Delft3D-FM, SLOSH).
- Suitable for rapid relative prioritisation, emergency screening, and anticipatory planning — **not** for structural engineering design or legal flood plain determination.

---

## 2. Spatial Grid Resolution
Operational analysis is conducted at **H3 Resolution 8** (~0.46 km² per hexagonal cell).
- Sub-cell micro-topography smaller than ~460m is averaged.
- Localized urban drainage blockages or culvert-scale failures below cell resolution are not explicitly resolved.
- 1 km population is spread over smaller H3 r8 cells, so cell-level population and footprint figures (for example the surge-inundated population) are approximate.

---

## 3. Data Completeness Disclaimers
- **Power Grid**: OpenStreetMap power coverage in coastal India is partial. Substation backup generator status defaults to `unknown` and is explicitly flagged in the UI.
- **Parametric Insurance**: Trigger monitoring outputs are indicative only.

---

## 4. Flood Susceptibility Model Disclaimer (`ASSUMPTION`)
- The active flood susceptibility engine uses `HeuristicFloodScreeningModel` — a calibrated logit screening formula combining terrain wetness index (TWI), HAND, elevation, surge depth, and rainfall intensity (`provenance_class = "ASSUMPTION"`).
- It serves as a rapid physical screening placeholder pending full offline XGBoost training on Sentinel-1 SAR change detection inundation labels per §9.4 of the master specification.

---

## 5. Observational Ground Truth Gap (Population & Road Access Loss)
- Empirical ground truth datasets for actual population access loss and localized road blockages during historical events (e.g., Cyclone Yaas 2021) are unavailable in the current pipeline fixtures.
- Retrospective replay track comparisons (T-48h vs T-0) demonstrate internal model stability under track uncertainty, but are **not** independent ground truth validations. Evaluating access loss against real empirical mobility ground truth remains an open validation gap.

---

## 6. Demonstration Simplification — Role & Accountability Login Gate
- **Authentication Scope:** In compliance with §20 of the master specification, PRAVAAH implements a minimal client-side role-gated authentication framework.
- **Seeded Demo Identities:**
  1. **R. Mohanty (District Collector & Magistrate)** — `Role: APPROVER`: Authorized with full statutory authority to sign, approve, and dispatch official CAP advisories.
  2. **A. Patnaik (EOC Lead Risk Analyst)** — `Role: ANALYST`: Authorized to run cascade simulations, inspect evidence bundles, and draft advisories. Advisory approval capability is explicitly gated (`🔒 Approval Restricted`).
- **Production Disclaimer:** This demonstration gate uses in-memory frontend state management and mock identity selection rather than a production-grade identity provider (IdP), OAuth2/OIDC server, or password-hashed backend database. Production deployment would integrate with State Single Sign-On (SSO / DigiLocker / e-Pramaan).


