/**
 * Monitor Summary Boundary Normalizer — Epic 92-FE Story 92.1
 *
 * Normalizes the raw response from GET /v1/analytics/monitor/summary into the
 * frontend-canonical MonitorSummaryResponse shape. Absorbs camelCase/snake_case
 * backend drift via dual-lookup and enforces the null-vs-zero invariant at the
 * boundary (counts → 0 default, money/ratios → null preserved).
 *
 * See CLAUDE.md § Boundary Normalizer Pattern (Story 88.4) for conventions.
 */

import type {
  MonitorSummaryResponse,
  PeriodMetrics,
  MonitorKpi,
} from '@/app/(dashboard)/monitor/types/monitor-summary'

function toNumberOrNull(raw: unknown): number | null {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function toCount(raw: unknown): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

function toStringOrNull(raw: unknown): string | null {
  return raw == null ? null : String(raw)
}

function normalizePeriodMetrics(raw: unknown): PeriodMetrics {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    salesCount: toCount(d.salesCount ?? d.sales_count),
    returnsCount: toCount(d.returnsCount ?? d.returns_count),
    revenue: toNumberOrNull(d.revenue),
    cogs: toNumberOrNull(d.cogs),
    expenses: toNumberOrNull(d.expenses),
    advertisingSpend: toNumberOrNull(d.advertisingSpend ?? d.advertising_spend),
    margin: toNumberOrNull(d.margin),
  }
}

function normalizeMonitorKpi(raw: unknown): MonitorKpi {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    totalProducts: toCount(d.totalProducts ?? d.total_products),
    productsWithCogs: toCount(d.productsWithCogs ?? d.products_with_cogs),
    cogsCoveragePercent: toNumberOrNull(d.cogsCoveragePercent ?? d.cogs_coverage_percent),
    buyoutRatePercent: toNumberOrNull(d.buyoutRatePercent ?? d.buyout_rate_percent),
    lastSyncAt: toStringOrNull(d.lastSyncAt ?? d.last_sync_at),
  }
}

export function normalizeMonitorSummaryResponse(raw: unknown): MonitorSummaryResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const periods = (r.periods ?? {}) as Record<string, unknown>
  return {
    periods: {
      today: normalizePeriodMetrics(periods.today),
      yesterday: normalizePeriodMetrics(periods.yesterday),
      last30Days: normalizePeriodMetrics(periods.last30Days ?? periods.last_30_days),
      prev30Days: normalizePeriodMetrics(periods.prev30Days ?? periods.prev_30_days),
    },
    kpi: normalizeMonitorKpi(r.kpi),
    generatedAt: toStringOrNull(r.generatedAt ?? r.generated_at),
  }
}
