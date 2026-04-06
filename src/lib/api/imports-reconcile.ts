/**
 * Import Batch Reconciliation API
 * POST /v1/imports/historical/:batchId/reconcile
 * Story 84.4: Reconcile failed batches to detect data that arrived via auto-import
 */

import { apiClient } from '../api-client'

export interface ReconcileResponse {
  reconciled: boolean
  newStatus: string
  weeksWithData: number
}

/** Reconcile a failed batch — checks if data exists despite batch failure */
export async function reconcileBatch(batchId: string): Promise<ReconcileResponse> {
  return apiClient.post<ReconcileResponse>(`/v1/imports/historical/${batchId}/reconcile`)
}
