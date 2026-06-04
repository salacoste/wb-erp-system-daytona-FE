/**
 * Unit tests for orders-volume-transforms (Epic 74) — coverage added iter-158.
 *
 * Transform raw orders-volume responses → dashboard metrics / status breakdown. Covers the dual
 * camelCase|snake_case field handling, the division-by-zero guard, the by_status vs statusBreakdown[]
 * extraction, dailyTrend→dailyBreakdown mapping, and percentage rounding.
 */

import { describe, it, expect } from 'vitest'
import type { OrdersVolumeResponse } from '@/types/orders-volume'
import { transformToMetrics, transformToStatusBreakdown } from '@/lib/api/orders-volume-transforms'

// Test inputs are partial raw responses; the transforms treat them as `any` internally.
const resp = (o: Record<string, unknown>): OrdersVolumeResponse =>
  o as unknown as OrdersVolumeResponse

describe('transformToMetrics', () => {
  it('reads camelCase fields + by_status, computes completion/cancellation rates', () => {
    const m = transformToMetrics(
      resp({
        totalOrders: 100,
        totalAmount: 5000,
        avgOrderValue: 50,
        by_status: { complete: 80, confirm: 5, new: 5, cancel: 10 },
      })
    )
    expect(m.totalOrders).toBe(100)
    expect(m.totalAmount).toBe(5000)
    expect(m.avgOrderValue).toBe(50)
    expect(m.completionRate).toBe(80)
    expect(m.cancellationRate).toBe(10)
  })

  it('reads snake_case fields equivalently', () => {
    const m = transformToMetrics(
      resp({
        total_orders: 100,
        total_amount: 5000,
        avg_order_value: 50,
        by_status: { complete: 50, confirm: 0, new: 0, cancel: 0 },
      })
    )
    expect(m.totalOrders).toBe(100)
    expect(m.totalAmount).toBe(5000)
    expect(m.completionRate).toBe(50)
  })

  it('guards against division by zero (0 orders → 0 rates, no NaN)', () => {
    const m = transformToMetrics(
      resp({ totalOrders: 0, by_status: { complete: 0, confirm: 0, new: 0, cancel: 0 } })
    )
    expect(m.completionRate).toBe(0)
    expect(m.cancellationRate).toBe(0)
  })

  it('extracts byStatus from a statusBreakdown[] array form', () => {
    const m = transformToMetrics(
      resp({
        totalOrders: 10,
        statusBreakdown: [
          { status: 'complete', count: 8 },
          { status: 'cancel', count: 2 },
        ],
      })
    )
    expect(m.completionRate).toBe(80)
    expect(m.cancellationRate).toBe(20)
  })

  it('maps dailyTrend → dailyBreakdown (count→orders, amount default 0)', () => {
    const m = transformToMetrics(
      resp({
        totalOrders: 1,
        dailyTrend: [
          { date: '2026-01-01', count: 5, amount: 100 },
          { date: '2026-01-02', count: 3 },
        ],
      })
    )
    expect(m.dailyBreakdown).toEqual([
      { date: '2026-01-01', orders: 5, amount: 100 },
      { date: '2026-01-02', orders: 3, amount: 0 },
    ])
  })
})

describe('transformToStatusBreakdown', () => {
  it('builds the 4-status items array with counts + percentages', () => {
    const b = transformToStatusBreakdown(
      resp({ totalOrders: 100, by_status: { complete: 80, confirm: 5, new: 5, cancel: 10 } })
    )
    expect(b.total).toBe(100)
    expect(b.items).toEqual([
      { status: 'complete', count: 80, percentage: 80 },
      { status: 'confirm', count: 5, percentage: 5 },
      { status: 'new', count: 5, percentage: 5 },
      { status: 'cancel', count: 10, percentage: 10 },
    ])
  })

  it('rounds percentages to 1 decimal', () => {
    const b = transformToStatusBreakdown(
      resp({ totalOrders: 3, by_status: { complete: 1, confirm: 1, new: 1, cancel: 0 } })
    )
    expect(b.items[0].percentage).toBe(33.3) // 1/3 → 33.3
  })

  it('guards against division by zero (0 total → 0% items)', () => {
    const b = transformToStatusBreakdown(
      resp({ totalOrders: 0, by_status: { complete: 0, confirm: 0, new: 0, cancel: 0 } })
    )
    expect(b.total).toBe(0)
    expect(b.items.every(i => i.percentage === 0)).toBe(true)
  })
})
