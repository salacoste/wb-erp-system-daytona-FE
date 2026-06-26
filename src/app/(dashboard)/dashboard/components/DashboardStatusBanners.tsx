'use client'

/**
 * DashboardStatusBanners — the 8 conditional alert banners rendered inside the
 * DashboardStatusStrip's expanded region (TZ-1). Extracted from DashboardContent to
 * keep that orchestrator under the 200-line cap (and give TZ-5 headroom). Behaviour
 * is byte-faithful to the pre-TZ-1 inline banners: every gate and CTA is preserved.
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-1)
 */

import type { ReactElement } from 'react'
import { IncompleteWeekBanner, TaxWarningBanner } from '@/components/custom/dashboard'
import { ReportPendingBanner } from './ReportPendingBanner'
import { ProcessingAlert, FailedAlert, ErrorAlert, DataGapsAlert } from './DashboardAlerts'
import { MissingCogsAlert } from '@/components/custom/MissingCogsAlert'
import type { useDashboardData } from './useDashboardData'

type DashboardData = ReturnType<typeof useDashboardData>

export interface DashboardStatusBannersProps {
  data: DashboardData
  canAssignCogs: boolean
}

export function DashboardStatusBanners({
  data: d,
  canAssignCogs,
}: DashboardStatusBannersProps): ReactElement {
  return (
    <>
      <IncompleteWeekBanner period={d.selectedPeriod} periodType={d.periodType} />
      {!d.isFinanceAvailable && !d.isProcessing && (
        <ReportPendingBanner week={d.selectedWeek} latestAvailableWeek={d.latestAvailableWeek} />
      )}
      {d.isProcessing && <ProcessingAlert processingStatus={d.processingStatus} />}
      {d.isFailed && <FailedAlert />}
      {!d.isFailed && d.failedBatchCount > 0 && <DataGapsAlert failedCount={d.failedBatchCount} />}
      {d.error && !d.isProcessing && d.isFinanceAvailable && <ErrorAlert onRetry={d.handleRetry} />}
      <TaxWarningBanner taxConfigured={d.taxConfigured} />
      {!d.productsLoading && !d.cogsLoading && d.cogsCoverage < 100 && (
        <MissingCogsAlert
          missingCount={(d.totalProducts ?? 0) - d.inventoryWithCogs}
          canAssignCogs={canAssignCogs}
        />
      )}
    </>
  )
}
