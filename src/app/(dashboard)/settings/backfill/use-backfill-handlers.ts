/**
 * Backfill action handlers hook
 * Story 51.11-FE: extracted from BackfillAdminPage
 */

'use client'

import { useState } from 'react'
import { useStartBackfill, usePauseBackfill, useResumeBackfill } from '@/hooks/useBackfillAdmin'
import { toast } from 'sonner'
import type { StartBackfillRequest } from '@/types/backfill'

export function useBackfillHandlers() {
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [pausingId, setPausingId] = useState<string | null>(null)
  const [resumingId, setResumingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const startMutation = useStartBackfill()
  const pauseMutation = usePauseBackfill()
  const resumeMutation = useResumeBackfill()

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

  const handleRetry = async (cabinetId: string) => {
    setRetryingId(cabinetId)
    try {
      await startMutation.mutateAsync({ cabinet_id: cabinetId })
      toast.success('Бэкфилл перезапущен')
    } catch {
      toast.error('Ошибка перезапуска бэкфилла')
    } finally {
      setRetryingId(null)
    }
  }

  return {
    isStartDialogOpen,
    setIsStartDialogOpen,
    pausingId,
    resumingId,
    retryingId,
    startMutation,
    handleStart,
    handlePause,
    handleResume,
    handleRetry,
  }
}
