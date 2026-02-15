/**
 * Hook for fetching COGS history
 * Request #16: COGS History and Margin Data Structure Guide
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface CogsHistoryEntry {
  id: string
  nmId: string
  saName: string
  validFrom: string
  validTo: string | null
  unitCostRub: string
  currency?: string
  source?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  notes?: string
}

export interface CogsHistoryResponse {
  data: CogsHistoryEntry[]
  pagination?: {
    cursor?: string
    hasMore?: boolean
  }
}

/**
 * Hook to fetch all COGS versions (current and historical) for a product
 * 
 * @example
 * const { data: history, isLoading } = useCogsHistory('321678606');
 */
export function useCogsHistory(nmId: string | undefined) {
  return useQuery({
    queryKey: ['cogs-history', nmId],
    queryFn: async (): Promise<CogsHistoryResponse> => {
      if (!nmId) {
        throw new Error('Product ID is required')
      }

      try {
        console.info(`[COGS History] Fetching COGS history for nm_id: ${nmId}`)

        const response = await apiClient.get<CogsHistoryResponse>(
          `/v1/cogs?nm_id=${nmId}&limit=100`
        )

        console.info('[COGS History] COGS history received:', {
          nm_id: nmId,
          versions_count: response.data?.length || 0,
        })

        return response
      } catch (error) {
        console.error(`[COGS History] Failed to fetch COGS history for ${nmId}:`, error)
        throw error
      }
    },
    staleTime: 60000,  // 1 minute
    gcTime: 300000,    // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: !!nmId,
  })
}

/**
 * Hook to get COGS valid at specific date (temporal lookup)
 * 
 * @example
 * const { data: cogs } = useCogsAtDate('321678606', '2025-11-15');
 */
export function useCogsAtDate(nmId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ['cogs-at-date', nmId, date],
    queryFn: async (): Promise<CogsHistoryEntry | null> => {
      if (!nmId || !date) {
        throw new Error('Product ID and date are required')
      }

      try {
        console.info(`[COGS History] Fetching COGS for nm_id: ${nmId} at date: ${date}`)

        const response = await apiClient.get<CogsHistoryResponse>(
          `/v1/cogs?nm_id=${nmId}&valid_at=${date}&limit=1`
        )

        const cogs = response.data?.[0] || null

        console.info('[COGS History] COGS at date received:', {
          nm_id: nmId,
          date,
          found: !!cogs,
        })

        return cogs
      } catch (error) {
        console.error(`[COGS History] Failed to fetch COGS at date for ${nmId}:`, error)
        throw error
      }
    },
    staleTime: 60000,  // 1 minute
    gcTime: 300000,    // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: !!nmId && !!date,
  })
}

