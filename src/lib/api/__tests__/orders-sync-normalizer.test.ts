/**
 * Boundary Normalizer Tests — Orders Sync Status
 */

import { describe, it, expect } from 'vitest'
import { normalizeSyncStatusResponse } from '../orders-sync-normalizer'

describe('normalizeSyncStatusResponse', () => {
  it('maps full sync status', () => {
    const raw = {
      enabled: true,
      lastSyncAt: '2025-01-01T12:00:00Z',
      nextSyncAt: '2025-01-01T13:00:00Z',
      schedule: '0 */6 * * *',
      timezone: 'Europe/Moscow',
    }
    const result = normalizeSyncStatusResponse(raw)
    expect(result.enabled).toBe(true)
    expect(result.lastSyncAt).toBe('2025-01-01T12:00:00Z')
    expect(result.nextSyncAt).toBe('2025-01-01T13:00:00Z')
    expect(result.schedule).toBe('0 */6 * * *')
    expect(result.timezone).toBe('Europe/Moscow')
  })

  it('handles null input', () => {
    const result = normalizeSyncStatusResponse(null)
    expect(result.enabled).toBe(false)
    expect(result.lastSyncAt).toBeNull()
    expect(result.nextSyncAt).toBeNull()
    expect(result.schedule).toBe('')
    expect(result.timezone).toBe('')
  })

  it('handles missing fields', () => {
    const result = normalizeSyncStatusResponse({})
    expect(result.enabled).toBe(false)
    expect(result.lastSyncAt).toBeNull()
    expect(result.schedule).toBe('')
  })
})
