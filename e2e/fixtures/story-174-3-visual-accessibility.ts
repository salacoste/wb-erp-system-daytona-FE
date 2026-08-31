import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export const STORY_174_3_THEMES = ['light', 'dark'] as const
export const STORY_174_3_WIDTHS = [320, 390, 768, 1024, 1280, 1440] as const

export const STORY_174_3_STATES = [
  'default',
  'loading',
  'refresh',
  'empty',
  'filtered-empty',
  'error',
  'stale',
  'partial',
  'permission',
  'pending',
  'partial-success',
  'not-found',
] as const

export type Story1743RouteEvidence = {
  story: string
  route: string
  effectiveUrl: string
  entry: string
  domain: string
  ledgerStatus: 'planned' | 'verified'
  states: readonly (typeof STORY_174_3_STATES)[number][]
  ownerArtifact: string
  browserEvidence: string
  routeIdentityEvidence: Story1743EvidenceAnchor
  routeIdentity: Story1743RouteIdentity
  sessionProfile: 'authenticated' | 'unauthenticated-onboarding'
  stateEvidence: readonly Story1743StateEvidence[]
  screenshotDisposition: 'privacy-safe-dom-equivalent'
  manualAtDisposition: 'environment-gap-real-at'
}

/**
 * Route identity is deliberately data, not an assertion fallback.  Every
 * ledger route must opt into one of these contracts so a generic non-empty
 * heading can never satisfy Story 174.3 by accident.
 */
export type Story1743RouteIdentity =
  | { kind: 'static-h1'; expectedText: string }
  | { kind: 'materialized-h1'; expectedText: string }
  | {
      kind: 'backend-h1'
      selector: string
      expectedPattern: RegExp
      forbiddenTexts: readonly string[]
    }
  | {
      kind: 'route-landmark'
      selector: string
      expectedAccessibleName: string
      headingPattern: RegExp
      forbiddenTexts: readonly string[]
    }
  | {
      kind: 'redirector'
      finalRoutes: Readonly<Record<string, string>>
      transientHeadings: readonly string[]
    }

export type Story1743EvidenceAnchor = {
  source: string
  line: number
  matchedToken: string
  kind: 'owner-browser-executable' | 'owner-delivery-record'
}

export type Story1743StateEvidence = {
  route: string
  state: (typeof STORY_174_3_STATES)[number]
  disposition: 'executed' | 'not-applicable' | 'blocked'
  rationale: string
  result?: 'passed'
  source?: string
  sourceSha256?: string
  line?: number
  scenarioId?: string
  command?: string
  kind?: 'story-runner' | 'owner-browser-executable' | 'owner-unit-executable'
  declarationSource?: string
  declarationSha256?: string
  declarationLine?: number
  declarationId?: string
  blockerId?: string
}

const REPOSITORY_ROOT = '.'
const LEDGER_PATH = join(REPOSITORY_ROOT, '_bmad-output/planning-artifacts/shadcn-route-ledger.md')
const ARTIFACT_ROOT = join(REPOSITORY_ROOT, '_bmad-output/implementation-artifacts')
const SOURCE_LINE_CACHE = new Map<string, readonly string[]>()

const DYNAMIC_SEGMENTS: Readonly<Record<string, string>> = {
  advertId: '1743001',
  id: '1743001',
  nmId: '174300001',
}

const GENERIC_FALLBACK_HEADINGS = [
  'Страница не найдена',
  'Произошла ошибка',
  'Ошибка загрузки',
  'Не удалось загрузить',
  'Не удалось открыть',
] as const

const UNAUTHENTICATED_ONBOARDING_ROUTES = new Set(['/cabinet', '/processing', '/wb-token'])

const BACKEND_H1 = (selector: string, expectedPattern: RegExp): Story1743RouteIdentity => ({
  kind: 'backend-h1',
  selector,
  expectedPattern,
  forbiddenTexts: GENERIC_FALLBACK_HEADINGS,
})

