/**
 * Unit Economics Utility Functions
 * Epic 5 - Unit Economics Analytics
 * Helper functions for UI display (colors, labels, formatting, waterfall data)
 */

import type {
  ProfitabilityStatus,
  ProfitabilityStatusConfig,
  CostCategoryConfig,
  CostsPct,
  CostsRub,
  WaterfallDataPoint,
  UnitEconomicsItem,
  UnitEconomicsSummary,
} from '@/types/unit-economics';

// ============================================================================
// Profitability Status Configuration
// ============================================================================

/**
 * Profitability status display configuration
 * Based on net margin percentage thresholds
 */
export const PROFITABILITY_STATUS_CONFIG: Record<ProfitabilityStatus, ProfitabilityStatusConfig> = {
  excellent: {
    label: 'Отлично',
    labelShort: 'Отл.',
    color: '#22C55E',      // green-500
    bgColor: '#DCFCE7',    // green-100
    bgClass: 'bg-green-500',
    textClass: 'text-white',
    icon: '🟢',
    minMargin: 25,
    maxMargin: Infinity,
  },
  good: {
    label: 'Хорошо',
    labelShort: 'Хор.',
    color: '#84CC16',      // lime-500
    bgColor: '#ECFCCB',    // lime-100
    bgClass: 'bg-lime-500',
    textClass: 'text-white',
    icon: '🟡',
    minMargin: 15,
    maxMargin: 25,
  },
  warning: {
    label: 'Внимание',
    labelShort: 'Вним.',
    color: '#EAB308',      // yellow-500
    bgColor: '#FEF9C3',    // yellow-100
    bgClass: 'bg-yellow-500',
    textClass: 'text-white',
    icon: '🟠',
    minMargin: 5,
    maxMargin: 15,
  },
  critical: {
    label: 'Критично',
    labelShort: 'Крит.',
    color: '#F97316',      // orange-500
    bgColor: '#FFEDD5',    // orange-100
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
    icon: '🔴',
    minMargin: 0,
    maxMargin: 5,
  },
  loss: {
    label: 'Убыток',
    labelShort: 'Убыт.',
    color: '#EF4444',      // red-500
    bgColor: '#FEE2E2',    // red-100
    bgClass: 'bg-red-500',
    textClass: 'text-white',
    icon: '⚫',
    minMargin: -Infinity,
    maxMargin: 0,
  },
} as const;

/**
 * Get profitability status config
 */
export function getProfitabilityConfig(status: ProfitabilityStatus): ProfitabilityStatusConfig {
  return PROFITABILITY_STATUS_CONFIG[status];
}

/**
 * Get profitability color
 */
export function getProfitabilityColor(status: ProfitabilityStatus): string {
  return PROFITABILITY_STATUS_CONFIG[status].color;
}

/**
 * Get profitability label
 */
export function getProfitabilityLabel(status: ProfitabilityStatus): string {
  return PROFITABILITY_STATUS_CONFIG[status].label;
}

/**
 * Get profitability badge classes
 */
export function getProfitabilityBadgeClasses(status: ProfitabilityStatus): string {
  const config = PROFITABILITY_STATUS_CONFIG[status];
  return `${config.bgClass} ${config.textClass}`;
}

/**
 * Get profitability background class only
 */
export function getProfitabilityBgClass(status: ProfitabilityStatus): string {
  return PROFITABILITY_STATUS_CONFIG[status].bgClass;
}

/**
 * Determine profitability status from margin percentage
 */
export function getStatusFromMargin(marginPct: number): ProfitabilityStatus {
  if (marginPct >= 25) return 'excellent';
  if (marginPct >= 15) return 'good';
  if (marginPct >= 5) return 'warning';
  if (marginPct >= 0) return 'critical';
  return 'loss';
}

// ============================================================================
// Cost Category Configuration
// ============================================================================

/**
 * Cost categories for waterfall chart
 * Ordered from largest to smallest typical impact
 */
export const COST_CATEGORIES: CostCategoryConfig[] = [
  { key: 'cogs', label: 'Себестоимость', color: '#6366F1', group: 'cogs' },
  { key: 'commission', label: 'Комиссия WB', color: '#8B5CF6', group: 'wb_fees' },
  { key: 'logistics_delivery', label: 'Доставка', color: '#EC4899', group: 'wb_fees' },
  { key: 'logistics_return', label: 'Возвраты', color: '#F43F5E', group: 'wb_fees' },
  { key: 'storage', label: 'Хранение', color: '#F97316', group: 'wb_fees' },
  { key: 'paid_acceptance', label: 'Приёмка', color: '#EAB308', group: 'wb_fees' },
  { key: 'penalties', label: 'Штрафы', color: '#EF4444', group: 'other' },
  { key: 'other_deductions', label: 'Прочие', color: '#6B7280', group: 'other' },
  { key: 'advertising', label: 'Реклама', color: '#14B8A6', group: 'other' },
];

/**
 * Get cost category config by key
 */
