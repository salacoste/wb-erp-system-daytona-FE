/**
 * Unit Economics page configuration
 * Week options generation for the week selector dropdown.
 * Uses getLastCompletedWeek() to default to a week with data.
 */

import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { formatIsoWeek } from '@/lib/utils'

/** Generate last 12 completed weeks for selector, starting from lastCompletedWeek */
function generateWeekOptions(): Array<{ value: string; label: string }> {
  const lastCompleted = getLastCompletedWeek()
  const options: Array<{ value: string; label: string }> = []

  // Parse lastCompleted to get starting point
  const match = lastCompleted.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return options

  // Start from last completed week, go back 12 weeks
  const now = new Date()
  // Find the Monday of the last completed week
  for (let i = 0; i < 12; i++) {
    const weekDate = new Date(now)
    // getLastCompletedWeek is either W-1 or W-2; offset from there
    const baseOffset =
      lastCompleted === formatIsoWeek(new Date(now.getTime() - 7 * 86400000)) ? 1 : 2
    weekDate.setDate(weekDate.getDate() - (baseOffset + i) * 7)

    const weekStr = formatIsoWeek(weekDate)

    // Format date range for display
    const weekStart = new Date(weekDate)
    const day = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1)) // Monday
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const formatDate = (d: Date) =>
      d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

    options.push({
      value: weekStr,
      label: `${weekStr} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`,
    })
  }

  return options
}

export const WEEK_OPTIONS = generateWeekOptions()
