// ============================================================================
// Telegram Binding Modal - State & Effects Hook
// Epic 34-FE: Story 34.2-FE (extracted from TelegramBindingModal.tsx)
// ============================================================================

'use client'

import { useState, useEffect, useRef } from 'react'
import { useTelegramBinding } from '@/hooks/useTelegramBinding'
import { TelegramMetrics } from '@/lib/analytics/telegram-metrics'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import {
  BINDING_CODE_TTL_SECONDS,
  formatTime,
  getProgressColor,
  getPollingMessage,
} from './useTelegramBindingModal.helpers'

// Re-export for backward compatibility
export { BINDING_CODE_TTL_SECONDS, TELEGRAM_BOT_USERNAME } from './useTelegramBindingModal.helpers'

// ============================================================================
// Hook
// ============================================================================

interface UseTelegramBindingModalParams {
  open: boolean
  onSuccess: () => void
}

export function useTelegramBindingModal({ open, onSuccess }: UseTelegramBindingModalParams) {
  // State
  const [bindingCode, setBindingCode] = useState<string | null>(null)
  const [deepLink, setDeepLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(BINDING_CODE_TTL_SECONDS)
  const [pollingStartTime] = useState(() => Date.now())

  const { startBinding, isBound, isStartingBinding } = useTelegramBinding()

  // Analytics Tracking Refs
  const bindingStartTimeRef = useRef<number | null>(null)
  const modalOpenTimeRef = useRef<number | null>(null)
  const bindingExpiredTrackedRef = useRef(false)
  const previousIsBoundRef = useRef(false)

  // Reset State on Modal Close
  useEffect(() => {
    if (!open) {
      setBindingCode(null)
      setDeepLink(null)
      setExpiresAt(null)
      setTimeRemaining(BINDING_CODE_TTL_SECONDS)
      bindingExpiredTrackedRef.current = false
      modalOpenTimeRef.current = null
      bindingStartTimeRef.current = null
    }
  }, [open])

  // Start Binding on Modal Open
  useEffect(() => {
    if (open && !bindingCode) {
      modalOpenTimeRef.current = Date.now()
      bindingStartTimeRef.current = Date.now()
      TelegramMetrics.bindingStarted()

      startBinding(undefined, {
        onSuccess: data => {
          setBindingCode(data.binding_code)
          setDeepLink(data.deep_link)
          setExpiresAt(data.expires_at)
        },
        onError: error => {
          toast.error('Не удалось создать код привязки. Попробуйте ещё раз.')
          logger.error('Binding start error:', error)
          TelegramMetrics.bindingFailed(error instanceof Error ? error.message : 'Unknown error')
        },
      })
    }
  }, [open, bindingCode, startBinding])

  // Countdown Timer
  useEffect(() => {
    if (!expiresAt) return

    const interval = setInterval(() => {
      const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      setTimeRemaining(Math.max(0, remaining))

      if (remaining <= 0) {
        clearInterval(interval)
        if (!bindingExpiredTrackedRef.current) {
          TelegramMetrics.bindingExpired()
          bindingExpiredTrackedRef.current = true
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  // Success Handler
  useEffect(() => {
    if (open && bindingCode && isBound && !previousIsBoundRef.current) {
      toast.success('Telegram успешно подключен!')
      if (bindingStartTimeRef.current) {
        const durationSeconds = (Date.now() - bindingStartTimeRef.current) / 1000
        TelegramMetrics.bindingCompleted(durationSeconds)
      }
      onSuccess()
    }
    previousIsBoundRef.current = isBound
  }, [open, bindingCode, isBound, onSuccess])

  // Modal Close Tracking (Cancellation)
  useEffect(() => {
    return () => {
      if (!isBound && bindingCode && modalOpenTimeRef.current && timeRemaining > 0) {
        const elapsedSeconds = (Date.now() - modalOpenTimeRef.current) / 1000
        TelegramMetrics.bindingCancelled(elapsedSeconds)
      }
    }
  }, [isBound, bindingCode, timeRemaining])

  // Helpers
  const pollingDuration = Math.floor((Date.now() - pollingStartTime) / 1000)
  const progress = (timeRemaining / BINDING_CODE_TTL_SECONDS) * 100

  const handleCopyCode = async () => {
    if (!bindingCode) return
    try {
      await navigator.clipboard.writeText(`/start ${bindingCode}`)
      toast.success('Команда скопирована!')
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  const handleOpenTelegram = () => {
    if (!deepLink) return
    window.open(deepLink, '_blank', 'noopener,noreferrer')
  }

  return {
    bindingCode,
    isBound,
    isStartingBinding,
    timeRemaining,
    progress,
    formatTime,
    getProgressColor: () => getProgressColor(timeRemaining),
    getPollingMessage: () => getPollingMessage(pollingDuration),
    handleCopyCode,
    handleOpenTelegram,
  }
}
