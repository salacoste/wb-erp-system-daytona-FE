/**
 * useRecovery — Epic 68-FE (Story 68.1)
 * Recovery status query + trigger/recover mutations.
 * @see test-api/17-monitoring.http
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import {
  getRecoveryStatus,
  triggerRecovery,
  recoverData,
  monitoringQueryKeys,
} from '@/lib/api/monitoring'
import type { RecoveryStatusResponse } from '../types/monitoring'

const RECOVERY_CACHE = {
  staleTime: 30_000,
  gcTime: 300_000,
  retry: 1,
} as const

export function useRecoveryStatus(enabled = true) {
  const cabinetId = useAuthStore(state => state.cabinetId)

  return useQuery<RecoveryStatusResponse>({
    queryKey: monitoringQueryKeys.recovery(cabinetId ?? ''),
    queryFn: () => getRecoveryStatus(cabinetId!),
    enabled: enabled && !!cabinetId,
    ...RECOVERY_CACHE,
  })
}

export function useTriggerRecovery() {
  const cabinetId = useAuthStore(state => state.cabinetId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      taskType: string
      forceRetry?: boolean
      dateRange?: { from: string; to: string }
    }) => triggerRecovery({ ...data, cabinetId: cabinetId! }),
    onSuccess: () => {
      toast.success('Восстановление запущено')
      queryClient.invalidateQueries({ queryKey: monitoringQueryKeys.all })
    },
    onError: (error: Error) => {
      toast.error('Ошибка восстановления', { description: error.message })
    },
  })
}

export function useRecoverData() {
  const cabinetId = useAuthStore(state => state.cabinetId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { table: string; dates?: string[] }) =>
      recoverData({ ...data, cabinetId: cabinetId! }),
    onSuccess: () => {
      toast.success('Восстановление данных запущено')
      queryClient.invalidateQueries({ queryKey: monitoringQueryKeys.all })
    },
    onError: (error: Error) => {
      toast.error('Ошибка восстановления данных', { description: error.message })
    },
  })
}
