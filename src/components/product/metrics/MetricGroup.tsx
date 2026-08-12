import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { type MetricVariant, metricVariantPresentation } from './presentation'

export interface MetricGroupProps {
  title: string
  description?: ReactNode
  context?: ReactNode
  action?: ReactNode
  children: ReactNode
  variant?: MetricVariant
  className?: string
}

export function MetricGroup({
  title,
  description,
  context,
  action,
  children,
  variant = 'standard',
  className,
}: MetricGroupProps) {
  return (
    <section
      aria-label={title}
      data-variant={variant}
      className={cn('flex min-w-0 flex-col', metricVariantPresentation[variant].header, className)}
    >
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="break-words text-lg font-semibold text-foreground">{title}</h2>
          {description ? (
            <div className="break-words text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {action ? (
          <div className="min-w-0 max-w-full [&>*]:max-w-full [&>*]:whitespace-normal [&>*]:break-words">
            {action}
          </div>
        ) : null}
      </header>
      {context ? <div className="break-words text-sm text-muted-foreground">{context}</div> : null}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  )
}
