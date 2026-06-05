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
    avg_daily_sales: toNullableNumber(r.avg_daily_sales) ?? 0,
    velocity_trend: (toStr(r.velocity_trend) || 'no_data') as VelocityTrend,
    days_until_stockout: toNullableNumber(r.days_until_stockout),
    stockout_date: toOptionalString(r.stockout_date) ?? null,
    stockout_risk: (toStr(r.stockout_risk) || 'healthy') as StockoutRisk,
    safety_stock_units: toCount(r.safety_stock_units),
    reorder_quantity: toCount(r.reorder_quantity),
    reorder_status: (toStr(r.reorder_status) || 'ok') as ReorderStatus,
    reorder_value: toNullableNumber(r.reorder_value) ?? undefined,
    cogs_per_unit: toNullableNumber(r.cogs_per_unit),
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
    total_reorder_value: toNullableNumber(r.total_reorder_value) ?? 0,
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
