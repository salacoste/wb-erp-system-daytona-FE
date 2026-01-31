/**
 * Period Comparison Presets
 * Story 51.7-FE: Period Comparison UI
 * Story 61.6-FE: Fix Period Presets to ISO Weeks
 *
 * COMPATIBILITY LAYER - Re-exports from modular structure
 *
 * This file maintains backward compatibility for existing imports.
 * New code should import directly from './period-presets/'.
 *
 * @see docs/stories/epic-61/story-61.6-fe-period-presets-iso-weeks.md
 */

// Re-export everything from the modular structure
export {
  // Types
  type PeriodRange,
  type ComparisonPreset,
  COMPARISON_PRESETS,
  // Legacy presets
  formatDateRangeRu,
  calculatePresetPeriods,
  // ISO week presets
  getWeeksInCalendarMonth,
  getWeeksInQuarter,
  monthToIsoWeekRange,
  quarterToIsoWeekRange,
  getMoMPreset,
  getQoQPreset,
  getYoYPreset,
  calculateIsoWeekPresetPeriods,
  dateRangeToIsoWeekRange,
  // Utilities
  getIsoWeeksInYear,
  formatIsoWeekString,
} from './period-presets/index'
