/**
 * Boundary Normalizer Tests — Monitoring Telegram Health
 */

import { describe, it, expect } from 'vitest'
import { normalizeTelegramHealthResponse } from '../monitoring-telegram-normalizer'

describe('normalizeTelegramHealthResponse', () => {
  const fullRaw = {
    cabinetId: 'cab-1',
    generatedAt: '2025-01-01T00:00:00Z',
    period: { from: '2025-01-01', to: '2025-01-07' },
    bot: { status: 'active', lastActivityAt: '2025-01-01T12:00:00Z' },
    binding: { isBound: true, boundAt: '2025-01-01', telegramUsername: '@user', isVerified: true },
    delivery: {
      totalSent: 100,
      totalFailed: 2,
      totalRateLimited: 0,
      totalSkippedQuietHours: 5,
      deliveryRate: 0.98,
      avgDeliveryMs: 150,
    },
    eventBreakdown: [{ eventType: 'task_completed', enabled: true, sentCount: 50, failedCount: 1 }],
    recentFailures: [
      { timestamp: '2025-01-01', eventType: 'task_failed', errorMessage: 'timeout' },
    ],
    preferences: {
      telegramEnabled: true,
      quietHoursEnabled: false,
      quietHoursFrom: null,
      quietHoursTo: null,
      language: 'ru',
      enabledEvents: ['task_completed'],
      disabledEvents: [],
    },
  }

  it('maps full telegram health response', () => {
    const result = normalizeTelegramHealthResponse(fullRaw)
    expect(result.cabinetId).toBe('cab-1')
    expect(result.bot.status).toBe('active')
    expect(result.binding.telegramUsername).toBe('@user')
    expect(result.delivery.totalSent).toBe(100)
    expect(result.eventBreakdown).toHaveLength(1)
    expect(result.recentFailures).toHaveLength(1)
    expect(result.preferences.language).toBe('ru')
  })

  it('handles null input', () => {
    const result = normalizeTelegramHealthResponse(null)
    expect(result.cabinetId).toBe('')
    expect(result.bot.status).toBe('not_configured')
    expect(result.binding.isBound).toBe(false)
    expect(result.delivery.totalSent).toBe(0)
    expect(result.eventBreakdown).toHaveLength(0)
    expect(result.recentFailures).toHaveLength(0)
    expect(result.preferences.enabledEvents).toHaveLength(0)
  })

  it('handles missing nested objects', () => {
    const result = normalizeTelegramHealthResponse({})
    expect(result.bot.lastActivityAt).toBeNull()
    expect(result.binding.boundAt).toBeNull()
    expect(result.delivery.avgDeliveryMs).toBeNull()
  })
})
