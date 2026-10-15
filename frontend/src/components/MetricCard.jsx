import React from 'react';

const MetricCard = ({ title, value, unit = '', subtitle, icon: Icon, color = 'cyan', badge }) => {
  const colorMap = {
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-950/20',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-950/20',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
      glow: 'shadow-indigo-950/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'shadow-amber-950/20',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: 'shadow-rose-950/20',
    },
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`p-4 rounded-xl bg-slate-900 border ${scheme.border} shadow-lg ${scheme.glow} transition-all duration-200 hover:border-slate-700`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${scheme.bg} ${scheme.text}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className="text-2xl font-bold font-mono text-slate-100">{value ?? '—'}</span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-400 text-[11px]">{subtitle}</span>}
        {badge && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
