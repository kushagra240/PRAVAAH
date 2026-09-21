import React, { useState } from 'react';
import { Activity, ShieldAlert, Route, Users, ChevronRight, Layers } from 'lucide-react';

export default function BottomAnalysisStrip({ 
  currentState = 1, 
  onSelectState = null,
  simResult = null 
}) {
  const [activeTab, setActiveTab] = useState('hazard');

  const vMax = simResult?.cascade?.v_max || 140;
  const isolatedPop = simResult?.cascade?.isolated_population || 184000;

  return (
    <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-4 shrink-0 text-xs select-none shadow-xs">
      {/* Tab Switchers */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 shrink-0">
        <button
          onClick={() => {
            setActiveTab('hazard');
            if (onSelectState) onSelectState(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            activeTab === 'hazard' 
              ? 'bg-[#0F2942] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          HAZARD PROFILE
        </button>

        <button
          onClick={() => {
            setActiveTab('cascade');
            if (onSelectState) onSelectState(8);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            activeTab === 'cascade' || currentState === 8
              ? 'bg-[#0F2942] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          CASCADE ANALYSIS
        </button>

        <button
          onClick={() => {
            setActiveTab('access');
            if (onSelectState) onSelectState(4);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            activeTab === 'access' || currentState === 4
              ? 'bg-[#0F2942] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ACCESSIBILITY
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="flex-1 overflow-x-auto no-scrollbar">
        {activeTab === 'hazard' && (
          <div className="flex items-center justify-around font-mono-num text-xs text-slate-700 font-medium">
            <div>Wind: <span className="font-bold text-slate-900">{simResult?.max_wind_kph || 144.1} km/h</span></div>
            <span className="text-slate-300">|</span>
            <div>Surge Height: <span className="font-bold text-blue-700">{simResult?.peak_surge_m || 3.78} m</span></div>
            <span className="text-slate-300">|</span>
            <div>Max Flood Risk Index: <span className="font-bold text-red-600">{simResult?.flood_probabilities ? Math.max(...simResult.flood_probabilities).toFixed(2) : '0.95'}</span></div>
            <span className="text-slate-300">|</span>
            <div>Cut Roads: <span className="font-bold text-amber-700">{simResult?.cascade?.broken_road_edges_count ?? 1448} segments</span></div>
          </div>
        )}

        {(activeTab === 'cascade' || currentState === 8) && (
          /* Cascade visualization */
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 font-mono">
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200">
              {simResult?.track_fix?.name || 'CYCLONE YAAS'} ({simResult?.track_fix?.p_c || 968} hPa)
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
              FLOOD SURGE ({simResult?.peak_surge_m || 3.78}m)
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 border border-red-200">
              {simResult?.cascade?.broken_road_edges?.[0]?.name || 'NH16 / COASTAL ROAD CORRIDOR'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-[#0F2942] text-white">
              {simResult?.cascade?.isolated_facility_names?.[0] || 'PHC SANATPUR & UGPHC TANGI'} IMPASSABLE
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold">
              {simResult?.cascade?.isolated_facilities_count ?? 94} FACILITIES ISOLATED
            </span>
          </div>
        )}

        {(activeTab === 'access' || currentState === 4) && (
          /* Accessibility travel time distribution */
          <div className="flex items-center gap-6 text-xs text-slate-700">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">Hospital Access:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-slate-500">&lt; 30m:</span>
                <div className="w-24 h-2 bg-slate-100 rounded overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[74%]"></div>
                </div>
                <span className="text-slate-500">30-60m:</span>
                <div className="w-16 h-2 bg-slate-100 rounded overflow-hidden">
                  <div className="h-full bg-amber-500 w-[18%]"></div>
                </div>
                <span className="text-slate-500">&gt; 60m:</span>
                <div className="w-12 h-2 bg-slate-100 rounded overflow-hidden">
                  <div className="h-full bg-red-500 w-[8%]"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 border-l border-slate-200 pl-4 font-mono-num font-bold text-red-600">
              <span>{simResult?.cascade?.isolated_facilities_count ?? 94} health facilities</span>
              <span className="text-slate-500 font-sans font-normal text-[11px]">road-isolated; CHC Rajnagar in 2.5x delay state</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
