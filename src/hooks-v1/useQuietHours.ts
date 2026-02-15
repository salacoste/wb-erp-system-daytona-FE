// ============================================================================
// Quiet Hours Hook
// Epic 34-FE: Story 34.1-FE
// ============================================================================

import { useNotificationPreferences } from './useNotificationPreferences';
import type { UpdatePreferencesRequestDto } from '@/types/notifications';

/**
 * Hook specifically for quiet hours management
 * Wraps useNotificationPreferences with quiet hours-specific logic
 */
export function useQuietHours() {
  const { preferences, updatePreferences, isUpdating } = useNotificationPreferences();

  const quietHours = preferences?.quiet_hours;

  /**
   * Update quiet hours settings
   */
  const updateQuietHours = (updates: UpdatePreferencesRequestDto['quiet_hours']) => {
    updatePreferences({
      quiet_hours: updates,
    });
  };

  /**
   * Check if current time is within quiet hours
   * Handles overnight periods (e.g., 23:00 - 07:00)
   */
  const isQuietHoursActive = (): boolean => {
    if (!quietHours?.enabled) return false;

    const now = new Date();
    const timezone = quietHours.timezone;

    // Get current time in specified timezone
    const currentTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);

    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const [fromHour, fromMin] = quietHours.from.split(':').map(Number);
    const [toHour, toMin] = quietHours.to.split(':').map(Number);

    const current = currentHour * 60 + currentMin;
    const start = fromHour * 60 + fromMin;
    const end = toHour * 60 + toMin;

    // Handle overnight periods
    if (start > end) {
      return current >= start || current < end;
    }

    return current >= start && current < end;
  };

  return {
    quietHours,
    updateQuietHours,
    isUpdating,
    isQuietHoursActive: isQuietHoursActive(),
  };
}
