/**
 * Shared query-string helper — extracted from per-module duplicates (Story 92.1 M-3).
 *
 * Usage: build a URLSearchParams-safe query suffix from a params record.
 * Values that are `undefined` or empty-string are omitted; numbers are coerced via String().
 *
 *   qs({ cabinetId, from, days: 7 }) → "?cabinetId=...&from=...&days=7"
 *   qs({}) → ""
 */
export function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v))
  }
  const str = sp.toString()
  return str ? `?${str}` : ''
}
