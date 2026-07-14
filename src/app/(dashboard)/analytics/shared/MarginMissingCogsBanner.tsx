'use client'

import { MissingCogsAlert } from '@/components/custom/MissingCogsAlert'
import type { MarginAnalyticsAggregated } from '@/types/cogs/products'

/**
 * Sum the products lacking COGS across brand/category aggregation rows.
 *
 * BD-5 CTA half: when COGS is unassigned the margin/profit cells are degenerate
 * (already suppressed to «—» per row in MarginAggregatedTableRow). This count
 * powers the page-level «Назначить COGS» banner so the seller sees an actionable
 * CTA, not just greyed cells.
 *
 * Two sources, in priority order:
 *  1. `missing_cogs_count` — backend's per-entity missing-SKU count (preferred,
 *     handles partial-COGS entities). Absent on stale/cached responses.
 *  2. Fallback: an entity whose `cogs === 0` has NO COGS at all → every one of
 *     its `total_skus` lacks COGS. This is exactly the period-wide COGS-absent
 *     case from validation (raw response carries no `missing_cogs_count`).
 */
export function sumMissingCogs(items: readonly MarginAnalyticsAggregated[]): number {
  return items.reduce<number>((sum, item) => {
    const explicit = item.missing_cogs_count ?? 0
    if (explicit > 0) return sum + explicit
    if ((item.cogs ?? 0) === 0) return sum + (item.total_skus ?? 0)
    return sum
  }, 0)
}

interface MarginMissingCogsBannerProps {
  data: MarginAnalyticsAggregated[] | undefined
}

/**
 * Page-top «Товары без себестоимости» banner for the by-brand / by-category margin
 * pages. Renders nothing when every entity has COGS. Reuses the canonical
 * MissingCogsAlert (CTA → /cogs?has_cogs=false, dismissible).
 */
export function MarginMissingCogsBanner({ data }: MarginMissingCogsBannerProps) {
  const missingCount = sumMissingCogs(data ?? [])
  return <MissingCogsAlert missingCount={missingCount} />
}
