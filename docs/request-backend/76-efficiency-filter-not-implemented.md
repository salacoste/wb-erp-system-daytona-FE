# Request #76: Efficiency Filter Parameter Not Implemented

**Date**: 2025-12-24 → **Resolved**: 2025-12-26
**Status**: ✅ **RESOLVED** - Backend + Frontend integration complete
**Priority**: High (was blocking frontend)
**Related**: Request #71 (Advertising Analytics API - Epic 33)
**Frontend Integration**: ✅ Client-side workaround removed (2025-12-26)

---

## Проблема

Backend **отвергает** параметр `efficiency_filter` с ошибкой валидации, хотя он **документирован** в Request #71.

### Фактический backend response (2025-12-24)

**Request**:
```
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&view_by=campaign&efficiency_filter=loss
```

**Response**:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": [{
      "field": "property",
      "issue": "efficiency_filter should not exist",
      "message": "property efficiency_filter should not exist"
    }],
    "trace_id": "6ec85ebc-38e1-4249-8a65-c9edf37c54ad"
  }
}
```

**Status Code**: 400 BAD_REQUEST

---

## Ожидаемое поведение (Request #71)

### Query Parameters (из Request #71, строка 142)

| Параметр | Тип | Обяз. | Default | Описание |
|----------|-----|-------|---------|----------|
| `efficiency_filter` | enum | ❌ | `all` | Фильтр: `all`, `excellent`, `good`, `moderate`, `poor`, `loss`, `unknown` |

### Пример из Request #71 (строка 165):
```typescript
GET /v1/analytics/advertising?
  from=2025-12-01&
  to=2025-12-21&
  view_by=sku&
  efficiency_filter=loss&  // ❌ Backend не поддерживает!
  sort_by=roi&
  sort_order=asc
```

---

## Impact

### Frontend Impact
- ✅ **Frontend реализовал Story 33.4-FE** (Efficiency Status Filter)
- ❌ **Фильтр не работает** - backend возвращает 400 error
- ❌ **Пользователь видит ошибку** вместо отфильтрованных данных

### User Experience
- ❌ **Невозможно фильтровать по статусу эффективности**
- ❌ **URL параметр `status=loss` вызывает ошибку загрузки всей страницы**
- ❌ **Пользователь не может посмотреть только убыточные/прибыльные кампании**

### Business Impact
- 🟡 **Средняя критичность**: Функциональность работает БЕЗ фильтра
- 🟡 **Блокирует Story 33.4-FE** (Efficiency Status Filter)
- 🟡 **UX degradation**: Пользователь должен вручную искать нужные статусы в таблице

---

## Проверка других параметров

### ✅ Работающие параметры
```bash
# Без efficiency_filter - работает отлично
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&view_by=campaign
→ 200 OK, 19 items, revenue=54121₽, ROAS=5.65x ✅

# view_by - работает
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&view_by=sku
→ 200 OK ✅

# sort_by, sort_order - работают
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&sort_by=roas&sort_order=desc
→ 200 OK ✅
```

### ❌ НЕ работающие параметры
```bash
# efficiency_filter - НЕ РЕАЛИЗОВАН
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=loss
→ 400 BAD_REQUEST "efficiency_filter should not exist" ❌

GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=excellent
→ 400 BAD_REQUEST ❌

GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=all
→ 400 BAD_REQUEST ❌
```

---

## Вопросы для backend

1. **Почему efficiency_filter не реализован?**
   - Параметр документирован в Request #71 (строка 142)
   - Frontend уже реализовал UI для этого фильтра

2. **Планируется ли реализация?**
   - Если нет → обновить Request #71 (удалить efficiency_filter)
   - Если да → когда ожидается?

3. **Альтернативное название параметра?**
   - Может быть `efficiencyFilter` (camelCase)?
   - Может быть `status` вместо `efficiency_filter`?

---

## Рекомендуемое решение

### Вариант 1: Backend реализует server-side фильтрацию (РЕКОМЕНДУЕТСЯ)

**Файл**: `src/analytics/dto/query/advertising-query.dto.ts`

Добавить в DTO:
```typescript
@IsOptional()
@IsIn(['all', 'excellent', 'good', 'moderate', 'poor', 'loss', 'unknown'])
efficiency_filter?: string;
```

**Файл**: `src/analytics/services/advertising-analytics.service.ts`

Применить фильтр в query:
```typescript
async getAdvertisingAnalytics(query: AdvertisingQueryDto) {
  // ... existing code ...

  let items = await this.mergeData(stats, query);

  // Apply efficiency filter if provided
  if (query.efficiency_filter && query.efficiency_filter !== 'all') {
    items = items.filter(item =>
      item.efficiency.status === query.efficiency_filter
    );
  }

  return { items, summary, query, pagination, cachedAt };
}
```

**Преимущества**:
- ✅ Меньше данных по сети
- ✅ Summary корректно отражает только отфильтрованные items
- ✅ Pagination работает правильно

### Вариант 2: Frontend делает client-side фильтрацию (WORKAROUND)

**Файл**: `src/lib/api/advertising-analytics.ts`

Убрать `efficiency_filter` из запроса:
```typescript
export async function getAdvertisingAnalytics(params: AdvertisingAnalyticsParams) {
  const { efficiency_filter, ...backendParams } = params;

  const queryParams = buildQueryString(backendParams); // БЕЗ efficiency_filter

  const response = await apiClient.get(`/v1/analytics/advertising?${queryParams}`);

  // Client-side фильтрация
  if (efficiency_filter && efficiency_filter !== 'all') {
    response.data = response.data.filter(
      item => item.efficiency_status === efficiency_filter
    );
  }

  return response;
}
```

**Недостатки**:
- ❌ Все данные загружаются по сети (неэффективно)
- ❌ Summary показывает все items (не только отфильтрованные)
- ❌ Pagination сломается (total_count не учитывает фильтр)

---

## Frontend Workaround (Применён временно)

До реализации backend, frontend может:

**Опция А**: Отключить отправку `efficiency_filter` (делать client-side фильтрацию)
**Опция Б**: Показать warning если фильтр активен: "Фильтрация будет доступна после обновления backend"

**Рекомендация**: Опция А с client-side фильтрацией.

---

## Test Cases для проверки fix

После реализации backend:

```bash
TOKEN="your-jwt-token"
CABINET="your-cabinet-id"

