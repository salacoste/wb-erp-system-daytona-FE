'use client'

import { Package } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useStorageBySku } from '@/hooks/useStorageAnalytics'
import { getLastCompletedWeek } from '@/lib/margin-helpers'

/**
 * Product Storage Info Component
 * Story 24.7-FE: Product Card Storage Info
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Displays storage cost per day and monthly estimate for a single product.
 * Uses last completed week for data.
 *
 * NOTE: This component makes an API call per product. For list views,
 * consider backend integration to include storage data in product response.
 */

interface ProductStorageInfoProps {
  nmId: string
  className?: string
}

// Format currency for display
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

export function ProductStorageInfo({ nmId, className }: ProductStorageInfoProps) {
  const lastCompletedWeek = getLastCompletedWeek()

  const { data, isLoading } = useStorageBySku(lastCompletedWeek, lastCompletedWeek, {
    nm_id: nmId,
    limit: 1,
  })

  if (isLoading) {
    return <Skeleton className="h-4 w-32" />
  }

  const item = data?.data?.[0]
  if (!item) {
    return null // No storage data available
  }

  const dailyCost = item.storage_cost_avg_daily
  const monthlyCost = dailyCost * 30

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 text-sm text-muted-foreground ${className || ''}`}>
            <Package className="h-4 w-4 flex-shrink-0" />
            <span>
              {formatCurrency(dailyCost)}/день
              <span className="text-xs ml-1 opacity-75">
                (~{formatCurrency(monthlyCost)}/мес)
              </span>
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Расходы на хранение</p>
            <p className="text-muted-foreground">
              Данные за неделю {lastCompletedWeek}
            </p>
            <div className="mt-1 space-y-0.5">
              <p>В день: {formatCurrency(dailyCost)}</p>
              <p>В месяц: ~{formatCurrency(monthlyCost)}</p>
              {item.volume_avg && (
                <p>Объём: {item.volume_avg.toFixed(1)} л</p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
