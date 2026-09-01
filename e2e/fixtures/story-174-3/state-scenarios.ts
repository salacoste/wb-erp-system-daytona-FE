import { STORY_174_3_STATES } from './route-contracts'
import { STORY_174_3_ADDITIONAL_STATE_SCENARIOS } from './state-scenarios-additional'

export type Story1743NonDefaultState = Exclude<(typeof STORY_174_3_STATES)[number], 'default'>
export type Story1743ExactStateScenario = {
  source: string
  scenarioId: string
  supportingScenarios?: readonly Story1743ExactStateScenario[]
}

const exact = (
  source: string,
  scenarioId: string,
  supportingScenarios: readonly Story1743ExactStateScenario[] = []
): Story1743ExactStateScenario => ({
  source,
  scenarioId,
  ...(supportingScenarios.length > 0 ? { supportingScenarios } : {}),
})

/**
 * Exact route/state declarations only. An omitted state is deliberately and
 * visibly materialized as route-specific N/A; title-token inference is banned.
 */
export const STORY_174_3_EXACT_STATE_SCENARIOS: Readonly<
  Record<string, Partial<Record<Story1743NonDefaultState, Story1743ExactStateScenario>>>
> = {
  ...STORY_174_3_ADDITIONAL_STATE_SCENARIOS,
  '/': {
    error: exact(
      'src/app/page.test.tsx',
      '[P1] has no automated accessibility violations in hydrating or error states'
    ),
  },
  '/login': {
    error: exact(
      'src/components/custom/LoginForm.test.tsx',
      'has no automated accessibility violations in the request-error state'
    ),
    pending: exact(
      'src/components/custom/LoginForm.test.tsx',
      'disables every control and exposes a truthful busy state while submission is pending'
    ),
  },
  '/register': {
    stale: exact(
      'src/components/custom/RegistrationForm.test.tsx',
      '[Review 1 findings 3 and 4] clears stale duplicate feedback on email correction and submits once more with the retained password'
    ),
  },
  '/cabinet': {
    stale: exact(
      'src/components/custom/CabinetCreationForm.accountRecovery.test.tsx',
      'preserves B admission and suppresses stale A success side effects'
    ),
    partial: exact(
      'src/components/custom/CabinetCreationForm.accountRecovery.test.tsx',
      'persists token partial success and blocks click, Enter, and native submit on remount'
    ),
    'partial-success': exact(
      'src/components/custom/CabinetCreationForm.accountRecovery.test.tsx',
      'persists token partial success and blocks click, Enter, and native submit on remount'
    ),
  },
  '/processing': {
    loading: exact(
      'src/components/custom/ProcessingStatus.test.tsx',
      'shows loading state initially'
    ),
    error: exact(
      'src/components/custom/ProcessingStatus.test.tsx',
      'displays error state when processing fails'
    ),
    pending: exact(
      'src/components/custom/ProcessingStatus.test.tsx',
      'displays processing status with progress bars'
    ),
  },
  '/wb-token': {
    loading: exact(
      'src/components/custom/WbTokenForm.test.tsx',
      'shows loading state during submission'
    ),
    empty: exact(
      'src/components/custom/wb-token-form-helpers.test.ts',
      'rejects an empty token with the required-field message'
    ),
    error: exact(
      'src/components/custom/wb-token-form-helpers.test.ts',
      'maps network failures to «Ошибка сети» without link'
    ),
    permission: exact(
      'src/components/custom/wb-token-form-helpers.test.ts',
      'maps permission failures (403/forbidden) to «Нет доступа» without link'
    ),
    pending: exact(
      'src/components/custom/WbTokenForm.test.tsx',
      'navigates to processing page on success'
    ),
    'not-found': exact(
      'src/components/custom/wb-token-form-helpers.test.ts',
      'maps cabinet-not-found to «Кабинет не найден» without link'
    ),
  },
  '/analytics/alerts': {
    empty: exact('e2e/alerts-page.spec.ts', 'empty rules list shows no-rules message'),
    error: exact(
      'e2e/alerts-page.spec.ts',
      'API error on rules shows graceful state without crashing page'
    ),
  },
  '/analytics/dashboard': {
    loading: exact(
      'src/app/(dashboard)/analytics/dashboard/__tests__/page.test.tsx',
      'renders skeleton loading state'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/dashboard/__tests__/page.test.tsx',
      'renders empty state alert when no data'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/dashboard/__tests__/page.test.tsx',
      'renders error message'
    ),
    partial: exact(
      'src/app/(dashboard)/analytics/dashboard/__tests__/page.test.tsx',
      'renders IncompleteWeekBanner when finance not available'
    ),
    pending: exact(
      'src/app/(dashboard)/analytics/dashboard/__tests__/page.test.tsx',
      'renders ReportPendingBanner when finance not available'
    ),
  },
  '/analytics/unit-economics': {
    refresh: exact(
      'e2e/unit-economics.spec.ts',
      'refreshes through an exact successful analytics request'
    ),
    loading: exact(
      'e2e/unit-economics.spec.ts',
      'holds loading state behind a timer-free deferred release'
    ),
    empty: exact('e2e/unit-economics.spec.ts', 'renders the exact empty terminal state'),
    error: exact(
      'e2e/unit-economics.spec.ts',
      'renders exact error and retry terminal states with a handler-local gate'
    ),
  },
  '/analytics/acquiring': {
    empty: exact(
      'src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringReportsTable.test.tsx',
      'empty items renders table shell without data rows'
    ),
  },
  '/analytics/acquiring/period': {
    loading: exact(
      'src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodDetailPage.test.tsx',
      'shows skeleton on first load (isLoading, no cached data)'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodDetailPage.test.tsx',
      'shows empty state text when data resolves with empty array'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodDetailPage.test.tsx',
      'inline refetch-error chip uses status-warning matched-pair tokens (no amber)'
    ),
  },
  '/analytics/funnel': {
    empty: exact(
      'e2e/funnel.spec.ts',
      'empty funnel response renders an informational alert (no data for period)'
    ),
    error: exact(
      'e2e/funnel.spec.ts',
      'funnel 500 renders a destructive error alert without crashing the page'
    ),
  },
  '/analytics/liquidity': {
    refresh: exact(
      'e2e/liquidity.spec.ts',
      'refreshes through an exact successful analytics request'
    ),
    loading: exact(
      'e2e/liquidity.spec.ts',
      'holds loading state behind a timer-free deferred release'
    ),
    empty: exact('e2e/liquidity.spec.ts', 'renders the exact empty terminal state'),
    error: exact(
      'e2e/liquidity.spec.ts',
      'renders the exact error terminal state after retry exhaustion'
    ),
  },
  '/analytics/returns': {
    loading: exact(
      'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnReasonsPieChart.test.tsx',
      'shows skeleton while loading'
    ),
    refresh: exact(
      'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnTrendChart.test.tsx',
      'background refresh (isFetching with data) retains the prior content'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnReasonsPieChart.test.tsx',
      'shows empty-state alert when no categories returned'
    ),
    'filtered-empty': exact(
      'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnsPageContent.test.tsx',
      'filtered-empty shows the anomaly-specific message and the checkbox is a visible reset'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnReasonsPieChart.test.tsx',
      'shows error alert when request fails'
    ),
  },
  '/analytics/supply-planning': {
    loading: exact(
      'src/hooks/__tests__/useSupplyPlanning.test.ts',
      'should show loading state while fetching'
    ),
    refresh: exact(
      'src/hooks/__tests__/useSupplyPlanning.test.ts',
      'should refetch data on manual trigger'
    ),
    empty: exact(
      'src/hooks/__tests__/useSupplyPlanning.test.ts',
      'should handle empty data response'
    ),
    error: exact('src/hooks/__tests__/useSupplyPlanning.test.ts', 'should handle API errors'),
    permission: exact(
      'src/hooks/__tests__/useSupplyPlanning.test.ts',
      'should handle 403 Forbidden'
    ),
  },
  '/analytics/brand': {
    loading: exact(
      'e2e/brand-analytics.spec.ts',
      'holds loading until the deferred brand response is released'
    ),
    empty: exact(
      'e2e/brand-analytics.spec.ts',
      'renders the named empty terminal when the brand route resolves to an empty payload'
    ),
    error: exact(
      'e2e/brand-analytics.spec.ts',
      'renders the named error terminal when the brand route resolves to a failure payload'
    ),
  },
  '/analytics/brand-share': {
    empty: exact(
      'src/components/custom/analytics/__tests__/BrandShareView.test.tsx',
      'renders the empty-state message when the report window is empty'
    ),
    error: exact(
      'src/components/custom/analytics/__tests__/BrandShareView.test.tsx',
      'surfaces a friendly RU 503 error state with a retry button'
    ),
  },
  '/analytics/models/[id]/evaluations/sku-accuracy': {
    loading: exact(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyDetail.test.tsx',
      'F-2: isLoading=true renders skeleton, NOT empty-state'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyOverview.test.tsx',
      'renders empty-state directly on a non-loading empty response'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyDetail.test.tsx',
      'F-2: isError=true renders error alert, NOT empty-state'
    ),
    'not-found': exact(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyDetail.test.tsx',
      'renders empty-state alert when nmId not found'
    ),
  },
  '/dashboard': {
    loading: exact(
      'e2e/dashboard-metrics.spec.ts',
      'holds and releases finance loading with a timer-free deferred gate'
    ),
    error: exact(
      'e2e/dashboard-metrics.spec.ts',
      'keeps finance failures failing until Retry is explicitly allowed'
    ),
  },
  '/cogs/price-calculator': {
    loading: exact('e2e/price-calculator.spec.ts', 'TC-E2E-006b: Показывается индикатор загрузки'),
    empty: exact(
      'src/components/custom/price-calculator/__tests__/CoefficientCalendar.test.tsx',
      'shows empty message when no coefficients'
    ),
    pending: exact(
      'src/components/custom/price-calculator/__tests__/FormActionsSection.test.tsx',
      'prevents duplicate submission while calculation is pending'
    ),
  },
  '/communications': {
    empty: exact(
      'e2e/communications.spec.ts',
      'AC3: empty workspace renders section empty markers without the unread dot'
    ),
  },
  '/finances': {
    loading: exact(
      'src/app/(dashboard)/finances/components/__tests__/DocumentsTable.test.tsx',
      'renders a skeleton while loading'
    ),
    empty: exact(
      'e2e/finances.spec.ts',
      'renders the balance empty state when WB returns all-null'
    ),
    'filtered-empty': exact(
      'e2e/finances.spec.ts',
      'distinguishes filtered empty and resets to the unfiltered first page'
    ),
    error: exact(
      'e2e/finances.spec.ts',
      'renders balance error + retry on 503 (documents stay usable)'
    ),
    partial: exact(
      'src/app/(dashboard)/finances/components/__tests__/DocumentsTable.test.tsx',
      'keeps documents usable while categories fail and explains the partial state'
    ),
    pending: exact(
      'src/app/(dashboard)/finances/components/__tests__/DocumentsTable.test.tsx',
      'announces download pending via a polite live region (Story 172.10)'
    ),
  },
  '/monitor': {
    loading: exact(
      'src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx',
      'renders skeleton with role="status" on first load (isLoading && !data)',
      [
        exact(
          'src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx',
          'keeps summary content visible while the independent weekly chart is loading'
        ),
        exact(
          'src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx',
          'keeps summary content visible while independent pipeline health is loading'
        ),
      ]
    ),
    empty: exact(
      'src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx',
      'renders all 5 blocks gracefully when every hook returns empty success'
    ),
    error: exact(
      'src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx',
      'renders error alert with retry button when isError && !data'
    ),
    stale: exact(
      'src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx',
      'renders cached summary with a refetch-error notice and retries the summary request'
    ),
    partial: exact(
      'src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx',
      'keeps summary content visible when the independent weekly chart fails and retries it',
      [
        exact(
          'src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx',
          'keeps summary content visible when independent pipeline health fails and retries it'
        ),
      ]
    ),
  },
  '/moysklad': {
    loading: exact(
      'src/app/(dashboard)/moysklad/components/__tests__/MoyskladStockTable.test.tsx',
      'renders the stock table skeleton while the selected snapshot is loading'
    ),
    empty: exact(
      'src/app/(dashboard)/moysklad/components/__tests__/MoyskladProductsTable.test.tsx',
      'shows the empty state when there are no products'
    ),
    error: exact(
      'src/app/(dashboard)/moysklad/components/__tests__/MoyskladProductsTable.test.tsx',
      'surfaces the live-call error banner (graceful, no crash)'
    ),
  },
  '/orders': {
    loading: exact(
      'src/app/(dashboard)/orders/__tests__/page.test.tsx',
      'renders loading skeleton when loading and no data'
    ),
    empty: exact(
      'src/app/(dashboard)/orders/__tests__/page.test.tsx',
      'renders empty state when no orders'
    ),
    'filtered-empty': exact(
      'src/app/(dashboard)/orders/__tests__/page.test.tsx',
      'shows empty state message when no orders match filters'
    ),
    error: exact(
      'src/app/(dashboard)/orders/__tests__/page.test.tsx',
      'renders error state with message'
    ),
  },
  '/orders/fbo': {
    loading: exact(
      'src/app/(dashboard)/orders/fbo/components/__tests__/FboOrdersPageContent.test.tsx',
      'renders the orders loading state while the orders list has no data'
    ),
    empty: exact(
      'src/app/(dashboard)/orders/fbo/components/__tests__/FboOrdersPageContent.test.tsx',
      'renders the orders empty state after an empty list resolves'
    ),
    'filtered-empty': exact(
      'src/app/(dashboard)/orders/fbo/components/__tests__/FboOrdersPageContent.test.tsx',
      'renders a filtered-empty orders state after an unmatched article search'
    ),
    error: exact(
      'src/app/(dashboard)/orders/fbo/components/__tests__/FboOrdersPageContent.test.tsx',
      'renders a recoverable orders error instead of an empty result and retries the query'
    ),
    stale: exact(
      'src/app/(dashboard)/orders/fbo/components/__tests__/FboOrdersPageContent.test.tsx',
      'keeps cached orders visible when refresh fails and retries the query'
    ),
  },
  '/settings/backfill': {
    loading: exact(
      'e2e/settings/backfill-admin.spec.ts',
      'should show loading skeleton while checking permissions'
    ),
    refresh: exact(
      'e2e/backfill-page.spec.ts',
      'shows table or refresh button when page is visible'
    ),
    empty: exact(
      'e2e/settings/backfill-admin.spec.ts',
      'should display status table or empty state'
    ),
    error: exact(
      'e2e/settings/backfill-admin.spec.ts',
      'should display error badge for failed cabinets'
    ),
    stale: exact(
      'e2e/backfill-page.spec.ts',
      'retains stale data after refresh failure and replaces it after retry at 390px dark'
    ),
    pending: exact(
      'src/app/(dashboard)/settings/backfill/__tests__/page.test.tsx',
      'keeps the pending start trigger focusable while guarding repeated activation'
    ),
  },
  '/settings/cabinet': {
    loading: exact(
      'src/app/(dashboard)/settings/cabinet/__tests__/page.test.tsx',
      'should render skeleton placeholders when cabinetId is null'
    ),
    refresh: exact(
      'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
      'refreshes the displayed value from the successful persisted response'
    ),
    stale: exact(
      'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
      'clears a stale save result when the saved value is edited or becomes invalid'
    ),
    partial: exact(
      'src/components/custom/settings/__tests__/CabinetInfoCard.test.tsx',
      'preserves partial seller and unavailable Jam evidence'
    ),
  },
  '/settings/expenses': {
    loading: exact(
      'src/app/(dashboard)/settings/expenses/__tests__/page.test.tsx',
      'announces the named loading state'
    ),
    empty: exact('e2e/expenses-page.spec.ts', 'renders a deterministic empty month state'),
    pending: exact(
      'e2e/expenses-page.spec.ts',
      'keeps create pending open across Cancel, Escape, and close requests'
    ),
  },
  '/settings/notifications': {
    loading: exact(
      'src/app/(dashboard)/settings/notifications/__tests__/page.test.tsx',
      'shows an accessible loading state without presenting Telegram as unbound'
    ),
    pending: exact(
      'e2e/telegram-notifications.spec.ts',
      'announces binding-code creation while the request is pending'
    ),
  },
  '/settings/tariffs': {
    loading: exact(
      'src/app/(dashboard)/settings/tariffs/__tests__/page.test.tsx',
      'should display loading skeleton when user is null'
    ),
    empty: exact(
      'src/components/custom/tariffs-admin/__tests__/AuditLogTable.test.tsx',
      'should display empty state when no audit entries'
    ),
    error: exact(
      'src/components/custom/tariffs-admin/__tests__/AuditLogTable.test.tsx',
      'should display error message when API call fails'
    ),
    permission: exact(
      'src/components/custom/tariffs-admin/__tests__/AuditLogTable.test.tsx',
      'renders the permission message and no retry button on a 403'
    ),
    pending: exact(
      'e2e/settings-pages.spec.ts',
      'contains the pending dialog, blocks dismissal, and honors reduced motion'
    ),
  },
  '/settings/tax': {
    loading: exact(
      'src/app/(dashboard)/settings/tax/__tests__/page.test.tsx',
      'should render skeleton placeholders when cabinetId is null'
    ),
    refresh: exact(
      'src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx',
      'preserves a dirty draft across query replacement and cancels to the refreshed baseline'
    ),
    error: exact(
      'src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx',
      'exposes named loading and recoverable query-error states'
    ),
  },
  '/shipments': {
    loading: exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'keeps route identity visible while the queue loads'
    ),
    refresh: exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'passes background-refresh state to the populated queue'
    ),
    empty: exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'renders the unfiltered empty state with packaging and permission context'
    ),
    'filtered-empty': exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'routes filtered-empty data through the table state owner'
    ),
    error: exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'renders a recoverable terminal route error'
    ),
    stale: exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'preserves previously loaded rows when a background refresh fails'
    ),
    partial: exact(
      'src/components/custom/shipments/__tests__/ShipmentsTable.test.tsx',
      'uses the shipment id as a visible fallback for partial rows'
    ),
    permission: exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'does not expose create controls to a read-only analyst'
    ),
    pending: exact(
      'src/components/custom/shipments/__tests__/CreateShipmentDialog.test.tsx',
      'disables submit button during pending mutation'
    ),
  },
  '/shipments/[id]': {
    loading: exact(
      'e2e/shipments/shipments-detail.spec.ts',
      'keeps route identity visible while detail data is loading'
    ),
    refresh: exact(
      'src/app/(dashboard)/shipments/[id]/__tests__/page.test.tsx',
      'calls refetch from the recoverable terminal error state'
    ),
    empty: exact(
      'src/app/(dashboard)/shipments/[id]/__tests__/page.test.tsx',
      'keeps the partial limitation when a non-empty shipment receives empty results'
    ),
    error: exact(
      'e2e/shipments/shipments-detail.spec.ts',
      'should display error state for non-existent shipment'
    ),
    partial: exact(
      'e2e/shipments/shipments-detail.spec.ts',
      'exposes entity, lifecycle, partial evidence, accordion, and named table contracts'
    ),
    pending: exact(
      'src/components/custom/shipments/__tests__/BoxLineForm.test.tsx',
      'exposes pending save through a polite status'
    ),
    'not-found': exact(
      'e2e/shipments/shipments-detail.spec.ts',
      'renders a safe not-found terminal with a return action'
    ),
  },
  '/shipments/box-types': {
    loading: exact(
      'src/app/(dashboard)/shipments/box-types/__tests__/page.test.tsx',
      'should show heading during loading'
    ),
    empty: exact(
      'src/app/(dashboard)/shipments/box-types/__tests__/page.test.tsx',
      'renders the route-owned empty state'
    ),
  },
  '/shipments/sku-packaging': {
    loading: exact(
      'src/app/(dashboard)/shipments/sku-packaging/__tests__/page.test.tsx',
      'preserves route identity and announces the combined dependency loading state'
    ),
    empty: exact(
      'src/app/(dashboard)/shipments/sku-packaging/__tests__/page.test.tsx',
      'opens creation from the exact empty-state trigger'
    ),
    'filtered-empty': exact(
      'src/app/(dashboard)/shipments/sku-packaging/__tests__/page.test.tsx',
      'renders filtered-empty recovery and resets the presentation-local query'
    ),
    error: exact(
      'src/app/(dashboard)/shipments/sku-packaging/__tests__/page.test.tsx',
      'renders a safe packaging-query failure and retries exactly once'
    ),
    partial: exact(
      'src/components/custom/sku-packaging/__tests__/BulkAddDialog.test.tsx',
      'shows partial failure with error rows'
    ),
  },
  '/analytics/orders': {
    loading: exact(
      'src/app/(dashboard)/analytics/orders/__tests__/page.test.tsx',
      'shows loading state (overview tab renders)'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/orders/__tests__/page.test.tsx',
      'renders summary cards and tabs with empty data'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/orders/__tests__/page.test.tsx',
      'shows error alert on fetch failure'
    ),
  },
  '/analytics/reorder': {
    loading: exact(
      'src/app/(dashboard)/analytics/reorder/__tests__/page.test.tsx',
      'renders loading skeletons in summary cards'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/reorder/__tests__/page.test.tsx',
      'renders empty table message'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/reorder/__tests__/page.test.tsx',
      'displays error alert in Russian'
    ),
  },
  '/analytics/category': {
    loading: exact(
      'src/app/(dashboard)/analytics/category/__tests__/page.test.tsx',
      'renders skeleton loading state'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/category/__tests__/page.test.tsx',
      'renders empty state message when no data'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/category/__tests__/page.test.tsx',
      'renders error message'
    ),
  },
  '/analytics/buyout-reconciliation': {
    loading: exact(
      'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx',
      'branch 1 — renders loading skeleton when isLoading and no data'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx',
      'branch 3 — renders no-data empty state when data array is empty'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx',
      'branch 2 — renders full-error alert with retry button when isError and no data'
    ),
    stale: exact(
      'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx',
      'L2-2: stale-data banner shown in no-anomalies branch when isError && hasData'
    ),
  },
  '/analytics/fbs-enhanced': {
    loading: exact(
      'src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsEnhancedPageContent.test.tsx',
      'shows retryable slow-loading state after the delayed-loading threshold'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsEnhancedPageContent.test.tsx',
      'shows a retryable error state when the enhanced FBS request times out'
    ),
    stale: exact(
      'src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsEnhancedPageContent.test.tsx',
      'renders the stale-data banner with warning status tokens when cached data exists (Epic 169.6)'
    ),
  },
  '/analytics/fbs-stock': {
    loading: exact(
      'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockSizesSection.test.tsx',
      'renders skeleton when loading with no cached data'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockSizesSection.test.tsx',
      'renders empty state from emptyFbsStockSizesResponse()'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockSizesSection.test.tsx',
      'renders full error alert when error and no cached data'
    ),
    stale: exact(
      'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockSizesSection.test.tsx',
      '169.7: cached-data banner uses status-warning token classes (exact pins)'
    ),
  },
  '/analytics/storage': {
    loading: exact(
      'src/app/(dashboard)/analytics/storage/components/__tests__/StorageBySkuTable.test.tsx',
      'shows loading skeleton when isLoading'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/storage/__tests__/StoragePage.test.tsx',
      'renders no data message'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/storage/__tests__/StoragePage.test.tsx',
      'renders error message'
    ),
    stale: exact(
      'src/app/(dashboard)/analytics/storage/__tests__/StoragePage.test.tsx',
      'trends background-refresh failure with retained data: chart AND Alert coexist (review F1)'
    ),
  },
  '/analytics/models/[id]/performance': {
    loading: exact(
      'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
      'renders Skeleton when loading'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
      'renders empty mapeTrend Alert when trend is empty'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
      'renders destructive Alert on error'
    ),
    'not-found': exact(
      'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
      'renders model-not-found Alert with link when model absent from list'
    ),
  },
  '/supplies': {
    loading: exact(
      'src/app/(dashboard)/supplies/__tests__/page.test.tsx',
      'renders loading skeleton with 8 rows'
    ),
    empty: exact(
      'src/app/(dashboard)/supplies/__tests__/page.test.tsx',
      'renders empty state when no supplies'
    ),
    error: exact(
      'src/app/(dashboard)/supplies/__tests__/page.test.tsx',
      'renders error message on fetch error'
    ),
    pending: exact(
      'src/app/(dashboard)/supplies/__tests__/page.test.tsx',
      'disables sync button while sync is pending'
    ),
  },
  '/supplies/[id]': {
    loading: exact(
      'src/app/(dashboard)/supplies/[id]/__tests__/page.test.tsx',
      'shows SupplyDetailSkeleton while loading'
    ),
    error: exact(
      'src/app/(dashboard)/supplies/[id]/__tests__/page.test.tsx',
      'shows error message for generic errors'
    ),
    permission: exact(
      'src/app/(dashboard)/supplies/[id]/__tests__/page.test.tsx',
      'shows "Нет доступа к этой поставке" message'
    ),
    'not-found': exact(
      'src/app/(dashboard)/supplies/[id]/__tests__/page.test.tsx',
      'shows a not-found state when loading succeeds without supply data'
    ),
  },
}
