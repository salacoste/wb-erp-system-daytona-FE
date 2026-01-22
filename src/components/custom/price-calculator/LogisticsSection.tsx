'use client'

import { DimensionInputSection } from './DimensionInputSection'
import { LogisticsTariffDisplay } from './LogisticsTariffDisplay'
import { LogisticsCoefficientsSection } from './LogisticsCoefficientsSection'
import { ReturnLogisticsSection } from './ReturnLogisticsSection'
import { hasValidDimensions, type ProductDimensions } from '@/lib/dimension-utils'
import type { UseFormRegister, FieldErrors, FieldValues } from 'react-hook-form'

interface LogisticsSectionProps<T extends FieldValues> {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  dimensions: ProductDimensions
  volumeLiters: number
  warehouseId: number | null
  logisticsForward: number
  logisticsReverse: number
  buybackPct: number
  onLogisticsForwardChange: (value: number) => void
  onLogisticsReverseChange: (value: number) => void
  disabled?: boolean
}

/**
 * Logistics section combining all Phase 2 logistics components
 * Stories 44.7, 44.8, 44.9, 44.10
 */
export function LogisticsSection<T extends FieldValues>({
  register,
  errors,
  dimensions,
  volumeLiters,
  warehouseId,
  logisticsForward,
  logisticsReverse,
  buybackPct,
  onLogisticsForwardChange,
  onLogisticsReverseChange,
  disabled = false,
}: LogisticsSectionProps<T>) {
  const hasDimensions = hasValidDimensions(dimensions)

  return (
    <div className="space-y-4">
      {/* Story 44.7: Dimension inputs for volume calculation */}
      <DimensionInputSection
        register={register}
        errors={errors}
        disabled={disabled}
        dimensions={dimensions}
      />

      {/* Story 44.8: Logistics tariff calculation (only when dimensions provided) */}
      {hasDimensions && (
        <LogisticsTariffDisplay
          volumeLiters={volumeLiters}
          coefficient={1.0}
          value={logisticsForward}
          onChange={onLogisticsForwardChange}
          warehouseName={warehouseId ? `Склад ${warehouseId}` : undefined}
          disabled={disabled}
        />
      )}

      {/* Story 44.9: Logistics coefficients */}
      <LogisticsCoefficientsSection
        warehouseId={warehouseId}
        coefficient={1.0}
        source="auto"
        baseLogisticsCost={logisticsForward}
        disabled={disabled}
      />

      {/* Story 44.10: Return logistics calculation */}
      <ReturnLogisticsSection
        forwardLogistics={logisticsForward}
        buybackPct={buybackPct}
        value={logisticsReverse}
        onChange={onLogisticsReverseChange}
        disabled={disabled}
      />
    </div>
  )
}
