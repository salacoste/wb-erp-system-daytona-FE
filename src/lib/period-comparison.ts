/**
 * ISO Week Utility Functions & Comparison Helpers
 * Story 61.7-FE & 61.11-FE
 *
 * Extracted from period-helpers.ts for file size compliance.
 */

import { getISOWeek, getISOWeekYear } from 'date-fns'
import { getCurrentWeek, getPreviousWeek, getWeekStartDate, getWeekEndDate } from './period-helpers'

/** Get number of ISO weeks in a year (52 or 53 per ISO 8601) */
export function getIsoWeeksInYear(year: number): number {
  // A year has 53 weeks if Dec 31 is a Thursday, or if Jan 1 is a Thursday
  const dec31 = new Date(year, 11, 31)
  const jan1 = new Date(year, 0, 1)
  const dec31Day = dec31.getDay()
  const jan1Day = jan1.getDay()
  // Thursday = 4
  if (dec31Day === 4 || jan1Day === 4) {
    return 53
  }
  return 52
}

/** Convert a Date or date string to an ISO week string (YYYY-Www) */
export function dateToIsoWeek(dateOrString: Date | string): string {
  const date = dateOrString instanceof Date ? dateOrString : new Date(dateOrString)
  const weekNum = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `${year}-W${weekNum.toString().padStart(2, '0')}`
}

/** Generate an array of N weeks going back from a starting week */
export function getWeekRange(numWeeks: number, startWeek?: string): string[] {
  if (numWeeks === 0) return []

  const start = startWeek ?? getCurrentWeek()
  const weeks: string[] = [start]

  for (let i = 1; i < numWeeks; i++) {
    weeks.push(getPreviousWeek(weeks[weeks.length - 1]))
  }

  return weeks
}

/** Convert an ISO week string to a date range { from, to } in YYYY-MM-DD format */
export function isoWeekToDateRange(week: string): { from: string; to: string } {
  const startDate = getWeekStartDate(week)
  const endDate = getWeekEndDate(week)
  const fmt = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { from: fmt(startDate), to: fmt(endDate) }
}
