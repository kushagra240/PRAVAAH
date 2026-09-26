import React from 'react';
import { X, ShieldCheck, UserCheck, Lock, AlertCircle, Key, ArrowRight } from 'lucide-react';

export const DEMO_USERS = [
  {
    id: 'user-01',
    name: 'R. Mohanty',
    title: 'District Collector & Magistrate',
    department: 'District Emergency Operations Center',
    role: 'APPROVER',
    avatar: 'RM',
    badgeColor: 'bg-emerald-600',
    description: 'Full statutory authority to authorize and dispatch official CAP advisories (Role: APPROVER).'
  },
  {
    id: 'user-02',
    name: 'A. Patnaik',
    title: 'EOC Lead Risk Analyst',
    department: 'State Disaster Management Authority (OSDMA)',
    role: 'ANALYST',
    avatar: 'AP',
    badgeColor: 'bg-blue-600',
    description: 'Can simulate cascades, inspect evidence, and draft advisories. Approval restricted (Role: ANALYST).'
  }
];

export default function LoginModal({ isOpen, onClose, currentUser, onSelectUser }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white w-full max-w-md rounded-xl border border-slate-300 shadow-2xl overflow-hidden font-sans text-slate-800">
        {/* Header */}
        <div className="bg-[#0F2942] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">PRAVAAH Role Switcher & Auth Gate</h3>
              <p className="text-[11px] text-slate-300 font-mono">Demo Accountability Framework (§20)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 leading-relaxed text-[11px] flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Role Separation Rule:</strong> Only users with the <strong>APPROVER</strong> role can sign and dispatch official advisories. <strong>ANALYST</strong> users can draft and submit for review.
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
              Select Demo Identity
            </label>

            {DEMO_USERS.map((user) => {
              const isSelected = currentUser?.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${user.badgeColor} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs`}>
                    {user.avatar}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        user.role === 'APPROVER' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="text-slate-600 text-xs font-medium">{user.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{user.department}</div>
                    <p className="text-[11px] text-slate-500 pt-1 leading-snug">{user.description}</p>
                  </div>

                  {isSelected && (
                    <UserCheck className="w-5 h-5 text-blue-600 shrink-0 self-center" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Active Role: <strong className="text-slate-800">{currentUser?.role}</strong></span>
          <button 
            onClick={onClose}
            className="px-3 py-1 bg-slate-900 text-white rounded font-sans font-semibold text-xs hover:bg-slate-800"
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
