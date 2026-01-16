'use client'

import {
  ChevronRight,
  ChevronDown,
  PackageX,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SupplyPlanningItem, StockoutRisk, VelocityTrend } from '@/types/supply-planning'
import {
  formatDaysUntilStockout,
  formatStockQty,
  formatReorderValue,
  formatVelocity,
  STOCKOUT_RISK_CONFIG,
  VELOCITY_TREND_CONFIG,
} from '@/lib/supply-planning-utils'
import { SupplyPlanningDetail } from './SupplyPlanningDetail'

/**
 * Supply Planning Table Row Component
 * Story 6.3: Stockout Table & Detail Panel
 * UX Specs by Sally (2025-12-12)
 *
 * Single row with expandable detail panel.
 * Click on chevron to expand (not entire row - UX spec).
 */

interface SupplyPlanningRowProps {
  item: SupplyPlanningItem
  isExpanded: boolean
  onToggleExpand: () => void
}

// Status icon mapping
const STATUS_ICONS: Record<StockoutRisk, React.ComponentType<{ className?: string }>> = {
  out_of_stock: PackageX,
  critical: AlertTriangle,
  warning: AlertCircle,
  low: Clock,
  healthy: CheckCircle,
}

// Velocity trend icon mapping
const TREND_ICONS: Record<VelocityTrend, React.ComponentType<{ className?: string }>> = {
  growing: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
}

// Row background colors by status (UX spec)
const ROW_BG_COLORS: Record<StockoutRisk, string> = {
  out_of_stock: 'bg-gray-100',
  critical: 'bg-red-50',
  warning: 'bg-orange-50',
  low: 'bg-yellow-50',
  healthy: 'bg-white',
}

// Row left border colors by status (UX spec)
const ROW_BORDER_COLORS: Record<StockoutRisk, string> = {
  out_of_stock: 'border-l-4 border-gray-800',
  critical: 'border-l-4 border-red-500',
  warning: 'border-l-4 border-orange-500',
  low: 'border-l-4 border-yellow-500',
  healthy: '',
}

