'use client'

import { Ruler, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FieldTooltip } from './FieldTooltip'
import { AutoFillBadge } from './AutoFillBadge'
import { cn } from '@/lib/utils'
import { numericFieldOptions } from '@/lib/form-utils'
import {
  calculateVolumeLiters,
  detectCargoType,
  getMaxDimension,
  getCargoTypeConfig,
  getVolumeTier,
  formatVolume,
  hasValidDimensions,
  type ProductDimensions,
  type CargoType,
} from '@/lib/dimension-utils'
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
 * Cargo type badge component
 */
function CargoTypeBadge({ cargoType }: { cargoType: CargoType }) {
  const config = getCargoTypeConfig(cargoType)
  return (
    <Badge variant="outline" className={cn('font-mono text-xs', config.bgColor, config.textColor)}>
      {config.label}
    </Badge>
  )
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
  const cargoConfig = cargoType ? getCargoTypeConfig(cargoType) : null
  const isKgt = cargoType === 'KGT'
  const autoFillStatus = autoFillState?.status ?? 'none'

  return (
    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-l-purple-400">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-purple-600" aria-hidden="true" />
          <h3 className="text-sm font-medium text-purple-900">Габариты товара</h3>
          <AutoFillBadge status={autoFillStatus} onRestore={onRestore} />
        </div>
        <FieldTooltip content="Укажите размеры товара для автоматического расчёта объёма и определения типа груза (МГТ/СГТ/КГТ). Это влияет на тарифы логистики." />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Length */}
        <div className="space-y-1.5">
          <Label htmlFor="length_cm" className="text-xs">Длина, см</Label>
          <Input
            id="length_cm"
            type="number"
            step="0.1"
            min={0}
            max={300}
            placeholder="0,0"
            disabled={disabled}
            className="h-9"
            {...register(lengthField, numericFieldOptions({
              min: { value: 0, message: 'Мин. 0 см' },
              max: { value: 300, message: 'Макс. 300 см' },
              onChange: onDimensionChange,
            }))}
          />
          {errors.length_cm && (
            <p className="text-xs text-destructive">{(errors.length_cm as { message?: string })?.message}</p>
          )}
        </div>

        {/* Width */}
        <div className="space-y-1.5">
          <Label htmlFor="width_cm" className="text-xs">Ширина, см</Label>
          <Input
            id="width_cm"
            type="number"
            step="0.1"
            min={0}
            max={300}
            placeholder="0,0"
            disabled={disabled}
            className="h-9"
            {...register(widthField, numericFieldOptions({
              min: { value: 0, message: 'Мин. 0 см' },
              max: { value: 300, message: 'Макс. 300 см' },
              onChange: onDimensionChange,
            }))}
          />
          {errors.width_cm && (
            <p className="text-xs text-destructive">{(errors.width_cm as { message?: string })?.message}</p>
          )}
        </div>

        {/* Height */}
        <div className="space-y-1.5">
          <Label htmlFor="height_cm" className="text-xs">Высота, см</Label>
          <Input
            id="height_cm"
            type="number"
            step="0.1"
            min={0}
            max={300}
            placeholder="0,0"
            disabled={disabled}
            className="h-9"
            {...register(heightField, numericFieldOptions({
              min: { value: 0, message: 'Мин. 0 см' },
              max: { value: 300, message: 'Макс. 300 см' },
              onChange: onDimensionChange,
            }))}
          />
          {errors.height_cm && (
            <p className="text-xs text-destructive">{(errors.height_cm as { message?: string })?.message}</p>
          )}
        </div>
      </div>

      {/* Volume & Cargo Type Display */}
      <div className="space-y-2" aria-live="polite">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {cargoType && <CargoTypeBadge cargoType={cargoType} />}
            <span className="text-purple-800">Объём: {formatVolume(volumeLiters)}</span>
            {volumeLiters > 0 && volumeTier.tier !== 'standard' && (
              <Badge variant="outline" className={cn('text-xs',
                volumeTier.color === 'green' && 'bg-green-100 text-green-700',
                volumeTier.color === 'orange' && 'bg-orange-100 text-orange-700'
              )}>
                {volumeTier.label}
              </Badge>
            )}
          </div>
        </div>

        {hasDimensions && cargoConfig && (
          <p className="text-xs text-muted-foreground">
            Макс. габарит: {maxDimension} см {!isKgt && `(≤ ${cargoConfig.maxDimension} см)`}
          </p>
        )}

        {/* KGT Error Alert */}
        {isKgt && (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Крупногабаритный груз (КГТ) требует ручного ввода тарифов</p>
              <p className="text-xs mt-1">Макс. габарит: {maxDimension} см (превышает лимит 120 см)</p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
