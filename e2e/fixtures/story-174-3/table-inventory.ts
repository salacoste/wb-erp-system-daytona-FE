import { tableSurface } from './surface-types'
import type { Story1743TableSurface } from './surface-types'

export const TABLE_INVENTORY: Readonly<Record<string, readonly Story1743TableSurface[]>> =
  Object.freeze({
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
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/pricing/components/__tests__/PricingTable.test.tsx',
          scenarioId: 'opens the exact SKU recommendation from its focused row with Enter',
        },
      }),
      tableSurface('/analytics/pricing', {
        id: 'pricing-elasticity',
        accessibleName: 'Эластичность цен по товарам',
        source: 'src/app/(dashboard)/analytics/pricing/components/ElasticitySection.tsx',
        anchor: 'scrollContainerAriaLabel="Эластичность цен по товарам"',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/pricing/components/__tests__/ElasticitySkuDetail.test.tsx',
          scenarioId: 'toggles the exact SKU elasticity row by keyboard',
        },
      }),
    ],
    '/analytics/reorder': [
      tableSurface('/analytics/reorder', {
        id: 'reorder-recommendations',
        accessibleName: 'Рекомендации по пополнению запасов',
        source: 'src/app/(dashboard)/analytics/reorder/components/ReorderTable.tsx',
        anchor:
          '<TableCaption className="sr-only">Рекомендации по пополнению запасов</TableCaption>',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source: 'src/app/(dashboard)/analytics/reorder/__tests__/page.test.tsx',
          scenarioId: 'marks the exact pending recommendation as ordered from its row action',
        },
      }),
    ],
    '/analytics/sku': [
      tableSurface('/analytics/sku', {
        id: 'sku-financials',
        accessibleName: 'Маржинальность по товарам',
        source: 'src/components/custom/sku-financials/SkuFinancialsTable.tsx',
        anchor: 'export function SkuFinancialsTable',
        executedFeatures: ['sorting'],
      }),
    ],
    '/analytics/acquiring': [
      tableSurface('/analytics/acquiring', {
        id: 'acquiring-reports',
        accessibleName: 'Отчёты эквайринга',
        source: 'src/app/(dashboard)/analytics/acquiring/components/AcquiringReportsTable.tsx',
        anchor: '<TableCaption>Отчёты эквайринга</TableCaption>',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringReportsTable.test.tsx',
          scenarioId:
            'Детали links have unique per-row aria-labels naming their target report (AX contract)',
        },
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
        executedFeatures: ['sorting', 'pagination'],
        pagination: {
          previousName: 'Назад',
          nextName: 'Далее',
          source: 'src/app/(dashboard)/analytics/buyout/components/BuyoutTable.tsx',
          anchor: 'disabled={!pagination.hasMore}',
        },
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
        executedFeatures: ['pagination'],
        pagination: {
          previousName: 'Назад',
          nextName: 'Далее',
          source: 'src/app/(dashboard)/analytics/funnel/components/FunnelTable.tsx',
          anchor: 'disabled={!pagination.hasMore}',
        },
      }),
    ],
    '/analytics/gaps': [
      tableSurface('/analytics/gaps', {
        id: 'financial-data-gaps',
        accessibleName: 'Пропущенные дни в финансовых данных',
        source: 'src/app/(dashboard)/analytics/gaps/components/GapsTable.tsx',
        anchor: '<TableCaption>Пропущенные дни в финансовых данных</TableCaption>',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source: 'src/app/(dashboard)/analytics/gaps/components/__tests__/GapsTable.test.tsx',
          scenarioId: 'calls onAnalyze with correct date when clicked',
        },
      }),
    ],
    '/analytics/unit-economics': [
      tableSurface('/analytics/unit-economics', {
        id: 'unit-economics-products',
        accessibleName: 'Юнит-экономика по товарам',
        source: 'src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsTable.tsx',
        anchor: 'aria-label="Юнит-экономика по товарам"',
        executedFeatures: ['sorting'],
        notApplicableRationales: {
          pagination:
            '/analytics/unit-economics: unit-economics-products pagination controls are not rendered until the canonical dataset exceeds the page-size threshold',
        },
      }),
    ],
    '/analytics/liquidity': [
      tableSurface('/analytics/liquidity', {
        id: 'liquidity-products',
        accessibleName: 'Ликвидность товаров по SKU',
        source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidityTable.tsx',
        anchor: '<TableCaption>Ликвидность товаров по SKU</TableCaption>',
        executedFeatures: ['sorting', 'selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/liquidity/components/__tests__/LiquidityTable.test.tsx',
          scenarioId:
            'expands the exact SKU by keyboard and opens its liquidation planner without cross-triggering',
        },
      }),
    ],
    '/analytics/returns': [
      tableSurface('/analytics/returns', {
        id: 'returns-by-sku',
        accessibleName: 'Возвраты по SKU',
        source: 'src/app/(dashboard)/analytics/returns/components/ReturnsTable.tsx',
        anchor: '<TableCaption>Возвраты по SKU</TableCaption>',
        executedFeatures: ['pagination'],
        pagination: {
          previousName: 'В начало',
          nextName: 'Далее',
          source: 'src/app/(dashboard)/analytics/returns/components/ReturnsTable.tsx',
          anchor: 'disabled={!pagination.hasMore}',
        },
      }),
    ],
    '/analytics/storage': [
      tableSurface('/analytics/storage', {
        id: 'top-paid-storage-consumers',
        accessibleName: 'Топ товаров по расходам на хранение',
        source: 'src/app/(dashboard)/analytics/storage/components/TopConsumersWidget.tsx',
        anchor:
          '<TableCaption className="sr-only">Топ товаров по расходам на хранение</TableCaption>',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/storage/components/__tests__/TopConsumersWidget.test.tsx',
          scenarioId: 'calls onProductClick when row is clicked',
        },
      }),
      tableSurface('/analytics/storage', {
        id: 'paid-storage-by-sku',
        accessibleName: 'Расходы на платное хранение по товарам за выбранный период',
        source: 'src/app/(dashboard)/analytics/storage/components/StorageBySkuTable.tsx',
        anchor:
          '<TableCaption>Расходы на платное хранение по товарам за выбранный период</TableCaption>',
        executedFeatures: ['sorting', 'selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/storage/components/__tests__/StorageBySkuTable.test.tsx',
          scenarioId: 'calls onProductClick when row is clicked',
        },
      }),
    ],
    '/analytics/supply-planning': [
      tableSurface('/analytics/supply-planning', {
        id: 'supply-planning-skus',
        accessibleName: 'Планирование поставок по артикулам',
        source: 'src/app/(dashboard)/analytics/supply-planning/components/SupplyPlanningTable.tsx',
        anchor: 'aria-label="Таблица планирования поставок по артикулам"',
        executedFeatures: ['sorting', 'pagination'],
        pagination: {
          previousName: '‹',
          nextName: '›',
          source:
            'src/app/(dashboard)/analytics/supply-planning/components/SupplyTablePagination.tsx',
          anchor: 'onPageChange(prev => Math.min(totalPages, prev + 1))',
        },
      }),
    ],
    '/analytics/advertising': [
      tableSurface('/analytics/advertising', {
        id: 'advertising-metrics',
        accessibleName: 'Таблица рекламных метрик',
        source:
          'src/app/(dashboard)/analytics/advertising/components/performance-table/PerformanceMetricsTable.tsx',
        anchor: 'aria-label="Таблица рекламных метрик"',
        executedFeatures: ['sorting', 'selection-and-actions', 'pagination'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/advertising/components/performance-table/PerformanceMetricsTable.test.tsx',
          scenarioId:
            'preserves exact SKU and campaign detail links in actionable identifier cells',
        },
        pagination: {
          previousName: 'Предыдущая страница',
          nextName: 'Следующая страница',
          source:
            'src/app/(dashboard)/analytics/advertising/components/performance-table/PerformanceMetricsTable.tsx',
          anchor: 'aria-label="Следующая страница"',
        },
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
        executedFeatures: ['sorting'],
      }),
    ],
    '/analytics/category': [
      tableSurface('/analytics/category', {
        id: 'margin-by-category',
        accessibleName: 'Таблица маржинальности по категориям',
        source: 'src/components/custom/MarginByCategoryTable.tsx',
        anchor: '<TableCaption>Таблица маржинальности по категориям</TableCaption>',
        executedFeatures: ['sorting'],
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
        executedFeatures: ['sorting'],
      }),
    ],
    '/analytics/ai-admin/anomalies': [
      tableSurface('/analytics/ai-admin/anomalies', {
        id: 'ai-anomalies',
        accessibleName: 'Аномалии ИИ-прогнозов',
        source: 'src/app/(dashboard)/analytics/ai-admin/anomalies/components/AnomaliesList.tsx',
        anchor: '<TableCaption>Аномалии ИИ-прогнозов</TableCaption>',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/AnomaliesList.test.tsx',
          scenarioId:
            'opens the exact anomaly dialog by keyboard and restores focus when cancelled',
        },
      }),
    ],
    '/analytics/ai-admin/models': [
      tableSurface('/analytics/ai-admin/models', {
        id: 'ai-admin-model-versions',
        accessibleName: 'Версии моделей под управлением',
        source: 'src/app/(dashboard)/analytics/ai-admin/models/components/AdminModelsTable.tsx',
        anchor: '<TableCaption>Версии моделей под управлением</TableCaption>',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/AdminModelsList.test.tsx',
          scenarioId:
            '171.2 gap-5: focus returns to the invoking row rollback button after dialog close',
        },
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
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx',
          scenarioId: 'exposes model performance as a native named link',
        },
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
        executedFeatures: ['sorting', 'selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyTable.test.tsx',
          scenarioId: 'F-1: Enter key on row navigates to detail URL (keyboard accessibility)',
        },
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
        executedFeatures: ['sorting', 'selection-and-actions', 'pagination'],
        interactionOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/orders/__tests__/OrdersTable.test.tsx',
          scenarioId: 'calls onRowClick when activating the accessible open button with Enter',
        },
        pagination: {
          previousName: 'Предыдущая страница',
          nextName: 'Следующая страница',
          source: 'src/components/custom/orders/OrdersPagination.tsx',
          anchor: 'aria-label="Следующая страница"',
        },
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
      }),
    ],
    '/settings/expenses': [
      tableSurface('/settings/expenses', {
        id: 'operating-expenses',
        accessibleName: 'Расходы за ',
        source: 'src/app/(dashboard)/settings/expenses/components/ExpenseTable.tsx',
        anchor: '<caption className="sr-only">Расходы за {period}</caption>',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'playwright',
          source: 'e2e/expenses-page.spec.ts',
          scenarioId: 'contains focus and returns it to the invoking delete action',
        },
      }),
    ],
    '/settings/backfill': [
      tableSurface('/settings/backfill', {
        id: 'backfill-cabinet-status',
        accessibleName: 'Состояние загрузки исторических данных по кабинетам',
        source: 'src/app/(dashboard)/settings/backfill/components/BackfillStatusTable.tsx',
        anchor: 'caption="Состояние загрузки исторических данных по кабинетам"',
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
        executedFeatures: ['sorting', 'selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/shipments/__tests__/ShipmentsTable.test.tsx',
          scenarioId: 'names every row action with shipment identity and preserves detail routes',
        },
      }),
    ],
    '/shipments/[id]': [
      tableSurface('/shipments/[id]', {
        id: 'shipment-box-lines',
        accessibleName: 'Товары в отправке',
        source: 'src/components/custom/shipments/BoxLineTable.tsx',
        anchor: 'export function BoxLineTable',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/shipments/__tests__/BoxLineTable.test.tsx',
          scenarioId: 'returns focus to the exact add trigger when the form is cancelled',
        },
      }),
    ],
    '/shipments/box-types': [
      tableSurface('/shipments/box-types', {
        id: 'box-types',
        accessibleName: 'Типы коробок',
        source: 'src/components/custom/box-types/BoxTypesTable.tsx',
        anchor: 'export function BoxTypesTable',
        executedFeatures: ['sorting', 'selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/box-types/__tests__/BoxTypesTable.test.tsx',
          scenarioId: 'calls onEdit with the correct item when edit is clicked',
        },
      }),
    ],
    '/shipments/sku-packaging': [
      tableSurface('/shipments/sku-packaging', {
        id: 'sku-packaging',
        accessibleName: 'Упаковка товаров',
        source: 'src/components/custom/sku-packaging/SkuPackagingTable.tsx',
        anchor: 'export function SkuPackagingTable',
        executedFeatures: ['sorting', 'selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/sku-packaging/__tests__/SkuPackagingTable.test.tsx',
          scenarioId:
            'keeps SKU identity, package, status, units, and actions available in wide and narrow views',
        },
      }),
    ],
    '/supplies': [
      tableSurface('/supplies', {
        id: 'supplies',
        accessibleName: 'Поставки FBS',
        source: 'src/components/custom/supplies/SuppliesTable.tsx',
        anchor: 'export function SuppliesTable',
        executedFeatures: ['sorting', 'selection-and-actions', 'pagination'],
        interactionOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/supplies/__tests__/SuppliesTable.test.tsx',
          scenarioId: 'calls onRowClick when pressing Enter on focused row',
        },
        pagination: {
          previousName: 'Предыдущая страница',
          nextName: 'Следующая страница',
          source: 'src/components/custom/supplies/SuppliesPagination.tsx',
          anchor: 'aria-label="Следующая страница"',
        },
      }),
    ],
    '/supplies/[id]': [
      tableSurface('/supplies/[id]', {
        id: 'supply-orders',
        accessibleName: 'Заказы в поставке',
        source: 'src/components/custom/supplies/SupplyOrdersTable.tsx',
        anchor: '<caption className="sr-only">Заказы в поставке</caption>',
        executedFeatures: ['selection-and-actions'],
        interactionOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/supplies/__tests__/SupplyOrdersTable.test.tsx',
          scenarioId: 'Enter key on focused row triggers onOrderClick',
        },
      }),
    ],
  })
