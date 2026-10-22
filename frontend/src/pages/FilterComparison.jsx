import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Play,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
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
    comparisonResults,
    handleCompare,
    loading,
  } = useAudio();

  const navigate = useNavigate();
  const nyquist = timeStats?.nyquist_freq || 22050;

  // Consistent specification controls
  const [filterType, setFilterType] = useState('lowpass');
  const [cutoff, setCutoff] = useState(2500);
  const [lowCutoff, setLowCutoff] = useState(300);
  const [highCutoff, setHighCutoff] = useState(3000);
  const [firOrder, setFirOrder] = useState(50);
  const [iirOrder, setIirOrder] = useState(4);
  const [ripple, setRipple] = useState(1.0);
  const [validationError, setValidationError] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const isBand = filterType === 'bandpass' || filterType === 'bandstop';

  // Validate filter specs
  useEffect(() => {
    setValidationError('');
    if (!isBand) {
      if (cutoff <= 0) {
        setValidationError('Cutoff frequency must be greater than 0 Hz.');
      } else if (cutoff >= nyquist) {
        setValidationError(`Cutoff frequency (${cutoff} Hz) must be less than Nyquist (${nyquist} Hz).`);
      }
    } else {
      if (lowCutoff <= 0) {
        setValidationError('Low cutoff must be greater than 0 Hz.');
      } else if (lowCutoff >= highCutoff) {
        setValidationError(`Low cutoff (${lowCutoff} Hz) must be strictly less than High cutoff (${highCutoff} Hz).`);
      } else if (highCutoff >= nyquist) {
        setValidationError(`High cutoff (${highCutoff} Hz) must be less than Nyquist (${nyquist} Hz).`);
      }
    }

    if (ripple <= 0 || ripple > 10) {
      setValidationError('Chebyshev ripple must be between 0.1 and 10 dB.');
    }
  }, [cutoff, lowCutoff, highCutoff, filterType, ripple, nyquist, isBand]);

  const runBenchmark = async () => {
    if (validationError) return;
    const spec = {
      filter_type: filterType,
      cutoff: parseFloat(cutoff),
      low_cutoff: parseFloat(lowCutoff),
      high_cutoff: parseFloat(highCutoff),
      fir_order: parseInt(firOrder),
      iir_order: parseInt(iirOrder),
      ripple: parseFloat(ripple),
    };
    await handleCompare(spec);
    setSelectedIdx(0);
  };

  // Run benchmark on load if not yet run
  useEffect(() => {
    if (audioId && comparisonResults.length === 0 && !loading) {
      runBenchmark();
    }
  }, [audioId]);

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
            Compare all 4 FIR window methods (Hamming, Hann, Blackman, Rectangular) and both IIR filter methods (Butterworth, Chebyshev) on the exact same audio signal.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={runBenchmark}
            disabled={loading || !!validationError}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 active:scale-[0.97]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Comparing...' : 'Run 6-Filter Benchmark'}</span>
          </button>

          <button
            onClick={() => navigate('/results')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#111a2e] hover:bg-[#162038] text-slate-200 border border-[#1e3050] hover:border-violet-500/40 transition-all shrink-0 active:scale-[0.97]"
          >
            <span>Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Consistent Benchmark Configuration Bar */}
      <div className="p-4 rounded-2xl bg-[#111a2e] border border-[#1e3050] shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#1e3050]">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-violet-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Benchmark Specifications (Applied Consistently to All 6 Filters)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Nyquist: <strong className="text-violet-400">{nyquist} Hz</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Filter Type */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">Filter Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-violet-500"
            >
              <option value="lowpass">Low-pass</option>
              <option value="highpass">High-pass</option>
              <option value="bandpass">Band-pass</option>
              <option value="bandstop">Band-stop</option>
            </select>
          </div>

          {/* Cutoffs */}
          {!isBand ? (
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px]">Cutoff (fc)</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  value={cutoff}
                  onChange={(e) => setCutoff(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-500 font-mono">Hz</span>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Low Cutoff (f1)</label>
                <input
                  type="number"
                  value={lowCutoff}
                  onChange={(e) => setLowCutoff(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:border-violet-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">High Cutoff (f2)</label>
                <input
                  type="number"
                  value={highCutoff}
                  onChange={(e) => setHighCutoff(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:border-violet-500"
                />
              </div>
            </>
          )}

          {/* FIR Order */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">FIR Order (N)</label>
            <input
              type="number"
              min="10"
              max="200"
              value={firOrder}
              onChange={(e) => setFirOrder(parseInt(e.target.value) || 50)}
              className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:border-violet-500"
            />
          </div>

          {/* IIR Order */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">IIR Order (N)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={iirOrder}
              onChange={(e) => setIirOrder(parseInt(e.target.value) || 4)}
              className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:border-violet-500"
            />
          </div>

          {/* Chebyshev Ripple */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">Chebyshev Ripple</label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={ripple}
                onChange={(e) => setRipple(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:border-violet-500"
              />
              <span className="text-[10px] text-slate-500 font-mono">dB</span>
            </div>
          </div>
        </div>

        {validationError && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{validationError}</span>
          </div>
        )}
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
