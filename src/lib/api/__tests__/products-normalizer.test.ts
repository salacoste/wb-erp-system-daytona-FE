/**
 * Products Normalizer Tests
 * Tests for normalizeProduct from products-normalizer.ts
 * Covers snake_case/camelCase field mapping, null handling, and edge cases.
 */

import { describe, it, expect } from 'vitest'
import { normalizeProduct } from '../products-normalizer'
import type { RawProduct } from '../products-normalizer'

describe('normalizeProduct', () => {
  it('normalizes a fully-populated product with camelCase fields', () => {
    const raw: RawProduct = {
      nmId: '12345',
      saName: 'Liquid Tape 200ml',
      vendorCode: 'LT-200',
      brand: 'BrandX',
      photoUrl: 'https://img.wb.ru/12345.jpg',
      hasCogs: true,
      cogs: { unit_cost_rub: 150, valid_from: '2026-01-15' },
    }
    const result = normalizeProduct(raw)
    expect(result.nm_id).toBe('12345')
    expect(result.sa_name).toBe('Liquid Tape 200ml')
    expect(result.vendor_code).toBe('LT-200')
    expect(result.brand).toBe('BrandX')
    expect(result.photo_url).toBe('https://img.wb.ru/12345.jpg')
    expect(result.has_cogs).toBe(true)
    expect(result.cogs).toEqual({ unit_cost_rub: 150, valid_from: '2026-01-15' })
  })

  it('normalizes a fully-populated product with snake_case fields', () => {
    const raw: RawProduct = {
      nm_id: '67890',
      sa_name: 'Spray Paint Red',
      vendor_code: 'SP-RED',
      brand: 'PaintCo',
      photo_url: 'https://img.wb.ru/67890.jpg',
      has_cogs: false,
    }
    const result = normalizeProduct(raw)
    expect(result.nm_id).toBe('67890')
    expect(result.sa_name).toBe('Spray Paint Red')
    expect(result.vendor_code).toBe('SP-RED')
    expect(result.photo_url).toBe('https://img.wb.ru/67890.jpg')
    expect(result.has_cogs).toBe(false)
  })

  it('prefers snake_case over camelCase when both present', () => {
    const raw: RawProduct = {
      nm_id: '111',
      nmId: '222',
      sa_name: 'First',
      saName: 'Second',
      vendor_code: 'VC-1',
      vendorCode: 'VC-2',
      photo_url: 'url-1',
      photoUrl: 'url-2',
      has_cogs: true,
      hasCogs: false,
    }
    const result = normalizeProduct(raw)
    expect(result.nm_id).toBe('111')
    expect(result.sa_name).toBe('First')
    expect(result.vendor_code).toBe('VC-1')
    expect(result.photo_url).toBe('url-1')
    expect(result.has_cogs).toBe(true)
  })

  it('defaults nm_id to empty string when both missing', () => {
    const result = normalizeProduct({})
    expect(result.nm_id).toBe('')
  })

  it('defaults sa_name to empty string when missing', () => {
    expect(normalizeProduct({ nmId: '1' }).sa_name).toBe('')
  })

  it('defaults vendor_code to empty string when missing', () => {
    expect(normalizeProduct({ nmId: '1' }).vendor_code).toBe('')
  })

  it('defaults photo_url to undefined when missing', () => {
    expect(normalizeProduct({ nmId: '1' }).photo_url).toBeUndefined()
  })

  it('defaults has_cogs to false when missing', () => {
    expect(normalizeProduct({ nmId: '1' }).has_cogs).toBe(false)
  })

  it('coerces numeric nm_id to string (Anti-Pattern #10)', () => {
    const raw = { nm_id: 12345 }
    const result = normalizeProduct(raw as unknown as RawProduct)
    expect(result.nm_id).toBe('12345')
    expect(typeof result.nm_id).toBe('string')
  })

  it('coerces bigint nm_id to string without precision loss', () => {
    const raw = { nm_id: 1234567890123456789n }
    const result = normalizeProduct(raw as unknown as RawProduct)
    expect(result.nm_id).toBe('1234567890123456789')
    expect(typeof result.nm_id).toBe('string')
  })

  it('preserves dimensions when present', () => {
    const raw: RawProduct = {
      nmId: '1',
      dimensions: {
        length_mm: 100,
        width_mm: 50,
        height_mm: 30,
        volume_liters: 0.15,
      },
    }
    const result = normalizeProduct(raw)
    expect(result.dimensions).toEqual({
      length_mm: 100,
      width_mm: 50,
      height_mm: 30,
      volume_liters: 0.15,
    })
  })

  it('sets dimensions to null when missing', () => {
    expect(normalizeProduct({ nmId: '1' }).dimensions).toBeNull()
  })

  it('preserves null dimensions', () => {
    const raw: RawProduct = { nmId: '1', dimensions: null }
    expect(normalizeProduct(raw).dimensions).toBeNull()
  })

  it('preserves category_hierarchy when present', () => {
    const raw: RawProduct = {
      nmId: '1',
      category_hierarchy: {
        subject_id: 42,
        subject_name: 'Tools',
        parent_id: 10,
        parent_name: 'DIY',
      },
    }
    const result = normalizeProduct(raw)
    expect(result.category_hierarchy).toEqual({
      subject_id: 42,
      subject_name: 'Tools',
      parent_id: 10,
      parent_name: 'DIY',
    })
  })

  it('sets category_hierarchy to null when missing', () => {
    expect(normalizeProduct({ nmId: '1' }).category_hierarchy).toBeNull()
  })

  it('preserves null category_hierarchy', () => {
    const raw: RawProduct = { nmId: '1', category_hierarchy: null }
    expect(normalizeProduct(raw).category_hierarchy).toBeNull()
  })

  it('preserves brand as undefined when missing', () => {
    expect(normalizeProduct({ nmId: '1' }).brand).toBeUndefined()
  })
})
