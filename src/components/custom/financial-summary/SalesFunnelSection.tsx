/**
 * Sales Funnel Section - Request #02: Money flow visualization
 * Shows the journey from RRP to profit
 */

import type { FinanceSummary } from '@/hooks/useDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from './financial-summary-formatters'
import { formatPercentage, formatPercentageInt } from '@/lib/utils'
import { FunnelLevel, FunnelArrow, FunnelProfitLevel } from './FunnelParts'

interface SalesFunnelSectionProps {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}

export function SalesFunnelSection({
  summary,
  comparisonSummary,
  isComparison,
}: SalesFunnelSectionProps) {
  // Only show when a retail-price base is available (Request #58). retail_price_total_combined is
  // the field the backend emits at summary_total scope (the default view); retail_price_total is
  // the per-region (rus/eaeu) name. The legacy retail_price_total_total is a ghost field (always
  // undefined) kept only as a defensive fallback. Reading combined FIRST fixes the funnel card
  // being hidden on the default summary_total view (verified vs backend finance-mapping.service.ts:271).
  if (!(
    summary.retail_price_total_combined ||
    summary.retail_price_total_total ||
    summary.retail_price_total
  )) {
    return null
  }

  const retailPrice =
    summary.retail_price_total_combined ??
    summary.retail_price_total_total ??
    summary.retail_price_total ??
    0
  const salesGross = summary.sales_gross_total ?? summary.sales_gross ?? 0
  const saleGross = summary.sale_gross_total ?? summary.sale_gross ?? 0
  const payoutTotal = summary.payout_total ?? 0
  const grossProfit = summary.gross_profit ?? null

  const wbDiscount = retailPrice - salesGross
  const wbDiscountPct = retailPrice > 0 ? (wbDiscount / retailPrice) * 100 : 0

  const returnsGross = summary.returns_gross_total ?? summary.returns_gross ?? 0
  const returnsPct = salesGross > 0 ? (returnsGross / salesGross) * 100 : 0

  const wbDeductions = saleGross - payoutTotal
  const wbDeductionsPct = saleGross > 0 ? (wbDeductions / saleGross) * 100 : 0

  const compRetailPrice =
    comparisonSummary?.retail_price_total_combined ??
    comparisonSummary?.retail_price_total_total ??
    comparisonSummary?.retail_price_total ??
    0
  const compSalesGross = comparisonSummary?.sales_gross_total ?? comparisonSummary?.sales_gross ?? 0
  const compSaleGross = comparisonSummary?.sale_gross_total ?? comparisonSummary?.sale_gross ?? 0

  // Russian locale: "85 %" (NBSP + space), not dot-locale "85%". formatPercentageInt takes 0-100.
  const pctOf = (v: number) =>
    retailPrice > 0 ? formatPercentageInt((v / retailPrice) * 100) : formatPercentageInt(0)

  return (
    <Card className="border-2 border-indigo-300">
      <CardHeader className="bg-indigo-50">
        <CardTitle className="text-indigo-900">{'💰 Воронка продаж'}</CardTitle>
        <CardDescription className="text-indigo-700">
          Путь денег от вашей цены до прибыли
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <FunnelLevel
            title="РРЦ (каталог)"
            subtitle="Ваша цена в каталоге WB"
            value={retailPrice}
            pctLabel="100 %"
            colorScheme="indigo"
            comparisonValue={isComparison && compRetailPrice > 0 ? compRetailPrice : undefined}
          />
          <FunnelArrow
            text={`Ваша скидка: \u2212${formatCurrency(wbDiscount)} (${formatPercentage(wbDiscountPct, 1)})`}
            colorClass="text-orange-600"
          />
          <FunnelLevel
            title="Цена на карточке"
            subtitle="База для комиссии WB"
            value={salesGross}
            pctLabel={`${pctOf(salesGross)} от РРЦ`}
            colorScheme="blue"
            comparisonValue={isComparison && compSalesGross > 0 ? compSalesGross : undefined}
          />
          {returnsGross > 0 && (
            <FunnelArrow
              text={`Возвраты: \u2212${formatCurrency(returnsGross)} (${formatPercentage(returnsPct, 1)})`}
              colorClass="text-red-600"
            />
          )}
          <FunnelLevel
            title="Выкупы (нетто)"
            subtitle="Выкупы \u2212 Возвраты"
            value={saleGross}
            pctLabel={`${pctOf(saleGross)} от РРЦ`}
            colorScheme="cyan"
            comparisonValue={isComparison && compSaleGross > 0 ? compSaleGross : undefined}
          />
          <FunnelArrow
            text={`Удержания WB: \u2212${formatCurrency(wbDeductions)} (${formatPercentage(wbDeductionsPct, 1)} от оборота)`}
            colorClass="text-gray-600"
          />
          <FunnelLevel
            title="На счёт"
            subtitle="К перечислению от WB"
            value={payoutTotal}
            pctLabel={`${pctOf(payoutTotal)} от вашей цены`}
            colorScheme="green"
            comparisonValue={
              isComparison && comparisonSummary?.payout_total
                ? comparisonSummary.payout_total
                : undefined
            }
          />
          {grossProfit !== null && (
            <FunnelProfitLevel
              summary={summary}
              comparisonSummary={comparisonSummary}
              isComparison={isComparison}
              grossProfit={grossProfit}
              payoutTotal={payoutTotal}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
