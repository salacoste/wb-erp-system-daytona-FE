/**
 * Pure helper functions extracted from FunnelPageContent for file size compliance.
 * Story 73.3-FE (WoW), 73.4-FE (filter), 73.8-FE (ad overlay)
 */

import { format, subDays } from 'date-fns'
import type { DateRange } from '@/types/date-range'

export function getDefaultRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 29)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

export function formatApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function toIsoWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function parseNmIds(param: string | null): number[] {
  if (!param) return []
  return param
    .split(',')
    .map(Number)
    .filter(n => !isNaN(n) && n > 0)
}
