/**
 * Liquidity Analysis Utility Functions
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Helper functions for UI display (colors, labels, formatting)
 */

import type {
  LiquidityCategory,
  ActionType,
  BenchmarkStatus,
  TrendInsightType,
  LiquidityCategoryConfig,
  ActionTypeConfig,
  BenchmarkStatusConfig,
  LiquiditySummary,
  LiquidityDistribution,
  DistributionChartData,
  TrendDataPoint,
  TrendChartData,
} from '@/types/liquidity';

// ============================================================================
// Liquidity Category Helpers
// ============================================================================

/**
 * Liquidity category configuration
 * Based on turnover days classification
 * Reference: docs/stories/7.0.liquidity-analysis-epic.md
 */
export const LIQUIDITY_CATEGORY_CONFIG: Record<LiquidityCategory, LiquidityCategoryConfig> = {
  highly_liquid: {
    label: 'Высоколиквидный',
    labelShort: 'Ликвид.',
    color: '#22C55E',      // Green-500
    bgColor: '#DCFCE7',    // Green-100
    bgClass: 'bg-green-500',
    textClass: 'text-white',
    icon: '🟢',
    minDays: 0,
    maxDays: 30,
    targetShare: '> 50%',
  },
  medium_liquid: {
    label: 'Средняя ликвидность',
    labelShort: 'Средний',
    color: '#EAB308',      // Yellow-500
    bgColor: '#FEF9C3',    // Yellow-100
    bgClass: 'bg-yellow-500',
    textClass: 'text-white',
    icon: '🟡',
    minDays: 31,
    maxDays: 60,
    targetShare: '30-40%',
  },
  low_liquid: {
    label: 'Низкая ликвидность',
    labelShort: 'Низкий',
    color: '#F97316',      // Orange-500
    bgColor: '#FED7AA',    // Orange-200
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
    icon: '🟠',
    minDays: 61,
    maxDays: 90,
    targetShare: '< 15%',
  },
  illiquid: {
    label: 'Неликвид',
    labelShort: 'Неликвид',
    color: '#EF4444',      // Red-500
    bgColor: '#FEE2E2',    // Red-100
    bgClass: 'bg-red-500',
    textClass: 'text-white',
    icon: '🔴',
    minDays: 91,
    maxDays: 999,
    targetShare: '< 5%',
  },
} as const;

/**
 * Get display configuration for liquidity category
 */
export function getLiquidityCategoryConfig(category: LiquidityCategory): LiquidityCategoryConfig {
  return LIQUIDITY_CATEGORY_CONFIG[category];
}

/**
 * Get color for liquidity category (for charts)
 */
export function getLiquidityStatusColor(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).color;
}

/**
 * Get background color for liquidity category (for badges)
 */
export function getLiquidityStatusBgColor(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).bgColor;
}

/**
 * Get full label for liquidity category
 */
export function getLiquidityStatusLabel(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).label;
}

/**
 * Get short label for liquidity category (for table cells)
 */
export function getLiquidityStatusLabelShort(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).labelShort;
}

/**
 * Get icon emoji for liquidity category
 */
export function getLiquidityStatusIcon(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).icon;
}

/**
 * Get Tailwind classes for solid badge styling
 */
export function getLiquidityBadgeClasses(category: LiquidityCategory): string {
  const config = getLiquidityCategoryConfig(category);
  return `${config.bgClass} ${config.textClass}`;
}

/**
 * Get target share percentage for category
 */
export function getLiquidityTargetShare(category: LiquidityCategory): string {
  return getLiquidityCategoryConfig(category).targetShare;
}

/**
 * Get turnover days range for category
 */
export function getLiquidityDaysRange(category: LiquidityCategory): { min: number; max: number } {
  const config = getLiquidityCategoryConfig(category);
  return { min: config.minDays, max: config.maxDays };
}

// ============================================================================
// Action Type Helpers
// ============================================================================

/**
 * Action type configuration
 */
export const ACTION_TYPE_CONFIG: Record<ActionType, ActionTypeConfig> = {
  MAXIMIZE: {
    label: 'Масштабировать',
    buttonLabel: 'Увеличить закупки',
    color: '#22C55E',
    variant: 'default',
  },
  MAINTAIN: {
    label: 'Поддерживать',
    buttonLabel: 'ОК',
    color: '#3B82F6',
    variant: 'secondary',
  },
  REDUCE: {
    label: 'Сократить',
    buttonLabel: 'Сократить',
    color: '#F97316',
    variant: 'outline',
  },
  LIQUIDATE: {
    label: 'Ликвидировать',
    buttonLabel: 'Скидка',
    color: '#EF4444',
    variant: 'destructive',
  },
} as const;

/**
 * Get display configuration for action type
 */
export function getActionTypeConfig(action: ActionType): ActionTypeConfig {
  return ACTION_TYPE_CONFIG[action];
}

/**
 * Get full label for action type
 */
export function getLiquidityActionLabel(action: ActionType): string {
  return getActionTypeConfig(action).label;
}

/**
 * Get button label for action type
 */
export function getLiquidityActionButtonLabel(action: ActionType): string {
  return getActionTypeConfig(action).buttonLabel;
}

