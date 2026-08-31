import { existsSync, readFileSync } from 'node:fs'

import { STORY_174_3_ROUTE_EVIDENCE } from './story-174-3-visual-accessibility'

export const TABLE_FEATURES = [
  'caption-or-name',
  'primary-identity-column',
  'numeric-alignment-and-precision',
  'sorting',
  'selection-and-actions',
  'pagination',
  'virtualization',
  'narrow-width-strategy',
] as const

export const CHART_FEATURES = [
  'title',
  'period-and-units',
  'series-or-legend-meaning',
  'tooltip-precision',
  'responsive-containment',
  'reduced-motion',
  'exact-data-alternative',
] as const

type TableFeature = (typeof TABLE_FEATURES)[number]
type ChartFeature = (typeof CHART_FEATURES)[number]
type SurfaceFeatureDisposition = {
  disposition: 'executed' | 'not-applicable'
  rationale: string
}
type SurfaceEvidence = { source: string; anchor: string }

export type Story1743OverlayInventoryItem = {
  id: string
  archetype:
    'modal-dialog' | 'modal-alert-dialog' | 'modal-sheet' | 'non-modal-popover' | 'non-modal-menu'
  defaultState: 'closed'
  trigger: {
    role: 'button' | 'combobox' | 'link'
    name: string
    match?: 'exact' | 'prefix' | 'contains'
    cardinality?: 'exactly-one' | 'one-or-more'
  }
  evidence: SurfaceEvidence
}

export type Story1743OverlayContract = {
  disposition: 'executed'
  expectedCount: number
  inventory: readonly Story1743OverlayInventoryItem[]
  conditionalInventory: readonly Story1743ConditionalInventoryItem<Story1743OverlayInventoryItem>[]
  evidenceSource: string
  rationale: string
}

export type Story1743ConditionalInventoryItem<TItem> = {
  disposition: 'not-applicable-in-canonical-default'
  item: TItem
  rationale: string
}

export type Story1743TableSurface = {
  id: string
  selector: string
  accessibleName: string
  evidence: SurfaceEvidence
  features: Readonly<Record<TableFeature, SurfaceFeatureDisposition>>
  narrowWidthDisposition: SurfaceFeatureDisposition
}

export type Story1743ChartSurface = {
  id: string
  selector: string
  accessibleName: string
  evidence: SurfaceEvidence
  alternative: {
    association: 'explicit-accessible-name'
    selector: string
    accessibleName: string
  }
  features: Readonly<Record<ChartFeature, SurfaceFeatureDisposition>>
}

export type Story1743DataSurfaceContract<TSurface> = {
  disposition: 'executed'
  expectedCount: number
  surfaces: readonly TSurface[]
  conditionalSurfaces: readonly Story1743ConditionalInventoryItem<TSurface>[]
  evidenceSource: string
  emptyRationale: string
}

export type Story1743RouteSurfaceContract = {
  route: string
  overlay: Story1743OverlayContract
  table: Story1743DataSurfaceContract<Story1743TableSurface>
  chart: Story1743DataSurfaceContract<Story1743ChartSurface>
}

function evidence(source: string, anchor: string): SurfaceEvidence {
  if (!existsSync(source)) throw new Error(`Story 174.3 surface evidence is missing: ${source}`)
  if (!readFileSync(source, 'utf8').includes(anchor)) {
    throw new Error(`Story 174.3 surface evidence anchor is missing: ${source} :: ${anchor}`)
  }
  return { source, anchor }
}

function featureDispositions<TFeature extends string>(
  route: string,
  surfaceId: string,
  allFeatures: readonly TFeature[],
  executedFeatures: readonly TFeature[],
  notApplicableFeatures: readonly TFeature[]
): Readonly<Record<TFeature, SurfaceFeatureDisposition>> {
  const executed = new Set(executedFeatures)
  const notApplicable = new Set(notApplicableFeatures)
  if (
    executed.size !== executedFeatures.length ||
    notApplicable.size !== notApplicableFeatures.length
  ) {
    throw new Error(`${route}/${surfaceId} has duplicate feature dispositions`)
  }
  for (const feature of allFeatures) {
    const count = Number(executed.has(feature)) + Number(notApplicable.has(feature))
    if (count !== 1) {
      throw new Error(`${route}/${surfaceId}/${feature} must have exactly one disposition`)
    }
  }
  return Object.freeze(
    Object.fromEntries(
      allFeatures.map(feature => [
        feature,
        executed.has(feature)
          ? {
              disposition: 'executed' as const,
              rationale: `${route}: ${surfaceId} feature ${feature} is executed by the consolidated live-surface runner`,
            }
          : {
              disposition: 'not-applicable' as const,
              rationale: `${route}: ${surfaceId} feature ${feature} is explicitly absent from this surface archetype`,
            },
      ])
    ) as Record<TFeature, SurfaceFeatureDisposition>
  )
}

const STATIC_TABLE_EXECUTED: readonly TableFeature[] = [
  'caption-or-name',
  'primary-identity-column',
  'numeric-alignment-and-precision',
  'narrow-width-strategy',
]
const STATIC_TABLE_NOT_APPLICABLE: readonly TableFeature[] = [
  'sorting',
  'selection-and-actions',
  'pagination',
  'virtualization',
]
const SORTABLE_TABLE_EXECUTED: readonly TableFeature[] = [
  'caption-or-name',
  'primary-identity-column',
  'numeric-alignment-and-precision',
  'sorting',
  'narrow-width-strategy',
]
const SORTABLE_TABLE_NOT_APPLICABLE: readonly TableFeature[] = [
  'selection-and-actions',
  'pagination',
  'virtualization',
]
const ACTIONABLE_TABLE_EXECUTED: readonly TableFeature[] = [
  'caption-or-name',
  'primary-identity-column',
  'numeric-alignment-and-precision',
  'selection-and-actions',
  'narrow-width-strategy',
]
const ACTIONABLE_TABLE_NOT_APPLICABLE: readonly TableFeature[] = [
  'sorting',
  'pagination',
  'virtualization',
]

