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
