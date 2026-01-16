# 🚀 Epic 36: Product Card Linking - START HERE

**Дата**: 2025-12-28
**Backend статус**: ✅ 100% Complete
**Frontend статус**: ✅ 100% Complete (Story 36.5)
**Приоритет**: Complete

---

## 📖 Что это за epic?

**Epic 36: Product Card Linking (склейки)** - группировка рекламных метрик для объединённых карточек товаров на Wildberries.

### Проблема, которую решаем

**До Epic 36** (текущая ситуация):
```
ter-09:   spend=0₽, revenue=1,105₽  →  ROAS=—, status=🔵 Нет данных ❌
ter-10:   spend=0₽, revenue=1,489₽  →  ROAS=—, status=🔵 Нет данных ❌
ter-13-1: spend=11,337₽, revenue=31,464₽  →  ROAS=2.78 ✅
```

**Почему**: WB объединяет карточки товаров (склейки), реклама показывается на основной карточке, но продажи идут на все товары группы. У дочерних товаров `spend=0` но `revenue>0` → невозможно рассчитать ROAS.

**После Epic 36**:
```
Группа #328632 (ter-09 + ter-10 + ter-13-1):
  Total spend:   11,337₽
  Total revenue: 34,058₽ (сумма всех 3 товаров)
  ROAS: 3.0 ✅
  Status: Рентабельно ✅
```

**Результат**: Правильная эффективность рекламы для объединённых карточек.

---

## 🎯 Что нужно сделать (TL;DR)

1. ✅ **Прочитать** [`request-backend/84-epic-36-frontend-integration-guide.md`](./request-backend/84-epic-36-frontend-integration-guide.md)
2. ✅ **Изучить** API contract: [`request-backend/83-epic-36-api-contract.md`](./request-backend/83-epic-36-api-contract.md)
3. ✅ **Следовать** implementation plan: [`implementation-plans/epic-36-frontend-integration.md`](./implementation-plans/epic-36-frontend-integration.md)
4. ✅ **Создать** UI по mockup: [`wireframes/epic-36-ui-mockup.md`](./wireframes/epic-36-ui-mockup.md)

**Время**: 3-4 часа разработки + 1-2 часа тестирования

---

## 📚 Документация (читать по порядку)

### 1️⃣ **Начать здесь** - Integration Guide
📄 **Файл**: [`request-backend/84-epic-36-frontend-integration-guide.md`](./request-backend/84-epic-36-frontend-integration-guide.md)

**Содержание**:
- TL;DR что делать
- Список файлов для изменения
- Quick start (3 шага)
- Acceptance criteria
- Support & links

**Время на чтение**: 5 минут

---

### 2️⃣ **Технический контракт** - API Contract
📄 **Файл**: [`request-backend/83-epic-36-api-contract.md`](./request-backend/83-epic-36-api-contract.md)

**Содержание**:
- TypeScript типы (`GroupByMode`, `MergedProduct`, `AdvertisingItem`)
- API request/response примеры
- Edge cases и поведение
- Backward compatibility гарантии

**Время на чтение**: 15 минут

**Ключевой код**:
```typescript
export type GroupByMode = 'sku' | 'imtId';

export interface AdvertisingItem {
  type?: 'merged_group' | 'individual';
  imtId?: number | null;
  mergedProducts?: MergedProduct[];
  // ... existing fields
}
```

---

### 3️⃣ **Пошаговый план** - Implementation Plan
📄 **Файл**: [`implementation-plans/epic-36-frontend-integration.md`](./implementation-plans/epic-36-frontend-integration.md)

**Содержание**:
- 6 шагов с точными code snippets
- Testing checklist (unit, integration, E2E)
- Performance considerations
- Error handling

**Время на реализацию**: 3-4 часа

**Шаги**:
1. Update TypeScript Types (15 min)
2. Update API Client (10 min)
3. Update React Query Hooks (5 min)
4. Create MergedProductBadge Component (20 min)
5. Update Main Analytics Page (30 min)
6. Update Filters Component (15 min)

