import { STORY_174_3_ROUTE_EVIDENCE } from './story-174-3-visual-accessibility'
import { CHART_INVENTORY } from './story-174-3/chart-inventory'
import {
  MOBILE_NAVIGATION,
  PRODUCT_FILTER,
  ROUTE_OVERLAY_INVENTORY,
  isProtectedRoute,
} from './story-174-3/overlay-inventory'
import { TABLE_INVENTORY } from './story-174-3/table-inventory'
import type {
  Story1743ChartSurface,
  Story1743ConditionalInventoryItem,
  Story1743ConditionalVerification,
  Story1743OverlayInventoryItem,
  Story1743RouteSurfaceContract,
  Story1743TableSurface,
} from './story-174-3/surface-types'
import { ownerTestBinding } from './story-174-3/surface-types'

export { CHART_FEATURES, TABLE_FEATURES } from './story-174-3/surface-types'
export type {
  Story1743ChartSurface,
  Story1743DataSurfaceContract,
  Story1743OverlayContract,
  Story1743OverlayInventoryItem,
  Story1743RouteSurfaceContract,
  Story1743TableSurface,
} from './story-174-3/surface-types'

type ConditionalRationales = Readonly<Record<string, Readonly<Record<string, string>>>>
type ConditionalVerifications = Readonly<
  Record<string, Readonly<Record<string, Story1743ConditionalVerification>>>
>

const owner = (
  source: string,
  scenarioId: string,
  runner: 'vitest' | 'playwright' = source.startsWith('e2e/') ? 'playwright' : 'vitest'
) => ownerTestBinding({ runner, source, scenarioId })

const trigger = (name: string, restoreName: string): Story1743ConditionalVerification => ({
  execution: 'canonical-trigger',
  role: 'tab',
  name,
  restoreName,
  activationKey: 'Enter',
})

const KEYBOARD_NOT_APPLICABLE: Readonly<Record<string, string>> = Object.freeze({
  '/processing':
    'the canonical processing terminal is read-only and exposes status text without a route-owned action',
  '/wb-token':
    'the canonical token terminal is read-only because no token action is available in the resolved state',
  '/analytics/models/[id]/evaluations/sku-accuracy':
    'the deterministic model id resolves to the route-owned not-found terminal without an action',
  '/communications':
    'the canonical empty communications workspace exposes status content without a route-owned action',
  '/analytics/forecast-accuracy':
    'the canonical forecast-accuracy terminal is a read-only metrics explanation with no route-owned action',
  '/monitor': 'the canonical monitor summary is a read-only report without a route-owned action',
  '/settings':
    'the canonical settings overview is read-only; settings navigation is owned by the excluded shell navigation',
})

