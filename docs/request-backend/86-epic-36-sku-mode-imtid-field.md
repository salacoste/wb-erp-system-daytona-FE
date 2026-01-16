# Request #86: Epic 36 - Добавить imtId в режиме group_by='sku'

**Дата запроса**: 2025-12-28
**Статус**: 🔍 Требуется реализация
**Приоритет**: High
**Запрошено**: Frontend Team (Epic 36: Product Card Linking)
**Epic**: 36 - Product Card Linking (склейки товаров)
**Связанные запросы**: Request #82 (Investigation), #83 (API Contract), #85 (Production Status)

---

## 📋 Запрос от Frontend

### Проблема: Невозможно определить принадлежность артикула к склейке в режиме "По артикулам"

**Бизнес-требование**:
1. ✅ По умолчанию показывать "По склейкам" (group_by='imtId') - **уже работает**
2. ⚠️ В режиме "По артикулам" (group_by='sku') нужно:
   - **Главный артикул** (spend > 0): показывать ROAS/ROI как обычно
   - **Артикулы в склейке** (spend=0, revenue>0): показывать badge "Товар в склейке" + ссылку на главный артикул

**Текущая проблема**:
- ❌ Backend НЕ возвращает `imtId` в режиме `group_by='sku'`
- ❌ Frontend НЕ МОЖЕТ определить "этот артикул в склейке" или нет
- ❌ Невозможно показать badge "Товар в склейке"

---

## 🎯 Что нужно от Backend

### Изменение API Response для group_by='sku'

**Endpoint**: `GET /v1/analytics/advertising?group_by=sku`

**БЫЛО** (сейчас):
```json
{
  "data": [
    {
      "key": "sku:173588306",
      "nmId": 173588306,
      "vendorCode": "ter-09",
      // ❌ НЕТ imtId в response
      "totalSpend": 0,
      "totalRevenue": 1105,
      "financials": {
        "roas": null,
        "roi": null
      }
    }
  ]
}
```

**ДОЛЖНО БЫТЬ**:
```json
{
  "data": [
    {
      "key": "sku:173588306",
      "nmId": 173588306,
      "vendorCode": "ter-09",
      "imtId": 328632,  // ✅ ДОБАВИТЬ - WB merged card ID
      "totalSpend": 0,
      "totalRevenue": 1105,
      "financials": {
        "roas": null,
        "roi": null
      }
    }
  ]
}
```

---

## 📊 Use Cases (Frontend UX)

### Use Case 1: Артикул БЕЗ склейки (imtId=null)

**Response**:
```json
{
  "nmId": 12345678,
  "vendorCode": "izo30white",
  "imtId": null,  // ✅ Не в склейке
  "totalSpend": 5000,
  "totalRevenue": 7500,
  "financials": { "roas": 1.5, "roi": 0.5 }
}
```

**Frontend отображение**:
```
Артикул: izo30white (#12345678)
Расходы: 5,000₽
Продажи: 7,500₽
ROAS: 1.5x ✅
ROI: 50% ✅
```

---

### Use Case 2: Артикул В СКЛЕЙКЕ - главный (spend > 0)

**Response**:
```json
{
  "nmId": 270937054,
  "vendorCode": "ter-13-1",
  "imtId": 328632,  // ✅ В склейке
  "totalSpend": 11337,  // ✅ Spend > 0 (главный артикул)
  "totalRevenue": 31464,
  "financials": { "roas": 2.77, "roi": 177.3 }
}
```

**Frontend отображение**:
```
Артикул: ter-13-1 (#270937054) 🔗 Главный в склейке #328632
Расходы: 11,337₽
Продажи: 31,464₽
ROAS: 2.77x ✅
ROI: 177% ✅

[Показать всю склейку] → переключает на group_by='imtId' и фильтрует имеhо по imtId=328632
```

---

### Use Case 3: Артикул В СКЛЕЙКЕ - дочерний (spend = 0)

