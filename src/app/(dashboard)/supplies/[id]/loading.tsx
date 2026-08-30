/**
 * Loading state for Supply Detail Page
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 */

import { SupplyDetailSkeleton } from './SupplyDetailSkeleton'

export default function SupplyDetailLoading() {
  return (
    <div className="container py-6">
      <SupplyDetailSkeleton />
    </div>
  )
}
