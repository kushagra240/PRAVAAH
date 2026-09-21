import React from 'react';
import { Layers, Activity, AlertTriangle, Eye, Sliders, GitMerge, FileText, CheckCircle2, MapPin } from 'lucide-react';

export default function StatePresetsBar({ currentState, onSelectState }) {
  const states = [
    { id: 1, label: '1. Command Center', icon: Activity, tooltip: 'Default Command Center Overview' },
    { id: 2, label: '2. Hospital Selected', icon: MapPin, tooltip: 'PHC Sanatpur (IMPASSABLE) & CHC Rajnagar (DEGRADED)' },
    { id: 3, label: '3. Road Cut', icon: AlertTriangle, tooltip: 'NH16 Coastal Road Disruption' },
    { id: 4, label: '4. Flood Layer', icon: Layers, tooltip: 'Active H3 & Inundation Depth Risk Overlay' },
    { id: 5, label: '5. Landfall (T-0)', icon: Eye, tooltip: 'Timeline at Peak Landfall Impact' },
    { id: 6, label: '6. Scenario Sim', icon: Sliders, tooltip: 'Interactive Wind/Rain/Surge Scenario Simulator' },
    { id: 7, label: '7. Scenario Delta', icon: GitMerge, tooltip: 'Baseline vs Perturbed Scenario Delta Comparison' },
    { id: 8, label: '8. Cascade Chain', icon: Activity, tooltip: 'Spatiotemporal Hazard-to-Population Cascade' },
    { id: 9, label: '9. AI Situation Brief', icon: FileText, tooltip: 'Gemini Decision Brief & Priority Considerations' },
    { id: 10, label: '10. Advisory Workflow', icon: CheckCircle2, tooltip: 'Draft → Review → Approve → Dispatch Advisory' }
  ];

  return (
    <div className="bg-[#0F172A] text-white px-4 py-1.5 flex items-center justify-between border-b border-gray-800 shrink-0 text-xs z-40">
      <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400 font-semibold shrink-0">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>DEMO PRESETS:</span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {states.map(s => {
          const Icon = s.icon;
          const isActive = currentState === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectState(s.id)}
              title={s.tooltip}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isActive 
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold' 
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
