import React, { useMemo } from 'react';
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
        <p className="text-slate-400">Time: {Number(label).toFixed(4)} s</p>
        {payload.map((entry, index) => (
          <p key={index} className="font-semibold flex items-center space-x-2" style={{ color: entry.color }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: entry.color }}></span>
            <span>{entry.name}: {Number(entry.value).toFixed(4)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const WaveformChart = ({
  originalWaveform,
  filteredWaveform,
  title = 'Oscilloscope: Time-Domain Waveform',
  height = 260,
  showOriginal = true,
  showFiltered = true,
}) => {
  const chartData = useMemo(() => {
    if (!originalWaveform?.time) return [];

    const times = originalWaveform.time;
    const origAmps = originalWaveform.amplitude;
    const filtAmps = filteredWaveform?.amplitude;

    const data = [];
    for (let i = 0; i < times.length; i++) {
      const item = {
        time: times[i],
        original: origAmps ? origAmps[i] : null,
      };
      if (filtAmps && i < filtAmps.length) {
        item.filtered = filtAmps[i];
      }
      data.push(item);
    }
    return data;
  }, [originalWaveform, filteredWaveform]);

  if (!chartData.length) {
    return (
      <div
        className="rounded-xl bg-[#0e1626] border border-slate-800 flex items-center justify-center p-6 text-slate-500 text-xs font-mono"
        style={{ height }}
      >
        Waiting for audio signal input...
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#0e1626] border border-slate-800 p-4 shadow-lg space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{title}</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Units: Time (s) vs Amplitude [-1.0, 1.0]
        </span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 15, left: -15, bottom: 2 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickFormatter={(v) => `${Number(v).toFixed(2)}s`}
            />
            <YAxis
              stroke="#64748b"
              domain={[-1.0, 1.0]}
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickFormatter={(v) => Number(v).toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
              formatter={(value) => <span className="text-slate-300 font-mono text-[11px]">{value}</span>}
            />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
            {showOriginal && (
              <Line
                type="monotone"
                dataKey="original"
                name="Original Signal x[n]"
                stroke="#22d3ee" // bright cyan
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            )}
            {showFiltered && filteredWaveform && (
              <Line
                type="monotone"
                dataKey="filtered"
                name="Filtered Output y[n]"
                stroke="#c084fc" // bright purple
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

export default WaveformChart;
