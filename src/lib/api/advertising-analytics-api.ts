/**
 * Advertising Analytics API - Core analytics endpoint and error handling
 *
 * Extracted from advertising-analytics.ts for Epic 74 file size compliance.
 * @see Story 33.1-fe: Types & API Client
 */

import { apiClient } from '../api-client'
import type {
  AdvertisingAnalyticsParams,
  AdvertisingAnalyticsResponse,
} from '@/types/advertising-analytics'
import { normalizeAdvertisingResponse } from './advertising-analytics-normalizer'

/** Localized error messages for advertising analytics API errors (AC4). */
export const advertisingErrorMessages: Record<number, string> = {
  400: 'Неверные параметры запроса',
  401: 'Требуется авторизация',
  403: 'Нет доступа к этому кабинету',
  404: 'Данные не найдены',
  500: 'Ошибка сервера. Попробуйте позже',
}

/** Get localized error message for HTTP status code. */
export function getAdvertisingErrorMessage(statusCode: number): string {
  return advertisingErrorMessages[statusCode] ?? 'Произошла неизвестная ошибка'
}

/**
 * Build query string from params object. Filters out undefined/null values.
 * Arrays sent as repeated params. Single-element arrays duplicated for NestJS array parsing.
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      if (value.length === 0) continue

      // NestJS quirk: single param = string, repeated param = array
      // For arrays with 1 element, send parameter twice to force array parsing
      if (value.length === 1) {
        searchParams.append(key, String(value[0]))
        searchParams.append(key, String(value[0]))
      } else {
        value.forEach(item => {
          searchParams.append(key, String(item))
        })
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

/**
 * Get advertising analytics data. GET /v1/analytics/advertising
 * Returns performance metrics aggregated by the specified view_by mode.
 */
export async function getAdvertisingAnalytics(
  params: AdvertisingAnalyticsParams
): Promise<AdvertisingAnalyticsResponse> {
  // Request #76: Backend now supports efficiency_filter (server-side filtering)
  const queryParams = buildQueryString({ ...params })

  console.info('[Advertising Analytics] Fetching analytics:', {
    from: params.from,
    to: params.to,
    view_by: params.view_by ?? 'sku',
    group_by: params.group_by ?? 'sku', // Epic 36: Log grouping mode
    efficiency_filter: params.efficiency_filter ?? 'all',
    sort_by: params.sort_by ?? 'spend',
    sort_order: params.sort_order ?? 'desc',
    include_daily: params.include_daily ?? false,
  })

  const backendResponse = await apiClient.get<unknown>(`/v1/analytics/advertising?${queryParams}`, {
    skipDataUnwrap: true,
  })

  return normalizeAdvertisingResponse(backendResponse, params.from, params.to, params.view_by)
}
