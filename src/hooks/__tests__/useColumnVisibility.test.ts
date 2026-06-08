/**
 * Unit tests for useColumnVisibility hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnVisibility, OPTIONAL_COLUMNS } from '../useColumnVisibility'

describe('useColumnVisibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns default visibility on first use', () => {
    const { result } = renderHook(() => useColumnVisibility('test-columns'))
    expect(result.current.visibility).toEqual({
      profit_per_unit: true,
      roi: true,
      markup_percent: false,
    })
  })

  it('loads visibility from localStorage', () => {
    localStorage.setItem(
      'test-columns',
      JSON.stringify({ profit_per_unit: false, roi: false, markup_percent: true })
    )
    const { result } = renderHook(() => useColumnVisibility('test-columns'))
    expect(result.current.visibility).toEqual({
      profit_per_unit: false,
      roi: false,
      markup_percent: true,
    })
  })

  it('merges stored partial state with defaults', () => {
    localStorage.setItem('test-columns', JSON.stringify({ roi: false }))
    const { result } = renderHook(() => useColumnVisibility('test-columns'))
    expect(result.current.visibility.roi).toBe(false)
    expect(result.current.visibility.profit_per_unit).toBe(true)
    expect(result.current.visibility.markup_percent).toBe(false)
  })

  it('falls back to defaults on invalid localStorage', () => {
    localStorage.setItem('test-columns', 'not-json')
    const { result } = renderHook(() => useColumnVisibility('test-columns'))
    expect(result.current.visibility.profit_per_unit).toBe(true)
  })

  it('toggles a column', () => {
    const { result } = renderHook(() => useColumnVisibility('test-columns'))
    expect(result.current.visibility.roi).toBe(true)

    act(() => {
      result.current.toggleColumn('roi')
    })

    expect(result.current.visibility.roi).toBe(false)
  })

  it('toggles column back on second call', () => {
    const { result } = renderHook(() => useColumnVisibility('test-columns'))
    act(() => {
      result.current.toggleColumn('roi')
    })
    act(() => {
      result.current.toggleColumn('roi')
    })
    expect(result.current.visibility.roi).toBe(true)
  })

  it('sets all columns via setAll', () => {
    const { result } = renderHook(() => useColumnVisibility('test-columns'))
    act(() => {
      result.current.setAll({ profit_per_unit: false, markup_percent: true })
    })
    expect(result.current.visibility.profit_per_unit).toBe(false)
    expect(result.current.visibility.roi).toBe(true) // unchanged
    expect(result.current.visibility.markup_percent).toBe(true)
  })

  it('resets to defaults', () => {
    const { result } = renderHook(() => useColumnVisibility('test-columns'))
    act(() => {
      result.current.toggleColumn('roi')
    })
    expect(result.current.visibility.roi).toBe(false)

    act(() => {
      result.current.reset()
    })

    expect(result.current.visibility).toEqual({
      profit_per_unit: true,
      roi: true,
      markup_percent: false,
    })
  })

  it('persists to localStorage on change', () => {
    const { result } = renderHook(() => useColumnVisibility('persist-test'))
    act(() => {
      result.current.toggleColumn('markup_percent')
    })
    const stored = JSON.parse(localStorage.getItem('persist-test') || '{}')
    expect(stored.markup_percent).toBe(true)
  })

  it('computes visibleCount correctly', () => {
    const { result } = renderHook(() => useColumnVisibility('test-columns'))
    // Default: profit_per_unit=true, roi=true, markup_percent=false => 2 visible
    expect(result.current.visibleCount).toBe(2)
    expect(result.current.totalCount).toBe(3)
  })

  it('uses separate storage per key', () => {
    const { result: r1 } = renderHook(() => useColumnVisibility('key-a'))
    const { result: r2 } = renderHook(() => useColumnVisibility('key-b'))

    act(() => {
      r1.current.toggleColumn('roi')
    })

    expect(r1.current.visibility.roi).toBe(false)
    expect(r2.current.visibility.roi).toBe(true) // independent
  })

  it('OPTIONAL_COLUMNS has 3 entries matching visibility keys', () => {
    expect(OPTIONAL_COLUMNS).toHaveLength(3)
    const keys = OPTIONAL_COLUMNS.map(c => c.key).sort()
    expect(keys).toEqual(['markup_percent', 'profit_per_unit', 'roi'])
  })
})
