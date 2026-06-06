/**
 * Decimal parsing utility for Shipment Cost Allocation.
 *
 * Per the #161 contract the backend returns Prisma DECIMAL fields as strings ("96000.0000").
 * Request #193 resolved: backend now wraps all Prisma Decimal fields with Number() before
 * serialization. The old Decimal.js object shim ({s,e,d}) has been removed as dead code.
 */

/**
 * Parse a backend Decimal value into a number.
 * Handles: "96000.0000" → 96000, 42 → 42, null/undefined/""/"NaN" → 0.
 */
export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (value === '') return 0
  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}
