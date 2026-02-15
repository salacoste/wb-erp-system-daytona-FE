/**
 * React Query Hooks for Orders Analytics
 * Story 40.2-FE: React Query Hooks for Orders Module
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Hooks for velocity metrics, SLA compliance, and volume analytics.
 * Uses ordersAnalyticsQueryKeys from API client for cache management.
 */

import { useQuery } from '@tanstack/react-query'
import {
  getVelocityMetrics,
  getSlaMetrics,
  getVolumeMetrics,
  ordersAnalyticsQueryKeys,
} from '@/lib/api/orders-analytics'
import type {
  VelocityMetricsParams,
  VelocityMetricsResponse,
  SlaMetricsParams,
  SlaMetricsResponse,
  VolumeMetricsParams,
  VolumeMetricsResponse,
} from '@/types/orders-analytics'

// Re-export query keys for external use
export { ordersAnalyticsQueryKeys }

// ============================================================================
// Velocity Metrics Hook
// ============================================================================

export interface UseVelocityMetricsOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch order processing velocity metrics
 * Returns average times, percentiles, and breakdowns
 * Cache config: staleTime 5min, gcTime 10min (historical aggregates)
 */
export function useVelocityMetrics(
  from: string,
  to: string,
  options: UseVelocityMetricsOptions = {}
) {
  const { enabled = true } = options
  const params: VelocityMetricsParams = { from, to }

  return useQuery<VelocityMetricsResponse, Error>({
    queryKey: ordersAnalyticsQueryKeys.velocity(params),
    queryFn: () => getVelocityMetrics(params),
    enabled: enabled && !!from && !!to,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// ============================================================================
// SLA Metrics Hook
// ============================================================================

export interface UseSlaMetricsOptions extends Partial<SlaMetricsParams> {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in ms (default: 60000 for real-time) */
  refetchInterval?: number
}

/**
 * Hook to fetch SLA compliance metrics
 * Returns compliance percentages and at-risk orders list
 * Real-time polling enabled by default (1 minute interval)
 * Cache config: staleTime 0 (real-time), gcTime 1min
 */
export function useSlaMetrics(options: UseSlaMetricsOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 60000, // 1 minute default
    confirmationSlaHours,
    completionSlaHours,
    atRiskLimit,
    atRiskOffset,
  } = options

  const params: SlaMetricsParams = {
    confirmationSlaHours,
    completionSlaHours,
    atRiskLimit,
    atRiskOffset,
  }

  return useQuery<SlaMetricsResponse, Error>({
    queryKey: ordersAnalyticsQueryKeys.sla(params),
    queryFn: () => getSlaMetrics(params),
    enabled,
    staleTime: 0, // Always fetch fresh for real-time SLA
    gcTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

// ============================================================================
// Volume Metrics Hook
// ============================================================================

export interface UseVolumeMetricsOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch order volume metrics
 * Returns hourly/daily trends, peak hours, cancellation rate
 * Cache config: staleTime 5min, gcTime 10min (historical aggregates)
 */
export function useVolumeMetrics(from: string, to: string, options: UseVolumeMetricsOptions = {}) {
  const { enabled = true } = options
  const params: VolumeMetricsParams = { from, to }

  return useQuery<VolumeMetricsResponse, Error>({
    queryKey: ordersAnalyticsQueryKeys.volume(params),
    queryFn: () => getVolumeMetrics(params),
    enabled: enabled && !!from && !!to,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
