'use client'

/**
 * ReturnLogisticsCalculator - Auto-calculates return logistics from forward logistics
 * Story 44.10-FE: Return Logistics Calculation | Epic 44
 */

import { useMemo, useEffect, useId } from 'react'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReturnLogisticsBreakdown } from './ReturnLogisticsBreakdown'
import { cn } from '@/lib/utils'
import { calculateReturnLogistics, hasSignificantDifference } from '@/lib/return-logistics-utils'

/** Format currency with 2 decimal places (Russian locale: "72,50 ₽") */
function formatCurrencyFixed(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value)
}

export interface ReturnLogisticsCalculatorProps {
  /** Forward logistics cost */
  forwardLogistics: number
  /** Buyback percentage (0-100) */
  buybackPct: number
  /** Current base return value in form */
  value: number
  /** Change handler for base return value */
  onChange: (value: number) => void
  /** Auto-calculate mode enabled */
  autoCalculate: boolean
  /** Callback when auto-calculate mode changes */
  onAutoCalculateChange: (enabled: boolean) => void
  /** Disabled state */
  disabled?: boolean
}

/** Return logistics calculator with auto-calculation and manual override */
export function ReturnLogisticsCalculator({
  forwardLogistics,
  buybackPct,
  value,
  onChange,
  autoCalculate,
  onAutoCalculateChange,
  disabled = false,
}: ReturnLogisticsCalculatorProps): React.JSX.Element {
  const inputId = useId()
  const switchId = useId()

  // Calculate return logistics result
  const result = useMemo(
    () => calculateReturnLogistics(forwardLogistics, buybackPct),
    [forwardLogistics, buybackPct]
  )

  // Auto-update value when forward logistics changes and auto-calculate is enabled
  useEffect(() => {
    if (autoCalculate) {
      const calculatedValue = isNaN(forwardLogistics) ? 0 : forwardLogistics
      if (Math.abs(value - calculatedValue) > 0.001) {
        onChange(calculatedValue)
      }
    }
  }, [autoCalculate, forwardLogistics, value, onChange])

  // Check if manual value differs significantly from calculated (>50%)
  const calculatedBaseReturn = isNaN(forwardLogistics) ? 0 : forwardLogistics
  const showWarning =
    !autoCalculate && hasSignificantDifference(value, calculatedBaseReturn, 50)

  // Handle toggle change
  const handleAutoCalculateChange = (checked: boolean): void => {
    onAutoCalculateChange(checked)
    if (checked) {
      onChange(calculatedBaseReturn)
    }
  }

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value === '' ? 0 : parseFloat(e.target.value)
    onChange(isNaN(newValue) ? 0 : newValue)
    onAutoCalculateChange(false) // Ensure manual mode is active when typing
  }

  // Handle restore button click
  const handleRestore = (): void => {
    onChange(calculatedBaseReturn)
    onAutoCalculateChange(true)
  }

  // Determine display value for input
  const displayValue = isNaN(value) ? 0 : value

  return (
    <div className="space-y-3">
      {/* Auto-calculate toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor={switchId} className="text-sm font-medium">
          Рассчитать автоматически
        </Label>
        <Switch
          id={switchId}
          checked={autoCalculate}
          onCheckedChange={handleAutoCalculateChange}
          disabled={disabled}
          aria-label="Рассчитать автоматически"
        />
      </div>

      {/* Base return input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={inputId} className="text-sm" data-value={displayValue.toFixed(2)}>
            Логистика обратная (базовая)
            <span className="ml-1 text-muted-foreground font-normal">
              ({displayValue.toFixed(2).replace('.', ',')})
            </span>
          </Label>
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-normal',
              autoCalculate
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-yellow-50 text-yellow-700 border-yellow-300'
            )}
          >
            {autoCalculate ? 'Автозаполнено' : 'Вручную'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Input
            id={inputId}
            type="number"
            value={displayValue}
            onChange={handleInputChange}
            disabled={disabled || autoCalculate}
            className={cn(
              'flex-1 focus-visible:ring',
              autoCalculate && 'bg-muted'
            )}
            min="0"
            step="0.01"
            aria-label="Логистика обратная"
            title={formatCurrencyFixed(displayValue)}
          />
          {!autoCalculate && !disabled && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRestore}
              aria-label="Восстановить расчётное значение"
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Warning for significant manual difference */}
      {showWarning && (
        <Alert variant="destructive" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Значение значительно отличается от расчётного (
            {formatCurrencyFixed(calculatedBaseReturn)})
          </AlertDescription>
        </Alert>
      )}

      {/* Effective return display */}
      <div className="flex justify-between items-center text-sm py-2 bg-muted/50 rounded px-3">
        <span className="text-muted-foreground">
          {`Эффективная обратная (с учётом buyback ${buybackPct}%):`}
        </span>
        <span
          className={cn(
            'font-medium',
            result.effectiveReturn < 5 ? 'text-muted-foreground' : 'text-primary'
          )}
        >
          {formatCurrencyFixed(result.effectiveReturn)}
        </span>
      </div>

      {/* Breakdown section */}
      <ReturnLogisticsBreakdown result={result} />
    </div>
  )
}
