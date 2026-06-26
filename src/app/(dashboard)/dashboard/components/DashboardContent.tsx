'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import {
  DashboardMetricsGrid,
  DailyBreakdownSection,
  InventorySummaryWidget,
  PeriodComparisonSection,
  FulfillmentShareBar,
} from '@/components/custom/dashboard'
import { DashboardHero } from '@/components/custom/dashboard/DashboardHero'
import { buildDashboardGridProps } from './dashboardGridProps'
import { DashboardPeriodSelector } from '@/components/custom/DashboardPeriodSelector'
import { DashboardStatusBanners } from './DashboardStatusBanners'
import { DashboardStatusStrip } from './DashboardStatusStrip'
import { getDashboardStatusAlerts } from './dashboard-status'
import { PeriodContextLabel } from '@/components/custom/PeriodContextLabel'
import { AdvertisingDashboardWidget } from '@/components/custom/AdvertisingDashboardWidget'
import { WidgetSettingsSheet } from '@/components/custom/dashboard/WidgetSettingsSheet'
import { PersonaSelector } from '@/components/custom/dashboard/PersonaSelector'
import { MarketingKpiCard } from '@/app/(dashboard)/analytics/components/MarketingKpiCard'
import { AnalyticalDisclosure } from './AnalyticalDisclosure'
import { CogsCoverageMetricCard } from '@/components/custom/CogsCoverageMetricCard'
import { useDashboardData } from './useDashboardData'
import { useDataImportNotification } from '@/hooks/useDataImportNotification'
import { canManageOperationalData } from '@/lib/role-permissions'
import { useAuthStore } from '@/stores/authStore'
import { UnitEconomicsSection } from './UnitEconomicsSection'
import { StorageSection } from './StorageSection'
import {
  ExpenseChart,
  ExpenseStructurePieChart,
  TrendGraph,
  OrdersSeasonalPatterns,
  HistoricalTrendsSection,
} from './DashboardLazyCharts'

export function DashboardContent(): React.ReactElement {
  const router = useRouter()
  const d = useDashboardData()
  const userRole = useAuthStore(state => state.user?.role)
  const canAssignCogs = canManageOperationalData(userRole)

  useDataImportNotification(!!d.hasFinancialData, d.isLoading)

  // TaxWarningBanner is session-dismissible via sessionStorage; read once at mount so the
  // status-strip count stays consistent with the banner's own self-gating (mirrors its init).
  const [taxDismissed] = useState(
    () =>
      typeof window !== 'undefined' && sessionStorage.getItem('tax-warning-dismissed') === 'true'
  )
  const status = getDashboardStatusAlerts({
    selectedPeriod: d.selectedPeriod,
    periodType: d.periodType,
    isFinanceAvailable: d.isFinanceAvailable,
    isProcessing: d.isProcessing,
    isFailed: d.isFailed,
    failedBatchCount: d.failedBatchCount,
    hasError: !!d.error,
    taxConfigured: d.taxConfigured,
    taxDismissed,
    productsLoading: d.productsLoading,
    cogsLoading: d.cogsLoading,
    cogsCoverage: d.cogsCoverage,
    totalProducts: d.totalProducts ?? 0,
    inventoryWithCogs: d.inventoryWithCogs,
  })

  // Shared P&L props for the hero (T1) and the detailed grid (T2). TZ-5.
  const gridProps = buildDashboardGridProps(
    d,
    canAssignCogs ? () => router.push(ROUTES.COGS.ROOT) : undefined
  )

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground">Главная страница</h1>
          <PeriodContextLabel
            periodType={d.periodType}
            week={d.selectedWeek}
            month={d.selectedMonth}
            lastRefresh={d.lastRefresh}
          />
        </div>
        <div
          className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end"
          role="region"
          aria-label="Выбор периода"
        >
          <PersonaSelector />
          <DashboardPeriodSelector />
          <WidgetSettingsSheet />
        </div>
      </div>

      {/* T1 — Hero (above the fold): status strip + persona KPIs + canonical COGS indicator */}
      {status.count > 0 && status.highestSeverity && (
        <DashboardStatusStrip count={status.count} severity={status.highestSeverity}>
          <DashboardStatusBanners data={d} canAssignCogs={canAssignCogs} />
        </DashboardStatusStrip>
      )}
      <section aria-labelledby="dashboard-hero-heading" className="space-y-3">
        <h2 id="dashboard-hero-heading" className="sr-only">
          Главные метрики
        </h2>
        <DashboardHero {...gridProps} />
        <CogsCoverageMetricCard
          productsWithCogs={d.inventoryWithCogs}
          totalProducts={d.totalProducts ?? 0}
          coverage={d.cogsCoverage}
          isLoading={d.productsLoading || d.cogsLoading}
          onClick={canAssignCogs ? () => router.push(ROUTES.COGS.ROOT) : undefined}
        />
      </section>

      {/* T2 — Operational: detailed P&L grid + period/daily/inventory/storage/ads */}
      <section aria-labelledby="dashboard-operational-heading" className="space-y-4">
        <h2 id="dashboard-operational-heading" className="sr-only">
          Операционные метрики
        </h2>
        {(d.fboShare > 0 || d.fbsShare > 0) && (
          <FulfillmentShareBar fboShare={d.fboShare} fbsShare={d.fbsShare} />
        )}
        <DashboardMetricsGrid {...gridProps} />
        <PeriodComparisonSection currentWeek={d.selectedWeek} />
        <DailyBreakdownSection className="mt-4" />
        <InventorySummaryWidget />
        <div role="region" aria-label="Хранение">
          <StorageSection selectedWeek={d.selectedWeek} />
        </div>
        <AdvertisingDashboardWidget dateRange={d.dateRange} hideLocalSelector />
        <MarketingKpiCard from={d.dateRange.from} to={d.dateRange.to} />
      </section>

      {/* T3 — Analytical: collapsed + lazy by default (TZ-6). COGS de-dup: InitialDataSummary
          removed; CogsCoverageMetricCard (T1) is the canonical COGS indicator. */}
      <AnalyticalDisclosure>
        <ExpenseChart weekOverride={d.periodType === 'week' ? d.selectedWeek : undefined} />
        {d.periodType === 'week' && <ExpenseStructurePieChart week={d.selectedWeek} />}
        <div role="region" aria-label="Юнит-экономика">
          <UnitEconomicsSection />
        </div>
        <OrdersSeasonalPatterns />
        <TrendGraph />
        <HistoricalTrendsSection currentWeek={d.selectedWeek} />
      </AnalyticalDisclosure>

      {d.advertisingQuery.isLoading && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <RefreshCw className="mr-2 inline-block h-4 w-4 animate-spin" />
          Обновление данных...
        </div>
      )}
    </div>
  )
}
