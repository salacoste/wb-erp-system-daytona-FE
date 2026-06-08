/**
 * Tests for Returns Daily Normalizer
 *
 * Covers nullability, camelCase/snake_case variants, missing fields,
 * and edge cases per Boundary Normalizer Pattern (CLAUDE.md).
 */

import { describe, it, expect } from 'vitest'
import { normalizeReturnsDailyResponse } from '../returns-daily-normalizer'

describe('normalizeReturnsDailyResponse', () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('happy path', () => {
    it('normalizes a well-formed camelCase response', () => {
      const raw = {
        daily: [
          {
            date: '2026-06-01',
            totalReturns: 10,
            returnRate: 5.2,
            cancellations: 4,
            refusals: 3,
            defects: 3,
          },
          {
            date: '2026-06-02',
            totalReturns: 7,
            returnRate: 3.8,
            cancellations: 2,
            refusals: 3,
            defects: 2,
          },
        ],
        period: { from: '2026-06-01', to: '2026-06-02' },
        summary: {
          totalReturns: 17,
          avgReturnRate: 4.5,
          totalCancellations: 6,
          totalRefusals: 6,
          totalDefects: 5,
        },
      }

      const result = normalizeReturnsDailyResponse(raw)

      expect(result.daily).toHaveLength(2)
      expect(result.daily[0]).toEqual({
        date: '2026-06-01',
        totalReturns: 10,
        returnRate: 5.2,
        cancellations: 4,
        refusals: 3,
        defects: 3,
      })
      expect(result.period).toEqual({ from: '2026-06-01', to: '2026-06-02' })
      expect(result.summary.totalReturns).toBe(17)
      expect(result.summary.avgReturnRate).toBe(4.5)
    })

    it('normalizes snake_case response fields', () => {
      const raw = {
        daily: [
          {
            date: '2026-06-01',
            total_returns: 5,
            return_rate: 2.1,
            cancellations: 2,
            refusals: 2,
            defects: 1,
          },
        ],
        period: { from: '2026-06-01', to: '2026-06-01' },
        summary: {
          total_returns: 5,
          avg_return_rate: 2.1,
          total_cancellations: 2,
          total_refusals: 2,
          total_defects: 1,
        },
      }

      const result = normalizeReturnsDailyResponse(raw)

      expect(result.daily[0].totalReturns).toBe(5)
      expect(result.daily[0].returnRate).toBe(2.1)
      expect(result.summary.totalReturns).toBe(5)
      expect(result.summary.avgReturnRate).toBe(2.1)
    })
  })

  // ---------------------------------------------------------------------------
  // Nullability / missing fields
  // ---------------------------------------------------------------------------

  describe('nullability and missing fields', () => {
    it('handles null count fields as 0 (counts are SEMANTIC-ZERO)', () => {
      const raw = {
        daily: [
          {
            date: '2026-06-01',
            totalReturns: null,
            returnRate: null,
            cancellations: null,
            refusals: null,
            defects: null,
          },
        ],
        period: { from: '2026-06-01', to: '2026-06-01' },
        summary: {},
      }

      const result = normalizeReturnsDailyResponse(raw)

      expect(result.daily[0].totalReturns).toBe(0)
      expect(result.daily[0].returnRate).toBe(0)
      expect(result.daily[0].cancellations).toBe(0)
      expect(result.daily[0].refusals).toBe(0)
      expect(result.daily[0].defects).toBe(0)
    })

    it('handles missing daily array', () => {
      const raw = { period: { from: '2026-06-01', to: '2026-06-01' }, summary: {} }

      const result = normalizeReturnsDailyResponse(raw)

      expect(result.daily).toEqual([])
    })

    it('handles missing period and summary', () => {
      const raw = { daily: [] }

      const result = normalizeReturnsDailyResponse(raw)

      expect(result.period).toEqual({ from: '', to: '' })
      expect(result.summary.totalReturns).toBe(0)
      expect(result.summary.avgReturnRate).toBe(0)
    })

    it('handles completely empty object', () => {
      const result = normalizeReturnsDailyResponse({})

      expect(result.daily).toEqual([])
      expect(result.period).toEqual({ from: '', to: '' })
      expect(result.summary.totalReturns).toBe(0)
    })

    it('handles non-object input', () => {
      const result = normalizeReturnsDailyResponse(null)

      expect(result.daily).toEqual([])
      expect(result.period).toEqual({ from: '', to: '' })
    })
  })

  // ---------------------------------------------------------------------------
  // Type coercion
  // ---------------------------------------------------------------------------

  describe('type coercion', () => {
    it('coerces string numbers to actual numbers', () => {
      const raw = {
        daily: [
          {
            date: '2026-06-01',
            totalReturns: '10',
            returnRate: '5.2',
            cancellations: '4',
            refusals: '3',
            defects: '3',
          },
        ],
        period: { from: '2026-06-01', to: '2026-06-01' },
        summary: {
          totalReturns: '17',
          avgReturnRate: '4.5',
          totalCancellations: '6',
          totalRefusals: '6',
          totalDefects: '5',
        },
      }

      const result = normalizeReturnsDailyResponse(raw)

      expect(result.daily[0].totalReturns).toBe(10)
      expect(result.daily[0].returnRate).toBe(5.2)
      expect(result.summary.totalReturns).toBe(17)
    })

    it('handles NaN values as 0 for counts', () => {
      const raw = {
        daily: [
          {
            date: '2026-06-01',
            totalReturns: NaN,
            cancellations: NaN,
            refusals: NaN,
            defects: NaN,
          },
        ],
        period: { from: '2026-06-01', to: '2026-06-01' },
        summary: {},
      }

      const result = normalizeReturnsDailyResponse(raw)

      expect(result.daily[0].totalReturns).toBe(0)
      expect(result.daily[0].cancellations).toBe(0)
    })

    it('handles Infinity as null for rates', () => {
      const raw = {
        daily: [{ date: '2026-06-01', returnRate: Infinity }],
        period: { from: '2026-06-01', to: '2026-06-01' },
        summary: {},
      }

      const result = normalizeReturnsDailyResponse(raw)

      expect(result.daily[0].returnRate).toBe(0)
    })
  })
})
