/**
 * Hook for SKU Financials Analytics
 * Epic 31: Complete Per-SKU Financial Analytics
 * Reference: frontend/docs/request-backend/64-per-sku-margin-missing-expenses-backend-response.md
 *
 * Key features:
 * - Storage from paid_storage_daily (Epic 24)
 * - Commission/acquiring as visibility fields (already in net_for_pay)
 * - Operating profit = grossProfit - logistics - storage - penalties - paidAcceptance
 * - Profitability classification (excellent/good/warning/critical/loss/unknown)
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  SkuFinancialsQuery,
  SkuFinancialsResponse,
  SkuFinancialsSortBy,
  SkuFinancialItem,
  ProfitabilityStatus,
} from '@/types/sku-financials'

// Re-export types for convenience
export type { SkuFinancialsQuery, SkuFinancialsResponse, SkuFinancialsSortBy }

// ============================================================
// BACKEND RESPONSE TYPES (snake_case from API)
// ============================================================

interface BackendSales {
  quantity: number
  revenue_gross: number
  revenue_net: number
}

interface BackendReturns {
  quantity: number
  revenue_gross: number
  revenue_net: number
}

interface BackendCogs {
  unit_cost: number
  total: number
  source: string
  valid_from: string
}

interface BackendExpenses {
  logistics_delivery: number
  logistics_return: number
  logistics_total: number
  storage: number
  storage_source: 'paid_storage_api' | 'unavailable'
  penalties: number
  paid_acceptance: number
  other_adjustments: number // Request #68
  total_operating: number
}

interface BackendVisibility {
  commission_sales: number
  commission_other: number
  commission_total: number
  acquiring_fee: number
  comment: string
}

interface BackendSkuItem {
  nm_id: string
  sa_name: string
  brand?: string
  category?: string
  sales: BackendSales
  returns: BackendReturns
  cogs: BackendCogs | null
  gross_profit: number | null
  gross_margin_pct: number | null
  expenses: BackendExpenses
  visibility_breakdown?: BackendVisibility
  operating_profit: number | null
  operating_margin_pct: number | null
  profitability_status: ProfitabilityStatus
}

interface BackendMeta {
  week: string
  week_start: string
  week_end: string
  cabinet_id: string
  total_skus: number
  returned_skus: number
  generated_at: string
  data_sources: {
    transactions: string
    storage: string
    cogs: string
  }
  warnings?: Array<{
    code: string
    message: string
    affected_skus?: string
  }>
}

interface BackendTotals {
  revenue_gross: number
  revenue_net: number
  cogs: number | null
  gross_profit: number | null
  logistics_cost: number
  storage_cost: number
  penalties: number
  paid_acceptance: number
  other_adjustments: number // Request #68
  total_operating_expenses: number
  operating_profit: number | null
  operating_margin_pct: number | null
  visibility_metrics: {
    commission_total: number
    acquiring_fee: number
    comment: string
  }
}

interface BackendResponse {
  meta: BackendMeta
  totals: BackendTotals
  data: BackendSkuItem[]
}

// ============================================================
// DATA TRANSFORMATION (snake_case → camelCase)
// ============================================================

/**
 * Transform backend snake_case response to frontend camelCase format
 * Maps backend DTO structure to frontend SkuFinancialItem
 */
function transformBackendItem(item: BackendSkuItem): SkuFinancialItem {
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
function transformBackendResponse(backend: BackendResponse): SkuFinancialsResponse {
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

/**
 * Hook to fetch complete per-SKU financial analytics
 *
 * @example
 * // Basic usage - all SKUs for a week
 * const { data, isLoading } = useSkuFinancials({
 *   week: '2025-W50',
 * });
 *
 * @example
 * // With sorting and filtering
 * const { data, isLoading } = useSkuFinancials({
 *   week: '2025-W50',
 *   sortBy: 'operatingMarginPct',
 *   order: 'asc',
 *   limit: 20,
 * });
 *
 * @example
 * // Filter specific SKUs
 * const { data, isLoading } = useSkuFinancials({
 *   week: '2025-W50',
 *   nm_ids: '148190182,148190095',
 * });
 *
 * @returns Query result with SKU financials data
 */
export function useSkuFinancials(params: SkuFinancialsQuery, enabled = true) {
  return useQuery<SkuFinancialsResponse>({
    queryKey: ['analytics', 'sku-financials', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set('week', params.week)

      if (params.nm_ids) {
        searchParams.set('nm_ids', params.nm_ids)
      }
      // Backend uses snake_case for query params
      if (params.sortBy) {
        searchParams.set('sort_by', params.sortBy)
      }
      if (params.order) {
        searchParams.set('sort_order', params.order)
      }
      if (params.includeVisibility !== undefined) {
        searchParams.set('include_visibility', String(params.includeVisibility))
      }
      if (params.limit !== undefined) {
        searchParams.set('limit', String(params.limit))
      }
      if (params.offset !== undefined) {
        searchParams.set('offset', String(params.offset))
      }

      // apiClient.get returns the response directly (type T), not wrapped in { data: T }
      // Backend returns snake_case, we transform to camelCase for frontend
      // IMPORTANT: Use skipDataUnwrap=true because response has { meta, data, totals } structure
      // Without this, apiClient unwraps "data" field and loses meta/totals
      const backendResponse = await apiClient.get<BackendResponse>(
        `/v1/analytics/sku-financials?${searchParams.toString()}`,
        { skipDataUnwrap: true }
      )
      return transformBackendResponse(backendResponse)
    },
    enabled: enabled && !!params.week,
    // Match backend cache TTL (30 minutes)
    staleTime: 30 * 60 * 1000,
    // Keep in cache for 1 hour
    gcTime: 60 * 60 * 1000,
  })
}

/**
 * Hook to fetch SKU financials with pagination support
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSkuFinancialsPaginated({
 *   week: '2025-W50',
 *   limit: 25,
 * });
 */
export function useSkuFinancialsWithPagination(
  baseParams: Omit<SkuFinancialsQuery, 'offset'>,
  enabled = true
) {
  const limit = baseParams.limit ?? 50

  return useQuery<SkuFinancialsResponse>({
    queryKey: ['analytics', 'sku-financials', 'paginated', baseParams],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set('week', baseParams.week)
      searchParams.set('limit', String(limit))
      searchParams.set('offset', '0')

      if (baseParams.nm_ids) {
        searchParams.set('nm_ids', baseParams.nm_ids)
      }
      // Backend uses snake_case for query params
      if (baseParams.sortBy) {
        searchParams.set('sort_by', baseParams.sortBy)
      }
      if (baseParams.order) {
        searchParams.set('sort_order', baseParams.order)
      }
      if (baseParams.includeVisibility !== undefined) {
        searchParams.set('include_visibility', String(baseParams.includeVisibility))
      }

      // apiClient.get returns the response directly (type T), not wrapped in { data: T }
      // Backend returns snake_case, we transform to camelCase for frontend
      // IMPORTANT: Use skipDataUnwrap=true because response has { meta, data, totals } structure
      // Without this, apiClient unwraps "data" field and loses meta/totals
      const backendResponse = await apiClient.get<BackendResponse>(
        `/v1/analytics/sku-financials?${searchParams.toString()}`,
        { skipDataUnwrap: true }
      )
      return transformBackendResponse(backendResponse)
    },
    enabled: enabled && !!baseParams.week,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
