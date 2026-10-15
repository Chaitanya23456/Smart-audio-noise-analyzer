import React from 'react';
import { Activity, Sparkles, Server } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const Navbar = () => {
  const { serverOnline, handleGenerateDemo, loading } = useAudio();

  return (
    <header className="h-16 bg-[#0b1220]/95 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Brand & Project Identity */}
      <div className="flex items-center space-x-3.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 via-cyan-600 to-indigo-600 p-[1px] shadow-sm">
          <div className="w-full h-full bg-[#0b1220] rounded-[7px] flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400 stroke-[2.2]" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold tracking-tight text-slate-100 uppercase">
              Smart Audio Noise Analyzer
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
              DFT • FFT • FIR • IIR
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            College DSP Laboratory Mini-Project Workstation
          </p>
        </div>
      </div>

      {/* Right Action Tools & Telemetry Status */}
      <div className="flex items-center space-x-3">
        {/* Load Calibrated Demo Signal Button */}
        <button
          onClick={() => handleGenerateDemo(['hum', 'hiss'])}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 shadow-sm hover:border-slate-600 transition-all duration-150 disabled:opacity-50"
          title="Synthesizes a 440+660+880 Hz harmonic signal with 50 Hz hum and hiss, with ground-truth reference for exact SNR testing"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{loading ? 'Synthesizing...' : 'Load Calibrated Demo'}</span>
        </button>

        {/* Backend Server Status Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          {serverOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-mono text-[11px]">Backend Online</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-rose-400 font-mono text-[11px]">Backend Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
