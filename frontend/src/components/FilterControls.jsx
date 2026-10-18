import React, { useState, useEffect } from 'react';
import { Sliders, Play, AlertCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const FIR_WINDOWS = [
  'Hamming Window',
  'Hann (Hanning) Window',
  'Blackman Window',
  'Rectangular Window',
];

const IIR_METHODS = [
  'Butterworth',
  'Chebyshev',
];

const FilterControls = ({ onFilterApplied }) => {
  const {
    timeStats,
    handleApplyFilter,
    handleFetchFrequencyResponse,
    loading,
  } = useAudio();

  const nyquist = timeStats?.nyquist_freq || 22050;

  // Filter configuration states
  const [family, setFamily] = useState('FIR');
  const [method, setMethod] = useState('Hamming Window');
  const [filterType, setFilterType] = useState('lowpass');
  const [order, setOrder] = useState(50);
  const [ripple, setRipple] = useState(1.0); // For Chebyshev
  const [cutoff, setCutoff] = useState(2500);
  const [lowCutoff, setLowCutoff] = useState(300);
  const [highCutoff, setHighCutoff] = useState(3000);
  const [validationError, setValidationError] = useState('');

  // Handle switching family
  const handleFamilyChange = (newFamily) => {
    setFamily(newFamily);
    if (newFamily === 'FIR') {
      setMethod('Hamming Window');
      if (order < 10 || order > 200) setOrder(50);
    } else {
      setMethod('Butterworth');
      if (order > 10) setOrder(4);
    }
  };

  // Validate settings
  useEffect(() => {
    setValidationError('');

    if (filterType === 'lowpass' || filterType === 'highpass') {
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

    if (family === 'IIR' && method === 'Chebyshev') {
      if (ripple <= 0) {
        setValidationError('Passband ripple must be greater than 0 dB.');
      } else if (ripple > 10) {
        setValidationError('Passband ripple cannot exceed 10 dB.');
      }
    }
  }, [cutoff, lowCutoff, highCutoff, filterType, nyquist, family, method, ripple]);

  const getCurrentConfig = () => {
    const config = {
      family,
      method,
      filter_type: filterType,
      order: parseInt(order),
    };

    if (family === 'FIR') {
      config.window = method;
      config.subtype = 'fir_window';
    } else {
      config.subtype = method.toLowerCase();
      if (method === 'Chebyshev') {
        config.ripple = parseFloat(ripple);
      }
    }

    if (filterType === 'lowpass' || filterType === 'highpass') {
      config.cutoff = parseFloat(cutoff);
    } else {
      config.low_cutoff = parseFloat(lowCutoff);
      config.high_cutoff = parseFloat(highCutoff);
    }

    return config;
  };

  // Live preview frequency response when valid parameters change
  useEffect(() => {
    if (!validationError && timeStats) {
      const config = getCurrentConfig();
      handleFetchFrequencyResponse(config);
    }
  }, [family, method, filterType, order, ripple, cutoff, lowCutoff, highCutoff, validationError]);

  const handleApply = async () => {
    if (validationError) return;
    const config = getCurrentConfig();
    const res = await handleApplyFilter(config, true);
    if (onFilterApplied && res) {
      onFilterApplied(res);
    }
  };

  const isBand = filterType === 'bandpass' || filterType === 'bandstop';
  const isChebyshev = family === 'IIR' && method === 'Chebyshev';

  return (
    <div className="p-5 rounded-2xl bg-[#111a2e] border border-[#1e3050] shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#1e3050]">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-bold text-white">Filter Parameters</h2>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Nyquist: <strong className="text-violet-400">{nyquist} Hz</strong>
        </span>
      </div>

      {/* 1. Filter Family Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Filter Family</label>
        <select
          value={family}
          onChange={(e) => handleFamilyChange(e.target.value)}
          className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
        >
          <option value="FIR">FIR (Finite Impulse Response)</option>
          <option value="IIR">IIR (Infinite Impulse Response)</option>
        </select>
      </div>

      {/* 2. Filter Method Selection based on Family */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">
          {family === 'FIR' ? 'Window Method' : 'Filter Design Method'}
        </label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
        >
          {family === 'FIR'
            ? FIR_WINDOWS.map((win) => (
                <option key={win} value={win}>
                  {win}
                </option>
              ))
            : IIR_METHODS.map((meth) => (
                <option key={meth} value={meth}>
                  {meth}
                </option>
              ))}
        </select>
      </div>

      {/* 3. Filter Type Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Filter Type</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full bg-[#0c1220] border border-[#1e3050] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
        >
          <option value="lowpass">Low-pass Filter</option>
          <option value="highpass">High-pass Filter</option>
          <option value="bandpass">Band-pass Filter</option>
          <option value="bandstop">Band-stop (Notch) Filter</option>
        </select>
      </div>

      {/* 4. Filter Order */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">Filter Order (N)</span>
          <span className="font-mono text-violet-400 font-bold">{order}</span>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="range"
            min={family === 'FIR' ? 10 : 1}
            max={family === 'FIR' ? 200 : 10}
            step={family === 'FIR' && (filterType === 'highpass' || filterType === 'bandstop') ? 2 : 1}
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
            className="flex-1 h-1.5 bg-[#0c1220] rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
          <input
            type="number"
            min={family === 'FIR' ? 10 : 1}
            max={family === 'FIR' ? 500 : 12}
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
            className="w-16 bg-[#0c1220] border border-[#1e3050] rounded px-2 py-1 text-xs font-mono text-right text-slate-200 focus:border-violet-500"
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>Min: {family === 'FIR' ? 10 : 1}</span>
          <span>Max: {family === 'FIR' ? 200 : 10}</span>
        </div>
      </div>

      {/* 5. Passband Ripple (ONLY relevant for Chebyshev IIR) */}
      {isChebyshev && (
        <div className="space-y-1.5 p-3 rounded-xl bg-violet-500/10 border border-violet-500/25">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-violet-300">Passband Ripple (dB)</span>
            <span className="font-mono text-violet-400 font-bold">{ripple} dB</span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={ripple}
              onChange={(e) => setRipple(parseFloat(e.target.value) || 0.1)}
              className="flex-1 h-1.5 bg-[#0c1220] rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <input
              type="number"
              min="0.1"
              max="10.0"
              step="0.1"
              value={ripple}
              onChange={(e) => setRipple(parseFloat(e.target.value) || 0.1)}
              className="w-16 bg-[#0c1220] border border-[#1e3050] rounded px-2 py-1 text-xs font-mono text-right text-slate-200 focus:border-violet-500"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Allowable peak-to-peak ripple in Chebyshev passband.
          </p>
        </div>
      )}

      {/* 6. Cutoff Frequencies */}
      {!isBand ? (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">Cutoff Frequency (fc)</span>
            <span className="font-mono text-violet-400 font-bold">{cutoff} Hz</span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="20"
              max={Math.floor(nyquist - 50)}
              step="10"
              value={cutoff}
              onChange={(e) => setCutoff(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-[#0c1220] rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <input
              type="number"
              value={cutoff}
              onChange={(e) => setCutoff(parseFloat(e.target.value) || 0)}
              className="w-20 bg-[#0c1220] border border-[#1e3050] rounded px-2 py-1 text-xs font-mono text-right text-slate-200 focus:border-violet-500"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Low Cutoff (f1)</span>
              <span className="font-mono text-violet-400">{lowCutoff} Hz</span>
            </div>
            <input
              type="number"
              value={lowCutoff}
              onChange={(e) => setLowCutoff(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0c1220] border border-[#1e3050] rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-violet-500"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">High Cutoff (f2)</span>
              <span className="font-mono text-violet-400">{highCutoff} Hz</span>
            </div>
            <input
              type="number"
              value={highCutoff}
              onChange={(e) => setHighCutoff(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0c1220] border border-[#1e3050] rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-violet-500"
            />
          </div>
        </div>
      )}

      {validationError && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !!validationError}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{loading ? 'Applying Filter...' : 'Apply Filter'}</span>
        </button>
      </div>
    </div>
  );
};

export default FilterControls;
