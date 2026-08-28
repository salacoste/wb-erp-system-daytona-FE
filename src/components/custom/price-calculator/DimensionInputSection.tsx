'use client'

import { Ruler } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldTooltip } from './FieldTooltip'
import { AutoFillBadge } from './AutoFillBadge'
import { numericFieldOptions } from '@/lib/form-utils'
import {
  calculateVolumeLiters,
  detectCargoType,
  getMaxDimension,
  getVolumeTier,
  hasValidDimensions,
  type ProductDimensions,
} from '@/lib/dimension-utils'
import { DimensionSummary } from './DimensionDisplay'
import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form'
import type { DimensionAutoFillState } from '@/types/price-calculator'

export interface DimensionInputSectionProps<T extends FieldValues> {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  disabled?: boolean
  dimensions: ProductDimensions
  /** Auto-fill state for dimension values (Story 44.26b) */
  autoFillState?: DimensionAutoFillState
  /** Callback when restore is clicked (Story 44.26b) */
  onRestore?: () => void
  /** Callback when dimension value changes (for auto-fill tracking) */
  onDimensionChange?: () => void
}

/**
 * Dimension input section for price calculator
 * Story 44.7-FE: Dimension-Based Volume Calculation
 */
export function DimensionInputSection<T extends FieldValues>({
  register,
  errors,
  disabled = false,
  dimensions,
  autoFillState,
  onRestore,
  onDimensionChange,
}: DimensionInputSectionProps<T>) {
  const lengthField = 'length_cm' as Path<T>
  const widthField = 'width_cm' as Path<T>
  const heightField = 'height_cm' as Path<T>

  const hasDimensions = hasValidDimensions(dimensions)
  const volumeLiters = hasDimensions ? calculateVolumeLiters(dimensions) : 0
  const cargoType = hasDimensions ? detectCargoType(dimensions) : null
  const maxDimension = hasDimensions ? getMaxDimension(dimensions) : 0
  const volumeTier = getVolumeTier(volumeLiters)
  const isKgt = cargoType === 'KGT'
  const autoFillStatus = autoFillState?.status ?? 'none'
  const lengthError = (errors.length_cm as { message?: string })?.message
  const widthError = (errors.width_cm as { message?: string })?.message
  const heightError = (errors.height_cm as { message?: string })?.message

  return (
    <div className="rounded-lg border-l-4 border-l-primary bg-primary/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" aria-hidden="true" />
          <div className="text-sm font-medium text-foreground">Габариты товара</div>
          <AutoFillBadge status={autoFillStatus} onRestore={onRestore} />
        </div>
        <FieldTooltip content="Укажите размеры товара для автоматического расчёта объёма и определения типа груза (МГТ/СГТ/КГТ). Это влияет на тарифы логистики." />
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-3">
        {/* Length */}
        <div className="space-y-1.5">
          <Label htmlFor="length_cm" className="text-xs">
            Длина, см
          </Label>
          <Input
            id="length_cm"
            type="number"
            step="0.1"
            min={0}
            max={300}
            placeholder="0,0"
            disabled={disabled}
            className="h-9"
            aria-invalid={lengthError ? true : undefined}
            aria-describedby={lengthError ? 'length_cm-error' : undefined}
            {...register(
              lengthField,
              numericFieldOptions({
                min: { value: 0, message: 'Мин. 0 см' },
                max: { value: 300, message: 'Макс. 300 см' },
                onChange: onDimensionChange,
              })
            )}
          />
          {lengthError && (
            <p id="length_cm-error" className="text-xs text-destructive" role="alert">
              {lengthError}
            </p>
          )}
        </div>

        {/* Width */}
        <div className="space-y-1.5">
          <Label htmlFor="width_cm" className="text-xs">
            Ширина, см
          </Label>
          <Input
            id="width_cm"
            type="number"
            step="0.1"
            min={0}
            max={300}
            placeholder="0,0"
            disabled={disabled}
            className="h-9"
            aria-invalid={widthError ? true : undefined}
            aria-describedby={widthError ? 'width_cm-error' : undefined}
            {...register(
              widthField,
              numericFieldOptions({
                min: { value: 0, message: 'Мин. 0 см' },
                max: { value: 300, message: 'Макс. 300 см' },
                onChange: onDimensionChange,
              })
            )}
          />
          {widthError && (
            <p id="width_cm-error" className="text-xs text-destructive" role="alert">
              {widthError}
            </p>
          )}
        </div>

        {/* Height */}
        <div className="space-y-1.5">
          <Label htmlFor="height_cm" className="text-xs">
            Высота, см
          </Label>
          <Input
            id="height_cm"
            type="number"
            step="0.1"
            min={0}
            max={300}
            placeholder="0,0"
            disabled={disabled}
            className="h-9"
            aria-invalid={heightError ? true : undefined}
            aria-describedby={heightError ? 'height_cm-error' : undefined}
            {...register(
              heightField,
              numericFieldOptions({
                min: { value: 0, message: 'Мин. 0 см' },
                max: { value: 300, message: 'Макс. 300 см' },
                onChange: onDimensionChange,
              })
            )}
          />
          {heightError && (
            <p id="height_cm-error" className="text-xs text-destructive" role="alert">
              {heightError}
            </p>
          )}
        </div>
      </div>

      {/* Volume & Cargo Type Display */}
      <DimensionSummary
        cargoType={cargoType}
        volumeLiters={volumeLiters}
        maxDimension={maxDimension}
        volumeTier={volumeTier}
        isKgt={isKgt}
      />
    </div>
  )
}
