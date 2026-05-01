'use client';

import { useState, useEffect } from 'react';
import { MPESummary } from '@/types';
import { formatPercent } from '@/lib/utils';

interface MpeSectionProps {
  mpeSummary: MPESummary | null;
}

// ─── Mini sparkline bar chart ────────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 100);
  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((v, i) => {
        const pct = Math.min(v / max, 1);
        const isGreen = v >= 100;
        const isAmber = v >= 85 && v < 100;
        const barColor = isGreen ? 'bg-[#22C55E]' : isAmber ? 'bg-[#F59E0B]' : 'bg-[#EF4444]';
        return (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <div
              className={`w-full rounded-sm ${barColor}`}
              style={{ height: `${pct * 36}px`, minHeight: 3 }}
            />
            <span className="text-[9px] text-slate-400 tabular-nums">M{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Criteria check row ───────────────────────────────────────────────────────

function CriteriaRow({ met, label, sublabel }: { met: boolean; label: string; sublabel?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F1F5F9] last:border-0">
      <span className={`mt-0.5 text-lg leading-none ${met ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
        {met ? '✓' : '✗'}
      </span>
      <div>
        <p className="text-sm font-medium text-[#0F172A]">{label}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

export function MpeModal({ mpe, onClose }: { mpe: MPESummary; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const belowFloor = mpe.belowFloorFlag === 1;
  const floorPct = Math.min(mpe.l3mAvg / (mpe.performanceFloor || 70), 1);

  const sparkValues = [
    mpe.m1Attainment, mpe.m2Attainment, mpe.m3Attainment,
    mpe.m4Attainment, mpe.m5Attainment, mpe.m6Attainment,
  ];

  const isEligible = mpe.promotionEligible?.toLowerCase() === 'yes';
  const isOverRamped = mpe.overRampedThreshold?.toLowerCase() === 'yes';
  const l6mOver120 = mpe.l6mAvgOver120Flag === 1;
  const fourOf6 = mpe.monthsOver100L6m >= 4;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">MPE &amp; Promotion Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mpe.currentLevel} → {mpe.nextLevel}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Performance Floor (MPE) */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Performance Floor (MPE)</h3>

            {/* L3M vs floor progress */}
            <div className="mb-3">
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                <span>L3M Average: <span className="text-[#0F172A] font-semibold">{formatPercent(mpe.l3mAvg)}</span></span>
                <span>Floor: {formatPercent(mpe.performanceFloor || 70)}</span>
              </div>
              <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${belowFloor ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}
                  style={{ width: `${Math.min(floorPct * 100, 100)}%` }}
                />
              </div>
            </div>

            {belowFloor ? (
              <div className="flex items-center gap-2 bg-[#FEF2F2] text-[#991B1B] rounded-lg px-3 py-2 text-xs font-medium">
                <span>⚠</span>
                <span>Currently below performance floor</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#F0FDF4] text-[#166534] rounded-lg px-3 py-2 text-xs font-medium">
                <span>✓</span>
                <span>Above performance floor</span>
              </div>
            )}

            <div className="mt-3 text-xs text-slate-500">
              Current month pacing: <span className="font-semibold text-[#0F172A]">{formatPercent(mpe.pacingToEom)}</span>
            </div>
          </section>

          {/* 6-Month Sparkline */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">6-Month Attainment</h3>
            <Sparkline values={sparkValues} />
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span>L3M Avg: <span className="font-semibold text-[#0F172A]">{formatPercent(mpe.l3mAvg)}</span></span>
              <span>L6M Avg: <span className="font-semibold text-[#0F172A]">{formatPercent(mpe.l6mAvg)}</span></span>
              <span>Months ≥100%: <span className="font-semibold text-[#0F172A]">{mpe.monthsOver100L6m}/6</span></span>
            </div>
          </section>

          {/* Promotion Track */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Promotion Track</h3>
            <CriteriaRow
              met={isOverRamped}
              label="Over ramped threshold"
              sublabel={`Threshold status: ${mpe.overRampedThreshold || 'N/A'}`}
            />
            <CriteriaRow
              met={l6mOver120}
              label="6-month average above 120%"
              sublabel={`Current L6M avg: ${formatPercent(mpe.l6mAvg)}`}
            />
            <CriteriaRow
              met={fourOf6}
              label="4 of last 6 months at or above 100%"
              sublabel={`Currently: ${mpe.monthsOver100L6m} of 6 months`}
            />
          </section>

          {/* Eligibility verdict */}
          <div className={`rounded-lg px-4 py-3 ${isEligible ? 'bg-[#F0FDF4]' : 'bg-[#F8FAFC]'}`}>
            {isEligible ? (
              <p className="text-sm font-semibold text-[#166534]">
                ✓ Eligible for promotion — speak with your manager
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {mpe.monthsToPromoteEstimate > 0
                  ? `Est. ${mpe.monthsToPromoteEstimate} more month${mpe.monthsToPromoteEstimate !== 1 ? 's' : ''} at current pace`
                  : 'Not yet eligible — keep building momentum'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Compact status pill ─────────────────────────────────────────────────────

function MpeStatusPill({ mpe }: { mpe: MPESummary }) {
  const isEligible = mpe.promotionEligible?.toLowerCase() === 'yes';
  const belowFloor = mpe.belowFloorFlag === 1;

  if (isEligible) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
        Promotion Eligible
      </span>
    );
  }
  if (belowFloor) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF9C3] text-[#854D0E]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        Needs Attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1E40AF]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
      On Track
    </span>
  );
}

// ─── Main exported component ─────────────────────────────────────────────────

export default function MpeSection({ mpeSummary }: MpeSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!mpeSummary) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl px-6 py-4 animate-pulse">
        <div className="h-3 bg-slate-100 rounded w-32 mb-3" />
        <div className="h-5 bg-slate-100 rounded w-48" />
      </div>
    );
  }

  const promoEligibleText = mpeSummary.promotionEligible
    ? mpeSummary.promotionEligible.charAt(0).toUpperCase() + mpeSummary.promotionEligible.slice(1).toLowerCase()
    : 'N/A';

  return (
    <>
      <div>
        {/* Section header: label + View Details button side-by-side */}
        <div className="flex items-center justify-between px-1 mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">My Promotion Path</p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline"
          >
            View Details
          </button>
        </div>

        {/* Content row: level path arrow → L3M text + status pill */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* Left: level path */}
          <div className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
            <span>{mpeSummary.currentLevel}</span>
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-500">{mpeSummary.nextLevel}</span>
          </div>

          {/* Right: L3M summary + status pill */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-400 hidden sm:inline">
              L3M: {formatPercent(mpeSummary.l3mAvg)} · Promo eligible: {promoEligibleText}
            </span>
            <MpeStatusPill mpe={mpeSummary} />
          </div>
        </div>
      </div>

      {modalOpen && <MpeModal mpe={mpeSummary} onClose={() => setModalOpen(false)} />}
    </>
  );
}
