import React from 'react';
import { Activity, Server } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const Navbar = () => {
  const { serverOnline } = useAudio();

  return (
    <header className="h-14 bg-[#0c1220]/98 backdrop-blur-xl border-b border-[#1e3050]/80 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Project Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Activity className="w-4 h-4 text-white stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white">
            Smart Audio Noise Analyzer
          </h1>
          <p className="text-[10px] text-slate-500 hidden sm:block">
            Digital Signal Processing
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2.5">
        {/* Backend Status */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#111a2e] border border-[#1e3050] text-[11px]">
          <Server className="w-3 h-3 text-slate-500" />
          {serverOnline ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400 font-mono">Online</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="text-red-400 font-mono">Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
