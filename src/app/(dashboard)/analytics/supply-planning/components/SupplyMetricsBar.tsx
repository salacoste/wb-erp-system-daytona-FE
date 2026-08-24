'use client'

import { AlertTriangle, Wallet, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SupplyPlanningSummary } from '@/types/supply-planning'
import { formatReorderValue } from '@/lib/supply-planning-utils'

/**
 * Supply Metrics Bar
 * Story 6.2: Page Structure & Risk Dashboard
 * UX Specs by Sally (2025-12-12)
 *
 * Shows urgent SKU counts and required reorder capital.
 * Story 169.13: severity thresholds map to semantic status tokens (was palette ternaries).
 */

interface SupplyMetricsBarProps {
  summary: SupplyPlanningSummary
}

export function SupplyMetricsBar({ summary }: SupplyMetricsBarProps) {
  const { total_reorder_value, total_in_transit_units } = summary

  // Calculate urgency metrics
  const urgentCount = summary.out_of_stock_count + summary.stockout_critical
  const totalAtRisk = urgentCount + summary.stockout_warning

  // Determine loss color based on severity (UX Spec → status tokens, Story 169.13)
  const getLossColor = (urgentCount: number) => {
    if (urgentCount > 10) return 'text-status-error'
    if (urgentCount > 5) return 'text-status-warning'
    return 'text-status-success'
  }

  // Determine capital color based on amount (null = backend omitted the sum → muted, Story 169.13)
  const getCapitalColor = (value: number | null) => {
    if (value == null) return 'text-muted-foreground'
    if (value > 500000) return 'text-status-error'
    if (value > 100000) return 'text-status-warning'
    return 'text-status-information'
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-muted/50 p-4">
      {/* Urgent SKUs */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-status-warning flex-shrink-0" />
        <div>
          <div className="text-sm text-muted-foreground">Требуют внимания</div>
          <div className={cn('text-lg font-bold tabular-nums', getLossColor(urgentCount))}>
            {totalAtRisk} SKU
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({urgentCount} срочно)
            </span>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="hidden sm:block h-10 w-px bg-border" />

      {/* Required Capital */}
      <div className="flex items-center gap-3">
        <Wallet className="h-5 w-5 text-status-information flex-shrink-0" />
        <div>
          <div className="text-sm text-muted-foreground">Требуется капитал</div>
          {/* null capital renders «—» via formatReorderValue (anti-pattern #8, Task 0) */}
          <div
            className={cn('text-lg font-bold tabular-nums', getCapitalColor(total_reorder_value))}
          >
            {formatReorderValue(total_reorder_value)}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="hidden sm:block h-10 w-px bg-border" />

      {/* In Transit — informational metric (status-information, Story 169.13) */}
      <div className="flex items-center gap-3">
        <TrendingDown className="h-5 w-5 text-status-information flex-shrink-0" />
        <div>
          <div className="text-sm text-muted-foreground">В пути</div>
          <div className="text-lg font-bold tabular-nums text-status-information">
            {total_in_transit_units.toLocaleString('ru-RU')} шт
          </div>
        </div>
      </div>
    </div>
  )
}
