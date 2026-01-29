/**
 * TimelineEmptyState Component
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Empty state component for timeline views with different messages per variant.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md
 */

import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TimelineEmptyVariant = 'full' | 'wb' | 'local'

export interface TimelineEmptyStateProps {
  /** Variant determines message content */
  variant: TimelineEmptyVariant
  /** Additional CSS classes */
  className?: string
}

const EMPTY_STATE_CONFIG: Record<TimelineEmptyVariant, { title: string; subtitle?: string }> = {
  full: {
    title: 'История статусов пуста',
    subtitle: 'Статусы появятся после первой синхронизации',
  },
  wb: {
    title: 'WB история ещё не загружена',
    subtitle: 'Синхронизация происходит каждые 15 минут',
  },
  local: {
    title: 'Локальная история пуста',
  },
}

/**
 * TimelineEmptyState - Shows appropriate message when no history entries
 */
export function TimelineEmptyState({ variant, className }: TimelineEmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[variant]

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center py-8 text-center text-muted-foreground',
        className
      )}
    >
      <Inbox className="h-10 w-10 mb-3 opacity-50" aria-hidden="true" />
      <p className="font-medium">{config.title}</p>
      {config.subtitle && <p className="text-sm mt-1">{config.subtitle}</p>}
    </div>
  )
}
