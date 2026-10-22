import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Download,
  Info,
  Clock,
  Zap,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import AudioPlayer from '../components/AudioPlayer';
import WaveformChart from '../components/WaveformChart';
import FFTChart from '../components/FFTChart';
import api from '../services/api';

const Results = () => {
  const {
    audioId,
    filteredAudioId,
    filename,
    timeStats,
    fftStats,
    filteredTimeStats,
    filteredFftStats,
    filterMetrics,
    recommendation,
    handleRecommend,
    handleApplyFilter,
    loading,
    isCalibratedDemo,
  } = useAudio();

  const navigate = useNavigate();

  useEffect(() => {
    if (audioId && !recommendation && !loading) {
      handleRecommend();
    }
  }, [audioId, recommendation]);

  const applyRecommended = async () => {
    if (recommendation?.recommended_config) {
      await handleApplyFilter(recommendation.recommended_config, true);
    }
  };

  if (!audioId) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center rounded-2xl bg-[#111a2e] border border-[#1e3050] space-y-4">
        <Award className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Audio Signal Loaded</h3>
        <p className="text-xs text-slate-400">
          Please upload or generate an audio signal to view filtering results and recommendations.
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

  const hasGroundTruth = filterMetrics?.has_ground_truth || isCalibratedDemo;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e3050]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Results & Recommendation
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {filename}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare time-domain waveforms, frequency spectra, and objective performance metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {filteredAudioId && (
            <a
              href={api.getAudioDownloadUrl(filteredAudioId)}
              download
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-all shrink-0 active:scale-[0.97]"
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
            <span>Compare 6 Filters</span>
          </button>
        </div>
      </div>

      {/* Audio Playback Bar */}
      <AudioPlayer
        originalAudioId={audioId}
        filteredAudioId={filteredAudioId}
        originalTitle="Input Signal (A)"
        filteredTitle="Filtered Output (B)"
      />

      {/* Recommended Filter Card */}
      {recommendation?.recommendation_status === 'success' && (
        <div className="p-5 rounded-2xl bg-[#111a2e] border border-violet-500/30 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-violet-400">
                  Recommended Filter
                </span>
                <h3 className="text-base font-bold text-white">
                  {recommendation.recommended_filter_name}
                </h3>
              </div>
            </div>

            <button
              onClick={applyRecommended}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 shrink-0 active:scale-[0.97]"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{loading ? 'Applying...' : 'Apply Recommended Filter'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-[#0c1220] p-3.5 rounded-xl border border-[#1e3050]">
            <strong className="text-violet-400 font-semibold">Suitability Rationale: </strong>
            {recommendation.reason}
          </p>
        </div>
      )}

      {/* Selected Filter & Performance Summary Table */}
      <div className="rounded-xl bg-[#111a2e] border border-[#1e3050] shadow-xl overflow-hidden">
        <div className="p-4 bg-[#0c1220] border-b border-[#1e3050] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Performance Metrics
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {hasGroundTruth ? (
              <span className="text-emerald-400 flex items-center space-x-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 inline" />
                <span>Ground-Truth Clean Reference Active</span>
              </span>
            ) : (
              <span className="text-amber-400 flex items-center space-x-1 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 inline" />
                <span>Reference-Free Mode (True SNR Requires Known Signal)</span>
              </span>
            )}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0a1018] text-slate-500 border-b border-[#1e3050] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-sans">Applied Filter</th>
                <th className="py-2.5 px-4">Order</th>
                <th className="py-2.5 px-4">Latency</th>
                <th className="py-2.5 px-4">Noise Attenuation</th>
                <th className="py-2.5 px-4">SNR Gain (ΔSNR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3050]">
              <tr className="hover:bg-[#162038]/50">
                <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                  {filterMetrics?.filter_family ? `${filterMetrics.filter_family} Filter` : 'Selected Filter'}
                </td>
                <td className="py-3 px-4 text-slate-300">
                  {filterMetrics?.filter_order ?? '—'}
                </td>
                <td className="py-3 px-4 text-amber-400 font-bold">
                  {filterMetrics?.processing_time_ms != null ? `${filterMetrics.processing_time_ms} ms` : '—'}
                </td>
                <td className="py-3 px-4 text-emerald-400 font-bold">
                  {filterMetrics?.noise_reduction_db != null ? `+${filterMetrics.noise_reduction_db} dB` : '—'}
                </td>
                <td className="py-3 px-4">
                  {hasGroundTruth && filterMetrics?.delta_snr_db != null ? (
                    <span className="text-violet-400 font-bold">+{filterMetrics.delta_snr_db} dB</span>
                  ) : (
                    <span className="text-slate-500 italic text-[11px] font-sans">
                      N/A (Requires known clean reference)
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-[#0a1018] border-t border-[#1e3050] text-[11px] text-slate-400">
          <strong className="text-slate-300">DSP Engineering Note: </strong>
          {hasGroundTruth ? (
            <span>
              The SNR improvement is computed mathematically as ΔSNR = SNR_out - SNR_in against the exact clean reference signal of the calibrated demo.
            </span>
          ) : (
            <span>
              Without an uploaded clean reference signal, true SNR improvement cannot be calculated directly because the pure noise-free audio is unknown mathematically.
            </span>
          )}
        </div>
      </div>

      {/* Waveforms & Spectra Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WaveformChart
          originalWaveform={timeStats.waveform}
          filteredWaveform={filteredTimeStats?.waveform}
          title="Waveform: Input x[n] vs Filtered y[n]"
          height={280}
        />
        <FFTChart
          originalSpectrum={fftStats.spectrum}
          filteredSpectrum={filteredFftStats?.spectrum}
          title="Frequency Spectrum: Input |X(f)| vs Filtered |Y(f)|"
          height={280}
        />
      </div>

      {/* Evaluated Filter Benchmarks */}
      {recommendation?.all_evaluated_candidates && recommendation.all_evaluated_candidates.length > 0 && (
        <div className="rounded-xl bg-[#111a2e] border border-[#1e3050] shadow-xl overflow-hidden">
          <div className="p-4 bg-[#0c1220] border-b border-[#1e3050]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Evaluated Filter Topologies
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Comparison across candidate topologies evaluated for this signal.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a1018] text-slate-500 border-b border-[#1e3050] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-sans">Topology</th>
                  <th className="py-2.5 px-4">Family</th>
                  <th className="py-2.5 px-4">Order</th>
                  <th className="py-2.5 px-4">Attenuation</th>
                  <th className="py-2.5 px-4">Latency</th>
                  <th className="py-2.5 px-4 font-sans">Phase Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3050]">
                {recommendation.all_evaluated_candidates.map((cand, idx) => {
                  const isTop = cand.filter_name === recommendation.recommended_filter_name;
                  return (
                    <tr key={idx} className={isTop ? 'bg-violet-500/10' : 'hover:bg-[#162038]/50'}>
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-200 flex items-center space-x-2">
                        {isTop && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />}
                        <span>{cand.filter_name}</span>
                      </td>
                      <td className="py-2.5 px-4 text-violet-400">{cand.family}</td>
                      <td className="py-2.5 px-4 text-slate-300">{cand.order}</td>
                      <td className="py-2.5 px-4 text-emerald-400 font-bold">+{cand.noise_reduction_db} dB</td>
                      <td className="py-2.5 px-4 text-amber-400">{cand.processing_time_ms} ms</td>
                      <td className="py-2.5 px-4 font-sans text-slate-400">{cand.phase_response}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
