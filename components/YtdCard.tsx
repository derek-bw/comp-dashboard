'use client';

import { useState } from 'react';
import { RepSummary } from '@/types';
import { formatCurrency, sortMonths } from '@/lib/utils';

interface YtdCardProps {
  repSummary: RepSummary | null;
  allSummary: RepSummary[];
  selectedRep: string;
}

export default function YtdCard({ repSummary, allSummary, selectedRep }: YtdCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Debug log (Fix 4)
  if (repSummary) {
    console.log('[YtdCard]', repSummary.repName, repSummary.month, 'ytdNetPayout:', repSummary.ytdNetPayout);
  }

  // All months for this rep, sorted chronologically
  const repMonths = sortMonths([
    ...new Set(allSummary.filter((r) => r.repName === selectedRep).map((r) => r.month)),
  ]);

  // Only paid months (finalPayout > 0) — excludes current open/unpaid month
  const repRows = repMonths
    .map((month) => allSummary.find((r) => r.repName === selectedRep && r.month === month))
    .filter((r): r is RepSummary => r != null && r.finalPayout > 0);

  const totalCommission = repRows.reduce((s, r) => s + r.prePayrollCommission, 0);
  const totalSpiff      = repRows.reduce((s, r) => s + r.spiff, 0);
  const totalClawbacks  = repRows.reduce((s, r) => s + r.saasClawbacks, 0);
  const totalNet        = repRows.reduce((s, r) => s + r.netPayout, 0);

  // YTD display amount — computed from paid months (not the Sheet's ytdNetPayout which may include current open month)
  const amount = totalNet;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      {/* Header row — clicking toggles breakdown */}
      <button
        onClick={() => repRows.length > 0 && setExpanded((v) => !v)}
        className={`w-full px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-colors ${repRows.length > 0 ? 'hover:bg-[#F8FAFC] cursor-pointer' : 'cursor-default'}`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Year to Date</p>
          <p className="text-sm text-slate-500 mt-0.5">Net earnings across all months this year</p>
        </div>
        <div className="flex items-end sm:items-center gap-4 shrink-0 flex-col sm:flex-row">
          <p className="text-3xl font-bold tabular-nums text-[#0F172A]">
            {repSummary ? formatCurrency(amount) : (
              <span className="inline-block h-9 w-28 bg-slate-100 rounded animate-pulse" />
            )}
          </p>
          {repRows.length > 0 && (
            <p className="text-[11px] text-slate-400 whitespace-nowrap">
              {expanded ? '▲ Hide breakdown' : '▼ View breakdown'}
            </p>
          )}
        </div>
      </button>

      {/* Expandable monthly breakdown table */}
      <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          {repRows.length > 0 && (
            <div className="border-t border-[#E2E8F0] overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Month</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Commission</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">SPIFF</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Clawbacks</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {repRows.map((row) => (
                    <tr key={row.month} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#0F172A] font-medium">{row.month}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums text-slate-600">
                        {row.prePayrollCommission ? formatCurrency(row.prePayrollCommission) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums text-slate-600">
                        {row.spiff ? formatCurrency(row.spiff) : '—'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right tabular-nums ${row.saasClawbacks < 0 ? 'text-[#991B1B]' : 'text-slate-600'}`}>
                        {row.saasClawbacks ? formatCurrency(row.saasClawbacks) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-semibold text-[#0F172A]">
                        {formatCurrency(row.netPayout)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                  <tr>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">YTD Total</td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums font-semibold text-[#0F172A]">
                      {formatCurrency(totalCommission)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums font-semibold text-[#0F172A]">
                      {totalSpiff ? formatCurrency(totalSpiff) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right tabular-nums font-semibold ${totalClawbacks < 0 ? 'text-[#991B1B]' : 'text-[#0F172A]'}`}>
                      {totalClawbacks ? formatCurrency(totalClawbacks) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums font-bold text-[#0F172A]">
                      {formatCurrency(totalNet)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
