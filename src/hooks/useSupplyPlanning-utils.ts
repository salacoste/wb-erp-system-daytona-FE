/**
 * Supply Planning - Query Keys, Types & Config Constants
 * Extracted from useSupplyPlanning.ts for file size compliance (Epic 74)
 */

import type { SupplyPlanningQueryParams } from '@/types/supply-planning'

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for supply planning
 * Follows TanStack Query v5 patterns with factory functions
 */
export const supplyPlanningQueryKeys = {
  /** Base key for all supply planning queries */
  all: ['supply-planning'] as const,

  /** Key for supply planning list queries */
  list: (params: SupplyPlanningQueryParams) =>
    [...supplyPlanningQueryKeys.all, 'list', params] as const,

  /** Key for specific SKU detail (for future expansion) */
  detail: (skuId: string) => [...supplyPlanningQueryKeys.all, 'detail', skuId] as const,
}

// ============================================================================
// Hook Options Type
// ============================================================================

export interface UseSupplyPlanningOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
  /** Stale time in milliseconds (default: 60000 = 1 min) */
  staleTime?: number
}

// ============================================================================
// Query Config Constants
// ============================================================================

/** Default stale time for supply planning queries (1 minute) */
export const SUPPLY_STALE_TIME = 60000

/** GC time for supply planning queries (5 minutes) */
export const SUPPLY_GC_TIME = 300000

/** Prefetch stale time for supply planning data */
export const SUPPLY_PREFETCH_STALE_TIME = 60000
