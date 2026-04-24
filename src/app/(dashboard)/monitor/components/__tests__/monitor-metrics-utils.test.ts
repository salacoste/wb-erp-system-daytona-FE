/**
 * Unit tests for monitor-metrics-utils pure helpers
 * Epic 92-FE Story 92.3 code-review fix H-1: split computeDelta tests co-located with utils.
 * Pure-functions-over-hook-mocking pattern (CLAUDE.md).
 */

import { describe, it, expect } from 'vitest'
import { computeDelta } from '../monitor-metrics-utils'

describe('computeDelta', () => {
  it('returns "—" when current is null', () => {
    const delta = computeDelta(null, 100, 'higher-is-better')
    expect(delta.label).toBe('—')
    expect(delta.arrow).toBeNull()
    expect(delta.colorClass).toBe('text-muted-foreground')
  })

  it('returns "—" when previous is null', () => {
    const delta = computeDelta(100, null, 'higher-is-better')
    expect(delta.label).toBe('—')
    expect(delta.arrow).toBeNull()
  })

  it('returns "—" when previous is 0 (no division by zero)', () => {
    const delta = computeDelta(50, 0, 'higher-is-better')
    expect(delta.label).toBe('—')
    expect(delta.arrow).toBeNull()
  })

  it('computes positive delta green for higher-is-better', () => {
    const delta = computeDelta(120, 100, 'higher-is-better')
    expect(delta.label).toBe('+20.0%')
    expect(delta.arrow).toBe('↑')
    expect(delta.colorClass).toBe('text-green-600')
  })

  it('computes negative delta red for higher-is-better', () => {
    const delta = computeDelta(80, 100, 'higher-is-better')
    expect(delta.label).toBe('-20.0%')
    expect(delta.arrow).toBe('↓')
    expect(delta.colorClass).toBe('text-red-600')
  })

  it('computes positive delta red for higher-is-worse (COGS direction)', () => {
    const delta = computeDelta(120, 100, 'higher-is-worse')
    expect(delta.label).toBe('+20.0%')
    expect(delta.arrow).toBe('↑')
    expect(delta.colorClass).toBe('text-red-600')
  })

  it('computes negative delta green for higher-is-worse (COGS decreased)', () => {
    const delta = computeDelta(80, 100, 'higher-is-worse')
    expect(delta.label).toBe('-20.0%')
    expect(delta.arrow).toBe('↓')
    expect(delta.colorClass).toBe('text-green-600')
  })

  it('returns neutral (no arrow, muted color) when change is exactly zero (fix M-4)', () => {
    const result = computeDelta(100, 100, 'higher-is-better')
    expect(result.arrow).toBeNull()
    expect(result.label).toBe('0.0%')
    expect(result.colorClass).toBe('text-muted-foreground')
  })
})
