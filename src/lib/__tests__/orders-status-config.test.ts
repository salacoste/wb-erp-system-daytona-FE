/**
 * Unit tests for orders-status-config (Story 63.7-FE) — regression coverage added iter-143.
 *
 * Pure status config + accessor helpers keyed by OrderStatus. Pins concrete values, verifies each
 * accessor reads the corresponding config field for all 4 statuses, and locks STATUS_ORDER.
 * (The `?? fallback` paths are defensive/unreachable via the type — not force-tested with an `as` cast.)
 */

import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUS_CONFIG,
  getStatusLabel,
  getStatusColor,
  getStatusBgClass,
  getStatusTextClass,
  STATUS_ORDER,
} from '@/lib/orders-status-config'

describe('ORDER_STATUS_CONFIG', () => {
  it('defines exactly the 4 statuses', () => {
    expect(Object.keys(ORDER_STATUS_CONFIG).sort()).toEqual([
      'cancel',
      'complete',
      'confirm',
      'new',
    ])
  })

  it('has concrete Russian labels + hex colors', () => {
    expect(ORDER_STATUS_CONFIG.complete.label).toBe('Выполнено')
    expect(ORDER_STATUS_CONFIG.complete.color).toBe('#22C55E')
    expect(ORDER_STATUS_CONFIG.confirm.label).toBe('Подтверждено')
    expect(ORDER_STATUS_CONFIG.new.label).toBe('Новый')
    expect(ORDER_STATUS_CONFIG.cancel.label).toBe('Отменено')
    expect(ORDER_STATUS_CONFIG.cancel.color).toBe('#EF4444')
  })
})

describe('STATUS_ORDER', () => {
  it('is the fixed positive→negative order and covers every config key', () => {
    expect(STATUS_ORDER).toEqual(['complete', 'confirm', 'new', 'cancel'])
    expect([...STATUS_ORDER].sort()).toEqual(Object.keys(ORDER_STATUS_CONFIG).sort())
  })
})

describe('accessors read the corresponding config field for every status', () => {
  it('label/color/bgClass/textClass match the config for all 4 statuses', () => {
    for (const s of STATUS_ORDER) {
      const cfg = ORDER_STATUS_CONFIG[s]
      expect(getStatusLabel(s)).toBe(cfg.label)
      expect(getStatusColor(s)).toBe(cfg.color)
      expect(getStatusBgClass(s)).toBe(cfg.bgClass)
      expect(getStatusTextClass(s)).toBe(cfg.textClass)
    }
  })
})
