/**
 * Reorder Recommendations Types
 * Dashboard for warehouse replenishment recommendations.
 */

/** Reorder recommendation record */
export interface ReorderRecommendation {
  id: string
  nmId: number
  recommendedQty: number
  currentStock: number
  inTransitQty: number
  avgDailyDemand: number
  demandSource: 'ml' | 'velocity'
  leadTimeDays: number
  coverageDays: number
  orderByDate: string | null
  stockoutDate: string | null
  status: 'pending' | 'ordered' | 'received' | 'expired'
  unitCostRub: number | null
  totalReorderValue: number | null
  computedAt: string
}

/** Aggregate fulfillment metrics */
export interface ReorderFulfillmentMetrics {
  totalPending: number
  totalOrdered: number
  totalReceived: number
  totalExpired: number
  avgHoursToOrder: number | null
  avgHoursToReceive: number | null
  reorderCoveragePct: number
}

/** Status filter parameter */
export type ReorderStatusFilter = 'all' | 'pending' | 'ordered' | 'received' | 'expired'

/** Query params for the recommendations list endpoint */
export interface ReorderListParams {
  status?: ReorderStatusFilter extends 'all' ? never : string
  urgency?: string
  limit?: number
}

/** Payload for updating a recommendation's status */
export interface UpdateReorderStatusPayload {
  status: 'ordered' | 'received'
}
