import { RepSummary } from '@/types';

// ─── Attainment ──────────────────────────────────────────────────────────────

export interface AttainmentMetric {
  /** Label shown above the progress bar */
  label: string;
  /** RepSummary field for actuals (e.g. saasObeActuals) */
  actualsKey: keyof RepSummary;
  /** RepSummary field for quota */
  quotaKey: keyof RepSummary;
  /** RepSummary field for attainment % (already converted to 0–150 scale) */
  attainmentKey: keyof RepSummary;
  /** FTO-adjusted attainment key (optional — shown as secondary indicator) */
  ftoAttainmentKey?: keyof RepSummary;
  /** FTO-adjusted quota key (optional — shown alongside FTO attainment for context) */
  ftoQuotaKey?: keyof RepSummary;
}

// ─── Payout cards ────────────────────────────────────────────────────────────

/**
 * Where does the card's value come from?
 *  saasObePayoutTotal    — sum of saasObePayout from activation deals
 *  billingObePayoutTotal — sum of billingObePayout from activation deals
 *  clawbackTotal         — sum of clawbackAmount from clawback deals (displayed negative)
 *  spiff                 — repSummary.spiff
 *  calculatedNet         — saasObePayoutTotal + billingObePayoutTotal − clawbackTotal + spiff
 *  prePayrollCommission  — repSummary.prePayrollCommission (SDR)
 *  sdrNetPayout          — prePayrollCommission + spiff + saasClawbacks (SDR)
 */
export type PayoutValueKey =
  | 'saasObePayoutTotal'
  | 'billingObePayoutTotal'
  | 'clawbackTotal'
  | 'spiff'
  | 'calculatedNet'
  | 'prePayrollCommission'
  | 'sdrNetPayout';

export interface PayoutCardDef {
  label: string;
  valueKey: PayoutValueKey;
}

// ─── Deal table columns ───────────────────────────────────────────────────────

/**
 * How should this column's cell be rendered?
 *  schoolLink       — school name, hyperlinked to Salesforce; supports BNP badge
 *  conditionalMonth — show value only when it matches selectedMonth, else —
 *  status           — StatusBadge component
 *  currency         — formatCurrency, — if zero
 *  calculatedTotal  — saasObePayout + billingObePayout, — if both zero
 *  text             — plain string, — if empty
 *  termPill         — Annual/Monthly as a colored pill badge
 *  percent          — number formatted as X%
 */
export type DealColumnRender =
  | 'schoolLink'
  | 'conditionalMonth'
  | 'status'
  | 'currency'
  | 'calculatedTotal'
  | 'text'
  | 'termPill'
  | 'percent';

export interface DealColumnDef {
  /** Matches a key on DealDetail (or 'calculatedTotal' for the derived column) */
  key: string;
  label: string;
  render: DealColumnRender;
  align?: 'left' | 'right';
}

// ─── Role config ─────────────────────────────────────────────────────────────

export interface RoleConfig {
  attainmentMetrics: AttainmentMetric[];
  payoutCards: PayoutCardDef[];
  dealColumns: DealColumnDef[];
  /** Show the deal payout calculator (Rapid Response only). */
  showCalculator: boolean;
  /** Show the deal quality metrics row (AE/RR only). */
  showDealQualityMetrics: boolean;
  /** Show the OBE deal table (not shown for SDR). */
  showDealTable: boolean;
  /** Show the pipeline section (not shown for SDR). */
  showPipeline: boolean;
  /** Show blended attainment callout card (SDR only). */
  showBlendedAttainment: boolean;
  /** Show the multiplier viewer button (AE/RR only). */
  showMultiplierViewer: boolean;
  /** Override title for the deal table. Defaults to "SaaS and Billing OBE Detail". */
  dealTableTitle?: string;
}

// ─── Configs per role ─────────────────────────────────────────────────────────

