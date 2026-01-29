/**
 * Test fixtures for Date Range Picker Extended
 * Story 51.3-FE: Extended Date Range Picker Component
 * Epic 51: FBS Historical Analytics UI (365 Days)
 *
 * Contains:
 * - Sample date ranges (30d, 90d, 180d, 365d)
 * - Invalid ranges (>365d, future dates)
 * - Edge cases (same day, year boundary)
 * - Preset configurations
 */

import type { DateRange, DateRangePreset, AggregationLevel } from '@/types/date-range'

// ============================================================================
// Valid Date Range Fixtures
// ============================================================================

/** Current date for relative calculations */
export const MOCK_TODAY = new Date('2025-01-29T12:00:00')

/** 30-day range ending today */
export const mockRange30Days: DateRange = {
  from: new Date('2024-12-31'),
  to: new Date('2025-01-29'),
}

/** 90-day range ending today */
export const mockRange90Days: DateRange = {
  from: new Date('2024-11-01'),
  to: new Date('2025-01-29'),
}

/** 180-day range ending today (half year) */
export const mockRange180Days: DateRange = {
  from: new Date('2024-08-03'),
  to: new Date('2025-01-29'),
}

/** 365-day range ending today (full year) */
export const mockRange365Days: DateRange = {
  from: new Date('2024-01-31'),
  to: new Date('2025-01-29'),
}

/** Single day range (same day) */
export const mockRangeSingleDay: DateRange = {
  from: new Date('2025-01-15'),
  to: new Date('2025-01-15'),
}

/** Week range (7 days) */
export const mockRangeOneWeek: DateRange = {
  from: new Date('2025-01-22'),
  to: new Date('2025-01-28'),
}

// ============================================================================
// Invalid Date Range Fixtures
// ============================================================================

/** Range exceeding 365 days (400 days) */
export const mockRangeExceeds365Days: DateRange = {
  from: new Date('2023-12-26'),
  to: new Date('2025-01-29'),
}

/** Range with future end date */
export const mockRangeFutureDates: DateRange = {
  from: new Date('2025-01-20'),
  to: new Date('2025-03-15'),
}

/** Range with start after end (inverted) */
export const mockRangeInverted: DateRange = {
  from: new Date('2025-01-29'),
  to: new Date('2025-01-15'),
}

// ============================================================================
// Edge Case Date Range Fixtures
// ============================================================================

/** Year boundary crossing range */
export const mockRangeYearBoundary: DateRange = {
  from: new Date('2024-12-15'),
  to: new Date('2025-01-15'),
}

/** Leap year boundary (Feb 29, 2024) */
export const mockRangeLeapYear: DateRange = {
  from: new Date('2024-02-28'),
  to: new Date('2024-03-01'),
}

/** End of month boundary */
export const mockRangeEndOfMonth: DateRange = {
  from: new Date('2025-01-31'),
  to: new Date('2025-02-28'),
}

// ============================================================================
// Preset Configuration Fixtures
// ============================================================================

/** Default presets (as per Story 51.3-FE) */
export const DEFAULT_PRESETS: DateRangePreset[] = [
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
  { label: '180 дней', days: 180 },
  { label: '365 дней', days: 365 },
]

/** Custom presets for testing */
export const customPresets: DateRangePreset[] = [
  { label: '7 дней', days: 7 },
  { label: '14 дней', days: 14 },
  { label: '30 дней', days: 30 },
]

/** Single preset for minimal tests */
export const singlePreset: DateRangePreset[] = [{ label: '30 дней', days: 30 }]

// ============================================================================
// Aggregation Level Fixtures
// ============================================================================

/** Aggregation levels with expected day ranges */
export const aggregationTestCases: Array<{
  days: number
  expected: AggregationLevel
  label: string
}> = [
  { days: 1, expected: 'day', label: 'Ежедневно' },
  { days: 30, expected: 'day', label: 'Ежедневно' },
  { days: 90, expected: 'day', label: 'Ежедневно' },
  { days: 91, expected: 'week', label: 'Еженедельно' },
  { days: 120, expected: 'week', label: 'Еженедельно' },
  { days: 180, expected: 'week', label: 'Еженедельно' },
  { days: 181, expected: 'month', label: 'Ежемесячно' },
  { days: 270, expected: 'month', label: 'Ежемесячно' },
  { days: 365, expected: 'month', label: 'Ежемесячно' },
]

// ============================================================================
// Pluralization Test Cases
// ============================================================================

/** Russian pluralization test cases for "день" */
export const pluralizationTestCases: Array<{
  count: number
  expected: string
}> = [
  { count: 1, expected: 'день' },
  { count: 2, expected: 'дня' },
  { count: 3, expected: 'дня' },
  { count: 4, expected: 'дня' },
  { count: 5, expected: 'дней' },
  { count: 10, expected: 'дней' },
  { count: 11, expected: 'дней' },
  { count: 12, expected: 'дней' },
  { count: 14, expected: 'дней' },
  { count: 19, expected: 'дней' },
  { count: 20, expected: 'дней' },
  { count: 21, expected: 'день' },
  { count: 22, expected: 'дня' },
  { count: 25, expected: 'дней' },
  { count: 100, expected: 'дней' },
  { count: 101, expected: 'день' },
  { count: 111, expected: 'дней' },
  { count: 365, expected: 'дней' },
]

// ============================================================================
// Date Formatting Test Cases
// ============================================================================

/** Date formatting test cases (Russian DD.MM.YYYY) */
export const dateFormattingTestCases: Array<{
  date: Date
  expected: string
}> = [
  { date: new Date('2025-01-29'), expected: '29.01.2025' },
  { date: new Date('2025-12-31'), expected: '31.12.2025' },
  { date: new Date('2024-02-29'), expected: '29.02.2024' }, // Leap year
  { date: new Date('2025-01-01'), expected: '01.01.2025' },
]

/** Date range formatting test cases */
export const dateRangeFormattingTestCases: Array<{
  from: Date
  to: Date
  expected: string
}> = [
  {
    from: new Date('2025-01-01'),
    to: new Date('2025-03-31'),
    expected: '01.01.2025 — 31.03.2025',
  },
  {
    from: new Date('2024-12-15'),
    to: new Date('2025-01-15'),
    expected: '15.12.2024 — 15.01.2025',
  },
]
