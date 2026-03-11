'use client'

/**
 * TanStack Query hooks for Shipment Calculations
 * Epic 76-FE, Story 76.4: Calculate / Story 76.5: Confirm + Recalculate
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shipmentsQueryKeys } from '@/hooks/use-shipments'
import { calculateShipment, confirmShipment, recalculateShipment } from '@/lib/api/shipment-cost'

export function useCalculateShipment(shipmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => calculateShipment(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.byId(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}

export function useConfirmShipment(shipmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (confirmedBy: string) => confirmShipment(shipmentId, confirmedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.byId(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}

export function useRecalculateShipment(shipmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => recalculateShipment(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.byId(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentsQueryKeys.all() })
    },
  })
}
