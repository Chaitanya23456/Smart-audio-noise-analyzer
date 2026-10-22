import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Download,
  BarChart3,
  Sliders,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import AudioPlayer from '../components/AudioPlayer';
import WaveformChart from '../components/WaveformChart';
import FFTChart from '../components/FFTChart';
import api from '../services/api';

const Results = () => {
  const {
    audioId,
    filename,
    timeStats,
    fftStats,
    comparisonList,
    comparisonResults,
    recommendation,
    filterMetrics,
    filteredAudioId,
    filteredTimeStats,
    filteredFftStats,
    currentFilterConfig,
  } = useAudio();

  const navigate = useNavigate();

  // Determine the Best Filter from comparisonList, or comparisonResults, or recommendation
  const bestFilter = useMemo(() => {
    const list = comparisonList && comparisonList.length > 0
      ? comparisonList
      : comparisonResults && comparisonResults.length > 0
      ? comparisonResults
      : null;

    if (list && list.length > 0) {
      if (list.length === 1) {
        return {
          ...list[0],
          reason: `${list[0].filter_name} was selected with +${list[0].noise_reduction_db ?? 0} dB stopband noise reduction and ${list[0].processing_time_ms ?? 0} ms processing latency.`,
        };
      }

      const maxAtten = Math.max(...list.map((f) => f.noise_reduction_db ?? 0), 0.1);
      const minLatency = Math.min(...list.map((f) => f.processing_time_ms ?? 1), 1);
      const maxLatency = Math.max(...list.map((f) => f.processing_time_ms ?? 1), minLatency + 0.1);

      let bestIdx = 0;
      let highestScore = -Infinity;

      list.forEach((f, idx) => {
        const attenScore = Math.min(60, ((f.noise_reduction_db ?? 0) / (maxAtten || 1)) * 60);
        const latencyNorm = (maxLatency - (f.processing_time_ms ?? 0)) / (maxLatency - minLatency || 1);
        const latencyScore = Math.max(0, Math.min(20, latencyNorm * 20));
        const phaseBonus = (f.family === 'FIR' || f.phase_type?.includes('Linear')) ? 10 : 5;
        const stabilityBonus = f.is_stable !== false ? 10 : -50;

        const totalScore = attenScore + latencyScore + phaseBonus + stabilityBonus;
        if (totalScore > highestScore) {
          highestScore = totalScore;
          bestIdx = idx;
        }
      });

      const winner = list[bestIdx];
      return {
        ...winner,
        reason: `${winner.filter_name} achieved the optimal performance among all compared filters: +${winner.noise_reduction_db} dB stopband noise rejection, ${winner.processing_time_ms} ms processing latency, and ${winner.phase_type || (winner.family === 'FIR' ? 'Linear Phase' : 'IIR')} response.`,
      };
    }

    // Fallback: If no comparison list, use currently applied filter
    if (filteredAudioId && filterMetrics && currentFilterConfig) {
      const cutoffLabel =
        currentFilterConfig.filter_type === 'bandpass' || currentFilterConfig.filter_type === 'bandstop'
          ? `${currentFilterConfig.low_cutoff} - ${currentFilterConfig.high_cutoff} Hz`
          : `${currentFilterConfig.cutoff} Hz`;

      return {
        filter_name: `${currentFilterConfig.family} - ${currentFilterConfig.method || currentFilterConfig.window || 'Filter'} (${currentFilterConfig.filter_type})`,
        family: currentFilterConfig.family,
        method: currentFilterConfig.method || currentFilterConfig.window,
        order: currentFilterConfig.order,
        cutoff_label: cutoffLabel,
        noise_reduction_db: filterMetrics.noise_reduction_db,
        processing_time_ms: filterMetrics.processing_time_ms,
        phase_type: currentFilterConfig.family === 'FIR' ? 'Linear Phase' : 'Non-linear Phase',
        waveform: filteredTimeStats?.waveform,
        spectrum: filteredFftStats?.spectrum,
        filtered_audio_id: filteredAudioId,
        reason: recommendation?.reason || `Applied ${currentFilterConfig.family} filter with +${filterMetrics.noise_reduction_db} dB stopband noise reduction and ${filterMetrics.processing_time_ms} ms processing latency.`,
      };
    }

    return null;
  }, [
    comparisonList,
    comparisonResults,
    recommendation,
    filterMetrics,
    filteredAudioId,
    filteredTimeStats,
    filteredFftStats,
    currentFilterConfig,
  ]);

  if (!audioId) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center rounded-2xl bg-[#111a2e] border border-[#1e3050] space-y-4">
        <Award className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Audio Signal Loaded</h3>
        <p className="text-xs text-slate-400">
          Please upload or generate an audio signal to view filtering results.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-500/20"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!bestFilter) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center rounded-2xl bg-[#111a2e] border border-[#1e3050] space-y-4 shadow-xl">
        <Award className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Filter Compared Yet</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          To see the best filter details, design and apply your filters in <strong>Digital Filters</strong>, add them for comparison, and evaluate them.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/filters')}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-500/20 transition-all"
          >
            Go to Digital Filters
          </button>
          <button
            onClick={() => navigate('/comparison')}
            className="px-4 py-2.5 rounded-xl bg-[#0c1220] hover:bg-[#162038] text-slate-200 border border-[#1e3050] text-xs font-bold transition-all"
          >
            Go to Filter Comparison
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e3050]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Best Filter Result
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
              Optimal Selection
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {filename}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Final performance evaluation, waveform proof, and audio output for the best-performing digital filter.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {bestFilter.filtered_audio_id && (
            <a
              href={api.getAudioDownloadUrl(bestFilter.filtered_audio_id)}
              download
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-all shrink-0 active:scale-[0.97]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export WAV</span>
            </a>
          )}

          <button
            onClick={() => navigate('/comparison')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#111a2e] hover:bg-[#162038] text-slate-200 border border-[#1e3050] hover:border-violet-500/40 transition-all shrink-0 active:scale-[0.97]"
          >
            <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
            <span>Comparison</span>
          </button>

          <button
            onClick={() => navigate('/filters')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#111a2e] hover:bg-[#162038] text-slate-200 border border-[#1e3050] hover:border-violet-500/40 transition-all shrink-0 active:scale-[0.97]"
          >
            <Sliders className="w-3.5 h-3.5 text-violet-400" />
            <span>Digital Filters</span>
          </button>
        </div>
      </div>

      {/* Best Filter Showcase Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/50 via-[#111a2e] to-indigo-950/50 border border-violet-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
              <Award className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400 inline" />
                  <span>Top Ranked Filter After Comparison</span>
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white">
                {bestFilter.filter_name}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-lg bg-[#0c1220] border border-[#1e3050] text-xs font-mono text-slate-300">
              Family: <strong className="text-violet-400">{bestFilter.family}</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-[#0c1220] border border-[#1e3050] text-xs font-mono text-slate-300">
              Order: <strong className="text-violet-400">{bestFilter.order ?? '—'}</strong>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1220]/90 border border-[#1e3050] text-xs text-slate-300 leading-relaxed">
          <strong className="text-violet-400 font-semibold">Selection Rationale: </strong>
          {bestFilter.reason}
        </div>
      </div>

      {/* Audio Playback for Best Filter */}
      <AudioPlayer
        originalAudioId={audioId}
        filteredAudioId={bestFilter.filtered_audio_id}
        originalTitle="Original Input Audio"
        filteredTitle={`Best Filter Output (${bestFilter.filter_name})`}
      />

      {/* Key Performance Metrics Grid for Best Filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-1 shadow-lg">
          <span className="text-[11px] text-slate-400 font-sans">Stopband Attenuation</span>
          <p className="text-xl font-extrabold text-emerald-400 font-mono">
            +{bestFilter.noise_reduction_db} dB
          </p>
          <p className="text-[10px] text-slate-500">Actual measured noise rejection</p>
        </div>

        <div className="p-4 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-1 shadow-lg">
          <span className="text-[11px] text-slate-400 font-sans">Execution Latency</span>
          <p className="text-xl font-extrabold text-amber-400 font-mono">
            {bestFilter.processing_time_ms} ms
          </p>
          <p className="text-[10px] text-slate-500">Real-time compute time</p>
        </div>

        <div className="p-4 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-1 shadow-lg">
          <span className="text-[11px] text-slate-400 font-sans">Cutoff Specification</span>
          <p className="text-xl font-extrabold text-violet-400 font-mono truncate">
            {bestFilter.cutoff_label || (bestFilter.cutoff ? `${bestFilter.cutoff} Hz` : '—')}
          </p>
          <p className="text-[10px] text-slate-500">Filter cutoff frequency</p>
        </div>

        <div className="p-4 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-1 shadow-lg">
          <span className="text-[11px] text-slate-400 font-sans">Phase Response</span>
          <p className="text-xl font-extrabold text-slate-200 font-mono">
            {bestFilter.family === 'FIR' ? 'Linear Phase' : 'Non-linear'}
          </p>
          <p className="text-[10px] text-slate-500">
            {bestFilter.family === 'FIR' ? 'Zero phase distortion' : 'Minimum group delay'}
          </p>
        </div>
      </div>

      {/* Waveforms & Spectra Visual Proof for Best Filter */}
      {bestFilter.waveform && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Visual Verification (Before vs After Best Filter)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              {bestFilter.filter_name}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <WaveformChart
              originalWaveform={timeStats?.waveform}
              filteredWaveform={bestFilter.waveform}
              title={`Waveform: Input x[n] vs ${bestFilter.filter_name}`}
              height={280}
            />
            <FFTChart
              originalSpectrum={fftStats?.spectrum}
              filteredSpectrum={bestFilter.spectrum}
              title={`Frequency Spectrum: Input |X(f)| vs ${bestFilter.filter_name}`}
              height={280}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
