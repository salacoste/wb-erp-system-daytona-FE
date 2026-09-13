import { asRecord, toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'
import {
  normalizeSearchCoverage,
  normalizeSearchDataStatus,
} from '@/lib/api/search-coverage-normalizer'
import type { DashboardSearchAnalytics } from '@/app/(dashboard)/monitoring/types/monitoring'

/**
 * Task-139.7 boundary normalizer for the monitoring dashboard's search analytics
 * block (BE: monitoring/dto/dashboard-summary.dto.ts DashboardSearchAnalyticsDto).
 *
 * Consumed by the canonical dashboard normalizer (../monitoring-normalizer.ts →
 * normalizeMonitoringDashboardResponse) — this module deliberately does NOT
 * normalize the whole dashboard (no duplicated normalization at two call sites).
 */
export function normalizeDashboardSearchAnalytics(raw: unknown): DashboardSearchAnalytics {
  const r = asRecord(raw)
  const coverage = normalizeSearchCoverage(r.coverage)
  const rawStatus = normalizeSearchDataStatus(r.status)
  const status = !coverage.coverageKnown
    ? coverage.status === 'error'
      ? 'error'
      : 'unknown'
    : coverage.coverageComplete
      ? rawStatus === 'complete' || rawStatus === 'no_data'
        ? rawStatus
        : 'unknown'
      : coverage.status
  const rawTopQueries = Array.isArray(r.topQueries) ? r.topQueries : []

  return {
    totalQueries: toCount(r.totalQueries),
    totalSearchImpressions: toCount(r.totalSearchImpressions),
    totalSearchClicks: toCount(r.totalSearchClicks),
    totalSearchOrders: toCount(r.totalSearchOrders),
    avgSearchPosition: toNullableNumber(r.avgSearchPosition),
    topQueries: rawTopQueries.map(item => {
      const query = asRecord(item)
      return {
        query: toStr(query.query),
        impressions: toCount(query.impressions),
        orders: toCount(query.orders),
      }
    }),
    coverage,
    status,
  }
}
