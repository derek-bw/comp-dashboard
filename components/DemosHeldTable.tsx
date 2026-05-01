'use client';

import { useState, useMemo } from 'react';
import { DemoDetail } from '@/types';
import { downloadCSV } from '@/lib/utils';

interface DemosHeldTableProps {
  demos: DemoDetail[];
  selectedMonth: string;
  selectedRep: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="w-4 h-4 text-slate-400 transition-transform duration-200"
      style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

const OUTCOME_ORDER: Record<DemoDetail['demoOutcome'], number> = {
  'Held': 0,
  'Rescheduled': 1,
  'No Show': 2,
};

function OutcomeBadge({ outcome }: { outcome: DemoDetail['demoOutcome'] }) {
  const styles: Record<DemoDetail['demoOutcome'], string> = {
    'Held':        'bg-green-100 text-green-700',
    'No Show':     'bg-red-100 text-red-600',
    'Rescheduled': 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[outcome] ?? 'bg-slate-100 text-slate-500'}`}>
      {outcome}
    </span>
  );
}

export default function DemosHeldTable({ demos, selectedMonth, selectedRep }: DemosHeldTableProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sortedDemos = useMemo(() => [...demos].sort((a, b) => {
    const dateA = new Date(a.demoDate).getTime();
    const dateB = new Date(b.demoDate).getTime();
    if (dateB !== dateA) return dateB - dateA; // descending
    return OUTCOME_ORDER[a.demoOutcome] - OUTCOME_ORDER[b.demoOutcome];
  }), [demos]);

  const heldCount = useMemo(() => demos.filter((d) => d.demoOutcome === 'Held').length, [demos]);
  const convertedCount = useMemo(() => demos.filter((d) => d.convertedToObe).length, [demos]);
  const conversionRate = heldCount > 0 ? Math.round((convertedCount / heldCount) * 100) : 0;

  const summaryText = useMemo(() => {
    if (demos.length === 0) return 'No demos this month';
    return `${demos.length} demo${demos.length !== 1 ? 's' : ''} · ${convertedCount} converted (${conversionRate}%)`;
  }, [demos, convertedCount, conversionRate]);

  function handleExport() {
    const headers = ['School Name', 'Demo Date', 'Outcome', 'Converted to OBE', 'SaaS OBE Month', 'Notes'];
    const rows = sortedDemos.map((d) => [
      d.schoolName,
      d.demoDate,
      d.demoOutcome,
      d.convertedToObe ? 'Yes' : 'No',
      d.saasObeMonth,
      d.notes,
    ]);
    downloadCSV(`demos_${selectedRep}_${selectedMonth}.csv`, headers, rows);
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">Demos Held Detail</h2>
          <p className="text-xs text-slate-400 mt-0.5">{summaryText}</p>
        </div>
        <div className="flex items-center gap-3">
          {demos.length > 0 && isOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); handleExport(); }}
              className="text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
          )}
          <ChevronIcon open={isOpen} />
        </div>
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-[#E2E8F0]">
            {demos.length === 0 ? (
              <div className="px-6 py-10 flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">No demos recorded for this month.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">School</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Demo Date ↓</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Outcome</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Converted to OBE</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">SaaS OBE Month</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {sortedDemos.map((demo, i) => (
                      <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#0F172A]">{demo.schoolName || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{demo.demoDate || '—'}</td>
                        <td className="px-4 py-3">
                          <OutcomeBadge outcome={demo.demoOutcome} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {demo.convertedToObe ? (
                            <span className="text-green-600 font-semibold">✓</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{demo.saasObeMonth || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#F8FAFC] border-t border-[#E2E8F0]">
                      <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-slate-500">
                        {demos.length} demo{demos.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {heldCount} held
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        {convertedCount} ({conversionRate}%)
                      </td>
                      <td />
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
