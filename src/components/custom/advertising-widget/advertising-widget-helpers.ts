import { format, subDays } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

export type PeriodOption = '7d' | '14d' | '30d'

/** Date range with ISO date strings */
export interface DateRange {
  /** Start date in YYYY-MM-DD format */
  from: string
  /** End date in YYYY-MM-DD format */
  to: string
}

export interface AdvertisingDashboardWidgetProps {
  /** Additional class names */
  className?: string
  /**
   * Date range from parent context.
   * If provided, widget uses this range for API calls instead of internal state.
   * Story 60.6-FE: Sync with global dashboard period.
   */
  dateRange?: DateRange
  /**
   * When true, hide the local period selector.
   * Use when embedded in dashboard with global selector.
   * Story 60.6-FE: Hide when controlled by parent.
   */
  hideLocalSelector?: boolean
  /**
   * Callback when user selects a different date range from empty state.
   * Used to notify parent of period changes.
   * Story 60.6-FE: Empty state integration.
   */
  onDateRangeChange?: (range: DateRange) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format currency in rubles.
 * Handles undefined/null values gracefully.
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value == null || isNaN(value)) {
    return '— ₽'
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}М ₽`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}К ₽`
  }
  return `${value.toFixed(0)} ₽`
}

/**
 * Re-export the canonical ROAS color mapping (5-band, mirrors efficiencyConfig) so the
 * widget agrees with the dashboard card and the analytics page. iter-119: the widget
 * previously had its own ≥3-green scheme that diverged from the canonical bands.
 */
export { getRoasColorClass } from '@/lib/efficiency-utils'

/**
 * Get organic-contribution color class (value in percent units, 0-100).
 * Mirrors AdvertisingSummaryCards thresholds so the widget and the analytics card agree:
 * - < 0:   Error (WB re-attribution anomaly — a real negative, not no-data)
 * - >= 50: Success (healthy organic share)
 * - >= 20: Warning
 * - else:  Orange (low; legacy accent kept distinct from the warning band)
 * null/NaN → muted (no data). Replaces the widget's prior hardcoded green, which rendered
 * even a negative/low share as "healthy". Story 174.2: valence tokens.
 */
export function getOrganicContributionColorClass(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return 'text-muted-foreground'
  if (value < 0) return 'text-status-error'
  if (value >= 50) return 'text-status-success'
  // 0-20 (low) and 20-50 (moderate) share the warning valence — Story 174.2 orange→warning collapse
  return 'text-status-warning'
}

/**
 * Get period label in Russian.
 */
export function getPeriodLabel(period: PeriodOption): string {
  switch (period) {
    case '7d':
      return '7 дней'
    case '14d':
      return '14 дней'
    case '30d':
      return '30 дней'
  }
}

/**
 * Calculate internal date range from period option.
 * Used as fallback when no external dateRange is provided.
 */
export function calculateInternalDateRange(period: PeriodOption): DateRange {
  const to = subDays(new Date(), 1) // Yesterday (account for sync delay)
  const days = parseInt(period)
  const from = subDays(to, days)
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}
