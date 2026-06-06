/**
 * AI Status normalizer tests — Story 108.1-FE
 * Covers readiness level guard, null preservation for ratio fields,
 * count fields with semantic-zero, and unknown enum fallback.
 * Polish F-1: weeksRequired preserved as null (not coalesced to 0) when absent.
 */

import { describe, it, expect, vi } from 'vitest'
import { normalizeAiStatusResponse } from '../status'
import { logger } from '@/lib/logger'

describe('normalizeAiStatusResponse', () => {
  it('passes through valid readiness levels unchanged', () => {
    expect(normalizeAiStatusResponse({ readinessLevel: 'collecting' }).readinessLevel).toBe(
      'collecting'
    )
    expect(normalizeAiStatusResponse({ readinessLevel: 'sneak_preview' }).readinessLevel).toBe(
      'sneak_preview'
    )
    expect(normalizeAiStatusResponse({ readinessLevel: 'ready' }).readinessLevel).toBe('ready')
  })

  it('falls back to "ready" for unknown readiness level (Fix 2: spec mandates ready to avoid blanking page)', () => {
    expect(normalizeAiStatusResponse({ readinessLevel: 'unknown_state' }).readinessLevel).toBe(
      'ready'
    )
    expect(normalizeAiStatusResponse({ readinessLevel: null }).readinessLevel).toBe('ready')
    expect(normalizeAiStatusResponse({}).readinessLevel).toBe('ready')
  })

  it('preserves null for ratio fields (progressPct, cogsCoveragePct)', () => {
    const result = normalizeAiStatusResponse({ readinessLevel: 'collecting' })
    expect(result.progressPct).toBeNull()
    expect(result.cogsCoveragePct).toBeNull()
  })

  it('passes through ratio fields when provided', () => {
    const result = normalizeAiStatusResponse({
      readinessLevel: 'collecting',
      progressPct: 67,
      cogsCoveragePct: 85.5,
    })
    expect(result.progressPct).toBe(67)
    expect(result.cogsCoveragePct).toBe(85.5)
  })

  it('uses semantic-zero for weeksCollected/skuCount/orderCount when missing', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    const result = normalizeAiStatusResponse({ readinessLevel: 'collecting' })
    expect(result.weeksCollected).toBe(0)
    expect(result.skuCount).toBe(0)
    expect(result.orderCount).toBe(0)
    spy.mockRestore()
  })

  it('preserves null for weeksRequired when backend omits field (F-1 defensive fix)', () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    const result = normalizeAiStatusResponse({ readinessLevel: 'collecting' })
    expect(result.weeksRequired).toBeNull()
    // logger.warn must fire so DevTools surfaces the contract gap
    expect(spy).toHaveBeenCalledWith(
      '[ai/status] weeksRequired absent from backend response',
      expect.any(Object)
    )
    spy.mockRestore()
  })

  it('preserves weeksRequired when backend provides a valid value', () => {
    const result = normalizeAiStatusResponse({ readinessLevel: 'collecting', weeksRequired: 12 })
    expect(result.weeksRequired).toBe(12)
  })

  it('preserves null for estimatedActivationDate when backend omits', () => {
    const result = normalizeAiStatusResponse({ readinessLevel: 'collecting' })
    expect(result.estimatedActivationDate).toBeNull()
  })

  it('passes through estimatedActivationDate when provided', () => {
    const result = normalizeAiStatusResponse({
      readinessLevel: 'collecting',
      estimatedActivationDate: '2026-05-22',
    })
    expect(result.estimatedActivationDate).toBe('2026-05-22')
  })

  it('defaults missingRequirements to empty array when null', () => {
    const result = normalizeAiStatusResponse({
      readinessLevel: 'collecting',
      missingRequirements: null,
    })
    expect(result.missingRequirements).toEqual([])
  })

  it('passes through full populated response', () => {
    const result = normalizeAiStatusResponse({
      readinessLevel: 'sneak_preview',
      weeksCollected: 8,
      weeksRequired: 12,
      progressPct: 67,
      missingRequirements: ['COGS coverage < 90%'],
      estimatedActivationDate: '2026-05-22',
      cogsCoveragePct: 85.5,
      skuCount: 35,
      orderCount: 1240,
    })
    expect(result.weeksCollected).toBe(8)
    expect(result.weeksRequired).toBe(12)
    expect(result.missingRequirements).toEqual(['COGS coverage < 90%'])
    expect(result.skuCount).toBe(35)
    expect(result.orderCount).toBe(1240)
  })
})
