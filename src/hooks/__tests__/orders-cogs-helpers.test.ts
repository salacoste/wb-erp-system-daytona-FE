/**
 * Unit tests for orders-cogs-helpers (Story 61.4-FE) — coverage added iter-168.
 *
 * Pure transforms extracted from useOrdersCogs: mapBackendResponse (camelCase→snake_case boundary
 * mapping; statusBreakdown[]→by_status{}; by_day_with_cogs field rename; total_amount fallback) and
 * transformToCogsMetrics (margin/coverage/profit with /0 guards + defensive by_status).
 */

import { describe, it, expect } from 'vitest'
import type { OrdersVolumeWithCogsResponse } from '@/types/orders-cogs'
import { mapBackendResponse, transformToCogsMetrics } from '@/hooks/orders-cogs-helpers'

const resp = (o: Record<string, unknown>): OrdersVolumeWithCogsResponse =>
  o as unknown as OrdersVolumeWithCogsResponse

describe('mapBackendResponse', () => {
  it('maps statusBreakdown[] → by_status{} + camelCase totals', () => {
    const r = mapBackendResponse({
      totalOrders: 100,
      total_amount: 10000,
      avgOrderValue: 100,
      statusBreakdown: [
        { status: 'complete', count: 80 },
        { status: 'cancel', count: 20 },
      ],
    })
    expect(r.total_orders).toBe(100)
    expect(r.total_amount).toBe(10000)
    expect(r.avg_order_value).toBe(100)
    expect(r.by_status).toEqual({ new: 0, confirm: 0, complete: 80, cancel: 20 })
    expect(r.by_day_with_cogs).toBeUndefined()
  })

  it('renames by_day_with_cogs fields (count→orders, cogs→cogs_total)', () => {
    const r = mapBackendResponse({
      by_day_with_cogs: [{ date: '2026-01-01', count: 5, amount: 500, cogs: 300, profit: 200 }],
    })
    expect(r.by_day_with_cogs).toEqual([
      {
        date: '2026-01-01',
        orders: 5,
        amount: 500,
        cogs_total: 300,
        profit: 200,
        margin_pct: undefined,
      },
    ])
  })

  it('derives total_amount from gross_profit + cogs_total when absent', () => {
    expect(mapBackendResponse({ gross_profit: 4000, cogs_total: 6000 }).total_amount).toBe(10000)
  })

  it('defaults an empty response (0 orders, zeroed by_status, no daily)', () => {
    const r = mapBackendResponse({})
    expect(r.total_orders).toBe(0)
    expect(r.by_status).toEqual({ new: 0, confirm: 0, complete: 0, cancel: 0 })
    expect(r.by_day_with_cogs).toBeUndefined()
  })
})

describe('transformToCogsMetrics', () => {
  it('computes COGS metrics (profit, margin, coverage, rates)', () => {
    const m = transformToCogsMetrics(
      resp({
        total_orders: 100,
        total_amount: 10000,
        cogs_total: 6000,
        orders_with_cogs: 80,
        by_status: { new: 5, confirm: 5, complete: 80, cancel: 10 },
      })
    )
    expect(m.cogsTotal).toBe(6000)
    expect(m.grossProfit).toBe(4000) // total_amount - cogs
    expect(m.marginPct).toBe(40) // 4000 / 10000 * 100
    expect(m.cogsCoveragePct).toBe(80) // 80 / 100 * 100
    expect(m.ordersMissingCogs).toBe(20) // 100 - 80
    expect(m.avgProfitPerOrder).toBe(40) // 4000 / 100
    expect(m.completionRate).toBe(80)
    expect(m.cancellationRate).toBe(10)
  })

  it('guards division by zero (0 orders) and falls back to a default by_status', () => {
    const m = transformToCogsMetrics(resp({ total_orders: 0, total_amount: 0, cogs_total: 0 }))
    expect(m.completionRate).toBe(0)
    expect(m.marginPct).toBe(0)
    expect(m.byStatus).toEqual({ new: 0, confirm: 0, complete: 0, cancel: 0 })
  })

  it('falls back gross_profit to total_amount - cogs and margin from those', () => {
    const m = transformToCogsMetrics(
      resp({ total_orders: 10, total_amount: 1000, cogs_total: 400 })
    )
    expect(m.grossProfit).toBe(600)
    expect(m.marginPct).toBe(60)
  })
})
