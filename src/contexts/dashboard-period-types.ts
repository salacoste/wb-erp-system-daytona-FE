/**
 * Dashboard Period Context Types
 * Story 60.1-FE: Period State Management
 *
 * Type definitions for dashboard period state management.
 *
 * @see docs/stories/epic-60/story-60.1-fe-period-state-management.md
 */

import type { ReactNode } from 'react'

/** Period type for week/month toggle */
export type PeriodType = 'week' | 'month'

/**
 * Dashboard period state shape
 */
export interface DashboardPeriodState {
  /** Current period view type */
  periodType: PeriodType
  /** Selected week in ISO format: "2026-W05" */
  selectedWeek: string
  /** Selected month in ISO format: "2026-01" */
  selectedMonth: string
  /** Previous week for comparison: "2026-W04" (computed) */
  previousWeek: string
  /** Previous month for comparison: "2025-12" (computed) */
  previousMonth: string
  /** Timestamp of last data refresh */
  lastRefresh: Date
  /** Loading state for initial hydration */
  isLoading: boolean
}

/**
 * Dashboard period actions
 */
export interface DashboardPeriodActions {
  /** Switch between week and month view */
  setPeriodType: (type: PeriodType) => void
  /** Select specific week */
  setWeek: (week: string) => void
  /** Select specific month */
  setMonth: (month: string) => void
  /** Trigger data refresh */
  refresh: () => void
  /** Get date range for current period (for API calls) */
  getDateRange: () => { startDate: string; endDate: string }
}

/**
 * Combined context value
 */
export type DashboardPeriodContextValue = DashboardPeriodState & DashboardPeriodActions

/**
 * Context provider props
 */
export interface DashboardPeriodProviderProps {
  children: ReactNode
  /** Override default week (for testing) */
  initialWeek?: string
}
