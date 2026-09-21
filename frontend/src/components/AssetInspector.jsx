import React, { useState } from 'react';
import { Building2, Shield, Route, Search, Filter } from 'lucide-react';

export default function AssetInspector({ simResult, facilities = [], shelters = [], roadNetwork = null }) {
  const [assetType, setAssetType] = useState('health');
  const [searchTerm, setSearchTerm] = useState('');

  const facEvals = simResult?.facility_evaluations || [];
  const brokenEdges = simResult?.cascade?.broken_road_edges || [];
  const brokenEdgeSet = new Set(brokenEdges.map(e => e.edge_id));

  const filteredFacilities = facEvals.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.block.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShelters = shelters.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.block.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const edges = roadNetwork?.edges || [];
  const filteredEdges = edges.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-5 space-y-4 overflow-y-auto bg-[#0B0F19]">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-gray-100">Asset & Infrastructure Drilldown</h2>
        </div>

        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs">
          <button
            onClick={() => setAssetType('health')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              assetType === 'health' ? 'bg-cyan-600 text-white' : 'text-gray-400'
            }`}
          >
            Hospitals ({facilities.length})
          </button>
          <button
            onClick={() => setAssetType('shelters')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              assetType === 'shelters' ? 'bg-cyan-600 text-white' : 'text-gray-400'
            }`}
          >
            Shelters ({shelters.length})
          </button>
          <button
            onClick={() => setAssetType('roads')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              assetType === 'roads' ? 'bg-cyan-600 text-white' : 'text-gray-400'
            }`}
          >
            Road Links ({edges.length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        <input 
          type="text" 
          placeholder="Filter assets by name or block..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {assetType === 'health' && filteredFacilities.map(f => (
          <div key={f.asset_id} className="glass-panel p-3.5 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-red-400" />
                  <span>{f.name}</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {f.type} · Block: {f.block} ({f.district})
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                f.status === 'inundated_or_isolated'
                  ? 'bg-red-950 text-red-400 border-red-800'
                  : f.status === 'degraded_access'
                  ? 'bg-orange-950 text-orange-400 border-orange-800'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}>
                {f.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] bg-gray-900/60 p-2 rounded border border-gray-800/80 font-mono text-gray-300">
              <div>Beds: <span className="text-gray-100 font-bold">{f.bed_capacity}</span></div>
              <div>Generator: <span className={f.backup_generator === 'present' ? 'text-emerald-400' : 'text-red-400'}>{f.backup_generator}</span></div>
              <div>Flood P: <span className="text-cyan-400">{(f.flood_probability*100).toFixed(0)}%</span></div>
            </div>
          </div>
        ))}

        {assetType === 'shelters' && filteredShelters.map(s => (
          <div key={s.asset_id} className="glass-panel p-3.5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>{s.name}</span>
              </div>
              <div className="text-[11px] text-gray-400">
                Block: {s.block} · Elevation: {s.elevation_m}m
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold font-mono text-emerald-400">{s.capacity}</div>
              <div className="text-[10px] text-gray-400">capacity</div>
            </div>
          </div>
        ))}

        {assetType === 'roads' && filteredEdges.map(e => {
          const isCut = brokenEdgeSet.has(e.edge_id);
          return (
            <div key={e.edge_id} className="glass-panel p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-purple-400" />
                  <span>{e.name}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  isCut 
                    ? 'bg-red-950 text-red-400 border-red-800'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                }`}>
                  {isCut ? 'CUT / OVERTOPPED' : 'PASSABLE'}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                <span>Highway: {e.highway}</span>
                <span>Length: {e.length_km} km</span>
                <span>Causeway: {e.is_causeway ? 'Yes' : 'No'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
