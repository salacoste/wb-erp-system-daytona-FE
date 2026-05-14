# 151: Epics 68-71 — Funnel / Buyout / Conversion / Returns Analytics API

**Дата создания:** 2026-02-18
**Статус:** COMPLETE — Backend Ready for Frontend Integration
**Epics:** 68 (Marketing Funnel), 69 (Buyout Rate), 70 (Conversion), 71 (Returns)
**Тесты:** 560+ unit tests, QA validated
**Test API:** `test-api/29-funnel-analytics.http`, `test-api/32-buyout-analytics.http`, `test-api/33-return-analytics.http`

---

## Обзор: 8 новых эндпоинтов

| Метод | Эндпоинт | Epic | Cache TTL | Описание |
|-------|----------|------|-----------|----------|
| GET | `/v1/analytics/funnel` | 68 | 5 мин | Per-SKU маркетинговая воронка |
| GET | `/v1/analytics/funnel/sync-status` | 68 | — | Статус синхронизации воронки |
| GET | `/v1/analytics/buyout/by-sku` | 69 | 30 мин | Per-SKU % выкупа |
| GET | `/v1/analytics/buyout/summary` | 69 | 30 мин | Сводка выкупа по кабинету |
| GET | `/v1/analytics/returns/reasons` | 71 | 5 мин | Агрегированная аналитика возвратов |
| GET | `/v1/analytics/returns/reasons/by-sku` | 71 | 5 мин | Per-SKU разбивка возвратов |
| GET | `/v1/analytics/product/:nmId/unified` | 70 | — | Объединённая аналитика товара* |
| GET | `/v1/analytics/product/:nmId/organic-share` | 70 | — | Доля органического трафика* |

> \* Epic 70 — внутренние сервисы, маршруты могут быть не подключены к контроллеру. Данные доступны через другие эндпоинты.

---

## Quick Start для Frontend

### 1. Воронка продаж (Epic 68)

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-02-18
**Summary**: Epics 68-71 complete with 560+ unit tests. 8 new endpoints: funnel analytics (2), buyout analytics (2), returns analytics (2), unified product analytics (2). Funnel buyout enrichment uses query-time pattern with 30-min cache. See CLAUDE.md MEMORY for buyout data source details.
**Remaining frontend action**: Integrate funnel, buyout, and returns pages using provided endpoint documentation.
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Per-SKU воронка — основной запрос
const { data: funnel } = useQuery({
  queryKey: ['analytics', 'funnel', cabinetId, from, to],
  queryFn: () => apiClient.get('/v1/analytics/funnel', {
    params: { from, to, groupBy: 'product', limit: 50, offset: 0 },
  }),
  staleTime: 4 * 60_000, // чуть меньше cache TTL (5 мин)
});

// Временной ряд — для графиков
const { data: funnelTimeSeries } = useQuery({
  queryKey: ['analytics', 'funnel', 'timeseries', cabinetId, from, to],
  queryFn: () => apiClient.get('/v1/analytics/funnel', {
    params: { from, to, groupBy: 'day' },
  }),
  enabled: isChartTabActive,
});

// Статус синхронизации — для индикатора свежести данных
const { data: syncStatus } = useQuery({
  queryKey: ['analytics', 'funnel', 'sync-status', cabinetId],
  queryFn: () => apiClient.get('/v1/analytics/funnel/sync-status'),
  refetchInterval: 60_000,
});
```

### 2. Аналитика выкупов (Epic 69)

```typescript
// Per-SKU выкуп — таблица с фильтрами
const { data: buyout } = useQuery({
  queryKey: ['analytics', 'buyout', 'by-sku', cabinetId, from, to, source],
  queryFn: () => apiClient.get('/v1/analytics/buyout/by-sku', {
    params: { from, to, source: 'blended', trend: true, limit: 50 },
  }),
  staleTime: 25 * 60_000, // чуть меньше cache TTL (30 мин)
});

// Сводка по кабинету — для виджета/карточки
const { data: buyoutSummary } = useQuery({
  queryKey: ['analytics', 'buyout', 'summary', cabinetId, from, to],
  queryFn: () => apiClient.get('/v1/analytics/buyout/summary', {
    params: { from, to },
  }),
  staleTime: 25 * 60_000,
});
```

### 3. Аналитика возвратов (Epic 71)

```typescript
// Агрегированные причины возвратов — для круговой диаграммы
const { data: returns } = useQuery({
  queryKey: ['analytics', 'returns', 'reasons', cabinetId, from, to],
  queryFn: () => apiClient.get('/v1/analytics/returns/reasons', {
    params: { cabinetId, from, to, locale: 'ru' },
  }),
  staleTime: 4 * 60_000,
});

