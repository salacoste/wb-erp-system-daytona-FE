/**
 * Token Health Hook
 * GET /v1/cabinets/:id/token-status
 * Story 84.3: Token Health Banner with adaptive polling
 */

import { useQuery } from '@tanstack/react-query'
import { getTokenHealth } from '@/lib/api/cabinet'

export const tokenHealthKeys = {
  all: ['token-health'] as const,
  byId: (cabinetId: string) => ['token-health', cabinetId] as const,
}

export function useTokenHealth(cabinetId: string) {
  return useQuery({
    queryKey: tokenHealthKeys.byId(cabinetId),
    queryFn: () => getTokenHealth(cabinetId),
    enabled: !!cabinetId,
    staleTime: 5 * 60_000, // 5 min
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: query => {
      const data = query.state.data
      if (!data || data.healthy) return 5 * 60_000 // 5min when healthy
      return 60_000 // 60s when unhealthy
    },
  })
}
