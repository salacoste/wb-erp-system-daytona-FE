/**
 * NEW-7 — Finances display formatters.
 *
 * `formatCurrency` (from @/lib/utils) requires a non-null number. Money fields
 * from the WB balance API are nullable (AP#8 — null renders '—', never 0). This
 * module bridges the two: null → '—', number → formatted RUB.
 */

import { formatCurrency } from '@/lib/utils'

/**
 * Format nullable money → RUB currency string, or '—' when null/invalid.
 * AP#8: preserves null (does NOT collapse to 0).
 */
export function formatNullableCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return formatCurrency(value)
}
