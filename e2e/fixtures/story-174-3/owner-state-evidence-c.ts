import type { Story1743RouteStateScenarioMap } from './owner-state-scenario-types'
import { exact } from './owner-state-scenario-types'

export const STORY_174_3_ROUTE_STATE_SCENARIOS_C: Story1743RouteStateScenarioMap = {
  '/cogs': {
    loading: exact(
      'src/components/custom/__tests__/ProductList.test.tsx',
      'renders loading skeleton on first load'
    ),
    empty: exact(
      'src/components/custom/__tests__/ProductList.test.tsx',
      'renders empty state when no products found'
    ),
    pending: exact(
      'e2e/cogs-assignment.spec.ts',
      'displays loading state during margin calculation'
    ),
    error: exact('e2e/cogs-assignment.spec.ts', 'handles API errors gracefully'),
    'filtered-empty': exact(
      'src/components/custom/__tests__/ProductList.test.tsx',
      'keeps the COGS filter control available in the filtered-empty state'
    ),
  },
  '/cogs/bulk': {
    empty: exact(
      'src/components/custom/bulk-cogs/__tests__/useBulkCogsSelection.test.ts',
      'starts with empty selection'
    ),
    pending: exact(
      'src/components/custom/__tests__/BulkCogsForm.test.tsx',
      'keeps the bulk form visible and disabled while submission is pending'
    ),
    'partial-success': exact(
      'src/components/custom/__tests__/BulkCogsForm.test.tsx',
      'reports partial success and preserves failed rows for retry'
    ),
    error: exact(
      'src/components/custom/__tests__/BulkCogsForm.test.tsx',
      'reports all-failed and conflicting submissions without claiming success'
    ),
    stale: exact(
      'src/components/custom/__tests__/BulkCogsForm.test.tsx',
      'retains the selected bulk draft when a background product refresh fails'
    ),
  },
  '/cogs/history': {
    'filtered-empty': exact(
      'src/app/(dashboard)/cogs/history/__tests__/page.owner-states.test.tsx',
      'renders a truthful filtered-empty history result'
    ),
    stale: exact(
      'src/app/(dashboard)/cogs/history/__tests__/page.owner-states.test.tsx',
      'keeps retained history rows identifiable while refresh evidence is stale'
    ),
    partial: exact(
      'src/components/custom/CogsHistoryTable.test.tsx',
      'renders partial history rows with explicit unavailable fields'
    ),
  },
  '/cogs/price-calculator': {
    error: exact(
      'src/components/custom/price-calculator/__tests__/PriceCalculatorResults.test.tsx',
      'shows error message when error exists',
      [
        exact(
          'src/components/custom/price-calculator/__tests__/FixedCostField.test.tsx',
          'associates an invalid input with its rendered error'
        ),
      ]
    ),
  },
  '/communications': {
    loading: exact(
      'src/app/(dashboard)/communications/components/__tests__/PinnedReviewsSection.test.tsx',
      'renders a scoped skeleton while loading'
    ),
    partial: exact(
      'e2e/communications.spec.ts',
      'AC4: feedbacks error renders the destructive alert while sibling sections stay healthy'
    ),
    pending: exact(
      'e2e/communications.spec.ts',
      'AC4b: the Button retry recovers the section after the wire flips to healthy'
    ),
    error: exact(
      'src/app/(dashboard)/communications/components/__tests__/PinnedReviewsSection.test.tsx',
      'renders error + retry control when isError (RU canonical string)'
    ),
  },
  '/monitoring': {
    refresh: exact(
      'src/app/(dashboard)/monitoring/components/__tests__/MonitoringPageContent.test.tsx',
      'keeps the dashboard visible and announces background refresh'
    ),
    partial: exact(
      'src/app/(dashboard)/monitoring/components/__tests__/MonitoringPageContent.test.tsx',
      'renders degraded monitoring evidence without collapsing the dashboard'
    ),
    stale: exact(
      'src/app/(dashboard)/monitoring/components/__tests__/MonitoringPageContent.test.tsx',
      'keeps cached monitoring evidence visible after a refresh failure'
    ),
  },
  '/moysklad': {
    'filtered-empty': exact(
      'src/app/(dashboard)/moysklad/components/__tests__/MoyskladMappingsTable.test.tsx',
      'shows empty state when a filter view has no rows'
    ),
    pending: exact(
      'e2e/moysklad.spec.ts',
      'mappings table: filter counts + «Привязать» on pending rows + pagination hint'
    ),
    partial: exact(
      'src/app/(dashboard)/moysklad/components/__tests__/MoyskladOverview.test.tsx',
      'keeps healthy overview evidence visible when one independent source fails'
    ),
    stale: exact(
      'src/app/(dashboard)/moysklad/components/__tests__/MoyskladOverview.test.tsx',
      'keeps retained overview evidence visible after a background refresh failure'
    ),
  },
  '/orders': {
    pending: exact(
      'src/components/custom/orders/__tests__/OrderActionsCell.test.tsx',
      'disables the trigger while an action is pending'
    ),
    stale: exact(
      'src/app/(dashboard)/orders/__tests__/page.test.tsx',
      'keeps cached orders visible after a background refresh failure'
    ),
    partial: exact(
      'src/components/custom/orders/__tests__/OrdersTable.client-column.test.tsx',
      'renders only the available field when one of name/phone is missing'
    ),
  },
  '/orders/fbo': {
    partial: exact(
      'src/app/(dashboard)/orders/fbo/components/__tests__/FboOrdersPageContent.test.tsx',
      'renders a recoverable sales error instead of an empty result and retries the query'
    ),
  },
  '/orders/integrity': {
    empty: exact(
      'e2e/orders-integrity.spec.ts',
      'shows an explicit empty reconciliation state after a cabinet switch'
    ),
    partial: exact(
      'src/app/(dashboard)/orders/integrity/components/__tests__/IntegrityChecksGrid.test.tsx',
      'skips missing check keys gracefully'
    ),
    stale: exact(
      'src/app/(dashboard)/orders/integrity/components/__tests__/OrdersIntegrityPageContent.test.tsx',
      'keeps cached integrity evidence visible after a refresh failure'
    ),
    pending: exact(
      'src/app/(dashboard)/orders/integrity/components/__tests__/IntegrityStatusCard.test.tsx',
      'disables refresh button when refetching'
    ),
  },
  '/products': {
    loading: exact(
      'src/app/(dashboard)/products/__tests__/page.test.tsx',
      'keeps both route sections identifiable while lifecycle data loads'
    ),
    pending: exact(
      'src/app/(dashboard)/products/__tests__/page.test.tsx',
      'disables lifecycle actions while an update is pending'
    ),
    error: exact(
      'src/app/(dashboard)/products/__tests__/page.test.tsx',
      'keeps one lifecycle section usable when its sibling request fails'
    ),
  },
  '/settings': {
    permission: exact(
      'src/app/(dashboard)/settings/components/__tests__/SettingsNav.test.tsx',
      'keeps Owner-only destinations visible but unavailable to an Analyst'
    ),
  },
  '/settings/backfill': {
    partial: exact(
      'src/app/(dashboard)/settings/backfill/components/__tests__/BackfillRetryControls.test.tsx',
      'renders ONLY the reports retry when reports=failed and analytics=completed (AC3)'
    ),
  },
  '/settings/cabinet': {
    error: exact(
      'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
      'shows API feedback and retains the entered value on failure',
      [
        exact(
          'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
          'rejects empty/non-finite number input'
        ),
      ]
    ),
    pending: exact(
      'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
      'disables the field and save action while the mutation is pending'
    ),
    permission: exact(
      'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
      'keeps target margin read-only for an Analyst'
    ),
  },
  '/settings/notifications': {
    partial: exact(
      'src/app/(dashboard)/settings/notifications/__tests__/page.test.tsx',
      'shows a retryable unavailable state that is distinct from unbound'
    ),
    error: exact(
      'src/components/custom/settings/__tests__/OrderNotificationSettings.test.tsx',
      'renders error alert when error is set'
    ),
  },
  '/settings/tariffs': {
    partial: exact(
      'src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx',
      'identifies unavailable server values instead of silently presenting defaults as current'
    ),
  },
  '/shipments/box-types': {
    error: exact(
      'src/app/(dashboard)/shipments/box-types/__tests__/page.test.tsx',
      'renders a safe semantic error instead of the raw backend message'
    ),
    pending: exact(
      'src/components/custom/box-types/__tests__/BoxTypeFormDialog.test.tsx',
      'announces pending edit'
    ),
  },
  '/shipments/sku-packaging': {
    pending: exact(
      'src/components/custom/sku-packaging/__tests__/SkuPackagingFormDialog.test.tsx',
      'announces pending save and blocks cancellation'
    ),
  },
  '/supplies': {
    'filtered-empty': exact(
      'src/app/(dashboard)/supplies/__tests__/page.test.tsx',
      'clear filters button resets all filters'
    ),
    stale: exact(
      'src/app/(dashboard)/supplies/__tests__/page.test.tsx',
      'keeps cached supplies visible after a background refresh failure'
    ),
    partial: exact(
      'src/app/(dashboard)/supplies/__tests__/page.test.tsx',
      'keeps the supplies queue usable when sync status is unavailable'
    ),
  },
  '/supplies/[id]': {
    partial: exact(
      'src/app/(dashboard)/supplies/[id]/__tests__/supply-detail-presentation-source-contracts.test.ts',
      'keeps lifecycle meaning semantic, textual, and independent of color alone'
    ),
    pending: exact(
      'src/app/(dashboard)/supplies/[id]/__tests__/supply-detail-presentation-source-contracts.test.ts',
      'keeps each Sheet or Dialog named, focus-restoring, and announcement-capable'
    ),
  },
}

export { STORY_174_3_OWNER_VARIANT_SCENARIOS_C_INTERNAL as STORY_174_3_OWNER_VARIANT_SCENARIOS_C } from './owner-state-evidence-c-variants'
