/**
 * Placeholder Metric Card Component
 * Story 62.1-FE: Redesign Dashboard Metrics Grid
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Temporary placeholder for metrics not yet implemented.
 * Will be replaced by actual metric cards in Stories 62.3-62.9.
 *
 * @see docs/stories/epic-62/story-62.1-fe-redesign-dashboard-metrics-grid.md
 */

import { cn } from '@/lib/utils'

export interface PlaceholderMetricCardProps {
  /** Card title */
  title: string
  /** Loading state */
  isLoading: boolean
  /** Story reference note */
  note: string
  /** Whether this card should be visually highlighted */
  highlighted?: boolean
}

/**
 * Temporary placeholder card for metrics not yet implemented
 * Will be replaced by actual metric cards in subsequent stories
 */
export function PlaceholderMetricCard({
  title,
  isLoading,
  note,
  highlighted = false,
}: PlaceholderMetricCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="min-h-[120px] rounded-lg border border-[#EEEEEE] bg-card p-4">
        <div className="animate-pulse">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="mt-2 h-8 w-32 rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-[120px] rounded-lg border p-4 transition-shadow hover:shadow-md',
        highlighted ? 'border-blue-500 bg-blue-50/50' : 'border-[#EEEEEE] bg-card'
      )}
      role="article"
      aria-label={title}
    >
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <div className="mt-2 text-2xl font-bold text-muted-foreground/50">—</div>
      <div className="mt-1 text-xs text-muted-foreground">{note}</div>
    </div>
  )
}
