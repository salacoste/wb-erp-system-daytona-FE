/**
 * Margin status helpers and configuration
 * Shared between MarginSection and related components
 */

/** Margin status configuration for badges */
export const MARGIN_STATUS_CONFIG = {
  excellent: { label: 'Отлично', bgClass: 'bg-green-100', textClass: 'text-green-700' },
  good: { label: 'Хорошо', bgClass: 'bg-lime-100', textClass: 'text-lime-700' },
  warning: { label: 'Низкая', bgClass: 'bg-yellow-100', textClass: 'text-yellow-700' },
  critical: { label: 'Критично', bgClass: 'bg-red-100', textClass: 'text-red-700' },
} as const

/** Get margin status based on percentage */
export function getMarginStatus(pct: number): keyof typeof MARGIN_STATUS_CONFIG {
  if (pct >= 20) return 'excellent'
  if (pct >= 10) return 'good'
  if (pct >= 5) return 'warning'
  return 'critical'
}

/** Get margin health color based on percentage */
export function getMarginColor(marginPct: number): string {
  if (marginPct >= 20) return 'text-green-600'
  if (marginPct >= 10) return 'text-yellow-600'
  if (marginPct >= 5) return 'text-orange-600'
  return 'text-red-600'
}