const CONDITIONAL_TABLE_RATIONALES: ConditionalRationales = Object.freeze({
  '/analytics': {
    'financial-summary-profit':
      'The canonical finance summary has incomplete COGS coverage; the mutually exclusive net-profit table is rendered only at 100% COGS coverage.',
  },
  '/analytics/acquiring': {
    'acquiring-reports':
      'The canonical cabinet renders the explicit “reports not found” terminal; the reports table is conditional on a non-empty acquiring response.',
  },
  '/analytics/acquiring/reports/[id]': {
    'acquiring-report-transactions':
      'The deterministic route identity does not assert that the materialized report exists; transaction rows require a resolved report entity.',
  },
  '/analytics/buyout-reconciliation': {
    'buyout-reconciliation':
      'The canonical period renders the explicit no-buyout-data terminal; reconciliation rows require a non-empty period response.',
  },
  '/analytics/cross-reference': {
    'cross-reference':
      'The canonical cabinet renders the WB Jam subscription gate; the cross-reference table is available only after entitlement is granted.',
  },
  '/analytics/search': {
    'search-orders':
      'The canonical cabinet renders the WB Jam subscription gate; search-order data surfaces are unavailable without that entitlement.',
  },
  '/analytics/forecast': {
    'forecast-sales':
      'The canonical default asks for an nmId before requesting a forecast; the forecast table is conditional on an explicit product selection.',
  },
  '/analytics/fbs-stock': {
    'fbs-stock-regions':
      'The canonical default mounts the groups tab; the mutually exclusive regions table is lazy-mounted only after selecting its tab.',
    'fbs-stock-sizes':
      'The canonical default mounts the groups tab; the mutually exclusive sizes table is lazy-mounted only after selecting its tab.',
  },
  '/analytics/models/[id]/evaluations': {
    'model-evaluations':
      'The deterministic model id is an identity placeholder and resolves to the route-owned model-not-found terminal in the canonical environment.',
  },
  '/analytics/models/[id]/evaluations/sku-accuracy': {
    'model-sku-accuracy':
      'The deterministic model id has no canonical SKU-accuracy entity; the table is executed separately by dedicated mocked route evidence.',
  },
  '/analytics/models/[id]/performance': {
    'model-performance-evaluations':
      'The deterministic model id is an identity placeholder and resolves to the route-owned model-not-found terminal in the canonical environment.',
  },
  '/cogs/history': {
    'cogs-history':
      'The canonical URL has no product id and renders the route-owned “ID not specified” terminal; history rows require a selected product.',
  },
  '/products': {
    'product-list':
      'The assortment route renders route-owned assortment lists rather than ProductList; that shared table is not mounted in this canonical route.',
  },
  '/settings/expenses': {
    'operating-expenses':
      'The canonical cabinet has no saved operating-expense rows; the table is conditional on at least one persisted expense.',
  },
  '/shipments': {
    shipments:
      'The canonical cabinet renders the explicit no-shipments terminal; the table is conditional on at least one shipment.',
  },
  '/shipments/[id]': {
    'shipment-box-lines':
      'The deterministic shipment id is an identity placeholder; box lines require a resolved shipment entity.',
  },
  '/shipments/box-types': {
    'box-types':
      'The canonical cabinet renders the explicit no-box-types terminal; the table is conditional on at least one configured type.',
  },
  '/shipments/sku-packaging': {
    'sku-packaging':
      'The canonical cabinet renders the explicit no-packaging terminal; the table is conditional on at least one SKU packaging binding.',
  },
  '/orders/fbo': {
    'fbo-sales':
      'The canonical default tab renders FBO orders; the mutually exclusive sales table is executed by dedicated tab-state browser evidence.',
  },
  '/supplies/[id]': {
    'supply-orders':
      'The deterministic supply id resolves to the route-owned supply-load error terminal; the orders table requires a successfully loaded supply entity.',
  },
})

const CONDITIONAL_CHART_RATIONALES: ConditionalRationales = Object.freeze({
  '/analytics/brand-share': {
    'brand-share-daily':
      'The canonical period renders the explicit no-brand-share-data terminal; the chart requires a non-empty report window.',
  },
  '/analytics/search': {
    'search-orders-daily':
      'The canonical cabinet renders the WB Jam subscription gate; the search chart is unavailable without that entitlement.',
  },
  '/analytics/forecast': {
    'sales-forecast':
      'The canonical default asks for an nmId before requesting a forecast; the chart requires an explicit product selection.',
  },
  '/analytics/models/[id]/performance': {
    'model-mape-trend':
      'The deterministic model id resolves to the route-owned model-not-found terminal; the trend requires a resolved model entity.',
  },
})

