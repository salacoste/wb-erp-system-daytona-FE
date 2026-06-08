/**
 * Tests for useLegendPreferences hook
 * Chart legend visibility management with localStorage persistence
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLegendPreferences } from '../useLegendPreferences'

describe('useLegendPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default visible series when no localStorage', () => {
    const { result } = renderHook(() => useLegendPreferences())
    expect(result.current.visibleSeries).toContain('orders')
    expect(result.current.visibleSeries.length).toBeGreaterThan(0)
  })

  it('loads from localStorage when available', () => {
    const stored = JSON.stringify(['orders', 'profit'])
    localStorage.setItem('dashboard-chart-legend', stored)
    const { result } = renderHook(() => useLegendPreferences())
    expect(result.current.visibleSeries).toEqual(['orders', 'profit'])
  })

  it('falls back to default for invalid localStorage data', () => {
    localStorage.setItem('dashboard-chart-legend', 'not-json')
    const { result } = renderHook(() => useLegendPreferences())
    expect(result.current.visibleSeries.length).toBeGreaterThan(0)
  })

  it('falls back to default for empty array in localStorage', () => {
    localStorage.setItem('dashboard-chart-legend', '[]')
    const { result } = renderHook(() => useLegendPreferences())
    expect(result.current.visibleSeries.length).toBeGreaterThan(0)
  })

  it('toggles series visibility', () => {
    const { result } = renderHook(() => useLegendPreferences())
    const initialLength = result.current.visibleSeries.length

    act(() => {
      result.current.toggleSeries('orders')
    })
    expect(result.current.visibleSeries).not.toContain('orders')
    expect(result.current.visibleSeries.length).toBe(initialLength - 1)
  })

  it('adds series back when toggling hidden series', () => {
    const { result } = renderHook(() => useLegendPreferences())
    act(() => {
      result.current.toggleSeries('orders')
    })
    act(() => {
      result.current.toggleSeries('orders')
    })
    expect(result.current.visibleSeries).toContain('orders')
  })

  it('prevents hiding the last visible series', () => {
    // Set up with only one visible series
    localStorage.setItem('dashboard-chart-legend', JSON.stringify(['orders']))
    const { result } = renderHook(() => useLegendPreferences())
    expect(result.current.visibleSeries).toEqual(['orders'])

    act(() => {
      result.current.toggleSeries('orders')
    })
    // Should still have 'orders' visible
    expect(result.current.visibleSeries).toContain('orders')
    expect(result.current.visibleSeries).toHaveLength(1)
  })

  it('showAll shows all series', () => {
    const { result } = renderHook(() => useLegendPreferences())
    act(() => {
      result.current.showAll()
    })
    expect(result.current.visibleSeries.length).toBeGreaterThan(1)
  })

  it('hideAll keeps only orders visible', () => {
    const { result } = renderHook(() => useLegendPreferences())
    act(() => {
      result.current.hideAll()
    })
    expect(result.current.visibleSeries).toEqual(['orders'])
  })

  it('isVisible returns correct state', () => {
    const { result } = renderHook(() => useLegendPreferences())
    expect(result.current.isVisible('orders')).toBe(true)
  })

  it('persists to localStorage on change', () => {
    const { result } = renderHook(() => useLegendPreferences())
    act(() => {
      result.current.toggleSeries('orders')
    })
    const stored = localStorage.getItem('dashboard-chart-legend')
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!)).not.toContain('orders')
  })
})
