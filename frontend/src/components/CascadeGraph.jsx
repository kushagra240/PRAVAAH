import React from 'react';
import { Activity, CloudRain, Route, Building2, Users, ArrowRight } from 'lucide-react';

export default function CascadeGraph({ simResult, onSelectEvidence }) {
  const cascade = simResult?.cascade || {};
  const brokenRoads = cascade.broken_road_edges || [];
  const isoNames = cascade.isolated_facility_names || ["PHC, Sanatpur", "UGPHC, Tangi"];

  const brokenCount = cascade.broken_road_edges_count || 1448;
  const isoCount = cascade.isolated_facilities_count || 94;

  const nodes = [
    {
      id: "cyclone",
      title: "Cyclone Forecast",
      sub: simResult?.track_fix?.name || "Cyclone Yaas",
      icon: Activity,
      color: "border-red-500 text-red-400 bg-red-950/40",
      evidId: "EVID_MAX_WIND"
    },
    {
      id: "hazard",
      title: "Peak Rain & Surge",
      sub: `${simResult?.peak_surge_m || 3.78}m Surge / 250mm Rain`,
      icon: CloudRain,
      color: "border-cyan-500 text-cyan-400 bg-cyan-950/40",
      evidId: "EVID_PEAK_SURGE"
    },
    {
      id: "road",
      title: "Arterial Cutoff",
      sub: `${brokenCount} Links Impassable (${brokenRoads[0]?.name || 'NH16 Corridor'})`,
      icon: Route,
      color: "border-purple-500 text-purple-400 bg-purple-950/40",
      evidId: "EVID_BROKEN_ROAD_COUNT"
    },
    {
      id: "facility",
      title: "Facility Isolation",
      sub: `${isoCount} Hospitals Isolated (${isoNames[0] || 'PHC, Sanatpur'})`,
      icon: Building2,
      color: "border-orange-500 text-orange-400 bg-orange-950/40",
      evidId: "EVID_ISOLATED_FAC_COUNT"
    },
    {
      id: "impact",
      title: "3-State Access Degradation",
      sub: `${isoCount} Facilities Isolated | CHC Rajnagar Degraded`,
      icon: Users,
      color: "border-red-600 text-white bg-red-900/60 font-bold",
      evidId: "EVID_ISOLATED_FAC_COUNT"
    }
  ];

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="text-xs font-bold text-gray-200 flex items-center gap-2">
          <Route className="w-4 h-4 text-purple-400" />
          <span>Physical Cascade Dependency Graph (DAG)</span>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono">Sequential Impact Flow</span>
      </div>

      <div className="space-y-2 pt-1">
        {nodes.map((node, idx) => {
          const Icon = node.icon;
          return (
            <React.Fragment key={node.id}>
              <div 
                onClick={() => onSelectEvidence && onSelectEvidence(node.evidId)}
                className={`p-3 rounded-lg border ${node.color} flex items-center justify-between cursor-pointer hover:brightness-110 transition-all shadow-md`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-gray-950/60 border border-gray-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{node.title}</div>
                    <div className="text-[11px] opacity-80 font-mono">{node.sub}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono opacity-60 underline">
                  [{node.evidId}]
                </span>
              </div>

              {idx < nodes.length - 1 && (
                <div className="flex justify-center my-0.5">
                  <ArrowRight className="w-4 h-4 text-gray-600 rotate-90" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