**Response**:
```json
{
  "nmId": 173588306,
  "vendorCode": "ter-09",
  "imtId": 328632,  // ✅ В склейке
  "totalSpend": 0,     // ⚠️ Spend = 0 (дочерний артикул)
  "totalRevenue": 1105, // ✅ Revenue > 0 (от рекламы главного)
  "financials": { "roas": null, "roi": null }
}
```

**Frontend отображение**:
```
Артикул: ter-09 (#173588306)
Расходы: 0₽
Продажи: 1,105₽ (из рекламы)

💡 Badge: "Товар в склейке #328632"
📊 Tooltip:
   "Реклама льется на главный артикул в склейке.
    Этот товар получает трафик от основной карточки.

    ROAS/ROI считаются для всей склейки:
    → Переключитесь на 'По склейкам' для просмотра метрик группы"

[Показать метрики склейки] → group_by='imtId' filter по imtId=328632
```

---

## ✅ Acceptance Criteria

### AC1: API Response Enhancement
- [ ] `GET /v1/analytics/advertising?group_by=sku` возвращает `imtId` для каждого артикула
- [ ] `imtId` тип: `number | null` (NULL если артикул не в склейке)
- [ ] Поле `imtId` **всегда присутствует** в response (не опциональное)
- [ ] Backward compatible (не ломает существующий frontend без Epic 36)

### AC2: Data Accuracy
- [ ] `imtId` берется из таблицы `products.imt_id`
- [ ] JOIN с `products` выполняется для получения `imt_id`
- [ ] NULL значения корректно обрабатываются (артикул без склейки)

### AC3: Performance
- [ ] Добавление `imtId` НЕ ухудшает производительность запроса
- [ ] Используется существующий JOIN с `products` (уже есть для brand/category)
- [ ] Response time остается < 1s (p95) для 30-day range, 100 products

### AC4: Documentation
- [ ] Update Request #83 (API Contract) с примером response для group_by='sku'
- [ ] Update DTO описание: убрать "Present when group_by=imtId"
- [ ] Update Swagger docs

---

## 🔧 Техническая спецификация

### Изменения в DTO

**File**: `src/analytics/dto/response/advertising-response.dto.ts`

```typescript
export class AdvertisingStatsItemDto {
  // ❌ БЫЛО (опциональное, только для imtId mode)
  @ApiPropertyOptional({
    example: 328632,
    description: 'Epic 36: WB merged card ID. Present when group_by=imtId',
    nullable: true,
  })
  imtId?: number | null;

  // ✅ ДОЛЖНО БЫТЬ (всегда присутствует)
  @ApiProperty({
    example: 328632,
    description: 'Epic 36: WB merged card ID (склейка). NULL if product not in merged group',
    nullable: true,
  })
  imtId: number | null;
}
```

### Изменения в Service

**File**: `src/analytics/services/advertising-analytics.service.ts`

**Метод**: `getProductInfo()` (уже делает JOIN с products для brand/category)

```typescript
// ТЕКУЩАЯ реализация (lines ~1074-1090)
private async getProductInfo(
  cabinetId: string,
  nmIds: number[],
): Promise<Map<number, { name: string; brand: string; category: string }>> {
  const products = await this.prisma.product.findMany({
    where: { cabinetId, nmId: { in: nmIds } },
    select: {
      nmId: true,
      vendorCode: true,
      brand: true,
      category: true,
      subject: true,
    },
  });

  return new Map(
    products.map((p) => [
      p.nmId,
      {
        name: p.vendorCode || `nmId ${p.nmId}`,
        brand: p.brand || 'Unknown',
        category: p.category || p.subject || 'Unknown',
      },
    ]),
  );
}

// ✅ НУЖНО ДОБАВИТЬ imtId в select:
private async getProductInfo(
  cabinetId: string,
  nmIds: number[],
): Promise<Map<number, { name: string; brand: string; category: string; imtId: number | null }>> {
  const products = await this.prisma.product.findMany({
    where: { cabinetId, nmId: { in: nmIds } },
    select: {
      nmId: true,
      vendorCode: true,
      brand: true,
      category: true,
      subject: true,
      imtId: true,  // ✅ ДОБАВИТЬ
    },
  });

  return new Map(
    products.map((p) => [
      p.nmId,
      {
        name: p.vendorCode || `nmId ${p.nmId}`,
        brand: p.brand || 'Unknown',
        category: p.category || p.subject || 'Unknown',
        imtId: p.imtId || null,  // ✅ ДОБАВИТЬ
      },
    ]),
  );
}
```

