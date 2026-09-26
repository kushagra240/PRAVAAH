import React from 'react';
import { Shield, ChevronDown, Bell, User, Clock, AlertCircle } from 'lucide-react';

export default function Header({ 
  tracks = [], 
  selectedTrack = null, 
  onSelectTrack = null,
  currentState = 1,
  onOpenAdvisoryModal = null,
  currentUser = null,
  onOpenLoginModal = null
}) {
  return (
    <header className="h-[52px] bg-white border-b border-gray-200 px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-xs">
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

      {/* Central Event Pill (Matching Reference Image) */}
      <div className="hidden md:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full py-1 px-3.5">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
        <span className="text-xs font-semibold text-blue-950">
          Cyclone Yaas — expected landfall in 42 hours near Balasore
        </span>
        <button className="text-[11px] font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 rounded px-2 py-0.5 ml-1 transition-all">
          Viewing a past cyclone
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Region Selector */}
        <div className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1 text-xs text-gray-700 cursor-pointer font-medium transition-all">
          <span>📍 Coastal Odisha</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Notifications */}
        <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

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
