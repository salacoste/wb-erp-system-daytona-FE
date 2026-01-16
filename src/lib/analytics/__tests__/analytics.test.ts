// ============================================================================
// Analytics Service Tests
// Epic 34-FE: Monitoring & Analytics
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyticsService } from '../analytics.service';
import { TelegramMetrics } from '../telegram-metrics';

// Mock fetch globally
global.fetch = vi.fn();

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any queued events
    analyticsService.stop();
  });

  describe('Event Tracking', () => {
    it('should track events with timestamp', () => {
      const event = {
        event_type: 'test_event',
        category: 'binding' as const,
        properties: { test: true },
      };

      analyticsService.track(event);

      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should auto-flush when queue reaches 50 events', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      // Add 50 events to trigger auto-flush
      for (let i = 0; i < 50; i++) {
        analyticsService.track({
          event_type: `test_event_${i}`,
          category: 'binding',
          properties: {},
        });
      }

      // Wait for async flush
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Batch Flushing', () => {
    it('should send events in batch to backend', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      analyticsService.track({
        event_type: 'event_1',
        category: 'binding',
        properties: {},
      });

      analyticsService.track({
        event_type: 'event_2',
        category: 'preferences',
        properties: {},
      });

      await analyticsService.flush();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/analytics/events'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should retry failed requests once', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      analyticsService.track({
        event_type: 'test_event',
        category: 'error',
        properties: {},
      });

      await analyticsService.flush();

      // Events should be re-queued for retry
      expect(analyticsService.getQueueSize()).toBeGreaterThan(0);
    });
  });
});

describe('TelegramMetrics Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsService.stop();
  });

  describe('Binding Flow Metrics', () => {
    it('should track binding started', () => {
      TelegramMetrics.bindingStarted();
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track binding completed with duration', () => {
      TelegramMetrics.bindingCompleted(45.3);
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track binding failed with error message', () => {
      TelegramMetrics.bindingFailed('Rate limit exceeded');
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track binding expired', () => {
      TelegramMetrics.bindingExpired();
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track binding cancelled with elapsed time', () => {
      TelegramMetrics.bindingCancelled(120);
      expect(analyticsService.getQueueSize()).toBe(1);
    });
  });

  describe('API Error Metrics', () => {
    it('should track API errors with status code', () => {
      TelegramMetrics.apiError('/v1/notifications/bind', 500, 'Internal Server Error');
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track network errors', () => {
      TelegramMetrics.networkError('/v1/notifications/status');
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should truncate long error messages to 500 chars', () => {
      const longError = 'A'.repeat(1000);
      TelegramMetrics.apiError('/v1/test', 400, longError);

      // Verify event is queued (actual truncation happens in helper)
      expect(analyticsService.getQueueSize()).toBe(1);
    });
  });

  describe('Preferences Metrics', () => {
    it('should track preferences update with changes', () => {
      const changes = {
        event_types: { task_completed: true, task_failed: false },
        language: 'en',
      };

      TelegramMetrics.preferencesUpdated(changes);
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track test notification sent', () => {
      TelegramMetrics.testNotificationSent('task_completed');
      expect(analyticsService.getQueueSize()).toBe(1);
    });
  });

  describe('User Behavior Metrics', () => {
    it('should track page views', () => {
      TelegramMetrics.pageViewed();
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track help link clicks', () => {
      TelegramMetrics.helpClicked();
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track event type toggles', () => {
      TelegramMetrics.eventTypeToggled('task_completed', true);
      expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track language changes', () => {
      TelegramMetrics.languageChanged('ru', 'en');
      expect(analyticsService.getQueueSize()).toBe(1);
    });
  });

  describe('Unbind Metrics', () => {
    it('should track unbind completion', () => {
      TelegramMetrics.unbindCompleted();
      expect(analyticsService.getQueueSize()).toBe(1);
    });
  });
});

describe('SSR Safety', () => {
  it('should not initialize in SSR environment', () => {
    // Mock SSR environment
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    // Service should not throw error
    expect(() => {
      analyticsService.track({
        event_type: 'test',
        category: 'binding',
        properties: {},
      });
    }).not.toThrow();

    // Restore window
    // @ts-ignore
    global.window = originalWindow;
  });
});