function tableSurface(
  route: string,
  definition: {
    id: string
    accessibleName: string
    source: string
    anchor: string
    profile?: 'actionable' | 'static' | 'sortable'
    narrowWidthRationale?: string
  }
): Story1743TableSurface {
  const sortable = definition.profile === 'sortable'
  const actionable = definition.profile === 'actionable'
  const executedFeatures = sortable
    ? SORTABLE_TABLE_EXECUTED
    : actionable
      ? ACTIONABLE_TABLE_EXECUTED
      : STATIC_TABLE_EXECUTED
  const notApplicableFeatures = sortable
    ? SORTABLE_TABLE_NOT_APPLICABLE
    : actionable
      ? ACTIONABLE_TABLE_NOT_APPLICABLE
      : STATIC_TABLE_NOT_APPLICABLE
  return {
    id: definition.id,
    selector: `role=table[name^=${JSON.stringify(definition.accessibleName)}]`,
    accessibleName: definition.accessibleName,
    evidence: evidence(definition.source, definition.anchor),
    features: featureDispositions(
      route,
      definition.id,
      TABLE_FEATURES,
      definition.narrowWidthRationale
        ? executedFeatures.filter(feature => feature !== 'narrow-width-strategy')
        : executedFeatures,
      definition.narrowWidthRationale
        ? [...notApplicableFeatures, 'narrow-width-strategy']
        : notApplicableFeatures
    ),
    narrowWidthDisposition: definition.narrowWidthRationale
      ? {
          disposition: 'not-applicable',
          rationale: `${route}: ${definition.id} is not rendered as a semantic table at 390px because ${definition.narrowWidthRationale}`,
        }
      : {
          disposition: 'executed',
          rationale: `${route}: ${definition.id} remains a live semantic table at 390px`,
        },
  }
}

function chartSurface(
  route: string,
  definition: {
    id: string
    accessibleName: string
    alternativeAccessibleName: string
    source: string
    anchor: string
    alternativeSource: string
    alternativeAnchor: string
  }
): Story1743ChartSurface {
  evidence(definition.alternativeSource, definition.alternativeAnchor)
  return {
    id: definition.id,
    selector: `[role="img"][aria-label^=${JSON.stringify(definition.accessibleName)}]`,
    accessibleName: definition.accessibleName,
    evidence: evidence(definition.source, definition.anchor),
    alternative: {
      association: 'explicit-accessible-name',
      selector: 'table:has(> caption), [role="region"][data-chart-alternative]',
      accessibleName: definition.alternativeAccessibleName,
    },
    features: featureDispositions(route, definition.id, CHART_FEATURES, CHART_FEATURES, []),
  }
}

const MOBILE_NAVIGATION: Story1743OverlayInventoryItem = {
  id: 'mobile-navigation',
  archetype: 'modal-sheet',
  defaultState: 'closed',
  trigger: { role: 'button', name: 'Open menu' },
  evidence: evidence('src/app/(dashboard)/layout/MobileSidebarSheet.tsx', 'aria-label="Open menu"'),
}
const PRODUCT_FILTER: Story1743OverlayInventoryItem = {
  id: 'product-filter',
  archetype: 'non-modal-popover',
  defaultState: 'closed',
  trigger: { role: 'combobox', name: 'Фильтр по товарам' },
  evidence: evidence(
    'src/app/(dashboard)/analytics/funnel/components/FunnelProductFilter.tsx',
    'aria-label="Фильтр по товарам"'
  ),
}

function overlayItem(definition: Story1743OverlayInventoryItem): Story1743OverlayInventoryItem {
  evidence(definition.evidence.source, definition.evidence.anchor)
  return Object.freeze(definition)
}

