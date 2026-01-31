/**
 * ISO Week Utility Functions
 * Story 61.7-FE: Unify ISO Week Calculation Logic
 * Epic 61-FE: Dashboard Data Integration (API Layer)
 *
 * COMPATIBILITY LAYER - Re-exports from modular structure
 *
 * This file maintains backward compatibility for existing imports.
 * New code should import directly from '@/lib/iso-week'.
 *
 * Modular structure:
 * - core.ts - Core functions (getCurrentIsoWeek, parseIsoWeek, etc.)
 * - navigation.ts - Week navigation (getPreviousIsoWeek, getNextIsoWeek, etc.)
 * - ranges.ts - Date range functions (isoWeekToDateRange, buildPeriodRange, etc.)
 * - comparison.ts - Comparison/validation (compareIsoWeeks, isValidIsoWeekFormat, etc.)
 *
 * @see docs/stories/epic-61/story-61.7-fe-unified-iso-week.md
 */

// Re-export everything from the modular structure
export {
  // Core
  getCurrentIsoWeek,
  formatIsoWeekString,
  parseIsoWeek,
  dateToIsoWeek,
  getIsoWeeksInYear,
  // Navigation
  getPreviousIsoWeek,
  getNextIsoWeek,
  getWeekRange,
  generateWeekSequence,
  // Ranges
  isoWeekToDateRange,
  getWeekStartDate,
  getWeekEndDate,
  getWeekMidpoint,
  buildPeriodRange,
  parseIsoWeekRange,
  // Comparison/Validation
  isValidIsoWeekFormat,
  isValidIsoWeekRangeFormat,
  compareIsoWeeks,
  getSameWeekPreviousYear,
} from './iso-week'
