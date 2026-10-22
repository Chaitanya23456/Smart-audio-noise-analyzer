import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Download,
  Award,
  Sparkles,
} from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import ComparisonTable from '../components/ComparisonTable';
import WaveformChart from '../components/WaveformChart';
import FFTChart from '../components/FFTChart';
import FrequencyResponseChart from '../components/FrequencyResponseChart';
import AudioPlayer from '../components/AudioPlayer';
import api from '../services/api';

const FilterComparison = () => {
  const {
    audioId,
    filename,
    timeStats,
    fftStats,
    currentFilterConfig,
    comparisonResults,
    recommendation,
    handleCompare,
    handleRecommend,
    loading,
  } = useAudio();

  const navigate = useNavigate();
  const nyquist = timeStats?.nyquist_freq || 22050;
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Derive filter specifications from Digital Filters or baseline defaults
  const activeSpec = useMemo(() => {
    if (currentFilterConfig) {
      return {
        filter_type: currentFilterConfig.filter_type || 'lowpass',
        cutoff: currentFilterConfig.cutoff || Math.min(2500, Math.round(nyquist * 0.5)),
        low_cutoff: currentFilterConfig.low_cutoff || 300,
        high_cutoff: currentFilterConfig.high_cutoff || Math.min(3000, Math.round(nyquist * 0.8)),
        fir_order: currentFilterConfig.family === 'FIR' ? currentFilterConfig.order : 50,
        iir_order: currentFilterConfig.family === 'IIR' ? currentFilterConfig.order : 4,
        ripple: currentFilterConfig.ripple || 1.0,
      };
    }
    return {
      filter_type: 'lowpass',
      cutoff: Math.min(2500, Math.round(nyquist * 0.5)),
      low_cutoff: 300,
      high_cutoff: Math.min(3000, Math.round(nyquist * 0.8)),
      fir_order: 50,
      iir_order: 4,
      ripple: 1.0,
    };
  }, [currentFilterConfig, nyquist]);

  // Run benchmark with active specifications
  const runBenchmark = async () => {
    if (!audioId) return;
    await handleCompare(activeSpec);
    if (!recommendation) {
      await handleRecommend();
    }
  };

  // Automatically benchmark and fetch recommendation as soon as audio is available
  useEffect(() => {
    if (audioId) {
      if (comparisonResults.length === 0 && !loading) {
        handleCompare(activeSpec);
      }
      if (!recommendation && !loading) {
        handleRecommend();
      }
    }
  }, [audioId]);

  // Find index of the recommended filter inside comparisonResults
  const matchingFilterIdx = useMemo(() => {
    if (!recommendation?.recommended_config || !comparisonResults?.length) return -1;
    const recCfg = recommendation.recommended_config;
    const targetFamily = (recCfg.family || '').toLowerCase();
    const targetMethod = (recCfg.method || recCfg.window || '').toLowerCase();

    return comparisonResults.findIndex((item) => {
      const itemFamily = (item.family || '').toLowerCase();
      const itemMethod = (item.method || item.window || '').toLowerCase();
      if (targetFamily && itemFamily !== targetFamily) return false;
      if (targetMethod && (itemMethod.includes(targetMethod) || targetMethod.includes(itemMethod))) return true;
      return false;
    });
  }, [recommendation, comparisonResults]);

  // Automatically select suggested filter when loaded
  useEffect(() => {
    if (matchingFilterIdx >= 0) {
      setSelectedIdx(matchingFilterIdx);
    }
  }, [matchingFilterIdx]);

  if (!audioId) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center rounded-2xl bg-[#111a2e] border border-[#1e3050] space-y-4">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Audio Signal Loaded</h3>
        <p className="text-xs text-slate-400">
          Please upload audio or load the demo signal from the Dashboard before comparing digital filters.
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

  const selectedFilter = comparisonResults && comparisonResults.length > selectedIdx
    ? comparisonResults[selectedIdx]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e3050]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Filter Comparison (FIR & IIR)
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {filename}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic comparison of all 4 FIR window methods (Hamming, Hann, Blackman, Rectangular) and both IIR methods (Butterworth, Chebyshev) on your audio signal.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={runBenchmark}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#111a2e] hover:bg-[#162038] text-slate-200 border border-[#1e3050] hover:border-violet-500/40 transition-all disabled:opacity-50 active:scale-[0.97]"
            title="Re-run comparison of all 6 filters"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Comparing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => navigate('/filters')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#111a2e] hover:bg-[#162038] text-slate-200 border border-[#1e3050] hover:border-violet-500/40 transition-all shrink-0 active:scale-[0.97]"
          >
            <Sliders className="w-3.5 h-3.5 text-violet-400" />
            <span>Digital Filters</span>
          </button>

          <button
            onClick={() => navigate('/results')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all shrink-0 active:scale-[0.97]"
          >
            <span>Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Filter Recommendation Banner */}
      {recommendation?.recommendation_status === 'success' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-[#111a2e] to-indigo-950/40 border border-violet-500/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md">
                <Award className="w-5 h-5 stroke-[2.2] text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400 inline" />
                  <span>Suggested Filter Recommendation</span>
                </span>
                <h3 className="text-base font-bold text-white">
                  {recommendation.recommended_filter_name}
                </h3>
              </div>
            </div>

            {matchingFilterIdx >= 0 && (
              <button
                onClick={() => setSelectedIdx(matchingFilterIdx)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20 transition-all shrink-0 active:scale-[0.97]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>View Suggested Filter</span>
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[#0c1220]/80 border border-[#1e3050] text-xs text-slate-300 leading-relaxed">
            <strong className="text-violet-400 font-semibold">Engineering Rationale: </strong>
            {recommendation.reason}
          </div>
        </div>
      )}

      {/* Read-Only Benchmark Specifications Summary */}
      <div className="p-3.5 rounded-xl bg-[#111a2e] border border-[#1e3050] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-violet-400" />
          <span className="text-slate-300 font-semibold">
            Comparison Specifications:
          </span>
          <span className="text-slate-400">
            {currentFilterConfig ? 'Applied from Digital Filters' : 'Calculated Baseline'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-[#0c1220] border border-[#1e3050] text-slate-300">
            Type: <strong className="text-violet-300 capitalize">{activeSpec.filter_type}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0c1220] border border-[#1e3050] text-slate-300">
            Cutoff:{' '}
            <strong className="text-violet-300">
              {activeSpec.filter_type === 'bandpass' || activeSpec.filter_type === 'bandstop'
                ? `${activeSpec.low_cutoff} - ${activeSpec.high_cutoff} Hz`
                : `${activeSpec.cutoff} Hz`}
            </strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0c1220] border border-[#1e3050] text-slate-300">
            FIR Order: <strong className="text-violet-300">{activeSpec.fir_order}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0c1220] border border-[#1e3050] text-slate-300">
            IIR Order: <strong className="text-violet-300">{activeSpec.iir_order}</strong>
          </span>
        </div>
      </div>

      {/* 6-Filter Benchmark Summary Table */}
      <ComparisonTable
        comparisonData={comparisonResults}
        selectedIndex={selectedIdx}
        onSelectIndex={setSelectedIdx}
      />

      {/* Selected Filter Detail Inspector */}
      {selectedFilter && (
        <div className="space-y-5 pt-2">
          {/* Detail Header & Audio Playback */}
          <div className="p-5 rounded-2xl bg-[#111a2e] border border-violet-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e3050]">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-violet-400" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-violet-400 font-semibold tracking-wider">
                    Inspecting Filter {selectedIdx + 1} of 6
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {selectedFilter.filter_name}
                  </h3>
                </div>
              </div>

              {selectedFilter.filtered_audio_id && (
                <a
                  href={api.getAudioDownloadUrl(selectedFilter.filtered_audio_id)}
                  download
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-all shrink-0 active:scale-[0.97]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Filtered WAV</span>
                </a>
              )}
            </div>

            {/* Audio Player for this filter */}
            <AudioPlayer
              originalAudioId={audioId}
              filteredAudioId={selectedFilter.filtered_audio_id}
              originalTitle="Input Signal (A)"
              filteredTitle={`Filtered: ${selectedFilter.filter_name} (B)`}
            />

            {/* Performance Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#0c1220] border border-[#1e3050] space-y-0.5">
                <span className="text-[10px] text-slate-500 font-sans">Execution Latency</span>
                <p className="text-base font-bold text-amber-400">
                  {selectedFilter.processing_time_ms} ms
                </p>
                <p className="text-[9px] text-slate-600">Actual measured compute</p>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1220] border border-[#1e3050] space-y-0.5">
                <span className="text-[10px] text-slate-500 font-sans">Noise Attenuation</span>
                <p className="text-base font-bold text-emerald-400">
                  +{selectedFilter.noise_reduction_db} dB
                </p>
                <p className="text-[9px] text-slate-600">Stopband reduction</p>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1220] border border-[#1e3050] space-y-0.5">
                <span className="text-[10px] text-slate-500 font-sans">SNR Improvement</span>
                <p className="text-base font-bold text-violet-400">
                  {selectedFilter.has_ground_truth && selectedFilter.delta_snr_db != null
                    ? `+${selectedFilter.delta_snr_db} dB`
                    : 'N/A'}
                </p>
                <p className="text-[9px] text-slate-600">
                  {selectedFilter.has_ground_truth ? 'Exact Ground Truth' : 'Requires clean reference'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1220] border border-[#1e3050] space-y-0.5">
                <span className="text-[10px] text-slate-500 font-sans">Phase Linearity</span>
                <p className="text-base font-bold text-slate-200">
                  {selectedFilter.family === 'FIR' ? 'Strictly Linear' : 'Non-linear'}
                </p>
                <p className="text-[9px] text-slate-600">
                  {selectedFilter.family === 'FIR' ? 'Zero phase smearing' : 'Minimum group delay'}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Magnitude Response */}
          {selectedFilter.frequency_response && (
            <FrequencyResponseChart
              responseData={selectedFilter.frequency_response}
              title={`Theoretical Magnitude Response |H(e^jω)|: ${selectedFilter.filter_name}`}
              height={300}
            />
          )}

          {/* Overlaid Waveforms & Spectra */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <WaveformChart
              originalWaveform={timeStats.waveform}
              filteredWaveform={selectedFilter.waveform}
              title={`Time-Domain Waveform: Input x[n] vs ${selectedFilter.filter_name}`}
              height={280}
            />
            <FFTChart
              originalSpectrum={fftStats.spectrum}
              filteredSpectrum={selectedFilter.spectrum}
              title={`Frequency Spectrum: Input |X(f)| vs ${selectedFilter.filter_name}`}
              height={280}
            />
          </div>
        </div>
      )}

      {/* Trade-offs Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">
            FIR Window Methods Trade-offs
          </h4>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong className="text-slate-300">Hamming:</strong> -43 dB first sidelobe attenuation; well-rounded balance of mainlobe width and stopband rejection.</li>
            <li><strong className="text-slate-300">Hann (Hanning):</strong> -31 dB sidelobe peak with faster asymptotic falloff (18 dB/octave); ideal for general audio smoothing.</li>
            <li><strong className="text-slate-300">Blackman:</strong> -58 dB stopband attenuation; ultra-deep rejection of high-frequency noise with wider transition band.</li>
            <li><strong className="text-slate-300">Rectangular:</strong> Narrowest transition band (mainlobe width 4π/M) but highest spectral leakage (-13 dB sidelobes).</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            IIR Filter Design Trade-offs
          </h4>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong className="text-slate-300">Butterworth:</strong> Maximally flat passband response with no ripples. Smooth roll-off and monotonic attenuation in both bands.</li>
            <li><strong className="text-slate-300">Chebyshev Type I:</strong> Steeper transition roll-off than Butterworth for the same order, trading equiripple ripples in the passband.</li>
            <li><strong className="text-slate-300">Numerical Stability:</strong> All IIR filters designed using Second-Order Sections (SOS) via `scipy.signal` for superior numerical stability.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FilterComparison;