const ROUTE_OVERLAY_INVENTORY: Readonly<Record<string, readonly Story1743OverlayInventoryItem[]>> =
  Object.freeze({
    '/analytics/advertising': [
      overlayItem({
        id: 'campaign-filter',
        archetype: 'non-modal-popover',
        defaultState: 'closed',
        trigger: { role: 'combobox', name: 'Выбрать кампании' },
        evidence: {
          source: 'src/app/(dashboard)/analytics/advertising/components/CampaignSelector.tsx',
          anchor: 'aria-label="Выбрать кампании"',
        },
      }),
      overlayItem({
        id: 'efficiency-filter',
        archetype: 'non-modal-popover',
        defaultState: 'closed',
        trigger: {
          role: 'combobox',
          name: 'Фильтр по статусу эффективности',
        },
        evidence: {
          source:
            'src/app/(dashboard)/analytics/advertising/components/EfficiencyFilterDropdown.tsx',
          anchor: 'aria-label="Фильтр по статусу эффективности"',
        },
      }),
    ],
    '/analytics/search': [
      overlayItem({
        id: 'product-search',
        archetype: 'non-modal-popover',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Поиск товара' },
        evidence: {
          source: 'src/app/(dashboard)/analytics/search/components/ProductCombobox.tsx',
          anchor: 'aria-label="Поиск товара"',
        },
      }),
    ],
    '/dashboard': [
      overlayItem({
        id: 'widget-settings',
        archetype: 'modal-sheet',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Настройка виджетов' },
        evidence: {
          source: 'src/components/custom/dashboard/WidgetSettingsSheet.tsx',
          anchor: 'Настройка виджетов',
        },
      }),
      overlayItem({
        id: 'commission-breakdown',
        archetype: 'non-modal-popover',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'категории комиссий', match: 'contains' },
        evidence: {
          source: 'src/components/custom/dashboard/CommissionBreakdownPopover.tsx',
          anchor: 'категории комиссий',
        },
      }),
      overlayItem({
        id: 'logistics-breakdown',
        archetype: 'non-modal-popover',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'категории логистики', match: 'contains' },
        evidence: {
          source: 'src/components/custom/dashboard/LogisticsBreakdownPopover.tsx',
          anchor: 'категории логистики',
        },
      }),
    ],
    '/cogs/history': [
      overlayItem({
        id: 'cogs-row-actions',
        archetype: 'non-modal-menu',
        defaultState: 'closed',
        trigger: {
          role: 'button',
          name: 'Открыть меню',
          cardinality: 'one-or-more',
        },
        evidence: {
          source: 'src/components/custom/CogsHistoryTableCells.tsx',
          anchor: '<span className="sr-only">Открыть меню</span>',
        },
      }),
    ],
    '/cogs/price-calculator': [
      overlayItem({
        id: 'product-search',
        archetype: 'non-modal-popover',
        defaultState: 'closed',
        trigger: { role: 'combobox', name: 'Поиск товара' },
        evidence: {
          source: 'src/components/custom/price-calculator/ProductSearchPopover.tsx',
          anchor: 'aria-label="Поиск товара"',
        },
      }),
      overlayItem({
        id: 'warehouse-select',
        archetype: 'non-modal-popover',
        defaultState: 'closed',
        trigger: { role: 'combobox', name: 'Выберите склад' },
        evidence: {
          source: 'src/components/custom/price-calculator/WarehouseSelect.tsx',
          anchor: 'aria-label="Выберите склад"',
        },
      }),
      overlayItem({
        id: 'reset-confirmation',
        archetype: 'non-modal-popover',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Сбросить', match: 'prefix' },
        evidence: {
          source: 'src/components/custom/price-calculator/ResetConfirmDialog.tsx',
          anchor: '<DialogTitle>Подтверждение сброса</DialogTitle>',
        },
      }),
    ],
    '/settings/backfill': [
      overlayItem({
        id: 'start-backfill',
        archetype: 'modal-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Запустить бэкфилл' },
        evidence: {
          source: 'src/app/(dashboard)/settings/backfill/page.tsx',
          anchor: 'Запустить бэкфилл',
        },
      }),
      overlayItem({
        id: 'backfill-error-log',
        archetype: 'modal-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Показать ошибку для ', match: 'prefix' },
        evidence: {
          source: 'src/app/(dashboard)/settings/backfill/components/BackfillErrorLog.tsx',
          anchor: 'aria-label={`Показать ошибку для',
        },
      }),
    ],
    '/settings/expenses': [
      overlayItem({
        id: 'expense-form',
        archetype: 'modal-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Добавить расход' },
        evidence: {
          source: 'src/app/(dashboard)/settings/expenses/page.tsx',
          anchor: 'Добавить расход',
        },
      }),
      overlayItem({
        id: 'expense-delete',
        archetype: 'modal-alert-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Удалить расход ', match: 'prefix' },
        evidence: {
          source: 'src/app/(dashboard)/settings/expenses/components/ExpenseTable.tsx',
          anchor: 'aria-label={`Удалить расход',
        },
      }),
    ],
    '/settings/notifications': [
      overlayItem({
        id: 'telegram-binding',
        archetype: 'modal-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Подключить Telegram' },
        evidence: {
          source: 'src/app/(dashboard)/settings/notifications/NotificationsHeroBanner.tsx',
          anchor: 'aria-label="Подключить Telegram"',
        },
      }),
      overlayItem({
        id: 'telegram-unbind',
        archetype: 'modal-alert-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Отключить Telegram' },
        evidence: {
          source: 'src/components/notifications/TelegramBindingCard.tsx',
          anchor: 'aria-label="Отключить Telegram"',
        },
      }),
    ],
    '/shipments': [
      overlayItem({
        id: 'create-shipment',
        archetype: 'modal-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Создать отправку' },
        evidence: {
          source: 'src/app/(dashboard)/shipments/page.tsx',
          anchor: 'Создать отправку',
        },
      }),
    ],
    '/monitoring': [
      overlayItem({
        id: 'health-report',
        archetype: 'modal-sheet',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Открыть отчёт', match: 'prefix' },
        evidence: {
          source: 'src/app/(dashboard)/monitoring/components/HealthReportSheet.tsx',
          anchor: 'aria-label="Отчёт о здоровье системы"',
        },
      }),
      overlayItem({
        id: 'recovery-confirmation',
        archetype: 'modal-alert-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Восстановить', match: 'prefix' },
        evidence: {
          source: 'src/app/(dashboard)/monitoring/components/RecoveryPanelSubcomponents.tsx',
          anchor: '<AlertDialogTrigger asChild>',
        },
      }),
    ],
    '/supplies': [
      overlayItem({
        id: 'create-supply',
        archetype: 'modal-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Создать поставку', match: 'prefix' },
        evidence: {
          source: 'src/components/custom/supplies/CreateSupplyModal.tsx',
          anchor: '<DialogTitle>Новая поставка</DialogTitle>',
        },
      }),
    ],
    '/supplies/[id]': [
      overlayItem({
        id: 'order-picker',
        archetype: 'modal-sheet',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Добавить заказы', match: 'prefix' },
        evidence: {
          source: 'src/components/custom/supplies/OrderPickerDrawer.tsx',
          anchor: '<SheetTitle>Добавить заказы в поставку</SheetTitle>',
        },
      }),
      overlayItem({
        id: 'close-supply',
        archetype: 'modal-alert-dialog',
        defaultState: 'closed',
        trigger: { role: 'button', name: 'Закрыть поставку', match: 'prefix' },
        evidence: {
          source: 'src/components/custom/supplies/CloseSupplyDialog.tsx',
          anchor: 'Закрыть поставку',
        },
      }),
    ],
  })

const PROTECTED_ROUTE_PREFIXES = [
  '/analytics',
  '/dashboard',
  '/automation',
  '/cogs',
  '/communications',
  '/finances',
  '/monitor',
  '/monitoring',
  '/moysklad',
  '/orders',
  '/products',
  '/settings',
  '/shipments',
  '/supplies',
] as const

function isProtectedRoute(route: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(prefix => route === prefix || route.startsWith(`${prefix}/`))
}

