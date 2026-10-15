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
} from 'recharts';
import { HelpCircle, Zap } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b1220]/95 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono">
        <p className="text-cyan-400 font-semibold">Frequency: {Number(label).toFixed(1)} Hz</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center space-x-2" style={{ color: entry.color }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: entry.color }}></span>
            <span>{entry.name}: {Number(entry.value).toFixed(1)} dB</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FFTChart = ({
  originalSpectrum,
  filteredSpectrum,
  dominantFrequencies = [],
  educationalDSP,
  height = 280,
  title = 'Spectrum Analyzer: Magnitude |X(f)|',
}) => {
  const [zoomRange, setZoomRange] = useState('full'); // 'full', 'voice' (0-4kHz), 'audio' (0-10kHz)
  const [showTheory, setShowTheory] = useState(false);

  const chartData = useMemo(() => {
    if (!originalSpectrum?.frequency) return [];

    const freqs = originalSpectrum.frequency;
    const origMags = originalSpectrum.magnitude_db;
    const filtMags = filteredSpectrum?.magnitude_db;

    const maxFreqLimit =
      zoomRange === 'voice' ? 4000 : zoomRange === 'audio' ? 10000 : Infinity;

    const data = [];
    for (let i = 0; i < freqs.length; i++) {
      if (freqs[i] > maxFreqLimit) break;
      const item = {
        freq: freqs[i],
        original: origMags ? origMags[i] : null,
      };
      if (filtMags && i < filtMags.length) {
        item.filtered = filtMags[i];
      }
      data.push(item);
    }
    return data;
  }, [originalSpectrum, filteredSpectrum, zoomRange]);

  if (!chartData.length) {
    return (
      <div
        className="rounded-xl bg-[#0e1626] border border-slate-800 flex items-center justify-center p-6 text-slate-500 text-xs font-mono"
        style={{ height }}
      >
        Waiting for spectral FFT calculation...
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#0e1626] border border-slate-800 p-4 shadow-lg space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{title}</h3>
          <button
            onClick={() => setShowTheory(!showTheory)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium ml-1"
            title="Inspect DFT vs FFT complexity theory"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="underline">Theory</span>
          </button>
        </div>

        {/* Range selectors */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-mono text-slate-500">Span:</span>
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setZoomRange('voice')}
              className={`px-2 py-0.5 rounded transition-all ${
                zoomRange === 'voice' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              0-4k
            </button>
            <button
              onClick={() => setZoomRange('audio')}
              className={`px-2 py-0.5 rounded transition-all ${
                zoomRange === 'audio' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              0-10k
            </button>
            <button
              onClick={() => setZoomRange('full')}
              className={`px-2 py-0.5 rounded transition-all ${
                zoomRange === 'full' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full
            </button>
          </div>
        </div>
      </div>

      {/* Theory dropdown card */}
      {showTheory && educationalDSP && (
        <div className="p-3 rounded-lg bg-slate-950/90 border border-cyan-900/40 text-xs text-slate-300 space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>DFT Mathematical Definition & Cooley-Tukey FFT Complexity</span>
          </div>
          <p className="text-slate-400 leading-relaxed font-sans text-xs">
            Direct DFT evaluates <span className="font-mono text-cyan-300">X[k] = ∑ x[n] · e^(-j 2π kn / N)</span> with <strong className="text-slate-200">O(N²)</strong> complex operations ({educationalDSP.dft_theoretical_ops?.toLocaleString()} ops).
          </p>
          <p className="text-slate-400 leading-relaxed font-sans text-xs">
            The Cooley-Tukey algorithm computes the exact same DFT using butterfly symmetry in <strong className="text-slate-200">O(N log₂ N)</strong> operations ({educationalDSP.fft_theoretical_ops?.toLocaleString()} ops), giving <span className="text-emerald-400 font-semibold">{educationalDSP.theoretical_speedup}</span> speedup.
          </p>
        </div>
      )}

      {/* Main Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 15, left: -15, bottom: 2 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
            <XAxis
              dataKey="freq"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickFormatter={(v) => `${Number(v).toFixed(0)} Hz`}
            />
            <YAxis
              stroke="#64748b"
              domain={[-90, 5]}
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickFormatter={(v) => `${Number(v).toFixed(0)} dB`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
              formatter={(value) => <span className="text-slate-300 font-mono text-[11px]">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="original"
              name="Input Spectrum |X(f)|"
              stroke="#06b6d4" // cyan
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            {filteredSpectrum && (
              <Line
                type="monotone"
                dataKey="filtered"
                name="Filtered Spectrum |Y(f)|"
                stroke="#f43f5e" // rose/magenta
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

export default FFTChart;
