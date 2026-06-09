/**
 * Advertising Filter Date Handlers
 * Extracted from AdvertisingFilters.tsx for file-size compliance.
 * Story 33.2-FE: Advertising Analytics Page Layout
 */

import { format, parse, differenceInDays, subDays } from 'date-fns'

/** Max allowed date range in days (AC3) */
export const MAX_RANGE_DAYS = 90

/** Yesterday as max date string (sync delay) */
export function getMaxDateStr(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd')
}

/** Compute effective min/max dates from data availability */
export function getEffectiveDateBounds(
  dataAvailableFrom?: string | null,
  dataAvailableTo?: string | null
): { min: string | undefined; max: string } {
  const maxDateStr = getMaxDateStr()
  const min = dataAvailableFrom || undefined
  const max = dataAvailableTo
    ? dataAvailableTo < maxDateStr
      ? dataAvailableTo
      : maxDateStr
    : maxDateStr
  return { min, max }
}

/** Check if a date range exceeds the maximum allowed */
export function isRangeExceedsMax(from: string, to: string): boolean {
  const fromDate = parse(from, 'yyyy-MM-dd', new Date())
  const toDate = parse(to, 'yyyy-MM-dd', new Date())
  return differenceInDays(toDate, fromDate) > MAX_RANGE_DAYS
}

/** Handle "from" date change with auto-correction for range limits */
export function handleFromDateChange(
  value: string,
  currentTo: string,
  onChange: (from: string, to: string) => void
): void {
  if (!value) return

  const newFromDate = parse(value, 'yyyy-MM-dd', new Date())
  const currentToDate = parse(currentTo, 'yyyy-MM-dd', new Date())

  // Ensure to >= from (AC3)
  if (value > currentTo) {
    onChange(value, value)
    return
  }

  // Auto-correct if range exceeds 90 days
  const daysDiff = differenceInDays(currentToDate, newFromDate)
  if (daysDiff > MAX_RANGE_DAYS) {
    const correctedFrom = format(subDays(currentToDate, MAX_RANGE_DAYS), 'yyyy-MM-dd')
    onChange(correctedFrom, currentTo)
  } else {
    onChange(value, currentTo)
  }
}

/** Handle "to" date change with auto-correction for range limits */
export function handleToDateChange(
  value: string,
  currentFrom: string,
  onChange: (from: string, to: string) => void
): void {
  if (!value) return

  const newToDate = parse(value, 'yyyy-MM-dd', new Date())
  const currentFromDate = parse(currentFrom, 'yyyy-MM-dd', new Date())

  // Ensure to >= from (AC3)
  if (value < currentFrom) {
    onChange(value, value)
    return
  }

  // Auto-correct if range exceeds 90 days
  const daysDiff = differenceInDays(newToDate, currentFromDate)
  if (daysDiff > MAX_RANGE_DAYS) {
    const correctedFrom = format(subDays(newToDate, MAX_RANGE_DAYS), 'yyyy-MM-dd')
    onChange(correctedFrom, value)
  } else {
    onChange(currentFrom, value)
  }
}
