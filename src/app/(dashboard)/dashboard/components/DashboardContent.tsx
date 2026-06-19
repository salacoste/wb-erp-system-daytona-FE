'use client'

import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import {
  DashboardMetricsGrid,
  DailyBreakdownSection,
  IncompleteWeekBanner,
  TaxWarningBanner,
  InventorySummaryWidget,
  PeriodComparisonSection,
  FulfillmentShareBar,
} from '@/components/custom/dashboard'
import { DashboardPeriodSelector } from '@/components/custom/DashboardPeriodSelector'
import { ReportPendingBanner } from './ReportPendingBanner'
import { PeriodContextLabel } from '@/components/custom/PeriodContextLabel'
import { AdvertisingDashboardWidget } from '@/components/custom/AdvertisingDashboardWidget'
import { WidgetSettingsSheet } from '@/components/custom/dashboard/WidgetSettingsSheet'
import { MarketingKpiCard } from '@/app/(dashboard)/analytics/components/MarketingKpiCard'
import { InitialDataSummary } from '@/components/custom/InitialDataSummary'
import { ProcessingAlert, FailedAlert, ErrorAlert, DataGapsAlert } from './DashboardAlerts'
import { MissingCogsAlert } from '@/components/custom/MissingCogsAlert'
import { CogsCoverageMetricCard } from '@/components/custom/CogsCoverageMetricCard'
import { useDashboardData } from './useDashboardData'
import { useDataImportNotification } from '@/hooks/useDataImportNotification'
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

  useDataImportNotification(!!d.hasFinancialData, d.isLoading)

  return (
    <div className="space-y-4 pb-8">
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
          <DashboardPeriodSelector />
          <WidgetSettingsSheet />
        </div>
      </div>

      <IncompleteWeekBanner period={d.selectedPeriod} periodType={d.periodType} />
      {!d.isFinanceAvailable && !d.isProcessing && (
        <ReportPendingBanner week={d.selectedWeek} latestAvailableWeek={d.latestAvailableWeek} />
      )}
      {d.isProcessing && <ProcessingAlert processingStatus={d.processingStatus} />}
      {d.isFailed && <FailedAlert />}
      {!d.isFailed && d.failedBatchCount > 0 && <DataGapsAlert failedCount={d.failedBatchCount} />}
      {d.error && !d.isProcessing && d.isFinanceAvailable && <ErrorAlert onRetry={d.handleRetry} />}

      <TaxWarningBanner taxConfigured={d.taxConfigured} />

      {!d.productsLoading && !d.cogsLoading && d.cogsCoverage < 100 && (
        <MissingCogsAlert missingCount={(d.totalProducts ?? 0) - d.inventoryWithCogs} />
      )}

      <div role="region" aria-label="Ключевые метрики">
        <DashboardMetricsGrid
          totalOrders={d.fSummary?.total.ordersCount}
          ordersRevenue={d.fSummary?.total.ordersRevenue}
          ordersRevenueDiscounted={d.fSummary?.total.ordersRevenueDiscounted}
          salesCount={d.salesCount}
          returnsCount={d.returnsCount}
          saleGross={d.summary?.sale_gross_total}
          wbSalesGross={d.summary?.wb_sales_gross_total}
          wbReturnsGross={d.summary?.wb_returns_gross_total}
          commissionSales={d.summary?.commission_sales_total}
          acquiringFee={d.summary?.acquiring_fee_total}
          loyaltyFee={d.summary?.loyalty_fee_total}
          penaltiesTotal={d.summary?.penalties_total}
          wbCommissionAdj={d.summary?.wb_commission_adj_total}
          logisticsCost={d.summary?.logistics_cost_total}
          logisticsBreakdown={d.logisticsBreakdown}
          payoutTotal={d.summary?.payout_total}
          storageCost={d.summary?.storage_cost_total}
          paidAcceptanceCost={d.summary?.paid_acceptance_cost_total}
          cogsTotal={d.summary?.cogs_total ?? undefined}
          cogsCoverage={d.cogsCoverage}
          productsWithCogs={d.inventoryWithCogs}
          totalProducts={d.totalProducts ?? 0}
          advertisingSpend={d.advertisingQuery.current?.summary?.total_spend}
          advertisingRoas={d.advertisingQuery.current?.summary?.overall_roas}
          wbPromotionCost={d.summary?.wb_promotion_cost_total ?? undefined}
          wbJamCost={d.summary?.wb_jam_cost_total ?? undefined}
          wbOtherServicesCost={d.summary?.wb_other_services_cost_total ?? undefined}
          grossProfit={d.summary?.gross_profit ?? undefined}
          marginPct={d.summary?.margin_pct ?? undefined}
          grossProfitAnalytical={d.summary?.gross_profit_analytical ?? undefined}
          operatingProfitAnalytical={d.summary?.operating_profit_analytical ?? undefined}
          operatingMarginPct={d.summary?.operating_margin_pct ?? undefined}
          grossMarginPct={d.summary?.gross_margin_pct ?? undefined}
          taxMetrics={d.effectiveTaxMetrics ?? null}
          previousPeriodData={d.previousPeriodData}
          isLoading={d.isLoading}
          error={d.error}
          onRetry={d.handleRetry}
          onAssignCogs={() => router.push(ROUTES.COGS.ROOT)}
        />
      </div>
      {(d.fboShare > 0 || d.fbsShare > 0) && (
        <FulfillmentShareBar fboShare={d.fboShare} fbsShare={d.fbsShare} />
      )}
      <CogsCoverageMetricCard
        productsWithCogs={d.inventoryWithCogs}
        totalProducts={d.totalProducts ?? 0}
        coverage={d.cogsCoverage}
        isLoading={d.productsLoading || d.cogsLoading}
        onClick={() => router.push(ROUTES.COGS.ROOT)}
      />
      <PeriodComparisonSection currentWeek={d.selectedWeek} />
      <DailyBreakdownSection className="mt-4" />
      <InventorySummaryWidget />
      <div role="region" aria-label="Хранение">
        <StorageSection selectedWeek={d.selectedWeek} />
      </div>
      <AdvertisingDashboardWidget dateRange={d.dateRange} hideLocalSelector />
      <MarketingKpiCard from={d.dateRange.from} to={d.dateRange.to} />
      <ExpenseChart weekOverride={d.periodType === 'week' ? d.selectedWeek : undefined} />
      {d.periodType === 'week' && <ExpenseStructurePieChart week={d.selectedWeek} />}
      <div role="region" aria-label="Юнит-экономика">
        <UnitEconomicsSection />
      </div>
      {d.advertisingQuery.isLoading && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <RefreshCw className="mr-2 inline-block h-4 w-4 animate-spin" />
          Обновление данных...
        </div>
      )}
      <OrdersSeasonalPatterns />
      <TrendGraph />
      <HistoricalTrendsSection currentWeek={d.selectedWeek} />
      <InitialDataSummary
        cogsCoverage={d.cogsCoverage}
        totalProducts={d.totalProducts ?? 0}
        productsWithCogs={d.inventoryWithCogs}
      />
    </div>
  )
}
