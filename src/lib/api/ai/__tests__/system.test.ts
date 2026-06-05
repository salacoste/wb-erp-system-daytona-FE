/**
 * AI System normalizer tests — Story 108.1-FE
 * Covers health status guard, engineConnected boolean, preferences flag,
 * and latencyMs semantic-zero.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAiHealthResponse, normalizeAiPreferences } from '../system'

describe('normalizeAiHealthResponse', () => {
  it('defaults status to "ok" when missing or unknown', () => {
    expect(normalizeAiHealthResponse({}).status).toBe('ok')
    expect(normalizeAiHealthResponse({ status: null }).status).toBe('ok')
    expect(normalizeAiHealthResponse({ status: 'unknown' }).status).toBe('ok')
  })

  it('passes through "degraded" status', () => {
    expect(normalizeAiHealthResponse({ status: 'degraded' }).status).toBe('degraded')
  })

  it('defaults engineConnected to false when missing', () => {
    expect(normalizeAiHealthResponse({}).engineConnected).toBe(false)
  })

  it('passes through engineConnected true', () => {
    expect(normalizeAiHealthResponse({ engineConnected: true }).engineConnected).toBe(true)
  })

  it('uses semantic-zero for latencyMs when missing (count field)', () => {
    expect(normalizeAiHealthResponse({}).latencyMs).toBe(0)
  })

  it('passes through latencyMs when provided', () => {
    expect(normalizeAiHealthResponse({ latencyMs: 42 }).latencyMs).toBe(42)
  })

  it('defaults cachedPredictionsAvailable to false when missing', () => {
    expect(normalizeAiHealthResponse({}).cachedPredictionsAvailable).toBe(false)
  })

  it('passes through fully populated health response', () => {
    const result = normalizeAiHealthResponse({
      status: 'ok',
      engineConnected: true,
      engine: 'prophet',
      latencyMs: 85,
      cachedPredictionsAvailable: true,
    })
    expect(result).toEqual({
      status: 'ok',
      engineConnected: true,
      engine: 'prophet',
      latencyMs: 85,
      cachedPredictionsAvailable: true,
    })
  })
})

describe('normalizeAiPreferences', () => {
  it('defaults aiEnabled to false when missing', () => {
    expect(normalizeAiPreferences({}).aiEnabled).toBe(false)
    expect(normalizeAiPreferences({ aiEnabled: null }).aiEnabled).toBe(false)
  })

  it('passes through aiEnabled: true', () => {
    expect(normalizeAiPreferences({ aiEnabled: true }).aiEnabled).toBe(true)
  })

  it('passes through aiEnabled: false', () => {
    expect(normalizeAiPreferences({ aiEnabled: false }).aiEnabled).toBe(false)
  })
})

// ── getAnomalies — PENDING BACKEND #167 (Story 112.3-FE) ─────────────────────
// The function does real API calls; we mock apiClient to test normalization.

import { vi } from 'vitest'
import { getAnomalies } from '../system'

vi.mock('../../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '../../../api-client'
const mockGet = vi.mocked(apiClient.get)

describe('getAnomalies (PENDING BACKEND #167)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('maps offset/limit to page correctly', async () => {
    mockGet.mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 50,
      offset: 100,
    })
    const result = await getAnomalies({ page: 3, limit: 50 })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(50)
  })

  it('defaults page to 1 when offset is 0', async () => {
    mockGet.mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    })
    const result = await getAnomalies()
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('defaults page to 1 when called with undefined params', async () => {
    mockGet.mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    })
    const result = await getAnomalies(undefined)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('normalizes items with null vendorCode/resolvedAt', async () => {
    mockGet.mockResolvedValueOnce({
      items: [
        {
          id: 'a-1',
          nmId: null,
          vendorCode: null,
          anomalyType: 'margin_drop',
          severity: 'critical',
          value: -15.5,
          baselineValue: 10.2,
          deviationPct: -251,
          rootCauseHint: null,
          status: 'pending',
          detectedAt: '2026-06-01T00:00:00Z',
          resolvedAt: null,
          resolutionCause: null,
          resolutionNote: null,
        },
      ],
      total: 1,
      limit: 10,
      offset: 10,
    })
    const result = await getAnomalies({ page: 2, limit: 10 })
    expect(result.total).toBe(1)
    expect(result.page).toBe(2)
    expect(result.anomalies).toHaveLength(1)
    expect(result.anomalies[0].vendorCode).toBeNull()
    expect(result.anomalies[0].resolvedAt).toBeNull()
    expect(result.anomalies[0].nmId).toBe(0) // SEMANTIC-ZERO per normalizer-helpers
  })

  it('echoes status param when provided (F-3)', async () => {
    mockGet.mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    })
    const result = await getAnomalies({ status: 'resolved' })
    expect(result.status).toBe('resolved')
    // Verify the query string included status
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('status=resolved'))
  })

  it('status is undefined when not provided', async () => {
    mockGet.mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    })
    const result = await getAnomalies({ page: 1 })
    expect(result.status).toBeUndefined()
  })
})
