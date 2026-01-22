'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Settings, Truck, RotateCcw, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FieldTooltip } from './FieldTooltip'
import { TariffBreakdown } from './TariffBreakdown'
import { TariffInputFields } from './TariffInputFields'
import { AutoFillBadge } from './AutoFillBadge'
import { cn } from '@/lib/utils'
import { calculateLogisticsTariff, DEFAULT_BOX_TARIFFS, type BoxDeliveryTariffs } from '@/lib/logistics-tariff'
import { TARIFF_VALIDATION } from '@/lib/logistics-tariff-constants'

export interface LogisticsTariffCalculatorProps {
  volumeLiters: number
  value: number
  onChange: (value: number) => void
  warehouseName?: string
  warehouseTariffs?: { baseLiterRub: number; additionalLiterRub: number } | null
  warehouseCoefficient?: number
  disabled?: boolean
  isLoading?: boolean
}

/** Story 44.8-FE: Logistics tariff calculator with editable tariff inputs */
export function LogisticsTariffCalculator({
  volumeLiters,
  value,
  onChange,
  warehouseName,
  warehouseTariffs,
  warehouseCoefficient = 1.0,
  disabled = false,
  isLoading = false,
}: LogisticsTariffCalculatorProps) {
  const [autoCalculate, setAutoCalculate] = useState(true)
  const [showTariffInputs, setShowTariffInputs] = useState(false)
  // Internal state for manual input - allows controlled input to work in tests
  const [inputValue, setInputValue] = useState<string>(String(value || ''))

  // Sync inputValue when value prop changes
  useEffect(() => {
    setInputValue(String(value || ''))
  }, [value])

  const [localTariffs, setLocalTariffs] = useState<BoxDeliveryTariffs>({
    baseLiterRub: warehouseTariffs?.baseLiterRub ?? DEFAULT_BOX_TARIFFS.baseLiterRub,
    additionalLiterRub: warehouseTariffs?.additionalLiterRub ?? DEFAULT_BOX_TARIFFS.additionalLiterRub,
    coefficient: warehouseCoefficient > 0 ? warehouseCoefficient : 1.0,
  })

  const effectiveTariffs: BoxDeliveryTariffs = useMemo(() => ({
    baseLiterRub: localTariffs.baseLiterRub,
    additionalLiterRub: localTariffs.additionalLiterRub,
    coefficient: localTariffs.coefficient,
  }), [localTariffs])

  const result = useMemo(
    () => calculateLogisticsTariff(volumeLiters, effectiveTariffs),
    [volumeLiters, effectiveTariffs]
  )

  const calculatedValue = result.totalCost
  const isManualOverride = !autoCalculate || Math.abs(value - calculatedValue) > 0.01

  const handleAutoCalculateChange = useCallback((enabled: boolean) => {
    setAutoCalculate(enabled)
    if (enabled) {
      onChange(calculatedValue)
    }
  }, [onChange, calculatedValue])

  const handleRestore = useCallback(() => {
    onChange(calculatedValue)
    setAutoCalculate(true)
  }, [onChange, calculatedValue])

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    setInputValue(rawValue)
    const newValue = parseFloat(rawValue) || 0
    onChange(newValue)
    setAutoCalculate(false)
  }

  const handleTariffChange = useCallback((field: keyof BoxDeliveryTariffs, val: number) => {
    setLocalTariffs(prev => ({ ...prev, [field]: val }))
    if (autoCalculate) {
      const newTariffs = { ...localTariffs, [field]: val }
      const newResult = calculateLogisticsTariff(volumeLiters, newTariffs)
      onChange(newResult.totalCost)
    }
  }, [autoCalculate, localTariffs, volumeLiters, onChange])

  const handleResetTariffs = useCallback(() => {
    const defaultTariffs = {
      baseLiterRub: warehouseTariffs?.baseLiterRub ?? DEFAULT_BOX_TARIFFS.baseLiterRub,
      additionalLiterRub: warehouseTariffs?.additionalLiterRub ?? DEFAULT_BOX_TARIFFS.additionalLiterRub,
      coefficient: warehouseCoefficient > 0 ? warehouseCoefficient : 1.0,
    }
    setLocalTariffs(defaultTariffs)
    if (autoCalculate) {
      const newResult = calculateLogisticsTariff(volumeLiters, defaultTariffs)
      onChange(newResult.totalCost)
    }
  }, [warehouseTariffs, warehouseCoefficient, autoCalculate, volumeLiters, onChange])

  return (
    <div className="bg-cyan-50 rounded-lg p-4 border-l-4 border-l-cyan-400 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-cyan-600" aria-hidden="true" />
          <h3 className="text-sm font-medium text-cyan-900">Логистика прямая</h3>
        </div>
        <FieldTooltip content="Стоимость доставки товара от склада WB до покупателя. Рассчитывается по формуле: (базовый тариф + (объём - 1) × доп. литр) × коэффициент" />
      </div>

      {!warehouseName && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Выберите склад для точного расчёта логистики
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="auto-calc-logistics" className="text-sm">Рассчитать автоматически</Label>
        <Switch
          id="auto-calc-logistics"
          checked={autoCalculate}
          onCheckedChange={handleAutoCalculateChange}
          disabled={disabled || isLoading}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="logistics_calc_result" className="text-sm">Стоимость, ₽</Label>
          <AutoFillBadge source={isManualOverride ? 'manual' : 'auto'} />
        </div>
        <div className="flex gap-2">
          <Input
            id="logistics_calc_result"
            type="number"
            value={inputValue}
            onChange={handleManualChange}
            disabled={disabled || isLoading || autoCalculate}
            className={cn('flex-1', autoCalculate && 'bg-muted')}
            min={0}
            step={0.01}
            placeholder="0,00"
            aria-describedby="logistics-calc-hint"
          />
          {isManualOverride && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRestore}
              title="Восстановить расчётное значение"
              className="shrink-0"
              aria-label="Восстановить расчётное значение"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p id="logistics-calc-hint" className="sr-only">
          Рассчитанное значение логистики: {calculatedValue.toFixed(2)} рублей
        </p>
      </div>

      <Collapsible open={showTariffInputs} onOpenChange={setShowTariffInputs}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className={cn('h-4 w-4 transition-transform', showTariffInputs && 'rotate-90')} />
            Настроить тарифы
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3 p-3 bg-white/50 rounded border border-cyan-200">
          <TariffInputFields
            tariffs={localTariffs}
            onChange={handleTariffChange}
            onReset={handleResetTariffs}
            disabled={disabled || isLoading}
            validation={TARIFF_VALIDATION}
          />
        </CollapsibleContent>
      </Collapsible>

      <TariffBreakdown result={result} warehouseName={warehouseName} isLoading={isLoading} />
    </div>
  )
}
