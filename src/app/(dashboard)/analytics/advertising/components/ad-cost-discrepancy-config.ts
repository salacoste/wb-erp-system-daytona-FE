/**
 * Ad Cost Discrepancy Configuration — Story 73.9-FE
 * Layer definitions, thresholds, severity helpers, and types
 * for three-layer ad cost comparison view.
 */

import { calculateComparison, type ComparisonResult } from '@/lib/comparison-helpers'

// ============================================================================
// Severity Thresholds
// ============================================================================

/** Discrepancy >5% triggers yellow warning */
export const WARNING_THRESHOLD = 5
/** Discrepancy >10% triggers red alert */
export const DANGER_THRESHOLD = 10

export type DiscrepancySeverity = 'normal' | 'warning' | 'danger'

export function getDiscrepancySeverity(absPercentage: number): DiscrepancySeverity {
  if (absPercentage > DANGER_THRESHOLD) return 'danger'
  if (absPercentage > WARNING_THRESHOLD) return 'warning'
  return 'normal'
}

// Story 170.1: severity → status tokens with /15 matched pair (169.5 canon);
// replaces light-only yellow-50/red-50 for dark-mode safety. Thresholds 5%/10%
// are behavior-locked (Task 1) and unchanged.
export const SEVERITY_COLORS = {
  normal: 'text-muted-foreground',
  warning: 'text-status-warning',
  danger: 'text-status-error',
} as const

export const SEVERITY_BG = {
  normal: 'bg-muted/50',
  warning: 'bg-status-warning/15',
  danger: 'bg-status-error/15',
} as const

// ============================================================================
// Layer Definitions
// ============================================================================

export interface AdCostLayer {
  key: 'platform' | 'corrected' | 'actual'
  label: string
  description: string
  color: string
  available: boolean
}

// Story 170.1: layer colors → categorical chart-1..3 tokens in layer order
// (169.4/169.11 canon). Chart bar Cells and card swatches both read these.
export const AD_COST_LAYERS: AdCostLayer[] = [
  {
    key: 'platform',
    label: 'Платформа',
    description: 'Рекламный кабинет (PromotionAPI)',
    color: 'var(--color-chart-1)',
    available: true,
  },
  {
    key: 'corrected',
    label: 'Скорректированная',
    description: 'Корректировка бэкенда (скоро)',
    color: 'var(--color-chart-2)',
    available: false,
  },
  {
    key: 'actual',
    label: 'Факт (отчёт WB)',
    description: 'Еженедельный отчёт Wildberries',
    color: 'var(--color-chart-3)',
    available: true,
  },
]

// ============================================================================
// Discrepancy Calculation
// ============================================================================

export interface DiscrepancyResult {
  comparison: ComparisonResult
  severity: DiscrepancySeverity
}

/**
 * Calculate discrepancy between two cost layers.
 * Uses calculateComparison with invertComparison=true (lower cost is better).
 * Returns null if either value is missing/zero.
 */
export function calculateDiscrepancy(
  actual: number | null | undefined,
  platform: number | null | undefined
): DiscrepancyResult | null {
  if (actual == null || platform == null || platform === 0) return null
  const comparison = calculateComparison(actual, platform, true)
  if (!comparison) return null
  return {
    comparison,
    severity: getDiscrepancySeverity(Math.abs(comparison.percentageChange)),
  }
}
