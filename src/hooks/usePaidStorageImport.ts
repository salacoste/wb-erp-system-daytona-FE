import { logger } from '@/lib/logger'
'use client'

/**
 * Hook to trigger paid storage data import
 * Extracted from useStorageAnalytics.ts for Story 74.4 (file size compliance)
 */

import { useMutation } from '@tanstack/react-query'
import { triggerPaidStorageImport } from '@/lib/api/storage-analytics'
import type { PaidStorageImportRequest, PaidStorageImportResponse } from '@/types/storage-analytics'
import type { UsePaidStorageImportOptions } from './storage-analytics-query-keys'

/**
 * Hook to trigger paid storage data import
 *
 * @param options - Mutation options (callbacks)
 * @returns Mutation object with mutate function and state
 *
 * @example
 * const { mutate, isPending } = usePaidStorageImport({
 *   onSuccess: (data) => {
 *     console.log('Import started:', data.import_id);
 *     // Start polling for status
 *   },
 * });
 *
 * mutate({ dateFrom: '2025-11-18', dateTo: '2025-11-24' });
 */
export function usePaidStorageImport(options: UsePaidStorageImportOptions = {}) {
  return useMutation<PaidStorageImportResponse, Error, PaidStorageImportRequest>({
    mutationFn: triggerPaidStorageImport,
    onSuccess: data => {
      logger.debug('[Storage Analytics] Import triggered successfully:', {
        importId: data.import_id,
        status: data.status,
      })

      options.onSuccess?.(data)
    },
    onError: error => {
      logger.error('[Storage Analytics] Import failed:', error)
      options.onError?.(error)
    },
    onSettled: () => {
      // Invalidate storage queries after import completes
      // Note: This runs immediately, actual data refresh happens after polling shows completion
    },
  })
}
