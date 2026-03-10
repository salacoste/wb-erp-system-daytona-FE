/**
 * SKU Packaging API client
 * Epic 75-FE: 5 endpoints for SKU packaging CRUD + bulk
 * Source: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md#5
 */

import { apiClient } from '@/lib/api-client'
import type {
  SkuPackaging,
  SkuPackagingBulkRequest,
  SkuPackagingBulkResponse,
  SkuPackagingCreateRequest,
  SkuPackagingListParams,
} from '@/types/shipment-cost'

/** GET /v1/sku-packaging?nmId=&boxTypeId= */
export async function getSkuPackaging(params?: SkuPackagingListParams): Promise<SkuPackaging[]> {
  const searchParams = new URLSearchParams()
  if (params?.nmId != null) searchParams.set('nmId', String(params.nmId))
  if (params?.boxTypeId) searchParams.set('boxTypeId', params.boxTypeId)
  const query = searchParams.toString()
  const url = query ? `/v1/sku-packaging?${query}` : '/v1/sku-packaging'
  return apiClient.get<SkuPackaging[]>(url)
}

/** GET /v1/sku-packaging/:nmId */
export async function getSkuPackagingByNmId(nmId: number): Promise<SkuPackaging> {
  return apiClient.get<SkuPackaging>(`/v1/sku-packaging/${nmId}`)
}

/** POST /v1/sku-packaging */
export async function createSkuPackaging(data: SkuPackagingCreateRequest): Promise<SkuPackaging> {
  return apiClient.post<SkuPackaging>('/v1/sku-packaging', data)
}

/** POST /v1/sku-packaging/bulk — partial success: always returns 201 */
export async function bulkCreateSkuPackaging(
  data: SkuPackagingBulkRequest
): Promise<SkuPackagingBulkResponse> {
  return apiClient.post<SkuPackagingBulkResponse>('/v1/sku-packaging/bulk', data)
}

/** DELETE /v1/sku-packaging/:nmId — returns 204 */
export async function deleteSkuPackaging(nmId: number): Promise<void> {
  await apiClient.delete(`/v1/sku-packaging/${nmId}`)
}
