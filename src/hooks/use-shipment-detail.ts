'use client'

/**
 * TanStack Query hooks for shipment detail mutations (pallets)
 * Epic 76-FE, Story 76.2: Add/remove pallet mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addPallet, removePallet } from '@/lib/api/shipment-cost'
import { shipmentsQueryKeys } from '@/hooks/use-shipments'

export function useAddPallet(shipmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => addPallet(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.byId(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}

export function useRemovePallet(shipmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (palletId: string) => removePallet(shipmentId, palletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.byId(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}
