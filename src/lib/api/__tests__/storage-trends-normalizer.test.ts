/**
 * Storage Trends Normalizer Tests
 * Covers: normalizeStorageTrendsResponse, normalizeStorageSummaryResponse
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeStorageTrendsResponse,
  normalizeStorageSummaryResponse,
} from '../storage-trends-normalizer'

// ---------------------------------------------------------------------------
// normalizeStorageTrendsResponse
// ---------------------------------------------------------------------------

describe('normalizeStorageTrendsResponse', () => {
  it('happy path: normalizes full trends envelope', () => {
    const raw = {
      period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
      nm_id: null,
      data: [
        { week: '2025-W44', storage_cost: 100, volume: 5.0 },
        { week: '2025-W45', storage_cost: 120, volume: 6.0 },
      ],
      summary: {
        storage_cost: { min: 100, max: 120, avg: 110, trend: 20 },
        volume: { min: 5, max: 6, avg: 5.5, trend: 10 },
      },
      has_data: true,
    }
    const result = normalizeStorageTrendsResponse(raw, '2025-W44', '2025-W47')
    expect(result.data).toHaveLength(2)
    expect(result.data[0].week).toBe('2025-W44')
    expect(result.data[0].storage_cost).toBe(100)
    expect(result.data[1].volume).toBe(6.0)
    expect(result.summary?.storage_cost?.avg).toBe(110)
    expect(result.has_data).toBe(true)
    expect(result.nm_id).toBeNull()
  })

  it('null input returns empty with fallback period', () => {
    const result = normalizeStorageTrendsResponse(null, '2025-W01', '2025-W04')
    expect(result.data).toEqual([])
    expect(result.period.from).toBe('2025-W01')
    expect(result.period.to).toBe('2025-W04')
    expect(result.has_data).toBe(false)
    expect(result.summary).toBeUndefined()
  })

  it('bare array input is treated as data', () => {
    const raw = [{ week: '2025-W44', storage_cost: 100 }]
    const result = normalizeStorageTrendsResponse(raw, 'W1', 'W2')
    expect(result.data).toHaveLength(1)
    expect(result.data[0].week).toBe('2025-W44')
  })

  it('missing fields default safely', () => {
    const raw = { data: [{}] }
    const result = normalizeStorageTrendsResponse(raw, 'W1', 'W2')
    const point = result.data[0]
    expect(point.week).toBe('')
    expect(point.storage_cost).toBeNull()
    expect(point.volume).toBeNull()
  })

  it('null storage_cost and volume are preserved as null', () => {
    const raw = { data: [{ week: 'W1', storage_cost: null, volume: null }] }
    const result = normalizeStorageTrendsResponse(raw, 'W1', 'W2')
    expect(result.data[0].storage_cost).toBeNull()
    expect(result.data[0].volume).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// normalizeStorageSummaryResponse
// ---------------------------------------------------------------------------

describe('normalizeStorageSummaryResponse', () => {
  it('happy path: normalizes full summary response', () => {
    const raw = {
      period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
      data: {
        totalCost: 5000,
        uniqueSkus: 100,
        totalVolume: 250.5,
        daysCount: 28,
        avgCostPerSku: 50,
        dateFrom: '2025-10-28',
        dateTo: '2025-11-24',
      },
    }
    const result = normalizeStorageSummaryResponse(raw)
    expect(result.data.totalCost).toBe(5000)
    expect(result.data.uniqueSkus).toBe(100)
    expect(result.data.totalVolume).toBe(250.5)
    expect(result.data.daysCount).toBe(28)
    expect(result.data.avgCostPerSku).toBe(50)
    expect(result.period.from).toBe('2025-W44')
  })

  it('null input returns zeros and empty strings', () => {
    const result = normalizeStorageSummaryResponse(null)
    // BD-16: money fields (totalCost, avgCostPerSku) preserve null (AP#8); counts stay 0.
    expect(result.data.totalCost).toBeNull()
    expect(result.data.uniqueSkus).toBe(0)
    expect(result.data.totalVolume).toBe(0)
    expect(result.data.daysCount).toBe(0)
    expect(result.data.avgCostPerSku).toBeNull()
    expect(result.data.dateFrom).toBe('')
    expect(result.data.dateTo).toBe('')
  })

  it('missing data object defaults to zeros', () => {
    const result = normalizeStorageSummaryResponse({})
    expect(result.data.totalCost).toBeNull()
    expect(result.data.uniqueSkus).toBe(0)
    expect(result.data.avgCostPerSku).toBeNull()
  })

  it('snake_case dual-lookup: total_cost maps to totalCost', () => {
    const raw = {
      period: { from: 'W1', to: 'W2', days_count: 7 },
      data: { total_cost: 3000, unique_skus: 50, total_volume: 100 },
    }
    const result = normalizeStorageSummaryResponse(raw)
    expect(result.data.totalCost).toBe(3000)
    expect(result.data.uniqueSkus).toBe(50)
    expect(result.data.totalVolume).toBe(100)
  })

  // BD-16: summary money fields must preserve null (AP#8) — never collapse to 0.
  it('null totalCost/avgCostPerSku preserved as null (BD-16, AP#8)', () => {
    const raw = {
      period: { from: 'W1', to: 'W2', days_count: 7 },
      data: { totalCost: null, avgCostPerSku: null, uniqueSkus: 5, totalVolume: 10 },
    }
    const result = normalizeStorageSummaryResponse(raw)
    expect(result.data.totalCost).toBeNull()
    expect(result.data.avgCostPerSku).toBeNull()
    expect(result.data.uniqueSkus).toBe(5) // count stays
    expect(result.data.totalVolume).toBe(10) // count stays
  })
})
