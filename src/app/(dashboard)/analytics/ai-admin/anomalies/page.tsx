/**
 * Anomaly Resolution Admin Page — /analytics/ai-admin/anomalies
 * Story 112.3-FE Task 6. Server Component shell.
 * Access: Owner or Manager role (enforced in AnomaliesList component).
 * Note: Sidebar adminOnly filter hides this link from non-Owners,
 * but Managers can access via direct URL (component-level guard passes).
 */
import type { Metadata } from 'next'
import { AnomaliesList } from './components/AnomaliesList'

export const metadata: Metadata = {
  title: 'Разрешение аномалий',
}

export default function AnomaliesPage() {
  return (
    <div className="p-6">
      <AnomaliesList />
    </div>
  )
}
