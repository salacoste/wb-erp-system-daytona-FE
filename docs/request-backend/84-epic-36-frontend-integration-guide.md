# Request #84: Epic 36 Frontend Integration Guide - Action Plan

**Дата**: 2025-12-27 (Обновлено: 2025-12-28)
**Статус**: ✅ **PRODUCTION READY** → 📋 Готово к интеграции
**Приоритет**: High
**Epic**: 36 - Product Card Linking (склейки)
**Исполнитель**: Frontend Team
**Update**: Critical bugfix applied 2025-12-28 (see Request #85)

---

## 📋 TL;DR - Что нужно сделать

**Backend полностью готов** (✅ PRODUCTION READY after critical bugfix 2025-12-28). Вам нужно добавить поддержку группировки по склейкам в рекламную аналитику.

**Время на реализацию**: 3-4 часа
**Файлов изменить**: 6
**Файлов создать**: 2 компонента
**Тестов написать**: Unit + Integration + E2E

**⚠️ ОБНОВЛЕНИЕ (2025-12-28)**: Backend исправил критическую ошибку WB API pagination (1000→100 cards/batch). Для фронтенда **ничего не меняется** - API contract остался прежним, все примеры кода актуальны. См. Request #85 для деталей.

---

## 🎯 Что получит пользователь

### Проблема (сейчас)
```
ter-09:   Расходы: 0₽,    Продажи: 1,105₽  →  ROAS: —      Статус: 🔵 Нет данных ❌
ter-10:   Расходы: 0₽,    Продажи: 1,489₽  →  ROAS: —      Статус: 🔵 Нет данных ❌
ter-13-1: Расходы: 11,337₽, Продажи: 31,464₽ →  ROAS: 2.78  Статус: ✅ Рентабельно
```

**Почему так?** WB объединяет карточки товаров (склейки), но рекламный бюджет тратится только на основную карточку. Остальные товары получают продажи от этой рекламы, но без прямых затрат.

### Решение (после Epic 36)
```
Группа #328632 🔗 Склейка (3):
  Товары: ter-09, ter-10, ter-13-1
  Расходы: 11,337₽ (сумма)
  Продажи: 34,058₽ (1,105 + 1,489 + 31,464)
  ROAS: 3.0 ✅
  Статус: ✅ Рентабельно
```

**Результат**: Правильный расчёт эффективности для объединённых карточек.

---

## 📚 Документация (читать в этом порядке)

---

## Backend Team Response
**Status**: RESOLVED — this document IS the backend response. See the parent request file for the original frontend ask.

### 1. **API Contract** (обязательно к прочтению!)
**Файл**: [`83-epic-36-api-contract.md`](./83-epic-36-api-contract.md)

**Что внутри**:
- ✅ TypeScript интерфейсы (`GroupByMode`, `MergedProduct`, расширенный `AdvertisingItem`)
- ✅ Примеры API request/response (merged groups, individual products, mixed)
- ✅ Edge cases (single product with imtId, NULL imtId, spend=0)
- ✅ Integration guide (step-by-step)
- ✅ Acceptance criteria checklist

**Ключевые типы**:
```typescript
export type GroupByMode = 'sku' | 'imtId';

export interface MergedProduct {
  nmId: number;
  vendorCode: string;
}

export interface AdvertisingItem {
  // NEW for Epic 36:
  type?: 'merged_group' | 'individual';
  imtId?: number | null;
  mergedProducts?: MergedProduct[];

  // Existing fields from Epic 33...
}
```

---

### 2. **Implementation Plan** (пошаговый план)
**Файл**: [`../implementation-plans/epic-36-frontend-integration.md`](../implementation-plans/epic-36-frontend-integration.md)

**Что внутри**:
- ✅ **Step 1**: Update TypeScript Types (15 min)
- ✅ **Step 2**: Update API Client (10 min)
- ✅ **Step 3**: Update React Query Hooks (5 min)
- ✅ **Step 4**: Create MergedProductBadge Component (20 min)
- ✅ **Step 5**: Update Main Analytics Page (30 min)
- ✅ **Step 6**: Update Filters Component (15 min)

**Каждый шаг содержит**:
- Точный файл для изменения
- Code snippets (copy-paste ready)
- Testing checklist
- Команды для проверки

---

### 3. **UI Mockup** (визуальный дизайн)
**Файл**: [`../wireframes/epic-36-ui-mockup.md`](../wireframes/epic-36-ui-mockup.md)

**Что внутри**:
- ✅ Before/After UI сравнение
- ✅ Toggle для группировки: `[По артикулам] [По склейкам]`
- ✅ Badge дизайн: `🔗 Склейка (3) ⓘ`
- ✅ Tooltip с деталями группы
- ✅ Responsive behaviour (desktop, tablet, mobile)
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Русская локализация

---

### 4. **Request #82** (предыстория проблемы)
**Файл**: [`82-card-linking-product-bundles.md`](./82-card-linking-product-bundles.md)

**Что внутри**:
- ❓ Исходный вопрос от Frontend Team: "Почему у некоторых товаров spend=0 но revenue>0?"
- ✅ Объяснение механизма склеек WB
- ✅ Бизнес-контекст проблемы
- ✅ Backend research результаты

**Читать опционально** - для понимания контекста.

---

## 🔧 Файлы для изменения

### Изменить (6 файлов):

1. **`src/types/advertising-analytics.ts`**
   - Добавить `GroupByMode`, `MergedProduct`
   - Расширить `AdvertisingItem` (добавить `type`, `imtId`, `mergedProducts`)
   - Расширить `AdvertisingAnalyticsParams` (добавить `group_by`)

2. **`src/lib/api/advertising-analytics.ts`**
   - Добавить поддержку `group_by` параметра в `buildQueryString`
   - Обновить response mapping (добавить `type`, `imtId`, `mergedProducts`)
   - Добавить логирование `group_by` mode

3. **`src/hooks/useAdvertisingAnalytics.ts`**
   - Добавить хук `useAdvertisingMergedGroups` (convenience wrapper)

4. **`src/app/(dashboard)/analytics/advertising/page.tsx`**
   - Добавить state `groupBy: GroupByMode`
   - Добавить UI toggle `[По артикулам] [По склейкам]`
   - Обновить table rendering (показывать `MergedProductBadge` для merged groups)

5. **`src/components/analytics/PerformanceMetricsTable.tsx`** (если есть)
   - Обновить table rows для отображения merged groups

6. **`src/components/analytics/AdvertisingFilters.tsx`** (опционально)
   - Добавить filter для group_by mode

### Создать (2 файла):

1. **`src/components/analytics/MergedProductBadge.tsx`** (NEW)
   - Badge component с иконкой 🔗
   - Tooltip с списком товаров в группе
   - Handling edge case: single product with imtId (return null)

2. **`src/components/analytics/MergedProductBadge.test.tsx`** (NEW)
   - Unit tests для badge component

---

## 🚀 Quick Start (3 шага)

### Шаг 1: Прочитать документацию (30 min)

```bash
cd frontend/docs/request-backend

# 1. API Contract - обязательно!
cat 83-epic-36-api-contract.md

# 2. UI Mockup - посмотреть дизайн
cat ../wireframes/epic-36-ui-mockup.md

# 3. Implementation Plan - пошаговый план
cat ../implementation-plans/epic-36-frontend-integration.md
```

### Шаг 2: Обновить типы (15 min)

**Файл**: `src/types/advertising-analytics.ts`

```typescript
// Epic 36: Product Card Linking
export type GroupByMode = 'sku' | 'imtId';

export interface MergedProduct {
  nmId: number;
  vendorCode: string;
}

export interface AdvertisingItem {
  // NEW Epic 36 fields:
  type?: 'merged_group' | 'individual';
  imtId?: number | null;
  mergedProducts?: MergedProduct[];

  // ... existing fields
}

export interface AdvertisingAnalyticsParams {
  // NEW Epic 36 parameter:
  group_by?: GroupByMode;

  // ... existing params
}
```

**Проверка**:
```bash
npm run type-check  # TypeScript compilation should pass
```

### Шаг 3: Следовать Implementation Plan (2-3 hours)

Открыть [`../implementation-plans/epic-36-frontend-integration.md`](../implementation-plans/epic-36-frontend-integration.md) и следовать шагам 2-6.

**Каждый шаг содержит**:
- ✅ Точный код для вставки
- ✅ Файл и строки для изменения
- ✅ Testing checklist
- ✅ Команды для проверки

---

## 📊 Backend API Reference

### Endpoint (unchanged)
```
GET /v1/analytics/advertising
```

### NEW Parameter (Epic 36)
```
group_by: 'sku' | 'imtId'  (default: 'sku')
```

### Response Format

**Grouped by imtId** (`group_by=imtId`):
```json
{
  "items": [
    {
      "type": "merged_group",
      "key": "imtId:328632",
      "imtId": 328632,
      "mergedProducts": [
        { "nmId": 173588306, "vendorCode": "ter-09" },
        { "nmId": 173589306, "vendorCode": "ter-10" },
        { "nmId": 270937054, "vendorCode": "ter-13-1" }
      ],
      "totalSpend": 11337,
      "totalRevenue": 34058,
      "totalOrders": 13,
      "financials": { "roas": 3.0, "roi": 2.0 }
    },
    {
      "type": "individual",
      "key": "sku:12345678",
      "nmId": 12345678,
      "imtId": null,
      "totalSpend": 5000,
      "totalRevenue": 7500,
      "financials": { "roas": 1.5, "roi": 0.5 }
    }
  ]
}
```

**Backward compatible** (`group_by=sku` or omit):
- Точно такой же формат как Epic 33 (без изменений)
- Поля `type`, `imtId`, `mergedProducts` отсутствуют

---

## 🧪 Testing Checklist

### Unit Tests

**Файл**: `src/components/analytics/MergedProductBadge.test.tsx`

```typescript
describe('MergedProductBadge', () => {
  it('renders badge with correct product count', () => { ... });
  it('returns null for single product with imtId', () => { ... });
  it('shows all products in tooltip', () => { ... });
});
```

### Integration Tests

**Тест сценарии**:
- ✅ Toggle switches between SKU and imtId modes
- ✅ API client sends correct `group_by` parameter
- ✅ Merged groups display with badge and tooltip
- ✅ Individual products display without badge
- ✅ ROAS/ROI calculations are correct for merged groups

### E2E Tests (Playwright)

**Файл**: `frontend/e2e/advertising-analytics-epic-36.spec.ts`

```typescript
test('should toggle between SKU and imtId grouping modes', async ({ page }) => {
  // 1. Navigate to page
  // 2. Click "По склейкам"
  // 3. Verify merged groups are displayed
  // 4. Verify badge is visible
});

test('should show merged product tooltip on hover', async ({ page }) => {
  // 1. Click "По склейкам"
  // 2. Hover over badge
  // 3. Verify tooltip content
});
```

**Запуск**:
```bash
npm run test:e2e
```

---

## ⚠️ Edge Cases & Error Handling

### Edge Case 1: Single Product with imtId
**Backend**: `type='merged_group'`, `mergedProducts=[{ nmId: 123 }]` (1 item)
**Frontend**: Display as individual product (no badge)

```typescript
// In MergedProductBadge.tsx
if (mergedProducts.length === 1) {
  return null; // No badge for single product
}
```

### Edge Case 2: All Products NULL imtId
**Backend**: All items have `type='individual'`, `imtId=null`
**Frontend**: Same as `group_by=sku` (no changes to UI)

### Edge Case 3: API Error
**Frontend**: Show error alert with Russian message

```typescript
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Ошибка загрузки данных</AlertTitle>
      <AlertDescription>
        {getAdvertisingErrorMessage(error.status)}
      </AlertDescription>
    </Alert>
  );
}
```

---

## ✅ Acceptance Criteria

Epic 36 frontend integration **DONE** когда:

- [ ] TypeScript types updated (GroupByMode, MergedProduct, extended AdvertisingItem)
- [ ] API client sends `group_by` parameter
- [ ] React Query hook supports `group_by=imtId`
- [ ] UI toggle `[По артикулам] [По склейкам]` renders
- [ ] Merged group badge displays with correct count
- [ ] Tooltip shows all products in group
- [ ] ROAS/ROI display correctly for merged groups (no NULL)
- [ ] Single product with imtId displays as individual (no badge)
- [ ] Network errors handled gracefully
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] No regressions in Epic 33 functionality
- [ ] Code review approved
- [ ] Documentation updated in `frontend/README.md`

