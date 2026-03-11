'use client'

/**
 * TanStack Query hooks for SKU Packaging
 * Epic 75-FE: CRUD + bulk operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkCreateSkuPackaging,
  createSkuPackaging,
  deleteSkuPackaging,
  getSkuPackaging,
  getSkuPackagingByNmId,
} from '@/lib/api/shipment-cost'
import type {
  SkuPackagingBulkRequest,
  SkuPackagingCreateRequest,
  SkuPackagingListParams,
} from '@/types/shipment-cost'

export const skuPackagingQueryKeys = {
  all: () => ['sku-packaging'] as const,
  list: (params?: SkuPackagingListParams) => ['sku-packaging', 'list', params] as const,
  byNmId: (nmId: number) => ['sku-packaging', 'detail', nmId] as const,
}

export function useSkuPackaging(params?: SkuPackagingListParams) {
  return useQuery({
    queryKey: skuPackagingQueryKeys.list(params),
    queryFn: () => getSkuPackaging(params),
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export function useSkuPackagingByNmId(nmId: number) {
  return useQuery({
    queryKey: skuPackagingQueryKeys.byNmId(nmId),
    queryFn: () => getSkuPackagingByNmId(nmId),
    enabled: nmId > 0,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

/** POST /v1/sku-packaging — creates or replaces (upsert by nmId) */
export function useCreateSkuPackaging() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SkuPackagingCreateRequest) => createSkuPackaging(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: skuPackagingQueryKeys.all(),
      })
    },
  })
}

export function useDeleteSkuPackaging() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nmId: number) => deleteSkuPackaging(nmId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: skuPackagingQueryKeys.all(),
      })
    },
  })
}

export function useBulkCreateSkuPackaging() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SkuPackagingBulkRequest) => bulkCreateSkuPackaging(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: skuPackagingQueryKeys.all(),
      })
    },
  })
}
