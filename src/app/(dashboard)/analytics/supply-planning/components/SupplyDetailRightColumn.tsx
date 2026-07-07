'use client'

/**
 * Supply Planning Detail - Right Column Sections
 * Story 6.3: Stockout Table & Detail Panel
 *
 * Presentational sections:
 * - 7-Day Forecast (daily stock depletion table)
 * - Reorder Recommendation (order calculation breakdown)
 * - Cost Analysis (extracted to SupplyDetailCostAnalysis)
 *
 * Sub-components: SupplyDetailCostAnalysis
 */

import { Calendar, ShoppingCart } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import type { ForecastDay } from './supply-detail-calculations'
import {
  formatStockQty,
  formatReorderValue,
  formatSafetyStockCoverage,
} from '@/lib/supply-planning-utils'
import { SupplyDetailCostAnalysis } from './SupplyDetailCostAnalysis'

// ============================================================================
// Types
// ============================================================================

interface RightColumnProps {
  item: SupplyPlanningItem
  forecast: ForecastDay[]
  totalLostUnits: number
}

// ============================================================================
// Component
// ============================================================================

export function SupplyDetailRightColumn({ item, forecast, totalLostUnits }: RightColumnProps) {
  return (
    <div className="space-y-6">
      {/* 7-Day Forecast */}
      <section className="bg-white rounded-lg border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Calendar className="h-4 w-4" />
          Прогноз на 7 дней
        </h4>
        <div className="space-y-2 text-sm">
          {forecast.map(day => (
            <div
              key={day.day}
              className={cn(
                'flex items-center justify-between py-1 px-2 rounded',
                day.isStockout ? 'bg-red-50' : ''
              )}
            >
              <span className="text-gray-600">
                День {day.day} ({day.date}):
              </span>
              <span
                className={cn('font-medium', day.isStockout ? 'text-red-600' : 'text-gray-900')}
              >
                {day.stockStart} → {day.stockEnd} шт
                {day.isStockout && (
                  <span className="ml-2 text-red-600">&#x26A0;&#xFE0F; СТОКАУТ</span>
                )}
              </span>
            </div>
          ))}
          {totalLostUnits > 0 && (
            <div className="mt-3 pt-3 border-t flex justify-between font-bold text-red-600">
              <span>Потенциальные потери (7 дней):</span>
              <div className="text-right space-y-0.5">
                <span>≈ {formatNumber(totalLostUnits)} шт упущенных продаж</span>
                {item.selling_price != null && (
                  <span className="block text-sm">
                    ≈ {formatReorderValue(totalLostUnits * item.selling_price)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Reorder Recommendation */}
      <section className="bg-white rounded-lg border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <ShoppingCart className="h-4 w-4" />
          Рекомендация по заказу
        </h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Покрытие страхового запаса:</dt>
            <dd className="font-medium text-gray-900">
              {formatSafetyStockCoverage(item.safety_stock_units, item.avg_daily_sales)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Буфер безопасности:</dt>
            <dd className="font-medium text-gray-900">
              {formatStockQty(item.safety_stock_units)} шт
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Уже есть:</dt>
            <dd className="font-medium text-gray-900">{formatStockQty(item.effective_stock)} шт</dd>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <dt className="font-bold text-gray-900">Рекомендуем заказать:</dt>
            <dd className="font-bold text-blue-600 text-lg">
              {formatStockQty(item.reorder_quantity)} шт
            </dd>
          </div>
        </dl>
      </section>

      {/* Cost Analysis */}
      <SupplyDetailCostAnalysis item={item} />
    </div>
  )
}
