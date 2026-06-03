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
 * Get ROAS color class based on value.
 * - >= 3.0: Green (excellent)
 * - >= 2.0: Yellow (good)
 * - >= 1.0: Orange (break-even)
 * - < 1.0: Red (loss)
 */
export function getRoasColorClass(roas: number | undefined | null): string {
  if (roas == null || isNaN(roas)) return 'text-muted-foreground'
  if (roas >= 3.0) return 'text-green-600'
  if (roas >= 2.0) return 'text-yellow-600'
  if (roas >= 1.0) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Get organic-contribution color class (value in percent units, 0-100).
 * Mirrors AdvertisingSummaryCards thresholds so the widget and the analytics card agree:
 * - < 0:   Red (WB re-attribution anomaly — a real negative, not no-data)
 * - >= 50: Green (healthy organic share)
 * - >= 20: Yellow
 * - else:  Orange (low)
 * null/NaN → muted (no data). Replaces the widget's prior hardcoded green, which rendered
 * even a negative/low share as "healthy".
 */
export function getOrganicContributionColorClass(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return 'text-muted-foreground'
  if (value < 0) return 'text-red-600'
  if (value >= 50) return 'text-green-600'
  if (value >= 20) return 'text-yellow-600'
  return 'text-orange-600'
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
