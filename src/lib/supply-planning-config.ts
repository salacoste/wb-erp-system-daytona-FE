/**
 * Supply Planning Configuration & Status Helpers
 * Extracted from supply-planning-utils.ts (Epic 74, Story 74.5, Task 6.1)
 * Stockout risk configuration and helpers.
 * Reorder status & velocity trend extracted to supply-planning-reorder-velocity.ts
 */

import type { StockoutRisk, RiskStatusConfig, SupplyPlanningSummary } from '@/types/supply-planning'

// Re-export for backward compatibility
export {
  getReorderStatusConfig,
  getReorderStatusLabel,
  getReorderStatusColor,
  VELOCITY_TREND_CONFIG,
  getVelocityTrendInfo,
} from './supply-planning-reorder-velocity'

// -- Stockout Risk Configuration --

/**
 * Stockout risk status configuration
 * UX Specs by Sally (UX Expert) - 2025-12-12
 * Reference: docs/stories/6.UX-ANSWERS-SUPPLY-PLANNING.md
 */
export const STOCKOUT_RISK_CONFIG: Record<StockoutRisk, RiskStatusConfig> = {
  out_of_stock: {
    label: 'Нет в наличии',
    labelShort: 'Нет',
    color: '#1F2937',
    bgColor: '#F3F4F6',
    icon: '⬛',
    lucideIcon: 'PackageX',
    bgClass: 'bg-gray-800',
    textClass: 'text-white',
    priority: 0,
  },
  critical: {
    label: 'Критично',
    labelShort: 'Крит.',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: '🔴',
    lucideIcon: 'AlertTriangle',
    bgClass: 'bg-red-600',
    textClass: 'text-white',
    priority: 1,
  },
  warning: {
    label: 'Внимание',
    labelShort: 'Вним.',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '🟠',
    lucideIcon: 'AlertCircle',
    bgClass: 'bg-amber-500',
    textClass: 'text-white',
    priority: 2,
  },
  low: {
    label: 'Низкий запас',
    labelShort: 'Низкий',
    color: '#EAB308',
    bgColor: '#FEF9C3',
    icon: '🟡',
    lucideIcon: 'Clock',
    bgClass: 'bg-yellow-400',
    textClass: 'text-gray-900',
    priority: 3,
  },
  healthy: {
    label: 'В норме',
    labelShort: 'Норма',
    color: '#22C55E',
    bgColor: '#DCFCE7',
    icon: '🟢',
    lucideIcon: 'CheckCircle',
    bgClass: 'bg-green-500',
    textClass: 'text-white',
    priority: 4,
  },
} as const

// -- Stockout Risk Helpers --

/** Get display configuration for stockout risk status */
export function getStockoutRiskConfig(risk: StockoutRisk): RiskStatusConfig {
  return STOCKOUT_RISK_CONFIG[risk]
}

/** Get color for stockout risk (for charts) */
export function getStockoutRiskColor(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).color
}

/** Get background color for stockout risk (for badges) */
export function getStockoutRiskBgColor(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).bgColor
}

/** Get label for stockout risk */
export function getStockoutRiskLabel(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).label
}

/** Get short label for stockout risk (for table cells) */
export function getStockoutRiskLabelShort(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).labelShort
}

/** Get icon emoji for stockout risk */
export function getStockoutRiskIcon(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).icon
}

/** Get Lucide icon name for stockout risk */
export function getStockoutRiskLucideIcon(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).lucideIcon
}

/** Get Tailwind classes for solid badge styling */
export function getStockoutRiskBadgeClasses(risk: StockoutRisk): string {
  const config = getStockoutRiskConfig(risk)
  return `${config.bgClass} ${config.textClass}`
}

/** Get count of urgent SKUs (out_of_stock + critical) for nav badge */
export function getUrgentSkuCount(summary: SupplyPlanningSummary): number {
  return summary.out_of_stock_count + summary.stockout_critical
}