---

### 4️⃣ **Визуальный дизайн** - UI Mockup
📄 **Файл**: [`wireframes/epic-36-ui-mockup.md`](./wireframes/epic-36-ui-mockup.md)

**Содержание**:
- Before/After UI comparison
- Component specs (toggle, badge, tooltip)
- Responsive design (desktop, tablet, mobile)
- Accessibility (ARIA, keyboard navigation)
- Russian copywriting

**Время на изучение**: 10 минут

**Ключевые компоненты**:
```
[По артикулам] [По склейкам]  ← Toggle
Группа #328632  🔗 Склейка (3) ⓘ  ← Badge + Tooltip
```

---

### 5️⃣ **Контекст проблемы** (опционально) - Request #82
📄 **Файл**: [`request-backend/82-card-linking-product-bundles.md`](./request-backend/82-card-linking-product-bundles.md)

**Содержание**:
- Исходный вопрос от Frontend Team
- Объяснение механизма склеек WB
- Backend research результаты

**Время на чтение**: 10 минут

**Читать если**: Хочешь понять бизнес-контекст и историю проблемы.

---

## 🔧 Технические детали

### Изменения в файлах (6 файлов)

| Файл | Что менять | Время |
|------|------------|-------|
| `src/types/advertising-analytics.ts` | Добавить `GroupByMode`, `MergedProduct`, расширить `AdvertisingItem` | 15 min |
| `src/lib/api/advertising-analytics.ts` | Добавить `group_by` parameter, обновить response mapping | 10 min |
| `src/hooks/useAdvertisingAnalytics.ts` | Добавить `useAdvertisingMergedGroups` hook | 5 min |
| `src/app/(dashboard)/analytics/advertising/page.tsx` | Добавить toggle, обновить table rendering | 30 min |
| `src/components/analytics/PerformanceMetricsTable.tsx` | Обновить rows для merged groups | 15 min |
| `src/components/analytics/AdvertisingFilters.tsx` | Добавить group_by filter (optional) | 15 min |

### Новые компоненты (2 файла)

| Файл | Описание | Время |
|------|----------|-------|
| `src/components/analytics/MergedProductBadge.tsx` | Badge с tooltip для склеек | 20 min |
| `src/components/analytics/MergedProductBadge.test.tsx` | Unit tests для badge | 15 min |

---

## 🎨 UI Preview

### Toggle для группировки

```
┌─────────────────────────────────────┐
│ Группировка:                        │
│ ┌──────────────┐ ┌──────────────┐  │
│ │ По артикулам │ │ По склейкам  │  │
│ └──────────────┘ └──────────────┘  │
│                  ▲ Active           │
└─────────────────────────────────────┘
```

### Merged Group Badge

```
Группа #328632  🔗 Склейка (3) ⓘ
                ↑ Hoverable badge
```

**Tooltip**:
```
┌─────────────────────────────────────┐
│ Объединённая карточка #328632       │
│                                     │
│ Товары в группе:                    │
│  • ter-09 (#173588306)              │
│  • ter-10 (#173589306)              │
│  • ter-13-1 (#270937054)            │
│                                     │
│ 💡 Рекламные затраты распределены   │
│    между всеми товарами группы      │
└─────────────────────────────────────┘
```

---

## 📊 Backend API Example

### Request
```http
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-21&group_by=imtId
Authorization: Bearer {jwt}
X-Cabinet-Id: {cabinet_id}
```

### Response
```json
{
  "items": [
    {
      "type": "merged_group",
      "imtId": 328632,
      "mergedProducts": [
        { "nmId": 173588306, "vendorCode": "ter-09" },
        { "nmId": 173589306, "vendorCode": "ter-10" },
        { "nmId": 270937054, "vendorCode": "ter-13-1" }
      ],
      "totalSpend": 11337,
      "totalRevenue": 34058,
      "financials": { "roas": 3.0, "roi": 2.0 }
    }
  ],
  "summary": { ... }
}
```

