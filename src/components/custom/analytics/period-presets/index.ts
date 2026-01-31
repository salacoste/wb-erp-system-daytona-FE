/**
 * Period Presets - Barrel Export
 * Story 51.7-FE: Period Comparison UI
 * Story 61.6-FE: Fix Period Presets to ISO Weeks
 */

// Types
export type { PeriodRange, ComparisonPreset } from './types'
export { COMPARISON_PRESETS } from './types'

// Legacy (date-based) presets
export { formatDateRangeRu, calculatePresetPeriods } from './legacy-presets'

// ISO week presets
export {
  getWeeksInCalendarMonth,
  getWeeksInQuarter,
  monthToIsoWeekRange,
  quarterToIsoWeekRange,
  getMoMPreset,
  getQoQPreset,
  getYoYPreset,
  calculateIsoWeekPresetPeriods,
  dateRangeToIsoWeekRange,
} from './iso-presets'

// Re-export for convenience
export { getIsoWeeksInYear, formatIsoWeekString } from '@/lib/iso-week-utils'
