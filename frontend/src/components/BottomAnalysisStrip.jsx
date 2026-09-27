import React, { useState } from 'react';
import { Activity, ShieldAlert, Route, Users, ChevronRight, Layers } from 'lucide-react';

export default function BottomAnalysisStrip({ 
  currentState = 1, 
  onSelectState = null,
  simResult = null,
  timeStepHours = -6
}) {
  const [activeTab, setActiveTab] = React.useState('hazard');

  // Dynamic time-stepped telemetry values
  const getTimeStepData = (h) => {
    if (h <= -12) return { wind: 75.0, surge: 1.10, floodIndex: 0.35, cutRoads: 120, isolatedFacs: 12 };
    if (h <= -6) return { wind: 115.0, surge: 2.40, floodIndex: 0.65, cutRoads: 650, isolatedFacs: 45 };
    if (h === 0) return { 
      wind: simResult?.max_wind_kph || 144.1, 
      surge: simResult?.peak_surge_m || 3.78, 
      floodIndex: 0.95, 
      cutRoads: simResult?.cascade?.broken_road_edges_count ?? 1448, 
      isolatedFacs: simResult?.cascade?.isolated_facilities_count ?? 94 
    };
    if (h <= 6) return { wind: 105.0, surge: 3.20, floodIndex: 0.80, cutRoads: 1310, isolatedFacs: 82 };
    return { wind: 45.0, surge: 1.50, floodIndex: 0.40, cutRoads: 410, isolatedFacs: 28 };
  };

  const currentMetrics = getTimeStepData(timeStepHours);

  // Sync activeTab if currentState specifies a tab preset
  React.useEffect(() => {
    if (currentState === 8) setActiveTab('cascade');
    else if (currentState === 4) setActiveTab('access');
  }, [currentState]);

  return (
    <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-4 shrink-0 text-xs select-none shadow-xs">
      {/* Tab Switchers */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 shrink-0">
        <button
          onClick={() => {
            setActiveTab('hazard');
            if (onSelectState) onSelectState(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
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
          className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'cascade'
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
          className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'access'
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
            <div>Wind: <span className="font-bold text-slate-900">{currentMetrics.wind} km/h</span></div>
            <span className="text-slate-300">|</span>
            <div>Surge Height: <span className="font-bold text-blue-700">{currentMetrics.surge} m</span></div>
            <span className="text-slate-300">|</span>
            <div>Max Flood Risk Index: <span className="font-bold text-red-600">{currentMetrics.floodIndex.toFixed(2)}</span></div>
            <span className="text-slate-300">|</span>
            <div>Cut Roads: <span className="font-bold text-amber-700">{currentMetrics.cutRoads.toLocaleString()} segments</span></div>
          </div>
        )}

        {activeTab === 'cascade' && (
          /* Cascade visualization */
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 font-mono">
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200">
              {simResult?.track_fix?.name || 'CYCLONE YAAS'} ({simResult?.track_fix?.p_c || 968} hPa)
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
              FLOOD SURGE ({currentMetrics.surge}m)
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 border border-red-200">
              NH16 / COASTAL ROAD CORRIDOR ({currentMetrics.cutRoads.toLocaleString()} SEVERED)
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-[#0F2942] text-white">
              PHC SANATPUR & UGPHC TANGI IMPASSABLE
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold">
              {currentMetrics.isolatedFacs} FACILITIES ISOLATED
            </span>
          </div>
        )}

        {activeTab === 'access' && (
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
              <span>{currentMetrics.isolatedFacs} health facilities</span>
              <span className="text-slate-500 font-sans font-normal text-[11px]">road-isolated; CHC Rajnagar in 2.5x delay state</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
