/**
 * Tests for ai-forecast type guards + classifiers.
 * Story 103.4-FE polish: cover the 0.4/0.7 boundary values of getConfidenceBand
 * and the type-narrowing predicate isForecastLevel.
 */

import { describe, it, expect } from 'vitest'
import { getConfidenceBand, isForecastLevel, FORECAST_LEVELS } from '../ai-forecast'

describe('getConfidenceBand', () => {
  it('classifies confidence ≥ 0.7 as "high"', () => {
    expect(getConfidenceBand(0.7)).toBe('high')
    expect(getConfidenceBand(0.85)).toBe('high')
    expect(getConfidenceBand(1.0)).toBe('high')
  })

  it('classifies 0.4 ≤ confidence < 0.7 as "medium"', () => {
    expect(getConfidenceBand(0.4)).toBe('medium')
    expect(getConfidenceBand(0.55)).toBe('medium')
    expect(getConfidenceBand(0.699999)).toBe('medium')
  })

  it('classifies confidence < 0.4 as "low"', () => {
    expect(getConfidenceBand(0.0)).toBe('low')
    expect(getConfidenceBand(0.39)).toBe('low')
    expect(getConfidenceBand(0.399999)).toBe('low')
  })

  // Boundary values are load-bearing: a regression that flips < to ≤ would
  // re-classify perfectly-trained models as "medium" instead of "high".
  it('boundary 0.7 is "high" (inclusive lower bound)', () => {
    expect(getConfidenceBand(0.7)).toBe('high')
  })

  it('boundary 0.4 is "medium" (inclusive lower bound)', () => {
    expect(getConfidenceBand(0.4)).toBe('medium')
  })
})

describe('isForecastLevel', () => {
  it('returns true for valid levels', () => {
    expect(isForecastLevel('sku')).toBe(true)
    expect(isForecastLevel('brand')).toBe(true)
    expect(isForecastLevel('cabinet')).toBe(true)
  })

  it('returns false for invalid values', () => {
    expect(isForecastLevel('warehouse')).toBe(false)
    expect(isForecastLevel('')).toBe(false)
    expect(isForecastLevel('SKU')).toBe(false) // case-sensitive
  })

  it('FORECAST_LEVELS matches all type union members', () => {
    expect(FORECAST_LEVELS).toEqual(['sku', 'brand', 'cabinet'])
  })
})
