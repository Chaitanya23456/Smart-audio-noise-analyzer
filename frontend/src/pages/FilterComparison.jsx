import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Play, Award, CheckCircle2, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import ComparisonTable from '../components/ComparisonTable';
import WaveformChart from '../components/WaveformChart';
import FFTChart from '../components/FFTChart';
import AudioPlayer from '../components/AudioPlayer';

const FilterComparison = () => {
  const {
    audioId,
    filteredAudioId,
    filename,
    timeStats,
    fftStats,
    filteredTimeStats,
    filteredFftStats,
    comparisonResults,
    handleCompare,
    loading,
    recommendation,
  } = useAudio();

  const navigate = useNavigate();
  const [hasRun, setHasRun] = useState(comparisonResults.length > 0);

  const runBenchmark = async () => {
    await handleCompare();
    setHasRun(true);
  };

  if (!audioId) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Audio Signal Loaded</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload audio or synthesize a test signal before comparing digital filters.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <span>FIR vs IIR Multi-Filter Comparison Benchmark</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {filename}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Empirically evaluate noise suppression, execution latency, SNR gain, and phase linearity across candidate filter topologies.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={runBenchmark}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-950/50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Benchmarking...' : 'Run Filter Battery'}</span>
          </button>

          <button
            onClick={() => navigate('/results')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <span>View Recommendation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Playback bar */}
      <AudioPlayer
        originalAudioId={audioId}
        filteredAudioId={filteredAudioId}
      />

      {/* Comparison Table */}
      <ComparisonTable
        comparisonData={comparisonResults}
        recommendedFilterName={recommendation?.recommended_filter_name}
      />

      {/* Academic DSP Comparison Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Finite Impulse Response (FIR) Trade-offs
          </h4>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong className="text-slate-300">Phase Linearity:</strong> Strictly linear phase response ensures constant group delay across all frequencies, preserving acoustic timbre without smearing.</li>
            <li><strong className="text-slate-300">Stability:</strong> Unconditionally stable since all poles are located at the origin z=0 (all-zero transfer function).</li>
            <li><strong className="text-slate-300">Drawback:</strong> Requires significantly higher filter order (e.g. 50-100 taps) for steep transition bands, incurring higher compute cost.</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Infinite Impulse Response (IIR) Trade-offs
          </h4>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong className="text-slate-300">Computational Efficiency:</strong> Achieves razor-sharp roll-off with low order (e.g. Order 2-6), executing 10x-50x faster than FIR.</li>
            <li><strong className="text-slate-300">Sharp Notches:</strong> Optimal for narrow 50Hz/60Hz power-line interference suppression without touching adjacent voice frequencies.</li>
            <li><strong className="text-slate-300">Numerical Stability:</strong> Implemented via Second-Order Sections (SOS) to avoid coefficient quantization errors in high-order polynomials.</li>
          </ul>
        </div>
      </div>

      {/* Waveform and FFT comparison if filtered data exists */}
      {filteredTimeStats && filteredFftStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WaveformChart
            originalWaveform={timeStats.waveform}
            filteredWaveform={filteredTimeStats.waveform}
            title="Overlaid Waveforms x[n] and y[n]"
            height={280}
          />
          <FFTChart
            originalSpectrum={fftStats.spectrum}
            filteredSpectrum={filteredFftStats.spectrum}
            dominantFrequencies={fftStats.dominant_frequencies}
            title="Overlaid Magnitude Spectra |X(f)| and |Y(f)|"
            height={280}
          />
        </div>
      )}
    </div>
  );
};

export default FilterComparison;
