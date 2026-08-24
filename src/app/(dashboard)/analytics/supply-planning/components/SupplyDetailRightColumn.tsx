'use client'

/**
 * Supply Planning Detail - Right Column Sections
 * Story 6.3: Stockout Table & Detail Panel
 *
 * Presentational sections:
 * - 7-Day Forecast (daily stock depletion table) — forecast figures are UNITS (шт),
 *   never ₽; the optional ₽ line derives from real selling_price (Request #203).
 * - Reorder Recommendation (order calculation breakdown)
 * - Cost Analysis (extracted to SupplyDetailCostAnalysis)
 *
 * Sub-components: SupplyDetailCostAnalysis
 *
 * Story 169.13: forecast=null (null avg_daily_sales) SUPPRESSES the burn-down
 * (preface-review F-2) — no flat-stock optimistic projection is rendered.
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
  /** null = velocity unknown → burn-down suppressed (F-2, Story 169.13). */
  forecast: ForecastDay[] | null
  totalLostUnits: number
}

// ============================================================================
// Component
// ============================================================================

export function SupplyDetailRightColumn({ item, forecast, totalLostUnits }: RightColumnProps) {
  return (
    <div className="space-y-6">
      {/* 7-Day Forecast — figures are UNITS (шт), NOT ₽ (pinned, Story 169.13). */}
      <section className="bg-card rounded-lg border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Calendar className="h-4 w-4" />
          Прогноз на 7 дней
        </h4>
        {forecast == null ? (
          // F-2: null velocity → indicate, never fabricate a flat-stock projection.
          <div className="text-sm text-muted-foreground py-2">
            Нет данных о скорости продаж — прогноз стокаута недоступен
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {forecast.map(day => (
              <div
                key={day.day}
                className={cn(
                  'flex items-center justify-between py-1 px-2 rounded tabular-nums',
                  day.isStockout ? 'bg-status-error/15' : ''
                )}
              >
                <span className="text-muted-foreground">
                  День {day.day} ({day.date}):
                </span>
                <span
                  className={cn(
                    'font-medium',
                    day.isStockout ? 'text-status-error' : 'text-foreground'
                  )}
                >
                  {day.stockStart} → {day.stockEnd} шт
                  {day.isStockout && (
                    <span className="ml-2 text-status-error">&#x26A0;&#xFE0F; СТОКАУТ</span>
                  )}
                </span>
              </div>
            ))}
            {totalLostUnits > 0 && (
              <div className="mt-3 pt-3 border-t flex justify-between font-bold text-status-error">
                <span>Потенциальные потери (7 дней):</span>
                <div className="text-right space-y-0.5">
                  {/* UNITS first — honest backend-derived figure (not ₽) */}
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
        )}
      </section>

      {/* Reorder Recommendation */}
      <section className="bg-card rounded-lg border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <ShoppingCart className="h-4 w-4" />
          Рекомендация по заказу
        </h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            {/* BD-17: this value is safety-stock ÷ daily sales = how many days the safety
                buffer covers, not a generic "planning horizon". */}
            <dt className="text-muted-foreground">Срок покрытия страхового запаса (дней):</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatSafetyStockCoverage(item.safety_stock_units, item.avg_daily_sales)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Буфер безопасности:</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatStockQty(item.safety_stock_units)} шт
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Уже есть:</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatStockQty(item.effective_stock)} шт
            </dd>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <dt className="font-bold text-foreground">Рекомендуем заказать:</dt>
            <dd className="font-bold text-status-information text-lg tabular-nums">
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
