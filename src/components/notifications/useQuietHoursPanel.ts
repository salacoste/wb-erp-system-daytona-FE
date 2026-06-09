/**
 * QuietHoursPanel handler hooks and helpers.
 * Extracted from QuietHoursPanel.tsx for 200-line compliance.
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuietHours } from '@/hooks/useQuietHours'
import type { UpdatePreferencesRequestDto } from '@/types/notifications'

/**
 * Hook that manages QuietHoursPanel state and handlers.
 * Returns local quiet hours state, current time, and update callbacks.
 */
export function useQuietHoursPanel(_disabled: boolean) {
  const { quietHours, updateQuietHours, isUpdating, isQuietHoursActive } = useQuietHours()

  // Local state for optimistic updates
  const [localQuietHours, setLocalQuietHours] =
    useState<UpdatePreferencesRequestDto['quiet_hours']>(quietHours)

  // Current time preview state
  const [currentTime, setCurrentTime] = useState('')

  // Sync with fetched quiet hours
  useEffect(() => {
    if (quietHours) {
      setLocalQuietHours(quietHours)
    }
  }, [quietHours])

  // Update current time preview every 60 seconds
  // Ref: Story 34.4-FE AC#3
  useEffect(() => {
    if (!localQuietHours?.timezone) return

    const updateTime = () => {
      const formatter = new Intl.DateTimeFormat('ru-RU', {
        timeZone: localQuietHours.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      setCurrentTime(formatter.format(new Date()))
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [localQuietHours?.timezone])

  /** Toggle quiet hours enabled */
  const toggleEnabled = useCallback(() => {
    const updated = {
      ...localQuietHours,
      enabled: !localQuietHours?.enabled,
    }
    setLocalQuietHours(updated)
    updateQuietHours(updated)
  }, [localQuietHours, updateQuietHours])

  /** Update time range (from or to) */
  const updateTimeRange = useCallback(
    (field: 'from' | 'to', value: string) => {
      setLocalQuietHours(prev => {
        const updated = { ...prev, [field]: value }
        updateQuietHours(updated)
        return updated
      })
    },
    [updateQuietHours]
  )

  /** Update timezone */
  const updateTimezone = useCallback(
    (timezone: string) => {
      setLocalQuietHours(prev => {
        const updated = { ...prev, timezone }
        updateQuietHours(updated)
        return updated
      })
    },
    [updateQuietHours]
  )

  return {
    localQuietHours,
    currentTime,
    isUpdating,
    isQuietHoursActive,
    toggleEnabled,
    updateTimeRange,
    updateTimezone,
  }
}
