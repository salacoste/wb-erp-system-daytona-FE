/**
 * Unit Economics Formatters — Russian locale
 * Extracted from unit-economics-config.ts (200-line ESLint cap, batch 2)
 *
 * NOTE: These are LOCAL copies of the canonical `@/lib/utils` formatters, kept ON PURPOSE:
 * - formatPercentage: pins min=max=decimals (default 1) for table alignment + null/non-finite guard
 * - formatCurrency: whole-ruble output (maxFractionDigits:0) + '—' for zero (FUTURE: revisit)
 * Do NOT "harmonize" with the canonical without reading the inline FUTURE/NOTE comments above each.
 */

/**
 * Format percentage value in Russian locale (e.g. 15.5 → "15,5 %").
 * iter-58: was `${value.toFixed(1)}%` → "15.5%" (dot decimal, no space) — a Russian-locale
 * violation (frontend/CLAUDE.md: formatPercentage(15.5) → "15,5 %"). `value` is already in
 * percent units (0-100), matching the canonical `@/lib/utils` formatPercentage domain; we
 * format with Intl `style:'percent'` over value/100 to get the comma decimal + NBSP separator.
 * NOTE: kept as a local copy (not a re-export of `@/lib/utils` formatPercentage) ON PURPOSE —
 * this one pins min=max=decimals (default exactly 1 decimal) for right-aligned table-column
 * alignment, whereas the canonical allows 1-2 decimals. It ALSO adds a null/undefined/non-finite
 * guard (→ '—') absent from the canonical (which takes a non-nullable number). Do NOT "harmonize".
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  // Anti-pattern #8: null/undefined ratio (backend sends net_margin_pct/cogs/avg_* as null when
  // revenue=0 or COGS is unassigned) must render "—", never a fabricated "0,0 %". Intl.format(null)
  // would otherwise coerce null→0. A real 0 still renders "0,0 %".
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Format currency value in RUB (whole rubles — maxFractionDigits:0 is a deliberate
 * declutter choice for this page, distinct from the canonical `@/lib/utils` formatCurrency).
 *
 * FUTURE (iter-58 deferred — needs a product decision): `value === 0 → '—'` masks a GENUINE
 * 0₽ as "no data" (anti-pattern #8-adjacent). `item.revenue` (UnitEconomicsTableRow.tsx) and
 * `summary.total_revenue`/`total_your_price` (UnitEconomicsSummaryCards.tsx) flow here UNGUARDED,
 * so a real zero-sales SKU renders "—" indistinguishable from missing. Resolve the UX question
 * (show "0 ₽" vs "—" vs row-suppress) before changing — entangled with the whole-ruble design.
 */
export function formatCurrency(value: number): string {
  if (value === 0) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return '0'
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toFixed(0)
}

/**
 * Format margin with sign and color hint
 */
export function formatMargin(marginPct: number): { text: string; className: string } {
  const sign = marginPct > 0 ? '+' : ''
  // Russian locale via the in-file formatPercentage (comma + NBSP); '+' prefix for positives,
  // Intl emits the minus for negatives, none for 0. Was the dot-locale toFixed-then-percent form.
  const text = `${sign}${formatPercentage(marginPct, 1)}`

  if (marginPct >= 25) return { text, className: 'text-green-600' }
  if (marginPct >= 15) return { text, className: 'text-lime-600' }
  if (marginPct >= 5) return { text, className: 'text-yellow-600' }
  if (marginPct >= 0) return { text, className: 'text-orange-600' }
  return { text, className: 'text-red-600' }
}