# 1. Фильтр loss - должен вернуть только убыточные
curl -s "http://localhost:3000/v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=loss" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Cabinet-Id: ${CABINET}" | jq '{
  itemsCount: (.items | length),
  allLoss: (.items | all(.efficiency.status == "loss"))
}'
# Expected: { "itemsCount": N, "allLoss": true }

# 2. Фильтр excellent - должен вернуть только отличные
curl -s "http://localhost:3000/v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=excellent" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Cabinet-Id: ${CABINET}" | jq '{
  itemsCount: (.items | length),
  allExcellent: (.items | all(.efficiency.status == "excellent"))
}'
# Expected: { "itemsCount": N, "allExcellent": true }

# 3. Фильтр all - должен вернуть всё (как без фильтра)
curl -s "http://localhost:3000/v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=all" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Cabinet-Id: ${CABINET}" | jq '.items | length'
# Expected: 19 (total count)

# 4. Без фильтра - должен вернуть всё
curl -s "http://localhost:3000/v1/analytics/advertising?from=2025-12-01&to=2025-12-23" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Cabinet-Id: ${CABINET}" | jq '.items | length'
# Expected: 19 (same as with filter=all)
```

---

## Timeline Expectation

**Критичность**: 🟡 MEDIUM (feature works without filter, but UX degraded)

**Ожидаемый срок**: 2025-12-26 (после праздников)

**Frontend workaround**: Временно делаем client-side фильтрацию

**Блокирует**: Story 33.4-FE completion (efficiency filter feature)

---

## Связанные файлы

### Backend (нужно добавить)
- `src/analytics/dto/query/advertising-query.dto.ts` - Добавить efficiency_filter в DTO
- `src/analytics/services/advertising-analytics.service.ts` - Применить фильтр в сервисе

### Frontend (работает, но ждёт backend)
- `src/lib/api/advertising-analytics.ts` - ✅ Отправляет efficiency_filter
- `src/types/advertising-analytics.ts` - ✅ Типы готовы
- `src/app/(dashboard)/analytics/advertising/components/EfficiencyFilterDropdown.tsx` - ✅ UI готов
- `src/hooks/useAdvertisingAnalytics.ts` - ✅ Hook готов

---

## ✅ Resolution (2025-12-26)

### Backend Implementation Complete

**Status**: ✅ **PRODUCTION READY**

**Files Modified**:
1. `src/analytics/dto/query/advertising-query.dto.ts` - Added DTO validation
2. `src/analytics/services/advertising-analytics.service.ts` - Implemented filter logic
3. `src/analytics/controllers/advertising-analytics.controller.ts` - Added Swagger docs
4. `test-api/07-advertising-analytics.http` - Added test examples (#11-12)

**Implementation**:
- Filter applied after classification, before sorting
- Summary calculated on FILTERED items (accurate totals)
- Pagination reflects filtered item count
- Backward compatible (no breaking changes)
- Performance: < 1ms overhead for filter operation

**Test Examples**:
```http
# Filter by loss
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=loss

# Filter by excellent
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=excellent

# All items (default)
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=all
```

**Frontend Action**:
- ✅ Remove client-side workaround ← **DONE** (2025-12-26)
- ✅ Server-side filtering enabled ← **DONE** (2025-12-26)
- ✅ All 62 tests passing ← **DONE** (2025-12-26)
- ⏳ Test with real data using test-api examples ← **PENDING**
- ⏳ Mark Story 33.4-FE as COMPLETE ← **PENDING**

**Frontend Changes** (2025-12-26):
```typescript
// src/lib/api/advertising-analytics.ts

// ❌ BEFORE (Client-side workaround)
const { efficiency_filter, ...backendParams } = params
const queryParams = buildQueryString({ ...backendParams })
// ... client-side filtering after response

// ✅ AFTER (Server-side filtering)
const queryParams = buildQueryString({ ...params })
// Backend handles filtering, summary, pagination
```

**Documentation**:
- **[76-efficiency-filter-not-implemented-backend.md](./76-efficiency-filter-not-implemented-backend.md)** ← **FULL IMPLEMENTATION GUIDE**

---

*Создано: 2025-12-24*
*Решено: 2025-12-26*
*Frontend Status: ✅ INTEGRATED (workaround removed, server-side filtering enabled)*
*Backend Status: ✅ COMPLETE*
*Test Coverage: ✅ 62/62 tests passing*
*Критичность: 🟢 RESOLVED*
