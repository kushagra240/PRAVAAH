import React from 'react';
import { Droplets, Clock, Waves, Activity, Wind, Gauge } from 'lucide-react';

export default function TelemetryBar({ trackFix, simResult, isSimulated, timeStepHours = -6 }) {
  const vMax = trackFix?.v_max || 140;
  const pC = trackFix?.p_c || 968;
  const tString = timeStepHours === 0 ? 'LANDFALL (T-0)' : timeStepHours < 0 ? `T${timeStepHours}h` : `T+${timeStepHours}h`;

  return (
    <div className="h-8 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600 shrink-0 select-none">
      {/* Left status info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-blue-700 font-medium">
          <Droplets className="w-3.5 h-3.5 text-blue-500" />
          <span>Bhadrak & Kendrapara coast</span>
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1 text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Expected landfall in about 42 hours</span>
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1 text-slate-700">
          <Waves className="w-3.5 h-3.5 text-slate-400" />
          <span>High sea swell (4.2 m)</span>
        </div>
      </div>

      {/* Right operational telemetry metrics */}
      <div className="flex items-center gap-4 font-mono-num text-[11px]">
        <div className="flex items-center gap-1 bg-slate-200/60 px-2 py-0.5 rounded text-slate-700">
          <Wind className="w-3 h-3 text-slate-500" />
          <span className="font-semibold">{vMax} km/h</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-200/60 px-2 py-0.5 rounded text-slate-700">
          <Gauge className="w-3 h-3 text-slate-500" />
          <span className="font-semibold">{pC} hPa</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-800 font-mono text-[10px] font-semibold bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>HEURISTIC FLOOD SCREENING (ASSUMPTION)</span>
        </div>
      </div>
    </div>
  );
}