---

## 📞 Support & Questions

### Документация
- **API Contract**: [`83-epic-36-api-contract.md`](./83-epic-36-api-contract.md)
- **Implementation Plan**: [`../implementation-plans/epic-36-frontend-integration.md`](../implementation-plans/epic-36-frontend-integration.md)
- **UI Mockup**: [`../wireframes/epic-36-ui-mockup.md`](../wireframes/epic-36-ui-mockup.md)

### Backend Resources
- **API Reference**: `/docs/API-PATHS-REFERENCE.md` (lines 986-1102)
- **Epic 36 Main**: `/docs/stories/epic-36/`
- **Grafana Dashboard**: `/monitoring/grafana/dashboards/epic-36-product-card-linking.json`
- **Prometheus Metrics**: `GET /metrics` (product_imt_sync_total, product_merged_groups_count)

### Related Issues
- **Request #82**: Card Linking Investigation (предыстория)
- **Epic 33**: Advertising Analytics (baseline implementation)
- **Story 36.6**: Backend Testing & Observability (✅ complete)

### Контакты
- **Backend Team Lead**: Epic 36 backend полностью готов, API 100% stable
- **Slack**: #epic-36-product-linking
- **Questions**: См. документацию выше, все ответы есть там

---

## 🎯 Priorities & Timeline

**Priority**: High - Backend waiting for frontend integration
**Estimated Effort**: 3-4 hours development + 1-2 hours testing
**Target**: Integrate in current sprint

**Dependencies**: None - backend полностью готов, API stable, нет breaking changes

---

## 🔗 Quick Links

| Document | Path | Purpose |
|----------|------|---------|
| **API Contract** | `83-epic-36-api-contract.md` | TypeScript types, API examples |
| **Implementation Plan** | `../implementation-plans/epic-36-frontend-integration.md` | Step-by-step guide |
| **UI Mockup** | `../wireframes/epic-36-ui-mockup.md` | Visual design, components |
| **Request #82** | `82-card-linking-product-bundles.md` | Problem context |
| **Backend Docs** | `/docs/stories/epic-36/` | Backend implementation details |

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Status**: ✅ Backend Ready → 📋 Waiting for Frontend
**Next Action**: Frontend Team - read docs and start implementation

---

## 📝 Change Log

### 2025-12-27 - Initial Release
- ✅ Created API contract (Request #83)
- ✅ Created implementation plan
- ✅ Created UI mockup
- ✅ Backend 100% complete (Story 36.6 done)
- ✅ All documentation ready for frontend team
