'use client'

import { Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FixedCostField } from './FixedCostField'
import { FixedCostLogisticsField } from './FixedCostLogisticsField'
import { numericFieldOptions } from '@/lib/form-utils'
import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form'
import type { FulfillmentType } from '@/types/price-calculator'

export interface FixedCostsSectionProps<T extends FieldValues> {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  disabled?: boolean
  fulfillmentType: FulfillmentType
  logisticsForwardValue?: number
  isLogisticsAutoFilled?: boolean
  onLogisticsForwardChange?: (value: number) => void
  logisticsReverseValue?: number
  isLogisticsReverseAutoFilled?: boolean
  onLogisticsReverseChange?: (value: number) => void
}

/**
 * Fixed costs input section for price calculator
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
  const cogsField = 'cogs_rub' as Path<T>
  const packagingField = 'packaging_rub' as Path<T>
  const logisticsToMpField = 'logistics_to_mp_rub' as Path<T>
  const logisticsForwardField = 'logistics_forward_rub' as Path<T>
  const logisticsReverseField = 'logistics_reverse_rub' as Path<T>
  const storageField = 'storage_rub' as Path<T>

  return (
    <div className="rounded-lg border-l-4 border-l-status-information bg-status-information/10 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-4 w-4 text-status-information" aria-hidden="true" />
        <div className="text-base font-semibold text-foreground">Фиксированные затраты (₽)</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* COGS */}
        <FixedCostField
          id="cogs_rub"
          label="Себестоимость (COGS)"
          tooltipContent="Закупочная цена товара у поставщика или стоимость производства одной единицы. Включите все прямые затраты: материалы, упаковку, маркировку."
          error={(errors.cogs_rub as { message?: string })?.message}
        >
          <Input
            id="cogs_rub"
            type="number"
            step="0.01"
            min={0}
            placeholder="0,00"
            disabled={disabled}
            {...register(
              cogsField,
              numericFieldOptions({
                required: 'Себестоимость обязательна',
                min: { value: 0, message: 'Себестоимость не может быть отрицательной' },
              })
            )}
          />
        </FixedCostField>

        {/* Packaging cost */}
        <FixedCostField
          id="packaging_rub"
          label="Упаковка"
          tooltipContent="Стоимость упаковки на короб/паллету. Делится на количество единиц в коробе. Например: 100₽ за короб с 10 шт = 10₽ за единицу."
          error={(errors.packaging_rub as { message?: string })?.message}
        >
          <Input
            id="packaging_rub"
            type="number"
            step="0.01"
            min={0}
            placeholder="0,00"
            disabled={disabled}
            {...register(
              packagingField,
              numericFieldOptions({ min: { value: 0, message: 'Не может быть отрицательным' } })
            )}
          />
        </FixedCostField>

        {/* Logistics to marketplace */}
        <FixedCostField
          id="logistics_to_mp_rub"
          label="Логистика до МП"
          tooltipContent="Стоимость доставки до склада WB на короб/паллету. Делится на количество единиц. Например: 500₽ за доставку короба с 50 шт = 10₽ за единицу."
          error={(errors.logistics_to_mp_rub as { message?: string })?.message}
        >
          <Input
            id="logistics_to_mp_rub"
            type="number"
            step="0.01"
            min={0}
            placeholder="0,00"
            disabled={disabled}
            {...register(
              logisticsToMpField,
              numericFieldOptions({ min: { value: 0, message: 'Не может быть отрицательным' } })
            )}
          />
        </FixedCostField>

        {/* Logistics Forward */}
        <FixedCostLogisticsField<T>
          register={register}
          errors={errors}
          disabled={disabled}
          id="logistics_forward_rub"
          label="Логистика к клиенту"
          fieldPath={logisticsForwardField}
          tooltipContent="Стоимость доставки товара от склада WB до покупателя. Зависит от объема товара и коэффициента выбранного склада."
          controlledValue={logisticsForwardValue}
          isAutoFilled={isLogisticsAutoFilled}
          onControlledChange={onLogisticsForwardChange}
        />

        {/* Logistics Reverse */}
        <FixedCostLogisticsField<T>
          register={register}
          errors={errors}
          disabled={disabled}
          id="logistics_reverse_rub"
          label="Логистика возврата"
          fieldPath={logisticsReverseField}
          tooltipContent="Стоимость возврата товара от покупателя на склад WB. Формула: 50₽ (первый литр) + 25₽ за каждый дополнительный литр. Применяется с учетом процента выкупа."
          controlledValue={logisticsReverseValue}
          isAutoFilled={isLogisticsReverseAutoFilled}
          onControlledChange={onLogisticsReverseChange}
        />

        {/* Storage - FBO only */}
        {fulfillmentType === 'FBO' && (
          <FixedCostField
            id="storage_rub"
            label="Хранение"
            tooltipContent="Ежемесячная стоимость хранения одной единицы на складе WB. Рассчитывается как: (объём × тариф × дней) / 30. Узнать тариф можно в ЛК WB. Только для FBO."
            error={(errors.storage_rub as { message?: string })?.message}
          >
            <Input
              id="storage_rub"
              type="number"
              step="0.01"
              min={0}
              placeholder="0,00"
              disabled={disabled}
              {...register(
                storageField,
                numericFieldOptions({ min: { value: 0, message: 'Не может быть отрицательным' } })
              )}
            />
          </FixedCostField>
        )}
      </div>
    </div>
  )
}
