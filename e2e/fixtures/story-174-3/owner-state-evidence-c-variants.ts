import type { Story1743OwnerVariantScenario } from './owner-state-scenario-types'
import { owner, variant } from './owner-state-scenario-types'
import { STORY_174_3_OWNER_REQUIREMENT_SCENARIOS_C } from './owner-state-evidence-c-requirements'

export const STORY_174_3_OWNER_VARIANT_SCENARIOS_C_INTERNAL: readonly Story1743OwnerVariantScenario[] =
  [
    ...STORY_174_3_OWNER_REQUIREMENT_SCENARIOS_C,
    variant(
      '/automation/canned-rules',
      'restricted',
      'permission',
      owner(
        'e2e/automation/canned-rules.spec.ts',
        'AC2: restricted price template carries the destructive arm write-back badge',
        'playwright'
      )
    ),
    variant(
      '/automation/canned-rules',
      'unavailable rule',
      'permission',
      owner(
        'e2e/automation/canned-rules.spec.ts',
        'AC2: restricted price template carries the destructive arm write-back badge',
        'playwright'
      )
    ),
    variant(
      '/cogs/bulk',
      'validation errors',
      'default',
      owner(
        'src/components/custom/__tests__/BulkCogsForm.test.tsx',
        'keeps invalid bulk COGS input associated with its visible validation summary'
      )
    ),
    variant(
      '/cogs/bulk',
      'preview',
      'default',
      owner(
        'src/components/custom/__tests__/BulkCogsForm.test.tsx',
        'opens a named preview with the selected products and exact bulk value'
      )
    ),
    variant(
      '/cogs/bulk',
      'all success',
      'default',
      owner(
        'src/components/custom/__tests__/BulkCogsForm.test.tsx',
        'reports all-success exactly once and clears the completed bulk draft'
      )
    ),
    variant(
      '/cogs',
      'missing COGS',
      'default',
      owner(
        'src/components/custom/single-cogs/__tests__/single-cogs-components.test.tsx',
        'renders without existing COGS when not provided'
      )
    ),
    variant(
      '/cogs',
      'valid zero',
      'default',
      owner(
        'src/components/custom/cogs-edit-helpers.test.ts',
        'renders a legitimate zero as "0,00 ₽" (distinct from the NaN "—")'
      )
    ),
    variant(
      '/cogs',
      'edit',
      'default',
      owner(
        'src/components/custom/single-cogs/__tests__/single-cogs-components.test.tsx',
        'renders update label in edit mode'
      )
    ),
    variant(
      '/cogs',
      'margin ready',
      'default',
      owner('e2e/cogs-assignment.spec.ts', 'shows margin after COGS assignment', 'playwright')
    ),
    variant(
      '/cogs/history',
      'populated',
      'default',
      owner('src/components/custom/CogsHistoryTable.test.tsx', 'displays COGS records correctly')
    ),
    variant(
      '/cogs/price-calculator',
      'pristine',
      'default',
      owner(
        'src/components/custom/price-calculator/__tests__/usePriceCalculatorHandlers.empty-submit.test.tsx',
        'does not publish form data or submit an all-zero calculation'
      )
    ),
    variant(
      '/cogs/price-calculator',
      'valid input',
      'default',
      owner(
        'src/components/custom/price-calculator/__tests__/usePriceCalculatorHandlers.empty-submit.test.tsx',
        'submits when a calculation field is non-zero'
      )
    ),
    variant(
      '/cogs/price-calculator',
      'unusual warning',
      'default',
      owner(
        'src/components/custom/price-calculator/__tests__/WarningsDisplay.test.tsx',
        'displays alert when warnings exist'
      )
    ),
    variant(
      '/cogs/price-calculator',
      'result',
      'default',
      owner(
        'src/components/custom/price-calculator/__tests__/PriceCalculatorResults.test.tsx',
        'exposes one polite completion announcement when results arrive'
      )
    ),
    variant(
      '/cogs/price-calculator',
      'zero',
      'default',
      owner(
        'src/components/custom/price-calculator/__tests__/ReturnLogisticsBreakdown.story-44.10.test.tsx',
        'should show 0,00 ₽ for zero effective return'
      )
    ),
    variant(
      '/cogs/price-calculator',
      'negative result',
      'default',
      owner(
        'src/components/custom/price-calculator/__tests__/RecommendedPriceCard.test.tsx',
        'uses the negative financial role for negative margin'
      )
    ),
    variant(
      '/communications',
      'unread',
      'default',
      owner(
        'src/app/(dashboard)/communications/components/__tests__/UnreadBadge.test.tsx',
        'renders the red dot when feedbacks or questions are unread'
      )
    ),
    variant(
      '/communications',
      'draft',
      'default',
      owner(
        'src/app/(dashboard)/communications/components/__tests__/ChatComposer.test.tsx',
        'keeps a typed draft local until the user explicitly sends it'
      )
    ),
    variant(
      '/communications',
      'success',
      'default',
      owner(
        'src/app/(dashboard)/communications/components/__tests__/ChatComposer.test.tsx',
        'send → mutate fires with replySign + message; terminal → success toast + invalidate'
      )
    ),
    variant(
      '/communications',
      'session',
      'default',
      owner(
        'src/app/(dashboard)/communications/__tests__/page.test.tsx',
        'gates EACH tab section hook (enabled:false) after switching tabs, no cabinet'
      )
    ),
    variant(
      '/finances',
      'ready',
      'default',
      owner(
        'src/app/(dashboard)/finances/components/__tests__/DocumentsTable.test.tsx',
        'triggers the base64 → Blob download when the download button is clicked'
      )
    ),
    variant(
      '/monitor',
      'healthy',
      'default',
      owner(
        'src/app/(dashboard)/monitor/components/__tests__/MonitorPipelineHealth.test.tsx',
        'all-healthy fixture: renders empty state with checkmark message'
      )
    ),
    variant(
      '/monitoring',
      'offline',
      'default',
      owner(
        'src/app/(dashboard)/monitoring/components/TelegramStatusCard.test.tsx',
        'renders the offline bot state with explicit non-color text'
      )
    ),
    variant(
      '/monitoring',
      'Telegram disconnected',
      'default',
      owner(
        'src/app/(dashboard)/monitoring/components/TelegramStatusCard.test.tsx',
        'renders the unconfigured Telegram state with a settings recovery link'
      )
    ),
    variant(
      '/monitoring',
      'healthy',
      'default',
      owner(
        'src/app/(dashboard)/monitoring/components/__tests__/MonitoringPageContent.test.tsx',
        'renders the overview dashboard when monitoring data is available'
      )
    ),
    variant(
      '/moysklad',
      'disconnected',
      'default',
      owner(
        'src/app/(dashboard)/moysklad/components/__tests__/MoyskladHealthBadge.a11y.test.tsx',
        'renders the disconnected health state with explicit text and non-color meaning'
      )
    ),
    variant(
      '/moysklad',
      'healthy',
      'default',
      owner(
        'e2e/moysklad.spec.ts',
        'renders /moysklad with the health badge + bootstrap-cabinet note',
        'playwright'
      )
    ),
    variant(
      '/moysklad',
      'success',
      'default',
      owner(
        'src/app/(dashboard)/moysklad/components/__tests__/MoyskladMappingsTable.test.tsx',
        'shows «себестоимость обновлена» badge on a recently-linked row with a buy price'
      )
    ),
    variant(
      '/orders',
      'success',
      'default',
      owner(
        'src/components/custom/orders/__tests__/OrdersAnalyticsDashboard.test.tsx',
        'shows success toast after successful sync'
      )
    ),
    variant(
      '/orders/fbo',
      'populated',
      'default',
      owner(
        'src/app/(dashboard)/orders/fbo/components/__tests__/FboOrdersTable.test.tsx',
        'renders table headers and order data'
      )
    ),
    variant(
      '/orders/integrity',
      'healthy',
      'default',
      owner(
        'src/app/(dashboard)/orders/integrity/components/__tests__/IntegrityStatusCard.test.tsx',
        'renders healthy status with correct label'
      )
    ),
    variant(
      '/orders/integrity',
      'warning',
      'default',
      owner(
        'src/app/(dashboard)/orders/integrity/components/__tests__/IntegrityStatusCard.test.tsx',
        'renders warning status with correct label'
      )
    ),
    variant(
      '/products',
      'active',
      'default',
      owner(
        'src/app/(dashboard)/products/__tests__/page.test.tsx',
        'shows active lifecycle suggestions as reversible destructive confirmations'
      )
    ),
    variant(
      '/products',
      'inactive',
      'default',
      owner(
        'src/app/(dashboard)/products/__tests__/page.test.tsx',
        'renders discontinued lifecycle rows with a named reactivation action'
      )
    ),
    variant(
      '/products',
      'status states',
      'default',
      owner(
        'src/app/(dashboard)/products/__tests__/page.test.tsx',
        'keeps active and discontinued product identities distinct'
      )
    ),
    variant(
      '/products',
      'success',
      'default',
      owner(
        'src/app/(dashboard)/products/__tests__/page.test.tsx',
        'persists a successful lifecycle update through the canonical route action'
      )
    ),
    variant(
      '/products',
      'destructive confirmation',
      'default',
      owner(
        'src/app/(dashboard)/products/__tests__/page.test.tsx',
        'requires explicit confirmation before discontinuing a suggested product'
      )
    ),
    variant(
      '/settings',
      'active navigation',
      'default',
      owner(
        'src/app/(dashboard)/settings/components/__tests__/SettingsNav.test.tsx',
        'keeps a nested path current on its owning settings item'
      )
    ),
    variant(
      '/settings',
      'compact',
      'default',
      owner(
        'src/app/(dashboard)/settings/components/__tests__/SettingsNav.test.tsx',
        'closes after compact navigation and on the desktop transition'
      )
    ),
    variant(
      '/settings',
      'mobile navigation',
      'default',
      owner(
        'src/app/(dashboard)/settings/components/__tests__/SettingsNav.test.tsx',
        'opens a bounded left Sheet with the same ordered navigation and current item'
      )
    ),
    variant(
      '/settings/backfill',
      'safe-to-leave',
      'default',
      owner(
        'src/app/(dashboard)/settings/backfill/__tests__/page.test.tsx',
        'explains that queued or running work continues after leaving the page'
      )
    ),
    variant(
      '/settings/backfill',
      'success',
      'default',
      owner(
        'src/app/(dashboard)/settings/backfill/__tests__/page.test.tsx',
        'presents a successful empty response as real zero counts and an empty list'
      )
    ),
    variant(
      '/settings/backfill',
      'retry',
      'default',
      owner(
        'src/app/(dashboard)/settings/backfill/components/__tests__/BackfillRetryControls.test.tsx',
        'calls onRetry(cabinetId, "reports") for the reports button — never analytics'
      )
    ),
    variant(
      '/settings/cabinet',
      'valid form',
      'default',
      owner(
        'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
        'refreshes the displayed value from the successful persisted response'
      )
    ),
    variant(
      '/settings/cabinet',
      'success',
      'default',
      owner(
        'src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx',
        'refreshes the displayed value from the successful persisted response'
      )
    ),
    variant(
      '/settings/expenses',
      'populated',
      'default',
      owner(
        'src/app/(dashboard)/settings/expenses/__tests__/page.test.tsx',
        'renders expense table with rows'
      )
    ),
    variant(
      '/settings/expenses',
      'save',
      'default',
      owner(
        'src/app/(dashboard)/settings/expenses/components/__tests__/ExpenseFormDialog.test.tsx',
        'calls updateMutation.mutate with id and data'
      )
    ),
    variant(
      '/settings/expenses',
      'success',
      'default',
      owner(
        'src/app/(dashboard)/settings/expenses/components/__tests__/ExpenseFormDialog.test.tsx',
        'calls onOpenChange(false) on successful create'
      )
    ),
    variant(
      '/settings/notifications',
      'save success',
      'default',
      owner(
        'src/components/custom/settings/__tests__/OrderNotificationSettings.test.tsx',
        'toggle click calls updateSettings with correct partial payload'
      )
    ),
    variant(
      '/settings/notifications',
      'quiet-hours validation',
      'default',
      owner(
        'src/app/(dashboard)/settings/notifications/__tests__/page.test.tsx',
        'should show lock message for quiet hours'
      )
    ),
    variant(
      '/settings/tariffs',
      'valid',
      'default',
      owner(
        'src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx',
        'retains valid input and the retry path after a recoverable save failure'
      )
    ),
    variant(
      '/settings/tariffs',
      'pristine',
      'default',
      owner(
        'src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx',
        'has no automated accessibility violations in the loaded pristine form'
      )
    ),
    variant(
      '/settings/tariffs',
      'dirty',
      'default',
      owner(
        'src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx',
        'treats notes and tier-editor changes as dirty and resets them to server values'
      )
    ),
    variant(
      '/settings/tariffs',
      'success',
      'default',
      owner(
        'src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx',
        'keeps the confirmation dialog contained until an asynchronous save succeeds'
      )
    ),
    variant(
      '/settings/tariffs',
      'unavailable values',
      'partial',
      owner(
        'src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx',
        'identifies unavailable server values instead of silently presenting defaults as current'
      )
    ),
    variant(
      '/settings/tax',
      'pristine',
      'default',
      owner(
        'src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx',
        'restores all server values and clears errors without sending a request'
      )
    ),
    variant(
      '/settings/tax',
      'success',
      'default',
      owner(
        'src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx',
        'retains a failed draft, announces recovery, and rebases only after success'
      )
    ),
    variant(
      '/shipments',
      'success',
      'default',
      owner(
        'src/components/custom/shipments/__tests__/CreateShipmentDialog.test.tsx',
        'calls mutateAsync with form data on valid submit'
      )
    ),
    variant(
      '/shipments/[id]',
      'success',
      'default',
      owner(
        'src/components/custom/shipments/__tests__/ShipmentActions.test.tsx',
        'calls confirm and shows toast on success'
      )
    ),
    variant(
      '/shipments/[id]',
      'completed lifecycle',
      'default',
      owner(
        'src/components/custom/shipments/__tests__/ShipmentDetailHeader.test.tsx',
        'shows lock icon for CONFIRMED status'
      )
    ),
    variant(
      '/shipments/box-types',
      'validation',
      'default',
      owner(
        'src/components/custom/box-types/__tests__/BoxTypeFormDialog.test.tsx',
        'shows validation error when name is empty on submit'
      )
    ),
    variant(
      '/shipments/box-types',
      'success',
      'default',
      owner(
        'src/components/custom/box-types/__tests__/BoxTypeFormDialog.test.tsx',
        'submits the unchanged update contract and closes after success'
      )
    ),
    variant(
      '/shipments/box-types',
      'deactivate confirmation',
      'default',
      owner(
        'src/components/custom/box-types/__tests__/BoxTypeDeactivateDialog.test.tsx',
        'calls mutateAsync with boxType.id on confirm click'
      )
    ),
    variant(
      '/shipments/sku-packaging',
      'valid',
      'default',
      owner(
        'src/components/custom/sku-packaging/__tests__/SkuPackagingFormDialog.test.tsx',
        'submits the unchanged single-upsert payload and closes exactly once'
      )
    ),
    variant(
      '/shipments/sku-packaging',
      'success',
      'default',
      owner(
        'src/app/(dashboard)/shipments/sku-packaging/__tests__/page.test.tsx',
        'keeps a dialog success announcement in the route DOM'
      )
    ),
    variant(
      '/supplies',
      'lifecycle statuses',
      'default',
      owner(
        'src/components/custom/supplies/__tests__/SupplyStatusStepper.test.tsx',
        'stepper renders correctly for each status'
      )
    ),
    variant(
      '/supplies/[id]',
      'success',
      'default',
      owner(
        'src/components/custom/supplies/__tests__/CloseSupplyDialog.test.tsx',
        'keeps pending and error context, then closes with focus return on success'
      )
    ),
    variant(
      '/settings/notifications',
      'unbound',
      'default',
      owner(
        'src/app/(dashboard)/settings/notifications/__tests__/page.test.tsx',
        'reports the confirmed unbound status in the shared context bar'
      )
    ),
    variant(
      '/settings/notifications',
      'bound',
      'default',
      owner(
        'src/app/(dashboard)/settings/notifications/__tests__/page.test.tsx',
        'reports the confirmed bound status in the shared context bar'
      )
    ),
    variant(
      '/settings/tax',
      'dirty',
      'default',
      owner(
        'src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx',
        'preserves a dirty draft across query replacement and cancels to the refreshed baseline'
      )
    ),
    variant(
      '/settings/tax',
      'valid',
      'default',
      owner(
        'src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx',
        'submits the exact manual and VAT payload once at a decimal value'
      )
    ),
    variant(
      '/settings/tax',
      'unusual warning',
      'default',
      owner(
        'src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx',
        'keeps an open warning aligned with its visible draft across query replacement'
      )
    ),
    variant(
      '/shipments',
      'status variants',
      'default',
      owner(
        'src/components/custom/shipments/__tests__/ShipmentsTable.test.tsx',
        'shows an explicit neutral fallback for an unknown lifecycle status'
      )
    ),
    variant(
      '/shipments/[id]',
      'validation warning',
      'default',
      owner(
        'src/app/(dashboard)/shipments/[id]/__tests__/page.test.tsx',
        'moves focus to the validation summary after calculation validation fails'
      )
    ),
    variant(
      '/shipments/box-types',
      'populated',
      'default',
      owner(
        'src/app/(dashboard)/shipments/box-types/__tests__/page.test.tsx',
        'should render the table when box types exist'
      )
    ),
    variant(
      '/shipments/box-types',
      'create',
      'default',
      owner(
        'src/app/(dashboard)/shipments/box-types/__tests__/page.test.tsx',
        'opens creation from the exact empty-state trigger'
      )
    ),
    variant(
      '/supplies',
      'success',
      'default',
      owner(
        'src/app/(dashboard)/supplies/__tests__/page.test.tsx',
        'shows sync success toast after successful sync'
      )
    ),
    variant(
      '/supplies/[id]',
      'lifecycle states',
      'default',
      owner(
        'src/app/(dashboard)/supplies/[id]/__tests__/supply-detail-presentation-source-contracts.test.ts',
        'keeps lifecycle meaning semantic, textual, and independent of color alone'
      )
    ),
    variant(
      '/supplies/[id]',
      'picker states',
      'default',
      owner(
        'src/app/(dashboard)/supplies/[id]/__tests__/supply-detail-presentation-source-contracts.test.ts',
        'preserves virtualized picker behavior and selection limits'
      )
    ),
  ]