const CONDITIONAL_OVERLAY_RATIONALES: ConditionalRationales = Object.freeze({
  '/analytics/ai-admin/anomalies': {
    'resolve-anomaly':
      'The resolution dialog trigger is rendered only for a pending anomaly; resolved-only or empty canonical data has no such action.',
  },
  '/analytics/ai-admin/models': {
    'model-rollback':
      'The rollback dialog trigger is available only for a model status that permits rollback; blocked-status canonical rows intentionally disable the action.',
  },
  '/analytics/liquidity': {
    'liquidation-planner':
      'The liquidation planner trigger is enabled only for a SKU with executable liquidation scenarios; other liquidity actions do not open the planner.',
  },
  '/analytics/search': {
    'product-search':
      'The canonical cabinet renders the WB Jam subscription gate, so the entitled product-search trigger is not mounted.',
  },
  '/cogs/history': {
    'cogs-row-actions':
      'The canonical URL has no product id and no history rows, so row-owned action triggers are not mounted.',
  },
  '/cogs/price-calculator': {
    'reset-confirmation':
      'The canonical default has no calculated result, so Reset performs a direct no-op reset; confirmation is mounted only after a result exists.',
  },
  '/settings/backfill': {
    'backfill-error-log':
      'The canonical cabinet has no failed backfill row; this row-owned trigger appears only when an error payload exists.',
  },
  '/settings/expenses': {
    'expense-delete':
      'The canonical cabinet has no saved expense rows, so row-owned delete triggers are not mounted.',
  },
  '/settings/notifications': {
    'telegram-unbind':
      'The canonical account is disconnected and renders the mutually exclusive Telegram binding trigger.',
  },
  '/shipments': {
    'create-shipment':
      'The canonical empty shipment state disables creation until SKU packaging is configured; the authorized and configured creation workflow is executed by owner evidence.',
  },
  '/monitoring': {
    'health-report':
      'The health-report trigger belongs to a conditional monitoring result and is not mounted in the canonical default overview.',
    'recovery-confirmation':
      'Recovery confirmation is mounted only for a recoverable incident; the canonical overview has no such incident.',
  },
  '/supplies/[id]': {
    'order-picker':
      'The deterministic supply id resolves to the route-owned supply-load error terminal; the add-orders trigger requires a successfully loaded OPEN supply.',
    'close-supply':
      'The deterministic supply id resolves to the route-owned supply-load error terminal; the close-supply trigger requires a successfully loaded OPEN supply with at least one order.',
  },
  '/shipments/[id]': {
    'box-line-form':
      'The deterministic shipment id is an identity placeholder; the add-line dialog requires a resolved DRAFT shipment.',
  },
})

const CONDITIONAL_TABLE_VERIFICATIONS: ConditionalVerifications = Object.freeze({
  '/analytics': {
    'financial-summary-profit': owner(
      'src/components/custom/financial-summary/__tests__/ProfitSection.test.tsx',
      'renders the conditional profit table at complete COGS coverage with exact identity and value'
    ),
  },
  '/analytics/acquiring': {
    'acquiring-reports': owner(
      'src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringReportsTable.test.tsx',
      'renders all 6 column headers'
    ),
  },
  '/analytics/acquiring/reports/[id]': {
    'acquiring-report-transactions': owner(
      'src/app/(dashboard)/analytics/acquiring/reports/[id]/components/__tests__/AcquiringReportDetailPage.test.tsx',
      'passes report identity to the transactions table caption (RTC)'
    ),
  },
  '/analytics/buyout-reconciliation': {
    'buyout-reconciliation': owner(
      'src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/ReconciliationTable.test.tsx',
      'renders all required column headers'
    ),
  },
  '/analytics/cross-reference': {
    'cross-reference': owner(
      'src/app/(dashboard)/analytics/cross-reference/components/__tests__/CrossReferenceTable.test.tsx',
      'renders a real adRevenue as currency'
    ),
  },
  '/analytics/search': {
    'search-orders': owner(
      'src/app/(dashboard)/analytics/search/__tests__/SearchOrdersTab.test.tsx',
      'mounts both the chart and the overview when both sources succeed'
    ),
  },
  '/analytics/forecast': {
    'forecast-sales': owner(
      'src/app/(dashboard)/analytics/forecast/components/__tests__/ForecastTable.test.tsx',
      'renders all 8 column headers in correct order (Story 110.4-FE: Оценка added)'
    ),
  },
  '/analytics/fbs-stock': {
    'fbs-stock-regions': owner(
      'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockRegionsSection.test.tsx',
      '169.7: renders static TableCaption naming the table'
    ),
    'fbs-stock-sizes': owner(
      'src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockSizesSection.test.tsx',
      '169.7: renders static TableCaption naming the table'
    ),
  },
  '/analytics/models/[id]/evaluations': {
    'model-evaluations': owner(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsList.test.tsx',
      'happy path: column headers render including forecast columns'
    ),
  },
  '/analytics/models/[id]/evaluations/sku-accuracy': {
    'model-sku-accuracy': owner(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyTable.test.tsx',
      'renders all 6 column headers'
    ),
  },
  '/analytics/models/[id]/performance': {
    'model-performance-evaluations': owner(
      'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
      'evaluation table renders rows in descending date order'
    ),
  },
  '/cogs/history': {
    'cogs-history': owner(
      'src/components/custom/CogsHistoryTable.test.tsx',
      'renders table with correct columns'
    ),
  },
  '/products': {
    'product-list': owner(
      'src/components/custom/__tests__/ProductList.test.tsx',
      'renders product list when data is available'
    ),
  },
  '/settings/expenses': {
    'operating-expenses': owner(
      'src/app/(dashboard)/settings/expenses/__tests__/page.test.tsx',
      'renders expense table with rows'
    ),
  },
  '/shipments': {
    shipments: owner(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'renders the migrated queue and opens creation for an authorized user'
    ),
  },
  '/shipments/[id]': {
    'shipment-box-lines': owner(
      'src/components/custom/shipments/__tests__/BoxLineTable.test.tsx',
      'renders box lines in table with correct data'
    ),
  },
  '/shipments/box-types': {
    'box-types': owner(
      'src/app/(dashboard)/shipments/box-types/__tests__/page.test.tsx',
      'should render the table when box types exist'
    ),
  },
  '/shipments/sku-packaging': {
    'sku-packaging': owner(
      'src/components/custom/sku-packaging/__tests__/SkuPackagingTable.test.tsx',
      'keeps SKU identity, package, status, units, and actions available in wide and narrow views'
    ),
  },
  '/orders/fbo': {
    'fbo-sales': trigger('Продажи', 'Заказы'),
  },
  '/supplies/[id]': {
    'supply-orders': owner(
      'src/app/(dashboard)/supplies/[id]/__tests__/page.test.tsx',
      'shows SupplyOrdersTable component'
    ),
  },
})

