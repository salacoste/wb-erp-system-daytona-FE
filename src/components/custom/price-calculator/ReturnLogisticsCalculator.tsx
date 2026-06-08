'use client'

/**
 * ReturnLogisticsCalculator - Auto-calculates return logistics from forward logistics
 * Story 44.10-FE: Return Logistics Calculation | Epic 44
 */

import { useMemo, useEffect, useId } from 'react'
import { RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ReturnLogisticsBreakdown } from './ReturnLogisticsBreakdown'
import { EffectiveReturnDisplay, SignificantDifferenceWarning } from './ReturnLogisticsDisplay'
import { cn } from '@/lib/utils'
import {
  calculateReturnLogistics,
  hasSignificantDifference,
  formatCurrencyFixed,
} from '@/lib/return-logistics-utils'

export interface ReturnLogisticsCalculatorProps {
  forwardLogistics: number
  buybackPct: number
  value: number
  onChange: (value: number) => void
  autoCalculate: boolean
  onAutoCalculateChange: (enabled: boolean) => void
  disabled?: boolean
}

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

  const result = useMemo(
    () => calculateReturnLogistics(forwardLogistics, buybackPct),
    [forwardLogistics, buybackPct]
  )

  useEffect(() => {
    if (autoCalculate) {
      const calculatedValue = isNaN(forwardLogistics) ? 0 : forwardLogistics
      if (Math.abs(value - calculatedValue) > 0.001) onChange(calculatedValue)
    }
  }, [autoCalculate, forwardLogistics, value, onChange])

  const calculatedBaseReturn = isNaN(forwardLogistics) ? 0 : forwardLogistics
  const showWarning = !autoCalculate && hasSignificantDifference(value, calculatedBaseReturn, 50)

  const handleAutoCalculateChange = (checked: boolean): void => {
    onAutoCalculateChange(checked)
    if (checked) onChange(calculatedBaseReturn)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value === '' ? 0 : parseFloat(e.target.value)
    onChange(isNaN(newValue) ? 0 : newValue)
    onAutoCalculateChange(false)
  }

  const handleRestore = (): void => {
    onChange(calculatedBaseReturn)
    onAutoCalculateChange(true)
  }

  const displayValue = isNaN(value) ? 0 : value

  return (
    <div className="space-y-3">
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
            className={cn('flex-1 focus-visible:ring', autoCalculate && 'bg-muted')}
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

      {showWarning && <SignificantDifferenceWarning calculatedBaseReturn={calculatedBaseReturn} />}
      <EffectiveReturnDisplay effectiveReturn={result.effectiveReturn} buybackPct={buybackPct} />
      <ReturnLogisticsBreakdown result={result} />
    </div>
  )
}
