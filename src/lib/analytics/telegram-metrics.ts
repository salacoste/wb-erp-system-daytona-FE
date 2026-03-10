// ============================================================================
// Telegram Metrics Helpers - Unified Re-export
// Epic 34-FE: Monitoring & Analytics
// ============================================================================

/**
 * Telegram-specific metrics tracking helpers
 *
 * Usage:
 * import { TelegramMetrics } from '@/lib/analytics/telegram-metrics'
 *
 * TelegramMetrics.bindingStarted()
 * TelegramMetrics.bindingCompleted(45.3)  // 45.3 seconds duration
 * TelegramMetrics.apiError('/v1/notifications/bind', 500, 'Internal Server Error')
 *
 * @see docs/DEV-HANDOFF-EPIC-34-FE.md#-monitoring--analytics-implementation-recommended
 */

import { TelegramBindingMetrics } from './telegram-binding-metrics'
import { TelegramBehaviorMetrics } from './telegram-behavior-metrics'

// Re-export helpers for use by sub-modules
export { getUserContext } from './telegram-metrics-helpers'

// ============================================================================
// Unified TelegramMetrics facade
// Preserves the original API so all existing imports continue to work
// ============================================================================

export const TelegramMetrics = {
  // Binding Flow Metrics (CRITICAL Priority)
  bindingStarted: TelegramBindingMetrics.bindingStarted,
  bindingCompleted: TelegramBindingMetrics.bindingCompleted,
  bindingFailed: TelegramBindingMetrics.bindingFailed,
  bindingExpired: TelegramBindingMetrics.bindingExpired,
  bindingCancelled: TelegramBindingMetrics.bindingCancelled,

  // API Error Metrics (CRITICAL Priority)
  apiError: TelegramBindingMetrics.apiError,
  networkError: TelegramBindingMetrics.networkError,

  // Unbind Metrics (CRITICAL Priority)
  unbindCompleted: TelegramBindingMetrics.unbindCompleted,

  // Preferences Metrics (HIGH Priority)
  preferencesUpdated: TelegramBehaviorMetrics.preferencesUpdated,
  testNotificationSent: TelegramBehaviorMetrics.testNotificationSent,

  // User Behavior Metrics (NICE TO HAVE Priority)
  pageViewed: TelegramBehaviorMetrics.pageViewed,
  helpClicked: TelegramBehaviorMetrics.helpClicked,
  eventTypeToggled: TelegramBehaviorMetrics.eventTypeToggled,
  languageChanged: TelegramBehaviorMetrics.languageChanged,
  dailyDigestEnabled: TelegramBehaviorMetrics.dailyDigestEnabled,
  quietHoursEnabled: TelegramBehaviorMetrics.quietHoursEnabled,
}
