import { ApiError } from '@/types/api'

/**
 * Check if error is due to missing WB API token
 * React Query passes ApiError directly, but we need to check both instance and properties
 */
export function checkWbTokenError(error: unknown): boolean {
  if (!error) return false

  // Direct ApiError instance
  if (error instanceof ApiError) {
    return error.status === 401 && error.message.includes('WB API token')
  }

  // Check if it's an object with ApiError-like properties
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>
    const status = err.status as number | undefined
    const message = err.message as string | undefined

    if (status === 401 && message && message.includes('WB API token')) {
      return true
    }

    // Check nested error.data structure (from API response)
    const data = err.data as Record<string, unknown> | undefined
    if (data) {
      const errorObj = data.error as Record<string, unknown> | undefined
      if (errorObj) {
        const errorMessage = errorObj.message as string | undefined
        const errorCode = errorObj.code as string | undefined
        if (
          errorCode === 'UNAUTHORIZED' &&
          errorMessage &&
          errorMessage.includes('WB API token')
        ) {
          return true
        }
      }
    }
  }

  return false
}

