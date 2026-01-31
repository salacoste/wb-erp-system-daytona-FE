/**
 * Storage Top Consumers Widget - Story 63.5-FE
 * Epic 63: Dashboard Main Page (Frontend)
 * @see docs/stories/epic-63/story-63.5-fe-storage-top-consumers.md
 */

'use client'

import { useRouter } from 'next/navigation'
import { Package, ArrowRight, AlertCircle, PackageX } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStorageTopConsumers } from '@/hooks/useStorageAnalytics'
import { formatCurrency, cn } from '@/lib/utils'
import { RankIndicator } from './RankIndicator'
import { StorageRatioIndicator } from './StorageRatioIndicator'
import type { TopConsumerItem } from '@/types/storage-analytics'

export interface StorageTopConsumersWidgetProps {
  weekStart: string
  weekEnd: string
  limit?: number
  includeRevenue?: boolean
  onViewAll?: () => void
  onProductClick?: (nmId: string) => void
  className?: string
}

export function StorageTopConsumersWidget({
  weekStart,
  weekEnd,
  limit = 5,
  includeRevenue = true,
  onViewAll,
  onProductClick,
  className,
}: StorageTopConsumersWidgetProps) {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch } = useStorageTopConsumers(weekStart, weekEnd, {
    limit,
    include_revenue: includeRevenue,
  })

  const handleViewAll = () => (onViewAll ? onViewAll() : router.push('/analytics/storage'))
  const handleRowClick = (nmId: string) =>
    onProductClick ? onProductClick(nmId) : router.push('/analytics/storage')
  const handleKeyDown = (e: React.KeyboardEvent, nmId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick(nmId)
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Package className="h-5 w-5 text-[#7C4DFF]" />
          Топ по расходам на хранение
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Смотреть все
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingSkeleton rows={limit} />}
        {isError && <ErrorState error={error} onRetry={refetch} />}
        {!isLoading && !isError && !data?.has_data && <EmptyState />}
        {!isLoading && !isError && data?.has_data && (
          <ConsumersList
            items={data.top_consumers}
            onRowClick={handleRowClick}
            onKeyDown={handleKeyDown}
          />
        )}
      </CardContent>
    </Card>
  )
}

function ConsumersList({
  items,
  onRowClick,
  onKeyDown,
}: {
  items: TopConsumerItem[]
  onRowClick: (nmId: string) => void
  onKeyDown: (e: React.KeyboardEvent, nmId: string) => void
}) {
  return (
    <div className="space-y-1">
      {items.map(item => (
        <ConsumerRow
          key={item.nm_id}
          item={item}
          onClick={() => onRowClick(item.nm_id)}
          onKeyDown={e => onKeyDown(e, item.nm_id)}
        />
      ))}
    </div>
  )
}

function ConsumerRow({
  item,
  onClick,
  onKeyDown,
}: {
  item: TopConsumerItem
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-center gap-3 px-2 py-2 rounded-md',
        'cursor-pointer hover:bg-muted/50 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={`${item.product_name || item.vendor_code || item.nm_id}, хранение ${formatCurrency(item.storage_cost)}`}
    >
      <div className="w-10 flex-shrink-0">
        <RankIndicator rank={item.rank} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {item.product_name || item.vendor_code || item.nm_id}
        </p>
        {item.vendor_code && item.product_name && (
          <p className="text-xs text-muted-foreground truncate">{item.vendor_code}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-medium text-[#7C4DFF]">{formatCurrency(item.storage_cost)}</p>
        <p className="text-xs text-muted-foreground">{item.percent_of_total.toFixed(1)}%</p>
      </div>
      <div className="w-20 flex-shrink-0 flex justify-end">
        <StorageRatioIndicator ratio={item.storage_to_revenue_ratio ?? null} />
      </div>
    </div>
  )
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="h-5 w-10" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <PackageX className="h-10 w-10 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">Нет данных по хранению за выбранный период</p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
      <p className="text-sm text-muted-foreground mb-3">
        {error?.message || 'Ошибка загрузки данных'}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  )
}