**Метод**: `calculateMetrics()` - добавить `imtId` в response item

```typescript
// Где-то в lines ~323-370 (calculateMetrics метод)
// При формировании response item добавить:

return {
  key: `sku:${item.nmId}`,
  nmId: item.nmId,
  label: product.name,
  imtId: product.imtId,  // ✅ ДОБАВИТЬ из productInfo map

  // ... existing fields
};
```

---

## 📊 Примеры Response (обновленные)

### Пример 1: Артикул без склейки

**Request**:
```http
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-21&group_by=sku
```

**Response**:
```json
{
  "data": [
    {
      "key": "sku:12345678",
      "nmId": 12345678,
      "vendorCode": "izo30white",
      "imtId": null,  // ✅ NEW - не в склейке
      "totalSpend": 5000,
      "totalRevenue": 7500,
      "totalSales": 7500,
      "organicSales": 0,
      "financials": {
        "roas": 1.5,
        "roi": 50.0
      },
      "efficiency": {
        "status": "good"
      }
    }
  ]
}
```

### Пример 2: Главный артикул в склейке (spend > 0)

**Response**:
```json
{
  "data": [
    {
      "key": "sku:270937054",
      "nmId": 270937054,
      "vendorCode": "ter-13-1",
      "imtId": 328632,  // ✅ NEW - в склейке
      "totalSpend": 11337,  // ✅ Spend > 0 (главный)
      "totalRevenue": 31464,
      "totalSales": 14195,
      "organicSales": -17269,  // ⚠️ Negative (WB over-attribution)
      "financials": {
        "roas": 2.77,
        "roi": -165.6
      },
      "efficiency": {
        "status": "loss"
      }
    }
  ]
}
```

### Пример 3: Дочерний артикул в склейке (spend = 0) ⭐ KEY CASE

**Response**:
```json
{
  "data": [
    {
      "key": "sku:173588306",
      "nmId": 173588306,
      "vendorCode": "ter-09",
      "imtId": 328632,  // ✅ NEW - в склейке (такой же как у ter-13-1)
      "totalSpend": 0,     // ⚠️ Spend = 0 (дочерний)
      "totalRevenue": 1105, // ✅ Revenue > 0 (от рекламы главного)
      "totalSales": 1105,
      "organicSales": 0,
      "financials": {
        "roas": null,  // ✅ NULL (spend=0)
        "roi": null    // ✅ NULL (spend=0)
      },
      "efficiency": {
        "status": "unknown"
      }
    }
  ]
}
```

