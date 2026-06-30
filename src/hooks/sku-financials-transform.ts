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
    // Story 87.3-FE: preserve null when COGS is missing so UI can show "—"
    // instead of misleading "0 ₽". Downstream aggregators must coerce at
    // callsite (e.g., `profit.operating ?? 0` only when summing).
    profit: {
      gross: item.gross_profit ?? null,
      operating: item.operating_profit ?? null,
      operatingMarginPct: item.operating_margin_pct ?? null,
    },
    profitabilityStatus: item.profitability_status,
    missingCogs: item.cogs === null,
    // FR-2..FR-5 (#219): competitor-parity enrichment. Backend returns these
    // top-level on each item when include_ads/include_stock are sent (contract
    // #219, verified W26). Preserve null (never ?? 0) so the UI renders "—"
    // for unavailable fields (anti-pattern #8). Omit `parity` entirely when no
    // FR field is present (flags not sent) to keep the item shape clean.
    ...(hasAnyParityField(item)
      ? {
          parity: {
            advertisingCost: item.advertising_cost ?? null,
            drrPct: item.drr_pct ?? null,
            adCostPerUnit: item.ad_cost_per_unit ?? null,
            taxAllocated: item.tax_allocated ?? null,
            netProfitAfterTax: item.net_profit_after_tax ?? null,
            netMarginAfterTaxPct: item.net_margin_after_tax_pct ?? null,
            sppRub: item.spp_rub ?? null,
            sppPct: item.spp_pct ?? null,
            cancellationsQty: item.cancellations_qty ?? null,
            stockFbs: item.stock_fbs ?? null,
            stockFbo: item.stock_fbo ?? null,
            stockTotal: item.stock_total ?? null,
            stockValueRub: item.stock_value_rub ?? null,
            stockValueSharePct: item.stock_value_share_pct ?? null,
          },
        }
      : {}),
  }
}

/**
 * True when the backend item carries any FR-2..FR-5 parity field. Used to decide
 * whether to attach `parity` to the transformed item (absent when the caller
 * didn't send include_ads/include_stock).
 */
function hasAnyParityField(item: BackendSkuItem): boolean {
  return (
    item.advertising_cost !== undefined ||
    item.drr_pct !== undefined ||
    item.ad_cost_per_unit !== undefined ||
    item.tax_allocated !== undefined ||
    item.net_profit_after_tax !== undefined ||
    item.net_margin_after_tax_pct !== undefined ||
    item.spp_rub !== undefined ||
    item.spp_pct !== undefined ||
    item.cancellations_qty !== undefined ||
    item.stock_fbs !== undefined ||
    item.stock_fbo !== undefined ||
    item.stock_total !== undefined ||
    item.stock_value_rub !== undefined ||
    item.stock_value_share_pct !== undefined
  )
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
