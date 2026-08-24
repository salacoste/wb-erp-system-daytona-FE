/**
 * Supply Planning Detail - Forecast Calculations
 * Story 6.3: Stockout Table & Detail Panel
 *
 * Pure utility functions for 7-day forecast generation,
 * lost-units calculation, and clipboard text building.
 */

import type { SupplyPlanningItem } from '@/types/supply-planning'
import {
  formatVelocity,
  formatReorderValue,
  formatDaysUntilStockout,
} from '@/lib/supply-planning-utils'

// ============================================================================
// Types
// ============================================================================

export interface ForecastDay {
  day: number
  date: string
  stockStart: number
  sales: number
  stockEnd: number
  isStockout: boolean
  /** Unmet demand (units) on a stockout day = sales the stock couldn't cover. Honest,
   *  backend-derived — NOT a ₽ figure (the backend provides no selling price). */
  lostUnits: number
}

// ============================================================================
// Forecast Calculation
// ============================================================================

/**
 * Generate 7-day stock forecast based on current stock and daily sales velocity.
 * Each day consumes avg_daily_sales units; a stockout day accrues lost sales units (unmet demand).
 *
 * CALLER-GUARD CONTRACT (Story 169.13, preface-review F-2): `avg_daily_sales` is a
 * NON-NULL parameter at the type level — callers MUST guard for null velocity before
 * calling. SupplyPlanningDetail guards via `hasVelocity` and renders "нет данных о
 * скорости" instead of invoking this function. This type-level guarantee replaces the
 * old dishonest `?? 0` fallback that fabricated a flat-stock (0 burn-down) projection.
 */
export function calculateForecast(
  item: SupplyPlanningItem & { avg_daily_sales: number }
): ForecastDay[] {
  const days: ForecastDay[] = []

  let currentStock = item.current_stock
  const dailySales = item.avg_daily_sales

  for (let i = 1; i <= 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    })

    const stockStart = Math.max(0, currentStock)
    const sales = Math.round(dailySales)
    const stockEnd = Math.max(0, stockStart - sales)
    const isStockout = stockEnd === 0 && stockStart < sales
    const lostUnits = isStockout ? sales - stockStart : 0

    days.push({
      day: i,
      date: dateStr,
      stockStart,
      sales,
      stockEnd,
      isStockout,
      lostUnits,
    })

    currentStock = stockEnd
  }

  return days
}

/**
 * Sum lost sales units across all forecast days (total unmet demand over the horizon).
 */
export function calculateTotalLostUnits(forecast: ForecastDay[]): number {
  return forecast.reduce((sum, day) => sum + day.lostUnits, 0)
}

// ============================================================================
// Clipboard
// ============================================================================

/**
 * Build plain-text summary for clipboard copy action.
 */
export function buildCopyInfo(item: SupplyPlanningItem): string {
  return `
SKU: ${item.sku_id}
Название: ${item.product_name}
Остаток: ${item.current_stock} шт
В пути: ${item.in_transit} шт
Скорость продаж: ${formatVelocity(item.avg_daily_sales)} шт/день
Дней до стокаута: ${formatDaysUntilStockout(item.days_until_stockout)}
Рекомендация к заказу: ${item.reorder_quantity} шт
Сумма заказа: ${formatReorderValue(item.reorder_value)}
  `.trim()
}