const TABLE_INVENTORY: Readonly<Record<string, readonly Story1743TableSurface[]>> = Object.freeze({
  '/analytics': [
    tableSurface('/analytics', {
      id: 'financial-summary-revenue',
      accessibleName: 'Доходы',
      source: 'src/components/custom/financial-summary/RevenueSection.tsx',
      anchor: '<TableCaption className="sr-only">Доходы</TableCaption>',
    }),
    tableSurface('/analytics', {
      id: 'financial-summary-payout',
      accessibleName: 'Итого к оплате',
      source: 'src/components/custom/financial-summary/PayoutSection.tsx',
      anchor: '<TableCaption className="sr-only">Итого к оплате</TableCaption>',
    }),
    tableSurface('/analytics', {
      id: 'financial-summary-expenses',
      accessibleName: 'Расходы Wildberries',
      source: 'src/components/custom/financial-summary/ExpensesSection.tsx',
      anchor: '<TableCaption className="sr-only">Расходы Wildberries</TableCaption>',
    }),
    tableSurface('/analytics', {
      id: 'financial-summary-compensations',
      accessibleName: 'Компенсации',
      source: 'src/components/custom/financial-summary/CompensationsSection.tsx',
      anchor: '<TableCaption className="sr-only">Компенсации</TableCaption>',
    }),
    tableSurface('/analytics', {
      id: 'financial-summary-cogs',
      accessibleName: 'Себестоимость (COGS)',
      source: 'src/components/custom/financial-summary/CogsSection.tsx',
      anchor: '<TableCaption className="sr-only">Себестоимость (COGS)</TableCaption>',
    }),
    tableSurface('/analytics', {
      id: 'financial-summary-profit',
      accessibleName: 'Чистая прибыль',
      source: 'src/components/custom/financial-summary/ProfitSection.tsx',
      anchor: '<TableCaption className="sr-only">Чистая прибыль</TableCaption>',
    }),
  ],
  '/analytics/finance-history': [
    tableSurface('/analytics/finance-history', {
      id: 'finance-history',
      accessibleName: 'Финансовый отчёт по неделям',
      source: 'src/components/custom/finance-history/FinanceHistoryTable.tsx',
      anchor: 'export function FinanceHistoryTable',
    }),
  ],
  '/analytics/pricing': [
    tableSurface('/analytics/pricing', {
      id: 'pricing-recommendations',
      accessibleName: 'Рекомендации по ценам',
      source: 'src/app/(dashboard)/analytics/pricing/components/PricingTable.tsx',
      anchor: 'scrollContainerAriaLabel="Рекомендации по ценам"',
    }),
    tableSurface('/analytics/pricing', {
      id: 'pricing-elasticity',
      accessibleName: 'Эластичность цен по товарам',
      source: 'src/app/(dashboard)/analytics/pricing/components/ElasticitySection.tsx',
      anchor: 'scrollContainerAriaLabel="Эластичность цен по товарам"',
    }),
  ],
  '/analytics/reorder': [
    tableSurface('/analytics/reorder', {
      id: 'reorder-recommendations',
      accessibleName: 'Рекомендации по пополнению запасов',
      source: 'src/app/(dashboard)/analytics/reorder/components/ReorderTable.tsx',
      anchor: '<TableCaption className="sr-only">Рекомендации по пополнению запасов</TableCaption>',
    }),
  ],
  '/analytics/sku': [
    tableSurface('/analytics/sku', {
      id: 'sku-financials',
      accessibleName: 'Маржинальность по товарам',
      source: 'src/components/custom/sku-financials/SkuFinancialsTable.tsx',
      anchor: 'export function SkuFinancialsTable',
      profile: 'sortable',
    }),
  ],
  '/analytics/acquiring': [
    tableSurface('/analytics/acquiring', {
      id: 'acquiring-reports',
      accessibleName: 'Отчёты эквайринга',
      source: 'src/app/(dashboard)/analytics/acquiring/components/AcquiringReportsTable.tsx',
      anchor: '<TableCaption>Отчёты эквайринга</TableCaption>',
    }),
  ],
  '/analytics/acquiring/reports/[id]': [
    tableSurface('/analytics/acquiring/reports/[id]', {
      id: 'acquiring-report-transactions',
      accessibleName: 'Транзакции отчёта #',
      source:
        'src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringReportDetailPage.tsx',
      anchor: 'caption={`Транзакции отчёта #${reportId}`}',
    }),
  ],
  '/analytics/buyout': [
    tableSurface('/analytics/buyout', {
      id: 'buyout-products',
      accessibleName: 'Таблица выкупов',
      source: 'src/app/(dashboard)/analytics/buyout/components/BuyoutTable.tsx',
      anchor: 'aria-label="Таблица выкупов"',
      profile: 'sortable',
    }),
  ],
  '/analytics/buyout-reconciliation': [
    tableSurface('/analytics/buyout-reconciliation', {
      id: 'buyout-reconciliation',
      accessibleName: 'Реконсиляция выкупов ',
      source:
        'src/app/(dashboard)/analytics/buyout-reconciliation/components/ReconciliationTable.tsx',
      anchor: '<TableCaption>Реконсиляция выкупов ',
    }),
  ],
  '/analytics/fbs-stock': [
    tableSurface('/analytics/fbs-stock', {
      id: 'fbs-stock-groups',
      accessibleName: 'Остатки FBS по товарным группам',
      source: 'src/app/(dashboard)/analytics/fbs-stock/components/FbsStockGroupsSection.tsx',
      anchor: '<TableCaption>Остатки FBS по товарным группам</TableCaption>',
    }),
    tableSurface('/analytics/fbs-stock', {
      id: 'fbs-stock-regions',
      accessibleName: 'Остатки FBS по регионам',
      source: 'src/app/(dashboard)/analytics/fbs-stock/components/FbsStockRegionsSection.tsx',
      anchor: '<TableCaption>Остатки FBS по регионам</TableCaption>',
    }),
    tableSurface('/analytics/fbs-stock', {
      id: 'fbs-stock-sizes',
      accessibleName: 'Остатки FBS по размерам',
      source: 'src/app/(dashboard)/analytics/fbs-stock/components/FbsStockSizesSection.tsx',
      anchor: '<TableCaption>Остатки FBS по размерам</TableCaption>',
    }),
  ],
  '/analytics/funnel': [
    tableSurface('/analytics/funnel', {
      id: 'funnel-days',
      accessibleName: 'Воронка продаж по товарам за период',
      source: 'src/app/(dashboard)/analytics/funnel/components/FunnelTable.tsx',
      anchor: '<TableCaption>',
    }),
  ],
  '/analytics/gaps': [
    tableSurface('/analytics/gaps', {
      id: 'financial-data-gaps',
      accessibleName: 'Пропущенные дни в финансовых данных',
      source: 'src/app/(dashboard)/analytics/gaps/components/GapsTable.tsx',
      anchor: '<TableCaption>Пропущенные дни в финансовых данных</TableCaption>',
    }),
  ],
  '/analytics/unit-economics': [
    tableSurface('/analytics/unit-economics', {
      id: 'unit-economics-products',
      accessibleName: 'Юнит-экономика по товарам',
      source: 'src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsTable.tsx',
      anchor: 'aria-label="Юнит-экономика по товарам"',
      profile: 'sortable',
    }),
  ],
  '/analytics/liquidity': [
    tableSurface('/analytics/liquidity', {
      id: 'liquidity-products',
      accessibleName: 'Ликвидность товаров по SKU',
      source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidityTable.tsx',
      anchor: '<TableCaption>Ликвидность товаров по SKU</TableCaption>',
      profile: 'sortable',
    }),
  ],
  '/analytics/returns': [
    tableSurface('/analytics/returns', {
      id: 'returns-by-sku',
      accessibleName: 'Возвраты по SKU',
      source: 'src/app/(dashboard)/analytics/returns/components/ReturnsTable.tsx',
      anchor: '<TableCaption>Возвраты по SKU</TableCaption>',
    }),
  ],
  '/analytics/storage': [
    tableSurface('/analytics/storage', {
      id: 'top-paid-storage-consumers',
      accessibleName: 'Топ товаров по расходам на хранение',
      source: 'src/app/(dashboard)/analytics/storage/components/TopConsumersWidget.tsx',
      anchor:
        '<TableCaption className="sr-only">Топ товаров по расходам на хранение</TableCaption>',
    }),
    tableSurface('/analytics/storage', {
      id: 'paid-storage-by-sku',
      accessibleName: 'Расходы на платное хранение по товарам за выбранный период',
      source: 'src/app/(dashboard)/analytics/storage/components/StorageBySkuTable.tsx',
      anchor:
        '<TableCaption>Расходы на платное хранение по товарам за выбранный период</TableCaption>',
      profile: 'sortable',
    }),
  ],
  '/analytics/supply-planning': [
    tableSurface('/analytics/supply-planning', {
      id: 'supply-planning-skus',
      accessibleName: 'Планирование поставок по артикулам',
      source: 'src/app/(dashboard)/analytics/supply-planning/components/SupplyPlanningTable.tsx',
      anchor: 'aria-label="Таблица планирования поставок по артикулам"',
      profile: 'sortable',
    }),
  ],
  '/analytics/advertising': [
    tableSurface('/analytics/advertising', {
      id: 'advertising-metrics',
      accessibleName: 'Таблица рекламных метрик',
      source:
        'src/app/(dashboard)/analytics/advertising/components/performance-table/PerformanceMetricsTable.tsx',
      anchor: 'aria-label="Таблица рекламных метрик"',
      profile: 'sortable',
    }),
    tableSurface('/analytics/advertising', {
      id: 'advertising-cannibalization-risk',
      accessibleName: 'Таблица риска каннибализации',
      source: 'src/app/(dashboard)/analytics/advertising/components/CannibalizationSection.tsx',
      anchor: 'aria-label="Таблица риска каннибализации"',
    }),
  ],
  '/analytics/brand': [
    tableSurface('/analytics/brand', {
      id: 'margin-by-brand',
      accessibleName: 'Таблица маржинальности по брендам',
      source: 'src/components/custom/MarginByBrandTable.tsx',
      anchor: '<TableCaption>Таблица маржинальности по брендам</TableCaption>',
      profile: 'sortable',
    }),
  ],
  '/analytics/category': [
    tableSurface('/analytics/category', {
      id: 'margin-by-category',
      accessibleName: 'Таблица маржинальности по категориям',
      source: 'src/components/custom/MarginByCategoryTable.tsx',
      anchor: '<TableCaption>Таблица маржинальности по категориям</TableCaption>',
      profile: 'sortable',
    }),
  ],
  '/analytics/cross-reference': [
    tableSurface('/analytics/cross-reference', {
      id: 'cross-reference',
      accessibleName: 'Таблица кросс-анализа',
      source: 'src/app/(dashboard)/analytics/cross-reference/components/CrossReferenceTable.tsx',
      anchor: 'aria-label="Таблица кросс-анализа"',
    }),
  ],
  '/analytics/search': [
    tableSurface('/analytics/search', {
      id: 'search-orders',
      accessibleName: 'Заказы из поиска',
      source: 'src/app/(dashboard)/analytics/search/components/SearchOrdersTable.tsx',
      anchor: 'aria-label="Заказы из поиска"',
      profile: 'sortable',
    }),
  ],
  '/analytics/ai-admin/anomalies': [
    tableSurface('/analytics/ai-admin/anomalies', {
      id: 'ai-anomalies',
      accessibleName: 'Аномалии ИИ-прогнозов',
      source: 'src/app/(dashboard)/analytics/ai-admin/anomalies/components/AnomaliesList.tsx',
      anchor: '<TableCaption>Аномалии ИИ-прогнозов</TableCaption>',
    }),
  ],
  '/analytics/ai-admin/models': [
    tableSurface('/analytics/ai-admin/models', {
      id: 'ai-admin-model-versions',
      accessibleName: 'Версии моделей под управлением',
      source: 'src/app/(dashboard)/analytics/ai-admin/models/components/AdminModelsTable.tsx',
      anchor: '<TableCaption>Версии моделей под управлением</TableCaption>',
    }),
  ],
  '/analytics/forecast': [
    tableSurface('/analytics/forecast', {
      id: 'forecast-sales',
      accessibleName: 'Таблица прогноза продаж',
      source: 'src/app/(dashboard)/analytics/forecast/components/ForecastTable.tsx',
      anchor: 'aria-label="Таблица прогноза продаж"',
    }),
  ],
  '/analytics/forecast-accuracy': [
    tableSurface('/analytics/forecast-accuracy', {
      id: 'forecast-accuracy-by-sku',
      accessibleName: 'Точность прогнозов по SKU',
      source: 'src/app/(dashboard)/analytics/forecast-accuracy/components/SkuBreakdownTable.tsx',
      anchor: '<TableCaption>Точность прогнозов по SKU</TableCaption>',
    }),
    tableSurface('/analytics/forecast-accuracy', {
      id: 'forecast-accuracy-by-horizon',
      accessibleName: 'Точность прогнозов по горизонтам',
      source:
        'src/app/(dashboard)/analytics/forecast-accuracy/components/HorizonBreakdownTable.tsx',
      anchor: '<TableCaption>Точность прогнозов по горизонтам</TableCaption>',
    }),
  ],
  '/analytics/models': [
    tableSurface('/analytics/models', {
      id: 'ml-models',
      accessibleName: 'Список ML-моделей вашего кабинета',
      source: 'src/app/(dashboard)/analytics/models/components/ModelListSection.tsx',
      anchor: '<TableCaption>Список ML-моделей вашего кабинета</TableCaption>',
    }),
  ],
  '/analytics/models/[id]/evaluations': [
    tableSurface('/analytics/models/[id]/evaluations', {
      id: 'model-evaluations',
      accessibleName: 'Оценки точности модели — ',
      source:
        'src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsList.tsx',
      anchor: 'captionText={`Оценки точности модели — ',
    }),
  ],
  '/analytics/models/[id]/evaluations/sku-accuracy': [
    tableSurface('/analytics/models/[id]/evaluations/sku-accuracy', {
      id: 'model-sku-accuracy',
      accessibleName: 'Точность по SKU — модель ',
      source:
        'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyTable.tsx',
      anchor: '<TableCaption>Точность по SKU — модель ',
      profile: 'sortable',
    }),
  ],
  '/analytics/models/[id]/performance': [
    tableSurface('/analytics/models/[id]/performance', {
      id: 'model-performance-evaluations',
      accessibleName: 'История оценок — ',
      source:
        'src/app/(dashboard)/analytics/models/[id]/performance/components/ModelPerformanceDetail.tsx',
      anchor: 'captionText={`История оценок — ',
    }),
  ],
  '/analytics/dashboard': [
    tableSurface('/analytics/dashboard', {
      id: 'top-products',
      accessibleName: 'Топ-10 товаров по прибыли',
      source: 'src/components/custom/TopProductsTable.tsx',
      anchor: 'aria-label="Топ-10 товаров по прибыли"',
    }),
    tableSurface('/analytics/dashboard', {
      id: 'top-brands',
      accessibleName: 'Топ-5 брендов по прибыли',
      source: 'src/components/custom/TopBrandsTable.tsx',
      anchor: 'aria-label="Топ-5 брендов по прибыли"',
    }),
  ],
  '/cogs/history': [
    tableSurface('/cogs/history', {
      id: 'cogs-history',
      accessibleName: 'История себестоимости — ',
      source: 'src/app/(dashboard)/cogs/history/page.tsx',
      anchor: 'captionText={`История себестоимости — ',
    }),
  ],
  '/cogs': [
    tableSurface('/cogs', {
      id: 'cogs-product-list',
      accessibleName: 'Список товаров',
      source: 'src/components/custom/ProductList.tsx',
      anchor: 'aria-label="Список товаров"',
      profile: 'actionable',
    }),
  ],
  '/cogs/bulk': [
    tableSurface('/cogs/bulk', {
      id: 'bulk-cogs-products',
      accessibleName: 'Товары без назначенной себестоимости',
      source: 'src/components/custom/bulk-cogs/BulkCogsProductTable.tsx',
      anchor:
        '<TableCaption className="sr-only">Товары без назначенной себестоимости</TableCaption>',
    }),
  ],
  '/finances': [
    tableSurface('/finances', {
      id: 'financial-documents',
      accessibleName: 'Финансовые документы Wildberries',
      source: 'src/app/(dashboard)/finances/page.tsx',
      anchor: 'captionText="Финансовые документы Wildberries"',
    }),
  ],
  '/monitor': [
    tableSurface('/monitor', {
      id: 'monitor-metrics',
      accessibleName: 'Сводная таблица метрик за 4 периода',
      source: 'src/app/(dashboard)/monitor/components/MonitorMetricsTable.tsx',
      anchor: '<TableCaption className="sr-only">Сводная таблица метрик за 4 периода',
    }),
  ],
  '/monitoring': [
    tableSurface('/monitoring', {
      id: 'data-completeness',
      accessibleName: 'Состояние источников данных',
      source: 'src/app/(dashboard)/monitoring/components/DataCompletenessTable.tsx',
      anchor: '<TableCaption>Состояние источников данных</TableCaption>',
    }),
  ],
  '/orders': [
    tableSurface('/orders', {
      id: 'fbs-orders',
      accessibleName: 'Детализация по заказам',
      source: 'src/components/custom/orders/OrdersTable.tsx',
      anchor: 'aria-label="Детализация по заказам"',
      profile: 'sortable',
    }),
  ],
  '/orders/fbo': [
    tableSurface('/orders/fbo', {
      id: 'fbo-orders',
      accessibleName: 'Заказы FBO Wildberries',
      source: 'src/app/(dashboard)/orders/fbo/components/FboOrdersPageContent.tsx',
      anchor: 'captionText="Заказы FBO Wildberries"',
    }),
    tableSurface('/orders/fbo', {
      id: 'fbo-sales',
      accessibleName: 'Продажи FBO Wildberries',
      source: 'src/app/(dashboard)/orders/fbo/components/FboOrdersPageContent.tsx',
      anchor: 'captionText="Продажи FBO Wildberries"',
    }),
  ],
  '/orders/integrity': [
    tableSurface('/orders/integrity', {
      id: 'orders-reconciliation-by-date',
      accessibleName: 'Сверка заказов по датам',
      source: 'src/app/(dashboard)/orders/integrity/components/ReconciliationSection.tsx',
      anchor: '<TableCaption className="sr-only">Сверка заказов по датам</TableCaption>',
    }),
  ],
  '/products': [
    tableSurface('/products', {
      id: 'product-list',
      accessibleName: 'Список товаров',
      source: 'src/components/custom/ProductList.tsx',
      anchor: 'aria-label="Список товаров"',
      profile: 'actionable',
    }),
  ],
  '/settings/expenses': [
    tableSurface('/settings/expenses', {
      id: 'operating-expenses',
      accessibleName: 'Расходы за ',
      source: 'src/app/(dashboard)/settings/expenses/components/ExpenseTable.tsx',
      anchor: '<caption className="sr-only">Расходы за {period}</caption>',
    }),
  ],
  '/settings/backfill': [
    tableSurface('/settings/backfill', {
      id: 'backfill-cabinet-status',
      accessibleName: 'Состояние загрузки исторических данных по кабинетам',
      source: 'src/app/(dashboard)/settings/backfill/components/BackfillStatusTable.tsx',
      anchor: 'caption="Состояние загрузки исторических данных по кабинетам"',
      profile: 'actionable',
      narrowWidthRationale:
        'the route intentionally presents the same cabinet data as labelled responsive cards',
    }),
  ],
  '/settings/tariffs': [
    tableSurface('/settings/tariffs', {
      id: 'fbo-logistics-tiers',
      accessibleName: 'Тарифные уровни по объёму',
      source: 'src/components/custom/tariffs-admin/LogisticsRatesSection.tsx',
      anchor: 'label="Тарифные уровни по объёму"',
    }),
  ],
  '/shipments': [
    tableSurface('/shipments', {
      id: 'shipments',
      accessibleName: 'Отправки',
      source: 'src/components/custom/shipments/ShipmentsTable.tsx',
      anchor: 'export function ShipmentsTable',
      profile: 'sortable',
    }),
  ],
  '/shipments/[id]': [
    tableSurface('/shipments/[id]', {
      id: 'shipment-box-lines',
      accessibleName: 'Товары в отправке',
      source: 'src/components/custom/shipments/BoxLineTable.tsx',
      anchor: 'export function BoxLineTable',
    }),
  ],
  '/shipments/box-types': [
    tableSurface('/shipments/box-types', {
      id: 'box-types',
      accessibleName: 'Типы коробок',
      source: 'src/components/custom/box-types/BoxTypesTable.tsx',
      anchor: 'export function BoxTypesTable',
      profile: 'sortable',
    }),
  ],
  '/shipments/sku-packaging': [
    tableSurface('/shipments/sku-packaging', {
      id: 'sku-packaging',
      accessibleName: 'Упаковка товаров',
      source: 'src/components/custom/sku-packaging/SkuPackagingTable.tsx',
      anchor: 'export function SkuPackagingTable',
      profile: 'sortable',
    }),
  ],
  '/supplies': [
    tableSurface('/supplies', {
      id: 'supplies',
      accessibleName: 'Поставки FBS',
      source: 'src/components/custom/supplies/SuppliesTable.tsx',
      anchor: 'export function SuppliesTable',
      profile: 'sortable',
    }),
  ],
  '/supplies/[id]': [
    tableSurface('/supplies/[id]', {
      id: 'supply-orders',
      accessibleName: 'Заказы в поставке',
      source: 'src/components/custom/supplies/SupplyOrdersTable.tsx',
      anchor: '<caption className="sr-only">Заказы в поставке</caption>',
    }),
  ],
})

