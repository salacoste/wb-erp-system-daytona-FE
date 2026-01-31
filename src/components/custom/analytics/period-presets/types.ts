/**
 * Period Presets Types
 * Story 51.7-FE: Period Comparison UI
 */

/** Period range with from/to dates */
export interface PeriodRange {
  from: string
  to: string
}

/** Comparison preset type */
export type ComparisonPreset = 'mom' | 'qoq' | 'yoy' | 'custom'

/** Preset configuration */
export const COMPARISON_PRESETS: Array<{
  value: ComparisonPreset
  label: string
  shortLabel: string
}> = [
  { value: 'mom', label: 'Месяц к месяцу', shortLabel: 'MoM' },
  { value: 'qoq', label: 'Квартал к кварталу', shortLabel: 'QoQ' },
  { value: 'yoy', label: 'Год к году', shortLabel: 'YoY' },
  { value: 'custom', label: 'Произвольный', shortLabel: 'Свой' },
]
