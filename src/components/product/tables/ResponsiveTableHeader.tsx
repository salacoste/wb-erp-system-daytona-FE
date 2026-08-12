import type { ButtonHTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

import type { TableNumericColumnContract, TableSortContract } from './contracts'

export interface ResponsiveTableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  columnId: string
  sorting: TableSortContract
}

export interface ResponsiveTableSortButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  entityLabel: string
}

export interface ResponsiveTableNumericCellProps extends Omit<
  TdHTMLAttributes<HTMLTableCellElement>,
  'aria-label'
> {
  contract: TableNumericColumnContract
  fullValue: string
  children: ReactNode
}

export function ResponsiveTableHeader({
  columnId,
  sorting,
  children,
  ...props
}: ResponsiveTableHeaderProps) {
  const active = sorting.kind === 'caller-controlled' && sorting.activeColumnId === columnId

  return (
    <th
      {...props}
      scope={props.scope ?? 'col'}
      data-column-id={columnId}
      aria-sort={active ? sorting.direction : undefined}
    >
      {children}
    </th>
  )
}

export function ResponsiveTableSortButton({
  entityLabel,
  className,
  children,
  ...props
}: ResponsiveTableSortButtonProps) {
  return (
    <button
      type="button"
      aria-label={props['aria-label'] ?? `Сортировать ${entityLabel}`}
      className={cn('min-h-11 rounded-md focus-visible:ring-2', className)}
      {...props}
    >
      {children}
    </button>
  )
}

function unitLabel(contract: TableNumericColumnContract): string {
  if (contract.unit.kind === 'currency') return contract.unit.code
  if (contract.unit.kind === 'percent') return '%'
  if (contract.unit.kind === 'count' || contract.unit.kind === 'quantity') {
    return contract.unit.label
  }
  return 'unitless'
}

export function ResponsiveTableNumericCell({
  contract,
  fullValue,
  className,
  children,
  ...props
}: ResponsiveTableNumericCellProps) {
  return (
    <td
      {...props}
      aria-label={fullValue}
      data-column-id={contract.id}
      data-precision={contract.precision}
      data-unit={unitLabel(contract)}
      className={cn('text-right tabular-nums', className)}
    >
      {children}
    </td>
  )
}
