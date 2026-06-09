/**
 * AnalyticsService — Batch event tracking class
 * Extracted from analytics.service.ts for file-size compliance (Epic 134-FE)
 */

import { logger } from '@/lib/logger'
import type { AnalyticsEvent } from './analytics.service'

// ============================================================================
// Analytics Service Class
// ============================================================================

export class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private batchInterval = 30000 // 30 seconds
  private intervalId?: NodeJS.Timeout
  private baseUrl: string
  private isEnabled = false

  constructor() {
    // SSR-safe: only initialize in browser
    if (typeof window === 'undefined') {
      this.baseUrl = ''
      return
    }

    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    this.isEnabled = true
  }

  /**
   * Track an event
   * Events are queued in memory and sent in batches every 30s
   */
  track(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    if (!this.isEnabled) return

    this.events.push({
      ...event,
      timestamp: new Date().toISOString(),
    })

    // Auto-flush if queue gets too large (>50 events)
    if (this.events.length >= 50) {
      void this.flush()
    }
  }

  /**
   * Flush all queued events to backend immediately
   * Called automatically every 30s and on page unload
   */
  async flush(): Promise<void> {
    if (!this.isEnabled || this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    try {
      const response = await fetch(`${this.baseUrl}/v1/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
        credentials: 'omit',
      })

      if (!response.ok) {
        logger.warn(
          `[Analytics] Failed to send events (${response.status}):`,
          await response.text()
        )
        // Re-queue events for next batch (max 1 retry)
        if (this.events.length < 100) {
          this.events.push(...eventsToSend)
        }
      }
    } catch (error) {
      logger.error('[Analytics] Network error sending events:', error)
      if (this.events.length < 100) {
        this.events.push(...eventsToSend)
      }
    }
  }

  /**
   * Start periodic batch sending (30s intervals)
   */
  start(): void {
    if (!this.isEnabled || this.intervalId) return

    this.intervalId = setInterval(() => {
      void this.flush()
    }, this.batchInterval)

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        void this.flush()
      })

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          void this.flush()
        }
      })
    }
  }

  /** Stop periodic batch sending. Flushes any remaining events. */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    void this.flush()
  }

  /** Get current queue size (for debugging) */
  getQueueSize(): number {
    return this.events.length
  }
}
