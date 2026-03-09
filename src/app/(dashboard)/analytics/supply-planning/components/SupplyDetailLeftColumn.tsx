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

// ============================================================================
// Types
// ============================================================================

interface LeftColumnProps {
  item: SupplyPlanningItem
  trendConfig: (typeof VELOCITY_TREND_CONFIG)[VelocityTrend]
  TrendIcon: React.ComponentType<{ className?: string }>
}

// ============================================================================
// Component
// ============================================================================

export function SupplyDetailLeftColumn({ item, trendConfig, TrendIcon }: LeftColumnProps) {
  return (
    <div className="space-y-6">
      {/* Current Situation */}
      <section className="bg-white rounded-lg border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Package className="h-4 w-4" />
          Текущая ситуация
        </h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Остаток:</dt>
            <dd
              className={cn(
                'font-medium',
                item.current_stock === 0 ? 'text-red-600' : 'text-gray-900'
              )}
            >
              {formatStockQty(item.current_stock)} шт
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">В пути:</dt>
            <dd
              className={cn('font-medium', item.in_transit > 0 ? 'text-blue-600' : 'text-gray-400')}
            >
              {item.in_transit > 0 ? `${formatStockQty(item.in_transit)} шт` : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Эффективный запас:</dt>
            <dd className="font-medium text-gray-900">{formatStockQty(item.effective_stock)} шт</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Скорость продаж:</dt>
            <dd className="font-medium text-gray-900 flex items-center gap-1">
              {formatVelocity(item.avg_daily_sales)} шт/день
              <TrendIcon className={cn('h-3 w-3', trendConfig?.textClass ?? 'text-gray-500')} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Стокаут:</dt>
            <dd
              className={cn(
                'font-bold',
                item.days_until_stockout !== null && item.days_until_stockout <= 7
                  ? 'text-red-600'
                  : item.days_until_stockout !== null && item.days_until_stockout <= 14
                    ? 'text-orange-600'
                    : 'text-gray-900'
              )}
            >
              {item.stockout_date
                ? `${formatStockoutDate(item.stockout_date)} (${formatDaysUntilStockout(item.days_until_stockout)})`
                : '—'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Velocity Trend */}
      <section className="bg-white rounded-lg border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <TrendIcon className="h-4 w-4" />
          Тренд скорости продаж
        </h4>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center gap-2 text-lg font-bold',
              trendConfig?.textClass ?? 'text-gray-500'
            )}
          >
            <TrendIcon className="h-5 w-5" />
            {trendConfig?.label ?? 'Стабильно'}
          </div>
          <span className="text-sm text-gray-500">(за последние 14 дней)</span>
        </div>
        {/* Simple sparkline placeholder */}
        <div className="mt-3 flex items-end gap-0.5 h-8">
          {[3, 4, 5, 4, 6, 7, 5, 6, 8, 7, 9, 8, 10, 9].map((h, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t',
                i >= 12
                  ? (trendConfig?.textClass ?? 'text-gray-500').replace('text-', 'bg-')
                  : 'bg-gray-300'
              )}
              style={{ height: `${h * 10}%` }}
            />
          ))}
        </div>
      </section>

      {/* Warehouse Distribution */}
      {item.warehouses.length > 0 && (
        <section className="bg-white rounded-lg border p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <Warehouse className="h-4 w-4" />
            Распределение по складам
          </h4>
          <div className="space-y-2">
            {item.warehouses.map((wh, i) => {
              const percentage =
                item.current_stock > 0 ? Math.round((wh.stock / item.current_stock) * 100) : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24 truncate">{wh.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
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
