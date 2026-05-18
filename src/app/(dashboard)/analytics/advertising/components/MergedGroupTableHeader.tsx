'use client'

/**
 * MergedGroupTableHeader - Column headers for MergedGroupTable
 *
 * Sortable column headers with ROAS tooltip.
 * Extracted from MergedGroupTable.tsx for file size compliance (Epic 74).
 *
 * @see Story 37.2: MergedGroupTable Component
 * @see Story 37.3: Aggregate Metrics Display
 */

import { useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SortField } from './MergedGroupTable'

interface MergedGroupTableHeaderProps {
  sortConfig?: {
    field: SortField
    direction: 'asc' | 'desc'
  }
  onSort?: (field: SortField) => void
}

export function MergedGroupTableHeader({ sortConfig, onSort }: MergedGroupTableHeaderProps) {
  const headerClass =
    'px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50 border-b border-gray-200'
  const sortableClass = onSort ? 'cursor-pointer hover:bg-gray-100' : ''

  const renderSortIcon = (field: SortField) => {
    if (!sortConfig || sortConfig.field !== field) return null
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  // Memoize sort handlers to prevent unnecessary re-renders
  const handleSortTotalSales = useCallback(() => onSort?.('totalSales'), [onSort])
  const handleSortRevenue = useCallback(() => onSort?.('totalRevenue'), [onSort])
  const handleSortOrganic = useCallback(() => onSort?.('organicSales'), [onSort])
  const handleSortSpend = useCallback(() => onSort?.('totalSpend'), [onSort])
  const handleSortRoas = useCallback(() => onSort?.('roas'), [onSort])

  return (
    <thead>
      <tr>
        <th className={headerClass}>Склейка</th>
        <th className={headerClass}>Артикул</th>
        <th className={`${headerClass} ${sortableClass} text-right`} onClick={handleSortTotalSales}>
          Всего продаж{renderSortIcon('totalSales')}
        </th>
        <th className={`${headerClass} ${sortableClass} text-right`} onClick={handleSortRevenue}>
          Из рекламы{renderSortIcon('totalRevenue')}
        </th>
        <th className={`${headerClass} ${sortableClass} text-right`} onClick={handleSortOrganic}>
          Органика{renderSortIcon('organicSales')}
        </th>
        <th className={`${headerClass} ${sortableClass} text-right`} onClick={handleSortSpend}>
          Расход{renderSortIcon('totalSpend')}
        </th>
        {/* Story 37.3 AC 20: ROAS column with tooltip */}
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- TooltipProvider wraps visible "ROAS" text; rule's text-detection misses tooltip children. Keyboard sort affordance is a pre-existing defect tracked at docs/polish/keyboard-sort-headers.md (filed Story 110.1-FE 2nd-pass F-2). */}
        <th className={`${headerClass} ${sortableClass} text-right`} onClick={handleSortRoas}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center">ROAS{renderSortIcon('roas')}</span>
              </TooltipTrigger>
              <TooltipContent size="md">
                <p>ROAS группы: суммарная выручка от рекламы / суммарный расход.</p>
                <p className="mt-1">Прибыль дедуплицирована для SKU в нескольких кампаниях.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </th>
      </tr>
    </thead>
  )
}
