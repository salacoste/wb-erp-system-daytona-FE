/**
 * ProductRowBadge Component
 * Epic 36: Product Card Linking (склейки)
 * Story 36.6: Frontend Integration - Badge Display
 *
 * Displays badge for products in merged groups (imtId-based).
 * Three cases:
 * 1. imtId === null → No badge (standalone product)
 * 2. imtId !== null && spend > 0 → Main product badge
 * 3. imtId !== null && spend === 0 → Child product badge
 *
 * @see frontend/docs/request-backend/87-epic-36-backend-response-imtid-sku.md
 */

import { Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { AdvertisingItem } from '@/types/advertising-analytics'

interface ProductRowBadgeProps {
  /** Advertising item with imtId field */
  item: AdvertisingItem
  /** Callback when user clicks "Show merged group metrics" button */
  onShowMergedGroup?: (imtId: number) => void
}

/**
 * ProductRowBadge - Displays badge for products in merged groups.
 *
 * @param item - Advertising item with imtId and spend
 * @param onShowMergedGroup - Callback to navigate to merged group view
 *
 * @example
 * // Main product (spend > 0)
 * <ProductRowBadge
 *   item={{ imtId: 328632, spend: 11337, ... }}
 *   onShowMergedGroup={(imtId) => switchToMergedView(imtId)}
 * />
 *
 * // Child product (spend = 0)
 * <ProductRowBadge
 *   item={{ imtId: 328632, spend: 0, ... }}
 *   onShowMergedGroup={(imtId) => switchToMergedView(imtId)}
 * />
 *
 * // Standalone product (no badge shown)
 * <ProductRowBadge item={{ imtId: null, ... }} />
 */
export function ProductRowBadge({ item, onShowMergedGroup }: ProductRowBadgeProps) {
  // Case 1: imtId === null → No badge (standalone product)
  if (item.imtId === null) {
    return null
  }

  // Case 2 & 3: Product is in merged group
  const isMainProduct = item.spend > 0
  const badgeText = isMainProduct
    ? `Главный товар в склейке №${item.imtId}`
    : `Дочерний товар склейки №${item.imtId}`

  const badgeVariant = isMainProduct ? 'default' : 'secondary'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={badgeVariant} className="gap-1.5 cursor-help">
            <Link2 className="h-3 w-3" />
            <span className="text-xs">{badgeText}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-3">
            {/* Header */}
            <div>
              <p className="font-medium">
                {isMainProduct ? 'Главный товар в склейке' : 'Дочерний товар склейки'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Склейка №{item.imtId}
              </p>
            </div>

            {/* Explanation */}
            <div className="text-xs text-muted-foreground space-y-2">
              {isMainProduct ? (
                <>
                  <p>
                    <strong>Главный товар</strong> — получает рекламный бюджет (spend &gt; 0).
                  </p>
                  <p>
                    WB объединяет несколько карточек товаров в одну «склейку» (merged group).
                    Главный товар генерирует показы и клики для всей группы.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Дочерний товар</strong> — не получает прямой бюджет (spend = 0).
                  </p>
                  <p>
                    Продажи дочернего товара учитываются как результат рекламы главного товара
                    из этой же склейки.
                  </p>
                </>
              )}
              <p className="mt-2">
                <strong>Склейка</strong> — группа карточек товаров с одинаковым imtId,
                объединённых WB для совместной рекламы и аналитики.
              </p>
            </div>

            {/* Action button */}
            {onShowMergedGroup && (
              <div className="pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowMergedGroup(item.imtId!)
                  }}
                  className="w-full text-xs"
                >
                  Показать метрики склейки
                </Button>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
