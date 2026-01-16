// ============================================================================
// Telegram Metrics Helpers
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

import { analyticsService } from './analytics.service';
import { useAuthStore } from '@/stores/authStore';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current user context for all events
 * Safely accesses Zustand store (SSR-safe)
 */
function getUserContext() {
  // SSR-safe check
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const { cabinetId } = useAuthStore.getState();
    return {
      cabinet_id: cabinetId || undefined,
    };
  } catch (error) {
    // Fallback if store not initialized
    return {};
  }
}

// ============================================================================
// Telegram Metrics Helpers
// ============================================================================

export const TelegramMetrics = {
  // ===========================================================================
  // Binding Flow Metrics (CRITICAL Priority)
  // ===========================================================================

  /**
   * User clicked "Подключить Telegram" button
   * Tracks start of binding flow
   */
  bindingStarted() {
    analyticsService.track({
      event_type: 'telegram_binding_started',
      category: 'binding',
      properties: {
        source: 'hero_banner',
      },
      ...getUserContext(),
    });
  },

  /**
   * User successfully completed Telegram binding
   * Polling returned bound:true from backend
   *
   * @param durationSeconds - Time from start to completion
   */
  bindingCompleted(durationSeconds: number) {
    analyticsService.track({
      event_type: 'telegram_binding_completed',
      category: 'binding',
      properties: {
        duration_seconds: Math.round(durationSeconds),
      },
      ...getUserContext(),
    });
  },

  /**
   * Binding flow failed with error
   *
   * @param errorMessage - Error message from API or network
   */
  bindingFailed(errorMessage: string) {
    analyticsService.track({
      event_type: 'telegram_binding_failed',
      category: 'error',
      properties: {
        error_message: errorMessage.slice(0, 500), // Truncate long errors
      },
      ...getUserContext(),
    });
  },

  /**
   * Binding code expired (10-minute timer reached 0)
   * User didn't complete binding in time
   */
  bindingExpired() {
    analyticsService.track({
      event_type: 'telegram_binding_expired',
      category: 'binding',
      properties: {
        timeout_seconds: 600, // 10 minutes
      },
      ...getUserContext(),
    });
  },

  /**
   * User closed modal before completing binding
   *
   * @param elapsedSeconds - How long modal was open before closing
   */
  bindingCancelled(elapsedSeconds: number) {
    analyticsService.track({
      event_type: 'telegram_binding_cancelled',
      category: 'binding',
      properties: {
        elapsed_seconds: Math.round(elapsedSeconds),
      },
      ...getUserContext(),
    });
  },

  // ===========================================================================
  // API Error Metrics (CRITICAL Priority)
  // ===========================================================================

  /**
   * API call returned HTTP 4xx/5xx error
   *
   * @param endpoint - API endpoint path (e.g., '/v1/notifications/bind')
   * @param statusCode - HTTP status code (e.g., 500, 429, 401)
   * @param errorMessage - Error message from backend
   */
  apiError(endpoint: string, statusCode: number, errorMessage: string) {
    analyticsService.track({
      event_type: 'telegram_api_error',
      category: 'error',
      properties: {
        endpoint,
        status_code: statusCode,
        error_message: errorMessage.slice(0, 500),
      },
      ...getUserContext(),
    });
  },

  /**
   * Network error occurred (timeout, DNS failure, etc.)
   *
   * @param endpoint - API endpoint that failed
   */
  networkError(endpoint: string) {
    analyticsService.track({
      event_type: 'telegram_network_error',
      category: 'error',
      properties: {
        endpoint,
      },
      ...getUserContext(),
    });
  },

  // ===========================================================================
  // Unbind Metrics (CRITICAL Priority)
  // ===========================================================================

  /**
   * User successfully disconnected Telegram
   */
  unbindCompleted() {
    analyticsService.track({
      event_type: 'telegram_unbind_completed',
      category: 'binding',
      properties: {},
      ...getUserContext(),
    });
  },

  // ===========================================================================
  // Preferences Metrics (HIGH Priority)
  // ===========================================================================

  /**
   * User saved notification preferences
   *
   * @param changes - Preferences that were changed
   */
  preferencesUpdated(changes: {
    event_types?: Record<string, boolean | string>; // includes boolean toggles + digest_time string
    language?: string;
    daily_digest?: boolean;
    quiet_hours_enabled?: boolean;
  }) {
    analyticsService.track({
      event_type: 'telegram_preferences_updated',
      category: 'preferences',
      properties: changes,
      ...getUserContext(),
    });
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
    });
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
    });
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
    });
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
    });
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
    });
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
    });
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
    });
  },
};
