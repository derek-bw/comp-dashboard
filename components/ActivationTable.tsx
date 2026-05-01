'use client';

import { useState, useEffect } from 'react';
import { DealDetail, CalculatorPrefill } from '@/types';
import { DealColumnDef } from '@/lib/roleConfig';
import { formatCurrency, getSalesforceUrl, toSlug, downloadCSV } from '@/lib/utils';

interface ActivationTableProps {
  deals: DealDetail[];
  columns: DealColumnDef[];
  selectedMonth: string;
  selectedRep: string;
  title?: string;
  showCalculator?: boolean;
  showMultiplierViewer?: boolean;
  onOpenCalculator?: (prefill?: CalculatorPrefill) => void;
  onOpenMultipliers?: () => void;
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
  const cls = isAnnual
    ? 'bg-[#EEF2FF] text-[#4338CA]'
    : 'bg-[#F1F5F9] text-[#475569]';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {term}
    </span>
  );
}

/** BNP pill shown next to school name */
function BnpBadge({ deal }: { deal: DealDetail }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipLines: string[] = [
    'Brand New Program',
    deal.bnpOpeningDate ? `Opens ${deal.bnpOpeningDate}` : '',
    deal.bnpSpiffAmount ? `SPIFF: ${formatCurrency(deal.bnpSpiffAmount)}` : '',
    'If opening > 3mo from close: SPIFF only, not attainment credit.',
  ].filter(Boolean);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onFocus={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onBlur={() => setShowTooltip(false)}
        className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] transition-colors"
      >
        BNP
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-1.5 z-20 w-60 bg-[#1E293B] text-white text-xs rounded-lg shadow-xl px-3 py-2.5 space-y-1 pointer-events-none">
          {tooltipLines.map((line, i) => (
            <p key={i} className={i === 0 ? 'font-semibold' : 'text-white/70'}>{line}</p>
          ))}
          <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#1E293B]" />
        </div>
      )}
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

/** Renders a single cell value according to the column's render type. */
function renderCell(col: DealColumnDef, deal: DealDetail, selectedMonth: string): React.ReactNode {
  const raw = (deal as unknown as Record<string, unknown>)[col.key];

  switch (col.render) {
    case 'schoolLink':
      return (
        <span className="flex items-center gap-0.5 min-w-0">
          {deal.combinedFunnelId ? (
            <a href={getSalesforceUrl(deal.combinedFunnelId)} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-brand-600 hover:text-brand-700 hover:underline truncate" title={deal.schoolName}>
              {deal.schoolName || '—'}
            </a>
          ) : (
            <span className="truncate" title={deal.schoolName}>{deal.schoolName || '—'}</span>
          )}
          {deal.bnpFlag && <BnpBadge deal={deal} />}
        </span>
      );

    case 'conditionalMonth':
      return <span className="text-slate-500">{raw === selectedMonth ? String(raw) : '—'}</span>;

    case 'status':
      return <StatusBadge status={String(raw ?? '')} />;

    case 'currency':
      if (col.key === 'saasObePayout' && deal.saasObeMonth !== selectedMonth) {
        return <span className="font-medium">—</span>;
      }
      if (col.key === 'billingObePayout' && deal.billingObeMonth !== selectedMonth) {
        return <span className="font-medium">—</span>;
      }
      return <span className="font-medium">{raw ? formatCurrency(Number(raw)) : '—'}</span>;

    case 'calculatedTotal': {
      const saas = deal.saasObeMonth === selectedMonth ? deal.saasObePayout : 0;
      const billing = deal.billingObeMonth === selectedMonth ? deal.billingObePayout : 0;
      const total = saas + billing;
      return <span className="font-semibold">{total ? formatCurrency(total) : '—'}</span>;
    }

    case 'termPill':
      return <TermPill term={String(raw ?? '')} />;

    case 'percent':
      return <span className="tabular-nums text-slate-600">{raw ? `${Number(raw).toFixed(1)}%` : '—'}</span>;

    case 'text':
    default:
      return <span className="text-slate-500">{String(raw ?? '') || '—'}</span>;
  }
}

/** Resolves a cell to a plain string for CSV export. */
function cellToString(col: DealColumnDef, deal: DealDetail, selectedMonth: string): string {
  const raw = (deal as unknown as Record<string, unknown>)[col.key];

  switch (col.render) {
    case 'schoolLink':       return deal.schoolName || '';
    case 'conditionalMonth': return raw === selectedMonth ? String(raw) : '—';
    case 'status':           return String(raw ?? '');
    case 'currency':
      if (col.key === 'saasObePayout' && deal.saasObeMonth !== selectedMonth) return '—';
      if (col.key === 'billingObePayout' && deal.billingObeMonth !== selectedMonth) return '—';
      return raw ? formatCurrency(Number(raw)) : '—';
    case 'calculatedTotal': {
      const saas = deal.saasObeMonth === selectedMonth ? deal.saasObePayout : 0;
      const billing = deal.billingObeMonth === selectedMonth ? deal.billingObePayout : 0;
      const total = saas + billing;
      return total ? formatCurrency(total) : '—';
    }
    case 'termPill':  return String(raw ?? '') || '—';
    case 'percent':   return raw ? `${Number(raw).toFixed(1)}%` : '—';
    case 'text':
    default:          return String(raw ?? '') || '—';
  }
}

