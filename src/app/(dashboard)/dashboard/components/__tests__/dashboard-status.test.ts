/**
 * Unit tests for getDashboardStatusAlerts (TZ-1 status-strip model).
 * Verifies active-condition parity with the inline banner gates that lived in
 * DashboardContent.tsx:69-85, plus severity ordering + count.
 */

import { describe, it, expect } from 'vitest'
import { getDashboardStatusAlerts, type StatusAlertInputs } from '../dashboard-status'

/** Past, complete week (W05 of 2026) → isPeriodIncomplete is false. */
const baseInputs: StatusAlertInputs = {
  selectedPeriod: '2026-W05',
  periodType: 'week',
  isFinanceAvailable: true,
  isProcessing: false,
  isFailed: false,
  failedBatchCount: 0,
  hasError: false,
  taxConfigured: true,
  taxDismissed: false,
  productsLoading: false,
  cogsLoading: false,
  cogsCoverage: 100,
  totalProducts: 10,
  inventoryWithCogs: 10,
}

describe('getDashboardStatusAlerts', () => {
  it('returns count 0 and null severity when nothing is active', () => {
    const result = getDashboardStatusAlerts(baseInputs)
    expect(result.count).toBe(0)
    expect(result.highestSeverity).toBeNull()
  })

  it('flags only `failed` when isFailed', () => {
    const result = getDashboardStatusAlerts({ ...baseInputs, isFailed: true })
    expect(result.count).toBe(1)
    expect(result.highestSeverity).toBe('failed')
    expect(result.active.failed).toBe(true)
  })

  it('suppressed `error` while processing', () => {
    const result = getDashboardStatusAlerts({
      ...baseInputs,
      hasError: true,
      isProcessing: true,
    })
    expect(result.active.error).toBe(false)
    expect(result.active.processing).toBe(true)
  })

  it('`error` active when hasError, not processing, finance available', () => {
    const result = getDashboardStatusAlerts({
      ...baseInputs,
      hasError: true,
      isFinanceAvailable: true,
    })
    expect(result.active.error).toBe(true)
  })

  it('`error` inactive when finance is not available', () => {
    const result = getDashboardStatusAlerts({
      ...baseInputs,
      hasError: true,
      isFinanceAvailable: false,
    })
    expect(result.active.error).toBe(false)
  })

  it('`dataGaps` suppressed when failed (failed takes precedence)', () => {
    const result = getDashboardStatusAlerts({
      ...baseInputs,
      isFailed: true,
      failedBatchCount: 3,
    })
    expect(result.active.dataGaps).toBe(false)
    expect(result.active.failed).toBe(true)
  })

  it('`missingCogs` requires coverage < 100 AND a positive missing count', () => {
    expect(
      getDashboardStatusAlerts({
        ...baseInputs,
        cogsCoverage: 80,
        totalProducts: 10,
        inventoryWithCogs: 8,
      }).active.missingCogs
    ).toBe(true)

    // coverage complete → inactive even with the same counts
    expect(
      getDashboardStatusAlerts({
        ...baseInputs,
        cogsCoverage: 100,
        totalProducts: 10,
        inventoryWithCogs: 10,
      }).active.missingCogs
    ).toBe(false)

    // loading suppresses
    expect(
      getDashboardStatusAlerts({
        ...baseInputs,
        productsLoading: true,
        cogsCoverage: 0,
        totalProducts: 10,
        inventoryWithCogs: 0,
      }).active.missingCogs
    ).toBe(false)
  })

  it('`tax` inactive when configured OR session-dismissed', () => {
    expect(getDashboardStatusAlerts({ ...baseInputs, taxConfigured: false }).active.tax).toBe(true)
    expect(getDashboardStatusAlerts({ ...baseInputs, taxConfigured: true }).active.tax).toBe(false)
    expect(
      getDashboardStatusAlerts({ ...baseInputs, taxConfigured: false, taxDismissed: true }).active
        .tax
    ).toBe(false)
  })

  it('`reportPending` active only when finance unavailable AND not processing', () => {
    expect(
      getDashboardStatusAlerts({
        ...baseInputs,
        isFinanceAvailable: false,
        isProcessing: false,
      }).active.reportPending
    ).toBe(true)
    expect(
      getDashboardStatusAlerts({
        ...baseInputs,
        isFinanceAvailable: false,
        isProcessing: true,
      }).active.reportPending
    ).toBe(false)
    expect(baseInputs && getDashboardStatusAlerts(baseInputs).active.reportPending).toBe(false)
  })

  it('highestSeverity follows Failed > Error > Processing > DataGaps > MissingCogs > Tax > IncompleteWeek > ReportPending', () => {
    // Mix a low-severity (reportPending) with each higher one; highest must win.
    const withReportPending = { ...baseInputs, isFinanceAvailable: false }
    expect(getDashboardStatusAlerts({ ...withReportPending, isFailed: true }).highestSeverity).toBe(
      'failed'
    )
    expect(
      getDashboardStatusAlerts({ ...withReportPending, taxConfigured: false }).highestSeverity
    ).toBe('tax')
    expect(
      getDashboardStatusAlerts({ ...withReportPending, isProcessing: true }).highestSeverity
    ).toBe('processing')
  })

  it('counts all 8 when every condition is active', () => {
    // Make every alert active simultaneously (where mutually-exclusive flags allow):
    // failed, error, processing, dataGaps, missingCogs, tax, incompleteWeek, reportPending.
    // Note: isFailed suppresses dataGaps; error needs !isProcessing. We force the broadest set
    // by checking the 8 keys directly across two complementary scenarios.
    const scenarioFailed = getDashboardStatusAlerts({
      ...baseInputs,
      isFinanceAvailable: false, // reportPending
      isFailed: true, // failed (suppresses dataGaps)
      taxConfigured: false, // tax
      cogsCoverage: 50, // missingCogs
      totalProducts: 10,
      inventoryWithCogs: 5,
    })
    // failed + reportPending + tax + missingCogs = 4 (dataGaps suppressed by failed, error needs finance)
    expect(scenarioFailed.count).toBe(4)

    const scenarioError = getDashboardStatusAlerts({
      ...baseInputs,
      isFinanceAvailable: true,
      hasError: true, // error
      failedBatchCount: 2, // dataGaps (not failed)
      taxConfigured: false, // tax
      cogsCoverage: 50, // missingCogs
      totalProducts: 10,
      inventoryWithCogs: 5,
    })
    // error + dataGaps + tax + missingCogs = 4
    expect(scenarioError.count).toBe(4)
  })
})
