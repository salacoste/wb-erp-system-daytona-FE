'use client'

/**
 * Dashboard Period Context - Centralized period selection state management
 * Story 60.1-FE: Period State Management
 *
 * State logic extracted to dashboard-period-state.ts for file size compliance (Epic 74).
 * This file provides the React context wrapper and consumer hook.
 *
 * @see docs/stories/epic-60/story-60.1-fe-period-state-management.md
 */

import React, { createContext, useContext } from 'react'
import { useDashboardPeriodState } from './dashboard-period-state'
import type {
  DashboardPeriodContextValue,
  DashboardPeriodProviderProps,
} from './dashboard-period-types'

// Re-export types for convenience
export type {
  PeriodType,
  DashboardPeriodState,
  DashboardPeriodActions,
  DashboardPeriodContextValue,
  DashboardPeriodProviderProps,
} from './dashboard-period-types'

// Create context with undefined default (will throw if used outside provider)
const DashboardPeriodContext = createContext<DashboardPeriodContextValue | undefined>(undefined)

/**
 * Dashboard Period Provider
 * Manages period selection state with URL sync and localStorage persistence
 */
export function DashboardPeriodProvider({
  children,
  initialWeek,
}: DashboardPeriodProviderProps): React.ReactElement {
  const value = useDashboardPeriodState(initialWeek)
  return <DashboardPeriodContext.Provider value={value}>{children}</DashboardPeriodContext.Provider>
}

/**
 * Hook to consume dashboard period context
 * @throws Error if used outside DashboardPeriodProvider
 */
export function useDashboardPeriod(): DashboardPeriodContextValue {
  const context = useContext(DashboardPeriodContext)
  if (context === undefined) {
    throw new Error('useDashboardPeriod must be used within a DashboardPeriodProvider')
  }
  return context
}
