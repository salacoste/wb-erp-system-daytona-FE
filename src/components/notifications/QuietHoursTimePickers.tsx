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
  const fromHour = parseInt(from.split(':')[0])
  const toHour = parseInt(to.split(':')[0])
  return fromHour > toHour
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
}: QuietHoursTimePickersProps) {
  return (
    <>
      {/* From / To Time Pickers */}
      {/* Ref: Story 34.4-FE AC#1 - Native HTML time input */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label
            htmlFor="quiet-hours-from"
            className="block text-sm font-medium text-gray-700 mb-2"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-telegram-blue disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Начало тихих часов"
          />
        </div>

        <div className="flex-1">
          <label htmlFor="quiet-hours-to" className="block text-sm font-medium text-gray-700 mb-2">
            До:
          </label>
          <input
            id="quiet-hours-to"
            type="time"
            value={quietHours.to}
            onChange={e => onTimeChange('to', e.target.value)}
            step="900"
            disabled={disabled || isUpdating}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-telegram-blue disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Конец тихих часов"
          />
        </div>
      </div>

      {/* Overnight Period Hint */}
      {/* Ref: Story 34.4-FE AC#4 - Conditional hint for overnight periods */}
      {quietHours.from && quietHours.to && isOvernightPeriod(quietHours.from, quietHours.to) && (
        <Alert className="bg-orange-50 border-orange-500">
          <div className="flex items-start gap-2">
            <span className="text-xl" aria-hidden="true">
              &#128161;
            </span>
            <div>
              <p className="text-sm text-gray-700">
                Тихие часы: {quietHours.from} - {quietHours.to}
              </p>
              <p className="text-xs text-gray-600">(период через полночь)</p>
            </div>
          </div>
        </Alert>
      )}
    </>
  )
}
