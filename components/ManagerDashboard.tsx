'use client';

import { useMemo, useState } from 'react';
import { TeamSummary, ManagerRollup, DealDetail, DemoDetail, MPESummary } from '@/types';
import { formatCurrency, formatPercent, sortMonths } from '@/lib/utils';
import { MpeModal } from './MpeSection';

interface ManagerDashboardProps {
  managerName: string;
  selectedMonth: string;
  teamSummary: TeamSummary[];
  managerRollup: ManagerRollup[];
  mpeSummary: MPESummary[];
  deals: DealDetail[];
  demoDetails: DemoDetail[];
  onRepClick: (repName: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function AttainmentCell({ value }: { value: number }) {
  const isGreen = value >= 100;
  const isAmber = value >= 85 && value < 100;
  const cls = isGreen
    ? 'bg-[#DCFCE7] text-[#166534]'
    : isAmber
    ? 'bg-[#FEF9C3] text-[#854D0E]'
    : 'bg-[#FEE2E2] text-[#991B1B]';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tabular-nums ${cls}`}>
      {formatPercent(value)}
    </span>
  );
}

/** Parse "M/D/YYYY" strings to Date, returns null on failure. */
function parseDate(s: string): Date | null {
  if (!s || s === '—') return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Number of calendar months from dateA to dateB (positive = B is after A). */
function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// ─── A3 + A8: Team Summary Cards ─────────────────────────────────────────────

function TeamSummaryCards({
  rollup,
  repsAbove85,
  activeClawbackCount,
  clawbackExposure,
}: {
  rollup: ManagerRollup;
  repsAbove85: number;
  activeClawbackCount: number;
  clawbackExposure: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {/* Active HC — first position */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Active HC</p>
        <p className="text-3xl font-bold tabular-nums text-[#0F172A]">{rollup.repsOnTeam}</p>
        <p className="text-[10px] text-slate-400">Reps this month</p>
      </div>
      {/* Team Net Payout */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Team Net Payout</p>
        <p className="text-3xl font-bold tabular-nums text-[#0F172A]">{formatCurrency(rollup.teamNetPayout)}</p>
      </div>
      {/* Team Avg Attainment */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Team Avg Attainment</p>
        <p className="text-3xl font-bold tabular-nums text-[#0F172A]">{formatPercent(rollup.teamAvgAttainmentPct)}</p>
      </div>
      {/* Reps at ≥85% */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Reps at ≥85%</p>
        <p className="text-3xl font-bold tabular-nums text-[#0F172A]">
          {repsAbove85} <span className="text-base text-slate-400 font-normal">/ {rollup.repsOnTeam}</span>
        </p>
      </div>
      {/* Active Clawbacks */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Active Clawbacks</p>
        <p className="text-3xl font-bold tabular-nums text-[#0F172A]">{activeClawbackCount}</p>
        {clawbackExposure < 0 && (
          <p className="text-[10px] font-semibold text-[#991B1B]">{formatCurrency(clawbackExposure)} exposure</p>
        )}
      </div>
    </div>
  );
}

// ─── Deal Quality Row ─────────────────────────────────────────────────────────

function DealQualityRow({ rollup }: { rollup: ManagerRollup }) {
  if (rollup.channelRole?.toLowerCase().includes('sdr')) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Avg MRR / Deal',   value: formatCurrency(rollup.teamAvgMrrPerDeal) },
        { label: 'Billing Attach %', value: `${rollup.teamBillingAttachPct.toFixed(1)}%` },
        { label: 'Annual Prepay %',  value: `${rollup.teamPrepayPct.toFixed(1)}%` },
        { label: 'Avg Discount %',   value: `${rollup.teamAvgDiscountPct.toFixed(1)}%` },
      ].map((tile) => (
        <div key={tile.label} className="bg-white border border-[#E2E8F0] rounded-lg px-5 py-4 flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{tile.label}</p>
          <p className="text-xl font-semibold tabular-nums text-[#334155]">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── A4: BNP Summary Tiles (AE only) ─────────────────────────────────────────

function BnpTiles({
  deals,
  selectedMonth,
  teamRepNames,
  rollup,
}: {
  deals: DealDetail[];
  selectedMonth: string;
  teamRepNames: Set<string>;
  rollup: ManagerRollup;
}) {
  if (rollup.channelRole?.toLowerCase().includes('sdr')) return null;

  // Deals for this team in selected month
  const teamDeals = deals.filter(
    (d) =>
      teamRepNames.has(d.repName) &&
      d.bnpFlag &&
      (d.saasObeMonth === selectedMonth || d.saasCwMonth === selectedMonth)
  );

  const bnpCwCount = teamDeals.filter((d) => {
    const cwDate  = parseDate(d.saasCwMonth);
    const openDate = parseDate(d.bnpOpeningDate);
    if (!cwDate || !openDate) return false;
    return monthsBetween(cwDate, openDate) > 3;
  }).length;

  const bnpSaasObeCount = teamDeals.filter((d) => {
    const obeDate  = parseDate(d.saasObeMonth);
    const openDate = parseDate(d.bnpOpeningDate);
    if (!obeDate || !openDate) return false;
    return monthsBetween(obeDate, openDate) > 3;
  }).length;

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'BNP CWs (3+ mo)',       value: bnpCwCount,       sub: 'Opens >3 mo after CW date' },
        { label: 'BNP SaaS OBEs (3+ mo)', value: bnpSaasObeCount,  sub: 'Opens >3 mo after OBE date' },
      ].map((tile) => (
        <div key={tile.label} className="bg-white border border-[#E2E8F0]/60 border-dashed rounded-lg px-4 py-3 flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{tile.label}</p>
          <p className="text-2xl font-bold tabular-nums text-[#0F172A]">{tile.value}</p>
          <p className="text-[10px] text-slate-400">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── A7: Rep Scorecard Table ──────────────────────────────────────────────────

function RepScorecardTable({ reps, onRepClick }: { reps: TeamSummary[]; onRepClick: (name: string) => void }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E2E8F0]">
        <h2 className="text-sm font-semibold text-[#0F172A]">Rep Scorecard</h2>
        <p className="text-xs text-slate-400 mt-0.5">Click any rep to view their full dashboard</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>
              {/* A7: renamed "Billing / Blended" → "Attainment %" */}
              {['Rep', 'Role', 'SaaS Attainment', 'Attainment %', 'Net Payout', 'Clawbacks', 'YTD'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {reps.map((rep) => {
              const isSDR = rep.channelRole?.toUpperCase() === 'SDR';
              // A7: AE → SaaS OBE; SDR → Blended
              const primaryAttainment = isSDR ? rep.blendedAttainment : rep.saasObeAttainment;
              const hasClawback = rep.saasClawbacks < 0;
              return (
                <tr key={rep.repName} className="hover:bg-[#F8FAFC] cursor-pointer transition-colors" onClick={() => onRepClick(rep.repName)}>
                  <td className="px-4 py-3 font-medium text-[#4F46E5] hover:underline">{rep.repName}</td>
                  <td className="px-4 py-3 text-slate-500">{rep.channelRole}</td>
                  <td className="px-4 py-3"><AttainmentCell value={rep.saasObeAttainment} /></td>
                  <td className="px-4 py-3"><AttainmentCell value={primaryAttainment} /></td>
                  <td className="px-4 py-3 tabular-nums text-[#0F172A] font-medium">{formatCurrency(rep.netPayout)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {hasClawback ? (
                      <span className="flex items-center gap-1 text-[#991B1B]">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatCurrency(rep.saasClawbacks)}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{formatCurrency(rep.ytdNetPayout)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── A5: Team FTO Summary (AE only, collapsible) ──────────────────────────────

function FtoSummarySection({ reps, rollup }: { reps: TeamSummary[]; rollup: ManagerRollup }) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  if (rollup.channelRole?.toLowerCase().includes('sdr')) return null;

  const ftoReps = reps.filter((r) => r.ftoDays > 0);
  const displayReps = showAll ? reps : ftoReps;

  if (reps.length === 0) return null;

  function pct(val: number) { return val ? `${val.toFixed(1)}%` : '—'; }
  function num(val: number) { return val ? val.toFixed(1) : '—'; }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">Team FTO &amp; Adjusted Targets</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            FTO-adjusted unit targets are used for MPE and accelerator calculations only. Distributed unit targets are unchanged.
          </p>
        </div>
        <svg
          className="w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4"
          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-[#E2E8F0]">
            {displayReps.length === 0 ? (
              <div className="px-6 py-6 flex items-center justify-between">
                <p className="text-sm text-slate-400">No reps with FTO days this month.</p>
                <button onClick={() => setShowAll(true)} className="text-xs font-medium text-[#4F46E5] hover:underline">
                  Show all reps
                </button>
              </div>
            ) : (
              <>
                <div>
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <tr>
                        {['Rep', 'FTO Days',
                          'SaaS Unit Target', 'SaaS FTO-Adj Target',
                          'Billing Unit Target', 'Billing FTO-Adj Target',
                          'SaaS Att.', 'SaaS FTO-Adj Att.',
                          'Billing Att.', 'Billing FTO-Adj Att.'
                        ].map((h) => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-normal break-words leading-tight">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {displayReps.map((rep) => (
                        <tr key={rep.repName} className={`hover:bg-[#F8FAFC] transition-colors ${rep.ftoDays > 0 ? '' : 'opacity-50'}`}>
                          <td className="px-3 py-3 font-medium text-[#0F172A]">{rep.repName}</td>
                          <td className="px-3 py-3 tabular-nums text-center">
                            {rep.ftoDays > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{rep.ftoDays}d</span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-3 tabular-nums text-slate-600">{num(rep.saasObeQuota)}</td>
                          <td className="px-3 py-3 tabular-nums text-slate-600">{num(rep.saasObeFtoAdjustedQuota) || '—'}</td>
                          <td className="px-3 py-3 tabular-nums text-slate-600">{num(rep.billingObeQuota)}</td>
                          <td className="px-3 py-3 tabular-nums text-slate-600">{num(rep.billingObeFtoAdjustedQuota) || '—'}</td>
                          <td className="px-3 py-3"><AttainmentCell value={rep.saasObeAttainment} /></td>
                          <td className="px-3 py-3">
                            {rep.saasObeFtoAdjustedAttainment > 0
                              ? <AttainmentCell value={rep.saasObeFtoAdjustedAttainment} />
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-3"><AttainmentCell value={rep.billingObeAttainment} /></td>
                          <td className="px-3 py-3">
                            {rep.billingObeFtoAdjustedAttainment > 0
                              ? <AttainmentCell value={rep.billingObeFtoAdjustedAttainment} />
                              : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 border-t border-[#F1F5F9] flex items-center gap-3">
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="text-xs font-medium text-[#4F46E5] hover:underline"
                  >
                    {showAll ? `Show FTO reps only (${ftoReps.length})` : `Show all reps (${reps.length})`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── A6: Manager MPE Table ────────────────────────────────────────────────────

function MpeTable({ mpeSummary, managerName, selectedMonth }: { mpeSummary: MPESummary[]; managerName: string; selectedMonth: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedMpe, setSelectedMpe] = useState<MPESummary | null>(null);

  const rows = mpeSummary.filter((m) => m.manager === managerName && m.month === selectedMonth);
  if (rows.length === 0) return null;

  function L3mCell({ value }: { value: number }) {
    const cls = value >= 100 ? 'text-[#166534]' : value >= 70 ? 'text-[#854D0E]' : 'text-[#991B1B]';
    return <span className={`tabular-nums font-semibold ${cls}`}>{formatPercent(value)}</span>;
  }

  return (
    <>
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
        >
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Team Promotion &amp; Performance Tracking</h2>
            <p className="text-xs text-slate-400 mt-0.5">{rows.length} rep{rows.length !== 1 ? 's' : ''} · {selectedMonth} · Click a rep name to view full MPE detail</p>
          </div>
          <svg
            className="w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4"
            style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="border-t border-[#E2E8F0] overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    {['Rep', 'Current Level', 'Next Level', 'L3M Avg', 'L6M Avg', 'Below Floor?', 'Promo Eligible?'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {rows.map((row) => {
                    const isEligible = row.promotionEligible?.toLowerCase() === 'yes';
                    const belowFloor = row.belowFloorFlag === 1;
                    return (
                      <tr key={row.repName} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedMpe(row)}
                            className="font-medium text-[#4F46E5] hover:underline text-sm text-left"
                          >
                            {row.repName}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.currentLevel || '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{row.nextLevel || '—'}</td>
                        <td className="px-4 py-3"><L3mCell value={row.l3mAvg} /></td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">{formatPercent(row.l6mAvg)}</td>
                        <td className="px-4 py-3">
                          {belowFloor ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#991B1B]">⚠ Yes</span>
                          ) : (
                            <span className="text-slate-400 text-xs">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" /> No
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MPE detail modal — same view as rep dashboard */}
      {selectedMpe && (
        <MpeModal mpe={selectedMpe} onClose={() => setSelectedMpe(null)} />
      )}
    </>
  );
}

// ─── A9: Team Demo Stats (SDR only) ──────────────────────────────────────────

function TeamDemoStats({
  demoDetails,
  selectedMonth,
  teamRepNames,
  rollup,
}: {
  demoDetails: DemoDetail[];
  selectedMonth: string;
  teamRepNames: Set<string>;
  rollup: ManagerRollup;
}) {
  if (!rollup.channelRole?.toLowerCase().includes('sdr')) return null;

  const teamDemos = demoDetails.filter(
    (d) => teamRepNames.has(d.repName) && d.demoMonth === selectedMonth
  );

  const totalDemos    = teamDemos.length;
  const heldCount     = teamDemos.filter((d) => d.demoOutcome === 'Held').length;
  const convertedCount = teamDemos.filter((d) => d.convertedToObe).length;
  const conversionRate = heldCount > 0 ? Math.round((convertedCount / heldCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Total Demos',       value: String(totalDemos),       sub: 'All outcomes' },
        { label: 'Held',              value: String(heldCount),         sub: 'Completed demos' },
        { label: 'Converted to OBE',  value: String(convertedCount),    sub: 'Led to SaaS OBE' },
        { label: 'Conversion Rate',   value: `${conversionRate}%`,      sub: 'Held → OBE' },
      ].map((tile) => (
        <div key={tile.label} className="bg-white border border-[#E2E8F0] rounded-lg px-5 py-4 flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{tile.label}</p>
          <p className="text-2xl font-bold tabular-nums text-[#0F172A]">{tile.value}</p>
          <p className="text-[10px] text-slate-400">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Rolling Trend Table ──────────────────────────────────────────────────────

function RollingTrendTable({ allTeamSummary, managerName }: { allTeamSummary: TeamSummary[]; managerName: string }) {
  const managed = allTeamSummary.filter((r) => r.managerName === managerName);
  const months  = sortMonths([...new Set(managed.map((r) => r.month))]).slice(-3);
  const repNames = [...new Set(managed.map((r) => r.repName))].sort();

  if (months.length === 0) return null;

  function getAttainment(rep: string, month: string): number | null {
    const row = managed.find((r) => r.repName === rep && r.month === month);
    if (!row) return null;
    return row.channelRole?.toUpperCase() === 'SDR' ? row.blendedAttainment : row.saasObeAttainment;
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E2E8F0]">
        <h2 className="text-sm font-semibold text-[#0F172A]">Rolling Trend</h2>
        <p className="text-xs text-slate-400 mt-0.5">Last {months.length} months of attainment</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-sm">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Rep</th>
              {months.map((m) => (
                <th key={m} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {repNames.map((rep) => (
              <tr key={rep} className="hover:bg-[#F8FAFC]">
                <td className="px-4 py-3 font-medium text-[#0F172A]">{rep}</td>
                {months.map((m) => {
                  const val = getAttainment(rep, m);
                  return (
                    <td key={m} className="px-4 py-3 text-center">
                      {val != null ? <AttainmentCell value={val} /> : <span className="text-slate-300">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function ManagerDashboard({
  managerName,
  selectedMonth,
  teamSummary,
  managerRollup,
  mpeSummary,
  deals,
  demoDetails,
  onRepClick,
}: ManagerDashboardProps) {
  const rollup = useMemo(
    () => managerRollup.find((r) => r.managerName === managerName && r.month === selectedMonth) ?? null,
    [managerRollup, managerName, selectedMonth]
  );

  const monthReps = useMemo(
    () => teamSummary.filter((r) => r.managerName === managerName && r.month === selectedMonth),
    [teamSummary, managerName, selectedMonth]
  );

  const teamRepNames = useMemo(() => new Set(monthReps.map((r) => r.repName)), [monthReps]);

  const repsAbove85 = useMemo(
    () => monthReps.filter((r) => {
      const att = r.channelRole?.toUpperCase() === 'SDR' ? r.blendedAttainment : r.saasObeAttainment;
      return att >= 85;
    }).length,
    [monthReps]
  );

  // A8: Active clawbacks
  const activeClawbackReps = useMemo(
    () => monthReps.filter((r) => r.saasClawbacks < 0),
    [monthReps]
  );
  const clawbackExposure = useMemo(
    () => activeClawbackReps.reduce((s, r) => s + r.saasClawbacks, 0),
    [activeClawbackReps]
  );

  if (!rollup) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-slate-400 text-center py-12">
          No manager rollup data found for {managerName} in {selectedMonth}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team label */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#4F46E5] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A]">{managerName}&apos;s Team</h2>
          <p className="text-xs text-slate-400">{rollup.repsOnTeam} rep{rollup.repsOnTeam !== 1 ? 's' : ''} · {selectedMonth}</p>
        </div>
      </div>

      <TeamSummaryCards
        rollup={rollup}
        repsAbove85={repsAbove85}
        activeClawbackCount={activeClawbackReps.length}
        clawbackExposure={clawbackExposure}
      />

      {/* A4: BNP tiles inline with deal quality */}
      <DealQualityRow rollup={rollup} />
      <BnpTiles deals={deals} selectedMonth={selectedMonth} teamRepNames={teamRepNames} rollup={rollup} />

      {/* A9: SDR team demo stats */}
      <TeamDemoStats
        demoDetails={demoDetails}
        selectedMonth={selectedMonth}
        teamRepNames={teamRepNames}
        rollup={rollup}
      />

      {monthReps.length > 0 && <RepScorecardTable reps={monthReps} onRepClick={onRepClick} />}

      {/* A5: FTO Summary */}
      <FtoSummarySection reps={monthReps} rollup={rollup} />

      {/* A6: MPE / Promotion table */}
      <MpeTable mpeSummary={mpeSummary} managerName={managerName} selectedMonth={selectedMonth} />

      <RollingTrendTable allTeamSummary={teamSummary} managerName={managerName} />
    </div>
  );
}
