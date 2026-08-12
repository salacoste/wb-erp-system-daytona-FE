import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { StatusBadge } from './StatusBadge'
import { type OperationalStatus, statusPresentation } from './presentation'

export interface StatusStripItem {
  id: string
  status: OperationalStatus
  label: string
  description?: ReactNode
  sourceValue?: ReactNode
  timestamp?: ReactNode
  action?: ReactNode
}

export interface StatusStripProps {
  title: string
  items: readonly StatusStripItem[]
  highestStatus?: OperationalStatus
  detailsLabel?: string
  defaultOpen?: boolean
  className?: string
}

export function StatusStrip({
  title,
  items,
  highestStatus,
  detailsLabel = 'Подробности',
  defaultOpen = false,
  className,
}: StatusStripProps) {
  const status = highestStatus ?? items[0]?.status ?? 'unknown'
  const { Icon, label: statusLabel } = statusPresentation[status]

  return (
    <section
      aria-label={title}
      data-status={status}
      className={cn(
        'min-w-0 rounded-lg border p-4',
        statusPresentation[status].className,
        className
      )}
    >
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <h2 className="break-words font-semibold">{title}</h2>
        <span
          data-testid="status-strip-summary"
          className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium"
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span className="break-words">{statusLabel}</span>
        </span>
      </header>
      <details data-testid="status-strip-disclosure" open={defaultOpen} className="mt-2">
        <summary className="cursor-pointer select-none text-sm font-medium">{detailsLabel}</summary>
        <div className="mt-3 flex min-w-0 flex-col gap-3">
          {items.map(item => (
            <div key={item.id} className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <StatusBadge
                status={item.status}
                label={item.label}
                description={item.description}
                sourceValue={item.sourceValue}
              />
              <div className="flex min-w-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                {item.timestamp ? (
                  <div className="break-words tabular-nums">{item.timestamp}</div>
                ) : null}
                {item.action}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
