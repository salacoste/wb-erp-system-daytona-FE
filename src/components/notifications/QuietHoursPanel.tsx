// ============================================================================
// Quiet Hours Configuration Panel
// Epic 34-FE: Story 34.4-FE
// ============================================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useQuietHours } from '@/hooks/useQuietHours'
import { cn } from '@/lib/utils'
import { QuietHoursTimePickers } from './QuietHoursTimePickers'
import { QuietHoursScheduleDisplay } from './QuietHoursScheduleDisplay'
import type { UpdatePreferencesRequestDto } from '@/types/notifications'

interface QuietHoursPanelProps {
  disabled?: boolean // Disable when Telegram not bound
}

/**
 * Quiet Hours Configuration Panel
 *
 * Features (Story 34.4-FE):
 * - Q11: Native HTML time pickers (24-hour, 15-min intervals)
 * - Q12: Grouped timezone dropdown (Europe/Asia regions)
 * - Q13: Current time preview (updates every 60s)
 * - Q14: Overnight period visual hint (from > to)
 * - Q15: Active quiet hours badge with moon icon
 *
 * Ref: UX-ANSWERS-EPIC-34-FE.md Q11-Q15
 */
export function QuietHoursPanel({ disabled = false }: QuietHoursPanelProps) {
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
  const toggleEnabled = () => {
    const updated = {
      ...localQuietHours,
      enabled: !localQuietHours?.enabled,
    }
    setLocalQuietHours(updated)
    updateQuietHours(updated)
  }

  /** Update time range (from or to) */
  const updateTimeRange = (field: 'from' | 'to', value: string) => {
    const updated = {
      ...localQuietHours,
      [field]: value,
    }
    setLocalQuietHours(updated)
    updateQuietHours(updated)
  }

  /** Update timezone */
  const updateTimezone = (timezone: string) => {
    const updated = {
      ...localQuietHours,
      timezone,
    }
    setLocalQuietHours(updated)
    updateQuietHours(updated)
  }

  // Loading skeleton
  if (!localQuietHours) {
    return (
      <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#127769;</span>
            <h3 className="text-2xl font-semibold">Тихие часы</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            &#127769;
          </span>
          <h3 className="text-2xl font-semibold">Тихие часы</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span aria-hidden="true">
                {localQuietHours.enabled ? '&#9745;&#65039;' : '&#9744;'}
              </span>
              <h4 className="font-medium">Включить тихие часы</h4>
            </div>
            <p className="text-sm text-gray-600">
              Уведомления не будут отправляться в заданный период
            </p>
          </div>

          <Switch
            checked={localQuietHours.enabled}
            onCheckedChange={toggleEnabled}
            disabled={disabled || isUpdating}
            className={cn(
              'data-[state=checked]:bg-telegram-blue',
              'data-[state=unchecked]:bg-gray-300'
            )}
            aria-label="Включить тихие часы"
          />
        </div>

        {/* Time Pickers and Configuration (only shown when enabled) */}
        {localQuietHours.enabled && (
          <div className="space-y-4 animate-slide-down">
            <QuietHoursTimePickers
              quietHours={localQuietHours}
              disabled={disabled}
              isUpdating={isUpdating}
              onTimeChange={updateTimeRange}
            />

            <QuietHoursScheduleDisplay
              timezone={localQuietHours.timezone || 'Europe/Moscow'}
              currentTime={currentTime}
              isQuietHoursActive={isQuietHoursActive}
              disabled={disabled}
              isUpdating={isUpdating}
              onTimezoneChange={updateTimezone}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
