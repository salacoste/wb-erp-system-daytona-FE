/**
 * Dashboard Metrics Grid — P&L Narrative Layout
 * 10 cards in 5 sections following CFO/COO logic:
 *
 * Секция 1: ВЫРУЧКА      — Заказы | Продажи
 * Секция 2: РАСХОДЫ WB    — Комиссии WB | Логистика
 * Секция 3: К ПЕРЕЧИСЛЕНИЮ — К перечислению ★ | Хранение и приёмка
 * Секция 4: СЕБЕСТОИМОСТЬ  — Себестоимость | Реклама
 * Секция 5: ПРИБЫЛЬ       — Валовая прибыль ★ | Маржинальность ★
 */

'use client'

import { cn } from '@/lib/utils'
import { DashboardMetricsGridSkeleton } from './DashboardMetricsGridSkeleton'
import { OrdersCard } from './OrdersCard'
import { SalesNetCard } from './SalesNetCard'
import { WbCommissionsCard } from './WbCommissionsCard'
import { LogisticsMetricCard } from './LogisticsMetricCard'
import { PayoutCard } from './PayoutCard'
import { StorageAcceptanceCard } from './StorageAcceptanceCard'
import { CostsCard } from './CostsCard'
import { AdvertisingCard } from './AdvertisingCard'
import { GrossProfitCard } from './GrossProfitCard'
import { MarginCard } from './MarginCard'

// =============================================================================
// Types
// =============================================================================

export interface PreviousPeriodData {
  ordersAmount: number | null
  ordersCount: number | null
  saleGross: number | null
  wbCommissionsTotal: number | null
  logisticsCost: number | null
  payoutTotal: number | null
  storageAcceptanceTotal: number | null
  cogsTotal: number | null
  advertisingSpend: number | null
  grossProfit: number | null
  marginPct: number | null
  // Legacy fields for compatibility
  ordersCogs: number | null
  salesAmount: number | null
  salesCogs: number | null
  storageCost: number | null
  theoreticalProfit: number | null
}

export interface DashboardMetricsGridProps {
  // Секция 1: ВЫРУЧКА
  totalOrders: number | undefined
  saleGross: number | undefined
  wbSalesGross: number | undefined
  wbReturnsGross: number | undefined
  // Секция 2: РАСХОДЫ WB
  commissionSales: number | undefined
  acquiringFee: number | undefined
  loyaltyFee: number | undefined
  penaltiesTotal: number | undefined
  wbCommissionAdj: number | undefined
  wbServicesCost: number | undefined
  logisticsCost: number | undefined
  // Секция 3: К ПЕРЕЧИСЛЕНИЮ
  payoutTotal: number | undefined
  storageCost: number | undefined
  paidAcceptanceCost: number | undefined
  // Секция 4: СЕБЕСТОИМОСТЬ И РЕКЛАМА
  cogsTotal: number | undefined
  cogsCoverage: number
  productsWithCogs: number
  totalProducts: number
  advertisingSpend: number | undefined
  advertisingRoas: number | undefined
  // Секция 5: ПРИБЫЛЬ
  grossProfit: number | undefined
  marginPct: number | undefined
  // Common
  previousPeriodData: PreviousPeriodData | undefined
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
  onAssignCogs?: () => void
  className?: string
}

const sectionGrid = 'grid grid-cols-1 md:grid-cols-2 gap-4'

/**
 * Dashboard Metrics Grid — 5 sections × 2 cards, P&L narrative
 */
