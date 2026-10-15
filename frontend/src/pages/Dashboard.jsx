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
  const [inputTab, setInputTab] = useState('upload');

  return (
    <div className="w-full space-y-5">
      {/* Project Header */}
      <div className="p-6 rounded-2xl bg-[#111a2e] border border-[#1e3050] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-semibold mb-2">
              <Cpu className="w-3 h-3" />
              <span>DSP MINI-PROJECT</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Smart Audio Noise Analyzer
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Time-domain waveform, DFT/FFT spectrum analysis, and FIR/IIR filter design.
            </p>
          </div>

          {/* Load Demo Signal */}
          <button
            onClick={() => handleGenerateDemo(['hum', 'hiss'])}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-[0.97] disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{loading ? 'Loading...' : 'Load Demo Signal'}</span>
          </button>
        </div>

        {/* Loading Banner */}
        {loading && (
          <div className="mt-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center space-x-3 text-violet-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <span>{loadingMessage || 'Processing audio signal...'}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Audio Input Card */}
      <div className="p-6 rounded-2xl bg-[#111a2e] border border-[#1e3050] shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e3050]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Signal Input</h2>

          <div className="inline-flex rounded-lg bg-[#0c1220] p-0.5 border border-[#1e3050] text-xs font-medium">
            <button
              onClick={() => setInputTab('upload')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all duration-200 ${
                inputTab === 'upload'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-3 h-3" />
              <span>Upload</span>
            </button>
            <button
              onClick={() => setInputTab('record')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all duration-200 ${
                inputTab === 'record'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3 h-3" />
              <span>Record</span>
            </button>
          </div>
        </div>

        {inputTab === 'upload' ? (
          <AudioUploader />
        ) : (
          <AudioRecorder />
        )}
      </div>

      {/* Audio Player */}
      {audioId && (
        <div className="space-y-4">
          <AudioPlayer
            originalAudioId={audioId}
            originalTitle={filename ? `Loaded: ${filename}` : 'Input Audio'}
          />

          {/* Signal Info */}
          {timeStats && (
            <div className="p-5 rounded-2xl bg-[#111a2e] border border-[#1e3050] shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e3050]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                  <FileAudio className="w-4 h-4 text-violet-400" />
                  <span>Signal Information</span>
                </h3>
                {isCalibratedDemo && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Calibrated Demo
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e3050] space-y-1">
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    <span>Duration</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {timeStats.duration} <span className="text-xs font-normal text-slate-500">sec</span>
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {timeStats.num_samples?.toLocaleString()} samples
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e3050] space-y-1">
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sample Rate</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {timeStats.sampling_rate} <span className="text-xs font-normal text-slate-500">Hz</span>
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Nyquist: {timeStats.nyquist_freq} Hz
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e3050] space-y-1">
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Channels</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {channels === 1 ? '1 (Mono)' : `${channels} (Stereo)`}
                  </p>
                  <p className="text-[10px] text-slate-600 font-sans">
                    {channels === 1 ? 'Single channel' : 'Downmixed to mono'}
                  </p>
                </div>
              </div>

              {/* Proceed Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => navigate('/analysis')}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-[0.97]"
                >
                  <span>Proceed to Analysis</span>
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
