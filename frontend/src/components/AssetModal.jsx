import React from 'react';
import { X, Building2, Shield, Route, AlertTriangle, CheckCircle, Clock, Zap, MapPin } from 'lucide-react';

export default function AssetModal({ asset, onClose, simResult }) {
  if (!asset) return null;

  const isHospital = asset.asset_type === 'hospital' || asset.asset_id?.startsWith('HOSP');
  const isShelter = asset.asset_type === 'shelter' || asset.asset_id?.startsWith('SHELTER');
  const isRoad = asset.asset_type === 'road' || asset.edge_id;

  const brokenEdges = simResult?.cascade?.broken_road_edges || [];
  const brokenEdgeSet = new Set(brokenEdges.map(e => e.edge_id));
  const isCut = isRoad ? brokenEdgeSet.has(asset.edge_id) : false;

  // Find facility evaluation if available
  const facEvals = simResult?.facility_evaluations || [];
  const facEval = facEvals.find(f => f.asset_id === asset.asset_id) || asset;

  const floodP = facEval.flood_probability || (asset.dist_coast_m < 8000 ? 0.65 : 0.25);
  const windKph = facEval.wind_kph || simResult?.max_wind_kph || 140.0;
  const surgeM = simResult?.peak_surge_m || 3.2;
  const elevM = facEval.elevation_m || asset.elevation_m || 2.5;
  const status = isRoad ? (isCut ? 'inundated_or_isolated' : 'operational') : (facEval.status || 'operational');

  // Decomposition weights
  const genWeight = asset.backup_generator === 'absent' ? 30 : 5;
  const elevWeight = Math.max(0, Math.round((4.0 - elevM) * 15));
  const floodWeight = Math.round(floodP * 40);
  const windWeight = Math.round((windKph / 200) * 25);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-xl p-6 space-y-5 border-cyan-500/30 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-cyan-400">
              {isHospital && <Building2 className="w-6 h-6 text-red-400" />}
              {isShelter && <Shield className="w-6 h-6 text-emerald-400" />}
              {isRoad && <Route className="w-6 h-6 text-purple-400" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">{asset.name}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 font-mono">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span>{asset.block || 'Coastal Odisha'} ({asset.district || 'Odisha'})</span>
                <span>• ID: {asset.asset_id || asset.edge_id}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`p-3 rounded-lg flex items-center justify-between text-xs font-mono font-bold ${
          status === 'inundated_or_isolated'
            ? 'bg-red-950/60 border border-red-800 text-red-300'
            : status === 'degraded_access'
            ? 'bg-orange-950/60 border border-orange-800 text-orange-300'
            : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            {status === 'operational' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>STATUS: {status.toUpperCase().replace(/_/g, ' ')}</span>
          </div>
          <span className="text-[10px] uppercase font-sans font-normal opacity-80">
            {isRoad ? (isCut ? 'Causeway Overtopped' : 'Passable Arterial Link') : 'Physical Fragility Assessed'}
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-gray-900/60 p-2.5 rounded border border-gray-800">
            <div className="text-gray-400 text-[10px]">Elevation</div>
            <div className="text-sm font-bold text-gray-100 mt-0.5">{elevM.toFixed(1)} m</div>
          </div>
          <div className="bg-gray-900/60 p-2.5 rounded border border-gray-800">
            <div className="text-gray-400 text-[10px]">Flood Prob</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">{(floodP * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-gray-900/60 p-2.5 rounded border border-gray-800">
            <div className="text-gray-400 text-[10px]">Max Wind</div>
            <div className="text-sm font-bold text-orange-400 mt-0.5">{windKph.toFixed(0)} km/h</div>
          </div>
        </div>

        {/* Contributing Factor Decomposition */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <div className="text-xs font-bold text-gray-200 flex items-center justify-between">
            <span>Contributing Factor Decomposition</span>
            <span className="text-[10px] text-cyan-400 font-mono">Decomposable Index</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Factor 1: Flood Susceptibility */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                <span>Hydrological Flood Susceptibility</span>
                <span className="font-mono text-cyan-400">{floodWeight}%</span>
              </div>
              <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${floodWeight}%` }}></div>
              </div>
            </div>

            {/* Factor 2: Low Elevation */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                <span>Low Elevation / Terrain Exposure</span>
                <span className="font-mono text-orange-400">{elevWeight}%</span>
              </div>
              <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${elevWeight}%` }}></div>
              </div>
            </div>

            {/* Factor 3: Power Generator Backup */}
            {isHospital && (
              <div>
                <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                  <span>Power Backup Vulnerability ({asset.backup_generator || 'absent'})</span>
                  <span className="font-mono text-red-400">{genWeight}%</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${genWeight}%` }}></div>
                </div>
              </div>
            )}

            {/* Factor 4: Wind Speed */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                <span>Surface Wind Stress</span>
                <span className="font-mono text-purple-400">{windWeight}%</span>
              </div>
              <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${windWeight}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs font-bold text-gray-200 hover:text-white"
          >
            Close Intelligence Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
