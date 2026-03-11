'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook for managing resizable table column widths with localStorage persistence
 *
 * Usage:
 * const { widths, handleResize, resetWidths } = useColumnWidths('products-table', {
 *   article: 120,
 *   name: 300,
 *   cogs: 140,
 *   margin: 100,
 *   actions: 100,
 * })
 */

export interface ColumnWidths {
  [key: string]: number
}

export function useColumnWidths(
  storageKey: string,
  defaultWidths: ColumnWidths
) {
  // Use ref for defaultWidths to avoid infinite loops in resetWidths
  const defaultWidthsRef = useRef(defaultWidths)
  defaultWidthsRef.current = defaultWidths

  const [widths, setWidths] = useState<ColumnWidths>(() => {
    // Initialize from localStorage if available (SSR-safe)
    if (typeof window === 'undefined') return defaultWidths
    try {
      const saved = localStorage.getItem(`column-widths-${storageKey}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...defaultWidths, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load column widths from localStorage:', e)
    }
    return defaultWidths
  })
  const [isInitialized, setIsInitialized] = useState(false)

  // Mark as initialized on mount
  useEffect(() => {
    setIsInitialized(true)
  }, [])

  // Save widths to localStorage when they change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(`column-widths-${storageKey}`, JSON.stringify(widths))
      } catch (e) {
        console.warn('Failed to save column widths to localStorage:', e)
      }
    }
  }, [widths, storageKey, isInitialized])

  // Handle resize for a specific column
  const handleResize = useCallback((columnKey: string, newWidth: number) => {
    const minWidth = 60
    const clampedWidth = Math.max(minWidth, newWidth)
    setWidths(prev => ({
      ...prev,
      [columnKey]: clampedWidth,
    }))
  }, [])

  // Reset to default widths
  const resetWidths = useCallback(() => {
    setWidths(defaultWidthsRef.current)
    try {
      localStorage.removeItem(`column-widths-${storageKey}`)
    } catch (e) {
      console.warn('Failed to reset column widths:', e)
    }
  }, [storageKey])

  return {
    widths,
    handleResize,
    resetWidths,
    isInitialized,
  }
}
