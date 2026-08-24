'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Copy, ClipboardCheck, History, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SupplyPlanningItem, VelocityTrend } from '@/types/supply-planning'
import { formatDaysUntilStockout, STOCKOUT_RISK_CONFIG } from '@/lib/supply-planning-utils'
import {
  calculateForecast,
  calculateTotalLostUnits,
  buildCopyInfo,
} from './supply-detail-calculations'
import { SUPPLY_RISK_TOKENS } from './supply-risk-tokens'
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
// 'no_data' is excluded: not a renderable trend (Defensive Frontend — indicate, don't fabricate).
const TREND_ICONS: Record<
  Exclude<VelocityTrend, 'no_data'>,
  React.ComponentType<{ className?: string }>
> = {
  growing: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
}

export function SupplyPlanningDetail({ item }: SupplyPlanningDetailProps) {
  // Fallback to defaults if values are missing/invalid
  const stockoutRisk =
    item.stockout_risk && item.stockout_risk in STOCKOUT_RISK_CONFIG
      ? item.stockout_risk
      : 'unknown'
  // Defensive Frontend: 'no_data'/null is NOT a renderable trend — pass it through as null
  // so the detail panel indicates "Нет данных" (mirroring the row cell), never a fabricated
  // 'stable' label + Minus icon + upward sparkline.
  const rawTrend = item.velocity_trend
  const isKnownTrend = rawTrend != null && rawTrend !== 'no_data' && rawTrend in TREND_ICONS
  const velocityTrend = isKnownTrend ? rawTrend : null

  const statusConfig = STOCKOUT_RISK_CONFIG[stockoutRisk]
  const TrendIcon = velocityTrend !== null ? TREND_ICONS[velocityTrend] : null

  // PREFACE-REVIEW F-2 (Story 169.13): null velocity → NO forecast burn-down.
  // The old `?? 0` in calculateForecast fabricated a flat-stock optimistic
  // projection; we suppress the visual and let the right column indicate
  // "нет данных о скорости" instead (Defensive Frontend — indicate, don't fabricate).
  const hasVelocity = item.avg_daily_sales != null
  const forecast = useMemo(
    () => (hasVelocity ? calculateForecast(item) : null),
    [item, hasVelocity]
  )

  // Total lost sales units over the forecast horizon (honest, backend-derived — not a ₽ figure)
  const totalLostUnits = forecast != null ? calculateTotalLostUnits(forecast) : 0

  // Copy info to clipboard
  const handleCopyInfo = () => {
    navigator.clipboard.writeText(buildCopyInfo(item))
  }

  return (
    <div className="bg-muted/50 border border-border rounded-b-lg p-6 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {/* Story 169.13: chip classes from the single-source token map — lib
            bgClass/textClass channels no longer consumed. */}
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs',
            SUPPLY_RISK_TOKENS[stockoutRisk].chip
          )}
        >
          {statusConfig?.icon ?? '?'}
        </span>
        <h3 className="text-lg font-semibold text-foreground">
          {item.sku_id}: {item.product_name}
        </h3>
        {item.stockout_risk !== 'healthy' && (
          // Story 169.13: 4-way nested ternary → token map accent (unknown = muted).
          <span
            className={cn('text-sm font-medium', SUPPLY_RISK_TOKENS[item.stockout_risk].accentText)}
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
        {/* Left Column — trend passed as the enum (Story 169.13 token map lookup) */}
        <SupplyDetailLeftColumn item={item} trend={velocityTrend} TrendIcon={TrendIcon} />

        {/* Right Column — forecast=null suppresses the burn-down (F-2, Story 169.13) */}
        <SupplyDetailRightColumn item={item} forecast={forecast} totalLostUnits={totalLostUnits} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={handleCopyInfo}>
          <Copy className="h-4 w-4 mr-2" />
          Копировать инфо
        </Button>
        {/* C4 disposition (Story 169.13): "Отметить заказ" / "История заказов" /
            "Закрыть" are preserved no-op stubs from Story 6.3 — behavior kept as-is. */}
        <Button variant="outline" size="sm">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Отметить заказ
        </Button>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          История заказов
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <X className="h-4 w-4 mr-2" />
          Закрыть
        </Button>
      </div>
    </div>
  )
}
