/**
 * Box Types API client
 * Epic 75-FE: 5 endpoints for box type CRUD + deactivate
 * Source: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md#4
 */

import { apiClient } from '@/lib/api-client'
import type { BoxType, BoxTypeCreateRequest, BoxTypeUpdateRequest } from '@/types/shipment-cost'

/** GET /v1/box-types?includeInactive=false */
export async function getBoxTypes(includeInactive = false): Promise<BoxType[]> {
  const params = new URLSearchParams()
  if (includeInactive) params.set('includeInactive', 'true')
  const query = params.toString()
  const url = query ? `/v1/box-types?${query}` : '/v1/box-types'
  return apiClient.get<BoxType[]>(url)
}

/** GET /v1/box-types/:id */
export async function getBoxType(id: string): Promise<BoxType> {
  return apiClient.get<BoxType>(`/v1/box-types/${id}`)
}

/** POST /v1/box-types */
export async function createBoxType(data: BoxTypeCreateRequest): Promise<BoxType> {
  return apiClient.post<BoxType>('/v1/box-types', data)
}

/** PUT /v1/box-types/:id */
export async function updateBoxType(id: string, data: BoxTypeUpdateRequest): Promise<BoxType> {
  return apiClient.put<BoxType>(`/v1/box-types/${id}`, data)
}

/** DELETE /v1/box-types/:id — soft-delete via isActive flag */
export async function deactivateBoxType(id: string): Promise<BoxType> {
  return apiClient.delete<BoxType>(`/v1/box-types/${id}`)
}
