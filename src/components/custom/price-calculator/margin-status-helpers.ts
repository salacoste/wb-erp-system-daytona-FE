/**
 * Margin status helpers and configuration
 * Shared between MarginSection and related components
 */

/** Margin status configuration for badges */
export const MARGIN_STATUS_CONFIG = {
  excellent: {
    label: 'Отлично',
    bgClass: 'bg-financial-positive/15',
    textClass: 'text-financial-positive',
  },
  good: { label: 'Хорошо', bgClass: 'bg-status-success/15', textClass: 'text-status-success' },
  warning: {
    label: 'Низкая',
    bgClass: 'bg-status-warning/15',
    textClass: 'text-status-warning',
  },
  critical: {
    label: 'Критично',
    bgClass: 'bg-financial-negative/15',
    textClass: 'text-financial-negative',
  },
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
  if (marginPct >= 20) return 'text-financial-positive'
  if (marginPct >= 10) return 'text-status-success'
  if (marginPct >= 5) return 'text-status-warning'
  return 'text-financial-negative'
}
