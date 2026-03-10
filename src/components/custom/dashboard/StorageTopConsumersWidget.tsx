/**
 * Storage Top Consumers Widget - Story 63.5-FE
 * Epic 63: Dashboard Main Page (Frontend)
 * @see docs/stories/epic-63/story-63.5-fe-storage-top-consumers.md
 * Request #156: Added warehouse stock indicators
 */

'use client'

import { useRouter } from 'next/navigation'
import { Package, ArrowRight, PackageX, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStorageTopConsumers } from '@/hooks/useStorageAnalytics'
import { formatCurrency, cn } from '@/lib/utils'
import { RankIndicator } from './RankIndicator'
import { StorageRatioIndicator } from './StorageRatioIndicator'
import { LoadingSkeleton, EmptyState, ErrorState } from './StorageTopConsumersStates'
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
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">
            {item.product_name || item.vendor_code || item.nm_id}
          </p>
          {/* Request #156: No stock indicator */}
          {item.has_warehouse_stock === false && (
            <PackageX className="h-3 w-3 text-amber-600 flex-shrink-0" aria-label="Нет на складе" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.vendor_code && item.product_name && (
            <p className="text-xs text-muted-foreground truncate">{item.vendor_code}</p>
          )}
          {/* Request #156: Last charge date indicator */}
          {item.last_charge_date && (
            <p
              className="text-[10px] text-muted-foreground flex items-center gap-0.5"
              title="Последняя оплата хранения"
            >
              <Calendar className="h-2.5 w-2.5" />
              {new Date(item.last_charge_date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-medium text-[#7C4DFF]">{formatCurrency(item.storage_cost)}</p>
        <p className="text-xs text-muted-foreground">{item.percent_of_total.toFixed(1)}%</p>
        {/* Request #156: FBO/FBS storage split */}
        {(item.storage_fbo != null || item.storage_fbs != null) && (
          <p className="text-[10px] text-muted-foreground">
            {item.storage_fbo != null && `FBO ${formatCurrency(item.storage_fbo)}`}
            {item.storage_fbo != null && item.storage_fbs != null && ' · '}
            {item.storage_fbs != null && `FBS ${formatCurrency(item.storage_fbs)}`}
          </p>
        )}
      </div>
      <div className="w-20 flex-shrink-0 flex justify-end">
        <StorageRatioIndicator ratio={item.storage_to_revenue_ratio ?? null} />
      </div>
    </div>
  )
}
