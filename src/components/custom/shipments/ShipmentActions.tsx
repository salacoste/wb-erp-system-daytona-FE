'use client'

/** Shipment action buttons for DRAFT and CONFIRMED states (Epic 76-FE, Story 76.5) */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calculator, CheckCircle, Loader2, Pencil, RefreshCw } from 'lucide-react'
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
import { ShipmentEditDialog } from './ShipmentEditDialog'
import { ShipmentDeleteDialog } from './ShipmentDeleteDialog'

interface ShipmentActionsProps {
  shipment: Shipment
  onCalculateStart?: () => void
  onCalculateSuccess?: (result: CalculateShipmentResponse) => void
  onCalculateError?: (errors: ValidationError[]) => void
}

export function ShipmentActions({
  shipment,
  onCalculateStart,
  onCalculateSuccess,
  onCalculateError,
}: ShipmentActionsProps) {
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
  const [isEditOpen, setIsEditOpen] = useState(false)

  const isDraft = shipment.status === ShipmentStatus.DRAFT
  const canRecalculate = userRole === 'Owner' || userRole === 'Manager' || userRole === 'Service'

  function handleMutationError(err: unknown, label: string) {
    const errors = extractValidationErrors(err)
    if (errors) {
      onCalculateError?.(errors)
      return
    }
    toast.error(label)
  }

  async function handleDelete() {
    try {
      await deleteAsync(shipment.id)
      router.push(ROUTES.SHIPMENTS.ROOT)
    } catch {
      // Error handled by TanStack Query
    }
  }

  async function handleCalculate() {
    onCalculateStart?.()
    try {
      const result = await calculateAsync()
      onCalculateSuccess?.(result)
    } catch (err: unknown) {
      handleMutationError(err, 'Ошибка при расчёте')
    }
  }

  async function handleConfirm() {
    if (!userEmail) {
      toast.error('Не удалось определить пользователя')
      return
    }
    onCalculateStart?.()
    try {
      await confirmAsync(userEmail)
      toast.success('Отправка подтверждена')
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Отправка уже подтверждена')
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
    try {
      await recalculateAsync()
      toast.success('Пересчёт выполнен')
    } catch (err: unknown) {
      handleMutationError(err, 'Ошибка при пересчёте')
    }
  }

  if (!isDraft) {
    return (
      <>
        {canRecalculate && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              aria-label="Пересчитать стоимость"
            >
              {isRecalculating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              {isRecalculating ? 'Пересчёт...' : 'Пересчитать'}
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
          <Pencil className="h-4 w-4 mr-1" />
          Редактировать
        </Button>
        <Button
          size="sm"
          onClick={handleCalculate}
          disabled={isCalculating}
          aria-label="Рассчитать стоимость"
        >
          {isCalculating ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4 mr-1" />
          )}
          {isCalculating ? 'Расчёт...' : 'Рассчитать'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleConfirm}
          disabled={isConfirming}
          aria-label="Подтвердить отправку"
        >
          {isConfirming ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1" />
          )}
          {isConfirming ? 'Подтверждение...' : 'Подтвердить'}
        </Button>
        <ShipmentDeleteDialog isDeleting={isDeleting} onDelete={handleDelete} />
      </div>
      <ShipmentEditDialog
        shipment={shipment}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  )
}
