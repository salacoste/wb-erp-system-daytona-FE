/**
 * Unit Tests for Tariff System Utilities
 * Covers: determineTariffSystem, getTariffSystemLabel, getTariffSystemBadgeVariant,
 *         SUPPLY_WINDOW_DAYS, DEFAULT_TARIFFS
 *
 * Note: extractTariffs and findSupplyTariffsForDate depend on complex warehouse/API
 * types and are better suited for integration tests. We test the pure functions here.
 */

import { describe, it, expect } from 'vitest'
import {
  determineTariffSystem,
  isDateInSupplyWindow,
  getTariffSystemLabel,
  getTariffSystemBadgeVariant,
} from '../tariff-system-utils'
import { DEFAULT_TARIFFS, SUPPLY_WINDOW_DAYS } from '../tariff-system-types'

// =============================================================================
// Constants
// =============================================================================

describe('Constants', () => {
  it('SUPPLY_WINDOW_DAYS is 14', () => {
    expect(SUPPLY_WINDOW_DAYS).toBe(14)
  })

  it('DEFAULT_TARIFFS has expected values', () => {
    expect(DEFAULT_TARIFFS.deliveryBaseLiterRub).toBe(46.0)
    expect(DEFAULT_TARIFFS.deliveryPerLiterRub).toBe(14.0)
    expect(DEFAULT_TARIFFS.storageBaseLiterRub).toBe(0.07)
    expect(DEFAULT_TARIFFS.storagePerLiterRub).toBe(0.05)
    expect(DEFAULT_TARIFFS.logisticsCoefficient).toBe(1.0)
    expect(DEFAULT_TARIFFS.storageCoefficient).toBe(1.0)
    expect(DEFAULT_TARIFFS.source).toBe('inventory')
  })
})

// =============================================================================
// determineTariffSystem
// =============================================================================

describe('determineTariffSystem', () => {
  it('returns "inventory" for null date', () => {
    expect(determineTariffSystem(null)).toBe('inventory')
  })

  it('returns "inventory" for empty string', () => {
    expect(determineTariffSystem('')).toBe('inventory')
  })

  it('returns "inventory" for past date', () => {
    expect(determineTariffSystem('2020-01-01')).toBe('inventory')
  })

  it('returns "inventory" for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(determineTariffSystem(today)).toBe('inventory')
  })

  it('returns "supply" for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    expect(determineTariffSystem(tomorrowStr)).toBe('supply')
  })

  it('returns "supply" for date 14 days ahead', () => {
    const future = new Date()
    future.setDate(future.getDate() + 14)
    const futureStr = future.toISOString().split('T')[0]
    expect(determineTariffSystem(futureStr)).toBe('supply')
  })

  it('returns "inventory" for date beyond 14 days', () => {
    const farFuture = new Date()
    farFuture.setDate(farFuture.getDate() + 15)
    const futureStr = farFuture.toISOString().split('T')[0]
    expect(determineTariffSystem(futureStr)).toBe('inventory')
  })
})

// =============================================================================
// isDateInSupplyWindow
// =============================================================================

describe('isDateInSupplyWindow', () => {
  it('returns true for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isDateInSupplyWindow(tomorrow.toISOString().split('T')[0])).toBe(true)
  })

  it('returns false for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isDateInSupplyWindow(today)).toBe(false)
  })

  it('returns false for past date', () => {
    expect(isDateInSupplyWindow('2020-01-01')).toBe(false)
  })

  it('returns true for date 14 days ahead', () => {
    const future = new Date()
    future.setDate(future.getDate() + 14)
    expect(isDateInSupplyWindow(future.toISOString().split('T')[0])).toBe(true)
  })

  it('returns false for date 15 days ahead', () => {
    const future = new Date()
    future.setDate(future.getDate() + 15)
    expect(isDateInSupplyWindow(future.toISOString().split('T')[0])).toBe(false)
  })
})

// =============================================================================
// getTariffSystemLabel
// =============================================================================

describe('getTariffSystemLabel', () => {
  it('returns inventory label for inventory system', () => {
    expect(getTariffSystemLabel('inventory', null)).toBe('Текущие тарифы (Остатки)')
  })

  it('returns supply label with formatted date', () => {
    const label = getTariffSystemLabel('supply', '2025-06-15')
    expect(label).toContain('Тарифы на')
  })

  it('returns default supply label without date', () => {
    expect(getTariffSystemLabel('supply', null)).toBe('Тарифы на дату поставки')
  })
})

// =============================================================================
// getTariffSystemBadgeVariant
// =============================================================================

describe('getTariffSystemBadgeVariant', () => {
  it('returns "secondary" for inventory', () => {
    expect(getTariffSystemBadgeVariant('inventory')).toBe('secondary')
  })

  it('returns "default" for supply', () => {
    expect(getTariffSystemBadgeVariant('supply')).toBe('default')
  })
})
