import { chartSurface } from './surface-types'
import type { Story1743ChartSurface } from './surface-types'

export const CHART_INVENTORY: Readonly<Record<string, readonly Story1743ChartSurface[]>> =
  Object.freeze({
    '/analytics/buyout': [
      chartSurface('/analytics/buyout', {
        id: 'buyout-daily-trend',
        accessibleName: 'График ежедневной динамики выкупа',
        alternativeAccessibleName: 'Данные графика ежедневной динамики выкупа',
        source: 'src/app/(dashboard)/analytics/buyout/components/BuyoutTrendChart.tsx',
        anchor: 'label="График ежедневной динамики выкупа"',
        alternativeSource:
          'src/app/(dashboard)/analytics/buyout/components/BuyoutTrendDataTable.tsx',
        alternativeAnchor:
          '<table id={BUYOUT_TREND_DATA_TABLE_ID} className="sr-only" data-chart-summary>',
        requiredPeriodUnitTokens: ['период:', 'единицы:'],
        requiredSeriesTokens: ['Выкуп', 'Возвраты', 'Заказы'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/buyout/components/__tests__/BuyoutTrendDataTable.test.tsx',
          scenarioId: 'exposes the exact chart period, units, series, precision, and values',
        },
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
        alternativeAnchor:
          '<table id={FBS_TRENDS_TABLE_ID} className="sr-only" data-chart-summary>',
        requiredPeriodUnitTokens: ['период:', 'единицы:'],
        requiredSeriesTokens: ['Заказы, шт.', 'Выручка, ₽', 'Отмены, шт.'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/analytics/__tests__/FbsTrendsChart.test.tsx',
          scenarioId:
            'ties the chart to an exact named data table with period, units, series, and values',
        },
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
        requiredPeriodUnitTokens: ['период:', 'единицы:'],
        requiredSeriesTokens: ['Маржа, %', 'Выручка, ₽', 'COGS, ₽', 'Прибыль, ₽'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/MarginTrendChart.test.tsx',
          scenarioId:
            'ties an accessible chart name to an exact table alternative with all tooltip data',
        },
      }),
    ],
    '/analytics/unit-economics': [
      chartSurface('/analytics/unit-economics', {
        id: 'unit-economics-waterfall',
        accessibleName: 'График структуры затрат:',
        alternativeAccessibleName: 'Структура затрат:',
        source:
          'src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsWaterfall.tsx',
        anchor: 'label={`График структуры затрат:',
        alternativeSource:
          'src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsWaterfallSummary.tsx',
        alternativeAnchor: '<caption>Структура затрат:',
        requiredSeriesTokens: ['Доля от выручки', 'Сумма'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/unit-economics/components/__tests__/UnitEconomicsWaterfall.a11y.test.tsx',
          scenarioId:
            'exposes exact percentage and currency units, categories, values, and precision',
        },
        notApplicableRationales: {
          'period-and-units':
            '/analytics/unit-economics: unit-economics-waterfall feature period-and-units is not applicable as a temporal contract because this is a point-in-time cost composition for the selected product with percentage/currency units but no period dimension',
        },
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
        requiredSeriesTokens: ['Доля стоимости запасов', 'SKU', 'Стоимость запасов'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/liquidity/components/__tests__/LiquidityDistributionChart.a11y.test.tsx',
          scenarioId:
            'exposes exact percentage, SKU, currency units, categories, and value precision',
        },
        notApplicableRationales: {
          'period-and-units':
            '/analytics/liquidity: liquidity-distribution feature period-and-units is not applicable as a temporal contract because this point-in-time categorical distribution has percentage/count/currency units but no period axis',
        },
      }),
      chartSurface('/analytics/liquidity', {
        id: 'liquidity-trend',
        accessibleName: 'График динамики замороженного капитала и среднего оборота',
        alternativeAccessibleName: 'Динамика ликвидности по дням',
        source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidityTrendChart.tsx',
        anchor: 'label="График динамики замороженного капитала и среднего оборота"',
        alternativeSource:
          'src/app/(dashboard)/analytics/liquidity/components/LiquidityTrendSummary.tsx',
        alternativeAnchor: 'id={LIQUIDITY_TREND_SUMMARY_ID}',
        alternativeSelector: '#liquidity-trend-complete-data',
        sharedAlternativeSurfaceIds: ['liquidity-trend', 'liquidity-distribution-trend'],
        requiredPeriodUnitTokens: ['Дата', 'дней'],
        requiredSeriesTokens: ['Замороженный капитал', 'Средний оборот, дней'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/liquidity/components/__tests__/LiquidityTrendChart.test.tsx',
          scenarioId:
            'exposes the exact date, currency, day units, all series, and percentage precision',
        },
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
        alternativeAnchor: 'id={LIQUIDITY_TREND_SUMMARY_ID}',
        alternativeSelector: '#liquidity-trend-complete-data',
        sharedAlternativeSurfaceIds: ['liquidity-trend', 'liquidity-distribution-trend'],
        requiredPeriodUnitTokens: ['Дата', 'дням'],
        requiredSeriesTokens: [
          'Высоколиквидные',
          'Средняя ликвидность',
          'Низкая ликвидность',
          'Неликвид',
        ],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/liquidity/components/__tests__/LiquidityTrendChart.test.tsx',
          scenarioId:
            'exposes the exact date, currency, day units, all series, and percentage precision',
        },
      }),
    ],
    '/analytics/returns': [
      chartSurface('/analytics/returns', {
        id: 'returns-daily-trend',
        accessibleName: 'График возвратов по дням:',
        alternativeAccessibleName: 'Данные о возвратах по дням',
        source: 'src/app/(dashboard)/analytics/returns/components/ReturnTrendChart.tsx',
        anchor: 'label={`График возвратов по дням:',
        alternativeSource:
          'src/app/(dashboard)/analytics/returns/components/ReturnTrendSrTable.tsx',
        alternativeAnchor: 'Данные о возвратах по дням',
        requiredPeriodUnitTokens: ['с ', 'штуки', 'проценты'],
        requiredSeriesTokens: ['Отмены, шт', 'Отказы, шт', 'Брак, шт', 'Доля возвратов, %'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnTrendChart.test.tsx',
          scenarioId:
            'exposes exact period, units, every day and every series value at tooltip precision',
        },
      }),
    ],
    '/analytics/storage': [
      chartSurface('/analytics/storage', {
        id: 'paid-storage-weekly-trend',
        accessibleName: 'График расходов на платное хранение по неделям',
        alternativeAccessibleName: 'Данные о расходах на платное хранение по неделям',
        source: 'src/app/(dashboard)/analytics/storage/components/StorageTrendsChart.tsx',
        anchor: 'label="График расходов на платное хранение по неделям"',
        alternativeSource:
          'src/app/(dashboard)/analytics/storage/components/StorageTrendSrTable.tsx',
        alternativeAnchor: 'data-chart-summary',
        requiredPeriodUnitTokens: ['Неделя', '₽'],
        requiredSeriesTokens: ['Расходы на хранение, ₽'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/storage/components/__tests__/StorageTrendsChart.test.tsx',
          scenarioId: 'renders an sr-only table with every week and its value at tooltip precision',
        },
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
        requiredPeriodUnitTokens: ['Дата', 'рубли', 'штуки'],
        requiredSeriesTokens: ['Расходы', 'Показы', 'Клики', 'Заказы'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/advertising/components/__tests__/advertising-presentation-source-contracts.test.tsx',
          scenarioId:
            'daily trend exposes exact dates, units, every visible series value, and tooltip precision',
        },
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
        requiredSeriesTokens: ['Платформа', 'Факт (отчёт WB)', 'Расход, ₽'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/advertising/components/__tests__/AdCostDiscrepancyChart.test.tsx',
          scenarioId:
            'exposes exact currency units, accounting series, values, delta, and tooltip precision',
        },
        notApplicableRationales: {
          'period-and-units':
            '/analytics/advertising: advertising-cost-discrepancy feature period-and-units is not applicable as a temporal contract because it compares named accounting layers for one selected scope with currency units but no period axis',
        },
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
        requiredPeriodUnitTokens: ['Дата', '% от категории'],
        requiredSeriesTokens: [
          'Рейтинг бренда, место в рейтинге',
          'Доля по цене, % от категории',
          'Доля по количеству, % от категории',
        ],
        tooltipOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/analytics/__tests__/BrandShareChart.test.tsx',
          scenarioId: 'renders the sr-only table with every day × 3 metrics at tooltip precision',
        },
      }),
    ],
    '/analytics/search': [
      chartSurface('/analytics/search', {
        id: 'search-orders-daily',
        accessibleName: 'Динамика поисковых заказов по дням:',
        alternativeAccessibleName: 'Данные динамики поисковых заказов;',
        source: 'src/app/(dashboard)/analytics/search/components/SearchOrdersChart.tsx',
        anchor: 'aria-label={`${TITLE}: ${dayCountLabel}`}',
        alternativeSource: 'src/app/(dashboard)/analytics/search/components/SearchOrdersChart.tsx',
        alternativeAnchor: 'id={SEARCH_ORDERS_CHART_DATA_TABLE_ID}',
        requiredPeriodUnitTokens: ['период:', 'единицы: заказы, шт.'],
        requiredSeriesTokens: ['Дата', 'Заказы, шт.'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/search/components/__tests__/SearchOrdersChart.test.tsx',
          scenarioId:
            'exposes exact period, units, series, every daily value, and tooltip precision',
        },
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
        requiredPeriodUnitTokens: ['Дата', 'единиц/день'],
        requiredSeriesTokens: ['Прогноз (AI)', 'Базовая оценка', 'Диапазон'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/forecast/components/__tests__/ForecastChart.test.tsx',
          scenarioId: 'renders all 5 Russian labels + values when active with valid payload',
        },
      }),
    ],
    '/analytics/models/[id]/performance': [
      chartSurface('/analytics/models/[id]/performance', {
        id: 'model-mape-trend',
        accessibleName: 'График тренда точности модели MAPE',
        alternativeAccessibleName: 'История оценок — ',
        source:
          'src/app/(dashboard)/analytics/models/[id]/performance/components/MapeTrendChart.tsx',
        anchor: 'aria-label="График тренда точности модели MAPE"',
        alternativeSource:
          'src/app/(dashboard)/analytics/models/[id]/performance/components/ModelPerformanceDetail.tsx',
        alternativeAnchor: 'captionText={`История оценок — ',
        requiredPeriodUnitTokens: ['Дата'],
        requiredSeriesTokens: ['MAPE'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source:
            'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
          scenarioId: 'tooltip exposes the exact date, MAPE units, series value, and SKU precision',
        },
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
        requiredPeriodUnitTokens: ['за ', 'единицы: рубли'],
        requiredSeriesTokens: ['Заказы, ₽', 'Выкупы, ₽', 'Реклама, ₽', 'Теор. прибыль, ₽'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/dashboard/__tests__/DailyBreakdownChart.a11y.test.tsx',
          scenarioId:
            'exposes the exact visible series as a non-hover table with period and ruble units',
        },
      }),
      chartSurface('/dashboard', {
        id: 'storage-trend',
        accessibleName: 'График расходов на хранение на главной странице',
        alternativeAccessibleName: 'Данные графика расходов на хранение на главной странице',
        source: 'src/components/custom/dashboard/StorageTrendsChart.tsx',
        anchor: 'label="График расходов на хранение на главной странице"',
        alternativeSource: 'src/components/custom/dashboard/DashboardStorageTrendDataTable.tsx',
        alternativeAnchor: 'data-chart-summary',
        requiredPeriodUnitTokens: ['Неделя', '₽'],
        requiredSeriesTokens: ['Расходы на хранение, ₽'],
        tooltipOwnerTest: {
          runner: 'vitest',
          source: 'src/components/custom/dashboard/__tests__/StorageTrendsChart.a11y.test.tsx',
          scenarioId:
            'exposes exact weeks, ruble units, series values, null state, and tooltip precision',
        },
      }),
    ],
  })
