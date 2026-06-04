/**
 * Shared normalizer helper functions — Story 120.1-FE.
 *
 * DRY extraction from 11 boundary normalizers. Every normalizer in src/lib/api/
 * that coerces unknown backend shapes MUST use these helpers instead of inline
 * private copies. Precedent: Story 107.1-FE `nullPreservingSum`
 * (src/lib/aggregation-helpers.ts).
 *
 * AP#8 split (active rule):
 *   - Counts / totals → `toCount` (null/missing → 0, the known empty-state value)
 *   - Ratios / money → `toNullableNumber` (null → null, renders '—')
 *   - String fields → `toStringOrNull` (non-string → null, Defensive Frontend)
 *   - Optional string fields → `toOptionalString` (non-string → undefined)
 *   - String with fallback → `toStr` (non-string → '')
 *
 * Naming convention: normalizers import { toCount, toNullableNumber } from here;
 * per-normalizer type-narrowing helpers (e.g. `toGroupBy`) stay local.
 */

/**
 * Coerce unknown to a finite number, defaulting to 0.
 * For counts, totals, pagination — where null means "no data" and 0 is correct.
 * AP#8: counts/pagination exception — `?? 0` is legitimate here.
 */
export function toCount(raw: unknown): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

/**
 * Coerce unknown to number | null.
 * For ratios, money, rates — where null means "unknown" and must NOT collapse to 0.
 * AP#8: ratio/money fields — preserves null, renders '—' in UI.
 */
export function toNullableNumber(raw: unknown): number | null {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/**
 * Coerce unknown to string | null. Rejects non-string inputs.
 * Defensive Frontend: `String({})` produces "[object Object]" — never coerce blindly.
 */
export function toStringOrNull(raw: unknown): string | null {
  return typeof raw === 'string' ? raw : null
}

/**
 * Coerce unknown to string | undefined. For optional string fields (`?:`).
 * Non-string → undefined (preserves optional-property semantics).
 */
export function toOptionalString(raw: unknown): string | undefined {
  return typeof raw === 'string' ? raw : undefined
}

/**
 * Coerce unknown to string, defaulting to empty string.
 * For required string fields where '' is the safe fallback.
 */
export function toStr(raw: unknown): string {
  return typeof raw === 'string' ? raw : ''
}

/**
 * Coerce unknown to Record<string, unknown>. Returns {} for non-objects.
 * Used to safely access properties on raw backend responses.
 */
export function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}
