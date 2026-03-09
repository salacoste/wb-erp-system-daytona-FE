/**
 * Storage Analytics Query Keys & Shared Types
 * Extracted from useStorageAnalytics.ts for Story 74.4 (file size compliance)
 *
 * Pure data/config file - no React hooks, no 'use client' needed.
 */

import type {
  StorageBySkuParams,
  StorageTopConsumersParams,
  StorageTrendsParams,
  StorageSummaryParams,
} from '@/types/storage-analytics'

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for storage analytics
 * Follows TanStack Query v5 patterns with factory functions
 */
export const storageQueryKeys = {
  /** Base key for all storage queries */
  all: ['storage'] as const,

  /** Key for storage by SKU queries */
  bySku: (params: StorageBySkuParams) => [...storageQueryKeys.all, 'by-sku', params] as const,

  /** Key for top consumers queries */
  topConsumers: (params: StorageTopConsumersParams) =>
    [...storageQueryKeys.all, 'top-consumers', params] as const,

  /** Key for trends queries */
  trends: (params: StorageTrendsParams) => [...storageQueryKeys.all, 'trends', params] as const,

  /** Key for import status queries */
  importStatus: (importId: string) => [...storageQueryKeys.all, 'import', importId] as const,

  /** Key for storage summary queries (Request #52) */
  summary: (params: StorageSummaryParams) => [...storageQueryKeys.all, 'summary', params] as const,
}

// ============================================================================
// Shared Option Types
// ============================================================================

export interface UseStorageBySkuOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
}

export interface UseStorageTopConsumersOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

export interface UseStorageTrendsOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

export interface UseStorageSummaryOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

export interface UsePaidStorageImportOptions {
  /** Callback on successful import trigger */
  onSuccess?: (data: import('@/types/storage-analytics').PaidStorageImportResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

export interface UseImportStatusOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Polling interval in milliseconds (e.g., 2000 for 2 seconds) */
  refetchInterval?: number | false
}
