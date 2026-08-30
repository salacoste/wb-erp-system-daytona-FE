/**
 * Shipment action handler logic extracted from ShipmentActions
 * Epic 76-FE, Story 76.5
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useDeleteShipment } from '@/hooks/use-shipments'
import {
  useCalculateShipment,
  useConfirmShipment,
  useRecalculateShipment,
} from '@/hooks/use-shipment-calculations'
import { ApiError } from '@/types/api'
import { ROUTES } from '@/lib/routes'
import { extractValidationErrors } from '@/lib/shipment-validation-utils'
import {
  ShipmentStatus,
  type CalculateShipmentResponse,
  type Shipment,
  type ValidationError,
} from '@/types/shipment-cost'

export interface ShipmentActionHandlers {
  isDraft: boolean
  canRecalculate: boolean
  isDeleting: boolean
  isCalculating: boolean
  isConfirming: boolean
  isRecalculating: boolean
  announcement: string
  handleDelete: () => Promise<void>
  handleCalculate: () => Promise<void>
  handleConfirm: () => Promise<void>
  handleRecalculate: () => Promise<void>
}

export function useShipmentActionHandlers(
  shipment: Shipment,
  onCalculateStart?: () => void,
  onCalculateSuccess?: (result: CalculateShipmentResponse) => void,
  onCalculateError?: (errors: ValidationError[]) => void
): ShipmentActionHandlers {
  const router = useRouter()
  const queryClient = useQueryClient()
  const userRole = useAuthStore(state => state.user?.role)
  const userEmail = useAuthStore(state => state.user?.email)
  const { mutateAsync: deleteAsync, isPending: isDeleting } = useDeleteShipment()
  const { mutateAsync: calculateAsync, isPending: isCalculating } = useCalculateShipment(
    shipment.id
  )
  const { mutateAsync: confirmAsync, isPending: isConfirming } = useConfirmShipment(shipment.id)
  const { mutateAsync: recalculateAsync, isPending: isRecalculating } = useRecalculateShipment(
    shipment.id
  )
  const [announcement, setAnnouncement] = useState('')

  const isDraft = shipment.status === ShipmentStatus.DRAFT
  const canRecalculate = userRole === 'Owner' || userRole === 'Manager' || userRole === 'Service'

  function handleMutationError(err: unknown, label: string) {
    const errors = extractValidationErrors(err)
    if (errors) {
      onCalculateError?.(errors)
      setAnnouncement('Расчёт требует исправления данных')
      return
    }
    toast.error(label)
    setAnnouncement(label)
  }

  async function handleDelete() {
    setAnnouncement('Удаляем отправку')
    try {
      await deleteAsync(shipment.id)
      setAnnouncement('Отправка удалена')
      router.push(ROUTES.SHIPMENTS.ROOT)
    } catch {
      setAnnouncement('Не удалось удалить отправку')
      // Error handled by TanStack Query
    }
  }

  async function handleCalculate() {
    setAnnouncement('Выполняется расчёт стоимости')
    onCalculateStart?.()
    try {
      const result = await calculateAsync()
      onCalculateSuccess?.(result)
      setAnnouncement('Расчёт стоимости завершён')
    } catch (err: unknown) {
      handleMutationError(err, 'Ошибка при расчёте')
    }
  }

  async function handleConfirm() {
    if (!userEmail) {
      toast.error('Не удалось определить пользователя')
      setAnnouncement('Не удалось определить пользователя')
      return
    }
    setAnnouncement('Подтверждаем отправку')
    onCalculateStart?.()
    try {
      await confirmAsync(userEmail)
      toast.success('Отправка подтверждена')
      setAnnouncement('Отправка подтверждена')
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Отправка уже подтверждена')
        setAnnouncement('Отправка уже подтверждена')
        queryClient.invalidateQueries({ queryKey: ['shipments'] })
        return
      }
      handleMutationError(err, 'Ошибка при подтверждении')
    }
  }

  async function handleRecalculate() {
    // Note: onCalculateSuccess accepts CalculateShipmentResponse (per-SKU results),
    // but recalculateAsync returns RecalculateShipmentResponse (summary only —
    // no per-SKU breakdown). The two endpoint shapes are intentionally different
    // per src/types/shipment-cost.ts. Recalc flows trigger TanStack Query cache
    // invalidation in the hook itself; no callback propagation needed here.
    onCalculateStart?.()
    setAnnouncement('Выполняется пересчёт стоимости')
    try {
      await recalculateAsync()
      toast.success('Пересчёт выполнен')
      setAnnouncement('Пересчёт выполнен')
    } catch (err: unknown) {
      handleMutationError(err, 'Ошибка при пересчёте')
    }
  }

  return {
    isDraft,
    canRecalculate,
    isDeleting,
    isCalculating,
    isConfirming,
    isRecalculating,
    announcement,
    handleDelete,
    handleCalculate,
    handleConfirm,
    handleRecalculate,
  }
}
