import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function DeltaComparison({ baselineResult, scenarioResult }) {
  if (!scenarioResult || scenarioResult.provenance !== 'SIMULATED') {
    return (
      <div className="glass-panel p-3.5 text-xs text-gray-400 font-mono text-center">
        Adjust sliders above to trigger real-time Baseline vs Scenario delta computation.
      </div>
    );
  }

  const baseCascade = baselineResult?.cascade || {};
  const scnCascade = scenarioResult?.cascade || {};

  const basePop = baseCascade.population_losing_30min_access || 184000;
  const scnPop = scnCascade.population_losing_30min_access || 184000;
  const popDelta = scnPop - basePop;

  const baseFac = baseCascade.isolated_facilities_count || 4;
  const scnFac = scnCascade.isolated_facilities_count || 4;
  const facDelta = scnFac - baseFac;

  const baseRoad = baseCascade.broken_road_edges_count || 12;
  const scnRoad = scnCascade.broken_road_edges_count || 12;
  const roadDelta = scnRoad - baseRoad;

  const baseSurge = baselineResult?.peak_surge_m || 3.2;
  const scnSurge = scenarioResult?.peak_surge_m || 3.2;
  const surgeDelta = scnSurge - baseSurge;

  return (
    <div className="glass-panel p-4 space-y-3 border-orange-500/40">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="text-xs font-bold text-gray-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          <span>Baseline vs Scenario Impact Delta</span>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800 font-bold">
          Simulated Diff
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Metric 1: Pop Loss */}
        <div className="bg-gray-900/80 p-2.5 rounded border border-gray-800 flex flex-col justify-between">
          <div className="text-[10px] text-gray-400">Pop Access Loss (&lt;30m)</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-white">{scnPop.toLocaleString()}</span>
            <span className={`text-[11px] font-bold flex items-center ${popDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {popDelta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {popDelta > 0 ? `+${popDelta.toLocaleString()}` : popDelta.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 2: Isolated Facilities */}
        <div className="bg-gray-900/80 p-2.5 rounded border border-gray-800 flex flex-col justify-between">
          <div className="text-[10px] text-gray-400">Isolated Facilities</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-white">{scnFac}</span>
            <span className={`text-[11px] font-bold flex items-center ${facDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {facDelta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {facDelta > 0 ? `+${facDelta}` : facDelta}
            </span>
          </div>
        </div>

        {/* Metric 3: Broken Causeways */}
        <div className="bg-gray-900/80 p-2.5 rounded border border-gray-800 flex flex-col justify-between">
          <div className="text-[10px] text-gray-400">Cut Road Links</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-white">{scnRoad}</span>
            <span className={`text-[11px] font-bold flex items-center ${roadDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {roadDelta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {roadDelta > 0 ? `+${roadDelta}` : roadDelta}
            </span>
          </div>
        </div>

        {/* Metric 4: Peak Surge */}
        <div className="bg-gray-900/80 p-2.5 rounded border border-gray-800 flex flex-col justify-between">
          <div className="text-[10px] text-gray-400">Peak Surge (m)</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-white">{scnSurge.toFixed(1)}m</span>
            <span className={`text-[11px] font-bold flex items-center ${surgeDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {surgeDelta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {surgeDelta > 0 ? `+${surgeDelta.toFixed(1)}m` : `${surgeDelta.toFixed(1)}m`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
