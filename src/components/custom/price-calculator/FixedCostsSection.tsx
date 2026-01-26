'use client'

import { Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FieldTooltip } from './FieldTooltip'
import { numericFieldOptions } from '@/lib/form-utils'
import { formatCurrency } from '@/lib/utils'
import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form'
import type { FulfillmentType } from '@/types/price-calculator'

/**
 * Props for FixedCostsSection component
 * Uses generic T to accept any form data type that includes the required fields
 */
export interface FixedCostsSectionProps<T extends FieldValues> {
  /** React Hook Form register function */
  register: UseFormRegister<T>
  /** Form validation errors */
  errors: FieldErrors<T>
  /** Disable all inputs */
  disabled?: boolean
  /** Current fulfillment type - affects storage field visibility */
  fulfillmentType: FulfillmentType
  /** Auto-filled logistics forward value (controlled) */
  logisticsForwardValue?: number
  /** Whether logistics forward was auto-filled */
  isLogisticsAutoFilled?: boolean
  /** Callback when logistics forward is manually changed */
  onLogisticsForwardChange?: (value: number) => void
  /** Auto-filled logistics reverse value (controlled) */
  logisticsReverseValue?: number
  /** Whether logistics reverse was auto-filled */
  isLogisticsReverseAutoFilled?: boolean
  /** Callback when logistics reverse is manually changed */
  onLogisticsReverseChange?: (value: number) => void
}

/**
 * Fixed costs input section for price calculator
 * Includes: COGS, logistics forward/reverse, storage
 *
 * Story 44.2-FE: Input Form Component
 * Story 44.15-FE: Storage field conditional on FBO fulfillment type
 */
export function FixedCostsSection<T extends FieldValues>({
  register,
  errors,
  disabled = false,
  fulfillmentType,
  logisticsForwardValue,
  isLogisticsAutoFilled = false,
  onLogisticsForwardChange,
  logisticsReverseValue,
  isLogisticsReverseAutoFilled = false,
  onLogisticsReverseChange,
}: FixedCostsSectionProps<T>) {
  // Cast field names to Path<T> for type safety with generic forms
  const cogsField = 'cogs_rub' as Path<T>
  const logisticsForwardField = 'logistics_forward_rub' as Path<T>
  const logisticsReverseField = 'logistics_reverse_rub' as Path<T>
  const storageField = 'storage_rub' as Path<T>

  // Use controlled value if provided (auto-fill mode)
  const isControlled = logisticsForwardValue !== undefined && logisticsForwardValue > 0
  const isReverseControlled = logisticsReverseValue !== undefined && logisticsReverseValue > 0

  return (
    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-l-blue-400">
      {/* Story 44.30: Updated header to text-base font-semibold */}
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-4 w-4 text-blue-600" aria-hidden="true" />
        <h3 className="text-base font-semibold text-blue-900">Фиксированные затраты (₽)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* COGS */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="cogs_rub" className="flex-1">
              Себестоимость (COGS)
            </Label>
            <FieldTooltip content="Закупочная цена товара у поставщика или стоимость производства одной единицы. Включите все прямые затраты: материалы, упаковку, маркировку." />
          </div>
          <Input
            id="cogs_rub"
            type="number"
            step="0.01"
            min={0}
            placeholder="0,00"
            disabled={disabled}
            {...register(cogsField, numericFieldOptions({
              required: 'Себестоимость обязательна',
              min: { value: 0, message: 'Себестоимость не может быть отрицательной' },
            }))}
          />
          {/* Story 44.30: Added role="alert" for screen reader announcement */}
          {errors.cogs_rub && (
            <p className="text-sm text-destructive" role="alert">
              {(errors.cogs_rub as { message?: string })?.message}
            </p>
          )}
        </div>

        {/* Logistics Forward */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="logistics_forward_rub">Логистика к клиенту</Label>
            {isLogisticsAutoFilled && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Автозаполнено
              </Badge>
            )}
            <FieldTooltip content="Стоимость доставки товара от склада WB до покупателя. Зависит от объема товара и коэффициента выбранного склада." />
          </div>
          {isControlled ? (
            <>
              <Input
                id="logistics_forward_rub"
                type="number"
                step="0.01"
                min={0}
                placeholder="0,00"
                disabled={disabled}
                value={logisticsForwardValue}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  onLogisticsForwardChange?.(value)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Рассчитано: {formatCurrency(logisticsForwardValue ?? 0)}
              </p>
            </>
          ) : (
            <Input
              id="logistics_forward_rub"
              type="number"
              step="0.01"
              min={0}
              placeholder="0,00"
              disabled={disabled}
              {...register(logisticsForwardField, numericFieldOptions({
                required: 'Обязательное поле',
                min: { value: 0, message: 'Не может быть отрицательным' },
              }))}
            />
          )}
          {/* Story 44.30: Added role="alert" for screen reader announcement */}
          {errors.logistics_forward_rub && (
            <p className="text-sm text-destructive" role="alert">
              {(errors.logistics_forward_rub as { message?: string })?.message}
            </p>
          )}
        </div>

        {/* Logistics Reverse */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="logistics_reverse_rub">Логистика возврата</Label>
            {isLogisticsReverseAutoFilled && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Автозаполнено
              </Badge>
            )}
            <FieldTooltip content="Стоимость возврата товара от покупателя на склад WB. Формула: 50₽ (первый литр) + 25₽ за каждый дополнительный литр. Применяется с учетом процента выкупа." />
          </div>
          {isReverseControlled ? (
            <>
              <Input
                id="logistics_reverse_rub"
                type="number"
                step="0.01"
                min={0}
                placeholder="0,00"
                disabled={disabled}
                value={logisticsReverseValue}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  onLogisticsReverseChange?.(value)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Рассчитано: {formatCurrency(logisticsReverseValue ?? 0)}
              </p>
            </>
          ) : (
            <Input
              id="logistics_reverse_rub"
              type="number"
              step="0.01"
              min={0}
              placeholder="0,00"
              disabled={disabled}
              {...register(logisticsReverseField, numericFieldOptions({
                required: 'Обязательное поле',
                min: { value: 0, message: 'Не может быть отрицательным' },
              }))}
            />
          )}
          {/* Story 44.30: Added role="alert" for screen reader announcement */}
          {errors.logistics_reverse_rub && (
            <p className="text-sm text-destructive" role="alert">
              {(errors.logistics_reverse_rub as { message?: string })?.message}
            </p>
          )}
        </div>

        {/* Storage - FBO only (Story 44.15) */}
        {fulfillmentType === 'FBO' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="storage_rub">Хранение</Label>
              <FieldTooltip content="Ежемесячная стоимость хранения одной единицы на складе WB. Рассчитывается как: (объём × тариф × дней) / 30. Узнать тариф можно в ЛК WB. Только для FBO." />
            </div>
            <Input
              id="storage_rub"
              type="number"
              step="0.01"
              min={0}
              placeholder="0,00"
              disabled={disabled}
              {...register(storageField, numericFieldOptions({
                min: { value: 0, message: 'Не может быть отрицательным' },
              }))}
            />
          </div>
        )}
      </div>
    </div>
  )
}
