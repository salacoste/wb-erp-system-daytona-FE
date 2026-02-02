/**
 * Advertising Date Validation Hook
 * Validates date ranges against available data period
 *
 * @see docs/request-backend/115-advertising-date-filter-empty-state-behavior.md
 * @see docs/request-backend/116-advertising-date-range-frontend-guide.md
 */

import { useMemo } from 'react'
import { format, isBefore, isAfter, max, min, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

/**
 * Result of date range validation
 */
export interface DateValidationResult {
  /** Whether the date range is valid (has any overlap with available data) */
  isValid: boolean
  /** Whether there is any data overlap with the requested range */
  hasDataOverlap: boolean
  /** Adjusted start date if partial overlap (clamped to available range) */
  adjustedFrom?: string
  /** Adjusted end date if partial overlap (clamped to available range) */
  adjustedTo?: string
  /** User-facing message describing the validation result */
  message?: string
  /** Whether the range is completely before available data */
  isBeforeAvailable: boolean
  /** Whether the range is completely after available data */
  isAfterAvailable: boolean
  /** Whether the range partially overlaps (needs adjustment) */
  isPartialOverlap: boolean
}

/**
 * Formats a date string for display in Russian locale
 */
function formatDateRu(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: ru })
}

/**
 * Validates a date range against the available advertising data period.
 *
 * Scenarios handled:
 * 1. Complete overlap: Range is within available data
 * 2. No overlap (before): Range ends before data starts
 * 3. No overlap (after): Range starts after data ends
 * 4. Partial overlap: Range partially overlaps, returns adjusted dates
 *
 * @param from - Requested start date (YYYY-MM-DD)
 * @param to - Requested end date (YYYY-MM-DD)
 * @param availableFrom - Data availability start date (from sync status)
 * @param availableTo - Data availability end date (from sync status)
 * @returns Validation result with overlap info and adjusted dates
 *
 * @example
 * ```tsx
 * const validation = useAdvertisingDateValidation(
 *   '2025-11-18',
 *   '2025-11-24',
 *   syncStatus?.dataAvailableFrom,
 *   syncStatus?.dataAvailableTo
 * )
 *
 * if (!validation.isValid) {
 *   showToast({ variant: 'error', description: validation.message })
 * }
 * ```
 */
export function useAdvertisingDateValidation(
  from: string,
  to: string,
  availableFrom?: string,
  availableTo?: string
): DateValidationResult {
  return useMemo(() => {
    // If no available range provided, assume valid (data not loaded yet)
    if (!availableFrom || !availableTo || !from || !to) {
      return {
        isValid: true,
        hasDataOverlap: true,
        isBeforeAvailable: false,
        isAfterAvailable: false,
        isPartialOverlap: false,
      }
    }

    const requestStart = parseISO(from)
    const requestEnd = parseISO(to)
    const dataStart = parseISO(availableFrom)
    const dataEnd = parseISO(availableTo)

    const isBeforeAvailable = isBefore(requestEnd, dataStart)
    const isAfterAvailable = isAfter(requestStart, dataEnd)

    // Scenario 1: Completely before available data
    if (isBeforeAvailable) {
      return {
        isValid: false,
        hasDataOverlap: false,
        isBeforeAvailable: true,
        isAfterAvailable: false,
        isPartialOverlap: false,
        message: `Выбранный период раньше начала сбора данных (${formatDateRu(availableFrom)})`,
      }
    }

    // Scenario 2: Completely after available data
    if (isAfterAvailable) {
      return {
        isValid: false,
        hasDataOverlap: false,
        isBeforeAvailable: false,
        isAfterAvailable: true,
        isPartialOverlap: false,
        message: `Выбранный период позже последнего обновления данных (${formatDateRu(availableTo)})`,
      }
    }

    // Check for partial overlap
    const needsStartAdjustment = isBefore(requestStart, dataStart)
    const needsEndAdjustment = isAfter(requestEnd, dataEnd)
    const isPartialOverlap = needsStartAdjustment || needsEndAdjustment

    // Scenario 3: Partial overlap - calculate adjusted dates
    if (isPartialOverlap) {
      const adjustedStart = max([requestStart, dataStart])
      const adjustedEnd = min([requestEnd, dataEnd])

      return {
        isValid: true,
        hasDataOverlap: true,
        isBeforeAvailable: false,
        isAfterAvailable: false,
        isPartialOverlap: true,
        adjustedFrom: format(adjustedStart, 'yyyy-MM-dd'),
        adjustedTo: format(adjustedEnd, 'yyyy-MM-dd'),
        message: 'Часть выбранного периода выходит за пределы доступных данных',
      }
    }

    // Scenario 4: Complete overlap - range is fully within available data
    return {
      isValid: true,
      hasDataOverlap: true,
      isBeforeAvailable: false,
      isAfterAvailable: false,
      isPartialOverlap: false,
    }
  }, [from, to, availableFrom, availableTo])
}
