/**
 * Story O1: operational status state machine + labels tests.
 * Verifies ALLOWED_TRANSITIONS, TERMINAL_STATUSES, and the labels record.
 */

import { describe, it, expect } from 'vitest'
import {
  ALLOWED_TRANSITIONS,
  TERMINAL_STATUSES,
  ORDER_OPERATIONAL_STATUS_LABELS,
  type OrderOperationalStatus,
} from '@/types/orders'

const ALL_STATUSES: OrderOperationalStatus[] = [
  'NEW',
  'ASSEMBLED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]

describe('ORDER_OPERATIONAL_STATUS_LABELS (Story O1)', () => {
  it('has a Russian label for every status', () => {
    for (const s of ALL_STATUSES) {
      expect(ORDER_OPERATIONAL_STATUS_LABELS[s]).toBeTruthy()
    }
  })

  it('uses the spec-defined Russian labels', () => {
    expect(ORDER_OPERATIONAL_STATUS_LABELS.NEW).toBe('Новый')
    expect(ORDER_OPERATIONAL_STATUS_LABELS.ASSEMBLED).toBe('Собран')
    expect(ORDER_OPERATIONAL_STATUS_LABELS.PACKED).toBe('Упакован')
    expect(ORDER_OPERATIONAL_STATUS_LABELS.SHIPPED).toBe('Отгружен')
    expect(ORDER_OPERATIONAL_STATUS_LABELS.DELIVERED).toBe('Доставлен')
    expect(ORDER_OPERATIONAL_STATUS_LABELS.CANCELLED).toBe('Отменён')
    expect(ORDER_OPERATIONAL_STATUS_LABELS.RETURNED).toBe('Возврат')
  })
})

describe('ALLOWED_TRANSITIONS state machine (Story O1)', () => {
  it('has an entry for every status', () => {
    for (const s of ALL_STATUSES) {
      expect(Array.isArray(ALLOWED_TRANSITIONS[s])).toBe(true)
    }
  })

  it('allows NEW → [ASSEMBLED, CANCELLED]', () => {
    expect(ALLOWED_TRANSITIONS.NEW).toEqual(['ASSEMBLED', 'CANCELLED'])
  })

  it('allows ASSEMBLED → [PACKED, CANCELLED]', () => {
    expect(ALLOWED_TRANSITIONS.ASSEMBLED).toEqual(['PACKED', 'CANCELLED'])
  })

  it('allows PACKED → [SHIPPED] only', () => {
    expect(ALLOWED_TRANSITIONS.PACKED).toEqual(['SHIPPED'])
  })

  it('allows SHIPPED → [DELIVERED, RETURNED]', () => {
    expect(ALLOWED_TRANSITIONS.SHIPPED).toEqual(['DELIVERED', 'RETURNED'])
  })

  it('has no transitions for terminal statuses', () => {
    expect(ALLOWED_TRANSITIONS.DELIVERED).toEqual([])
    expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([])
    expect(ALLOWED_TRANSITIONS.RETURNED).toEqual([])
  })
})

describe('TERMINAL_STATUSES (Story O1)', () => {
  it('contains exactly DELIVERED, CANCELLED, RETURNED', () => {
    expect(TERMINAL_STATUSES.has('DELIVERED')).toBe(true)
    expect(TERMINAL_STATUSES.has('CANCELLED')).toBe(true)
    expect(TERMINAL_STATUSES.has('RETURNED')).toBe(true)
    expect(TERMINAL_STATUSES.has('NEW')).toBe(false)
    expect(TERMINAL_STATUSES.has('ASSEMBLED')).toBe(false)
    expect(TERMINAL_STATUSES.has('PACKED')).toBe(false)
    expect(TERMINAL_STATUSES.has('SHIPPED')).toBe(false)
  })
})
