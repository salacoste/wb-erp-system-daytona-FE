/**
 * Centralized API Client
 * Story 1.5: API Client Layer & Authentication Headers
 * Epic 34-FE: Analytics tracking for Telegram notification endpoints
 */

import { env } from './env'
import { useAuthStore } from '@/stores/authStore'
import { ApiError, type ApiRequestOptions, type ApiResponse } from '@/types/api'
import { TelegramMetrics } from './analytics/telegram-metrics'

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
  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
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
          response.status === 401 &&
          errorMessage.includes('WB API token')

        if (!isExpectedWbTokenError) {
          console.error(
            `API Error [${response.status}]:`,
            isJson ? JSON.stringify(errorData, null, 2) : errorData,
          )
        }

        throw new ApiError(
          errorMessage,
          response.status,
          errorData,
        )
      }

      if (isJson) {
        const rawData: ApiResponse<T> = await response.json()

        // DEBUG: Log raw response for COGS assignment endpoint
        if (endpoint.includes('/products/') && endpoint.includes('/cogs')) {
          console.group('🔍 [API Client DEBUG] COGS Assignment Response')
          console.log('Endpoint:', endpoint)
          console.log('Raw response:', JSON.stringify(rawData, null, 2))
          console.log('Response structure:', {
            hasDataField: 'data' in rawData,
            dataFieldType: typeof (rawData as Record<string, unknown>).data,
            directFields: Object.keys(rawData as Record<string, unknown>),
          })
          console.groupEnd()
        }

        // Story 24: Support skipDataUnwrap option for complex responses
        // Some endpoints return responses with 'data' field plus other fields (period, summary, pagination)
        // Auto-unwrapping loses those fields. Use skipDataUnwrap: true to get full response.
        const data = options.skipDataUnwrap
          ? (rawData as T)
          : ((rawData.data ?? rawData) as T)

        // DEBUG: Log processed data for COGS assignment
        if (endpoint.includes('/products/') && endpoint.includes('/cogs')) {
          console.group('🔍 [API Client DEBUG] Processed COGS Response')
          console.log('Processed data:', JSON.stringify(data, null, 2))
          if (typeof data === 'object' && data !== null) {
            const productData = data as Record<string, unknown>
            console.log('Key fields:', {
              nm_id: productData.nm_id,
              has_cogs: productData.has_cogs,
              current_margin_pct: productData.current_margin_pct,
              current_margin_pct_type: typeof productData.current_margin_pct,
              missing_data_reason: productData.missing_data_reason,
              cogs: productData.cogs,
            })
          }
          console.groupEnd()
        }

        return data
      }

      return (await response.text()) as unknown as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Network error occurred'

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

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
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

