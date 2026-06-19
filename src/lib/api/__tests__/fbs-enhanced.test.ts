import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { getFbsEnhanced } from '../fbs-enhanced'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('getFbsEnhanced', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(apiClient.get).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes an abort signal to the request and rejects when the request exceeds the timeout', async () => {
    let requestSignal: AbortSignal | undefined
    vi.mocked(apiClient.get).mockImplementationOnce((_endpoint, options) => {
      requestSignal = options?.signal ?? undefined
      return new Promise((_, reject) => {
        requestSignal?.addEventListener('abort', () => reject(requestSignal?.reason), {
          once: true,
        })
      })
    })

    const request = expect(
      getFbsEnhanced({ from: '2026-05-01', to: '2026-05-31' }, { timeoutMs: 100 })
    ).rejects.toThrow('FBS enhanced request timed out')

    await vi.advanceTimersByTimeAsync(100)

    await request
    expect(requestSignal?.aborted).toBe(true)
  })

  it('normalizes the raw enhanced FBS response on success', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        order_stats: { orders_count: 3, add_to_cart_percent: 12, orders_percent: 4 },
        stock_analytics: { total_stock: 10 },
        regional_data: [{ region: 'Москва', quantity: 2, percentage: 20 }],
        calculated_metrics: { turnover_rate: 1.5 },
        period: { from: '2026-05-01', to: '2026-05-31' },
        generated_at: '2026-05-31T12:00:00Z',
      },
    })

    const result = await getFbsEnhanced(
      { from: '2026-05-01', to: '2026-05-31' },
      { timeoutMs: 100 }
    )

    expect(result.orderStats.ordersCount).toBe(3)
    expect(result.funnelData.addToCartPercent).toBe(12)
    expect(result.regionalData[0]).toEqual({ region: 'Москва', quantity: 2, percentage: 20 })
  })
})
