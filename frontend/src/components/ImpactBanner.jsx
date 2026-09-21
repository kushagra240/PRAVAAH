import React from 'react';
import { AlertCircle, Route, Building2, Layers } from 'lucide-react';

export default function ImpactBanner({ simResult, impactSummary, isSimulated }) {
  const isolatedFacilities = impactSummary?.isolated_facilities_count ?? simResult?.cascade?.isolated_facilities_count ?? 12;
  const totalFacilities = impactSummary?.total_facilities ?? 34;
  const isolatedPop = impactSummary?.population_losing_30min_access ?? simResult?.cascade?.isolated_population ?? 184000;
  const brokenRoadKm = impactSummary?.broken_road_km ?? simResult?.cascade?.broken_road_km ?? 86;

  return (
    <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-6 shrink-0 shadow-xs">
      {/* Main Impact Headline */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold tracking-wide uppercase">
            SYNTHESIZED CIVIC IMPACT
          </span>
          <span className="text-xs text-slate-500 font-medium">IMD Advisory 14-B</span>
          {(impactSummary?.provenance_class === 'FIXTURE' || simResult?.provenance_class === 'FIXTURE') && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              ⚠ FIXTURE DATA (GEOSPATIAL/NETWORK)
            </span>
          )}
          {isSimulated && (
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold uppercase">
              Perturbed Scenario
            </span>
          )}
        </div>
        <h2 className="text-base md:text-lg font-bold text-slate-900 leading-snug font-sans">
          <span className="text-blue-900 font-extrabold">{isolatedFacilities} of {totalFacilities} health facilities</span> may lose road access.{' '}
          <span className="text-cyan-700 font-extrabold">{isolatedPop.toLocaleString()} people</span> move beyond 30 minutes of critical care.
        </h2>
      </div>

      {/* Side Impact Key Stats */}
      <div className="hidden lg:flex items-center gap-6 border-l border-slate-200 pl-6 shrink-0">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-slate-400" />
          <div>
            <div className="text-base font-bold text-slate-900 font-mono-num leading-tight">{brokenRoadKm} km</div>
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
            <div className="text-base font-bold text-slate-900 font-mono-num leading-tight">
              {impactSummary?.broken_road_edges_count ?? simResult?.cascade?.broken_road_edges_count ?? 4} cut
            </div>
            <div className="text-[11px] text-slate-500">road corridors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
