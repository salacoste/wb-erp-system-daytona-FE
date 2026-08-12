import { cn } from '@/lib/utils'

import { type AvailabilityState, availabilityPresentation } from './presentation'

export interface DataAvailabilityProps {
  state: AvailabilityState
  label?: string
  description?: string
  className?: string
}

export function DataAvailability({ state, label, description, className }: DataAvailabilityProps) {
  const presentation = availabilityPresentation[state]

  return (
    <span className={cn('inline-flex min-w-0 flex-col gap-0.5 text-sm', className)}>
      <span
        data-availability={state}
        className={cn('inline-flex items-center gap-1.5 font-medium', presentation.className)}
      >
        {label ?? presentation.label}
      </span>
      {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
    </span>
  )
}
