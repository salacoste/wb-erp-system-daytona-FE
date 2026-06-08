/**
 * WB Commissions Card — Секция 2: РАСХОДЫ WB (левая)
 * Dashboard Restructuring: P&L Narrative
 *
 * Aggregates 6 commission/fee fields from finance-summary.
 * Shows total + % от продаж. Red accent. Inverted comparison.
 * Story 65.7: Commission breakdown popover badge.
 *
 * Note: Renamed to "Удержания WB" (WB Deductions) as it includes
 * not only commissions but also acquiring, loyalty fees, penalties, etc.
 */

'use client'

import { Receipt } from 'lucide-react'
import { ExpenseMetricCard } from './ExpenseMetricCard'
import { CommissionBreakdownPopover } from './CommissionBreakdownPopover'

export interface WbCommissionsCardProps {
  commissionSales: number | null | undefined
  acquiringFee: number | null | undefined
  loyaltyFee: number | null | undefined
  penaltiesTotal: number | null | undefined
  wbCommissionAdj: number | null | undefined
  wbServicesCost: number | null | undefined
  previousTotal: number | null | undefined
  saleGross: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

function sumNullable(...values: (number | null | undefined)[]): number | null {
  let sum = 0
  let hasAny = false
  for (const v of values) {
    if (v != null) {
      sum += v
      hasAny = true
    }
  }
  return hasAny ? sum : null
}

export function WbCommissionsCard({
  commissionSales,
  acquiringFee,
  loyaltyFee,
  penaltiesTotal,
  wbCommissionAdj,
  wbServicesCost,
  previousTotal,
  saleGross,
  isLoading,
  error,
  onRetry,
  className,
}: WbCommissionsCardProps): React.ReactElement {
  const total = sumNullable(
    commissionSales,
    acquiringFee,
    loyaltyFee,
    penaltiesTotal,
    wbCommissionAdj,
    wbServicesCost
  )

  return (
    <div className="relative">
      <ExpenseMetricCard
        title="Удержания WB"
        tooltip={
          'Все удержания WB за период (кроме продвижения):\n• Комиссия за продажу — основная комиссия WB за выкупленные товары\n• Эквайринг — за приём платежей от покупателей\n• Программа лояльности — за участие в акциях WB\n• Штрафы — за нарушения правил (некомплект, брак и т.д.)\n• Корректировки — ручные поправки WB\n• Сервисы WB — прочие услуги (без продвижения)\n⚠ Продвижение (реклама) показано отдельно в карточке «Реклама», чтобы не задваивать.\nИсточник: еженедельный финансовый отчёт WB.'
        }
        icon={Receipt}
        valueColor="text-red-500"
        value={total}
        previousValue={previousTotal}
        revenueTotal={saleGross}
        isLoading={isLoading}
        error={error}
        className={className}
        onRetry={onRetry}
      />
      {total != null && (
        <div className="absolute right-3 top-3" data-testid="commission-breakdown-wrapper">
          <CommissionBreakdownPopover
            commissionSales={commissionSales}
            acquiringFee={acquiringFee}
            wbCommissionAdj={wbCommissionAdj}
            loyaltyFee={loyaltyFee}
            penaltiesTotal={penaltiesTotal}
            wbServicesCost={wbServicesCost}
            saleGross={saleGross}
          />
        </div>
      )}
    </div>
  )
}
