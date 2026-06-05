/**
 * Boundary normalizer for SKU Packaging API
 * GET /v1/sku-packaging, GET /v1/sku-packaging/:nmId
 *
 * Normalizes nested product + boxType objects alongside packaging fields.
 */

import { asRecord, toStr, toCount } from '@/lib/api/normalizer-helpers'
import type { SkuPackaging, SkuPackagingProduct } from '@/types/shipment-cost'
import { normalizeSkuPackagingBoxType } from './box-types-normalizer'

function normalizeSkuPackagingProduct(raw: unknown): SkuPackagingProduct {
  const d = asRecord(raw)
  return {
    nmId: toCount(d.nmId),
    vendorCode: toStr(d.vendorCode),
    brand: toStr(d.brand),
    subject: toStr(d.subject),
  }
}

/** Normalize a single SkuPackaging from backend response */
export function normalizeSkuPackaging(raw: unknown): SkuPackaging {
  const d = asRecord(raw)
  return {
    nmId: toCount(d.nmId),
    cabinetId: toStr(d.cabinetId),
    boxTypeId: toStr(d.boxTypeId),
    unitsPerBox: toCount(d.unitsPerBox),
    boxType: normalizeSkuPackagingBoxType(d.boxType),
    product: normalizeSkuPackagingProduct(d.product),
    createdAt: toStr(d.createdAt),
    updatedAt: toStr(d.updatedAt),
  }
}

/** Normalize a SkuPackaging list response */
export function normalizeSkuPackagingList(raw: unknown): SkuPackaging[] {
  return Array.isArray(raw) ? raw.map(normalizeSkuPackaging) : []
}
