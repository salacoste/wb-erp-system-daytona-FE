/**
 * ISO Week Navigation Functions
 * Story 61.7-FE: Unify ISO Week Calculation Logic
 *
 * Functions for navigating between weeks:
 * - getPreviousIsoWeek - Get previous week
 * - getNextIsoWeek - Get next week
 * - getWeekRange - Get array of weeks
 *
 * @see docs/stories/epic-61/story-61.7-fe-unified-iso-week.md
 */

import { addWeeks, subWeeks } from 'date-fns'
import { getCurrentIsoWeek, parseIsoWeek, dateToIsoWeek } from './core'

/**
 * Get previous ISO week
 * @param week - Current week in YYYY-Www format
 * @returns Previous ISO week string
 */
export function getPreviousIsoWeek(week: string): string {
  const date = parseIsoWeek(week)
  const prevDate = subWeeks(date, 1)
  return dateToIsoWeek(prevDate)
}

/**
 * Get next ISO week
 * @param week - Current week in YYYY-Www format
 * @returns Next ISO week string
 */
export function getNextIsoWeek(week: string): string {
  const date = parseIsoWeek(week)
  const nextDate = addWeeks(date, 1)
  return dateToIsoWeek(nextDate)
}

/**
 * Get array of N weeks going back from start week
 * @param numWeeks - Number of weeks to return
 * @param options.startWeek - Starting week (default: current week)
 * @param options.direction - 'backward' (default) or 'forward'
 * @returns Array of ISO week strings
 */
export function getWeekRange(
  numWeeks: number,
  options?: {
    startWeek?: string
    direction?: 'backward' | 'forward'
  }
): string[] {
  if (numWeeks < 0) {
    throw new Error('numWeeks must be non-negative')
  }
  if (numWeeks === 0) return []

  const startWeek = options?.startWeek ?? getCurrentIsoWeek()
  const direction = options?.direction ?? 'backward'

  const weeks: string[] = []
  let current = startWeek

  for (let i = 0; i < numWeeks; i++) {
    weeks.push(current)
    current = direction === 'backward' ? getPreviousIsoWeek(current) : getNextIsoWeek(current)
  }

  return weeks
}

/**
 * Generate sequence of weeks between start and end (inclusive)
 * @param startWeek - Starting week
 * @param endWeek - Ending week
 * @returns Array of ISO week strings
 */
export function generateWeekSequence(startWeek: string, endWeek: string): string[] {
  const weeks: string[] = []
  let current = startWeek

  // Prevent infinite loops
  let maxIterations = 200 // ~4 years
  let iterations = 0

  while (current <= endWeek && iterations < maxIterations) {
    weeks.push(current)
    if (current === endWeek) break
    current = getNextIsoWeek(current)
    iterations++
  }

  return weeks
}
