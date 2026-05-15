/** Column cell renderers for PerformanceMetricsTable — extracted for 200-line limit */

'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdvertisingItem } from '@/types/advertising-analytics'
import { formatCurrency, formatMultiplier, truncateText } from './performance-table-formatters'

// ============================================================================
// Generic value renderer with unknown status handling (AC7)
// ============================================================================

export function renderValue(
  item: AdvertisingItem,
  field: keyof AdvertisingItem,
  formatter: (v: number) => string
) {
  // For unknown status, show dash for profit-related fields
  if (item.efficiency_status === 'unknown') {
    if (field === 'profit' || field === 'roas' || field === 'roi' || field === 'profit_after_ads') {
      return <span className="text-muted-foreground">—</span>
    }
  }

  const value = item[field]
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>
  }

  const numValue = Number(value)
  const isNegative = numValue < 0

  return <span className={cn(isNegative && 'text-red-600 font-medium')}>{formatter(numValue)}</span>
}

// ============================================================================
// Name cell with truncation + tooltip
// ============================================================================

export function renderName(item: AdvertisingItem, viewBy: string) {
  const name = viewBy === 'sku' ? item.product_name : undefined
  if (!name) return null

  if (name.length > 45) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">{truncateText(name, 45)}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  return name
}

// ============================================================================
// Epic 35: Organic sales with negative over-attribution handling
// See: docs/request-backend/77-total-sales-organic-ad-split.md
// ============================================================================

export function renderOrganicSales(item: AdvertisingItem) {
  if (item.organic_sales === undefined || item.organic_sales === null) {
    return <span className="text-muted-foreground">—</span>
  }

  // Edge case: WB over-attribution (revenue > total_sales)
  if (item.organic_sales < 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-end gap-1.5 cursor-help">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-muted-foreground">—</span>
              <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                Переатрибуция
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-sm">
            <div className="space-y-2">
              <p className="font-medium">WB API переатрибутировал продажи</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  {/* Over-attribution branch — revenue > total_sales, so revenue is not null here. `?? 0` is defensive. */}
                  {/* eslint-disable-next-line no-restricted-syntax -- PRE-EXISTING: revenue is non-null in this branch (revenue > total_sales guard above). Review in Story 105.X. */}
                  Выручка из рекламы ({formatCurrency(item.revenue ?? 0)}) больше общей выручки
                  товара ({formatCurrency(item.total_sales)}).
                </p>
                <p className="mt-2">
                  Причина: WB засчитывает продажи к рекламе, даже если покупка была через
                  органический поиск после клика на объявление.
                </p>
                <p className="mt-2 font-medium">
                  Органика = {formatCurrency(item.total_sales)} -{' '}
                  {/* eslint-disable-next-line no-restricted-syntax -- PRE-EXISTING: revenue non-null in over-attribution branch. Review in Story 105.X. */}
                  {formatCurrency(item.revenue ?? 0)} = {formatCurrency(item.organic_sales)}
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Normal case: positive organic sales
  return <span>{formatCurrency(item.organic_sales)}</span>
}

// ============================================================================
// Total Sales with explanation tooltip
// ============================================================================

export function renderTotalSales(item: AdvertisingItem) {
  if (item.total_sales === undefined || item.total_sales === null) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted underline-offset-4">
            {formatCurrency(item.total_sales)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-medium">Общая выручка товара</p>
            <p className="text-muted-foreground">Формула: Органика + Реклама</p>
            <p className="mt-1">
              {formatCurrency(item.organic_sales || 0)} + {formatCurrency(item.revenue || 0)} ={' '}
              {formatCurrency(item.total_sales)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// ROAS with formula tooltip
// ============================================================================

export function renderROAS(item: AdvertisingItem) {
  if (item.efficiency_status === 'unknown') {
    return <span className="text-muted-foreground">—</span>
  }
  if (item.roas === undefined || item.roas === null) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted underline-offset-4">
            {formatMultiplier(item.roas)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-medium">Return on Ad Spend (ROAS)</p>
            <p className="text-muted-foreground">Формула: Выручка из рекламы / Расход на рекламу</p>
            <p className="mt-1">
              {formatCurrency(item.revenue || 0)} / {formatCurrency(item.spend || 0)} ={' '}
              {formatMultiplier(item.roas)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
