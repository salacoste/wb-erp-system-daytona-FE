/**
 * Advertising Campaigns Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeCampaign,
  normalizeCampaignsResponse,
  normalizeSyncStatusResponse,
} from '../advertising-campaigns-normalizer'

// --- normalizeCampaign ---

describe('normalizeCampaign', () => {
  it('normalizes a fully-populated campaign', () => {
    const raw = {
      advertId: 100,
      name: 'Summer Sale',
      type: 8,
      typeLabel: 'Автоматическая',
      status: 9,
      statusLabel: 'Активна',
      createdAt: '2026-01-01T00:00:00Z',
      startDate: '2026-01-10',
      endDate: '2026-02-10',
      dailyBudget: 5000,
      nmIds: [111, 222, 333],
      productsCount: 3,
      placements: { search: true, recommendations: false, carousel: true },
    }
    const result = normalizeCampaign(raw)
    expect(result.campaign_id).toBe(100)
    expect(result.name).toBe('Summer Sale')
    expect(result.type).toBe(8)
    expect(result.type_name).toBe('Автоматическая')
    expect(result.status).toBe(9)
    expect(result.status_name).toBe('Активна')
    expect(result.created_at).toBe('2026-01-01T00:00:00Z')
    expect(result.start_time).toBe('2026-01-10')
    expect(result.end_time).toBe('2026-02-10')
    expect(result.daily_budget).toBe(5000)
    expect(result.nm_ids).toEqual(['111', '222', '333'])
    expect(result.sku_count).toBe(3)
    expect(result.placements).toEqual({ search: true, recommendations: false, carousel: true })
  })

  it('defaults type_name and status_name when labels missing', () => {
    const result = normalizeCampaign({})
    expect(result.type_name).toBe('Неизвестно')
    expect(result.status_name).toBe('Неизвестно')
  })

  it('defaults endDate to null', () => {
    const result = normalizeCampaign({})
    expect(result.end_time).toBeNull()
  })

  it('defaults nm_ids to empty array when missing', () => {
    const result = normalizeCampaign({})
    expect(result.nm_ids).toEqual([])
  })

  it('defaults placements to null when missing', () => {
    const result = normalizeCampaign({})
    expect(result.placements).toBeNull()
  })

  it('defaults placements to null when null', () => {
    const result = normalizeCampaign({ placements: null })
    expect(result.placements).toBeNull()
  })

  it('handles carousel as undefined when falsey', () => {
    const raw = { placements: { search: true, recommendations: true, carousel: false } }
    const result = normalizeCampaign(raw)
    expect(result.placements?.carousel).toBeUndefined()
  })
})

// --- normalizeCampaignsResponse ---

describe('normalizeCampaignsResponse', () => {
  it('normalizes campaigns response with active count', () => {
    const raw = {
      campaigns: [
        { advertId: 1, status: 9 },
        { advertId: 2, status: 7 },
        { advertId: 3, status: 9 },
      ],
      total: 3,
    }
    const result = normalizeCampaignsResponse(raw)
    expect(result.data).toHaveLength(3)
    expect(result.meta.total_count).toBe(3)
    expect(result.meta.active_count).toBe(2)
  })

  it('defaults to empty campaigns when missing', () => {
    const result = normalizeCampaignsResponse({})
    expect(result.data).toEqual([])
    expect(result.meta.total_count).toBe(0)
    expect(result.meta.active_count).toBe(0)
  })

  it('handles null input', () => {
    const result = normalizeCampaignsResponse(null)
    expect(result.data).toEqual([])
    expect(result.meta.total_count).toBe(0)
  })
})

// --- normalizeSyncStatusResponse ---

describe('normalizeSyncStatusResponse', () => {
  it('normalizes a fully-populated sync status', () => {
    const raw = {
      lastSyncAt: '2026-01-15T12:00:00Z',
      nextScheduledSync: '2026-01-15T18:00:00Z',
      status: 'idle',
      lastTask: {
        taskUuid: 'uuid-123',
        status: 'completed',
        startedAt: '2026-01-15T12:00:00Z',
        finishedAt: '2026-01-15T12:05:00Z',
        error: null,
      },
      campaignsSynced: 50,
      dataAvailableFrom: '2026-01-01',
      dataAvailableTo: '2026-01-15',
    }
    const result = normalizeSyncStatusResponse(raw)
    expect(result.lastSyncAt).toBe('2026-01-15T12:00:00Z')
    expect(result.nextScheduledSync).toBe('2026-01-15T18:00:00Z')
    expect(result.status).toBe('idle')
    expect(result.lastTask?.taskUuid).toBe('uuid-123')
    expect(result.lastTask?.status).toBe('completed')
    expect(result.lastTask?.error).toBeNull()
    expect(result.campaignsSynced).toBe(50)
    expect(result.dataAvailableFrom).toBe('2026-01-01')
  })

  it('omits lastTask when null', () => {
    const raw = { lastTask: null }
    const result = normalizeSyncStatusResponse(raw)
    expect(result.lastTask).toBeUndefined()
  })

  it('omits lastTask when missing', () => {
    const result = normalizeSyncStatusResponse({})
    expect(result.lastTask).toBeUndefined()
  })

  it('defaults nullable string fields', () => {
    const result = normalizeSyncStatusResponse({})
    expect(result.lastSyncAt).toBeNull()
    expect(result.dataAvailableFrom).toBeNull()
    expect(result.dataAvailableTo).toBeNull()
  })
})
