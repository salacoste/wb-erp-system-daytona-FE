import type { Story1743State } from './route-contracts'
import type {
  Story1743OwnerScenarioReference,
  Story1743OwnerVariantScenario,
  Story1743RouteStateScenarioMap,
} from './owner-state-scenario-types'
import { exact, owner, variant } from './owner-state-scenario-types'
import { STORY_174_3_OWNER_VARIANT_SCENARIOS_A_ADDITIONAL } from './owner-state-evidence-a-additional'

export const STORY_174_3_ROUTE_STATE_SCENARIOS_A: Story1743RouteStateScenarioMap = {
  '/': {
    loading: exact(
      'src/app/page.test.tsx',
      '[P0] starts with one bounded semantic hydration state and never navigates during SSR'
    ),
  },
  '/cabinet': {
    permission: exact(
      'src/app/(onboarding)/cabinet/__tests__/page.test.tsx',
      '[CABINET-ROUTE-LOCK-01] consumes the shared onboarding guard once per render'
    ),
    error: exact(
      'src/components/custom/CabinetCreationForm.test.tsx',
      'retains entered values and allows one deliberate retry after a pre-create error',
      [
        exact(
          'src/components/custom/CabinetCreationForm.test.tsx',
          'validates name and target-margin boundaries before dispatch'
        ),
      ]
    ),
    pending: exact(
      'src/components/custom/CabinetCreationForm.test.tsx',
      'updates an existing cabinet once while pending and resets committed values on success'
    ),
  },
  '/processing': {
    refresh: exact(
      'src/hooks/__tests__/useProcessingStatus.test.ts',
      'resets the empty-poll counter when a batch arrives'
    ),
    stale: exact(
      'src/hooks/__tests__/useProcessingStatus.test.ts',
      'keeps polling (returns 3000) while "processing"'
    ),
  },
  '/analytics/orders': {
    partial: exact(
      'src/app/(dashboard)/analytics/orders/__tests__/page.test.tsx',
      'renders empty comparison placeholder'
    ),
  },
  '/analytics': {
    partial: exact(
      'src/app/(dashboard)/analytics/components/__tests__/MarketingKpiCard.test.tsx',
      'returns null on error (graceful degradation)'
    ),
  },
  '/analytics/alerts': {
    pending: exact(
      'src/app/(dashboard)/analytics/alerts/components/__tests__/EditAlertRuleDialog.test.tsx',
      'shows spinner when mutation is pending'
    ),
  },
  '/analytics/finance-history': {
    empty: exact(
      'src/components/custom/finance-history/__tests__/FinanceHistoryTable.test.tsx',
      'shows the empty state when every week has a null summary'
    ),
  },
  '/analytics/pricing': {
    refresh: exact('e2e/pricing-page.spec.ts', 'refresh button triggers price refresh request'),
    partial: exact(
      'src/app/(dashboard)/analytics/pricing/components/__tests__/PricingTable.test.tsx',
      'does NOT render the companion price when alternativeBasisPrice is null (batch rows)'
    ),
  },
  '/analytics/product/[nmId]': {
    error: exact(
      'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/VariantsTab.test.tsx',
      'shows an error note for a malformed nmId (no misleading empty state)'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/FunnelTab.test.tsx',
      'renders empty state when dates array is empty'
    ),
    partial: exact(
      'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/FunnelTab.test.tsx',
      'renders dash for null conversion averages (AP#8)'
    ),
  },
  '/analytics/reorder': {
    refresh: exact(
      'src/app/(dashboard)/analytics/reorder/__tests__/page.test.tsx',
      'refresh button click triggers refresh mutation'
    ),
    partial: exact(
      'src/app/(dashboard)/analytics/reorder/components/__tests__/ReorderTable.test.tsx',
      'shows dash for null dates',
      [
        exact(
          'src/app/(dashboard)/analytics/reorder/components/__tests__/ReorderSummaryCards.test.tsx',
          'shows dash for null coverage'
        ),
      ]
    ),
  },
  '/analytics/sku': {
    empty: exact(
      'src/app/(dashboard)/analytics/sku/components/__tests__/SkuTableSection.test.tsx',
      'empty state: semantic border-border + bg-muted/50 + muted text'
    ),
    partial: exact(
      'src/app/(dashboard)/analytics/sku/components/__tests__/SkuVariantSection.test.tsx',
      'shows the error branch with message when the fetch fails'
    ),
  },
  '/analytics/time-period': {
    loading: exact(
      'src/app/(dashboard)/analytics/time-period/__tests__/page.test.tsx',
      'renders page header during loading'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/time-period/__tests__/page.test.tsx',
      'renders page with empty chart data'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/time-period/__tests__/page.test.tsx',
      'renders page header on error',
      [
        exact(
          'src/app/(dashboard)/analytics/time-period/__tests__/page.test.tsx',
          'renders chart component on error (handles error internally)'
        ),
      ]
    ),
  },
  '/analytics/acquiring': {
    error: exact(
      'src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringPageContent.test.tsx',
      'renders the rate-limit retry-after banner on 503 with Retry-After header'
    ),
  },
  '/analytics/acquiring/reports/[id]': {
    error: exact(
      'e2e/acquiring.spec.ts',
      'report detail page shows rate-limit banner when API returns 503 + Retry-After'
    ),
  },
  '/analytics/fbs-enhanced': {
    empty: exact(
      'src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsRegionalDataSection.test.tsx',
      'renders empty state when regionalData is empty array'
    ),
    partial: exact(
      'src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsFunnelSection.test.tsx',
      'renders one em-dash when only one conversion rate is null (partial data)'
    ),
  },
  '/analytics/fbs-stock': {
    partial: exact(
      'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockGroupsSection.test.tsx',
      'renders populated table with null stockValue/daysOfCover as em-dash'
    ),
    pending: exact(
      'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsExportButton.test.tsx',
      'button disabled while polling (label changes to "Подготовка...")'
    ),
  },
  '/analytics/funnel': {
    partial: exact(
      'src/app/(dashboard)/analytics/funnel/components/__tests__/FunnelOverlayChart.test.tsx',
      'retains funnel evidence as partial when advertising fails and exposes retry',
      [
        exact(
          'src/app/(dashboard)/analytics/funnel/components/__tests__/FunnelSummaryCards.test.tsx',
          'renders Недоступно when one metric is missing from a present summary'
        ),
      ]
    ),
  },
  '/analytics/gaps': {
    pending: exact(
      'src/app/(dashboard)/analytics/gaps/components/__tests__/GapsTable.test.tsx',
      'serializes analysis by disabling every row while one request is pending'
    ),
  },
}

