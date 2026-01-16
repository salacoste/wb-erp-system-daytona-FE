/**
 * Analytics event definitions for Epic 37: Advertising Analytics
 * Type-safe event tracking with consistent naming and properties
 * @see docs/stories/epic-37/QA-HANDOFF-PHASE-2.md#52-implement-event-tracking
 */

import analytics from './mixpanel'

// Event name constants for consistency
export const ANALYTICS_EVENTS = {
  // Page views
  PAGE_VIEW_ADVERTISING: 'Page View - Advertising Analytics',

  // User interactions
  TOGGLE_MODE: 'Advertising Analytics - Toggle Mode',
  SORT_TABLE: 'Advertising Analytics - Sort Table',
  ROW_CLICK: 'Advertising Analytics - Row Click',
} as const

// Type for view modes
type ViewMode = 'sku' | 'imtId'

// Type for sort directions
type SortDirection = 'asc' | 'desc'

/**
 * Track page view for Advertising Analytics
 * Call in useEffect when page loads or view mode changes
 */
export function trackAdvertisingPageView(viewMode: ViewMode): void {
  analytics.track(ANALYTICS_EVENTS.PAGE_VIEW_ADVERTISING, {
    view_mode: viewMode,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track toggle between SKU and Merged Groups view
 * Call when user switches view mode
 */
export function trackToggleMode(params: {
  mode: ViewMode
  previousMode: ViewMode
}): void {
  analytics.track(ANALYTICS_EVENTS.TOGGLE_MODE, {
    mode: params.mode,
    previous_mode: params.previousMode,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track table sort action
 * Call when user clicks column header to sort
 */
export function trackTableSort(params: {
  column: string
  direction: SortDirection
  viewMode: ViewMode
}): void {
  analytics.track(ANALYTICS_EVENTS.SORT_TABLE, {
    column: params.column,
    direction: params.direction,
    view_mode: params.viewMode,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track row click (detail row)
 * Call when user clicks on a product row
 */
export function trackRowClick(params: {
  nmId: number
  groupId: number | null
  isMainProduct: boolean
  viewMode: ViewMode
}): void {
  analytics.track(ANALYTICS_EVENTS.ROW_CLICK, {
    nmId: params.nmId,
    groupId: params.groupId,
    is_main_product: params.isMainProduct,
    view_mode: params.viewMode,
    timestamp: new Date().toISOString(),
  })
}
