import React from 'react';
import { Sliders, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../hooks/useAudio';
import FilterControls from '../components/FilterControls';
import FrequencyResponseChart from '../components/FrequencyResponseChart';
import AudioPlayer from '../components/AudioPlayer';
import api from '../services/api';

const DigitalFilters = () => {
  const {
    audioId,
    filteredAudioId,
    filename,
    frequencyResponse,
    filterMetrics,
  } = useAudio();

  const navigate = useNavigate();

  if (!audioId) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center rounded-2xl bg-[#0e1626] border border-slate-800 space-y-4">
        <Sliders className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Audio Signal Selected</h3>
        <p className="text-xs text-slate-400">
          Please upload audio or load the demo signal from the Dashboard before applying digital filters.
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black uppercase text-slate-100 tracking-tight">
              Digital Filters
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {filename}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Design FIR windowed filters or IIR Butterworth filters, inspect frequency response, and filter audio in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {filteredAudioId && (
            <a
              href={api.getAudioDownloadUrl(filteredAudioId)}
              download
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-all shrink-0 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Filtered WAV</span>
            </a>
          )}

          <button
            onClick={() => navigate('/results')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/50 transition-all shrink-0 active:scale-95"
          >
            <span>View Results & Recommendation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Audio Playback Bar with A/B Toggle (Original vs Filtered) */}
      <AudioPlayer
        originalAudioId={audioId}
        filteredAudioId={filteredAudioId}
        originalTitle="Input Signal (A)"
        filteredTitle="Filtered Output (B)"
      />

      {/* Main Filter Configuration & Frequency Response View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

      {/* Filter Application Status Notice */}
      {filteredAudioId && filterMetrics && (
        <div className="p-4 rounded-xl bg-[#0e1626] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">
              Filter Applied Successfully: {filterMetrics.filter_family} (Order {filterMetrics.filter_order})
            </span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-slate-300">
            <span>Latency: <strong className="text-amber-400">{filterMetrics.processing_time_ms} ms</strong></span>
            <span>Stopband Rejection: <strong className="text-emerald-400">+{filterMetrics.noise_reduction_db} dB</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalFilters;
