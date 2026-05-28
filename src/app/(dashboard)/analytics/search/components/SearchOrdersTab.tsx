'use client'

/**
 * Search Orders Tab — orchestrator
 * Story 71.5-FE: Search Orders Tab (summary + table)
 * Story 117.1-FE: split into two INDEPENDENT state machines (Pattern 1, CLAUDE.md):
 *   1. SearchOrdersChart   — daily time-series (groupBy='day')
 *   2. SearchOrdersOverview — summary cards + table (groupBy='query')
 * Each owns its own loading/error/empty branch. A failure in one source must NOT
 * blank the other — the chart renders above the overview regardless of the
 * overview's fetch state, and vice versa.
 */

import { SearchOrdersChart } from './SearchOrdersChart'
import { SearchOrdersOverview } from './SearchOrdersOverview'

interface SearchOrdersTabProps {
  from: string
  to: string
}

export function SearchOrdersTab({ from, to }: SearchOrdersTabProps) {
  return (
    <div className="space-y-4 pt-4">
      <SearchOrdersChart from={from} to={to} />
      <SearchOrdersOverview from={from} to={to} />
    </div>
  )
}
