# PRAVAAH — Frontend UI/UX Design Specification

---

## 1. Design Aesthetics & Visual Philosophy

PRAVAAH adopts an **Executive Emergency Operations Command System** visual aesthetic:
- **Color Palette**: Dark background (`#0B0F19`), translucent glassmorphism panels (`#111827`), high-contrast map layers (`#080C14`).
- **Accent Signals**:
  - Critical / High Risk: Red `#EF4444` / Red-950 `#450A0A`
  - Moderate Warning: Orange `#F97316` / Orange-950 `#431407`
  - Active Data / Technology: Cyan `#06B6D4` / Cyan-950 `#083344`
  - Operational / Safe: Emerald `#10B981` / Emerald-950 `#064E3B`
- **Typography**: Inter for crisp UI text; JetBrains Mono for metrics, lat/lon coordinates, timestamps, and evidence tokens.

---

## 2. Layout Structure & Prominence

- **Map Hero Viewport**: Map occupies ~70% visual width of screen.
- **Top Telemetry Bar**: Fixed 40px bar displaying live track fixes, T-minus landfall countdown, max wind speed, peak surge height, and computation latency.
- **Right Tabbed Panel**:
  1. *Situation Brief & AI*: Quantified metrics, Gemini 3.7 Flash narrative, priority recommendations.
  2. *Scenario Simulator*: Real-time sliders with sub-3s recomputation and Baseline vs Scenario Delta diff.
  3. *Asset Drilldown*: Searchable asset directory & factor decomposition inspector.
  4. *Advisory Review*: Human approval state machine & cryptographic SHA256 audit log.
