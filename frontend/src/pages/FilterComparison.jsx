import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Download,
  Award,
  Sparkles,
  PlusCircle,
  Trash2,
  RefreshCw,
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
    comparisonList,
    comparisonResults,
    removeFromComparison,
    clearComparison,
    addToComparison,
    handleCompare,
    currentFilterConfig,
    loading,
  } = useAudio();

  const navigate = useNavigate();
  const nyquist = timeStats?.nyquist_freq || 22050;
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Active items: user-added filters, falling back to comparisonResults if any
  const displayedFilters = useMemo(() => {
    if (comparisonList && comparisonList.length > 0) {
      return comparisonList;
    }
    return comparisonResults || [];
  }, [comparisonList, comparisonResults]);

  // Evaluate the best filter dynamically among the compared samples
  const bestFilterEval = useMemo(() => {
    if (!displayedFilters || displayedFilters.length === 0) return null;

    if (displayedFilters.length === 1) {
      const f = displayedFilters[0];
      return {
        bestIndex: 0,
        filter: f,
        reason: `${f.filter_name} is currently evaluated with +${f.noise_reduction_db ?? 0} dB stopband noise reduction and ${f.processing_time_ms ?? 0} ms processing latency.`,
      };
    }

    const maxAtten = Math.max(...displayedFilters.map((f) => f.noise_reduction_db ?? 0), 0.1);
    const minLatency = Math.min(...displayedFilters.map((f) => f.processing_time_ms ?? 1), 1);
    const maxLatency = Math.max(...displayedFilters.map((f) => f.processing_time_ms ?? 1), minLatency + 0.1);

    let bestIdx = 0;
    let highestScore = -Infinity;

    displayedFilters.forEach((f, idx) => {
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

    const best = displayedFilters[bestIdx];
    return {
      bestIndex: bestIdx,
      filter: best,
      reason: `${best.filter_name} achieved the optimal balance among your compared samples: +${best.noise_reduction_db} dB stopband noise reduction, ${best.processing_time_ms} ms processing latency, and ${best.phase_type || (best.family === 'FIR' ? 'Linear Phase' : 'IIR')} characteristics.`,
    };
  }, [displayedFilters]);

  // Adjust selectedIdx if list shrinks
  useEffect(() => {
    if (selectedIdx >= displayedFilters.length && displayedFilters.length > 0) {
      setSelectedIdx(0);
    }
  }, [displayedFilters.length, selectedIdx]);

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

  // Load all 6 standard filters into comparison as a quick baseline
  const handleLoadStandardSix = async () => {
    const spec = {
      filter_type: currentFilterConfig?.filter_type || 'lowpass',
      cutoff: currentFilterConfig?.cutoff || Math.min(2500, Math.round(nyquist * 0.5)),
      fir_order: 50,
      iir_order: 4,
      ripple: 1.0,
    };
    const results = await handleCompare(spec);
    if (results && results.length > 0) {
      results.forEach((item) => {
        addToComparison(item);
      });
    }
  };

  const selectedFilter = displayedFilters.length > selectedIdx
    ? displayedFilters[selectedIdx]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e3050]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Filter Comparison
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {displayedFilters.length} {displayedFilters.length === 1 ? 'Filter Added' : 'Filters Added'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare all custom digital filters you added in Digital Filters and identify the best-performing design.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => navigate('/filters')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#111a2e] hover:bg-[#162038] text-slate-200 border border-[#1e3050] hover:border-violet-500/40 transition-all shrink-0 active:scale-[0.97]"
          >
            <PlusCircle className="w-3.5 h-3.5 text-violet-400" />
            <span>Add More Filters</span>
          </button>

          {displayedFilters.length > 0 && (
            <button
              onClick={clearComparison}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#111a2e] hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-[#1e3050] hover:border-red-500/30 transition-all shrink-0 active:scale-[0.97]"
              title="Clear all filters from comparison"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={() => navigate('/results')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all shrink-0 active:scale-[0.97]"
          >
            <span>Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empty State when no filters have been added */}
      {displayedFilters.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#111a2e] border border-[#1e3050] text-center space-y-4 max-w-xl mx-auto shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Filters Added for Comparison Yet</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Go to <strong>Digital Filters</strong>, design your filter (e.g. Hamming, Hann, Blackman, Rectangular, Butterworth, or Chebyshev), click <strong>Apply</strong>, and then press <strong>&ldquo;Add for Comparison&rdquo;</strong> to collect multiple samples here.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/filters')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-[0.97]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Go to Digital Filters</span>
            </button>
            <button
              onClick={handleLoadStandardSix}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0c1220] hover:bg-[#162038] text-slate-300 border border-[#1e3050] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Load All 6 Standard Filters</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Best Filter Among Compared Banner */}
          {bestFilterEval && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-[#111a2e] to-indigo-950/40 border border-violet-500/40 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-amber-400 shadow-md">
                    <Award className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-400 inline" />
                      <span>Best Filter Among Compared Samples</span>
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {bestFilterEval.filter.filter_name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedIdx(bestFilterEval.bestIndex)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20 transition-all shrink-0 active:scale-[0.97]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Inspect Best Filter</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0c1220]/80 border border-[#1e3050] text-xs text-slate-300 leading-relaxed">
                <strong className="text-violet-400 font-semibold">Evaluation Rationale: </strong>
                {bestFilterEval.reason}
              </div>
            </div>
          )}

          {/* Filter Comparison Table */}
          <ComparisonTable
            comparisonData={displayedFilters}
            selectedIndex={selectedIdx}
            onSelectIndex={setSelectedIdx}
            bestIndex={bestFilterEval?.bestIndex}
            onRemove={removeFromComparison}
            title={`Comparison of ${displayedFilters.length} Added Filters`}
          />

          {/* Selected Filter Detail Inspector */}
          {selectedFilter && (
            <div className="space-y-5 pt-2">
              <div className="p-5 rounded-2xl bg-[#111a2e] border border-violet-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e3050]">
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 rounded-full bg-violet-400" />
                    <div>
                      <span className="text-[10px] font-mono uppercase text-violet-400 font-semibold tracking-wider">
                        Inspecting Sample {selectedIdx + 1} of {displayedFilters.length}
                      </span>
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <span>{selectedFilter.filter_name}</span>
                        {bestFilterEval?.bestIndex === selectedIdx && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ★ Best Ranked
                          </span>
                        )}
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
                      {selectedFilter.family === 'FIR' ? 'Zero phase distortion' : 'Minimum group delay'}
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
        </>
      )}
    </div>
  );
};

export default FilterComparison;