**Полные примеры**: см. [`83-epic-36-api-contract.md`](./request-backend/83-epic-36-api-contract.md)

---

## ⚡ Quick Implementation Path

### Path A: Minimal MVP (2 hours)
**Достаточно для демо**:
- ✅ Обновить types
- ✅ Обновить API client
- ✅ Добавить toggle
- ✅ Создать простой badge (без tooltip)
- ✅ Обновить table rendering

**Пропустить**:
- ❌ Fancy tooltip (можно позже)
- ❌ Filters integration
- ❌ E2E tests (можно позже)

### Path B: Full Implementation (4 hours)
**Production-ready**:
- ✅ Всё из Path A
- ✅ Tooltip с деталями продуктов
- ✅ Filters integration
- ✅ Unit tests
- ✅ Integration tests
- ✅ E2E tests

**Рекомендация**: Path B для production.

---

## 🧪 Testing Strategy

### Before Starting
```bash
# Verify backend is running
curl http://localhost:3000/v1/analytics/advertising?from=2025-12-01&to=2025-12-21&group_by=imtId \
  -H "Authorization: Bearer {token}" \
  -H "X-Cabinet-Id: {cabinet_id}"
```

**Expected**: JSON response с `type='merged_group'` items.

### During Development
```bash
# Type check after each step
npm run type-check

# Lint after each step
npm run lint

# Unit tests
npm run test -- MergedProductBadge
```

### After Completion
```bash
# Full test suite
npm run test
npm run test:e2e

# Build verification
npm run build
```

---

## 🎓 Learning Resources

### shadcn/ui Components
- **Badge**: https://ui.shadcn.com/docs/components/badge
- **Tooltip**: https://ui.shadcn.com/docs/components/tooltip
- **Button**: https://ui.shadcn.com/docs/components/button

### TanStack React Query
- **useQuery**: https://tanstack.com/query/latest/docs/react/guides/queries
- **Query Keys**: https://tanstack.com/query/latest/docs/react/guides/query-keys

### TypeScript
- **Type Narrowing**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- **Discriminated Unions**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions

---

## ✅ Ready to Start?

### Checklist перед началом работы:

- [ ] Прочитал [`84-epic-36-frontend-integration-guide.md`](./request-backend/84-epic-36-frontend-integration-guide.md)
- [ ] Изучил API contract [`83-epic-36-api-contract.md`](./request-backend/83-epic-36-api-contract.md)
- [ ] Посмотрел UI mockup [`wireframes/epic-36-ui-mockup.md`](./wireframes/epic-36-ui-mockup.md)
- [ ] Backend работает (`http://localhost:3000/api` Swagger)
- [ ] Создал feature branch: `git checkout -b epic-36/frontend-integration`
- [ ] Понимаю acceptance criteria

### Первый шаг:

```bash
# 1. Открыть implementation plan
code frontend/docs/implementation-plans/epic-36-frontend-integration.md

# 2. Начать с Step 1: Update TypeScript Types
code frontend/src/types/advertising-analytics.ts

# 3. Добавить новые типы
# (см. код в implementation plan)
```

---

## 📞 Нужна помощь?

### Документация
- **Integration Guide**: [`request-backend/84-epic-36-frontend-integration-guide.md`](./request-backend/84-epic-36-frontend-integration-guide.md)
- **API Contract**: [`request-backend/83-epic-36-api-contract.md`](./request-backend/83-epic-36-api-contract.md)
- **Implementation Plan**: [`implementation-plans/epic-36-frontend-integration.md`](./implementation-plans/epic-36-frontend-integration.md)
- **UI Mockup**: [`wireframes/epic-36-ui-mockup.md`](./wireframes/epic-36-ui-mockup.md)

