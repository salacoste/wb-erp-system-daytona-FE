/**
 * API response interceptor helpers
 * Extracted from api-client.ts for file size compliance.
 *
 * Handles error response parsing, Retry-After extraction (503/429),
 * and Telegram notification error tracking.
 */

import { TelegramMetrics } from './analytics/telegram-metrics'
import { logger } from '@/lib/logger'

/**
 * Extract error message from API error response body.
 * Handles nested { error: { message } } and flat { message } structures.
 */
export function extractErrorMessage(
  isJson: boolean,
  errorData: unknown,
  fallbackMessage: string
): string {
  if (isJson && typeof errorData === 'object' && errorData !== null) {
    const data = errorData as Record<string, unknown>
    const errorObj = data.error as Record<string, unknown> | undefined
    if (errorObj && typeof errorObj.message === 'string') {
      return errorObj.message
    }
    if (typeof data.message === 'string') {
      return data.message
    }
  } else if (typeof errorData === 'string') {
    return errorData
  }
  return fallbackMessage
}

/**
 * Validate and parse a Retry-After value into a positive integer in [1, 600].
 * Rejects negatives, decimals, whitespace-only, Infinity, zero, and HTTP-date format.
 * Returns undefined for invalid/out-of-range values.
 */
export function parseRetryAfter(raw: string | null | undefined): number | undefined {
  if (raw === null || raw === undefined) return undefined
  if (!/^\d+$/.test(raw.trim())) return undefined
  const parsed = Number.parseInt(raw.trim(), 10)
  if (parsed >= 1 && parsed <= 600) return parsed
  return undefined
}

/**
 * Extract retryAfter from response header and/or JSON body on 429/503.
 * Header takes priority; body { retryAfter: N } is fallback.
 * Only positive integers in [1, 600] are honored.
 *
 * Story 96.9-FE (503), Story 96.12-FE (429 body fallback).
 */
export function extractRetryAfter(
  responseStatus: number,
  retryHeader: string | null,
  isJson: boolean,
  errorData: unknown
): number | undefined {
  if (responseStatus !== 503 && responseStatus !== 429) return undefined

  // Try header first
  const fromHeader = parseRetryAfter(retryHeader)
  if (fromHeader !== undefined) return fromHeader

  // Fallback: parse body { retryAfter: N }
  if (!isJson || typeof errorData !== 'object' || errorData === null) return undefined

  const bodyRetry = (errorData as Record<string, unknown>).retryAfter
  let parsed: number = NaN
  if (typeof bodyRetry === 'number') {
    parsed = bodyRetry
  } else if (typeof bodyRetry === 'string' && /^\d+$/.test(bodyRetry.trim())) {
    parsed = Number.parseInt(bodyRetry.trim(), 10)
  }
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 600) {
    return Math.floor(parsed)
  }
  return undefined
}

/** Track Telegram notification API errors (Epic 34-FE) */
export function trackTelegramApiError(endpoint: string, status: number, message: string): void {
  if (endpoint.includes('/notifications/')) {
    TelegramMetrics.apiError(endpoint, status, message)
  }
}

/** Track Telegram notification network errors (Epic 34-FE) */
export function trackTelegramNetworkError(endpoint: string): void {
  if (endpoint.includes('/notifications/')) {
    TelegramMetrics.networkError(endpoint)
  }
}

/** Whether an error is an expected 401 for missing WB API token (handled gracefully in UI) */
export function isExpectedWbTokenError(status: number, message: string): boolean {
  return status === 401 && message.includes('WB API token')
}

/** Log API error unless it's an expected WB token error */
export function logApiError(
  status: number,
  message: string,
  isJson: boolean,
  errorData: unknown
): void {
  if (!isExpectedWbTokenError(status, message)) {
    logger.error(`API Error [${status}]:`, isJson ? JSON.stringify(errorData, null, 2) : errorData)
  }
}
