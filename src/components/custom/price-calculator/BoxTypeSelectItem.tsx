'use client'

import { Badge } from '@/components/ui/badge'
import { SelectItem } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { BOX_TYPES, type BoxTypeId, ALL_BOX_TYPE_IDS } from '@/lib/box-type-utils'

interface BoxTypeSelectItemProps {
  typeId: BoxTypeId
  isAvailable: boolean
}

/**
 * Single select item for a box type, with availability tooltip
 * Story 44.42-FE: Box Type Selection Support
 * Extracted from BoxTypeSelector.tsx for file size compliance.
 */
export function BoxTypeSelectItem({ typeId, isAvailable }: BoxTypeSelectItemProps) {
  const info = BOX_TYPES[typeId]
  const isFixed = info.storageFormula === 'fixed'

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <div>
          <SelectItem
            value={String(typeId)}
            disabled={!isAvailable}
            className={cn('cursor-pointer', !isAvailable && 'opacity-50 cursor-not-allowed')}
          >
            <span className="flex items-center gap-2">
              <span>{info.icon}</span>
              <span>{info.nameRu}</span>
              {isFixed && (
                <Badge variant="outline" className="text-xs ml-1 px-1.5 py-0">
                  фикс.
                </Badge>
              )}
            </span>
          </SelectItem>
        </div>
      </TooltipTrigger>
      {!isAvailable && <TooltipContent side="right">Недоступно на этом складе</TooltipContent>}
    </Tooltip>
  )
}

export { ALL_BOX_TYPE_IDS }
