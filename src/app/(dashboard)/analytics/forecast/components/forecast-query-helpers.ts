/**
 * Pure helpers extracted from ForecastPageContent for testability.
 * Story 103.4-FE AC 7: level-switcher behavior is unit-tested here rather
 * than via component/hook mocking (per CLAUDE.md "Pure functions over hook
 * mocking" convention).
 */

import type { ForecastLevel } from '@/types/ai-forecast'

export interface ForecastQueryParams {
  /** Parsed nmId or undefined when level is not 'sku' or input is invalid. */
  nmId: number | undefined
  /** Whether the query should fire (level=cabinet OR valid nmId for sku). */
  enabled: boolean
  /** Raw parsed result — null when input is not a positive integer. Used for inline validation messages. */
  parsedNmId: number | null
}

/**
 * Computes hook params from level + raw nmId input string.
 * - 'sku' level requires a positive integer nmId.
 * - 'cabinet' level enables the query unconditionally (implicit aggregation).
 */
export function computeForecastQueryParams(
  level: ForecastLevel,
  nmIdInput: string
): ForecastQueryParams {
  const trimmed = nmIdInput.trim()
  const parsedNmId = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null
  const nmId = level === 'sku' && parsedNmId ? parsedNmId : undefined
  const enabled = level !== 'sku' || (parsedNmId !== null && parsedNmId > 0)
  return { nmId, enabled, parsedNmId }
}
