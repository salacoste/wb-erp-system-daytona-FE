import type { HTMLAttributes, ReactNode } from 'react'

import { Table, TableCaption } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import type {
  TableConsumerContract,
  TableNarrowStrategy,
  TableSelectionSummaryModel,
} from './contracts'

type TableName =
  { caption: ReactNode; accessibleLabel?: never } | { caption?: never; accessibleLabel: string }

type ResponsiveTableSharedProps = {
  contract: TableConsumerContract
  children: ReactNode
  toolbar?: ReactNode
  selectionSummary?: TableSelectionSummaryModel
  pagination?: ReactNode
  className?: string
  tableClassName?: string
  busy?: boolean
}

export type ResponsiveTableProps = TableName & ResponsiveTableSharedProps

export interface ResponsiveTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean
  disabled?: boolean
  expanded?: boolean
}

function tableWidth(strategy: TableNarrowStrategy): string | undefined {
  if (strategy.kind !== 'horizontal-scroll') return undefined
  if (strategy.minimumWidth === '40rem') return 'min-w-[40rem]'
  if (strategy.minimumWidth === '64rem') return 'min-w-[64rem]'
  return 'min-w-[48rem]'
}

export function ResponsiveTable({
  caption,
  accessibleLabel,
  contract,
  children,
  toolbar,
  selectionSummary,
  pagination,
  className,
  tableClassName,
  busy = false,
}: ResponsiveTableProps) {
  const { narrowStrategy } = contract
  const horizontal = narrowStrategy.kind === 'horizontal-scroll'

  const semanticTable = (
    <Table
      aria-label={accessibleLabel}
      aria-busy={busy || undefined}
      data-primary-column={contract.primaryColumn.id}
      data-narrow-strategy={narrowStrategy.kind}
      data-sort-direction={
        contract.sorting.kind === 'caller-controlled' ? contract.sorting.direction : undefined
      }
      data-pagination-kind={contract.pagination.kind}
      scrollContainerAriaLabel={horizontal ? narrowStrategy.regionLabel : undefined}
      scrollContainerTabIndex={horizontal ? 0 : undefined}
      className={cn(
        tableWidth(narrowStrategy),
        !horizontal && 'table-fixed [&_td]:break-words [&_th]:break-words',
        tableClassName
      )}
    >
      {caption !== undefined ? <TableCaption>{caption}</TableCaption> : null}
      {children}
    </Table>
  )

  return (
    <div className={cn('min-w-0', className)} data-table-frame>
      {toolbar}
      {selectionSummary ? (
        <div
          className="flex min-w-0 flex-wrap items-center gap-2 text-sm"
          data-selection-scope={selectionSummary.scope}
        >
          <span>{`Выбрано: ${selectionSummary.selectedCount} — ${selectionSummary.scopeLabel}`}</span>
          {selectionSummary.actions}
        </div>
      ) : null}
      {horizontal ? (
        semanticTable
      ) : (
        <>
          <div className="hidden min-w-0 md:block [&>div]:overflow-visible" data-table-wide-content>
            {semanticTable}
          </div>
          <div
            aria-label={narrowStrategy.description}
            className="min-w-0 md:hidden"
            data-table-narrow-content
            role="group"
          >
            {narrowStrategy.narrowContent}
          </div>
        </>
      )}
      {pagination}
    </div>
  )
}

export function ResponsiveTableRow({
  selected = false,
  disabled = false,
  expanded = false,
  ...props
}: ResponsiveTableRowProps) {
  const selectedState = selected || props['aria-selected'] === true
  const disabledState = disabled || props['aria-disabled'] === true
  const expandedState = expanded || props['aria-expanded'] === true

  return (
    <tr
      {...props}
      data-state={selectedState ? 'selected' : undefined}
      data-disabled={disabledState || undefined}
      aria-disabled={disabledState || undefined}
      aria-selected={selectedState || undefined}
      data-expanded={expandedState || undefined}
      aria-expanded={expandedState || undefined}
    />
  )
}
