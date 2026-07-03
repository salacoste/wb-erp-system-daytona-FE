/**
 * Boundary normalizer tests — МойСклад live `/variants` (M3).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers: barcodesCount (array length, missing/non-array → 0), null preservation
 * (name/code/updated → null, AP#8), parentProductHref (meta.href then id fallback,
 * missing → null), response-shape `{rows, meta:{size}}` handling, query-param
 * building. Verifies variants have NO article field (contract's key point).
 */

import { describe, it, expect, vi } from 'vitest'
import { mapMoyskladVariant, getMoyskladVariants } from '../moysklad-variants'
import { apiClient } from '../../api-client'
import {
  moyskladVariantSample,
  moyskladVariantMissingRefsSample,
  moyskladVariantsRawFixture,
  moyskladVariantsEmptyResponse,
} from '@/test/fixtures/moysklad-empty'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)

describe('mapMoyskladVariant', () => {
  it('counts barcodes (3-entry array → 3)', () => {
    const v = mapMoyskladVariant(moyskladVariantSample)
    expect(v.barcodesCount).toBe(3)
    expect(v.id).toBe('var-1')
    expect(v.name).toBe('Футболка белая / M')
    expect(v.code).toBe('00001-M')
    expect(v.updated).toBe('2026-07-01T10:00:00.000Z')
  })

  it('extracts parentProductHref from product.meta.href', () => {
    const v = mapMoyskladVariant(moyskladVariantSample)
    expect(v.parentProductHref).toBe(
      'https://online.moysklad.ru/api/remap/1.2/entity/product/prod-1'
    )
  })

  it('falls back to product.id when meta.href is absent (best-effort)', () => {
    const v = mapMoyskladVariant(moyskladVariantMissingRefsSample)
    expect(v.parentProductHref).toBe('prod-2')
  })

  it('preserves null code/updated (AP#8) and 0 barcodesCount when barcodes omitted', () => {
    const v = mapMoyskladVariant(moyskladVariantMissingRefsSample)
    expect(v.code).toBeNull()
    expect(v.updated).toBeNull()
    // barcodes missing → 0 (count exception, NOT null).
    expect(v.barcodesCount).toBe(0)
  })

  it('returns 0 barcodesCount when barcodes is a non-array (count exception)', () => {
    const v = mapMoyskladVariant({ id: 'x', name: 'x', barcodes: 'not-an-array' })
    expect(v.barcodesCount).toBe(0)
  })

  it('returns null parentProductHref when product is missing or non-link-shaped', () => {
    expect(mapMoyskladVariant({ id: 'x', name: 'x' }).parentProductHref).toBeNull()
    // product present but neither meta.href nor id → null (Defensive FE).
    expect(
      mapMoyskladVariant({ id: 'x', name: 'x', product: { foo: 'bar' } }).parentProductHref
    ).toBeNull()
  })

  it('does NOT surface an article field (variants lack article — contract key point)', () => {
    const v = mapMoyskladVariant({ id: 'x', name: 'x', article: 'should-be-ignored' })
    expect(v).not.toHaveProperty('article')
  })

  it('returns safe defaults for null input', () => {
    const v = mapMoyskladVariant(null)
    expect(v.id).toBe('')
    expect(v.name).toBeNull()
    expect(v.code).toBeNull()
    expect(v.parentProductHref).toBeNull()
    expect(v.barcodesCount).toBe(0)
    expect(v.updated).toBeNull()
  })
})

describe('getMoyskladVariants', () => {
  it('reads {rows, meta:{size}} envelope with skipDataUnwrap', async () => {
    mockedGet.mockResolvedValueOnce(moyskladVariantsRawFixture)
    const res = await getMoyskladVariants()
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/variants',
      expect.objectContaining({ skipDataUnwrap: true })
    )
    expect(res.total).toBe(41)
    expect(res.rows).toHaveLength(2)
    expect(res.rows[0].barcodesCount).toBe(3)
    expect(res.rows[1].barcodesCount).toBe(0)
  })

  it('builds limit/offset query for positive ints', async () => {
    mockedGet.mockResolvedValueOnce(moyskladVariantsEmptyResponse)
    await getMoyskladVariants({ limit: 20, offset: 40 })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/variants?limit=20&offset=40',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('omits limit=0/offset=0 (treated as absent)', async () => {
    mockedGet.mockResolvedValueOnce(moyskladVariantsEmptyResponse)
    await getMoyskladVariants({ limit: 0, offset: 0 })
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/moysklad/variants',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('surfaces a live-call failure (lets it throw — hook reports the error)', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Request failed with status code 502'))
    await expect(getMoyskladVariants()).rejects.toThrow('502')
  })
})
