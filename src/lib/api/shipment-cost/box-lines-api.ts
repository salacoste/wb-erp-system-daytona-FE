/**
 * Box Lines API client
 * Epic 76-FE, Story 76.3: 3 endpoints (create, update, remove)
 * CRITICAL: Asymmetric paths — CREATE uses palletId, UPDATE/DELETE do not
 * Source: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md §6.8–6.10
 */

import { apiClient } from '@/lib/api-client'
import type { BoxLine, BoxLineCreateRequest, BoxLineUpdateRequest } from '@/types/shipment-cost'

/** POST /v1/shipments/:id/pallets/:palletId/box-lines — 3-level nesting */
export async function addBoxLine(
  shipmentId: string,
  palletId: string,
  data: BoxLineCreateRequest
): Promise<BoxLine> {
  return apiClient.post<BoxLine>(`/v1/shipments/${shipmentId}/pallets/${palletId}/box-lines`, data)
}

/** PUT /v1/shipments/:id/box-lines/:boxLineId — 2-level (no palletId) */
export async function updateBoxLine(
  shipmentId: string,
  boxLineId: string,
  data: BoxLineUpdateRequest
): Promise<BoxLine> {
  return apiClient.put<BoxLine>(`/v1/shipments/${shipmentId}/box-lines/${boxLineId}`, data)
}

/** DELETE /v1/shipments/:id/box-lines/:boxLineId — 2-level (no palletId) */
export async function removeBoxLine(shipmentId: string, boxLineId: string): Promise<void> {
  await apiClient.delete(`/v1/shipments/${shipmentId}/box-lines/${boxLineId}`)
}
