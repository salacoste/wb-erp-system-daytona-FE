/**
 * Storage Analytics Queries — Boundary Normalizer
 *
 * Normalizes raw backend responses from storage by-sku and top-consumers endpoints.
 *
 * Endpoints:
 *   1. GET /v1/analytics/storage/by-sku
 *   2. GET /v1/analytics/storage/top-consumers
 *
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import { asRecord, toCount, toNullableNumber, toStr, toStringOrNull } from './normalizer-helpers'
import type {
  StorageBySkuResponse,
  StorageBySkuItem,
  StoragePeriod,
  StorageSummary,
  StoragePagination,
  TopConsumersResponse,
  TopConsumerItem,
} from '@/types/storage-analytics'

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function normalizePeriod(raw: unknown, fallbackFrom = '', fallbackTo = ''): StoragePeriod {
  const p = asRecord(raw)
  return {
    from: toStr(p.from ?? p.weekStart) || fallbackFrom,
    to: toStr(p.to ?? p.weekEnd) || fallbackTo,
    days_count: toCount(p.days_count ?? p.daysCount),
  }
}

function normalizeSkuItem(raw: unknown): StorageBySkuItem {
  const d = asRecord(raw)
  return {
    nm_id: toStr(d.nm_id ?? d.nmId),
    vendor_code: toStringOrNull(d.vendor_code ?? d.vendorCode),
    product_name: toStringOrNull(d.product_name ?? d.productName),
    brand: toStringOrNull(d.brand),
    // AP#8: money fields preserve null — null renders '—', not "0 ₽".
    storage_cost_total: toNullableNumber(d.storage_cost_total ?? d.storageCostTotal),
    storage_cost_avg_daily: toNullableNumber(d.storage_cost_avg_daily ?? d.storageCostAvgDaily),
    volume_avg: toNullableNumber(d.volume_avg ?? d.volumeAvg),
    warehouses: Array.isArray(d.warehouses) ? d.warehouses.map(String) : [],
    days_stored: toCount(d.days_stored ?? d.daysStored),
    total_stock: toNullableNumber(d.total_stock ?? d.totalStock),
    last_charge_date: toStringOrNull(d.last_charge_date ?? d.lastChargeDate),
    has_warehouse_stock: !!d.has_warehouse_stock,
  }
}

function normalizeTopConsumerItem(raw: unknown): TopConsumerItem {
  const d = asRecord(raw)
  return {
    rank: toCount(d.rank),
    nm_id: toStr(d.nm_id ?? d.nmId),
    vendor_code: toStringOrNull(d.vendor_code ?? d.vendorCode),
    product_name: toStringOrNull(d.product_name ?? d.productName),
    brand: toStringOrNull(d.brand),
    // AP#8: money field preserves null — null renders '—', not "0 ₽".
    storage_cost: toNullableNumber(d.storage_cost ?? d.storageCost),
    percent_of_total: toNullableNumber(d.percent_of_total ?? d.percentOfTotal) ?? 0,
    volume: toNullableNumber(d.volume),
    revenue_net: toNullableNumber(d.revenue_net ?? d.revenueNet) ?? undefined,
    storage_to_revenue_ratio:
      toNullableNumber(d.storage_to_revenue_ratio ?? d.storageToRevenueRatio) ?? undefined,
    total_stock: toNullableNumber(d.total_stock ?? d.totalStock),
    last_charge_date: toStringOrNull(d.last_charge_date ?? d.lastChargeDate),
    has_warehouse_stock: !!d.has_warehouse_stock,
  }
}

// ---------------------------------------------------------------------------
// Exported normalizers
// ---------------------------------------------------------------------------

/**
 * Normalizes the by-sku response envelope into StorageBySkuResponse.
 * Handles 3 backend shapes: `{ data: [...] }`, bare array, and fallback empty.
 */
export function normalizeStorageBySkuResponse(
  raw: unknown,
  weekStart: string,
  weekEnd: string
): StorageBySkuResponse {
  const r = asRecord(raw)
  const rawSummary = asRecord(r.summary)
  const items = Array.isArray(r.data) ? r.data : Array.isArray(raw) ? raw : []
  const summary: StorageSummary = {
    total_storage_cost: toNullableNumber(rawSummary.total_storage_cost ?? r.total_storage_cost),
    products_count: toCount(rawSummary.products_count ?? r.products_count ?? items.length),
    // AP#8: avg cost is a money ratio — preserve null (render '—'), not 0.
    avg_cost_per_product: toNullableNumber(
      rawSummary.avg_cost_per_product ?? r.avg_cost_per_product
    ),
  }
  const rawPagination = asRecord(r.pagination)
  const pagination: StoragePagination = {
    total: toCount(rawPagination.total ?? r.total ?? items.length),
    cursor: toStringOrNull(rawPagination.cursor ?? r.cursor) ?? null,
    has_more: !!(rawPagination.has_more ?? r.has_more),
  }
  return {
    period: normalizePeriod(r.period, weekStart, weekEnd),
    data: items.map(normalizeSkuItem),
    summary,
    pagination,
    has_data: items.length > 0,
  }
}

/**
 * Normalizes the top-consumers response envelope into TopConsumersResponse.
 */
export function normalizeTopConsumersResponse(raw: unknown): TopConsumersResponse {
  const r = asRecord(raw)
  const consumers = Array.isArray(r.top_consumers) ? r.top_consumers : []
  return {
    period: normalizePeriod(r.period),
    top_consumers: consumers.map(normalizeTopConsumerItem),
    total_storage_cost: toNullableNumber(r.total_storage_cost),
    has_data: !!r.has_data || consumers.length > 0,
  }
}
