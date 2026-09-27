import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Anchor, Clock, AlertTriangle } from 'lucide-react';

export default function TimelineBar({ 
  timeStepHours = -6, 
  setTimeStepHours = null,
  currentState = 1,
  onSelectState = null
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = [
    { label: 'T-12h', hours: -12, detail: 'Pre-Landfall Warning' },
    { label: 'T-6h', hours: -6, detail: 'Surge Surge & Levee Breach' },
    { label: 'LANDFALL (T-0)', hours: 0, detail: 'Peak Eye Impact (Balasore)' },
    { label: 'T+6h', hours: 6, detail: 'Post-Landfall Flood Peak' },
    { label: 'T+24h', hours: 24, detail: 'Receding Surge Window' }
  ];

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        if (setTimeStepHours) {
          setTimeStepHours(prev => {
            if (prev >= 24) {
              setIsPlaying(false);
              return -12;
            }
            if (prev <= -12) return -6;
            if (prev <= -6) return 0;
            if (prev === 0) return 6;
            return 24;
          });
        }
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setTimeStepHours]);

  const handleStepChange = (h) => {
    if (setTimeStepHours) setTimeStepHours(h);
    if (h === 0 && onSelectState) {
      onSelectState(5); // State 5: Landfall
    }
  };

  return (
    <div className="h-[52px] bg-[#0F172A] text-white px-5 flex items-center justify-between gap-6 shrink-0 z-40 select-none shadow-md">
      {/* Play / Control Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            if (setTimeStepHours) setTimeStepHours(prev => Math.max(-12, prev - 6));
          }}
          title="Step Backward"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Replay' : 'Play Timeline Replay'}
          className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-sm transition-all cursor-pointer"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
        </button>

        <button
          onClick={() => {
            if (setTimeStepHours) setTimeStepHours(prev => Math.min(24, prev + 6));
          }}
          title="Step Forward"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Timeline Scrubber */}
      <div className="flex-1 flex items-center gap-4 max-w-3xl">
        <div className="flex-1 relative flex items-center">
          {/* Progress track line */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400 transition-all duration-300"
              style={{
                width: `${((timeStepHours + 12) / 36) * 100}%`
              }}
            ></div>
          </div>

          {/* Step markers */}
          <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-1">
            {steps.map(s => {
              const isCurrent = timeStepHours === s.hours;
              return (
                <button
                  key={s.hours}
                  onClick={() => handleStepChange(s.hours)}
                  title={s.detail}
                  className={`pointer-events-auto w-3.5 h-3.5 rounded-full border-2 transition-all cursor-pointer ${
                    isCurrent 
                      ? 'bg-cyan-400 border-white scale-125 shadow-md shadow-cyan-400/50' 
                      : 'bg-slate-700 border-slate-900 hover:bg-slate-500'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Current Time Badge */}
        <div className="font-mono text-xs font-bold text-cyan-400 bg-slate-900 px-3 py-1 rounded border border-slate-800 shrink-0">
          {timeStepHours === 0 ? 'LANDFALL (T-0)' : timeStepHours < 0 ? `T${timeStepHours}h` : `T+${timeStepHours}h`}
        </div>
      </div>

      {/* Jump to Landfall Button */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => handleStepChange(0)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            timeStepHours === 0 
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm ring-2 ring-amber-400/50' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          <Anchor className="w-3.5 h-3.5" />
          <span>JUMP TO LANDFALL</span>
        </button>
      </div>
    </div>
  );
}
