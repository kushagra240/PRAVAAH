import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldAlert, AlertTriangle, Building2, CheckCircle, CheckCircle2, FileText, ChevronRight, HelpCircle, Layers, Sliders, RefreshCw, Send, Waves, AlertCircle } from 'lucide-react';

const renderTextWithCitations = (text) => {
  if (!text) return null;
  if (typeof text !== 'string') return text;
  const parts = text.split(/(\[EVID_[A-Z0-9_]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('[EVID_') && part.endsWith(']')) {
      const evidId = part.slice(1, -1);
      return (
        <span 
          key={i} 
          className="ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-mono font-bold hover:bg-blue-200 cursor-pointer inline-flex items-center"
          title={`Click to inspect ground-truth evidence: ${evidId}`}
        >
          {evidId}
        </span>
      );
    }
    return part;
  });
};

export default function ContextInspectorPanel({ 
  currentState = 1, 
  onSelectState = null,
  selectedAsset = null,
  onClearSelectedAsset = null,
  simResult = null,
  impactSummary = null,
  briefData = null,
  onOpenAdvisoryModal = null,
  onRunScenario = null,
  isSimulating = false,
  activeNav = 'map',
  timeStepHours = -6
}) {
  const [perturbations, setPerturbations] = useState({ v_max_multiplier: 1.10, rain_multiplier: 1.20, surge_multiplier: 1.15 });

  // Handle asset click / selection / nav state
  const isHospitalSelected = currentState === 2 || selectedAsset?.asset_type === 'hospital';
  const isRoadSelected = currentState === 3 || selectedAsset?.asset_type === 'road';
  const isScenarioState = activeNav === 'scenario' || currentState === 6 || currentState === 7;
  const isRiskState = activeNav === 'risk';
  const isSheltersState = activeNav === 'shelters';
  const isRiverState = activeNav === 'river';
  const isActionsState = activeNav === 'actions';

  return (
    <div className="w-[320px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto p-3.5 gap-4 select-none">
      {/* 1. STATE 2: HOSPITAL SELECTED (RAJNAGAR CHC) */}
      {isHospitalSelected ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">ASSET INSPECTOR</span>
            </div>
            <button 
              onClick={() => {
                if (onClearSelectedAsset) onClearSelectedAsset();
                if (onSelectState) onSelectState(1);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
            >
              Close ✕
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {selectedAsset?.name || 'PHC, SANATPUR'}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedAsset?.name?.includes('Rajnagar') ? 'Community Health Centre · Rajnagar Block (DEGRADED)' : 'Primary Health Centre · Kendrapara Sadar (IMPASSABLE)'}
            </p>
          </div>

          <div className={`${selectedAsset?.name?.includes('Rajnagar') ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border rounded-md p-3 space-y-2`}>
            <div className={`text-[10px] font-bold tracking-wider ${selectedAsset?.name?.includes('Rajnagar') ? 'text-amber-700' : 'text-red-700'} uppercase font-mono`}>STATUS</div>
            <div className={`text-sm font-bold ${selectedAsset?.name?.includes('Rajnagar') ? 'text-amber-900' : 'text-red-900'} flex items-center justify-between`}>
              <span>{selectedAsset?.name?.includes('Rajnagar') ? 'Degraded Access (2.5x Delay)' : 'Total Road Isolation'}</span>
              <span className={`px-2 py-0.5 rounded ${selectedAsset?.name?.includes('Rajnagar') ? 'bg-amber-600' : 'bg-red-600'} text-white text-[10px]`}>
                {selectedAsset?.name?.includes('Rajnagar') ? 'DEGRADED' : 'IMPASSABLE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">ACCESS DELTA</div>
              <div className="text-base font-bold text-red-600 font-mono-num">
                {selectedAsset?.name?.includes('Rajnagar') ? '+28 min' : 'IMPASSABLE'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">FLOOD PROBABILITY</div>
              <div className="text-base font-bold text-slate-900 font-mono-num">
                {selectedAsset?.name?.includes('Rajnagar') ? '0.44' : '0.64'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">ROAD CONNECTION</div>
              <div className="text-xs font-bold text-slate-800">OSM Arterial Link</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">ISOLATED FACILITIES</div>
              <div className="text-base font-bold text-slate-900 font-mono-num">{simResult?.cascade?.isolated_facilities_count ?? 94}</div>
            </div>
          </div>

          {/* WHY SECTION */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 space-y-1.5">
            <div className="text-[10px] font-bold text-amber-800 uppercase font-mono flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-amber-600" />
              <span>ACCESSIBILITY ACCORDING TO 3-STATE MODEL</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-medium">
              {selectedAsset?.name?.includes('Rajnagar')
                ? 'CHC Rajnagar feeder link is in DEGRADED status (0.30 <= P < 0.60), causing 2.5x travel time delay without total isolation.'
                : 'PHC Sanatpur access link is in IMPASSABLE status (P >= 0.60) due to 3.78m peak storm surge inundation across low-elevation plain.'}
            </p>
          </div>

          <button 
            onClick={() => {
              if (onOpenAdvisoryModal) onOpenAdvisoryModal();
              if (onSelectState) onSelectState(10);
            }}
            className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-md shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Draft Action Advisory for Asset</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : isRoadSelected ? (
        /* 2. STATE 3: ROAD DISRUPTION SELECTED */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">ROAD DISRUPTION</span>
            </div>
            <button onClick={() => onSelectState && onSelectState(1)} className="text-[11px] text-slate-500">Close ✕</button>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">{selectedAsset?.name || 'NH16 / COASTAL ROAD CORRIDOR'}</h3>
            <p className="text-xs text-slate-500">Primary Highway Link · Kendrapara-Bhadrak Corridor</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-1">
            <div className="text-[10px] font-bold text-red-700 uppercase font-mono">CURRENT STATUS</div>
            <div className="text-sm font-bold text-red-900">IMPASSABLE (Storm surge inundation P = 0.95)</div>
            <div className="text-xs text-slate-600">Water levels exceed safe vehicle clearance.</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-md space-y-2 text-xs">
            <div className="font-bold text-slate-800">AFFECTED DEPENDENCIES</div>
            <div className="text-slate-600">• PHC Sanatpur & UGPHC Tangi (Ambulances blocked)</div>
            <div className="text-slate-600">• 94 health facilities isolated across coastal strip</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-xs space-y-1">
            <div className="font-bold text-blue-950">RECOMMENDED DETOUR</div>
            <div className="text-blue-900">Reroute via Western Bypass. Adds +24 min travel time but remains 100% dry.</div>
          </div>
        </div>
      ) : isScenarioState ? (
        /* 3. STATE 6 & 7: SCENARIO SIMULATOR & DELTA */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs uppercase font-mono">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>SCENARIO SIMULATOR</span>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Perturb hazard parameters to evaluate worst-case compound disaster impacts.
          </p>

          <div className="space-y-3 bg-slate-50 p-3 rounded-md border border-slate-200 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Wind Speed Multiplier</span>
                <span className="font-mono text-blue-700">+{Math.round((perturbations.v_max_multiplier - 1) * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="1.3" 
                step="0.05" 
                value={perturbations.v_max_multiplier} 
                onChange={(e) => setPerturbations(prev => ({ ...prev, v_max_multiplier: parseFloat(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer" 
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Rainfall Intensity</span>
                <span className="font-mono text-blue-700">+{Math.round((perturbations.rain_multiplier - 1) * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="1.5" 
                step="0.05" 
                value={perturbations.rain_multiplier} 
                onChange={(e) => setPerturbations(prev => ({ ...prev, rain_multiplier: parseFloat(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer" 
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Storm Surge Peak</span>
                <span className="font-mono text-blue-700">+{Math.round((perturbations.surge_multiplier - 1) * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="1.4" 
                step="0.05" 
                value={perturbations.surge_multiplier} 
                onChange={(e) => setPerturbations(prev => ({ ...prev, surge_multiplier: parseFloat(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer" 
              />
            </div>

            <button 
              onClick={() => {
                if (onRunScenario) onRunScenario(perturbations);
                if (onSelectState) onSelectState(7);
              }}
              disabled={isSimulating}
              className="w-full mt-2 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'RUNNING SCENARIO...' : 'RUN SCENARIO SIMULATION'}</span>
            </button>
          </div>

          {/* STATE 7: SCENARIO DELTA OUTPUT */}
          <div className="bg-amber-50 border border-amber-300 rounded-md p-3 space-y-2 text-xs">
            <div className="text-[10px] font-bold text-amber-800 uppercase font-mono">BASELINE → SCENARIO DELTA & TOTALS</div>
            <div className="space-y-1.5 text-slate-800">
              {(() => {
                const baseRoads = 1448;
                const baseFacs = 94;
                const basePop = 27465;

                const currRoads = simResult?.cascade?.broken_road_edges_count ?? 1448;
                const currFacs = simResult?.cascade?.isolated_facilities_count ?? 94;
                const currPop = simResult?.cascade?.population_losing_30min_access ?? 27465;

                const dRoads = currRoads - baseRoads;
                const dFacs = currFacs - baseFacs;
                const dPop = currPop - basePop;

                return (
                  <>
                    <div className="flex justify-between border-b border-amber-200 pb-1 font-medium">
                      <span>Affected Road Links</span>
                      <span className="font-bold text-red-600 font-mono-num">
                        {currRoads.toLocaleString()} links {dRoads > 0 ? `(+${dRoads.toLocaleString()})` : '(baseline)'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-amber-200 pb-1 font-medium">
                      <span>Isolated Health Facilities</span>
                      <span className="font-bold text-red-600 font-mono-num">
                        {currFacs.toLocaleString()} facilities {dFacs > 0 ? `(+${dFacs.toLocaleString()})` : '(baseline)'}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Pop Beyond 30m Access</span>
                      <span className="font-bold text-red-700 font-mono-num">
                        {currPop.toLocaleString()} people {dPop > 0 ? `(+${dPop.toLocaleString()})` : '(baseline)'}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : isRiskState ? (
        /* WHO'S AT RISK PANEL */
        <div className="space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">WHO'S AT RISK</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">Population Exposure & Access Loss</h3>
            <p className="text-xs text-slate-500">Ranked by coastal flood risk & travel time degradation</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
            <div className="text-[10px] font-bold text-red-700 uppercase font-mono">POPULATION ACCESS DISRUPTION</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded border border-red-100">
                <div className="text-[10px] text-slate-400">LOST SUB-30MIN</div>
                <div className="text-sm font-bold text-red-700">27,465</div>
              </div>
              <div className="bg-white p-2 rounded border border-red-100">
                <div className="text-[10px] text-slate-400">LOST SUB-60MIN</div>
                <div className="text-sm font-bold text-red-900">31,214</div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">HIGHEST EXPOSED BLOCKS</div>
            <div className="space-y-1.5 text-xs">
              {[
                { block: 'Balikuda Block', pop: '8,686 people', status: 'CRITICAL' },
                { block: 'Chandbali Block', pop: '8,024 people', status: 'CRITICAL' },
                { block: 'Dhamra Coastal Plain', pop: '7,803 people', status: 'HIGH' },
                { block: 'Bhadrak Sadar', pop: '7,573 people', status: 'HIGH' },
                { block: 'Erasama Block', pop: '7,573 people', status: 'HIGH' }
              ].map((b, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="font-semibold text-slate-800">{b.block}</div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="font-bold text-slate-900">{b.pop}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${b.status === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onSelectState && onSelectState(2)}
            className="w-full py-2 bg-[#0F2942] hover:bg-[#163B5F] text-white font-bold text-xs rounded-md shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Inspect 94 Isolated Facilities &rarr;</span>
          </button>
        </div>
      ) : isSheltersState ? (
        /* SHELTERS PANEL */
        <div className="space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">CYCLONE SHELTERS</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">Shelter Capacity & Readiness</h3>
            <p className="text-xs text-slate-500">Multi-purpose cyclone shelters across coastal Odisha</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 space-y-1">
            <div className="text-[10px] font-bold text-emerald-800 uppercase font-mono">TOTAL SHELTER CAPACITY</div>
            <div className="text-base font-bold text-emerald-950 font-mono-num">4,500 Evacuees (4 Major Hubs)</div>
            <div className="text-[11px] text-slate-600">Equipped with emergency solar power & water filtration.</div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">COASTAL SHELTER LOCATIONS</div>
            <div className="space-y-1.5 text-xs">
              {[
                { name: 'Balasore MPCS Hub', cap: '1,500 people', elev: '6.2m elev', status: 'READY' },
                { name: 'Dhamra Relief Shelter', cap: '1,200 people', elev: '5.8m elev', status: 'READY' },
                { name: 'Kendrapara Sadar MPCS', cap: '1,000 people', elev: '7.1m elev', status: 'READY' },
                { name: 'Rajnagar Relief Hub', cap: '800 people', elev: '4.5m elev', status: 'DEGRADED ACCESS' }
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{s.name}</span>
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded ${s.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Capacity: {s.cap}</span>
                    <span>Elevation: {s.elev}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : isRiverState ? (
        /* WATER & SURGE PANEL */
        (() => {
          // Time step scaling multiplier for non-T-0 timeline steps
          const getTimeScale = (h) => {
            if (h <= -12) return 0.30;
            if (h <= -6) return 0.65;
            if (h === 0) return 1.00;
            if (h <= 6) return 0.85;
            return 0.40;
          };

          const scale = timeStepHours === 0 ? 1.0 : getTimeScale(timeStepHours);

          // 1. Peak Surge (m)
          const baseSurge = simResult?.peak_surge_m ?? impactSummary?.peak_surge_m ?? 3.78;
          const displaySurge = baseSurge * scale;

          // 2. Inundation Footprint (> 0 depth)
          const baseInundatedCells = simResult?.exposure?.surge_inundated_cells_count ?? impactSummary?.surge_inundated_cells_count ?? 471;
          const baseInundatedPop = simResult?.exposure?.pop_exposed_surge_gt0 ?? impactSummary?.surge_inundated_population ?? 8544;
          const displayInundatedCells = Math.round(baseInundatedCells * scale);
          const displayInundatedPop = Math.round(baseInundatedPop * scale);

          // 3. Flood-Screening Exposure
          const baseSeverePop = simResult?.exposure?.pop_exposed_severe_flood ?? impactSummary?.pop_exposed_severe_flood ?? 65163;
          const baseElevatedPop = simResult?.exposure?.pop_exposed_elevated_flood ?? impactSummary?.pop_exposed_elevated_flood ?? 103230;
          const displaySeverePop = Math.round(baseSeverePop * scale);
          const displayElevatedPop = Math.round(baseElevatedPop * scale);

          // 4. Low-Lying Terrain (Open-Meteo elevation column)
          const lowLying = simResult?.exposure?.low_lying_terrain ?? impactSummary?.low_lying_terrain ?? {};
          const u2 = lowLying.under_2m ?? { cells: 887, pct_cells: 29.6, pop: 18528 };
          const u5 = lowLying.under_5m ?? { cells: 1464, pct_cells: 48.8, pop: 148081 };
          const u10 = lowLying.under_10m ?? { cells: 2106, pct_cells: 70.2, pop: 322759 };

          return (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">WATER & SURGE</span>
                </div>
                {timeStepHours !== 0 ? (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                    <AlertCircle className="w-2.5 h-2.5 text-amber-700 animate-pulse" />
                    <span>ASSUMPTION</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-300 text-[9px] font-mono font-bold uppercase tracking-wider shadow-2xs">
                    DERIVED / OBSERVED
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Water & Surge Dynamics</h3>
                <p className="text-xs text-slate-500">Hydrodynamic surge output & terrain exposure profile</p>
              </div>

              {/* BLOCK 1: PEAK STORM SURGE */}
              <div className="bg-gradient-to-br from-[#0F2942] to-slate-900 text-white rounded-lg p-3.5 space-y-2 shadow-sm border border-cyan-900/50">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono">
                    PEAK STORM SURGE
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 text-[9px] font-mono font-bold border border-cyan-700/50">
                    DERIVED
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-extrabold font-mono text-white">
                    {displaySurge.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold text-cyan-200">meters</span>
                </div>

                <p className="text-[11px] text-cyan-100/80 leading-tight font-sans">
                  Parametric pressure-deficit & wind-driven surge height at coastal boundary for active run.
                </p>
              </div>

              {/* BLOCK 2: INUNDATION FOOTPRINT */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wider">
                    INUNDATION FOOTPRINT (SURGE &gt; 0m)
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-mono font-bold border border-blue-200">
                    DERIVED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans font-semibold">INUNDATED H3 CELLS</div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {displayInundatedCells.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ 3,000</span>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans font-semibold">POP IN FOOTPRINT</div>
                    <div className="text-sm font-extrabold text-cyan-800">
                      {displayInundatedPop.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Visual Bar Chart / Stat Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Spatial Footprint Share</span>
                    <span className="font-bold text-slate-700">{((displayInundatedCells / 3000) * 100).toFixed(1)}% of region</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-600 transition-all duration-500" 
                      style={{ width: `${Math.min(100, (displayInundatedCells / 3000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* BLOCK 3: FLOOD-SCREENING EXPOSURE */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-amber-900 uppercase font-mono tracking-wider flex items-center gap-1">
                    <span>FLOOD-SCREENING EXPOSURE</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[9px] font-mono font-bold border border-amber-300">
                    ASSUMPTION
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-white p-2 rounded border border-amber-200 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-red-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                        Severe (P &ge; 0.60)
                      </span>
                      <span className="font-mono font-bold text-red-700">
                        {displaySeverePop.toLocaleString()} pop
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-600 transition-all duration-500" 
                        style={{ width: `${Math.min(100, (displaySeverePop / 620079) * 100 * 5)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded border border-amber-200 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-amber-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Elevated (P &ge; 0.30)
                      </span>
                      <span className="font-mono font-bold text-amber-800">
                        {displayElevatedPop.toLocaleString()} pop
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-500" 
                        style={{ width: `${Math.min(100, (displayElevatedPop / 620079) * 100 * 3)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCK 4: LOW-LYING TERRAIN */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wider">
                    LOW-LYING TERRAIN (OPEN-METEO)
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold border border-emerald-200">
                      OBSERVED
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-mono font-bold border border-blue-200">
                      DERIVED
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {/* < 2m Band */}
                  <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-800 font-mono">
                      <span>Elev &lt; 2 m</span>
                      <span className="text-cyan-800 font-bold">{u2.pct_cells}% cells ({u2.pop.toLocaleString()} pop)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-700" style={{ width: `${u2.pct_cells}%` }}></div>
                    </div>
                  </div>

                  {/* < 5m Band */}
                  <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-800 font-mono">
                      <span>Elev &lt; 5 m</span>
                      <span className="text-blue-800 font-bold">{u5.pct_cells}% cells ({u5.pop.toLocaleString()} pop)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${u5.pct_cells}%` }}></div>
                    </div>
                  </div>

                  {/* < 10m Band */}
                  <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-800 font-mono">
                      <span>Elev &lt; 10 m</span>
                      <span className="text-slate-700 font-bold">{u10.pct_cells}% cells ({u10.pop.toLocaleString()} pop)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400" style={{ width: `${u10.pct_cells}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ONE-LINE HONEST DISCLOSURE */}
              <div className="pt-1 border-t border-slate-200 text-[10.5px] text-slate-500 font-medium italic leading-snug">
                River gauge telemetry (e.g. CWC / India-WRIS feeds) is not onboarded for this demo region.
              </div>
            </div>
          );
        })()
      ) : isActionsState ? (
        /* WHAT TO DO PANEL */
        <div className="space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">RECOMMENDED ACTIONS</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">Operational Priority Actions</h3>
            <p className="text-xs text-slate-500">Prioritized by lead time before landfall</p>
          </div>

          <div className="space-y-3">
            {[
              { title: "Mobile Medical Units & Supply Lines", desc: "Pre-position watercraft and emergency generators at hub facilities prior to causeway overtopping." },
              { title: "ODRAF / NDRF Rescue Deployment", desc: "Mobilize heavy clearance and flood rescue teams along primary highway corridors." },
              { title: "Evacuation to Cyclone Shelters", desc: "Initiate targeted evacuation for 16,710 high-exposure residents in Balikuda & Chandbali." }
            ].map((a, i) => (
              <div key={i} className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] shrink-0 font-mono font-bold">
                    {i + 1}
                  </span>
                  <span>{a.title}</span>
                </div>
                <p className="text-slate-600 leading-snug pl-5.5">{a.desc}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
              if (onOpenAdvisoryModal) onOpenAdvisoryModal();
              if (onSelectState) onSelectState(10);
            }}
            className="w-full py-2 bg-[#0F2942] hover:bg-[#163B5F] text-white font-bold text-xs rounded-md shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Draft Action Advisory Now &rarr;</span>
          </button>
        </div>
      ) : (
        /* 4. STATE 1 DEFAULT COMMAND CENTER */
        <div className="space-y-4">
          {/* SECTION 1: WHAT'S HAPPENING — STRUCTURED AI BRIEF */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">What's happening</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                briefData?.brief?.provenance === 'LIVE_GEMINI'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>{briefData?.brief?.provenance === 'LIVE_GEMINI' ? 'LIVE GEMINI 3.7' : 'EVIDENCE-DERIVED'}</span>
              </span>
            </div>

            {isSimulating ? (
              <div className="bg-blue-50/80 p-3 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center gap-2 font-medium">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                <span>Generating structured AI brief via Gemini Decision Engine...</span>
              </div>
            ) : (
              <>
                {/* 1. High-Impact Headline */}
                <div className="bg-white p-3 rounded-lg border border-blue-200/80 shadow-2xs border-l-4 border-l-blue-700">
                  <div className="text-[10px] font-bold text-blue-800 font-mono uppercase mb-0.5 tracking-wider">CRITICAL SITUATION HEADLINE</div>
                  <p className="text-xs text-slate-900 font-semibold leading-snug">
                    {renderTextWithCitations(briefData?.brief?.headline || `Under baseline forecast, ${simResult?.cascade?.population_losing_30min_access || 27465} residents lose 30min care access [EVID_POP_30MIN_LOSS].`)}
                  </p>
                </div>

                {/* 2. Structured Key Findings (Bulleted List with Icons) */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">KEY FINDINGS</div>
                  <div className="space-y-1.5">
                    {(briefData?.brief?.key_findings || [
                      `Peak wind speeds reach ${simResult?.max_wind_kph || 145} km/h with ${simResult?.peak_surge_m || 3.2}m storm surge [EVID_MAX_WIND]`,
                      `${(simResult?.cascade?.broken_road_edges_count || 1448).toLocaleString()} arterial road segments impassable [EVID_BROKEN_ROAD_COUNT]`,
                      `${(simResult?.cascade?.population_losing_30min_access || 27465).toLocaleString()} residents lose sub-30min healthcare access [EVID_POP_30MIN_LOSS]`,
                      `${simResult?.cascade?.isolated_facilities_count || 94} public health facilities face road network isolation [EVID_ISOLATED_FAC_COUNT]`
                    ]).map((finding, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded border border-slate-200 text-xs text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="leading-snug">{renderTextWithCitations(finding)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Top Affected Areas (Compact Stat Chips) */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">TOP AFFECTED SECTORS</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {(briefData?.brief?.affected_areas || [
                      { area: "Rajnagar & Tangi Sector", metric: `${simResult?.cascade?.isolated_facilities_count || 94} facilities isolated [EVID_ISOLATED_FAC_COUNT]`, severity: "CRITICAL" },
                      { area: "Kendrapara Low-Lying Plain", metric: `${(simResult?.cascade?.population_losing_30min_access || 27465).toLocaleString()} pop access loss [EVID_POP_30MIN_LOSS]`, severity: "HIGH" },
                      { area: "Bhadrak Coastal Highway", metric: `${(simResult?.cascade?.broken_road_edges_count || 1448).toLocaleString()} edges cut [EVID_BROKEN_ROAD_COUNT]`, severity: "HIGH" }
                    ]).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200 text-xs">
                        <div className="font-semibold text-slate-900">{item.area}</div>
                        <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                          <span>{renderTextWithCitations(item.metric)}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            item.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Recommended Focus (Callout Box) */}
                {briefData?.brief?.recommended_focus && (
                  <div className="bg-blue-50/80 border border-blue-200 p-2.5 rounded-lg text-xs text-blue-950 space-y-0.5">
                    <div className="text-[10px] font-bold text-blue-800 font-mono uppercase">RECOMMENDED FIRST FOCUS</div>
                    <p className="leading-snug">{renderTextWithCitations(briefData.brief.recommended_focus)}</p>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono border-t border-slate-200">
              <span className="text-blue-600 hover:underline cursor-pointer">
                Bundle: {briefData?.evidence_bundle ? Object.keys(briefData.evidence_bundle.evidence_items).length : 6} items
                {briefData?.cached && <span className="ml-1 px-1 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">⚡ CACHED</span>}
              </span>
              <span>Model: <strong className="text-slate-800">{briefData?.brief?.model_name || 'Gemini 3.7 Flash'}</strong></span>
            </div>
          </div>

          {/* SECTION 2: WHAT TO CONSIDER DOING */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 font-sans">
                What to consider doing
              </h3>
              <span className="text-[10px] text-amber-800 font-medium">Prioritized by lead time</span>
            </div>

            <div className="space-y-3">
              {(briefData?.brief?.priority_actions || [
                "Pre-position mobile medical units and emergency generators at key hub facilities prior to causeway overtopping.",
                "Deploy ODRAF / NDRF flood rescue teams along arterial road corridors before landfall.",
                "Activate high-capacity multi-purpose cyclone shelters in coastal blocks with high flood susceptibility."
              ]).map((action, idx) => (
                <div key={idx} className="space-y-1.5 border-b border-amber-200/80 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="text-xs font-semibold text-slate-900 leading-snug">
                      {action}
                    </div>
                  </div>
                  {idx === 0 && (
                    <div className="pl-6 pt-0.5 flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => {
                          if (onOpenAdvisoryModal) onOpenAdvisoryModal();
                          if (onSelectState) onSelectState(10);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] font-semibold text-slate-800 transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <span>Prepare an advisory</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </button>
                      <button 
                        onClick={() => {
                          if (onSelectState) onSelectState(2);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-[11px] font-semibold text-blue-900 transition-all flex items-center gap-1 shadow-2xs font-sans"
                        title="Inspect full list of isolated health facilities"
                      >
                        <span>View all {simResult?.cascade?.isolated_facilities_count ?? 94} facilities &rarr;</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