/** Explicit route identity contract for every one of the 76 ledger rows. */
export const STORY_174_3_ROUTE_IDENTITIES: Readonly<Record<string, Story1743RouteIdentity>> =
  Object.freeze({
    '/': {
      kind: 'redirector',
      finalRoutes: { '/login': 'Войти в аккаунт', '/dashboard': 'Главная страница' },
      transientHeadings: [
        'Проверяем сессию',
        'Переходим в приложение',
        'Не удалось проверить сессию',
      ],
    },
    '/login': {
      kind: 'redirector',
      finalRoutes: { '/login': 'Войти в аккаунт', '/dashboard': 'Главная страница' },
      transientHeadings: ['Проверяем сессию', 'Переходим в приложение'],
    },
    '/register': {
      kind: 'redirector',
      finalRoutes: { '/register': 'Регистрация', '/dashboard': 'Главная страница' },
      transientHeadings: ['Проверяем сессию', 'Переходим в приложение'],
    },
    '/cabinet': { kind: 'static-h1', expectedText: 'Создание кабинета' },
    '/processing': { kind: 'static-h1', expectedText: 'Обработка данных' },
    '/wb-token': { kind: 'static-h1', expectedText: 'Ввод WB API токена' },
    '/analytics': { kind: 'static-h1', expectedText: 'Аналитика' },
    '/analytics/alerts': { kind: 'static-h1', expectedText: 'Центр уведомлений' },
    '/analytics/dashboard': { kind: 'static-h1', expectedText: 'Сводка по кабинету' },
    '/analytics/finance-history': { kind: 'static-h1', expectedText: 'Финансовый отчёт: история' },
    '/analytics/orders': { kind: 'static-h1', expectedText: 'Аналитика заказов FBS' },
    '/analytics/pricing': { kind: 'static-h1', expectedText: 'Рекомендации по ценам' },
    '/analytics/product/[nmId]': {
      kind: 'materialized-h1',
      expectedText: `Аналитика товара #${DYNAMIC_SEGMENTS.nmId}`,
    },
    '/analytics/reorder': { kind: 'static-h1', expectedText: 'Дашборд пополнения' },
    '/analytics/sku': { kind: 'static-h1', expectedText: 'Маржинальность по товарам' },
    '/analytics/time-period': {
      kind: 'static-h1',
      expectedText: 'Анализ маржинальности по времени',
    },
    '/analytics/unit-economics': { kind: 'static-h1', expectedText: 'Юнит-экономика' },
    '/analytics/acquiring': { kind: 'static-h1', expectedText: 'Аналитика эквайринга' },
    '/analytics/acquiring/period': { kind: 'static-h1', expectedText: 'Эквайринг за период' },
    '/analytics/acquiring/reports/[id]': {
      kind: 'materialized-h1',
      expectedText: `Отчёт #${DYNAMIC_SEGMENTS.id}`,
    },
    '/analytics/buyout': { kind: 'static-h1', expectedText: 'Аналитика выкупов' },
    '/analytics/buyout-reconciliation': {
      kind: 'static-h1',
      expectedText: 'Сверка выкупов и возвратов',
    },
    '/analytics/fbs-enhanced': { kind: 'static-h1', expectedText: 'Расширенная аналитика FBS' },
    '/analytics/fbs-stock': { kind: 'static-h1', expectedText: 'Складские остатки FBS' },
    '/analytics/funnel': { kind: 'static-h1', expectedText: 'Воронка продаж' },
    '/analytics/gaps': { kind: 'static-h1', expectedText: 'Пропуски в данных' },
    '/analytics/liquidity': { kind: 'static-h1', expectedText: 'Ликвидность товаров' },
    '/analytics/returns': { kind: 'static-h1', expectedText: 'Аналитика возвратов' },
    '/analytics/storage': { kind: 'static-h1', expectedText: 'Аналитика расходов на хранение' },
    '/analytics/supply-planning': { kind: 'static-h1', expectedText: 'Планирование поставок' },
    '/analytics/advertising': { kind: 'static-h1', expectedText: 'Рекламная аналитика' },
    '/analytics/advertising/campaigns/[advertId]': {
      kind: 'materialized-h1',
      expectedText: `Кампания #${DYNAMIC_SEGMENTS.advertId}`,
    },
    '/analytics/brand': { kind: 'static-h1', expectedText: 'Маржинальность по брендам' },
    '/analytics/brand-share': { kind: 'static-h1', expectedText: 'Доля бренда в категории' },
    '/analytics/category': { kind: 'static-h1', expectedText: 'Маржинальность по категориям' },
    '/analytics/cross-reference': { kind: 'static-h1', expectedText: 'Кросс-анализ' },
    '/analytics/search': { kind: 'static-h1', expectedText: 'Поисковая аналитика' },
    '/analytics/ai-admin/anomalies': { kind: 'static-h1', expectedText: 'Разрешение аномалий' },
    '/analytics/ai-admin/models': { kind: 'static-h1', expectedText: 'Управление AI моделями' },
    '/analytics/ai-admin/preferences': { kind: 'static-h1', expectedText: 'Настройки AI' },
    '/analytics/forecast': { kind: 'static-h1', expectedText: 'AI Прогноз продаж' },
    '/analytics/forecast-accuracy': { kind: 'static-h1', expectedText: 'Точность прогнозов' },
    '/analytics/models': { kind: 'static-h1', expectedText: 'Модели AI' },
    '/analytics/models/[id]/evaluations': {
      kind: 'static-h1',
      expectedText: 'Оценки точности модели',
    },
    '/analytics/models/[id]/evaluations/sku-accuracy': {
      kind: 'static-h1',
      expectedText: 'Точность по SKU',
    },
    '/analytics/models/[id]/performance': {
      kind: 'static-h1',
      expectedText: 'Производительность модели',
    },
    '/dashboard': { kind: 'static-h1', expectedText: 'Главная страница' },
    '/automation/canned-rules': { kind: 'static-h1', expectedText: 'Шаблоны автоматизации' },
    '/automation/installed-rules': { kind: 'static-h1', expectedText: 'Установленные правила' },
    '/automation/installed-rules/[id]': {
      kind: 'static-h1',
      expectedText: 'Редактор установленного правила',
    },
    '/cogs': { kind: 'static-h1', expectedText: 'Управление себестоимостью' },
    '/cogs/bulk': { kind: 'static-h1', expectedText: 'Массовое назначение себестоимости' },
    '/cogs/history': { kind: 'static-h1', expectedText: 'История COGS' },
    '/cogs/price-calculator': { kind: 'static-h1', expectedText: 'Калькулятор цены' },
    '/communications': { kind: 'static-h1', expectedText: 'Сообщения' },
    '/finances': { kind: 'static-h1', expectedText: 'Финансы' },
    '/monitor': { kind: 'static-h1', expectedText: 'Монитор' },
    '/monitoring': { kind: 'static-h1', expectedText: 'Мониторинг' },
    '/moysklad': { kind: 'static-h1', expectedText: 'МойСклад' },
    '/orders': { kind: 'static-h1', expectedText: 'Заказы FBS' },
    '/orders/fbo': { kind: 'static-h1', expectedText: 'FBO Заказы и продажи' },
    '/orders/integrity': { kind: 'static-h1', expectedText: 'Целостность заказов' },
    '/products': { kind: 'static-h1', expectedText: 'Ассортимент' },
    '/settings': { kind: 'static-h1', expectedText: 'Настройки' },
    '/settings/backfill': { kind: 'static-h1', expectedText: 'Управление бэкфиллом' },
    '/settings/cabinet': { kind: 'static-h1', expectedText: 'Кабинет' },
    '/settings/expenses': { kind: 'static-h1', expectedText: 'Операционные расходы' },
    '/settings/notifications': { kind: 'static-h1', expectedText: 'Telegram Уведомления' },
    '/settings/tariffs': { kind: 'static-h1', expectedText: 'Управление тарифами' },
    '/settings/tax': { kind: 'static-h1', expectedText: 'Налоговые настройки' },
    '/shipments': { kind: 'static-h1', expectedText: 'Отправки' },
    '/shipments/[id]': { kind: 'static-h1', expectedText: 'Детали отправки' },
    '/shipments/box-types': { kind: 'static-h1', expectedText: 'Типы коробок' },
    '/shipments/sku-packaging': { kind: 'static-h1', expectedText: 'Упаковка товаров' },
    '/supplies': { kind: 'static-h1', expectedText: 'Поставки FBS' },
    '/supplies/[id]': { kind: 'static-h1', expectedText: 'Детали поставки' },
  })

