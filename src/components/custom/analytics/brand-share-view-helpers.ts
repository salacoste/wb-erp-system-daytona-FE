/**
 * BrandShareView pure helpers — Story 170.4.
 * Extracted so the View stays under the 200-line cap and the logic is
 * unit-testable without hook mocking (house convention).
 */
import type { BrandDateRangeLike, BrandParentSubjectLike } from './brand-share-view-types'

/** True when both dates are set and dateFrom is strictly after dateTo. */
export function isInvalidBrandShareRange(range: BrandDateRangeLike): boolean {
  if (!range.dateFrom || !range.dateTo) return false
  return range.dateFrom > range.dateTo
}

/** Format a YYYY-MM-DD as DD.MM.YYYY for the filter-context subtitle. */
function formatRuDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

/**
 * Human period label for the chart card subtitle.
 * null when no dates are set — caller falls back to «последние 7 дней».
 */
export function formatBrandSharePeriodLabel(range: BrandDateRangeLike): string | null {
  if (range.dateFrom && range.dateTo) {
    return `${formatRuDate(range.dateFrom)} — ${formatRuDate(range.dateTo)}`
  }
  if (range.dateFrom) return `с ${formatRuDate(range.dateFrom)}`
  if (range.dateTo) return `по ${formatRuDate(range.dateTo)}`
  return null
}

/** Resolve the selected category id → its user-facing name (null → «—»). */
export function resolveBrandShareCategoryName(
  subjects: BrandParentSubjectLike[],
  parentId: number | null
): string | null {
  if (parentId == null) return null
  return subjects.find(s => s.parentId === parentId)?.parentName ?? null
}
