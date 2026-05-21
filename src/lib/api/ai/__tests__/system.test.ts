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

// ── getAnomalies stub — F-10 (Story 112.3-FE 1st-pass review) ─────────────────

import { getAnomalies } from '../system'

describe('getAnomalies stub (PENDING BACKEND #167)', () => {
  it('echoes page param when provided', async () => {
    const result = await getAnomalies({ page: 3, limit: 50 })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(50)
  })

  it('defaults page to 1 and limit to 20 when no params given', async () => {
    const result = await getAnomalies()
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('defaults page to 1 and limit to 20 when params is undefined', async () => {
    const result = await getAnomalies(undefined)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('always returns empty anomalies array and total 0 (stub mode)', async () => {
    const result = await getAnomalies({ page: 2, limit: 10 })
    expect(result.anomalies).toEqual([])
    expect(result.total).toBe(0)
  })

  it('echoes only page when limit is absent', async () => {
    const result = await getAnomalies({ page: 5 })
    expect(result.page).toBe(5)
    expect(result.limit).toBe(20)
  })

  it('echoes status param when provided (F-3, Story 112.3-FE 3rd-pass)', async () => {
    const result = await getAnomalies({ status: 'resolved' })
    expect(result.status).toBe('resolved')
  })

  it('status is undefined when not provided', async () => {
    const result = await getAnomalies({ page: 1 })
    expect(result.status).toBeUndefined()
  })
})
