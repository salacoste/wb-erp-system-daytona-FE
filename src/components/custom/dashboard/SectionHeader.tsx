/**
 * SectionHeader -- Collapsible section header for dashboard grid
 * Story 65.18: Collapsible sections with chevron toggle,
 * keyboard navigation, and ARIA attributes.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-4-ux.md
 */

'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SectionHeaderProps {
  /** Section title (Russian locale, uppercase by convention) */
  title: string
  /** Whether the section content is collapsed. Default: false (expanded) */
  collapsed?: boolean
  /** Callback fired when user toggles the section */
  onToggle?: () => void
  /** Additional CSS classes applied to the outer wrapper */
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive a stable DOM id from the title for aria-controls.
 * Converts Cyrillic/Latin title to a slug-like id.
 */
function titleToId(title: string): string {
  return `section-${title.toLowerCase().replace(/\s+/g, '-')}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Collapsible section header used inside DashboardMetricsGrid.
 * Renders a full-width row with title + chevron toggle.
 *
 * - Click / Enter / Space triggers onToggle
 * - aria-expanded reflects collapsed state
 * - aria-controls points to derived content id
 */
export function SectionHeader({
  title,
  collapsed = false,
  onToggle,
  className,
}: SectionHeaderProps) {
  const expanded = !collapsed
  const contentId = titleToId(title)

  const ChevronIcon = expanded ? ChevronDown : ChevronUp

  return (
    <div className={cn('col-span-full border-b border-border', className)}>
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between',
          'py-2 px-1',
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'rounded-sm'
        )}
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <ChevronIcon className="h-4 w-4 text-muted-foreground transition-transform" />
      </button>
    </div>
  )
}
