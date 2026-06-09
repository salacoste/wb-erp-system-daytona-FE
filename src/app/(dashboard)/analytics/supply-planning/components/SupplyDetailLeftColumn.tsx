'use client'

/**
 * Supply Planning Detail - Left Column Sections
 * Story 6.3: Stockout Table & Detail Panel
 *
 * Presentational sections:
 * - Current Situation (stock, in-transit, velocity, stockout)
 * - Velocity Trend (trend label + sparkline)
 * - Warehouse Distribution (bar chart per warehouse)
 */

import { Package, Warehouse } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SupplyPlanningItem, VelocityTrend } from '@/types/supply-planning'
import {
  formatDaysUntilStockout,
  formatStockQty,
  formatVelocity,
  formatStockoutDate,
  VELOCITY_TREND_CONFIG,
} from '@/lib/supply-planning-utils'
import { TrendIndicator, SupplyDetailTrendSection } from './SupplyDetailTrendSection'

// ============================================================================
// Types
// ============================================================================

interface LeftColumnProps {
  item: SupplyPlanningItem
  // null = backend velocity_trend 'no_data'/null (insufficient sales history) → indicate, never fabricate.
  trendConfig: (typeof VELOCITY_TREND_CONFIG)[Exclude<VelocityTrend, 'no_data'>] | null
  TrendIcon: React.ComponentType<{ className?: string }> | null
}

// ============================================================================
// Component
// ============================================================================

export function SupplyDetailLeftColumn({ item, trendConfig, TrendIcon }: LeftColumnProps) {
  return (
    <div className="space-y-6">
      {/* Current Situation */}
      <section className="bg-card rounded-lg border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Package className="h-4 w-4" />
          Текущая ситуация
        </h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Остаток:</dt>
            <dd
              className={cn(
                'font-medium',
                item.current_stock === 0 ? 'text-red-600' : 'text-foreground'
              )}
            >
              {formatStockQty(item.current_stock)} шт
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">В пути:</dt>
            <dd
              className={cn('font-medium', item.in_transit > 0 ? 'text-blue-600' : 'text-muted-foreground')}
            >
              {item.in_transit > 0 ? `${formatStockQty(item.in_transit)} шт` : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Эффективный запас:</dt>
            <dd className="font-medium text-foreground">{formatStockQty(item.effective_stock)} шт</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Скорость продаж:</dt>
            <dd className="font-medium text-foreground flex items-center gap-1">
              {formatVelocity(item.avg_daily_sales)} шт/день
              <TrendIndicator trendConfig={trendConfig} TrendIcon={TrendIcon} className="h-3 w-3" />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Стокаут:</dt>
            <dd
              className={cn(
                'font-bold',
                item.days_until_stockout !== null && item.days_until_stockout <= 7
                  ? 'text-red-600'
                  : item.days_until_stockout !== null && item.days_until_stockout <= 14
                    ? 'text-orange-600'
                    : 'text-foreground'
              )}
            >
              {item.stockout_date
                ? `${formatStockoutDate(item.stockout_date)} (${formatDaysUntilStockout(item.days_until_stockout)})`
                : '—'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Velocity Trend — honest "Нет данных" for no_data/null (Defensive Frontend). */}
      <SupplyDetailTrendSection trendConfig={trendConfig} TrendIcon={TrendIcon} />

      {/* Warehouse Distribution */}
      {item.warehouses.length > 0 && (
        <section className="bg-card rounded-lg border p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Warehouse className="h-4 w-4" />
            Распределение по складам
          </h4>
          <div className="space-y-2">
            {item.warehouses.map((wh, i) => {
              const percentage =
                item.current_stock > 0 ? Math.round((wh.stock / item.current_stock) * 100) : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24 truncate">{wh.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-20 text-right">
                    {formatStockQty(wh.stock)} шт
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
