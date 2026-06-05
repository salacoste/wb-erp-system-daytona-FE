/**
 * Boundary normalizer for POST /v1/shipments/:id/calculate
 * Epic 122-FE (#193 §2) — remaps nested pallet/lines to flat FE-canonical shape.
 *
 * Backend returns: { results: CalculatePalletResult[] } where each pallet has lines[].
 * FE expects:     { results: CalculationResultItem[] } — flat per-SKU rows.
 *
 * All numeric fields are native numbers (not Decimal strings) per #161 §7.1.
 */

import { toCount, toNullableNumber, toStr, asRecord } from '@/lib/api/normalizer-helpers'
import type {
  CalculatePalletResult,
  CalculateShipmentResponse,
  CalculationResultItem,
} from '@/types/shipment-calculation'

/** Normalize a single backend pallet line → FE flat item */
function normalizePalletLine(raw: unknown): CalculationResultItem {
  const line = asRecord(raw)
  return {
    nmId: toCount(line.nmId),
    productName: toStr(line.productName ?? line.nmId),
    unitCostRub: toNullableNumber(line.unitCostRub) ?? 0,
    deliveryCostPerUnit: toNullableNumber(line.deliveryCostPerUnit) ?? 0,
    finalCostPerUnit: toNullableNumber(line.finalCostPerUnit) ?? 0,
    totalUnits: toCount(line.totalUnits),
    finalCostLine: toNullableNumber(line.finalCostLine) ?? 0,
  }
}

/** Flatten backend pallet/lines into FE-canonical response */
export function normalizeCalculateResponse(raw: unknown): CalculateShipmentResponse {
  const resp = asRecord(raw)
  const results: CalculatePalletResult[] = Array.isArray(resp.results) ? resp.results : []
  const flatItems: CalculationResultItem[] = results.flatMap(pallet => {
    const p = asRecord(pallet)
    const lines: unknown[] = Array.isArray(p.lines) ? p.lines : []
    return lines.map(normalizePalletLine)
  })
  return {
    shipmentId: toStr(resp.shipmentId),
    deliveryMode: toStr(resp.deliveryMode),
    totalDeliveryCost: toNullableNumber(resp.totalDeliveryCost) ?? 0,
    totalFinalCost: toNullableNumber(resp.totalFinalCost) ?? 0,
    calculatedAt: toStr(resp.calculatedAt),
    results: flatItems,
  }
}
