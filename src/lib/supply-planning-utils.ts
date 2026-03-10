/**
 * Supply Planning Utility Functions
 * Epic 6 - Supply Planning & Stockout Prevention
 * Barrel re-export + formatters + chart data + sorting/filtering
 *
 * Refactored: Epic 74, Story 74.5, Task 6
 * Config/status helpers extracted to supply-planning-config.ts
 */

import type {
  StockoutRisk,
  RiskDistributionData,
  SupplyPlanningSummary,
} from '@/types/supply-planning'

import { STOCKOUT_RISK_CONFIG as RISK_CONFIG } from './supply-planning-config'

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
 * Format stock quantity
 */
export function formatStockQty(qty: number): string {
  if (qty === 0) return '0'
  return qty.toLocaleString('ru-RU')
}

/**
 * Format reorder value in RUB
 */
export function formatReorderValue(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '—'
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

// ============================================================================
// Chart Data Helpers
// ============================================================================

/**
 * Generate risk distribution data for pie/donut chart
 * Uses colors from STOCKOUT_RISK_CONFIG for consistency
 */
export function getRiskDistributionData(summary: SupplyPlanningSummary): RiskDistributionData[] {
  const data: RiskDistributionData[] = [
    {
      status: 'out_of_stock',
      count: summary.out_of_stock_count,
      label: RISK_CONFIG.out_of_stock.label,
      color: RISK_CONFIG.out_of_stock.color,
    },
    {
      status: 'critical',
      count: summary.stockout_critical,
      label: RISK_CONFIG.critical.label,
      color: RISK_CONFIG.critical.color,
    },
    {
      status: 'warning',
      count: summary.stockout_warning,
      label: RISK_CONFIG.warning.label,
      color: RISK_CONFIG.warning.color,
    },
    {
      status: 'low',
      count: summary.stockout_low,
      label: RISK_CONFIG.low.label,
      color: RISK_CONFIG.low.color,
    },
    {
      status: 'healthy',
      count: summary.healthy_stock,
      label: RISK_CONFIG.healthy.label,
      color: RISK_CONFIG.healthy.color,
    },
  ]

  // Filter out zero counts for cleaner chart
  return data.filter(d => d.count > 0)
}

/**
 * Calculate percentage for risk category
 */
export function getRiskPercentage(count: number, total: number): string {
  if (total === 0) return '0%'
  const pct = (count / total) * 100
  return `${pct.toFixed(1)}%`
}

// ============================================================================
// Sorting & Filtering Helpers
// ============================================================================

/**
 * Risk severity order for sorting (higher = more urgent)
 */
export function getStockoutRiskSeverity(risk: StockoutRisk): number {
  const severity: Record<StockoutRisk, number> = {
    out_of_stock: 5,
    critical: 4,
    warning: 3,
    low: 2,
    healthy: 1,
  }
  return severity[risk]
}

/**
 * Sort items by stockout risk (most urgent first)
 */
export function sortByStockoutRisk<T extends { stockout_risk: StockoutRisk }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => getStockoutRiskSeverity(b.stockout_risk) - getStockoutRiskSeverity(a.stockout_risk)
  )
}

/**
 * Filter items by minimum risk level
 */
export function filterByMinRisk<T extends { stockout_risk: StockoutRisk }>(
  items: T[],
  minRisk: StockoutRisk
): T[] {
  const minSeverity = getStockoutRiskSeverity(minRisk)
  return items.filter(item => getStockoutRiskSeverity(item.stockout_risk) >= minSeverity)
}
