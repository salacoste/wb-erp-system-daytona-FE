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
      const response = await fetch(url, { ...options, headers })

      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      if (!response.ok) {
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

      trackTelegramNetworkError(endpoint)
      logger.error('Network error:', errorMessage)

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
