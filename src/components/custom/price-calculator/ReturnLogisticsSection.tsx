'use client'

import { useState, useMemo, useEffect } from 'react'
import { Undo2, RotateCcw, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FieldTooltip } from './FieldTooltip'
import { ReturnLogisticsBreakdown } from './ReturnLogisticsBreakdown'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateReturnLogistics, hasSignificantDifference } from '@/lib/return-logistics-utils'

/** Auto-fill badge indicator */
function AutoFillBadge({ source }: { source: 'auto' | 'manual' }) {
  return (
    <Badge variant="outline" className={cn('text-xs',
      source === 'auto' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-600'
    )}>
      {source === 'auto' ? 'Автозаполнено' : 'Вручную'}
    </Badge>
  )
}

interface ReturnLogisticsSectionProps {
  /** Forward logistics cost */
  forwardLogistics: number
  /** Buyback percentage */
  buybackPct: number
  /** Current value in form (base return, NOT effective) */
  value: number
  /** Change handler */
  onChange: (value: number) => void
  /** Disabled state */
  disabled?: boolean
}

/**
 * Return logistics section with auto-calculation
 * Story 44.10-FE: Return Logistics Calculation
 *
 * Calculates effective return cost based on forward logistics and buyback percentage.
 * Formula: effective_return = base_return × (100 - buyback_pct) / 100
 */
export function ReturnLogisticsSection({
  forwardLogistics,
  buybackPct,
  value,
  onChange,
  disabled = false,
}: ReturnLogisticsSectionProps) {
  const [autoCalculate, setAutoCalculate] = useState(true)

  // Calculate values
  const result = useMemo(
    () => calculateReturnLogistics(forwardLogistics, buybackPct),
    [forwardLogistics, buybackPct]
  )

  // Auto-update when auto-calculate enabled
  useEffect(() => {
    if (autoCalculate && Math.abs(value - result.baseReturn) > 0.01) {
      onChange(result.baseReturn)
    }
  }, [autoCalculate, result.baseReturn, value, onChange])

  // Check if manual value differs significantly (>50%)
  const manualDiffWarning =
    !autoCalculate && hasSignificantDifference(value, result.baseReturn, 50)

  const handleAutoCalculateChange = (enabled: boolean) => {
    setAutoCalculate(enabled)
    if (enabled) {
      onChange(result.baseReturn)
    }
  }

  const handleRestore = () => {
    onChange(result.baseReturn)
    setAutoCalculate(true)
  }

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0
    onChange(newValue)
    setAutoCalculate(false)
  }

  return (
    <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-l-orange-400 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Undo2 className="h-4 w-4 text-orange-600" aria-hidden="true" />
          <h3 className="text-sm font-medium text-orange-900">Логистика обратная</h3>
        </div>
        <FieldTooltip content="Стоимость возврата товара. Рассчитывается автоматически на основе прямой логистики и процента buyback (выкупа). Чем выше buyback, тем меньше эффективная стоимость возвратов." />
      </div>

      {/* Auto-calculate toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-calc-return" className="text-sm">Рассчитать автоматически</Label>
        <Switch
          id="auto-calc-return"
          checked={autoCalculate}
          onCheckedChange={handleAutoCalculateChange}
          disabled={disabled}
        />
      </div>

      {/* Input field (base return) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="logistics_reverse_calc" className="text-sm">Логистика обратная (базовая), ₽</Label>
          <AutoFillBadge source={autoCalculate ? 'auto' : 'manual'} />
        </div>
        <div className="flex gap-2">
          <Input
            id="logistics_reverse_calc"
            type="number"
            value={value || ''}
            onChange={handleManualChange}
            disabled={disabled || autoCalculate}
            className={cn('flex-1', autoCalculate && 'bg-muted')}
            min={0}
            step={0.01}
            placeholder="0,00"
          />
          {!autoCalculate && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRestore}
              title="Восстановить расчётное значение"
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Warning for significant manual difference */}
      {manualDiffWarning && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Значение значительно отличается от расчётного ({formatCurrency(result.baseReturn)})
          </AlertDescription>
        </Alert>
      )}

      {/* Effective return display */}
      <div className="flex justify-between items-center text-sm py-2 bg-orange-100/50 rounded px-3">
        <span className="text-muted-foreground">
          Эффективная обратная (buyback {buybackPct}%):
        </span>
        <span className="font-medium text-primary">
          {formatCurrency(result.effectiveReturn)}
        </span>
      </div>

      {/* Breakdown section */}
      <ReturnLogisticsBreakdown result={result} />
    </div>
  )
}
