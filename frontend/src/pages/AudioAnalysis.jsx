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

  const topFivePeaks = (fftStats?.dominant_frequencies || []).slice(0, 5);

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
            Time-domain waveform and frequency-domain spectrum via DFT (computed using FFT).
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
          dominantFrequencies={topFivePeaks}
          educationalDSP={fftStats?.educational_dsp}
          title="Frequency Spectrum |X(f)| (dB)"
          height={280}
        />
      </div>

      {/* DFT vs FFT Explanation */}
      <div className="p-4 rounded-xl bg-[#111a2e] border border-[#1e3050] space-y-2">
        <div className="flex items-center space-x-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4 shrink-0" />
          <span>DFT vs FFT</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong>Discrete Fourier Transform (DFT)</strong> converts time-domain samples <span className="font-mono text-violet-300">x[n]</span> into frequency components <span className="font-mono text-violet-300">X[k]</span>.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          The <strong>Fast Fourier Transform (FFT)</strong> is an efficient algorithm that computes the same DFT in <span className="font-mono text-slate-200">O(N log₂ N)</span> instead of <span className="font-mono text-slate-200">O(N²)</span>. All spectra here are computed via NumPy's FFT.
        </p>
      </div>

      {/* Top 5 Peaks Table */}
      <div className="rounded-xl bg-[#111a2e] border border-[#1e3050] shadow-xl overflow-hidden">
        <div className="p-4 bg-[#0c1220] border-b border-[#1e3050] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Top 5 Frequency Peaks
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Strongest frequency components detected via peak analysis.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Fs = {timeStats.sampling_rate} Hz
          </span>
        </div>

        {topFivePeaks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a1018] text-slate-500 border-b border-[#1e3050] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-14">#</th>
                  <th className="py-2.5 px-4">Frequency</th>
                  <th className="py-2.5 px-4">Magnitude</th>
                  <th className="py-2.5 px-4 font-sans">Region</th>
                  <th className="py-2.5 px-4 font-sans">Filter Suggestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3050]">
                {topFivePeaks.map((peak, index) => {
                  let band = 'Mid-Band';
                  let target = 'Passband';
                  if (peak.frequency < 100) {
                    band = 'Sub-Bass / Powerline';
                    target = peak.frequency >= 48 && peak.frequency <= 62 ? 'Notch @ 50/60 Hz' : 'High-Pass (> 100 Hz)';
                  } else if (peak.frequency > 4000) {
                    band = 'High Freq / Hiss';
                    target = 'Low-Pass Filter';
                  }

                  return (
                    <tr key={index} className="hover:bg-[#162038]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-violet-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-sm">
                        {peak.frequency} <span className="text-xs text-slate-500 font-normal">Hz</span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        {peak.magnitude_db} <span className="text-xs text-slate-500 font-normal">dB</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                        {band}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-[#0c1220] border border-[#1e3050] text-slate-300 font-medium">
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
            No dominant spectral peaks detected.
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioAnalysis;
