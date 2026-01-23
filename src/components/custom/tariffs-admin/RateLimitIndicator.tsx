'use client'

/**
 * RateLimitIndicator Component
 * Story 52-FE.6: Rate Limit UX & Error Handling
 * Epic 52-FE: Tariff Settings Admin UI
 *
 * Displays API rate limit status with visual indicators:
 * - Remaining/Limit display (e.g., "Запросов: 8/10")
 * - Color-coded progress bar (green/yellow/red)
 * - Countdown timer until reset
 */

import { useEffect, useState } from 'react'
import { useTariffRateLimitStore } from '@/stores/tariffRateLimitStore'
import { cn } from '@/lib/utils'

/**
 * Get progress bar color based on remaining requests
 * - Green (7-10): Normal operation
 * - Yellow (4-6): Approaching limit
 * - Red (0-3): Near or at limit
 */
function getProgressColor(remaining: number): string {
  if (remaining <= 3) return 'bg-red-500'
  if (remaining <= 6) return 'bg-yellow-500'
  return 'bg-green-500'
}

/**
 * Format milliseconds to M:SS display format
 */
function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function RateLimitIndicator() {
  const { limit, remaining, resetAt } = useTariffRateLimitStore()
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0)

  // Clamp remaining to valid range
  const safeRemaining = Math.max(0, Math.min(remaining, limit))
  const percentage = (safeRemaining / limit) * 100

  // Update countdown every second
  useEffect(() => {
    if (!resetAt) {
      setTimeUntilReset(0)
      return
    }

    const updateCountdown = () => {
      const now = Date.now()
      const remaining = resetAt - now
      setTimeUntilReset(remaining > 0 ? remaining : 0)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [resetAt])

  const showCountdown = resetAt && safeRemaining < limit && timeUntilReset > 0
  const colorClass = getProgressColor(safeRemaining)

  return (
    <div
      data-testid="rate-limit-indicator"
      className="flex items-center gap-2 text-sm"
    >
      <span className="text-muted-foreground">
        Запросов: {safeRemaining}/{limit}
      </span>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-label="Лимит запросов"
        className={cn('w-20 h-2 rounded-full overflow-hidden', colorClass)}
      >
        <div
          className="h-full bg-white/30 transition-all duration-300"
          style={{ width: `${100 - percentage}%`, marginLeft: 'auto' }}
        />
      </div>

      {/* Countdown timer */}
      {showCountdown && (
        <span className="text-muted-foreground">
          Сброс: {formatCountdown(timeUntilReset)}
        </span>
      )}
    </div>
  )
}
