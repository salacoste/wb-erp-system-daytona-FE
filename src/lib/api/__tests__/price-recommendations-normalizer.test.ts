import { describe, it, expect } from 'vitest'
import {
  normalizePriceRecommendationsResponse,
  normalizePriceRecommendation,
} from '../price-recommendations-normalizer'
import type { PriceRecommendation } from '@/types/price-recommendations'

// ---------------------------------------------------------------------------
// Shared raw shapes (backend-like)
// ---------------------------------------------------------------------------

function rawItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'abc-123',
    nmId: 99452321,
    vendorCode: 'SKU-001',
    productName: 'Test Product',
    lastPrice: 1500,
    breakEvenPrice: 800,
    recommendedPrice: 1200,
    marginAtCurrentPct: 46.7,
    marginAtRecommendedPct: 33.3,
    gap: -300,
    gapPct: -20,
    targetMarginPct: 30,
    computedAt: '2026-06-05T12:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// normalizePriceRecommendationsResponse
// ---------------------------------------------------------------------------

describe('normalizePriceRecommendationsResponse', () => {
  it('maps a well-formed response with items', () => {
    const raw = {
      items: [rawItem(), rawItem({ id: 'def-456', nmId: 123 })],
      total: 2,
      nextCursor: 'cursor-token',
    }

    const result = normalizePriceRecommendationsResponse(raw)

    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.nextCursor).toBe('cursor-token')
  })

  it('returns empty items array when items is missing', () => {
    const result = normalizePriceRecommendationsResponse({ total: 0 })

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.nextCursor).toBeNull()
  })

  it('returns empty items when items is not an array', () => {
    const result = normalizePriceRecommendationsResponse({ items: 'oops', total: 5 })

    expect(result.items).toEqual([])
  })

  it('handles null raw input', () => {
    const result = normalizePriceRecommendationsResponse(null)

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.nextCursor).toBeNull()
  })

  it('handles undefined raw input', () => {
    const result = normalizePriceRecommendationsResponse(undefined)

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.nextCursor).toBeNull()
  })

  it('handles non-object raw input (number)', () => {
    const result = normalizePriceRecommendationsResponse(42)

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })

  it('defaults total to 0 when missing', () => {
    const result = normalizePriceRecommendationsResponse({ items: [] })

    expect(result.total).toBe(0)
  })

  it('coerces non-numeric total to 0', () => {
    const result = normalizePriceRecommendationsResponse({ items: [], total: 'many' })

    expect(result.total).toBe(0)
  })

  it('defaults nextCursor to null when missing', () => {
    const result = normalizePriceRecommendationsResponse({ items: [], total: 0 })

    expect(result.nextCursor).toBeNull()
  })

  it('sets nextCursor to null for non-string values', () => {
    const result = normalizePriceRecommendationsResponse({ items: [], total: 0, nextCursor: 123 })

    expect(result.nextCursor).toBeNull()
  })

  it('maps each item through toItem (spot-check nmId coercion)', () => {
    const raw = {
      items: [rawItem({ nmId: '777' })],
      total: 1,
    }

    const result = normalizePriceRecommendationsResponse(raw)

    expect(result.items[0].nmId).toBe(777)
  })
})

// ---------------------------------------------------------------------------
// normalizePriceRecommendation (single item)
// ---------------------------------------------------------------------------

