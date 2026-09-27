import React, { useState } from 'react';
import { Shield, ChevronDown, Bell, User, Clock, AlertCircle, CheckCircle2, FileText, Check, MapPin } from 'lucide-react';

export default function Header({ 
  tracks = [], 
  selectedTrack = null, 
  onSelectTrack = null,
  currentState = 1,
  onOpenAdvisoryModal = null,
  currentUser = null,
  onOpenLoginModal = null
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(4);

  const notifications = [
    {
      id: 1,
      title: 'Action Advisory Signed',
      desc: 'Advisory signed & SHA-256 audit log recorded by R. Mohanty (District Magistrate)',
      time: '12m ago',
      type: 'success'
    },
    {
      id: 2,
      title: 'Dijkstra Road Cascade Computed',
      desc: '1,448 road segments overtopped; 94 health facilities road-isolated',
      time: '25m ago',
      type: 'alert'
    },
    {
      id: 3,
      title: 'Gemini 3.7 AI Brief Generated',
      desc: 'Citation validation status: OBSERVED (6 evidence items verified)',
      time: '40m ago',
      type: 'info'
    },
    {
      id: 4,
      title: 'Paradip Radar Feed Synchronized',
      desc: 'IMD Doppler active radar cycle updated across 3,000 H3 cells',
      time: '1h ago',
      type: 'telemetry'
    }
  ];

  const regions = [
    { id: 'odisha', name: 'Coastal Odisha', cells: '3,000 H3 Cells', active: true, desc: 'Active Benchmark Sector (Yaas/Fani Replay)' },
    { id: 'andhra', name: 'Andhra Coastal Sector', cells: 'Coming Q4 2026', active: false, desc: 'Onboarding planned for next release' },
    { id: 'sundarbans', name: 'West Bengal Sundarbans', cells: 'Coming Q4 2026', active: false, desc: 'Onboarding planned for next release' },
    { id: 'saurashtra', name: 'Gujarat Saurashtra Sector', cells: 'Coming Q1 2027', active: false, desc: 'Onboarding planned for next release' }
  ];

  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);

  return (
    <header className="h-[52px] bg-white border-b border-gray-200 px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-xs relative">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#0F2942] text-white flex items-center justify-center font-bold shadow-xs">
          <Shield className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-gray-900 font-sans">PRAVAAH</span>
            <span className="text-[11px] font-medium text-gray-500 hidden xl:inline">Predictive Resilience & Vulnerability Analytics for Anticipatory Action Hub</span>
            <span className="text-[11px] font-medium text-gray-500 xl:hidden">Civic Cyclone Forecaster</span>
          </div>
        </div>
      </div>

      {/* Central Event Pill with Interactive Replay Switcher */}
      <div className="hidden md:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full py-1 px-3.5 relative">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
        <span className="text-xs font-semibold text-blue-950">
          {selectedTrack?.name || 'Cyclone Yaas'} — expected landfall near Balasore
        </span>
        <button 
          onClick={() => {
            setIsTrackDropdownOpen(!isTrackDropdownOpen);
            setIsRegionDropdownOpen(false);
            setIsNotificationsOpen(false);
          }}
          className="text-[11px] font-semibold text-blue-900 bg-white hover:bg-blue-100 border border-blue-300 rounded px-2.5 py-0.5 ml-1 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
        >
          <span>Historical Replay Mode</span>
          <ChevronDown className="w-3 h-3 text-blue-600" />
        </button>

        {isTrackDropdownOpen && (
          <div className="absolute top-9 right-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 space-y-1 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono">
              SELECT AUTHORITATIVE CYCLONE REPLAY
            </div>
            {tracks.map(t => {
              const isSelected = selectedTrack?.track_id === t.track_id;
              return (
                <div
                  key={t.track_id}
                  onClick={() => {
                    if (onSelectTrack) onSelectTrack(t);
                    setIsTrackDropdownOpen(false);
                  }}
                  className={`p-2 rounded-md transition-all flex items-center justify-between cursor-pointer ${
                    isSelected ? 'bg-blue-100/70 border border-blue-300 font-bold text-blue-950' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1">
                      <span>{t.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono font-normal">
                      Vmax: {t.v_max} km/h | Pc: {t.p_c} hPa
                    </div>
                  </div>
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    T1 REPLAY
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Region Selector with Popover */}
        <div className="relative">
          <button 
            onClick={() => {
              setIsRegionDropdownOpen(!isRegionDropdownOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1 text-xs text-gray-700 font-medium transition-all cursor-pointer"
          >
            <span>📍 Coastal Odisha</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {isRegionDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 space-y-1 text-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono">
                SELECT OPERATIONAL SECTOR
              </div>
              {regions.map(r => (
                <div
                  key={r.id}
                  className={`p-2 rounded-md transition-all flex items-start justify-between gap-2 ${
                    r.active 
                      ? 'bg-blue-50/80 border border-blue-200 cursor-default' 
                      : 'opacity-60 cursor-not-allowed bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <span>{r.name}</span>
                      {r.active && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-500">{r.desc}</div>
                  </div>
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    r.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {r.active ? 'ACTIVE' : 'COMING SOON'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon with Popover */}
        <div className="relative">
          <button 
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsRegionDropdownOpen(false);
              setUnreadNotifications(0);
            }}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all relative cursor-pointer"
            title="System Audit & Telemetry Log Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            )}
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 font-sans">SYSTEM AUDIT & TELEMETRY LOGS</span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  4 EVENTS RECORDED
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-slate-900 text-[11px]">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug">{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher Badge */}
        <div 
          onClick={onOpenLoginModal}
          className="flex items-center gap-2 border-l border-gray-200 pl-3 cursor-pointer hover:opacity-90 transition-all group"
          title="Click to switch role (Approver vs Analyst)"
        >
          <div className={`w-7 h-7 rounded-full ${currentUser?.role === 'APPROVER' ? 'bg-emerald-700' : 'bg-blue-700'} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
            {currentUser?.avatar || 'RM'}
          </div>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <div className="font-semibold text-gray-900 group-hover:text-blue-700 flex items-center gap-1">
              <span>{currentUser?.name || 'R. Mohanty'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className={`font-bold font-mono px-1 rounded ${currentUser?.role === 'APPROVER' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                {currentUser?.role || 'APPROVER'}
              </span>
              <span className="text-gray-400">({currentUser?.department?.split(' ')[0] || 'District'})</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

