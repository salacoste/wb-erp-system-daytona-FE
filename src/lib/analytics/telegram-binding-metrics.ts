// ============================================================================
// Telegram Binding & Error Metrics
// Epic 34-FE: Monitoring & Analytics
// Extracted from telegram-metrics.ts - CRITICAL Priority metrics
// ============================================================================

import { analyticsService } from './analytics.service'
import { getUserContext } from './telegram-metrics-helpers'

// ============================================================================
// Binding Flow Metrics (CRITICAL Priority)
// ============================================================================

export const TelegramBindingMetrics = {
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
    })
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
    })
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
        error_message: errorMessage.slice(0, 500),
      },
      ...getUserContext(),
    })
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
        timeout_seconds: 600,
      },
      ...getUserContext(),
    })
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
    })
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
    })
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
    })
  },

  /**
   * User successfully disconnected Telegram
   */
  unbindCompleted() {
    analyticsService.track({
      event_type: 'telegram_unbind_completed',
      category: 'binding',
      properties: {},
      ...getUserContext(),
    })
  },
}
