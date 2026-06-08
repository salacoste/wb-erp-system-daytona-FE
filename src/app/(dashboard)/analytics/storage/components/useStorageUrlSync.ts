'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** URL parameter sync for Storage Analytics page — extracted from useStoragePageState */

export function useStorageUrlSync(
  weekStart: string,
  weekEnd: string,
  selectedBrands: string[],
  selectedWarehouses: string[],
  selectedWeek: string | null
) {
  const router = useRouter()

  const updateUrlParams = useCallback(
    (
      newWeekStart: string,
      newWeekEnd: string,
      newBrands: string[],
      newWarehouses: string[],
      newSelectedWeek: string | null
    ) => {
      const params = new URLSearchParams()
      params.set('weekStart', newWeekStart)
      params.set('weekEnd', newWeekEnd)
      if (newBrands.length > 0) {
        params.set('brands', newBrands.join(','))
      }
      if (newWarehouses.length > 0) {
        params.set('warehouses', newWarehouses.join(','))
      }
      // Story 24.10: Add selected week to URL
      if (newSelectedWeek) {
        params.set('week', newSelectedWeek)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router]
  )

  // Sync state to URL params - Story 24.9-FE AC3, Story 24.10-FE
  useEffect(() => {
    updateUrlParams(weekStart, weekEnd, selectedBrands, selectedWarehouses, selectedWeek)
  }, [weekStart, weekEnd, selectedBrands, selectedWarehouses, selectedWeek, updateUrlParams])
}
