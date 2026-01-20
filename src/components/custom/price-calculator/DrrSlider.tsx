'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { FieldTooltip } from './FieldTooltip'
import { AlertTriangle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

/**
 * DRR level type
 */
export type DrrLevel = 'low' | 'moderate' | 'high' | 'very-high'

/**
 * DRR level configuration
 */
export interface DrrLevelConfig {
  level: DrrLevel
  label: string
  color: string
  bgColor: string
}

/**
 * Get DRR level configuration based on percentage
 * @param drr - DRR percentage (0-30)
 * @returns DRR level configuration
 */
export function getDrrLevel(drr: number): DrrLevelConfig {
  if (drr <= 3) {
    return { level: 'low', label: 'Низкий', color: 'text-green-600', bgColor: 'bg-green-100' }
  }
  if (drr <= 7) {
    return { level: 'moderate', label: 'Умеренный', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  }
  if (drr <= 15) {
    return { level: 'high', label: 'Высокий', color: 'text-orange-600', bgColor: 'bg-orange-100' }
  }
  return { level: 'very-high', label: 'Очень высокий', color: 'text-red-600', bgColor: 'bg-red-100' }
}

/**
 * Props for DrrSlider component
 */
export interface DrrSliderProps {
  /** Current DRR percentage (0-30) */
  value: number
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Disable the slider */
  disabled?: boolean
  /** Calculated advertising cost in rubles */
  advertisingCost?: number
  /** Error message to display */
  error?: string
}

/**
 * DRR (Доля Рекламных Расходов) slider component
 * Story 44.18-FE: DRR Input (Advertising Percentage)
 *
 * Features:
 * - Slider with 0-30% range, 0.5% step
 * - Level indicator badge (Низкий/Умеренный/Высокий/Очень высокий)
 * - Advertising cost preview in rubles
 * - Warning for very high DRR (>15%)
 * - Color-coded feedback based on DRR level
 */
export function DrrSlider({
  value,
  onChange,
  disabled,
  advertisingCost,
  error,
}: DrrSliderProps) {
  const { label, color, bgColor } = getDrrLevel(value)
  const isVeryHigh = value > 15

  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    onChange(values[0])
  }

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 30) {
      onChange(newValue)
    } else if (e.target.value === '') {
      onChange(0)
    }
  }

  return (
    <div className="space-y-3" data-testid="drr-slider-section">
      {/* Label and Level Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="drr_pct" className="flex-1">
            DRR (Доля рекламных расходов)
          </Label>
          <FieldTooltip content="DRR — процент от цены на рекламу. Это переменный расход, который влияет на финальную маржу. Новые продавцы: 5-10%, средние: 3-7%, топ-продавцы: 2-5%, без рекламы: 0%." />
        </div>

        <Badge
          variant="outline"
          className={cn('text-xs', bgColor, color)}
          data-testid="drr-level-badge"
        >
          {label}
        </Badge>
      </div>

      {/* Slider + Input */}
      <div className="flex items-center gap-4">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={0}
          max={30}
          step={0.5}
          disabled={disabled}
          className="flex-1"
          data-testid="drr-slider"
        />
        <div className="flex items-center gap-1 w-20">
          <Input
            id="drr_pct"
            type="number"
            value={value}
            onChange={handleInputChange}
            min={0}
            max={30}
            step={0.5}
            disabled={disabled}
            className="w-16 text-center"
            data-testid="drr-input"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      {/* Warning for very high DRR */}
      {isVeryHigh && (
        <div className="flex items-center gap-1 text-xs text-red-600" data-testid="drr-high-warning">
          <AlertTriangle className="h-3 w-3" />
          Очень высокий DRR может привести к убыточности
        </div>
      )}

      {/* Advertising Cost Preview */}
      {advertisingCost !== undefined && advertisingCost > 0 && (
        <div className="text-sm text-muted-foreground" data-testid="advertising-cost-preview">
          Расходы на рекламу:{' '}
          <span className="font-medium text-foreground">
            {formatCurrency(advertisingCost)}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive" data-testid="drr-error">
          {error}
        </p>
      )}
    </div>
  )
}
