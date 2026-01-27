'use client'

/**
 * CoefficientField Component
 * Story 44.13-FE: Auto-fill Coefficients from Warehouse
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Input field with auto-fill badge and restore functionality
 */

import { Info, RotateCcw, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AutoFillBadge, type FieldSource } from './AutoFillBadge'

export interface CoefficientFieldProps {
  /** Field label text */
  label: string
  /** Current value */
  value: number
  /** Source of the value (auto or manual) */
  source: FieldSource
  /** Original value from API (for restore) */
  originalValue?: number
  /** Value change handler */
  onChange: (value: number) => void
  /** Source change handler (auto -> manual on edit) */
  onSourceChange: (source: FieldSource) => void
  /** Restore to original value handler */
  onRestore?: () => void
  /** Disable input */
  disabled?: boolean
  /** Tooltip text for info icon */
  tooltip?: string
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
  /** Step increment */
  step?: number
  /** Story 44.XX: Lock field when warehouse is selected */
  isWarehouseLocked?: boolean
}

export function CoefficientField({
  label,
  value,
  source,
  originalValue,
  onChange,
  onSourceChange,
  onRestore,
  disabled,
  tooltip,
  min = 0,
  max = 10,
  step = 0.01,
  isWarehouseLocked = false,
}: CoefficientFieldProps) {
  const handleChange = (newValue: number) => {
    onChange(newValue)
    if (source === 'auto') {
      onSourceChange('manual')
    }
  }

  const canRestore = source === 'manual' && originalValue !== undefined

  // Story 44.XX: Disable input when warehouse is selected and value is auto-filled
  const isLocked = isWarehouseLocked && source === 'auto'
  const effectiveDisabled = disabled || isLocked

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {label}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs whitespace-pre-wrap">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <AutoFillBadge source={source} />
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          step={step}
          min={min}
          max={max}
          disabled={effectiveDisabled}
          className="flex-1"
          aria-describedby={canRestore ? `${label}-restore-hint` : undefined}
        />
        {canRestore && onRestore && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRestore}
            title="Восстановить значение из тарифов"
            aria-label="Восстановить значение"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Story 44.XX: Show warehouse coefficient source note */}
      {isLocked && (
        <p className="text-xs text-muted-foreground">
          Используются коэффициенты склада WB
        </p>
      )}

      {source === 'manual' && originalValue !== undefined && (
        <p id={`${label}-restore-hint`} className="text-xs text-muted-foreground">
          Тарифное значение: {originalValue.toFixed(2)}
        </p>
      )}

      {/* Warning for high coefficient values (> 2.0) */}
      {value > 2.0 && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Высокий коэффициент может существенно увеличить расходы
        </p>
      )}
    </div>
  )
}
