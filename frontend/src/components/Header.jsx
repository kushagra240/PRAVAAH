import React from 'react';
import { Shield, ChevronDown, Bell, User, Clock, AlertCircle } from 'lucide-react';

export default function Header({ 
  tracks = [], 
  selectedTrack = null, 
  onSelectTrack = null,
  currentState = 1,
  onOpenAdvisoryModal = null
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
            <span className="text-[11px] font-medium text-gray-500">Civic Cyclone Preparedness</span>
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

        {/* User Badge */}
        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
          <div className="w-7 h-7 rounded-full bg-[#0F2942] text-white flex items-center justify-center font-bold text-xs">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <div className="font-semibold text-gray-900">R. Mohanty</div>
            <div className="text-[10px] text-gray-500">District Office</div>
          </div>
        </div>
      </div>
    </header>
  );
}
