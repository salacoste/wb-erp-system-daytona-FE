/**
 * Supply Planning Detail - Forecast Calculations
 * Story 6.3: Stockout Table & Detail Panel
 *
 * Pure utility functions for 7-day forecast generation,
 * potential loss calculation, and clipboard text building.
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
  potentialLoss: number
}

// ============================================================================
// Forecast Calculation
// ============================================================================

/**
 * Generate 7-day stock forecast based on current stock and daily sales velocity.
 * Each day consumes avg_daily_sales units; stockout triggers potential loss calc.
 */
export function calculateForecast(item: SupplyPlanningItem): ForecastDay[] {
  const days: ForecastDay[] = []

  let currentStock = item.current_stock
  const dailySales = item.avg_daily_sales
  const avgPrice =
    item.has_cogs && item.cogs_per_unit
      ? item.cogs_per_unit * 2.5 // Approximate retail price
      : 1000 // Default assumption

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
    const potentialLoss = isStockout ? Math.round((sales - stockStart) * avgPrice) : 0

    days.push({
      day: i,
      date: dateStr,
      stockStart,
      sales,
      stockEnd,
      isStockout,
      potentialLoss,
    })

    currentStock = stockEnd
  }

  return days
}

/**
 * Sum potential losses across all forecast days.
 */
export function calculateTotalPotentialLoss(forecast: ForecastDay[]): number {
  return forecast.reduce((sum, day) => sum + day.potentialLoss, 0)
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
