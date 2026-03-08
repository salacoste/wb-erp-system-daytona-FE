/** Sync Gaps Utils — Story 73.5-FE: derive per-day sync status from dataGaps */

import { eachDayOfInterval, parseISO, format, isWithinInterval } from 'date-fns'

export type DayStatusType = 'complete' | 'missing' | 'unavailable'

export interface DayStatus {
  date: string
  status: DayStatusType
}

export interface Coverage {
  synced: number
  total: number
  percent: number
}

interface DataGap {
  from: string
  to: string
  missingDays: number
}

export function deriveDayStatuses(
  from: string,
  to: string,
  dataGaps?: DataGap[],
  dataAvailableFrom?: string | null,
  dataAvailableTo?: string | null
): DayStatus[] {
  const startDate = parseISO(from)
  const endDate = parseISO(to)
  if (startDate > endDate) return []

  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const gaps = dataGaps ?? []

  const parsedGaps = gaps.map(g => ({
    start: parseISO(g.from),
    end: parseISO(g.to),
  }))

  const availFrom = dataAvailableFrom ? parseISO(dataAvailableFrom) : null
  const availTo = dataAvailableTo ? parseISO(dataAvailableTo) : null

  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')

    if ((availFrom && day < availFrom) || (availTo && day > availTo)) {
      return { date: dateStr, status: 'unavailable' as const }
    }

    const inGap = parsedGaps.some(gap => isWithinInterval(day, { start: gap.start, end: gap.end }))

    return { date: dateStr, status: inGap ? 'missing' : 'complete' }
  })
}

export function calculateCoverage(statuses: DayStatus[]): Coverage {
  const total = statuses.length
  if (total === 0) return { synced: 0, total: 0, percent: 0 }

  const synced = statuses.filter(s => s.status === 'complete').length
  const percent = Math.round((synced / total) * 100)

  return { synced, total, percent }
}