export function SupplyPlanningRow({
  item,
  isExpanded,
  onToggleExpand,
}: SupplyPlanningRowProps) {
  // Fallback to defaults if values are missing/invalid
  const stockoutRisk = item.stockout_risk && item.stockout_risk in STATUS_ICONS ? item.stockout_risk : 'healthy'
  const velocityTrend = item.velocity_trend && item.velocity_trend in TREND_ICONS ? item.velocity_trend : 'stable'

  const StatusIcon = STATUS_ICONS[stockoutRisk]
  const TrendIcon = TREND_ICONS[velocityTrend]
  const statusConfig = STOCKOUT_RISK_CONFIG[stockoutRisk]
  const trendConfig = VELOCITY_TREND_CONFIG[velocityTrend]

  // Get action button config based on status
  const getActionButton = () => {
    switch (item.stockout_risk) {
      case 'out_of_stock':
        return {
          variant: 'destructive' as const,
          label: 'Заказать',
          icon: PackageX,
          className: 'bg-gray-800 hover:bg-gray-900',
        }
      case 'critical':
        return {
          variant: 'destructive' as const,
          label: 'Срочно',
          icon: AlertTriangle,
          className: '',
        }
      case 'warning':
        return {
          variant: 'default' as const,
          label: 'Заказать',
          icon: ShoppingCart,
          className: 'bg-orange-500 hover:bg-orange-600',
        }
      case 'low':
        return {
          variant: 'outline' as const,
          label: 'План',
          icon: Calendar,
          className: '',
        }
      case 'healthy':
        return null // No action for healthy
    }
  }

  const actionConfig = getActionButton()

  // Warehouse tooltip content
  const warehouseTooltip = item.warehouses.length > 1 ? (
    <div className="space-y-1">
      {item.warehouses.map((wh, i) => (
        <div key={i} className="flex justify-between gap-4 text-xs">
          <span>{wh.name}:</span>
          <span className="font-medium">{formatStockQty(wh.stock)} шт</span>
        </div>
      ))}
    </div>
  ) : null

  return (
    <>
      {/* Main Row */}
      <tr
        className={cn(
          'border-b border-gray-200 transition-colors',
          ROW_BG_COLORS[item.stockout_risk],
          ROW_BORDER_COLORS[item.stockout_risk],
          'hover:bg-gray-50'
        )}
      >
        {/* Expand chevron */}
        <td className="px-2 py-3">
          <button
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={isExpanded ? 'Свернуть детали' : 'Показать детали'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>

        {/* Status Icon */}
        <td className="px-4 py-3 text-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded-full',
                    statusConfig?.bgClass ?? 'bg-gray-100',
                    statusConfig?.textClass ?? 'text-gray-600'
                  )}
                >
                  <StatusIcon className="h-4 w-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{statusConfig?.label ?? 'Неизвестно'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* SKU ID */}
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {item.sku_id}
        </td>

        {/* Product Name (truncated) */}
        <td className="px-4 py-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-gray-900 truncate block max-w-[200px]">
                  {item.product_name}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p>{item.product_name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* Current Stock with warehouse tooltip */}
        <td className="px-4 py-3 text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn(
                  'text-sm font-medium cursor-default',
                  item.current_stock === 0 ? 'text-red-600' : 'text-gray-900'
                )}>
                  {formatStockQty(item.current_stock)}
                  {item.warehouses.length > 1 && (
                    <span className="ml-1 text-xs text-gray-400">
                      +{item.warehouses.length - 1}
                    </span>
                  )}
                </span>
              </TooltipTrigger>
              {warehouseTooltip && (
                <TooltipContent side="top">
                  {warehouseTooltip}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* In Transit (hidden on tablet) */}
        <td className="px-4 py-3 text-right hidden lg:table-cell">
          <span className={cn(
            'text-sm',
            item.in_transit > 0 ? 'text-blue-600' : 'text-gray-400'
          )}>
            {item.in_transit > 0 ? formatStockQty(item.in_transit) : '—'}
          </span>
        </td>

        {/* Velocity with trend icon (hidden on tablet) */}
        <td className="px-4 py-3 text-right hidden lg:table-cell">
          <span className="text-sm text-gray-900 flex items-center justify-end gap-1">
            {formatVelocity(item.avg_daily_sales)}
            <span className="text-gray-400 text-xs">шт/д</span>
            <TrendIcon className={cn('h-3 w-3', trendConfig?.textClass ?? 'text-gray-500')} />
          </span>
        </td>

        {/* Days Until Stockout */}
        <td className="px-4 py-3 text-right">
          <span className={cn(
            'text-sm font-medium',
            item.days_until_stockout !== null && item.days_until_stockout <= 7
              ? 'text-red-600'
              : item.days_until_stockout !== null && item.days_until_stockout <= 14
                ? 'text-orange-600'
                : 'text-gray-900'
          )}>
            {formatDaysUntilStockout(item.days_until_stockout)}
          </span>
        </td>

        {/* Reorder Qty (hidden on smaller screens) */}
        <td className="px-4 py-3 text-right hidden xl:table-cell">
          <span className="text-sm font-medium text-gray-900">
            {item.reorder_quantity > 0
              ? `${formatStockQty(item.reorder_quantity)} шт`
              : '—'}
          </span>
        </td>

        {/* Reorder Value (hidden on smaller screens) */}
        <td className="px-4 py-3 text-right hidden xl:table-cell">
          <span className="text-sm font-medium text-gray-900">
            {formatReorderValue(item.reorder_value)}
          </span>
        </td>

        {/* Action Button */}
        <td className="px-4 py-3 text-center">
          {actionConfig ? (
            <Button
              variant={actionConfig.variant}
              size="sm"
              className={cn('h-8 text-xs', actionConfig.className)}
            >
              <actionConfig.icon className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">{actionConfig.label}</span>
            </Button>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
      </tr>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <tr>
          <td colSpan={11} className="p-0">
            <SupplyPlanningDetail item={item} />
          </td>
        </tr>
      )}
    </>
  )
}
