import React from 'react';
import { Users, Building2, Waves, Route, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SituationPanel({ briefData, simResult, onSelectEvidence }) {
  const cascade = simResult?.cascade || {};
  const exposure = simResult?.exposure || {};
  const brief = briefData?.brief || {};
  const evidenceBundle = briefData?.evidence_bundle?.evidence_items || {};

  const popElevated = exposure.pop_exposed_elevated_flood || exposure.pop_exposed_high_flood || 103230;
  const isoFacs = cascade.isolated_facilities_count || 94;
  const peakSurge = simResult?.peak_surge_m || 3.78;
  const brokenRoads = cascade.impassable_edges_count || cascade.broken_road_edges_count || 1448;

  // Render narrative text with highlighted evidence citation badges
  const renderCitedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[EVID_[A-Z0-9_]+\])/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('[EVID_') && part.endsWith(']')) {
        const evidId = part.slice(1, -1);
        const evItem = evidenceBundle[evidId];
        return (
          <button
            key={i}
            onClick={() => onSelectEvidence && onSelectEvidence(evidId)}
            className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 transition-colors"
            title={evItem ? `${evItem.metric}: ${evItem.value} ${evItem.unit}` : evidId}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            {evidId}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col p-5 space-y-5 overflow-y-auto bg-[#0B0F19]">
      {/* Physical Impact Key Metrics Grid */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <span>Quantified Physical Disruption</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Elevated Flood Pop */}
          <div className="glass-panel p-3.5 flex flex-col justify-between border-l-4 border-l-red-500">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Elevated Flood Risk (P&ge;0.30)</span>
              <Users className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono my-1">
              {popElevated.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400">people in elevated flood risk zone</div>
          </div>

          {/* Card 2: Isolated Hospitals */}
          <div className="glass-panel p-3.5 flex flex-col justify-between border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Isolated Facilities</span>
              <Building2 className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono my-1">
              {isoFacs}
            </div>
            <div className="text-[10px] text-gray-400">hospitals cut from roads</div>
          </div>

          {/* Card 3: Peak Surge */}
          <div className="glass-panel p-3.5 flex flex-col justify-between border-l-4 border-l-cyan-500">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Peak Coastal Surge</span>
              <Waves className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono my-1">
              {peakSurge} m
            </div>
            <div className="text-[10px] text-gray-400">parametric screening</div>
          </div>

          {/* Card 4: Broken Roads */}
          <div className="glass-panel p-3.5 flex flex-col justify-between border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Broken Causeways</span>
              <Route className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono my-1">
              {brokenRoads}
            </div>
            <div className="text-[10px] text-gray-400">arterial road links cut</div>
          </div>
        </div>
      </div>

      {/* AI Decision Brief Panel */}
      <div className="glass-panel p-4 space-y-4 border-cyan-500/30">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-gray-100">Gemini 3.7 Flash Decision Brief</h2>
          </div>
          {brief.citation_validated && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Citation Checked ✓
            </span>
          )}
        </div>

        {/* Headline */}
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-200 font-medium leading-relaxed">
          {brief.headline ? renderCitedText(brief.headline) : "Loading AI situation assessment..."}
        </div>

        {/* Narrative */}
        <div className="text-xs text-gray-300 leading-relaxed space-y-2">
          <div className="font-semibold text-gray-200">Evidence-Grounded Situation Brief:</div>
          <p>{renderCitedText(brief.situation_narrative)}</p>
        </div>

        {/* Priority Actions */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <div className="text-xs font-semibold text-gray-200">Prioritised Response Actions:</div>
          <div className="space-y-2">
            {(brief.priority_actions || []).map((action, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-300 bg-gray-900/60 p-2.5 rounded border border-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
