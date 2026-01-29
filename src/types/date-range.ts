/**
 * Types for Extended Date Range Picker
 * Story 51.3-FE: Extended Date Range Picker Component
 * Epic 51: FBS Historical Analytics UI (365 Days)
 *
 * @see docs/stories/epic-51/story-51.3-fe-extended-date-range-picker.md
 */

/**
 * Date range with from and to dates
 */
export interface DateRange {
  /** Start date of the range */
  from: Date
  /** End date of the range */
  to: Date
}

/**
 * Preset configuration for quick date range selection
 */
export interface DateRangePreset {
  /** Display label in Russian (e.g., "30 дней") */
  label: string
  /** Number of days for this preset */
  days: number
}

/**
 * Aggregation level based on date range
 * - day: 1-90 days (Ежедневно)
 * - week: 91-180 days (Еженедельно)
 * - month: 181-365 days (Ежемесячно)
 */
export type AggregationLevel = 'day' | 'week' | 'month'

/**
 * Props for DateRangePickerExtended component
 */
export interface DateRangePickerExtendedProps {
  /** Current selected date range */
  value: DateRange | undefined
  /** Callback when range changes */
  onChange: (range: DateRange | undefined) => void
  /** Maximum allowed days in range (default: 365) */
  maxDays?: number
  /** Custom preset buttons (default: 30d, 90d, 180d, 365d) */
  presets?: DateRangePreset[]
  /** Show aggregation suggestion badge (default: true) */
  showAggregationSuggestion?: boolean
  /** Disable the picker */
  disabled?: boolean
  /** Custom className for root element */
  className?: string
  /** Placeholder text when no range selected (default: "Выберите период") */
  placeholder?: string
  /** ID for accessibility */
  id?: string
}

/**
 * Validation result for date range
 */
export interface DateRangeValidation {
  /** Whether the range is valid */
  isValid: boolean
  /** Error message if invalid (in Russian) */
  error?: string
  /** Number of days in the range */
  daysCount: number
}
