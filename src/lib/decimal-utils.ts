/**
 * Decimal parsing utility for Shipment Cost Allocation
 * Backend returns Prisma DECIMAL fields as strings ("96000.0000").
 * Exception: /calculate response returns numbers directly.
 * Source: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md#11
 */

/**
 * Parse a Decimal-as-string value from the backend into a number.
 * Handles: "96000.0000" → 96000, 42 → 42, null → 0, "" → 0, "NaN" → 0
 */
export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (value === '') return 0
  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}
