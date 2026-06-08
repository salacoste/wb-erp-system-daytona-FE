/**
 * ISO week string utilities for trend date calculations
 *
 * Extracted from useTrends.ts for file size compliance.
 */

/**
 * Get ISO week string for a date (YYYY-Www format)
 */
export function getISOWeekString(date: Date): string {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7 // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3) // Nearest Thursday
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const weekNumber =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7
    )
  return `${target.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Calculate ISO week range from current date
 * @param numWeeks - Number of weeks to go back
 * @returns Object with from and to ISO week strings
 */
export function getWeekRange(numWeeks: number): { from: string; to: string } {
  const now = new Date()

  // Get current ISO week
  const currentWeek = getISOWeekString(now)

  // Calculate start week (numWeeks ago)
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - numWeeks * 7)
  const startWeek = getISOWeekString(startDate)

  return { from: startWeek, to: currentWeek }
}
