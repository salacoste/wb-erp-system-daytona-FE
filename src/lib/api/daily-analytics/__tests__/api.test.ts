/**
 * Tests for daily-analytics API transforms — Story 88.2-FE null-preservation
 * + Story 104.2-FE: getAdvertisingDailyData full-field mapping
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getFinanceDailyData, getOrdersCogsDailyData, getAdvertisingDailyData } from '../api'
import { apiClient } from '@/lib/api-client'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('getFinanceDailyData — Story 88.2-FE null-preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves null cogsTotal → cogs_total: null', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        date: '2026-01-01',
        revenueGross: 5000,
        revenueNet: 4500,
        returns: 0,
        cogsTotal: null,
        grossProfit: null,
        marginPct: null,
        logistics: 100,
        storage: 50,
        penalties: 0,
        paidAcceptance: 0,
        commission: 500,
        salesCount: 10,
        returnsCount: 0,
      },
    ])

    const result = await getFinanceDailyData('2026-01-01', '2026-01-01')
    expect(result).toHaveLength(1)
    expect(result[0].cogs_total).toBeNull()
  })

  it('preserves numeric cogsTotal: 0 → cogs_total: 0 (legitimate zero)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        date: '2026-01-01',
        revenueGross: 5000,
        revenueNet: 4500,
        returns: 0,
        cogsTotal: 0,
        grossProfit: 5000,
        marginPct: 100,
        logistics: 100,
        storage: 50,
        penalties: 0,
        paidAcceptance: 0,
        commission: 500,
        salesCount: 10,
        returnsCount: 0,
      },
    ])

    const result = await getFinanceDailyData('2026-01-01', '2026-01-01')
    expect(result[0].cogs_total).toBe(0)
  })

  it('treats missing cogsTotal field as null (undefined → null)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        date: '2026-01-01',
        revenueGross: 5000,
        revenueNet: 4500,
        returns: 0,
        // cogsTotal omitted
        grossProfit: null,
        marginPct: null,
        logistics: 100,
        storage: 50,
        penalties: 0,
        paidAcceptance: 0,
        commission: 500,
        salesCount: 10,
        returnsCount: 0,
      },
    ])

    const result = await getFinanceDailyData('2026-01-01', '2026-01-01')
    expect(result[0].cogs_total).toBeNull()
  })
})

describe('getOrdersCogsDailyData — Story 88.2-FE null-preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves null cogs → cogs: null', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      by_day_with_cogs: [
        { date: '2026-01-01', cogs: null },
        { date: '2026-01-02', cogs: 0 },
        { date: '2026-01-03', cogs: 1500 },
      ],
    })

    const result = await getOrdersCogsDailyData('2026-01-01', '2026-01-03')
    expect(result).toHaveLength(3)
    expect(result[0].cogs).toBeNull()
    expect(result[1].cogs).toBe(0)
    expect(result[2].cogs).toBe(1500)
  })
})

describe('getAdvertisingDailyData — Story 104.2-FE full-field mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps all 9 backend fields to AdvertisingDailyData', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        date: '2026-05-01',
        spend: 8000,
        views: 50000,
        clicks: 1200,
        ctr: 2.4,
        cpc: 6.67,
        orders: 45,
        revenue: 67500,
        roas: 8.44,
      },
    ])

    const result = await getAdvertisingDailyData('2026-05-01', '2026-05-01')
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-05-01')
    expect(result[0].total_spend).toBe(8000)
    expect(result[0].views).toBe(50000)
    expect(result[0].clicks).toBe(1200)
    expect(result[0].ctr).toBe(2.4)
    expect(result[0].cpc).toBe(6.67)
    expect(result[0].orders).toBe(45)
    expect(result[0].revenue).toBe(67500)
    expect(result[0].roas).toBe(8.44)
  })

  it('defaults missing numeric fields to 0', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      { date: '2026-05-02' }, // all fields absent
    ])

    const result = await getAdvertisingDailyData('2026-05-02', '2026-05-02')
    expect(result[0].total_spend).toBe(0)
    expect(result[0].views).toBe(0)
    expect(result[0].clicks).toBe(0)
    expect(result[0].ctr).toBe(0)
    expect(result[0].cpc).toBe(0)
    expect(result[0].orders).toBe(0)
    expect(result[0].revenue).toBe(0)
    expect(result[0].roas).toBe(0)
  })

  it('returns empty array when backend returns empty array', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([])

    const result = await getAdvertisingDailyData('2026-05-01', '2026-05-07')
    expect(result).toEqual([])
  })

  it('returns empty array on fetch error', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'))

    const result = await getAdvertisingDailyData('2026-05-01', '2026-05-07')
    expect(result).toEqual([])
  })
})
