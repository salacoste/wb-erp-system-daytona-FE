'use client'

/**
 * DeliveryTypeSelector Component
 * Story 44.42-FE: Box Type Selection Support
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Dropdown selector for Wildberries delivery/box types:
 * - Boxes (2): Standard delivery
 * - Pallets (5): Fixed storage rate
 * - Supersafe (6): High-value items
 *
 * NOTE: This is a NEW component (Story 44.42-FE) that uses BoxTypeId (2|5|6).
 * The legacy BoxTypeSelector (Story 44.32) uses BoxType ('box'|'pallet').
 *
 * @see docs/stories/epic-44/story-44.42-fe-box-type-support.md
 */

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { BOX_TYPES, type BoxTypeId } from '@/lib/box-type-utils'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

/**
 * Props for DeliveryTypeSelector component (Story 44.42-FE interface)
 */
export interface DeliveryTypeSelectorProps {
  /** Currently selected box type ID */
  value: BoxTypeId
  /** Callback when box type changes */
  onChange: (value: BoxTypeId) => void
  /** Available box types at selected warehouse */
  availableTypes: BoxTypeId[]
  /** Disable the entire selector */
  disabled?: boolean
}

// ============================================================================
// Component
// ============================================================================

/**
 * Delivery type selector dropdown
 *
 * Features:
 * - Select dropdown with all 3 WB box types
 * - Icon + Russian name for each option
 * - "фикс." badge for Pallets (fixed storage rate)
 * - Disabled state for unavailable types at warehouse
 * - Tooltip "Недоступно на этом складе" for unavailable options
 * - Explanation text when Pallets selected
 * - WCAG 2.1 AA accessible
 */
export function DeliveryTypeSelector({
  value,
  onChange,
  availableTypes,
  disabled = false,
}: DeliveryTypeSelectorProps) {
  const selectedBoxType = BOX_TYPES[value]
  const showFixedRateExplanation = selectedBoxType?.storageFormula === 'fixed'

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <Label htmlFor="box-type">Тип доставки</Label>

        <Select
          value={String(value)}
          onValueChange={(v) => onChange(Number(v) as BoxTypeId)}
          disabled={disabled}
        >
          <SelectTrigger id="box-type" aria-label="Тип доставки">
            <SelectValue placeholder="Выберите тип">
              <span className="flex items-center gap-2">
                <span>{selectedBoxType?.icon}</span>
                <span>{selectedBoxType?.nameRu}</span>
              </span>
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {Object.values(BOX_TYPES).map((boxType) => {
              const isAvailable = availableTypes.includes(boxType.id)
              const isFixed = boxType.storageFormula === 'fixed'

              return (
                <BoxTypeOption
                  key={boxType.id}
                  boxType={boxType}
                  isAvailable={isAvailable}
                  isFixed={isFixed}
                />
              )
            })}
          </SelectContent>
        </Select>

        {showFixedRateExplanation && (
          <p className="text-sm text-muted-foreground">
            {selectedBoxType.icon} Хранение не зависит от объёма товара
          </p>
        )}
      </div>
    </TooltipProvider>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

interface BoxTypeOptionProps {
  boxType: (typeof BOX_TYPES)[BoxTypeId]
  isAvailable: boolean
  isFixed: boolean
}

/**
 * Individual box type option with tooltip for unavailable types
 */
function BoxTypeOption({ boxType, isAvailable, isFixed }: BoxTypeOptionProps) {
  const optionContent = (
    <SelectItem
      value={String(boxType.id)}
      disabled={!isAvailable}
      className={cn(!isAvailable && 'opacity-50')}
    >
      <span className="flex items-center gap-2">
        <span>{boxType.icon}</span>
        <span>{boxType.nameRu}</span>
        {isFixed && (
          <Badge variant="outline" className="text-xs">
            фикс.
          </Badge>
        )}
      </span>
    </SelectItem>
  )

  // Only wrap with tooltip if unavailable
  if (!isAvailable) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{optionContent}</TooltipTrigger>
        <TooltipContent>Недоступно на этом складе</TooltipContent>
      </Tooltip>
    )
  }

  return optionContent
}
