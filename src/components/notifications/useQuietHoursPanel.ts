/**
 * QuietHoursPanel handler hooks and helpers.
 * Extracted from QuietHoursPanel.tsx for 200-line compliance.
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuietHours } from '@/hooks/useQuietHours'
import type { UpdatePreferencesRequestDto } from '@/types/notifications'

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function getTimeError(value: string | undefined): string | undefined {
  return TIME_PATTERN.test(value ?? '') ? undefined : 'Введите время в формате ЧЧ:ММ'
}

function getTimeErrors(value: UpdatePreferencesRequestDto['quiet_hours']) {
  return {
    from: getTimeError(value?.from),
    to: getTimeError(value?.to),
  }
}

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
  const [timeErrors, setTimeErrors] = useState<Partial<Record<'from' | 'to', string>>>({})

  // Sync with fetched quiet hours
  useEffect(() => {
    if (quietHours) {
      setLocalQuietHours(quietHours)
      setTimeErrors({})
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

  const writeIfValid = useCallback(
    (updated: UpdatePreferencesRequestDto['quiet_hours']) => {
      const errors = getTimeErrors(updated)
      setTimeErrors(errors)
      if (!errors.from && !errors.to) updateQuietHours(updated)
    },
    [updateQuietHours]
  )

  /** Toggle quiet hours enabled */
  const toggleEnabled = useCallback(() => {
    const updated = {
      ...localQuietHours,
      enabled: !localQuietHours?.enabled,
    }
    setLocalQuietHours(updated)
    writeIfValid(updated)
  }, [localQuietHours, writeIfValid])

  /** Update time range (from or to) */
  const updateTimeRange = useCallback(
    (field: 'from' | 'to', value: string) => {
      const updated = { ...localQuietHours, [field]: value }
      setLocalQuietHours(updated)
      writeIfValid(updated)
    },
    [localQuietHours, writeIfValid]
  )

  /** Update timezone */
  const updateTimezone = useCallback(
    (timezone: string) => {
      const updated = { ...localQuietHours, timezone }
      setLocalQuietHours(updated)
      writeIfValid(updated)
    },
    [localQuietHours, writeIfValid]
  )

  return {
    localQuietHours,
    currentTime,
    isUpdating,
    isQuietHoursActive,
    timeErrors,
    toggleEnabled,
    updateTimeRange,
    updateTimezone,
  }
}
