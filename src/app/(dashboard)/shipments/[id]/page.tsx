'use client'

/**
 * Shipment Detail Page
 * Epic 76-FE, Story 76.2: Header + Pallet Accordion
 * Story 76.4: Calculate + Validation Error Display
 * Route: /shipments/:id
 */

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useShipment } from '@/hooks/use-shipments'
import { ShipmentDetailHeader } from '@/components/custom/shipments/ShipmentDetailHeader'
import { PalletAccordion } from '@/components/custom/shipments/PalletAccordion'
import {
  ValidationErrorPanel,
  getAffectedBoxLineIds,
} from '@/components/custom/shipments/ValidationErrorPanel'
import { CalculationResults } from '@/components/custom/shipments/CalculationResults'
import {
  ShipmentStatus,
  type CalculateShipmentResponse,
  type CalculationResultItem,
  type ValidationError,
} from '@/types/shipment-cost'

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>()
  const shipmentId = params.id
  const { data: shipment, isLoading, isError, error, refetch } = useShipment(shipmentId)
  const [calcResults, setCalcResults] = useState<CalculationResultItem[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  function handleCalculateStart() {
    setCalcResults([])
    setValidationErrors([])
  }

  function handleCalculateSuccess(result: CalculateShipmentResponse) {
    setCalcResults(result.results)
    setValidationErrors([])
  }

  function handleCalculateError(errors: ValidationError[]) {
    setValidationErrors(errors)
    setCalcResults([])
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (isError || !shipment) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Детали отправки</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки отправки'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const isDraft = shipment.status === ShipmentStatus.DRAFT
  const highlightedLineIds = getAffectedBoxLineIds(validationErrors)

  return (
    <div className="space-y-6">
      <ShipmentDetailHeader
        shipment={shipment}
        onCalculateStart={handleCalculateStart}
        onCalculateSuccess={handleCalculateSuccess}
        onCalculateError={handleCalculateError}
      />
      <ValidationErrorPanel errors={validationErrors} />
      <CalculationResults results={calcResults} />
      <PalletAccordion
        shipmentId={shipmentId}
        pallets={shipment.pallets}
        isDraft={isDraft}
        highlightedLineIds={highlightedLineIds}
      />
    </div>
  )
}