/**
 * Get button variant for action type
 */
export function getLiquidityActionVariant(action: ActionType): 'default' | 'destructive' | 'outline' | 'secondary' {
  return getActionTypeConfig(action).variant;
}

// ============================================================================
// Benchmark Status Helpers
// ============================================================================

/**
 * Benchmark status configuration
 */
export const BENCHMARK_STATUS_CONFIG: Record<BenchmarkStatus, BenchmarkStatusConfig> = {
  excellent: {
    label: 'Отлично',
    color: '#22C55E',
    textClass: 'text-green-600',
    icon: '🎯',
  },
  good: {
    label: 'Хорошо',
    color: '#84CC16',
    textClass: 'text-lime-600',
    icon: '✅',
  },
  warning: {
    label: 'Внимание',
    color: '#F97316',
    textClass: 'text-orange-600',
    icon: '⚠️',
  },
  critical: {
    label: 'Критично',
    color: '#EF4444',
    textClass: 'text-red-600',
    icon: '🚨',
  },
} as const;

/**
 * Get display configuration for benchmark status
 */
export function getBenchmarkStatusConfig(status: BenchmarkStatus): BenchmarkStatusConfig {
  return BENCHMARK_STATUS_CONFIG[status];
}

/**
 * Get color for benchmark status
 */
export function getBenchmarkStatusColor(status: BenchmarkStatus): string {
  return getBenchmarkStatusConfig(status).color;
}

/**
 * Get label for benchmark status
 */
export function getBenchmarkStatusLabel(status: BenchmarkStatus): string {
  return getBenchmarkStatusConfig(status).label;
}

/**
 * Get Tailwind text class for benchmark status
 */
export function getBenchmarkStatusTextClass(status: BenchmarkStatus): string {
  return getBenchmarkStatusConfig(status).textClass;
}

/**
 * Get icon for benchmark status
 */
export function getBenchmarkStatusIcon(status: BenchmarkStatus): string {
  return getBenchmarkStatusConfig(status).icon;
}

// ============================================================================
// Trend Insight Helpers
// ============================================================================

/**
 * Get color for trend insight type
 */
export function getTrendInsightColor(type: TrendInsightType): string {
  switch (type) {
    case 'improvement':
      return '#22C55E'; // Green
    case 'warning':
      return '#F97316'; // Orange
    case 'info':
    default:
      return '#3B82F6'; // Blue
  }
}

/**
 * Get icon for trend insight type
 */
export function getTrendInsightIcon(type: TrendInsightType): string {
  switch (type) {
    case 'improvement':
      return '📈';
    case 'warning':
      return '⚠️';
    case 'info':
    default:
      return 'ℹ️';
  }
}

/**
 * Get Tailwind background class for trend insight
 */
