'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalculatorConfig, CalculatorPrefill } from '@/types';
import { parseMonthToSortable } from '@/lib/utils';

/** Formats a raw Sheet month string (e.g. "3/1/2026") as "March 2026". */
function formatMonthLabel(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const LEAD_TYPES = ['High Intent', 'Low Intent', 'Cold'] as const;
type LeadType = typeof LEAD_TYPES[number];

interface CalculatorModalProps {
  calculatorConfigs: CalculatorConfig[];
  selectedMonth: string;
  prefill?: CalculatorPrefill;
  onClose: () => void;
}

/** Find multipliers for the given month + lead type, falling back to the most recent available month. */
function lookupMultipliers(
  configs: CalculatorConfig[],
  selectedMonth: string,
  leadType: string,
): CalculatorConfig | null {
  const relevant = configs.filter(
    (c) => c.team.toLowerCase() === 'rapid response' && c.leadType === leadType,
  );
  if (relevant.length === 0) return null;

  const exact = relevant.find((c) => c.month === selectedMonth);
  if (exact) return exact;

  // Fallback: most recent month that is on or before the selected month
  const selectedSortable = parseMonthToSortable(selectedMonth);
  const sorted = [...relevant].sort(
    (a, b) => parseMonthToSortable(b.month) - parseMonthToSortable(a.month),
  );
  return (
    sorted.find((c) => parseMonthToSortable(c.month) <= selectedSortable) ?? sorted[0] ?? null
  );
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtMult(n: number): string {
  return `× ${n.toFixed(2)}`;
}

interface ReceiptRowProps {
  operator?: string;
  value: string;
  label: string;
  bold?: boolean;
  color?: string;
  dividerAbove?: boolean;
}

function ReceiptRow({ operator, value, label, bold, color, dividerAbove }: ReceiptRowProps) {
  return (
    <>
      {dividerAbove && <div className="border-t border-[#E2E8F0] my-1" />}
      <div className="flex items-baseline justify-between gap-4 py-1">
        <span className={`tabular-nums font-${bold ? 'bold' : 'medium'} text-${bold ? 'base' : 'sm'} ${color ?? 'text-[#0F172A]'} whitespace-nowrap`}>
          {operator ? <span className="text-slate-400 mr-1.5">{operator}</span> : null}
          {value}
        </span>
        <span className="text-xs text-slate-400 text-right">{label}</span>
      </div>
    </>
  );
}

export default function CalculatorModal({
  calculatorConfigs,
  selectedMonth,
  prefill,
  onClose,
}: CalculatorModalProps) {
  const [mrr, setMrr] = useState<string>(prefill?.mrr != null ? String(prefill.mrr) : '');
  const [leadType, setLeadType] = useState<LeadType>(
    (prefill?.leadType as LeadType) ?? 'High Intent',
  );
  const [isAnnual, setIsAnnual] = useState<boolean>(prefill?.isAnnual ?? true);
  const [billingObe, setBillingObe] = useState<boolean>(prefill?.billingObe ?? false);

  // Close on Escape
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const mrrVal = parseFloat(mrr.replace(/[$,]/g, '')) || 0;
  const config = lookupMultipliers(calculatorConfigs, selectedMonth, leadType);
  const fallbackMonth = config && config.month !== selectedMonth ? config.month : null;

  // Calculation
  const termMultiplier = config ? (isAnnual ? config.annualMultiplier : config.monthlyMultiplier) : 0;
  const saasObePayout = config
    ? mrrVal * config.teamLeadMultiplier * config.seasonalityMultiplier * termMultiplier
    : 0;
  const billingObePayout = billingObe && config ? saasObePayout * config.billingObeMultiplier : 0;
  const totalPayout = saasObePayout + billingObePayout;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F172A] px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-white font-semibold text-base leading-tight">
              Deal Payout Calculator
            </h2>
            {prefill?.schoolName && (
              <p className="text-slate-400 text-sm mt-0.5 truncate max-w-[300px]">
                {prefill.schoolName}
              </p>
            )}
            {fallbackMonth && (
              <p className="text-amber-400 text-xs mt-1">
                Using multipliers from {formatMonthLabel(fallbackMonth)} — no config for {formatMonthLabel(selectedMonth)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors ml-4 mt-0.5 shrink-0"
            aria-label="Close calculator"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* ── Inputs ── */}
          <div className="space-y-4">
            {/* MRR */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                MRR ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={mrr}
                  onChange={(e) => setMrr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-4 py-2.5 text-sm font-medium text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent tabular-nums"
                />
              </div>
            </div>

            {/* Lead Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Lead Type
              </label>
              <div className="relative">
                <select
                  value={leadType}
                  onChange={(e) => setLeadType(e.target.value as LeadType)}
                  className="w-full appearance-none px-4 py-2.5 pr-9 text-sm font-medium text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                >
                  {LEAD_TYPES.map((lt) => (
                    <option key={lt} value={lt}>{lt}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Annual / Monthly toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Contract Term
              </label>
              <div className="flex rounded-lg border border-[#E2E8F0] overflow-hidden">
                {[{ label: 'Annual', value: true }, { label: 'Monthly', value: false }].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setIsAnnual(value)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                      isAnnual === value
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-[#F8FAFC] text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Billing OBE toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Billing OBE?
              </label>
              <div className="flex rounded-lg border border-[#E2E8F0] overflow-hidden">
                {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setBillingObe(value)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                      billingObe === value
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-[#F8FAFC] text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Breakdown ── */}
          <div className="border-t border-[#E2E8F0] pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Payout Breakdown
            </p>

            {!config ? (
              <p className="text-sm text-slate-400 italic">
                No multiplier config found for this month and team.
              </p>
            ) : (
              <div className="bg-[#F8FAFC] rounded-lg px-4 py-3 space-y-0.5">
                <ReceiptRow
                  value={fmt(mrrVal)}
                  label="MRR"
                />
                <ReceiptRow
                  operator="×"
                  value={config.teamLeadMultiplier.toFixed(2)}
                  label={`Lead type: ${leadType}`}
                />
                <ReceiptRow
                  operator="×"
                  value={config.seasonalityMultiplier.toFixed(2)}
                  label="Seasonality"
                />
                <ReceiptRow
                  operator="×"
                  value={termMultiplier.toFixed(2)}
                  label={isAnnual ? 'Annual prepay' : 'Monthly'}
                />
                <ReceiptRow
                  operator="="
                  value={fmt(saasObePayout)}
                  label="SaaS OBE Payout"
                  bold
                  color="text-[#166534]"
                  dividerAbove
                />

                {billingObe && (
                  <>
                    <ReceiptRow
                      operator="×"
                      value={config.billingObeMultiplier.toFixed(2)}
                      label="Billing OBE"
                    />
                    <ReceiptRow
                      operator="="
                      value={fmt(billingObePayout)}
                      label="Billing OBE Payout"
                      bold
                      color="text-[#166534]"
                      dividerAbove
                    />
                  </>
                )}

                {/* Total */}
                <div className="border-t border-[#E2E8F0] mt-2 pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold tabular-nums text-[#4F46E5]">
                      {fmt(totalPayout)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Payout
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
