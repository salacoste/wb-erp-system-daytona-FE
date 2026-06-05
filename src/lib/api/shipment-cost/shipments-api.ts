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
import { normalizeShipment, normalizeShipmentListResponse } from './shipments-normalizer'

/** GET /v1/shipments?status=&page=&limit= */
export async function getShipments(params?: ShipmentListParams): Promise<ShipmentListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.page != null) searchParams.set('page', String(params.page))
  if (params?.limit != null) searchParams.set('limit', String(params.limit))
  const query = searchParams.toString()
  const url = query ? `/v1/shipments?${query}` : '/v1/shipments'
  const raw = await apiClient.get<unknown>(url, { skipDataUnwrap: true })
  return normalizeShipmentListResponse(raw)
}

/** GET /v1/shipments/:id */
export async function getShipment(id: string): Promise<Shipment> {
  const raw = await apiClient.get<unknown>(`/v1/shipments/${id}`)
  return normalizeShipment(raw)
}

/** POST /v1/shipments */
export async function createShipment(data: ShipmentCreateRequest): Promise<Shipment> {
  const raw = await apiClient.post<unknown>('/v1/shipments', data)
  return normalizeShipment(raw)
}

/** PUT /v1/shipments/:id */
export async function updateShipment(id: string, data: ShipmentUpdateRequest): Promise<Shipment> {
  const raw = await apiClient.put<unknown>(`/v1/shipments/${id}`, data)
  return normalizeShipment(raw)
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
