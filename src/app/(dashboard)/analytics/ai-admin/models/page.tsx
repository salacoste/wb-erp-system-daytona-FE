/**
 * AI Admin Models page — Owner-role-gated model management.
 * Story 112.1-FE Task 5.
 * Server Component shell; role-gate and data fetch happen inside AdminModelsList (Client Component).
 */

import type { Metadata } from 'next'
import { AdminModelsList } from './components/AdminModelsList'

export const metadata: Metadata = {
  title: 'Управление AI моделями',
}

export default function AiAdminModelsPage() {
  return (
    // PB-2 / nested main removed (handoff §8-P1 D-5, 2026-09-02; parallel location found by propagation grep).
    <div className="container mx-auto p-6">
      <AdminModelsList />
    </div>
  )
}
