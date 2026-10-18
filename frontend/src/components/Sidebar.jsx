import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AudioWaveform, Sliders, BarChart3, Award, FileAudio, Info, CheckCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const navItems = [
  { path: '/', label: 'Dashboard', step: '01', icon: LayoutDashboard },
  { path: '/analysis', label: 'Signal Analysis', step: '02', icon: AudioWaveform },
  { path: '/filters', label: 'Digital Filters', step: '03', icon: Sliders },
  { path: '/comparison', label: 'Filter Comparison', step: '04', icon: BarChart3 },
  { path: '/results', label: 'Results', step: '05', icon: Award },
];

const Sidebar = () => {
  const { audioId, filename, isCalibratedDemo, timeStats, channels } = useAudio();

  return (
    <aside className="w-60 bg-[#0a1018] border-r border-[#1e3050]/60 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-5">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 px-3 mb-2 font-mono">
            Navigation
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-violet-500/12 text-violet-300 border border-violet-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#111a2e] border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600">{item.step}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Active Signal Info */}
        {audioId ? (
          <div className="p-3 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-violet-400">
                <FileAudio className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-semibold truncate max-w-[130px]" title={filename}>
                  {filename || 'Active Signal'}
                </span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>

            <div className="text-[10px] font-mono text-slate-500 space-y-1 pt-1.5 border-t border-[#1e3050]">
              <div className="flex justify-between">
                <span>Sample Rate</span>
                <span className="text-slate-300">{timeStats?.sampling_rate?.toLocaleString()} Hz</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="text-slate-300">{timeStats?.duration} s</span>
              </div>
              <div className="flex justify-between">
                <span>Format</span>
                <span className="text-slate-300">{channels === 1 ? 'Mono' : `${channels} Ch`}</span>
              </div>
            </div>

            {isCalibratedDemo && (
              <div className="pt-1.5 border-t border-[#1e3050] flex items-center space-x-1.5 text-[10px] text-emerald-400 font-medium">
                <CheckCircle className="w-3 h-3" />
                <span>Calibrated Demo</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#111a2e]/50 border border-dashed border-[#1e3050] text-center space-y-0.5">
            <p className="text-[11px] font-medium text-slate-500">No Signal Loaded</p>
            <p className="text-[10px] text-slate-600">Load from Dashboard</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#1e3050]/60">
        <div className="flex items-start space-x-2 text-slate-600 text-[10px] leading-relaxed">
          <Info className="w-3 h-3 shrink-0 mt-0.5 text-violet-500/60" />
          <span>
            NumPy FFT • SciPy FIR/IIR Filtering
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
