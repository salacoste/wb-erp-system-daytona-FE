/**
 * Unified Product Analytics Page — Epic 120-FE Story 120.5 (route shell).
 * Marketing Plan §3.3 "Product Analytics Page" — per-product analytics home.
 *
 * Next.js 15 server-component contract (Epic 119-FE retro A-1 / check:next-params):
 * `params` is a Promise that MUST be awaited before accessing properties. A
 * synchronous declaration passes `tsc` but BREAKS `next build` route typegen.
 * Adjacent precedent: supplies/[id]/page.tsx, analytics/search/page.tsx (119.2).
 *
 * Data wiring is deferred to Stories 120.6/120.7 (FE work, not backend-gated):
 * Request #177 is RESOLVED (2026-06-02; /v1/analytics/product/:nmId/unified et al.
 * are live), so 120.6 fills the tabs VERIFY-FIRST against the live response. This
 * file ships the shell only.
 */

import { ProductAnalyticsContent } from './components/ProductAnalyticsContent'

interface ProductAnalyticsPageProps {
  params: Promise<{ nmId: string }>
}

export default async function ProductAnalyticsPage({ params }: ProductAnalyticsPageProps) {
  const { nmId } = await params
  return <ProductAnalyticsContent nmId={nmId} />
}
