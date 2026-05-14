/**
 * Tests for computeForecastQueryParams — AC 7 of Story 103.4-FE.
 * Covers level-switcher behavior, nmId validation, whitespace handling,
 * and cabinet-level implicit aggregation enablement.
 */

import { describe, it, expect } from 'vitest'
import { computeForecastQueryParams } from '../forecast-query-helpers'

describe('computeForecastQueryParams — sku level', () => {
  it('disables query when nmId input is empty', () => {
    const result = computeForecastQueryParams('sku', '')
    expect(result.enabled).toBe(false)
    expect(result.nmId).toBeUndefined()
    expect(result.parsedNmId).toBeNull()
  })

  it('enables query with valid numeric nmId', () => {
    const result = computeForecastQueryParams('sku', '270937054')
    expect(result.enabled).toBe(true)
    expect(result.nmId).toBe(270937054)
    expect(result.parsedNmId).toBe(270937054)
  })

  it('rejects non-numeric input', () => {
    const result = computeForecastQueryParams('sku', 'abc123')
    expect(result.enabled).toBe(false)
    expect(result.nmId).toBeUndefined()
    expect(result.parsedNmId).toBeNull()
  })

  it('rejects decimal input (regex requires digits only)', () => {
    const result = computeForecastQueryParams('sku', '1.5')
    expect(result.enabled).toBe(false)
    expect(result.parsedNmId).toBeNull()
  })

  it('trims surrounding whitespace before parsing', () => {
    const result = computeForecastQueryParams('sku', '  270937054  ')
    expect(result.enabled).toBe(true)
    expect(result.nmId).toBe(270937054)
  })

  it('rejects nmId of 0 (must be positive)', () => {
    const result = computeForecastQueryParams('sku', '0')
    expect(result.enabled).toBe(false)
    expect(result.parsedNmId).toBe(0)
  })
})

describe('computeForecastQueryParams — cabinet level', () => {
  it('enables query with empty nmId input (implicit cabinet aggregation)', () => {
    const result = computeForecastQueryParams('cabinet', '')
    expect(result.enabled).toBe(true)
    expect(result.nmId).toBeUndefined()
  })

  it('ignores nmId input for cabinet-level (always sends undefined)', () => {
    const result = computeForecastQueryParams('cabinet', '270937054')
    expect(result.enabled).toBe(true)
    expect(result.nmId).toBeUndefined()
    expect(result.parsedNmId).toBe(270937054) // parsed for potential validation display, not sent
  })
})

describe('computeForecastQueryParams — level switcher behavior', () => {
  it('sku→cabinet transition: query becomes enabled even without nmId', () => {
    const skuBefore = computeForecastQueryParams('sku', '')
    const cabinetAfter = computeForecastQueryParams('cabinet', '')
    expect(skuBefore.enabled).toBe(false)
    expect(cabinetAfter.enabled).toBe(true)
  })

  it('cabinet→sku transition: query becomes disabled when nmId is missing', () => {
    const cabinetBefore = computeForecastQueryParams('cabinet', '')
    const skuAfter = computeForecastQueryParams('sku', '')
    expect(cabinetBefore.enabled).toBe(true)
    expect(skuAfter.enabled).toBe(false)
  })
})