const CHART_INVENTORY: Readonly<Record<string, readonly Story1743ChartSurface[]>> = Object.freeze({
  '/analytics/buyout': [
    chartSurface('/analytics/buyout', {
      id: 'buyout-daily-trend',
      accessibleName: 'График ежедневной динамики выкупа',
      alternativeAccessibleName: 'Данные графика ежедневной динамики выкупа',
      source: 'src/app/(dashboard)/analytics/buyout/components/BuyoutTrendChart.tsx',
      anchor: 'label="График ежедневной динамики выкупа"',
      alternativeSource: 'src/app/(dashboard)/analytics/buyout/components/BuyoutTrendDataTable.tsx',
      alternativeAnchor:
        '<table id={BUYOUT_TREND_DATA_TABLE_ID} className="sr-only" data-chart-summary>',
    }),
  ],
  '/analytics/orders': [
    chartSurface('/analytics/orders', {
      id: 'fbs-orders-trends',
      accessibleName: 'График динамики заказов FBS',
      alternativeAccessibleName: 'Данные графика динамики заказов FBS',
      source: 'src/components/custom/analytics/FbsTrendsChart.tsx',
      anchor: 'aria-label="График динамики заказов FBS"',
      alternativeSource: 'src/components/custom/analytics/FbsTrendsChart.tsx',
      alternativeAnchor: '<table id={FBS_TRENDS_TABLE_ID} className="sr-only" data-chart-summary>',
    }),
  ],
  '/analytics/time-period': [
    chartSurface('/analytics/time-period', {
      id: 'margin-trend',
      accessibleName: 'График маржинальности по неделям',
      alternativeAccessibleName: 'Данные графика маржинальности по неделям',
      source: 'src/components/custom/MarginTrendChart.tsx',
      anchor: 'aria-label="График маржинальности по неделям"',
      alternativeSource: 'src/components/custom/margin-trend-chart/MarginTrendDataTable.tsx',
      alternativeAnchor:
        '<table id={MARGIN_TREND_DATA_TABLE_ID} className="sr-only" data-chart-summary>',
    }),
  ],
  '/analytics/unit-economics': [
    chartSurface('/analytics/unit-economics', {
      id: 'unit-economics-waterfall',
      accessibleName: 'График структуры затрат:',
      alternativeAccessibleName: 'Структура затрат:',
      source: 'src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsWaterfall.tsx',
      anchor: 'label={`График структуры затрат:',
      alternativeSource:
        'src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsWaterfallSummary.tsx',
      alternativeAnchor: '<caption>Структура затрат:',
    }),
  ],
  '/analytics/liquidity': [
    chartSurface('/analytics/liquidity', {
      id: 'liquidity-distribution',
      accessibleName: 'График распределения товаров по категориям ликвидности',
      alternativeAccessibleName: 'Распределение товаров по ликвидности',
      source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidityDistributionChart.tsx',
      anchor: 'label="График распределения товаров по категориям ликвидности"',
      alternativeSource:
        'src/app/(dashboard)/analytics/liquidity/components/LiquidityDistributionSummary.tsx',
      alternativeAnchor: '<caption>Распределение товаров по ликвидности</caption>',
    }),
    chartSurface('/analytics/liquidity', {
      id: 'liquidity-trend',
      accessibleName: 'График динамики замороженного капитала и среднего оборота',
      alternativeAccessibleName: 'Динамика ликвидности по дням',
      source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidityTrendChart.tsx',
      anchor: 'label="График динамики замороженного капитала и среднего оборота"',
      alternativeSource:
        'src/app/(dashboard)/analytics/liquidity/components/LiquidityTrendSummary.tsx',
      alternativeAnchor: '<caption>Динамика ликвидности по дням</caption>',
    }),
    chartSurface('/analytics/liquidity', {
      id: 'liquidity-distribution-trend',
      accessibleName: 'График динамики распределения ликвидности по категориям',
      alternativeAccessibleName: 'Динамика ликвидности по дням',
      source:
        'src/app/(dashboard)/analytics/liquidity/components/LiquidityDistributionTrendChart.tsx',
      anchor: 'label="График динамики распределения ликвидности по категориям"',
      alternativeSource:
        'src/app/(dashboard)/analytics/liquidity/components/LiquidityTrendSummary.tsx',
      alternativeAnchor: '<caption>Динамика ликвидности по дням</caption>',
    }),
  ],
  '/analytics/returns': [
    chartSurface('/analytics/returns', {
      id: 'returns-daily-trend',
      accessibleName: 'График возвратов по дням:',
      alternativeAccessibleName: 'Данные о возвратах по дням',
      source: 'src/app/(dashboard)/analytics/returns/components/ReturnTrendChart.tsx',
      anchor: 'label={`График возвратов по дням:',
      alternativeSource: 'src/app/(dashboard)/analytics/returns/components/ReturnTrendSrTable.tsx',
      alternativeAnchor: 'Данные о возвратах по дням',
    }),
  ],
  '/analytics/storage': [
    chartSurface('/analytics/storage', {
      id: 'paid-storage-weekly-trend',
      accessibleName: 'График расходов на платное хранение по неделям',
      alternativeAccessibleName: 'Данные о расходах на платное хранение по неделям',
      source: 'src/app/(dashboard)/analytics/storage/components/StorageTrendsChart.tsx',
      anchor: 'label="График расходов на платное хранение по неделям"',
      alternativeSource: 'src/app/(dashboard)/analytics/storage/components/StorageTrendSrTable.tsx',
      alternativeAnchor: 'data-chart-summary',
    }),
  ],
  '/analytics/advertising': [
    chartSurface('/analytics/advertising', {
      id: 'advertising-daily-trend',
      accessibleName: 'График ежедневной динамики рекламных метрик',
      alternativeAccessibleName: 'Данные рекламной динамики по дням.',
      source: 'src/app/(dashboard)/analytics/advertising/components/DailyTrendChart.tsx',
      anchor: 'label="График ежедневной динамики рекламных метрик"',
      alternativeSource:
        'src/app/(dashboard)/analytics/advertising/components/DailyTrendSrTable.tsx',
      alternativeAnchor: 'Данные рекламной динамики по дням.',
    }),
    chartSurface('/analytics/advertising', {
      id: 'advertising-cost-discrepancy',
      accessibleName: 'Сравнение рекламных расходов: платформа и факт',
      alternativeAccessibleName: 'Сравнение рекламных расходов по слоям, рубли',
      source: 'src/app/(dashboard)/analytics/advertising/components/AdCostDiscrepancyChart.tsx',
      anchor: 'label="Сравнение рекламных расходов: платформа и факт"',
      alternativeSource:
        'src/app/(dashboard)/analytics/advertising/components/AdCostDiscrepancyChart.tsx',
      alternativeAnchor: '<caption>Сравнение рекламных расходов по слоям, рубли</caption>',
    }),
  ],
  '/analytics/brand-share': [
    chartSurface('/analytics/brand-share', {
      id: 'brand-share-daily',
      accessibleName: 'График доли бренда в категории по дням',
      alternativeAccessibleName: 'Данные доли бренда по дням.',
      source: 'src/components/custom/analytics/BrandShareChart.tsx',
      anchor: 'label="График доли бренда в категории по дням"',
      alternativeSource: 'src/components/custom/analytics/brand-share-sr-table.tsx',
      alternativeAnchor: 'Данные доли бренда по дням.',
    }),
  ],
  '/analytics/search': [
    chartSurface('/analytics/search', {
      id: 'search-orders-daily',
      accessibleName: 'Заказы из поиска:',
      alternativeAccessibleName: 'Заказы из поиска',
      source: 'src/app/(dashboard)/analytics/search/components/SearchOrdersChart.tsx',
      anchor: 'aria-label={`${TITLE}: ${dayCountLabel}`}',
      alternativeSource: 'src/app/(dashboard)/analytics/search/components/SearchOrdersTable.tsx',
      alternativeAnchor: 'aria-label="Заказы из поиска"',
    }),
  ],
  '/analytics/forecast': [
    chartSurface('/analytics/forecast', {
      id: 'sales-forecast',
      accessibleName: 'График прогноза продаж с доверительным интервалом',
      alternativeAccessibleName: 'Данные графика прогноза продаж по дням.',
      source: 'src/app/(dashboard)/analytics/forecast/components/ForecastChart.tsx',
      anchor: 'aria-label="График прогноза продаж с доверительным интервалом"',
      alternativeSource:
        'src/app/(dashboard)/analytics/forecast/components/ForecastChartSrTable.tsx',
      alternativeAnchor: 'Данные графика прогноза продаж по дням.',
    }),
  ],
  '/analytics/models/[id]/performance': [
    chartSurface('/analytics/models/[id]/performance', {
      id: 'model-mape-trend',
      accessibleName: 'График тренда точности модели MAPE',
      alternativeAccessibleName: 'История оценок — ',
      source: 'src/app/(dashboard)/analytics/models/[id]/performance/components/MapeTrendChart.tsx',
      anchor: 'aria-label="График тренда точности модели MAPE"',
      alternativeSource:
        'src/app/(dashboard)/analytics/models/[id]/performance/components/ModelPerformanceDetail.tsx',
      alternativeAnchor: 'captionText={`История оценок — ',
    }),
  ],
  '/dashboard': [
    chartSurface('/dashboard', {
      id: 'daily-breakdown',
      accessibleName: 'График детализации по дням за',
      alternativeAccessibleName: 'Данные графика детализации по дням за',
      source: 'src/components/custom/dashboard/DailyBreakdownChart.tsx',
      anchor: 'aria-label={`График детализации по дням за',
      alternativeSource: 'src/components/custom/dashboard/DailyBreakdownChart.tsx',
      alternativeAnchor: '<caption>{`Данные графика детализации по дням за',
    }),
    chartSurface('/dashboard', {
      id: 'storage-trend',
      accessibleName: 'График расходов на хранение на главной странице',
      alternativeAccessibleName: 'Данные графика расходов на хранение на главной странице',
      source: 'src/components/custom/dashboard/StorageTrendsChart.tsx',
      anchor: 'label="График расходов на хранение на главной странице"',
      alternativeSource: 'src/components/custom/dashboard/DashboardStorageTrendDataTable.tsx',
      alternativeAnchor: 'data-chart-summary',
    }),
  ],
})

