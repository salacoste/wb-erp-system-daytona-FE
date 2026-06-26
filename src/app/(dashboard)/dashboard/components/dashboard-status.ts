/**
 * Dashboard status-strip alert model (TZ-1).
 *
 * Pure helper that derives which of the 8 dashboard alerts are active from the
 * same conditions `DashboardContent` used to render each banner inline. The
 * `DashboardStatusStrip` consumes `count` + `highestSeverity` for its collapsed
 * summary line; `DashboardContent` still renders the real banner components
 * inside the strip (so messages, CTAs, and dismiss behaviour are preserved).
 *
 * Severity order (highest → lowest), per docs/ux/IMPLEMENTATION-TZ.md TZ-1:
 * Failed > Error > Processing > DataGaps > MissingCogs > Tax > IncompleteWeek > ReportPending.
 */

import { isPeriodIncomplete } from '@/lib/week-report-utils'

export type StatusSeverity =
  | 'failed'
  | 'error'
  | 'processing'
  | 'dataGaps'
  | 'missingCogs'
  | 'tax'
  | 'incompleteWeek'
  | 'reportPending'

/** Highest severity first — drives the collapsed-line icon + ordering. */
export const STATUS_SEVERITY_ORDER: readonly StatusSeverity[] = [
  'failed',
  'error',
  'processing',
  'dataGaps',
  'missingCogs',
  'tax',
  'incompleteWeek',
  'reportPending',
] as const

export interface StatusAlertInputs {
  selectedPeriod: string
  periodType: 'week' | 'month'
  isFinanceAvailable: boolean
  isProcessing: boolean
  isFailed: boolean
  failedBatchCount: number
  hasError: boolean
  taxConfigured: boolean
  /** Session-dismissed flag (TaxWarningBanner uses sessionStorage 'tax-warning-dismissed'). */
  taxDismissed: boolean
  productsLoading: boolean
  cogsLoading: boolean
  cogsCoverage: number
  totalProducts: number
  inventoryWithCogs: number
}

export interface StatusAlertState {
  /** Per-severity active flag — DashboardContent uses it to gate each banner render. */
  active: Record<StatusSeverity, boolean>
  /** Count of active alerts (collapsed summary: "⚠ N items need attention"). */
  count: number
  /** Highest active severity, or null when nothing is active. */
  highestSeverity: StatusSeverity | null
}

/**
 * Derive the active-alert state for the dashboard status strip. Conditions mirror
 * the inline banner gates that previously lived in DashboardContent.tsx:69-85.
 */
export function getDashboardStatusAlerts(input: StatusAlertInputs): StatusAlertState {
  const missingCogsCount = (input.totalProducts ?? 0) - input.inventoryWithCogs
  const active: Record<StatusSeverity, boolean> = {
    failed: input.isFailed,
    error: !!input.hasError && !input.isProcessing && input.isFinanceAvailable,
    processing: input.isProcessing,
    dataGaps: !input.isFailed && input.failedBatchCount > 0,
    missingCogs:
      !input.productsLoading &&
      !input.cogsLoading &&
      input.cogsCoverage < 100 &&
      missingCogsCount > 0,
    tax: !input.taxConfigured && !input.taxDismissed,
    incompleteWeek: isPeriodIncomplete(input.selectedPeriod, input.periodType),
    reportPending: !input.isFinanceAvailable && !input.isProcessing,
  }
  const activeOrdered = STATUS_SEVERITY_ORDER.filter(severity => active[severity])
  return {
    active,
    count: activeOrdered.length,
    highestSeverity: activeOrdered[0] ?? null,
  }
}
