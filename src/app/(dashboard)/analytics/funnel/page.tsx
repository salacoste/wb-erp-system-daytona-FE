/**
 * Funnel Analytics Page
 * Epic 68: Marketing Funnel (views -> cart -> orders -> buyouts)
 */

import { Suspense } from 'react'
import { FunnelPageContent } from './components/FunnelPageContent'

export default function FunnelPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="h-96 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      }
    >
      <FunnelPageContent />
    </Suspense>
  )
}
