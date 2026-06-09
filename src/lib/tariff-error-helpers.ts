/**
 * Tariff Error Helper Functions
 * Story 52-FE.6: Rate Limit UX & Error Handling
 *
 * Pure helper functions for parsing and formatting tariff API errors.
 * Extracted from tariff-error-handler.ts for 200-line compliance.
 */

import type { ApiError } from '@/types/api'

export interface TariffValidationError {
  field: string
  message: string
}

/**
 * Parse validation errors from 400 response
 */
export function parseValidationErrors(data: unknown): TariffValidationError[] {
  if (!data || typeof data !== 'object') return []

  const errorData = data as Record<string, unknown>
  const errors: TariffValidationError[] = []

  // Handle { errors: [...] } format
  if (Array.isArray(errorData.errors)) {
    for (const err of errorData.errors) {
      if (typeof err === 'object' && err !== null) {
        const errObj = err as Record<string, unknown>
        errors.push({
          field: String(errObj.field || 'unknown'),
          message: String(errObj.message || 'Ошибка валидации'),
        })
      }
    }
  }

  // Handle { field: 'message' } format
  for (const [key, value] of Object.entries(errorData)) {
    if (key !== 'errors' && key !== 'message' && key !== 'statusCode') {
      errors.push({
        field: key,
        message: String(value),
      })
    }
  }

  return errors
}

/**
 * Calculate retry time from headers or error data
 */
export function getRetryAfterSeconds(error: ApiError): number {
  // Try to get from error data
  if (error.data && typeof error.data === 'object') {
    const data = error.data as Record<string, unknown>
    if (typeof data.retryAfter === 'number') {
      return data.retryAfter
    }
  }

  // Default to 60 seconds (rate limit window)
  return 60
}

/**
 * Format seconds to human-readable time
 */
export function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} сек.`
  }
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} мин.`
}
