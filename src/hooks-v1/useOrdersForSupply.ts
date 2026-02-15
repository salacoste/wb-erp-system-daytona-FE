/**
 * useOrdersForSupply Hook
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Fetches orders eligible for adding to a supply.
 * Filters by supplier_status (confirm, complete) and excludes orders in supplies.
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { OrderFbsItem, OrdersPagination } from '@/types/orders'

// =============================================================================
// Constants
// =============================================================================

/** Supplier statuses eligible for supply (orders ready for shipment) */
export const ELIGIBLE_SUPPLIER_STATUSES = ['confirm', 'complete'] as const
export type EligibleSupplierStatus = (typeof ELIGIBLE_SUPPLIER_STATUSES)[number]

/** Default limit for fetching orders (max per batch) */
const DEFAULT_LIMIT = 1000

// =============================================================================
// Types
// =============================================================================

export interface OrdersForSupplyParams {
  /** Filter by supplier status (confirm or complete) */
  supplier_status?: EligibleSupplierStatus
  /** Search by order ID or vendor code */
  search?: string
  /** Items per page */
  limit?: number
  /** Pagination offset */
  offset?: number
  /** Sort field */
  sort_by?: 'created_at' | 'sale_price'
  /** Sort direction */
  sort_order?: 'asc' | 'desc'
}

export interface OrdersForSupplyResponse {
  items: OrderFbsItem[]
  pagination: OrdersPagination
}

// =============================================================================
// Query Keys Factory
// =============================================================================

export const ordersForSupplyQueryKeys = {
  all: ['orders-for-supply'] as const,
  list: (params: OrdersForSupplyParams) =>
    [...ordersForSupplyQueryKeys.all, 'list', params] as const,
}

// =============================================================================
// API Function
// =============================================================================

async function fetchOrdersForSupply(
  params: OrdersForSupplyParams
): Promise<OrdersForSupplyResponse> {
  const searchParams = new URLSearchParams()

  // Default to eligible statuses (confirm,complete) for supply
  const status = params.supplier_status || ELIGIBLE_SUPPLIER_STATUSES.join(',')
  searchParams.append('supplier_status', status)

  // Exclude orders already in a supply
  searchParams.append('no_supply', 'true')

  // Optional search
  if (params.search?.trim()) {
    searchParams.append('search', params.search.trim())
  }

  // Pagination
  searchParams.append('limit', String(params.limit ?? DEFAULT_LIMIT))
  if (params.offset) {
    searchParams.append('offset', String(params.offset))
  }

  // Sorting
  searchParams.append('sort_by', params.sort_by || 'created_at')
  searchParams.append('sort_order', params.sort_order || 'desc')

  const url = `/v1/orders?${searchParams.toString()}`
  console.info('[OrdersForSupply] Fetching:', params)

  const response = await apiClient.get<OrdersForSupplyResponse>(url, {
    skipDataUnwrap: true,
  })

  console.info('[OrdersForSupply] Response:', {
    count: response.items?.length ?? 0,
    total: response.pagination?.total ?? 0,
  })

  return response
}

// =============================================================================
// Hook
// =============================================================================

export interface UseOrdersForSupplyOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch orders eligible for adding to a supply
 * Only returns orders with supplier_status = confirm or complete
 * Excludes orders already in a supply
 */
export function useOrdersForSupply(
  params: OrdersForSupplyParams = {},
  options: UseOrdersForSupplyOptions = {}
) {
  const { enabled = true } = options

  return useQuery<OrdersForSupplyResponse, Error>({
    queryKey: ordersForSupplyQueryKeys.list(params),
    queryFn: () => fetchOrdersForSupply(params),
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
