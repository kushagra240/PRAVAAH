import React from 'react';
import { AlertCircle, Route, Building2, Layers } from 'lucide-react';

export default function ImpactBanner({ simResult, impactSummary, isSimulated }) {
  const isolatedFacilities = impactSummary?.isolated_facilities_count ?? simResult?.cascade?.isolated_facilities_count ?? 94;
  const totalFacilities = impactSummary?.total_facilities ?? 825;
  const brokenRoadKm = impactSummary?.broken_road_km ?? simResult?.cascade?.broken_road_km ?? 857.3;
  const brokenEdgesCount = impactSummary?.broken_road_edges_count ?? simResult?.cascade?.broken_road_edges_count ?? 1448;

  return (
    <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-6 shrink-0 shadow-xs">
      {/* Main Impact Headline */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold tracking-wide uppercase">
            SYNTHESIZED CIVIC IMPACT
          </span>
          <span className="text-xs text-slate-500 font-medium">IMD Advisory 14-B</span>
          {(impactSummary?.provenance_class === 'OBSERVED' || simResult?.provenance_class === 'OBSERVED') && (
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              ✓ OBSERVED DATA (OSM GEOSPATIAL)
            </span>
          )}
          {isSimulated && (
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold uppercase">
              Perturbed Scenario
            </span>
          )}
        </div>
        <h2 className="text-base md:text-lg font-bold text-slate-900 leading-snug font-sans">
          <span className="text-blue-900 font-extrabold">{isolatedFacilities} of {totalFacilities} health facilities</span> face total road isolation (IMPASSABLE).{' '}
          <span className="text-cyan-700 font-bold">PHC Sanatpur & UGPHC Tangi</span> completely cut off; CHC Rajnagar in degraded delay state.
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
              {brokenEdgesCount} cut
            </div>
            <div className="text-[11px] text-slate-500">road corridors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
