# PRAVAAH — Scientific & Algorithmic Methodology

---

## 1. Parametric Holland Wind Field Engine

The radial wind speed $V(r)$ at distance $r$ from the cyclone center is calculated using the parametric Holland (1980) equation:

$$V(r) = \sqrt{\frac{B}{\rho} \left(\frac{R_{max}}{r}\right)^B (P_{env} - P_c) \exp\left(-\left(\frac{R_{max}}{r}\right)^B\right) + \left(\frac{r f}{2}\right)^2} - \frac{r f}{2}$$

where:
- $B$ is the Holland shape parameter: $B = \frac{V_{max}^2 \cdot e \cdot \rho}{\Delta P}$
- $R_{max}$ is the radius of maximum winds (km)
- $P_{env}$ is environmental pressure (1013.0 hPa)
- $P_c$ is central minimum pressure (hPa)
- $\rho$ is air density ($1.15 \text{ kg/m}^3$)

A directional translation speed vector ($V_{trans}$) is added asymmetrically to account for higher winds on the right side of the track in the Northern Hemisphere.

---

## 2. Storm Surge Screening & Attenuated Bathtub Model

1. **Peak Coastal Surge Height**:
   $$S_{peak} = \alpha \cdot (P_{env} - P_c) + \beta \cdot V_{max}^2 + \gamma \cdot \left(\frac{1}{\text{bathy\_slope}}\right)$$

2. **Connected Inland Attenuation**:
   $$S_{inland}(d) = \max\left(0, S_{peak} - \lambda \cdot d\right)$$
   where $d$ is inland distance from coast in km, and $\lambda = 0.12 \text{ m/km}$ is the land-cover roughness attenuation coefficient.
   Inundation depth per cell: $\text{Surge Depth} = \max\left(0, S_{inland}(d) - \text{elevation}\right)$.

---

## 3. Supervised XGBoost Flood Susceptibility Model

Predicts cell-level flood probability $P(\text{Flood}) \in [0, 1]$ trained on Sentinel-1 SAR change detection labels for historical Bay of Bengal cyclones.

**Feature vector**:
- Terrain & Hydrology: Elevation, HAND, Slope, TWI, Distance to Drainage, Permanent Water Occurrence %
- Event Hydro-Meteorology: 24-hour Accumulated Rainfall (mm), Peak Rain Intensity (mm/h), Surge Depth (m)

---

## 4. Road Network Cascade & Dijkstra Accessibility Solver

- Road graph constructed from OpenStreetMap edge segments.
- Travel time weight $w_e = \frac{\text{length\_km}}{\text{speed\_kph}} \times 60 \text{ minutes}$.
- An edge is marked impassable ($w_e = \infty$) if cell flood probability $P(\text{Flood}) \ge 0.50$ or if a coastal causeway is overtopped.
- Multi-source shortest path travel times solved via `scipy.sparse.csgraph.dijkstra`.
- Quantifies:
  - Population losing $<30$ minute hospital travel time access.
  - Number and names of road-isolated public health facilities.
