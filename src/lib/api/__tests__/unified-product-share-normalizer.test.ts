/**
 * Unified Product Share (Organic-Share + Incremental ROAS) Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeCorrelationDay,
  normalizeOrganicShareResponse,
  normalizeIncrementalRoasResponse,
} from '../unified-product-share-normalizer'

// --- normalizeCorrelationDay ---

describe('normalizeCorrelationDay', () => {
  it('normalizes a fully-populated correlation day', () => {
    const raw = {
      date: '2026-01-15',
      nmId: 12345,
      adOrders: 10,
      estimatedAdCart: 5.5,
      organicCart: 20,
      confidence: 'high',
      campaigns: [{ advertId: 100, adOrders: 5, spend: 500, estimatedAdCart: 3.0 }],
    }
    const result = normalizeCorrelationDay(raw)
    expect(result.date).toBe('2026-01-15')
    expect(result.nmId).toBe('12345')
    expect(result.adOrders).toBe(10)
    expect(result.estimatedAdCart).toBe(5.5)
    expect(result.organicCart).toBe(20)
    expect(result.confidence).toBe('high')
    expect(result.campaigns).toHaveLength(1)
    expect(result.campaigns[0].advertId).toBe(100)
    expect(result.campaigns[0].spend).toBe(500)
  })

  it('defaults confidence to low for invalid value', () => {
    const raw = { confidence: 'bogus' }
    const result = normalizeCorrelationDay(raw)
    expect(result.confidence).toBe('low')
  })

  it('preserves null for estimatedAdCart (nullable number)', () => {
    const raw = { estimatedAdCart: null }
    const result = normalizeCorrelationDay(raw)
    expect(result.estimatedAdCart).toBeNull()
  })

  it('defaults campaigns to empty array when missing', () => {
    const result = normalizeCorrelationDay({})
    expect(result.campaigns).toEqual([])
  })

  it('defaults date to empty string when null', () => {
    const result = normalizeCorrelationDay({ date: null })
    expect(result.date).toBe('')
  })
})

// --- normalizeOrganicShareResponse ---

describe('normalizeOrganicShareResponse', () => {
  it('normalizes an array of correlation days', () => {
    const raw = [
      { date: '2026-01-15', nmId: 1, adOrders: 5, organicCart: 10 },
      { date: '2026-01-16', nmId: 2, adOrders: 3, organicCart: 8 },
    ]
    const result = normalizeOrganicShareResponse(raw)
    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2026-01-15')
    expect(result[1].adOrders).toBe(3)
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeOrganicShareResponse(null)).toEqual([])
    expect(normalizeOrganicShareResponse({})).toEqual([])
    expect(normalizeOrganicShareResponse('string')).toEqual([])
  })
})

// --- normalizeIncrementalRoasResponse ---

describe('normalizeIncrementalRoasResponse', () => {
  it('normalizes a fully-populated incremental ROAS response', () => {
    const raw = {
      nmId: 554433,
      period: { from: '2026-01-01', to: '2026-01-31' },
      totalRevenue: 500000,
      estimatedOrganicRevenue: 200000,
      adSpend: 100000,
      incrementalRevenue: 300000,
      iROAS: 3.0,
      interpretation: 'highly_effective',
      organicCannibalizationPct: 15.5,
      totalOrders: 100,
      estimatedOrganicOrders: 40,
    }
    const result = normalizeIncrementalRoasResponse(raw)
    expect(result.nmId).toBe('554433')
    expect(result.period.from).toBe('2026-01-01')
    expect(result.period.to).toBe('2026-01-31')
    expect(result.totalRevenue).toBe(500000)
    expect(result.iROAS).toBe(3.0)
    expect(result.interpretation).toBe('highly_effective')
    expect(result.organicCannibalizationPct).toBe(15.5)
    expect(result.totalOrders).toBe(100)
    expect(result.estimatedOrganicOrders).toBe(40)
  })

  it('preserves null for nullable number fields', () => {
    const raw = {
      period: {},
      iROAS: null,
      organicCannibalizationPct: null,
    }
    const result = normalizeIncrementalRoasResponse(raw)
    expect(result.iROAS).toBeNull()
    expect(result.organicCannibalizationPct).toBeNull()
  })

  it('returns null for invalid interpretation', () => {
    const raw = { period: {}, interpretation: 'unknown_value' }
    const result = normalizeIncrementalRoasResponse(raw)
    expect(result.interpretation).toBeNull()
  })

  it('defaults period fields to empty strings', () => {
    const result = normalizeIncrementalRoasResponse({})
    expect(result.period.from).toBe('')
    expect(result.period.to).toBe('')
  })

  it('defaults counts to 0', () => {
    const result = normalizeIncrementalRoasResponse({})
    expect(result.totalRevenue).toBe(0)
    expect(result.adSpend).toBe(0)
    expect(result.totalOrders).toBe(0)
  })
})
