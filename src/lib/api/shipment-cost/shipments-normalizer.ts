/**
 * Boundary normalizer for Shipments API
 * GET /v1/shipments, GET /v1/shipments/:id
 *
 * Backend returns Decimal strings for cost fields; FE types expect strings.
 * Nested pallets with box lines are normalized recursively.
 */

import {
  asRecord,
  toStr,
  toCount,
  toNullableNumber,
  toStringOrNull,
} from '@/lib/api/normalizer-helpers'
import type {
  Shipment,
  ShipmentListResponse,
  Pallet,
  BoxLine,
  DeliveryMode,
  ShipmentStatus,
} from '@/types/shipment-cost'

function normalizeBoxLine(raw: unknown): BoxLine {
  const d = asRecord(raw)
  return {
    id: toStr(d.id),
    palletId: toStr(d.palletId),
    nmId: toCount(d.nmId),
    boxCount: toCount(d.boxCount),
    totalUnits: toNullableNumber(d.totalUnits),
    unitCostRub: toStringOrNull(d.unitCostRub),
    boxVolume: toStringOrNull(d.boxVolume),
    totalVolume: toStringOrNull(d.totalVolume),
    volumeShare: toStringOrNull(d.volumeShare),
    allocatedDeliveryCost: toStringOrNull(d.allocatedDeliveryCost),
    deliveryCostPerUnit: toStringOrNull(d.deliveryCostPerUnit),
    finalCostPerUnit: toStringOrNull(d.finalCostPerUnit),
    finalCostLine: toStringOrNull(d.finalCostLine),
    createdAt: toStr(d.createdAt),
    updatedAt: toStr(d.updatedAt),
  }
}

function normalizePallet(raw: unknown): Pallet {
  const d = asRecord(raw)
  return {
    id: toStr(d.id),
    shipmentId: toStr(d.shipmentId),
    palletNumber: toCount(d.palletNumber),
    boxLines: Array.isArray(d.boxLines) ? d.boxLines.map(normalizeBoxLine) : [],
    createdAt: toStr(d.createdAt),
    updatedAt: toStr(d.updatedAt),
  }
}

/** Normalize a single Shipment */
export function normalizeShipment(raw: unknown): Shipment {
  const d = asRecord(raw)
  return {
    id: toStr(d.id),
    cabinetId: toStr(d.cabinetId),
    name: toStringOrNull(d.name),
    deliveryMode: (toStr(d.deliveryMode) || 'FIXED_VEHICLE') as DeliveryMode,
    totalDeliveryCost: toStringOrNull(d.totalDeliveryCost),
    palletRate: toStringOrNull(d.palletRate),
    status: (toStr(d.status) || 'DRAFT') as ShipmentStatus,
    createdBy: toStr(d.createdBy),
    confirmedBy: toStringOrNull(d.confirmedBy),
    confirmedAt: toStringOrNull(d.confirmedAt),
    supplyId: toStringOrNull(d.supplyId),
    pallets: Array.isArray(d.pallets) ? d.pallets.map(normalizePallet) : [],
    createdAt: toStr(d.createdAt),
    updatedAt: toStr(d.updatedAt),
  }
}

/** Normalize shipments list response */
export function normalizeShipmentListResponse(raw: unknown): ShipmentListResponse {
  const d = asRecord(raw)
  return {
    data: Array.isArray(d.data) ? d.data.map(normalizeShipment) : [],
    total: toCount(d.total),
    page: toCount(d.page),
    limit: toCount(d.limit),
  }
}