type ConditionalRationales = Readonly<Record<string, Readonly<Record<string, string>>>>

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
  '/analytics/search': {
    'product-search':
      'The canonical cabinet renders the WB Jam subscription gate, so the entitled product-search trigger is not mounted.',
  },
  '/cogs/history': {
    'cogs-row-actions':
      'The canonical URL has no product id and no history rows, so row-owned action triggers are not mounted.',
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
})

function partitionInventory<TItem extends { id: string }>(
  route: string,
  inventory: readonly TItem[],
  rationales: ConditionalRationales
): {
  executed: readonly TItem[]
  conditional: readonly Story1743ConditionalInventoryItem<TItem>[]
} {
  const routeRationales = rationales[route] ?? {}
  const knownIds = new Set(inventory.map(item => item.id))
  for (const id of Object.keys(routeRationales)) {
    if (!knownIds.has(id)) throw new Error(`${route}: conditional inventory item is unknown: ${id}`)
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
        CONDITIONAL_OVERLAY_RATIONALES
      )
      const tables = partitionInventory(
        row.route,
        TABLE_INVENTORY[row.route] ?? [],
        CONDITIONAL_TABLE_RATIONALES
      )
      const charts = partitionInventory(
        row.route,
        CHART_INVENTORY[row.route] ?? [],
        CONDITIONAL_CHART_RATIONALES
      )
      return [
        row.route,
        {
          route: row.route,
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
            conditionalSurfaces: tables.conditional,
            evidenceSource: row.entry,
            emptyRationale: `${row.route}: the explicit table inventory expects exactly ${tables.executed.length} live semantic table surfaces and classifies ${tables.conditional.length} known conditional surfaces`,
          },
          chart: {
            disposition: 'executed' as const,
            expectedCount: charts.executed.length,
            surfaces: charts.executed,
            conditionalSurfaces: charts.conditional,
            evidenceSource: row.entry,
            emptyRationale: `${row.route}: the explicit chart inventory expects exactly ${charts.executed.length} live visual chart surfaces and classifies ${charts.conditional.length} known conditional surfaces`,
          },
        },
      ]
    })
  )
)
