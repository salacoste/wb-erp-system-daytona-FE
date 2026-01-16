/**
 * MergedProductBadge Component (Epic 36)
 *
 * Displays a badge indicating a merged product group (склейка) with a tooltip
 * showing all products in the group.
 *
 * Returns null for single products with imtId (edge case handling).
 *
 * @see frontend/docs/request-backend/83-epic-36-api-contract.md
 * @see frontend/docs/stories/epic-36/story-36.3-fe-merged-badge-component.md
 */

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { MergedProduct } from '@/types/advertising-analytics'

interface MergedProductBadgeProps {
  /** WB merged card identifier */
  imtId: number
  /** Products within the merged group */
  mergedProducts: MergedProduct[]
  /** Optional custom badge text (default: "Склейка (N)") */
  label?: string
  /** Optional className for styling */
  className?: string
}

export function MergedProductBadge({
  imtId,
  mergedProducts,
  label,
  className,
}: MergedProductBadgeProps) {
  const productCount = mergedProducts.length

  // Edge case: Single product with imtId (display as individual)
  if (productCount === 1) {
    return null
  }

  const defaultLabel = `Склейка (${productCount})`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={`ml-2 cursor-help ${className || ''}`}
          >
            🔗 {label ?? defaultLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-sm">
              Объединённая карточка #{imtId}
            </p>
            <p className="text-xs text-muted-foreground">
              Товары в группе:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              {mergedProducts.map((product) => (
                <li key={product.nmId}>
                  <span className="font-mono">{product.vendorCode}</span>
                  <span className="text-muted-foreground ml-1">
                    (#{product.nmId})
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              💡 Рекламные затраты основной карточки распределены между всеми
              товарами группы
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