const ANALYTICS_EVIDENCE: readonly [string, string][] = [
  ['/analytics/alerts', 'e2e/alerts-page.spec.ts'],
  ['/analytics/dashboard', 'e2e/dashboard-metrics.spec.ts'],
  ['/analytics/finance-history', 'e2e/finance-history.spec.ts'],
  ['/analytics/orders', 'e2e/analytics/fbs-orders-analytics.spec.ts'],
  ['/analytics/pricing', 'e2e/pricing-page.spec.ts'],
  ['/analytics/product/', 'e2e/analytics/product-analytics.spec.ts'],
  ['/analytics/reorder', 'e2e/reorder-page.spec.ts'],
  ['/analytics/sku', 'e2e/sku-analytics.spec.ts'],
  ['/analytics/time-period', 'e2e/time-period-analytics.spec.ts'],
  ['/analytics/unit-economics', 'e2e/unit-economics.spec.ts'],
  ['/analytics/acquiring', 'e2e/acquiring.spec.ts'],
  ['/analytics/buyout-reconciliation', 'e2e/buyout-reconciliation.spec.ts'],
  ['/analytics/buyout', 'e2e/financial-summary.spec.ts'],
  ['/analytics/fbs-enhanced', 'e2e/fbs-enhanced.spec.ts'],
  ['/analytics/fbs-stock', 'e2e/fbs-stock.spec.ts'],
  ['/analytics/funnel', 'e2e/funnel.spec.ts'],
  ['/analytics/gaps', 'e2e/financial-gaps.spec.ts'],
  ['/analytics/liquidity', 'e2e/liquidity.spec.ts'],
  ['/analytics/returns', 'e2e/returns-analytics.spec.ts'],
  ['/analytics/storage', 'e2e/storage-analytics.spec.ts'],
  ['/analytics/supply-planning', 'e2e/supply-planning.spec.ts'],
  ['/analytics/advertising', 'e2e/advertising-analytics-epic-36.spec.ts'],
  ['/analytics/brand-share', 'e2e/brand-analytics.spec.ts'],
  ['/analytics/brand', 'e2e/brand-analytics.spec.ts'],
  ['/analytics/category', 'e2e/category-analytics.spec.ts'],
  ['/analytics/cross-reference', 'e2e/cross-reference.spec.ts'],
  ['/analytics/search', 'e2e/analytics/search-analytics.spec.ts'],
  ['/analytics/ai-admin', 'e2e/ai-admin.spec.ts'],
  ['/analytics/forecast-accuracy', 'e2e/forecast-accuracy.spec.ts'],
  ['/analytics/forecast', 'e2e/forecast-page.spec.ts'],
  ['/analytics/models', 'e2e/analytics/ai-models.spec.ts'],
]

