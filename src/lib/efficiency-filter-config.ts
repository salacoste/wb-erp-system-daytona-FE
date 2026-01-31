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
 * Colors per spec:
 * - excellent: Green (#22C55E)
 * - good: Lime (#84CC16)
 * - moderate: Yellow (#EAB308)
 * - poor: Orange (#F97316)
 * - loss: Red (#EF4444)
 */
export const efficiencyFilterConfig: EfficiencyFilterConfigMap = {
  excellent: {
    label: 'Отлично',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    bgColorActive: 'bg-green-100',
    borderColor: 'border-green-500',
    description: 'ROAS > 5, ROI > 100%',
    roasRange: 'ROAS > 5.0',
  },
  good: {
    label: 'Хорошо',
    color: 'text-lime-700',
    bgColor: 'bg-lime-50',
    bgColorActive: 'bg-lime-100',
    borderColor: 'border-lime-500',
    description: 'ROAS 3-5, ROI 50-100%',
    roasRange: 'ROAS 3.0-5.0',
  },
  moderate: {
    label: 'Умеренно',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    bgColorActive: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    description: 'ROAS 2-3, ROI 20-50%',
    roasRange: 'ROAS 2.0-3.0',
  },
  poor: {
    label: 'Слабо',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    bgColorActive: 'bg-orange-100',
    borderColor: 'border-orange-500',
    description: 'ROAS 1-2, ROI 0-20%',
    roasRange: 'ROAS 1.0-2.0',
  },
  loss: {
    label: 'Убыток',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    bgColorActive: 'bg-red-100',
    borderColor: 'border-red-500',
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
