'use client'

/**
 * Hook to poll import job status
 * Extracted from useStorageAnalytics.ts for Story 74.4 (file size compliance)
 */

import { useQuery } from '@tanstack/react-query'
import { getImportStatus } from '@/lib/api/storage-analytics'
import type { ImportStatusResponse } from '@/types/storage-analytics'
import { storageQueryKeys, type UseImportStatusOptions } from './storage-analytics-query-keys'

/**
 * Hook to poll import job status
 *
 * @param importId - Import job ID from usePaidStorageImport
 * @param options - Hook options including polling interval
 * @returns Query result with current import status
 *
 * @example
 * const { data: status } = useImportStatus(importId, {
 *   enabled: !!importId,
 *   refetchInterval: status?.status === 'processing' ? 2000 : false,
 * });
 *
 * if (status?.status === 'completed') {
 *   console.log(`Imported ${status.rows_imported} rows`);
 * }
 */
export function useImportStatus(importId: string | null, options: UseImportStatusOptions = {}) {
  const { enabled = true, refetchInterval = false } = options

  return useQuery<ImportStatusResponse, Error>({
    queryKey: storageQueryKeys.importStatus(importId ?? ''),
    queryFn: () => {
      if (!importId) {
        throw new Error('Import ID is required')
      }
      return getImportStatus(importId)
    },
    enabled: enabled && !!importId,
    staleTime: 0, // Always fetch fresh status
    gcTime: 60000, // Keep in cache for 1 minute
    refetchInterval: query => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') {
        return false
      }
      return typeof refetchInterval === 'number' ? refetchInterval : false
    },
    retry: 2,
  })
}
