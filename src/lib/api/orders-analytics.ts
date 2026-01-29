/**
 * Orders Analytics API Client
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * API functions for order velocity, SLA compliance, and volume analytics.
 */

import { apiClient } from '../api-client'
import type {
  VelocityMetricsParams,
  VelocityMetricsResponse,
  SlaMetricsParams,
  SlaMetricsResponse,
  VolumeMetricsParams,
  VolumeMetricsResponse,
} from '@/types/orders-analytics'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build query string from params object
 * Filters out undefined/null values
 */
function buildQueryString(
  params: VelocityMetricsParams | SlaMetricsParams | VolumeMetricsParams
): string {
  const searchParams = new URLSearchParams()
  const entries = Object.entries(params) as [string, unknown][]

  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

// ============================================================================
// Velocity Metrics
// ============================================================================

/**
 * Get order processing velocity metrics
 * GET /v1/analytics/orders/velocity
 *
 * @param params - Date range parameters (from, to)
 * @returns Velocity metrics with averages, percentiles, and breakdowns
 */
export async function getVelocityMetrics(
  params: VelocityMetricsParams
): Promise<VelocityMetricsResponse> {
  const queryString = buildQueryString(params)

  console.info('[Orders Analytics] Fetching velocity metrics:', params)

  return apiClient.get<VelocityMetricsResponse>(`/v1/analytics/orders/velocity?${queryString}`, {
    skipDataUnwrap: true,
  })
}

// ============================================================================
// SLA Metrics
// ============================================================================

/**
 * Get SLA compliance metrics
 * GET /v1/analytics/orders/sla
 *
 * @param params - SLA thresholds and at-risk pagination params
 * @returns SLA compliance percentages and at-risk orders list
 */
export async function getSlaMetrics(params: SlaMetricsParams): Promise<SlaMetricsResponse> {
  const queryString = buildQueryString(params)
  const url = queryString ? `/v1/analytics/orders/sla?${queryString}` : '/v1/analytics/orders/sla'

  console.info('[Orders Analytics] Fetching SLA metrics:', params)

  return apiClient.get<SlaMetricsResponse>(url, { skipDataUnwrap: true })
}

// ============================================================================
// Volume Metrics
// ============================================================================

/**
 * Get order volume metrics
 * GET /v1/analytics/orders/volume
 *
 * @param params - Date range parameters (from, to)
 * @returns Volume trends, peak hours, and status breakdown
 */
export async function getVolumeMetrics(
  params: VolumeMetricsParams
): Promise<VolumeMetricsResponse> {
  const queryString = buildQueryString(params)

  console.info('[Orders Analytics] Fetching volume metrics:', params)

  return apiClient.get<VolumeMetricsResponse>(`/v1/analytics/orders/volume?${queryString}`, {
    skipDataUnwrap: true,
  })
}

// ============================================================================
// Query Keys Factory (for React Query)
// ============================================================================

export const ordersAnalyticsQueryKeys = {
  all: ['orders-analytics'] as const,
  velocity: (params: VelocityMetricsParams) =>
    [...ordersAnalyticsQueryKeys.all, 'velocity', params] as const,
  sla: (params: SlaMetricsParams) => [...ordersAnalyticsQueryKeys.all, 'sla', params] as const,
  volume: (params: VolumeMetricsParams) =>
    [...ordersAnalyticsQueryKeys.all, 'volume', params] as const,
}
