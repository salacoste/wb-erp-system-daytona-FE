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
import type {
  OrderFbsDetails,
  OrderAddress,
  StatusHistoryBrief,
  SupplierStatus,
  WbStatus,
} from '@/types/orders'

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
  return {
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
    chrtId: toCount(d.chrtId ?? d.chrt_id),
    address: normalizeOrderAddress(d.address),
    statusHistory: Array.isArray(d.statusHistory)
      ? (d.statusHistory as unknown[]).map(normalizeStatusHistoryBrief)
      : Array.isArray(d.status_history)
        ? (d.status_history as unknown[]).map(normalizeStatusHistoryBrief)
        : [],
    processingTimeSeconds: toCount(d.processingTimeSeconds ?? d.processing_time_seconds),
    syncedAt: toStr(d.syncedAt ?? d.synced_at),
  }
}
