import React from 'react';
import { Activity, Sparkles, Server } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const Navbar = () => {
  const { serverOnline, handleGenerateDemo, loading } = useAudio();

  return (
    <header className="h-14 bg-[#0c1220]/98 backdrop-blur-xl border-b border-[#1e3050]/80 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Project Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Activity className="w-4 h-4 text-white stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold tracking-tight text-white">
              Smart Audio Noise Analyzer
            </h1>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25 font-semibold hidden sm:inline-block">
              DSP v2.0
            </span>
          </div>
          <p className="text-[10px] text-slate-500 hidden sm:block">
            Digital Signal Processing Mini-Project
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2.5">
        {/* Load Demo Signal Button */}
        <button
          onClick={() => handleGenerateDemo(['hum', 'hiss'])}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111a2e] hover:bg-[#162038] text-slate-200 border border-[#1e3050] hover:border-violet-500/40 transition-all duration-200 disabled:opacity-50"
          title="Synthesizes a calibrated demo signal for testing"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{loading ? 'Loading...' : 'Demo Signal'}</span>
        </button>

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
