import type { Story1743OwnerVariantScenario } from './owner-state-scenario-types'
import { owner, variant } from './owner-state-scenario-types'

const bind = (
  route: string,
  rawOwnerStates: readonly string[],
  normalizedState: Story1743OwnerVariantScenario['normalizedState'],
  source: string,
  scenarioId: string,
  runner?: 'vitest' | 'playwright'
): readonly Story1743OwnerVariantScenario[] =>
  rawOwnerStates.map(rawOwnerState =>
    variant(route, rawOwnerState, normalizedState, owner(source, scenarioId, runner))
  )

export const STORY_174_3_OWNER_REQUIREMENT_SCENARIOS_C: readonly Story1743OwnerVariantScenario[] = [
  ...bind(
    '/cogs',
    ['delete pending'],
    'pending',
    'src/components/custom/__tests__/CogsDialogs.owner-states.test.tsx',
    'keeps COGS deletion confirmation contained while delete is pending'
  ),
  ...bind(
    '/cogs',
    ['saved-margin-pending'],
    'pending',
    'src/components/custom/single-cogs/__tests__/single-cogs-components.test.tsx',
    'disables submit button when pending or polling'
  ),
  ...bind(
    '/cogs',
    ['save failure'],
    'error',
    'src/components/custom/__tests__/CogsDialogs.owner-states.test.tsx',
    'keeps the COGS edit dialog open and exposes save failure'
  ),
  ...bind(
    '/cogs',
    ['error'],
    'error',
    'src/components/custom/__tests__/ProductList.test.tsx',
    'renders error state with retry button'
  ),
  ...bind(
    '/cogs/bulk',
    ['all failed', 'conflicting row where supported'],
    'error',
    'src/components/custom/__tests__/BulkCogsForm.test.tsx',
    'reports all-failed and conflicting submissions without claiming success'
  ),
  ...bind(
    '/cogs/price-calculator',
    ['field error'],
    'error',
    'src/components/custom/price-calculator/__tests__/FixedCostField.test.tsx',
    'associates an invalid input with its rendered error'
  ),
  ...bind(
    '/cogs/price-calculator',
    ['failure'],
    'error',
    'src/components/custom/price-calculator/__tests__/PriceCalculatorResults.test.tsx',
    'shows error message when error exists'
  ),
  ...bind(
    '/communications',
    ['sending', 'retryable writeback'],
    'pending',
    'src/app/(dashboard)/communications/components/__tests__/ChatComposer.test.tsx',
    'keeps the draft and controls disabled while sending or polling'
  ),
  ...bind(
    '/communications',
    ['network uncertainty', 'error'],
    'error',
    'src/app/(dashboard)/communications/components/__tests__/FeedbackWriteControls.test.tsx',
    'non-403 error → renders the RU generic message (never raw BE/English)'
  ),
  ...bind(
    '/finances',
    ['balance unavailable'],
    'partial',
    'src/app/(dashboard)/finances/components/__tests__/BalanceCard.test.tsx',
    'renders "—" for a partially-null balance (currency set, money null)'
  ),
  ...bind(
    '/finances',
    ['partial'],
    'partial',
    'src/app/(dashboard)/finances/components/__tests__/DocumentsTable.test.tsx',
    'keeps documents usable while categories fail and explains the partial state'
  ),
  ...bind(
    '/finances',
    ['failed'],
    'error',
    'src/app/(dashboard)/finances/components/__tests__/BalanceCard.test.tsx',
    'renders error + retry control when isError (RU canonical string)'
  ),
  ...bind(
    '/finances',
    ['route error'],
    'error',
    'src/app/(dashboard)/finances/__tests__/error.test.tsx',
    'renders an accessible Russian recovery state and invokes reset'
  ),
  ...bind(
    '/monitor',
    ['partial', 'degraded'],
    'partial',
    'src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx',
    'keeps summary content visible when the independent weekly chart fails and retries it'
  ),
  ...bind(
    '/monitoring',
    ['degraded', 'partial'],
    'partial',
    'src/app/(dashboard)/monitoring/components/__tests__/MonitoringPageContent.test.tsx',
    'renders degraded monitoring evidence without collapsing the dashboard'
  ),
  ...bind(
    '/monitoring',
    ['error', 'route error'],
    'error',
    'src/app/(dashboard)/monitoring/components/__tests__/MonitoringPageContent.test.tsx',
    'renders a recoverable monitoring error and retries the dashboard query'
  ),
  ...bind(
    '/moysklad',
    ['degraded', 'partial'],
    'partial',
    'src/app/(dashboard)/moysklad/components/__tests__/MoyskladOverview.test.tsx',
    'keeps healthy overview evidence visible when one independent source fails'
  ),
  ...bind(
    '/orders',
    ['error', 'failure'],
    'error',
    'src/app/(dashboard)/orders/__tests__/page.test.tsx',
    'renders error state with message'
  ),
  ...bind(
    '/orders/integrity',
    ['failed', 'route error'],
    'error',
    'src/app/(dashboard)/orders/integrity/components/__tests__/OrdersIntegrityPageContent.test.tsx',
    'shows error alert when fetch fails'
  ),
  ...bind(
    '/settings/backfill',
    ['queued', 'running'],
    'pending',
    'src/app/(dashboard)/settings/backfill/__tests__/page.test.tsx',
    'keeps the pending start trigger focusable while guarding repeated activation'
  ),
  ...bind(
    '/settings/cabinet',
    ['unavailable', 'partial info'],
    'partial',
    'src/components/custom/settings/__tests__/CabinetInfoCard.test.tsx',
    'preserves partial seller and unavailable Jam evidence'
  ),
  ...bind(
    '/settings/cabinet',
    ['validation error'],
    'error',
    'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
    'rejects empty/non-finite number input'
  ),
  ...bind(
    '/settings/cabinet',
    ['failure'],
    'error',
    'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
    'shows API feedback and retains the entered value on failure'
  ),
  ...bind(
    '/settings/expenses',
    ['validation error'],
    'error',
    'src/app/(dashboard)/settings/expenses/components/__tests__/ExpenseFormDialog.test.tsx',
    'associates a visible validation error and focuses the amount field'
  ),
  ...bind(
    '/settings/expenses',
    ['failure'],
    'error',
    'src/app/(dashboard)/settings/expenses/components/__tests__/ExpenseFormDialog.test.tsx',
    'keeps values and reports a failed create inside the open dialog'
  ),
  ...bind(
    '/settings/notifications',
    ['connecting', 'verification pending'],
    'pending',
    'e2e/telegram-notifications.spec.ts',
    'announces binding-code creation while the request is pending',
    'playwright'
  ),
  ...bind(
    '/settings/tariffs',
    ['validation error'],
    'error',
    'src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx',
    'shows a form-level validation summary while keeping the inline error association'
  ),
  ...bind(
    '/settings/tariffs',
    ['failure'],
    'error',
    'src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx',
    'retains valid input and the retry path after a recoverable save failure'
  ),
  ...bind(
    '/settings/tariffs',
    ['partial'],
    'partial',
    'src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx',
    'identifies unavailable server values instead of silently presenting defaults as current'
  ),
  ...bind(
    '/settings/tax',
    ['invalid'],
    'error',
    'src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx',
    'associates the required VAT-rate error with its radio group and error summary'
  ),
  ...bind(
    '/settings/tax',
    ['failure'],
    'error',
    'src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx',
    'keeps the warning modal contained through pending failure and identical retry'
  ),
  ...bind(
    '/shipments',
    ['failure', 'route error'],
    'error',
    'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
    'renders a recoverable terminal route error'
  ),
  ...bind(
    '/shipments/[id]',
    ['error', 'failure'],
    'error',
    'e2e/shipments/shipments-detail.spec.ts',
    'should display error state for non-existent shipment',
    'playwright'
  ),
  ...bind(
    '/shipments/sku-packaging',
    ['invalid mapping'],
    'error',
    'src/components/custom/sku-packaging/__tests__/SkuPackagingFormDialog.test.tsx',
    'announces a form-level validation summary for every invalid field'
  ),
  ...bind(
    '/shipments/sku-packaging',
    ['failure'],
    'error',
    'src/components/custom/sku-packaging/__tests__/SkuPackagingFormDialog.test.tsx',
    'announces a generic save failure without closing'
  ),
  ...bind(
    '/supplies',
    ['failure', 'error'],
    'error',
    'src/app/(dashboard)/supplies/__tests__/page.test.tsx',
    'renders error message on fetch error'
  ),
  ...bind(
    '/supplies/[id]',
    ['document pending'],
    'pending',
    'src/components/custom/supplies/__tests__/SupplyDocumentsList.test.tsx',
    'download button disabled while downloading'
  ),
  ...bind(
    '/supplies/[id]',
    ['error'],
    'error',
    'src/app/(dashboard)/supplies/[id]/__tests__/page.test.tsx',
    'shows error message for generic errors'
  ),
  ...bind(
    '/supplies/[id]',
    ['close pending'],
    'pending',
    'src/components/custom/supplies/__tests__/CloseSupplyDialog.test.tsx',
    'shows loading spinner in confirm button when mutation is pending'
  ),
  ...bind(
    '/supplies/[id]',
    ['failure'],
    'error',
    'src/components/custom/supplies/__tests__/CloseSupplyDialog.test.tsx',
    'shows error toast on network failure'
  ),
]