**Frontend UI для этого кейса**:
```
┌─────────────────────────────────────────────────────┐
│ Артикул: ter-09 (#173588306)                        │
│ Расходы: 0₽                                         │
│ Продажи: 1,105₽ (из рекламы)                        │
│                                                      │
│ 💡 Badge: "Товар в склейке #328632"                 │
│    [Показать метрики склейки] ← link to imtId group│
│                                                      │
│ 📊 Tooltip:                                         │
│    "Реклама льется на главный артикул в склейке.   │
│     Этот товар получает трафик от основной карточки.│
│     ROAS/ROI считаются для всей склейки."          │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Acceptance Criteria

### AC1: API Response Enhancement ⭐
- [ ] `GET /v1/analytics/advertising?group_by=sku` возвращает `imtId: number | null` для **каждого артикула**
- [ ] Поле `imtId` **всегда присутствует** (не опциональное)
- [ ] `imtId=null` если артикул не в склейке
- [ ] `imtId=<number>` если артикул в склейке

### AC2: Data Accuracy
- [ ] `imtId` значение берется из `products.imt_id` таблицы
- [ ] Корректное отображение для всех артикулов (главных и дочерних)
- [ ] NULL handling работает корректно

### AC3: Performance
- [ ] ⚠️ **КРИТИЧНО**: Не добавлять новый JOIN с products
- [ ] Использовать **существующий** `getProductInfo()` метод (уже делает JOIN)
- [ ] Response time остается < 1s (p95)

### AC4: Backward Compatibility
- [ ] Существующий frontend без Epic 36 продолжает работать
- [ ] No breaking changes в API response structure
- [ ] TypeScript types обратно совместимы (optional → required это OK)

### AC5: Documentation
- [ ] Update Request #83 (API Contract) с примерами для group_by='sku'
- [ ] Update DTO Swagger docs (убрать "Present when group_by=imtId")
- [ ] Update inline code comments

---

## 🔧 Техническая реализация (рекомендации)

### Шаг 1: Обновить DTO (required field)

**File**: `src/analytics/dto/response/advertising-response.dto.ts`

```typescript
export class AdvertisingStatsItemDto {
  // ❌ БЫЛО
  @ApiPropertyOptional({
    description: 'Epic 36: WB merged card ID. Present when group_by=imtId',
    nullable: true,
  })
  imtId?: number | null;

  // ✅ ДОЛЖНО БЫТЬ
  @ApiProperty({
    description: 'Epic 36: WB merged card ID (склейка). NULL if product not in merged group',
    example: 328632,
    nullable: true,
  })
  imtId: number | null;
}
```

### Шаг 2: Обновить getProductInfo() метод

**File**: `src/analytics/services/advertising-analytics.service.ts`

```typescript
// Lines ~1074-1090
private async getProductInfo(
  cabinetId: string,
  nmIds: number[],
): Promise<Map<number, {
  name: string;
  brand: string;
  category: string;
  imtId: number | null;  // ✅ ДОБАВИТЬ
}>> {
  const products = await this.prisma.product.findMany({
    where: { cabinetId, nmId: { in: nmIds } },
    select: {
      nmId: true,
      vendorCode: true,
      brand: true,
      category: true,
      subject: true,
      imtId: true,  // ✅ ДОБАВИТЬ в select
    },
  });

  return new Map(
    products.map((p) => [
      p.nmId,
      {
        name: p.vendorCode || `nmId ${p.nmId}`,
        brand: p.brand || 'Unknown',
        category: p.category || p.subject || 'Unknown',
        imtId: p.imtId || null,  // ✅ ДОБАВИТЬ
      },
    ]),
  );
}
```

### Шаг 3: Обновить mergeData() метод

**File**: `src/analytics/services/advertising-analytics.service.ts`

```typescript
// Lines ~1145-1250 (mergeData method)
// При формировании response item добавить imtId:

for (const stat of adStats) {
  const product = productInfo.get(stat.nmId) || {
    name: `SKU ${stat.nmId}`,
    brand: 'Unknown',
    category: 'Unknown',
    imtId: null,  // ✅ Default to null
  };

  // ... existing logic

  const item = {
    key: `sku:${stat.nmId}`,
    nmId: stat.nmId,
    label: product.name,
    brand: product.brand,
    category: product.category,
    imtId: product.imtId,  // ✅ ДОБАВИТЬ из productInfo map

    // ... existing fields (spend, revenue, etc.)
  };
}
```

### Шаг 4: Обновить calculateMetrics() метод

**File**: `src/analytics/services/advertising-analytics.service.ts`

```typescript
// Lines ~323-370 (calculateMetrics method)
// При возврате финального item включить imtId:

const withMetrics = this.calculateMetrics(merged);

