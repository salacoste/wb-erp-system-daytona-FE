/**
 * Tests for useSortableTable hook
 * Generic table column sorting with asc/desc/none cycle
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSortableTable } from '../useSortableTable'

type TestKey = 'name' | 'age' | 'score'

const testData = [
  { name: 'Alice', age: 30, score: 85 },
  { name: 'Bob', age: 25, score: 92 },
  { name: 'Charlie', age: 35, score: 78 },
]

const getComparator = (key: TestKey) => (a: (typeof testData)[0], b: (typeof testData)[0]) => {
  return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0
}

describe('useSortableTable', () => {
  it('returns unsorted data initially', () => {
    const { result } = renderHook(() => useSortableTable(testData, getComparator))
    expect(result.current.sortKey).toBeNull()
    expect(result.current.sortDirection).toBeNull()
    expect(result.current.sortedData).toEqual(testData)
  })

  it('sorts ascending on first click', () => {
    const { result } = renderHook(() => useSortableTable(testData, getComparator))
    act(() => {
      result.current.toggleSort('age')
    })
    expect(result.current.sortKey).toBe('age')
    expect(result.current.sortDirection).toBe('asc')
    expect(result.current.sortedData[0].name).toBe('Bob')
  })

  it('sorts descending on second click of same column', () => {
    const { result } = renderHook(() => useSortableTable(testData, getComparator))
    act(() => {
      result.current.toggleSort('age')
    })
    act(() => {
      result.current.toggleSort('age')
    })
    expect(result.current.sortKey).toBe('age')
    expect(result.current.sortDirection).toBe('desc')
    expect(result.current.sortedData[0].name).toBe('Charlie')
  })

  it('clears sort on third click (asc -> desc -> none cycle)', () => {
    const { result } = renderHook(() => useSortableTable(testData, getComparator))
    act(() => {
      result.current.toggleSort('age')
    })
    act(() => {
      result.current.toggleSort('age')
    })
    act(() => {
      result.current.toggleSort('age')
    })
    expect(result.current.sortKey).toBeNull()
    expect(result.current.sortDirection).toBeNull()
  })

  it('resets to asc when clicking a different column', () => {
    const { result } = renderHook(() => useSortableTable(testData, getComparator))
    act(() => {
      result.current.toggleSort('age')
    })
    act(() => {
      result.current.toggleSort('score')
    })
    expect(result.current.sortKey).toBe('score')
    expect(result.current.sortDirection).toBe('asc')
  })

  it('clearSort resets sort state', () => {
    const { result } = renderHook(() => useSortableTable(testData, getComparator))
    act(() => {
      result.current.toggleSort('name')
    })
    expect(result.current.sortKey).toBe('name')
    act(() => {
      result.current.clearSort()
    })
    expect(result.current.sortKey).toBeNull()
    expect(result.current.sortDirection).toBeNull()
  })

  it('handles empty data array', () => {
    const { result } = renderHook(() => useSortableTable([], getComparator))
    expect(result.current.sortedData).toEqual([])
    act(() => {
      result.current.toggleSort('name')
    })
    expect(result.current.sortedData).toEqual([])
  })

  it('re-sorts when data changes', () => {
    const { result } = renderHook(({ data }) => useSortableTable(data, getComparator), {
      initialProps: { data: testData },
    })
    act(() => {
      result.current.toggleSort('score')
    })
    expect(result.current.sortedData[0].name).toBe('Charlie')

    const newData = [...testData, { name: 'Dave', age: 40, score: 60 }]
    renderHook(({ data }) => useSortableTable(data, getComparator), {
      initialProps: { data: newData },
    })
  })
})
