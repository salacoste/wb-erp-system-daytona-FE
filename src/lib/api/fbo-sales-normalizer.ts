/**
 * FBO Sales Boundary Normalizer
 *
 * Normalizes responses from FBO sales endpoints.
 * Extracted from orders-fbo-normalizer.ts for 200-line compliance.
 */

import { asRecord, toCount, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import type {
  SaleFboItem,
  SalesFboListResponse,
  SalesFboAggregateResponse,
  FboAggregateDateRange,
} from '@/types/orders-fbo'

// --- Scalar helper (shared with orders-fbo-normalizer) ---

export function normalizeDateRange(raw: unknown): FboAggregateDateRange {
  const r = asRecord(raw)
  return {
    from: typeof r.from === 'string' ? r.from : null,
    to: typeof r.to === 'string' ? r.to : null,
  }
}

// --- Item normalizer ---

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

// --- Pagination helper (shared pattern) ---

export function normalizePagination(raw: unknown): {
  total: number
  limit: number
  offset: number
} {
  const p = asRecord(raw)
  return {
    total: toCount(p.total),
    limit: toCount(p.limit),
    offset: toCount(p.offset),
  }
}
