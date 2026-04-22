'use client';

import { useState } from 'react';

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

export default function DemosPlaceholder() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">Demos Held Detail</h2>
          <p className="text-xs text-slate-400 mt-0.5">Individual demo breakdown</p>
        </div>
        <ChevronIcon open={isOpen} />
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-[#E2E8F0] px-6 py-10 flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 max-w-md">
              Demo-level detail is coming in a future release. Contact your manager for individual demo breakdowns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
