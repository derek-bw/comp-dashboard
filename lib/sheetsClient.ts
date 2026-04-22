/**
 * Client-side Google Sheets fetcher for the static export build.
 * Replaces the server-side /api/sheets route.
 * All parsing logic is identical to app/api/sheets/route.ts in the main app.
 */

import {
  RepSummary,
  DealDetail,
  CalculatorConfig,
  MPESummary,
  TeamSummary,
  ManagerRollup,
  RepManagerMap,
  SheetData,
} from '@/types';

const SHEET_ID = '105n7TBUnMsqaqBulB7u5eEytj-NBb_Jp4H3Fr-s4KpA';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseNum(val: string | undefined): number {
  if (!val || val.trim() === '' || val.trim() === '-' || val.trim() === 'N/A') return 0;
  const cleaned = val.replace(/[$,\s]/g, '');
  if (cleaned.endsWith('%')) return parseFloat(cleaned.slice(0, -1)) || 0;
  return parseFloat(cleaned) || 0;
}

function parseAttainment(val: string | undefined): number {
  if (!val || val.trim() === '') return 0;
  const cleaned = val.replace(/[$,\s]/g, '');
  if (cleaned.endsWith('%')) return parseFloat(cleaned.slice(0, -1)) || 0;
  const n = parseFloat(cleaned);
  if (!isNaN(n) && Math.abs(n) <= 2) return n * 100;
  return n || 0;
}