describe('normalizePriceRecommendation', () => {
  it('maps a well-formed item', () => {
    const raw = rawItem()

    const result: PriceRecommendation = normalizePriceRecommendation(raw)

    expect(result.id).toBe('abc-123')
    expect(result.nmId).toBe(99452321)
    expect(result.vendorCode).toBe('SKU-001')
    expect(result.productName).toBe('Test Product')
    expect(result.lastPrice).toBe(1500)
    expect(result.breakEvenPrice).toBe(800)
    expect(result.recommendedPrice).toBe(1200)
    expect(result.marginAtCurrentPct).toBe(46.7)
    expect(result.marginAtRecommendedPct).toBe(33.3)
    expect(result.gap).toBe(-300)
    expect(result.gapPct).toBe(-20)
    expect(result.targetMarginPct).toBe(30)
    expect(result.computedAt).toBe('2026-06-05T12:00:00Z')
  })

  // --- Nullable money/ratio fields preserve null ---

  it('preserves null on lastPrice (money field)', () => {
    const result = normalizePriceRecommendation(rawItem({ lastPrice: null }))

    expect(result.lastPrice).toBeNull()
  })

  it('preserves null on marginAtCurrentPct (ratio field)', () => {
    const result = normalizePriceRecommendation(rawItem({ marginAtCurrentPct: null }))

    expect(result.marginAtCurrentPct).toBeNull()
  })

  it('preserves null on gap (money diff)', () => {
    const result = normalizePriceRecommendation(rawItem({ gap: null }))

    expect(result.gap).toBeNull()
  })

  it('preserves null on gapPct (ratio field)', () => {
    const result = normalizePriceRecommendation(rawItem({ gapPct: null }))

    expect(result.gapPct).toBeNull()
  })

  // --- Required number fields default to 0 on null/missing ---

  it('defaults breakEvenPrice to 0 when null', () => {
    const result = normalizePriceRecommendation(rawItem({ breakEvenPrice: null }))

    expect(result.breakEvenPrice).toBe(0)
  })

  it('defaults recommendedPrice to 0 when null', () => {
    const result = normalizePriceRecommendation(rawItem({ recommendedPrice: null }))

    expect(result.recommendedPrice).toBe(0)
  })

  it('defaults marginAtRecommendedPct to 0 when null', () => {
    const result = normalizePriceRecommendation(rawItem({ marginAtRecommendedPct: null }))

    expect(result.marginAtRecommendedPct).toBe(0)
  })

  it('defaults targetMarginPct to 0 when null', () => {
    const result = normalizePriceRecommendation(rawItem({ targetMarginPct: null }))

    expect(result.targetMarginPct).toBe(0)
  })

  // --- String fields ---

  it('defaults id to empty string when missing', () => {
    const result = normalizePriceRecommendation(rawItem({ id: undefined }))

    expect(result.id).toBe('')
  })

  it('defaults vendorCode to null for non-string', () => {
    const result = normalizePriceRecommendation(rawItem({ vendorCode: 123 }))

    expect(result.vendorCode).toBeNull()
  })

  it('preserves null vendorCode', () => {
    const result = normalizePriceRecommendation(rawItem({ vendorCode: null }))

    expect(result.vendorCode).toBeNull()
  })

  it('defaults productName to null for non-string', () => {
    const result = normalizePriceRecommendation(rawItem({ productName: false }))

    expect(result.productName).toBeNull()
  })

  it('defaults computedAt to empty string when missing', () => {
    const result = normalizePriceRecommendation(rawItem({ computedAt: undefined }))

    expect(result.computedAt).toBe('')
  })

  // --- nmId coercion ---

  it('coerces string nmId to number', () => {
    const result = normalizePriceRecommendation(rawItem({ nmId: '555' }))

    expect(result.nmId).toBe(555)
  })

  it('defaults nmId to 0 for non-numeric', () => {
    const result = normalizePriceRecommendation(rawItem({ nmId: 'not-a-number' }))

    expect(result.nmId).toBe(0)
  })

  // --- Fully empty input ---

  it('handles completely empty object', () => {
    const result = normalizePriceRecommendation({})

    expect(result.id).toBe('')
    expect(result.nmId).toBe(0)
    expect(result.vendorCode).toBeNull()
    expect(result.productName).toBeNull()
    expect(result.lastPrice).toBeNull()
    expect(result.breakEvenPrice).toBe(0)
    expect(result.recommendedPrice).toBe(0)
    expect(result.marginAtCurrentPct).toBeNull()
    expect(result.marginAtRecommendedPct).toBe(0)
    expect(result.gap).toBeNull()
    expect(result.gapPct).toBeNull()
    expect(result.targetMarginPct).toBe(0)
    expect(result.computedAt).toBe('')
  })

  it('handles null input', () => {
    const result = normalizePriceRecommendation(null)

    expect(result.id).toBe('')
    expect(result.nmId).toBe(0)
    expect(result.lastPrice).toBeNull()
  })

  it('handles non-object input (string)', () => {
    const result = normalizePriceRecommendation('bad')

    expect(result.id).toBe('')
    expect(result.nmId).toBe(0)
  })
})
