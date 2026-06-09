// ============================================================================
// Analytics Service - Lightweight Event Tracking
// Epic 34-FE: Monitoring & Analytics
// ============================================================================

/**
 * Lightweight analytics service for tracking Telegram notification events
 *
 * Features:
 * - Batch events every 30s to reduce API calls
 * - Auto-flush on page unload
 * - Queue events in memory
 * - Retry failed requests
 * - SSR-safe (only runs in browser)
 *
 * @see docs/DEV-HANDOFF-EPIC-34-FE.md#-monitoring--analytics-implementation-recommended
 */

import { AnalyticsService } from './analytics-service-class'

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsEvent {
  timestamp: string // ISO 8601
  event_type: string // e.g. "telegram_binding_started"
  category: 'binding' | 'preferences' | 'error' | 'behavior'
  properties: Record<string, unknown> // Event-specific data
  user_id?: string // Optional user tracking
  cabinet_id?: string // Multi-tenant isolation
}

// ============================================================================
// Singleton Export
// ============================================================================

export const analyticsService = new AnalyticsService()

// Auto-start service when module loads (browser only)
if (typeof window !== 'undefined') {
  analyticsService.start()
}
