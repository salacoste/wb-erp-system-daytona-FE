/**
 * Shared Table Formatting Utilities
 * Used by TopProductsTable and TopBrandsTable
 * Extracted: Epic 74, Story 74.6
 */

// Canonical Russian-locale percent formatter (comma decimal + NBSP, e.g. "15,5 %").
// iter-69: formatPercent was the dot-locale form (no comma, no NBSP) → migrated to canonical
// (dot-locale percent consolidation — see docs/process/dot-locale-percent-consolidation-proposal.md).
import { formatPercentage } from '@/lib/utils'

/** Format currency value in Russian locale */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a percent-units value (0-100 scale, e.g. margin_pct/contribution_pct) in Russian locale.
 * null → em dash (anti-pattern #8: a missing ratio is unknown, not 0). Fixed 1 decimal.
 */
export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return formatPercentage(value, 1)
}

/**
 * Get margin color class based on value — canonical 168.3 tier semantics
 * (Story 174.2 dedupe: this is the single source; the former local copies in
 * TopProductsTableRow/TopBrandsTableRow are removed):
 *   null → muted; excellent (>=30) → financial-positive; good (>=15) and
 *   fair (>=0) → status-warning; poor (<0) → financial-negative.
 * Good/fair share the warning valence — /80 text opacity on text is avoided
 * per the §11.3 contrast debt; the remaining pre-existing text-/80 sites repo-wide
 * (pricing/automation/cashflow/popover families) are registered follow-up debt.
 */
export function getMarginColor(margin: number | null): string {
  if (margin === null) return 'text-muted-foreground'
  if (margin >= 30) return 'text-financial-positive'
  if (margin >= 0) return 'text-status-warning'
  return 'text-financial-negative'
}
