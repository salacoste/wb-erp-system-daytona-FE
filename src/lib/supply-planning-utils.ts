/**
 * Supply Planning Utility Functions
 * Epic 6 - Supply Planning & Stockout Prevention
 * Barrel re-export + formatters
 *
 * Refactored: Epic 74, Story 74.5, Task 6
 * Config/status helpers extracted to supply-planning-config.ts
 * Sorting/filtering extracted to supply-planning-sorting.ts
 * Chart data extracted to supply-planning-chart.ts
 */

// Barrel re-export: all config & status helpers
export {
  STOCKOUT_RISK_CONFIG,
  getStockoutRiskConfig,
  getStockoutRiskColor,
  getStockoutRiskBgColor,
  getStockoutRiskLabel,
  getStockoutRiskLabelShort,
  getStockoutRiskIcon,
  getStockoutRiskLucideIcon,
  getStockoutRiskBadgeClasses,
  getUrgentSkuCount,
  getReorderStatusConfig,
  getReorderStatusLabel,
  getReorderStatusColor,
  VELOCITY_TREND_CONFIG,
  getVelocityTrendInfo,
} from './supply-planning-config'

// Barrel re-export: sorting & filtering helpers
export {
  getStockoutRiskSeverity,
  sortByStockoutRisk,
  filterByMinRisk,
} from './supply-planning-sorting'

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format days until stockout for display (with correct Russian plural forms)
 */
export function formatDaysUntilStockout(days: number | null): string {
  if (days === null) return 'Нет данных'
  if (days === 0) return 'Сегодня'
  if (days >= 999) return '∞'

  const lastDigit = days % 10
  const lastTwoDigits = days % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${days} дней`
  if (lastDigit === 1) return `${days} день`
  if (lastDigit >= 2 && lastDigit <= 4) return `${days} дня`
  return `${days} дней`
}

/**
 * Safety-stock coverage — how many days the safety-stock buffer lasts at the current sales
 * velocity (safety_stock_units / avg_daily_sales). This is a COVERAGE metric (days of buffer
 * ahead), NOT a planning horizon. Guards the division (iter-125): no safety stock → "—";
 * zero/negative sales velocity → "∞" (the buffer never depletes). Before this guard the inline
 * `safety_stock_units / avg_daily_sales` rendered the literal "Infinity дней" for a no-sales item
 * with a safety buffer. "∞" matches formatDaysUntilStockout's never-stocks-out case. Non-finite
 * inputs (NaN/Infinity — not expected from the `number` backend contract) → "—" (no data),
 * mirroring formatReorderValue's `Number.isFinite` guard.
 */
export function formatSafetyStockCoverage(safetyStockUnits: number, avgDailySales: number): string {
  if (!Number.isFinite(safetyStockUnits) || safetyStockUnits <= 0) return '—'
  if (!Number.isFinite(avgDailySales)) return '—'
  if (avgDailySales <= 0) return '∞'
  return `${Math.round(safetyStockUnits / avgDailySales)} дней`
}

/**
 * Format stock quantity
 */
export function formatStockQty(qty: number): string {
  if (qty === 0) return '0'
  return qty.toLocaleString('ru-RU')
}

/**
 * Format reorder value in RUB. Accepts null/undefined (backend omits reorder_value when COGS is
 * unassigned) → "—", never a fabricated "0 ₽" (anti-pattern #8). A real 0 also renders "—" here
 * (a 0 reorder value means nothing to reorder — by design for this column).
 */
export function formatReorderValue(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format velocity (units per day)
 */
export function formatVelocity(velocity: number): string {
  if (velocity === 0) return '0'
  if (velocity < 1) return velocity.toFixed(2)
  if (velocity < 10) return velocity.toFixed(1)
  return Math.round(velocity).toString()
}

/**
 * Format stockout date
 */
export function formatStockoutDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

// Barrel re-export: chart data helpers
export { getRiskDistributionData } from './supply-planning-chart'
