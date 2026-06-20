/**
 * WB Commissions Card — Секция 2: РАСХОДЫ WB (левая)
 * Dashboard Restructuring: P&L Narrative
 *
 * Aggregates commission/fee fields from finance-summary.
 * Shows total + % от продаж. Red accent. Inverted comparison.
 * Story 65.7: Commission breakdown popover badge.
 *
 * WB services and promotion are displayed separately to avoid double-counting.
 */

'use client'

import { Receipt } from 'lucide-react'
import { ExpenseMetricCard } from './ExpenseMetricCard'
import { CommissionBreakdownPopover } from './CommissionBreakdownPopover'
import {
  DASHBOARD_WB_DEDUCTIONS_COPY,
  WB_COMMISSION_CARD_TOOLTIP,
} from './dashboardWbDeductionsCopy'

export interface WbCommissionsCardProps {
  commissionSales: number | null | undefined
  acquiringFee: number | null | undefined
  loyaltyFee: number | null | undefined
  penaltiesTotal: number | null | undefined
  wbCommissionAdj: number | null | undefined
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
    wbCommissionAdj
  )

  return (
    <div className="relative">
      <ExpenseMetricCard
        title={DASHBOARD_WB_DEDUCTIONS_COPY.commissionTitle}
        tooltip={WB_COMMISSION_CARD_TOOLTIP}
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
            saleGross={saleGross}
          />
        </div>
      )}
    </div>
  )
}
