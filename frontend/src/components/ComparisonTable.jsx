import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, AlertTriangle, Trash2, Award } from 'lucide-react';

const ComparisonTable = ({
  comparisonData = [],
  selectedIndex = 0,
  onSelectIndex = null,
  bestIndex = null,
  onRemove = null,
  title = 'Filter Samples Comparison Summary',
}) => {
  if (!comparisonData || comparisonData.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#111a2e] border border-[#1e3050] text-slate-500 text-xs">
        No filters added for comparison yet. Design and apply filters in Digital Filters, then click &ldquo;Add to Comparison&rdquo;.
      </div>
    );
  }

  const isGroundTruth = comparisonData[0]?.has_ground_truth;

  return (
    <div className="rounded-2xl bg-[#111a2e] border border-[#1e3050] shadow-xl overflow-hidden">
      <div className="p-4 bg-[#0c1220] border-b border-[#1e3050] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
            <span>{title}</span>
            {isGroundTruth ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1 font-mono">
                <ShieldCheck className="w-3 h-3" />
                <span>Exact Clean Reference</span>
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1 font-mono">
                <AlertTriangle className="w-3 h-3" />
                <span>Reference-Free Mode</span>
              </span>
            )}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isGroundTruth
              ? 'SNR improvement ΔSNR computed mathematically against the known clean harmonic reference.'
              : 'True SNR requires a known clean reference signal. Measured stopband noise attenuation represents actual spectral reduction.'}
          </p>
        </div>
        <span className="text-[10px] text-violet-400 font-mono">
          Click any row to inspect waveforms & spectra
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#0a1018] text-slate-400 border-b border-[#1e3050] uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4 font-sans">Filter Method</th>
              <th className="py-3 px-3">Family</th>
              <th className="py-3 px-3">Cutoff</th>
              <th className="py-3 px-3">Order</th>
              <th className="py-3 px-3">Latency</th>
              <th className="py-3 px-3">Noise Attenuation</th>
              <th className="py-3 px-3 font-sans">Phase Response</th>
              {onRemove && <th className="py-3 px-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3050]">
            {comparisonData.map((item, index) => {
              const isSelected = selectedIndex === index;
              const isBest = bestIndex === index;

              return (
                <tr
                  key={item.id || index}
                  onClick={() => onSelectIndex && onSelectIndex(index)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-violet-500/15 border-l-4 border-violet-500 text-white'
                      : 'hover:bg-[#162038]/60 text-slate-300'
                  }`}
                >
                  <td className="py-3 px-4 font-sans font-semibold">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-violet-400' : 'bg-slate-600'}`} />
                      <span>{item.filter_name}</span>
                      {isBest && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono flex items-center space-x-0.5">
                          <Award className="w-2.5 h-2.5" />
                          <span>Best Filter</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.family === 'FIR'
                          ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      }`}
                    >
                      {item.family}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {item.cutoff_label || (item.cutoff ? `${item.cutoff} Hz` : '—')}
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    {item.order ?? '—'}
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-400">
                    {item.processing_time_ms != null ? `${item.processing_time_ms} ms` : '—'}
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {item.noise_reduction_db != null ? `+${item.noise_reduction_db} dB` : '—'}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-400">
                    {item.phase_type || (item.family === 'FIR' ? 'Linear Phase' : 'Non-linear')}
                  </td>
                  {onRemove && (
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(item.id || index);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove from comparison"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
