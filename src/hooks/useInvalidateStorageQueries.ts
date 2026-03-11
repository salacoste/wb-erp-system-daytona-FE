'use client'

/**
 * Hook to invalidate all storage queries
 * Extracted from useStorageAnalytics.ts for Story 74.4 (file size compliance)
 */

import { useQueryClient } from '@tanstack/react-query'
import { storageQueryKeys } from './storage-analytics-query-keys'

/**
 * Hook to invalidate all storage queries
 * Use after successful import completion to refresh data
 *
 * @returns Function to invalidate all storage queries
 *
 * @example
 * const invalidateStorage = useInvalidateStorageQueries();
 *
 * // After import completes
 * if (status.status === 'completed') {
 *   invalidateStorage();
 * }
 */
export function useInvalidateStorageQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Storage Analytics] Invalidating all storage queries')
    queryClient.invalidateQueries({ queryKey: storageQueryKeys.all })
  }
}
