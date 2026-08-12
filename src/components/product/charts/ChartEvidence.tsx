import { cn } from '@/lib/utils'

import type { ChartEvidenceProps } from './contracts'

export type { ChartEvidenceProps } from './contracts'

export function ChartEvidence({
  summary,
  alternativeLabel,
  dataAlternative,
  selection,
  actions,
  className,
}: ChartEvidenceProps) {
  return (
    <div className={cn('min-w-0 space-y-3', className)} data-chart-evidence>
      <div data-chart-summary className="break-words text-sm text-foreground">
        {summary}
      </div>
      {selection ? (
        <div role="status" data-chart-selection className="min-w-0 space-y-1 break-words text-sm">
          <div className="font-medium">{selection.label}</div>
          <div className="text-muted-foreground">{selection.effect}</div>
        </div>
      ) : null}
      <div
        role="region"
        aria-label={alternativeLabel}
        tabIndex={0}
        data-chart-alternative
        className="min-w-0 overflow-x-auto rounded-md border p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {dataAlternative}
      </div>
      {actions !== null && actions !== undefined ? (
        <div className="flex min-w-0 flex-wrap gap-2 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center [&_a]:justify-center [&_button]:min-h-11 [&_button]:min-w-11 [&_[role=button]]:inline-flex [&_[role=button]]:min-h-11 [&_[role=button]]:min-w-11 [&_[role=button]]:items-center [&_[role=button]]:justify-center">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
