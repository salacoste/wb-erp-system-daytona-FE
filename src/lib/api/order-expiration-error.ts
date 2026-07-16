import { ApiError } from '@/types/api'
import { isIsoCalendarDate } from '@/lib/order-expiration-date'

/** Read the authoritative stale minimum only from the standardized backend envelope. */
export function extractExpirationMinimumDate(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 400) return null
  if (typeof error.data !== 'object' || error.data === null) return null

  const envelope = error.data as Record<string, unknown>
  if (typeof envelope.error !== 'object' || envelope.error === null) return null
  const detail = envelope.error as Record<string, unknown>
  if (detail.code !== 'ORDER_EXPIRATION_DATE_TOO_EARLY') return null
  if (typeof detail.details !== 'object' || detail.details === null) return null

  const minimumDate = (detail.details as Record<string, unknown>).minimumDate
  return isIsoCalendarDate(minimumDate) ? minimumDate : null
}

export function isExpirationOutcomeUncertain(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 502) return false
  if (typeof error.data !== 'object' || error.data === null) return false
  const envelope = error.data as Record<string, unknown>
  if (typeof envelope.error !== 'object' || envelope.error === null) return false
  return (envelope.error as Record<string, unknown>).code === 'ORDER_EXPIRATION_OUTCOME_UNCERTAIN'
}