export function DashboardMetricsGrid({
  totalOrders,
  saleGross,
  wbSalesGross,
  wbReturnsGross,
  commissionSales,
  acquiringFee,
  loyaltyFee,
  penaltiesTotal,
  wbCommissionAdj,
  wbServicesCost,
  logisticsCost,
  payoutTotal,
  storageCost,
  paidAcceptanceCost,
  cogsTotal,
  cogsCoverage,
  productsWithCogs,
  totalProducts,
  advertisingSpend,
  advertisingRoas,
  grossProfit,
  marginPct,
  previousPeriodData,
  isLoading,
  error,
  onRetry,
  onAssignCogs,
  className,
}: DashboardMetricsGridProps): React.ReactElement {
  if (isLoading) {
    return <DashboardMetricsGridSkeleton className={className} />
  }

  const prev = previousPeriodData

  return (
    <div
      className={cn('space-y-6', className)}
      role="region"
      aria-label="Основные метрики P&L"
      aria-busy={isLoading}
    >
      {/* Секция 1: ВЫРУЧКА */}
      <div className={sectionGrid}>
        <OrdersCard
          totalOrders={totalOrders}
          previousOrders={prev?.ordersCount}
          isLoading={false}
          error={error}
          onRetry={onRetry}
        />
        <SalesNetCard
          saleGross={saleGross}
          wbSalesGross={wbSalesGross}
          wbReturnsGross={wbReturnsGross}
          previousSaleGross={prev?.saleGross}
          isLoading={false}
          error={error}
          onRetry={onRetry}
        />
      </div>

      {/* Секция 2: РАСХОДЫ WB */}
      <div className={sectionGrid}>
        <WbCommissionsCard
          commissionSales={commissionSales}
          acquiringFee={acquiringFee}
          loyaltyFee={loyaltyFee}
          penaltiesTotal={penaltiesTotal}
          wbCommissionAdj={wbCommissionAdj}
          wbServicesCost={wbServicesCost}
          previousTotal={prev?.wbCommissionsTotal}
          saleGross={saleGross}
          isLoading={false}
          error={error}
          onRetry={onRetry}
        />
        <LogisticsMetricCard
          logisticsCost={logisticsCost}
          previousLogisticsCost={prev?.logisticsCost}
          revenueTotal={saleGross}
          isLoading={false}
          error={error}
          onRetry={onRetry}
        />
      </div>

      {/* Секция 3: К ПЕРЕЧИСЛЕНИЮ */}
      <div className={sectionGrid}>
        <PayoutCard
          payoutTotal={payoutTotal}
          previousPayout={prev?.payoutTotal}
          isLoading={false}
          error={error}
          onRetry={onRetry}
        />
        <StorageAcceptanceCard
          storageCost={storageCost}
          paidAcceptanceCost={paidAcceptanceCost}
          previousTotal={prev?.storageAcceptanceTotal}
          saleGross={saleGross}
          isLoading={false}
          error={error}
          onRetry={onRetry}
        />
      </div>

      {/* Секция 4: СЕБЕСТОИМОСТЬ И РЕКЛАМА */}
      <div className={sectionGrid}>
        <CostsCard
          cogsTotal={cogsTotal}
          previousCogs={prev?.cogsTotal}
          cogsCoverage={cogsCoverage}
          productsWithCogs={productsWithCogs}
          totalProducts={totalProducts}
          isLoading={false}
          error={error}
          onRetry={onRetry}
          onAssignCogs={onAssignCogs}
        />
        <AdvertisingCard
          totalSpend={advertisingSpend}
          roas={advertisingRoas}
          previousSpend={prev?.advertisingSpend}
          saleGross={saleGross}
          isLoading={false}
          error={error}
          onRetry={onRetry}
        />
      </div>

      {/* Секция 5: ПРИБЫЛЬ */}
      <div className={sectionGrid}>
        <GrossProfitCard
          grossProfit={grossProfit}
          previousGrossProfit={prev?.grossProfit}
          cogsCoverage={cogsCoverage}
          isLoading={false}
          error={error}
          onRetry={onRetry}
          onAssignCogs={onAssignCogs}
        />
        <MarginCard
          marginPct={marginPct}
          previousMarginPct={prev?.marginPct}
          cogsCoverage={cogsCoverage}
          isLoading={false}
          error={error}
          onRetry={onRetry}
        />
      </div>
    </div>
  )
}

// Re-export for backward compatibility
export interface FinanceSummaryData {
  revenue?: number | null
  logistics_cost?: number | null
  storage_cost?: number | null
  sale_gross_total?: number | null
}
