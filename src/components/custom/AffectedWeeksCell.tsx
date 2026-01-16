'use client'

import { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AffectedWeeksCellProps {
  weeks: string[]
}

/**
 * Affected Weeks Cell Component
 * Story 5.1-fe: View COGS History
 *
 * AC: 7 - Collapsed "N недель" with expand on click
 * UX Decision: Keeps table clean, details available on demand
 *
 * Reference: frontend/docs/stories/epic-5/story-5.1-fe-cogs-history-view.md
 */
export function AffectedWeeksCell({ weeks }: AffectedWeeksCellProps) {
  const [expanded, setExpanded] = useState(false)

  // Empty state
  if (!weeks || weeks.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  /**
   * Russian plural form for "неделя"
   */
  const getPluralForm = (n: number): string => {
    const mod10 = n % 10
    const mod100 = n % 100

    if (mod100 >= 11 && mod100 <= 19) return 'недель'
    if (mod10 === 1) return 'неделя'
    if (mod10 >= 2 && mod10 <= 4) return 'недели'
    return 'недель'
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className="flex items-center gap-1 hover:underline text-sm">
        <span>
          {weeks.length} {getPluralForm(weeks.length)}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="text-sm text-muted-foreground mt-1">
        {weeks.join(', ')}
      </CollapsibleContent>
    </Collapsible>
  )
}
