/**
 * resolveReadinessRoute helper tests
 * Story 108.3-FE: Pure-function extraction for testability (CLAUDE.md discipline).
 *
 * Tests cover 5+ cases: 3 explicit readiness levels, undefined (loading), isError=true.
 */
import { describe, it, expect } from 'vitest'
import { resolveReadinessRoute } from '../readiness-router'

describe('resolveReadinessRoute', () => {
  it('returns "collecting" when level is collecting and no error', () => {
    expect(resolveReadinessRoute('collecting', false)).toBe('collecting')
  })

  it('returns "sneak_preview" when level is sneak_preview and no error', () => {
    expect(resolveReadinessRoute('sneak_preview', false)).toBe('sneak_preview')
  })

  it('returns "ready" when level is ready and no error', () => {
    expect(resolveReadinessRoute('ready', false)).toBe('ready')
  })

  it('returns "ready" when level is undefined (status loading) — page not blanked', () => {
    expect(resolveReadinessRoute(undefined, false)).toBe('ready')
  })

  it('returns "ready" when isError is true with collecting level — defensive fallback', () => {
    expect(resolveReadinessRoute('collecting', true)).toBe('ready')
  })

  it('returns "ready" when isError is true with sneak_preview level — defensive fallback', () => {
    expect(resolveReadinessRoute('sneak_preview', true)).toBe('ready')
  })

  it('returns "ready" when isError is true and level undefined', () => {
    expect(resolveReadinessRoute(undefined, true)).toBe('ready')
  })
})
