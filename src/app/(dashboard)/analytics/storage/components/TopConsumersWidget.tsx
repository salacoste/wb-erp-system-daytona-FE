'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, HelpCircle, PackageX, Calendar } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TopConsumerItem } from '@/types/storage-analytics'
import { RankIndicator, CostSeverityDot } from './TopConsumersHelpers'
import { formatPercentage } from '@/lib/utils'

/**
 * Top Consumers Widget
 * Story 24.4-FE: Top Consumers Widget
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Shows top 5 products by storage cost with revenue ratio indicators.
 */

interface TopConsumersWidgetProps {
  data: TopConsumerItem[]
  isLoading?: boolean
  onViewAll?: () => void
  onProductClick?: (nmId: string) => void
}

export function TopConsumersWidget({
  data,
  isLoading = false,
  onViewAll,
  onProductClick,
}: TopConsumersWidgetProps) {
  const router = useRouter()

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Handle row click
  const handleRowClick = (nmId: string) => {
    if (onProductClick) {
      onProductClick(nmId)
    } else {
      router.push(`/analytics/sku?nm_id=${nmId}`)
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground">
        Нет данных за выбранный период
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <div className="flex items-center gap-1">
                #
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px]">
                      <p className="text-xs">Топ товаров по расходам на хранение.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠ Это история начислений, не текущие остатки. Товар может быть уже продан.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableHead>
            <TableHead>Товар</TableHead>
            <TableHead className="w-[100px] text-right">Хранение</TableHead>
            <TableHead className="w-[80px] text-right">% общих</TableHead>
            <TableHead className="w-[100px] text-right">Хран/Выр</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(item => (
            <TableRow
              key={item.nm_id}
              className="cursor-pointer"
              onClick={() => handleRowClick(item.nm_id)}
            >
              <TableCell>
                <RankIndicator rank={item.rank} />
              </TableCell>
              <TableCell
                className="font-medium max-w-[200px]"
                title={`${item.vendor_code || item.nm_id} (${item.brand || 'Без бренда'})`}
              >
                <div className="flex flex-col">
                  <span className="truncate">{item.vendor_code || item.nm_id}</span>
                  {item.brand && (
                    <span className="text-xs text-muted-foreground truncate">{item.brand}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-medium">{formatCurrency(item.storage_cost)}</span>
                  {/* Show last charge date if available */}
                  {item.last_charge_date && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(item.last_charge_date).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                  {/* Show "No stock" indicator when has_warehouse_stock is false */}
                  {item.has_warehouse_stock === false && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                      <PackageX className="h-2.5 w-2.5" />
                      Нет на складе
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatPercentage(item.percent_of_total, 1)}
              </TableCell>
              <TableCell className="text-right">
                {/* storage_to_revenue_ratio is optional (undefined when revenue data is absent);
                    coerce undefined→null for CostSeverityDot's `number | null` prop. NOT `?? 0`
                    (anti-pattern #8: a missing ratio is unknown, rendered "Нет данных", not 0). */}
                <CostSeverityDot ratio={item.storage_to_revenue_ratio ?? null} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* View All Button */}
      {onViewAll && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-muted-foreground">
            Показать все
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
