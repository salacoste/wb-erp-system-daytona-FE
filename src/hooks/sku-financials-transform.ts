/**
 * Transform functions for SKU Financials Analytics
 * Epic 31: Complete Per-SKU Financial Analytics
 *
 * Converts backend snake_case API responses to frontend camelCase format.
 * Extracted from useSkuFinancials.ts for file size compliance (Epic 74).
 */

import type { SkuFinancialsResponse, SkuFinancialItem } from '@/types/sku-financials'
import type { BackendSkuItem, BackendResponse } from './sku-financials-types'

/**
 * Transform backend snake_case response to frontend camelCase format
 * Maps backend DTO structure to frontend SkuFinancialItem
 */
export function transformBackendItem(item: BackendSkuItem): SkuFinancialItem {
  const revenueNet = item.sales.revenue_net - item.returns.revenue_net

  return {
    nmId: parseInt(item.nm_id, 10),
    productName: item.sa_name,
    category: item.category || null,
    brand: item.brand || null,
    // Quantity: salesQty is RAW count (returns NOT subtracted)
    quantity: {
      salesQty: item.sales.quantity,
      returnsQty: item.returns.quantity,
    },
    revenue: {
      gross: item.sales.revenue_gross - item.returns.revenue_gross,
      net: revenueNet,
    },
    costs: {
      cogs: item.cogs?.total ?? null,
      logistics: item.expenses.logistics_total,
      storage: item.expenses.storage,
      penalties: item.expenses.penalties,
      paidAcceptance: item.expenses.paid_acceptance,
      otherAdjustments: item.expenses.other_adjustments ?? 0, // Request #68
    },
    visibility: item.visibility_breakdown
      ? {
          commission: item.visibility_breakdown.commission_total,
          acquiring: item.visibility_breakdown.acquiring_fee,
        }
      : undefined,
    profit: {
      gross: item.gross_profit ?? 0,
      operating: item.operating_profit ?? 0,
      operatingMarginPct: item.operating_margin_pct ?? 0,
    },
    profitabilityStatus: item.profitability_status,
    missingCogs: item.cogs === null,
  }
}

/**
 * Transform full backend response to frontend format
 * Handles error responses gracefully
 */
export function transformBackendResponse(backend: BackendResponse): SkuFinancialsResponse {
  // Safety check: if backend response is malformed or error, throw to trigger React Query error state
  if (!backend || !backend.meta || !backend.data) {
    const errorResponse = backend as unknown as { error?: { message?: string } }
    throw new Error(errorResponse?.error?.message || 'Invalid API response format')
  }

  return {
    meta: {
      week: backend.meta.week,
      cabinetId: parseInt(backend.meta.cabinet_id, 10) || 0, // UUID in backend, number in frontend
      generatedAt: backend.meta.generated_at,
    },
    data: backend.data.map(transformBackendItem),
    pagination: {
      total: backend.meta.total_skus,
      limit: backend.meta.returned_skus,
      offset: 0,
      hasMore: backend.meta.returned_skus < backend.meta.total_skus,
    },
  }
}
