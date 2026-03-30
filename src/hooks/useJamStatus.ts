/**
 * Jam Subscription Status Hook
 * GET /v1/cabinets/:id/jam-status
 *
 * Detects Jam tier (none/standard/advanced) via SDK probe.
 * staleTime=5min because probe calls are expensive.
 */

import { useQuery } from '@tanstack/react-query'
import { getJamStatus } from '@/lib/api/cabinet'

export const jamStatusKeys = {
  all: ['jam-status'] as const,
  byId: (cabinetId: string) => ['jam-status', cabinetId] as const,
}

export function useJamStatus(cabinetId: string) {
  return useQuery({
    queryKey: jamStatusKeys.byId(cabinetId),
    queryFn: () => getJamStatus(cabinetId),
    enabled: !!cabinetId,
    staleTime: 5 * 60_000,
    retry: false, // Backend returns graceful 200 on WB SDK errors — no retry needed
  })
}
