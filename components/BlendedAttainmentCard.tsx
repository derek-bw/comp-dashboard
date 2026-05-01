import { RepSummary } from '@/types';
import { formatPercent } from '@/lib/utils';

interface BlendedAttainmentCardProps {
  repSummary: RepSummary | null;
}

export default function BlendedAttainmentCard({ repSummary }: BlendedAttainmentCardProps) {
  const value = repSummary?.blendedAttainment ?? 0;

  const isGreen = value >= 100;
  const isAmber = value >= 85 && value < 100;
  const valueColor = isGreen ? 'text-[#16A34A]' : isAmber ? 'text-[#D97706]' : 'text-[#DC2626]';
  const bgColor   = isGreen ? 'bg-[#F0FDF4] border-[#BBF7D0]' : isAmber ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-[#FEF2F2] border-[#FECACA]';

  return (
    <div className={`rounded-xl border px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${bgColor}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Blended Attainment</p>
        <p className="text-sm text-slate-500 mt-0.5">50% Demos Held / 50% SaaS OBE</p>
        <p className="text-xs text-slate-400 mt-1 font-medium">This drives your commission payout</p>
      </div>
      <div className="shrink-0">
        {repSummary ? (
          <span className={`text-5xl font-extrabold tabular-nums ${valueColor}`}>
            {formatPercent(value)}
          </span>
        ) : (
          <span className="inline-block h-12 w-28 bg-slate-100 rounded animate-pulse" />
        )}
      </div>
    </div>
  );
}
