'use client'

/**
 * Search Orders Tab — orchestrator
 * Story 71.5-FE: Search Orders Tab (summary + table)
 * Story 117.1-FE: split into two INDEPENDENT state machines (Pattern 1, CLAUDE.md):
 *   1. SearchOrdersChart   — daily time-series (groupBy='day')
 *   2. SearchOrdersOverview — summary cards + table (groupBy='query')
 * Each owns its own loading/error/empty branch. A failure in one source must NOT
 * blank the other.
 * Story 117.4-FE: added a 3rd Pattern-1 sibling — TopKeywordsByOrdersCard. It
 * also uses groupBy='query', so TanStack Query dedupes the cache key with the
 * overview (2 component callers = 1 HTTP request, shared cache). Its error path
 * renders an error message inside its own CardShell chrome — consistent with the
 * Chart/Overview siblings (Defensive Frontend "indicate, don't hide" per the
 * Story 117.4-FE Pass-1 H-1 fix). It never blanks the other two.
 */

import { SearchOrdersChart } from './SearchOrdersChart'
import { SearchOrdersOverview } from './SearchOrdersOverview'
import { TopKeywordsByOrdersCard } from './TopKeywordsByOrdersCard'

interface SearchOrdersTabProps {
  from: string
  to: string
}

export function SearchOrdersTab({ from, to }: SearchOrdersTabProps) {
  return (
    <div className="space-y-4 pt-4">
      <SearchOrdersChart from={from} to={to} />
      <SearchOrdersOverview from={from} to={to} />
      <TopKeywordsByOrdersCard from={from} to={to} />
    </div>
  )
}
