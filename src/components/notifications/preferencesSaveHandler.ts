/**
 * Preferences Panel — Save handler logic (pure diff detection)
 * Extracted from usePreferencesPanelState.ts for file-size compliance (Epic 134-FE)
 */

import { TelegramMetrics } from '@/lib/analytics/telegram-metrics'
import type { NotificationPreferencesResponseDto } from '@/types/notifications'

/**
 * Build a changes diff between previous and current preferences,
 * track the change via analytics, and return the updated previous ref.
 */
export function buildSaveChanges(
  local: NotificationPreferencesResponseDto,
  previous: NotificationPreferencesResponseDto | null
): {
  changes: {
    event_types?: NotificationPreferencesResponseDto['preferences']
    language?: string
    daily_digest?: boolean
    quiet_hours_enabled?: boolean
  }
  updatedPrevious: NotificationPreferencesResponseDto
} {
  const changes: {
    event_types?: NotificationPreferencesResponseDto['preferences']
    language?: string
    daily_digest?: boolean
    quiet_hours_enabled?: boolean
  } = {}

  if (previous) {
    const eventTypesChanged = Object.keys(local.preferences).some(
      key =>
        local.preferences[key as keyof typeof local.preferences] !==
        previous.preferences[key as keyof typeof previous.preferences]
    )

    if (eventTypesChanged) {
      changes.event_types = local.preferences
    }
    if (local.language !== previous.language) {
      changes.language = local.language
    }
    if (local.preferences.daily_digest !== previous.preferences.daily_digest) {
      changes.daily_digest = local.preferences.daily_digest
    }
    if (local.quiet_hours.enabled !== previous.quiet_hours.enabled) {
      changes.quiet_hours_enabled = local.quiet_hours.enabled
    }
  }

  TelegramMetrics.preferencesUpdated(changes)

  return {
    changes,
    updatedPrevious: { ...local },
  }
}
