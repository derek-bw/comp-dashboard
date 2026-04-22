'use client';

import { useState, useEffect } from 'react';
import { DealDetail } from '@/types';
import { formatCurrency, getSalesforceUrl, toSlug, downloadCSV } from '@/lib/utils';

interface PipelineSectionProps {
  deals: DealDetail[];
  selectedMonth: string;
  selectedRep: string;
}

const thCls = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap';
const tdCls = 'px-4 py-3 text-sm whitespace-nowrap';

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569] whitespace-nowrap">
      {status || '—'}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className="w-4 h-4 text-slate-400 transition-transform duration-200" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function PipelineSection({ deals, selectedMonth, selectedRep }: PipelineSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => { setIsOpen(true); }, [selectedRep, selectedMonth]);

  const estSaasTotal = deals.reduce((s, d) => s + d.saasObePayout, 0);
  const estBillingTotal = deals.reduce((s, d) => s + d.billingObePayout, 0);
  const estTotal = estSaasTotal + estBillingTotal;

  const summaryText = deals.length === 0
    ? 'No pipeline deals'
    : `${deals.length} opportunit${deals.length !== 1 ? 'ies' : 'y'} · ${formatCurrency(estTotal)} estimated payout`;

  function handleExport(e: React.MouseEvent) {
    e.stopPropagation();
    const headers = ['School Name', 'SaaS CW Month', 'Status', 'Est. SaaS OBE Payout', 'Est. Billing OBE Payout'];
    const rows = deals.map((d) => [
      d.schoolName || '',
      d.saasCwMonth || '—',
      d.status || '',
      d.saasObePayout ? formatCurrency(d.saasObePayout) : '—',
      d.billingObePayout ? formatCurrency(d.billingObePayout) : '—',
    ]);
    downloadCSV(`${toSlug(selectedRep)}_pipeline_${toSlug(selectedMonth)}.csv`, headers, rows);
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      {/* Header — fully clickable */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">Pipeline</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isOpen
              ? (deals.length === 0 ? 'No pipeline deals' : `${deals.length} deal${deals.length !== 1 ? 's' : ''} in progress or upcoming`)
              : summaryText}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-brand-600 transition-colors px-2 py-1 rounded hover:bg-brand-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
          <ChevronIcon open={isOpen} />
        </div>
      </button>

      {/* Collapsible body */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-[#E2E8F0]">
            {deals.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-slate-400">No pipeline deals for the selected period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto table-scroll">
                <table className="w-full min-w-[580px]">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr>
                      <th className={thCls}>School</th>
                      <th className={thCls}>SaaS CW Month</th>
                      <th className={thCls}>Status</th>
                      <th className={`${thCls} text-right`}>Est. SaaS Payout</th>
                      <th className={`${thCls} text-right`}>Est. Billing Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {deals.map((deal, i) => (
                      <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className={`${tdCls} text-[#0F172A] font-medium max-w-[240px]`}>
                          {deal.combinedFunnelId ? (
                            <a href={getSalesforceUrl(deal.combinedFunnelId)} target="_blank" rel="noopener noreferrer"
                              className="text-brand-600 hover:text-brand-700 hover:underline truncate block" title={deal.schoolName}>
                              {deal.schoolName || '—'}
                            </a>
                          ) : (
                            <span className="truncate block">{deal.schoolName || '—'}</span>
                          )}
                        </td>
                        <td className={`${tdCls} text-slate-500`}>{deal.saasCwMonth || '—'}</td>
                        <td className={tdCls}><StatusBadge status={deal.status} /></td>
                        <td className={`${tdCls} text-right tabular-nums font-medium text-[#0F172A]`}>
                          {deal.saasObePayout ? formatCurrency(deal.saasObePayout) : '—'}
                        </td>
                        <td className={`${tdCls} text-right tabular-nums font-medium text-[#0F172A]`}>
                          {deal.billingObePayout ? formatCurrency(deal.billingObePayout) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {deals.length > 1 && (
                    <tfoot className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Est. Total</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-[#0F172A]">{formatCurrency(estSaasTotal)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-[#0F172A]">{formatCurrency(estBillingTotal)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
