import type { Story1743State } from './route-contracts'
import type {
  Story1743OwnerScenarioReference,
  Story1743OwnerVariantScenario,
} from './owner-state-scenario-types'
import { owner, variant } from './owner-state-scenario-types'

const scenario = (
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

export const STORY_174_3_OWNER_VARIANT_SCENARIOS_A_ADDITIONAL: readonly Story1743OwnerVariantScenario[] = [
  scenario('/login', 'invalid', 'error', 'src/components/custom/LoginForm.test.tsx', 'focuses the first invalid field and makes no login call on invalid submission'),
  scenario('/login', 'credential', 'error', 'src/components/custom/LoginForm.test.tsx', 'shows associated generic feedback and restores password focus after invalid credentials'),
  scenario('/login', 'network', 'error', 'src/components/custom/LoginForm.test.tsx', 'shows distinct recoverable feedback and restores password focus after network failure'),
  scenario('/register', 'invalid', 'error', 'src/components/custom/RegistrationForm.test.tsx', '[REG-FORM-01] associates empty-field errors, exposes a focusable summary, focuses email, and sends no request'),
  scenario('/register', 'duplicate', 'error', 'src/components/custom/RegistrationForm.test.tsx', '[REG-FORM-04] retains masked credentials and exposes associated duplicate recovery with focus and a login link'),
  scenario('/register', 'network', 'error', 'src/components/custom/RegistrationForm.test.tsx', '[Review 3 finding M-1] keeps password-like hostile 5xx detail in generic service recovery'),
  scenario('/cabinet', 'invalid', 'error', 'src/components/custom/CabinetCreationForm.test.tsx', 'validates name and target-margin boundaries before dispatch'),
  scenario('/cabinet', 'server', 'error', 'src/components/custom/CabinetCreationForm.test.tsx', 'retains entered values and allows one deliberate retry after a pre-create error'),
  scenario('/cabinet', 'network', 'error', 'src/components/custom/CabinetCreationForm.test.tsx', 'retains entered values and allows one deliberate retry after a pre-create error'),
  scenario('/processing', 'queued', 'pending', 'src/components/custom/ProcessingStatus.test.tsx', 'displays processing status with progress bars'),
  scenario('/processing', 'running', 'pending', 'src/components/custom/ProcessingStatus.test.tsx', 'exposes progressbar semantics with server-provided values'),
  scenario('/processing', 'failure', 'error', 'src/components/custom/ProcessingStatus.test.tsx', 'displays error state when processing fails'),
  scenario('/processing', 'network', 'error', 'src/components/custom/ProcessingStatus.test.tsx', 'handles API error state'),
  scenario('/wb-token', 'guard', 'permission', 'src/components/custom/WbTokenForm.test.tsx', 'keeps token save disabled for analyst users'),
  scenario('/wb-token', 'malformed', 'error', 'src/components/custom/wb-token-form-helpers.test.ts', 'rejects a long token without the 3-part JWT structure'),
  scenario('/wb-token', 'rejected', 'error', 'src/components/custom/wb-token-form-helpers.test.ts', 'maps WB-rejected / invalid / expired tokens to «Токен недействителен» with recovery link'),
  scenario('/wb-token', 'permission', 'permission', 'src/components/custom/wb-token-form-helpers.test.ts', 'maps permission failures (403/forbidden) to «Нет доступа» without link'),
  scenario('/wb-token', 'network', 'error', 'src/components/custom/wb-token-form-helpers.test.ts', 'maps network failures to «Ошибка сети» without link'),
  scenario('/analytics', 'widget-degraded', 'partial', 'src/app/(dashboard)/analytics/components/__tests__/MarketingKpiCard.test.tsx', 'returns null on error (graceful degradation)'),
  scenario('/analytics', 'partial', 'partial', 'src/app/(dashboard)/analytics/components/__tests__/MarketingKpiCard.test.tsx', 'returns null on error (graceful degradation)'),
  scenario('/analytics/dashboard', 'incomplete', 'partial', 'src/app/(dashboard)/analytics/dashboard/__tests__/page.test.tsx', 'renders IncompleteWeekBanner when finance not available'),
  scenario('/analytics/dashboard', 'partial', 'partial', 'src/app/(dashboard)/analytics/dashboard/__tests__/page.test.tsx', 'renders IncompleteWeekBanner when finance not available'),
  scenario('/analytics/finance-history', 'no weeks', 'empty', 'src/components/custom/WeekSelector.test.tsx', 'should show empty state when no weeks available'),
  scenario('/analytics/finance-history', 'empty', 'empty', 'src/components/custom/finance-history/__tests__/FinanceHistoryTable.test.tsx', 'shows the empty state when every week has a null summary'),
  scenario('/analytics/orders', 'error', 'error', 'src/app/(dashboard)/analytics/orders/__tests__/page.test.tsx', 'shows error alert on fetch failure'),
  scenario('/analytics/orders', 'partial', 'partial', 'src/app/(dashboard)/analytics/orders/__tests__/page.test.tsx', 'renders empty comparison placeholder'),
  scenario('/analytics/orders', 'invalid URL', 'error', 'src/app/(dashboard)/analytics/orders/__tests__/page.test.tsx', 'handles invalid URL params by using defaults'),
  scenario('/analytics/orders', 'comparison unavailable', 'partial', 'src/app/(dashboard)/analytics/orders/__tests__/page.test.tsx', 'renders empty comparison placeholder'),
  scenario('/analytics/product/[nmId]', 'parameter load', 'loading', 'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/ProductAnalyticsContent.test.tsx', 'shows skeleton while loading'),
  scenario('/analytics/product/[nmId]', 'invalid', 'error', 'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/VariantsTab.test.tsx', 'shows an error note for a malformed nmId (no misleading empty state)'),
  scenario('/analytics/product/[nmId]', 'tab load', 'loading', 'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/ProductAnalyticsContent.test.tsx', 'shows skeleton while loading'),
  scenario('/analytics/product/[nmId]', 'error', 'error', 'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/VariantsTab.test.tsx', 'renders the error note when the fetch fails (no page crash)'),
  scenario('/analytics/acquiring', 'rate-limited', 'error', 'src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringPageContent.test.tsx', 'renders the rate-limit retry-after banner on 503 with Retry-After header'),
  scenario('/analytics/acquiring', 'invalid', 'error', 'src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringPageContent.test.tsx', 'renders the generic error alert for non-503 errors'),
  scenario('/analytics/acquiring/period', 'invalid', 'error', 'src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodDetailPage.test.tsx', 'keeps a cleared or invalid period out of the query and presents a bounded recovery action'),
  scenario('/analytics/acquiring/period', 'rate-limit', 'error', 'src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodDetailPage.test.tsx', 'shows rate-limit banner instead of generic full-error when 503 and no cached data'),
  scenario('/analytics/acquiring/period', 'period-not-calculated states', 'error', 'src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodDetailPage.test.tsx', 'keeps a cleared or invalid period out of the query and presents a bounded recovery action'),
  scenario('/analytics/acquiring/reports/[id]', 'report-level success with transaction-section failure', 'error', 'src/app/(dashboard)/analytics/acquiring/reports/[id]/components/__tests__/AcquiringReportDetailPage.test.tsx', 'inline refetch-error chip uses status-warning matched-pair tokens (no amber)'),
  scenario('/analytics/acquiring/reports/[id]', 'rate-limit states', 'error', 'e2e/acquiring.spec.ts', 'report detail page shows rate-limit banner when API returns 503 + Retry-After', 'playwright'),
  scenario('/analytics/buyout-reconciliation', 'mismatched', 'error', 'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/AnomalyIndicator.test.tsx', 'renders correct aria-label for return_quantity_mismatch type'),
  scenario('/analytics/buyout-reconciliation', 'state-machine failure states', 'error', 'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx', 'branch 2 — renders full-error alert with retry button when isError and no data'),
  scenario('/analytics/fbs-enhanced', 'error', 'error', 'src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsEnhancedPageContent.test.tsx', 'shows a retryable error state when the enhanced FBS request times out'),
  scenario('/analytics/fbs-enhanced', 'funnel not-calculated', 'error', 'src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsFunnelSection.test.tsx', 'renders 2 metric cards with null values as em-dash — Pattern 3 fixture wiring'),
  scenario('/analytics/funnel', 'overlay unavailable', 'partial', 'src/app/(dashboard)/analytics/funnel/components/__tests__/FunnelOverlayChart.test.tsx', 'retains funnel evidence as partial when advertising fails and exposes retry'),
  scenario('/analytics/funnel', 'stage-level partial', 'partial', 'src/app/(dashboard)/analytics/funnel/components/__tests__/FunnelSummaryCards.test.tsx', 'renders Недоступно when one metric is missing from a present summary'),
  scenario(
    '/processing',
    'refresh',
    'refresh',
    'src/hooks/__tests__/useProcessingStatus.test.ts',
    'resets the empty-poll counter when a batch arrives'
  ),
  scenario(
    '/processing',
    'stale',
    'stale',
    'src/hooks/__tests__/useProcessingStatus.test.ts',
    'keeps polling (returns 3000) while "processing"'
  ),
  scenario(
    '/processing',
    'safe-leave',
    'default',
    'src/components/custom/ProcessingStatus.test.tsx',
    'renders no_data CTA and navigates to dashboard on click without auto-redirect'
  ),
  scenario(
    '/analytics',
    'token-required',
    'permission',
    'src/app/(dashboard)/layout.test.tsx',
    '[P0] redirects once when another tab ends the authenticated session'
  ),
  scenario(
    '/analytics',
    'loading',
    'loading',
    'src/app/(dashboard)/analytics/components/__tests__/AnalyticsSummaryContent.test.tsx',
    'renders the initial structural loading state without fabricating summary data'
  ),
  scenario(
    '/analytics',
    'refresh',
    'refresh',
    'src/app/(dashboard)/analytics/components/__tests__/AnalyticsSummaryContent.test.tsx',
    'retains the loaded summary and labels a background refresh'
  ),
  scenario(
    '/analytics',
    'empty',
    'empty',
    'src/app/(dashboard)/analytics/components/__tests__/AnalyticsSummaryContent.test.tsx',
    'renders the global empty state when no primary summary exists'
  ),
  scenario(
    '/analytics',
    'error',
    'error',
    'src/app/(dashboard)/analytics/components/__tests__/AnalyticsSummaryContent.test.tsx',
    'retries a recoverable terminal summary error without losing route identity'
  ),
  scenario(
    '/analytics',
    'stale',
    'stale',
    'src/app/(dashboard)/analytics/components/__tests__/AnalyticsSummaryContent.test.tsx',
    'retains stale summary evidence and exposes retry after a background failure'
  ),
  scenario(
    '/analytics/alerts',
    'loading',
    'loading',
    'src/app/(dashboard)/analytics/alerts/components/__tests__/AlertSummaryCards.test.tsx',
    'renders loading skeletons when isLoading is true'
  ),
  scenario(
    '/analytics/alerts',
    'refresh',
    'refresh',
    'src/hooks/__tests__/useAlerts.test.ts',
    'updates a rule and invalidates cache'
  ),
  scenario(
    '/analytics/alerts',
    'filtered',
    'filtered-empty',
    'src/app/(dashboard)/analytics/alerts/components/__tests__/AlertHistoryTable.test.tsx',
    'keeps a visible reset path when active filters produce no history rows'
  ),
  scenario(
    '/analytics/alerts',
    'permission',
    'permission',
    'src/app/(dashboard)/analytics/alerts/__tests__/AlertsPage.test.tsx',
    'keeps alert evidence visible but removes mutation controls for an Analyst'
  ),
  scenario(
    '/analytics/dashboard',
    'refresh',
    'refresh',
    'src/app/(dashboard)/analytics/dashboard/__tests__/page.test.tsx',
    'retains loaded dashboard evidence during a background refresh'
  ),
  scenario(
    '/analytics/dashboard',
    'no cabinet',
    'permission',
    'src/components/custom/LoginForm.test.tsx',
    'stores null cabinet id when the successful user has no cabinets'
  ),
  scenario(
    '/analytics/dashboard',
    'stale',
    'stale',
    'src/app/(dashboard)/analytics/dashboard/__tests__/page.test.tsx',
    'retains stale dashboard evidence and retries a failed background refresh'
  ),
  scenario(
    '/analytics/finance-history',
    'load',
    'loading',
    'src/app/(dashboard)/analytics/finance-history/__tests__/page.test.tsx',
    'keeps route identity visible while financial weeks are loading'
  ),
  scenario(
    '/analytics/finance-history',
    'error',
    'error',
    'src/app/(dashboard)/analytics/finance-history/__tests__/page.test.tsx',
    'renders a recoverable route error when every requested week fails'
  ),
  scenario(
    '/analytics/finance-history',
    'partial',
    'partial',
    'src/app/(dashboard)/analytics/finance-history/__tests__/page.test.tsx',
    'retains successful weeks and labels a partial multi-week failure'
  ),
  scenario(
    '/analytics/finance-history',
    'large',
    'default',
    'src/app/(dashboard)/analytics/finance-history/__tests__/page.test.tsx',
    'passes a twelve-digit financial value to the table without route-level truncation'
  ),
  scenario(
    '/analytics/pricing',
    'filtered',
    'filtered-empty',
    'src/app/(dashboard)/analytics/pricing/__tests__/page.test.tsx',
    'keeps pricing filters visible when the current filter result is empty'
  ),
  scenario(
    '/analytics/pricing',
    'large-negative',
    'default',
    'src/app/(dashboard)/analytics/pricing/components/__tests__/PricingTable.test.tsx',
    'renders a large negative price gap with financial-negative semantics without truncation'
  ),
  scenario(
    '/analytics/product/[nmId]',
    'not-found',
    'not-found',
    'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/ProductAnalyticsContent.test.tsx',
    'renders an explicit not-found state for a missing product instead of a placeholder'
  ),
  scenario(
    '/analytics/product/[nmId]',
    'date update',
    'default',
    'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/ProductAnalyticsContent.test.tsx',
    'updates every product query when the date range changes'
  ),
  scenario(
    '/analytics/product/[nmId]',
    'long product',
    'default',
    'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/ProductAnalyticsContent.test.tsx',
    'renders a very long opaque product identifier without numeric coercion'
  ),
  scenario(
    '/analytics/reorder',
    'filtered',
    'filtered-empty',
    'src/app/(dashboard)/analytics/reorder/components/__tests__/ReorderTable.test.tsx',
    'renders empty message when no data',
    undefined,
    [
      owner(
        'src/app/(dashboard)/analytics/reorder/components/__tests__/ReorderFilters.test.tsx',
        'renders current value in select trigger'
      ),
    ]
  ),
  scenario(
    '/analytics/reorder',
    'large amount',
    'default',
    'src/app/(dashboard)/analytics/reorder/__tests__/page.test.tsx',
    'renders a twelve-digit reorder amount without overflow or silent truncation'
  ),
  scenario(
    '/analytics/sku',
    'suspense',
    'loading',
    'src/app/(dashboard)/analytics/sku/components/__tests__/SkuPageStates.test.tsx',
    'renders the route suspense fallback as a bounded busy state'
  ),
  scenario(
    '/analytics/sku',
    'refresh',
    'refresh',
    'src/app/(dashboard)/analytics/sku/components/__tests__/SkuPageStates.test.tsx',
    'retries the failed SKU query from the route-owned data error'
  ),
  scenario(
    '/analytics/sku',
    'filtered',
    'filtered-empty',
    'src/app/(dashboard)/analytics/sku/components/__tests__/SkuPageAlerts.test.tsx',
    'keeps the active SKU filter and a visible reset action in filtered-empty state'
  ),
  scenario(
    '/analytics/sku',
    'missing COGS',
    'default',
    'src/app/(dashboard)/analytics/sku/components/__tests__/SkuFilterSection.test.tsx',
    'renders missing COGS as an explicit coverage gap instead of a zero margin'
  ),
  scenario(
    '/analytics/sku',
    'stale',
    'stale',
    'src/app/(dashboard)/analytics/sku/components/__tests__/historical-spp-state.test.ts',
    'scrubs stale enabled-cache values while disabled and preserves explicit zero when enabled'
  ),
  scenario(
    '/analytics/sku',
    'export',
    'default',
    'e2e/sku-analytics.spec.ts',
    'export button is present',
    'playwright'
  ),
  scenario(
    '/analytics/time-period',
    'refresh',
    'refresh',
    'src/components/custom/MarginTrendChart.test.tsx',
    'should call refetch when retry button is clicked'
  ),
  scenario(
    '/analytics/time-period',
    'partial',
    'partial',
    'src/components/custom/MarginTrendChart.test.tsx',
    'missing COGS warning uses status-warning'
  ),
  scenario(
    '/analytics/time-period',
    'stale',
    'stale',
    'src/components/custom/MarginTrendChart.test.tsx',
    'retains stale trend evidence and exposes retry after a background failure'
  ),
  scenario(
    '/analytics/unit-economics',
    'filtered',
    'filtered-empty',
    'e2e/unit-economics.spec.ts',
    'keeps the active profitability filter and reset path when it produces no rows',
    'playwright'
  ),
  scenario(
    '/analytics/unit-economics',
    'partial',
    'partial',
    'src/app/(dashboard)/analytics/unit-economics/components/__tests__/unit-economics-table-utils.test.tsx',
    'renders "—" + neutral for null cost % (no COGS), never a fabricated "0,0 %"'
  ),
  scenario(
    '/analytics/buyout',
    'zero-buyout (valid zero) states',
    'default',
    'src/app/(dashboard)/analytics/buyout/components/__tests__/buyout-table-cells.test.tsx',
    'shows zero when count is 0 (valid data, not missing)'
  ),
  scenario(
    '/analytics/buyout-reconciliation',
    'not-started',
    'default',
    'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx',
    'branch 3 — renders no-data empty state when data array is empty'
  ),
  scenario(
    '/analytics/buyout-reconciliation',
    'processing',
    'pending',
    'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx',
    'branch 1 — renders loading skeleton when isLoading and no data'
  ),
  scenario(
    '/analytics/buyout-reconciliation',
    'partial-source',
    'partial',
    'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/ReconciliationTable.test.tsx',
    'M-3: renders SourceBadge with AlertTriangle when source === "unknown" (Defensive Frontend Principle)'
  ),
  scenario(
    '/analytics/fbs-stock',
    'valid zero-stock',
    'default',
    'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockGroupsSection.test.tsx',
    'renders a valid zero stock balance as 0 instead of missing data'
  ),
  scenario(
    '/analytics/fbs-stock',
    'expanded group',
    'default',
    'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockGroupsSection.test.tsx',
    'renders populated table with null stockValue/daysOfCover as em-dash'
  ),
  scenario(
    '/analytics/gaps',
    'unknown classification',
    'default',
    'src/app/(dashboard)/analytics/gaps/components/__tests__/GapAnalysisDialog.test.tsx',
    'renders an unknown root-cause classification as literal bounded warning evidence'
  ),
  scenario(
    '/analytics/gaps',
    'dialog detail-error states',
    'error',
    'src/app/(dashboard)/analytics/gaps/components/__tests__/GapAnalysisDialog.test.tsx',
    'bounds long evidence inside the viewport while keeping actions reachable'
  ),
]
