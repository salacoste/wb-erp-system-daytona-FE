import { describe, it, expect, vi } from 'vitest'
import { renderHookWithClient } from '@/test/test-utils'
import { useFcuBySku, fcuAggregationKeys } from '../use-fcu-aggregation'

vi.mock('@/lib/api/shipment-cost/fcu-aggregation-api', () => ({
  getFcuBySku: vi.fn(),
}))

import { getFcuBySku } from '@/lib/api/shipment-cost/fcu-aggregation-api'

describe('useFcuBySku', () => {
  it('is disabled — endpoint not yet implemented (2026-03-30)', () => {
    const { result } = renderHookWithClient(() => useFcuBySku('2026-W10'))
    expect(result.current.isFetching).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(getFcuBySku).not.toHaveBeenCalled()
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
