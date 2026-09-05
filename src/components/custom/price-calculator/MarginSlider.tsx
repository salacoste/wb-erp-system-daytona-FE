'use client'

import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Controller, type FieldValues, type Control, type Path } from 'react-hook-form'
import { cn } from '@/lib/utils'

/**
 * Margin zone configuration
 * Story 44.24-FE: Visual zone indicators
 */
const MARGIN_ZONES = {
  low: { min: 0, max: 10, label: 'Низкая' },
  medium: { min: 10, max: 25, label: 'Средняя' },
  high: { min: 25, max: 100, label: 'Высокая' },
} as const

type ZoneKey = keyof typeof MARGIN_ZONES

/**
 * Get zone key based on margin value
 */
function getMarginZone(value: number): ZoneKey {
  if (value < 10) return 'low'
  if (value < 25) return 'medium'
  return 'high'
}

/**
 * Badge styles by zone
 *
 * P2 wave-3 (2026-09-05): failing tints /10→/5 per house rule — measured <4.5:1 light
 * (см. артефакт debt-p2-wave3-aa-quickwins / волна-2 canon). Borders (/30) — non-text
 * 3:1, out of scope.
 * Pass-2 correction (review-pass-2, 2026-09-05): base is NOT plain card — this slider
 * renders inside the TargetMarginSection box (bg-primary/5, TargetMarginSection.tsx:33),
 * so the true in-situ stack is card > primary/5 > badge tint; re-measured in situ:
 * warn-on-warn/5 = 4.19 light FAIL, fin-pos-on-fin-pos/5 = 4.45 light FAIL → medium/high
 * badge text is text-foreground (fg-on-tint = 14.02 / 13.98 light, ≥15.27 dark over
 * primary/5); tints/borders kept — zone valence = tint + border. Retained: low keeps
 * text-status-error — error-on-error/10 = 5.16 light / 8.49 dark over primary/5 PASS.
 * Zone labels (:126-128) are bare spans SEPARATE from the badge chip (the badge carries
 * current-zone identity; the /20 track segments directly above each label carry zone
 * color) → labels are text-foreground (14.89 light / 16.95 dark over primary/5; measured
 * bare warn label = 4.45 FAIL; bare fin-pos 4.74 / bare error 6.05 pass but the legend is
 * kept uniform — solid mini-chips rejected: financial-positive has no -foreground token).
 */
const badgeStyles: Record<ZoneKey, string> = {
  low: 'bg-status-error/10 text-status-error border-status-error/30',
  medium: 'bg-status-warning/5 text-foreground border-status-warning/30',
  high: 'bg-financial-positive/5 text-foreground border-financial-positive/30',
}

/**
 * Props for MarginSlider component
 * Uses generic T to accept any form data type
 */
export interface MarginSliderProps<T extends FieldValues = FieldValues> {
  /** Form field name for react-hook-form registration */
  name: Path<T>
  /** react-hook-form control object */
  control: Control<T>
  /** Minimum slider value */
  min: number
  /** Maximum slider value */
  max: number
  /** Slider step increment */
  step: number
  /** Unit suffix to display */
  unit: string
  /** Error message to display */
  error?: string
  /** Accessible label for the numeric input (FE-3, WCAG 1.3.1 / 3.3.2) */
  ariaLabel?: string
}

/**
 * Enhanced margin slider with visual zones
 * Story 44.24-FE: Visual zone indicators (low/medium/high)
 *
 * @example
 * <MarginSlider
 *   name="target_margin_pct"
 *   control={control}
 *   min={0}
 *   max={50}
 *   step={0.5}
 *   unit="%"
 * />
 */
export function MarginSlider<T extends FieldValues = FieldValues>({
  name,
  control,
  min,
  max,
  step,
  unit,
  error,
  ariaLabel = 'Маржа',
}: MarginSliderProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = Number(field.value) || 0
        const zone = getMarginZone(value)
        const zoneConfig = MARGIN_ZONES[zone]

        return (
          <div className="space-y-3">
            {/* Slider with zone overlay */}
            <div className="relative pt-1">
              {/* Zone background overlay - visual indicator of margin zones */}
              <div className="absolute inset-x-0 top-1 h-2 rounded-full overflow-hidden flex pointer-events-none">
                <div className="bg-status-error/20 w-[20%]" />
                <div className="bg-status-warning/20 w-[30%]" />
                <div className="bg-financial-positive/20 flex-1" />
              </div>

              {/* Slider component */}
              <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={values => field.onChange(values[0])}
                className="w-full relative z-10"
                aria-label={ariaLabel}
              />
            </div>

            {/* Zone labels — text-foreground per badgeStyles comment (labels are a separate
                legend from the badge chip; zone color lives in the track segments above) */}
            <div className="flex justify-between text-xs px-1">
              <span className="text-foreground">Низкая</span>
              <span className="text-foreground">Средняя</span>
              <span className="text-foreground">Высокая</span>
            </div>

            {/* Value input with colored badge */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'px-3 py-1.5 rounded-md border shadow-sm text-sm font-medium',
                  badgeStyles[zone]
                )}
              >
                {zoneConfig.label}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step={step}
                  min={min}
                  max={max}
                  value={value}
                  aria-label={ariaLabel}
                  onChange={e => {
                    const num = parseFloat(e.target.value)
                    field.onChange(isNaN(num) ? 0 : num)
                  }}
                  className="w-20 text-right"
                />
                <span className="text-sm text-muted-foreground">{unit}</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
      }}
    />
  )
}
