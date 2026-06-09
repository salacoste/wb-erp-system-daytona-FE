/**
 * FBO Orders Boundary Normalizer
 *
 * Normalizes responses from FBO order endpoints.
 * Sales normalizers extracted to fbo-sales-normalizer.ts for 200-line compliance.
 */

import { asRecord, toCount, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import { normalizeDateRange, normalizePagination } from './fbo-sales-normalizer'
import type {
  OrderFboItem,
  OrderFboDetail,
  FboOrdersListResponse,
  FboOrdersAggregateResponse,
  FboOrdersSyncStatusResponse,
  FboOrdersSyncTriggerResponse,
  FboOrdersBackfillResponse,
} from '@/types/orders-fbo'

// --- Item normalizers ---

export function normalizeFboOrderItem(raw: unknown): OrderFboItem {
  const r = asRecord(raw)
  return {
    id: toStr(r.id),
    orderId: toStr(r.orderId),
    srid: toStr(r.srid),
    nmId: toCount(r.nmId),
    supplierArticle: toStr(r.supplierArticle),
    barcode: typeof r.barcode === 'string' ? r.barcode : null,
    brand: toStr(r.brand),
    subject: toStr(r.subject),
    category: toOptionalString(r.category) ?? null,
    totalPrice: toCount(r.totalPrice),
    discountPercent: toCount(r.discountPercent),
    spp: toNullableNumber(r.spp),
    finishedPrice: toCount(r.finishedPrice),
    priceWithDisc: toCount(r.priceWithDisc),
    warehouseName: toStr(r.warehouseName),
    regionName: typeof r.regionName === 'string' ? r.regionName : null,
    orderDate: toStr(r.orderDate),
    isCancel: r.isCancel === true,
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  }
}

export function normalizeFboOrderDetail(raw: unknown): OrderFboDetail {
  const item = normalizeFboOrderItem(raw)
  const r = asRecord(raw)
  return {
    ...item,
    deliveryDate: typeof r.deliveryDate === 'string' ? r.deliveryDate : null,
    countryName: typeof r.countryName === 'string' ? r.countryName : null,
  }
}

// --- Response normalizers ---

export function normalizeFboOrdersListResponse(raw: unknown): FboOrdersListResponse {
  const r = asRecord(raw)
  const rawItems = Array.isArray(r.data) ? r.data : Array.isArray(r.items) ? r.items : []
  const rawPagination = asRecord(r.meta)
  return {
    items: rawItems.map(normalizeFboOrderItem),
    pagination: normalizePagination(
      Object.keys(rawPagination).length > 0 ? rawPagination : r.pagination
    ),
  }
}

export function normalizeFboOrdersAggregateResponse(raw: unknown): FboOrdersAggregateResponse {
  const r = asRecord(raw)
  return {
    count: toCount(r.count),
    totalPrice: toCount(r.totalPrice),
    totalFinishedPrice: toCount(r.totalFinishedPrice),
    avgPrice: toNullableNumber(r.avgPrice),
    avgFinishedPrice: toNullableNumber(r.avgFinishedPrice),
    cancelledCount: toCount(r.cancelledCount),
    cancelRate: toNullableNumber(r.cancelRate),
    dateRange: normalizeDateRange(r.dateRange),
  }
}

export function normalizeFboSyncStatusResponse(raw: unknown): FboOrdersSyncStatusResponse {
  const r = asRecord(raw)
  return {
    enabled: r.enabled === true,
    schedule: toStr(r.schedule),
    timezone: toStr(r.timezone),
  }
}

export function normalizeFboSyncTriggerResponse(raw: unknown): FboOrdersSyncTriggerResponse {
  const r = asRecord(raw)
  return {
    jobId: toStr(r.jobId),
    message: toStr(r.message),
    priority: toStr(r.priority),
  }
}

export function normalizeFboBackfillResponse(raw: unknown): FboOrdersBackfillResponse {
  const r = asRecord(raw)
  return {
    jobId: toStr(r.jobId),
    message: toStr(r.message),
  }
}
