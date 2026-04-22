'use client';

import { useEffect } from 'react';
import { CalculatorConfig } from '@/types';

interface MultiplierModalProps {
  calculatorConfigs: CalculatorConfig[];
  selectedMonth: string;
  channelRole?: string;
  onClose: () => void;
}

function formatMult(value: number): string {
  if (!value) return '—';
  return value.toFixed(2) + 'x';
}

/** Formats a raw Sheet month string (e.g. "3/1/2026") as "March 2026". */
function formatMonthLabel(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Filter configs to those relevant to a rep's channel role.
 *  Falls back to all configs if no rows match the role. */
function filterByTeam(configs: CalculatorConfig[], channelRole?: string): CalculatorConfig[] {
  if (!channelRole) return configs;
  const role = channelRole.toLowerCase();
  const isRR  = role.includes('rapid') || role === 'rr';
  const isAE  = role === 'ae' || role.includes('account executive');
  const isSDR = role.includes('sdr');

  const filtered = configs.filter((c) => {
    const team = c.team.toLowerCase();
    if (isRR)  return team.includes('rapid') || team === 'rr';
    if (isAE)  return team === 'ae' || team.includes('account executive');
    if (isSDR) return team.includes('sdr');
    return team.includes(role);
  });

  return filtered.length > 0 ? filtered : configs;
}

export default function MultiplierModal({ calculatorConfigs, selectedMonth, channelRole, onClose }: MultiplierModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Filter by team first, then by month
  const teamConfigs = filterByTeam(calculatorConfigs, channelRole);
  const monthConfigs = teamConfigs.filter((c) => c.month === selectedMonth);
  const rows = monthConfigs.length > 0 ? monthConfigs : teamConfigs;

  // Group by lead type across teams
  const uniqueLeadTypes = [...new Set(rows.map((c) => c.leadType).filter(Boolean))];
  void uniqueLeadTypes; // used indirectly via rows

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">{formatMonthLabel(selectedMonth)} Payout Multipliers</h2>
            <p className="text-xs text-slate-400 mt-0.5">Configured multipliers for the selected month</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No multiplier config found for this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 pr-4">Lead Type</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 px-4">Team-Lead</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 px-4">Seasonality</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 px-4">Annual</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 px-4">Monthly</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-400 pb-3 pl-4">Billing OBE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {rows.map((cfg, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 pr-4 font-medium text-[#0F172A]">{cfg.leadType || '—'}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-600">{formatMult(cfg.teamLeadMultiplier)}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-600">{formatMult(cfg.seasonalityMultiplier)}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-600">{formatMult(cfg.annualMultiplier)}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-600">{formatMult(cfg.monthlyMultiplier)}</td>
                      <td className="py-3 pl-4 text-right tabular-nums text-slate-600">{formatMult(cfg.billingObeMultiplier)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Note */}
          <p className="mt-5 text-xs text-slate-400 border-t border-[#F1F5F9] pt-4">
            Multipliers update monthly. Contact your manager if you have questions.
          </p>
        </div>
      </div>
    </div>
  );
}
