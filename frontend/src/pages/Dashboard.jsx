import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Mic,
  Sparkles,
  ArrowRight,
  FileAudio,
  Activity,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import AudioUploader from '../components/AudioUploader';
import AudioRecorder from '../components/AudioRecorder';
import AudioPlayer from '../components/AudioPlayer';

const Dashboard = () => {
  const {
    audioId,
    filename,
    channels,
    timeStats,
    handleGenerateDemo,
    loading,
    loadingMessage,
    error,
    isCalibratedDemo,
  } = useAudio();

  const navigate = useNavigate();
  const [inputTab, setInputTab] = useState('upload'); // 'upload' | 'record'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Project Header Console */}
      <div className="p-6 rounded-2xl bg-[#0e1626] border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 text-[11px] font-semibold mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>COLLEGE DSP MINI-PROJECT WORKBENCH</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              Smart Audio Noise Analyzer
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Time-domain waveform, DFT/FFT spectrum analysis, and FIR/IIR filter design.
            </p>
          </div>

          {/* Load Demo Signal Quick Action */}
          <button
            onClick={() => handleGenerateDemo(['hum', 'hiss'])}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-950/50 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            title="Load calibrated audio with known harmonics, 50Hz hum, and ground-truth reference"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>{loading ? 'Synthesizing...' : 'Load Calibrated Demo'}</span>
          </button>
        </div>

        {/* Global Loading Banner */}
        {loading && (
          <div className="mt-4 p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/80 flex items-center space-x-3 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{loadingMessage || 'Executing DSP algorithms in SciPy core...'}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 flex items-center space-x-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Audio Input Card with Tabs: Upload vs Record */}
      <div className="p-6 rounded-2xl bg-[#0e1626] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-200">Signal Source Selection</h2>
          </div>

          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setInputTab('upload')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                inputTab === 'upload'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Audio</span>
            </button>
            <button
              onClick={() => setInputTab('record')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                inputTab === 'record'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Microphone Input</span>
            </button>
          </div>
        </div>

        {inputTab === 'upload' ? (
          <AudioUploader />
        ) : (
          <AudioRecorder />
        )}
      </div>

      {/* Audio Player for Loaded Signal */}
      {audioId && (
        <div className="space-y-4">
          <AudioPlayer
            originalAudioId={audioId}
            originalTitle={filename ? `Loaded Audio: ${filename}` : 'Input Audio'}
          />

          {/* Basic Signal Telemetry Information */}
          {timeStats && (
            <div className="p-5 rounded-2xl bg-[#0e1626] border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-200 flex items-center space-x-2">
                  <FileAudio className="w-4 h-4 text-cyan-400" />
                  <span>Signal Telemetry & Parameters</span>
                </h3>
                {isCalibratedDemo && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Ground-Truth Reference Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className="p-4 rounded-xl bg-[#080c14] border border-slate-800/80 space-y-1">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Duration (T)</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100">
                    {timeStats.duration} <span className="text-xs font-normal text-slate-400">sec</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    N = {timeStats.num_samples?.toLocaleString()} samples
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#080c14] border border-slate-800/80 space-y-1">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sampling Rate (Fs)</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100">
                    {timeStats.sampling_rate} <span className="text-xs font-normal text-slate-400">Hz</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Nyquist Limit: {timeStats.nyquist_freq} Hz
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#080c14] border border-slate-800/80 space-y-1">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Channels</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100">
                    {channels === 1 ? '1 (Mono)' : `${channels} (Stereo)`}
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans">
                    {channels === 1 ? 'Native mono stream' : 'Downmixed to mono'}
                  </p>
                </div>
              </div>

              {/* Action Button to Proceed */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => navigate('/analysis')}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
                >
                  <span>Proceed to Signal Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
