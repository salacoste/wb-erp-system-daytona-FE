/**
 * Tariff API Error Handler
 * Story 52-FE.6: Rate Limit UX & Error Handling
 * Epic 52-FE: Tariff Settings Admin UI
 *
 * Centralized error handling for tariff admin API endpoints
 * Handles validation errors, permission errors, conflicts, and rate limits
 */

import { toast } from 'sonner'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { ApiError } from '@/types/api'
import { useTariffRateLimitStore } from '@/stores/tariffRateLimitStore'

export interface TariffValidationError {
  field: string
  message: string
}

export interface TariffErrorResult {
  type: 'validation' | 'permission' | 'conflict' | 'rate_limit' | 'network'
  message: string
  errors?: TariffValidationError[]
  retryAfterSeconds?: number
}

/**
 * Parse validation errors from 400 response
 */
function parseValidationErrors(data: unknown): TariffValidationError[] {
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
function getRetryAfterSeconds(error: ApiError): number {
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
function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} сек.`
  }
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} мин.`
}

/**
 * Handle tariff API errors with appropriate UI feedback
 *
 * @param error - ApiError from API client
 * @param router - Next.js router instance for redirects
 * @returns Structured error result for form handling
 */
export function handleTariffApiError(
  error: unknown,
  router?: AppRouterInstance
): TariffErrorResult {
  // Handle non-ApiError cases
  if (!(error instanceof ApiError)) {
    const message = error instanceof Error ? error.message : 'Ошибка сети'
    toast.error(message)
    return { type: 'network', message }
  }

  switch (error.status) {
    // 400 Bad Request - Validation errors
    case 400: {
      const errors = parseValidationErrors(error.data)
      const message = errors.length > 0
        ? errors.map((e) => e.message).join(', ')
        : error.message || 'Ошибка валидации данных'

      toast.error(message)
      return { type: 'validation', message, errors }
    }

    // 403 Forbidden - Role check failed
    case 403: {
      toast.error('Требуется роль Admin для выполнения этой операции')
      if (router) {
        router.push('/dashboard')
      }
      return {
        type: 'permission',
        message: 'Требуется роль Admin',
      }
    }

    // 409 Conflict - Duplicate version date
    case 409: {
      toast.error('Версия на эту дату уже существует')
      return {
        type: 'conflict',
        message: 'Версия на эту дату уже существует',
      }
    }

    // 429 Too Many Requests - Rate limit exceeded
    case 429: {
      const retryAfterSeconds = getRetryAfterSeconds(error)
      const formattedTime = formatRetryTime(retryAfterSeconds)

      // Update rate limit store
      useTariffRateLimitStore.getState().reset()

      toast.error(
        `Превышен лимит запросов. Попробуйте через ${formattedTime}`
      )

      return {
        type: 'rate_limit',
        message: `Превышен лимит запросов`,
        retryAfterSeconds,
      }
    }

    // All other errors
    default: {
      const message = error.message || 'Произошла ошибка при обращении к API'
      toast.error(message)
      return { type: 'network', message }
    }
  }
}

/**
 * Check if error is recoverable (can retry)
 */
export function isRecoverableError(result: TariffErrorResult): boolean {
  return result.type === 'network' || result.type === 'rate_limit'
}

/**
 * Check if error requires redirect
 */
export function requiresRedirect(result: TariffErrorResult): boolean {
  return result.type === 'permission'
}