const CONDITIONAL_CHART_VERIFICATIONS: ConditionalVerifications = Object.freeze({
  '/analytics/brand-share': {
    'brand-share-daily': owner(
      'src/components/custom/analytics/__tests__/BrandShareChart.test.tsx',
      'renders the sr-only table with every day × 3 metrics at tooltip precision'
    ),
  },
  '/analytics/search': {
    'search-orders-daily': owner(
      'src/app/(dashboard)/analytics/search/components/__tests__/SearchOrdersChart.test.tsx',
      'exposes exact period, units, series, every daily value, and tooltip precision'
    ),
  },
  '/analytics/forecast': {
    'sales-forecast': owner(
      'src/app/(dashboard)/analytics/forecast/components/__tests__/ForecastChart.test.tsx',
      'renders all 5 Russian labels + values when active with valid payload'
    ),
  },
  '/analytics/models/[id]/performance': {
    'model-mape-trend': owner(
      'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
      'tooltip exposes the exact date, MAPE units, series value, and SKU precision'
    ),
  },
})

const CONDITIONAL_OVERLAY_VERIFICATIONS: ConditionalVerifications = Object.freeze({
  '/analytics/ai-admin/anomalies': {
    'resolve-anomaly': owner(
      'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/AnomaliesList.test.tsx',
      'opens the exact anomaly dialog by keyboard and restores focus when cancelled'
    ),
  },
  '/analytics/ai-admin/models': {
    'model-rollback': owner(
      'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/AdminModelsList.test.tsx',
      '171.2 gap-5: focus returns to the invoking row rollback button after dialog close'
    ),
  },
  '/analytics/liquidity': {
    'liquidation-planner': owner(
      'src/app/(dashboard)/analytics/liquidity/components/__tests__/LiquidityTable.test.tsx',
      'expands the exact SKU by keyboard and opens its liquidation planner without cross-triggering'
    ),
  },
  '/analytics/search': {
    'product-search': owner(
      'src/app/(dashboard)/analytics/search/components/__tests__/ProductCombobox.test.tsx',
      'opens and closes the product-search popover by keyboard with focus return'
    ),
  },
  '/cogs/history': {
    'cogs-row-actions': owner(
      'src/components/custom/ActionsDropdown.test.tsx',
      'opens dropdown and invokes edit action by keyboard with focus return'
    ),
  },
  '/cogs/price-calculator': {
    'reset-confirmation': owner(
      'src/components/custom/price-calculator/__tests__/PriceCalculatorForm.test.tsx',
      'triggers reset confirmation when results exist'
    ),
  },
  '/settings/backfill': {
    'backfill-error-log': owner(
      'e2e/settings/backfill-admin.spec.ts',
      'should show error details on click'
    ),
  },
  '/settings/expenses': {
    'expense-delete': owner(
      'e2e/expenses-page.spec.ts',
      'contains focus and returns it to the invoking delete action'
    ),
  },
  '/settings/notifications': {
    'telegram-unbind': owner(
      'e2e/telegram-notifications.spec.ts',
      'contains unbind focus and returns it to the invoking action after Escape'
    ),
  },
  '/shipments': {
    'create-shipment': owner(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'renders the migrated queue and opens creation for an authorized user'
    ),
  },
  '/monitoring': {
    'health-report': owner(
      'src/app/(dashboard)/monitoring/components/__tests__/HealthReportSheet.test.tsx',
      'renders the conditional report sheet as a named modal and closes with focus-safe control'
    ),
    'recovery-confirmation': owner(
      'src/app/(dashboard)/monitoring/components/__tests__/RecoveryPanel.test.tsx',
      'opens the recovery confirmation and cancels without mutation'
    ),
  },
  '/supplies/[id]': {
    'order-picker': owner(
      'src/app/(dashboard)/supplies/[id]/__tests__/page.test.tsx',
      'opens the order picker from the primary action'
    ),
    'close-supply': owner(
      'src/app/(dashboard)/supplies/[id]/__tests__/page.test.tsx',
      'opens the close confirmation from the supply action'
    ),
  },
  '/shipments/[id]': {
    'box-line-form': owner(
      'src/components/custom/shipments/__tests__/BoxLineTable.test.tsx',
      'returns focus to the exact add trigger when the form is cancelled'
    ),
  },
})

