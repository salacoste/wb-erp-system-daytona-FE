/**
 * Model performance detail page — Server Component shell.
 * Route: /analytics/models/[id]/performance
 * Story 109.5-FE: extracts params.id and delegates client logic to ModelPerformanceDetail.
 * Resolves Story 109.3 row-click 404 destination.
 * Migrated Story 171.9-FE: presentation owned by ModelPerformanceDetail tree (token-clean).
 */

import { ModelPerformanceDetail } from './components/ModelPerformanceDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ModelPerformancePage({ params }: PageProps) {
  const { id } = await params
  return <ModelPerformanceDetail modelId={id} />
}