// Ensure imtId is preserved in final response
return withMetrics.map(item => ({
  ...item,
  imtId: item.imtId || null,  // ✅ Ensure always present
}));
```

---

## 🧪 Testing Requirements

### Unit Tests

**File**: `src/analytics/services/__tests__/advertising-analytics.service.spec.ts`

```typescript
describe('Epic 36: imtId field in group_by=sku mode', () => {
  it('should return imtId for products in merged group (spend > 0)', async () => {
    // Test: главный артикул в склейке
    const result = await service.getAdvertisingStats('cabinet-id', {
      from: '2025-12-01',
      to: '2025-12-21',
      groupBy: 'sku',
    });

    const mainProduct = result.data.find(item => item.nmId === 270937054);
    expect(mainProduct.imtId).toBe(328632);
    expect(mainProduct.totalSpend).toBeGreaterThan(0);
  });

  it('should return imtId for products in merged group (spend = 0)', async () => {
    // Test: дочерний артикул в склейке
    const result = await service.getAdvertisingStats('cabinet-id', {
      from: '2025-12-01',
      to: '2025-12-21',
      groupBy: 'sku',
    });

    const childProduct = result.data.find(item => item.nmId === 173588306);
    expect(childProduct.imtId).toBe(328632);  // ✅ Same as main product
    expect(childProduct.totalSpend).toBe(0);
    expect(childProduct.totalRevenue).toBeGreaterThan(0);
  });

  it('should return imtId=null for products not in merged group', async () => {
    const result = await service.getAdvertisingStats('cabinet-id', {
      from: '2025-12-01',
      to: '2025-12-21',
      groupBy: 'sku',
    });

    const standaloneProduct = result.data.find(item => item.nmId === 12345678);
    expect(standaloneProduct.imtId).toBeNull();
  });

  it('should not add performance overhead', async () => {
    const start = Date.now();

    await service.getAdvertisingStats('cabinet-id', {
      from: '2025-12-01',
      to: '2025-12-21',
      groupBy: 'sku',
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);  // p95 < 1s
  });
});
```

---

## 📖 Frontend Integration (после реализации backend)

### 1. Update TypeScript Types

**File**: `frontend/src/types/advertising-analytics.ts`

```typescript
export interface AdvertisingItem {
  // ❌ БЫЛО
  imtId?: number | null;  // Optional

  // ✅ БУДЕТ
  imtId: number | null;   // Always present
}
```

### 2. Update UI Logic

**File**: `frontend/src/app/(dashboard)/analytics/advertising/components/PerformanceMetricsTable.tsx`

```typescript
// Helper: Render ROAS/ROI with merged group awareness
const renderROASWithMergedAwareness = (item: AdvertisingItem) => {
  // Edge case: Product in merged group with spend=0
  if (item.imtId !== null && item.spend === 0 && item.revenue > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-xs">
                Товар в склейке #{item.imtId}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-sm">
            <div className="space-y-2">
              <p className="font-medium">Товар в склейке</p>
              <p className="text-xs text-muted-foreground">
                Реклама льется на главный артикул в склейке #{item.imtId}.
                Этот товар получает трафик от основной карточки.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                ROAS/ROI считаются для всей склейки. Переключитесь на
                "По склейкам" для просмотра метрик группы.
              </p>
              <Button
                size="sm"
                variant="link"
                onClick={() => switchToImtIdView(item.imtId)}
              >
                Показать метрики склейки →
              </Button>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Normal case: show ROAS
  return renderROAS(item);
};
```

---

## ⏱️ Оценка времени реализации

### Backend (1-2 часа)
- [ ] 15 min - Update DTO (`imtId?: number | null` → `imtId: number | null`)
- [ ] 20 min - Update `getProductInfo()` method (add `imtId` to select + return type)
- [ ] 15 min - Update `calculateMetrics()` method (включить `imtId` в response item)
- [ ] 30 min - Write unit tests (3-4 tests)
- [ ] 10 min - Update documentation (Request #83, Swagger)
- [ ] 10 min - Testing & validation

**Total**: ~1.5 hours

### Frontend (после backend)
- [ ] 5 min - Update TypeScript types (`imtId?: → imtId:`)
- [ ] 30 min - Implement badge UI logic
- [ ] 20 min - Add "Показать склейку" button/link
- [ ] 15 min - Testing

**Total**: ~1.2 hours

---

## 🚀 Deployment Plan

### Phase 1: Backend Changes
1. Implement changes in `advertising-analytics.service.ts`
2. Update DTOs and Swagger docs
3. Run tests: `npm run test:unit src/analytics`
4. Deploy to staging
5. Validate API response includes `imtId` for all items

### Phase 2: Frontend Integration
1. Update TypeScript types
2. Implement badge UI
3. Test in browser with real data
4. Deploy to production

---

## 📞 Questions for Backend Team

### Q1: Performance Impact
**Question**: Добавление `imtId` в `getProductInfo()` select не ухудшит производительность?

**Expected Answer**: Нет, потому что:
- ✅ JOIN с `products` уже есть (для brand/category)
- ✅ `idx_products_imt_id` index уже создан (Story 36.1)
- ✅ Просто добавляем одно поле в select

### Q2: Backward Compatibility
**Question**: Изменение `imtId?: number | null` → `imtId: number | null` (optional → required) сломает существующий frontend?

**Expected Answer**: Нет, потому что:
- ✅ TypeScript: optional → required это безопасное изменение
- ✅ JSON response: просто добавляется новое поле (`imtId: null`)
- ✅ Frontend без Epic 36 просто игнорирует это поле

### Q3: Data Availability
**Question**: Все ли артикулы имеют imtId после sync (Story 36.2-36.3)?

**Expected Answer**:
- ✅ Sync работает daily at 06:00 MSK (Story 36.3)
- ✅ ~60% артикулов в склейках (imtId NOT NULL)
- ✅ ~40% standalone артикулов (imtId = NULL)
- ✅ Если sync не выполнен → все imtId = NULL (graceful degradation)

---

## 📚 Related Documentation

- **Request #82**: Исследование проблемы склеек (spend=0, revenue>0)
- **Request #83**: API Contract для Epic 36 (TypeScript types)
- **Request #84**: Frontend Integration Guide (пошаговый план)
- **Request #85**: Production Status (bugfix + validation)
- **Story 36.1**: Database schema (`products.imt_id` field)
- **Story 36.2**: Sync service (WB Content API integration)
- **Story 36.3**: Scheduler (daily auto-sync)
- **Story 36.4**: Analytics grouping (`group_by='imtId'`)

---

## 🎯 Business Value

**Для пользователя**:
- ✅ Понятно где артикул в склейке, где standalone
- ✅ Ясно почему ROAS/ROI не показываются (товар в склейке)
- ✅ Быстрый переход к метрикам всей склейки
- ✅ Полная прозрачность рекламных данных

**Для системы**:
- ✅ Единая логика (backend + frontend синхронизированы)
- ✅ Правильная атрибуция рекламных затрат
- ✅ 100% coverage аналитики (нет "Нет данных" статусов)

---

## 📝 Checklist для Backend Team

- [ ] DTO: Изменить `imtId` с optional на required
- [ ] Service: Добавить `imtId` в `getProductInfo()` return type + select
- [ ] Service: Включить `imtId` в response items (method `calculateMetrics` или `mergeData`)
- [ ] Tests: Написать 3-4 unit теста
- [ ] Docs: Update Request #83 с примерами group_by='sku'
- [ ] Swagger: Update API docs
- [ ] Testing: Validate на staging
- [ ] Notify: Сообщить frontend team о готовности

---

## ⚡ Priority & Timeline

**Приоритет**: High (блокирует полную реализацию Epic 36 на frontend)

**Рекомендуемый timeline**:
- Backend implementation: 1.5 hours
- Testing & validation: 0.5 hours
- **Total**: 2 hours

**Можно реализовать**: В рамках одного спринта, параллельно с другими задачами

---

**Prepared by**: Frontend Team
**Date**: 2025-12-28
**Epic**: 36 - Product Card Linking
