/**
 * FBS Historical Analytics API Client
 * Story 51.1-FE: FBS Analytics Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 * Reference: test-api/15-analytics-fbs.http
 */

import { apiClient } from '@/lib/api-client'
import type {
  FbsTrendsParams,
  TrendsResponse,
  FbsSeasonalParams,
  SeasonalResponse,
  FbsCompareParams,
  CompareResponse,
  BackfillStatusResponse,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillActionResponse,
} from '@/types/fbs-analytics'

// ============================================================================
// Analytics API Functions (Public - All Roles)
// ============================================================================

/**
 * Получение исторических трендов заказов
 * GET /v1/analytics/orders/trends
 */
export async function getFbsTrends(params: FbsTrendsParams): Promise<TrendsResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('from', params.from)
  searchParams.set('to', params.to)
  if (params.aggregation) searchParams.set('aggregation', params.aggregation)
  if (params.metrics?.length) searchParams.set('metrics', params.metrics.join(','))

  console.info('[FBS Analytics] Fetching trends:', {
    from: params.from,
    to: params.to,
    aggregation: params.aggregation ?? 'day',
  })

  const response = await apiClient.get<TrendsResponse>(
    `/v1/analytics/orders/trends?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )

  console.info('[FBS Analytics] Trends response:', {
    dataPoints: response.trends?.length ?? 0,
    period: response.period?.daysIncluded ?? 0,
  })

  return response
}

/**
 * Получение анализа сезонных паттернов
 * GET /v1/analytics/orders/seasonal
 */
export async function getFbsSeasonal(params?: FbsSeasonalParams): Promise<SeasonalResponse> {
  const searchParams = new URLSearchParams()
  if (params?.months) searchParams.set('months', params.months.toString())
  if (params?.view) searchParams.set('view', params.view)

  console.info('[FBS Analytics] Fetching seasonal patterns:', {
    months: params?.months ?? 12,
    view: params?.view ?? 'all',
  })

  const queryStr = searchParams.toString()
  const url = queryStr
    ? `/v1/analytics/orders/seasonal?${queryStr}`
    : '/v1/analytics/orders/seasonal'

  const response = await apiClient.get<SeasonalResponse>(url, { skipDataUnwrap: true })

  console.info('[FBS Analytics] Seasonal response:', {
    hasMonthly: !!response.patterns?.monthly,
    hasWeekday: !!response.patterns?.weekday,
    hasQuarterly: !!response.patterns?.quarterly,
  })

  return response
}

/**
 * Сравнение двух временных периодов
 * GET /v1/analytics/orders/compare
 */
export async function getFbsCompare(params: FbsCompareParams): Promise<CompareResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('period1_from', params.period1From)
  searchParams.set('period1_to', params.period1To)
  searchParams.set('period2_from', params.period2From)
  searchParams.set('period2_to', params.period2To)

  console.info('[FBS Analytics] Fetching comparison:', {
    period1: `${params.period1From} - ${params.period1To}`,
    period2: `${params.period2From} - ${params.period2To}`,
  })

  const response = await apiClient.get<CompareResponse>(
    `/v1/analytics/orders/compare?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )

  console.info('[FBS Analytics] Comparison response:', {
    ordersChange: response.comparison?.ordersChangePercent ?? 0,
    revenueChange: response.comparison?.revenueChangePercent ?? 0,
  })

  return response
}

// ============================================================================
// Backfill Admin API Functions (Owner Only)
// ============================================================================

/**
 * Получение статуса бэкфилла для всех или конкретного кабинета
 * GET /v1/admin/backfill/status
 */
export async function getBackfillStatus(cabinetId?: string): Promise<BackfillStatusResponse> {
  const queryParams = cabinetId ? `?cabinetId=${cabinetId}` : ''

  console.info('[FBS Analytics] Fetching backfill status:', { cabinetId: cabinetId ?? 'all' })

  const response = await apiClient.get<BackfillStatusResponse>(
    `/v1/admin/backfill/status${queryParams}`,
    { skipDataUnwrap: true }
  )

  console.info('[FBS Analytics] Backfill status:', { cabinetCount: response?.length ?? 0 })

  return response
}

/**
 * Запуск бэкфилла исторических данных
 * POST /v1/admin/backfill/start
 */
export async function startBackfill(request: StartBackfillRequest): Promise<StartBackfillResponse> {
  console.info('[FBS Analytics] Starting backfill:', {
    cabinetId: request.cabinetId ?? 'all',
    dataSource: request.dataSource,
  })

  const response = await apiClient.post<StartBackfillResponse>('/v1/admin/backfill/start', request)

  console.info('[FBS Analytics] Backfill started:', {
    jobCount: response.jobCount,
    success: response.success,
  })

  return response
}

/**
 * Приостановка бэкфилла для кабинета
 * POST /v1/admin/backfill/pause
 */
export async function pauseBackfill(cabinetId: string): Promise<BackfillActionResponse> {
  console.info('[FBS Analytics] Pausing backfill:', { cabinetId })
  return apiClient.post<BackfillActionResponse>('/v1/admin/backfill/pause', { cabinetId })
}

/**
 * Возобновление приостановленного бэкфилла
 * POST /v1/admin/backfill/resume
 */
export async function resumeBackfill(cabinetId: string): Promise<BackfillActionResponse> {
  console.info('[FBS Analytics] Resuming backfill:', { cabinetId })
  return apiClient.post<BackfillActionResponse>('/v1/admin/backfill/resume', { cabinetId })
}

// ============================================================================
// Query Keys Factory (for React Query)
// ============================================================================

/** Фабрика ключей кэша для FBS аналитики */
export const fbsAnalyticsQueryKeys = {
  all: ['fbs-analytics'] as const,
  trends: (params: FbsTrendsParams) => [...fbsAnalyticsQueryKeys.all, 'trends', params] as const,
  seasonal: (params?: FbsSeasonalParams) =>
    [...fbsAnalyticsQueryKeys.all, 'seasonal', params ?? {}] as const,
  compare: (params: FbsCompareParams) => [...fbsAnalyticsQueryKeys.all, 'compare', params] as const,
}

/** Фабрика ключей кэша для бэкфилла */
export const backfillQueryKeys = {
  all: ['backfill'] as const,
  status: (cabinetId?: string) => [...backfillQueryKeys.all, 'status', cabinetId ?? 'all'] as const,
}

// ============================================================================
// Cache Configuration
// ============================================================================

/** Конфигурация кэширования FBS аналитики (соответствует TTL бэкенда 5 минут) */
export const FBS_ANALYTICS_CACHE = {
  staleTime: 5 * 60 * 1000, // 5 минут
  gcTime: 30 * 60 * 1000, // 30 минут
} as const
