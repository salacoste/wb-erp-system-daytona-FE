/**
 * Dashboard Period Hook - Consumer hook for period state management
 * Story 60.1-FE: Period State Management
 *
 * Re-exports the useDashboardPeriod hook from the context module
 * for convenient importing from the hooks directory.
 *
 * @see docs/stories/epic-60/story-60.1-fe-period-state-management.md
 */

export {
  useDashboardPeriod,
  DashboardPeriodProvider,
  type DashboardPeriodContextValue,
  type DashboardPeriodState,
  type DashboardPeriodActions,
  type DashboardPeriodProviderProps,
  type PeriodType,
} from '@/contexts/dashboard-period-context'

// Also export helper functions for direct use
export {
  formatPeriodDisplay,
  formatWeekLabel,
  formatMonthLabel,
  getWeeksInMonth,
  getMonthFromWeek,
  getPreviousPeriod,
  isValidWeekFormat,
  isValidMonthFormat,
} from '@/lib/period-helpers'
