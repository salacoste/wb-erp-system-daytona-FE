/**
 * Search Analytics Page
 * Epic 71-FE: Search Analytics & Jam Gating
 * Story 119.2-FE Pass-1 F-1: forward ?query= URL param to SearchPageContent so the
 * Funnel "Топ поисковых запросов" cross-page link lands on the by-query tab with
 * the query pre-populated.
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
  searchParams?: Promise<{ query?: string | string[] }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = (await searchParams) ?? {}
  const rawQuery = params.query
  // Defensive: searchParams.query can be string | string[] | undefined per Next.js
  // typing; we only consume the first value (single-cardinality semantic).
  const initialQuery = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery
  return <SearchPageContent initialQuery={initialQuery} />
}
