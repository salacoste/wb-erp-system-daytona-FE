/**
 * Liquidity Action Type, Benchmark Status & Trend Insight Helpers
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Extracted from liquidity-utils.ts (Story 74.5)
 */

import type {
  ActionType,
  BenchmarkStatus,
  TrendInsightType,
  ActionTypeConfig,
  BenchmarkStatusConfig,
} from '@/types/liquidity'

// ============================================================================
// Action Type Helpers
// ============================================================================

/** Action type configuration */
export const ACTION_TYPE_CONFIG: Record<ActionType, ActionTypeConfig> = {
  MAXIMIZE: {
    label: 'Масштабировать',
    buttonLabel: 'Увеличить закупки',
    color: 'var(--color-valence-1)', // C5-W2
    variant: 'default',
  },
  MAINTAIN: {
    label: 'Поддерживать',
    buttonLabel: 'ОК',
    color: 'var(--color-status-information)', // C5-W2: neutral-info action
    variant: 'secondary',
  },
  REDUCE: {
    label: 'Сократить',
    buttonLabel: 'Сократить',
    color: 'var(--color-valence-4)', // C5-W2
    variant: 'outline',
  },
  LIQUIDATE: {
    label: 'Ликвидировать',
    buttonLabel: 'Скидка',
    color: 'var(--color-valence-5)', // C5-W2
    variant: 'destructive',
  },
} as const

/** Get display configuration for action type */
export function getActionTypeConfig(action: ActionType): ActionTypeConfig {
  return ACTION_TYPE_CONFIG[action]
}

/** Get full label for action type */
export function getLiquidityActionLabel(action: ActionType): string {
  return getActionTypeConfig(action).label
}

/** Get button label for action type */
export function getLiquidityActionButtonLabel(action: ActionType): string {
  return getActionTypeConfig(action).buttonLabel
}

/** Get button variant for action type */
export function getLiquidityActionVariant(
  action: ActionType
): 'default' | 'destructive' | 'outline' | 'secondary' {
  return getActionTypeConfig(action).variant
}

// ============================================================================
// Benchmark Status Helpers
// ============================================================================

/** Benchmark status configuration */
export const BENCHMARK_STATUS_CONFIG: Record<BenchmarkStatus, BenchmarkStatusConfig> = {
  excellent: {
    label: 'Отлично',
    color: 'var(--color-valence-1)', // C5-W2 (light ≡ legacy)
    textClass: 'text-status-success',
    icon: '🎯',
  },
  good: {
    label: 'Хорошо',
    color: 'var(--color-valence-2)', // C5-W2 (light ≡ legacy)
    textClass: 'text-status-success',
    icon: '✅',
  },
  warning: {
    label: 'Внимание',
    color: 'var(--color-valence-4)', // C5-W2 (light ≡ legacy)
    textClass: 'text-status-warning',
    icon: '⚠️',
  },
  critical: {
    label: 'Критично',
    color: 'var(--color-valence-5)', // C5-W2 (light ≡ legacy)
    textClass: 'text-status-error',
    icon: '🚨',
  },
} as const

/** Get display configuration for benchmark status */
export function getBenchmarkStatusConfig(status: BenchmarkStatus): BenchmarkStatusConfig {
  return BENCHMARK_STATUS_CONFIG[status]
}

/** Get color for benchmark status */
export function getBenchmarkStatusColor(status: BenchmarkStatus): string {
  return getBenchmarkStatusConfig(status).color
}

/** Get label for benchmark status */
export function getBenchmarkStatusLabel(status: BenchmarkStatus): string {
  return getBenchmarkStatusConfig(status).label
}

/** Get Tailwind text class for benchmark status */
export function getBenchmarkStatusTextClass(status: BenchmarkStatus): string {
  return getBenchmarkStatusConfig(status).textClass
}

/** Get icon for benchmark status */
export function getBenchmarkStatusIcon(status: BenchmarkStatus): string {
  return getBenchmarkStatusConfig(status).icon
}

// ============================================================================
// Trend Insight Helpers
// ============================================================================

/** Get color for trend insight type */
export function getTrendInsightColor(type: TrendInsightType): string {
  switch (type) {
    case 'improvement':
      return 'var(--color-valence-1)' // C5-W2
    case 'warning':
      return 'var(--color-valence-4)' // C5-W2
    case 'info':
    default:
      return 'var(--color-status-information)' // C5-W2
  }
}

/** Get icon for trend insight type */
export function getTrendInsightIcon(type: TrendInsightType): string {
  switch (type) {
    case 'improvement':
      return '📈'
    case 'warning':
      return '⚠️'
    case 'info':
    default:
      return 'ℹ️'
  }
}

/** Get Tailwind background class for trend insight */
export function getTrendInsightBgClass(type: TrendInsightType): string {
  switch (type) {
    case 'improvement':
      return 'bg-status-success/10 border-status-success/20'
    case 'warning':
      return 'bg-status-warning/10 border-status-warning/20'
    case 'info':
    default:
      return 'bg-status-information/10 border-status-information/20'
  }
}
