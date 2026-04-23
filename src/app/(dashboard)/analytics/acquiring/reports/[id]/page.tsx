/**
 * Acquiring Report Detail Route
 * Epic 90-FE Story 90.3: Dynamic route entry point for /analytics/acquiring/reports/[id]
 *
 * Server Component thin wrapper. Validates numeric ID and delegates rendering
 * to the client-component orchestrator AcquiringReportDetailPage.
 * Matches Next.js 15 async params pattern used by supplies/[id]/page.tsx.
 */

import { use } from 'react'
import { notFound } from 'next/navigation'
import { AcquiringReportDetailPage } from './components/AcquiringReportDetailPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AcquiringReportDetailRoute({ params }: PageProps) {
  const { id } = use(params)
  const reportId = Number(id)

  if (!Number.isFinite(reportId) || reportId <= 0) {
    notFound()
  }

  return <AcquiringReportDetailPage reportId={reportId} />
}
