/**
 * Unit Economics page configuration
 * Week options generation for the week selector dropdown.
 */

/** Generate last 12 weeks for selector */
function generateWeekOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  const now = new Date()

  for (let i = 1; i <= 12; i++) {
    const weekDate = new Date(now)
    weekDate.setDate(weekDate.getDate() - i * 7)

    // Get ISO week number
    const startOfYear = new Date(weekDate.getFullYear(), 0, 1)
    const days = Math.floor((weekDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7)

    const weekStr = `${weekDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`

    // Format date range for display
    const weekStart = new Date(weekDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
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
