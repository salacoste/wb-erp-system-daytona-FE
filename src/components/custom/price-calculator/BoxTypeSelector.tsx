'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FieldTooltip } from './FieldTooltip'
import { cn } from '@/lib/utils'
import type { BoxType } from '@/types/price-calculator'

/**
 * Props for BoxTypeSelector component
 * Story 44.32: Missing Price Calculator Fields
 */
export interface BoxTypeSelectorProps {
  /** Currently selected box type */
  value?: BoxType
  /** Callback when box type changes */
  onValueChange?: (value: BoxType) => void
  /** Disable the selector */
  disabled?: boolean
}

/**
 * Box type labels and descriptions
 */
const BOX_TYPE_CONFIG = {
  box: {
    label: 'Короб',
    description: 'Стандартная доставка в коробе',
    apiId: 2,
  },
  pallet: {
    label: 'Монопаллета',
    description: 'Крупногабаритные товары на паллете',
    apiId: 5,
  },
} as const

/**
 * Box/Pallet type selector for FBO fulfillment
 * Radio group component for selecting package type
 *
 * Features:
 * - Radio buttons for box/pallet selection
 * - Russian labels with descriptions
 * - Tooltip explaining cost impact
 * - Warning icon for pallet selection
 * - Full accessibility support
 *
 * @example
 * <BoxTypeSelector
 *   value={boxType}
 *   onValueChange={setBoxType}
 *   disabled={disabled}
 * />
 */
export function BoxTypeSelector({
  value = 'box',
  onValueChange,
  disabled = false,
}: BoxTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="flex-1">Тип упаковки</Label>
        <FieldTooltip content="Тип доставки влияет на стоимость приёмки: Короб (~1.70 ₽/л) или Монопаллета (~500 ₽ фикс)." />
      </div>

      <RadioGroup
        value={value}
        onValueChange={(v) => onValueChange?.(v as BoxType)}
        disabled={disabled}
        className="grid grid-cols-2 gap-4"
      >
        {(Object.keys(BOX_TYPE_CONFIG) as BoxType[]).map((type) => {
          const isSelected = value === type
          return (
            <div
              key={type}
              className={cn(
                'flex items-center space-x-2 border rounded-lg p-3',
                'hover:bg-muted/50 transition-colors cursor-pointer',
                isSelected && 'border-primary border-2 bg-red-50',
                !isSelected && 'border-gray-200 bg-white',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RadioGroupItem value={type} id={`box-${type}`} disabled={disabled} />
              <Label
                htmlFor={`box-${type}`}
                className="flex-1 cursor-pointer font-normal"
              >
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'font-medium',
                      isSelected ? 'text-primary-dark' : 'text-foreground'
                    )}
                  >
                    {BOX_TYPE_CONFIG[type].label}
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      isSelected ? 'text-gray-700' : 'text-muted-foreground'
                    )}
                  >
                    {BOX_TYPE_CONFIG[type].description}
                  </span>
                </div>
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}
