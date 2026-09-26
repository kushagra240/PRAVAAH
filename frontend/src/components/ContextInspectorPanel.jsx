import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldAlert, AlertTriangle, Building2, CheckCircle, CheckCircle2, FileText, ChevronRight, HelpCircle, Layers, Sliders, RefreshCw, Send } from 'lucide-react';

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
          {/* SECTION 1: WHAT'S HAPPENING — STRUCTURED AI BRIEF */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">What's happening</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                briefData?.brief?.provenance === 'LIVE_GEMINI'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{briefData?.brief?.provenance === 'LIVE_GEMINI' ? 'LIVE GEMINI 3.7' : 'AI NARRATIVE'}</span>
              </span>
            </div>

            {briefData?.brief?.notice && (
              <div className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded font-medium flex items-center justify-between">
                <span>⚠️ {briefData.brief.notice}</span>
              </div>
            )}

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