function parseBool(val: string | undefined): boolean {
  if (!val) return false;
  const v = val.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function parseDecimalPct(val: string | undefined): number {
  if (!val || val.trim() === '' || val.trim() === '-' || val.trim() === 'N/A') return 0;
  const cleaned = val.replace(/[$,\s]/g, '');
  if (cleaned.endsWith('%')) return parseFloat(cleaned.slice(0, -1)) || 0;
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 0;
  if (Math.abs(n) <= 2) return n * 100;
  return n;
}

// ─── Header-map helpers ───────────────────────────────────────────────────────

function makeHeaderMap(headerRow: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.forEach((h, i) => {
    if (h?.trim()) map[h.trim()] = i;
  });
  return map;
}

function col(row: string[], map: Record<string, number>, name: string): string {
  const idx = map[name];
  if (idx === undefined) return '';
  return row[idx]?.trim() ?? '';
}

// ─── Fetch a single tab ───────────────────────────────────────────────────────

async function fetchTab(tabName: string): Promise<string[][]> {
  const range = `${tabName}!A:AZ`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API error ${res.status} for ${tabName}: ${text}`);
  }
  const data = await res.json();
  return data.values ?? [];
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function fetchSheetData(): Promise<SheetData> {
  if (!API_KEY) {
    throw new Error('Missing NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY');
  }

  const [
    summaryRows,
    dealRows,
    calcRows,
    mpeRows,
    teamRows,
    managerRows,
    repManagerRows,
  ] = await Promise.all([
    fetchTab('App_Rep_Summary'),
    fetchTab('App_Deal_Detail'),
    fetchTab('Calculator_Config'),
    fetchTab('App_MPE_Summary'),
    fetchTab('App_Team_Summary'),
    fetchTab('App_Manager_Rollup'),
    fetchTab('Rep_Manager_Map'),
  ]);

  // ── App_Rep_Summary ────────────────────────────────────────────────────────
  const sH = makeHeaderMap(summaryRows[0] ?? []);

  const summary: RepSummary[] = summaryRows
    .slice(1)
    .filter((row) => col(row, sH, 'Month') && col(row, sH, 'Rep_Name'))
    .map((row) => ({
      month:                           col(row, sH, 'Month'),
      repName:                         col(row, sH, 'Rep_Name'),
      repSfdcId:                       col(row, sH, 'Rep_SFDC_ID'),
      repEmail:                        col(row, sH, 'Rep_Email'),
      manager:                         col(row, sH, 'Manager'),
      secondLineManager:               col(row, sH, 'Second_Line_Manager'),
      channelRole:                     col(row, sH, 'Channel_Role'),
      level:                           col(row, sH, 'Level'),
      tenureGroup:                     col(row, sH, 'Tenure_Group'),
      saasObeQuota:                    parseNum(col(row, sH, 'SaaS_OBE_Quota')),
      saasObeActuals:                  parseNum(col(row, sH, 'SaaS_OBE_Actuals')),
      saasObeAttainment:               parseAttainment(col(row, sH, 'SaaS_OBE_Attainment_Pct')),
      billingObeQuota:                 parseNum(col(row, sH, 'Billing_OBE_Quota')),
      billingObeActuals:               parseNum(col(row, sH, 'Billing_OBE_Actuals')),
      billingObeAttainment:            parseAttainment(col(row, sH, 'Billing_OBE_Attainment_Pct')),
      prePayrollCommission:            parseNum(col(row, sH, 'Pre_Payroll_Commission')),
      finalPayout:                     parseNum(col(row, sH, 'Final_Payout')),
      spiff:                           parseNum(col(row, sH, 'SPIFF')),
      saasClawbacks:                   parseNum(col(row, sH, 'SaaS_Clawbacks')),
      billingClawbacks:                parseNum(col(row, sH, 'Billing_Clawbacks') || '0'),
      netPayout:                       parseNum(col(row, sH, 'Net_Payout')),
      ftoDays:                         parseNum(col(row, sH, 'FTO_Days')),
      saasObeFtoAdjustedQuota:         parseNum(col(row, sH, 'SaaS_OBE_FTO_Adjusted_Quota')),
      billingObeFtoAdjustedQuota:      parseNum(col(row, sH, 'Billing_OBE_FTO_Adjusted_Quota')),
      saasObeFtoAdjustedAttainment:    parseAttainment(col(row, sH, 'SaaS_OBE_FTO_Adjusted_Attainment_Pct')),
      billingObeFtoAdjustedAttainment: parseAttainment(col(row, sH, 'Billing_OBE_FTO_Adjusted_Attainment_Pct')),
      demosHeldQuota:                  parseNum(col(row, sH, 'Demos_Held_Quota')),
      demosHeldActuals:                parseNum(col(row, sH, 'Demos_Held_Actuals')),
      demosHeldAttainment:             parseAttainment(col(row, sH, 'Demos_Held_Attainment_Pct')),
      demosHeldWeight:                 parseNum(col(row, sH, 'Demos_Held_Weight')),
      saasObeWeight:                   parseNum(col(row, sH, 'SaaS_OBE_Weight')),
      blendedAttainment:               parseAttainment(col(row, sH, 'Blended_Attainment_Pct')),
      otc:                             parseNum(col(row, sH, 'OTC')),
      avgMrrPerDeal:                   parseNum(col(row, sH, 'Avg_MRR_Per_Deal')),
      avgDiscountPct:                  parseDecimalPct(col(row, sH, 'Avg_Discount_Pct')),
      billingAttachPct:                parseDecimalPct(col(row, sH, 'Billing_Attach_Pct')),
      prepayPct:                       parseDecimalPct(col(row, sH, 'Prepay_Pct')),
      bnpSpiff:                        parseNum(col(row, sH, 'BNP_SPIFF')),
      ytdNetPayout:                    parseNum(col(row, sH, 'YTD_Net_Payout')),
    }));

  // ── App_Deal_Detail ────────────────────────────────────────────────────────
  const dH = makeHeaderMap(dealRows[0] ?? []);

  const deals: DealDetail[] = dealRows
    .slice(1)
    .filter((row) => col(row, dH, 'Rep_Name'))
    .map((row) => ({
      saasObeMonth:            col(row, dH, 'SaaS_OBE_Month'),
      billingObeMonth:         col(row, dH, 'Billing_OBE_Month'),
      saasCancelMonth:         col(row, dH, 'SaaS_Cancel_Month'),
      saasOwnerSfdcId:         col(row, dH, 'SaaS_Owner_SFDC_ID'),
      billingOwnerSfdcId:      col(row, dH, 'Billing_Owner_SFDC_ID'),
      repName:                 col(row, dH, 'Rep_Name'),
      schoolName:              col(row, dH, 'School_Name'),
      saasCwMonth:             col(row, dH, 'SaaS_CW_Month'),
      combinedFunnelId:        col(row, dH, 'Combined_Funnel_ID'),
      status:                  col(row, dH, 'Status'),
      mrr:                     parseNum(col(row, dH, 'MRR')),
      annualMonthly:           col(row, dH, 'Annual_Monthly'),
      discountPct:             parseNum(col(row, dH, 'Discount_Pct')),
      bnpFlag:                 parseBool(col(row, dH, 'BNP_Flag')),
      bnpOpeningDate:          col(row, dH, 'BNP_Opening_Date'),
      bnpSpiffAmount:          parseNum(col(row, dH, 'BNP_SPIFF_Amount')),
      teamLeadMultiplier:      parseNum(col(row, dH, 'Team_Lead_Multiplier')),
      seasonalityMultiplier:   parseNum(col(row, dH, 'Seasonality_Multiplier')),
      annualMonthlyMultiplier: parseNum(col(row, dH, 'Annual_Monthly_Multiplier')),
      saasObePayout:           parseNum(col(row, dH, 'SaaS_OBE_Payout')),
      billingObePayout:        parseNum(col(row, dH, 'Billing_OBE_Payout')),
      totalObePayout:          parseNum(col(row, dH, 'Total_OBE_Payout')),
      clawbackFlag:            parseBool(col(row, dH, 'Clawback_Flag')),
      clawbackAmount:          parseNum(col(row, dH, 'Clawback_Amount')),
      billingClawbackFlag:     parseBool(col(row, dH, 'Billing_Clawback_Flag')),
    }));

  // ── Calculator_Config ──────────────────────────────────────────────────────
  const cH = makeHeaderMap(calcRows[0] ?? []);

  const calculatorConfigs: CalculatorConfig[] = calcRows
    .slice(1)
    .filter((row) => col(row, cH, 'Month') && col(row, cH, 'Team'))
    .map((row) => ({
      month:                 col(row, cH, 'Month'),
      team:                  col(row, cH, 'Team'),
      leadType:              col(row, cH, 'Lead_Type'),
      teamLeadMultiplier:    parseNum(col(row, cH, 'Team_Lead_Multiplier')),
      seasonalityMultiplier: parseNum(col(row, cH, 'Seasonality_Multiplier')),
      billingObeMultiplier:  parseNum(col(row, cH, 'Billing_OBE_Multiplier')),
      annualMultiplier:      parseNum(col(row, cH, 'Annual_Multiplier')),
      monthlyMultiplier:     parseNum(col(row, cH, 'Monthly_Multiplier')),
    }));

  // ── App_MPE_Summary ────────────────────────────────────────────────────────
  const mH = makeHeaderMap(mpeRows[0] ?? []);

  const mpeSummary: MPESummary[] = mpeRows
    .slice(1)
    .filter((row) => col(row, mH, 'Month') && col(row, mH, 'Rep_Name'))
    .map((row) => ({
      month:                   col(row, mH, 'Month'),
      repName:                 col(row, mH, 'Rep_Name'),
      repSfdcId:               col(row, mH, 'Rep_SFDC_ID'),
      manager:                 col(row, mH, 'Manager'),
      channelRole:             col(row, mH, 'Channel_Role'),
      currentLevel:            col(row, mH, 'Current_Level'),
      nextLevel:               col(row, mH, 'Next_Level'),
      salesStartDate:          col(row, mH, 'Sales_Start_Date'),
      lastPromotionDate:       col(row, mH, 'Last_Promotion_Date'),
      monthsInRole:            parseNum(col(row, mH, 'Months_In_Role')),
      m1Attainment:            parseAttainment(col(row, mH, 'M1_Attainment')),
      m2Attainment:            parseAttainment(col(row, mH, 'M2_Attainment')),
      m3Attainment:            parseAttainment(col(row, mH, 'M3_Attainment')),
      m4Attainment:            parseAttainment(col(row, mH, 'M4_Attainment')),
      m5Attainment:            parseAttainment(col(row, mH, 'M5_Attainment')),
      m6Attainment:            parseAttainment(col(row, mH, 'M6_Attainment')),
      l3mAvg:                  parseAttainment(col(row, mH, 'L3M_Avg')),
      l6mAvg:                  parseAttainment(col(row, mH, 'L6M_Avg')),
      performanceFloor:        parseNum(col(row, mH, 'Performance_Floor')),
      belowFloorFlag:          parseNum(col(row, mH, 'Below_Floor_Flag')),
      pacingToEom:             parseAttainment(col(row, mH, 'Pacing_To_EOM')),
      monthsOver100L6m:        parseNum(col(row, mH, 'Months_Over_100_L6M')),
      l6mAvgOver120Flag:       parseNum(col(row, mH, 'L6M_Avg_Over_120_Flag')),
      overRampedThreshold:     col(row, mH, 'Over_Ramped_Threshold'),
      promotionEligible:       col(row, mH, 'Promotion_Eligible'),
      monthsToPromoteEstimate: parseNum(col(row, mH, 'Months_To_Promote_Estimate')),
    }));

  // ── App_Team_Summary ───────────────────────────────────────────────────────
  const tH = makeHeaderMap(teamRows[0] ?? []);

  const teamSummary: TeamSummary[] = teamRows
    .slice(1)
    .filter((row) => col(row, tH, 'Month') && col(row, tH, 'Rep_Name'))
    .map((row) => ({
      month:                           col(row, tH, 'Month'),
      managerName:                     col(row, tH, 'Manager'),
      repName:                         col(row, tH, 'Rep_Name'),
      channelRole:                     col(row, tH, 'Channel_Role'),
      saasObeQuota:                    parseNum(col(row, tH, 'SaaS_OBE_Quota')),
      billingObeQuota:                 parseNum(col(row, tH, 'Billing_OBE_Quota')),
      saasObeAttainment:               parseAttainment(col(row, tH, 'SaaS_OBE_Attainment_Pct')),
      billingObeAttainment:            parseAttainment(col(row, tH, 'Billing_OBE_Attainment_Pct')),
      blendedAttainment:               parseAttainment(col(row, tH, 'Blended_Attainment_Pct')),
      netPayout:                       parseNum(col(row, tH, 'Net_Payout')),
      saasClawbacks:                   parseNum(col(row, tH, 'SaaS_Clawbacks')),
      ytdNetPayout:                    parseNum(col(row, tH, 'YTD_Net_Payout')),
      ftoDays:                         parseNum(col(row, tH, 'FTO_Days')),
      saasObeFtoAdjustedQuota:         parseNum(col(row, tH, 'SaaS_OBE_FTO_Adjusted_Quota')),
      billingObeFtoAdjustedQuota:      parseNum(col(row, tH, 'Billing_OBE_FTO_Adjusted_Quota')),
      saasObeFtoAdjustedAttainment:    parseAttainment(col(row, tH, 'SaaS_OBE_FTO_Adjusted_Attainment_Pct')),
      billingObeFtoAdjustedAttainment: parseAttainment(col(row, tH, 'Billing_OBE_FTO_Adjusted_Attainment_Pct')),
    }));

  // ── App_Manager_Rollup ─────────────────────────────────────────────────────
  const mrH = makeHeaderMap(managerRows[0] ?? []);

  const managerRollup: ManagerRollup[] = managerRows
    .slice(1)
    .filter((row) => col(row, mrH, 'Month') && col(row, mrH, 'Manager_Name'))
    .map((row) => ({
      month:                 col(row, mrH, 'Month'),
      managerName:           col(row, mrH, 'Manager_Name'),
      secondLineManager:     col(row, mrH, 'Second_Line_Manager'),
      team:                  col(row, mrH, 'Team'),
      channelRole:           col(row, mrH, 'Channel_Role'),
      repsOnTeam:            parseNum(col(row, mrH, 'Reps_On_Team')),
      teamSaasObeQuota:      parseNum(col(row, mrH, 'Team_SaaS_OBE_Quota')),
      teamSaasObeActuals:    parseNum(col(row, mrH, 'Team_SaaS_OBE_Actuals')),
      teamBillingObeQuota:   parseNum(col(row, mrH, 'Team_Billing_OBE_Quota')),
      teamBillingObeActuals: parseNum(col(row, mrH, 'Team_Billing_OBE_Actuals')),
      teamDemosHeldQuota:    parseNum(col(row, mrH, 'Team_Demos_Held_Quota')),
      teamDemosHeldActuals:  parseNum(col(row, mrH, 'Team_Demos_Held_Actuals')),
      teamNetPayout:         parseNum(col(row, mrH, 'Team_Net_Payout')),
      teamClawbackExposure:  parseNum(col(row, mrH, 'Team_Clawback_Exposure')),
      teamAvgAttainmentPct:  parseAttainment(col(row, mrH, 'Team_Avg_Attainment_Pct')),
      teamAvgMrrPerDeal:     parseNum(col(row, mrH, 'Team_Avg_MRR_Per_Deal')),
      teamBillingAttachPct:  parseNum(col(row, mrH, 'Team_Billing_Attach_Pct')),
      teamPrepayPct:         parseNum(col(row, mrH, 'Team_Prepay_Pct')),
      teamAvgDiscountPct:    parseNum(col(row, mrH, 'Team_Avg_Discount_Pct')),
    }));

  // ── Rep_Manager_Map ────────────────────────────────────────────────────────
  const rmH = makeHeaderMap(repManagerRows[0] ?? []);

  const repManagerMap: RepManagerMap[] = repManagerRows
    .slice(1)
    .filter((row) => col(row, rmH, 'Rep_Name'))
    .map((row) => ({
      repName:     col(row, rmH, 'Rep_Name'),
      managerName: col(row, rmH, 'Manager_Name') || col(row, rmH, 'Manager'),
    }));

  return {
    summary,
    deals,
    calculatorConfigs,
    mpeSummary,
    teamSummary,
    managerRollup,
    repManagerMap,
  };
}
