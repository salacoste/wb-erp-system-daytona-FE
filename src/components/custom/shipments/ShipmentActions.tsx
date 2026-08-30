'use client'

/** Shipment action buttons for DRAFT and CONFIRMED states (Epic 76-FE, Story 76.5) */

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator, CheckCircle, Loader2, Pencil, RefreshCw } from 'lucide-react'
import type { Shipment, CalculateShipmentResponse } from '@/types/shipment-cost'
import { ShipmentEditDialog } from './ShipmentEditDialog'
import { ShipmentDeleteDialog } from './ShipmentDeleteDialog'
import { useShipmentActionHandlers } from './shipment-action-handlers'

interface ShipmentActionsProps {
  shipment: Shipment
  onCalculateStart?: () => void
  onCalculateSuccess?: (result: CalculateShipmentResponse) => void
  onCalculateError?: (errors: import('@/types/shipment-cost').ValidationError[]) => void
}

export function ShipmentActions({
  shipment,
  onCalculateStart,
  onCalculateSuccess,
  onCalculateError,
}: ShipmentActionsProps) {
  const {
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
  } = useShipmentActionHandlers(shipment, onCalculateStart, onCalculateSuccess, onCalculateError)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const editTriggerRef = useRef<HTMLButtonElement>(null)
  const liveStatus = (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </p>
  )

  if (!isDraft) {
    return (
      <>
        {liveStatus}
        {canRecalculate && (
          <div className="flex flex-wrap items-center gap-2">
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
      {liveStatus}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          ref={editTriggerRef}
          variant="outline"
          size="sm"
          onClick={() => setIsEditOpen(true)}
        >
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
        returnFocusRef={editTriggerRef}
      />
    </>
  )
}
