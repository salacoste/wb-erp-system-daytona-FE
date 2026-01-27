'use client'

/**
 * BoxTypeSelector Component
 * Story 44.42-FE: Box Type Selection Support
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Dropdown for selecting WB delivery/box type:
 * - 2: Коробки (Boxes) - Standard volume-based storage
 * - 5: Монопаллеты (Pallets) - Fixed rate storage (volume-independent!)
 * - 6: Суперсейф (Supersafe) - Standard volume-based storage
 *
 * @see docs/stories/epic-44/story-44.42-fe-box-type-support.md
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FieldTooltip } from './FieldTooltip'
import { cn } from '@/lib/utils'
import {
  BOX_TYPES,
  ALL_BOX_TYPE_IDS,
  DEFAULT_BOX_TYPE_ID,
  type BoxTypeId,
} from '@/lib/box-type-utils'

/**
 * Props for BoxTypeSelector component
 * Story 44.42-FE: Box Type Selection Support
 */
export interface BoxTypeSelectorProps {
  /** Currently selected box type ID (2=Boxes, 5=Pallets, 6=Supersafe) */
  value: BoxTypeId
  /** Callback when box type changes */
  onChange: (boxTypeId: BoxTypeId) => void
  /** Available box types at current warehouse (empty = all disabled) */
  availableTypes?: BoxTypeId[]
  /** Disable the entire selector */
  disabled?: boolean
  /** Placeholder when no warehouse selected */
  placeholder?: string
}

/**
 * Box Type Selector for Price Calculator
 *
 * Features:
 * - Dropdown with all 3 WB box types
 * - Icons and Russian labels for each type
 * - "фикс." badge for Pallets (fixed storage rate)
 * - Disabled states for unavailable types at warehouse
 * - Tooltip explaining why type is unavailable
 * - Full keyboard accessibility
 *
 * @example
 * <BoxTypeSelector
 *   value={boxTypeId}
 *   onChange={setBoxTypeId}
 *   availableTypes={[2, 5]}
 *   disabled={!warehouseId}
 * />
 */
export function BoxTypeSelector({
  value,
  onChange,
  availableTypes = ALL_BOX_TYPE_IDS,
  disabled = false,
  placeholder = 'Сначала выберите склад',
}: BoxTypeSelectorProps) {
  // Check if box type is available at current warehouse
  const isTypeAvailable = (typeId: BoxTypeId): boolean => {
    if (availableTypes.length === 0) return false
    return availableTypes.includes(typeId)
  }

  // Get display value for current selection
  const selectedInfo = BOX_TYPES[value]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="box-type-select" className="flex-1">
          Тип доставки
        </Label>
        <FieldTooltip content="Тип упаковки влияет на расчёт хранения. Для монопаллет хранение не зависит от объёма товара (фикс. ставка)." />
      </div>

      <Select
        value={String(value)}
        onValueChange={(v) => onChange(Number(v) as BoxTypeId)}
        disabled={disabled || availableTypes.length === 0}
      >
        <SelectTrigger
          id="box-type-select"
          className={cn(
            'w-full',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <SelectValue placeholder={placeholder}>
            {selectedInfo && (
              <span className="flex items-center gap-2">
                <span>{selectedInfo.icon}</span>
                <span>{selectedInfo.nameRu}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          <TooltipProvider>
            {ALL_BOX_TYPE_IDS.map((typeId) => {
              const info = BOX_TYPES[typeId]
              const isAvailable = isTypeAvailable(typeId)
              const isFixed = info.storageFormula === 'fixed'

              return (
                <Tooltip key={typeId} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div>
                      <SelectItem
                        value={String(typeId)}
                        disabled={!isAvailable}
                        className={cn(
                          'cursor-pointer',
                          !isAvailable && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span>{info.nameRu}</span>
                          {isFixed && (
                            <Badge
                              variant="outline"
                              className="text-xs ml-1 px-1.5 py-0"
                            >
                              фикс.
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    </div>
                  </TooltipTrigger>
                  {!isAvailable && (
                    <TooltipContent side="right">
                      Недоступно на этом складе
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </SelectContent>
      </Select>

      {/* Fixed storage explanation for Pallets */}
      {BOX_TYPES[value]?.storageFormula === 'fixed' && (
        <p className="text-sm text-muted-foreground">
          {BOX_TYPES[value].icon} Для монопаллет хранение не зависит от объёма
          товара
        </p>
      )}
    </div>
  )
}

/**
 * Default export for convenience
 */
export default BoxTypeSelector

/**
 * Re-export constants for consumers
 */
export { DEFAULT_BOX_TYPE_ID, ALL_BOX_TYPE_IDS, BOX_TYPES }
export type { BoxTypeId }
