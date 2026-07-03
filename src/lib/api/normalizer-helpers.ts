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

/**
 * Coerce a Prisma Decimal (serialized decimal.js) to number | null.
 *
 * Prisma serializes `Decimal` columns as the decimal.js internal shape `{s,e,d}`
 * (sign, exponent of the MSB, base-1e7 digit groups). This reconstructs the value
 * WITHOUT importing decimal.js at runtime. Falls through to number/string parsing
 * for backends that serialize decimals as plain numbers or strings.
 *
 *   - `s`: sign (1 positive, -1 negative)
 *   - `e`: decimal exponent of the most-significant digit (value = coeff × 10^(e-L+1))
 *   - `d`: digit groups — first group 1-7 digits, rest zero-padded to 7
 *
 * AP#8: ratio/money/quantity — preserves null, renders '—' (never collapses to 0).
 *
 * Reference sample (decimal.js-verified): `{s:1,e:4,d:[28765,3100000]}` → 28765.31.
 */
export function toDecimalNumber(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  if (typeof raw === 'string') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  // decimal.js `{s,e,d}` shape — narrow defensively (no `as` cast).
  if (typeof raw === 'object' && raw !== null) {
    const r = raw as Record<string, unknown>
    const s = r.s
    const e = r.e
    const d = r.d
    if (typeof s !== 'number' || typeof e !== 'number' || !Array.isArray(d)) return null
    // Build the coefficient string: first group as-is, rest zero-padded to 7 digits.
    const coeff = d
      .map((group: unknown, i: number) => {
        if (typeof group !== 'number' || !Number.isFinite(group) || group < 0) return null
        return i === 0 ? String(group) : String(group).padStart(7, '0')
      })
      .join('')
    // Any malformed group → abort (Defensive Frontend: indicate, never guess).
    if (coeff.length === 0 || coeff.includes('null')) return null
    const length = coeff.length
    const intLen = e + 1
    let intPart: string
    let fracPart: string
    if (intLen >= length) {
      // Pure integer (decimal point is at/after the last digit).
      intPart = coeff + '0'.repeat(intLen - length)
      fracPart = ''
    } else if (intLen > 0) {
      intPart = coeff.slice(0, intLen)
      fracPart = coeff.slice(intLen)
    } else {
      // Small fraction (e < 0): leading zeros before the coefficient.
      intPart = '0'
      fracPart = '0'.repeat(-intLen) + coeff
    }
    const numeric = Number((s < 0 ? '-' : '') + intPart + (fracPart ? `.${fracPart}` : ''))
    return Number.isFinite(numeric) ? numeric : null
  }
  return null
}
