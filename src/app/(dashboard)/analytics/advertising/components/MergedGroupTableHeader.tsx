'use client'

/**
 * MergedGroupTableHeader - Column headers for MergedGroupTable
 *
 * Sortable column headers with ROAS tooltip. Extracted from MergedGroupTable.tsx for
 * file size compliance (Epic 74).
 *
 * Story 163.1 (keyboard accessibility): sort activation moved from click-only <th> to a
 * semantic <button> inside the <th> (native Enter/Space + Russian accessible name that
 * carries the current order + visible focus ring). aria-sort is set on each sortable <th>;
 * the obsolete jsx-a11y/control-has-associated-label suppression is removed. Closes the
 * defect tracked in docs/polish/keyboard-sort-headers.md (filed Story 110.1-FE F-2).
 *
 * @see Story 37.2: MergedGroupTable Component
 * @see Story 37.3: Aggregate Metrics Display
 */

import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SortField } from './MergedGroupTable'

interface SortConfig {
  field: SortField
  direction: 'asc' | 'desc'
}

interface MergedGroupTableHeaderProps {
  sortConfig?: SortConfig
  onSort?: (field: SortField) => void
}

const headerClass =
  'px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50 border-b border-gray-200'
const sortableClass = 'cursor-pointer hover:bg-gray-100'
const sortButtonClass =
  'inline-flex w-full items-center justify-end gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'

// Story 163.1: aria-sort belongs on the owning <th>. "none" for sortable-but-unsorted
// columns; only the active column reports ascending/descending.
function ariaSortFor(
  field: SortField,
  sortConfig: SortConfig | undefined
): 'ascending' | 'descending' | 'none' {
  if (!sortConfig || sortConfig.field !== field) return 'none'
  return sortConfig.direction === 'asc' ? 'ascending' : 'descending'
}

// Russian current-order phrase for the sort button's accessible name (AC: action + column + order).
function orderLabel(field: SortField, sortConfig: SortConfig | undefined): string {
  if (!sortConfig || sortConfig.field !== field) return 'без сортировки'
  return sortConfig.direction === 'asc' ? 'по возрастанию' : 'по убыванию'
}

// Non-color visual sort indicator (text arrow). aria-sort + the button name convey state
// to assistive tech; the icon is a visual cue for sighted users.
function renderSortIcon(field: SortField, sortConfig: SortConfig | undefined): ReactNode {
  if (!sortConfig || sortConfig.field !== field) return null
  return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
}

// Sortable column header cell. When onSort is provided, renders a semantic <button>
// (keyboard + accessible name + focus) inside an aria-sort <th>; otherwise a plain
// non-interactive label (no control, no aria-sort). `children` overrides the plain label
// content (used by the ROAS tooltip).
function SortableTh({
  field,
  label,
  sortConfig,
  onSort,
  children,
}: {
  field: SortField
  label: string
  sortConfig: SortConfig | undefined
  onSort: ((field: SortField) => void) | undefined
  children?: ReactNode
}) {
  // The sort indicator reflects the current sortConfig state and renders in both the
  // interactive and display-only cases (a column can indicate an active sort even when the
  // host table wires no onSort handler). Only the interactive control (button + aria-sort)
  // is gated on onSort.
  const content = (
    <>
      {children ?? label}
      {renderSortIcon(field, sortConfig)}
    </>
  )
  if (!onSort) {
    return <th className={`${headerClass} text-right`}>{content}</th>
  }
  return (
    <th
      className={`${headerClass} ${sortableClass} text-right`}
      aria-sort={ariaSortFor(field, sortConfig)}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={sortButtonClass}
        aria-label={`Сортировать по «${label}», текущий порядок: ${orderLabel(field, sortConfig)}`}
      >
        {content}
      </button>
    </th>
  )
}

export function MergedGroupTableHeader({ sortConfig, onSort }: MergedGroupTableHeaderProps) {
  return (
    <thead>
      <tr>
        <th className={headerClass}>Склейка</th>
        <th className={headerClass}>Артикул</th>
        <SortableTh
          field="totalSales"
          label="Всего продаж"
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <SortableTh
          field="totalRevenue"
          label="Из рекламы"
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <SortableTh field="organicSales" label="Органика" sortConfig={sortConfig} onSort={onSort} />
        <SortableTh field="totalSpend" label="Расход" sortConfig={sortConfig} onSort={onSort} />
        {/* Story 37.3 AC 20: ROAS column with tooltip. The sort affordance is the semantic
            <button> from SortableTh (Story 163.1); the tooltip is informational and renders
            whether or not the column is sortable. */}
        <SortableTh field="roas" label="ROAS" sortConfig={sortConfig} onSort={onSort}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center">ROAS</span>
              </TooltipTrigger>
              <TooltipContent size="md">
                <p>ROAS группы: суммарная выручка от рекламы / суммарный расход.</p>
                <p className="mt-1">Прибыль дедуплицирована для SKU в нескольких кампаниях.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SortableTh>
      </tr>
    </thead>
  )
}
