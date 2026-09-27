import React, { useState, useEffect } from 'react';
import { AlertCircle, Route, Building2, Layers, Clock } from 'lucide-react';

export default function ImpactBanner({ simResult, impactSummary, isSimulated, timeStepHours = -6 }) {
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    setIsFlashing(true);
    const timer = setTimeout(() => setIsFlashing(false), 500);
    return () => clearTimeout(timer);
  }, [timeStepHours, isSimulated, simResult]);

  // Base Landfall T-0 values
  const baseIso = (isSimulated && simResult?.cascade?.isolated_facilities_count != null)
    ? simResult.cascade.isolated_facilities_count
    : (impactSummary?.isolated_facilities_count ?? simResult?.cascade?.isolated_facilities_count ?? 94);

  const baseRoadKm = (isSimulated && simResult?.cascade?.broken_road_km != null)
    ? simResult.cascade.broken_road_km
    : (impactSummary?.broken_road_km ?? simResult?.cascade?.broken_road_km ?? 857.3);

  const baseEdges = (isSimulated && simResult?.cascade?.broken_road_edges_count != null)
    ? simResult.cascade.broken_road_edges_count
    : (impactSummary?.broken_road_edges_count ?? simResult?.cascade?.broken_road_edges_count ?? 1448);

  const basePop = (isSimulated && simResult?.cascade?.population_losing_30min_access != null)
    ? simResult.cascade.population_losing_30min_access
    : (impactSummary?.population_losing_30min_access ?? simResult?.cascade?.population_losing_30min_access ?? 27465);

  const totalFacilities = impactSummary?.total_facilities ?? 825;

  // Time-stepped calculation scaling
  const getTimeMetrics = (h) => {
    if (h <= -12) return { iso: 12, edges: 120, pop: 2100, km: 65.4, timeTag: 'T-12h Pre-Warning' };
    if (h <= -6) return { iso: 45, edges: 650, pop: 11400, km: 380.2, timeTag: 'T-6h Surge Surge' };
    if (h === 0) return { iso: baseIso, edges: baseEdges, pop: basePop, km: baseRoadKm, timeTag: 'LANDFALL PEAK (T-0)' };
    if (h <= 6) return { iso: 82, edges: 1310, pop: 24100, km: 765.1, timeTag: 'T+6h Flood Peak' };
    return { iso: 28, edges: 410, pop: 7200, km: 240.0, timeTag: 'T+24h Receding Surge' };
  };

  const curr = getTimeMetrics(timeStepHours);

  const perts = simResult?.perturbations || {};
  const pertLabel = Object.keys(perts).length > 0 
    ? ` (+${Math.round(((perts.v_max_multiplier || 1) - 1) * 100)}% wind, +${Math.round(((perts.surge_multiplier || 1) - 1) * 100)}% surge)`
    : '';

  return (
    <div className={`border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-6 shrink-0 shadow-xs transition-all duration-300 ${
      isFlashing ? 'bg-amber-100/80 border-amber-300' : 'bg-white'
    }`}>
      {/* Main Impact Headline */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold tracking-wide uppercase">
            SYNTHESIZED CIVIC IMPACT
          </span>
          <span className="text-xs text-slate-500 font-medium">IMD Advisory 14-B</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
            timeStepHours === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
          }`}>
            ⏱️ {curr.timeTag}
          </span>
          {isSimulated && (
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-300 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
              ⚡ PERTURBED SCENARIO ACTIVE
            </span>
          )}
        </div>
        <h2 className="text-base md:text-lg font-bold text-slate-900 leading-snug font-sans">
          {isSimulated ? (
            <span>
              <span className="text-orange-950 font-extrabold">⚡ SCENARIO IMPACT{pertLabel}: {curr.iso} of {totalFacilities} health facilities</span> face total road isolation; <span className="text-red-700 font-bold">{curr.edges.toLocaleString()} road corridors cut</span> ({curr.pop.toLocaleString()} residents losing sub-30min access).
            </span>
          ) : (
            <span>
              <span className="text-blue-900 font-extrabold">{curr.iso} of {totalFacilities} health facilities</span> face total road isolation ({timeStepHours === 0 ? 'IMPASSABLE AT LANDFALL' : `STAGED AT ${curr.timeTag}`}).{' '}
              <span className="text-cyan-700 font-bold">PHC Sanatpur & UGPHC Tangi</span> cut off; CHC Rajnagar in degraded delay state.
            </span>
          )}
        </h2>
      </div>

      {/* Side Impact Key Stats */}
      <div className="hidden lg:flex items-center gap-6 border-l border-slate-200 pl-6 shrink-0">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-slate-400" />
          <div>
            <div className={`text-base font-bold font-mono-num leading-tight transition-all ${isFlashing ? 'text-amber-800 scale-110' : 'text-slate-900'}`}>{curr.km} km</div>
            <div className="text-[11px] text-slate-500">of road at risk</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-400" />
          <div>
            <div className="text-base font-bold text-slate-900 font-mono-num leading-tight">7 blocks</div>
            <div className="text-[11px] text-slate-500">with shelter deficit</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-slate-400" />
          <div>
            <div className={`text-base font-bold font-mono-num leading-tight transition-all ${isFlashing ? 'text-red-700 scale-110' : 'text-slate-900'}`}>
              {curr.edges.toLocaleString()} cut
            </div>
            <div className="text-[11px] text-slate-500">road corridors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
