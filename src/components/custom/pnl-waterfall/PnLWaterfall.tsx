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
import { RevenueSection } from './RevenueSection'
import { DeductionsSection } from './DeductionsSection'
import { PayoutSection } from './PayoutSection'
import { GrossProfitSection } from './GrossProfitSection'
import { KeyMetricsSection } from './KeyMetricsSection'
import { calculatePnL } from './usePnLCalculations'
import type { PnLWaterfallProps } from './pnl-types'

export function PnLWaterfall({ data, products, className }: PnLWaterfallProps) {
  const calc = calculatePnL(data, products)

  return (
    <TooltipProvider>
      <Card className={cn('', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            Отчёт о прибылях и убытках (P&L)
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex"
                  aria-label="Подробнее об отчёте о прибылях и убытках (P&L)"
                >
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
            Dashboard. Показатели рассчитаны до налогов и не включают НДС, УСН и другие налоговые
            начисления.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <RevenueSection data={data} />

          <DeductionsSection
            data={data}
            revenueBase={calc.revenueBase}
            commissionPct={calc.commissionPct}
            logisticsPct={calc.logisticsPct}
            storagePct={calc.storagePct}
            acceptancePct={calc.acceptancePct}
            penaltiesPct={calc.penaltiesPct}
            acquiringPct={calc.acquiringPct}
            loyaltyFeePct={calc.loyaltyFeePct}
            loyaltyCompensationPct={calc.loyaltyCompensationPct}
            otherAdjustmentsPct={calc.otherAdjustmentsPct}
            showSppCompensation={calc.showSppCompensation}
            sppCompensation={calc.sppCompensation}
            sppCompensationPct={calc.sppCompensationPct}
            totalWBDeductions={calc.totalWBDeductions}
            totalDeductionsPct={calc.totalDeductionsPct}
          />

          <PayoutSection
            sellerPayout={calc.sellerPayout}
            totalDeductionsPct={calc.totalDeductionsPct}
            payoutPct={calc.payoutPct}
          />

          <GrossProfitSection
            hasCogs={calc.hasCogs}
            sellerPayout={calc.sellerPayout}
            cogsTotal={data.cogs_total}
            cogsPct={calc.cogsPct}
            grossProfit={calc.grossProfit}
            grossMarginPct={calc.grossMarginPct}
            profitToRevenuePct={calc.profitToRevenuePct}
            products={products}
          />

          <KeyMetricsSection
            data={data}
            roi={calc.keyMetricRoi}
            profitPerUnit={calc.keyMetricProfitPerUnit}
          />
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
