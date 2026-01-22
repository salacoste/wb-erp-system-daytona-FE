// ============================================================================
// Telegram Notifications API Client Tests
// Epic 34-FE: Story 34.1-FE
// ============================================================================

import { describe, expect, it, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  startTelegramBinding,
  getBindingStatus,
  unbindTelegram,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
} from '../notifications';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    if (key === 'access_token') return 'test-token';
    if (key === 'cabinet_id') return 'test-cabinet-id';
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const API_BASE_URL = 'http://localhost:3000';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Telegram Binding API', () => {
  it('should start binding and return code', async () => {
    server.use(
      http.post(`${API_BASE_URL}/v1/notifications/telegram/bind`, () => {
        return HttpResponse.json({
          binding_code: 'A1B2C3D4',
          expires_at: '2025-12-29T14:00:00Z',
          instructions: 'Send /start A1B2C3D4 to @Kernel_crypto_bot',
          deep_link: 'https://t.me/Kernel_crypto_bot?start=A1B2C3D4',
        });
      })
    );

    const result = await startTelegramBinding();
    expect(result.binding_code).toBe('A1B2C3D4');
    expect(result.deep_link).toContain('Kernel_crypto_bot');
  });

  it('should get binding status', async () => {
    server.use(
      http.get(`${API_BASE_URL}/v1/notifications/telegram/status`, () => {
        return HttpResponse.json({
          bound: true,
          telegram_user_id: 123456789,
          telegram_username: 'testuser',
          binding_expires_at: null,
        });
      })
    );

    const result = await getBindingStatus();
    expect(result.bound).toBe(true);
    expect(result.telegram_username).toBe('testuser');
  });

  it('should unbind telegram', async () => {
    server.use(
      http.delete(`${API_BASE_URL}/v1/notifications/telegram/unbind`, () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    // 204 No Content returns empty string from apiClient (response.text())
    const result = await unbindTelegram();
    expect(result === undefined || result === '').toBe(true);
  });

  it('should handle API errors', async () => {
    server.use(
      http.post(`${API_BASE_URL}/v1/notifications/telegram/bind`, () => {
        return HttpResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests',
            },
          },
          { status: 429 }
        );
      })
    );

    await expect(startTelegramBinding()).rejects.toThrow('Too many requests');
  });
});

describe('Notification Preferences API', () => {
  it('should get notification preferences', async () => {
    server.use(
      http.get(`${API_BASE_URL}/v1/notifications/preferences`, () => {
        return HttpResponse.json({
          cabinet_id: 'test-cabinet-id',
          telegram_enabled: true,
          telegram_bound: true,
          telegram_username: 'testuser',
          preferences: {
            task_completed: true,
            task_failed: true,
            task_stalled: false,
            daily_digest: true,
            digest_time: '09:00',
          },
          language: 'ru',
          quiet_hours: {
            enabled: true,
            from: '23:00',
            to: '07:00',
            timezone: 'Europe/Moscow',
          },
        });
      })
    );

    const result = await getNotificationPreferences();
    expect(result.telegram_enabled).toBe(true);
    expect(result.preferences.task_completed).toBe(true);
  });

  it('should update notification preferences', async () => {
    server.use(
      http.put(`${API_BASE_URL}/v1/notifications/preferences`, () => {
        return HttpResponse.json({
          cabinet_id: 'test-cabinet-id',
          telegram_enabled: true,
          telegram_bound: true,
          telegram_username: 'testuser',
          preferences: {
            task_completed: false, // Updated
            task_failed: true,
            task_stalled: false,
            daily_digest: true,
            digest_time: '09:00',
          },
          language: 'ru',
          quiet_hours: {
            enabled: true,
            from: '23:00',
            to: '07:00',
            timezone: 'Europe/Moscow',
          },
        });
      })
    );

    const result = await updateNotificationPreferences({
      preferences: { task_completed: false },
    });
    expect(result.preferences.task_completed).toBe(false);
  });
});

describe('Test Notification API', () => {
  it('should send test notification', async () => {
    server.use(
      http.post(`${API_BASE_URL}/v1/notifications/test`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Test notification sent to @testuser',
        });
      })
    );

    const result = await sendTestNotification();
    expect(result.success).toBe(true);
    expect(result.message).toContain('@testuser');
  });
});
