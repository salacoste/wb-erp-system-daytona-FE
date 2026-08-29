// ============================================================================
// Quiet Hours Time Pickers - From/To time inputs with overnight hint
// Epic 34-FE: Story 34.4-FE (extracted from QuietHoursPanel.tsx)
// ============================================================================

import { Alert } from '@/components/ui/alert'
import type { UpdatePreferencesRequestDto } from '@/types/notifications'

// ============================================================================
// Component Props
// ============================================================================

interface QuietHoursTimePickersProps {
  quietHours: NonNullable<UpdatePreferencesRequestDto['quiet_hours']>
  disabled: boolean
  isUpdating: boolean
  onTimeChange: (field: 'from' | 'to', value: string) => void
  errors?: Partial<Record<'from' | 'to', string>>
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if overnight period (from > to)
 * Example: 23:00 - 07:00 crosses midnight
 * Ref: Story 34.4-FE AC#4
 */
function isOvernightPeriod(from: string, to: string): boolean {
  const [fromHour, fromMinute] = from.split(':').map(Number)
  const [toHour, toMinute] = to.split(':').map(Number)
  return fromHour * 60 + fromMinute > toHour * 60 + toMinute
}

// ============================================================================
// Component
// ============================================================================

/**
 * Time range inputs (From/To) with 15-minute intervals
 * and overnight period visual hint.
 * Ref: Story 34.4-FE AC#1, AC#4
 */
export function QuietHoursTimePickers({
  quietHours,
  disabled,
  isUpdating,
  onTimeChange,
  errors = {},
}: QuietHoursTimePickersProps) {
  const fromErrorId = 'quiet-hours-from-error'
  const toErrorId = 'quiet-hours-to-error'

  return (
    <>
      {/* From / To Time Pickers */}
      {/* Ref: Story 34.4-FE AC#1 - Native HTML time input */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label
            htmlFor="quiet-hours-from"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            С:
          </label>
          <input
            id="quiet-hours-from"
            type="time"
            value={quietHours.from}
            onChange={e => onTimeChange('from', e.target.value)}
            step="900"
            disabled={disabled || isUpdating}
            aria-invalid={Boolean(errors.from) || undefined}
            aria-describedby={errors.from ? fromErrorId : undefined}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Начало тихих часов"
          />
          {errors.from && (
            <p id={fromErrorId} role="alert" className="mt-2 text-sm text-destructive">
              {errors.from}
            </p>
          )}
        </div>

        <div className="flex-1">
          <label
            htmlFor="quiet-hours-to"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            До:
          </label>
          <input
            id="quiet-hours-to"
            type="time"
            value={quietHours.to}
            onChange={e => onTimeChange('to', e.target.value)}
            step="900"
            disabled={disabled || isUpdating}
            aria-invalid={Boolean(errors.to) || undefined}
            aria-describedby={errors.to ? toErrorId : undefined}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Конец тихих часов"
          />
          {errors.to && (
            <p id={toErrorId} role="alert" className="mt-2 text-sm text-destructive">
              {errors.to}
            </p>
          )}
        </div>
      </div>

      {/* Overnight Period Hint */}
      {/* Ref: Story 34.4-FE AC#4 - Conditional hint for overnight periods */}
      {quietHours.from && quietHours.to && isOvernightPeriod(quietHours.from, quietHours.to) && (
        <Alert className="border-status-warning/40 bg-status-warning/10">
          <div className="flex items-start gap-2">
            <span className="text-xl" aria-hidden="true">
              &#128161;
            </span>
            <div>
              <p className="text-sm text-foreground">
                Тихие часы: {quietHours.from} - {quietHours.to}
              </p>
              <p className="text-xs text-muted-foreground">(период через полночь)</p>
            </div>
          </div>
        </Alert>
      )}
    </>
  )
}