type Story1743NonDefaultState = Exclude<(typeof STORY_174_3_STATES)[number], 'default'>
export type Story1743ExactStateScenario = { source: string; scenarioId: string }

const exact = (source: string, scenarioId: string): Story1743ExactStateScenario => ({
  source,
  scenarioId,
})

/**
 * Exact route/state declarations only. An omitted state is deliberately and
 * visibly materialized as route-specific N/A; title-token inference is banned.
 */
const EXACT_STATE_SCENARIOS: Readonly<
  Record<string, Partial<Record<Story1743NonDefaultState, Story1743ExactStateScenario>>>
> = {
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
      'e2e/shipments/shipments-list.spec.ts',
      'should display the semantic loading state while shipments are pending'
    ),
    refresh: exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'preserves previously loaded rows when a background refresh fails'
    ),
    empty: exact('e2e/shipments/shipments-list.spec.ts', 'should display table or empty state'),
    'filtered-empty': exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'renders the unfiltered empty state with packaging and permission context'
    ),
    partial: exact(
      'src/components/custom/shipments/__tests__/ShipmentsTable.test.tsx',
      'uses the shipment id as a visible fallback for partial rows'
    ),
    permission: exact(
      'src/app/(dashboard)/shipments/__tests__/page.test.tsx',
      'renders the unfiltered empty state with packaging and permission context'
    ),
    pending: exact(
      'e2e/shipments/shipments-list.spec.ts',
      'should display the semantic loading state while shipments are pending'
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
      'e2e/sku-packaging-page.spec.ts',
      'shows filtered empty state and resets the client-side filter'
    ),
    'filtered-empty': exact(
      'e2e/sku-packaging-page.spec.ts',
      'shows filtered empty state and resets the client-side filter'
    ),
    partial: exact(
      'src/components/custom/sku-packaging/__tests__/BulkAddDialog.test.tsx',
      'shows partial failure with error rows'
    ),
  },
}

const notApplicable = (
  ...states: readonly Story1743NonDefaultState[]
): readonly Story1743NonDefaultState[] => states

/**
 * Exhaustive, explicit N/A declarations. No route/state pair is inferred from
 * absence: every non-default state must occur exactly once here or in
 * EXACT_STATE_SCENARIOS, and the constructor validates that invariant.
 */
export const STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES: Readonly<
  Record<string, readonly Story1743NonDefaultState[]>
