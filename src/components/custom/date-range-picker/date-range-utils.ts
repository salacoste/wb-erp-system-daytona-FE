/**
 * Date Range Picker Utility Functions
 * Extracted from DateRangePicker.tsx for file size compliance (Epic 74)
 *
 * Contains:
 * - Week parsing and comparison
 * - Week difference calculation
 * - Period label formatting
 * - Quick select preset definitions
 *
 * Reference: frontend/docs/stories/epic-6/story-6.1-fe-date-range-support.md
 */

/**
 * Quick select options for "Последние N недель"
 */
export const QUICK_SELECT_OPTIONS = [
  { value: 4, label: 'Последние 4 недели' },
  { value: 8, label: 'Последние 8 недель' },
  { value: 12, label: 'Последние 12 недель' },
  { value: 13, label: 'Последний квартал (13 недель)' },
]

/**
 * Parse ISO week string to comparable integer
 * E.g., "2025-W47" -> 202547
 */
export function parseWeekToNumber(week: string): number {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return 0
  const [, year, weekNum] = match
  return parseInt(year, 10) * 100 + parseInt(weekNum, 10)
}

/**
 * Calculate number of weeks between two ISO week strings
 * Story 6.1-FE: Validation - range <= 52 weeks
 */
export function calculateWeeksDiff(weekStart: string, weekEnd: string): number {
  const startMatch = weekStart.match(/^(\d{4})-W(\d{2})$/)
  const endMatch = weekEnd.match(/^(\d{4})-W(\d{2})$/)

  if (!startMatch || !endMatch) return 0

  const startYear = parseInt(startMatch[1], 10)
  const startWeek = parseInt(startMatch[2], 10)
  const endYear = parseInt(endMatch[1], 10)
  const endWeek = parseInt(endMatch[2], 10)

  // Calculate total weeks from start of year 0
  // Approximate: 52 weeks per year
  const startTotal = startYear * 52 + startWeek
  const endTotal = endYear * 52 + endWeek

  return endTotal - startTotal + 1 // +1 to include both start and end weeks
}

/**
 * Get week N weeks before the given week
 */
export function getWeekNWeeksBefore(week: string, n: number): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  let year = parseInt(match[1], 10)
  let weekNum = parseInt(match[2], 10)

  // Subtract n-1 weeks (to include current week in count)
  weekNum -= n - 1

  // Handle year boundary
  while (weekNum < 1) {
    year -= 1
    weekNum += 52 // Approximate, some years have 53 weeks
  }

  return `${year}-W${weekNum.toString().padStart(2, '0')}`
}

/**
 * Format period label for display
 * E.g., "W44 — W47 (4 недели)"
 * Story 6.1-FE: Display Aggregated Data (AC4)
 */
export function formatPeriodLabel(weekStart: string, weekEnd: string): string {
  const startMatch = weekStart.match(/^(\d{4})-W(\d{2})$/)
  const endMatch = weekEnd.match(/^(\d{4})-W(\d{2})$/)

  if (!startMatch || !endMatch) return `${weekStart} — ${weekEnd}`

  const startWeekNum = parseInt(startMatch[2], 10)
  const endWeekNum = parseInt(endMatch[2], 10)
  const startYear = startMatch[1]
  const endYear = endMatch[1]

  const weeksCount = calculateWeeksDiff(weekStart, weekEnd)
  const weeksLabel =
    weeksCount === 1 ? '1 неделя' : weeksCount < 5 ? `${weeksCount} недели` : `${weeksCount} недель`

  // Same year
  if (startYear === endYear) {
    if (startWeekNum === endWeekNum) {
      return `W${startWeekNum} (${weeksLabel})`
    }
    return `W${startWeekNum} — W${endWeekNum} (${weeksLabel})`
  }

  // Different years
  return `${startYear}-W${startWeekNum} — ${endYear}-W${endWeekNum} (${weeksLabel})`
}
