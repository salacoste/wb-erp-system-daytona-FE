'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { FieldTooltip } from './FieldTooltip'
import { AlertTriangle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

/** DRR level type - Story 44.18-FE */
export type DrrLevel = 'low' | 'moderate' | 'high' | 'very-high'

/** DRR level configuration with visual styling */
export interface DrrLevelConfig {
  level: DrrLevel
  label: string
  color: string
  bgColor: string
}

/** DRR Level Labels for accessibility and display */
export const DRR_LEVEL_LABELS: Record<DrrLevel, string> = {
  'low': 'Низкий',
  'moderate': 'Умеренный',
  'high': 'Высокий',
  'very-high': 'Очень высокий',
} as const

/** Get DRR level config: 0-3% low, 3-7% moderate, 7-15% high, >15% very-high */
export function getDrrLevel(drr: number): DrrLevelConfig {
  if (drr <= 3) {
    return { level: 'low', label: DRR_LEVEL_LABELS['low'], color: 'text-green-600', bgColor: 'bg-green-100' }
  }
  if (drr <= 7) {
    return { level: 'moderate', label: DRR_LEVEL_LABELS['moderate'], color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  }
  if (drr <= 15) {
    return { level: 'high', label: DRR_LEVEL_LABELS['high'], color: 'text-orange-600', bgColor: 'bg-orange-100' }
  }
  return { level: 'very-high', label: DRR_LEVEL_LABELS['very-high'], color: 'text-red-600', bgColor: 'bg-red-100' }
}

/** Props for DrrSlider component */
export interface DrrSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  /** Calculated advertising cost (auto-calculated if recommendedPrice provided) */
  advertisingCost?: number
  error?: string
  /** Max value (default: 30, can extend to 100) */
  maxValue?: number
  /** Warning threshold (default: 15) */
  warningThreshold?: number
  /** Price for auto-calculation of advertising cost */
  recommendedPrice?: number
}

/** DRR slider with visual zones, configurable range/threshold, auto-calculation */
export function DrrSlider({
  value, onChange, disabled, advertisingCost, error,
  maxValue = 30, warningThreshold = 15, recommendedPrice,
}: DrrSliderProps) {
  const { label, color, bgColor } = getDrrLevel(value)
  const isVeryHigh = value > warningThreshold

  // Auto-calculate advertising cost if recommendedPrice provided
  const calculatedCost = recommendedPrice ? recommendedPrice * (value / 100) : advertisingCost
  const displayCost = calculatedCost !== undefined && calculatedCost > 0 ? calculatedCost : undefined

  const handleSliderChange = (values: number[]) => onChange(values[0])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    if (!isNaN(newValue) && newValue >= 0 && newValue <= maxValue) {
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
          <Label htmlFor="drr_pct" className="flex-1">DRR (Доля рекламных расходов)</Label>
          <FieldTooltip content="DRR — процент от цены на рекламу. Это переменный расход, который влияет на финальную маржу. Новые продавцы: 5-10%, средние: 3-7%, топ-продавцы: 2-5%, без рекламы: 0%." />
        </div>
        <Badge variant="outline" className={cn('text-xs', bgColor, color)} data-testid="drr-level-badge">
          {label}
        </Badge>
      </div>

      {/* Slider with zone overlay + Input - responsive layout */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:flex-1 pt-1">
          {/* Zone background overlay - visual indicator of DRR zones */}
          <div className="absolute inset-x-0 top-1 h-2 rounded-full overflow-hidden flex pointer-events-none">
            <div className="bg-green-100 w-[10%]" />
            <div className="bg-yellow-100 w-[13.3%]" />
            <div className="bg-orange-100 w-[26.7%]" />
            <div className="bg-red-100 flex-1" />
          </div>
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={0}
            max={maxValue}
            step={0.5}
            disabled={disabled}
            className="w-full relative z-10"
            aria-label="DRR (Доля рекламных расходов)"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={maxValue}
            aria-valuetext={`${value}% - ${label}`}
            data-testid="drr-slider"
          />
        </div>
        <div className="flex items-center gap-1 w-20">
          <Input
            id="drr_pct"
            type="number"
            value={value}
            onChange={handleInputChange}
            min={0}
            max={maxValue}
            step={0.5}
            disabled={disabled}
            className="w-16 text-center"
            aria-label="DRR в процентах"
            data-testid="drr-input"
          />
          <span className="text-sm text-muted-foreground" aria-hidden="true">%</span>
        </div>
      </div>

      {/* Warning for very high DRR */}
      {isVeryHigh && (
        <div className="flex items-center gap-1 text-xs text-red-600" role="alert" aria-live="polite" data-testid="drr-high-warning">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          Очень высокий DRR может привести к убыточности
        </div>
      )}

      {/* Advertising Cost Preview */}
      {displayCost !== undefined && (
        <div className="text-sm text-muted-foreground" data-testid="advertising-cost-preview">
          Расходы на рекламу: <span className="font-medium text-foreground">{formatCurrency(displayCost)}</span>
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-destructive" data-testid="drr-error">{error}</p>}
    </div>
  )
}