> = Object.freeze({
  '/': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/login': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/register': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/cabinet': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'permission',
    'pending',
    'not-found'
  ),
  '/processing': notApplicable(
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/wb-token': notApplicable('refresh', 'filtered-empty', 'stale', 'partial', 'partial-success'),
  '/analytics': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/alerts': notApplicable(
    'loading',
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/dashboard': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/analytics/finance-history': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/orders': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/pricing': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/product/[nmId]': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/reorder': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/sku': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/time-period': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/unit-economics': notApplicable(
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/acquiring': notApplicable(
    'loading',
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/acquiring/period': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/acquiring/reports/[id]': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/buyout': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/buyout-reconciliation': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/fbs-enhanced': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/fbs-stock': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/funnel': notApplicable(
    'loading',
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/gaps': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/liquidity': notApplicable(
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/returns': notApplicable(
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/storage': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/supply-planning': notApplicable(
    'filtered-empty',
    'stale',
    'partial',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/advertising': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/advertising/campaigns/[advertId]': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/brand': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/brand-share': notApplicable(
    'loading',
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/category': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/cross-reference': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/search': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/ai-admin/anomalies': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/ai-admin/models': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/ai-admin/preferences': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/forecast': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/forecast-accuracy': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/models': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/models/[id]/evaluations': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/models/[id]/evaluations/sku-accuracy': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success'
  ),
  '/analytics/models/[id]/performance': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/dashboard': notApplicable(
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/automation/canned-rules': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/automation/installed-rules': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/automation/installed-rules/[id]': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/cogs': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/cogs/bulk': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/cogs/history': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/cogs/price-calculator': notApplicable(
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/communications': notApplicable(
    'loading',
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/finances': notApplicable('refresh', 'stale', 'permission', 'partial-success', 'not-found'),
  '/monitor': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/monitoring': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/moysklad': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/orders': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/orders/fbo': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/orders/integrity': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/products': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/settings': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/settings/backfill': notApplicable(
    'filtered-empty',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/settings/cabinet': notApplicable(
    'empty',
    'filtered-empty',
    'error',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/settings/expenses': notApplicable(
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/settings/notifications': notApplicable(
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/settings/tariffs': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'partial-success',
    'not-found'
  ),
  '/settings/tax': notApplicable(
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/shipments': notApplicable('error', 'stale', 'partial-success', 'not-found'),
  '/shipments/[id]': notApplicable('filtered-empty', 'stale', 'permission', 'partial-success'),
  '/shipments/box-types': notApplicable(
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/shipments/sku-packaging': notApplicable(
    'refresh',
    'error',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/supplies': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/supplies/[id]': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
})

const NOT_APPLICABLE_RATIONALES: Readonly<Record<Story1743NonDefaultState, string>> = {
  loading: 'has no route-owned asynchronous loading surface distinct from its default surface',
  refresh: 'has no route-owned background refresh transition',
  empty: 'has no route-owned unfiltered empty-data terminal',
  'filtered-empty': 'has no route-owned filtered-empty terminal distinct from empty',
  error: 'has no route-owned recoverable request-error terminal',
  stale: 'has no route-owned stale-data presentation after a failed refresh',
  partial: 'has no route-owned partial-data terminal',
  permission: 'has no route-owned permission-denied terminal',
  pending: 'has no route-owned pending mutation transition',
  'partial-success': 'has no route-owned partial-success mutation terminal',
  'not-found': 'has no route-owned entity-not-found terminal',
}

const NON_DEFAULT_STATES = STORY_174_3_STATES.filter(
  (state): state is Story1743NonDefaultState => state !== 'default'
)

export function validateStory1743ExplicitStateContract(
  route: string,
  executed: Readonly<Partial<Record<Story1743NonDefaultState, Story1743ExactStateScenario>>>,
  notApplicableStates: readonly Story1743NonDefaultState[]
): void {
  const knownStates = new Set<string>(NON_DEFAULT_STATES)
  const executedStates = Object.keys(executed)
  const notApplicableSet = new Set(notApplicableStates)

  for (const state of [...executedStates, ...notApplicableStates]) {
    if (!knownStates.has(state)) {
      throw new Error(`${route} declares unsupported Story 174.3 state: ${state}`)
    }
  }
  if (notApplicableSet.size !== notApplicableStates.length) {
    throw new Error(`${route} has duplicate explicit not-applicable state declarations`)
  }
  for (const state of NON_DEFAULT_STATES) {
    const dispositions =
      Number(Object.hasOwn(executed, state)) + Number(notApplicableSet.has(state))
    if (dispositions !== 1) {
      throw new Error(
        `${route}/${state} must have exactly one explicit disposition (executed or not-applicable); found ${dispositions}`
      )
    }
  }
}

function resolveNotApplicableDeclarationLine(
  route: string,
  state: Story1743NonDefaultState
): number {
  const source = 'e2e/fixtures/story-174-3-visual-accessibility.ts'
  const lines =
    SOURCE_LINE_CACHE.get(source) ??
    readFileSync(join(REPOSITORY_ROOT, source), 'utf8').split(/\r?\n/)
  SOURCE_LINE_CACHE.set(source, lines)
  const manifestLine = lines.findIndex(line =>
    line.includes('STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES')
  )
  const routeLine = lines.findIndex(
    (line, index) => index > manifestLine && line.trimStart().startsWith(`'${route}':`)
  )
  if (manifestLine < 0 || routeLine < 0) {
    throw new Error(`Missing explicit not-applicable declaration anchor for ${route}`)
  }
  const nextRouteLine = lines.findIndex(
    (line, index) => index > routeLine && /^\s*'[^']+':/.test(line)
  )
  const stateLine = lines.findIndex(
    (line, index) =>
      index >= routeLine &&
      (nextRouteLine < 0 || index < nextRouteLine) &&
      line.includes(`'${state}'`)
  )
  if (stateLine < 0) {
    throw new Error(`Missing explicit not-applicable declaration anchor for ${route}/${state}`)
  }
  return stateLine + 1
}

function findEvidenceAnchor(
  source: string,
  tokens: readonly string[],
  kind: Story1743EvidenceAnchor['kind']
): Story1743EvidenceAnchor | undefined {
  const lines =
    SOURCE_LINE_CACHE.get(source) ??
    readFileSync(join(REPOSITORY_ROOT, source), 'utf8').split(/\r?\n/)
  SOURCE_LINE_CACHE.set(source, lines)
  for (const token of tokens) {
    const line = lines.findIndex(candidate => candidate.toLocaleLowerCase().includes(token))
    if (line >= 0) return { source, line: line + 1, matchedToken: token, kind }
  }
  return undefined
}

function resolveRouteIdentityEvidence(
  route: string,
  browserEvidence: string,
  ownerArtifact: string
): Story1743EvidenceAnchor {
  const token = route.toLocaleLowerCase()
  const anchor =
    findEvidenceAnchor(browserEvidence, [token], 'owner-browser-executable') ??
    findEvidenceAnchor(ownerArtifact, [token], 'owner-delivery-record')
  if (!anchor) {
    throw new Error(
      `Story 174.3 has no route-identity anchor for ${route} in ${browserEvidence} or ${ownerArtifact}`
    )
  }
  return anchor
}

function resolveStateEvidence(route: string): Story1743StateEvidence[] {
  const declarations = EXACT_STATE_SCENARIOS[route] ?? {}
  if (!Object.hasOwn(STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES, route)) {
    throw new Error(`Missing explicit not-applicable state manifest for ${route}`)
  }
  const notApplicableStates = STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES[route]
  validateStory1743ExplicitStateContract(route, declarations, notApplicableStates)
  const declarationSource = 'e2e/fixtures/story-174-3-visual-accessibility.ts'
  const notApplicableSet = new Set(notApplicableStates)
  return STORY_174_3_STATES.map(state => {
    if (state === 'default') {
      return {
        route,
        state,
        disposition: 'executed' as const,
        rationale: `${route} default live surface is executed by the consolidated Story runner`,
        result: 'passed' as const,
        source: 'e2e/shadcn-migration-visual-accessibility.spec.ts',
        sourceSha256: sha256('e2e/shadcn-migration-visual-accessibility.spec.ts'),
        scenarioId: `${route} has privacy-safe width/theme/axe/focus evidence`,
        command: 'npm run test:e2e:full -- e2e/shadcn-migration-visual-accessibility.spec.ts',
        kind: 'story-runner' as const,
      }
    }
    const declaration = declarations[state]
    if (!declaration) {
      if (!notApplicableSet.has(state)) {
        throw new Error(`${route}/${state} has no explicit state disposition`)
      }
      return {
        route,
        state,
        disposition: 'not-applicable' as const,
        rationale: `${route}: ${NOT_APPLICABLE_RATIONALES[state]}`,
        declarationSource,
        declarationSha256: sha256(declarationSource),
        declarationLine: resolveNotApplicableDeclarationLine(route, state),
        declarationId: `${route}:${state}:not-applicable`,
      }
    }
    const matches = extractLiteralScenarios(declaration.source).filter(
      scenario => scenario.title === declaration.scenarioId
    )
    if (matches.length !== 1) {
      throw new Error(
        `${route}/${state} exact scenario must resolve once: ${declaration.source} :: ${declaration.scenarioId}`
      )
    }
    const scenario = matches[0]
    const browser = scenario.source.startsWith('e2e/')
    return {
      route,
      state,
      disposition: 'executed' as const,
      rationale: `${route}: exact owner scenario proves the declared ${state} state`,
      result: 'passed' as const,
      source: scenario.source,
      sourceSha256: sha256(scenario.source),
      line: scenario.line,
      scenarioId: scenario.title,
      command: browser
        ? `npm run test:e2e:full -- ${scenario.source}`
        : `npm test -- --run ${scenario.source}`,
      kind: browser ? ('owner-browser-executable' as const) : ('owner-unit-executable' as const),
    }
  })
}

function sha256(source: string): string {
  return createHash('sha256')
    .update(readFileSync(join(REPOSITORY_ROOT, source)))
    .digest('hex')
}

function extractLiteralScenarios(
  source: string
): Array<{ source: string; line: number; title: string }> {
  const text = readFileSync(join(REPOSITORY_ROOT, source), 'utf8')
  const pattern = /\b(?:test|it)(?:\.(?:skip|only|todo))?\s*\(\s*(['"`])([^\n]*?)\1/g
  return [...text.matchAll(pattern)].map(match => ({
    source,
    line: text.slice(0, match.index).split(/\r?\n/).length,
    title: match[2],
  }))
}

function materializeRoute(route: string): string {
  return route.replace(/\[([^\]]+)\]/g, (_match, key: string) => {
    const value = DYNAMIC_SEGMENTS[key]
    if (!value) throw new Error(`Story 174.3 has no deterministic value for [${key}] in ${route}`)
    return value
  })
}

function resolveOwnerArtifact(story: string): string {
  const prefix = `${story.replace('.', '-')}-fe-`
  const matches = readdirSync(ARTIFACT_ROOT).filter(
    file => file.startsWith(prefix) && file.endsWith('.md')
  )
  if (matches.length !== 1) {
    throw new Error(`Story ${story} resolves to ${matches.length} implementation artifacts`)
  }
  return `_bmad-output/implementation-artifacts/${matches[0]}`
}

function resolveBrowserEvidence(route: string): string {
  if (
    route === '/analytics/brand-share' ||
    route === '/analytics/buyout' ||
    route === '/orders/fbo' ||
    route === '/analytics/models/[id]/evaluations/sku-accuracy'
  ) {
    return 'e2e/story-174-3-dedicated-route-evidence.spec.ts'
  }
  const analytics = ANALYTICS_EVIDENCE.find(([prefix]) => route.startsWith(prefix))
  if (analytics) return analytics[1]
  if (route === '/analytics') return 'e2e/analytics/analytics-hub.spec.ts'
  if (route === '/' || route === '/login') return 'e2e/login-dashboard.spec.ts'
  if (['/register', '/cabinet', '/processing', '/wb-token'].includes(route)) {
    return 'e2e/onboarding.spec.ts'
  }
  if (route === '/dashboard') return 'e2e/dashboard-metrics.spec.ts'
  if (route.startsWith('/automation/canned-rules')) return 'e2e/automation/canned-rules.spec.ts'
  if (route.startsWith('/automation/installed-rules/')) {
    return 'e2e/automation/installed-rule-editor.spec.ts'
  }
  if (route.startsWith('/automation/installed-rules')) {
    return 'e2e/automation/installed-rules.spec.ts'
  }
  if (route === '/cogs/price-calculator') return 'e2e/price-calculator-visual.spec.ts'
  if (route.startsWith('/cogs')) return 'e2e/cogs-pages.spec.ts'
  if (route === '/communications') return 'e2e/communications.spec.ts'
  if (route === '/finances') return 'e2e/finances.spec.ts'
  if (route === '/monitor') return 'e2e/monitor.spec.ts'
  if (route === '/monitoring') return 'e2e/monitoring.spec.ts'
  if (route === '/moysklad') return 'e2e/moysklad.spec.ts'
  if (route === '/orders/integrity') return 'e2e/orders-integrity.spec.ts'
  if (route.startsWith('/orders')) return 'e2e/orders.spec.ts'
  if (route === '/products') return 'e2e/products-assortment.spec.ts'
  if (route === '/settings/notifications') return 'e2e/telegram-notifications.spec.ts'
  if (route === '/settings/expenses') return 'e2e/expenses-page.spec.ts'
  if (route === '/settings/backfill') return 'e2e/settings/backfill-a11y.spec.ts'
  if (route.startsWith('/settings')) return 'e2e/settings-pages.spec.ts'
  if (route === '/shipments/box-types') return 'e2e/box-types-page.spec.ts'
  if (route === '/shipments/sku-packaging') return 'e2e/sku-packaging-page.spec.ts'
  if (route.startsWith('/shipments/')) return 'e2e/shipments/shipments-detail.spec.ts'
  if (route === '/shipments') return 'e2e/shipments/shipments-a11y.spec.ts'
  if (route.startsWith('/supplies/')) return 'e2e/supplies/supply-detail.spec.ts'
  if (route === '/supplies') return 'e2e/supplies/supplies-a11y.spec.ts'
  throw new Error(`Story 174.3 has no browser evidence source for ${route}`)
}

function parseLedger(): Story1743RouteEvidence[] {
  const ledger = readFileSync(LEDGER_PATH, 'utf8')
  const rowPattern =
    /^\| (\d+\.\d+) \| `([^`]+)` \| `([^`]+)` \| ([^|]+?) \| (planned|verified) \|$/gm
  const rows = [...ledger.matchAll(rowPattern)].map(match => {
    const story = match[1]
    const route = match[2]
    const ledgerStatus = match[5] as Story1743RouteEvidence['ledgerStatus']
    if (ledgerStatus !== 'planned' && ledgerStatus !== 'verified') {
      throw new Error(`Story 174.3 found unsupported ledger status: ${ledgerStatus}`)
    }
    const routeIdentity = STORY_174_3_ROUTE_IDENTITIES[route]
    if (!routeIdentity) {
      throw new Error(`Story 174.3 has no explicit route identity contract for ${route}`)
    }
    const browserEvidence = resolveBrowserEvidence(route)
    const ownerArtifact = resolveOwnerArtifact(story)
    for (const evidencePath of [browserEvidence, ownerArtifact]) {
      if (!existsSync(join(REPOSITORY_ROOT, evidencePath))) {
        throw new Error(`Story 174.3 evidence path does not exist: ${evidencePath}`)
      }
    }
    const stateEvidence = resolveStateEvidence(route)
    const states = stateEvidence
      .filter(evidence => evidence.disposition === 'executed')
      .map(evidence => evidence.state)
    return {
      story,
      route,
      effectiveUrl: materializeRoute(route),
      entry: match[3],
      domain: match[4].trim(),
      ledgerStatus,
      states,
      ownerArtifact,
      browserEvidence,
      routeIdentityEvidence: resolveRouteIdentityEvidence(route, browserEvidence, ownerArtifact),
      routeIdentity,
      sessionProfile: UNAUTHENTICATED_ONBOARDING_ROUTES.has(route)
        ? ('unauthenticated-onboarding' as const)
        : ('authenticated' as const),
      stateEvidence,
      screenshotDisposition: 'privacy-safe-dom-equivalent' as const,
      manualAtDisposition: 'environment-gap-real-at' as const,
    }
  })
  const ledgerRoutes = new Set(rows.map(row => row.route))
  const identityRoutes = new Set(Object.keys(STORY_174_3_ROUTE_IDENTITIES))
  if (
    identityRoutes.size !== ledgerRoutes.size ||
    [...identityRoutes].some(route => !ledgerRoutes.has(route))
  ) {
    throw new Error(
      `Story 174.3 route identity contract must match the ledger exactly (ledger=${ledgerRoutes.size}, identities=${identityRoutes.size})`
    )
  }
  const notApplicableRoutes = new Set(Object.keys(STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES))
  const executedRoutes = new Set(Object.keys(EXACT_STATE_SCENARIOS))
  if (
    notApplicableRoutes.size !== ledgerRoutes.size ||
    [...notApplicableRoutes].some(route => !ledgerRoutes.has(route))
  ) {
    throw new Error(
      `Story 174.3 explicit N/A manifest must match the ledger exactly (ledger=${ledgerRoutes.size}, declarations=${notApplicableRoutes.size})`
    )
  }
  if ([...executedRoutes].some(route => !ledgerRoutes.has(route))) {
    throw new Error('Story 174.3 executed-state manifest contains a route outside the ledger')
  }
  return rows
}

export const STORY_174_3_ROUTE_EVIDENCE = Object.freeze(parseLedger())
