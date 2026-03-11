'use client'

/**
 * TanStack Query hooks for Shipments
 * Epic 76-FE, Story 76.1: CRUD + list with pagination/filtering
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createShipment,
  deleteShipment,
  getShipment,
  getShipments,
  updateShipment,
} from '@/lib/api/shipment-cost'
import type {
  ShipmentCreateRequest,
  ShipmentListParams,
  ShipmentUpdateRequest,
} from '@/types/shipment-cost'

export const shipmentsQueryKeys = {
  all: () => ['shipments'] as const,
  list: (params?: ShipmentListParams) => ['shipments', 'list', params] as const,
  byId: (id: string) => ['shipments', 'detail', id] as const,
}

export function useShipments(params?: ShipmentListParams) {
  return useQuery({
    queryKey: shipmentsQueryKeys.list(params),
    queryFn: () => getShipments(params),
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: shipmentsQueryKeys.byId(id),
    queryFn: () => getShipment(id),
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export function useCreateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ShipmentCreateRequest) => createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}

export function useUpdateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShipmentUpdateRequest }) =>
      updateShipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}

export function useDeleteShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}
