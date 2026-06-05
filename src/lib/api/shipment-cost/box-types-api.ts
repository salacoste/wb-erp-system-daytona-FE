/**
 * Box Types API client
 * Epic 75-FE: 5 endpoints for box type CRUD + deactivate
 * Source: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md#4
 */

import { apiClient } from '@/lib/api-client'
import type { BoxType, BoxTypeCreateRequest, BoxTypeUpdateRequest } from '@/types/shipment-cost'
import {
  normalizeBoxType,
  normalizeBoxTypeList,
  normalizeBoxTypeResponse,
} from './box-types-normalizer'

/** GET /v1/box-types?includeInactive=false */
export async function getBoxTypes(includeInactive = false): Promise<BoxType[]> {
  const params = new URLSearchParams()
  if (includeInactive) params.set('includeInactive', 'true')
  const query = params.toString()
  const url = query ? `/v1/box-types?${query}` : '/v1/box-types'
  const raw = await apiClient.get<unknown>(url)
  return normalizeBoxTypeList(raw)
}

/** GET /v1/box-types/:id */
export async function getBoxType(id: string): Promise<BoxType> {
  const raw = await apiClient.get<unknown>(`/v1/box-types/${id}`)
  return normalizeBoxType(raw)
}

/** POST /v1/box-types */
export async function createBoxType(data: BoxTypeCreateRequest): Promise<BoxType> {
  const raw = await apiClient.post<unknown>('/v1/box-types', data)
  return normalizeBoxTypeResponse(raw)
}

/** PUT /v1/box-types/:id */
export async function updateBoxType(id: string, data: BoxTypeUpdateRequest): Promise<BoxType> {
  const raw = await apiClient.put<unknown>(`/v1/box-types/${id}`, data)
  return normalizeBoxTypeResponse(raw)
}

/** DELETE /v1/box-types/:id — soft-delete via isActive flag */
export async function deactivateBoxType(id: string): Promise<BoxType> {
  const raw = await apiClient.delete<unknown>(`/v1/box-types/${id}`)
  return normalizeBoxTypeResponse(raw)
}
