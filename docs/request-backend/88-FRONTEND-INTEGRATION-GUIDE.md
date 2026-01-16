# Request #88: Frontend Integration Guide - Individual Product Metrics for Merged Groups

**Backend Status**: ✅ **COMPLETE** - Ready for frontend integration
**Backend Completion**: 2025-12-29
**API Version**: v1
**Related Backend Epics**: Epic 36 (Product Card Linking), Epic 35 (Organic Sales)

---

## 🎯 Что реализовано на Backend

### Краткое описание

Backend расширил API endpoint `GET /v1/analytics/advertising/stats` новой вложенной структурой для merged groups:

**ДО** (Epic 36 - базовая версия):
- Aggregate метрики на уровне группы
- Простой массив `mergedProducts[]` с 5 полями (nmId, vendorCode, spend, revenue, orders)

**ПОСЛЕ** (Request #88 - расширенная версия):
- ✅ Aggregate метрики (14 полей) в отдельном объекте `aggregateMetrics`
- ✅ Идентификация главного продукта в `mainProduct` объекте
- ✅ Количество продуктов в группе `productCount`
- ✅ Полные метрики по каждому продукту в `products[]` массиве (**18 полей на продукт**)
- ✅ Интеграция с Epic 35 (totalSales, organicSales, organicContribution)
- ✅ Сортировка: главный продукт первым, затем по totalSales DESC
- ✅ LEGACY поле `mergedProducts[]` сохранено (backward compatibility)

---

## 📡 API Endpoint

### Базовая информация

**URL**: `GET /v1/analytics/advertising/stats`

**Authentication**:
```
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {CABINET_UUID}
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `from` | string | ✅ Yes | - | Начало периода (YYYY-MM-DD) |
| `to` | string | ✅ Yes | - | Конец периода (YYYY-MM-DD) |
| `groupBy` | string | No | `sku` | Режим группировки: `sku` или `imtId` |
| `viewBy` | string | No | `sku` | Срез данных: `sku`, `brand`, `category` |
| `page` | number | No | 1 | Номер страницы |
| `limit` | number | No | 50 | Размер страницы (max 100) |
| `sortBy` | string | No | `spend` | Поле для сортировки |
| `sortOrder` | string | No | `desc` | `asc` или `desc` |

**Для получения merged groups с полными метриками**:
```
GET /v1/analytics/advertising/stats?groupBy=imtId&from=2025-12-01&to=2025-12-07
```

---

## 📊 Response Structure

### Merged Group (type: 'merged_group')

**Полная структура**:

```typescript
{
  // Базовая информация
  type: 'merged_group',                    // Тип элемента
  imtId: 328632,                           // WB merged card ID (склейка)
  key: 'group:328632',                     // Уникальный ключ
  label: 'Merged Group 328632',            // Лейбл для UI

  // Request #88: Новая вложенная структура
  mainProduct: {                           // ← NEW: Главный продукт
    nmId: 270937054,                       // nmId главного продукта
    vendorCode: 'ter-13-1',                // Артикул главного продукта
    name: 'Product Name'                   // Название (optional, может быть undefined)
  },

  productCount: 6,                         // ← NEW: Количество продуктов в группе

  aggregateMetrics: {                      // ← NEW: Агрегированные метрики группы
    // Standard metrics
    totalViews: 6200,                      // Показы (сумма по всем продуктам)
    totalClicks: 310,                      // Клики (сумма)
    totalOrders: 13,                       // Заказы (сумма)
    totalSpend: 11337,                     // Расход на рекламу (сумма)
    totalRevenue: 34058,                   // Выручка от рекламы (сумма)

    // Epic 35: Total Sales & Organic Split
    totalSales: 35570,                     // Общая выручка (органика + реклама)
    organicSales: 1512,                    // Органическая выручка (totalSales - totalRevenue)
    organicContribution: 4.25,             // Доля органики в % (organicSales / totalSales × 100)

    // Calculated metrics
    roas: 3.0,                             // ROAS (totalRevenue / totalSpend), null если spend = 0
    roi: 2.0,                              // ROI ((totalRevenue - totalSpend) / totalSpend), null если spend = 0
    ctr: 5.0,                              // CTR ((totalClicks / totalViews) × 100)
    cpc: 36.57,                            // CPC (totalSpend / totalClicks), null если clicks = 0
    conversionRate: 4.19,                  // CR ((totalOrders / totalClicks) × 100)
    profitAfterAds: 22721                  // Прибыль после рекламных расходов
  },

  products: [                              // ← ENHANCED: Индивидуальные метрики (18 полей)
    {
      // Identity (4 fields)
      nmId: 270937054,                     // Product SKU
      vendorCode: 'ter-13-1',              // Артикул продавца
      imtId: 328632,                       // WB merged card ID
      isMainProduct: true,                 // true = получает рекламные расходы

      // Standard metrics (5 fields)
      totalViews: 3500,                    // Индивидуальные показы
      totalClicks: 180,                    // Индивидуальные клики
      totalOrders: 8,                      // Индивидуальные заказы
      totalSpend: 11337,                   // Индивидуальные расходы (может быть 0)
      totalRevenue: 20000,                 // Индивидуальная выручка от рекламы

      // Epic 35 integration (3 fields)
      totalSales: 20000,                   // Общая выручка продукта
      organicSales: 0,                     // Органическая выручка
      organicContribution: 0,              // Доля органики %

      // Calculated metrics (6 fields)
      roas: 1.76,                          // ROAS продукта (null если spend = 0)
      roi: 0.76,                           // ROI продукта (null если spend = 0)
      ctr: 5.14,                           // CTR продукта
      cpc: 62.98,                          // CPC продукта (null если clicks = 0)
      conversionRate: 4.44,                // Conversion rate продукта
      profitAfterAds: 8663                 // Прибыль после рекламы
    },
    {
      // Второй продукт (не главный)
      nmId: 173588306,
      vendorCode: 'ter-09',
      imtId: 328632,
      isMainProduct: false,                // false = не получает рекламные расходы
      totalViews: 2700,
      totalClicks: 130,
      totalOrders: 5,
      totalSpend: 0,                       // ← Не главный продукт (spend = 0)
      totalRevenue: 14058,
      totalSales: 15570,
      organicSales: 1512,                  // Есть органические продажи
      organicContribution: 9.71,
      roas: null,                          // ← null т.к. spend = 0
      roi: null,                           // ← null т.к. spend = 0
      ctr: 4.81,
      cpc: null,                           // ← null т.к. spend = 0
      conversionRate: 3.85,
      profitAfterAds: 14058                // = profit (т.к. spend = 0)
    }
    // ... остальные продукты
  ],

  // LEGACY fields (backward compatibility, будут deprecated в API V2)
  mergedProducts: [                        // ← LEGACY: сохранено для старых клиентов
    {
      nmId: 270937054,
      vendorCode: 'ter-13-1',
      spend: 11337,                        // = products[0].totalSpend
      revenue: 20000,                      // = products[0].totalRevenue
      orders: 8                            // = products[0].totalOrders
    },
    {
      nmId: 173588306,
      vendorCode: 'ter-09',
      spend: 0,
      revenue: 14058,
      orders: 5
    }
  ],

  // Flat metrics (для backward compatibility с Epic 36)
  views: 6200,                             // = aggregateMetrics.totalViews
  clicks: 310,                             // = aggregateMetrics.totalClicks
  orders: 13,                              // = aggregateMetrics.totalOrders
  spend: 11337,                            // = aggregateMetrics.totalSpend
  revenue: 34058,                          // = aggregateMetrics.totalRevenue
  totalSales: 35570,                       // = aggregateMetrics.totalSales
  organicSales: 1512,                      // = aggregateMetrics.organicSales
  organicContribution: 4.25,               // = aggregateMetrics.organicContribution
  roas: 3.0,                               // = aggregateMetrics.roas
  roi: 2.0,                                // = aggregateMetrics.roi
  ctr: 5.0,                                // = aggregateMetrics.ctr
  cpc: 36.57,                              // = aggregateMetrics.cpc
  conversionRate: 4.19,                    // = aggregateMetrics.conversionRate
  profitAfterAds: 22721                    // = aggregateMetrics.profitAfterAds
}
```

---

## 🔧 Frontend Integration Patterns

### 1. Идентификация главного продукта

**Способ 1: Через поле `mainProduct`** (рекомендуется):
```typescript
// Главный продукт доступен напрямую
const mainProductNmId = item.mainProduct?.nmId;
const mainProductVendorCode = item.mainProduct?.vendorCode;
```

**Способ 2: Через массив `products[]`**:
```typescript
// Найти главный продукт в массиве
const mainProduct = item.products?.find(p => p.isMainProduct);
```

**Гарантии backend**:
- ✅ Ровно 1 продукт с `isMainProduct: true` в каждой группе
- ✅ Это продукт с `totalSpend > 0` (или первый, если все spend = 0)
- ✅ `mainProduct.nmId` всегда совпадает с nmId из `products[]` где `isMainProduct: true`

---

### 2. Отображение количества продуктов

**Использование**:
```tsx
// Badge с количеством продуктов
{item.type === 'merged_group' && (
  <Badge variant="secondary">
    {item.productCount} продуктов
  </Badge>
)}
```

**Гарантии backend**:
- ✅ `productCount` всегда равен `item.products.length`
- ✅ Присутствует только для `type: 'merged_group'`
- ✅ Minimum = 2 (если 1 продукт → тип будет `individual`)

---

### 3. Работа с aggregate метриками

**Использование для группы в целом**:
```typescript
// Метрики на уровне всей группы (14 полей)
const {
  totalViews,
  totalClicks,
  totalOrders,
  totalSpend,
  totalRevenue,
  totalSales,        // Epic 35: organic + advertising
  organicSales,      // Epic 35: totalSales - totalRevenue
  organicContribution, // Epic 35: % органики
  roas,              // null если totalSpend = 0
  roi,               // null если totalSpend = 0
  ctr,
  cpc,               // null если totalClicks = 0
  conversionRate,
  profitAfterAds
} = item.aggregateMetrics;

// Отображение в UI
<div>
  <p>Общий расход группы: {totalSpend.toLocaleString()} ₽</p>
  <p>ROAS группы: {roas?.toFixed(2) ?? 'N/A'}</p>
  <p>Органическая доля: {organicContribution.toFixed(1)}%</p>
</div>
```

**Null handling**:
- `roas`, `roi` могут быть `null` (когда `totalSpend = 0`)
- `cpc` может быть `null` (когда `totalClicks = 0`)
- Все остальные поля всегда `number` (не null)

---

### 4. Таблица индивидуальных продуктов (18 полей)

**Структура `products[]` массива**:
```typescript
type MergedGroupProduct = {
  // Identity (4 fields)
  nmId: number;              // Product SKU
  vendorCode: string;        // Артикул продавца
  imtId: number;             // WB merged card ID
  isMainProduct: boolean;    // true = главный продукт (получает рекламу)

  // Standard metrics (5 fields)
  totalViews: number;        // Показы
  totalClicks: number;       // Клики
  totalOrders: number;       // Заказы
  totalSpend: number;        // Расход на рекламу
  totalRevenue: number;      // Выручка от рекламы

  // Epic 35: Organic sales (3 fields)
  totalSales: number;        // Общая выручка (органика + реклама)
  organicSales: number;      // Органическая выручка
  organicContribution: number; // Доля органики в % (0-100)

  // Calculated metrics (6 fields)
  roas: number | null;       // ROAS (revenue / spend)
  roi: number | null;        // ROI ((revenue - spend) / spend)
  ctr: number;               // CTR ((clicks / views) × 100)
  cpc: number | null;        // CPC (spend / clicks)
  conversionRate: number;    // CR ((orders / clicks) × 100)
  profitAfterAds: number;    // Прибыль после рекламных расходов
};
```

**Пример таблицы**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Артикул</TableHead>
      <TableHead>Тип</TableHead>
      <TableHead>Показы</TableHead>
      <TableHead>Клики</TableHead>
      <TableHead>CTR</TableHead>
      <TableHead>Заказы</TableHead>
      <TableHead>CR</TableHead>
      <TableHead>Расход</TableHead>
      <TableHead>Выручка</TableHead>
      <TableHead>ROAS</TableHead>
      <TableHead>Общая выручка</TableHead>
      <TableHead>Органика</TableHead>
      <TableHead>Прибыль</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {item.products?.map((product) => (
      <TableRow key={product.nmId}>
        <TableCell>
          {product.vendorCode}
          {product.isMainProduct && (
            <Badge variant="primary">Главный</Badge>
          )}
        </TableCell>
        <TableCell>{product.isMainProduct ? 'Main' : 'Merged'}</TableCell>
        <TableCell>{product.totalViews.toLocaleString()}</TableCell>
        <TableCell>{product.totalClicks.toLocaleString()}</TableCell>
        <TableCell>{product.ctr.toFixed(2)}%</TableCell>
        <TableCell>{product.totalOrders}</TableCell>
        <TableCell>{product.conversionRate.toFixed(2)}%</TableCell>
        <TableCell>{product.totalSpend.toLocaleString()} ₽</TableCell>
        <TableCell>{product.totalRevenue.toLocaleString()} ₽</TableCell>
        <TableCell>{product.roas?.toFixed(2) ?? 'N/A'}</TableCell>
        <TableCell>{product.totalSales.toLocaleString()} ₽</TableCell>
        <TableCell>
          {product.organicSales.toLocaleString()} ₽
          ({product.organicContribution.toFixed(1)}%)
        </TableCell>
        <TableCell>{product.profitAfterAds.toLocaleString()} ₽</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 5. Сортировка products[] массива

**Backend гарантирует сортировку**:
1. **Главный продукт всегда первый** (`products[0].isMainProduct === true`)
2. **Остальные отсортированы по `totalSales` DESC**

**Клиентская сортировка НЕ НУЖНА**:
```typescript
// ❌ НЕ ДЕЛАЙТЕ ТАК (backend уже отсортировал)
const sorted = item.products?.sort((a, b) => {
  if (a.isMainProduct) return -1;
  return b.totalSales - a.totalSales;
});

// ✅ ПРОСТО ИСПОЛЬЗУЙТЕ КАК ЕСТЬ
const products = item.products; // Уже отсортировано!
```

**Преимущества**:
- Консистентная сортировка на всех клиентах
- Меньше кода на frontend
- Главный продукт всегда на вершине таблицы

---

### 6. Epic 35: Organic Sales Integration

**Формулы** (для валидации на frontend):
```typescript
// Органическая выручка
organicSales = totalSales - totalRevenue;

// Доля органики в процентах
organicContribution = (organicSales / totalSales) × 100;
```

**Доступно на двух уровнях**:

**1. Aggregate level** (вся группа):
```typescript
const organicPct = item.aggregateMetrics.organicContribution; // 4.25%
```

**2. Product level** (каждый продукт):
```typescript
item.products.forEach(product => {
  console.log(`${product.vendorCode}: ${product.organicContribution.toFixed(1)}% органики`);
});
```

**Edge cases**:
- ✅ Negative `organicSales` возможны (WB API иногда переатрибутирует продажи рекламе)
- ✅ `organicContribution` может быть отрицательным (например, -15%)
- ✅ При `totalSales = 0` → `organicContribution = 0` (деление на ноль обработано)

---

### 7. Null handling для calculated метрик

**Метрики с возможным `null`**:
- `roas` - null когда `totalSpend = 0`
- `roi` - null когда `totalSpend = 0`
- `cpc` - null когда `totalClicks = 0`

**UI Pattern**:
```tsx
// Безопасное отображение null значений
const formatMetric = (value: number | null, decimals = 2) => {
  return value !== null ? value.toFixed(decimals) : 'N/A';
};

// Использование
<TableCell>{formatMetric(product.roas)}</TableCell>
<TableCell>{formatMetric(product.roi)}</TableCell>
<TableCell>{formatMetric(product.cpc)}</TableCell>
```

**Цветовая индикация** (опционально):
```tsx
// ROAS индикатор
const roasColor = (roas: number | null) => {
  if (roas === null) return 'gray';
  if (roas >= 3) return 'green';   // Excellent
  if (roas >= 2) return 'blue';    // Good
  if (roas >= 1) return 'yellow';  // Break-even
  return 'red';                     // Loss
};
```

---

### 8. Backward Compatibility (LEGACY)

**LEGACY поле `mergedProducts[]`** сохранено для старых клиентов:

```typescript
// Если вы используете старый код Epic 36
const legacyProducts = item.mergedProducts; // Всё ещё работает

// Миграция на новую структуру (Request #88)
const newProducts = item.products; // Рекомендуется
```

**Mapping LEGACY → NEW**:
| LEGACY поле | NEW поле | Комментарий |
|-------------|----------|-------------|
| `mergedProducts[i].nmId` | `products[i].nmId` | Одинаковый nmId |
| `mergedProducts[i].vendorCode` | `products[i].vendorCode` | Одинаковый артикул |
| `mergedProducts[i].spend` | `products[i].totalSpend` | Rename |
| `mergedProducts[i].revenue` | `products[i].totalRevenue` | Rename |
| `mergedProducts[i].orders` | `products[i].totalOrders` | Rename |

**План deprecation**:
- 2025-12-29: LEGACY поля работают (текущий статус)
- 2026-Q1: Мониторинг использования LEGACY полей
- 2026-Q2: Deprecation warning в API docs
- 2026-Q3: Удаление LEGACY полей в API V2

---

## 🧪 Тестовые запросы

### Пример 1: Получить merged groups за неделю

**Request**:
```bash
GET /v1/analytics/advertising/stats?groupBy=imtId&from=2025-12-01&to=2025-12-07
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-Cabinet-Id: 550e8400-e29b-41d4-a716-446655440000
```

**Expected Response**:
```json
{
  "items": [
    {
      "type": "merged_group",
      "imtId": 328632,
      "mainProduct": { "nmId": 270937054, "vendorCode": "ter-13-1" },
      "productCount": 6,
      "aggregateMetrics": { /* 14 fields */ },
      "products": [ /* 6 products × 18 fields */ ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

---

### Пример 2: Проверить конкретную группу

**Request**:
```bash
# Фильтр по конкретному imtId (если backend поддерживает)
GET /v1/analytics/advertising/stats?groupBy=imtId&imtId=328632&from=2025-12-01&to=2025-12-07
```

---

### Пример 3: Single product с imtId

**Request**:
```bash
GET /v1/analytics/advertising/stats?groupBy=imtId&from=2025-12-01&to=2025-12-07
```

**Expected Response** (для single product):
```json
{
  "items": [
    {
      "type": "individual",      // ← НЕ merged_group
      "nmId": 123456789,
      "imtId": null,             // Может быть null или число
      "mainProduct": undefined,  // ← Отсутствует для individual
      "productCount": undefined, // ← Отсутствует для individual
      "aggregateMetrics": undefined, // ← Отсутствует для individual
      "products": undefined,     // ← Отсутствует для individual
      "views": 1000,
      "clicks": 50,
      // ... flat metrics
    }
  ]
}
```

---

## 📋 Checklist для Frontend Integration

### Обязательные проверки

**Базовая интеграция**:
- [ ] Endpoint `GET /v1/analytics/advertising/stats?groupBy=imtId` подключен
- [ ] JWT auth и `X-Cabinet-Id` header настроены
- [ ] Response TypeScript типы созданы (можно скопировать из backend DTOs)

**UI Components**:
- [ ] Отображается `mainProduct` (nmId + vendorCode)
- [ ] Отображается `productCount` badge/label
- [ ] Aggregate метрики из `aggregateMetrics` объекта
- [ ] Таблица продуктов из `products[]` массива (все 18 полей)

**Data Handling**:
- [ ] Null handling для `roas`, `roi`, `cpc`
- [ ] Negative `organicSales` обрабатывается корректно
- [ ] `isMainProduct: true` визуально выделен (badge/icon/цвет)
- [ ] Сортировка не применяется клиентом (используется backend sorting)

**Backward Compatibility**:
- [ ] Старый код Epic 36 не сломался (если есть)
- [ ] Переход с `mergedProducts[]` на `products[]` выполнен

---

## 🔗 Ссылки на Backend документацию

### Основные документы

**Request #88 - Полная спецификация**:
- 📄 `frontend/docs/request-backend/88-epic-37-individual-product-metrics.md`
- Содержит: требования, implementation plan, acceptance criteria, API examples

**Epic 36 - Product Card Linking**:
- 📄 `docs/epics/epic-36-product-card-linking.md`
- Содержит: базовую структуру merged groups, imtId концепцию

**Epic 35 - Total Sales & Organic Split**:
- 📄 `docs/epics/epic-35-total-sales-organic-split.md`
- Содержит: формулы для totalSales, organicSales, organicContribution

**WB Dashboard Metrics**:
- 📄 `docs/WB-DASHBOARD-METRICS.md`
- Содержит: соответствие наших метрик дашборду WB

**API Paths Reference**:
- 📄 `docs/API-PATHS-REFERENCE.md`
- Содержит: все endpoints, auth, rate limits

### Backend DTOs (для TypeScript типов)

**Копируйте типы из**:
- 📄 `src/analytics/dto/response/advertising-response.dto.ts`
- Lines 78-100: `MainProductDto`
- Lines 102-190: `AggregateMetricsDto`
- Lines 192-307: `MergedGroupProductDto`
- Lines 320-363: `AdvertisingItemDto` (расширенный)

**Или используйте Swagger**:
- 🌐 `http://localhost:3000/api#/Analytics/AdvertisingStatsController_getStats`

---

## ⚠️ Важные замечания

### Data Integrity

**Backend валидация** (в development mode):
- Проверяет `aggregateMetrics = SUM(products[])` для 6 метрик
- Tolerance: ±0.01 для floating point
- Логирует warnings при нарушениях

**Рекомендация для frontend**:
- Можете добавить аналогичную клиентскую валидацию (опционально)
- Если видите warnings в backend logs → сообщите backend team

---

### Performance

**Текущая производительность** (Epic 36 baseline):
- p50: ~50-80ms
- p95: ~100-150ms
- p99: ~150-200ms

**Request #88 impact**:
- Response size: 5x увеличение (18 полей vs 5 полей)
- Latency: без значительного увеличения (те же SQL queries)
- Pagination: поддерживается (limit max 100)

**Рекомендации**:
- Используйте pagination для больших периодов
- Кэшируйте ответы на клиенте (если нужно)
- Мониторьте размер ответа при большом количестве групп

---

### Type Safety Tips

**TypeScript интерфейсы**:
```typescript
// Базовый интерфейс (скопируйте из backend DTOs)
interface MergedGroupItem {
  type: 'merged_group';
  imtId: number;
  mainProduct: {
    nmId: number;
    vendorCode: string;
    name?: string;
  };
  productCount: number;
  aggregateMetrics: {
    totalViews: number;
    totalClicks: number;
    totalOrders: number;
    totalSpend: number;
    totalRevenue: number;
    totalSales: number;
    organicSales: number;
    organicContribution: number;
    roas: number | null;
    roi: number | null;
    ctr: number;
    cpc: number | null;
    conversionRate: number;
    profitAfterAds: number;
  };
  products: Array<{
    nmId: number;
    vendorCode: string;
    imtId: number;
    isMainProduct: boolean;
    totalViews: number;
    totalClicks: number;
    totalOrders: number;
    totalSpend: number;
    totalRevenue: number;
    totalSales: number;
    organicSales: number;
    organicContribution: number;
    roas: number | null;
    roi: number | null;
    ctr: number;
    cpc: number | null;
    conversionRate: number;
    profitAfterAds: number;
  }>;
  // ... другие поля
}

// Type guard
function isMergedGroup(item: any): item is MergedGroupItem {
  return item.type === 'merged_group' && item.products !== undefined;
}

// Использование
if (isMergedGroup(item)) {
  // TypeScript знает, что item.products существует
  const mainProduct = item.products[0]; // Безопасно
}
```

---

## 🐛 Известные ограничения

### Technical Debt (Minor)

**1. Optional profit/efficiency fields**:
- Поля `profit` и `efficiency` опциональны в `products[]` массиве
- Причина: backward compatibility с Epic 36
- Impact: Low - не влияет на Request #88 функциональность
- Timeline: Будет исправлено в API V2

**2. LEGACY field deprecation**:
- Поле `mergedProducts[]` будет удалено в API V2
- Рекомендация: мигрируйте на `products[]` сейчас
- Timeline: Deprecation в Q2 2026

---

## 📞 Поддержка и вопросы

### Куда обращаться

**Вопросы по API**:
- Backend Team: Slack #backend-team
- API Documentation: `docs/API-PATHS-REFERENCE.md`
- Swagger: `http://localhost:3000/api`

**Баги и issues**:
- GitHub Issues: тег `[Request #88]`
- Slack: #backend-qa channel

**Срочные вопросы**:
- Тегайте @backend-team в Slack
- Или @sarah-po для business questions

---

## 🚀 Quick Start Guide

### Минимальный integration checklist

**За 30 минут**:
1. ✅ Добавьте TypeScript типы (скопируйте из backend DTOs)
2. ✅ Подключите endpoint с `groupBy=imtId` parameter
3. ✅ Отобразите `mainProduct` и `productCount`
4. ✅ Создайте таблицу из `products[]` массива
5. ✅ Добавьте null handling для `roas`, `roi`, `cpc`

**Готово!** Базовая интеграция работает.

---

### Расширенная интеграция (по желанию)

**Дополнительные фичи**:
- Aggregate metrics display (14 полей)
- Epic 35 organic sales charts
- Main product highlighting (badge/icon)
- Negative organicSales indicators
- Custom sorting (клиентская, поверх backend sorting)

---

## 📊 Testing Recommendations

### Тестовые кейсы для frontend

**Базовые тесты**:
1. Merged group с 2 продуктами отображается корректно
2. Merged group с 6+ продуктами отображается корректно
3. Main product визуально выделен
4. Products[] отсортирован корректно (main first)
5. Null values (roas/roi/cpc) обработаны

**Epic 35 тесты**:
6. Organic sales отображаются корректно
7. Negative organic sales не ломают UI
8. Organic contribution % корректно вычислен

**Edge cases**:
9. Merged group где все `totalSpend = 0`
10. Merged group с negative `organicSales`
11. Single product с `imtId` (должен быть `type: 'individual'`)

---

## 🎯 Success Criteria

**Ваша интеграция готова когда**:
- ✅ Все 18 полей на продукт отображаются в UI
- ✅ Main product визуально выделен
- ✅ Aggregate metrics отображаются (14 полей)
- ✅ Null values корректно обработаны
- ✅ Epic 35 organic sales работают
- ✅ Старый код Epic 36 не сломался (если есть)

---

## 📚 Дополнительные ресурсы

**Backend Architecture**:
- `docs/architecture/04-data-models.md` - Data models
- `docs/architecture/06-external-apis.md` - WB SDK integration

**Epic References**:
- `docs/epics/epic-33-advertising-analytics-api.md` - Advertising API foundation
- `docs/epics/epic-35-total-sales-organic-split.md` - Organic sales
- `docs/epics/epic-36-product-card-linking.md` - Merged groups

**Completed Epics**:
- `docs/COMPLETED-EPICS-REFERENCE.md` - All completed epics reference

---

**Backend Team**
**Completion Date**: 2025-12-29
**Final Commit**: `72aa54d`
**Status**: ✅ Production Ready

**Questions?** Пишите в #backend-team! 🚀