export function getTrendInsightBgClass(type: TrendInsightType): string {
  switch (type) {
    case 'improvement':
      return 'bg-green-50 border-green-200';
    case 'warning':
      return 'bg-orange-50 border-orange-200';
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200';
  }
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format turnover days with Russian grammar
 * @param days - Number of days
 * @returns Formatted string (e.g., "22 дня", "145 дней")
 */
export function formatTurnoverDays(days: number): string {
  if (days >= 999) return 'Нет продаж';
  if (days === 0) return '< 1 дня';
  if (days === 1) return '1 день';
  if (days >= 2 && days <= 4) return `${days} дня`;
  if (days >= 5 && days <= 20) return `${days} дней`;

  // Handle 21, 31, etc.
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${days} дней`;
  }

  if (lastDigit === 1) return `${days} день`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${days} дня`;
  return `${days} дней`;
}

/**
 * Format velocity (units per day)
 * @param velocity - Daily sales velocity
 * @returns Formatted string
 */
export function formatVelocity(velocity: number): string {
  if (velocity === 0) return '0 шт./день';
  if (velocity < 1) return `${velocity.toFixed(1)} шт./день`;
  return `${Math.round(velocity)} шт./день`;
}

/**
 * Format frozen capital with warning indicator
 * @param pct - Frozen capital percentage
 * @returns Warning message or null
 */
export function formatFrozenCapitalWarning(pct: number): string | null {
  if (pct > 10) return '🚨 Критически высокий уровень';
  if (pct > 5) return '⚠️ Выше нормы';
  return null;
}

/**
 * Format frozen capital status
 * @param pct - Frozen capital percentage
 * @returns Status class
 */
export function getFrozenCapitalStatusClass(pct: number): string {
  if (pct > 10) return 'text-red-600 font-bold';
  if (pct > 5) return 'text-orange-600 font-medium';
  return 'text-green-600';
}

/**
 * Format percentage for display
 * @param value - Percentage value
 * @returns Formatted string
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format currency value
 * @param value - Value in rubles
 * @returns Formatted string with ₽ symbol
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format compact number (for large values)
 * @param value - Numeric value
 * @returns Compact format (e.g., "1.2M", "450K")
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toString();
}

// ============================================================================
// Data Transformation Helpers
// ============================================================================

/**
 * Transform distribution data for pie chart
 * @param distribution - Liquidity distribution from API
 * @returns Array of chart data points
 */
export function transformDistributionForChart(
  distribution: LiquidityDistribution
): DistributionChartData[] {
  const categories: LiquidityCategory[] = [
    'highly_liquid',
    'medium_liquid',
    'low_liquid',
    'illiquid',
  ];

  return categories.map((category) => {
    const item = distribution[category];
    const config = getLiquidityCategoryConfig(category);

    return {
      category,
      name: config.label,
      value: item.pct,
      count: item.count,
      stockValue: item.value,
      color: config.color,
    };
  });
}

/**
 * Transform trends data for chart
 * @param trends - Trend data points from API
 * @returns Array of chart data points
 */
export function transformTrendsForChart(
  trends: TrendDataPoint[]
): TrendChartData[] {
  return trends.map((point) => ({
    date: point.date,
    dateLabel: formatDateShort(point.date),
    highly_liquid: point.distribution.highly_liquid_pct,
    medium_liquid: point.distribution.medium_liquid_pct,
    low_liquid: point.distribution.low_liquid_pct,
    illiquid: point.distribution.illiquid_pct,
    frozen_capital: point.frozen_capital,
    avg_turnover: point.avg_turnover_days,
  }));
}

/**
 * Format date for chart labels (short format)
 * @param dateStr - Date string (YYYY-MM-DD)
 * @returns Short date format (e.g., "12 дек")
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'янв', 'фев', 'мар', 'апр', 'май', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

// ============================================================================
// Summary Calculation Helpers
// ============================================================================

/**
 * Get count of illiquid (dead stock) SKUs
 * @param summary - Liquidity summary from API
 * @returns Count of illiquid SKUs
 */
export function getIlliquidSkuCount(summary: LiquiditySummary): number {
  return summary.distribution.illiquid.count;
}

/**
 * Get count of SKUs needing attention (low + illiquid)
 * @param summary - Liquidity summary from API
 * @returns Count of SKUs needing attention
 */
export function getAttentionNeededCount(summary: LiquiditySummary): number {
  return summary.distribution.low_liquid.count + summary.distribution.illiquid.count;
}

/**
 * Check if frozen capital is within target (<5%)
 * @param summary - Liquidity summary from API
 * @returns True if within target
 */
export function isFrozenCapitalHealthy(summary: LiquiditySummary): boolean {
  return summary.frozen_capital_pct < 5;
}

/**
 * Check if highly liquid share is meeting target (>50%)
 * @param summary - Liquidity summary from API
 * @returns True if meeting target
 */
export function isHighlyLiquidHealthy(summary: LiquiditySummary): boolean {
  return summary.distribution.highly_liquid.pct > 50;
}

/**
 * Calculate potential revenue unlock from liquidating dead stock
 * @param summary - Liquidity summary
 * @param avgDiscountPct - Average discount percentage (default: 30%)
 * @returns Estimated unlocked capital
 */
export function calculatePotentialUnlock(
  summary: LiquiditySummary,
  avgDiscountPct: number = 30
): number {
  const frozenValue = summary.frozen_capital;
  const recoveryRate = (100 - avgDiscountPct) / 100;
  return frozenValue * recoveryRate;
}

// ============================================================================
// Liquidation Scenario Helpers
// ============================================================================

/**
 * Get recommended scenario from liquidation options
 * Prefers profitable scenario with moderate discount
 * @param scenarios - Array of liquidation scenarios
 * @returns Recommended scenario or null
 */
export function getRecommendedScenario(
  scenarios: { target_days: number; suggested_discount_pct: number; is_profitable: boolean }[] | null
): typeof scenarios extends null ? null : NonNullable<typeof scenarios>[number] | null {
  if (!scenarios || scenarios.length === 0) return null;

  // Find profitable scenarios
  const profitable = scenarios.filter((s) => s.is_profitable);
  if (profitable.length === 0) return null;

  // Prefer 60-day target as balanced option
  const balanced = profitable.find((s) => s.target_days === 60);
  if (balanced) return balanced;

  // Fallback to scenario with lowest discount
  return profitable.reduce((a, b) =>
    a.suggested_discount_pct < b.suggested_discount_pct ? a : b
  );
}

/**
 * Format discount percentage for display
 * @param pct - Discount percentage
 * @returns Formatted string (e.g., "-30%")
 */
export function formatDiscount(pct: number): string {
  return `-${pct}%`;
}

/**
 * Get scenario urgency label based on target days
 * @param targetDays - Target days for liquidation
 * @returns Urgency label
 */
export function getScenarioUrgencyLabel(targetDays: number): string {
  if (targetDays <= 30) return 'Агрессивный';
  if (targetDays <= 60) return 'Сбалансированный';
  return 'Консервативный';
}

/**
 * Get scenario urgency color
 * @param targetDays - Target days for liquidation
 * @returns Color hex
 */
export function getScenarioUrgencyColor(targetDays: number): string {
  if (targetDays <= 30) return '#EF4444'; // Red
  if (targetDays <= 60) return '#EAB308'; // Yellow
  return '#22C55E'; // Green
}
