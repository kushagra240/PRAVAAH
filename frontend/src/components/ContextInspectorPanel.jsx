import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldAlert, AlertTriangle, Building2, CheckCircle, FileText, ChevronRight, HelpCircle, Layers, Sliders, RefreshCw, Send } from 'lucide-react';

export default function ContextInspectorPanel({ 
  currentState = 1, 
  onSelectState = null,
  selectedAsset = null,
  onClearSelectedAsset = null,
  simResult = null,
  briefData = null,
  onOpenAdvisoryModal = null,
  onRunScenario = null,
  isSimulating = false
}) {
  const [perturbations, setPerturbations] = useState({ v_max_multiplier: 1.10, rain_multiplier: 1.20, surge_multiplier: 1.15 });

  // Handle asset click / selection
  const isHospitalSelected = currentState === 2 || selectedAsset?.asset_type === 'hospital';
  const isRoadSelected = currentState === 3 || selectedAsset?.asset_type === 'road';
  const isScenarioState = currentState === 6 || currentState === 7;
  const isCascadeState = currentState === 8;
  const isAIBriefState = currentState === 9;
  const isAdvisoryState = currentState === 10;

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
            <h3 className="text-lg font-bold text-slate-900 leading-tight">RAJNAGAR CHC</h3>
            <p className="text-xs text-slate-500">Community Health Centre · Kendrapara Block</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
            <div className="text-[10px] font-bold tracking-wider text-red-700 uppercase font-mono">STATUS</div>
            <div className="text-sm font-bold text-red-900 flex items-center justify-between">
              <span>Degraded access</span>
              <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px]">SEVERE</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">ACCESS DELTA</div>
              <div className="text-base font-bold text-red-600 font-mono-num">+37 min</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">FLOOD PROBABILITY</div>
              <div className="text-base font-bold text-slate-900 font-mono-num">0.78</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">ROAD CONNECTION</div>
              <div className="text-xs font-bold text-slate-800">SH-60 / SH-9A</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">POPULATION IMPACT</div>
              <div className="text-base font-bold text-slate-900 font-mono-num">184,000</div>
            </div>
          </div>

          {/* WHY SECTION (Prompt requirement #14) */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 space-y-1.5">
            <div className="text-[10px] font-bold text-amber-800 uppercase font-mono flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-amber-600" />
              <span>WHY HAS ACCESS DEGRADED?</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-medium">
              Causeway overtopping at Maitapur levee + direct road link failure on SH-9A cuts primary ambulance route from Chandbali Staging Depot.
            </p>
          </div>

          <button 
            onClick={() => {
              if (onOpenAdvisoryModal) onOpenAdvisoryModal();
              if (onSelectState) onSelectState(10);
            }}
            className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-md shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Draft Action Advisory for Rajnagar</span>
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
            <h3 className="text-base font-bold text-slate-900">SH-9A (MAITAPUR CAUSEWAY)</h3>
            <p className="text-xs text-slate-500">State Highway Link · Rajnagar-Chandbali Corridor</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-1">
            <div className="text-[10px] font-bold text-red-700 uppercase font-mono">CURRENT STATUS</div>
            <div className="text-sm font-bold text-red-900">CUT / OVERTOPPED (0.9m flood depth)</div>
            <div className="text-xs text-slate-600">Water levels exceed safe vehicle clearance.</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-md space-y-2 text-xs">
            <div className="font-bold text-slate-800">AFFECTED DEPENDENCIES</div>
            <div className="text-slate-600">• Rajnagar Community Health Centre (Ambulances blocked)</div>
            <div className="text-slate-600">• 41,000 residents in Maitapur Panchayati Raj</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-xs space-y-1">
            <div className="font-bold text-blue-950">RECOMMENDED DETOUR</div>
            <div className="text-blue-900">Reroute via Western Bypass (SH-60). Adds +24 min travel time but remains 100% dry.</div>
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
            <div className="text-[10px] font-bold text-amber-800 uppercase font-mono">BASELINE → SCENARIO DELTA</div>
            <div className="space-y-1.5 text-slate-800">
              <div className="flex justify-between border-b border-amber-200 pb-1 font-medium">
                <span>Affected Road Links</span>
                <span className="font-bold text-red-600 font-mono-num">
                  +{simResult?.cascade?.broken_road_edges_count ?? 3} links
                </span>
              </div>
              <div className="flex justify-between border-b border-amber-200 pb-1 font-medium">
                <span>Isolated Health Facilities</span>
                <span className="font-bold text-red-600 font-mono-num">
                  +{simResult?.cascade?.isolated_facilities_count ?? 2} facilities
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Pop Beyond 30m Access</span>
                <span className="font-bold text-red-700 font-mono-num">
                  +{(simResult?.cascade?.population_losing_30min_access ?? 84000).toLocaleString()} people
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 4. STATE 1 DEFAULT COMMAND CENTER */
        <div className="space-y-4">
          {/* SECTION 1: WHAT'S HAPPENING */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-sans">What's happening</h3>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>{briefData?.brief?.citation_validated ? 'CITATION VERIFIED' : 'AI-ASSISTED'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-2 rounded border border-slate-200">
              {briefData?.brief?.situation_narrative || "Under baseline forecast, health facilities may lose road access due to coastal storm surge and causeway inundation."}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white border border-slate-200 p-2 rounded">
                <div className="text-base font-bold text-slate-900 font-mono-num">{simResult?.cascade?.isolated_facilities_count ?? 12} facilities</div>
                <div className="text-[10px] text-slate-500">road-isolated</div>
              </div>
              <div className="bg-white border border-slate-200 p-2 rounded">
                <div className="text-base font-bold text-slate-900 font-mono-num">{simResult?.cascade?.broken_road_edges_count ?? 4} corridors</div>
                <div className="text-[10px] text-slate-500">inundated</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono border-t border-slate-200">
              <span className="text-blue-600 hover:underline cursor-pointer">Grounding bundle: {briefData?.evidence_bundle ? Object.keys(briefData.evidence_bundle.evidence_items).length : 6} items</span>
              <span>Model: <strong className="text-slate-800">Gemini 3.7 Flash</strong></span>
            </div>
          </div>

          {/* SECTION 2: WHAT TO CONSIDER DOING */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3.5 space-y-3">
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
                    <div className="pl-6 pt-0.5">
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
