import React from 'react';
import { CheckCircle2, Clock, Zap, ShieldCheck } from 'lucide-react';

const ComparisonTable = ({ comparisonData = [], recommendedFilterName = '' }) => {
  if (!comparisonData || comparisonData.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs">
        No comparison data available yet. Run a filter benchmark to evaluate FIR vs IIR performance.
      </div>
    );
  }

  const isGroundTruth = comparisonData[0]?.has_ground_truth;

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <span>FIR & IIR Filter Performance Benchmark</span>
            {isGroundTruth ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Exact Ground-Truth Reference</span>
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                Estimated Spectral Metrics
              </span>
            )}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isGroundTruth
              ? 'SNR improvement ΔSNR computed mathematically against the known clean harmonic reference.'
              : 'Computed using in-band energy vs attenuated stopband spectral power reduction.'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Filter Prototype</th>
              <th className="py-3 px-3">Family</th>
              <th className="py-3 px-3">Order / Taps</th>
              <th className="py-3 px-3">Noise Reduction</th>
              <th className="py-3 px-3">Δ SNR (Improvement)</th>
              <th className="py-3 px-3">Execution Time</th>
              <th className="py-3 px-3">Phase Response</th>
              <th className="py-3 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {comparisonData.map((item, index) => {
              const isRec = recommendedFilterName && item.filter_name === recommendedFilterName;

              return (
                <tr
                  key={index}
                  className={`transition-colors ${
                    isRec
                      ? 'bg-cyan-950/20 hover:bg-cyan-950/30 font-medium'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    <div className="flex items-center space-x-2">
                      {isRec && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                      <span>{item.filter_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.family === 'FIR'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {item.family}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {item.order ?? '—'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                    {item.noise_reduction_db != null ? `+${item.noise_reduction_db} dB` : '—'}
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-300">
                    {item.delta_snr_db != null ? `+${item.delta_snr_db} dB` : '—'}
                  </td>
                  <td className="py-3 px-3 font-mono text-amber-300 flex items-center space-x-1 pt-4">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{item.processing_time_ms} ms</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {item.phase_response === 'Linear' ? (
                      <span className="text-cyan-400">Strictly Linear</span>
                    ) : (
                      <span className="text-slate-400">Non-linear (SOS)</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {isRec ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Top Choice
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Evaluated</span>
                    )}
                  </td>
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
