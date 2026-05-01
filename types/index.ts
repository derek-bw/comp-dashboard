export interface RepSummary {
  // Core identity (cols A–I)
  month: string;
  repName: string;
  repSfdcId: string;
  repEmail: string;
  manager: string;
  secondLineManager: string;
  channelRole: string;
  level: string;
  tenureGroup: string;
  // SaaS OBE (cols J–L)
  saasObeQuota: number;
  saasObeActuals: number;
  saasObeAttainment: number;
  // Billing OBE (cols M–O)
  billingObeQuota: number;
  billingObeActuals: number;
  billingObeAttainment: number;
  // Payouts (cols P–R)
  prePayrollCommission: number;
  finalPayout: number;
  spiff: number;
  saasClawbacks: number;
  billingClawbacks: number;
  netPayout: number;
  // FTO
  ftoDays: number;
  saasObeFtoAdjustedQuota: number;
  billingObeFtoAdjustedQuota: number;
  saasObeFtoAdjustedAttainment: number;
  billingObeFtoAdjustedAttainment: number;
  // SDR-only
  demosHeldQuota: number;
  demosHeldActuals: number;
  demosHeldAttainment: number;
  demosHeldWeight: number;
  saasObeWeight: number;
  blendedAttainment: number;
  // AE-only deal quality
  otc: number;
  avgMrrPerDeal: number;
  avgDiscountPct: number;
  billingAttachPct: number;
  prepayPct: number;
  // Other
  bnpSpiff: number;
  ytdNetPayout: number;
}

export interface DealDetail {
  // Original cols A–P
  saasObeMonth: string;
  billingObeMonth: string;
  saasCancelMonth: string;
  saasOwnerSfdcId: string;
  billingOwnerSfdcId: string;
  repName: string;
  schoolName: string;
  saasCwMonth: string;
  combinedFunnelId: string;
  status: string;
  saasObePayout: number;
  billingObePayout: number;
  totalObePayout: number;
  clawbackFlag: boolean;
  clawbackAmount: number;
  billingClawbackFlag: boolean;
  // New cols
  mrr: number;
  annualMonthly: string;
  discountPct: number;
  bnpFlag: boolean;
  bnpOpeningDate: string;
  bnpSpiffAmount: number;
  teamLeadMultiplier: number;
  seasonalityMultiplier: number;
  annualMonthlyMultiplier: number;
}

/** One row from Calculator_Config tab — multipliers keyed by month + team + lead type. */
export interface CalculatorConfig {
  month: string;
  team: string;
  leadType: string;
  teamLeadMultiplier: number;
  seasonalityMultiplier: number;
  billingObeMultiplier: number;
  annualMultiplier: number;
  monthlyMultiplier: number;
}

export interface MPESummary {
  month: string;
  repName: string;
  repSfdcId: string;
  manager: string;
  channelRole: string;
  currentLevel: string;
  nextLevel: string;
  salesStartDate: string;
  lastPromotionDate: string;
  monthsInRole: number;
  m1Attainment: number;
  m2Attainment: number;
  m3Attainment: number;
  m4Attainment: number;
  m5Attainment: number;
  m6Attainment: number;
  l3mAvg: number;
  l6mAvg: number;
  performanceFloor: number;
  belowFloorFlag: number;
  pacingToEom: number;
  monthsOver100L6m: number;
  l6mAvgOver120Flag: number;
  overRampedThreshold: string;
  promotionEligible: string;
  monthsToPromoteEstimate: number;
}

export interface TeamSummary {
  month: string;
  managerName: string;
  repName: string;
  channelRole: string;
  saasObeQuota: number;
  billingObeQuota: number;
  saasObeAttainment: number;
  billingObeAttainment: number;
  blendedAttainment: number;
  netPayout: number;
  saasClawbacks: number;
  ytdNetPayout: number;
  // FTO fields
  ftoDays: number;
  saasObeFtoAdjustedQuota: number;
  billingObeFtoAdjustedQuota: number;
  saasObeFtoAdjustedAttainment: number;
  billingObeFtoAdjustedAttainment: number;
}

export interface ManagerRollup {
  month: string;
  managerName: string;
  secondLineManager: string;
  team: string;
  channelRole: string;
  repsOnTeam: number;
  teamSaasObeQuota: number;
  teamSaasObeActuals: number;
  teamBillingObeQuota: number;
  teamBillingObeActuals: number;
  teamDemosHeldQuota: number;
  teamDemosHeldActuals: number;
  teamNetPayout: number;
  teamClawbackExposure: number;
  teamAvgAttainmentPct: number;
  teamAvgMrrPerDeal: number;
  teamBillingAttachPct: number;
  teamPrepayPct: number;
  teamAvgDiscountPct: number;
}

export interface RepManagerMap {
  repName: string;
  managerName: string;
}

/** Data passed to the calculator modal. */
export interface CalculatorPrefill {
  schoolName?: string;
  mrr?: number;
  leadType?: string;
  isAnnual?: boolean;
  billingObe?: boolean;
}

export interface DemoDetail {
  demoMonth: string;
  repName: string;
  repSfdcId: string;
  schoolName: string;
  demoDate: string;
  demoOutcome: 'Held' | 'No Show' | 'Rescheduled';
  convertedToObe: boolean;
  saasObeMonth: string;
  notes: string;
}

export interface SheetData {
  summary: RepSummary[];
  deals: DealDetail[];
  calculatorConfigs: CalculatorConfig[];
  mpeSummary: MPESummary[];
  teamSummary: TeamSummary[];
  managerRollup: ManagerRollup[];
  repManagerMap: RepManagerMap[];
  demoDetails: DemoDetail[];
}
