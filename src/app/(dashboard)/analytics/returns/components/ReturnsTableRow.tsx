/**
 * ReturnsTableRow — Single row in ReturnsTable
 * Extracted from ReturnsTable.tsx for file-size compliance (Epic 134-FE)
 */

'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ROUTES } from '@/lib/routes'
import { buildProductAnalyticsRoute } from '@/lib/route-helpers'
import { cn } from '@/lib/utils'
import { ReturnRateCell } from './ReturnsTableHelpers'

interface ReturnsBySkuItem {
  nmId: number
  productName?: string
  brand?: string
  totalReturns: number
  returnRate: number | null
  cancelBeforeShipment: number
  refusalAtPvz: number
  returnAfterReceipt: number
  anomalyFlag?: boolean
}

interface ProductInfo {
  saName: string
  brand: string
  vendorCode: string
}

export function ReturnsTableRow({
  item,
  product,
}: {
  item: ReturnsBySkuItem
  product: ProductInfo | undefined
}) {
  return (
    // Story 169.11: /15 + /30 matched pair fixes light-only dark bug (169.5); icon paired foreground
    <TableRow className={cn(item.anomalyFlag && 'bg-status-error/15 hover:bg-status-error/30')}>
      <TableCell>
        {item.anomalyFlag && <AlertTriangle className="h-4 w-4 text-status-error" />}
      </TableCell>
      <TableCell className="font-mono text-xs">
        <Link
          href={buildProductAnalyticsRoute(String(item.nmId))}
          className="text-primary hover:underline"
        >
          {item.nmId}
        </Link>
      </TableCell>
      <TableCell className="text-sm max-w-48 truncate" title={product?.saName}>
        {product?.saName || item.productName || '—'}
      </TableCell>
      <TableCell className="text-sm">{product?.brand || item.brand || '—'}</TableCell>
      {/* Story 169.11: tabular-nums on numeric cells; nmId stays mono WITHOUT tabular (169.7 pin) */}
      <TableCell className="tabular-nums">{item.totalReturns}</TableCell>
      <TableCell>
        <ReturnRateCell rate={item.returnRate} />
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {item.cancelBeforeShipment}
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{item.refusalAtPvz}</TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {item.returnAfterReceipt}
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`${ROUTES.ANALYTICS.BUYOUT}?nmId=${String(item.nmId)}`}
                className="inline-flex items-center text-muted-foreground hover:text-foreground"
                aria-label="Перейти к аналитике выкупов"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Перейти к аналитике выкупов</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  )
}
