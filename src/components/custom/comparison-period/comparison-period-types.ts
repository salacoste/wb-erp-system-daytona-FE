/**
 * Comparison Period Types
 * Story 6.2-FE: Period Comparison Enhancement
 *
 * Shared type definitions for comparison period components.
 */

/**
 * Preset comparison options
 */
export type ComparisonPreset = 'previous' | 'same_last_year' | 'custom'

export interface ComparisonPeriodSelectorProps {
  /** Whether comparison mode is enabled */
  enabled: boolean
  /** Callback when comparison mode is toggled */
  onEnabledChange: (enabled: boolean) => void
  /** Selected comparison preset */
  preset: ComparisonPreset
  /** Callback when preset changes */
  onPresetChange: (preset: ComparisonPreset) => void
  /** Start week of comparison period (for custom) */
  compareStart: string
  /** End week of comparison period (for custom) */
  compareEnd: string
  /** Callback when comparison range changes (custom mode) */
  onCompareRangeChange: (start: string, end: string) => void
  /** Current period start (for calculating presets) */
  currentPeriodStart: string
  /** Current period end (for calculating presets) */
  currentPeriodEnd: string
  /** Additional CSS classes */
  className?: string
}
