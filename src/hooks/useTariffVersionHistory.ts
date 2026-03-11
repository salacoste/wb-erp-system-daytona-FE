// ============================================================================
// Tariff Version History Hook
// Epic 52-FE: Story 52-FE.1 - Version History Table
// Fetches all tariff versions with their status from the backend API
// ============================================================================

import { useQuery } from '@tanstack/react-query'
import { getTariffVersionHistory } from '@/lib/api/tariffs-admin'
import { tariffQueryKeys } from '@/hooks/tariff-query-keys'
import type { TariffVersion } from '@/types/tariffs-admin'

/**
 * Hook to fetch tariff version history
 *
 * @returns Query result with version history data
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useTariffVersionHistory()
 *
 * if (isLoading) return <Loading />
 * if (isError) return <Error message={error.message} onRetry={refetch} />
 *
 * return <VersionTable versions={data} />
 * ```
 */
export function useTariffVersionHistory() {
  return useQuery<TariffVersion[], Error>({
    queryKey: tariffQueryKeys.versionHistory(),
    queryFn: getTariffVersionHistory,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  })
}
