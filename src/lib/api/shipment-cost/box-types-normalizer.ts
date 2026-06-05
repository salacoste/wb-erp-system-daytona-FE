/**
 * Boundary normalizer for Box Types API
 * GET /v1/box-types, GET /v1/box-types/:id
 *
 * Backend returns Decimal strings for dimensions; FE types expect strings.
 * Normalizer ensures all fields are present and correctly typed.
 */

import { asRecord, toStr } from '@/lib/api/normalizer-helpers'
import type { BoxType, SkuPackagingBoxType } from '@/types/shipment-cost'

/** Normalize a single BoxType from backend response */
export function normalizeBoxType(raw: unknown): BoxType {
  const d = asRecord(raw)
  return {
    id: toStr(d.id),
    cabinetId: toStr(d.cabinetId),
    name: toStr(d.name),
    lengthCm: toStr(d.lengthCm),
    widthCm: toStr(d.widthCm),
    heightCm: toStr(d.heightCm),
    volumeCm3: toStr(d.volumeCm3),
    isActive: d.isActive === true,
    createdAt: toStr(d.createdAt),
    updatedAt: toStr(d.updatedAt),
  }
}

/** Normalize a BoxType list response */
export function normalizeBoxTypeList(raw: unknown): BoxType[] {
  return Array.isArray(raw) ? raw.map(normalizeBoxType) : []
}

/** Normalize embedded SkuPackagingBoxType (subset of BoxType) */
export function normalizeSkuPackagingBoxType(raw: unknown): SkuPackagingBoxType {
  const d = asRecord(raw)
  return {
    id: toStr(d.id),
    name: toStr(d.name),
    lengthCm: toStr(d.lengthCm),
    widthCm: toStr(d.widthCm),
    heightCm: toStr(d.heightCm),
    volumeCm3: toStr(d.volumeCm3),
    isActive: d.isActive === true,
  }
}

/** Normalize BoxType for POST/PUT responses (same shape as GET single) */
export function normalizeBoxTypeResponse(raw: unknown): BoxType {
  return normalizeBoxType(raw)
}
