/**
 * Dashboard Page
 * Story 3.1: Main Dashboard Layout & Navigation
 * Story 60.4-FE: Connect Dashboard to Period State
 *
 * Main entry point wrapped with DashboardPeriodProvider for period state management.
 * Uses RequireWbToken to redirect to /wb-token if no WB API token is configured.
 *
 * @see docs/stories/epic-60/story-60.4-fe-connect-dashboard-period.md
 */

'use client'

import { Suspense } from 'react'
import { DashboardPeriodProvider } from '@/contexts/dashboard-period-context'
import { RequireWbToken } from '@/components/custom/RequireWbToken'
import { DashboardContent } from './components/DashboardContent'
import { DashboardSkeleton } from './components/DashboardSkeleton'

export default function DashboardPage(): React.ReactElement {
  return (
    <RequireWbToken>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardPeriodProvider>
          <DashboardContent />
        </DashboardPeriodProvider>
      </Suspense>
    </RequireWbToken>
  )
}
