// ============================================================================
// Quiet Hours Configuration Panel
// Epic 34-FE: Story 34.4-FE
// ============================================================================

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { QuietHoursTimePickers } from './QuietHoursTimePickers'
import { QuietHoursScheduleDisplay } from './QuietHoursScheduleDisplay'
import { useQuietHoursPanel } from './useQuietHoursPanel'

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
  const {
    localQuietHours,
    currentTime,
    isUpdating,
    isQuietHoursActive,
    timeErrors,
    toggleEnabled,
    updateTimeRange,
    updateTimezone,
  } = useQuietHoursPanel(disabled)

  // Loading skeleton
  if (!localQuietHours) {
    return (
      <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#127769;</span>
            <h2 className="text-2xl font-semibold">Тихие часы</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" role="status" aria-label="Загружаем тихие часы">
            <span className="sr-only">Загружаем настройки тихих часов</span>
            <div className="h-12 animate-pulse rounded bg-muted motion-reduce:animate-none"></div>
            <div className="h-12 animate-pulse rounded bg-muted motion-reduce:animate-none"></div>
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
          <h2 className="text-2xl font-semibold">Тихие часы</h2>
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
            <p className="text-sm text-muted-foreground">
              Уведомления не будут отправляться в заданный период
            </p>
          </div>

          <Switch
            checked={localQuietHours.enabled}
            onCheckedChange={toggleEnabled}
            disabled={disabled || isUpdating}
            className={cn(
              'data-[state=checked]:bg-telegram',
              'data-[state=unchecked]:bg-muted-foreground/40'
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
              errors={timeErrors}
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
