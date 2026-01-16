/**
 * MergedGroupTable Component - Epic 37: Merged Group Table Display
 *
 * Displays advertising analytics for merged product groups (склейки) with:
 * - Tier 1: Rowspan cell showing group indicator
 * - Tier 2: Aggregate row with group-level metrics (bold, gray background)
 * - Tier 3: Detail rows showing individual product metrics
 *
 * @see Story 37.2: MergedGroupTable Component
 * @see Story 37.3: Aggregate Metrics Display
 * @see docs/epics/epic-37-merged-group-table-display.md
 */

import React, { useCallback, useMemo } from 'react';
import { Crown } from 'lucide-react';
import { AdvertisingGroup } from '@/types/advertising-analytics';

// Story 37.3: Tooltip components for aggregate row and ROAS column
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Story 37.3: Import calculation and formatting utilities
import {
  calculateTotalSales,
  calculateRevenue,
  calculateOrganicSales,
  calculateOrganicContribution,
  calculateSpend,
  calculateROAS,
} from '../utils/metrics-calculator';
import {
  formatCurrency,
  formatRevenueWithPercent,
  formatROAS,
} from '../utils/formatters';

// ============================================================================
// Types
// ============================================================================

/** Sortable field types for column headers */
export type SortField = 'totalSales' | 'totalRevenue' | 'organicSales' | 'totalSpend' | 'roas';

/** Component props interface */
export interface MergedGroupTableProps {
  /** Array of merged groups with aggregate + individual metrics */
  groups: AdvertisingGroup[];

  /** Current sort configuration */
  sortConfig?: {
    field: SortField;
    direction: 'asc' | 'desc';
  };

  /** Callback when user clicks column header to sort */
  onSort?: (field: SortField) => void;

  /** Callback when user clicks on a product row */
  onProductClick?: (nmId: number) => void;
}

// ============================================================================
// Note: Formatting utilities moved to ../utils/formatters.ts (Story 37.3)
// ============================================================================

// ============================================================================
// Table Header Component
// ============================================================================

interface TableHeaderProps {
  sortConfig?: {
    field: SortField;
    direction: 'asc' | 'desc';
  };
  onSort?: (field: SortField) => void;
}

