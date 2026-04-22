import { RepSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DealQualityTilesProps {
  repSummary: RepSummary | null;
}

interface TileProps {
  label: string;
  value: string;
}

function Tile({ label, value }: TileProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg px-5 py-4 flex flex-col gap-1 min-w-0">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-[#334155]">{value}</p>
    </div>
  );
}

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function DealQualityTiles({ repSummary }: DealQualityTilesProps) {
  if (!repSummary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-lg px-5 py-4 animate-pulse">
            <div className="h-2.5 bg-slate-100 rounded w-20 mb-3" />
            <div className="h-6 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Tile label="Avg MRR / Deal"  value={formatCurrency(repSummary.avgMrrPerDeal)} />
      <Tile label="Avg Discount"    value={fmtPct(repSummary.avgDiscountPct)} />
      <Tile label="Billing Attach"  value={fmtPct(repSummary.billingAttachPct)} />
      <Tile label="Annual Prepay"   value={fmtPct(repSummary.prepayPct)} />
    </div>
  );
}
