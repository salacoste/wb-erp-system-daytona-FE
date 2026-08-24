/**
 * Supply Planning Boundary Normalizer
 *
 * Normalizes response from GET /v1/analytics/supply-planning
 */

import { asRecord, toCount, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import type {
  SupplyPlanningResponse,
  SupplyPlanningMeta,
  SupplyPlanningSummary,
  SupplyPlanningItem,
  WarehouseStock,
  StockoutRisk,
  ReorderStatus,
  VelocityTrend,
} from '@/types/supply-planning'

/**
 * Honest enum lookups (Story 169.13, pattern #218/#226): unknown/absent values map to
 * 'unknown' — never coerced to an optimistic known tier ('healthy'/'ok').
 * Map-based, cast-free narrowing.
 */
const STOCKOUT_RISK_MAP: Record<string, StockoutRisk> = {
  out_of_stock: 'out_of_stock',
  critical: 'critical',
  warning: 'warning',
  low: 'low',
  healthy: 'healthy',
}

const REORDER_STATUS_MAP: Record<string, ReorderStatus> = {
  urgent: 'urgent',
  soon: 'soon',
  ok: 'ok',
}

function toStockoutRisk(value: unknown): StockoutRisk {
  return typeof value === 'string' ? (STOCKOUT_RISK_MAP[value] ?? 'unknown') : 'unknown'
}

function toReorderStatus(value: unknown): ReorderStatus {
  return typeof value === 'string' ? (REORDER_STATUS_MAP[value] ?? 'unknown') : 'unknown'
}

function normalizeWarehouseStock(raw: unknown): WarehouseStock {
  const r = asRecord(raw)
  return {
    name: toStr(r.name),
    stock: toCount(r.stock),
    office_id: toCount(r.office_id),
  }
}

function normalizeSupplyPlanningItem(raw: unknown): SupplyPlanningItem {
  const r = asRecord(raw)
  const warehouses = Array.isArray(r.warehouses) ? r.warehouses : []
  return {
    sku_id: toStr(r.sku_id),
    product_name: toStr(r.product_name),
    category: toOptionalString(r.category),
    brand: toOptionalString(r.brand),
    current_stock: toCount(r.current_stock),
    in_transit: toCount(r.in_transit),
    effective_stock: toCount(r.effective_stock),
    avg_daily_sales: toNullableNumber(r.avg_daily_sales),
    velocity_trend: (toStr(r.velocity_trend) || 'no_data') as VelocityTrend,
    days_until_stockout: toNullableNumber(r.days_until_stockout),
    stockout_date: toOptionalString(r.stockout_date) ?? null,
    stockout_risk: toStockoutRisk(r.stockout_risk),
    safety_stock_units: toCount(r.safety_stock_units),
    reorder_quantity: toCount(r.reorder_quantity),
    reorder_status: toReorderStatus(r.reorder_status),
    reorder_value: toNullableNumber(r.reorder_value) ?? undefined,
    cogs_per_unit: toNullableNumber(r.cogs_per_unit),
    // has_cogs is boolean in the backend schema (test-api/API-INDEX.json: "type": "boolean",
    // required) — Boolean() coercion is contract-faithful, not a boundary lie.
    has_cogs: Boolean(r.has_cogs),
    selling_price: toNullableNumber(r.selling_price),
    warehouses: warehouses.map(normalizeWarehouseStock),
  }
}

function normalizeSupplyPlanningSummary(raw: unknown): SupplyPlanningSummary {
  const r = asRecord(raw)
  return {
    total_skus: toCount(r.total_skus),
    out_of_stock_count: toCount(r.out_of_stock_count),
    stockout_critical: toCount(r.stockout_critical),
    stockout_warning: toCount(r.stockout_warning),
    stockout_low: toCount(r.stockout_low),
    healthy_stock: toCount(r.healthy_stock),
    reorder_urgent: toCount(r.reorder_urgent),
    reorder_soon: toCount(r.reorder_soon),
    total_in_transit_units: toCount(r.total_in_transit_units),
    total_reorder_value: toNullableNumber(r.total_reorder_value),
  }
}

function normalizeSupplyPlanningMeta(raw: unknown): SupplyPlanningMeta {
  const r = asRecord(raw)
  return {
    cabinet_id: toStr(r.cabinet_id),
    velocity_weeks: toCount(r.velocity_weeks),
    safety_stock_days: toCount(r.safety_stock_days),
    stocks_updated_at: toStr(r.stocks_updated_at),
    generated_at: toStr(r.generated_at),
  }
}

export function normalizeSupplyPlanningResponse(raw: unknown): SupplyPlanningResponse {
  const r = asRecord(raw)
  const data = Array.isArray(r.data) ? r.data : []
  return {
    meta: normalizeSupplyPlanningMeta(r.meta),
    summary: normalizeSupplyPlanningSummary(r.summary),
    data: data.map(normalizeSupplyPlanningItem),
  }
}
