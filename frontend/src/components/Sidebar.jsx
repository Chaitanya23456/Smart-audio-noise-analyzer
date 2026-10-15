import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AudioWaveform, Sliders, Award, FileAudio, Info, CheckCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const navItems = [
  { path: '/', label: 'Dashboard', step: '01', icon: LayoutDashboard },
  { path: '/analysis', label: 'Signal Analysis', step: '02', icon: AudioWaveform },
  { path: '/filters', label: 'Digital Filters', step: '03', icon: Sliders },
  { path: '/results', label: 'Results & Recommendation', step: '04', icon: Award },
];

const Sidebar = () => {
  const { audioId, filename, isCalibratedDemo, timeStats, channels } = useAudio();

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2 font-mono">
            Lab Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{item.step}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Active Signal Telemetry Inspector */}
        {audioId ? (
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400">
                <FileAudio className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold truncate max-w-[140px]" title={filename}>
                  {filename || 'Active Signal'}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            <div className="text-[11px] font-mono text-slate-400 space-y-1.5 pt-1 border-t border-slate-800/60">
              <div className="flex justify-between">
                <span className="text-slate-500">Fs (Rate):</span>
                <span className="text-slate-200 font-semibold">{timeStats?.sampling_rate?.toLocaleString()} Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nyquist:</span>
                <span className="text-slate-200 font-semibold">{timeStats?.nyquist_freq?.toLocaleString()} Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="text-slate-200 font-semibold">{timeStats?.duration} s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Format:</span>
                <span className="text-slate-200">{channels === 1 ? 'Mono (1 ch)' : `${channels} Channels`}</span>
              </div>
            </div>

            {isCalibratedDemo && (
              <div className="pt-2 border-t border-slate-800 flex items-center space-x-1.5 text-[10px] text-emerald-400 font-medium">
                <CheckCircle className="w-3 h-3" />
                <span>Ground-Truth Calibrated</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800/90 text-center space-y-1">
            <p className="text-xs font-medium text-slate-400">No Audio Signal Loaded</p>
            <p className="text-[11px] text-slate-500">Upload, record, or load demo from Dashboard</p>
          </div>
        )}
      </div>

      {/* College DSP Footer Telemetry */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/30">
        <div className="flex items-start space-x-2 text-slate-500 text-[11px] leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-500" />
          <span>
            NumPy real FFT • SciPy FIR firwin & IIR Butterworth SOS filtering engine.
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
