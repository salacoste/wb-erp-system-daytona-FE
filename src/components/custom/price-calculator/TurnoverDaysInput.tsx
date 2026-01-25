'use client'

import { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { FieldTooltip } from './FieldTooltip'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { calculateBillableDays } from '@/lib/storage-cost-utils'

/**
 * Props for TurnoverDaysInput component
 * Story 44.32: Missing Price Calculator Fields
 * Updated: Now calculates and emits storage_rub
 */
export interface TurnoverDaysInputProps {
  /** Current turnover days value */
  value?: number
  /** Callback when value changes */
  onChange?: (value: number) => void
  /** Daily storage cost per unit (from warehouse tariff calculation) */
  dailyStorageCost: number
  /** Callback when calculated storage cost changes */
  onStorageRubChange?: (storageRub: number) => void
  /** Disable the input */
  disabled?: boolean
}

/**
 * Turnover days input component
 * Number input + slider with storage cost calculation and preview
 *
 * Features:
 * - Number input for turnover days (1-365)
 * - Slider for quick adjustment
 * - Calculates and emits storage_rub = dailyStorageCost × turnover_days
 * - Live preview of total storage cost
 * - Zone labels (fast/average/slow)
 * - Tooltip explaining business impact
 * - Validation with min/max constraints
 *
 * @example
 * <TurnoverDaysInput
 *   value={turnoverDays}
 *   onChange={(v) => setValue('turnover_days', v)}
 *   dailyStorageCost={2.5}
 *   onStorageRubChange={(v) => setValue('storage_rub', v)}
 *   disabled={disabled}
 * />
 */
export function TurnoverDaysInput({
  value = 20,
  onChange,
  dailyStorageCost,
  onStorageRubChange,
  disabled = false,
}: TurnoverDaysInputProps) {
  const handleChange = (newValue: number) => {
    if (newValue >= 1 && newValue <= 365) {
      onChange?.(newValue)
    }
  }

  // Calculate billable days (first 60 days are FREE per WB policy)
  const billableDays = calculateBillableDays(value)
  // Calculate total storage cost for billable days only
  const calculatedStorageRub = billableDays * dailyStorageCost
  const isFreePeriod = billableDays === 0

  useEffect(() => {
    onStorageRubChange?.(calculatedStorageRub)
  }, [calculatedStorageRub, onStorageRubChange])

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

      {dailyStorageCost > 0 && (
        <div
          className={cn(
            'p-3 bg-muted/50 rounded-lg',
            isFreePeriod && 'bg-green-50 border border-green-200',
            !isFreePeriod && value > 90 && 'bg-yellow-50 border border-yellow-200',
          )}
        >
          {isFreePeriod ? (
            <p className="text-sm text-green-700">
              <strong>Бесплатно</strong> — первые 60 дней хранения на WB бесплатны
            </p>
          ) : (
            <>
              <p className="text-sm">
                Хранение за период:{' '}
                <strong className={cn(value > 90 && 'text-yellow-700')}>
                  {formatCurrency(calculatedStorageRub)}
                </strong>
                <span className="text-muted-foreground">
                  {' '}
                  ({formatCurrency(dailyStorageCost)}/день × {billableDays} платных дней)
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Первые 60 дней бесплатно, оплата с {61}-го дня
              </p>
            </>
          )}
          {!isFreePeriod && value > 90 && (
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
