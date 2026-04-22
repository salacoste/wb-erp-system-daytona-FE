/**
 * Monitor Dashboard types — Epic 92-FE Story 92.1
 * Backend endpoint: GET /v1/analytics/monitor/summary
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 * - Counts → `number` (0 is legitimate: "no sales today")
 * - Money / ratios → `number | null` (null is "unknown / not yet computed")
 *
 * Consumer stories (92.2 KPI cards, 92.3 metrics table) MUST render `—` for null,
 * not `0 ₽`. The type itself forces the invariant at the call site.
 */

export interface PeriodMetrics {
  salesCount: number
  returnsCount: number
  revenue: number | null
  cogs: number | null
  expenses: number | null
  advertisingSpend: number | null
  margin: number | null
}

export interface MonitorKpi {
  totalProducts: number
  productsWithCogs: number
  cogsCoveragePercent: number | null
  buyoutRatePercent: number | null
  lastSyncAt: string | null
}

export interface MonitorSummaryResponse {
  periods: {
    today: PeriodMetrics
    yesterday: PeriodMetrics
    last30Days: PeriodMetrics
    prev30Days: PeriodMetrics
  }
  kpi: MonitorKpi
  // Nullable: backend contract says always-present, but normalizer preserves null for
  // missing-field visibility at the boundary (Story 92.1 H-2). Consumers must guard
  // before `new Date(generatedAt)` — see Story 87.2 precedent for silent-drift fix.
  generatedAt: string | null
}

export type MonitorPeriodKey = 'today' | 'yesterday' | 'last30Days' | 'prev30Days'
