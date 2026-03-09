/**
 * PayoutSection — Section 3 of PnL Waterfall
 *
 * Shows seller payout amount and retention/payout percentages.
 * Formula: К перечислению = Продажи (розница) - Удержания WB
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

'use client'

import { Info } from 'lucide-react'
import { SectionHeader } from './PnLSectionHeader'
import { PnLRow } from './PnLRow'
import { formatPercent } from './pnl-formatters'
import type { PayoutSectionProps } from './pnl-types'

export function PayoutSection({ sellerPayout, totalDeductionsPct, payoutPct }: PayoutSectionProps) {
  return (
    <div>
      <SectionHeader
        title="3. К перечислению продавцу"
        description="Сколько денег WB перечислит вам после всех удержаний"
        formula="К перечислению = Продажи (розница) − Удержания WB"
      />
      <div className="space-y-1">
        <PnLRow
          label="К перечислению (Payout)"
          value={sellerPayout}
          isTotal
          highlight={sellerPayout > 0 ? 'positive' : 'negative'}
          tooltip="Сумма, которую WB перечисляет на ваш расчётный счёт.
                  В личном кабинете WB это «К перечислению за товар».

                  ВАЖНО: Может быть отрицательной, если удержания
                  превышают выручку (вы должны WB)."
          formula="Payout = Net Sales − Все удержания WB"
          percentOfRevenue={payoutPct}
        />

        {/* Info about payout percentage */}
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-blue-50 rounded-lg mt-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span>
            WB удерживает{' '}
            <strong className="text-slate-700">{formatPercent(totalDeductionsPct)}</strong> от
            продаж. Вам остаётся{' '}
            <strong className="text-green-700">{formatPercent(payoutPct)}</strong>.
          </span>
        </div>
      </div>
    </div>
  )
}
