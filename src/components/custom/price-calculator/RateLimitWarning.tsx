'use client'

/**
 * RateLimitWarning Component
 * Story 44.34-FE: Debounce Warehouse Selection & Rate Limit Handling
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Alert component for displaying rate limit cooldown with progress bar
 * Features: Countdown timer, progress bar, dismissible, auto-dismiss on expiry
 */

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface RateLimitWarningProps {
  /** Remaining cooldown seconds */
  remainingSeconds: number
  /** Retry-after seconds from backend (for progress calculation) */
  retryAfter?: number
  /** Optional dismiss callback */
  onDismiss?: () => void
  /** Optional custom message */
  message?: string
  /** Optional endpoint name for context */
  endpointName?: string
}

/**
 * Rate limit warning with countdown timer and progress bar
 *
 * AC3: Rate Limit Error Handling
 * AC4: Rate Limit Cooldown UI
 */
export function RateLimitWarning({
  remainingSeconds,
  retryAfter = 60,
  onDismiss,
  message,
  endpointName = 'coefficients',
}: RateLimitWarningProps) {
  // Local countdown state for smooth updates
  const [localRemaining, setLocalRemaining] = useState(remainingSeconds)

  // Sync with prop changes
  useEffect(() => {
    setLocalRemaining(remainingSeconds)
  }, [remainingSeconds])

  // Countdown timer effect
  useEffect(() => {
    if (localRemaining <= 0) return

    const interval = setInterval(() => {
      setLocalRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [localRemaining > 0])

  // Progress calculation (0% at start, 100% at end)
  const progressPercent = retryAfter > 0 ? ((retryAfter - localRemaining) / retryAfter) * 100 : 0

  // Format remaining time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Default message or custom
  const defaultMessage = message || `Слишком много запросов. Подождите ${localRemaining} сек.`

  return (
    <Alert
      variant="destructive"
      className="relative pr-10"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />

      <div className="flex-1 space-y-3">
        <AlertDescription className="font-medium">
          {defaultMessage}
        </AlertDescription>

        {/* Countdown display with icon */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-destructive/80">До повторной попытки:</span>
            <span
              className="flex items-center gap-1 font-medium tabular-nums"
              aria-label={`Осталось ${localRemaining} секунд`}
            >
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatTime(localRemaining)}
            </span>
          </div>

          {/* Progress bar with ARIA attributes */}
          <Progress
            value={progressPercent}
            className="h-2"
            aria-label={`Прогресс ожидания: ${Math.round(progressPercent)}%`}
          />
        </div>

        {/* Context info */}
        <p className="text-xs opacity-90">
          Лимит запросов Wildberries API: 6 запросов в минуту для {endpointName}.
        </p>
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDismiss}
          aria-label="Скрыть предупреждение"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Alert>
  )
}
