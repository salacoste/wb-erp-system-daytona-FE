/**
 * S3: product dictionaries API tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { apiClient } from '../../api-client'
import { getProductDictionaries } from '../product-dictionaries'

vi.spyOn(console, 'debug').mockImplementation(() => {})

describe('getProductDictionaries (S3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs /v1/products/dictionaries and maps arrays', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      brands: [
        { value: 'Nike', count: 42 },
        { value: 'Adidas', count: 17 },
      ],
      subjects: [{ value: 'Кроссовки', count: 30 }],
      tnveds: [{ value: '6404', count: 50 }],
    })

    const result = await getProductDictionaries()

    expect(apiClient.get).toHaveBeenCalledWith('/v1/products/dictionaries')
    expect(result.brands).toEqual([
      { value: 'Nike', count: 42 },
      { value: 'Adidas', count: 17 },
    ])
    expect(result.subjects).toEqual([{ value: 'Кроссовки', count: 30 }])
    expect(result.tnveds).toEqual([{ value: '6404', count: 50 }])
  })

  it('appends includeDiscontinued=true when requested', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ brands: [], subjects: [], tnveds: [] })
    await getProductDictionaries(true)
    expect(apiClient.get).toHaveBeenCalledWith('/v1/products/dictionaries?includeDiscontinued=true')
  })

  it('drops empty-string values and coerces non-numeric counts to 0', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      brands: [
        { value: 'Nike', count: 5 },
        { value: '', count: 3 }, // empty value → dropped
        { value: 'Puma', count: 'oops' }, // non-numeric count → 0
      ],
      subjects: null, // non-array → []
      tnveds: undefined,
    })

    const result = await getProductDictionaries()

    expect(result.brands).toEqual([
      { value: 'Nike', count: 5 },
      { value: 'Puma', count: 0 },
    ])
    expect(result.subjects).toEqual([])
    expect(result.tnveds).toEqual([])
  })
})
