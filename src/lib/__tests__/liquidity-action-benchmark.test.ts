/**
 * Unit tests for liquidity-action-benchmark (Epic 7 / Story 74.5) — regression coverage added iter-144.
 *
 * Pure config (action-type + benchmark-status) + accessors + switch-based trend-insight helpers.
 * Pins concrete values, verifies accessor↔config wiring across every key, and covers all 3
 * trend-insight branches ('info' exercises the switch default — no `as` cast needed).
 */

import { describe, it, expect } from 'vitest'
import type { ActionType, BenchmarkStatus, TrendInsightType } from '@/types/liquidity'
import {
  ACTION_TYPE_CONFIG,
  getActionTypeConfig,
  getLiquidityActionLabel,
  getLiquidityActionButtonLabel,
  getLiquidityActionVariant,
  BENCHMARK_STATUS_CONFIG,
  getBenchmarkStatusConfig,
  getBenchmarkStatusColor,
  getBenchmarkStatusLabel,
  getBenchmarkStatusTextClass,
  getBenchmarkStatusIcon,
  getTrendInsightColor,
  getTrendInsightIcon,
  getTrendInsightBgClass,
} from '@/lib/liquidity-action-benchmark'

const ACTIONS: ActionType[] = ['MAXIMIZE', 'MAINTAIN', 'REDUCE', 'LIQUIDATE']
const STATUSES: BenchmarkStatus[] = ['excellent', 'good', 'warning', 'critical']

describe('action type config', () => {
  it('defines the 4 action types with concrete labels/variants', () => {
    expect(Object.keys(ACTION_TYPE_CONFIG).sort()).toEqual([...ACTIONS].sort())
    expect(getLiquidityActionLabel('MAXIMIZE')).toBe('Масштабировать')
    expect(getLiquidityActionButtonLabel('MAXIMIZE')).toBe('Увеличить закупки')
    expect(getLiquidityActionVariant('MAXIMIZE')).toBe('default')
    expect(getLiquidityActionVariant('LIQUIDATE')).toBe('destructive')
  })
  it('accessors read the corresponding config field for all action types', () => {
    for (const a of ACTIONS) {
      const cfg = getActionTypeConfig(a)
      expect(getLiquidityActionLabel(a)).toBe(cfg.label)
      expect(getLiquidityActionButtonLabel(a)).toBe(cfg.buttonLabel)
      expect(getLiquidityActionVariant(a)).toBe(cfg.variant)
    }
  })
})

describe('benchmark status config', () => {
  it('defines the 4 statuses with concrete labels/icons', () => {
    expect(Object.keys(BENCHMARK_STATUS_CONFIG).sort()).toEqual([...STATUSES].sort())
    expect(getBenchmarkStatusLabel('excellent')).toBe('Отлично')
    expect(getBenchmarkStatusIcon('excellent')).toBe('🎯')
    expect(getBenchmarkStatusLabel('critical')).toBe('Критично')
    expect(getBenchmarkStatusIcon('critical')).toBe('🚨')
  })
  it('accessors read the corresponding config field for all statuses', () => {
    for (const s of STATUSES) {
      const cfg = getBenchmarkStatusConfig(s)
      expect(getBenchmarkStatusColor(s)).toBe(cfg.color)
      expect(getBenchmarkStatusLabel(s)).toBe(cfg.label)
      expect(getBenchmarkStatusTextClass(s)).toBe(cfg.textClass)
      expect(getBenchmarkStatusIcon(s)).toBe(cfg.icon)
    }
  })
})

describe('trend insight helpers (improvement / warning / info=default)', () => {
  const cases: { type: TrendInsightType; color: string; icon: string; bg: string }[] = [
    { type: 'improvement', color: '#22C55E', icon: '📈', bg: 'bg-green-50 border-green-200' },
    { type: 'warning', color: '#F97316', icon: '⚠️', bg: 'bg-orange-50 border-orange-200' },
    { type: 'info', color: '#3B82F6', icon: 'ℹ️', bg: 'bg-blue-50 border-blue-200' },
  ]
  it.each(cases)('maps $type to its color/icon/bg', ({ type, color, icon, bg }) => {
    expect(getTrendInsightColor(type)).toBe(color)
    expect(getTrendInsightIcon(type)).toBe(icon)
    expect(getTrendInsightBgClass(type)).toBe(bg)
  })
})
