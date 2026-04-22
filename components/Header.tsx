import Image from 'next/image';
import { RepSummary } from '@/types';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  reps: string[];
  months: string[];
  selectedRep: string;
  selectedMonth: string;
  onRepChange: (rep: string) => void;
  onMonthChange: (month: string) => void;
  repSummary: RepSummary | null;
  /** True when the selected rep is also a manager */
  isManager?: boolean;
  /** Whether the manager view is currently active */
  managerView?: boolean;
  onToggleManagerView?: () => void;
}

const chevronDown = (
  <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

function StyledSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white/10 border border-white/20 text-white text-sm font-medium
          rounded-lg pl-3 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-white/30
          cursor-pointer min-w-[160px] truncate"
        style={{ WebkitAppearance: 'none' }}
      >
        {placeholder && (
          <option value="" disabled className="text-slate-700">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt} value={opt} className="text-[#0F172A] bg-white">
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
        {chevronDown}
      </div>
    </div>
  );
}

export default function Header({
  reps,
  months,
  selectedRep,
  selectedMonth,
  onRepChange,
  onMonthChange,
  repSummary,
  isManager,
  managerView,
  onToggleManagerView,
}: HeaderProps) {
  const initials = selectedRep ? getInitials(selectedRep) : '—';

  const metaParts = [
    repSummary?.channelRole,
    repSummary?.level ? `Level ${repSummary.level}` : null,
    repSummary?.tenureGroup,
  ].filter(Boolean);

  return (
    <header className="bg-[#0F172A] text-white">
      {/* Top bar: brand + selectors */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/brightwheel-logo.png"
            alt="Brightwheel"
            width={120}
            height={32}
            className="h-7 w-auto object-contain"
            priority
          />
          <span className="text-white/30 text-sm">|</span>
          <span className="text-sm font-semibold tracking-tight text-white/80">Core Compensation Dashboard</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <StyledSelect
            value={selectedRep}
            onChange={onRepChange}
            options={reps}
            placeholder="Select rep…"
          />
          <StyledSelect
            value={selectedMonth}
            onChange={onMonthChange}
            options={months}
            placeholder="Select month…"
          />
        </div>
      </div>

      {/* Rep identity section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white tracking-wide">{initials}</span>
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-white truncate">
              {selectedRep || 'Select a rep'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {metaParts.map((part, i) => (
                <span key={i} className="text-xs text-white/55 font-medium">
                  {i > 0 && <span className="mr-3 text-white/25">·</span>}
                  {part}
                </span>
              ))}
              {repSummary?.manager && (
                <span className="text-xs text-white/55 font-medium">
                  {metaParts.length > 0 && <span className="mr-3 text-white/25">·</span>}
                  Reports to <span className="text-white/75">{repSummary.manager}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Manager view toggle — only visible when selected rep is a manager */}
        {isManager && onToggleManagerView && (
          <button
            onClick={onToggleManagerView}
            className={`shrink-0 flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg border transition-colors ${
              managerView
                ? 'bg-white/15 border-white/30 text-white'
                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/15 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {managerView ? 'Rep Activity' : 'Team View'}
          </button>
        )}
      </div>

      {/* Bottom border with subtle gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  );
}
