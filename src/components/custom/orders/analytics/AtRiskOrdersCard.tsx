'use client'

/**
 * AtRiskOrdersCard Component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays paginated list of orders approaching SLA breach.
 * Reference: docs/stories/epic-40/story-40.6-fe-orders-analytics-dashboard.md#AC3
 */

import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getOrdersPlural } from '@/lib/analytics-utils'
import { AtRiskOrderRow } from './AtRiskOrderRow'
import type { AtRiskOrder } from '@/types/orders-analytics'

const PAGE_SIZE = 10

interface AtRiskOrdersCardProps {
  orders?: AtRiskOrder[]
  total?: number
  page?: number
  isLoading?: boolean
  error?: Error | null
  onPageChange?: (page: number) => void
  onOrderClick?: (orderId: string) => void
  onRetry?: () => void
}

/** Empty state when no at-risk orders */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <CheckCircle className="mb-2 h-10 w-10 text-green-500" data-testid="empty-state-icon" />
      <p className="text-sm text-gray-600">Нет заказов под угрозой</p>
    </div>
  )
}

/** Loading skeleton */
function AtRiskCardSkeleton() {
  return (
    <div data-testid="at-risk-card-skeleton" className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" data-testid={`skeleton-row-${i}`} />
      ))}
    </div>
  )
}

/** Error state with retry */
function AtRiskCardError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <XCircle className="mb-2 h-8 w-8 text-red-500" />
      <p className="mb-2 text-sm text-gray-600">Не удалось загрузить заказы</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Повторить
        </Button>
      )}
    </div>
  )
}

/** Pagination controls */
function Pagination({
  page,
  total,
  onPageChange,
}: {
  page: number
  total: number
  onPageChange?: (page: number) => void
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange?.(page - 1)}
        disabled={page === 0}
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Предыдущая
      </Button>
      <span className="text-sm text-gray-500">
        Стр. {page + 1} из {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange?.(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="Следующая страница"
      >
        Следующая
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  )
}

/**
 * AtRiskOrdersCard - Displays paginated at-risk orders list
 */
export function AtRiskOrdersCard({
  orders,
  total = 0,
  page = 0,
  isLoading,
  error,
  onPageChange,
  onOrderClick,
  onRetry,
}: AtRiskOrdersCardProps) {
  const hasOrders = orders && orders.length > 0

  return (
    <Card data-testid="at-risk-orders-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Заказы под угрозой SLA
          </span>
          {total > 0 && !isLoading && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-sm font-normal text-yellow-700">
              {getOrdersPlural(total)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <AtRiskCardSkeleton />}
        {error && !isLoading && <AtRiskCardError onRetry={onRetry} />}
        {!isLoading && !error && (
          <>
            {!hasOrders && <EmptyState />}
            {hasOrders && (
              <div role="list" data-testid="at-risk-orders-list" className="space-y-2">
                {orders.map(order => (
                  <AtRiskOrderRow key={order.orderId} order={order} onClick={onOrderClick} />
                ))}
              </div>
            )}
            {total > PAGE_SIZE && (
              <Pagination page={page} total={total} onPageChange={onPageChange} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
