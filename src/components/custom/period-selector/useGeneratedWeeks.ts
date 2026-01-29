/**
 * Generated Weeks Hook
 * Story 60.2-FE: Period Selector Component
 *
 * Generates recent weeks based on selected week.
 * Temporary solution until availableWeeks comes from API/context.
 */

import { useEffect, useState } from 'react'

/**
 * Generate recent weeks based on selected week
 * @param selectedWeek - Currently selected week in "YYYY-Www" format
 * @returns Array of week strings going back from selected week
 */
export function useGeneratedWeeks(selectedWeek: string): string[] {
  const [weeks, setWeeks] = useState<string[]>([])

  useEffect(() => {
    const generated: string[] = []
    const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/)
    if (!match) {
      setWeeks([selectedWeek])
      return
    }

    let year = parseInt(match[1], 10)
    let weekNum = parseInt(match[2], 10)

    // Generate 12 weeks going back from selected week
    for (let i = 0; i < 12; i++) {
      generated.push(`${year}-W${weekNum.toString().padStart(2, '0')}`)
      weekNum--
      if (weekNum < 1) {
        year--
        weekNum = 52 // Simplified: assume 52 weeks per year
      }
    }

    setWeeks(generated)
  }, [selectedWeek])

  return weeks
}

export default useGeneratedWeeks