export function getCostCategoryConfig(key: keyof CostsPct): CostCategoryConfig | undefined {
  return COST_CATEGORIES.find(c => c.key === key);
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format currency value in RUB
 */
export function formatCurrency(value: number): string {
  if (value === 0) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format margin with sign and color hint
 */
export function formatMargin(marginPct: number): { text: string; className: string } {
  const sign = marginPct > 0 ? '+' : '';
  const text = `${sign}${marginPct.toFixed(1)}%`;

  if (marginPct >= 25) return { text, className: 'text-green-600' };
  if (marginPct >= 15) return { text, className: 'text-lime-600' };
  if (marginPct >= 5) return { text, className: 'text-yellow-600' };
  if (marginPct >= 0) return { text, className: 'text-orange-600' };
  return { text, className: 'text-red-600' };
}

// ============================================================================
// Waterfall Chart Data Transformation
// ============================================================================

/**
 * Transform item costs to waterfall chart data
 * Revenue → Costs breakdown → Profit
 */
export function transformToWaterfallData(
  revenue: number,
  costsPct: CostsPct,
  costsRub: CostsRub
): WaterfallDataPoint[] {
  const dataPoints: WaterfallDataPoint[] = [];
  let runningTotal = revenue;

  // Start with revenue
  dataPoints.push({
    name: 'Выручка',
    value: revenue,
    runningTotal: revenue,
    color: '#22C55E', // green
    isProfit: false,
  });

  // Add each cost category (as negative)
  for (const category of COST_CATEGORIES) {
    const value = costsRub[category.key];
    if (value > 0) {
      runningTotal -= value;
      dataPoints.push({
        name: category.label,
        value: -value,
        runningTotal,
        color: category.color,
        isProfit: false,
      });
    }
  }

  // End with profit (what remains)
  const profit = runningTotal;
  dataPoints.push({
    name: 'Прибыль',
    value: profit,
    runningTotal: profit,
    color: profit >= 0 ? '#22C55E' : '#EF4444',
    isProfit: true,
  });

  return dataPoints;
}

/**
 * Calculate WB fees total (commission + logistics + storage + acceptance)
 */
export function calculateWbFeesPct(costsPct: CostsPct): number {
  return (
    costsPct.commission +
    costsPct.logistics_delivery +
    costsPct.logistics_return +
    costsPct.storage +
    costsPct.paid_acceptance
  );
}

/**
 * Calculate WB fees total in RUB
 */
export function calculateWbFeesRub(costsRub: CostsRub): number {
  return (
    costsRub.commission +
    costsRub.logistics_delivery +
    costsRub.logistics_return +
    costsRub.storage +
    costsRub.paid_acceptance
  );
}

// ============================================================================
// Analysis Helpers
// ============================================================================

/**
 * Get top margin killers (costs with highest % impact)
 */
export function getTopMarginKillers(
  costsPct: CostsPct,
  limit = 3
): Array<{ key: keyof CostsPct; label: string; pct: number; color: string }> {
  const costs = COST_CATEGORIES
    .filter(c => costsPct[c.key] > 0)
    .map(c => ({
      key: c.key,
      label: c.label,
      pct: costsPct[c.key],
      color: c.color,
    }))
    .sort((a, b) => b.pct - a.pct);

  return costs.slice(0, limit);
}

/**
 * Calculate summary health score (0-100)
 * Based on avg margin, profitable ratio, missing COGS
 */
export function calculateHealthScore(summary: UnitEconomicsSummary): number {
  let score = 0;

  // Margin component (0-40 points)
  if (summary.avg_net_margin_pct >= 25) score += 40;
  else if (summary.avg_net_margin_pct >= 15) score += 30;
  else if (summary.avg_net_margin_pct >= 5) score += 20;
  else if (summary.avg_net_margin_pct >= 0) score += 10;

  // Profitable ratio component (0-40 points)
  const profitableRatio = summary.sku_count > 0
    ? summary.profitable_sku_count / summary.sku_count
    : 0;
  score += Math.round(profitableRatio * 40);

  // COGS coverage component (0-20 points)
  const cogsRatio = summary.sku_count > 0
    ? 1 - (summary.missing_cogs_count / summary.sku_count)
    : 0;
  score += Math.round(cogsRatio * 20);

  return Math.min(100, Math.max(0, score));
}

/**
 * Get health score label and color
 */
export function getHealthScoreInfo(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 80) return { label: 'Отлично', color: '#22C55E', bgColor: '#DCFCE7' };
  if (score >= 60) return { label: 'Хорошо', color: '#84CC16', bgColor: '#ECFCCB' };
  if (score >= 40) return { label: 'Нормально', color: '#EAB308', bgColor: '#FEF9C3' };
  if (score >= 20) return { label: 'Слабо', color: '#F97316', bgColor: '#FFEDD5' };
  return { label: 'Критично', color: '#EF4444', bgColor: '#FEE2E2' };
}

// ============================================================================
// Sorting & Filtering Helpers
// ============================================================================

/**
 * Sort items by profitability (worst first for action prioritization)
 */
export function sortByProfitability(
  items: UnitEconomicsItem[],
  order: 'worst_first' | 'best_first' = 'worst_first'
): UnitEconomicsItem[] {
  const sorted = [...items].sort((a, b) => a.net_margin_pct - b.net_margin_pct);
  return order === 'best_first' ? sorted.reverse() : sorted;
}

/**
 * Filter loss-making products
 */
export function filterLossMaking(items: UnitEconomicsItem[]): UnitEconomicsItem[] {
  return items.filter(item => item.net_margin_pct < 0);
}

/**
 * Filter products without COGS
 */
export function filterMissingCogs(items: UnitEconomicsItem[]): UnitEconomicsItem[] {
  return items.filter(item => !item.has_cogs);
}

/**
 * Get items by profitability status
 */
export function filterByProfitabilityStatus(
  items: UnitEconomicsItem[],
  status: ProfitabilityStatus
): UnitEconomicsItem[] {
  return items.filter(item => item.profitability_status === status);
}
