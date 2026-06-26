'use client'

/**
 * AnalyticalDisclosure (TZ-6) — the Tier-3 "Analytical" section, collapsed + lazy by default.
 *
 * The heavy analytical sections (expense charts, unit economics, trends, seasonal, historical)
 * render ONLY when expanded, so their lazy dynamic imports don't load until the user opens the
 * disclosure — lazy-by-default (AC). Collapsed by default for all personas; the "CFO may open
 * some" nicety is deferred.
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-6)
 */

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface AnalyticalDisclosureProps {
  children: ReactNode
  className?: string
}

export function AnalyticalDisclosure({
  children,
  className,
}: AnalyticalDisclosureProps): React.ReactElement {
  const [open, setOpen] = useState(false)

  return (
    <section aria-label="Аналитика" className={cn('space-y-4', className)}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls="analytical-detail"
        className="w-full justify-start text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
        Аналитика
        {!open && (
          <span className="ml-1 font-normal text-muted-foreground/70">
            — расходы, юнит-экономика, тренды
          </span>
        )}
      </Button>
      {open && (
        <div id="analytical-detail" className="space-y-4">
          {children}
        </div>
      )}
    </section>
  )
}
