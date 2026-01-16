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
 * Usage:
 * import { analyticsService } from '@/lib/analytics/analytics.service'
 *
 * analyticsService.track({
 *   event_type: 'telegram_binding_started',
 *   category: 'binding',
 *   properties: { source: 'hero_banner' }
 * })
 *
 * @see docs/DEV-HANDOFF-EPIC-34-FE.md#-monitoring--analytics-implementation-recommended
 */

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsEvent {
  timestamp: string; // ISO 8601
  event_type: string; // e.g. "telegram_binding_started"
  category: 'binding' | 'preferences' | 'error' | 'behavior';
  properties: Record<string, any>; // Event-specific data
  user_id?: string; // Optional user tracking
  cabinet_id?: string; // Multi-tenant isolation
}

// ============================================================================
// Analytics Service Class
// ============================================================================

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private batchInterval = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;
  private baseUrl: string;
  private isEnabled = false;

  constructor() {
    // SSR-safe: only initialize in browser
    if (typeof window === 'undefined') {
      this.baseUrl = '';
      return;
    }

    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    this.isEnabled = true;
  }

  /**
   * Track an event
   * Events are queued in memory and sent in batches every 30s
   *
   * @param event - Event to track (timestamp added automatically)
   */
  track(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    if (!this.isEnabled) return;

    this.events.push({
      ...event,
      timestamp: new Date().toISOString(),
    });

    // Auto-flush if queue gets too large (>50 events)
    // Prevents memory buildup in long sessions
    if (this.events.length >= 50) {
      void this.flush();
    }
  }

  /**
   * Flush all queued events to backend immediately
   * Called automatically every 30s and on page unload
   *
   * @returns Promise<void>
   */
  async flush(): Promise<void> {
    if (!this.isEnabled || this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      const response = await fetch(`${this.baseUrl}/v1/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
        // Don't include credentials for analytics endpoint (no auth required)
        credentials: 'omit',
      });

      if (!response.ok) {
        console.warn(
          `[Analytics] Failed to send events (${response.status}):`,
          await response.text()
        );
        // Re-queue events for next batch (max 1 retry)
        if (this.events.length < 100) {
          this.events.push(...eventsToSend);
        }
      }
    } catch (error) {
      console.error('[Analytics] Network error sending events:', error);
      // Re-queue events for next batch (max 1 retry)
      if (this.events.length < 100) {
        this.events.push(...eventsToSend);
      }
    }
  }

  /**
   * Start periodic batch sending (30s intervals)
   * Auto-starts when service is created
   */
  start(): void {
    if (!this.isEnabled || this.intervalId) return;

    // Periodic flush every 30s
    this.intervalId = setInterval(() => {
      void this.flush();
    }, this.batchInterval);

    // Flush on page unload (before user leaves)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        // Synchronous flush for page unload
        // Note: Modern browsers may not wait for async flush
        void this.flush();
      });

      // Also flush on visibility change (tab switch, minimize)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          void this.flush();
        }
      });
    }
  }

  /**
   * Stop periodic batch sending
   * Flushes any remaining events
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    void this.flush(); // Final flush
  }

  /**
   * Get current queue size (for debugging)
   */
  getQueueSize(): number {
    return this.events.length;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const analyticsService = new AnalyticsService();

// Auto-start service when module loads (browser only)
if (typeof window !== 'undefined') {
  analyticsService.start();
}
