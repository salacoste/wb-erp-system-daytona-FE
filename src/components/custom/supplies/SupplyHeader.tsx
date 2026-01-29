'use client'

/**
 * SupplyHeader Component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Displays supply information and action buttons based on status.
 */

import { Calendar, Package, RefreshCw, Plus, Lock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SupplyStatusBadge } from './SupplyStatusBadge'
import { formatDate } from '@/lib/utils'
import type { Supply, SupplyStatus } from '@/types/supplies'

interface SupplyHeaderProps {
  supply: Supply
  onAddOrders?: () => void
  onCloseSupply?: () => void
  onGenerateStickers?: () => void
  onRefreshStatus?: () => void
  isLoading?: boolean
}

/** Format date for display */
function formatDisplayDate(dateString: string | null): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const dateStr = formatDate(date)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${dateStr} ${hours}:${minutes}`
}

/** Get informational message based on status */
function getStatusMessage(status: SupplyStatus): string | null {
  switch (status) {
    case 'DELIVERING':
      return 'Поставка в пути к складу WB'
    case 'DELIVERED':
      return 'Поставка успешно доставлена'
    case 'CANCELLED':
      return 'Поставка была отменена'
    default:
      return null
  }
}

export function SupplyHeader({
  supply,
  onAddOrders,
  onCloseSupply,
  onGenerateStickers,
  onRefreshStatus,
  isLoading = false,
}: SupplyHeaderProps) {
  const { id, name, status, ordersCount, createdAt, closedAt } = supply
  const displayName = name || `Поставка #${id.slice(-6)}`
  const statusMessage = getStatusMessage(status)
  const canClose = status === 'OPEN' && ordersCount > 0

  return (
    <div className="space-y-4">
      {/* Header with title, badge and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <SupplyStatusBadge status={status} size="lg" />
          </div>

          {/* Meta information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Создана: {formatDisplayDate(createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>Заказов: {ordersCount}</span>
            </div>
            {closedAt && (
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span>Закрыта: {formatDisplayDate(closedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {status === 'OPEN' && (
            <>
              <Button onClick={onAddOrders} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить заказы
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        onClick={onCloseSupply}
                        disabled={!canClose || isLoading}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Закрыть поставку
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canClose && (
                    <TooltipContent>
                      <p>Добавьте хотя бы один заказ</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          {status === 'CLOSED' && (
            <>
              <Button onClick={onGenerateStickers} disabled={isLoading}>
                <FileText className="mr-2 h-4 w-4" />
                Сгенерировать стикеры
              </Button>
              <Button variant="outline" onClick={onRefreshStatus} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Обновить статус
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status message for view-only statuses */}
      {statusMessage && (
        <Alert variant={status === 'CANCELLED' ? 'destructive' : 'default'}>
          <AlertDescription aria-live="polite">{statusMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