function partitionInventory<TItem extends { id: string }>(
  route: string,
  inventory: readonly TItem[],
  rationales: ConditionalRationales,
  verifications: ConditionalVerifications
): {
  executed: readonly TItem[]
  conditional: readonly Story1743ConditionalInventoryItem<TItem>[]
} {
  const routeRationales = rationales[route] ?? {}
  const routeVerifications = verifications[route] ?? {}
  const knownIds = new Set(inventory.map(item => item.id))
  for (const id of Object.keys(routeRationales)) {
    if (!knownIds.has(id)) throw new Error(`${route}: conditional inventory item is unknown: ${id}`)
    if (!routeVerifications[id]) {
      throw new Error(`${route}: conditional inventory item has no executable verification: ${id}`)
    }
  }
  for (const id of Object.keys(routeVerifications)) {
    if (!knownIds.has(id)) {
      throw new Error(`${route}: conditional verification item is unknown: ${id}`)
    }
    if (!routeRationales[id]) {
      throw new Error(
        `${route}: conditional verification has no canonical-default rationale: ${id}`
      )
    }
  }
  return {
    executed: Object.freeze(inventory.filter(item => !routeRationales[item.id])),
    conditional: Object.freeze(
      inventory
        .filter(item => Boolean(routeRationales[item.id]))
        .map(item => ({
          disposition: 'not-applicable-in-canonical-default' as const,
          item,
          rationale: `${route}: ${routeRationales[item.id]}`,
          verification: routeVerifications[item.id],
        }))
    ),
  }
}

function overlaysForRoute(route: string): readonly Story1743OverlayInventoryItem[] {
  const inventory: Story1743OverlayInventoryItem[] = []
  if (isProtectedRoute(route)) inventory.push(MOBILE_NAVIGATION)
  if (route === '/analytics/funnel') inventory.push(PRODUCT_FILTER)
  inventory.push(...(ROUTE_OVERLAY_INVENTORY[route] ?? []))
  return Object.freeze(inventory)
}

function conditionalizeDataSurface<TSurface extends Story1743ChartSurface | Story1743TableSurface>(
  route: string,
  item: TSurface
): TSurface {
  const features = Object.fromEntries(
    Object.keys(item.features).map(feature => [
      feature,
      {
        disposition: 'not-applicable' as const,
        rationale: `${route}: ${item.id} feature ${feature} is not rendered in the canonical default state`,
      },
    ])
  )
  return Object.freeze({
    ...item,
    features,
    ...('narrowWidthDisposition' in item
      ? {
          narrowWidthDisposition: {
            disposition: 'not-applicable' as const,
            rationale: `${route}: ${item.id} has no narrow-width execution because the table is not rendered in the canonical default state`,
          },
        }
      : {}),
  }) as TSurface
}

