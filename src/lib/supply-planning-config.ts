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
 *
 * Story 174.2: legacy palette utilities + raw hexes migrated to semantic tokens.
 * The route presentation renders via SUPPLY_RISK_TOKENS (169.13 single source);
 * these channels feed only non-route callers (getStockoutRiskBadgeClasses /
 * getRiskDistributionData). bgColor tints use the color-mix(token 15%, transparent)
 * idiom from LiquidityTableRowCells; muted tiers use the muted surface var.
 */
export const STOCKOUT_RISK_CONFIG: Record<StockoutRisk, RiskStatusConfig> = {
  out_of_stock: {
    label: 'Нет в наличии',
    labelShort: 'Нет',
    color: 'var(--color-muted-foreground)',
    bgColor: 'var(--color-muted)',
    icon: '⬛',
    lucideIcon: 'PackageX',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    priority: 0,
  },
  critical: {
    label: 'Критично',
    labelShort: 'Крит.',
    color: 'var(--color-status-error)',
    bgColor: 'color-mix(in srgb, var(--color-status-error) 15%, transparent)',
    icon: '🔴',
    lucideIcon: 'AlertTriangle',
    bgClass: 'bg-status-error',
    textClass: 'text-status-error-foreground',
    priority: 1,
  },
  warning: {
    label: 'Внимание',
    labelShort: 'Вним.',
    color: 'var(--color-status-warning)',
    bgColor: 'color-mix(in srgb, var(--color-status-warning) 15%, transparent)',
    icon: '🟠',
    lucideIcon: 'AlertCircle',
    bgClass: 'bg-status-warning',
    textClass: 'text-status-warning-foreground',
    priority: 2,
  },
  low: {
    label: 'Низкий запас',
    labelShort: 'Низкий',
    color: 'var(--color-status-warning)',
    bgColor: 'color-mix(in srgb, var(--color-status-warning) 10%, transparent)',
    icon: '🟡',
    lucideIcon: 'Clock',
    bgClass: 'bg-status-warning/10',
    textClass: 'text-status-warning',
    priority: 3,
  },
  healthy: {
    label: 'В норме',
    labelShort: 'Норма',
    color: 'var(--color-status-success)',
    bgColor: 'color-mix(in srgb, var(--color-status-success) 15%, transparent)',
    icon: '🟢',
    lucideIcon: 'CheckCircle',
    bgClass: 'bg-status-success',
    textClass: 'text-status-success-foreground',
    priority: 4,
  },
  // Story 169.13 (pattern #218/#226): visible-unknown tier for absent/unrecognized
  // backend enum values. Neutral muted styling; distinguishable from 'healthy' so an
  // optimistic lie never renders as a green "all good" badge.
  unknown: {
    label: 'Статус риска неизвестен',
    labelShort: 'Неизв.',
    color: 'var(--color-muted-foreground)',
    bgColor: 'var(--color-muted)',
    icon: '❔',
    lucideIcon: 'HelpCircle',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    priority: 5,
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
