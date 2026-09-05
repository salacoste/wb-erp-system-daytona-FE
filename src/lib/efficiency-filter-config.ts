/**
 * Efficiency Filter Configuration
 * Story 63.4-FE: Advertising Efficiency Filter UI
 *
 * Configuration for efficiency filter chips display.
 */

import type {
  EfficiencyFilterConfigMap,
  EfficiencyCountsSummary,
  FilterableEfficiencyStatus,
} from '@/types/efficiency-filter'
import type { EfficiencyStatus, AdvertisingItem } from '@/types/advertising-analytics'

/**
 * Efficiency filter configuration for each status.
 *
 * Semantic tokens (P2 wave-5, measured /tmp/p2-w5-contrast.mjs, chip on Card):
 * - excellent: SOLID success chip (white on status-success — 5.13/8.00)
 * - good:      SOFT success (fg-on-tint: fg text on success/5→/15 — 13.2+);
 *              dual-green collapse per Story 170.1 (excellent solid vs good soft)
 * - moderate:  SOFT warning (fg on warning/5→/15 — 13.28/12.88)
 * - poor:      SOLID warning (white on status-warning — 4.81/11.41)
 * - loss:      SOLID error (white on status-error — 6.54/9.48)
 * Chip `color` spans inactive AND active states, so soft tiers use
 * text-foreground (fg-on-tint, wave-4 hover-exposed-chip precedent) —
 * same-hue text passes only at /5 and fails on the /15 active tint.
 */
export const efficiencyFilterConfig: EfficiencyFilterConfigMap = {
  excellent: {
    label: 'Отлично',
    color: 'text-status-success-foreground',
    bgColor: 'bg-status-success',
    bgColorActive: 'bg-status-success',
    borderColor: 'border-status-success',
    description: 'ROAS > 5, ROI > 100%',
    roasRange: 'ROAS > 5.0',
  },
  good: {
    label: 'Хорошо',
    color: 'text-foreground',
    bgColor: 'bg-status-success/5',
    bgColorActive: 'bg-status-success/15',
    borderColor: 'border-status-success',
    description: 'ROAS 3-5, ROI 50-100%',
    roasRange: 'ROAS 3.0-5.0',
  },
  moderate: {
    label: 'Умеренно',
    color: 'text-foreground',
    bgColor: 'bg-status-warning/5',
    bgColorActive: 'bg-status-warning/15',
    borderColor: 'border-status-warning',
    description: 'ROAS 2-3, ROI 20-50%',
    roasRange: 'ROAS 2.0-3.0',
  },
  poor: {
    label: 'Слабо',
    color: 'text-status-warning-foreground',
    bgColor: 'bg-status-warning',
    bgColorActive: 'bg-status-warning',
    borderColor: 'border-status-warning',
    description: 'ROAS 1-2, ROI 0-20%',
    roasRange: 'ROAS 1.0-2.0',
  },
  loss: {
    label: 'Убыток',
    color: 'text-status-error-foreground',
    bgColor: 'bg-status-error',
    bgColorActive: 'bg-status-error',
    borderColor: 'border-status-error',
    description: 'ROAS < 1, ROI < 0%',
    roasRange: 'ROAS < 1.0',
  },
}

/**
 * Order of filter chips display.
 * Best to worst efficiency.
 */
export const FILTER_ORDER: FilterableEfficiencyStatus[] = [
  'excellent',
  'good',
  'moderate',
  'poor',
  'loss',
]

/**
 * Calculate efficiency counts from advertising items.
 * Groups items by their efficiency_status.
 *
 * @param items - Array of advertising items with efficiency_status
 * @returns Counts for each efficiency category
 */
export function calculateEfficiencyCounts(
  items: Pick<AdvertisingItem, 'efficiency_status'>[]
): EfficiencyCountsSummary {
  const counts: EfficiencyCountsSummary = {
    excellent: 0,
    good: 0,
    moderate: 0,
    poor: 0,
    loss: 0,
    total: items.length,
  }

  items.forEach(item => {
    const status = item.efficiency_status
    if (status !== 'unknown' && status in counts) {
      counts[status as keyof Omit<EfficiencyCountsSummary, 'total'>]++
    }
  })

  return counts
}

/**
 * Get filter configuration by status.
 * Returns null for unknown status.
 */
export function getEfficiencyFilterConfig(status: EfficiencyStatus) {
  if (status === 'unknown') return null
  return efficiencyFilterConfig[status]
}
