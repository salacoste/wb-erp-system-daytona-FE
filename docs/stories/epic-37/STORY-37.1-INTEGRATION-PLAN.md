# Story 37.1: Backend API Integration - Implementation Plan

**Epic**: Epic 37 - Merged Group Table Display (Склейки)
**Story**: Story 37.1 - Backend API Validation → **ПЕРЕИМЕНОВАНА**: Backend API Integration
**Backend Status**: ✅ COMPLETE (Request #88, 2025-12-29)
**Frontend Status**: 🚧 READY TO START
**Effort**: 2-3 hours (интеграция + тестирование)
**Priority**: HIGH (разблокирует Epic 37 для production)
**Assignee**: Frontend Dev Team

---

## 📋 Что нужно сделать

**Цель**: Заменить mock данные на реальный backend API для MergedGroupTable компонента.

**Текущее состояние**:
- ✅ Backend API готов и протестирован (Request #88)
- ✅ Frontend компонент работает с mock данными
- ✅ Unit tests покрывают все формулы (77 tests passing)
- 🚧 Интеграция с real API отсутствует

**Результат после Story 37.1**:
- ✅ MergedGroupTable получает данные из `/v1/analytics/advertising?groupBy=imtId`
- ✅ Mock данные удалены
- ✅ Feature flag `useRealApi` включен
- ✅ Production-ready интеграция

---

## 🎯 Acceptance Criteria (Обновлённые)

### API Integration (AC 1-8)
1. ✅ TypeScript типы обновлены для новой API структуры (aggregateMetrics, products[], mainProduct)
2. ✅ API client функция `getAdvertisingAnalytics()` обрабатывает `groupBy=imtId`
3. ✅ Transformation layer: backend response → frontend MergedGroup[] type
4. ✅ Page.tsx использует реальный API вместо mock данных
5. ✅ Feature flag `features.epic37MergedGroups.useRealApi = true`
6. ✅ Error handling для API errors (400, 401, 403, 404, 500)
7. ✅ Loading states отображаются корректно
8. ✅ Empty state обрабатывается (нет merged groups в кабинете)

### Data Validation (AC 9-14)
9. ✅ Aggregate метрики корректны (SUM всех продуктов)
10. ✅ Main product идентифицируется правильно (`isMainProduct: true`)
11. ✅ Crown icon отображается только для main product
12. ✅ ROAS = null для child products (spend = 0)
13. ✅ Сортировка продуктов: main first, then by totalSales DESC
14. ✅ Organic contribution calculations correct (формулы Epic 35)

### Cleanup (AC 15-16)
15. ✅ Mock data import удалён из page.tsx
16. ✅ Mock data файлы переведены в archived состояние (или удалены)

---

## 📁 Файлы для изменения

### 1. TypeScript Types (ОБНОВИТЬ)

**Файл**: `src/types/advertising-analytics.ts`

**Что добавить**:
```typescript
// Request #88: New nested structure for merged groups
export interface AggregateMetrics {
  // Standard metrics
  totalViews: number;
  totalClicks: number;
  totalOrders: number;
  totalSpend: number;
  totalRevenue: number;

  // Epic 35: Total sales & organic split
  totalSales: number;
  organicSales: number;
  organicContribution: number;

  // Calculated metrics
  roas: number | null;      // null if totalSpend = 0
  roi: number | null;       // null if totalSpend = 0
  ctr: number;
  cpc: number | null;       // null if totalClicks = 0
  conversionRate: number;
  profitAfterAds: number;
}

export interface MainProductInfo {
  nmId: number;
  vendorCode: string;
  name?: string;            // Optional: product name
}

export interface MergedGroupProduct {
  // Identity
  nmId: number;
  vendorCode: string;
  imtId: number | null;     // null for standalone products
  isMainProduct: boolean;   // true = receives ad spend

  // Standard metrics
  totalViews: number;
  totalClicks: number;
  totalOrders: number;
  totalSpend: number;
  totalRevenue: number;

  // Epic 35: Organic sales
  totalSales: number;
  organicSales: number;
  organicContribution: number;

  // Calculated metrics
  roas: number | null;
  roi: number | null;
  ctr: number;
  cpc: number | null;
  conversionRate: number;
  profitAfterAds: number;
}

// Extend existing AdvertisingItem type for merged groups
export interface MergedGroupItem extends AdvertisingItem {
  type: 'merged_group';
  imtId: number;

  // Request #88: New fields
  mainProduct: MainProductInfo;
  productCount: number;
  aggregateMetrics: AggregateMetrics;
  products: MergedGroupProduct[];

  // LEGACY: Backward compatibility (будет deprecated)
  mergedProducts?: Array<{
    nmId: number;
    vendorCode: string;
    spend: number;
    revenue: number;
    orders: number;
  }>;
}
```

**Локация**: После существующих типов, перед экспортом

---

### 2. API Client (ОБНОВИТЬ)

**Файл**: `src/lib/api/advertising-analytics.ts`

**Функция для обновления**: `getAdvertisingAnalytics()`

**Текущая проблема**: API client не передаёт `groupBy` параметр в backend

**Что добавить**:
```typescript
export async function getAdvertisingAnalytics(
  params: AdvertisingAnalyticsParams
): Promise<AdvertisingAnalyticsResponse> {
  // Build query string
  const queryParams = {
    from: params.from,
    to: params.to,
    view_by: params.viewBy,
    group_by: params.groupBy,  // ← ADD THIS: передать groupBy в backend
    page: params.page,
    limit: params.limit,
    sort_by: params.sortBy,
    sort_order: params.sortOrder,
    efficiency_filter: params.efficiencyFilter,
    campaign_ids: params.campaignIds,
  }

  const queryString = buildQueryString(queryParams)
  const response = await apiClient<AdvertisingAnalyticsResponse>({
    endpoint: `/v1/analytics/advertising?${queryString}`,
    options: {
      method: 'GET',
    },
  })

  return response
}
```

**Критичные изменения**:
- ✅ `group_by: params.groupBy` - передача режима группировки
- ✅ Backend вернёт новую структуру с `aggregateMetrics`, `products[]`, `mainProduct`

---

### 3. Page Component (ОБНОВИТЬ)

**Файл**: `src/app/(dashboard)/analytics/advertising/page.tsx`

**Изменения**:

#### 3.1 Удалить mock data import
```typescript
// ❌ УДАЛИТЬ строку 30:
import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'
```

#### 3.2 Обновить mergedGroupsData useMemo
```typescript
// Заменить строки 215-231
const mergedGroupsData = useMemo(() => {
  if (!features.epic37MergedGroups.enabled || groupBy !== 'imtId') {
    return []
  }

  // ✅ НОВАЯ ЛОГИКА: Трансформация real API response
  if (!data?.data) {
    return []
  }

  // Filter только merged_group типы
  const mergedGroups = data.data.filter(
    (item): item is MergedGroupItem => item.type === 'merged_group'
  )

  if (features.epic37MergedGroups.debug) {
    console.log('[Epic 37] Loaded from API:', mergedGroups.length, 'groups')
  }

  return mergedGroups
}, [groupBy, data])
```

#### 3.3 Обновить feature flag

**Файл**: `src/config/features.ts`

```typescript
export const features = {
  epic37MergedGroups: {
    enabled: true,
    useRealApi: true,  // ← ИЗМЕНИТЬ: false → true
    debug: false,      // ← ВЫКЛЮЧИТЬ debug для production
  },
}
```

---

### 4. Transformation Layer (СОЗДАТЬ)

**Файл**: `src/lib/transformers/advertising-transformers.ts` (новый файл)

**Цель**: Конвертировать backend response в frontend types (если нужно)

**Код**:
```typescript
/**
 * Advertising Analytics Data Transformers
 *
 * Transforms backend API responses to frontend-compatible types.
 * Request #88: Supports new nested structure for merged groups.
 */

import type {
  MergedGroupItem,
  MergedGroupProduct,
  AggregateMetrics
} from '@/types/advertising-analytics'

/**
 * Transform backend merged group response to frontend MergedGroupItem.
 *
 * NOTE: As of Request #88, backend already returns the exact structure
 * we need, so this is mostly a pass-through with type validation.
 */
export function transformMergedGroup(
  backendItem: unknown
): MergedGroupItem | null {
  // Type guard: verify it's a merged_group type
  const item = backendItem as any

  if (item.type !== 'merged_group') {
    return null
  }

  // Verify required fields exist
  if (!item.imtId || !item.aggregateMetrics || !item.products) {
    console.warn('[Transformer] Invalid merged group data:', item)
    return null
  }

  // Return as-is (backend structure matches frontend)
  return item as MergedGroupItem
}

/**
 * Transform array of backend items, filtering only merged groups.
 */
export function transformMergedGroups(
  backendData: unknown[]
): MergedGroupItem[] {
  return backendData
    .map(transformMergedGroup)
    .filter((item): item is MergedGroupItem => item !== null)
}
```

**Применение**:
```typescript
// В page.tsx
import { transformMergedGroups } from '@/lib/transformers/advertising-transformers'

const mergedGroupsData = useMemo(() => {
  if (!features.epic37MergedGroups.enabled || groupBy !== 'imtId') {
    return []
  }

  if (!data?.data) {
    return []
  }

  // Трансформация с валидацией
  return transformMergedGroups(data.data)
}, [groupBy, data])
```

---

### 5. Mock Data (АРХИВИРОВАТЬ)

**Файл для архивирования**:
- `src/mocks/data/epic-37-merged-groups.ts`

**Опции**:
- **Option A**: Переместить в `src/mocks/archive/` (для будущих reference)
- **Option B**: Полностью удалить (если не нужен)

**Рекомендация PO**: Option A - сохранить для тестов и документации

---

## ✅ TODO List для Frontend Team

### Phase 1: Type Updates (30 минут)

- [ ] **Task 1.1**: Открыть `src/types/advertising-analytics.ts`
- [ ] **Task 1.2**: Добавить типы `AggregateMetrics`, `MainProductInfo`, `MergedGroupProduct`
- [ ] **Task 1.3**: Расширить `MergedGroupItem` type с новыми полями
- [ ] **Task 1.4**: Проверить TypeScript compilation (0 errors)

### Phase 2: API Client Update (20 минут)

- [ ] **Task 2.1**: Открыть `src/lib/api/advertising-analytics.ts`
- [ ] **Task 2.2**: В `getAdvertisingAnalytics()` добавить `group_by: params.groupBy` в queryParams
- [ ] **Task 2.3**: Проверить что `AdvertisingAnalyticsParams` имеет поле `groupBy?: GroupByMode`
- [ ] **Task 2.4**: Test API call manually с Postman/curl для проверки response

### Phase 3: Transformation Layer (20 минут)

- [ ] **Task 3.1**: Создать `src/lib/transformers/advertising-transformers.ts`
- [ ] **Task 3.2**: Скопировать код трансформации из integration guide
- [ ] **Task 3.3**: Добавить validation для required fields
- [ ] **Task 3.4**: Добавить error logging для invalid data

### Phase 4: Page Integration (30 минут)

- [ ] **Task 4.1**: Открыть `src/app/(dashboard)/analytics/advertising/page.tsx`
- [ ] **Task 4.2**: Удалить строку 30: `import { mockMergedGroups } from ...`
- [ ] **Task 4.3**: Обновить `mergedGroupsData` useMemo (строки 215-231)
- [ ] **Task 4.4**: Импортировать `transformMergedGroups` transformer
- [ ] **Task 4.5**: Применить трансформацию: `transformMergedGroups(data.data)`

### Phase 5: Feature Flag Update (5 минут)

- [ ] **Task 5.1**: Открыть `src/config/features.ts`
- [ ] **Task 5.2**: Изменить `useRealApi: false` → `useRealApi: true`
- [ ] **Task 5.3**: Изменить `debug: true` → `debug: false` (production)

### Phase 6: Testing (30 минут)

- [ ] **Task 6.1**: Запустить dev server: `npm run dev`
- [ ] **Task 6.2**: Открыть `/analytics/advertising?group_by=imtId`
- [ ] **Task 6.3**: Проверить Network tab: API call с `group_by=imtId`
- [ ] **Task 6.4**: Проверить Console: нет errors, нет mock data log
- [ ] **Task 6.5**: Визуальная проверка: таблица рендерится корректно
- [ ] **Task 6.6**: Проверить aggregate row: метрики совпадают с backend
- [ ] **Task 6.7**: Проверить detail rows: crown icon на main product
- [ ] **Task 6.8**: Проверить сортировку: продукты сортируются (main first, then totalSales DESC)
- [ ] **Task 6.9**: Проверить hover effect на detail rows
- [ ] **Task 6.10**: Проверить responsive behavior (mobile/tablet)

### Phase 7: Cleanup (10 минут)

- [ ] **Task 7.1**: Переместить `src/mocks/data/epic-37-merged-groups.ts` → `src/mocks/archive/`
- [ ] **Task 7.2**: Создать `src/mocks/archive/README.md` с пояснением
- [ ] **Task 7.3**: Удалить неиспользуемые импорты (ESLint check)
- [ ] **Task 7.4**: Run TypeScript build: `npm run build`
- [ ] **Task 7.5**: Verify 0 errors, 0 warnings

---

## 🔍 Пошаговая инструкция

### Step 1: Backup Current Code

```bash
# Создать backup branch
git checkout -b backup/pre-story-37.1-integration
git add .
git commit -m "backup: Pre-Story 37.1 - before API integration"
git checkout main  # или ваш feature branch
```

### Step 2: Update TypeScript Types

**Файл**: `src/types/advertising-analytics.ts`

**Локация**: После существующих типов (строка ~450)

**Код для вставки**: См. секцию "Файлы для изменения" выше

**Проверка**:
```bash
npm run type-check
# Должно пройти без errors
```

### Step 3: Update API Client

**Файл**: `src/lib/api/advertising-analytics.ts`

**Найти функцию**: `getAdvertisingAnalytics()` (строка ~100)

**Изменить**:
```typescript
// BEFORE
const queryParams = {
  from: params.from,
  to: params.to,
  view_by: params.viewBy,
  // group_by отсутствует ❌
}

// AFTER
const queryParams = {
  from: params.from,
  to: params.to,
  view_by: params.viewBy,
  group_by: params.groupBy,  // ✅ ДОБАВИТЬ
  page: params.page,
  limit: params.limit,
  sort_by: params.sortBy,
  sort_order: params.sortOrder,
  efficiency_filter: params.efficiencyFilter,
  campaign_ids: params.campaignIds,
}
```

**Проверить интерфейс**: `AdvertisingAnalyticsParams` должен иметь `groupBy?: GroupByMode`

### Step 4: Create Transformation Layer

**Создать файл**: `src/lib/transformers/advertising-transformers.ts`

**Код**: См. секцию "Файлы для изменения #4" выше

**Проверка**:
```bash
npm run lint
# Должно пройти без errors
```

### Step 5: Update Page Component

**Файл**: `src/app/(dashboard)/analytics/advertising/page.tsx`

**Изменение 1** (строка 30): Удалить mock import
```typescript
// ❌ УДАЛИТЬ:
import { mockMergedGroups } from '@/mocks/data/epic-37-merged-groups'
```

**Изменение 2** (после строки 26): Добавить transformer import
```typescript
// ✅ ДОБАВИТЬ:
import { transformMergedGroups } from '@/lib/transformers/advertising-transformers'
```

**Изменение 3** (строки 215-231): Заменить mergedGroupsData useMemo
```typescript
// ❌ УДАЛИТЬ старую логику с mock:
const mergedGroupsData = useMemo(() => {
  if (!features.epic37MergedGroups.enabled || groupBy !== 'imtId') {
    return []
  }

  if (!features.epic37MergedGroups.useRealApi) {
    if (features.epic37MergedGroups.debug) {
      console.log('[Epic 37] Using MOCK data:', mockMergedGroups.length, 'groups')
    }
    return mockMergedGroups
  }

  return []
}, [groupBy])

// ✅ ЗАМЕНИТЬ на:
const mergedGroupsData = useMemo(() => {
  if (!features.epic37MergedGroups.enabled || groupBy !== 'imtId') {
    return []
  }

  if (!data?.data) {
    return []
  }

  // Transform backend response to frontend types
  const groups = transformMergedGroups(data.data)

  if (features.epic37MergedGroups.debug) {
    console.log('[Epic 37] Loaded from API:', groups.length, 'groups')
  }

  return groups
}, [groupBy, data])
```

### Step 6: Update Feature Flag

**Файл**: `src/config/features.ts`

**Найти**:
```typescript
export const features = {
  epic37MergedGroups: {
    enabled: true,
    useRealApi: false,  // ❌ ИЗМЕНИТЬ
    debug: true,        // ❌ ИЗМЕНИТЬ
  },
}
```

**Заменить на**:
```typescript
export const features = {
  epic37MergedGroups: {
    enabled: true,
    useRealApi: true,   // ✅ Production: use real API
    debug: false,       // ✅ Production: disable debug logs
  },
}
```

### Step 7: Test Integration

**Start dev server**:
```bash
npm run dev
```

**Open browser**:
```
http://localhost:3000/analytics/advertising?group_by=imtId
```

**Checklist визуальной проверки**:
- [ ] Network tab: API call с `group_by=imtId` выполняется
- [ ] Console: нет errors, нет "Using MOCK data" logs
- [ ] Таблица отображается с данными из API
- [ ] Aggregate row: метрики корректны (totalSales, revenue, ROAS)
- [ ] Detail rows: продукты отображаются
- [ ] Crown icon: появляется только на main product
- [ ] Hover effect: работает на detail rows
- [ ] Sorting: работает при клике на column headers

**Test с разными кабинетами**:
- Кабинет С merged groups (должны отображаться)
- Кабинет БЕЗ merged groups (должен показать empty state)

### Step 8: Cleanup Mock Data

**Архивировать mock файл**:
```bash
mkdir -p src/mocks/archive
git mv src/mocks/data/epic-37-merged-groups.ts src/mocks/archive/
echo "# Mock Data Archive\n\nArchived mock data for reference and testing.\n" > src/mocks/archive/README.md
```

**Проверка**:
```bash
npm run lint
npm run type-check
npm run build
# Все должно пройти успешно ✅
```

---

## 🧪 Testing Checklist

### Manual Testing (30 минут)

#### Test Case 1: Happy Path (merged group с 6 продуктами)
- [ ] Navigate to `/analytics/advertising?group_by=imtId`
- [ ] Verify API call: `GET /v1/analytics/advertising?...&group_by=imtId`
- [ ] Verify response status: 200 OK
- [ ] Verify table renders with:
  - Rowspan cell (group ID)
  - Aggregate row (gray background, semibold)
  - 6 detail rows (white background)
- [ ] Verify main product has crown icon (👑)
- [ ] Verify child products NO crown icon
- [ ] Verify aggregate totalSales = SUM(all products)
- [ ] Verify ROAS: main product = number, child products = "—"

#### Test Case 2: Single Product Group
- [ ] Find standalone product (imtId = null)
- [ ] Verify renders as single row (no aggregate row)
- [ ] Verify crown icon shows (standalone = main by default)

#### Test Case 3: Zero Spend Group
- [ ] Find group with totalSpend = 0
- [ ] Verify ROAS displays "—" (null)
- [ ] Verify no division by zero errors in console

#### Test Case 4: Sorting
- [ ] Click ROAS column header
- [ ] Verify groups re-sort by ROAS descending
- [ ] Click again → verify ascending sort
- [ ] Verify within each group: main first, then by totalSales DESC

#### Test Case 5: Error Handling
- [ ] Stop backend server
- [ ] Reload page
- [ ] Verify error alert shows: "Не удалось загрузить данные..."
- [ ] Click "Повторить" → verify retry works

#### Test Case 6: Empty State
- [ ] Use cabinet with NO advertising data
- [ ] Verify empty state shows: "Нет данных за выбранный период"

### Automated Testing (10 минут)

```bash
# Run all tests
npm test

# Expected results:
# ✅ 77 unit tests passing (formatters + metrics-calculator)
# ✅ E2E tests: 7 scenarios (requires backend running)
# ✅ Accessibility tests: 7 scenarios (requires axe-core)
```

---

## 🚨 Common Issues & Solutions

### Issue 1: TypeScript Error "Property 'aggregateMetrics' does not exist"

**Причина**: TypeScript types не обновлены

**Решение**:
1. Verify `AggregateMetrics` interface добавлен в `advertising-analytics.ts`
2. Verify `MergedGroupItem` extends `AdvertisingItem`
3. Run `npm run type-check`

### Issue 2: API Returns 400 "Invalid groupBy parameter"

**Причина**: `groupBy` не передаётся в backend

**Решение**:
1. Verify `group_by: params.groupBy` добавлен в `queryParams`
2. Verify `groupBy` value = `'imtId'` (not `'group'` or other)
3. Check Network tab: URL should contain `group_by=imtId`

### Issue 3: Empty Table Despite API Returning Data

**Причина**: Transformation layer фильтрует данные

**Решение**:
1. Check Console logs для transformer warnings
2. Verify backend response has `type: 'merged_group'`
3. Verify `aggregateMetrics`, `products[]`, `mainProduct` присутствуют

### Issue 4: Crown Icon Not Showing

**Причина**: `isMainProduct` flag отсутствует или неправильный

**Решение**:
1. Verify backend возвращает `products[].isMainProduct`
2. Check Console log для product data
3. Verify `totalSpend > 0` для main product

### Issue 5: Aggregate Metrics Incorrect

**Причина**: Backend bug или неправильная трансформация

**Решение**:
1. Compare `aggregateMetrics.totalSales` с SUM(products[].totalSales)
2. Tolerance: ±1₽ допустимо (rounding)
3. Если разница >1₽ → report backend bug

---

## 📊 Success Criteria

**Story 37.1 COMPLETE когда**:
- [x] Backend API validated (Request #88 ✅ DONE)
- [ ] TypeScript types updated
- [ ] API client sends `groupBy` parameter
- [ ] Transformation layer created
- [ ] Page.tsx uses real API
- [ ] Feature flag `useRealApi = true`
- [ ] Mock data archived
- [ ] All manual test cases PASS
- [ ] Build successful (0 errors)
- [ ] Unit tests still passing (77/77)

**Epic 37 PRODUCTION READY когда**:
- Story 37.1 ✅ (API integration)
- Story 37.2 ✅ (Component)
- Story 37.3 ✅ (Metrics)
- Story 37.4 ✅ (Styling)
- Story 37.5 ✅ (Testing - Phase 1 + Phase 2)

---

## 🔗 Reference Documents

### Backend Documentation
- **Integration Guide**: `frontend/docs/request-backend/88-FRONTEND-INTEGRATION-GUIDE.md`
- **Backend Spec**: `frontend/docs/request-backend/88-epic-37-individual-product-metrics.md`
- **Swagger**: http://localhost:3000/api
- **Epic 36**: `docs/epics/epic-36-product-card-linking.md`
- **Epic 35**: `docs/epics/epic-35-total-sales-organic-split.md`

### Frontend Documentation
- **Story 37.2**: Component implementation
- **Story 37.3**: Aggregate metrics formulas
- **Story 37.4**: Visual styling spec
- **Story 37.5**: Testing & documentation
- **User Guide**: `docs/stories/epic-37/USER-GUIDE.md`

---

## 🎯 Estimated Time Breakdown

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Type Updates | 4 tasks | 30 min |
| Phase 2: API Client | 4 tasks | 20 min |
| Phase 3: Transformation | 4 tasks | 20 min |
| Phase 4: Page Integration | 5 tasks | 30 min |
| Phase 5: Feature Flag | 3 tasks | 5 min |
| Phase 6: Testing | 10 tasks | 30 min |
| Phase 7: Cleanup | 5 tasks | 10 min |
| **TOTAL** | **35 tasks** | **2h 25min** |

**Contingency**: +30min для debugging = **3h max**

---

## 📝 Code Snippets (Copy-Paste Ready)

### TypeScript Types (advertising-analytics.ts)

```typescript
// ============================================================================
// Request #88: Nested Structure for Merged Groups
// ============================================================================

/**
 * Aggregate metrics for merged product group (Request #88).
 * All products in group summed together.
 */
export interface AggregateMetrics {
  // Standard metrics (5 fields)
  totalViews: number;
  totalClicks: number;
  totalOrders: number;
  totalSpend: number;
  totalRevenue: number;

  // Epic 35: Total sales & organic split (3 fields)
  totalSales: number;        // organic + advertising
  organicSales: number;      // totalSales - totalRevenue
  organicContribution: number; // (organicSales / totalSales) × 100

  // Calculated metrics (6 fields)
  roas: number | null;       // null if totalSpend = 0
  roi: number | null;        // null if totalSpend = 0
  ctr: number;
  cpc: number | null;        // null if totalClicks = 0
  conversionRate: number;
  profitAfterAds: number;
}

/**
 * Main product identification (Request #88).
 * Identifies which product receives ad spend.
 */
export interface MainProductInfo {
  nmId: number;
  vendorCode: string;
  name?: string;  // Optional
}

/**
 * Individual product metrics within merged group (Request #88).
 * Full 18-field structure per product.
 */
export interface MergedGroupProduct {
  // Identity (4 fields)
  nmId: number;
  vendorCode: string;
  imtId: number | null;     // null for standalone products
  isMainProduct: boolean;   // true = receives ad spend

  // Standard metrics (5 fields)
  totalViews: number;
  totalClicks: number;
  totalOrders: number;
  totalSpend: number;
  totalRevenue: number;

  // Epic 35: Organic sales (3 fields)
  totalSales: number;
  organicSales: number;
  organicContribution: number;

  // Calculated metrics (6 fields)
  roas: number | null;
  roi: number | null;
  ctr: number;
  cpc: number | null;
  conversionRate: number;
  profitAfterAds: number;
}

/**
 * Merged group advertising item (Request #88).
 * Extends base AdvertisingItem with nested structure.
 */
export interface MergedGroupItem extends AdvertisingItem {
  type: 'merged_group';
  imtId: number;

  // Request #88: New nested structure
  mainProduct: MainProductInfo;
  productCount: number;
  aggregateMetrics: AggregateMetrics;
  products: MergedGroupProduct[];

  // LEGACY: Backward compatibility (deprecated)
  mergedProducts?: Array<{
    nmId: number;
    vendorCode: string;
    spend: number;
    revenue: number;
    orders: number;
  }>;
}
```

### Transformation Layer (advertising-transformers.ts)

```typescript
/**
 * Advertising Analytics Data Transformers
 *
 * Transforms backend API responses to frontend-compatible types.
 * Request #88: Supports new nested structure for merged groups.
 *
 * @see frontend/docs/request-backend/88-FRONTEND-INTEGRATION-GUIDE.md
 */

import type { MergedGroupItem } from '@/types/advertising-analytics'

/**
 * Transform backend merged group response to frontend MergedGroupItem.
 *
 * NOTE: As of Request #88, backend already returns the exact structure
 * we need, so this is mostly a pass-through with type validation.
 *
 * @param backendItem - Raw backend response item
 * @returns Validated MergedGroupItem or null if invalid
 */
export function transformMergedGroup(
  backendItem: unknown
): MergedGroupItem | null {
  const item = backendItem as any

  // Type guard: verify it's a merged_group type
  if (item.type !== 'merged_group') {
    return null
  }

  // Validate required fields
  if (!item.imtId || !item.aggregateMetrics || !item.products) {
    console.warn('[Transformer] Invalid merged group data:', {
      imtId: item.imtId,
      hasAggregateMetrics: !!item.aggregateMetrics,
      hasProducts: !!item.products,
      productCount: item.products?.length,
    })
    return null
  }

  // Validate products array not empty
  if (!Array.isArray(item.products) || item.products.length === 0) {
    console.warn('[Transformer] Empty products array for group:', item.imtId)
    return null
  }

  // Return as-is (backend structure matches frontend)
  return item as MergedGroupItem
}

/**
 * Transform array of backend items, filtering only merged groups.
 *
 * @param backendData - Array of backend response items
 * @returns Array of validated MergedGroupItem
 */
export function transformMergedGroups(
  backendData: unknown[]
): MergedGroupItem[] {
  if (!Array.isArray(backendData)) {
    console.warn('[Transformer] Invalid backend data: not an array')
    return []
  }

  const transformed = backendData
    .map(transformMergedGroup)
    .filter((item): item is MergedGroupItem => item !== null)

  console.log(`[Transformer] Transformed ${backendData.length} items → ${transformed.length} merged groups`)

  return transformed
}
```

### Page.tsx Updated mergedGroupsData

```typescript
// Epic 37: Get merged groups data from real API
const mergedGroupsData = useMemo(() => {
  if (!features.epic37MergedGroups.enabled || groupBy !== 'imtId') {
    return []
  }

  // Wait for API data to load
  if (!data?.data) {
    return []
  }

  // Transform backend response to frontend types
  const groups = transformMergedGroups(data.data)

  if (features.epic37MergedGroups.debug) {
    console.log('[Epic 37] Loaded from API:', groups.length, 'groups')
  }

  return groups
}, [groupBy, data])
```

---

## 🎉 Expected Outcome

После выполнения всех задач:

1. ✅ MergedGroupTable получает данные из **реального backend API**
2. ✅ Mock данные полностью удалены из production code
3. ✅ Feature flag `useRealApi = true` (production mode)
4. ✅ TypeScript типы соответствуют backend response
5. ✅ Трансформация корректная (backend → frontend)
6. ✅ Все тесты проходят (77 unit tests)
7. ✅ Build успешный (0 errors)
8. ✅ Visual QA passed (таблица рендерится корректно)

---

## 🚀 Ready to Start?

**Начинаем с Task 1.1** (Update TypeScript Types)?

**Или хотите**:
- Сначала протестировать API вручную (Postman/curl)?
- Просмотреть весь integration guide подробнее?
- Задать вопросы о плане интеграции?

**Что скажете?** 🎯
