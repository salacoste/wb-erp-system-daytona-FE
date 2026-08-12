import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { type OperationalStatus, statusPresentation } from './presentation'

export interface StatusBadgeProps {
  status: OperationalStatus
  label: string
  description?: ReactNode
  sourceValue?: ReactNode
  className?: string
}

export function StatusBadge({
  status,
  label,
  description,
  sourceValue,
  className,
}: StatusBadgeProps) {
  const { className: semanticClass, Icon } = statusPresentation[status]

  return (
    <div className="inline-flex min-w-0 flex-col items-start gap-1">
      <span
        data-slot="status-badge"
        data-status={status}
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
          semanticClass,
          className
        )}
      >
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="break-words">{label}</span>
      </span>
      {description ? (
        <div className="break-words text-xs text-muted-foreground">{description}</div>
      ) : null}
      {sourceValue ? (
        <div className="break-all font-mono text-xs text-muted-foreground">{sourceValue}</div>
      ) : null}
    </div>
  )
}
