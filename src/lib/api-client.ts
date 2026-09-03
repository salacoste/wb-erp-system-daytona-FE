/**
 * Centralized API Client
 * Story 1.5: API Client Layer & Authentication Headers
 * Epic 34-FE: Analytics tracking for Telegram notification endpoints
 */

import { env } from './env'
import { useAuthStore } from '@/stores/authStore'
import { ApiError, type ApiRequestOptions, type ApiResponse } from '@/types/api'
import { logger } from '@/lib/logger'
import { logCogsRawResponse, logCogsProcessedResponse } from './api-client-debug'
import { getFreshToken, isRefreshEndpoint } from './api-client-refresh'
import {
  extractErrorMessage,
  extractRetryAfter,
  trackTelegramApiError,
  trackTelegramNetworkError,
  logApiError,
} from './api-interceptors'

/** Centralized API Client — auto-injects JWT token and Cabinet ID headers */
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
      logger.error('API URL must use HTTPS in production!')
    }
  }

  /** Base request method with automatic header injection */
  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {},
    allowReactiveRefresh = true
  ): Promise<T> {
    const { token, cabinetId } = useAuthStore.getState()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Story 167.9: an immutable initiating token wins over the mutable store
    // token so a request authenticates as the session that initiated it.
    const effectiveToken = options.authToken ?? token

    if (!options.skipAuth && effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`
    }

    // Story 167.9: an immutable initiating cabinet id wins over the store value.
    const effectiveCabinetId = options.cabinetIdOverride ?? cabinetId

    if (!options.skipCabinetId && effectiveCabinetId) {
      headers['X-Cabinet-Id'] = effectiveCabinetId
    }

    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, { ...options, headers })

      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      if (!response.ok) {
        // D-2 (PB-3, 2026-09-03): reactive 401 recovery — contract annex in
        // docs/request-backend/230-auth-refresh-endpoint-missing.md. Gates:
        // authenticated requests only (a skipAuth 401 is a credential
        // failure — nothing to rotate); never the refresh endpoint itself
        // (its own 401 must not recurse); once per request — a replay that
        // 401s again surfaces the original ApiError (no loop). D-2 pass-1
        // (OQ2): a durable pinned op may opt out via the PUBLIC
        // `options.allowReactiveRefresh: false`; precedence — the PRIVATE
        // replay param (false after one replay) always wins over the public
        // option, which cannot re-enable refresh mid-recovery.
        if (
          response.status === 401 &&
          allowReactiveRefresh &&
          options.allowReactiveRefresh !== false &&
          !options.skipAuth &&
          !isRefreshEndpoint(endpoint)
        ) {
          // D-2 pass-1 (M1): hand the FAILED request's wire Authorization to
          // the single-flight core — if it differs from the store token, a
          // prior rotation completed and no new refresh may start.
          const refreshed = await getFreshToken(headers['Authorization'])
          if (refreshed) {
            // Replay ONCE. `authToken: undefined` drops a stale Story-167.9
            // initiating override — the revoked token must not ride again;
            // the replay re-reads the (rotated) store token + cabinet fresh.
            return this.request<T>(endpoint, { ...options, authToken: undefined }, false)
          }
        }

        const errorData = isJson
          ? await response.json().catch(() => ({}))
          : await response.text().catch(() => 'Unknown error')

        const errorMessage = extractErrorMessage(
          !!isJson,
          errorData,
          `API Error: ${response.statusText}`
        )

        trackTelegramApiError(endpoint, response.status, errorMessage)
        logApiError(response.status, errorMessage, !!isJson, errorData)

        const apiError = new ApiError(errorMessage, response.status, errorData)
        // Retry-After extraction for 429/503 (Story 96.9-FE, Story 96.12-FE)
        const retryAfter = extractRetryAfter(
          response.status,
          response.headers.get('Retry-After'),
          !!isJson,
          errorData
        )
        if (retryAfter !== undefined) {
          apiError.retryAfter = retryAfter
        }
        throw apiError
      }

      // Binary downloads (Story O5): resolve the raw Blob. The non-JSON branch
      // below would otherwise return `response.text()` and corrupt the bytes.
      if (options.responseType === 'blob') {
        return (await response.blob()) as unknown as T
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

      if (!options.suppressNetworkErrorLog) {
        trackTelegramNetworkError(endpoint)
        logger.error('Network error:', errorMessage)
      }

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
