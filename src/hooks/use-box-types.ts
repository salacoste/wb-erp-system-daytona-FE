'use client'

/**
 * TanStack Query hooks for Box Types
 * Epic 75-FE: CRUD + deactivate operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createBoxType,
  deactivateBoxType,
  getBoxType,
  getBoxTypes,
  updateBoxType,
} from '@/lib/api/shipment-cost'
import type { BoxTypeCreateRequest, BoxTypeUpdateRequest } from '@/types/shipment-cost'

export const boxTypesQueryKeys = {
  all: () => ['box-types'] as const,
  list: (includeInactive?: boolean) => ['box-types', 'list', { includeInactive }] as const,
  byId: (id: string) => ['box-types', 'detail', id] as const,
}

export function useBoxTypes(includeInactive = false) {
  return useQuery({
    queryKey: boxTypesQueryKeys.list(includeInactive),
    queryFn: () => getBoxTypes(includeInactive),
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export function useBoxType(id: string) {
  return useQuery({
    queryKey: boxTypesQueryKeys.byId(id),
    queryFn: () => getBoxType(id),
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export function useCreateBoxType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BoxTypeCreateRequest) => createBoxType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boxTypesQueryKeys.all() })
    },
  })
}

export function useUpdateBoxType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BoxTypeUpdateRequest }) =>
      updateBoxType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boxTypesQueryKeys.all() })
    },
  })
}

export function useDeactivateBoxType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivateBoxType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boxTypesQueryKeys.all() })
    },
  })
}
