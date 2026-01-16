'use client'

import { useRouter } from 'next/navigation'
import { Trophy, Medal, ChevronRight } from 'lucide-react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { TopConsumerItem } from '@/types/storage-analytics'

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

// Cost severity thresholds per UX Decision Q10
type CostSeverity = 'high' | 'medium' | 'low' | 'unknown'

function getCostSeverity(ratio: number | null): CostSeverity {
  if (ratio === null) return 'unknown'
  if (ratio > 20) return 'high'
  if (ratio > 10) return 'medium'
  return 'low'
}

// Rank Indicator Component (UX Decision Q9)
function RankIndicator({ rank }: { rank: number }) {
  switch (rank) {
    case 1:
      return (
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" aria-label="1 место" />
          <span className="text-sm font-medium">1</span>
        </div>
      )
    case 2:
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-gray-400" aria-label="2 место" />
          <span className="text-sm font-medium">2</span>
        </div>
      )
    case 3:
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-amber-600" aria-label="3 место" />
          <span className="text-sm font-medium">3</span>
        </div>
      )
    default:
      return <span className="text-sm text-muted-foreground ml-5">{rank}</span>
  }
}

// Cost Severity Dot Component (UX Decision Q10)
function CostSeverityDot({ ratio }: { ratio: number | null }) {
  const severity = getCostSeverity(ratio)

  const colors: Record<CostSeverity, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
    unknown: 'bg-gray-300',
  }

  const labels: Record<CostSeverity, string> = {
    high: 'Высокие затраты',
    medium: 'Средние затраты',
    low: 'Низкие затраты',
    unknown: 'Нет данных',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {ratio !== null && (
              <span className={cn('text-sm', severity === 'high' && 'text-red-600 font-medium')}>
                {ratio.toFixed(1)}%
              </span>
            )}
            <span
              className={cn('w-2 h-2 rounded-full flex-shrink-0', colors[severity])}
              aria-label={labels[severity]}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{labels[severity]}</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Отношение затрат на хранение к выручке.
            {severity === 'high' && ' Рекомендуется оптимизация.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
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
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Товар</TableHead>
            <TableHead className="w-[100px] text-right">Хранение</TableHead>
            <TableHead className="w-[80px] text-right">% общих</TableHead>
            <TableHead className="w-[100px] text-right">Хран/Выр</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={item.nm_id}
              className="cursor-pointer"
              onClick={() => handleRowClick(item.nm_id)}
            >
              <TableCell>
                <RankIndicator rank={index + 1} />
              </TableCell>
              <TableCell className="font-medium max-w-[200px]" title={`${item.vendor_code || item.nm_id} (${item.brand || 'Без бренда'})`}>
                <div className="flex flex-col">
                  <span className="truncate">{item.vendor_code || item.nm_id}</span>
                  {item.brand && (
                    <span className="text-xs text-muted-foreground truncate">{item.brand}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.storage_cost)}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {item.percent_of_total.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right">
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
