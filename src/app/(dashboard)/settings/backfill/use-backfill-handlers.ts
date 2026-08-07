/**
 * Backfill action handlers hook
 * Story 51.11-FE: extracted from BackfillAdminPage
 */

'use client'

import { useState } from 'react'
import {
  useStartBackfill,
  usePauseBackfill,
  useResumeBackfill,
  useRetryBackfill,
} from '@/hooks/useBackfillAdmin'
import { toast } from 'sonner'
import type { StartBackfillRequest, BackfillRetrySource } from '@/types/backfill'

export function useBackfillHandlers() {
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [pausingId, setPausingId] = useState<string | null>(null)
  const [resumingId, setResumingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  // Story 165.5: per-source in-flight keys ("${cabinetId}:${dataSource}") —
  // independent loading/disabled state so reports-retry never blocks analytics.
  const [retryingSourceKeys, setRetryingSourceKeys] = useState<Set<string>>(new Set())

  const startMutation = useStartBackfill()
  const pauseMutation = usePauseBackfill()
  const resumeMutation = useResumeBackfill()
  const retrySourceMutation = useRetryBackfill()

  const handleStart = async (request: StartBackfillRequest) => {
    try {
      await startMutation.mutateAsync(request)
      toast.success('Бэкфилл запущен успешно')
      setIsStartDialogOpen(false)
    } catch {
      toast.error('Ошибка запуска бэкфилла')
    }
  }

  const handlePause = async (cabinetId: string) => {
    setPausingId(cabinetId)
    try {
      await pauseMutation.mutateAsync(cabinetId)
      toast.success('Бэкфилл приостановлен')
    } catch {
      toast.error('Ошибка приостановки бэкфилла')
    } finally {
      setPausingId(null)
    }
  }

  const handleResume = async (cabinetId: string) => {
    setResumingId(cabinetId)
    try {
      await resumeMutation.mutateAsync(cabinetId)
      toast.success('Бэкфилл возобновлён')
    } catch {
      toast.error('Ошибка возобновления бэкфилла')
    } finally {
      setResumingId(null)
    }
  }

  // Cabinet-wide FULL RESTART (POST /start) — NOT a retry. Story 165.5: the
  // per-source resume-from-checkpoint retry lives in `handleRetrySource`
  // (`/report/retry` | `/analytics/retry`). This restart-from-scratch action is
  // the escape hatch surfaced in BackfillControlButtons as "Перезапустить с нуля".
  const handleRetry = async (cabinetId: string) => {
    setRetryingId(cabinetId)
    try {
      await startMutation.mutateAsync({ cabinet_id: cabinetId })
      toast.success('Бэкфилл перезапущен с нуля')
    } catch {
      toast.error('Ошибка перезапуска бэкфилла')
    } finally {
      setRetryingId(null)
    }
  }

  // Story 165.5: retry ONLY the failed source (reports | analytics) — separate endpoint,
  // independent in-flight key. AC5: success/error feedback; the hook invalidates status
  // on settle so the table refreshes after the race (409/404) resolves.
  const handleRetrySource = async (cabinetId: string, dataSource: BackfillRetrySource) => {
    const key = `${cabinetId}:${dataSource}`
    setRetryingSourceKeys(prev => new Set(prev).add(key))
    try {
      const res = await retrySourceMutation.mutateAsync({ cabinetId, dataSource })
      toast.success(res.message || 'Повтор запущен')
    } catch {
      toast.error('Ошибка повтора бэкфилла')
    } finally {
      setRetryingSourceKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return {
    isStartDialogOpen,
    setIsStartDialogOpen,
    pausingId,
    resumingId,
    retryingId,
    retryingSourceKeys,
    startMutation,
    handleStart,
    handlePause,
    handleResume,
    handleRetry,
    handleRetrySource,
  }
}
