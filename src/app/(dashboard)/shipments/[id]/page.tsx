'use client'

/**
 * Shipment Detail Page
 * Epic 76-FE, Story 76.2: Header + Pallet Accordion
 * Story 76.4: Calculate + Validation Error Display
 * Route: /shipments/:id
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/product/PageHeader'
import { PageState } from '@/components/product/states/PageState'
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
import { ApiError } from '@/types/api'
import { ROUTES } from '@/lib/routes'

const DETAIL_BREADCRUMBS = [
  { label: 'Главная', href: ROUTES.DASHBOARD },
  { label: 'Отправки', href: ROUTES.SHIPMENTS.ROOT },
  { label: 'Детали отправки' },
]

function DetailRouteHeader() {
  return <PageHeader title="Детали отправки" breadcrumbs={DETAIL_BREADCRUMBS} compact />
}

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>()
  const shipmentId = params.id
  const { data: shipment, isLoading, isError, error, refetch } = useShipment(shipmentId)
  const [calcResults, setCalcResults] = useState<CalculationResultItem[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [calculationLimitation, setCalculationLimitation] = useState<string | null>(null)
  const validationSummaryRef = useRef<HTMLDivElement>(null)
  const expectedNmIds = new Set(
    shipment?.pallets.flatMap(pallet => pallet.boxLines.map(line => line.nmId)) ?? []
  )

  useEffect(() => {
    if (validationErrors.length > 0) validationSummaryRef.current?.focus()
  }, [validationErrors])

  function handleCalculateStart() {
    setCalcResults([])
    setValidationErrors([])
    setCalculationLimitation(null)
  }

  function handleCalculateSuccess(result: CalculateShipmentResponse) {
    // Keep the detail usable when the live service omits or only partially fills `results`.
    const detailedResults = Array.isArray(result.results) ? result.results : []
    const resultNmIds = new Set(detailedResults.map(item => item.nmId))
    const hasDetailedResults =
      expectedNmIds.size > 0 && [...expectedNmIds].every(nmId => resultNmIds.has(nmId))
    setCalcResults(detailedResults)
    setValidationErrors([])
    setCalculationLimitation(
      hasDetailedResults
        ? null
        : detailedResults.length > 0
          ? 'Расчёт завершён, но детализация получена не для всех товаров.'
          : 'Расчёт завершён, но детализация по товарам недоступна в ответе сервиса.'
    )
  }

  function handleCalculateError(errors: ValidationError[]) {
    setValidationErrors(errors)
    setCalcResults([])
    setCalculationLimitation(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DetailRouteHeader />
        <PageState
          state="loading"
          title="Загрузка отправки"
          explanation="Получаем состав, стоимость и состояние отправки."
          trust="Идентификатор маршрута сохранён; действия появятся после загрузки данных."
        />
      </div>
    )
  }

  if (isError || !shipment) {
    const isNotFound = error instanceof ApiError && error.status === 404

    return (
      <div className="space-y-6">
        <DetailRouteHeader />
        {isNotFound ? (
          <PageState
            state="not-found"
            title="Отправка не найдена"
            explanation="Запрошенная отправка не существует или больше недоступна."
            trust="Данные других отправок не затронуты."
            action={
              <Button asChild variant="outline">
                <Link href={ROUTES.SHIPMENTS.ROOT}>Вернуться к отправкам</Link>
              </Button>
            }
          />
        ) : (
          <PageState
            state="error"
            title="Не удалось загрузить отправку"
            explanation="Сервис временно не вернул детали отправки."
            trust="Изменения не выполнялись; запрос можно безопасно повторить."
            recovery={
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Повторить
              </Button>
            }
          />
        )}
      </div>
    )
  }

  const isDraft = shipment.status === ShipmentStatus.DRAFT
  const highlightedLineIds = getAffectedBoxLineIds(validationErrors)
  const boxLines = shipment.pallets.flatMap(pallet => pallet.boxLines)
  const calculatedLineCount = boxLines.filter(line => line.finalCostPerUnit !== null).length
  const hasStoredPartialCalculation =
    calculatedLineCount > 0 && calculatedLineCount < boxLines.length
  const partialLimitation =
    calculationLimitation ??
    (hasStoredPartialCalculation
      ? 'Стоимость рассчитана не для всех товарных строк. Недоступные значения обозначены прочерком.'
      : null)
  const palletContent = (
    <PalletAccordion
      shipmentId={shipmentId}
      pallets={shipment.pallets}
      isDraft={isDraft}
      highlightedLineIds={highlightedLineIds}
    />
  )

  return (
    <div className="space-y-6">
      <ShipmentDetailHeader
        shipment={shipment}
        onCalculateStart={handleCalculateStart}
        onCalculateSuccess={handleCalculateSuccess}
        onCalculateError={handleCalculateError}
      />
      <div
        ref={validationSummaryRef}
        tabIndex={-1}
        aria-label={validationErrors.length ? 'Сводка ошибок валидации' : undefined}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ValidationErrorPanel errors={validationErrors} />
      </div>
      <CalculationResults results={calcResults} />
      {partialLimitation ? (
        <PageState
          state="partial"
          title="Расчёт выполнен частично"
          explanation="Доступные данные сохранены в контексте отправки."
          trust="Исходный состав паллет и товарных строк не изменён."
          limitation={partialLimitation}
        >
          {palletContent}
        </PageState>
      ) : (
        palletContent
      )}
    </div>
  )
}
