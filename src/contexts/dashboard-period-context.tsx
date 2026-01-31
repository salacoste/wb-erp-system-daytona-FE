'use client'

/**
 * Dashboard Period Context - Centralized period selection state management
 * Story 60.1-FE: Period State Management
 *
 * Provides week/month toggle, URL sync, localStorage persistence,
 * and computed previous periods for dashboard components.
 *
 * @see docs/stories/epic-60/story-60.1-fe-period-state-management.md
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import {
  getPreviousWeek,
  getPreviousMonth,
  getMonthFromWeek,
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
  isValidWeekFormat,
  isValidMonthFormat,
} from '@/lib/period-helpers'
import type {
  PeriodType,
  DashboardPeriodContextValue,
  DashboardPeriodProviderProps,
} from './dashboard-period-types'

// Re-export types for convenience
export type {
  PeriodType,
  DashboardPeriodState,
  DashboardPeriodActions,
  DashboardPeriodContextValue,
  DashboardPeriodProviderProps,
} from './dashboard-period-types'

/** localStorage key for period type preference */
const STORAGE_KEY = 'dashboard-period-type'

/** URL param names */
const URL_PARAMS = { week: 'week', month: 'month', type: 'type' } as const

// Create context with undefined default (will throw if used outside provider)
const DashboardPeriodContext = createContext<DashboardPeriodContextValue | undefined>(undefined)

/** Safely read from localStorage (SSR-safe) */
function getStoredPeriodType(): PeriodType | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'week' || stored === 'month') return stored
  } catch {
    /* ignore storage errors */
  }
  return null
}

/** Safely write to localStorage (SSR-safe) */
function setStoredPeriodType(type: PeriodType): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, type)
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Dashboard Period Provider
 * Manages period selection state with URL sync and localStorage persistence
 */
