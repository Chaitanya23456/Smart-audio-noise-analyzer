import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b1220]/95 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono">
        <p className="text-cyan-400 font-semibold">Frequency: {Number(label).toFixed(1)} Hz</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center space-x-2" style={{ color: entry.color }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: entry.color }}></span>
            <span>{entry.name}: {Number(entry.value).toFixed(2)} {entry.dataKey === 'phase' ? '°' : 'dB'}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FrequencyResponseChart = ({ responseData, height = 320, title = 'Filter Frequency Response |H(e^jω)|' }) => {
  const [plotMode, setPlotMode] = useState('magnitude'); // 'magnitude', 'phase', 'both'

  const chartData = useMemo(() => {
    if (!responseData?.frequency) return [];

    const freqs = responseData.frequency;
    const mags = responseData.magnitude_db;
    const phases = responseData.phase_deg;

    return freqs.map((f, i) => ({
      freq: f,
      magnitude: mags ? mags[i] : null,
      phase: phases ? phases[i] : null,
    }));
  }, [responseData]);

  if (!chartData.length) {
    return (
      <div
        className="rounded-xl bg-[#0e1626] border border-slate-800 flex items-center justify-center p-6 text-slate-500 text-xs font-mono"
        style={{ height }}
      >
        Configure filter parameters to preview frequency response...
      </div>
    );
  }

  const cutoffs = responseData?.annotations?.filter((a) => a.type === 'cutoff') || [];

  return (
    <div className="rounded-xl bg-[#0e1626] border border-slate-800 p-4 shadow-lg space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{title}</h3>
          </div>
          {responseData?.filter_specs && (
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Type: <strong className="text-cyan-400">{responseData.filter_specs.family} {responseData.filter_specs.type}</strong> | Order: <strong className="text-slate-200">{responseData.filter_specs.order ?? responseData.filter_specs.taps}</strong>
            </p>
          )}
        </div>

        {/* Magnitude vs Phase Toggle */}
        <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => setPlotMode('magnitude')}
            className={`px-2.5 py-1 rounded transition-all ${
              plotMode === 'magnitude' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Magnitude (dB)
          </button>
          <button
            onClick={() => setPlotMode('phase')}
            className={`px-2.5 py-1 rounded transition-all ${
              plotMode === 'phase' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Phase (deg)
          </button>
          <button
            onClick={() => setPlotMode('both')}
            className={`px-2.5 py-1 rounded transition-all ${
              plotMode === 'both' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Both
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 20, left: -15, bottom: 2 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
            <XAxis
              dataKey="freq"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickFormatter={(v) => `${Number(v).toFixed(0)} Hz`}
            />
            {plotMode !== 'phase' && (
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                domain={[-80, 5]}
                tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                tickFormatter={(v) => `${Number(v).toFixed(0)} dB`}
              />
            )}
            {plotMode !== 'magnitude' && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#c084fc"
                domain={[-180, 180]}
                tick={{ fontSize: 10, fill: '#c084fc', fontFamily: 'monospace' }}
                tickFormatter={(v) => `${Number(v).toFixed(0)}°`}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
              formatter={(value) => <span className="text-slate-300 font-mono text-[11px]">{value}</span>}
            />

            {/* Cutoff Reference Lines */}
            {cutoffs.map((c, idx) => (
              <ReferenceLine
                key={idx}
                yAxisId={plotMode === 'phase' ? 'right' : 'left'}
                x={c.frequency}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{
                  value: `${c.frequency}Hz`,
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'top',
                  fontFamily: 'monospace',
                }}
              />
            ))}

            {plotMode !== 'phase' && (
              <ReferenceLine yAxisId="left" y={-3} stroke="#ef4444" strokeDasharray="3 3" />
            )}

            {plotMode !== 'phase' && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="magnitude"
                name="|H(f)| Magnitude (dB)"
                stroke="#06b6d4"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            )}

            {plotMode !== 'magnitude' && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="phase"
                name="∠H(f) Phase (°)"
                stroke="#c084fc"
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FrequencyResponseChart;
