/**
 * Monitor Pipeline Utilities — Epic 92-FE Story 92.5
 * Helpers for Block 4 (Buyout Gauge) and Block 5 (Pipeline Health).
 *
 * STATUS_COLORS/STATUS_LABELS re-exported from @/lib/monitoring-constants (Story 93.1 extraction).
 */

import type { GridPipeline } from '@/app/(dashboard)/monitoring/types/monitoring'

// ---------------------------------------------------------------------------
// Block 4: Buyout Gauge helpers
// ---------------------------------------------------------------------------

/**
 * 3-band color mapping for buyout rate gauge (doc-1 Block 4 spec).
 *
 * NOTE: BuyoutRateCard.tsx uses a simpler 80% cutoff (green/red only).
 * The gauge uses doc-1's 3-band spec (null/gray, <70/red, 70-89/amber, >=90/green)
 * because it has spatial real estate for a middle band; the card did not.
 * This divergence is INTENTIONAL — different visualizations, different budgets.
 */
export function getBuyoutColor(rate: number | null): {
  color: string
  textClass: string
  bandLabel: string
} {
  if (rate == null)
    return {
      color: 'var(--color-muted-foreground)',
      textClass: 'text-muted-foreground',
      bandLabel: 'Нет данных',
    }
  if (rate >= 90)
    return {
      color: 'var(--color-chart-positive)',
      textClass: 'text-status-success',
      bandLabel: 'Отличный',
    }
  if (rate >= 70)
    return {
      color: 'var(--color-status-warning)',
      textClass: 'text-status-warning',
      bandLabel: 'Требует внимания',
    }
  return {
    color: 'var(--color-chart-negative)',
    textClass: 'text-status-error',
    bandLabel: 'Низкий',
  }
}

// ---------------------------------------------------------------------------
// Block 5: Pipeline Health helpers
// ---------------------------------------------------------------------------

/**
 * Return the pipeline with the most recent lastSuccessAt (non-null), or null.
 */
export function getMostRecentRecalc(
  pipelines: GridPipeline[]
): { displayName: string; lastSuccessAt: string; dataLagDisplay: string | null } | null {
  const withSuccess = pipelines
    .filter((p): p is GridPipeline & { lastSuccessAt: string } => p.lastSuccessAt != null)
    .sort((a, b) => new Date(b.lastSuccessAt).getTime() - new Date(a.lastSuccessAt).getTime())

  if (withSuccess.length === 0) return null
  const first = withSuccess[0]
  return {
    displayName: first.displayName,
    lastSuccessAt: first.lastSuccessAt,
    dataLagDisplay: first.dataLagDisplay,
  }
}

/**
 * Return pipelines with status !== 'healthy', preserving original order.
 */
export function getUnhealthyPipelines(pipelines: GridPipeline[]): GridPipeline[] {
  return pipelines.filter(p => p.status !== 'healthy')
}

/**
 * Russian relative time string using manual math — mirrors PipelineStatusGrid.tsx:54-63.
 * M-8 fix: replaced date-fns formatDistanceToNow (AC-3 said "mirrors PipelineStatusGrid")
 * with the same manual-math implementation used in PipelineStatusGrid.tsx:54-63.
 * Accepts string | null: null → "—" (consistent with PipelineStatusGrid's null guard).
 */
export function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return '—'
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} мин назад`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ч назад`
  return `${Math.floor(diffHours / 24)} дн назад`
}

// ---------------------------------------------------------------------------
// Status display constants — re-exported from @/lib/monitoring-constants (Story 93.1)
// ---------------------------------------------------------------------------

export { STATUS_COLORS, STATUS_LABELS } from '@/lib/monitoring-constants'
