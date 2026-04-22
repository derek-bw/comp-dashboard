import { RepSummary } from '@/types';
import { PayoutCardDef, PayoutValueKey } from '@/lib/roleConfig';
import { formatCurrency, parseMonthToSortable } from '@/lib/utils';

interface MetricCardsProps {
  repSummary: RepSummary | null;
  cards: PayoutCardDef[];
  saasObePayoutTotal: number;
  billingObePayoutTotal: number;
  clawbackTotal: number;
  selectedMonth: string;
}

type PayoutStatus = 'pending' | 'processed';

function getPayoutStatus(selectedMonth: string, finalPayout: number): PayoutStatus {
  const today = new Date();
  const currentSortable = today.getFullYear() * 100 + (today.getMonth() + 1);
  if (parseMonthToSortable(selectedMonth) >= currentSortable) return 'pending';
  return finalPayout > 0 ? 'processed' : 'pending';
}

function StatusPill({ status }: { status: PayoutStatus }) {
  if (status === 'processed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
        Processed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF9C3] text-[#854D0E]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
      Pending
    </span>
  );
}

interface CardProps {
  label: string;
  value: string;
  valueColor?: string;
  sublabel?: string;
  sub?: React.ReactNode;
}

function Card({ label, value, valueColor = 'text-[#0F172A]', sublabel, sub }: CardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col gap-2 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-3xl font-bold tabular-nums leading-none truncate ${valueColor}`}>
        {value}
      </p>
      {sublabel && <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>}
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );
}

/** Resolves a card's numeric value from the available computed inputs. */
function resolveValue(
  valueKey: PayoutValueKey,
  saasObePayoutTotal: number,
  billingObePayoutTotal: number,
  clawbackTotal: number,
  repSummary: RepSummary,
): number {
  const spiff = repSummary.spiff;
  switch (valueKey) {
    case 'saasObePayoutTotal':    return saasObePayoutTotal;
    case 'billingObePayoutTotal': return billingObePayoutTotal;
    case 'clawbackTotal':         return clawbackTotal;
    case 'spiff':                 return spiff;
    case 'calculatedNet':         return saasObePayoutTotal + billingObePayoutTotal - clawbackTotal + spiff;
    case 'prePayrollCommission':  return repSummary.prePayrollCommission;
    case 'sdrNetPayout':          return repSummary.prePayrollCommission + spiff + repSummary.saasClawbacks;
  }
}

export default function MetricCards({
  repSummary,
  cards,
  saasObePayoutTotal,
  billingObePayoutTotal,
  clawbackTotal,
  selectedMonth,
}: MetricCardsProps) {
  if (!repSummary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((_, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-6 animate-pulse">
            <div className="h-3 bg-slate-100 rounded w-24 mb-4" />
            <div className="h-8 bg-slate-100 rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  const payoutStatus = getPayoutStatus(selectedMonth, repSummary.finalPayout);

  return (
    <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))` }}>
      {cards.map((card) => {
        const amount = resolveValue(card.valueKey, saasObePayoutTotal, billingObePayoutTotal, clawbackTotal, repSummary);

        const isClawback  = card.valueKey === 'clawbackTotal';
        const isNet       = card.valueKey === 'calculatedNet' || card.valueKey === 'sdrNetPayout';

        const displayValue = isClawback
          ? (amount !== 0 ? formatCurrency(amount) : '$0')
          : formatCurrency(amount);

        const valueColor = isClawback && amount < 0 ? 'text-[#991B1B]' : 'text-[#0F172A]';

        return (
          <Card
            key={card.label}
            label={card.label}
            value={displayValue}
            valueColor={valueColor}
            sub={isNet ? <StatusPill status={payoutStatus} /> : undefined}
          />
        );
      })}
    </div>
  );
}