function TableHeader({ sortConfig, onSort }: TableHeaderProps) {
  const headerClass = 'px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50 border-b border-gray-200';
  const sortableClass = onSort ? 'cursor-pointer hover:bg-gray-100' : '';

  const renderSortIcon = (field: SortField) => {
    if (!sortConfig || sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Memoize sort handlers to prevent unnecessary re-renders
  const handleSortTotalSales = useCallback(() => onSort?.('totalSales'), [onSort]);
  const handleSortRevenue = useCallback(() => onSort?.('totalRevenue'), [onSort]);
  const handleSortOrganic = useCallback(() => onSort?.('organicSales'), [onSort]);
  const handleSortSpend = useCallback(() => onSort?.('totalSpend'), [onSort]);
  const handleSortRoas = useCallback(() => onSort?.('roas'), [onSort]);

  return (
    <thead>
      <tr>
        <th className={headerClass}>Склейка</th>
        <th className={headerClass}>Артикул</th>
        <th
          className={`${headerClass} ${sortableClass} text-right`}
          onClick={handleSortTotalSales}
        >
          Всего продаж{renderSortIcon('totalSales')}
        </th>
        <th
          className={`${headerClass} ${sortableClass} text-right`}
          onClick={handleSortRevenue}
        >
          Из рекламы{renderSortIcon('totalRevenue')}
        </th>
        <th
          className={`${headerClass} ${sortableClass} text-right`}
          onClick={handleSortOrganic}
        >
          Органика{renderSortIcon('organicSales')}
        </th>
        <th
          className={`${headerClass} ${sortableClass} text-right`}
          onClick={handleSortSpend}
        >
          Расход{renderSortIcon('totalSpend')}
        </th>
        {/* Story 37.3 AC 20: ROAS column with tooltip */}
        <th
          className={`${headerClass} ${sortableClass} text-right`}
          onClick={handleSortRoas}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center">
                  ROAS{renderSortIcon('roas')}
                </span>
              </TooltipTrigger>
              <TooltipContent size="md">
                <p>Доход с рекламы / Расход</p>
                <p className="mt-1">Показывает возврат на вложенный рубль.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </th>
      </tr>
    </thead>
  );
}

// ============================================================================
// Merged Group Rows Component (3-Tier Structure)
// ============================================================================

interface MergedGroupRowsProps {
  group: AdvertisingGroup;
  onProductClick?: (nmId: number) => void;
}

function MergedGroupRows({ group, onProductClick }: MergedGroupRowsProps) {
  const totalRows = group.products.length + 1; // Aggregate + detail rows
  const hasSingleProduct = group.productCount === 1;

  // Story 37.3: Calculate aggregate metrics if not provided by backend
  // Memoize calculations to prevent unnecessary recalculations on re-renders
  const totalSales = useMemo(
    () => group.aggregateMetrics?.totalSales ?? calculateTotalSales(group.products),
    [group.aggregateMetrics?.totalSales, group.products]
  );

  const revenue = useMemo(
    () => group.aggregateMetrics?.totalRevenue ?? calculateRevenue(group.products),
    [group.aggregateMetrics?.totalRevenue, group.products]
  );

  const organicSales = useMemo(
    () => group.aggregateMetrics?.organicSales ?? calculateOrganicSales(totalSales, revenue),
    [group.aggregateMetrics?.organicSales, totalSales, revenue]
  );

  const organicContribution = useMemo(
    () => group.aggregateMetrics?.organicContribution ?? calculateOrganicContribution(organicSales, totalSales),
    [group.aggregateMetrics?.organicContribution, organicSales, totalSales]
  );

  const spend = useMemo(
    () => group.aggregateMetrics?.totalSpend ?? calculateSpend(group.products),
    [group.aggregateMetrics?.totalSpend, group.products]
  );

  const roas = useMemo(
    () => group.aggregateMetrics?.roas ?? calculateROAS(revenue, spend),
    [group.aggregateMetrics?.roas, revenue, spend]
  );

  // Rowspan cell classes (Tier 1) - Story 37.4 AC 1-5, 19-20, 25 (sticky on tablet/mobile)
  const rowspanClasses = 'px-4 py-4 text-center align-middle bg-gray-50 border-r-2 border-gray-200 text-sm font-medium text-gray-600 md:sticky md:left-0 md:z-10';

  // Aggregate row classes (Tier 2) - Story 37.4 AC 6-9, 21
  const aggregateRowClasses = 'bg-gray-100 border-b border-gray-200';
  const aggregateCellClasses = 'px-4 py-3 text-[0.95rem] font-semibold text-gray-900 text-right';

  // Detail row classes (Tier 3) - Story 37.4 AC 10-13, 22
  const detailRowClasses = 'bg-white hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100';
  const detailCellClasses = 'px-4 py-2.5 text-sm font-normal text-gray-700 text-right';

  return (
    <>
      {/* Tier 2: Aggregate Row */}
      <tr className={aggregateRowClasses}>
        {/* Tier 1: Rowspan Cell (склейка indicator) - Skip for single product */}
        {!hasSingleProduct && (
          <td rowSpan={totalRows} className={rowspanClasses}>
            <div className="font-medium text-gray-700">
              {group.mainProduct.vendorCode}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              + {group.productCount - 1} товаров
            </div>
          </td>
        )}

        {/* Артикул column: ГРУППА #imtId - Story 37.3 AC 20: With tooltip */}
        {/* Story 37.4 AC 19-20, 25: Sticky on tablet/mobile (left offset depends on rowspan presence) */}
        <td className={`${aggregateCellClasses} text-left ${!hasSingleProduct ? 'md:sticky md:left-[150px] md:z-10 md:bg-gray-100' : 'md:sticky md:left-0 md:z-10 md:bg-gray-100'}`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">ГРУППА #{group.imtId}</span>
              </TooltipTrigger>
              <TooltipContent size="sm">
                Сумма всех товаров в склейке
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* Aggregate metrics - Story 37.3: Use calculated values */}
        <td className={aggregateCellClasses}>
          {formatCurrency(totalSales)}
        </td>
        <td className={aggregateCellClasses}>
          {formatRevenueWithPercent(revenue, organicContribution)}
        </td>
        <td className={aggregateCellClasses}>
          {formatCurrency(organicSales)}
        </td>
        <td className={aggregateCellClasses}>
          {formatCurrency(spend)}
        </td>
        <td className={aggregateCellClasses}>
          {formatROAS(roas)}
        </td>
      </tr>

      {/* Tier 3: Detail Rows (Individual Products) */}
      {group.products.map((product) => (
        <tr
          key={product.nmId}
          className={detailRowClasses}
          onClick={() => onProductClick?.(product.nmId)}
        >
          {/* Артикул column: nmId with crown for main product */}
          {/* Story 37.4 AC 19-20, 25: Sticky on tablet/mobile */}
          <td className={`${detailCellClasses} text-left ${!hasSingleProduct ? 'md:sticky md:left-[150px] md:z-10 md:bg-white' : 'md:sticky md:left-0 md:z-10 md:bg-white'}`}>
            {product.isMainProduct && (
              <Crown className="inline h-4 w-4 text-yellow-600 mr-1" aria-label="Главный товар" />
            )}
            {product.vendorCode}
          </td>

          {/* Individual product metrics - Story 37.3: Consistent formatting */}
          <td className={detailCellClasses}>
            {formatCurrency(product.totalSales)}
          </td>
          <td className={detailCellClasses}>
            {formatRevenueWithPercent(product.totalRevenue, product.organicContribution)}
          </td>
          <td className={detailCellClasses}>
            {formatCurrency(product.organicSales)}
          </td>
          <td className={detailCellClasses}>
            {formatCurrency(product.totalSpend)}
          </td>
          <td className={detailCellClasses}>
            {formatROAS(product.roas)}
          </td>
        </tr>
      ))}
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MergedGroupTable - Displays advertising analytics for merged product groups
 *
 * Features:
 * - 3-tier rowspan structure (склейка indicator, aggregate row, detail rows)
 * - Sortable column headers
 * - Responsive design with horizontal scroll on mobile
 * - Crown icon (👑) marks main products
 * - Epic 35 integration (totalSales, organicSales, organicContribution)
 *
 * @example
 * ```tsx
 * <MergedGroupTable
 *   groups={mergedGroups}
 *   sortConfig={{ field: 'roas', direction: 'desc' }}
 *   onSort={handleSort}
 *   onProductClick={handleProductClick}
 * />
 * ```
 */
export function MergedGroupTable({
  groups,
  sortConfig,
  onSort,
  onProductClick,
}: MergedGroupTableProps) {
  return (
    // Story 37.4 AC 18-20, 25: Responsive wrapper with sticky columns on tablet/mobile
    <div className="overflow-x-auto md:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <table className="min-w-full border-collapse bg-white shadow-sm rounded-lg text-sm md:text-base">
        <caption className="sr-only">
          Таблица рекламной аналитики по склейкам товаров
        </caption>
        <TableHeader sortConfig={sortConfig} onSort={onSort} />
        <tbody>
          {groups.map((group) => (
            <MergedGroupRows
              key={group.imtId ?? `standalone-${group.mainProduct.nmId}`}
              group={group}
              onProductClick={onProductClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
