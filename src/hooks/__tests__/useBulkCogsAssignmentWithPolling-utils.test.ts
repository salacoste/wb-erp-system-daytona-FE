/**
 * Unit tests for useBulkCogsAssignmentWithPolling-utils pure functions
 */

import { describe, it, expect } from 'vitest'
import {
  hasValidMargin,
  isMarginCalculationComplete,
  extractSampleIds,
  MARGIN_COMPLETION_THRESHOLD,
  MAX_SAMPLE_SIZE,
} from '../useBulkCogsAssignmentWithPolling-utils'
import type { ProductListItem } from '@/types/cogs'

describe('useBulkCogsAssignmentWithPolling-utils', () => {
  // ---------------------------------------------------------------------------
  // hasValidMargin
  // ---------------------------------------------------------------------------
  describe('hasValidMargin', () => {
    it('returns true for finite number margin', () => {
      const product = { current_margin_pct: 25.5 } as ProductListItem
      expect(hasValidMargin(product)).toBe(true)
    })

    it('returns true for zero margin', () => {
      const product = { current_margin_pct: 0 } as ProductListItem
      expect(hasValidMargin(product)).toBe(true)
    })

    it('returns false for null margin', () => {
      const product = { current_margin_pct: null } as ProductListItem
      expect(hasValidMargin(product)).toBe(false)
    })

    it('returns false for undefined margin', () => {
      const product = {} as ProductListItem
      expect(hasValidMargin(product)).toBe(false)
    })

    it('returns false for NaN margin', () => {
      const product = { current_margin_pct: NaN } as ProductListItem
      expect(hasValidMargin(product)).toBe(false)
    })

    it('returns false for Infinity margin', () => {
      const product = { current_margin_pct: Infinity } as ProductListItem
      expect(hasValidMargin(product)).toBe(false)
    })

    it('returns false for string margin', () => {
      const product = { current_margin_pct: '25' as unknown as number } as ProductListItem
      expect(hasValidMargin(product)).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // isMarginCalculationComplete
  // ---------------------------------------------------------------------------
  describe('isMarginCalculationComplete', () => {
    it('returns true when all products have valid margin', () => {
      const products = [{ current_margin_pct: 25 }, { current_margin_pct: 30 }] as ProductListItem[]
      expect(isMarginCalculationComplete(products)).toBe(true)
    })

    it('returns true when >= 50% have valid margin (threshold)', () => {
      const products = [
        { current_margin_pct: 25 },
        { current_margin_pct: null },
      ] as ProductListItem[]
      // 1/2 = 50% >= MARGIN_COMPLETION_THRESHOLD (0.5)
      expect(isMarginCalculationComplete(products)).toBe(true)
    })

    it('returns false when < 50% have valid margin', () => {
      const products = [
        { current_margin_pct: null },
        { current_margin_pct: null },
        { current_margin_pct: 25 },
      ] as ProductListItem[]
      // 1/3 ≈ 33% < 0.5
      expect(isMarginCalculationComplete(products)).toBe(false)
    })

    it('returns true for empty array (0 >= 0*0.5)', () => {
      expect(isMarginCalculationComplete([])).toBe(true)
    })

    it('uses MARGIN_COMPLETION_THRESHOLD constant', () => {
      expect(MARGIN_COMPLETION_THRESHOLD).toBe(0.5)
    })
  })

  // ---------------------------------------------------------------------------
  // extractSampleIds
  // ---------------------------------------------------------------------------
  describe('extractSampleIds', () => {
    it('extracts successful IDs up to MAX_SAMPLE_SIZE', () => {
      expect(MAX_SAMPLE_SIZE).toBe(10)
      const results = Array.from({ length: 15 }, (_, i) => ({
        success: true,
        nm_id: `nm-${i}`,
      }))
      const ids = extractSampleIds(results)
      expect(ids).toHaveLength(10)
      expect(ids[0]).toBe('nm-0')
      expect(ids[9]).toBe('nm-9')
    })

    it('filters out failed results', () => {
      const results = [
        { success: true, nm_id: 'nm-1' },
        { success: false, nm_id: 'nm-2' },
        { success: true, nm_id: 'nm-3' },
      ]
      const ids = extractSampleIds(results)
      expect(ids).toEqual(['nm-1', 'nm-3'])
    })

    it('returns empty array when all failed', () => {
      const results = [
        { success: false, nm_id: 'nm-1' },
        { success: false, nm_id: 'nm-2' },
      ]
      expect(extractSampleIds(results)).toEqual([])
    })

    it('returns empty array for empty input', () => {
      expect(extractSampleIds([])).toEqual([])
    })

    it('returns fewer than MAX_SAMPLE_SIZE if fewer successful', () => {
      const results = [
        { success: true, nm_id: 'nm-1' },
        { success: true, nm_id: 'nm-2' },
      ]
      const ids = extractSampleIds(results)
      expect(ids).toHaveLength(2)
    })
  })
})
