'use client'

import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { FieldTooltip } from './FieldTooltip'
import { cn } from '@/lib/utils'

/**
 * Props for WeightThresholdCheckbox component
 * Story 44.32: Missing Price Calculator Fields
 */
export interface WeightThresholdCheckboxProps {
  /** Whether weight exceeds 25kg */
  checked?: boolean
  /** Callback when checkbox state changes */
  onChange?: (checked: boolean) => void
  /** Disable the checkbox */
  disabled?: boolean
}

/**
 * Weight threshold checkbox component
 * Checkbox with warning alert for heavy items (>25kg)
 *
 * Features:
 * - Checkbox for weight > 25kg selection
 * - Alert component when checked (1.5x multiplier warning)
 * - Russian label and warning text
 * - Tooltip explaining business impact
 * - Full accessibility support
 *
 * Business Impact: Heavy items incur 1.5x logistics multiplier
 *
 * @example
 * <WeightThresholdCheckbox
 *   checked={weightExceeds}
 *   onChange={setWeightExceeds}
 *   disabled={disabled}
 * />
 */
export function WeightThresholdCheckbox({
  checked = false,
  onChange,
  disabled = false,
}: WeightThresholdCheckboxProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center space-x-2 border rounded-lg p-3',
            'hover:bg-muted/50 transition-colors flex-1',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Checkbox
            id="weight-checkbox"
            checked={checked}
            onCheckedChange={(c) => onChange?.(c === true)}
            disabled={disabled}
          />
          <Label
            htmlFor="weight-checkbox"
            className={cn(
              'cursor-pointer flex-1',
              disabled && 'cursor-not-allowed'
            )}
          >
            Вес превышает 25 кг
          </Label>
          <FieldTooltip content="Тяжеловесные товары (>25 кг) имеют повышенный коэффициент логистики (~1.5x). Критично для мебели, бытовой техники, спорттоваров." />
        </div>
      </div>

      {checked && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Учтён повышенный тариф логистики для тяжеловесных грузов
            (коэффициент ~1.5x)
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
