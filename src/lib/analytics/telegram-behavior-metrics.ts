// ============================================================================
// Telegram Behavior & Preferences Metrics
// Epic 34-FE: Monitoring & Analytics
// Extracted from telegram-metrics.ts - HIGH/NICE-TO-HAVE Priority metrics
// ============================================================================

import { analyticsService } from './analytics.service'
import { getUserContext } from './telegram-metrics-helpers'

// ============================================================================
// Preferences Metrics (HIGH Priority)
// ============================================================================

export const TelegramBehaviorMetrics = {
  /**
   * User saved notification preferences
   *
   * @param changes - Preferences that were changed
   */
  preferencesUpdated(changes: {
    event_types?: Record<string, boolean | string>
    language?: string
    daily_digest?: boolean
    quiet_hours_enabled?: boolean
  }) {
    analyticsService.track({
      event_type: 'telegram_preferences_updated',
      category: 'preferences',
      properties: changes,
      ...getUserContext(),
    })
  },

  /**
   * User sent test notification
   *
   * @param type - Type of test notification sent
   */
  testNotificationSent(type: string) {
    analyticsService.track({
      event_type: 'telegram_test_notification_sent',
      category: 'behavior',
      properties: {
        notification_type: type,
      },
      ...getUserContext(),
    })
  },

  // ===========================================================================
  // User Behavior Metrics (NICE TO HAVE Priority)
  // ===========================================================================

  /**
   * User viewed notifications settings page
   */
  pageViewed() {
    analyticsService.track({
      event_type: 'telegram_page_viewed',
      category: 'behavior',
      properties: {},
      ...getUserContext(),
    })
  },

  /**
   * User clicked help section link
   */
  helpClicked() {
    analyticsService.track({
      event_type: 'telegram_help_clicked',
      category: 'behavior',
      properties: {},
      ...getUserContext(),
    })
  },

  /**
   * User toggled a specific event type on/off
   *
   * @param eventType - Event type that was toggled
   * @param enabled - New state (true = enabled, false = disabled)
   */
  eventTypeToggled(eventType: string, enabled: boolean) {
    analyticsService.track({
      event_type: 'telegram_event_type_toggled',
      category: 'behavior',
      properties: {
        event_type: eventType,
        enabled,
      },
      ...getUserContext(),
    })
  },

  /**
   * User changed notification language
   *
   * @param fromLanguage - Previous language
   * @param toLanguage - New language
   */
  languageChanged(fromLanguage: string, toLanguage: string) {
    analyticsService.track({
      event_type: 'telegram_language_changed',
      category: 'behavior',
      properties: {
        from_language: fromLanguage,
        to_language: toLanguage,
      },
      ...getUserContext(),
    })
  },

  /**
   * User enabled daily digest
   */
  dailyDigestEnabled() {
    analyticsService.track({
      event_type: 'telegram_daily_digest_enabled',
      category: 'behavior',
      properties: {},
      ...getUserContext(),
    })
  },

  /**
   * User enabled quiet hours
   */
  quietHoursEnabled() {
    analyticsService.track({
      event_type: 'telegram_quiet_hours_enabled',
      category: 'behavior',
      properties: {},
      ...getUserContext(),
    })
  },
}
