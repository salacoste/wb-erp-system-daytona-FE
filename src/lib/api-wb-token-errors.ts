/**
 * WB token update error handling
 * Extracted from api.ts for file size compliance (Epic 74)
 */

import type { ApiError as CabinetApiError } from '@/types/cabinet'
// FE-D1 fix-wave: every mapped re-throw below MUST keep the ApiError CLASS
// (with its original HTTP status) so the mutation retry predicate
// (src/lib/mutation-retry.ts) can classify 4xx as permanent and skip the
// retry. Aliased — @/types/cabinet exports an ApiError *interface* of the
// same name; the class here is the runtime error type from @/types/api.
import { ApiError as ApiErrorClass } from '@/types/api'

/**
 * Handle errors from WB token update API call
 * Maps specific HTTP status codes and error codes to user-friendly messages
 * @throws Always throws - either a specific Error or re-throws the original.
 *   FE-D1 retry contract: mapped branches re-throw `ApiErrorClass` carrying
 *   the original `status` + `data` (pinned by api-wb-token-errors.test.ts) —
 *   a flat Error here would make the global mutation retry re-issue the 4xx
 *   PUT (defect observed live as e2e WB-TOKEN-BROWSER-02 "Expected 1,
 *   Received 2"). UI copies stay stable: getErrorMessage maps by message
 *   content + data.code, both preserved verbatim.
 */
export function handleWbTokenUpdateError(error: unknown): never {
  if (error instanceof Error && 'status' in error) {
    const apiError = error as { status: number; message: string; data?: CabinetApiError }

    if (apiError.status === 400) {
      const details = apiError.data as CabinetApiError | undefined
      throw new ApiErrorClass(
        details?.details?.[0]?.recommendation ||
          details?.message ||
          'Invalid token or missing X-Cabinet-Id header',
        apiError.status,
        apiError.data
      )
    } else if (apiError.status === 403) {
      throw new ApiErrorClass(
        apiError.message ||
          'Insufficient permissions to update token. Owner or Manager role required.',
        apiError.status,
        apiError.data
      )
    } else if (apiError.status === 404) {
      throw new ApiErrorClass(
        apiError.message || 'Cabinet or key not found',
        apiError.status,
        apiError.data
      )
    } else if (apiError.status === 401) {
      throw new ApiErrorClass(
        apiError.message || 'Unauthorized. Please log in again.',
        apiError.status,
        apiError.data
      )
    }

    const details = apiError.data as CabinetApiError | undefined
    if (details?.code === 'INVALID_TOKEN') {
      throw new ApiErrorClass(
        details.details?.[0]?.recommendation ||
          'WB API token is invalid or expired. Please check your token or get a new one from https://seller.wildberries.ru/',
        apiError.status,
        apiError.data
      )
    } else if (details?.code === 'RATE_LIMITED') {
      throw new ApiErrorClass(
        'WB API rate limit exceeded. Please wait a few minutes and try again.',
        apiError.status,
        apiError.data
      )
    } else if (details?.code === 'NETWORK_ERROR') {
      throw new ApiErrorClass(
        'Unable to connect to WB API. Please check your internet connection and try again later.',
        apiError.status,
        apiError.data
      )
    } else if (details?.code === 'TOKEN_VALIDATION_FAILED') {
      throw new ApiErrorClass(
        details.details?.[0]?.recommendation ||
          'Token validation failed. Please verify your token is correct.',
        apiError.status,
        apiError.data
      )
    }
  }
  throw error
}
