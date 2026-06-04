/**
 * Unit tests for liquidity-category-config (Epic 7 / Story 74.5) — regression coverage added iter-135.
 *
 * Pure config + accessor helpers keyed by LiquidityCategory. Tests pin concrete config values + the
 * day-range boundaries, verify each accessor reads the corresponding config field, and lock the 4-category set.
 */

import { describe, it, expect } from 'vitest'
import type { LiquidityCategory } from '@/types/liquidity'
import {
  LIQUIDITY_CATEGORY_CONFIG,
  getLiquidityCategoryConfig,
  getLiquidityStatusColor,
  getLiquidityStatusBgColor,
  getLiquidityStatusLabel,
  getLiquidityStatusLabelShort,
  getLiquidityStatusIcon,
  getLiquidityBadgeClasses,
  getLiquidityTargetShare,
  getLiquidityDaysRange,
} from '@/lib/liquidity-category-config'

const CATEGORIES: LiquidityCategory[] = ['highly_liquid', 'medium', 'low', 'illiquid']

describe('LIQUIDITY_CATEGORY_CONFIG', () => {
  it('defines exactly the 4 categories', () => {
    expect(Object.keys(LIQUIDITY_CATEGORY_CONFIG).sort()).toEqual([...CATEGORIES].sort())
  })

  it('has contiguous, non-overlapping day ranges (0-30 / 31-60 / 61-90 / 91-999)', () => {
    expect(getLiquidityDaysRange('highly_liquid')).toEqual({ min: 0, max: 30 })
    expect(getLiquidityDaysRange('medium')).toEqual({ min: 31, max: 60 })
    expect(getLiquidityDaysRange('low')).toEqual({ min: 61, max: 90 })
    expect(getLiquidityDaysRange('illiquid')).toEqual({ min: 91, max: 999 })
  })
})

describe('concrete config values', () => {
  it('highly_liquid: green, label/icon/target', () => {
    expect(getLiquidityStatusColor('highly_liquid')).toBe('#22C55E')
    expect(getLiquidityStatusBgColor('highly_liquid')).toBe('#DCFCE7')
    expect(getLiquidityStatusLabel('highly_liquid')).toBe('Высоколиквидный')
    expect(getLiquidityStatusLabelShort('highly_liquid')).toBe('Ликвид.')
    expect(getLiquidityStatusIcon('highly_liquid')).toBe('🟢')
    expect(getLiquidityBadgeClasses('highly_liquid')).toBe('bg-green-500 text-white')
    expect(getLiquidityTargetShare('highly_liquid')).toBe('> 50%')
  })

  it('illiquid: red, label/icon/target', () => {
    expect(getLiquidityStatusColor('illiquid')).toBe('#EF4444')
    expect(getLiquidityStatusLabel('illiquid')).toBe('Неликвид')
    expect(getLiquidityStatusIcon('illiquid')).toBe('🔴')
    expect(getLiquidityTargetShare('illiquid')).toBe('< 5%')
  })

  it('medium label is "Средняя ликвидность", low short label is "Низкий"', () => {
    expect(getLiquidityStatusLabel('medium')).toBe('Средняя ликвидность')
    expect(getLiquidityStatusLabelShort('low')).toBe('Низкий')
  })
})

describe('accessors read the corresponding config field for every category', () => {
  it('each accessor returns the config value for all 4 categories', () => {
    for (const c of CATEGORIES) {
      const cfg = getLiquidityCategoryConfig(c)
      expect(getLiquidityStatusColor(c)).toBe(cfg.color)
      expect(getLiquidityStatusBgColor(c)).toBe(cfg.bgColor)
      expect(getLiquidityStatusLabel(c)).toBe(cfg.label)
      expect(getLiquidityStatusLabelShort(c)).toBe(cfg.labelShort)
      expect(getLiquidityStatusIcon(c)).toBe(cfg.icon)
      expect(getLiquidityBadgeClasses(c)).toBe(`${cfg.bgClass} ${cfg.textClass}`)
      expect(getLiquidityTargetShare(c)).toBe(cfg.targetShare)
      expect(getLiquidityDaysRange(c)).toEqual({ min: cfg.minDays, max: cfg.maxDays })
    }
  })
})