export function DashboardPeriodProvider({
  children,
  initialWeek,
}: DashboardPeriodProviderProps): React.ReactElement {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const defaultWeek = initialWeek ?? getLastCompletedWeek()
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(() => new Date())

  // Parse URL params
  const urlWeek = searchParams.get(URL_PARAMS.week)
  const urlMonth = searchParams.get(URL_PARAMS.month)
  const urlType = searchParams.get(URL_PARAMS.type) as PeriodType | null

  // Initialize period type: URL > localStorage > default
  const [periodType, setPeriodTypeState] = useState<PeriodType>(() => {
    if (urlType === 'week' || urlType === 'month') return urlType
    return getStoredPeriodType() ?? 'week'
  })

  // Initialize selected week: URL > default
  const [selectedWeek, setSelectedWeekState] = useState<string>(() => {
    if (urlWeek && isValidWeekFormat(urlWeek)) return urlWeek
    return defaultWeek
  })

  // Initialize selected month: URL > derived from last completed week
  // CRITICAL: Always derive from last completed week, not selected week from URL,
  // because URL week might be incomplete (no data yet). Prevents 404 errors.
  const [selectedMonth, setSelectedMonthState] = useState<string>(() => {
    if (urlMonth && isValidMonthFormat(urlMonth)) return urlMonth
    // Use defaultWeek (last completed week) to derive initial month
    return getMonthFromWeek(defaultWeek)
  })

  // Compute previous periods
  const previousWeek = useMemo(() => getPreviousWeek(selectedWeek), [selectedWeek])
  const previousMonth = useMemo(() => getPreviousMonth(selectedMonth), [selectedMonth])

  // Mark loading complete after hydration
  useEffect(() => setIsLoading(false), [])

  // Sync state to URL
  const syncToUrl = useCallback(
    (week: string, month: string, type: PeriodType) => {
      const params = new URLSearchParams(searchParams.toString())
      if (type === 'week') {
        params.set(URL_PARAMS.week, week)
        params.delete(URL_PARAMS.month)
      } else {
        params.set(URL_PARAMS.month, month)
        params.delete(URL_PARAMS.week)
      }
      params.set(URL_PARAMS.type, type)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  const setPeriodType = useCallback(
    (type: PeriodType) => {
      setPeriodTypeState(type)
      setStoredPeriodType(type)
      if (type === 'month') {
        // CRITICAL FIX: When switching to month view, derive month from last completed week
        // instead of selected week, because selected week might be incomplete (no data yet).
        // This prevents 404 errors when user clicks "Month" button.
        // See: docs/pages/dashboard/period-selection-bug-fix.md
        const lastCompletedWeek = getLastCompletedWeek()
        const derivedMonth = getMonthFromWeek(lastCompletedWeek)
        setSelectedMonthState(derivedMonth)
        syncToUrl(selectedWeek, derivedMonth, type)
      } else {
        syncToUrl(selectedWeek, selectedMonth, type)
      }
    },
    [selectedWeek, selectedMonth, syncToUrl]
  )

  const setWeek = useCallback(
    (week: string) => {
      if (!isValidWeekFormat(week)) return
      setSelectedWeekState(week)
      const derivedMonth = getMonthFromWeek(week)
      setSelectedMonthState(derivedMonth)
      syncToUrl(week, derivedMonth, periodType)
    },
    [periodType, syncToUrl]
  )

  const setMonth = useCallback(
    (month: string) => {
      if (!isValidMonthFormat(month)) return
      setSelectedMonthState(month)
      syncToUrl(selectedWeek, month, periodType)
    },
    [selectedWeek, periodType, syncToUrl]
  )

  const refresh = useCallback(() => {
    setLastRefresh(new Date())
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
  }, [queryClient])

  // Sync period state to URL whenever it changes
  // This ensures URL always reflects current period, even when changed programmatically
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (periodType === 'week') {
      params.set(URL_PARAMS.week, selectedWeek)
      params.delete(URL_PARAMS.month)
    } else {
      params.set(URL_PARAMS.month, selectedMonth)
      params.delete(URL_PARAMS.week)
    }
    params.set(URL_PARAMS.type, periodType)
    // Only update URL if params actually changed (avoid infinite loop)
    const newUrl = `${pathname}?${params.toString()}`
    if (newUrl !== pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')) {
      router.replace(newUrl, { scroll: false })
    }
  }, [periodType, selectedWeek, selectedMonth, searchParams, pathname, router])

  const getDateRange = useCallback((): { startDate: string; endDate: string } => {
    if (periodType === 'week') {
      return {
        startDate: format(getWeekStartDate(selectedWeek), 'yyyy-MM-dd'),
        endDate: format(getWeekEndDate(selectedWeek), 'yyyy-MM-dd'),
      }
    }
    return {
      startDate: format(getMonthStartDate(selectedMonth), 'yyyy-MM-dd'),
      endDate: format(getMonthEndDate(selectedMonth), 'yyyy-MM-dd'),
    }
  }, [periodType, selectedWeek, selectedMonth])

  const value = useMemo<DashboardPeriodContextValue>(
    () => ({
      periodType,
      selectedWeek,
      selectedMonth,
      previousWeek,
      previousMonth,
      lastRefresh,
      isLoading,
      setPeriodType,
      setWeek,
      setMonth,
      refresh,
      getDateRange,
    }),
    [
      periodType,
      selectedWeek,
      selectedMonth,
      previousWeek,
      previousMonth,
      lastRefresh,
      isLoading,
      setPeriodType,
      setWeek,
      setMonth,
      refresh,
      getDateRange,
    ]
  )

  return <DashboardPeriodContext.Provider value={value}>{children}</DashboardPeriodContext.Provider>
}

/**
 * Hook to consume dashboard period context
 * @throws Error if used outside DashboardPeriodProvider
 */
export function useDashboardPeriod(): DashboardPeriodContextValue {
  const context = useContext(DashboardPeriodContext)
  if (context === undefined) {
    throw new Error('useDashboardPeriod must be used within a DashboardPeriodProvider')
  }
  return context
}
