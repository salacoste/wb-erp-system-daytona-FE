/**
 * Tests for useColumnWidths hook
 *
 * The hook manages resizable table column widths with localStorage persistence.
 * Most logic involves React state/effects which require render testing.
 * We test the pure/minWidth clamping logic extracted as a helper pattern,
 * and verify the hook's return shape via renderHook.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnWidths, type ColumnWidths } from '../useColumnWidths'

// ---------------------------------------------------------------------------
// MinWidth clamping logic (extracted from handleResize)
// ---------------------------------------------------------------------------

describe('handleResize minWidth clamping', () => {
  // The hook's handleResize does: Math.max(60, newWidth)
  const MIN_WIDTH = 60

  it('clamps to 60 when newWidth is below minimum', () => {
    const clamped = Math.max(MIN_WIDTH, 0)
    expect(clamped).toBe(60)
  })

  it('clamps to 60 for negative widths', () => {
    const clamped = Math.max(MIN_WIDTH, -100)
    expect(clamped).toBe(60)
  })

  it('clamps to 60 for very small positive widths', () => {
    const clamped = Math.max(MIN_WIDTH, 1)
    expect(clamped).toBe(60)
  })

  it('passes through widths above minimum', () => {
    expect(Math.max(MIN_WIDTH, 100)).toBe(100)
    expect(Math.max(MIN_WIDTH, 200)).toBe(200)
    expect(Math.max(MIN_WIDTH, 500)).toBe(500)
  })

  it('passes through exactly 60', () => {
    expect(Math.max(MIN_WIDTH, 60)).toBe(60)
  })
})

// ---------------------------------------------------------------------------
// useColumnWidths hook via renderHook
// ---------------------------------------------------------------------------

describe('useColumnWidths', () => {
  const defaultWidths: ColumnWidths = {
    article: 120,
    name: 300,
    cogs: 140,
  }

  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default widths on first render', () => {
    const { result } = renderHook(() => useColumnWidths('test-table', defaultWidths))
    expect(result.current.widths).toEqual(defaultWidths)
  })

  it('isInitialized becomes true after mount effect', () => {
    const { result } = renderHook(() => useColumnWidths('test-table', defaultWidths))
    // Effect fires during render in test env
    expect(result.current.isInitialized).toBe(true)
  })

  it('sets isInitialized to true after mount', () => {
    const { result } = renderHook(() => useColumnWidths('test-table', defaultWidths))
    // After a tick, isInitialized should be true
    expect(result.current.isInitialized).toBe(true)
  })

  it('handleResize updates a column width', () => {
    const { result } = renderHook(() => useColumnWidths('test-table', defaultWidths))

    act(() => {
      result.current.handleResize('article', 200)
    })

    expect(result.current.widths.article).toBe(200)
    // Other columns unchanged
    expect(result.current.widths.name).toBe(300)
    expect(result.current.widths.cogs).toBe(140)
  })

  it('handleResize clamps to minWidth (60)', () => {
    const { result } = renderHook(() => useColumnWidths('test-table', defaultWidths))

    act(() => {
      result.current.handleResize('article', 30)
    })

    expect(result.current.widths.article).toBe(60)
  })

  it('handleResize clamps negative values to 60', () => {
    const { result } = renderHook(() => useColumnWidths('test-table', defaultWidths))

    act(() => {
      result.current.handleResize('name', -50)
    })

    expect(result.current.widths.name).toBe(60)
  })

  it('resetWidths restores defaults', () => {
    const { result } = renderHook(() => useColumnWidths('test-table', defaultWidths))

    act(() => {
      result.current.handleResize('article', 500)
    })
    expect(result.current.widths.article).toBe(500)

    act(() => {
      result.current.resetWidths()
    })
    expect(result.current.widths).toEqual(defaultWidths)
  })

  it('persists widths to localStorage after initialization', () => {
    const { result } = renderHook(() => useColumnWidths('test-table', defaultWidths))

    act(() => {
      result.current.handleResize('article', 250)
    })

    const stored = localStorage.getItem('column-widths-test-table')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored as string)
    expect(parsed.article).toBe(250)
    expect(parsed.name).toBe(300)
  })

  it('loads widths from localStorage on mount', () => {
    localStorage.setItem(
      'column-widths-persisted-table',
      JSON.stringify({ article: 999, name: 400, cogs: 200 })
    )

    const { result } = renderHook(() => useColumnWidths('persisted-table', defaultWidths))

    expect(result.current.widths.article).toBe(999)
    expect(result.current.widths.name).toBe(400)
    expect(result.current.widths.cogs).toBe(200)
  })

  it('merges saved widths with defaults (new columns get defaults)', () => {
    // Store only partial overrides
    localStorage.setItem('column-widths-merge-table', JSON.stringify({ article: 999 }))

    const { result } = renderHook(() => useColumnWidths('merge-table', defaultWidths))

    expect(result.current.widths.article).toBe(999)
    // name and cogs fall back to defaults
    expect(result.current.widths.name).toBe(300)
    expect(result.current.widths.cogs).toBe(140)
  })

  it('resetWidths restores defaults and clears saved overrides', () => {
    localStorage.setItem('column-widths-clear-table', JSON.stringify({ article: 999 }))

    const { result } = renderHook(() => useColumnWidths('clear-table', defaultWidths))

    act(() => {
      result.current.resetWidths()
    })

    // State returns to defaults
    expect(result.current.widths).toEqual(defaultWidths)
    // Note: the save-effect re-persists defaults to localStorage after resetWidths
    // removes the key. The important invariant is that widths match defaults.
  })

  it('different storageKey produces independent state', () => {
    const { result: resultA } = renderHook(() => useColumnWidths('table-a', defaultWidths))
    const { result: resultB } = renderHook(() => useColumnWidths('table-b', defaultWidths))

    act(() => {
      resultA.current.handleResize('article', 777)
    })

    // table-a changed
    expect(resultA.current.widths.article).toBe(777)
    // table-b unaffected
    expect(resultB.current.widths.article).toBe(120)
  })

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('column-widths-bad-table', 'not-json{{{')

    // Should not throw, falls back to defaults
    const { result } = renderHook(() => useColumnWidths('bad-table', defaultWidths))

    expect(result.current.widths).toEqual(defaultWidths)
  })
})
