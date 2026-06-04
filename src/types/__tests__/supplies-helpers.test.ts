/**
 * Tests for supply status helper functions (src/types/supplies.ts).
 *
 * Implemented from the original TDD skeleton (iter-160): getSupplyStatusConfig, getSupplyStatusLabel,
 * isSupplyFinal, canModifySupply, canGenerateStickers — with the status-honesty fallback (unknown →
 * neutral "Неизвестно", never masquerading as OPEN).
 */

import { describe, it, expect } from 'vitest'
import type { SupplyStatus } from '@/types/supplies'
import {
  SUPPLY_STATUS_CONFIG,
  getSupplyStatusConfig,
  getSupplyStatusLabel,
  isSupplyFinal,
  canModifySupply,
  canGenerateStickers,
} from '@/types/supplies'

const STATUSES: SupplyStatus[] = ['OPEN', 'CLOSED', 'DELIVERING', 'DELIVERED', 'CANCELLED']
// Cast for defensive-fallback inputs (anti-pattern #4): exercising out-of-enum values.
const UNKNOWN = 'UNKNOWN' as SupplyStatus

describe('getSupplyStatusConfig', () => {
  it('returns the config for each valid status', () => {
    for (const s of STATUSES) {
      expect(getSupplyStatusConfig(s)).toBe(SUPPLY_STATUS_CONFIG[s])
    }
  })
  it('every config has label/color/bgColor/icon', () => {
    for (const s of STATUSES) {
      const cfg = getSupplyStatusConfig(s)
      expect(cfg.label).toBeTruthy()
      expect(cfg.color).toBeTruthy()
      expect(cfg.bgColor).toBeTruthy()
      expect(cfg.icon).toBeTruthy()
    }
  })
  it('falls back to neutral "Неизвестно" for unknown / null / undefined (status-honesty, not OPEN)', () => {
    const fallback = {
      label: 'Неизвестно',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      icon: 'HelpCircle',
    }
    expect(getSupplyStatusConfig(UNKNOWN)).toEqual(fallback)
    expect(getSupplyStatusConfig(null as unknown as SupplyStatus)).toEqual(fallback)
    expect(getSupplyStatusConfig(undefined as unknown as SupplyStatus)).toEqual(fallback)
  })
})

describe('getSupplyStatusLabel', () => {
  it('returns the Russian label for each status', () => {
    expect(getSupplyStatusLabel('OPEN')).toBe('Открыта')
    expect(getSupplyStatusLabel('CLOSED')).toBe('Закрыта')
    expect(getSupplyStatusLabel('DELIVERING')).toBe('В пути')
    expect(getSupplyStatusLabel('DELIVERED')).toBe('Доставлена')
    expect(getSupplyStatusLabel('CANCELLED')).toBe('Отменена')
  })
  it('returns "Неизвестно" for an unknown status', () => {
    expect(getSupplyStatusLabel(UNKNOWN)).toBe('Неизвестно')
  })
})

describe('isSupplyFinal', () => {
  it('is true only for DELIVERED and CANCELLED', () => {
    expect(isSupplyFinal('DELIVERED')).toBe(true)
    expect(isSupplyFinal('CANCELLED')).toBe(true)
    expect(isSupplyFinal('OPEN')).toBe(false)
    expect(isSupplyFinal('CLOSED')).toBe(false)
    expect(isSupplyFinal('DELIVERING')).toBe(false)
  })
})

describe('canModifySupply', () => {
  it('is true only for OPEN', () => {
    expect(canModifySupply('OPEN')).toBe(true)
    for (const s of ['CLOSED', 'DELIVERING', 'DELIVERED', 'CANCELLED'] as SupplyStatus[]) {
      expect(canModifySupply(s)).toBe(false)
    }
  })
})

describe('canGenerateStickers', () => {
  it('is true only for CLOSED', () => {
    expect(canGenerateStickers('CLOSED')).toBe(true)
    for (const s of ['OPEN', 'DELIVERING', 'DELIVERED', 'CANCELLED'] as SupplyStatus[]) {
      expect(canGenerateStickers(s)).toBe(false)
    }
  })
})
