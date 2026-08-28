/**
 * Orders row helper components and utilities.
 * Extracted from OrdersTableRow.tsx for file-size compliance (201 → ~150 lines).
 */

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { getWbStatusConfig } from '@/lib/wb-status-mapping'

/**
 * Detect anomalous salePrice > price inversion from WB data.
 * Threshold chosen at 1.2x — legitimate price adjustments stay under this;
 * observed bad data (order 4909080943) was 27x.
 * Backend resolved in Story 103.1 (request #170:25); guard kept for defense-in-depth.
 */
export function isPriceInverted(price: number, salePrice: number): boolean {
  return (
    Number.isFinite(price) && price > 0 && Number.isFinite(salePrice) && salePrice > price * 1.2
  )
}

/** Build the anomaly message shown in tooltip + aria-label (single source of truth). */
export function formatAnomalyMessage(price: number, salePrice: number): string {
  const ratio = (salePrice / price).toFixed(1)
  return `Аномалия: цена продажи выше оригинальной цены в ${ratio} раз. Возможна ошибка данных на стороне WB.`
}

/** Truncate text with ellipsis */
export function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '—'
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/** WB Status Badge using wb-status-mapping */
export function WbStatusBadge({ status }: { status: string }) {
  const config = getWbStatusConfig(status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color,
        config.bgColor
      )}
    >
      {config.label}
    </span>
  )
}

/** Sale price cell with anomaly indicator (Story 87.3-FE) */
export function SalePriceCell({ price, salePrice }: { price: number; salePrice: number }) {
  if (!isPriceInverted(price, salePrice)) {
    return <>{formatCurrency(salePrice)}</>
  }

  const anomalyMessage = formatAnomalyMessage(price, salePrice)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Story 172.14-FE: raw button → ui Button (ghost); h-auto/px-0/font-normal
              neutralize the h-9/px-4/font-medium defaults (172.9 lesson (c)) */}
          <Button
            type="button"
            variant="ghost"
            aria-label={anomalyMessage}
            className="h-auto w-auto gap-1 px-0 py-0 text-sm font-normal hover:bg-transparent hover:text-foreground focus-visible:ring-2 focus-visible:ring-status-warning [&_svg]:size-3.5"
          >
            {formatCurrency(salePrice)}
            <AlertTriangle className="h-3.5 w-3.5 text-status-warning" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{anomalyMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** Product name cell with optional truncation tooltip */
export function ProductNameCell({ productName }: { productName: string }) {
  const needsTruncation = productName.length > 40

  return needsTruncation ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground">{truncateText(productName, 40)}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{productName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span className="text-xs text-muted-foreground">{productName}</span>
  )
}
