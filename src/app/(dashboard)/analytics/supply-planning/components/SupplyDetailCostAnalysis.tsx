'use client'

/**
 * Supply Planning Detail - Cost Analysis Section
 * Extracted from SupplyDetailRightColumn.tsx for file size compliance
 */

import { CircleHelp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import { formatStockQty, formatReorderValue } from '@/lib/supply-planning-utils'

interface CostAnalysisProps {
  item: SupplyPlanningItem
}

export function SupplyDetailCostAnalysis({ item }: CostAnalysisProps) {
  return (
    <section className="bg-card rounded-lg border p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        &#x1F4B0; Анализ затрат
      </h4>
      {item.has_cogs && item.cogs_per_unit ? (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Себестоимость:</dt>
            <dd className="font-medium text-foreground">
              {formatReorderValue(item.cogs_per_unit)}/шт × {formatStockQty(item.reorder_quantity)}{' '}
              = {formatReorderValue(item.reorder_value)}
            </dd>
          </div>
          {/* Expected revenue/profit — Request #203: uses real selling_price from backend. */}
          {item.selling_price != null &&
            item.cogs_per_unit != null &&
            item.reorder_quantity > 0 &&
            (() => {
              const profit = item.reorder_quantity * (item.selling_price - item.cogs_per_unit)
              return (
                <>
                  <div className="flex justify-between pt-2 border-t">
                    <dt className="text-muted-foreground">Ожид. выручка</dt>
                    <dd className="font-medium">
                      {formatReorderValue(item.reorder_quantity * item.selling_price)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Ожид. прибыль</dt>
                    <dd
                      className={cn('font-medium', profit >= 0 ? 'text-green-600' : 'text-red-600')}
                    >
                      {formatReorderValue(profit)}
                    </dd>
                  </div>
                </>
              )
            })()}
        </dl>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1">
                  — Себестоимость не указана
                  <CircleHelp className="h-3 w-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Укажите себестоимость для расчёта маржи</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Link
            href={`${ROUTES.COGS.ROOT}?sku=${item.sku_id}`}
            className="text-blue-600 hover:underline text-sm ml-2"
          >
            Указать COGS
          </Link>
        </div>
      )}
    </section>
  )
}
