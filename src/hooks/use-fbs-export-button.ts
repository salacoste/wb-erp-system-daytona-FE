/**
 * useFbsExportButton — extracted from FbsExportButton.tsx (Epic 96-FE Story 96.12-FE)
 *
 * Manages export trigger, polling, download, rate-limit countdown, and cabinet-switch reset.
 * Returns everything the button component needs for rendering.
 *
 * @see src/app/(dashboard)/analytics/fbs-stock/components/FbsExportButton.tsx
 * @see src/hooks/use-fbs-export-polling.ts
 * @see src/lib/api/fbs-export.ts
 */

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/types/api'
import { triggerFbsExport } from '@/lib/api/fbs-export'
import { useFbsExportPolling } from '@/hooks/use-fbs-export-polling'
import { useAuthStore } from '@/stores/authStore'
import { DEFAULT_RATE_LIMIT_SECONDS, triggerDownload } from './use-fbs-export-helpers'

export function useFbsExportButton() {
  const [exportId, setExportId] = useState<string | null>(null)
  const [pollingStartedAt, setPollingStartedAt] = useState<number | null>(null)
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toastIdRef = useRef<string | number | null>(null)
  // M-4 fix: ref-based "already shown for this exportId" tracker prevents swallowed
  // retry errors when pollError transitions truthy → falsy → truthy on a new export.
  const errorShownRef = useRef<string | null>(null)

  // M2-2 fix: subscribe to cabinetId to detect cabinet switches.
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  const { data: statusData, error: pollError } = useFbsExportPolling(exportId, pollingStartedAt)

  // M2-2: cabinet switch → reset all local export state
  // Prevents cross-cabinet polling leak.
  useEffect(() => {
    setExportId(null)
    setPollingStartedAt(null)
    setRateLimitSeconds(0)
    errorShownRef.current = null
    if (toastIdRef.current != null) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [cabinetId])

  // 429 countdown via setInterval (cleanup on unmount — CLAUDE.md anti-pattern #7)
  // M-1 fix: dependency is a derived 0/1 integer so the effect re-runs only on transitions.
  const countdownActive = rateLimitSeconds > 0 ? 1 : 0
  useEffect(() => {
    if (rateLimitSeconds <= 0) return

    intervalRef.current = setInterval(() => {
      setRateLimitSeconds(s => {
        if (s <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return s - 1
      })
    }, 1_000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [countdownActive])

  // React to polling status changes
  // H-1+H-2 fix: use statusData.url (signed S3 URL from polling response).
  // H2-1 fix: errorShownRef.current reset to null on all terminal branches.
  useEffect(() => {
    if (!statusData) return

    if (statusData.status === 'ready') {
      if (toastIdRef.current !== null) toast.dismiss(toastIdRef.current)

      if (!statusData.url) {
        // Defensive Frontend Principle: backend says ready but url is null.
        toast.error('Файл готов, но ссылка для скачивания отсутствует. Сообщите в поддержку.', {
          duration: 8_000,
        })
        setExportId(null)
        setPollingStartedAt(null)
        toastIdRef.current = null
        errorShownRef.current = null
        return
      }

      toast.success('Экспорт готов — скачивание...', { duration: 3_000 })
      triggerDownload(statusData.url)
      setExportId(null)
      setPollingStartedAt(null)
      toastIdRef.current = null
      errorShownRef.current = null
    } else if (statusData.status === 'failed' || statusData.status === 'expired') {
      if (toastIdRef.current !== null) toast.dismiss(toastIdRef.current)
      toast.error('Не удалось подготовить экспорт. Попробуйте ещё раз.', { duration: 5_000 })
      setExportId(null)
      setPollingStartedAt(null)
      toastIdRef.current = null
      errorShownRef.current = null
    }
  }, [statusData?.status, statusData?.url])

  // Show poll-error toast (M-4 fix: ref-based dedup per exportId).
  useEffect(() => {
    if (!pollError || !exportId) return
    if (errorShownRef.current === exportId) return
    errorShownRef.current = exportId
    if (toastIdRef.current !== null) toast.dismiss(toastIdRef.current)
    toast.error('Ошибка опроса статуса экспорта. Повторите попытку.', { duration: 5_000 })
    setExportId(null)
    setPollingStartedAt(null)
    toastIdRef.current = null
  }, [pollError, exportId])

  // Click handler: M-3 fix prevents concurrent triggers; H2-1 resets error ref.
  async function handleClick() {
    if (exportId != null || rateLimitSeconds > 0) return
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
    errorShownRef.current = null

    try {
      const response = await triggerFbsExport()
      setExportId(response.exportId)
      setPollingStartedAt(Date.now())
      toastIdRef.current = toast.loading('Подготовка экспорта...', { duration: Infinity })
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        const seconds = e.retryAfter ?? DEFAULT_RATE_LIMIT_SECONDS
        setRateLimitSeconds(seconds)
        toast.warning(`Экспорт недоступен. Повторите через ${seconds} сек.`, { duration: 4_000 })
      } else {
        const message = e instanceof Error ? e.message : 'Не удалось запустить экспорт.'
        toast.error(message, { duration: 5_000 })
      }
    }
  }

  const isPolling = exportId != null
  const isRateLimited = rateLimitSeconds > 0
  const disabled = isPolling || isRateLimited

  let label = 'Скачать CSV'
  if (isPolling) label = 'Подготовка...'
  else if (isRateLimited) label = `Доступно через ${rateLimitSeconds} сек`

  return { handleClick, disabled, label }
}
