'use client';

import { useState, useMemo } from 'react';
import { DealDetail } from '@/types';
import { formatCurrency, getSalesforceUrl, toSlug, downloadCSV } from '@/lib/utils';

interface ManagerDealTableProps {
  deals: DealDetail[];
  selectedMonth: string;
  managerName: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Activated:    'bg-[#DCFCE7] text-[#166534]',
    'In Progress':'bg-[#F1F5F9] text-[#475569]',
    'SaaS Only':  'bg-[#FEF9C3] text-[#854D0E]',
  };
  const cls = styles[status] ?? 'bg-[#F1F5F9] text-[#475569]';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {status || '—'}
    </span>
  );
}

function TermPill({ term }: { term: string }) {
  if (!term) return <span className="text-slate-400">—</span>;
  const isAnnual = term.toLowerCase() === 'annual';
  const cls = isAnnual ? 'bg-[#EEF2FF] text-[#4338CA]' : 'bg-[#F1F5F9] text-[#475569]';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {term}
    </span>
  );
}

const thCls = 'px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap';
const tdCls = 'px-3 py-3 text-sm text-[#0F172A] whitespace-nowrap';

export default function ManagerDealTable({ deals, selectedMonth, managerName }: ManagerDealTableProps) {
  const [repFilter, setRepFilter] = useState<string>('');

  // Unique rep names in this deal set
  const repNames = useMemo(
    () => [...new Set(deals.map((d) => d.repName))].sort(),
    [deals]
  );

  const filtered = useMemo(
    () => repFilter ? deals.filter((d) => d.repName === repFilter) : deals,
    [deals, repFilter]
  );

  // Footer totals (filtered)
  const saasTotal    = filtered.filter(d => d.saasObeMonth === selectedMonth).reduce((s, d) => s + d.saasObePayout, 0);
  const billingTotal = filtered.filter(d => d.billingObeMonth === selectedMonth).reduce((s, d) => s + d.billingObePayout, 0);
  const grandTotal   = saasTotal + billingTotal;

  function handleExport() {
    const headers = ['Rep', 'School', 'MRR', 'Term', 'SaaS OBE Month', 'Billing OBE Month',
      'Status', 'SaaS Payout', 'Billing Payout', 'Total Payout', 'Clawback'];
    const rows = filtered.map((d) => {
      const saas    = d.saasObeMonth === selectedMonth ? formatCurrency(d.saasObePayout) : '—';
      const billing = d.billingObeMonth === selectedMonth ? formatCurrency(d.billingObePayout) : '—';
      const total   = (d.saasObeMonth === selectedMonth ? d.saasObePayout : 0)
                    + (d.billingObeMonth === selectedMonth ? d.billingObePayout : 0);
      return [
        d.repName, d.schoolName, formatCurrency(d.mrr), d.annualMonthly || '—',
        d.saasObeMonth === selectedMonth ? d.saasObeMonth : '—',
        d.billingObeMonth === selectedMonth ? d.billingObeMonth : '—',
        d.status, saas, billing, total ? formatCurrency(total) : '—',
        d.clawbackFlag ? 'Yes' : '',
      ];
    });
    downloadCSV(`${toSlug(managerName)}_team_deals_${toSlug(selectedMonth)}.csv`, headers, rows);
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">All Rep Deal Activity</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} deal{filtered.length !== 1 ? 's' : ''} · {selectedMonth}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Rep filter */}
          <div className="relative">
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="appearance-none text-sm border border-[#E2E8F0] rounded-lg pl-3 pr-8 py-2 text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 min-w-[140px]"
            >
              <option value="">All reps</option>
              {repNames.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-[#4F46E5] transition-colors px-2 py-2 rounded hover:bg-[#EEF2FF]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-400">No deal activity found for the selected month{repFilter ? ` and rep (${repFilter})` : ''}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  {['Rep', 'School', 'MRR', 'Term', 'SaaS OBE Month', 'Billing OBE Month',
                    'Status', 'SaaS Payout', 'Billing Payout', 'Total Payout', 'Clawback'].map((h) => (
                    <th key={h} className={`${thCls} ${['MRR','SaaS Payout','Billing Payout','Total Payout'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((deal, i) => {
                  const saasPayout    = deal.saasObeMonth === selectedMonth ? deal.saasObePayout : null;
                  const billingPayout = deal.billingObeMonth === selectedMonth ? deal.billingObePayout : null;
                  const totalPayout   = (saasPayout ?? 0) + (billingPayout ?? 0);
                  return (
                    <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className={`${tdCls} font-medium text-slate-600`}>{deal.repName}</td>
                      <td className={`${tdCls} max-w-[200px]`}>
                        {deal.combinedFunnelId ? (
                          <a href={getSalesforceUrl(deal.combinedFunnelId)} target="_blank" rel="noopener noreferrer"
                            className="text-[#4F46E5] hover:underline truncate block" title={deal.schoolName}>
                            {deal.schoolName || '—'}
                          </a>
                        ) : (
                          <span className="truncate block">{deal.schoolName || '—'}</span>
                        )}
                      </td>
                      <td className={`${tdCls} text-right tabular-nums`}>{deal.mrr ? formatCurrency(deal.mrr) : '—'}</td>
                      <td className={tdCls}><TermPill term={deal.annualMonthly} /></td>
                      <td className={`${tdCls} text-slate-500`}>{deal.saasObeMonth === selectedMonth ? deal.saasObeMonth : '—'}</td>
                      <td className={`${tdCls} text-slate-500`}>{deal.billingObeMonth === selectedMonth ? deal.billingObeMonth : '—'}</td>
                      <td className={tdCls}><StatusBadge status={deal.status} /></td>
                      <td className={`${tdCls} text-right tabular-nums`}>{saasPayout != null ? formatCurrency(saasPayout) : '—'}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{billingPayout != null ? formatCurrency(billingPayout) : '—'}</td>
                      <td className={`${tdCls} text-right tabular-nums font-semibold`}>{totalPayout ? formatCurrency(totalPayout) : '—'}</td>
                      <td className={`${tdCls} text-center`}>
                        {deal.clawbackFlag ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#991B1B]">Yes</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                <tr>
                  <td colSpan={7} className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Total</td>
                  <td className="px-3 py-3 text-sm text-right tabular-nums font-semibold text-[#0F172A]">{formatCurrency(saasTotal)}</td>
                  <td className="px-3 py-3 text-sm text-right tabular-nums font-semibold text-[#0F172A]">{formatCurrency(billingTotal)}</td>
                  <td className="px-3 py-3 text-sm text-right tabular-nums font-bold text-[#0F172A]">{formatCurrency(grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
