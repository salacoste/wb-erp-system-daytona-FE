import type { Story1743OwnerStateException } from './owner-state-exceptions'

export const STORY_174_3_OWNER_STATE_EXCEPTIONS_C: readonly Story1743OwnerStateException[] = [
  {
    route: '/monitor',
    rawOwnerState: 'action pending where applicable',
    normalizedState: 'pending',
    reason:
      '/monitor owner clause [action pending where applicable]: the route is a read-only aggregation of health queries and exposes no product mutation or corrective action that can enter a pending state.',
    canonicalOwnerDecision:
      '/monitor owner clause [action pending where applicable]: keep query loading and refresh evidence executable; the implementation source proves that no route action is applicable.',
    source: 'src/app/(dashboard)/monitor/components/MonitorPageContent.tsx',
    sourceAssertion: 'const { data, isLoading, isError, refetch } = useMonitorSummary()',
  },
  {
    route: '/products',
    rawOwnerState: 'filtered empty where supported',
    normalizedState: 'filtered-empty',
    reason:
      '/products owner clause [filtered empty where supported]: the canonical lifecycle route exposes fixed active and discontinued sections but no user filter that can produce a filtered-empty result.',
    canonicalOwnerDecision:
      '/products owner clause [filtered empty where supported]: retain executable empty-section evidence; the conditional where-supported clause is not applicable until a product filter exists.',
    source: 'src/app/(dashboard)/products/page.tsx',
    sourceAssertion:
      '* Shows discontinued SKUs (with reactivate) and system suggestions (no sales ≥90d)',
  },
  {
    route: '/settings',
    rawOwnerState: 'overview loading',
    normalizedState: 'loading',
    reason:
      '/settings owner clause [overview loading]: the canonical root is a synchronous fixed navigation overview with no request or deferred owner that can load.',
    canonicalOwnerDecision:
      '/settings owner clause [overview loading]: loading evidence belongs to data-backed child settings routes, not the synchronous overview.',
    source: 'src/app/(dashboard)/settings/page.tsx',
    sourceAssertion: 'export default function SettingsPage() {',
  },
  {
    route: '/settings',
    rawOwnerState: 'empty',
    normalizedState: 'empty',
    reason:
      '/settings owner clause [empty]: the canonical root renders a fixed set of navigation overview cards rather than a data collection that can be empty.',
    canonicalOwnerDecision:
      '/settings owner clause [empty]: empty evidence belongs to data-backed child settings routes, while the root overview remains structurally present.',
    source: 'src/app/(dashboard)/settings/page.tsx',
    sourceAssertion: '<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">',
  },
  {
    route: '/settings',
    rawOwnerState: 'error where applicable',
    normalizedState: 'error',
    reason:
      '/settings owner clause [error where applicable]: the canonical root performs no request or mutation and therefore has no data error terminal.',
    canonicalOwnerDecision:
      '/settings owner clause [error where applicable]: error evidence belongs to request-backed child settings routes, not the static overview.',
    source: 'src/app/(dashboard)/settings/page.tsx',
    sourceAssertion: '<section className="space-y-6" aria-labelledby="settings-overview-title">',
  },
]
