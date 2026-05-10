/**
 * Centralized API Client
 * Story 1.5: API Client Layer & Authentication Headers
 * Epic 34-FE: Analytics tracking for Telegram notification endpoints
 */

import { env } from './env'
import { useAuthStore } from '@/stores/authStore'
import { ApiError, type ApiRequestOptions, type ApiResponse } from '@/types/api'
import { TelegramMetrics } from './analytics/telegram-metrics'
import { logCogsRawResponse, logCogsProcessedResponse } from './api-client-debug'

/**
 * Centralized API Client class
 * Automatically includes JWT token and Cabinet ID headers
 */
class ApiClient {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = env.apiUrl

    // Validate HTTPS in production (allow localhost for development)
    if (
      typeof window !== 'undefined' &&
      env.isProduction &&
      this.baseUrl.startsWith('http://') &&
      !this.baseUrl.includes('localhost') &&
      !this.baseUrl.includes('127.0.0.1')
    ) {
      console.error('API URL must use HTTPS in production!')
    }
  }

  /**
   * Base request method with automatic header injection
   */
  private async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { token, cabinetId } = useAuthStore.getState()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (!options.skipAuth && token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (!options.skipCabinetId && cabinetId) {
      headers['X-Cabinet-Id'] = cabinetId
    }

    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      if (!response.ok) {
        const errorData = isJson
          ? await response.json().catch(() => ({}))
          : await response.text().catch(() => 'Unknown error')

        // Extract error message from nested structure: errorData.error.message or errorData.message
        let errorMessage = `API Error: ${response.statusText}`
        if (isJson && typeof errorData === 'object' && errorData !== null) {
          const data = errorData as Record<string, unknown>
          const errorObj = data.error as Record<string, unknown> | undefined
          if (errorObj && typeof errorObj.message === 'string') {
            errorMessage = errorObj.message
          } else if (typeof data.message === 'string') {
            errorMessage = data.message
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }

        // Track Telegram notification API errors (Epic 34-FE)
        if (endpoint.includes('/notifications/')) {
          TelegramMetrics.apiError(endpoint, response.status, errorMessage)
        }

        // Don't log expected 401 errors for missing WB API token (handled gracefully in UI)
        const isExpectedWbTokenError =
          response.status === 401 && errorMessage.includes('WB API token')

        if (!isExpectedWbTokenError) {
          console.error(
            `API Error [${response.status}]:`,
            isJson ? JSON.stringify(errorData, null, 2) : errorData
          )
        }

        const apiError = new ApiError(errorMessage, response.status, errorData)
        // NOTE: apiError.retryAfter is undefined by default. It is ONLY set below when the
        // response is 503 or 429 AND a valid Retry-After header/body is present. Callers
        // must use `error.retryAfter ?? <fallback>` — comparing with `> 0` yields false for
        // undefined, which silently skips the value.
        // Capture Retry-After on 503 for rate-limit banner — Story 96.9-FE, request-backend/169 § 1.1
        // Extended to 429 for FBS export rate-limit countdown — Story 96.12-FE.
        // Validation per code-review M-1/M-2: only positive integers in [1, 600] are honored.
        // - HTTP RFC 7231 § 7.1.3 also allows HTTP-date format — out of scope; treated as undefined.
        // - Negatives, decimals, whitespace-only, Infinity, and zero are all rejected so the UI
        //   never displays "Повтор через -5 сек" / "0 сек" / "Infinity сек".
        // 429: also check body { retryAfter: N } since backend may not set the header.
        if (response.status === 503 || response.status === 429) {
          const retryHeader = response.headers.get('Retry-After')
          if (retryHeader !== null && /^\d+$/.test(retryHeader.trim())) {
            const parsed = Number.parseInt(retryHeader.trim(), 10)
            if (parsed >= 1 && parsed <= 600) {
              apiError.retryAfter = parsed
            }
          }
          // Fallback: parse body { retryAfter: N } when header is absent (Story 96.12-FE).
          // M-2 fix: also accept string-typed retryAfter (e.g. "60") — some JSON APIs
          // serialize numbers as strings. Regex /^\d+$/ rejects decimals, negatives, whitespace.
          if (
            apiError.retryAfter === undefined &&
            isJson &&
            typeof errorData === 'object' &&
            errorData !== null
          ) {
            const bodyRetry = (errorData as Record<string, unknown>).retryAfter
            let parsed: number = NaN
            if (typeof bodyRetry === 'number') {
              parsed = bodyRetry
            } else if (typeof bodyRetry === 'string' && /^\d+$/.test(bodyRetry.trim())) {
              parsed = Number.parseInt(bodyRetry.trim(), 10)
            }
            if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 600) {
              apiError.retryAfter = Math.floor(parsed)
            }
          }
        }
        throw apiError
      }

      if (isJson) {
        const rawData: ApiResponse<T> = await response.json()

        logCogsRawResponse(endpoint, rawData)

        // Story 24: Support skipDataUnwrap option for complex responses
        const data = options.skipDataUnwrap ? (rawData as T) : ((rawData.data ?? rawData) as T)
        logCogsProcessedResponse(endpoint, data)

        return data
      }

      return (await response.text()) as unknown as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : 'Network error occurred'

      // Track Telegram notification network errors (Epic 34-FE)
      if (endpoint.includes('/notifications/')) {
        TelegramMetrics.networkError(endpoint)
      }

      console.error('Network error:', errorMessage)

      throw new ApiError(errorMessage, 0, error)
    }
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
