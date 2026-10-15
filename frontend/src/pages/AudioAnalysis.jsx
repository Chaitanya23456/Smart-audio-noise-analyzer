import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AudioWaveform,
  Activity,
  ArrowRight,
  Info,
  Sliders,
  HelpCircle,
  Hash,
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
      <div className="max-w-xl mx-auto p-10 text-center rounded-2xl bg-[#0e1626] border border-slate-800 space-y-4">
        <AudioWaveform className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Audio Signal Loaded</h3>
        <p className="text-xs text-slate-400">
          Please upload a WAV file, record from your microphone, or load the demo signal from the Dashboard first.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Get only the top 5 dominant peaks
  const topFivePeaks = (fftStats?.dominant_frequencies || []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black uppercase text-slate-100 tracking-tight">
              Signal Analysis
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {filename}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Time-domain waveform and frequency-domain spectrum analysis using the Discrete Fourier Transform (DFT).
          </p>
        </div>

        <button
          onClick={() => navigate('/filters')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/50 transition-all shrink-0 active:scale-95"
        >
          <span>Configure Digital Filters</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Audio Playback Bar */}
      <AudioPlayer
        originalAudioId={audioId}
        originalTitle={filename ? `Input Audio: ${filename}` : 'Input Audio'}
      />

      {/* Exactly Two Main Graphs: Waveform & Spectrum */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Time-domain Waveform */}
        <WaveformChart
          originalWaveform={timeStats.waveform}
          title="Oscilloscope: Time-Domain Waveform x[n]"
          height={280}
        />

        {/* Graph 2: Frequency-domain Spectrum */}
        <FFTChart
          originalSpectrum={fftStats?.spectrum}
          dominantFrequencies={topFivePeaks}
          educationalDSP={fftStats?.educational_dsp}
          title="Spectrum Analyzer: Frequency Spectrum |X(f)| (dBFS)"
          height={280}
        />
      </div>

      {/* Clear DSP Concepts Explanation: DFT vs FFT */}
      <div className="p-4 rounded-xl bg-[#0e1626] border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4 shrink-0" />
          <span>Transformation Fundamentals: DFT vs FFT</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong>Discrete Fourier Transform (DFT)</strong> is the foundational mathematical transformation converting discrete time-domain samples <span className="font-mono text-cyan-300 font-semibold">x[n]</span> into frequency harmonics <span className="font-mono text-cyan-300 font-semibold">X[k]</span>.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          The <strong>Fast Fourier Transform (FFT)</strong> is not a different transform; it is an efficient, mathematically exact algorithm (Cooley-Tukey) that computes the DFT in <span className="font-mono text-slate-200 font-semibold">O(N log₂ N)</span> operations instead of the direct <span className="font-mono text-slate-200 font-semibold">O(N²)</span> summation. In this system, all spectra are computed via NumPy's real FFT core.
        </p>
      </div>

      {/* Top 5 Significant Frequency Peaks Table */}
      <div className="rounded-xl bg-[#0e1626] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Significant Spectral Peaks (Top 5 Maxima)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              The five strongest frequency components extracted using SciPy peak detection.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Fs = {timeStats.sampling_rate} Hz
          </span>
        </div>

        {topFivePeaks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#080c14] text-slate-500 border-b border-slate-800/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-16">Rank</th>
                  <th className="py-2.5 px-4">Frequency</th>
                  <th className="py-2.5 px-4">Magnitude</th>
                  <th className="py-2.5 px-4 font-sans">Spectral Region</th>
                  <th className="py-2.5 px-4 font-sans">Filter Target Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topFivePeaks.map((peak, index) => {
                  let band = 'Mid-Band (Fundamental / Harmonic)';
                  let target = 'Passband (Signal Audio)';
                  if (peak.frequency < 100) {
                    band = 'Sub-Bass / Powerline Interf.';
                    target = peak.frequency >= 48 && peak.frequency <= 62 ? 'Band-Stop (Notch @ 50/60 Hz)' : 'High-Pass (> 100 Hz)';
                  } else if (peak.frequency > 4000) {
                    band = 'High Frequency / Electronic Hiss';
                    target = 'Low-Pass Filter';
                  }

                  return (
                    <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-cyan-400">
                        #{index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-100 text-sm">
                        {peak.frequency} <span className="text-xs text-slate-500 font-normal">Hz</span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        {peak.magnitude_db} <span className="text-xs text-slate-500 font-normal">dBFS</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans text-xs">
                        {band}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2.5 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                          {target}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 font-mono">
            No dominant spectral peaks detected above threshold.
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioAnalysis;
