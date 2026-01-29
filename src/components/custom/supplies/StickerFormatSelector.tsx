'use client'

/**
 * StickerFormatSelector Component
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Radio group for selecting sticker format (PNG/SVG/ZPL).
 */

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { StickerFormat } from '@/types/supplies'

/** Format configuration with labels in Russian */
const FORMAT_OPTIONS: Array<{ value: StickerFormat; label: string; description: string }> = [
  {
    value: 'png',
    label: 'PNG',
    description: 'для обычных принтеров',
  },
  {
    value: 'svg',
    label: 'SVG',
    description: 'высокое качество',
  },
  {
    value: 'zpl',
    label: 'ZPL',
    description: 'для термопринтеров Zebra',
  },
]

interface StickerFormatSelectorProps {
  /** Currently selected format */
  value: StickerFormat
  /** Callback when format changes */
  onChange: (format: StickerFormat) => void
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Additional className for the container */
  className?: string
}

export function StickerFormatSelector({
  value,
  onChange,
  disabled = false,
  className,
}: StickerFormatSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-sm font-medium text-gray-700">Выберите формат:</Label>

      <RadioGroup
        value={value}
        onValueChange={val => onChange(val as StickerFormat)}
        disabled={disabled}
        className="space-y-2"
        aria-label="Формат стикеров"
      >
        {FORMAT_OPTIONS.map(option => (
          <div key={option.value} className="flex items-center space-x-3">
            <RadioGroupItem
              value={option.value}
              id={`format-${option.value}`}
              disabled={disabled}
              className={cn(disabled && 'cursor-not-allowed opacity-50')}
            />
            <Label
              htmlFor={`format-${option.value}`}
              className={cn(
                'cursor-pointer font-normal text-gray-700',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="font-medium">{option.label}</span>
              <span className="text-gray-500"> - {option.description}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

/** Export format labels for tests */
export const FORMAT_LABELS: Record<StickerFormat, string> = {
  png: 'PNG - для обычных принтеров',
  svg: 'SVG - высокое качество',
  zpl: 'ZPL - для термопринтеров Zebra',
}
