import React, { useState, useEffect } from 'react';
import { Sliders, Play, AlertCircle, Eye } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const FilterControls = ({ onFilterApplied }) => {
  const {
    timeStats,
    handleApplyFilter,
    handleFetchFrequencyResponse,
    loading,
  } = useAudio();

  const nyquist = timeStats?.nyquist_freq || 22050;

  // Essential settings only
  const [family, setFamily] = useState('IIR'); // 'FIR' | 'IIR'
  const [filterType, setFilterType] = useState('lowpass'); // 'lowpass' | 'highpass' | 'bandpass' | 'bandstop'
  const [order, setOrder] = useState(4);
  const [cutoff, setCutoff] = useState(3000);
  const [lowCutoff, setLowCutoff] = useState(300);
  const [highCutoff, setHighCutoff] = useState(3400);
  const [validationError, setValidationError] = useState('');

  // Validate settings against Nyquist frequency
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
  }, [cutoff, lowCutoff, highCutoff, filterType, nyquist]);

  // Adjust order defaults when switching family
  useEffect(() => {
    if (family === 'FIR') {
      if (order < 15) setOrder(51);
    } else {
      if (order > 8) setOrder(4);
    }
  }, [family]);

  const getCurrentConfig = () => {
    const config = {
      family,
      filter_type: filterType,
      order: parseInt(order),
    };

    if (family === 'FIR') {
      config.window = 'hamming';
      config.subtype = 'fir_window';
      // Ensure odd taps for FIR highpass and bandstop
      let taps = parseInt(order);
      if ((filterType === 'highpass' || filterType === 'bandstop') && taps % 2 === 0) {
        taps += 1;
      }
      config.order = taps;
    } else {
      config.subtype = 'butterworth';
    }

    if (filterType === 'lowpass' || filterType === 'highpass') {
      config.cutoff = parseFloat(cutoff);
    } else {
      config.low_cutoff = parseFloat(lowCutoff);
      config.high_cutoff = parseFloat(highCutoff);
    }

    return config;
  };

  // Automatically fetch theoretical frequency response when parameters change
  useEffect(() => {
    if (!validationError && timeStats) {
      const config = getCurrentConfig();
      handleFetchFrequencyResponse(config);
    }
  }, [family, filterType, order, cutoff, lowCutoff, highCutoff, validationError]);

  const handleApply = async () => {
    if (validationError) return;
    const config = getCurrentConfig();
    const res = await handleApplyFilter(config, true);
    if (onFilterApplied && res) {
      onFilterApplied(res);
    }
  };

  const isBand = filterType === 'bandpass' || filterType === 'bandstop';

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100">Filter Configuration</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Nyquist: <strong className="text-cyan-400">{nyquist} Hz</strong>
        </span>
      </div>

      {/* 1. Filter Family Dropdown (FIR vs IIR) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Filter Family</label>
        <select
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
        >
          <option value="FIR">FIR (Finite Impulse Response — Linear Phase)</option>
          <option value="IIR">IIR (Infinite Impulse Response — Butterworth)</option>
        </select>
      </div>

      {/* 2. Filter Type Dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Filter Type</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
        >
          {family === 'FIR' ? (
            <>
              <option value="lowpass">FIR Low-pass Filter</option>
              <option value="highpass">FIR High-pass Filter</option>
              <option value="bandpass">FIR Band-pass Filter</option>
              <option value="bandstop">FIR Band-stop Filter</option>
            </>
          ) : (
            <>
              <option value="lowpass">Butterworth Low-pass Filter</option>
              <option value="highpass">Butterworth High-pass Filter</option>
              <option value="bandpass">Butterworth Band-pass Filter</option>
              <option value="bandstop">Butterworth Band-stop (Notch) Filter</option>
            </>
          )}
        </select>
      </div>

      {/* 3. Filter Order Setting */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">
            {family === 'FIR' ? 'Filter Taps (Length M)' : 'Filter Order (N)'}
          </span>
          <span className="font-mono text-cyan-400 font-bold">{order}</span>
        </div>
        <input
          type="range"
          min={family === 'FIR' ? 15 : 1}
          max={family === 'FIR' ? 101 : 8}
          step={family === 'FIR' ? 2 : 1}
          value={order}
          onChange={(e) => setOrder(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>Min: {family === 'FIR' ? 15 : 1}</span>
          <span>Max: {family === 'FIR' ? 101 : 8}</span>
        </div>
      </div>

      {/* 4. Cutoff Frequencies: Single vs Dual */}
      {!isBand ? (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">Cutoff Frequency (fc)</span>
            <span className="font-mono text-cyan-400 font-bold">{cutoff} Hz</span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="20"
              max={Math.floor(nyquist - 50)}
              step="10"
              value={cutoff}
              onChange={(e) => setCutoff(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <input
              type="number"
              value={cutoff}
              onChange={(e) => setCutoff(parseFloat(e.target.value) || 0)}
              className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-right text-slate-200 focus:border-cyan-500"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Low Cutoff (f1)</span>
              <span className="font-mono text-cyan-400">{lowCutoff} Hz</span>
            </div>
            <input
              type="number"
              value={lowCutoff}
              onChange={(e) => setLowCutoff(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">High Cutoff (f2)</span>
              <span className="font-mono text-cyan-400">{highCutoff} Hz</span>
            </div>
            <input
              type="number"
              value={highCutoff}
              onChange={(e) => setHighCutoff(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500"
            />
          </div>
        </div>
      )}

      {/* Validation message if invalid */}
      {validationError && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Single Apply Filter Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !!validationError}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{loading ? 'Applying Filter...' : 'Apply Filter'}</span>
        </button>
      </div>
    </div>
  );
};

export default FilterControls;
