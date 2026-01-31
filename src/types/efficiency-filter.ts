/**
 * Efficiency Filter Types
 * Story 63.4-FE: Advertising Efficiency Filter UI
 *
 * Types for efficiency filter chips component.
 */

import type { EfficiencyStatus } from './advertising-analytics'

/**
 * Efficiency counts summary for filter chips.
 * Shows count of items in each efficiency category.
 */
export interface EfficiencyCountsSummary {
  /** Count of excellent efficiency items (ROAS > 5) */
  excellent: number
  /** Count of good efficiency items (ROAS 3-5) */
  good: number
  /** Count of moderate efficiency items (ROAS 2-3) */
  moderate: number
  /** Count of poor efficiency items (ROAS 1-2) */
  poor: number
  /** Count of loss items (ROAS < 1) */
  loss: number
  /** Total count of all items */
  total: number
}

/**
 * Filter chip configuration for a single efficiency status.
 */
export interface EfficiencyFilterConfig {
  /** Russian label for the status */
  label: string
  /** Text color class */
  color: string
  /** Background color class (inactive) */
  bgColor: string
  /** Background color class (active) */
  bgColorActive: string
  /** Border color class (active) */
  borderColor: string
  /** Description for tooltip (ROAS range) */
  description: string
  /** ROAS range text */
  roasRange: string
}

/**
 * Efficiency filter configuration map.
 * Maps each status to its display configuration.
 */
export type EfficiencyFilterConfigMap = Record<
  Exclude<EfficiencyStatus, 'unknown'>,
  EfficiencyFilterConfig
>

/**
 * Filter order for displaying chips.
 * Excludes 'unknown' as it's not a filterable status.
 */
export type FilterableEfficiencyStatus = Exclude<EfficiencyStatus, 'unknown'>
