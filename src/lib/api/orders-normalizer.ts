/**
 * Orders Boundary Normalizer — Epic 122-FE (#200)
 *
 * Normalizes GET /v1/orders and GET /v1/orders/:id responses.
 * Catches enum drift on wbStatus/supplierStatus — maps unknown values
 * to safe fallbacks so components never crash on unexpected backend data.
 *
 * AP#8: order counts/pagination are SEMANTIC-ZERO (toCount);
 * price fields are non-nullable numbers (toCount — backend sends 0 for free).
 */

import {
  asRecord,
  toCount,
  toStr,
  toOptionalString,
  toStringOrNull,
} from '@/lib/api/normalizer-helpers'
import {
  isValidWbStatus,
  isValidSupplierStatus,
  isValidOperationalStatus,
} from '@/types/orders-guards'
import type {
  WbStatus,
  SupplierStatus,
  OrderOperationalStatus,
  OrderFbsItem,
  OrdersListResponse,
  OrdersPagination,
  OrdersQueryInfo,
} from '@/types/orders'

/** Fallback for unknown WB statuses — renders with default label */
const UNKNOWN_WB_STATUS: WbStatus = 'waiting'

/** Fallback for unknown supplier statuses */
const UNKNOWN_SUPPLIER_STATUS: SupplierStatus = 'new'

/** Fallback for unknown operational statuses (Story O1) — default per backend */
const DEFAULT_OPERATIONAL_STATUS: OrderOperationalStatus = 'NEW'

function normalizeWbStatus(raw: unknown): WbStatus {
  if (isValidWbStatus(raw)) return raw
  return UNKNOWN_WB_STATUS
}

function normalizeSupplierStatus(raw: unknown): SupplierStatus {
  if (isValidSupplierStatus(raw)) return raw
  return UNKNOWN_SUPPLIER_STATUS
}

/** Story O1: normalize operational status — unknown values fall back to NEW */
function normalizeOperationalStatus(raw: unknown): OrderOperationalStatus {
  if (isValidOperationalStatus(raw)) return raw
  return DEFAULT_OPERATIONAL_STATUS
}

/** Normalize a single order row from the list endpoint */
export function normalizeOrderItem(raw: unknown): OrderFbsItem {
  const r = asRecord(raw)
  return {
    // Story O1: id is the OrderFbs UUID (primary mutation key), NOT WB orderId.
    // AP#10: opaque UUID via String() — `String(raw)` mangles objects, so guard first.
    id: typeof r.id === 'string' ? r.id : String(r.id ?? ''),
    orderId: toStr(r.orderId),
    orderUid: toOptionalString(r.orderUid) ?? '',
    nmId: toCount(r.nmId),
    vendorCode: toOptionalString(r.vendorCode) ?? '',
    productName: typeof r.productName === 'string' ? r.productName : null,
    price: toCount(r.price),
    salePrice: toCount(r.salePrice),
    supplierStatus: normalizeSupplierStatus(r.supplierStatus),
    wbStatus: normalizeWbStatus(r.wbStatus),
    warehouseId: toCount(r.warehouseId),
    deliveryType: toStr(r.deliveryType),
    isB2B: r.isB2B === true,
    cargoType: typeof r.cargoType === 'string' ? r.cargoType : null,
    createdAt: toStr(r.createdAt),
    statusUpdatedAt: toStr(r.statusUpdatedAt),
    operationalStatus: normalizeOperationalStatus(r.operationalStatus),
    // AP#8: null until first transition — preserve null, render «—» in UI.
    operationalStatusUpdatedAt: toStringOrNull(r.operationalStatusUpdatedAt),
  }
}

function normalizePagination(raw: unknown): OrdersPagination {
  const p = asRecord(raw)
  return {
    total: toCount(p.total),
    limit: toCount(p.limit),
    offset: toCount(p.offset),
  }
}

function normalizeQueryInfo(raw: unknown): OrdersQueryInfo {
  const q = asRecord(raw)
  return {
    from: typeof q.from === 'string' ? q.from : null,
    to: typeof q.to === 'string' ? q.to : null,
  }
}

/** Normalize GET /v1/orders response */
export function normalizeOrdersResponse(raw: unknown): OrdersListResponse {
  const r = asRecord(raw)
  const rawItems = Array.isArray(r.items) ? r.items : []
  return {
    items: rawItems.map(normalizeOrderItem),
    pagination: normalizePagination(r.pagination),
    query: normalizeQueryInfo(r.query),
  }
}
