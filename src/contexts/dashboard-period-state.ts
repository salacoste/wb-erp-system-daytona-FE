'use client'

/**
 * Dashboard Period state management hook
 * Extracted from dashboard-period-context.tsx for file size compliance (Epic 74)
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
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
import type { PeriodType, DashboardPeriodContextValue } from './dashboard-period-types'

const STORAGE_KEY = 'dashboard-period-type'
const URL_PARAMS = { week: 'week', month: 'month', type: 'type' } as const

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

function setStoredPeriodType(type: PeriodType): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, type)
  } catch {
    /* ignore storage errors */
  }
}

export function useDashboardPeriodState(initialWeek?: string): DashboardPeriodContextValue {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const defaultWeek = initialWeek ?? getLastCompletedWeek()
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(() => new Date())

  const urlWeek = searchParams.get(URL_PARAMS.week)
  const urlMonth = searchParams.get(URL_PARAMS.month)
  const urlType = searchParams.get(URL_PARAMS.type) as PeriodType | null

  const [periodType, setPeriodTypeState] = useState<PeriodType>(() => {
    if (urlType === 'week' || urlType === 'month') return urlType
    return getStoredPeriodType() ?? 'week'
  })

  const [selectedWeek, setSelectedWeekState] = useState<string>(() => {
    if (urlWeek && isValidWeekFormat(urlWeek)) return urlWeek
    return defaultWeek
  })

  const [selectedMonth, setSelectedMonthState] = useState<string>(() => {
    if (urlMonth && isValidMonthFormat(urlMonth)) return urlMonth
    return getMonthFromWeek(defaultWeek)
  })

  const previousWeek = useMemo(() => getPreviousWeek(selectedWeek), [selectedWeek])
  const previousMonth = useMemo(() => getPreviousMonth(selectedMonth), [selectedMonth])

  useEffect(() => setIsLoading(false), [])

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

  return useMemo<DashboardPeriodContextValue>(
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
}