// Per-SKU возвраты — таблица с аномалиями
const { data: returnsBySku } = useQuery({
  queryKey: ['analytics', 'returns', 'by-sku', cabinetId, from, to],
  queryFn: () => apiClient.get('/v1/analytics/returns/reasons/by-sku', {
    params: { cabinetId, from, to, limit: 100 },
  }),
  staleTime: 4 * 60_000,
});
```

---

## Авторизация

### Funnel & Buyout (Epics 68, 69) — через `X-Cabinet-Id` header

```http
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Автоматически** добавляется `apiClient` — дополнительных действий на фронте не нужно.

- **Guards:** JwtAuthGuard + CabinetGuard + RolesGuard (Funnel), JwtAuthGuard + CabinetGuard (Buyout)
- **Роли (Funnel):** Manager, Owner, Analyst
- **Ошибки:** `401` — нет/невалидный JWT, `403` — нет доступа к кабинету

### Returns (Epic 71) — `cabinetId` как query parameter

```http
Authorization: Bearer {{token}}
GET /v1/analytics/returns/reasons?cabinetId={{cabinetId}}&from=2026-02-01&to=2026-02-18
```

**Важно:** В отличие от Funnel/Buyout, Returns НЕ использует `X-Cabinet-Id` header. Нужно передавать `cabinetId` в query params.

- **Guards:** JwtAuthGuard + validateCabinetAccess (проверка user.cabinetIds)
- **Ошибки:** `401` — нет/невалидный JWT, `403` — "Access denied: No access to this cabinet"

---

## Эндпоинт 1: Per-SKU Funnel Data

### GET /v1/analytics/funnel

Маркетинговая воронка: просмотры → корзина → заказы → выкупы → отмены.

#### Query Parameters

| Параметр | Тип | Обязательный | Default | Описание |
|----------|-----|:---:|---------|----------|
| `from` | string (YYYY-MM-DD) | ✅ | — | Начало периода |
| `to` | string (YYYY-MM-DD) | ✅ | — | Конец периода |
| `nmIds` | number[] | — | все | Фильтр по артикулам (через запятую) |
| `groupBy` | `product` \| `day` | — | `product` | Группировка: по товару или по дням |
| `sort` | `openCardCount` \| `ordersCount` \| `buyoutCount` \| `totalConversion` \| `cancelRate` | — | `openCardCount` | Поле сортировки |
| `order` | `asc` \| `desc` | — | `desc` | Направление сортировки |
| `limit` | number (1-500) | — | 50 | Размер страницы |
| `offset` | number (≥0) | — | 0 | Смещение для пагинации |

#### Response: `groupBy=product` (по умолчанию)

```typescript
interface FunnelResponse {
  items: FunnelProductItem[];
  summary: FunnelSummary;
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

interface FunnelProductItem {
  nmId: number;
  vendorCode?: string;       // артикул поставщика
  brandName?: string;
  openCardCount: number;     // просмотры карточки
  addToCartCount: number;    // добавления в корзину
  ordersCount: number;       // заказы
  buyoutCount: number;       // выкупы
  cancelCount: number;       // отмены
  cartConversion: number;    // % просмотр → корзина
  orderConversion: number;   // % корзина → заказ
  buyoutConversion: number;  // % заказ → выкуп
  cancelRate: number;        // % отмен
  totalConversion: number;   // % просмотр → выкуп (сквозная)
}

interface FunnelSummary {
  avgCartConversion?: number;
  avgOrderConversion?: number;
  avgBuyoutConversion?: number;
  avgCancelRate?: number;
  avgTotalConversion: number;
  totalOpenCards: number;
  totalOrders: number;
  totalBuyouts: number;
}
```

#### Response: `groupBy=day` (для графиков)

```typescript
interface FunnelDayItem {
  date: string;              // "2026-02-15"
  openCardCount: number;
  addToCartCount: number;
  ordersCount: number;
  buyoutCount: number;
  cancelCount: number;
  totalConversion: number;
}
```

#### Пример запроса

