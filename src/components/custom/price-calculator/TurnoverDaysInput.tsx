'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { FieldTooltip } from './FieldTooltip'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * Props for TurnoverDaysInput component
 * Story 44.32: Missing Price Calculator Fields
 */
export interface TurnoverDaysInputProps {
  /** Current turnover days value */
  value?: number
  /** Callback when value changes */
  onChange?: (value: number) => void
  /** Storage cost per day (calculated from volume) */
  storagePerDay?: number
  /** Disable the input */
  disabled?: boolean
}

/**
 * Turnover days input component
 * Number input + slider with storage cost preview
 *
 * Features:
 * - Number input for turnover days (1-365)
 * - Slider for quick adjustment
 * - Live preview of total storage cost
 * - Zone labels (fast/average/slow)
 * - Tooltip explaining business impact
 * - Validation with min/max constraints
 *
 * Business Impact: storage_total = storage_per_day × turnover_days
 *
 * @example
 * <TurnoverDaysInput
 *   value={turnoverDays}
 *   onChange={setTurnoverDays}
 *   storagePerDay={2.5}
 *   disabled={disabled}
 * />
 */
export function TurnoverDaysInput({
  value = 20,
  onChange,
  storagePerDay = 0,
  disabled = false,
}: TurnoverDaysInputProps) {
  const handleChange = (newValue: number) => {
    if (newValue >= 1 && newValue <= 365) {
      onChange?.(newValue)
    }
  }

  const totalStorage = value * storagePerDay

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="turnover-days">Оборачиваемость, дней</Label>
        <FieldTooltip content="Сколько дней товар лежит на складе до продажи. Влияет на общую стоимость хранения. Типично: 20 дней для WB." />
      </div>

      <div className="flex items-center gap-4">
        <Input
          id="turnover-days"
          type="number"
          min={1}
          max={365}
          step={1}
          value={value}
          onChange={(e) => {
            const numValue = parseInt(e.target.value)
            if (!isNaN(numValue)) {
              handleChange(numValue)
            }
          }}
          disabled={disabled}
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">дней</span>
      </div>

      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={([v]) => handleChange(v)}
          min={1}
          max={365}
          step={1}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 день</span>
          <span>быстро</span>
          <span>20 дней (среднее)</span>
          <span>медленно</span>
          <span>365 дней</span>
        </div>
      </div>

      {storagePerDay > 0 && (
        <div className={cn(
          'p-3 bg-muted/50 rounded-lg',
          value > 90 && 'bg-yellow-50 border border-yellow-200'
        )}>
          <p className="text-sm">
            Хранение за период:{' '}
            <strong className={cn(
              value > 90 && 'text-yellow-700'
            )}>
              {formatCurrency(totalStorage)} ₽
            </strong>
            <span className="text-muted-foreground">
              {' '}({storagePerDay.toFixed(2)} ₽/день × {value} дней)
            </span>
          </p>
          {value > 90 && (
            <p className="text-xs text-yellow-700 mt-1">
              Длительное хранение снизит маржинальность
            </p>
          )}
        </div>
      )}

      {value < 1 && (
        <p className="text-sm text-destructive">
          Значение должно быть не менее 1 дня
        </p>
      )}
      {value > 365 && (
        <p className="text-sm text-destructive">
          Значение должно быть не более 365 дней
        </p>
      )}
    </div>
  )
}
