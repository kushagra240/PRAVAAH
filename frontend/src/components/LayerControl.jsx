import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronRight, Eye, EyeOff, Box } from 'lucide-react';

export default function LayerControl({ layers, onToggleLayer, is3D, onToggle3D }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-[1000] glass-panel p-3 w-60 shadow-2xl text-xs space-y-2 select-none">
      <div className="flex items-center justify-between font-bold text-gray-200 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Operational Layers</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 2D / 3D Toggle */}
          <button
            onClick={onToggle3D}
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
              is3D ? 'bg-cyan-600 text-white shadow-sm' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle 3D Terrain & Extrusions View"
          >
            <Box className="w-3 h-3" />
            <span>{is3D ? '3D' : '2D'}</span>
          </button>

          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-2 pt-1 text-gray-300">
          {/* Layer toggles */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Hazards</div>
            
            <label className="flex items-center justify-between cursor-pointer hover:bg-gray-800/40 p-1 rounded">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>Flood Susceptibility</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.flood} 
                onChange={() => onToggleLayer('flood')}
                className="accent-cyan-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:bg-gray-800/40 p-1 rounded">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>Wind Field Vectors</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.wind} 
                onChange={() => onToggleLayer('wind')}
                className="accent-cyan-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:bg-gray-800/40 p-1 rounded">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Storm Surge Inundation</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.surge} 
                onChange={() => onToggleLayer('surge')}
                className="accent-cyan-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-gray-800/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Infrastructure</div>
            
            <label className="flex items-center justify-between cursor-pointer hover:bg-gray-800/40 p-1 rounded">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span>Hospitals & Clinics</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.hospitals} 
                onChange={() => onToggleLayer('hospitals')}
                className="accent-cyan-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:bg-gray-800/40 p-1 rounded">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Cyclone Shelters (MPCS)</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.shelters} 
                onChange={() => onToggleLayer('shelters')}
                className="accent-cyan-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:bg-gray-800/40 p-1 rounded">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Arterial Road Network</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.roads} 
                onChange={() => onToggleLayer('roads')}
                className="accent-cyan-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
