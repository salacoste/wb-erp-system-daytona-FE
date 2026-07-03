/**
 * Boundary normalizer tests — МойСклад live `/products` (M2).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers: kopeck÷100 (buyPrice.value + first salePrices[].value), null
 * preservation (AP#8 — money → null, never 0), missing buyPrice/salePrices,
 * response-shape `{rows, meta:{size}}` handling, query-param building.
 */

import { describe, it, expect, vi } from 'vitest'
import { mapMoyskladProduct, getMoyskladProducts } from '../moysklad-products'
import { apiClient } from '../../api-client'
import {
  moyskladProductSample,
  moyskladProductMissingPricesSample,
  moyskladProductsRawFixture,
  moyskladProductsEmptyResponse,
} from '@/test/fixtures/moysklad-empty'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)

describe('mapMoyskladProduct', () => {
  it('divides buyPrice.value kopecks by 100 → rubles (7080000 → 70800)', () => {
    const p = mapMoyskladProduct(moyskladProductSample)
    expect(p.buyPriceRub).toBe(70800)
    expect(p.id).toBe('prod-1')
    expect(p.name).toBe('Футболка белая')
    expect(p.article).toBe('WB-001')
    expect(p.code).toBe('00001')
    expect(p.externalCode).toBe('ext-1')
    expect(p.updated).toBe('2026-07-01T10:00:00.000Z')
  })

  it('takes the FIRST salePrices tier ÷100 (1200000 → 12000), ignores later tiers', () => {
    const p = mapMoyskladProduct(moyskladProductSample)
    expect(p.salePriceRub).toBe(12000)
    // Second tier (1100000 = 11000) must NOT be used.
    expect(p.salePriceRub).not.toBe(11000)
  })

  it('preserves null money when buyPrice/salePrices are missing (AP#8 — never 0)', () => {
    const p = mapMoyskladProduct(moyskladProductMissingPricesSample)
    expect(p.buyPriceRub).toBeNull()
    expect(p.salePriceRub).toBeNull()
    // article/code/updated null also preserved.
    expect(p.article).toBeNull()
    expect(p.code).toBeNull()
    expect(p.updated).toBeNull()
  })

  it('returns null salePriceRub when salePrices is an empty array', () => {
    const p = mapMoyskladProduct({ id: 'x', name: 'x', salePrices: [] })
    expect(p.salePriceRub).toBeNull()
  })

  it('handles null buyPrice.value (null → null, never 0)', () => {
    const p = mapMoyskladProduct({ id: 'x', name: 'x', buyPrice: { value: null } })
    expect(p.buyPriceRub).toBeNull()
  })

  it('returns safe defaults for null input', () => {
    const p = mapMoyskladProduct(null)
    expect(p.id).toBe('')
    expect(p.name).toBeNull()
    expect(p.buyPriceRub).toBeNull()
    expect(p.salePriceRub).toBeNull()
  })
})

describe('getMoyskladProducts', () => {
  it('reads {rows, meta:{size}} envelope with skipDataUnwrap', async () => {
    mockedGet.mockResolvedValueOnce(moyskladProductsRawFixture)
    const res = await getMoyskladProducts()
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/products',
      expect.objectContaining({ skipDataUnwrap: true })
    )
    expect(res.total).toBe(394)
    expect(res.rows).toHaveLength(2)
    expect(res.rows[0].buyPriceRub).toBe(70800)
    expect(res.rows[0].salePriceRub).toBe(12000)
  })

  it('builds limit/offset query for positive ints', async () => {
    mockedGet.mockResolvedValueOnce(moyskladProductsEmptyResponse)
    await getMoyskladProducts({ limit: 20, offset: 40 })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/products?limit=20&offset=40',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('omits limit=0/offset=0 (treated as absent)', async () => {
    mockedGet.mockResolvedValueOnce(moyskladProductsEmptyResponse)
    await getMoyskladProducts({ limit: 0, offset: 0 })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/products',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('surfaces a live-call failure (lets it throw — hook reports the error)', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Request failed with status code 502'))
    await expect(getMoyskladProducts()).rejects.toThrow('502')
  })
})
