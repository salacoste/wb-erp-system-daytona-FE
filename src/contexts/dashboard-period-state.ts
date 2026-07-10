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
import {
  PERIOD_URL_PARAMS,
  getStoredPeriodType,
  setStoredPeriodType,
  buildPeriodUrlParams,
} from './dashboard-period-storage'
import { invalidateDashboardDataQueries } from '@/hooks/dashboard-query-invalidation'

const URL_PARAMS = PERIOD_URL_PARAMS

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
  const validUrlWeek = urlWeek && isValidWeekFormat(urlWeek) ? urlWeek : null
  const validUrlMonth = urlMonth && isValidMonthFormat(urlMonth) ? urlMonth : null
  const validUrlType = urlType === 'week' || urlType === 'month' ? urlType : null
  const urlPeriodType = validUrlType ?? (validUrlWeek ? 'week' : validUrlMonth ? 'month' : null)

  const [periodType, setPeriodTypeState] = useState<PeriodType>(() => {
    if (urlPeriodType) return urlPeriodType
    return getStoredPeriodType() ?? 'week'
  })

  const [selectedWeek, setSelectedWeekState] = useState<string>(() => {
    if (validUrlWeek) return validUrlWeek
    return defaultWeek
  })

  const [selectedMonth, setSelectedMonthState] = useState<string>(() => {
    if (validUrlMonth) return validUrlMonth
    if (validUrlWeek) return getMonthFromWeek(validUrlWeek)
    return getMonthFromWeek(defaultWeek)
  })

  const previousWeek = useMemo(() => getPreviousWeek(selectedWeek), [selectedWeek])
  const previousMonth = useMemo(() => getPreviousMonth(selectedMonth), [selectedMonth])

  useEffect(() => setIsLoading(false), [])

  const syncToUrl = useCallback(
    (week: string, month: string, type: PeriodType) => {
      const qs = buildPeriodUrlParams(week, month, type, searchParams.toString())
      router.replace(`${pathname}?${qs}`, { scroll: false })
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
    invalidateDashboardDataQueries(queryClient)
  }, [queryClient])

  const urlDerivedMonth = validUrlWeek && !validUrlMonth ? getMonthFromWeek(validUrlWeek) : null
  const hasValidPeriodUrlParam = Boolean(validUrlWeek || validUrlMonth || urlPeriodType)
  const urlReconciliationPending =
    hasValidPeriodUrlParam &&
    ((urlPeriodType !== null && periodType !== urlPeriodType) ||
      (validUrlWeek !== null && selectedWeek !== validUrlWeek) ||
      (validUrlMonth !== null && selectedMonth !== validUrlMonth) ||
      (urlDerivedMonth !== null && selectedMonth !== urlDerivedMonth))

  useEffect(() => {
    if (!hasValidPeriodUrlParam) return

    if (urlPeriodType && periodType !== urlPeriodType) {
      setPeriodTypeState(urlPeriodType)
    }
    if (validUrlWeek && selectedWeek !== validUrlWeek) {
      setSelectedWeekState(validUrlWeek)
    }
    if (validUrlMonth && selectedMonth !== validUrlMonth) {
      setSelectedMonthState(validUrlMonth)
    } else if (urlDerivedMonth && selectedMonth !== urlDerivedMonth) {
      setSelectedMonthState(urlDerivedMonth)
    }
  }, [
    hasValidPeriodUrlParam,
    periodType,
    selectedMonth,
    selectedWeek,
    urlDerivedMonth,
    urlPeriodType,
    validUrlMonth,
    validUrlWeek,
  ])

  useEffect(() => {
    if (urlReconciliationPending) return

    const currentQs = searchParams.toString()
    const qs = buildPeriodUrlParams(selectedWeek, selectedMonth, periodType, currentQs)
    const newUrl = `${pathname}?${qs}`
    if (newUrl !== pathname + (currentQs ? `?${currentQs}` : '')) {
      router.replace(newUrl, { scroll: false })
    }
  }, [
    periodType,
    selectedWeek,
    selectedMonth,
    searchParams,
    pathname,
    router,
    urlReconciliationPending,
  ])

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
