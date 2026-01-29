/**
 * React Query Hooks for Order History
 * Story 40.2-FE: React Query Hooks for Orders Module
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Hooks for local history, WB native history, and merged full history.
 * On-demand fetching via `enabled` prop for tab-based UI patterns.
 */

import { useQuery } from '@tanstack/react-query'
import { getOrderHistory, getWbHistory, getFullHistory, ordersQueryKeys } from '@/lib/api/orders'
import type {
  LocalHistoryResponse,
  WbHistoryResponse,
  FullHistoryResponse,
} from '@/types/orders-history'

// ============================================================================
// History Cache Configuration
// ============================================================================

const HISTORY_CACHE_CONFIG = {
  staleTime: 30000, // 30 seconds
  gcTime: 300000, // 5 minutes
  refetchOnWindowFocus: false, // History data doesn't change frequently
  retry: 1,
}

// ============================================================================
// Local History Hook
// ============================================================================

export interface UseLocalHistoryOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch local status history for an order
 * Returns status transitions tracked by our system
 *
 * @example
 * const { data: history } = useLocalHistory(orderId, {
 *   enabled: activeTab === 'local',
 * });
 */
export function useLocalHistory(orderId: string | null, options: UseLocalHistoryOptions = {}) {
  const { enabled = true } = options

  return useQuery<LocalHistoryResponse, Error>({
    queryKey: ordersQueryKeys.history(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return getOrderHistory(orderId)
    },
    enabled: enabled && !!orderId,
    ...HISTORY_CACHE_CONFIG,
  })
}

// ============================================================================
// WB Native History Hook
// ============================================================================

export interface UseWbHistoryOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch WB native status history for an order
 * Returns 40+ detailed WB status codes with timestamps
 *
 * @example
 * const { data: wbHistory } = useWbHistory(orderId, {
 *   enabled: activeTab === 'wb',
 * });
 */
export function useWbHistory(orderId: string | null, options: UseWbHistoryOptions = {}) {
  const { enabled = true } = options

  return useQuery<WbHistoryResponse, Error>({
    queryKey: ordersQueryKeys.wbHistory(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return getWbHistory(orderId)
    },
    enabled: enabled && !!orderId,
    ...HISTORY_CACHE_CONFIG,
  })
}

// ============================================================================
// Full History Hook (Merged Timeline)
// ============================================================================

export interface UseFullHistoryOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch merged full history (local + WB native)
 * Sorted chronologically by timestamp
 *
 * @example
 * const { data: fullHistory } = useFullHistory(orderId, {
 *   enabled: activeTab === 'full',
 * });
 */
export function useFullHistory(orderId: string | null, options: UseFullHistoryOptions = {}) {
  const { enabled = true } = options

  return useQuery<FullHistoryResponse, Error>({
    queryKey: ordersQueryKeys.fullHistory(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return getFullHistory(orderId)
    },
    enabled: enabled && !!orderId,
    ...HISTORY_CACHE_CONFIG,
  })
}
