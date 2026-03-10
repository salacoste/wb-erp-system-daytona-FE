// ============================================================================
// Quiet Hours Schedule Display - Timezone, current time, active badge
// Epic 34-FE: Story 34.4-FE (extracted from QuietHoursPanel.tsx)
// ============================================================================

import { Alert } from '@/components/ui/alert'
import { TimezoneSelect } from './TimezoneSelect'

// ============================================================================
// Component Props
// ============================================================================

interface QuietHoursScheduleDisplayProps {
  timezone: string
  currentTime: string
  isQuietHoursActive: boolean
  disabled: boolean
  isUpdating: boolean
  onTimezoneChange: (timezone: string) => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Displays timezone selector, current time preview (updates every 60s),
 * and active quiet hours badge.
 * Ref: Story 34.4-FE AC#2, AC#3, AC#5
 */
export function QuietHoursScheduleDisplay({
  timezone,
  currentTime,
  isQuietHoursActive,
  disabled,
  isUpdating,
  onTimezoneChange,
}: QuietHoursScheduleDisplayProps) {
  return (
    <>
      {/* Timezone Dropdown */}
      {/* Ref: Story 34.4-FE AC#2 - Grouped timezone selection */}
      <div>
        <label
          htmlFor="quiet-hours-timezone"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Часовой пояс:
        </label>
        <TimezoneSelect
          value={timezone}
          onChange={onTimezoneChange}
          disabled={disabled || isUpdating}
        />
      </div>

      {/* Current Time Preview */}
      {/* Ref: Story 34.4-FE AC#3 - Updates every 60s */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span aria-hidden="true">&#8505;&#65039;</span>
        <p>
          Сейчас в {timezone}: <strong>{currentTime}</strong>
        </p>
      </div>

      {/* Active Quiet Hours Badge */}
      {/* Ref: Story 34.4-FE AC#5 - Shows when current time within quiet hours */}
      {isQuietHoursActive && (
        <Alert className="bg-blue-50 border-blue-500" role="status" aria-live="polite">
          <div className="flex items-start gap-2">
            <span className="text-xl" aria-hidden="true">
              &#127769;
            </span>
            <div>
              <p className="text-sm font-medium text-blue-700">Сейчас активны тихие часы</p>
              <p className="text-xs text-blue-600">(уведомления не отправляются)</p>
            </div>
          </div>
        </Alert>
      )}
    </>
  )
}