const binding = (
  route: string,
  rawOwnerState: string,
  normalizedState: Story1743State,
  source: string,
  scenarioId: string,
  runner?: 'vitest' | 'playwright',
  supportingScenarios: readonly Story1743OwnerScenarioReference[] = []
): Story1743OwnerVariantScenario =>
  variant(
    route,
    rawOwnerState,
    normalizedState,
    owner(source, scenarioId, runner, supportingScenarios)
  )

export const STORY_174_3_OWNER_VARIANT_SCENARIOS_A: readonly Story1743OwnerVariantScenario[] = [
  binding('/', 'authenticated redirect', 'default', 'src/app/page.test.tsx', '[P0] waits for delayed hydration, then replaces root with dashboard exactly once'),
  binding('/', 'unauthenticated redirect', 'default', 'src/app/page.test.tsx', '[P0] subscribes before checking already-complete hydration and replaces with login once'),
  binding('/login', 'success', 'default', 'src/components/custom/LoginForm.test.tsx', 'stores user and token in auth store on success', undefined, [owner('src/components/custom/LoginForm.test.tsx', 'redirects to dashboard on successful login')]),
  binding('/login', 'session-expired', 'default', 'src/components/custom/LoginForm.test.tsx', 'explains a valid redirect entry as re-authentication without protected content'),
  binding('/cabinet', 'success', 'default', 'src/components/custom/CabinetCreationForm.test.tsx', 'submits explicit zero once, reports success, and advances exactly once'),
  binding('/processing', 'progress', 'default', 'src/components/custom/ProcessingStatus.test.tsx', 'displays processing status with progress bars'),
  binding('/processing', 'retry', 'default', 'src/components/custom/ProcessingStatus.test.tsx', 'failed state offers fallback copy, retry, and dashboard navigation'),
  binding('/processing', 'complete', 'default', 'src/components/custom/ProcessingStatus.test.tsx', 'completed state redirects to dashboard exactly once across re-renders', undefined, [owner('src/components/custom/ProcessingStatus.test.tsx', 'shows completion message and redirects when processing completes')]),
  binding('/wb-token', 'success', 'default', 'src/components/custom/WbTokenForm.test.tsx', 'navigates to processing page on success', undefined, [owner('src/components/custom/WbTokenForm.test.tsx', 'never leaks the token value after success: form resets before navigation')]),
  binding('/analytics', 'period modes', 'default', 'src/app/(dashboard)/analytics/components/__tests__/AnalyticsPageHeader.test.tsx', 'comparison mode offers «Один период»', undefined, [owner('src/app/(dashboard)/analytics/components/__tests__/AnalyticsPageHeader.test.tsx', 'renders the aggregated-weeks subtitle only in multi mode with 2+ weeks')]),
  binding('/analytics/alerts', 'dialog validation', 'default', 'src/app/(dashboard)/analytics/alerts/components/__tests__/CreateAlertRuleDialog.test.tsx', 'disables create button when no type is selected'),
  binding('/analytics/alerts', 'unknown', 'default', 'src/app/(dashboard)/analytics/alerts/components/__tests__/AlertHistoryHelpers.test.tsx', 'falls back to muted tokens for unknown status strings'),
  binding('/analytics/finance-history', 'success', 'default', 'src/components/custom/finance-history/__tests__/FinanceHistoryTable.test.tsx', 'renders the net-profit headline row and a currency value (₽)'),
  binding('/analytics/finance-history', 'negative', 'default', 'src/components/custom/finance-history/__tests__/finance-history-delta.test.ts', 'negative change → tone down (Intl renders the minus)'),
  binding('/analytics/finance-history', 'zero', 'default', 'src/components/custom/finance-history/__tests__/finance-history-delta.test.ts', 'zero delta → tone same'),
  binding('/analytics/finance-history', 'missing', 'default', 'src/components/custom/finance-history/__tests__/finance-history-rows.test.ts', 'returns null when no revenue field present'),
  binding('/analytics/dashboard', 'token', 'permission', 'src/app/(dashboard)/layout.test.tsx', '[P0] redirects once when another tab ends the authenticated session'),
  binding('/analytics/orders', 'update', 'default', 'src/app/(dashboard)/analytics/orders/__tests__/page.test.tsx', 'syncs state to URL via useEffect (tabs render)'),
  binding('/analytics/pricing', 'Sheet states', 'default', 'src/app/(dashboard)/analytics/pricing/__tests__/page.test.tsx', 'does not render sheet when closed'),
  binding('/analytics/reorder', 'status variants', 'default', 'src/app/(dashboard)/analytics/reorder/__tests__/page.test.tsx', 'renders status badge for pending items'),
  binding('/analytics/sku', 'weeks', 'default', 'e2e/sku-analytics.spec.ts', 'week or period selector is visible', 'playwright'),
  binding('/analytics/sku', 'data', 'default', 'e2e/sku-analytics.spec.ts', 'table or grid content area is present', 'playwright'),
  binding('/analytics/sku', 'group', 'default', 'src/app/(dashboard)/analytics/sku/__tests__/SkuPageGroupBy.test.tsx', 'renders the variant section in variant mode on a single week (cashflow hidden)'),
  binding('/analytics/time-period', 'periods', 'default', 'e2e/time-period-analytics.spec.ts', 'selecting a different period keeps page stable'),
  binding('/analytics/time-period', 'positive-negative-zero', 'default', 'src/components/custom/MarginTrendChart.test.tsx', 'positive margin value uses financial-positive', undefined, [owner('src/components/custom/MarginTrendChart.test.tsx', 'negative margin value uses financial-negative'), owner('src/components/custom/MarginTrendChart.test.tsx', 'zero margin value uses muted-foreground')]),
  binding('/analytics/unit-economics', 'pagination', 'default', 'e2e/unit-economics.spec.ts', 'paginates, preserves sticky header state, and exports CSV through browser state', 'playwright'),
  binding('/analytics/unit-economics', 'sort', 'default', 'e2e/unit-economics.spec.ts', 'sorts revenue and margin through exact requests and visible row markers', 'playwright'),
  binding('/analytics/unit-economics', 'filter', 'default', 'e2e/unit-economics.spec.ts', 'filters profitability through URL and table state without an API request', 'playwright'),
  binding('/analytics/unit-economics', 'waterfall', 'default', 'e2e/unit-economics.spec.ts', 'selects a row for the waterfall and resets selection semantically', 'playwright'),
  binding('/analytics/unit-economics', 'export', 'default', 'e2e/unit-economics.spec.ts', 'paginates, preserves sticky header state, and exports CSV through browser state', 'playwright'),
  binding('/analytics/unit-economics', 'large-negative', 'default', 'src/app/(dashboard)/analytics/unit-economics/components/__tests__/waterfall-chart-utils.test.ts', 'extends BELOW zero when COGS exceeds revenue (live 133% case)'),
  binding('/analytics/acquiring', 'VAT-anomaly', 'default', 'src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringReportsTable.test.tsx', 'anomaly indicator visible when acquiringFeeVatSum > acquiringFeeSum'),
  binding('/analytics/acquiring/reports/[id]', 'invalid ID', 'not-found', 'src/app/(dashboard)/analytics/acquiring/reports/[id]/__tests__/page.test.tsx', 'rejects malformed and non-positive report IDs through the route-owned not-found boundary'),
  binding('/analytics/acquiring/period', 'missing period', 'error', 'src/app/(dashboard)/analytics/acquiring/period/__tests__/page.test.tsx', 'rejects missing or invalid deep-link period context without issuing an unbounded query', undefined, [owner('src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodDetailPage.test.tsx', 'keeps a cleared or invalid period out of the query and presents a bounded recovery action')]),
  binding('/analytics/acquiring/reports/[id]', '`notFound`', 'not-found', 'src/app/(dashboard)/analytics/acquiring/reports/[id]/__tests__/page.test.tsx', 'rejects malformed and non-positive report IDs through the route-owned not-found boundary'),
  binding('/analytics/buyout', 'missing comparison', 'default', 'src/app/(dashboard)/analytics/buyout/components/__tests__/buyout-comparison-utils.test.ts', 'returns null when previous is null'),
  binding('/analytics/buyout', 'anomalous negative delta', 'default', 'src/app/(dashboard)/analytics/buyout/components/__tests__/buyout-comparison-utils.test.ts', 'returns financial-negative for down on normal metric'),
  binding('/analytics/buyout-reconciliation', 'matched', 'default', 'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx', 'branch 4 — renders no-anomalies success state when all anomaly counts are 0'),
  binding('/analytics/fbs-stock', 'ready', 'default', 'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsExportButton.test.tsx', 'polling ready → download anchor uses signed S3 URL from statusData.url (H-1+H-2 fix)'),
  binding('/analytics/funnel', 'sync-gap', 'default', 'src/app/(dashboard)/analytics/funnel/components/__tests__/SyncStatusBanner.test.tsx', 'renders the explicit never-synced gap without a trustworthy timestamp'),
  binding('/analytics/funnel', 'missing comparison', 'default', 'src/app/(dashboard)/analytics/funnel/components/__tests__/FunnelDeltaIndicator.test.tsx', 'renders missing comparison meaning as persistent visible text'),
  binding('/analytics/funnel', 'anomaly states', 'default', 'src/app/(dashboard)/analytics/funnel/components/__tests__/FunnelAnomalyIndicator.test.tsx', 'exposes the complete diagnostic message on the trigger span'),
  binding('/analytics/gaps', 'valid no-gaps', 'default', 'src/app/(dashboard)/analytics/gaps/components/__tests__/GapsPageContent.test.tsx', 'distinguishes a terminal query failure from a valid no-gaps result and retries'),
  binding('/analytics/gaps', 'analyzed', 'default', 'src/app/(dashboard)/analytics/gaps/components/__tests__/useGapsPageState.test.ts', 'keeps analysis mounted while successful remediation closes the dialog'),
  ...STORY_174_3_OWNER_VARIANT_SCENARIOS_A_ADDITIONAL,
]
