// ============================================================================
// Tariff Settings Hook
// Epic 52-FE: Story 52-FE.7 - Page Layout, Types & Integration
// Base hook for fetching current tariff settings
// ============================================================================

import { useQuery } from '@tanstack/react-query'
import { getTariffSettings } from '@/lib/api/tariffs-admin'
import { tariffQueryKeys } from './tariff-query-keys'

/**
 * Hook for fetching current tariff settings
 *
 * Features:
 * - Fetch current active tariff settings
 * - 1 minute stale time (reduced from 24h for version switching support)
 * - Automatic refetch on window focus
 *
 * @returns Query result with tariff settings data
 */
export function useTariffSettings() {
  return useQuery({
    queryKey: tariffQueryKeys.settings(),
    queryFn: getTariffSettings,
    staleTime: 60 * 1000, // 1 minute (reduced from 24h due to version switching)
  })
}
