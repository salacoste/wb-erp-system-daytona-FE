import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchFunnelExportItems } from '@/lib/api/funnel-export'
import { getFunnelData } from '@/lib/api/funnel-analytics'
import type { FunnelProductItem, FunnelResponse } from '@/types/analytics-funnel'

vi.mock('@/lib/api/funnel-analytics', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/funnel-analytics')>(
    '@/lib/api/funnel-analytics'
  )
  return { ...actual, getFunnelData: vi.fn() }
})

const item = (nmId: number): FunnelProductItem => ({
  nmId,
  openCardCount: 1,
  addToCartCount: 1,
  ordersCount: 1,
  ordersSumRub: 1,
  buyoutCount: 1,
  buyoutSumRub: 1,
  cancelCount: 0,
  cancelSumRub: 0,
  cartConversion: 100,
  orderConversion: 100,
  buyoutConversion: 100,
  cancelRate: 0,
  totalConversion: 100,
})

const response = (
  items: FunnelProductItem[],
  hasMore: boolean,
  offset: number
): FunnelResponse => ({
  items,
  summary: {
    openCardCount: 0,
    addToCartCount: 0,
    ordersCount: 0,
    ordersSumRub: 0,
    buyoutCount: 0,
    buyoutSumRub: 0,
    cancelCount: 0,
    cancelSumRub: 0,
    cartConversion: 0,
    orderConversion: 0,
    buyoutConversion: 0,
    cancelRate: 0,
    totalConversion: 0,
  },
  pagination: { total: 3, limit: 500, offset, hasMore },
})

describe('fetchFunnelExportItems', () => {
  beforeEach(() => {
    vi.mocked(getFunnelData).mockReset()
  })

  it('paginates with backend-supported limit and aggregates all rows', async () => {
    vi.mocked(getFunnelData)
      .mockResolvedValueOnce(response([item(1), item(2)], true, 0))
      .mockResolvedValueOnce(response([item(3)], false, 500))

    const rows = await fetchFunnelExportItems('2026-05-01', '2026-05-31', [101, 202])

    expect(rows.map(r => r.nmId)).toEqual([1, 2, 3])
    expect(getFunnelData).toHaveBeenCalledTimes(2)
    expect(vi.mocked(getFunnelData).mock.calls.map(([params]) => params.limit)).toEqual([500, 500])
    expect(vi.mocked(getFunnelData).mock.calls.map(([params]) => params.offset)).toEqual([0, 500])
    expect(vi.mocked(getFunnelData).mock.calls[0][0].nmIds).toEqual([101, 202])
  })

  it('stops if the backend reports hasMore but returns an empty page', async () => {
    vi.mocked(getFunnelData).mockResolvedValueOnce(response([], true, 0))

    await expect(fetchFunnelExportItems('2026-05-01', '2026-05-31', [])).resolves.toEqual([])
    expect(getFunnelData).toHaveBeenCalledTimes(1)
    expect(vi.mocked(getFunnelData).mock.calls[0][0].limit).toBe(500)
  })
})
