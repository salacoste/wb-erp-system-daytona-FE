/**
 * Supply Planning Utility Functions
 * Epic 6 - Supply Planning & Stockout Prevention
 * Helper functions for UI display (colors, labels, formatting)
 */

import type {
  StockoutRisk,
  ReorderStatus,
  VelocityTrend,
  RiskStatusConfig,
  ReorderStatusConfig,
  RiskDistributionData,
  SupplyPlanningSummary,
} from '@/types/supply-planning';

// ============================================================================
// Stockout Risk Helpers
// ============================================================================

/**
 * Stockout risk status configuration
 * UX Specs by Sally (UX Expert) - 2025-12-12
 * Reference: docs/stories/6.UX-ANSWERS-SUPPLY-PLANNING.md
 */
export const STOCKOUT_RISK_CONFIG: Record<StockoutRisk, RiskStatusConfig> = {
  out_of_stock: {
    label: 'Нет в наличии',
    labelShort: 'Нет',
    color: '#1F2937',      // Gray-800 - "dead" product
    bgColor: '#F3F4F6',    // Gray-100
    icon: '⬛',
    lucideIcon: 'PackageX',
    bgClass: 'bg-gray-800',
    textClass: 'text-white',
    priority: 0,           // Most urgent
  },
  critical: {
    label: 'Критично',
    labelShort: 'Крит.',
    color: '#DC2626',      // Red-600
    bgColor: '#FEE2E2',    // Red-100
    icon: '🔴',
    lucideIcon: 'AlertTriangle',
    bgClass: 'bg-red-600',
    textClass: 'text-white',
    priority: 1,
  },
  warning: {
    label: 'Внимание',
    labelShort: 'Вним.',
    color: '#F59E0B',      // Amber-500
    bgColor: '#FEF3C7',    // Amber-100
    icon: '🟠',
    lucideIcon: 'AlertCircle',
    bgClass: 'bg-amber-500',
    textClass: 'text-white',
    priority: 2,
  },
  low: {
    label: 'Низкий запас',
    labelShort: 'Низкий',
    color: '#EAB308',      // Yellow-500
    bgColor: '#FEF9C3',    // Yellow-100
    icon: '🟡',
    lucideIcon: 'Clock',
    bgClass: 'bg-yellow-400',
    textClass: 'text-gray-900',
    priority: 3,
  },
  healthy: {
    label: 'В норме',
    labelShort: 'Норма',
    color: '#22C55E',      // Green-500
    bgColor: '#DCFCE7',    // Green-100
    icon: '🟢',
    lucideIcon: 'CheckCircle',
    bgClass: 'bg-green-500',
    textClass: 'text-white',
    priority: 4,           // Least urgent
  },
} as const;

/**
 * Get display configuration for stockout risk status
 */
export function getStockoutRiskConfig(risk: StockoutRisk): RiskStatusConfig {
  return STOCKOUT_RISK_CONFIG[risk];
}

/**
 * Get color for stockout risk (for charts)
 */
export function getStockoutRiskColor(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).color;
}

/**
 * Get background color for stockout risk (for badges)
 */
export function getStockoutRiskBgColor(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).bgColor;
}

/**
 * Get label for stockout risk
 */
export function getStockoutRiskLabel(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).label;
}

/**
 * Get short label for stockout risk (for table cells)
 */
export function getStockoutRiskLabelShort(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).labelShort;
}

/**
 * Get icon emoji for stockout risk
 */
export function getStockoutRiskIcon(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).icon;
}

/**
 * Get Lucide icon component name for stockout risk
 * Use with dynamic import: const Icon = Icons[getLucideIconName(risk)]
 */
export function getStockoutRiskLucideIcon(risk: StockoutRisk): string {
  return getStockoutRiskConfig(risk).lucideIcon;
}

/**
 * Get Tailwind classes for solid badge styling
 */
export function getStockoutRiskBadgeClasses(risk: StockoutRisk): string {
  const config = getStockoutRiskConfig(risk);
  return `${config.bgClass} ${config.textClass}`;
}

/**
 * Get count of urgent SKUs for navigation badge
 * Shows: out_of_stock + critical
 * UX Spec Q7: Red badge with count
 */
export function getUrgentSkuCount(summary: SupplyPlanningSummary): number {
  return summary.out_of_stock_count + summary.stockout_critical;
}

// ============================================================================
// Reorder Status Helpers
// ============================================================================

/**
 * Get display configuration for reorder status
 */
