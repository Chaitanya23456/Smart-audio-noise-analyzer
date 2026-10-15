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
  RotateCcw,
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

  // Fetch recommendation if not yet loaded
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
      <div className="max-w-xl mx-auto p-10 text-center rounded-2xl bg-[#0e1626] border border-slate-800 space-y-4">
        <Award className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Audio Signal Loaded</h3>
        <p className="text-xs text-slate-400">
          Please upload or generate an audio signal to view filtering results and recommendations.
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

  const hasGroundTruth = filterMetrics?.has_ground_truth || isCalibratedDemo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black uppercase text-slate-100 tracking-tight">
              Results & Recommendation
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {filename}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare time-domain waveforms, frequency spectra, and objective performance metrics before and after filtering.
          </p>
        </div>

        {filteredAudioId && (
          <a
            href={api.getAudioDownloadUrl(filteredAudioId)}
            download
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-all shrink-0 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Filtered WAV</span>
          </a>
        )}
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
        <div className="p-5 rounded-2xl bg-[#0e1626] border border-cyan-500/30 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Recommended Filter Candidate
                </span>
                <h3 className="text-base font-bold text-white">
                  {recommendation.recommended_filter_name}
                </h3>
              </div>
            </div>

            <button
              onClick={applyRecommended}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50 shrink-0 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>{loading ? 'Applying...' : 'Apply Recommended Filter'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-[#080c14] p-3.5 rounded-xl border border-slate-800">
            <strong className="text-cyan-400 font-semibold">Engineering Suitability Rationale: </strong>
            {recommendation.reason}
          </p>
        </div>
      )}

      {/* Selected Filter & Performance Summary (Compact Table) */}
      <div className="rounded-xl bg-[#0e1626] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Measured Performance Metrics
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
            <thead className="bg-[#080c14] text-slate-500 border-b border-slate-800/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-sans">Applied Filter</th>
                <th className="py-2.5 px-4">Order</th>
                <th className="py-2.5 px-4">Processing Latency</th>
                <th className="py-2.5 px-4">Noise Reduction</th>
                <th className="py-2.5 px-4">SNR Gain (ΔSNR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/30">
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
                    <span className="text-cyan-400 font-bold">+{filterMetrics.delta_snr_db} dB</span>
                  ) : (
                    <span className="text-slate-500 italic text-[11px] font-sans">
                      N/A (True SNR requires clean reference)
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Scientific Explanation on SNR */}
        <div className="p-3.5 bg-[#080c14] border-t border-slate-800 text-[11px] text-slate-400">
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

      {/* Overlaid Waveforms & Overlaid Spectra Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaveformChart
          originalWaveform={timeStats.waveform}
          filteredWaveform={filteredTimeStats?.waveform}
          title="Waveform Comparison: Input x[n] vs Filtered y[n]"
          height={280}
        />
        <FFTChart
          originalSpectrum={fftStats.spectrum}
          filteredSpectrum={filteredFftStats?.spectrum}
          title="Spectrum Comparison: Input |X(f)| vs Filtered |Y(f)|"
          height={280}
        />
      </div>

      {/* Candidate Filters Compact Comparison Table */}
      {recommendation?.all_evaluated_candidates && recommendation.all_evaluated_candidates.length > 0 && (
        <div className="rounded-xl bg-[#0e1626] border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Evaluated Filter Benchmarks
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Comparison across candidate topologies evaluated for this signal profile.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#080c14] text-slate-500 border-b border-slate-800/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-sans">Filter Topology</th>
                  <th className="py-2.5 px-4">Family</th>
                  <th className="py-2.5 px-4">Order</th>
                  <th className="py-2.5 px-4">Attenuation</th>
                  <th className="py-2.5 px-4">Latency</th>
                  <th className="py-2.5 px-4 font-sans">Phase Linearity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recommendation.all_evaluated_candidates.map((cand, idx) => {
                  const isTop = cand.filter_name === recommendation.recommended_filter_name;
                  return (
                    <tr key={idx} className={isTop ? 'bg-cyan-950/20' : 'hover:bg-slate-800/30'}>
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-200 flex items-center space-x-2">
                        {isTop && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />}
                        <span>{cand.filter_name}</span>
                      </td>
                      <td className="py-2.5 px-4 text-cyan-400">{cand.family}</td>
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
