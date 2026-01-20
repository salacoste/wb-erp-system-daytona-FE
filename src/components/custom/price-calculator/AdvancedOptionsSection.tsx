'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { FieldTooltip } from './FieldTooltip'
import { ChevronDown } from 'lucide-react'
import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form'

/**
 * Props for AdvancedOptionsSection component
 * Uses generic T to accept any form data type that includes the required fields
 */
export interface AdvancedOptionsSectionProps<T extends FieldValues> {
  /** React Hook Form register function */
  register: UseFormRegister<T>
  /** Form validation errors */
  errors: FieldErrors<T>
  /** Current VAT percentage value */
  vatValue: number
  /** Callback when VAT value changes */
  onVatChange: (value: number) => void
  /** Whether section is expanded */
  isOpen: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Disable all inputs */
  disabled?: boolean
}

/**
 * Advanced options collapsible section for price calculator
 * Includes: VAT, acquiring, commission override, nm_id override
 *
 * Story 44.2-FE: Input Form Component
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 */
export function AdvancedOptionsSection<T extends FieldValues>({
  register,
  errors,
  vatValue,
  onVatChange,
  isOpen,
  onOpenChange,
  disabled = false,
}: AdvancedOptionsSectionProps<T>) {
  // Cast field names to Path<T> for type safety with generic forms
  const acquiringField = 'acquiring_pct' as Path<T>
  const commissionField = 'commission_pct' as Path<T>
  const nmIdField = 'nm_id' as Path<T>

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="flex w-full items-center justify-between p-0 h-auto text-left hover:bg-muted/50"
        >
          <span className="text-sm font-medium">Дополнительные параметры</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* VAT % - using shadcn/ui Select */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="vat_pct">НДС %</Label>
              <FieldTooltip content="Ставка налога на добавленную стоимость. 0% — для самозанятых и ИП на УСН, 10% — для продуктов и детских товаров, 20% — стандартная ставка." />
            </div>
            <Select
              value={vatValue?.toString() ?? '20'}
              onValueChange={(value) => onVatChange(Number(value))}
              disabled={disabled}
            >
              <SelectTrigger id="vat_pct">
                <SelectValue placeholder="Выберите ставку НДС" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (УСН, самозанятые)</SelectItem>
                <SelectItem value="10">10% (продукты, детские)</SelectItem>
                <SelectItem value="20">20% (стандартная)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Acquiring % */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="acquiring_pct">Эквайринг %</Label>
              <FieldTooltip content="Комиссия за обработку онлайн-платежей. Wildberries удерживает ~1,5-2% от суммы заказа. По умолчанию: 1,8%." />
            </div>
            <Input
              id="acquiring_pct"
              type="number"
              step={0.1}
              min={0}
              max={10}
              placeholder="1,8"
              disabled={disabled}
              {...register(acquiringField, {
                valueAsNumber: true,
                min: { value: 0, message: 'Не может быть отрицательным' },
                max: { value: 10, message: 'Максимум 10%' },
              })}
            />
          </div>

          {/* Override Commission % */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="commission_pct">Комиссия WB % (переопределение)</Label>
              <FieldTooltip content="Комиссия маркетплейса за продажу. Зависит от категории товара (5-15%). Оставьте пустым для использования стандартной комиссии вашей категории." />
            </div>
            <Input
              id="commission_pct"
              type="number"
              step={0.1}
              min={0}
              max={30}
              placeholder="По умолчанию"
              disabled={disabled}
              {...register(commissionField, {
                valueAsNumber: true,
                min: { value: 0, message: 'Не может быть отрицательной' },
                max: { value: 30, message: 'Максимум 30%' },
              })}
            />
          </div>
        </div>

        {/* Override Product ID */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="nm_id">Артикул WB (переопределение)</Label>
            <FieldTooltip content="Номенклатурный код товара (nm_id) для расчёта с учётом его специфической комиссии. Оставьте пустым для общего расчёта." />
          </div>
          <Input
            id="nm_id"
            type="number"
            min={0}
            placeholder="Любой товар"
            disabled={disabled}
            {...register(nmIdField, {
              valueAsNumber: true,
              min: { value: 1, message: 'Должен быть положительным' },
            })}
          />
          {errors.nm_id && (
            <p className="text-sm text-destructive">
              {(errors.nm_id as { message?: string })?.message}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
