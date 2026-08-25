/**
 * Pure formatting and color helpers for advertising summary metric cards.
 * Extracted from AdvertisingSummaryCards.tsx for file-size compliance.
 */

import { getRoasTierTextClass, getRoiTextClass } from './advertising-tokens'

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

/**
 * iter-119: canonical 5-band ROAS color. Story 170.1: routes through the
 * route-local token map (same thresholds) instead of lib getRoasColorClass —
 * lib color channels stay read-only for the dashboard/widget lockstep.
 */
export function getRoasColor(roas: number): string {
  return getRoasTierTextClass(roas)
}

/** ROI color — percent-domain thresholds (iter-84); Story 170.1 tokens */
export function getRoiColor(roi: number): string {
  return getRoiTextClass(roi)
}
