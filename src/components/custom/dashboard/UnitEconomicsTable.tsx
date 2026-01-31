/**
 * Unit Economics Table Component
 * Story 63.10-FE: Unit Economics Table Enhancement
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Enhanced unit economics table with sortable columns and profitability badges.
 * @see docs/stories/epic-63/story-63.10-fe-unit-economics-enhancement.md
 */

'use client'

import { useCallback } from 'react'
import { Table, TableBody } from '@/components/ui/table'
import type { UnitEconomicsItem } from '@/types/unit-economics'
import {
  UnitEconomicsTableHeader,
  type SortField,
  type SortOrder,
  type SortState,
} from './UnitEconomicsTableHeader'
import { UnitEconomicsTableRowComponent } from './UnitEconomicsTableRow'

export interface UnitEconomicsTableProps {
  /** Array of unit economics data items */
  data: UnitEconomicsItem[]
  /** Callback when sort changes */
  onSort: (field: SortField, order: SortOrder) => void
  /** Current sort state */
  currentSort: SortState
}

/**
 * Unit Economics Table
 *
 * Enhanced table with:
 * - Sortable column headers (Revenue, COGS%, Margin%, Profit)
 * - Profitability status badges
 * - Missing COGS handling (shows dashes)
 * - Accessible table structure
 */
export function UnitEconomicsTable({ data, onSort, currentSort }: UnitEconomicsTableProps) {
  const handleSort = useCallback(
    (field: SortField) => {
      const newOrder = currentSort.field === field && currentSort.order === 'desc' ? 'asc' : 'desc'
      onSort(field, newOrder)
    },
    [currentSort, onSort]
  )

  return (
    <Table>
      <UnitEconomicsTableHeader currentSort={currentSort} onSort={handleSort} />
      <TableBody>
        {data.map(item => (
          <UnitEconomicsTableRowComponent key={item.sku_id} item={item} />
        ))}
      </TableBody>
    </Table>
  )
}

// Re-export types for convenience
export type { SortField, SortOrder, SortState } from './UnitEconomicsTableHeader'
