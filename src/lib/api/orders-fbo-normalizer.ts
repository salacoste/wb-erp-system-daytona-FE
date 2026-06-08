/**
 * FBO Orders & Sales Boundary Normalizer
 *
 * Normalizes responses from FBO order and sales endpoints.
 * Uses shared normalizer-helpers for AP#8-safe coercion.
 */

import { asRecord, toCount, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import type {
  OrderFboItem,
  OrderFboDetail,
  FboOrdersListResponse,
  FboOrdersPagination,
  FboOrdersAggregateResponse,
  FboOrdersSyncStatusResponse,
  FboOrdersSyncTriggerResponse,
  FboOrdersBackfillResponse,
  SaleFboItem,
  SalesFboListResponse,
  SalesFboAggregateResponse,
  FboAggregateDateRange,
} from '@/types/orders-fbo'

// --- Scalar helpers ---

function normalizeDateRange(raw: unknown): FboAggregateDateRange {
  const r = asRecord(raw)
  return {
    from: typeof r.from === 'string' ? r.from : null,
    to: typeof r.to === 'string' ? r.to : null,
  }
}

function normalizePagination(raw: unknown): FboOrdersPagination {
  const p = asRecord(raw)
  return {
    total: toCount(p.total),
    limit: toCount(p.limit),
    offset: toCount(p.offset),
  }
}

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

export function normalizeSaleFboItem(raw: unknown): SaleFboItem {
  const r = asRecord(raw)
  return {
    id: toStr(r.id),
    srid: toStr(r.srid),
    odid: toCount(r.odid),
    nmId: toCount(r.nmId),
    supplierArticle: toStr(r.supplierArticle),
    brand: toStr(r.brand),
    subject: toStr(r.subject),
    category: toOptionalString(r.category) ?? null,
    finishedPrice: toCount(r.finishedPrice),
    forPay: toCount(r.forPay),
    isStorno: r.isStorno === true,
    saleDate: toStr(r.saleDate),
    warehouseName: toStr(r.warehouseName),
    regionName: typeof r.regionName === 'string' ? r.regionName : null,
    createdAt: toStr(r.createdAt),
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

export function normalizeSalesFboListResponse(raw: unknown): SalesFboListResponse {
  const r = asRecord(raw)
  const rawItems = Array.isArray(r.data) ? r.data : Array.isArray(r.items) ? r.items : []
  const rawPagination = asRecord(r.meta)
  return {
    items: rawItems.map(normalizeSaleFboItem),
    pagination: normalizePagination(
      Object.keys(rawPagination).length > 0 ? rawPagination : r.pagination
    ),
  }
}

export function normalizeSalesFboAggregateResponse(raw: unknown): SalesFboAggregateResponse {
  const r = asRecord(raw)
  return {
    count: toCount(r.count),
    totalFinishedPrice: toCount(r.totalFinishedPrice),
    totalForPay: toCount(r.totalForPay),
    returnsCount: toCount(r.returnsCount),
    returnsRevenue: toNullableNumber(r.returnsRevenue),
    returnRate: toNullableNumber(r.returnRate),
    avgSaleValue: toNullableNumber(r.avgSaleValue),
    dateRange: normalizeDateRange(r.dateRange),
  }
}
