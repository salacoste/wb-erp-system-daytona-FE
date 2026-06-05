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

import { asRecord, toCount, toStr, toOptionalString } from '@/lib/api/normalizer-helpers'
import { isValidWbStatus, isValidSupplierStatus } from '@/types/orders-guards'
import type {
  WbStatus,
  SupplierStatus,
  OrderFbsItem,
  OrdersListResponse,
  OrdersPagination,
  OrdersQueryInfo,
} from '@/types/orders'

/** Fallback for unknown WB statuses — renders with default label */
const UNKNOWN_WB_STATUS: WbStatus = 'waiting'

/** Fallback for unknown supplier statuses */
const UNKNOWN_SUPPLIER_STATUS: SupplierStatus = 'new'

function normalizeWbStatus(raw: unknown): WbStatus {
  if (isValidWbStatus(raw)) return raw
  return UNKNOWN_WB_STATUS
}

function normalizeSupplierStatus(raw: unknown): SupplierStatus {
  if (isValidSupplierStatus(raw)) return raw
  return UNKNOWN_SUPPLIER_STATUS
}

/** Normalize a single order row from the list endpoint */
export function normalizeOrderItem(raw: unknown): OrderFbsItem {
  const r = asRecord(raw)
  return {
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
