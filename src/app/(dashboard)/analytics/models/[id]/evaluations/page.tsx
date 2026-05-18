/**
 * Model evaluations list page — Server Component shell.
 * Route: /analytics/models/[id]/evaluations
 * Story 110.2-FE: extracts params.id and delegates client logic to EvaluationsList.
 * Destination of buildModelEvaluationsRoute(modelId) from Story 110.1.
 */

import { EvaluationsList } from './components/EvaluationsList'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ModelEvaluationsPage({ params }: PageProps) {
  const { id } = await params
  return <EvaluationsList modelId={id} />
}
