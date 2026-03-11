/**
 * Shipments API client
 * Epic 76-FE, Stories 76.1–76.2: 7 endpoints (5 CRUD + 2 pallet)
 * Source: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md
 */

import { apiClient } from '@/lib/api-client'
import type {
  Pallet,
  Shipment,
  ShipmentCreateRequest,
  ShipmentListParams,
  ShipmentListResponse,
  ShipmentUpdateRequest,
} from '@/types/shipment-cost'

/** GET /v1/shipments?status=&page=&limit= */
export async function getShipments(params?: ShipmentListParams): Promise<ShipmentListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.page != null) searchParams.set('page', String(params.page))
  if (params?.limit != null) searchParams.set('limit', String(params.limit))
  const query = searchParams.toString()
  const url = query ? `/v1/shipments?${query}` : '/v1/shipments'
  return apiClient.get<ShipmentListResponse>(url, { skipDataUnwrap: true })
}

/** GET /v1/shipments/:id */
export async function getShipment(id: string): Promise<Shipment> {
  return apiClient.get<Shipment>(`/v1/shipments/${id}`)
}

/** POST /v1/shipments */
export async function createShipment(data: ShipmentCreateRequest): Promise<Shipment> {
  return apiClient.post<Shipment>('/v1/shipments', data)
}

/** PUT /v1/shipments/:id */
export async function updateShipment(id: string, data: ShipmentUpdateRequest): Promise<Shipment> {
  return apiClient.put<Shipment>(`/v1/shipments/${id}`, data)
}

/** DELETE /v1/shipments/:id — DRAFT only, returns 204 */
export async function deleteShipment(id: string): Promise<void> {
  await apiClient.delete(`/v1/shipments/${id}`)
}

/** POST /v1/shipments/:id/pallets — empty body, auto-numbers (Story 76.2) */
export async function addPallet(shipmentId: string): Promise<Pallet> {
  return apiClient.post<Pallet>(`/v1/shipments/${shipmentId}/pallets`)
}

/** DELETE /v1/shipments/:id/pallets/:palletId — 204, cascade box lines (Story 76.2) */
export async function removePallet(shipmentId: string, palletId: string): Promise<void> {
  await apiClient.delete(`/v1/shipments/${shipmentId}/pallets/${palletId}`)
}
