import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '@/test/test-utils'
import { useFcuBySku, fcuAggregationKeys } from '../use-fcu-aggregation'

vi.mock('@/lib/api/shipment-cost/fcu-aggregation-api', () => ({
  getFcuBySku: vi.fn(),
}))

import { getFcuBySku } from '@/lib/api/shipment-cost/fcu-aggregation-api'

const mockFcuData = [
  {
    nmId: 12345,
    productName: 'Test Product',
    latestPcu: 150.5,
    latestDcu: 25.3,
    latestFcu: 175.8,
    shipmentId: 'ship-001',
    shipmentName: 'Shipment 1',
    confirmedAt: '2026-03-10T12:00:00Z',
  },
]

describe('useFcuBySku', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches FCU data when week is provided', async () => {
    vi.mocked(getFcuBySku).mockResolvedValue(mockFcuData)
    const { result } = renderHookWithClient(() => useFcuBySku('2026-W10'))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockFcuData)
    expect(getFcuBySku).toHaveBeenCalledWith('2026-W10')
  })

  it('does not fetch when week is undefined', () => {
    const { result } = renderHookWithClient(() => useFcuBySku(undefined))
    expect(result.current.isFetching).toBe(false)
    expect(getFcuBySku).not.toHaveBeenCalled()
  })

  it('does not fetch when week is empty string', () => {
    const { result } = renderHookWithClient(() => useFcuBySku(''))
    expect(result.current.isFetching).toBe(false)
    expect(getFcuBySku).not.toHaveBeenCalled()
  })

  it('handles error gracefully', async () => {
    vi.mocked(getFcuBySku).mockRejectedValue(new Error('Not Found'))
    const { result } = renderHookWithClient(() => useFcuBySku('2026-W10'))

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.data).toBeUndefined()
  })
})

describe('fcuAggregationKeys', () => {
  it('has correct base key', () => {
    expect(fcuAggregationKeys.all).toEqual(['fcu-aggregation'])
  })

  it('generates bySku key with week', () => {
    expect(fcuAggregationKeys.bySku('2026-W10')).toEqual(['fcu-aggregation', 'by-sku', '2026-W10'])
  })

  it('generates bySku key without week', () => {
    expect(fcuAggregationKeys.bySku()).toEqual(['fcu-aggregation', 'by-sku', undefined])
  })
})
