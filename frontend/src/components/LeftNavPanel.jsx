import React from 'react';
import { Map, Users, Home, Sliders, Waves, CheckSquare, Radio, Eye, Layers } from 'lucide-react';

export default function LeftNavPanel({ 
  activeNav, 
  setActiveNav, 
  layers, 
  toggleLayer,
  currentState,
  onSelectState
}) {
  const navItems = [
    { id: 'map', label: 'Map', icon: Map, statePreset: 1 },
    { id: 'risk', label: "Who's at risk", icon: Users, statePreset: 4 },
    { id: 'shelters', label: 'Shelters', icon: Home, statePreset: 1 },
    { id: 'scenario', label: 'Try a scenario', icon: Sliders, statePreset: 6 },
    { id: 'river', label: 'River levels', icon: Waves, statePreset: 4 },
    { id: 'actions', label: 'What to do', icon: CheckSquare, statePreset: 9 }
  ];

  return (
    <div className="w-[220px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto p-3 gap-4 select-none">
      {/* Look Around Nav Menu */}
      <div className="space-y-1">
        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-2 mb-2 font-mono">
          LOOK AROUND
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                if (item.statePreset) onSelectState(item.statePreset);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                isActive 
                  ? 'bg-[#0F2942] text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <hr className="border-slate-200" />

      {/* Map Layer Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>LAYERS</span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-700">
          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
            <input 
              type="checkbox" 
              checked={layers.cyclone} 
              onChange={() => toggleLayer('cyclone')} 
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
            />
            <span className="font-medium">Cyclone Track & Eye</span>
          </label>

          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
            <input 
              type="checkbox" 
              checked={layers.wind} 
              onChange={() => toggleLayer('wind')} 
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
            />
            <span>Wind Field Cones</span>
          </label>

          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
            <input 
              type="checkbox" 
              checked={layers.flood} 
              onChange={() => toggleLayer('flood')} 
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
            />
            <span className="font-medium text-blue-900">Flood Risk (H3 Cells)</span>
          </label>

          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
            <input 
              type="checkbox" 
              checked={layers.roads} 
              onChange={() => toggleLayer('roads')} 
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
            />
            <span>Roads & Breaches</span>
          </label>

          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
            <input 
              type="checkbox" 
              checked={layers.hospitals} 
              onChange={() => toggleLayer('hospitals')} 
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
            />
            <span className="font-medium">Hospitals & CHCs</span>
          </label>

          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
            <input 
              type="checkbox" 
              checked={layers.shelters} 
              onChange={() => toggleLayer('shelters')} 
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" 
            />
            <span>Cyclone Shelters</span>
          </label>
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-2">
        {/* Telemetry Badge 1 */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Live data from Paradip station</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            Continuous telemetry · Updated 3m ago
          </div>
        </div>

        {/* Telemetry Badge 2 */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
            <Radio className="w-3 h-3 text-cyan-600" />
            <span>IMD Doppler Radar</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            Paradip Active Telemetry cycle synchronized 3m ago
          </div>
        </div>
      </div>
    </div>
  );
}
