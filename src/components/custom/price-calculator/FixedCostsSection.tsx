'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldTooltip } from './FieldTooltip'
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
}: FixedCostsSectionProps<T>) {
  // Cast field names to Path<T> for type safety with generic forms
  const cogsField = 'cogs_rub' as Path<T>
  const logisticsForwardField = 'logistics_forward_rub' as Path<T>
  const logisticsReverseField = 'logistics_reverse_rub' as Path<T>
  const storageField = 'storage_rub' as Path<T>

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Фиксированные затраты (₽)
      </h3>

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
            {...register(cogsField, {
              valueAsNumber: true,
              required: 'Себестоимость обязательна',
              min: { value: 0, message: 'Себестоимость не может быть отрицательной' },
            })}
          />
          {errors.cogs_rub && (
            <p className="text-sm text-destructive">
              {(errors.cogs_rub as { message?: string })?.message}
            </p>
          )}
        </div>

        {/* Logistics Forward */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="logistics_forward_rub">Логистика до склада</Label>
            <FieldTooltip content="Стоимость доставки одной единицы товара до склада Wildberries (FBO). Узнать можно в личном кабинете WB в разделе «Логистика»." />
          </div>
          <Input
            id="logistics_forward_rub"
            type="number"
            step="0.01"
            min={0}
            placeholder="0,00"
            disabled={disabled}
            {...register(logisticsForwardField, {
              valueAsNumber: true,
              required: 'Обязательное поле',
              min: { value: 0, message: 'Не может быть отрицательным' },
            })}
          />
          {errors.logistics_forward_rub && (
            <p className="text-sm text-destructive">
              {(errors.logistics_forward_rub as { message?: string })?.message}
            </p>
          )}
        </div>

        {/* Logistics Reverse */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="logistics_reverse_rub">Логистика возврата</Label>
            <FieldTooltip content="Стоимость обратной логистики при возврате товара покупателем. Обычно равна или выше стоимости прямой логистики." />
          </div>
          <Input
            id="logistics_reverse_rub"
            type="number"
            step="0.01"
            min={0}
            placeholder="0,00"
            disabled={disabled}
            {...register(logisticsReverseField, {
              valueAsNumber: true,
              required: 'Обязательное поле',
              min: { value: 0, message: 'Не может быть отрицательным' },
            })}
          />
          {errors.logistics_reverse_rub && (
            <p className="text-sm text-destructive">
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
              {...register(storageField, {
                valueAsNumber: true,
                min: { value: 0, message: 'Не может быть отрицательным' },
              })}
            />
          </div>
        )}
      </div>
    </div>
  )
}
