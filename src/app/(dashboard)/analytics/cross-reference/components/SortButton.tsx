'use client'

/**
 * SortButton — Story 170.6-FE
 * Copied verbatim from analytics/search/components/SortButton.tsx (the search
 * route tree is read-only/forbidden for this migration — hence this route-owned
 * copy). Behavior identical at copy time; diverges only hereafter.
 */

import { ArrowUpDown } from 'lucide-react'

interface SortButtonProps {
  active: boolean
  direction?: 'asc' | 'desc'
  onClick: () => void
  children: React.ReactNode
}

export function SortButton({ active, direction, onClick, children }: SortButtonProps) {
  const sortLabel =
    active && direction ? (direction === 'asc' ? 'ascending' : 'descending') : undefined

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={
        sortLabel
          ? `Sort by ${typeof children === 'string' ? children : 'column'}, ${sortLabel}`
          : undefined
      }
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown
        aria-hidden="true"
        className={`h-3.5 w-3.5 ${active ? 'text-foreground' : 'text-muted-foreground/50'}`}
      />
    </button>
  )
}
