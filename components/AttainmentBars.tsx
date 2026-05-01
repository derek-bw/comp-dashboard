import { RepSummary } from '@/types';
import { AttainmentMetric } from '@/lib/roleConfig';
import { formatPercent } from '@/lib/utils';

function formatUnits(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

interface AttainmentBarsProps {
  repSummary: RepSummary | null;
  metrics: AttainmentMetric[];
}

interface BarProps {
  label: string;
  actuals: number;
  quota: number;
  attainment: number;
  ftoAdjustedQuota?: number;
  ftoDays: number;
}

function AttainmentBar({ label, actuals, quota, attainment, ftoAdjustedQuota, ftoDays }: BarProps) {
  const pct = Math.min(attainment, 150);
  const isGreen = attainment >= 100;
  const barColor = isGreen ? 'bg-[#22C55E]' : 'bg-[#F59E0B]';
  const heroColor = isGreen ? 'text-[#16A34A]' : 'text-[#D97706]';
  // Round adjusted quota to nearest whole number everywhere it's displayed
  const adjQuota = ftoAdjustedQuota != null ? Math.round(ftoAdjustedQuota) : null;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={`text-5xl font-extrabold tabular-nums leading-none ${heroColor}`}>
          {formatPercent(attainment)}
        </span>
        {/* ⓘ FTO icon — always shown; content changes based on ftoDays */}
        <span className="relative group/fto self-center shrink-0">
          <span className={`w-4 h-4 rounded-full text-[9px] font-bold border inline-flex items-center justify-center cursor-help select-none ${
            ftoDays > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}>
            i
          </span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1E293B] text-white text-xs rounded-lg px-3 py-2.5 space-y-1.5 pointer-events-none opacity-0 group-hover/fto:opacity-100 transition-opacity duration-150 z-30 shadow-xl">
            {ftoDays === 0 ? (
              <p className="text-white/75">0 FTO days recorded this month. If this is incorrect, please flag to your Sales Ops team.</p>
            ) : adjQuota != null ? (
              <p className="text-white/75">
                <span className="text-white font-semibold">{ftoDays} FTO day{ftoDays !== 1 ? 's' : ''}</span> this month. Adjusted unit target of{' '}
                <span className="text-white font-medium">{adjQuota}</span> used for MPE and accelerator calculations only. Your distributed unit target remains{' '}
                <span className="text-white font-medium">{Math.round(quota)}</span>.
              </p>
            ) : (
              <p className="text-white/75">
                <span className="text-white font-semibold">{ftoDays} FTO day{ftoDays !== 1 ? 's' : ''}</span> this month. FTO-adjusted unit target not tracked separately for this metric.
              </p>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#1E293B]" />
          </div>
        </span>
        <span className="text-sm font-semibold text-[#0F172A]">{label}</span>
      </div>
      <p className="text-sm tabular-nums text-slate-400 font-medium mb-3">
        {formatUnits(actuals)}&nbsp;
        <span className="text-slate-300">/</span>&nbsp;
        {formatUnits(quota)} unit target
      </p>
      <div className="h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct / 1.5}%` }}
        />
      </div>
    </div>
  );
}

export default function AttainmentBars({ repSummary, metrics }: AttainmentBarsProps) {
  const ftoDays = repSummary?.ftoDays ?? 0;

  return (
    <div className="rounded-xl p-7 border-l-4 border-[#4F46E5]" style={{ background: '#F1F3F9' }}>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">
        Attainment
      </p>
      <div className="flex flex-row gap-10">
        {metrics.map((metric) => (
          <AttainmentBar
            key={metric.label}
            label={metric.label}
            actuals={(repSummary?.[metric.actualsKey] as number) ?? 0}
            quota={(repSummary?.[metric.quotaKey] as number) ?? 0}
            attainment={(repSummary?.[metric.attainmentKey] as number) ?? 0}
            ftoAdjustedQuota={metric.ftoQuotaKey ? ((repSummary?.[metric.ftoQuotaKey] as number) ?? undefined) : undefined}
            ftoDays={ftoDays}
          />
        ))}
      </div>
    </div>
  );
}
