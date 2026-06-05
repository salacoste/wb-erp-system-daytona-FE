/**
 * Boundary normalizer for FCU Aggregation API
 * GET /v1/shipment-cost/by-sku
 *
 * Per-SKU FCU data from the most recently confirmed shipment.
 * Money/ratio fields (dcu, fcu) use toNullableNumber per anti-pattern #8.
 */

import { asRecord, toStr, toCount, toNullableNumber } from '@/lib/api/normalizer-helpers'
import type { FcuBySkuItem } from './fcu-aggregation-api'

/** Normalize a single FCU-by-SKU item */
export function normalizeFcuBySkuItem(raw: unknown): FcuBySkuItem {
  const d = asRecord(raw)
  return {
    nmId: toCount(d.nmId),
    productName: toStr(d.productName),
    latestPcu: toNullableNumber(d.latestPcu) ?? 0,
    latestDcu: toNullableNumber(d.latestDcu),
    latestFcu: toNullableNumber(d.latestFcu),
    shipmentId: toStr(d.shipmentId),
    shipmentName: toStr(d.shipmentName),
    confirmedAt: toStr(d.confirmedAt),
  }
}

/** Normalize FCU aggregation list response */
export function normalizeFcuBySkuList(raw: unknown): FcuBySkuItem[] {
  return Array.isArray(raw) ? raw.map(normalizeFcuBySkuItem) : []
}
