/**
 * Profitability Status Utilities
 * Story 63.10-FE: Unit Economics Table Enhancement
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Utility functions for profitability status determination and display.
 * @see docs/stories/epic-63/story-63.10-fe-unit-economics-enhancement.md
 */

import type { ProfitabilityStatus } from '@/types/unit-economics'

// Extended status type to include 'unknown' for missing COGS
export type ExtendedProfitabilityStatus = ProfitabilityStatus | 'unknown'

/**
 * Status configuration with colors, labels, thresholds, and recommendations
 */
export interface ProfitabilityStatusDetails {
  /** Russian label */
  label: string
  /** Primary color (hex) */
  color: string
  /** Background class (Tailwind) */
  bgClass: string
  /** Text color class (Tailwind) */
  textClass: string
  /** Threshold description in Russian */
  threshold: string
  /** Recommendation text in Russian */
  recommendation: string
}

/**
 * Complete status configuration
 *
 * Semantic tokens (P2 wave-5, measured /tmp/p2-w5-contrast.mjs). Badge mounts
 * in UnitEconomicsTableRow (ui/table.tsx:57 hover:bg-muted/50) — soft pairs
 * measured on BOTH static row (card) and hover row (card > muted/50):
 * - excellent: SOLID success (5.13/8.00, compositing-immune)
 * - good:      SOFT success tint + fg text — same-hue success text fails on
 *              the hover stack (4.03), fg-on-tint passes (12.66/12.19)
 * - warning:   SOFT warning tint + fg text (12.77/11.31)
 * - critical:  SOLID warning (orange→warning collapse, Story 170.1)
 * - loss:      SOLID error (6.54/9.48)
 * - unknown:   muted pair (7.17/8.06)
 */
export const EXTENDED_STATUS_CONFIG: Record<
  ExtendedProfitabilityStatus,
  ProfitabilityStatusDetails
> = {
  excellent: {
    label: 'Отлично',
    color: '#22C55E',
    bgClass: 'bg-status-success',
    textClass: 'text-status-success-foreground',
    threshold: 'Маржа > 25%',
    recommendation: 'Поддерживайте текущую стратегию',
  },
  good: {
    label: 'Хорошо',
    color: '#84CC16',
    bgClass: 'bg-status-success/15',
    textClass: 'text-foreground',
    threshold: 'Маржа 15-25%',
    recommendation: 'Стабильная прибыльность',
  },
  warning: {
    label: 'Внимание',
    color: '#EAB308',
    bgClass: 'bg-status-warning/15',
    textClass: 'text-foreground',
    threshold: 'Маржа 5-15%',
    recommendation: 'Рассмотрите оптимизацию затрат',
  },
  critical: {
    label: 'Критично',
    color: '#F97316',
    bgClass: 'bg-status-warning',
    textClass: 'text-status-warning-foreground',
    threshold: 'Маржа 0-5%',
    recommendation: 'Срочно пересмотрите ценообразование',
  },
  loss: {
    label: 'Убыток',
    color: '#EF4444',
    bgClass: 'bg-status-error',
    textClass: 'text-status-error-foreground',
    threshold: 'Маржа < 0%',
    recommendation: 'Остановите продажи или измените стратегию',
  },
  unknown: {
    label: 'Нет данных',
    color: '#9CA3AF',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    threshold: 'COGS не назначен',
    recommendation: 'Добавьте себестоимость для расчёта маржи',
  },
}

/**
 * All valid profitability statuses for filtering
 */
export const ALL_PROFITABILITY_STATUSES: ExtendedProfitabilityStatus[] = [
  'excellent',
  'good',
  'warning',
  'critical',
  'loss',
  'unknown',
]

/**
 * Determine profitability status from margin percentage and COGS availability
 *
 * @param marginPct - Net margin percentage (can be null/undefined)
 * @param hasCogs - Whether COGS is assigned for this product
 * @returns Extended profitability status including 'unknown'
 */
export function getProfitabilityStatus(
  marginPct: number | null | undefined,
  hasCogs: boolean
): ExtendedProfitabilityStatus {
  // No COGS = unknown status
  if (!hasCogs || marginPct === null || marginPct === undefined) {
    return 'unknown'
  }

  // Threshold-based classification
  if (marginPct >= 25) return 'excellent'
  if (marginPct >= 15) return 'good'
  if (marginPct >= 5) return 'warning'
  if (marginPct >= 0) return 'critical'
  return 'loss'
}

/**
 * Get status configuration details
 */
export function getStatusConfig(status: ExtendedProfitabilityStatus): ProfitabilityStatusDetails {
  return EXTENDED_STATUS_CONFIG[status]
}
