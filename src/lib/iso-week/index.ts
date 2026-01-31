/**
 * ISO Week Utilities - Barrel Export
 * Story 61.7-FE: Unify ISO Week Calculation Logic
 *
 * Centralized ISO week calculations to replace duplicated logic across:
 * - useFinancialSummary.ts
 * - useTrends.ts
 * - useMarginTrends.ts
 *
 * All functions use ISO 8601 week standard:
 * - Week starts on Monday
 * - Week 1 contains the first Thursday of the year
 * - Format: YYYY-Www (e.g., "2026-W05")
 *
 * @see docs/stories/epic-61/story-61.7-fe-unified-iso-week.md
 */

// Core functions
export {
  getCurrentIsoWeek,
  formatIsoWeekString,
  parseIsoWeek,
  dateToIsoWeek,
  getIsoWeeksInYear,
  ISO_WEEK_REGEX,
} from './core'

// Navigation functions
export {
  getPreviousIsoWeek,
  getNextIsoWeek,
  getWeekRange,
  generateWeekSequence,
} from './navigation'

// Range functions
export {
  isoWeekToDateRange,
  getWeekStartDate,
  getWeekEndDate,
  getWeekMidpoint,
  buildPeriodRange,
  parseIsoWeekRange,
} from './ranges'

// Comparison and validation functions
export {
  isValidIsoWeekFormat,
  isValidIsoWeekRangeFormat,
  compareIsoWeeks,
  getSameWeekPreviousYear,
} from './comparison'
