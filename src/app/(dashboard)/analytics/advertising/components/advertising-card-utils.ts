/**
 * Pure formatting and color helpers for advertising summary metric cards.
 * Extracted from AdvertisingSummaryCards.tsx for file-size compliance.
 */

import { getRoasColorClass } from '@/lib/efficiency-utils'

/** Currency formatter for advertising metric cards */
export function formatAdCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** ROI percentage formatting — value already in percent units (iter-61) */
export function formatAdPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/** iter-119: delegates to canonical 5-band getRoasColorClass */
export function getRoasColor(roas: number): string {
  return getRoasColorClass(roas)
}

/** ROI color — percent-domain thresholds (iter-84) */
export function getRoiColor(roi: number): string {
  if (roi >= 50) return 'text-green-600'
  if (roi >= 20) return 'text-yellow-600'
  if (roi >= 0) return 'text-orange-600'
  return 'text-red-600'
}
