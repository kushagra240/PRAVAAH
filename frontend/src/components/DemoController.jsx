import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, ChevronRight } from 'lucide-react';

const DEMO_STEPS = [
  {
    step: 1,
    title: "1. Baseline Forecast Track",
    desc: "Load Cyclone Yaas (2021 Landfall Replay) track forecast fix."
  },
  {
    step: 2,
    title: "2. Hazard Screening",
    desc: "Holland wind field (144.1 km/h) & parametric surge screening (3.78m)."
  },
  {
    step: 3,
    title: "3. Road Graph Cascade",
    desc: "Flooded edge removal on low-lying crossings & multi-source Dijkstra solve."
  },
  {
    step: 4,
    title: "4. Accessibility Impact",
    desc: "338,683 population flood exposure & 94 isolated public health facilities."
  },
  {
    step: 5,
    title: "5. Scenario Simulator",
    desc: "Perturb track & wind intensity (+15%) with sub-3s recomputation."
  },
  {
    step: 6,
    title: "6. Gemini Decision Brief",
    desc: "Generate evidence-grounded narrative with machine-checked citations."
  },
  {
    step: 7,
    title: "7. Advisory Approval & Audit",
    desc: "Human authority approves warning; SHA256 audit log chained."
  }
];

export default function DemoController({ onRunStep, onResetDemo }) {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    const nextStep = Math.min(DEMO_STEPS.length, currentStep + 1);
    setCurrentStep(nextStep);
    onRunStep(nextStep);
  };

  const handleReset = () => {
    setCurrentStep(1);
    onResetDemo();
  };

  return (
    <div className="glass-panel p-4 space-y-3 border-emerald-500/30">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-gray-100">3-Minute Judging Demo Controller</h3>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo</span>
        </button>
      </div>

      <div className="space-y-1.5">
        {DEMO_STEPS.map((st) => (
          <div 
            key={st.step}
            className={`p-2 rounded text-xs flex items-center justify-between transition-all ${
              currentStep === st.step
                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200 font-bold'
                : currentStep > st.step
                ? 'bg-gray-900/60 text-gray-400 opacity-70'
                : 'bg-gray-900/30 text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {currentStep > st.step ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-gray-600 flex items-center justify-center text-[9px] shrink-0">
                  {st.step}
                </span>
              )}
              <span>{st.title}</span>
            </div>
            {currentStep === st.step && (
              <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={handleNext}
          disabled={currentStep >= DEMO_STEPS.length}
          className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
            currentStep < DEMO_STEPS.length
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Advance Demo Step ({currentStep}/{DEMO_STEPS.length})</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