export function getReorderStatusConfig(status: ReorderStatus): ReorderStatusConfig {
  const configs: Record<ReorderStatus, ReorderStatusConfig> = {
    urgent: {
      label: 'Срочно заказать',
      color: '#EF4444',
      bgColor: '#FEE2E2',
    },
    soon: {
      label: 'Заказать скоро',
      color: '#F97316',
      bgColor: '#FED7AA',
    },
    ok: {
      label: 'Запас достаточен',
      color: '#22C55E',
      bgColor: '#D1FAE5',
    },
  };
  return configs[status];
}

/**
 * Get label for reorder status
 */
export function getReorderStatusLabel(status: ReorderStatus): string {
  return getReorderStatusConfig(status).label;
}

/**
 * Get color for reorder status
 */
export function getReorderStatusColor(status: ReorderStatus): string {
  return getReorderStatusConfig(status).color;
}

// ============================================================================
// Velocity Trend Helpers
// ============================================================================

/**
 * Velocity trend display configuration
 * UX Specs by Sally (UX Expert) - 2025-12-12
 */
export const VELOCITY_TREND_CONFIG = {
  growing: {
    label: 'Растёт',
    icon: '↗️',
    color: '#16A34A',      // Green-600
    textClass: 'text-green-600',
    lucideIcon: 'TrendingUp',
  },
  stable: {
    label: 'Стабильно',
    icon: '➡️',
    color: '#6B7280',      // Gray-500
    textClass: 'text-gray-500',
    lucideIcon: 'Minus',
  },
  declining: {
    label: 'Падает',
    icon: '↘️',
    color: '#DC2626',      // Red-600
    textClass: 'text-red-600',
    lucideIcon: 'TrendingDown',
  },
} as const;

/**
 * Get display info for velocity trend
 */
export function getVelocityTrendInfo(trend: VelocityTrend): {
  label: string;
  icon: string;
  color: string;
  textClass: string;
  lucideIcon: string;
} {
  return VELOCITY_TREND_CONFIG[trend];
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format days until stockout for display
 */
export function formatDaysUntilStockout(days: number | null): string {
  if (days === null) return 'Нет данных';
  if (days === 0) return 'Сегодня';
  if (days === 1) return '1 день';
  if (days < 5) return `${days} дня`;
  if (days >= 999) return '∞';
  return `${days} дней`;
}

/**
 * Format stock quantity
 */
export function formatStockQty(qty: number): string {
  if (qty === 0) return '0';
  return qty.toLocaleString('ru-RU');
}

/**
 * Format reorder value in RUB
 */
export function formatReorderValue(value: number): string {
  if (value === 0) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format velocity (units per day)
 */
export function formatVelocity(velocity: number): string {
  if (velocity === 0) return '0';
  if (velocity < 1) return velocity.toFixed(2);
  if (velocity < 10) return velocity.toFixed(1);
  return Math.round(velocity).toString();
}

/**
 * Format stockout date
 */
export function formatStockoutDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
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
      label: STOCKOUT_RISK_CONFIG.out_of_stock.label,
      color: STOCKOUT_RISK_CONFIG.out_of_stock.color,
    },
    {
      status: 'critical',
      count: summary.stockout_critical,
      label: STOCKOUT_RISK_CONFIG.critical.label,
      color: STOCKOUT_RISK_CONFIG.critical.color,
    },
    {
      status: 'warning',
      count: summary.stockout_warning,
      label: STOCKOUT_RISK_CONFIG.warning.label,
      color: STOCKOUT_RISK_CONFIG.warning.color,
    },
    {
      status: 'low',
      count: summary.stockout_low,
      label: STOCKOUT_RISK_CONFIG.low.label,
      color: STOCKOUT_RISK_CONFIG.low.color,
    },
    {
      status: 'healthy',
      count: summary.healthy_stock,
      label: STOCKOUT_RISK_CONFIG.healthy.label,
      color: STOCKOUT_RISK_CONFIG.healthy.color,
    },
  ];

  // Filter out zero counts for cleaner chart
  return data.filter((d) => d.count > 0);
}

/**
 * Calculate percentage for risk category
 */
export function getRiskPercentage(count: number, total: number): string {
  if (total === 0) return '0%';
  const pct = (count / total) * 100;
  return `${pct.toFixed(1)}%`;
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
  };
  return severity[risk];
}

/**
 * Sort items by stockout risk (most urgent first)
 */
export function sortByStockoutRisk<T extends { stockout_risk: StockoutRisk }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => getStockoutRiskSeverity(b.stockout_risk) - getStockoutRiskSeverity(a.stockout_risk)
  );
}

/**
 * Filter items by minimum risk level
 */
export function filterByMinRisk<T extends { stockout_risk: StockoutRisk }>(
  items: T[],
  minRisk: StockoutRisk
): T[] {
  const minSeverity = getStockoutRiskSeverity(minRisk);
  return items.filter((item) => getStockoutRiskSeverity(item.stockout_risk) >= minSeverity);
}
