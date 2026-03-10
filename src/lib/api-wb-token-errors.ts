/**
 * WB token update error handling
 * Extracted from api.ts for file size compliance (Epic 74)
 */

import type { ApiError as CabinetApiError } from '@/types/cabinet'

/**
 * Handle errors from WB token update API call
 * Maps specific HTTP status codes and error codes to user-friendly messages
 * @throws Always throws - either a specific Error or re-throws the original
 */
export function handleWbTokenUpdateError(error: unknown): never {
  if (error instanceof Error && 'status' in error) {
    const apiError = error as { status: number; message: string; data?: CabinetApiError }

    if (apiError.status === 400) {
      const details = apiError.data as CabinetApiError | undefined
      throw new Error(
        details?.details?.[0]?.recommendation ||
          details?.message ||
          'Invalid token or missing X-Cabinet-Id header'
      )
    } else if (apiError.status === 403) {
      throw new Error(
        apiError.message ||
          'Insufficient permissions to update token. Owner or Manager role required.'
      )
    } else if (apiError.status === 404) {
      throw new Error(apiError.message || 'Cabinet or key not found')
    } else if (apiError.status === 401) {
      throw new Error(apiError.message || 'Unauthorized. Please log in again.')
    }

    const details = apiError.data as CabinetApiError | undefined
    if (details?.code === 'INVALID_TOKEN') {
      throw new Error(
        details.details?.[0]?.recommendation ||
          'WB API token is invalid or expired. Please check your token or get a new one from https://seller.wildberries.ru/'
      )
    } else if (details?.code === 'RATE_LIMITED') {
      throw new Error('WB API rate limit exceeded. Please wait a few minutes and try again.')
    } else if (details?.code === 'NETWORK_ERROR') {
      throw new Error(
        'Unable to connect to WB API. Please check your internet connection and try again later.'
      )
    } else if (details?.code === 'TOKEN_VALIDATION_FAILED') {
      throw new Error(
        details.details?.[0]?.recommendation ||
          'Token validation failed. Please verify your token is correct.'
      )
    }
  }
  throw error
}
