/**
 * Unit Tests for Supply Planning Configuration
 * Covers: STOCKOUT_RISK_CONFIG, getStockoutRiskConfig, getStockoutRiskColor,
 *         getStockoutRiskBgColor, getStockoutRiskLabel, getStockoutRiskLabelShort,
 *         getStockoutRiskIcon, getStockoutRiskLucideIcon, getStockoutRiskBadgeClasses,
 *         getUrgentSkuCount
 */

import { describe, it, expect } from 'vitest'
import {
  STOCKOUT_RISK_CONFIG,
  getStockoutRiskConfig,
  getStockoutRiskColor,
  getStockoutRiskBgColor,
  getStockoutRiskLabel,
  getStockoutRiskLabelShort,
  getStockoutRiskIcon,
  getStockoutRiskLucideIcon,
  getStockoutRiskBadgeClasses,
  getUrgentSkuCount,
} from '../supply-planning-config'
import type { StockoutRisk } from '@/types/supply-planning'

// =============================================================================
// STOCKOUT_RISK_CONFIG
// =============================================================================

describe('STOCKOUT_RISK_CONFIG', () => {
  // Story 169.13: 'unknown' is the visible-unknown tier for absent/unrecognized backend enums.
  const expectedRisks: StockoutRisk[] = [
    'out_of_stock',
    'critical',
    'warning',
    'low',
    'healthy',
    'unknown',
  ]

  it('has config for all 6 risk levels (incl. unknown)', () => {
    expectedRisks.forEach(risk => {
      expect(STOCKOUT_RISK_CONFIG[risk]).toBeDefined()
    })
  })

  it('each config has all required fields', () => {
    expectedRisks.forEach(risk => {
      const config = STOCKOUT_RISK_CONFIG[risk]
      expect(config.label).toBeTruthy()
      expect(config.labelShort).toBeTruthy()
      expect(config.color).toBeTruthy()
      expect(config.bgColor).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(config.lucideIcon).toBeTruthy()
      expect(config.bgClass).toBeTruthy()
      expect(config.textClass).toBeTruthy()
      expect(typeof config.priority).toBe('number')
    })
  })

  it('priorities are ordered correctly', () => {
    expect(STOCKOUT_RISK_CONFIG.out_of_stock.priority).toBeLessThan(
      STOCKOUT_RISK_CONFIG.critical.priority
    )
    expect(STOCKOUT_RISK_CONFIG.critical.priority).toBeLessThan(
      STOCKOUT_RISK_CONFIG.warning.priority
    )
    expect(STOCKOUT_RISK_CONFIG.warning.priority).toBeLessThan(STOCKOUT_RISK_CONFIG.low.priority)
    expect(STOCKOUT_RISK_CONFIG.low.priority).toBeLessThan(STOCKOUT_RISK_CONFIG.healthy.priority)
    // Story 169.13: unknown sorts last-but-visible, after healthy.
    expect(STOCKOUT_RISK_CONFIG.healthy.priority).toBeLessThan(
      STOCKOUT_RISK_CONFIG.unknown.priority
    )
  })
})

// =============================================================================
// getStockoutRiskConfig
// =============================================================================

describe('getStockoutRiskConfig', () => {
  it('returns correct config for each risk level', () => {
    const risks: StockoutRisk[] = [
      'out_of_stock',
      'critical',
      'warning',
      'low',
      'healthy',
      'unknown',
    ]
    risks.forEach(risk => {
      const config = getStockoutRiskConfig(risk)
      expect(config).toBe(STOCKOUT_RISK_CONFIG[risk])
    })
  })
})

// =============================================================================
// getStockoutRiskColor
// =============================================================================

describe('getStockoutRiskColor', () => {
  it('returns color string for each risk', () => {
    expect(getStockoutRiskColor('out_of_stock')).toBe('#1F2937')
    expect(getStockoutRiskColor('critical')).toBe('#DC2626')
    expect(getStockoutRiskColor('warning')).toBe('#F59E0B')
    expect(getStockoutRiskColor('low')).toBe('#EAB308')
    expect(getStockoutRiskColor('healthy')).toBe('#22C55E')
  })
})

// =============================================================================
// getStockoutRiskBgColor
// =============================================================================

describe('getStockoutRiskBgColor', () => {
  it('returns background color string for each risk', () => {
    expect(getStockoutRiskBgColor('out_of_stock')).toBe('#F3F4F6')
    expect(getStockoutRiskBgColor('critical')).toBe('#FEE2E2')
    expect(getStockoutRiskBgColor('healthy')).toBe('#DCFCE7')
  })
})

// =============================================================================
// getStockoutRiskLabel
// =============================================================================

describe('getStockoutRiskLabel', () => {
  it('returns Russian labels', () => {
    expect(getStockoutRiskLabel('out_of_stock')).toBe('Нет в наличии')
    expect(getStockoutRiskLabel('critical')).toBe('Критично')
    expect(getStockoutRiskLabel('warning')).toBe('Внимание')
    expect(getStockoutRiskLabel('low')).toBe('Низкий запас')
    expect(getStockoutRiskLabel('healthy')).toBe('В норме')
  })
})

// =============================================================================
// getStockoutRiskLabelShort
// =============================================================================

describe('getStockoutRiskLabelShort', () => {
  it('returns short Russian labels', () => {
    expect(getStockoutRiskLabelShort('out_of_stock')).toBe('Нет')
    expect(getStockoutRiskLabelShort('critical')).toBe('Крит.')
    expect(getStockoutRiskLabelShort('healthy')).toBe('Норма')
  })
})

// =============================================================================
// getStockoutRiskIcon / getStockoutRiskLucideIcon
// =============================================================================

describe('getStockoutRiskIcon', () => {
  it('returns emoji icons', () => {
    expect(getStockoutRiskIcon('out_of_stock')).toBe('⬛')
    expect(getStockoutRiskIcon('critical')).toBe('🔴')
    expect(getStockoutRiskIcon('healthy')).toBe('🟢')
  })
})

describe('getStockoutRiskLucideIcon', () => {
  it('returns Lucide icon names', () => {
    expect(getStockoutRiskLucideIcon('out_of_stock')).toBe('PackageX')
    expect(getStockoutRiskLucideIcon('critical')).toBe('AlertTriangle')
    expect(getStockoutRiskLucideIcon('healthy')).toBe('CheckCircle')
  })
})

// =============================================================================
// getStockoutRiskBadgeClasses
// =============================================================================

describe('getStockoutRiskBadgeClasses', () => {
  it('returns Tailwind classes with bg and text', () => {
    const classes = getStockoutRiskBadgeClasses('out_of_stock')
    expect(classes).toContain('bg-')
    expect(classes).toContain('text-')
  })

  it('returns correct classes for critical', () => {
    expect(getStockoutRiskBadgeClasses('critical')).toContain('bg-red-600')
    expect(getStockoutRiskBadgeClasses('critical')).toContain('text-white')
  })
})

// =============================================================================
// getUrgentSkuCount
// =============================================================================

describe('getUrgentSkuCount', () => {
  it('sums out_of_stock and critical counts', () => {
    const summary = {
      out_of_stock_count: 5,
      stockout_critical: 3,
    } as Parameters<typeof getUrgentSkuCount>[0]
    expect(getUrgentSkuCount(summary)).toBe(8)
  })

  it('returns 0 when no urgent SKUs', () => {
    const summary = {
      out_of_stock_count: 0,
      stockout_critical: 0,
    } as Parameters<typeof getUrgentSkuCount>[0]
    expect(getUrgentSkuCount(summary)).toBe(0)
  })
})