### Backend Resources
- **API Docs**: `/docs/API-PATHS-REFERENCE.md` (lines 986-1102)
- **Swagger**: `http://localhost:3000/api`
- **Grafana**: `/monitoring/grafana/dashboards/epic-36-product-card-linking.json`

### Контакты
- **Backend Team**: Epic 36 backend ready, API stable
- **Slack**: #epic-36-product-linking

---

## 🎉 Let's Go!

Backend ждёт! Все API готовы, документация полная, примеры кода есть. Время реализовать UI! 🚀

**Estimated Time**: 3-4 hours
**Complexity**: Medium (расширение существующей Epic 33)
**Impact**: High (решает проблему "Нет данных" для склеек)

**Next Action**: Открыть [`84-epic-36-frontend-integration-guide.md`](./request-backend/84-epic-36-frontend-integration-guide.md) и начать!

---

---

## 🎊 Epic 36 Frontend - COMPLETE!

**Implementation Date**: 2025-12-28
**Total Time**: 4 hours (as estimated)
**Test Coverage**: 91 tests (E2E + Integration + Unit)

### ✅ Completed Stories

| Story | Description | Status |
|-------|-------------|--------|
| 36.1 | TypeScript Types & Interfaces | ✅ Complete |
| 36.2 | API Client & React Query Hooks | ✅ Complete |
| 36.3 | MergedProductBadge Component | ✅ Complete |
| 36.4 | Page Layout & Toggle UI Integration | ✅ Complete |
| 36.5 | Testing & Documentation | ✅ Complete |

### 📦 Deliverables

**Modified Files** (6):
- `src/types/advertising-analytics.ts` - Added Epic 36 types
- `src/lib/api/advertising-analytics.ts` - Updated API client
- `src/hooks/useAdvertisingAnalytics.ts` - Added convenience hook
- `src/app/(dashboard)/analytics/advertising/page.tsx` - Integrated toggle & state
- `src/app/(dashboard)/analytics/advertising/components/PerformanceMetricsTable.tsx` - Badge display
- `src/app/(dashboard)/analytics/advertising/components/GroupByToggle.tsx` - NEW

**New Components** (2):
- `src/components/analytics/MergedProductBadge.tsx` - Badge with tooltip
- `src/app/(dashboard)/analytics/advertising/components/GroupByToggle.tsx` - Toggle buttons

**Test Files** (3):
- `e2e/advertising-analytics-epic-36.spec.ts` - 5 E2E scenarios
- `src/lib/api/__tests__/advertising-analytics-epic-36.test.ts` - 21 integration tests
- `src/components/analytics/__tests__/MergedProductBadge.test.tsx` - 40 unit tests
- `src/app/(dashboard)/analytics/advertising/components/__tests__/GroupByToggle.test.tsx` - 25 unit tests

**Documentation** (1):
- `docs/CHANGELOG-EPIC-36-FE.md` - Complete changelog

### 🎯 Test Results

**Total Coverage**: 91 tests
- ✅ E2E Tests: 5 scenarios (toggle switching, badge display, URL persistence, backward compatibility, mobile)
- ✅ Integration Tests: 21 tests (API client, group_by parameter, response mapping)
- ✅ Unit Tests: 65 tests (MergedProductBadge 40 tests, GroupByToggle 25 tests)

### 🚀 Deployment Ready

**Next Steps**:
1. ✅ Code reviewed and approved
2. ✅ All tests passing
3. ✅ Documentation complete
4. 📦 Ready for commit and deployment

**See Also**:
- [`CHANGELOG-EPIC-36-FE.md`](./CHANGELOG-EPIC-36-FE.md) - Full changelog with breaking changes
- [`request-backend/84-epic-36-frontend-integration-guide.md`](./request-backend/84-epic-36-frontend-integration-guide.md) - Integration guide
- [`stories/epic-36/`](./stories/epic-36/) - Story documentation

---

**Document Version**: 2.0
**Last Updated**: 2025-12-28
**Status**: ✅ Epic 36 Frontend Complete
