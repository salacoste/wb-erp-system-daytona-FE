'use client'

import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FulfillmentType } from '@/types/price-calculator'

/**
 * Props for FulfillmentTypeSelector component
 * Story 44.15-FE: FBO/FBS Fulfillment Type Selection
 */
export interface FulfillmentTypeSelectorProps {
  /** Currently selected fulfillment type */
  value: FulfillmentType
  /** Callback when fulfillment type changes */
  onChange: (type: FulfillmentType) => void
  /** Disable the selector */
  disabled?: boolean
  /** Optional commission difference to display (FBS - FBO) */
  commissionDiff?: number
}

/**
 * FBO/FBS Fulfillment Type selector component
 * Segmented control for selecting between FBO and FBS fulfillment types
 *
 * Features:
 * - Visual segmented control design
 * - Russian labels with descriptive subtitles
 * - Tooltip explaining FBO vs FBS differences
 * - Optional commission difference badge on FBS
 * - Full accessibility support (keyboard, ARIA)
 *
 * @example
 * <FulfillmentTypeSelector
 *   value={fulfillmentType}
 *   onChange={setFulfillmentType}
 *   commissionDiff={3.5}
 * />
 */
export function FulfillmentTypeSelector({
  value,
  onChange,
  disabled = false,
  commissionDiff,
}: FulfillmentTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="flex-1">Тип исполнения</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                aria-label="Информация о типах исполнения"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="mb-2">
                <strong>FBO</strong> — товар хранится на складе WB. Ниже комиссия,
                но есть расходы на хранение и приёмку.
              </p>
              <p>
                <strong>FBS</strong> — товар у продавца, отгрузка по заказу.
                Выше комиссия (+3-4%), но нет расходов на хранение.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div
        className="flex rounded-lg border p-1 bg-muted/50"
        role="radiogroup"
        aria-label="Тип исполнения"
      >
        {/* FBO Option */}
        <button
          type="button"
          role="radio"
          aria-checked={value === 'FBO'}
          onClick={() => !disabled && onChange('FBO')}
          disabled={disabled}
          className={cn(
            'flex-1 px-4 py-3 rounded-md text-sm font-medium transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            value === 'FBO'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="text-center">
            <div className="font-semibold">FBO</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Товар на складе WB
            </div>
          </div>
        </button>

        {/* FBS Option */}
        <button
          type="button"
          role="radio"
          aria-checked={value === 'FBS'}
          onClick={() => !disabled && onChange('FBS')}
          disabled={disabled}
          className={cn(
            'flex-1 px-4 py-3 rounded-md text-sm font-medium transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            value === 'FBS'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-semibold">FBS</span>
              {commissionDiff !== undefined && commissionDiff > 0 && (
                <Badge variant="outline" className="text-xs py-0 px-1.5">
                  +{commissionDiff.toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Товар у продавца
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
