/**
 * Tests for pricing-basis API client (SPP-1.3 / SPP-1.7-FE)
 * GET/PUT /v1/pricing/basis + normalizePriceBasis defensive folding.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), put: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { getPricingBasis, updatePricingBasis, normalizePriceBasis } from '../pricing-basis'
import type { PriceBasisOrUnknown } from '@/types/price-recommendations'

const mockedGet = vi.mocked(apiClient.get)
const mockedPut = vi.mocked(apiClient.put)

beforeEach(() => {
  vi.clearAllMocks()
})

// -- normalizePriceBasis ------------------------------------------------------

describe('normalizePriceBasis', () => {
  it('passes SELLER through', () => {
    expect(normalizePriceBasis('SELLER')).toBe('SELLER')
  })

  it('passes STOREFRONT_ANON through', () => {
    expect(normalizePriceBasis('STOREFRONT_ANON')).toBe('STOREFRONT_ANON')
  })

  it('INDICATES unknown enum values as UNKNOWN (never silently relabeled)', () => {
    expect(normalizePriceBasis('STOREFRONT_SESSION')).toBe('UNKNOWN')
  })

  it('indicates null as UNKNOWN', () => {
    expect(normalizePriceBasis(null)).toBe('UNKNOWN')
  })

  it('indicates undefined as UNKNOWN', () => {
    expect(normalizePriceBasis(undefined)).toBe('UNKNOWN')
  })

  it('indicates non-string garbage as UNKNOWN', () => {
    expect(normalizePriceBasis(42)).toBe('UNKNOWN')
    expect(normalizePriceBasis({ priceBasis: 'SELLER' })).toBe('UNKNOWN')
  })
})

// -- isSettablePriceBasis -----------------------------------------------------

describe('isSettablePriceBasis', () => {
  it('accepts the two settable values', async () => {
    const { isSettablePriceBasis } = await import('../pricing-basis')
    expect(isSettablePriceBasis('SELLER')).toBe(true)
    expect(isSettablePriceBasis('STOREFRONT_ANON')).toBe(true)
  })

  it('rejects UNKNOWN and garbage', async () => {
    const { isSettablePriceBasis } = await import('../pricing-basis')
    expect(isSettablePriceBasis('UNKNOWN')).toBe(false)
    expect(isSettablePriceBasis(null as unknown as PriceBasisOrUnknown)).toBe(false)
    expect(isSettablePriceBasis('STOREFRONT_SESSION' as never)).toBe(false)
  })
})

// -- getPricingBasis ----------------------------------------------------------

describe('getPricingBasis', () => {
  it('GETs /v1/pricing/basis with skipDataUnwrap and normalizes the envelope', async () => {
    mockedGet.mockResolvedValueOnce({ priceBasis: 'STOREFRONT_ANON' })

    const result = await getPricingBasis()

    expect(mockedGet).toHaveBeenCalledWith('/v1/pricing/basis', { skipDataUnwrap: true })
    expect(result).toBe('STOREFRONT_ANON')
  })

  it('indicates UNKNOWN when the response carries no priceBasis', async () => {
    mockedGet.mockResolvedValueOnce({})

    const result = await getPricingBasis()

    expect(result).toBe('UNKNOWN')
  })

  it('handles non-object response body defensively (UNKNOWN)', async () => {
    mockedGet.mockResolvedValueOnce(null)

    const result = await getPricingBasis()

    expect(result).toBe('UNKNOWN')
  })

  it('propagates API errors', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Not Found'))
    await expect(getPricingBasis()).rejects.toThrow('Not Found')
  })
})

// -- updatePricingBasis -------------------------------------------------------

describe('updatePricingBasis', () => {
  it('PUTs the two-value body shape and normalizes the echo', async () => {
    mockedPut.mockResolvedValueOnce({ priceBasis: 'SELLER' })

    const result = await updatePricingBasis('SELLER')

    expect(mockedPut).toHaveBeenCalledWith('/v1/pricing/basis', { priceBasis: 'SELLER' })
    expect(result).toBe('SELLER')
  })

  it('PUTs STOREFRONT_ANON and echoes it back', async () => {
    mockedPut.mockResolvedValueOnce({ priceBasis: 'STOREFRONT_ANON' })

    const result = await updatePricingBasis('STOREFRONT_ANON')

    expect(mockedPut).toHaveBeenCalledWith('/v1/pricing/basis', {
      priceBasis: 'STOREFRONT_ANON',
    })
    expect(result).toBe('STOREFRONT_ANON')
  })

  it('refuses to send unsupported values (runtime guard mirrors the union)', async () => {
    await expect(updatePricingBasis('STOREFRONT_SESSION' as never)).rejects.toThrow(
      'Unsupported price basis'
    )
    expect(mockedPut).not.toHaveBeenCalled()
  })

  it('propagates API errors', async () => {
    mockedPut.mockRejectedValueOnce(new Error('Conflict'))
    await expect(updatePricingBasis('SELLER')).rejects.toThrow('Conflict')
  })
})