const thCls = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap';
const tdCls = 'px-4 py-3 text-sm text-[#0F172A] whitespace-nowrap';

export default function ActivationTable({
  deals,
  columns,
  selectedMonth,
  selectedRep,
  title,
  showCalculator,
  showMultiplierViewer,
  onOpenCalculator,
  onOpenMultipliers,
}: ActivationTableProps) {
  const [isOpen, setIsOpen] = useState(true);
  useEffect(() => { setIsOpen(true); }, [selectedRep, selectedMonth]);

  const saasTotal    = deals.filter(d => d.saasObeMonth === selectedMonth).reduce((s, d) => s + d.saasObePayout, 0);
  const billingTotal = deals.filter(d => d.billingObeMonth === selectedMonth).reduce((s, d) => s + d.billingObePayout, 0);
  const grandTotal   = saasTotal + billingTotal;

  const summaryText = deals.length === 0
    ? 'No activations this month'
    : `${deals.length} school${deals.length !== 1 ? 's' : ''} · ${formatCurrency(saasTotal)} SaaS · ${formatCurrency(billingTotal)} Billing · ${formatCurrency(grandTotal)} total`;

  function handleExport(e: React.MouseEvent) {
    e.stopPropagation();
    const headers = columns.map((c) => c.label);
    const rows = deals.map((d) => columns.map((c) => cellToString(c, d, selectedMonth)));
    downloadCSV(`${toSlug(selectedRep)}_activations_${toSlug(selectedMonth)}.csv`, headers, rows);
  }

  function footerValue(col: DealColumnDef): string {
    if (col.render === 'currency') {
      if (col.key === 'saasObePayout') return formatCurrency(saasTotal);
      if (col.key === 'billingObePayout') return formatCurrency(billingTotal);
      const total = deals.reduce((s, d) => s + (Number((d as unknown as Record<string, unknown>)[col.key]) || 0), 0);
      return formatCurrency(total);
    }
    if (col.render === 'calculatedTotal') return formatCurrency(grandTotal);
    return '';
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <button onClick={() => setIsOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">{title ?? 'SaaS and Billing OBE Detail'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isOpen ? `${deals.length} deal${deals.length !== 1 ? 's' : ''} this month` : summaryText}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Multiplier viewer button (AE/RR — no calculator) */}
          {showMultiplierViewer && !showCalculator && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenMultipliers?.(); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] border border-[#4F46E5]/30 hover:bg-[#EEF2FF] transition-colors px-3 py-1.5 rounded-md"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              View Multipliers
            </button>
          )}
          {/* Calculator + multiplier viewer (RR — both) */}
          {showCalculator && (
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-2">
                {showMultiplierViewer && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenMultipliers?.(); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] border border-[#4F46E5]/30 hover:bg-[#EEF2FF] transition-colors px-3 py-1.5 rounded-md"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    View Multipliers
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenCalculator?.(); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] transition-colors px-3 py-1.5 rounded-md shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Open calculator
                </button>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">Model a deal payout before it closes</span>
            </div>
          )}
          <button onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-brand-600 transition-colors px-2 py-1 rounded hover:bg-brand-50">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
          <ChevronIcon open={isOpen} />
        </div>
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-[#E2E8F0]">
            {deals.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-slate-400">No activations found for the selected rep and month.</p>
              </div>
            ) : (
              <div className="overflow-x-auto table-scroll">
                <table className="w-full min-w-[680px]">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} className={`${thCls} ${col.align === 'right' ? 'text-right' : ''}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {deals.map((deal, i) => (
                      <tr key={i} className="transition-colors hover:bg-[#F8FAFC]">
                        {columns.map((col) => (
                          <td key={col.key}
                            className={`${tdCls} ${col.align === 'right' ? 'text-right tabular-nums' : ''} ${col.render === 'schoolLink' ? 'font-medium max-w-[240px]' : ''}`}>
                            {renderCell(col, deal, selectedMonth)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                    <tr>
                      {columns.map((col, i) => {
                        const val = footerValue(col);
                        return (
                          <td key={col.key}
                            className={`px-4 py-3 text-sm font-semibold tabular-nums ${col.align === 'right' ? 'text-right text-[#0F172A]' : 'text-xs uppercase tracking-wider text-slate-400'}`}>
                            {i === 0 ? (
                              <>
                                Total
                                <span className="text-[10px] font-normal text-slate-300 block">Deal-level</span>
                              </>
                            ) : val}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
