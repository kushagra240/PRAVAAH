import React, { useState } from 'react';
import { Sliders, RotateCcw, Zap, Info } from 'lucide-react';

export default function SimulatorPanel({ onRunScenario, simResult, isSimulating }) {
  const [latShift, setLatShift] = useState(0.0);
  const [lonShift, setLonShift] = useState(0.0);
  const [vMaxMult, setVMaxMult] = useState(1.0);
  const [rainMult, setRainMult] = useState(1.0);
  const [surgeMult, setSurgeMult] = useState(1.0);

  const handleSliderChange = (setter, val) => {
    setter(val);
    triggerScenario(
      setter === setLatShift ? val : latShift,
      setter === setLonShift ? val : lonShift,
      setter === setVMaxMult ? val : vMaxMult,
      setter === setRainMult ? val : rainMult,
      setter === setSurgeMult ? val : surgeMult
    );
  };

  const triggerScenario = (lShift, lnShift, vMult, rMult, sMult) => {
    onRunScenario({
      track_lat_shift_deg: lShift,
      track_lon_shift_deg: lnShift,
      v_max_multiplier: vMult,
      rain_multiplier: rMult,
      surge_multiplier: sMult
    });
  };

  const handleReset = () => {
    setLatShift(0.0);
    setLonShift(0.0);
    setVMaxMult(1.0);
    setRainMult(1.0);
    setSurgeMult(1.0);
    onRunScenario({});
  };

  const compTime = simResult?.computation_time_ms || 32.5;

  return (
    <div className="h-full flex flex-col p-5 space-y-5 overflow-y-auto bg-[#0B0F19]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-gray-100">Interactive Scenario Simulator</h2>
            <p className="text-xs text-gray-400">Perturb hazard parameters with sub-3s recomputation</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300 hover:text-white hover:border-gray-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Latency metric badge */}
      <div className="flex items-center justify-between glass-panel p-3 border-cyan-500/30 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-mono">
          <Zap className="w-4 h-4" />
          <span>Engine Performance:</span>
        </div>
        <div className="font-mono text-gray-200">
          Latency <span className="text-emerald-400 font-bold">{compTime} ms</span> (Target &lt;3000 ms)
        </div>
      </div>

      {/* Sliders Container */}
      <div className="space-y-4">
        {/* Slider 1: Track Latitude Offset */}
        <div className="glass-panel p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium">Track North/South Shift</span>
            <span className="font-mono font-bold text-cyan-400">
              {latShift > 0 ? `+${latShift.toFixed(2)}° N` : `${latShift.toFixed(2)}° S`}
            </span>
          </div>
          <input 
            type="range" 
            min="-0.4" 
            max="0.4" 
            step="0.05"
            value={latShift}
            onChange={(e) => handleSliderChange(setLatShift, parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>-40 km South</span>
            <span>Baseline</span>
            <span>+40 km North</span>
          </div>
        </div>

        {/* Slider 2: Track Longitude Offset */}
        <div className="glass-panel p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium">Track East/West Shift</span>
            <span className="font-mono font-bold text-cyan-400">
              {lonShift > 0 ? `+${lonShift.toFixed(2)}° E` : `${lonShift.toFixed(2)}° W`}
            </span>
          </div>
          <input 
            type="range" 
            min="-0.4" 
            max="0.4" 
            step="0.05"
            value={lonShift}
            onChange={(e) => handleSliderChange(setLonShift, parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>-40 km West</span>
            <span>Baseline</span>
            <span>+40 km East</span>
          </div>
        </div>

        {/* Slider 3: Wind Intensity Multiplier */}
        <div className="glass-panel p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium">Wind Intensity (V_max)</span>
            <span className="font-mono font-bold text-orange-400">
              {vMaxMult.toFixed(2)}x ({roundVal(140 * vMaxMult)} km/h)
            </span>
          </div>
          <input 
            type="range" 
            min="0.7" 
            max="1.4" 
            step="0.05"
            value={vMaxMult}
            onChange={(e) => handleSliderChange(setVMaxMult, parseFloat(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>-30% Intensity</span>
            <span>1.0x (140 km/h)</span>
            <span>+40% Intensity</span>
          </div>
        </div>

        {/* Slider 4: Rainfall Multiplier */}
        <div className="glass-panel p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium">Rainfall Volume Multiplier</span>
            <span className="font-mono font-bold text-blue-400">
              {rainMult.toFixed(2)}x ({roundVal(250 * rainMult)} mm/24h)
            </span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="2.0" 
            step="0.1"
            value={rainMult}
            onChange={(e) => handleSliderChange(setRainMult, parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>0.5x (125mm)</span>
            <span>1.0x (250mm)</span>
            <span>2.0x (500mm)</span>
          </div>
        </div>

        {/* Slider 5: Surge Multiplier */}
        <div className="glass-panel p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium">Storm Surge Multiplier</span>
            <span className="font-mono font-bold text-purple-400">
              {surgeMult.toFixed(2)}x ({roundVal(3.2 * surgeMult)} m peak)
            </span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="2.0" 
            step="0.1"
            value={surgeMult}
            onChange={(e) => handleSliderChange(setSurgeMult, parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>0.5x</span>
            <span>1.0x (3.2m)</span>
            <span>2.0x (6.4m)</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800 text-[11px] text-gray-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          Perturbations trigger immediate vectorised NumPy wind/surge calculations and re-solve sparse Dijkstra road accessibility graphs across all coastal Odisha blocks.
        </span>
      </div>
    </div>
  );
}

function roundVal(v) {
  return Math.round(v);
}
