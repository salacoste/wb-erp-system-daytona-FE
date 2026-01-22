'use client'

import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { BoxDeliveryTariffs } from '@/lib/logistics-tariff'
import type { TariffValidation } from '@/lib/logistics-tariff-constants'

interface TariffInputFieldsProps {
  tariffs: BoxDeliveryTariffs
  onChange: (field: keyof BoxDeliveryTariffs, value: number) => void
  onReset: () => void
  disabled?: boolean
  validation: TariffValidation
}

/**
 * Editable tariff input fields component
 * Story 44.8-FE: AC1 - Inputs for base_liter_rub, additional_liter_rub, coefficient
 *
 * Validation rules (AC4):
 * - All values > 0
 * - coefficient 0.5-3.0
 */
export function TariffInputFields({
  tariffs,
  onChange,
  onReset,
  disabled = false,
  validation,
}: TariffInputFieldsProps) {
  // Internal state for inputs to handle controlled input in tests
  const [baseValue, setBaseValue] = useState(String(tariffs.baseLiterRub || ''))
  const [additionalValue, setAdditionalValue] = useState(String(tariffs.additionalLiterRub || ''))
  const [coeffValue, setCoeffValue] = useState(String(tariffs.coefficient || ''))

  // Sync internal state when tariffs prop changes (e.g., on reset)
  useEffect(() => {
    setBaseValue(String(tariffs.baseLiterRub || ''))
    setAdditionalValue(String(tariffs.additionalLiterRub || ''))
    setCoeffValue(String(tariffs.coefficient || ''))
  }, [tariffs.baseLiterRub, tariffs.additionalLiterRub, tariffs.coefficient])

  const handleChange = (field: keyof BoxDeliveryTariffs, setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      setter(rawValue)
      const value = parseFloat(rawValue) || 0
      onChange(field, value)
    }

  return (
    <div className="space-y-3">
      {/* Header with reset button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Параметры тарифа</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={disabled}
          className="h-7 px-2 text-xs"
          title="Сбросить к значениям по умолчанию"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Сбросить
        </Button>
      </div>

      {/* Base liter rate - Базовый тариф */}
      <div className="space-y-1 relative" data-field="base">
        <Label htmlFor="tariff_base_liter" className="text-xs">
          Базовый тариф (1-й литр)
        </Label>
        <Input
          id="tariff_base_liter"
          type="number"
          value={baseValue}
          onChange={handleChange('baseLiterRub', setBaseValue)}
          disabled={disabled}
          className="pr-6 h-8 text-sm"
          min={validation.minBaseLiter}
          max={validation.maxBaseLiter}
          step={1}
          placeholder="48"
          aria-describedby="base-liter-unit"
        />
        <span id="base-liter-unit" className="absolute right-2 bottom-1 text-xs text-muted-foreground">
          ₽
        </span>
      </div>

      {/* Additional liter rate - Доп. литр */}
      <div className="space-y-1 relative" data-field="additional">
        <Label htmlFor="tariff_additional_liter" className="text-xs">
          Доп. литр
        </Label>
        <Input
          id="tariff_additional_liter"
          type="number"
          value={additionalValue}
          onChange={handleChange('additionalLiterRub', setAdditionalValue)}
          disabled={disabled}
          className="pr-6 h-8 text-sm"
          min={validation.minAdditionalLiter}
          max={validation.maxAdditionalLiter}
          step={0.1}
          placeholder="5"
          aria-describedby="additional-liter-unit"
        />
        <span id="additional-liter-unit" className="absolute right-2 bottom-1 text-xs text-muted-foreground">
          ₽
        </span>
      </div>

      {/* Coefficient - Коэффициент */}
      <div className="space-y-1 relative" data-field="coefficient">
        <Label htmlFor="tariff_coefficient" className="text-xs">
          Коэффициент склада
        </Label>
        <Input
          id="tariff_coefficient"
          type="number"
          value={coeffValue}
          onChange={handleChange('coefficient', setCoeffValue)}
          disabled={disabled}
          className="pr-6 h-8 text-sm"
          min={validation.minCoefficient}
          max={validation.maxCoefficient}
          step={0.05}
          placeholder="1.0"
          aria-describedby="coefficient-hint"
        />
        <span className="absolute right-2 bottom-1 text-xs text-muted-foreground">
          ×
        </span>
      </div>

      {/* Validation hints */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p id="coefficient-hint">
          Допустимый диапазон: {validation.minCoefficient} — {validation.maxCoefficient}
        </p>
        <p>
          По умолчанию: 48 ₽ + 5 ₽/л × 1.0
        </p>
      </div>
    </div>
  )
}
