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
 * Shows total potential losses and required reorder capital.
 * Color-coded based on severity levels.
 */

interface SupplyMetricsBarProps {
  summary: SupplyPlanningSummary
}

export function SupplyMetricsBar({ summary }: SupplyMetricsBarProps) {
  const { total_reorder_value, total_in_transit_units } = summary

  // Calculate urgency metrics
  const urgentCount = summary.out_of_stock_count + summary.stockout_critical
  const totalAtRisk = urgentCount + summary.stockout_warning

  // Determine loss color based on severity (UX Spec)
  const getLossColor = (urgentCount: number) => {
    if (urgentCount > 10) return 'text-red-600'
    if (urgentCount > 5) return 'text-orange-600'
    return 'text-green-600'
  }

  // Determine capital color based on amount
  const getCapitalColor = (value: number) => {
    if (value > 500000) return 'text-red-600'
    if (value > 100000) return 'text-orange-600'
    return 'text-blue-600'
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-gray-50 p-4">
      {/* Urgent SKUs */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
        <div>
          <div className="text-sm text-gray-600">
            Требуют внимания
          </div>
          <div className={cn('text-lg font-bold', getLossColor(urgentCount))}>
            {totalAtRisk} SKU
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({urgentCount} срочно)
            </span>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="hidden sm:block h-10 w-px bg-gray-300" />

      {/* Required Capital */}
      <div className="flex items-center gap-3">
        <Wallet className="h-5 w-5 text-blue-500 flex-shrink-0" />
        <div>
          <div className="text-sm text-gray-600">
            Требуется капитал
          </div>
          <div className={cn('text-lg font-bold', getCapitalColor(total_reorder_value))}>
            {formatReorderValue(total_reorder_value)}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="hidden sm:block h-10 w-px bg-gray-300" />

      {/* In Transit */}
      <div className="flex items-center gap-3">
        <TrendingDown className="h-5 w-5 text-purple-500 flex-shrink-0" />
        <div>
          <div className="text-sm text-gray-600">
            В пути
          </div>
          <div className="text-lg font-bold text-purple-600">
            {total_in_transit_units.toLocaleString('ru-RU')} шт
          </div>
        </div>
      </div>
    </div>
  )
}
