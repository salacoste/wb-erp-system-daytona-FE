// ============================================================================
// Quiet Hours Configuration Panel
// Epic 34-FE: Story 34.4-FE
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';
import { TimezoneSelect } from './TimezoneSelect';
import { useQuietHours } from '@/hooks/useQuietHours';
import { cn } from '@/lib/utils';
import type { UpdatePreferencesRequestDto } from '@/types/notifications';

interface QuietHoursPanelProps {
  disabled?: boolean; // Disable when Telegram not bound
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
 * UX Design: Sally (UX Expert)
 * Ref: UX-ANSWERS-EPIC-34-FE.md Q11-Q15
 */
export function QuietHoursPanel({ disabled = false }: QuietHoursPanelProps) {
  const { quietHours, updateQuietHours, isUpdating, isQuietHoursActive } = useQuietHours();

  // Local state for optimistic updates
  const [localQuietHours, setLocalQuietHours] = useState<UpdatePreferencesRequestDto['quiet_hours']>(
    quietHours
  );

  // Current time preview state
  const [currentTime, setCurrentTime] = useState('');

  // Sync with fetched quiet hours
  useEffect(() => {
    if (quietHours) {
      setLocalQuietHours(quietHours);
    }
  }, [quietHours]);

  // Update current time preview every 60 seconds
  // Ref: Story 34.4-FE AC#3
  useEffect(() => {
    if (!localQuietHours?.timezone) return;

    const updateTime = () => {
      const formatter = new Intl.DateTimeFormat('ru-RU', {
        timeZone: localQuietHours.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setCurrentTime(formatter.format(new Date()));
    };

    updateTime(); // Initial
    const interval = setInterval(updateTime, 60000); // Every 60s

    return () => clearInterval(interval);
  }, [localQuietHours?.timezone]);

  /**
   * Check if overnight period (from > to)
   * Example: 23:00 - 07:00 crosses midnight
   * Ref: Story 34.4-FE AC#4
   */
  const isOvernightPeriod = (): boolean => {
    if (!localQuietHours?.from || !localQuietHours?.to) return false;

    const fromHour = parseInt(localQuietHours.from.split(':')[0]);
    const toHour = parseInt(localQuietHours.to.split(':')[0]);

    return fromHour > toHour;
  };

  /**
   * Toggle quiet hours enabled
   */
  const toggleEnabled = () => {
    const updated = {
      ...localQuietHours,
      enabled: !localQuietHours?.enabled,
    };
    setLocalQuietHours(updated);
    updateQuietHours(updated);
  };

  /**
   * Update time range (from or to)
   */
  const updateTimeRange = (field: 'from' | 'to', value: string) => {
    const updated = {
      ...localQuietHours,
      [field]: value,
    };
    setLocalQuietHours(updated);
    updateQuietHours(updated);
  };

  /**
   * Update timezone
   */
  const updateTimezone = (timezone: string) => {
    const updated = {
      ...localQuietHours,
      timezone,
    };
    setLocalQuietHours(updated);
    updateQuietHours(updated);
  };

  // Loading skeleton
  if (!localQuietHours) {
    return (
      <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌙</span>
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
    );
  }

  return (
    <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">🌙</span>
          <h3 className="text-2xl font-semibold">Тихие часы</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span aria-hidden="true">{localQuietHours.enabled ? '☑️' : '☐'}</span>
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
                  value={localQuietHours.from}
                  onChange={(e) => updateTimeRange('from', e.target.value)}
                  step="900" // 15-minute intervals
                  disabled={disabled || isUpdating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-telegram-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Начало тихих часов"
                />
              </div>

              <div className="flex-1">
                <label
                  htmlFor="quiet-hours-to"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  До:
                </label>
                <input
                  id="quiet-hours-to"
                  type="time"
                  value={localQuietHours.to}
                  onChange={(e) => updateTimeRange('to', e.target.value)}
                  step="900" // 15-minute intervals
                  disabled={disabled || isUpdating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-telegram-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Конец тихих часов"
                />
              </div>
            </div>

            {/* Overnight Period Hint */}
            {/* Ref: Story 34.4-FE AC#4 - Conditional hint for overnight periods */}
            {isOvernightPeriod() && (
              <Alert className="bg-orange-50 border-orange-500">
                <div className="flex items-start gap-2">
                  <span className="text-xl" aria-hidden="true">💡</span>
                  <div>
                    <p className="text-sm text-gray-700">
                      Тихие часы: {localQuietHours.from} - {localQuietHours.to}
                    </p>
                    <p className="text-xs text-gray-600">
                      (период через полночь)
                    </p>
                  </div>
                </div>
              </Alert>
            )}

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
                value={localQuietHours.timezone || 'Europe/Moscow'}
                onChange={updateTimezone}
                disabled={disabled || isUpdating}
              />
            </div>

            {/* Current Time Preview */}
            {/* Ref: Story 34.4-FE AC#3 - Updates every 60s */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span aria-hidden="true">ℹ️</span>
              <p>
                Сейчас в {localQuietHours.timezone}: <strong>{currentTime}</strong>
              </p>
            </div>

            {/* Active Quiet Hours Badge */}
            {/* Ref: Story 34.4-FE AC#5 - Shows when current time within quiet hours */}
            {isQuietHoursActive && (
              <Alert
                className="bg-blue-50 border-blue-500"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl" aria-hidden="true">🌙</span>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      Сейчас активны тихие часы
                    </p>
                    <p className="text-xs text-blue-600">
                      (уведомления не отправляются)
                    </p>
                  </div>
                </div>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
