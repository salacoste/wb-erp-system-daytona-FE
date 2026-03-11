'use client'

/**
 * TanStack Query hooks for box line mutations
 * Epic 76-FE, Story 76.3: add, update, remove box lines
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shipmentsQueryKeys } from '@/hooks/use-shipments'
import { addBoxLine, updateBoxLine, removeBoxLine } from '@/lib/api/shipment-cost'
import type { BoxLineCreateRequest, BoxLineUpdateRequest } from '@/types/shipment-cost'

/** POST /v1/shipments/:id/pallets/:palletId/box-lines — needs palletId */
export function useAddBoxLine(shipmentId: string, palletId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BoxLineCreateRequest) => addBoxLine(shipmentId, palletId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.byId(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}

/** PUT /v1/shipments/:id/box-lines/:boxLineId — no palletId needed */
export function useUpdateBoxLine(shipmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ boxLineId, data }: { boxLineId: string; data: BoxLineUpdateRequest }) =>
      updateBoxLine(shipmentId, boxLineId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.byId(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}

/** DELETE /v1/shipments/:id/box-lines/:boxLineId — no palletId needed */
export function useRemoveBoxLine(shipmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (boxLineId: string) => removeBoxLine(shipmentId, boxLineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.byId(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}
