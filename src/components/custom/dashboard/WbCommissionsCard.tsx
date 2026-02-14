/**
 * WB Commissions Card — Секция 2: РАСХОДЫ WB (левая)
 * Dashboard Restructuring: P&L Narrative
 *
 * Aggregates 6 commission/fee fields from finance-summary.
 * Shows total + % от продаж. Red accent. Inverted comparison.
 */

'use client'

import { Receipt } from 'lucide-react'
import { ExpenseMetricCard } from './ExpenseMetricCard'

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
    <ExpenseMetricCard
      title="Комиссии WB"
      tooltip="Комиссия продаж, эквайринг, лояльность, штрафы, корректировки и сервисы WB."
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
  )
}
