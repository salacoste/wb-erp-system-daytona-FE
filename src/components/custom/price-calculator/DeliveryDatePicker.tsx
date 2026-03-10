'use client'

/**
 * DeliveryDatePicker Component
 * Story 44.26a-FE: Delivery Date Selection
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Date picker for selecting delivery date with coefficient calendar.
 * When a date is selected, passes full supply tariff data for that date
 * to support the two tariff systems (INVENTORY vs SUPPLY).
 *
 * Epic 74: Split into co-located modules for file size compliance.
 */

import { Calendar } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CoefficientCalendar } from './CoefficientCalendar'
import { AcceptanceStatusBadge } from './AcceptanceStatusBadge'
import { formatDateLongRu } from '@/lib/coefficient-utils'
import { cn } from '@/lib/utils'
import { useDeliveryDatePickerState } from './useDeliveryDatePickerState'
import {
  BoxTypeTabs,
  DeliveryDatePickerSkeleton,
  DeliveryDatePickerError,
  DeliveryDateHelpPopover,
} from './DeliveryDatePickerParts'
import type { DeliveryDatePickerProps } from './delivery-date-picker-types'

// Re-export public types for backward compatibility
export type {
  ExtendedDailyCoefficient,
  DeliveryDatePickerProps,
} from './delivery-date-picker-types'

/**
 * Delivery date picker with coefficient display and calendar
 * Story 44.26a-FE: Date selection for logistics calculation
 *
 * Features:
 * - Shows selected date in Russian long format
 * - Displays coefficient next to date
 * - Collapsible calendar with click-to-select
 * - Auto-selects tomorrow or first available date
 * - Box type tabs (Коробы, Монопалеты, Суперсейф) when data available
 */
export function DeliveryDatePicker({
  coefficients,
  byBoxType = [],
  selectedDate,
  onDateSelect,
  onDateSelectWithTariffs,
  supplyTariffsMap,
  isLoading = false,
  error = null,
  label = 'Дата сдачи товара',
  showHint = true,
  showFallback: _showFallback = false,
}: DeliveryDatePickerProps) {
  const {
    selectedBoxType,
    setSelectedBoxType,
    activeCoefficients,
    hasNoApiData,
    selectedCoefficient,
    effectiveDate,
    hasAvailableDates,
    hasMultipleBoxTypes,
    handleDateSelect,
  } = useDeliveryDatePickerState({
    coefficients,
    byBoxType,
    selectedDate,
    onDateSelect,
    onDateSelectWithTariffs,
    supplyTariffsMap,
  })

  if (isLoading) {
    return <DeliveryDatePickerSkeleton label={label} />
  }

  if (error) {
    return <DeliveryDatePickerError message={error} label={label} />
  }

  // Story 44.XX: Show error when API returns no data (should always return coefficients)
  if (hasNoApiData) {
    return (
      <DeliveryDatePickerError
        message="API не вернул данные о коэффициентах приёмки для этого склада"
        label={label}
      />
    )
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {showHint && <DeliveryDateHelpPopover />}
      </Label>

      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-md border',
              'bg-background hover:bg-accent/50 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Выбрать дату сдачи товара"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {effectiveDate ? formatDateLongRu(effectiveDate) : 'Выберите дату'}
              </span>
            </div>

            {selectedCoefficient && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">Коэфф. приёмки:</span>
                <AcceptanceStatusBadge
                  coefficient={selectedCoefficient.coefficient}
                  size="sm"
                  showTooltip={false}
                />
              </div>
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <div className="p-3 border rounded-md bg-muted/20 space-y-3">
            {/* Box Type Tabs */}
            {hasMultipleBoxTypes && (
              <BoxTypeTabs
                boxTypes={byBoxType}
                selectedBoxType={selectedBoxType}
                onBoxTypeChange={setSelectedBoxType}
              />
            )}

            {/* Calendar - Story 44.40: Uses handleDateSelect to include supply tariffs */}
            {hasAvailableDates ? (
              <CoefficientCalendar
                coefficients={activeCoefficients}
                selectedDate={effectiveDate}
                onDateSelect={handleDateSelect}
                maxDays={15}
              />
            ) : (
              <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                Нет доступных дат для типа «
                {byBoxType.find(b => b.boxType === selectedBoxType)?.label}»
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
