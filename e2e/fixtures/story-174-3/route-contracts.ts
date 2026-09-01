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

export type Story1743State = (typeof STORY_174_3_STATES)[number]

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
  runner?: 'vitest' | 'playwright'
  exitCode?: number
  startedAt?: string
  durationMs?: number
  supportingExecutions?: readonly Story1743SupportingStateExecution[]
  declarationSource?: string
  declarationSha256?: string
  declarationLine?: number
  declarationId?: string
  blockerId?: string
}

export type Story1743SupportingStateExecution = {
  source: string
  sourceSha256: string
  line: number
  scenarioId: string
  command: string
  kind: 'owner-browser-executable' | 'owner-unit-executable'
  runner: 'vitest' | 'playwright'
  exitCode: number
  startedAt: string
  durationMs: number
}

export const STORY_174_3_DYNAMIC_SEGMENTS: Readonly<Record<string, string>> = {
  advertId: '1743001',
  id: '1743001',
  nmId: '174300001',
}

export const STORY_174_3_UNAUTHENTICATED_ONBOARDING_ROUTES = new Set([
  '/cabinet',
  '/processing',
  '/wb-token',
])

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
      expectedText: `Аналитика товара #${STORY_174_3_DYNAMIC_SEGMENTS.nmId}`,
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
      expectedText: `Отчёт #${STORY_174_3_DYNAMIC_SEGMENTS.id}`,
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
      expectedText: `Кампания #${STORY_174_3_DYNAMIC_SEGMENTS.advertId}`,
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

export const STORY_174_3_ANALYTICS_EVIDENCE: readonly [string, string][] = [
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
