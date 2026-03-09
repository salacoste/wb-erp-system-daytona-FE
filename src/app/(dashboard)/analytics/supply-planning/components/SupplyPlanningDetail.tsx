'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Copy, ClipboardCheck, History, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SupplyPlanningItem, VelocityTrend } from '@/types/supply-planning'
import {
  formatDaysUntilStockout,
  STOCKOUT_RISK_CONFIG,
  VELOCITY_TREND_CONFIG,
} from '@/lib/supply-planning-utils'
import {
  calculateForecast,
  calculateTotalPotentialLoss,
  buildCopyInfo,
} from './supply-detail-calculations'
import { SupplyDetailLeftColumn } from './SupplyDetailLeftColumn'
import { SupplyDetailRightColumn } from './SupplyDetailRightColumn'

/**
 * Supply Planning Detail Panel
 * Story 6.3: Stockout Table & Detail Panel
 * UX Specs by Sally (2025-12-12)
 *
 * Expandable detail panel showing:
 * - Current situation summary
 * - 7-day forecast
 * - Reorder calculation breakdown
 * - Cost/profit analysis
 * - Warehouse distribution
 */

interface SupplyPlanningDetailProps {
  item: SupplyPlanningItem
}

// Velocity trend icons
const TREND_ICONS: Record<VelocityTrend, React.ComponentType<{ className?: string }>> = {
  growing: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
}

export function SupplyPlanningDetail({ item }: SupplyPlanningDetailProps) {
  // Fallback to defaults if values are missing/invalid
  const stockoutRisk =
    item.stockout_risk && item.stockout_risk in STOCKOUT_RISK_CONFIG
      ? item.stockout_risk
      : 'healthy'
  const velocityTrend =
    item.velocity_trend && item.velocity_trend in TREND_ICONS ? item.velocity_trend : 'stable'

  const statusConfig = STOCKOUT_RISK_CONFIG[stockoutRisk]
  const trendConfig = VELOCITY_TREND_CONFIG[velocityTrend]
  const TrendIcon = TREND_ICONS[velocityTrend]

  // Generate 7-day forecast
  const forecast = useMemo(() => calculateForecast(item), [item])

  // Calculate total potential losses
  const totalPotentialLoss = calculateTotalPotentialLoss(forecast)

  // Copy info to clipboard
  const handleCopyInfo = () => {
    navigator.clipboard.writeText(buildCopyInfo(item))
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-b-lg p-6 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs',
            statusConfig?.bgClass ?? 'bg-gray-100',
            statusConfig?.textClass ?? 'text-gray-600'
          )}
        >
          {statusConfig?.icon ?? '?'}
        </span>
        <h3 className="text-lg font-semibold text-gray-900">
          {item.sku_id}: {item.product_name}
        </h3>
        {item.stockout_risk !== 'healthy' && (
          <span
            className={cn(
              'text-sm font-medium',
              item.stockout_risk === 'out_of_stock'
                ? 'text-gray-700'
                : item.stockout_risk === 'critical'
                  ? 'text-red-600'
                  : item.stockout_risk === 'warning'
                    ? 'text-orange-600'
                    : 'text-yellow-600'
            )}
          >
            —{' '}
            {item.days_until_stockout !== null
              ? `Стокаут через ${formatDaysUntilStockout(item.days_until_stockout)}`
              : 'Нет в наличии'}
          </span>
        )}
      </div>

      {/* Main Grid: 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <SupplyDetailLeftColumn item={item} trendConfig={trendConfig} TrendIcon={TrendIcon} />

        {/* Right Column */}
        <SupplyDetailRightColumn
          item={item}
          forecast={forecast}
          totalPotentialLoss={totalPotentialLoss}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={handleCopyInfo}>
          <Copy className="h-4 w-4 mr-2" />
          Копировать инфо
        </Button>
        <Button variant="outline" size="sm">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Отметить заказ
        </Button>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          История заказов
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="text-gray-500">
          <X className="h-4 w-4 mr-2" />
          Закрыть
        </Button>
      </div>
    </div>
  )
}
