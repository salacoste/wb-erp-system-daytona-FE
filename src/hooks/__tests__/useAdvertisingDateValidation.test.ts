/**
 * Unit Tests for useAdvertisingDateValidation Hook
 * Epic 33-FE: Advertising Analytics
 *
 * Tests date range validation against available data period.
 *
 * @see docs/request-backend/115-advertising-date-filter-empty-state-behavior.md
 * @see docs/request-backend/116-advertising-date-range-frontend-guide.md
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAdvertisingDateValidation } from '../advertising/useAdvertisingDateValidation'

describe('useAdvertisingDateValidation', () => {
  // Available data range: 2025-12-01 to 2026-01-28
  const availableFrom = '2025-12-01'
  const availableTo = '2026-01-28'

  describe('valid range within available data', () => {
    it('should return valid when range is completely within available data', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2025-12-08', '2025-12-21', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(true)
      expect(result.current.hasDataOverlap).toBe(true)
      expect(result.current.isBeforeAvailable).toBe(false)
      expect(result.current.isAfterAvailable).toBe(false)
      expect(result.current.isPartialOverlap).toBe(false)
      expect(result.current.adjustedFrom).toBeUndefined()
      expect(result.current.adjustedTo).toBeUndefined()
      expect(result.current.message).toBeUndefined()
    })

    it('should return valid when range exactly matches available data', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation(availableFrom, availableTo, availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(true)
      expect(result.current.hasDataOverlap).toBe(true)
      expect(result.current.isPartialOverlap).toBe(false)
    })
  })

  describe('range before available data', () => {
    it('should return invalid when range ends before data starts', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2025-11-18', '2025-11-24', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(false)
      expect(result.current.hasDataOverlap).toBe(false)
      expect(result.current.isBeforeAvailable).toBe(true)
      expect(result.current.isAfterAvailable).toBe(false)
      expect(result.current.message).toContain('раньше начала сбора данных')
      expect(result.current.message).toContain('01.12.2025')
    })

    it('should return invalid when range ends on day before data starts', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2025-11-25', '2025-11-30', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(false)
      expect(result.current.hasDataOverlap).toBe(false)
      expect(result.current.isBeforeAvailable).toBe(true)
    })
  })

  describe('range after available data', () => {
    it('should return invalid when range starts after data ends', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2026-02-01', '2026-02-07', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(false)
      expect(result.current.hasDataOverlap).toBe(false)
      expect(result.current.isBeforeAvailable).toBe(false)
      expect(result.current.isAfterAvailable).toBe(true)
      expect(result.current.message).toContain('позже последнего обновления данных')
      expect(result.current.message).toContain('28.01.2026')
    })

    it('should return invalid when range starts on day after data ends', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2026-01-29', '2026-02-05', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(false)
      expect(result.current.hasDataOverlap).toBe(false)
      expect(result.current.isAfterAvailable).toBe(true)
    })
  })

  describe('partial overlap', () => {
    it('should return adjusted dates when range starts before available data', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2025-11-25', '2025-12-05', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(true)
      expect(result.current.hasDataOverlap).toBe(true)
      expect(result.current.isPartialOverlap).toBe(true)
      expect(result.current.adjustedFrom).toBe('2025-12-01')
      expect(result.current.adjustedTo).toBe('2025-12-05')
      expect(result.current.message).toContain('выходит за пределы доступных данных')
    })

    it('should return adjusted dates when range ends after available data', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2026-01-20', '2026-02-10', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(true)
      expect(result.current.hasDataOverlap).toBe(true)
      expect(result.current.isPartialOverlap).toBe(true)
      expect(result.current.adjustedFrom).toBe('2026-01-20')
      expect(result.current.adjustedTo).toBe('2026-01-28')
    })

    it('should return adjusted dates when range extends both sides', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2025-11-01', '2026-02-28', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(true)
      expect(result.current.hasDataOverlap).toBe(true)
      expect(result.current.isPartialOverlap).toBe(true)
      expect(result.current.adjustedFrom).toBe('2025-12-01')
      expect(result.current.adjustedTo).toBe('2026-01-28')
    })
  })

  describe('edge cases', () => {
    it('should return valid when availableFrom/To are not provided', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2025-12-08', '2025-12-21', undefined, undefined)
      )

      expect(result.current.isValid).toBe(true)
      expect(result.current.hasDataOverlap).toBe(true)
    })

    it('should return valid when from/to are empty strings', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('', '', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(true)
      expect(result.current.hasDataOverlap).toBe(true)
    })

    it('should handle boundary dates correctly - range ends on data start', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2025-12-01', '2025-12-01', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(true)
      expect(result.current.hasDataOverlap).toBe(true)
      expect(result.current.isPartialOverlap).toBe(false)
    })

    it('should handle boundary dates correctly - range starts on data end', () => {
      const { result } = renderHook(() =>
        useAdvertisingDateValidation('2026-01-28', '2026-01-28', availableFrom, availableTo)
      )

      expect(result.current.isValid).toBe(true)
      expect(result.current.hasDataOverlap).toBe(true)
      expect(result.current.isPartialOverlap).toBe(false)
    })
  })
})
