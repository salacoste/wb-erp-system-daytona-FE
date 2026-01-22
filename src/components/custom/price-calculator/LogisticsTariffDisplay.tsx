'use client'

import { useState, useMemo, useEffect } from 'react'
import { Truck, RotateCcw, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FieldTooltip } from './FieldTooltip'
import { TariffBreakdown } from './TariffBreakdown'
import { cn } from '@/lib/utils'
import { calculateLogisticsTariff, DEFAULT_BOX_TARIFFS, type BoxDeliveryTariffs } from '@/lib/logistics-tariff'

export interface LogisticsTariffDisplayProps {
  /** Volume in liters from Story 44.7 */
  volumeLiters: number
  /** Warehouse coefficient (1.0 = 100%) */
  coefficient: number
  /** Current forward logistics value in form */
  value: number
  /** Change handler */
  onChange: (value: number) => void
  /** Custom tariffs from warehouse (optional) */
  warehouseTariffs?: { baseLiterRub: number; additionalLiterRub: number } | null
  /** Warehouse name for display */
  warehouseName?: string
  /** Disabled state */
  disabled?: boolean
  /** Is loading tariffs */
  isLoading?: boolean
}

/** Auto-fill badge indicator for LogisticsTariffDisplay */
function DisplayAutoFillBadge({ source }: { source: 'auto' | 'manual' }) {
  return (
    <Badge variant="outline" className={cn('text-xs',
      source === 'auto' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-600'
    )}>
      {source === 'auto' ? 'Рассчитано' : 'Вручную'}
    </Badge>
  )
}

/**
 * Logistics tariff display with auto-calculation
 * Story 44.8-FE: Logistics Tariff Calculation
 */
export function LogisticsTariffDisplay({
  volumeLiters,
  coefficient,
  value,
  onChange,
  warehouseTariffs,
  warehouseName,
  disabled = false,
  isLoading = false,
}: LogisticsTariffDisplayProps) {
  const [autoCalculate, setAutoCalculate] = useState(true)
  // Internal state for manual input - allows controlled input to work in tests
  const [inputValue, setInputValue] = useState<string>(String(value || ''))

  // Sync inputValue when value prop changes (from parent or restore)
  useEffect(() => {
    setInputValue(String(value || ''))
  }, [value])

  // Build effective tariffs
  const effectiveTariffs: BoxDeliveryTariffs = useMemo(() => ({
    baseLiterRub: warehouseTariffs?.baseLiterRub ?? DEFAULT_BOX_TARIFFS.baseLiterRub,
    additionalLiterRub: warehouseTariffs?.additionalLiterRub ?? DEFAULT_BOX_TARIFFS.additionalLiterRub,
    coefficient: coefficient > 0 ? coefficient : 1.0,
  }), [warehouseTariffs, coefficient])

  // Calculate logistics cost
  const result = useMemo(
    () => calculateLogisticsTariff(volumeLiters, effectiveTariffs),
    [volumeLiters, effectiveTariffs]
  )

  // Auto-update form value when auto-calculate enabled
  const calculatedValue = result.totalCost
  // When auto-calculate is on, show "Рассчитано"; otherwise show "Вручную"
  const isManualOverride = !autoCalculate

  const handleAutoCalculateChange = (enabled: boolean) => {
    setAutoCalculate(enabled)
    if (enabled) {
      onChange(calculatedValue)
    }
  }

  const handleRestore = () => {
    onChange(calculatedValue)
    setAutoCalculate(true)
  }

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    setInputValue(rawValue)
    const newValue = parseFloat(rawValue) || 0
    onChange(newValue)
    setAutoCalculate(false)
  }

  return (
    <div className="bg-cyan-50 rounded-lg p-4 border-l-4 border-l-cyan-400 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-cyan-600" aria-hidden="true" />
          <h3 className="text-sm font-medium text-cyan-900">Логистика прямая</h3>
        </div>
        <FieldTooltip content="Стоимость доставки товара от склада WB до покупателя. Рассчитывается автоматически на основе объёма товара и тарифов склада." />
      </div>

      {/* No warehouse notice */}
      {!warehouseName && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Выберите склад для точного расчёта логистики
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-calculate toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-calc-logistics" className="text-sm">Рассчитать автоматически</Label>
        <Switch
          id="auto-calc-logistics"
          checked={autoCalculate}
          onCheckedChange={handleAutoCalculateChange}
          disabled={disabled || isLoading}
        />
      </div>

      {/* Input field with badge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="logistics_forward_calc" className="text-sm">Стоимость, ₽</Label>
          <DisplayAutoFillBadge source={isManualOverride ? 'manual' : 'auto'} />
        </div>
        <div className="flex gap-2">
          <Input
            id="logistics_forward_calc"
            type="number"
            value={inputValue}
            onChange={handleManualChange}
            disabled={disabled || (autoCalculate && !isLoading)}
            className={cn('flex-1', autoCalculate && 'bg-muted')}
            min={0}
            step={0.01}
            placeholder="0,00"
          />
          {isManualOverride && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRestore}
              title="Восстановить расчётное значение"
              aria-label="Восстановить расчётное значение"
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {/* Screen reader announcement for calculated result */}
        <div aria-live="polite" className="sr-only">
          Рассчитанное значение логистики: {calculatedValue.toFixed(2)} рублей
        </div>
      </div>

      {/* Tariff breakdown */}
      <TariffBreakdown result={result} warehouseName={warehouseName} isLoading={isLoading} />
    </div>
  )
}
