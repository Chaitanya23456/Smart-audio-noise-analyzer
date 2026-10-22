import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AudioWaveform,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import WaveformChart from '../components/WaveformChart';
import FFTChart from '../components/FFTChart';
import AudioPlayer from '../components/AudioPlayer';

const AudioAnalysis = () => {
  const {
    audioId,
    filename,
    timeStats,
    fftStats,
  } = useAudio();

  const navigate = useNavigate();

  if (!audioId || !timeStats) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center rounded-2xl bg-[#111a2e] border border-[#1e3050] space-y-4">
        <AudioWaveform className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Audio Signal Loaded</h3>
        <p className="text-xs text-slate-400">
          Please upload a WAV file, record from your microphone, or load the demo signal from the Dashboard first.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-500/20"
        >
          Return to Dashboard
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
              Signal Analysis
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {filename}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Time-domain waveform and frequency-domain spectrum.
          </p>
        </div>

        <button
          onClick={() => navigate('/filters')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all shrink-0 active:scale-[0.97]"
        >
          <span>Configure Filters</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Audio Player */}
      <AudioPlayer
        originalAudioId={audioId}
        originalTitle={filename ? `Input: ${filename}` : 'Input Audio'}
      />

      {/* Two Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WaveformChart
          originalWaveform={timeStats.waveform}
          title="Time-Domain Waveform x[n]"
          height={280}
        />
        <FFTChart
          originalSpectrum={fftStats?.spectrum}
          educationalDSP={fftStats?.educational_dsp}
          title="Frequency Spectrum"
          height={280}
        />
      </div>

      {/* Frequency Spectrum Explanation */}
      <div className="p-4 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-2">
        <div className="flex items-center space-x-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4 shrink-0" />
          <span>Frequency Spectrum</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The frequency spectrum displays the distribution of signal energy across frequencies, converting time-domain samples <span className="font-mono text-violet-300">x[n]</span> into spectral components <span className="font-mono text-violet-300">X(f)</span>.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Fast Fourier Transform (FFT) is utilized to compute the spectrum efficiently, enabling identification of noise components and passband characteristics.
        </p>
      </div>
    </div>
  );
};

export default AudioAnalysis;