function conditionalizeInventory<TSurface extends Story1743ChartSurface | Story1743TableSurface>(
  route: string,
  inventory: readonly Story1743ConditionalInventoryItem<TSurface>[]
): readonly Story1743ConditionalInventoryItem<TSurface>[] {
  return Object.freeze(
    inventory.map(conditional => ({
      ...conditional,
      item:
        conditional.verification.execution === 'canonical-trigger'
          ? conditional.item
          : conditionalizeDataSurface(route, conditional.item),
    }))
  )
}

function assertInventoryRoutes(
  inventory: Readonly<Record<string, readonly unknown[]>>,
  kind: string
) {
  const ledgerRoutes = new Set(STORY_174_3_ROUTE_EVIDENCE.map(row => row.route))
  for (const route of Object.keys(inventory)) {
    if (!ledgerRoutes.has(route)) {
      throw new Error(`Story 174.3 ${kind} inventory route is unknown: ${route}`)
    }
  }
}

assertInventoryRoutes(TABLE_INVENTORY, 'table')
assertInventoryRoutes(CHART_INVENTORY, 'chart')
assertInventoryRoutes(ROUTE_OVERLAY_INVENTORY, 'overlay')

export const STORY_174_3_SURFACE_CONTRACTS: Readonly<
  Record<string, Story1743RouteSurfaceContract>
> = Object.freeze(
  Object.fromEntries(
    STORY_174_3_ROUTE_EVIDENCE.map(row => {
      const overlays = partitionInventory(
        row.route,
        overlaysForRoute(row.route),
        CONDITIONAL_OVERLAY_RATIONALES,
        CONDITIONAL_OVERLAY_VERIFICATIONS
      )
      const tables = partitionInventory(
        row.route,
        TABLE_INVENTORY[row.route] ?? [],
        CONDITIONAL_TABLE_RATIONALES,
        CONDITIONAL_TABLE_VERIFICATIONS
      )
      const charts = partitionInventory(
        row.route,
        CHART_INVENTORY[row.route] ?? [],
        CONDITIONAL_CHART_RATIONALES,
        CONDITIONAL_CHART_VERIFICATIONS
      )
      const conditionalTables = conditionalizeInventory(row.route, tables.conditional)
      const conditionalCharts = conditionalizeInventory(row.route, charts.conditional)
      return [
        row.route,
        {
          route: row.route,
          keyboard: {
            disposition: KEYBOARD_NOT_APPLICABLE[row.route]
              ? ('not-applicable' as const)
              : ('executed' as const),
            surface: 'main-or-route-body' as const,
            rationale: KEYBOARD_NOT_APPLICABLE[row.route]
              ? `${row.route}: ${KEYBOARD_NOT_APPLICABLE[row.route]}`
              : `${row.route}: the route-owned main (or route body when no main exists) must expose its own actionable keyboard target; shared shell navigation is excluded`,
          },
          overlay: {
            disposition: 'executed' as const,
            expectedCount: overlays.executed.length,
            inventory: overlays.executed,
            conditionalInventory: overlays.conditional,
            evidenceSource: row.entry,
            rationale: `${row.route}: closed-by-default overlays are inventoried by trigger and archetype; an empty inventory means an asserted count of zero, never N/A`,
          },
          table: {
            disposition: 'executed' as const,
            expectedCount: tables.executed.length,
            surfaces: tables.executed,
            conditionalSurfaces: conditionalTables,
            evidenceSource: row.entry,
            emptyRationale: `${row.route}: the explicit table inventory expects exactly ${tables.executed.length} live semantic table surfaces and classifies ${tables.conditional.length} known conditional surfaces`,
          },
          chart: {
            disposition: 'executed' as const,
            expectedCount: charts.executed.length,
            surfaces: charts.executed,
            conditionalSurfaces: conditionalCharts,
            evidenceSource: row.entry,
            emptyRationale: `${row.route}: the explicit chart inventory expects exactly ${charts.executed.length} live visual chart surfaces and classifies ${charts.conditional.length} known conditional surfaces`,
          },
        },
      ]
    })
  )
)
