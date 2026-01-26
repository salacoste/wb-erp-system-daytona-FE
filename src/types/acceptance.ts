/**
 * Acceptance Coefficient Types
 * Story 44.43-FE: Acceptance Coefficient Status Badge
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Types for acceptance coefficient status display and badge component.
 * Used to indicate delivery availability and pricing status from SUPPLY API.
 */

// ============================================================================
// Status Types
// ============================================================================

/**
 * Acceptance coefficient status based on coefficient value
 *
 * | Coefficient | Status |
 * |-------------|--------|
 * | -1          | unavailable |
 * | 0           | free |
 * | 1           | standard |
 * | 1.01-1.50   | elevated |
 * | >1.50       | high |
 */
export type AcceptanceStatus =
  | 'unavailable' // coefficient = -1 (delivery not available)
  | 'free' // coefficient = 0 (free acceptance)
  | 'standard' // coefficient = 1 (standard cost)
  | 'elevated' // coefficient 1.01-1.50 (elevated cost)
  | 'high' // coefficient > 1.50 (high cost)

/**
 * Badge color variants for acceptance status
 * Maps to Tailwind CSS color classes
 */
export type AcceptanceStatusColor =
  | 'destructive' // Red - unavailable
  | 'success' // Green - free
  | 'default' // Gray - standard
  | 'warning' // Yellow - elevated
  | 'high' // Orange - high

// ============================================================================
// Status Info Types
// ============================================================================

/**
 * Complete status information for display
 * Used by AcceptanceStatusBadge component
 */
export interface AcceptanceStatusInfo {
  /** Status classification */
  status: AcceptanceStatus
  /** Original coefficient value */
  coefficient: number
  /** Display label (Russian) */
  label: string
  /** Description text (Russian) */
  description: string
  /** Color variant for styling */
  color: AcceptanceStatusColor
  /** Emoji icon for badge */
  icon: string
  /** Percentage increase (null if coefficient <= 1) */
  percentageIncrease: number | null
}

/**
 * Configuration for a single acceptance status
 * Static config (no dynamic label/percentage)
 */
export interface AcceptanceStatusConfig {
  /** Display label (Russian) - static for unavailable/free/standard */
  label: string
  /** Description text (Russian) */
  description: string
  /** Color variant for styling */
  color: AcceptanceStatusColor
  /** Emoji icon for badge */
  icon: string
}
