/**
 * Boundary Normalizer Tests — Notifications domain
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeBindingStatusResponse,
  normalizeNotificationPreferencesResponse,
} from '../notifications-normalizer'

describe('normalizeBindingStatusResponse', () => {
  it('maps bound status', () => {
    const raw = {
      bound: true,
      telegram_user_id: 123456,
      telegram_username: '@testuser',
      binding_expires_at: null,
    }
    const result = normalizeBindingStatusResponse(raw)
    expect(result.bound).toBe(true)
    expect(result.telegram_user_id).toBe(123456)
    expect(result.telegram_username).toBe('@testuser')
  })

  it('maps unbound status', () => {
    const raw = {
      bound: false,
      telegram_user_id: null,
      telegram_username: null,
      binding_expires_at: '2025-01-01T12:00:00Z',
    }
    const result = normalizeBindingStatusResponse(raw)
    expect(result.bound).toBe(false)
    expect(result.telegram_user_id).toBeNull()
    expect(result.telegram_username).toBeNull()
  })

  it('handles null input', () => {
    const result = normalizeBindingStatusResponse(null)
    expect(result.bound).toBe(false)
    expect(result.telegram_user_id).toBeNull()
    expect(result.telegram_username).toBeNull()
    expect(result.binding_expires_at).toBeNull()
  })

  it('handles missing fields', () => {
    const result = normalizeBindingStatusResponse({})
    expect(result.bound).toBe(false)
  })
})

describe('normalizeNotificationPreferencesResponse', () => {
  const fullRaw = {
    cabinet_id: 'cab-1',
    telegram_enabled: true,
    telegram_bound: true,
    telegram_username: '@user',
    language: 'ru',
    preferences: {
      task_completed: true,
      task_failed: true,
      task_stalled: false,
      daily_digest: true,
      digest_time: '09:00',
    },
    quiet_hours: { enabled: true, from: '22:00', to: '08:00', timezone: 'Europe/Moscow' },
  }

  it('maps full preferences response', () => {
    const result = normalizeNotificationPreferencesResponse(fullRaw)
    expect(result.cabinet_id).toBe('cab-1')
    expect(result.telegram_enabled).toBe(true)
    expect(result.preferences.task_completed).toBe(true)
    expect(result.quiet_hours.from).toBe('22:00')
    expect(result.language).toBe('ru')
  })

  it('handles null input', () => {
    const result = normalizeNotificationPreferencesResponse(null)
    expect(result.cabinet_id).toBe('')
    expect(result.telegram_enabled).toBe(false)
    expect(result.language).toBe('ru')
    expect(result.preferences.digest_time).toBe('')
  })

  it('defaults unknown language to ru', () => {
    const result = normalizeNotificationPreferencesResponse({ language: 'de' })
    expect(result.language).toBe('ru')
  })
})
