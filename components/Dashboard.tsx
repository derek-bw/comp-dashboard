'use client';

import { useState, useEffect, useMemo } from 'react';
import { RepSummary, DealDetail, DemoDetail, SheetData, CalculatorPrefill, MPESummary } from '@/types';
import { fetchSheetData } from '@/lib/sheetsClient';
import { sortMonths, isMonthAfter } from '@/lib/utils';
import { getRoleConfig, isSDR } from '@/lib/roleConfig';
import Header from './Header';
import MetricCards from './MetricCards';
import AttainmentBars from './AttainmentBars';
import DealQualityTiles from './DealQualityTiles';
import BlendedAttainmentCard from './BlendedAttainmentCard';
import YtdCard from './YtdCard';
import MpeSection from './MpeSection';
import ActivationTable from './ActivationTable';
import ClawbacksSection from './ClawbacksSection';
import PipelineSection from './PipelineSection';
import CalculatorModal from './CalculatorModal';
import MultiplierModal from './MultiplierModal';
import ManagerDashboard from './ManagerDashboard';
import ManagerDealTable from './ManagerDealTable';
import DemosHeldTable from './DemosHeldTable';

export default function Dashboard() {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [multiplierModalOpen, setMultiplierModalOpen] = useState(false);
  const [calculatorPrefill, setCalculatorPrefill] = useState<CalculatorPrefill | undefined>();
  /** Whether the user has toggled into manager view */
  const [managerView, setManagerView] = useState(false);

  useEffect(() => {
    fetchSheetData()
      .then((json: SheetData) => {
        setData(json);

        // Default: latest month, first rep alphabetically for that month
        const sorted = sortMonths([...new Set(json.summary.map((r: RepSummary) => r.month))]);
        const latestMonth = sorted[sorted.length - 1] ?? '';
        setSelectedMonth(latestMonth);

        const repsInLatest = [...new Set(
          json.summary
            .filter((r: RepSummary) => r.month === latestMonth)
            .map((r: RepSummary) => r.repName)
        )].sort();
        setSelectedRep(repsInLatest[0] ?? '');

        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // All unique rep names — include manager names from Rep_Manager_Map even if they
  // don't have their own rows in App_Rep_Summary (e.g. "AE Manager 1")
  const uniqueReps = useMemo(() => {
    if (!data) return [];
    const repNames = new Set(data.summary.map((r) => r.repName));
    data.repManagerMap.forEach((r) => {
      if (r.managerName) repNames.add(r.managerName);
    });
    return [...repNames].sort();
  }, [data]);

  // Months available for the selected rep (or manager — fall back to teamSummary months)
  const uniqueMonths = useMemo(() => {
    if (!data || !selectedRep) return [];
    const repMonths = data.summary
      .filter((r) => r.repName === selectedRep)
      .map((r) => r.month);
    if (repMonths.length > 0) return sortMonths([...new Set(repMonths)]);
    // Manager-only: derive months from teamSummary or managerRollup
    const managerMonths = [
      ...data.teamSummary.filter((r) => r.managerName === selectedRep).map((r) => r.month),
      ...data.managerRollup.filter((r) => r.managerName === selectedRep).map((r) => r.month),
    ];
    return sortMonths([...new Set(managerMonths)]);
  }, [data, selectedRep]);

  // When rep changes, ensure selected month is valid for new rep; default managers to team view
  const handleRepChange = (rep: string) => {
    setSelectedRep(rep);
    // Default: managers → team view; non-managers → rep view
    const repIsManager = data?.repManagerMap.some((r) => r.managerName === rep) ?? false;
    setManagerView(repIsManager);
    if (!data) return;
    const months = data.summary
      .filter((r) => r.repName === rep)
      .map((r) => r.month);
    let sorted = sortMonths([...new Set(months)]);
    if (sorted.length === 0) {
      // Manager-only rep: fall back to teamSummary / managerRollup months
      const mgrMonths = [
        ...data.teamSummary.filter((r) => r.managerName === rep).map((r) => r.month),
        ...data.managerRollup.filter((r) => r.managerName === rep).map((r) => r.month),
      ];
      sorted = sortMonths([...new Set(mgrMonths)]);
    }
    if (!sorted.includes(selectedMonth)) {
      setSelectedMonth(sorted[sorted.length - 1] ?? '');
    }
  };

  const repSummary = useMemo<RepSummary | null>(() => {
    if (!data || !selectedRep || !selectedMonth) return null;
    return data.summary.find(
      (r) => r.repName === selectedRep && r.month === selectedMonth
    ) ?? null;
  }, [data, selectedRep, selectedMonth]);

  // Role config
  const roleConfig = useMemo(
    () => getRoleConfig(repSummary?.channelRole),
    [repSummary?.channelRole]
  );

  const repIsSDR = isSDR(repSummary?.channelRole);

  // Deals for the activation table
  const activationDeals = useMemo<DealDetail[]>(() => {
    if (!data || !selectedRep || !selectedMonth) return [];
    return data.deals.filter(
      (d) =>
        d.repName === selectedRep &&
        (
          d.saasObeMonth === selectedMonth ||
          d.billingObeMonth === selectedMonth ||
          (d.clawbackFlag && d.saasCancelMonth === selectedMonth)
        )
    );
  }, [data, selectedRep, selectedMonth]);

  const clawbackDeals = useMemo<DealDetail[]>(() => {
    if (!data || !selectedRep || !selectedMonth) return [];
    return data.deals.filter(
      (d) =>
        d.repName === selectedRep &&
        d.clawbackFlag &&
        d.saasCancelMonth === selectedMonth
    );
  }, [data, selectedRep, selectedMonth]);

  const pipelineDeals = useMemo<DealDetail[]>(() => {
    if (!data || !selectedRep || !selectedMonth) return [];
    return data.deals.filter((d) => {
      if (d.repName !== selectedRep) return false;
      if (d.status === 'In Progress') return true;
      if (d.saasObeMonth && isMonthAfter(d.saasObeMonth, selectedMonth)) return true;
      return false;
    });
  }, [data, selectedRep, selectedMonth]);

  // Metric card computed totals — aligned with deal table footer (conditional by OBE month)
  const saasObePayoutTotal = useMemo(
    () => activationDeals
      .filter((d) => d.saasObeMonth === selectedMonth)
      .reduce((s, d) => s + d.saasObePayout, 0),
    [activationDeals, selectedMonth]
  );
  const billingObePayoutTotal = useMemo(
    () => activationDeals
      .filter((d) => d.billingObeMonth === selectedMonth)
      .reduce((s, d) => s + d.billingObePayout, 0),
    [activationDeals, selectedMonth]
  );
  const clawbackTotal = useMemo(
    () => clawbackDeals.reduce((s, d) => s + d.clawbackAmount, 0),
    [clawbackDeals]
  );

  // MPE data for selected rep + month
  const mpeSummary = useMemo<MPESummary | null>(() => {
    if (!data || !selectedRep || !selectedMonth) return null;
    return data.mpeSummary.find(
      (m) => m.repName === selectedRep && m.month === selectedMonth
    ) ?? null;
  }, [data, selectedRep, selectedMonth]);

  // Demo details for selected rep + month (SDR only, but always compute)
  const repDemoDetails = useMemo<DemoDetail[]>(() => {
    if (!data || !selectedRep || !selectedMonth) return [];
    return data.demoDetails.filter(
      (d) => d.repName === selectedRep && d.demoMonth === selectedMonth
    );
  }, [data, selectedRep, selectedMonth]);

  // Is the selected rep a manager? (appears in repManagerMap as managerName)
  const isManager = useMemo(() => {
    if (!data || !selectedRep) return false;
    const managers = [...new Set(data.repManagerMap.map((r) => r.managerName).filter(Boolean))];
    console.log('[isManager] selectedRep:', selectedRep, '| known managers:', managers);
    return managers.includes(selectedRep);
  }, [data, selectedRep]);

  // A2: Deals for all reps on the manager's team in selected month (must come after isManager)
  const managerTeamDeals = useMemo<DealDetail[]>(() => {
    if (!data || !isManager || !selectedMonth) return [];
    const teamRepNames = new Set(
      data.teamSummary
        .filter((r) => r.managerName === selectedRep && r.month === selectedMonth)
        .map((r) => r.repName)
    );
    return data.deals.filter(
      (d) =>
        teamRepNames.has(d.repName) &&
        (d.saasObeMonth === selectedMonth || d.billingObeMonth === selectedMonth)
    );
  }, [data, isManager, selectedRep, selectedMonth]);

  // Sync manager view: default to team view when a manager is selected; exit when no longer a manager
  useEffect(() => {
    setManagerView(isManager);
  }, [isManager]);

  // Handler when manager clicks a rep in the scorecard — navigate to their rep view
  const handleRepDrillDown = (repName: string) => {
    setManagerView(false);
    handleRepChange(repName);
    // Try to keep same month if available for that rep
    if (data) {
      const months = data.summary.filter((r) => r.repName === repName).map((r) => r.month);
      const sorted = sortMonths([...new Set(months)]);
      if (sorted.includes(selectedMonth)) return;
      setSelectedMonth(sorted[sorted.length - 1] ?? '');
    }
  };

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading commission data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 max-w-md w-full text-center space-y-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-[#0F172A]">Failed to load data</h2>
          <p className="text-sm text-slate-500 break-words">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header
        reps={uniqueReps}
        months={uniqueMonths}
        selectedRep={selectedRep}
        selectedMonth={selectedMonth}
        onRepChange={handleRepChange}
        onMonthChange={setSelectedMonth}
        repSummary={repSummary}
        isManager={isManager}
        managerView={managerView}
        onToggleManagerView={() => setManagerView((v) => !v)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Manager: team overview ─────────────────────────────────────── */}
        {isManager && managerView && (
          <ManagerDashboard
            managerName={selectedRep}
            selectedMonth={selectedMonth}
            teamSummary={data?.teamSummary ?? []}
            managerRollup={data?.managerRollup ?? []}
            mpeSummary={data?.mpeSummary ?? []}
            deals={data?.deals ?? []}
            demoDetails={data?.demoDetails ?? []}
            onRepClick={handleRepDrillDown}
          />
        )}

        {/* ── Manager: rep deal activity (A2) ───────────────────────────── */}
        {isManager && !managerView && (
          <ManagerDealTable
            deals={managerTeamDeals}
            selectedMonth={selectedMonth}
            managerName={selectedRep}
          />
        )}

        {/* ── Individual rep dashboard ───────────────────────────────────── */}
        {!isManager && (
          <>
            {/* ── Attainment bars ──────────────────────────────────────── */}
            <AttainmentBars repSummary={repSummary} metrics={roleConfig.attainmentMetrics} />

            {/* ── SDR: Blended attainment callout ──────────────────────── */}
            {roleConfig.showBlendedAttainment && (
              <BlendedAttainmentCard repSummary={repSummary} />
            )}

            {/* ── Payout metric cards ───────────────────────────────────── */}
            <MetricCards
              repSummary={repSummary}
              cards={roleConfig.payoutCards}
              saasObePayoutTotal={saasObePayoutTotal}
              billingObePayoutTotal={billingObePayoutTotal}
              clawbackTotal={clawbackTotal}
              selectedMonth={selectedMonth}
            />

            {/* ── AE: Deal quality tiles ────────────────────────────────── */}
            {roleConfig.showDealQualityMetrics && (
              <DealQualityTiles repSummary={repSummary} />
            )}

            {/* ── YTD earnings ──────────────────────────────────────────── */}
            <YtdCard
              repSummary={repSummary}
              allSummary={data?.summary ?? []}
              selectedRep={selectedRep}
            />

            {/* ── MPE / Promotion indicator ─────────────────────────────── */}
            <MpeSection mpeSummary={mpeSummary} />

            {/* ── SDR: Demos held detail ────────────────────────────────── */}
            {repIsSDR && (
              <DemosHeldTable
                demos={repDemoDetails}
                selectedMonth={selectedMonth}
                selectedRep={selectedRep}
              />
            )}

            {/* ── AE: OBE deal table ────────────────────────────────────── */}
            {roleConfig.showDealTable && (
              <ActivationTable
                deals={activationDeals}
                columns={roleConfig.dealColumns}
                selectedMonth={selectedMonth}
                selectedRep={selectedRep}
                title={roleConfig.dealTableTitle}
                showCalculator={roleConfig.showCalculator}
                showMultiplierViewer={roleConfig.showMultiplierViewer}
                onOpenCalculator={(prefill) => { setCalculatorPrefill(prefill); setModalOpen(true); }}
                onOpenMultipliers={() => setMultiplierModalOpen(true)}
              />
            )}

            {/* ── Clawbacks ─────────────────────────────────────────────── */}
            <ClawbacksSection deals={clawbackDeals} selectedMonth={selectedMonth} selectedRep={selectedRep} />

            {/* ── AE: Pipeline ──────────────────────────────────────────── */}
            {roleConfig.showPipeline && (
              <PipelineSection deals={pipelineDeals} selectedMonth={selectedMonth} selectedRep={selectedRep} />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {modalOpen && (
        <CalculatorModal
          calculatorConfigs={data?.calculatorConfigs ?? []}
          selectedMonth={selectedMonth}
          prefill={calculatorPrefill}
          onClose={() => { setModalOpen(false); setCalculatorPrefill(undefined); }}
        />
      )}
      {multiplierModalOpen && (
        <MultiplierModal
          calculatorConfigs={data?.calculatorConfigs ?? []}
          selectedMonth={selectedMonth}
          channelRole={repSummary?.channelRole}
          onClose={() => setMultiplierModalOpen(false)}
        />
      )}
    </div>
  );
}
