'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { FieldTooltip } from './FieldTooltip'

/**
 * Props for SppInput component
 */
export interface SppInputProps {
  /** Current SPP percentage (0-30) */
  value: number
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Disable the input */
  disabled?: boolean
  /** Error message to display */
  error?: string
}

/**
 * SPP (Скидка Постоянного Покупателя) input component
 * Story 44.19-FE: SPP Display (Customer Price)
 *
 * Features:
 * - Slider with 0-30% range, 1% step
 * - Default value: 0% (no SPP)
 * - Tooltip explaining SPP (WB discount at their expense)
 * - Inline numeric input for precise value entry
 *
 * UX Update: Uses FieldTooltip for consistency with BuybackSlider and DrrSlider
 * Target structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Label]                     [FieldTooltip]                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │ [═══════ Slider ═══════]              [Input][%]            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @example
 * <SppInput
 *   value={sppPct}
 *   onChange={(value) => setSppPct(value)}
 * />
 */
export function SppInput({
  value,
  onChange,
  disabled = false,
  error,
}: SppInputProps) {
  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    onChange(values[0])
  }

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 30) {
      onChange(newValue)
    } else if (e.target.value === '') {
      onChange(0)
    }
  }

  return (
    <div className="space-y-3" data-testid="spp-input-section">
      {/* Label with FieldTooltip - consistent with BuybackSlider and DrrSlider */}
      <div className="flex items-center gap-2">
        <Label htmlFor="spp_pct" className="flex-1">
          СПП (Скидка постоянного покупателя)
        </Label>
        <FieldTooltip content="СПП — скидка, которую WB предоставляет покупателям за свой счёт. Важно: Вы получаете полную сумму без учёта СПП. Эта скидка показывает, какую цену увидит покупатель." />
      </div>

      {/* Slider + Input - horizontal layout */}
      <div className="flex items-center gap-4">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={0}
          max={30}
          step={1}
          disabled={disabled}
          className="flex-1"
          aria-label="СПП процент"
          data-testid="spp-slider"
        />
        <div className="flex items-center gap-1 w-20">
          <Input
            id="spp_pct"
            type="number"
            value={value}
            onChange={handleInputChange}
            min={0}
            max={30}
            step={1}
            disabled={disabled}
            className="w-16 text-center"
            aria-label="СПП процент"
            data-testid="spp-input"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      {/* Help text when SPP > 0 */}
      {value > 0 && (
        <p className="text-xs text-muted-foreground" data-testid="spp-help-text">
          Покупатель увидит цену со скидкой {value}%
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive" data-testid="spp-error">
          {error}
        </p>
      )}
    </div>
  )
}