```http
GET /v1/analytics/funnel?from=2026-02-01&to=2026-02-18&groupBy=product&sort=totalConversion&order=desc&limit=20
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

---

## Эндпоинт 2: Funnel Sync Status

### GET /v1/analytics/funnel/sync-status

Статус синхронизации данных воронки. Используйте для отображения "данные актуальны на..." в UI.

#### Response

```typescript
interface FunnelSyncStatus {
  lastSyncAt: string | null;  // ISO datetime или null (если ещё не синхронизировалось)
  recordsCount: number;       // кол-во записей в product_funnel_daily
  productsCount: number;      // кол-во уникальных nmId с данными
}
```

**Рекомендация UI:** Если `lastSyncAt === null`, показать "Данные ещё не загружены. Синхронизация происходит ежедневно в 05:00 МСК."

---

## Эндпоинт 3: Per-SKU Buyout Rates

### GET /v1/analytics/buyout/by-sku

Per-SKU процент выкупа с тремя источниками данных.

#### Query Parameters

| Параметр | Тип | Обязательный | Default | Описание |
|----------|-----|:---:|---------|----------|
| `from` | string (YYYY-MM-DD) | ✅ | — | Начало периода |
| `to` | string (YYYY-MM-DD) | ✅ | — | Конец периода |
| `source` | `weekly` \| `realtime` \| `blended` | — | `blended` | Источник данных |
| `trend` | boolean | — | `false` | Включить сравнение с предыдущим периодом |
| `nmId` | number | — | все | Фильтр по одному артикулу |
| `minSales` | number | — | 0 | Мин. кол-во продаж для включения |
| `sort` | `buyoutRate` \| `salesCount` \| `returnRate` \| `trend` | — | `buyoutRate` | Поле сортировки |
| `sortOrder` | `asc` \| `desc` | — | `asc` | Направление |
| `limit` | number (1-500) | — | 50 | Размер страницы |
| `offset` | number (≥0) | — | 0 | Смещение |

#### Источники данных (`source`)

| Значение | Источник | Задержка | Когда использовать |
|----------|----------|----------|---------------------|
| `weekly` | `wb_finance_raw` | 1-2 дня | Точные финансовые данные |
| `realtime` | `orders_fbs` (статусы) | ~15 мин | Оперативный мониторинг |
| `blended` | Средневзвешенное | — | По умолчанию, баланс точности и актуальности |

#### Response

```typescript
interface BySkuBuyoutResponse {
  data: BySkuBuyoutItem[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

interface BySkuBuyoutItem {
  nmId: number;
  supplierArticle: string | null;
  productName: string | null;
  brand: string | null;
  category?: string | null;
  salesCount: number;
  returnsCount: number;
  buyoutRatePct: number | null;    // 0-100, null если нет продаж
  returnRatePct?: number | null;   // 100 - buyoutRatePct
  source?: string;                 // 'weekly' | 'realtime' | 'blended'
  confidence?: string;             // 'high' (≥50 продаж) | 'medium' (10-49) | 'low' (<10)
  // Поля тренда (только если trend=true)
  trend?: string;                  // 'up' | 'down' | 'stable'
  trendDelta?: number;             // изменение в процентных пунктах
  previousBuyoutRatePct?: number | null;
}
```

#### Рекомендации UI

- **confidence='low'**: Показать предупреждение "Мало данных для точного расчёта"
- **buyoutRatePct=null**: Показать "—" (нет продаж за период)
- **trend='down' + trendDelta < -5**: Выделить красным — значительное снижение выкупа

---

## Эндпоинт 4: Cabinet Buyout Summary

### GET /v1/analytics/buyout/summary

Сводка по всему кабинету — для карточки/виджета на дашборде.

#### Query Parameters

| Параметр | Тип | Обязательный | Default | Описание |
|----------|-----|:---:|---------|----------|
| `from` | string (YYYY-MM-DD) | ✅ | — | Начало периода |
| `to` | string (YYYY-MM-DD) | ✅ | — | Конец периода |
| `source` | `weekly` \| `realtime` \| `blended` | — | `weekly` | Источник данных |

#### Response

```typescript
interface BuyoutSummaryResponse {
  overallBuyoutRatePct: number | null;   // общий % выкупа
  overallReturnRatePct: number | null;   // общий % возврата
  totalSalesCount: number;
  totalReturnsCount: number;
  skuCount?: number;                     // кол-во SKU в выборке
  topDecliners?: BuyoutDecliner[];       // ТОП-5 SKU с падением выкупа
  period: { from: string; to: string };
  source: string;
  confidence: string;
}

interface BuyoutDecliner {
  nmId: number;
  currentBuyoutRate: number | null;
  previousBuyoutRate: number | null;
  declinePct: number;                    // снижение в п.п.
}
```

#### Рекомендация UI: Виджет "Процент выкупа"

```
┌─────────────────────────────────┐
│  Процент выкупа    [blended ▾]  │
│  ████████████░░ 78.5%           │
│  Возвраты: 21.5% (342 из 1592) │
│                                 │
│  ⚠ Снижение выкупа:            │
│  • Артикул 148190 — 65% (−12)  │
│  • Артикул 223841 — 71% (−8)   │
└─────────────────────────────────┘
```

---

## Эндпоинт 5: Aggregated Return Reasons

### GET /v1/analytics/returns/reasons

Агрегированная статистика возвратов по категориям.

#### Query Parameters

| Параметр | Тип | Обязательный | Default | Описание |
|----------|-----|:---:|---------|----------|
| `cabinetId` | string (UUID) | ✅ | — | ID кабинета (**в query, не в header!**) |
| `from` | string (YYYY-MM-DD) | — | −30 дней | Начало периода |
| `to` | string (YYYY-MM-DD) | — | сегодня | Конец периода |
| `locale` | `ru` \| `en` | — | `ru` | Язык отображаемых названий |

#### Response

```typescript
interface ReturnReasonsResponse {
  summary: {
    totalReturns: number;
    cancelBeforeShipment: number;    // отмены до отправки
    refusalAtPvz: number;            // отказы на ПВЗ
    returnAfterReceipt: number;      // возвраты после получения
    overallReturnRate: number;       // общий % возвратов
    classificationCoverage: number;  // % классифицированных (0-100)
  };
  byCategory: ReturnCategoryItem[];
  period: { from: string; to: string };
}

interface ReturnCategoryItem {
  category: string;            // 'cancel_before_shipment' | 'refusal_at_pvz' | 'return_after_receipt'
  displayName: string;         // Локализованное название (зависит от locale)
  count: number;
  percentage: number;          // доля от total (0-100)
  trend: 'up' | 'down' | 'stable';
  trendDelta: number;
}
```

#### Локализация `displayName`

| category | locale=ru | locale=en |
|----------|-----------|-----------|
| `cancel_before_shipment` | Отмена до отправки | Cancelled before shipment |
| `refusal_at_pvz` | Отказ на ПВЗ | Refused at pickup point |
| `return_after_receipt` | Возврат после получения | Returned after receipt |

#### Рекомендация UI: Круговая диаграмма

```
        Причины возвратов (156)
   ┌──────────────────────────┐
   │      ╭──────╮            │
   │    ╭─┤ 42%  ├─╮          │
   │   ╱  ╰──────╯  ╲         │
   │  │   Отмена до   │        │
   │  │   отправки     │        │
   │   ╲  ╭──────╮  ╱         │
   │    ╰─┤ 35%  ├─╯          │
   │      ╰──────╯            │
   │   Отказ на ПВЗ: 35%      │
   │   После получения: 23%    │
   │                           │
   │   Покрытие: 94%           │
   └──────────────────────────┘
```

---

## Эндпоинт 6: Per-SKU Return Breakdown

### GET /v1/analytics/returns/reasons/by-sku

Разбивка возвратов по SKU с флагами аномалий.

#### Query Parameters

| Параметр | Тип | Обязательный | Default | Описание |
|----------|-----|:---:|---------|----------|
| `cabinetId` | string (UUID) | ✅ | — | ID кабинета (**в query, не в header!**) |
| `from` | string (YYYY-MM-DD) | — | −30 дней | Начало периода |
| `to` | string (YYYY-MM-DD) | — | сегодня | Конец периода |
| `nmId` | number | — | все | Фильтр по одному артикулу |
| `anomalyOnly` | boolean | — | `false` | Только аномальные SKU |
| `sortBy` | string | — | — | Поле сортировки (напр. `returnRate`) |
| `sortOrder` | `asc` \| `desc` | — | `desc` | Направление сортировки |
| `limit` | number (1-500) | — | 100 | Размер страницы |
| `cursor` | string | — | — | Курсор для пагинации (nmId последнего элемента) |

#### Response

```typescript
interface BySkuResponse {
  data: BySkuDataItem[];
  pagination: {
    count: number;
    hasMore: boolean;
    nextCursor?: string;         // nmId последнего элемента (передать в cursor для след. страницы)
  };
  summary: {
    totalSkus: number;
    anomalyCount: number;        // кол-во SKU с аномальным % возврата
  };
}

interface BySkuDataItem {
  nmId: number;
  productName: string;
  brand: string;
  totalReturns: number;
  returnRate: number;            // % возвратов
  cancelBeforeShipment: number;
  refusalAtPvz: number;
  returnAfterReceipt: number;
  anomalyFlag: boolean;          // true если returnRate > 2× среднего по кабинету
}
```

#### Пагинация (cursor-based)

```typescript
// Первая страница
const page1 = await apiClient.get('/v1/analytics/returns/reasons/by-sku', {
  params: { cabinetId, from, to, limit: 50 },
});

// Следующая страница (если есть)
if (page1.pagination.hasMore) {
  const page2 = await apiClient.get('/v1/analytics/returns/reasons/by-sku', {
    params: { cabinetId, from, to, limit: 50, cursor: page1.pagination.nextCursor },
  });
}
```

#### Рекомендация UI: Таблица с аномалиями

- **anomalyFlag=true**: Выделить строку красным фоном, показать иконку ⚠️
- **anomalyOnly=true**: Кнопка "Показать только проблемные" — фильтрует на бэкенде
- **returnRate > 50%**: Красный текст
- **returnRate 20-50%**: Жёлтый текст
- **returnRate < 20%**: Зелёный текст

---

## Формулы (для отображения в UI)

### Процент выкупа (Epic 69)

```
buyoutRate = (salesCount - returnsCount) / salesCount × 100
returnRate = 100 - buyoutRate
```

- При `salesCount = 0` → `null` (показать "—")
- При `returnsCount > salesCount` → ограничивается 0% (аномалия, показать warning)

### Уровень уверенности (confidence)

| salesCount | confidence | UI |
|-----------|------------|-----|
| ≥ 50 | `high` | Без пометок |
| 10-49 | `medium` | Серый бейдж "Мало данных" |
| < 10 | `low` | Жёлтый бейдж "Недостаточно данных" |

### Конверсии воронки (Epic 68)

```
cartConversion   = addToCartCount / openCardCount × 100
orderConversion  = ordersCount / addToCartCount × 100
buyoutConversion = buyoutCount / ordersCount × 100
cancelRate       = cancelCount / ordersCount × 100
totalConversion  = buyoutCount / openCardCount × 100
```

### Аномалия возвратов (Epic 71)

```
anomalyFlag = true если returnRate > (средний returnRate по кабинету × 2)
```

---

## Обработка ошибок

| Код | Причина | Действие на фронте |
|-----|---------|---------------------|
| `400` | Невалидные параметры (from/to, limit, etc.) | Показать validation error |
| `401` | Нет/невалидный JWT | Redirect на /login |
| `403` | Нет доступа к кабинету | Показать "Нет доступа" |
| `200` + пустой `data[]` | Нет данных за период | Показать empty state "Нет данных за выбранный период" |

### Типичные ошибки

```json
// 400: Missing required params
{ "statusCode": 400, "message": ["from must be a valid ISO 8601 date string"] }

// 403: Cabinet access denied (Returns endpoint)
{ "statusCode": 403, "message": "Access denied: No access to this cabinet" }
```

---

## TypeScript типы для фронта

Скопируйте этот файл как `src/types/analytics-epics-68-71.ts`:

```typescript
// ============================================================
// Epic 68: Funnel Analytics
// ============================================================

export interface FunnelProductItem {
  nmId: number;
  vendorCode?: string;
  brandName?: string;
  openCardCount: number;
  addToCartCount: number;
  ordersCount: number;
  buyoutCount: number;
  cancelCount: number;
  cartConversion: number;
  orderConversion: number;
  buyoutConversion: number;
  cancelRate: number;
  totalConversion: number;
}

export interface FunnelDayItem {
  date: string;
  openCardCount: number;
  addToCartCount: number;
  ordersCount: number;
  buyoutCount: number;
  cancelCount: number;
  totalConversion: number;
}

export interface FunnelSummary {
  avgCartConversion?: number;
  avgOrderConversion?: number;
  avgBuyoutConversion?: number;
  avgCancelRate?: number;
  avgTotalConversion: number;
  totalOpenCards: number;
  totalOrders: number;
  totalBuyouts: number;
}

export interface FunnelPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface FunnelResponse {
  items: (FunnelProductItem | FunnelDayItem)[];
  summary: FunnelSummary;
  pagination: FunnelPagination;
}

export interface FunnelSyncStatus {
  lastSyncAt: string | null;
  recordsCount: number;
  productsCount: number;
}

// ============================================================
// Epic 69: Buyout Analytics
// ============================================================

export type BuyoutSource = 'weekly' | 'realtime' | 'blended';
export type BuyoutConfidence = 'high' | 'medium' | 'low';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface BySkuBuyoutItem {
  nmId: number;
  supplierArticle: string | null;
  productName: string | null;
  brand: string | null;
  category?: string | null;
  salesCount: number;
  returnsCount: number;
  buyoutRatePct: number | null;
  returnRatePct?: number | null;
  source?: BuyoutSource;
  confidence?: BuyoutConfidence;
  trend?: TrendDirection;
  trendDelta?: number;
  previousBuyoutRatePct?: number | null;
}

export interface BySkuBuyoutResponse {
  data: BySkuBuyoutItem[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

export interface BuyoutSummaryResponse {
  overallBuyoutRatePct: number | null;
  overallReturnRatePct: number | null;
  totalSalesCount: number;
  totalReturnsCount: number;
  skuCount?: number;
  topDecliners?: Array<{
    nmId: number;
    currentBuyoutRate: number | null;
    previousBuyoutRate: number | null;
    declinePct: number;
  }>;
  period: { from: string; to: string };
  source: string;
  confidence: string;
}

// ============================================================
// Epic 71: Return Analytics
// ============================================================

export type ReturnCategory = 'cancel_before_shipment' | 'refusal_at_pvz' | 'return_after_receipt';

export interface ReturnCategoryItem {
  category: ReturnCategory;
  displayName: string;
  count: number;
  percentage: number;
  trend: TrendDirection;
  trendDelta: number;
}

export interface ReturnReasonsResponse {
  summary: {
    totalReturns: number;
    cancelBeforeShipment: number;
    refusalAtPvz: number;
    returnAfterReceipt: number;
    overallReturnRate: number;
    classificationCoverage: number;
  };
  byCategory: ReturnCategoryItem[];
  period: { from: string; to: string };
}

export interface BySkuReturnItem {
  nmId: number;
  productName: string;
  brand: string;
  totalReturns: number;
  returnRate: number;
  cancelBeforeShipment: number;
  refusalAtPvz: number;
  returnAfterReceipt: number;
  anomalyFlag: boolean;
}

export interface BySkuReturnResponse {
  data: BySkuReturnItem[];
  pagination: { count: number; hasMore: boolean; nextCursor?: string };
  summary: { totalSkus: number; anomalyCount: number };
}
```

---

## Связанные файлы

| Ресурс | Путь |
|--------|------|
| **Funnel Controller** | `src/analytics/controllers/funnel-analytics.controller.ts` |
| **Buyout Controller** | `src/analytics/controllers/buyout-analytics.controller.ts` |
| **Returns Controller** | `src/analytics/controllers/return-analytics.controller.ts` |
| **Funnel Query DTO** | `src/analytics/dto/query/funnel-query.dto.ts` |
| **Funnel Response DTO** | `src/analytics/dto/response/funnel-response.dto.ts` |
| **Buyout DTOs** | `src/analytics/dto/buyout-rate.dto.ts` |
| **Return Query DTO** | `src/analytics/dto/return-analytics-query.dto.ts` |
| **Return Response DTO** | `src/analytics/dto/return-analytics-response.dto.ts` |
| **Buyout Formula** | `src/analytics/utils/buyout-formula.ts` |
| **WB Status Classifier** | `src/analytics/utils/wb-status-classifier.ts` |
| **Test API: Funnel** | `test-api/29-funnel-analytics.http` |
| **Test API: Buyout** | `test-api/32-buyout-analytics.http` |
| **Test API: Returns** | `test-api/33-return-analytics.http` |
| **Swagger UI** | `http://localhost:3000/api` |
