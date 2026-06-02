/**
 * useTelegramHealth — Epic 68-FE (Story 68.1)
 * Telegram integration health details with 120s polling.
 * Lazy-loaded: only fetches when telegram section is expanded or tab active.
 * @see docs/request-backend/149-EPIC-67-PIPELINE-HEALTH-DASHBOARD-API.md
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getTelegramHealth, monitoringQueryKeys } from '@/lib/api/monitoring'
import type { TelegramHealth } from '../types/monitoring'

const TELEGRAM_CACHE = {
  refetchInterval: 120_000,
  staleTime: 110_000,
  gcTime: 300_000,
  retry: 1,
} as const

export function useTelegramHealth(enabled = true) {
  const cabinetId = useAuthStore(state => state.cabinetId)

  return useQuery<TelegramHealth>({
    queryKey: monitoringQueryKeys.telegram(cabinetId ?? ''),
    queryFn: () => getTelegramHealth(cabinetId!),
    enabled: enabled && !!cabinetId,
    ...TELEGRAM_CACHE,
  })
}
