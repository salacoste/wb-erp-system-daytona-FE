/**
 * Decimal parsing utility for Shipment Cost Allocation.
 *
 * Per the #161 contract the backend SHOULD return Prisma DECIMAL fields as strings ("96000.0000").
 * iter-65 (request #193): the live backend instead serializes them as Decimal.js INTERNAL objects,
 * e.g. 708.33 → {s:1,e:2,d:[708,3333000]}. The old `parseFloat({…})` → NaN → 0 silently fabricated
 * a 0 across box-type dimensions and shipment costs (the `value ? … : '—'` guards never fired
 * because an object is truthy). This shim reconstructs the value from the {s,e,d} object so the
 * feature renders correct numbers until the backend serialization is fixed — then it can be removed.
 */

/** Decimal.js internal JSON shape: sign (±1), exponent of the leading digit, base-1e7 digit groups. */
interface DecimalObject {
  s: number
  e: number
  d: number[]
}

function isDecimalObject(value: unknown): value is DecimalObject {
  if (typeof value !== 'object' || value === null) return false
  const o = value as Record<string, unknown>
  // Require numeric digit groups so a malformed object can't slip through to Number(String({}))→NaN→0
  // (which would re-introduce the silent-0 fabrication this shim exists to kill).
  return (
    typeof o.s === 'number' &&
    typeof o.e === 'number' &&
    Array.isArray(o.d) &&
    o.d.every(group => typeof group === 'number')
  )
}

/**
 * Reconstruct a number from a Decimal.js {s,e,d} internal object.
 * Digit groups concatenate (d[0] verbatim, the rest left-padded to 7), the leading digit sits at
 * decimal exponent `e`, and `s` carries the sign. Float precision is ample for currency display.
 */
function decimalObjectToNumber(o: DecimalObject): number {
  if (o.d.length === 0) return 0
  const digits =
    String(o.d[0]) +
    o.d
      .slice(1)
      .map(group => String(group).padStart(7, '0'))
      .join('')
  const magnitude = Number(digits) * Math.pow(10, o.e - digits.length + 1)
  return Number.isFinite(magnitude) ? (o.s < 0 ? -magnitude : magnitude) : 0
}

/**
 * Parse a backend Decimal value into a number.
 * Handles: "96000.0000" → 96000, 42 → 42, {s,e,d} Decimal.js object → reconstructed value,
 * null/undefined/""/"NaN" → 0.
 */
export function parseDecimal(value: string | number | null | undefined | DecimalObject): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  // PENDING BACKEND: #193 §1 — remove this object branch once the backend serializes DECIMAL as
  // strings; the string path below then handles it and this becomes dead code.
  if (isDecimalObject(value)) return decimalObjectToNumber(value)
  if (value === '') return 0
  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}
