/**
 * PnLWaterfall Component
 *
 * Comprehensive P&L (Profit & Loss) waterfall for CFO dashboard.
 * Shows complete financial picture with clear formulas and explanations.
 *
 * STRUCTURE (WB Dashboard aligned):
 * 1. Выручка: Продажи (GMV) - Возвраты = Продажи (розница) (100%)
 * 2. Удержания WB: Комиссия + Логистика + Хранение + Штрафы + Эквайринг + Лояльность - Компенсации
 * 3. К перечислению: Продажи (розница) - Удержания WB
 * 4. Валовая прибыль: К перечислению - COGS (только при 100% покрытии)
 * 5. Ключевые метрики: ROI, Прибыль/ед, Продано единиц
 *
 * FORMULA (matches WB Dashboard):
 * payout_total = to_pay_goods - logistics - storage - acceptance - penalties - other_adjustments
 *
 * @see docs/WB-DASHBOARD-METRICS.md
 * @see frontend/docs/request-backend/43-wb-dashboard-data-discrepancy.md
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toCount } from '@/lib/api/normalizer-helpers'
import { RevenueSection } from './RevenueSection'
import { DeductionsSection } from './DeductionsSection'
import { PayoutSection } from './PayoutSection'
import { GrossProfitSection } from './GrossProfitSection'
import { KeyMetricsSection } from './KeyMetricsSection'
import type { PnLWaterfallProps } from './pnl-types'

export function PnLWaterfall({ data, products, className }: PnLWaterfallProps) {
  // Require 100% COGS coverage to show gross profit
  const hasCogs = products.coverage_pct >= 100

  // Calculate percentages of Net Sales (revenue base = 100%)
  const revenueBase = data.sale_gross || 1

  // Percentage calculations for deduction rows
  const commissionPct = data.total_commission_rub
    ? (data.total_commission_rub / revenueBase) * 100
    : null
  const logisticsPct = data.logistics_cost ? (data.logistics_cost / revenueBase) * 100 : null
  const storagePct = data.storage_cost ? (data.storage_cost / revenueBase) * 100 : null
  const acceptancePct = data.paid_acceptance_cost
    ? (data.paid_acceptance_cost / revenueBase) * 100
    : null
  const penaltiesPct = data.penalties ? (data.penalties / revenueBase) * 100 : null
  const acquiringPct = data.acquiring_fee ? (data.acquiring_fee / revenueBase) * 100 : null
  const loyaltyFeePct = data.loyalty_fee ? (data.loyalty_fee / revenueBase) * 100 : null
  const loyaltyCompensationPct = data.loyalty_compensation
    ? (data.loyalty_compensation / revenueBase) * 100
    : null
  const otherAdjustmentsPct = data.other_adjustments
    ? (data.other_adjustments / revenueBase) * 100
    : null

  // NOTE: commission field from margin_fact is NOT used in P&L display
  // because commission_sales portion duplicates total_commission_rub.
  // See comment in DeductionsSection for details.

  // Seller payout from backend (WB Dashboard formula)
  const sellerPayout = data.payout_total || 0

  // Total WB deductions = sale_gross - payout_total
  const totalWBDeductions = revenueBase - sellerPayout

  // SPP Compensation: difference between sum of visible deduction lines and actual total
  // toCount: null = absent line item → 0 for summation (DISPLAY-GUARD, AP#8 count exception)
  const sumOfVisibleDeductions =
    toCount(data.total_commission_rub) +
    toCount(data.logistics_cost) +
    toCount(data.storage_cost) +
    toCount(data.paid_acceptance_cost) +
    toCount(data.penalties) +
    toCount(data.acquiring_fee) +
    toCount(data.loyalty_fee) -
    toCount(data.loyalty_compensation) +
    toCount(data.other_adjustments)

  const sppCompensation = sumOfVisibleDeductions - totalWBDeductions
  const showSppCompensation = Math.abs(sppCompensation) > 1
  const sppCompensationPct =
    showSppCompensation && revenueBase > 0 ? (sppCompensation / revenueBase) * 100 : null

  // Percentage calculations
  const totalDeductionsPct = revenueBase > 0 ? (totalWBDeductions / revenueBase) * 100 : null
  const payoutPct = revenueBase > 0 ? (sellerPayout / revenueBase) * 100 : null
  const cogsPct = data.cogs_total ? (data.cogs_total / revenueBase) * 100 : null

  // Gross Profit = Payout - COGS (only when COGS coverage = 100%)
  const grossProfit = hasCogs ? sellerPayout - (data.cogs_total || 0) : null
  const grossMarginPct =
    grossProfit !== null && sellerPayout ? (grossProfit / sellerPayout) * 100 : null
  const profitToRevenuePct =
    grossProfit !== null && revenueBase ? (grossProfit / revenueBase) * 100 : null

  return (
    <TooltipProvider>
      <Card className={cn('', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            Отчёт о прибылях и убытках (P&L)
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex">
                  <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-md">
                <p className="font-bold mb-2">Как читать этот отчёт</p>
                <div className="text-xs space-y-2">
                  <p>
                    <strong>Водопадная структура:</strong> каждый блок показывает, куда уходят
                    деньги от продаж покупателям до вашей чистой прибыли.
                  </p>
                  <p>
                    <strong>Процент справа:</strong> доля от чистых продаж (Net Sales = 100%).
                    Помогает быстро оценить структуру затрат.
                  </p>
                  <p>
                    <strong>Формулы:</strong> нажмите на иконку калькулятора для просмотра формулы
                    расчёта каждого блока.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>
            Полная финансовая картина за выбранный период. Все суммы соответствуют данным WB
            Dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <RevenueSection data={data} />

          <DeductionsSection
            data={data}
            revenueBase={revenueBase}
            commissionPct={commissionPct}
            logisticsPct={logisticsPct}
            storagePct={storagePct}
            acceptancePct={acceptancePct}
            penaltiesPct={penaltiesPct}
            acquiringPct={acquiringPct}
            loyaltyFeePct={loyaltyFeePct}
            loyaltyCompensationPct={loyaltyCompensationPct}
            otherAdjustmentsPct={otherAdjustmentsPct}
            showSppCompensation={showSppCompensation}
            sppCompensation={sppCompensation}
            sppCompensationPct={sppCompensationPct}
            totalWBDeductions={totalWBDeductions}
            totalDeductionsPct={totalDeductionsPct}
          />

          <PayoutSection
            sellerPayout={sellerPayout}
            totalDeductionsPct={totalDeductionsPct}
            payoutPct={payoutPct}
          />

          <GrossProfitSection
            hasCogs={hasCogs}
            sellerPayout={sellerPayout}
            cogsTotal={data.cogs_total}
            cogsPct={cogsPct}
            grossProfit={grossProfit}
            grossMarginPct={grossMarginPct}
            profitToRevenuePct={profitToRevenuePct}
            products={products}
          />

          <KeyMetricsSection data={data} />
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
