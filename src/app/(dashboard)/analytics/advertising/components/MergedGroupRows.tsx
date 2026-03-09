'use client'

/**
 * MergedGroupRows - 3-Tier row structure for a single merged group
 *
 * Renders:
 * - Tier 1: Rowspan cell showing group indicator (for multi-product groups)
 * - Tier 2: Aggregate row with group-level metrics (bold, gray background)
 * - Tier 3: Detail rows showing individual product metrics
 *
 * Extracted from MergedGroupTable.tsx for file size compliance (Epic 74).
 *
 * @see Story 37.2: MergedGroupTable Component
 * @see Story 37.3: Aggregate Metrics Display
 * @see Story 73.6: Negative organicSales over-attribution warning
 */

import React, { useMemo } from 'react'
import { AlertTriangle, Crown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AdvertisingGroup } from '@/types/advertising-analytics'
import {
  calculateTotalSales,
  calculateRevenue,
  calculateOrganicSales,
  calculateOrganicContribution,
  calculateSpend,
  calculateROAS,
} from '../utils/metrics-calculator'
import { formatCurrency, formatRevenueWithPercent, formatROAS } from '../utils/formatters'

// ============================================================================
// Story 73.6: Negative organicSales rendering helper
// ============================================================================

/** Render organic sales value with over-attribution warning if negative */
export function renderOrganicValue(value: number): React.ReactNode {
  if (value >= 0) return formatCurrency(value)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <Badge variant="outline" className="text-[0.7rem] border-amber-500 text-amber-700">
              Переатрибуция
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          Рекламная выручка превышает общие продажи ({formatCurrency(value)})
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// Merged Group Rows Component (3-Tier Structure)
// ============================================================================

export interface MergedGroupRowsProps {
  group: AdvertisingGroup
  onProductClick?: (nmId: number) => void
}

export function MergedGroupRows({ group, onProductClick }: MergedGroupRowsProps) {
  const totalRows = group.products.length + 1 // Aggregate + detail rows
  const hasSingleProduct = group.productCount === 1

  // Story 37.3: Calculate aggregate metrics if not provided by backend
  // Memoize calculations to prevent unnecessary recalculations on re-renders
  const totalSales = useMemo(
    () => group.aggregateMetrics?.totalSales ?? calculateTotalSales(group.products),
    [group.aggregateMetrics?.totalSales, group.products]
  )

  const revenue = useMemo(
    () => group.aggregateMetrics?.totalRevenue ?? calculateRevenue(group.products),
    [group.aggregateMetrics?.totalRevenue, group.products]
  )

  const organicSales = useMemo(
    () => group.aggregateMetrics?.organicSales ?? calculateOrganicSales(totalSales, revenue),
    [group.aggregateMetrics?.organicSales, totalSales, revenue]
  )

  const organicContribution = useMemo(
    () =>
      group.aggregateMetrics?.organicContribution ??
      calculateOrganicContribution(organicSales, totalSales),
    [group.aggregateMetrics?.organicContribution, organicSales, totalSales]
  )

  const spend = useMemo(
    () => group.aggregateMetrics?.totalSpend ?? calculateSpend(group.products),
    [group.aggregateMetrics?.totalSpend, group.products]
  )

  const roas = useMemo(
    () => group.aggregateMetrics?.roas ?? calculateROAS(revenue, spend),
    [group.aggregateMetrics?.roas, revenue, spend]
  )

  // Rowspan cell classes (Tier 1) - Story 37.4 AC 1-5, 19-20, 25 (sticky on tablet/mobile)
  const rowspanClasses =
    'px-4 py-4 text-center align-middle bg-gray-50 border-r-2 border-gray-200 text-sm font-medium text-gray-600 md:sticky md:left-0 md:z-10'

  // Aggregate row classes (Tier 2) - Story 37.4 AC 6-9, 21
  const aggregateRowClasses = 'bg-gray-100 border-b border-gray-200'
  const aggregateCellClasses = 'px-4 py-3 text-[0.95rem] font-semibold text-gray-900 text-right'

  // Detail row classes (Tier 3) - Story 37.4 AC 10-13, 22
  const detailRowClasses =
    'bg-white hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100'
  const detailCellClasses = 'px-4 py-2.5 text-sm font-normal text-gray-700 text-right'

  return (
    <>
      {/* Tier 2: Aggregate Row */}
      <tr className={aggregateRowClasses}>
        {/* Tier 1: Rowspan Cell (склейка indicator) - Skip for single product */}
        {!hasSingleProduct && (
          <td rowSpan={totalRows} className={rowspanClasses}>
            <div className="font-medium text-gray-700">{group.mainProduct.vendorCode}</div>
            <div className="text-xs text-gray-500 mt-1">+ {group.productCount - 1} товаров</div>
          </td>
        )}

        {/* Артикул column: ГРУППА #imtId - Story 37.3 AC 20: With tooltip */}
        {/* Story 37.4 AC 19-20, 25: Sticky on tablet/mobile */}
        <td
          className={`${aggregateCellClasses} text-left ${!hasSingleProduct ? 'md:sticky md:left-[150px] md:z-10 md:bg-gray-100' : 'md:sticky md:left-0 md:z-10 md:bg-gray-100'}`}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">ГРУППА #{group.imtId}</span>
              </TooltipTrigger>
              <TooltipContent size="sm">Сумма всех товаров в склейке</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* Aggregate metrics - Story 37.3: Use calculated values */}
        <td className={aggregateCellClasses}>{formatCurrency(totalSales)}</td>
        <td className={aggregateCellClasses}>
          {formatRevenueWithPercent(revenue, organicContribution)}
        </td>
        <td className={aggregateCellClasses}>{renderOrganicValue(organicSales)}</td>
        <td className={aggregateCellClasses}>{formatCurrency(spend)}</td>
        <td className={aggregateCellClasses}>{formatROAS(roas)}</td>
      </tr>

      {/* Tier 3: Detail Rows (Individual Products) */}
      {group.products.map(product => (
        <tr
          key={product.nmId}
          className={detailRowClasses}
          onClick={() => onProductClick?.(product.nmId)}
        >
          {/* Артикул column: nmId with crown for main product */}
          {/* Story 37.4 AC 19-20, 25: Sticky on tablet/mobile */}
          <td
            className={`${detailCellClasses} text-left ${!hasSingleProduct ? 'md:sticky md:left-[150px] md:z-10 md:bg-white' : 'md:sticky md:left-0 md:z-10 md:bg-white'}`}
          >
            {product.isMainProduct && (
              <Crown className="inline h-4 w-4 text-yellow-600 mr-1" aria-label="Главный товар" />
            )}
            {product.vendorCode}
          </td>

          {/* Individual product metrics - Story 37.3: Consistent formatting */}
          <td className={detailCellClasses}>{formatCurrency(product.totalSales)}</td>
          <td className={detailCellClasses}>
            {formatRevenueWithPercent(product.totalRevenue, product.organicContribution)}
          </td>
          <td className={detailCellClasses}>{renderOrganicValue(product.organicSales)}</td>
          <td className={detailCellClasses}>{formatCurrency(product.totalSpend)}</td>
          <td className={detailCellClasses}>{formatROAS(product.roas)}</td>
        </tr>
      ))}
    </>
  )
}
