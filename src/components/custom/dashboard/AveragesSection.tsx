/**
 * AveragesSection — Section with 4 average metric cards (Story 65.2)
 * Renders "Средние показатели" heading + 4 mini-cards:
 *   1. avgPriceBeforeDiscount = ordersRevenue / ordersCount
 *   2. avgSalePrice = saleGross / salesCount
 *   3. avgLogisticsPerUnit = logisticsCost / salesCount
 *   4. avgProfitPerUnit = grossProfit / salesCount (only when COGS filled)
 *
 * Guards: salesCount=0 or undefined -> "---" for sale-based metrics.
 *         ordersCount=0 -> "---" for avgPriceBeforeDiscount.
 *         grossProfit=null -> "---" + hint "Заполните COGS".
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md
 */

'use client'

import { AverageMetricCard } from './AverageMetricCard'

export interface AveragesSectionProps {
  ordersRevenue: number | null | undefined
  ordersCount: number | null | undefined
  saleGross: number | null | undefined
  salesCount: number | null | undefined
  logisticsCost: number | null | undefined
  grossProfit: number | null | undefined
  /** Previous period values for comparison */
  previousOrdersRevenue?: number | null
  previousOrdersCount?: number | null
  previousSaleGross?: number | null
  previousSalesCount?: number | null
  previousLogisticsCost?: number | null
  previousGrossProfit?: number | null
  isLoading: boolean
  className?: string
}

/** Safe division: returns null when divisor is 0, null, or undefined */
function safeDivide(
  numerator: number | null | undefined,
  denominator: number | null | undefined
): number | null {
  if (numerator == null || denominator == null || denominator === 0) {
    return null
  }
  return numerator / denominator
}

/**
 * Renders 4 average metric mini-cards in a "Средние показатели" section.
 */
export function AveragesSection(props: AveragesSectionProps) {
  const {
    ordersRevenue,
    ordersCount,
    saleGross,
    salesCount,
    logisticsCost,
    grossProfit,
    previousOrdersRevenue,
    previousOrdersCount,
    previousSaleGross,
    previousSalesCount,
    previousLogisticsCost,
    previousGrossProfit,
    isLoading,
  } = props

  // Compute current averages with division-by-zero guards
  const avgPriceBeforeDiscount = safeDivide(ordersRevenue, ordersCount)
  const avgSalePrice = safeDivide(saleGross, salesCount)
  const avgLogistics = safeDivide(logisticsCost, salesCount)

  // avgProfitPerUnit: only when grossProfit is not null
  const avgProfit = grossProfit != null ? safeDivide(grossProfit, salesCount) : null

  // Compute previous period averages for comparison
  const prevAvgPrice = safeDivide(previousOrdersRevenue, previousOrdersCount)
  const prevAvgSale = safeDivide(previousSaleGross, previousSalesCount)
  const prevAvgLogistics = safeDivide(previousLogisticsCost, previousSalesCount)
  const prevAvgProfit =
    previousGrossProfit != null ? safeDivide(previousGrossProfit, previousSalesCount) : null

  // Determine hint for profit card when COGS is missing
  const profitHint = grossProfit == null ? 'Заполните COGS' : undefined

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Средние показатели</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AverageMetricCard
          title="Средняя цена до скидок"
          value={avgPriceBeforeDiscount}
          previousValue={prevAvgPrice}
          isLoading={isLoading}
        />
        <AverageMetricCard
          title="Средняя цена продажи"
          value={avgSalePrice}
          previousValue={prevAvgSale}
          isLoading={isLoading}
        />
        <AverageMetricCard
          title="Средняя стоимость логистики"
          value={avgLogistics}
          previousValue={prevAvgLogistics}
          isLoading={isLoading}
        />
        <AverageMetricCard
          title="Средняя прибыль/шт"
          value={avgProfit}
          previousValue={prevAvgProfit}
          colorBySign={true}
          hint={profitHint}
          isLoading={isLoading}
        />
      </div>
    </section>
  )
}
