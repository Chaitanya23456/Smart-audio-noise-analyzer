import React, { useState, useEffect } from 'react';
import { Sliders, ArrowRight, Download, CheckCircle2, BarChart3, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../hooks/useAudio';
import FilterControls from '../components/FilterControls';
import FrequencyResponseChart from '../components/FrequencyResponseChart';
import AudioPlayer from '../components/AudioPlayer';
import WaveformChart from '../components/WaveformChart';
import FFTChart from '../components/FFTChart';
import api from '../services/api';

const DigitalFilters = () => {
  const {
    audioId,
    filteredAudioId,
    filename,
    timeStats,
    fftStats,
    filteredTimeStats,
    filteredFftStats,
    frequencyResponse,
    filterMetrics,
    comparisonList,
    addToComparison,
  } = useAudio();

  const navigate = useNavigate();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setJustAdded(false);
  }, [filteredAudioId]);

  const handleAddCurrentFilter = () => {
    if (addToComparison) {
      addToComparison();
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 3000);
    }
  };

  if (!audioId) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center rounded-2xl bg-[#111a2e] border border-[#1e3050] space-y-4">
        <Sliders className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Audio Signal Selected</h3>
        <p className="text-xs text-slate-400">
          Please upload audio or load the demo signal from the Dashboard before applying digital filters.
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e3050]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Digital Filters
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {filename}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Design FIR windowed filters (Hamming, Hann, Blackman, Rectangular) or IIR filters (Butterworth, Chebyshev), inspect frequency response, and filter audio in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {filteredAudioId && (
            <a
              href={api.getAudioDownloadUrl(filteredAudioId)}
              download
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-all shrink-0 active:scale-[0.97]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export WAV</span>
            </a>
          )}

          <button
            onClick={() => navigate('/comparison')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#111a2e] hover:bg-[#162038] text-slate-200 border border-[#1e3050] hover:border-violet-500/40 transition-all shrink-0 active:scale-[0.97]"
            title="View filters added for comparison"
          >
            <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
            <span>View Comparison</span>
            {comparisonList && comparisonList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-violet-600 text-white font-mono font-bold leading-none">
                {comparisonList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/results')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all shrink-0 active:scale-[0.97]"
          >
            <span>View Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Filter Controls & Frequency Response */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <FilterControls />
        </div>
        <div className="lg:col-span-7">
          <FrequencyResponseChart
            responseData={frequencyResponse}
            height={340}
            title="Frequency Response |H(e^jω)| (dB vs Hz)"
          />
        </div>
      </div>

      {/* Status Notice & Add to Comparison Bar */}
      {filteredAudioId && filterMetrics && (
        <div className="p-4 rounded-xl bg-[#111a2e] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">
              Filter Applied: {filterMetrics.filter_family} (Order {filterMetrics.filter_order})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-slate-300">
            <span>Latency: <strong className="text-amber-400">{filterMetrics.processing_time_ms} ms</strong></span>
            <span>Stopband Rejection: <strong className="text-emerald-400">+{filterMetrics.noise_reduction_db} dB</strong></span>

            <button
              onClick={handleAddCurrentFilter}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all shadow-md active:scale-95 ${
                justAdded
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/20'
              }`}
              title="Add this applied filter to comparison"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{justAdded ? '✓ Added to Comparison' : 'Add for Comparison'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filtered Waveform & Spectrum */}
      {filteredAudioId && filteredTimeStats && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Filtered Audio Analysis
            </h2>
            <span className="text-[10px] font-mono text-slate-500">
              Before vs After Filtering
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <WaveformChart
              originalWaveform={timeStats?.waveform}
              filteredWaveform={filteredTimeStats?.waveform}
              title="Time-Domain Waveform: Input x[n] vs Filtered y[n]"
              height={280}
            />
            <FFTChart
              originalSpectrum={fftStats?.spectrum}
              filteredSpectrum={filteredFftStats?.spectrum}
              title="Frequency Spectrum: Input |X(f)| vs Filtered |Y(f)|"
              height={280}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalFilters;
