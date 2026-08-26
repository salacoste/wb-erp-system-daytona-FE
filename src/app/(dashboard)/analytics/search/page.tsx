/**
 * Search Analytics Page
 * Epic 71-FE: Search Analytics & Jam Gating
 * Story 119.2-FE Pass-1 F-1: forward ?query= URL param to SearchPageContent so the
 * Funnel "Топ поисковых запросов" cross-page link lands on the by-query tab with
 * the query pre-populated.
 * Story 170.7 Task 3: deep-link IMPLEMENTED — also reads ?tab (validated against
 * the 4 known tab values) and ?nmId (by-product preselect), making the movers'
 * `?tab=by-product&nmId=...` cross-links live (previously dead params).
 */

import { SearchPageContent } from './components/SearchPageContent'

/**
 * Story 119.2-FE Pass-2 P2-1: Next.js 15 server-component contract requires
 * `searchParams` to be a Promise that must be awaited before accessing properties.
 * Pre-Pass-2 this was declared synchronously, which would BREAK `next build` typegen
 * + emit a runtime warning. Adjacent files in this codebase (e.g.,
 * src/app/(dashboard)/supplies/[id]/page.tsx, analytics/models/[id]/evaluations,
 * analytics/acquiring/reports/[id]) all use the Promise-based async API.
 */
interface SearchPageProps {
  searchParams?: Promise<{
    query?: string | string[]
    tab?: string | string[]
    nmId?: string | string[]
  }>
}

/** Story 170.7: the 4 known tab values — anything else falls back to defaults. */
const KNOWN_TABS = ['orders', 'by-product', 'by-query', 'position-trends'] as const

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = (await searchParams) ?? {}
  // Defensive: each param can be string | string[] | undefined per Next.js
  // typing; we only consume the first value (single-cardinality semantic).
  const first = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v[0] : v
  const initialQuery = first(params.query)
  const rawTab = first(params.tab)
  const initialTab =
    rawTab && (KNOWN_TABS as readonly string[]).includes(rawTab) ? rawTab : undefined
  // nmId deep-link: numeric only — garbage silently ignored (no fabricated IDs).
  const rawNmId = first(params.nmId)
  const parsedNmId = rawNmId && /^\d+$/.test(rawNmId) ? Number(rawNmId) : undefined
  return (
    <SearchPageContent
      initialQuery={initialQuery}
      initialTab={initialTab}
      initialNmId={parsedNmId}
    />
  )
}
