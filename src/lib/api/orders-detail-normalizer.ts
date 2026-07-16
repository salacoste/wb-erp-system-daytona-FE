/**
 * Boundary normalizer for Order Details
 * GET /v1/orders/:orderId
 *
 * Normalizes a single OrderFbsDetails response with nested address
 * and status history. The list endpoint already uses orders-normalizer.
 */

import {
  asRecord,
  toStr,
  toCount,
  toNullableNumber,
  toStringOrNull,
} from '@/lib/api/normalizer-helpers'
import { isValidOperationalStatus } from '@/types/orders-guards'
import { isIsoCalendarDate } from '@/lib/order-expiration-date'
import type {
  OrderFbsDetails,
  OrderAddress,
  StatusHistoryBrief,
  SupplierStatus,
  WbStatus,
  OrderOperationalStatus,
  ExpirationMeta,
} from '@/types/orders'

/** Story O1: default operational status when backend omits it or sends an unknown value */
const DEFAULT_OPERATIONAL_STATUS: OrderOperationalStatus = 'NEW'

function normalizeExpirationMeta(raw: unknown): ExpirationMeta | null {
  if (raw == null) return null
  const d = asRecord(raw)
  const requirement = d.requirement
  const value = d.value
  const reconciliationRequired = d.reconciliationRequired ?? d.reconciliation_required ?? false
  const manualEditable = d.manualEditable ?? d.manual_editable ?? d.editable
  const fefoAvailable = d.fefoAvailable ?? d.fefo_available ?? d.editable
  if (
    (requirement !== 'required' && requirement !== 'optional') ||
    (value !== null && !isIsoCalendarDate(value)) ||
    typeof d.decision !== 'string' ||
    typeof d.editable !== 'boolean' ||
    typeof manualEditable !== 'boolean' ||
    typeof fefoAvailable !== 'boolean' ||
    typeof reconciliationRequired !== 'boolean' ||
    !isIsoCalendarDate(d.minimumDate)
  ) {
    return null
  }
  return {
    requirement,
    value,
    decision: d.decision,
    editable: d.editable,
    manualEditable,
    fefoAvailable,
    reconciliationRequired,
    minimumDate: d.minimumDate,
  }
}

function normalizeOrderAddress(raw: unknown): OrderAddress | null {
  if (raw == null) return null
  const d = asRecord(raw)
  return {
    fullAddress: toStringOrNull(d.fullAddress ?? d.full_address),
    longitude: toNullableNumber(d.longitude),
    latitude: toNullableNumber(d.latitude),
  }
}

function normalizeStatusHistoryBrief(raw: unknown): StatusHistoryBrief {
  const d = asRecord(raw)
  return {
    supplierStatus: toStr(d.supplierStatus) as SupplierStatus,
    wbStatus: toStr(d.wbStatus) as WbStatus,
    changedAt: toStr(d.changedAt ?? d.changed_at),
  }
}

/** Normalize GET /v1/orders/:orderId response */
export function normalizeOrderDetail(raw: unknown): OrderFbsDetails {
  const d = asRecord(raw)
  const operationalRaw = d.operationalStatus ?? d.operational_status
  return {
    // Story O1: id is the OrderFbs UUID (primary mutation key). AP#10 opaque UUID.
    id: typeof d.id === 'string' ? d.id : String(d.id ?? ''),
    orderId: toStr(d.orderId ?? d.order_id),
    orderUid: toStr(d.orderUid ?? d.order_uid),
    nmId: toCount(d.nmId ?? d.nm_id),
    vendorCode: toStr(d.vendorCode ?? d.vendor_code),
    productName: toStringOrNull(d.productName ?? d.product_name),
    price: toCount(d.price),
    salePrice: toCount(d.salePrice ?? d.sale_price),
    supplierStatus: toStr(d.supplierStatus ?? d.supplier_status) as SupplierStatus,
    wbStatus: toStr(d.wbStatus ?? d.wb_status) as WbStatus,
    warehouseId: toCount(d.warehouseId ?? d.warehouse_id),
    deliveryType: toStr(d.deliveryType ?? d.delivery_type),
    isB2B: d.isB2B === true || d.is_b2b === true,
    cargoType: toStringOrNull(d.cargoType ?? d.cargo_type),
    createdAt: toStr(d.createdAt ?? d.created_at),
    statusUpdatedAt: toStr(d.statusUpdatedAt ?? d.status_updated_at),
    operationalStatus: isValidOperationalStatus(operationalRaw)
      ? operationalRaw
      : DEFAULT_OPERATIONAL_STATUS,
    operationalStatusUpdatedAt: toStringOrNull(
      d.operationalStatusUpdatedAt ?? d.operational_status_updated_at
    ),
    chrtId: toCount(d.chrtId ?? d.chrt_id),
    address: normalizeOrderAddress(d.address),
    statusHistory: Array.isArray(d.statusHistory)
      ? (d.statusHistory as unknown[]).map(normalizeStatusHistoryBrief)
      : Array.isArray(d.status_history)
        ? (d.status_history as unknown[]).map(normalizeStatusHistoryBrief)
        : [],
    processingTimeSeconds: toCount(d.processingTimeSeconds ?? d.processing_time_seconds),
    syncedAt: toStr(d.syncedAt ?? d.synced_at),
    expirationMeta: normalizeExpirationMeta(d.expirationMeta ?? d.expiration_meta),
  }
}