const AE_CONFIG: RoleConfig = {
  showCalculator: true,
  showDealQualityMetrics: true,
  showDealTable: true,
  showPipeline: true,
  showBlendedAttainment: false,
  showMultiplierViewer: true,
  attainmentMetrics: [
    {
      label: 'SaaS OBE',
      actualsKey: 'saasObeActuals',
      quotaKey: 'saasObeQuota',
      attainmentKey: 'saasObeAttainment',
      ftoAttainmentKey: 'saasObeFtoAdjustedAttainment',
      ftoQuotaKey: 'saasObeFtoAdjustedQuota',
    },
    {
      label: 'Billing OBE',
      actualsKey: 'billingObeActuals',
      quotaKey: 'billingObeQuota',
      attainmentKey: 'billingObeAttainment',
      ftoAttainmentKey: 'billingObeFtoAdjustedAttainment',
      ftoQuotaKey: 'billingObeFtoAdjustedQuota',
    },
  ],
  payoutCards: [
    { label: 'SaaS OBE Payout',    valueKey: 'saasObePayoutTotal' },
    { label: 'Billing OBE Payout', valueKey: 'billingObePayoutTotal' },
    { label: 'Clawbacks',          valueKey: 'clawbackTotal' },
    { label: 'SPIFF',              valueKey: 'spiff' },
    { label: 'Net Payout',         valueKey: 'calculatedNet' },
  ],
  dealColumns: [
    { key: 'schoolName',      label: 'School',            render: 'schoolLink' },
    { key: 'mrr',             label: 'MRR',               render: 'currency',          align: 'right' },
    { key: 'annualMonthly',   label: 'Term',              render: 'termPill' },
    { key: 'saasObeMonth',    label: 'SaaS OBE Month',    render: 'conditionalMonth' },
    { key: 'billingObeMonth', label: 'Billing OBE Month', render: 'conditionalMonth' },
    { key: 'status',          label: 'Status',            render: 'status' },
    { key: 'saasObePayout',   label: 'SaaS Payout',       render: 'currency',          align: 'right' },
    { key: 'billingObePayout',label: 'Billing Payout',    render: 'currency',          align: 'right' },
    { key: 'calculatedTotal', label: 'Total Payout',      render: 'calculatedTotal',   align: 'right' },
  ],
};

const RAPID_RESPONSE_CONFIG: RoleConfig = {
  ...AE_CONFIG,
  showCalculator: true,
};

const SDR_CONFIG: RoleConfig = {
  showCalculator: false,
  showDealQualityMetrics: false,
  showDealTable: true,
  showPipeline: false,
  dealTableTitle: 'SaaS OBE Detail',
  showBlendedAttainment: true,
  showMultiplierViewer: false,
  attainmentMetrics: [
    {
      label: 'Demos Held',
      actualsKey: 'demosHeldActuals',
      quotaKey: 'demosHeldQuota',
      attainmentKey: 'demosHeldAttainment',
      ftoAttainmentKey: undefined,
    },
    {
      label: 'SaaS OBE',
      actualsKey: 'saasObeActuals',
      quotaKey: 'saasObeQuota',
      attainmentKey: 'saasObeAttainment',
      ftoAttainmentKey: 'saasObeFtoAdjustedAttainment',
      ftoQuotaKey: 'saasObeFtoAdjustedQuota',
    },
  ],
  payoutCards: [
    { label: 'Commission Payout', valueKey: 'prePayrollCommission' },
    { label: 'SPIFF',             valueKey: 'spiff' },
    { label: 'Net Payout',        valueKey: 'sdrNetPayout' },
  ],
  dealColumns: [
    { key: 'schoolName',    label: 'School',        render: 'schoolLink' },
    { key: 'mrr',          label: 'MRR',            render: 'currency',          align: 'right' },
    { key: 'annualMonthly',label: 'Term',           render: 'termPill' },
    { key: 'saasObeMonth', label: 'SaaS OBE Month', render: 'conditionalMonth' },
    { key: 'status',       label: 'Status',         render: 'status' },
    { key: 'saasObePayout',label: 'SaaS Payout',    render: 'currency',          align: 'right' },
  ],
};

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  AE: AE_CONFIG,
  RAPID_RESPONSE: RAPID_RESPONSE_CONFIG,
  SDR: SDR_CONFIG,
};

const DEFAULT_CONFIG = AE_CONFIG;

/** Maps raw Channel_Role values from the sheet to a config key. */
const ROLE_KEY_MAP: Record<string, string> = {
  AE: 'AE',
  'Account Executive': 'AE',
  'account executive': 'AE',
  'Rapid Response': 'RAPID_RESPONSE',
  'rapid response': 'RAPID_RESPONSE',
  RR: 'RAPID_RESPONSE',
  SDR: 'SDR',
  sdr: 'SDR',
};

export function getRoleConfig(channelRole: string | undefined): RoleConfig {
  if (!channelRole) return DEFAULT_CONFIG;
  const key = ROLE_KEY_MAP[channelRole] ?? channelRole;
  return ROLE_CONFIGS[key] ?? DEFAULT_CONFIG;
}

export function isSDR(channelRole: string | undefined): boolean {
  if (!channelRole) return false;
  const key = ROLE_KEY_MAP[channelRole] ?? channelRole;
  return key === 'SDR';
}

export function isAE(channelRole: string | undefined): boolean {
  if (!channelRole) return false;
  const key = ROLE_KEY_MAP[channelRole] ?? channelRole;
  return key === 'AE' || key === 'RAPID_RESPONSE';
}
