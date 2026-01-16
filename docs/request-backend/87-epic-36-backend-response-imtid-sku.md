# Request #87: Backend Response - imtId Field in SKU Mode (Epic 36)

**Дата**: 2025-12-28
**Статус**: ✅ **IMPLEMENTED** - Ready for frontend integration
**Приоритет**: High
**Epic**: 36 - Product Card Linking (склейки товаров)
**В ответ на**: [Request #86](./86-epic-36-sku-mode-imtid-field.md)
**Исполнитель**: Backend Team

---

## 📋 Executive Summary

**Request #86 РЕАЛИЗОВАН** ✅

Backend добавил поле `imtId: number | null` в API response для режима `group_by='sku'`.

**Ключевые изменения**:
- ✅ Все артикулы теперь возвращают `imtId` (number или null)
- ✅ Поле **обязательное** (не optional) - всегда присутствует в response
- ✅ Использует существующий JOIN с `products` таблицей
- ✅ Backward compatible - старые клиенты просто игнорируют новое поле
- ✅ **NO breaking changes** - API contract расширен, но не изменён

**Frontend может теперь**:
- ✅ Показывать badge "Товар в склейке #328632" для дочерних артикулов
- ✅ Объяснять почему ROAS/ROI = null (артикул в склейке)
- ✅ Добавить кнопку "Показать метрики склейки" → переход на group_by='imtId'

---

## 🔧 Технические детали реализации

### Изменённые файлы

**1. DTO Update** - `src/analytics/dto/advertising-analytics.dto.ts`:
```typescript
export interface AdvertisingItemDto {
  // Epic 36 fields:
  type?: 'merged_group' | 'individual';
  imtId: number | null;  // ✅ CHANGED: optional → required (всегда в response)
  mergedProducts?: MergedProduct[];

  // Existing fields...
  key: string;
  nmId?: number;
  vendorCode?: string;
  totalSpend: number;
  totalRevenue: number;
  totalOrders: number;
  financials: {
    roas: number | null;
    roi: number | null;
  };
}
```

**Критично**: `imtId?: number | null` → `imtId: number | null` (убрали `?`)

**2. Service Update** - `src/analytics/services/advertising-analytics.service.ts`:

```typescript
// getProductInfo() - добавили imtId в SELECT
private async getProductInfo(
  nmIds: number[],
  cabinetId: string,
): Promise<Map<number, { vendorCode: string; imtId: number | null }>> {
  const products = await this.prisma.products.findMany({
    where: {
      nm_id: { in: nmIds },
      cabinet_id: cabinetId,
    },
    select: {
      nm_id: true,
      vendor_code: true,
      imt_id: true,  // ✅ ADDED - Epic 36 Story 36.0
    },
  });

  return new Map(
    products.map((p) => [
      p.nm_id,
      {
        vendorCode: p.vendor_code,
        imtId: p.imt_id,  // ✅ ADDED - number | null from DB
      },
    ]),
  );
}
```

**3. Query aggregation update** - добавили `imtId` в response mapping:

```typescript
// buildSkuModeResponse() - добавили imtId
const items: AdvertisingItemDto[] = results.map((row) => ({
  key: `sku:${row.nm_id}`,
  nmId: row.nm_id,
  vendorCode: productInfo.get(row.nm_id)?.vendorCode ?? 'unknown',
  imtId: productInfo.get(row.nm_id)?.imtId ?? null,  // ✅ ADDED
  totalSpend: row.cost_sum,
  totalRevenue: row.sales_sum,
  totalOrders: row.orders_count,
  financials: {
    roas: row.cost_sum > 0 ? row.sales_sum / row.cost_sum : null,
    roi: row.cost_sum > 0 ? (row.sales_sum - row.cost_sum) / row.cost_sum : null,
  },
}));
```

### Database Schema (уже готова)

**Таблица `products`** (Epic 36 Story 36.0):
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  nm_id BIGINT NOT NULL,
  vendor_code TEXT,
  imt_id BIGINT NULL,  -- ✅ WB merged card ID (NULL = не в склейке)
  ...
  UNIQUE(cabinet_id, nm_id)
);

CREATE INDEX idx_products_imt_id ON products(cabinet_id, imt_id)
  WHERE imt_id IS NOT NULL;
```

**Источник данных**: WB Content API (`POST /content/v2/get/cards/list`), синхронизируется:
- Ежедневно в 06:00 MSK (BullMQ cron)
- При добавлении нового WB ключа (автоматически)
- Вручную через `POST /v1/imports/products/sync-imt-ids`

---

## 📊 Обновлённый API Contract

### Endpoint (без изменений)
```
GET /v1/analytics/advertising
```

### Parameters (без изменений)
```
?from=2025-12-01
&to=2025-12-21
&group_by=sku  // ← SKU mode
```

### Response Format (UPDATED)

**Артикул БЕЗ склейки** (imtId=null):
```json
{
  "data": [
    {
      "key": "sku:12345678",
      "nmId": 12345678,
      "vendorCode": "izo30white",
      "imtId": null,  // ✅ NEW: Не в склейке
      "totalSpend": 5000,
      "totalRevenue": 7500,
      "totalOrders": 15,
      "financials": {
        "roas": 1.5,
        "roi": 0.5
      }
    }
  ],
  "meta": {
    "from": "2025-12-01",
    "to": "2025-12-21",
    "group_by": "sku"
  }
}
```

**Артикул В СКЛЕЙКЕ - главный** (spend > 0):
```json
{
  "data": [
    {
      "key": "sku:270937054",
      "nmId": 270937054,
      "vendorCode": "ter-13-1",
      "imtId": 328632,  // ✅ NEW: В склейке #328632
      "totalSpend": 11337,  // Spend > 0 (главный артикул)
      "totalRevenue": 31464,
      "totalOrders": 12,
      "financials": {
        "roas": 2.77,
        "roi": 1.77
      }
    }
  ]
}
```

**Артикул В СКЛЕЙКЕ - дочерний** (spend = 0):
```json
{
  "data": [
    {
      "key": "sku:173588306",
      "nmId": 173588306,
      "vendorCode": "ter-09",
      "imtId": 328632,  // ✅ NEW: В склейке #328632
      "totalSpend": 0,     // Spend = 0 (дочерний артикул)
      "totalRevenue": 1105, // Revenue от рекламы главного
      "totalOrders": 1,
      "financials": {
        "roas": null,  // NULL потому что spend=0
        "roi": null    // NULL потому что spend=0
      }
    }
  ]
}
```

---

## 🎨 Frontend Integration Guide

### TypeScript Type Update

**Файл**: `src/types/advertising-analytics.ts`

```typescript
export interface AdvertisingItem {
  // Epic 36 fields:
  type?: 'merged_group' | 'individual';
  imtId: number | null;  // ✅ UPDATED: убрали optional (?)
  mergedProducts?: MergedProduct[];

  // Existing fields...
  key: string;
  nmId?: number;
  vendorCode?: string;
  totalSpend: number;
  totalRevenue: number;
  totalOrders: number;
  financials: {
    roas: number | null;
    roi: number | null;
  };
}
```

**ВАЖНО**: Поле `imtId` теперь **обязательное** (не `imtId?: number | null`, а `imtId: number | null`).

### UI Component Example

**Компонент**: `ProductRowBadge.tsx`

```tsx
interface ProductRowBadgeProps {
  item: AdvertisingItem;
  onShowMergedGroup?: (imtId: number) => void;
}

export function ProductRowBadge({ item, onShowMergedGroup }: ProductRowBadgeProps) {
  // Case 1: Артикул НЕ в склейке
  if (item.imtId === null) {
    return null; // Нет badge
  }

  // Case 2: Главный артикул в склейке (spend > 0)
  if (item.totalSpend > 0) {
    return (
      <Badge variant="primary" className="gap-1">
        🔗 Главный в склейке #{item.imtId}
        {onShowMergedGroup && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShowMergedGroup(item.imtId!)}
          >
            Показать всю склейку
          </Button>
        )}
      </Badge>
    );
  }

  // Case 3: Дочерний артикул в склейке (spend = 0)
  return (
    <Badge variant="warning" className="gap-1">
      🔗 Товар в склейке #{item.imtId}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>ⓘ</TooltipTrigger>
          <TooltipContent>
            <p>Этот артикул получает продажи от рекламы главного артикула.</p>
            <p>Метрики (ROAS/ROI) рассчитываются только для всей склейки.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {onShowMergedGroup && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onShowMergedGroup(item.imtId!)}
        >
          Показать метрики склейки
        </Button>
      )}
    </Badge>
  );
}
```

### Navigation Flow

**Сценарий**: Пользователь кликает "Показать метрики склейки"

```tsx
function handleShowMergedGroup(imtId: number) {
  // 1. Переключить режим группировки
  setGroupBy('imtId');

  // 2. Применить фильтр по imtId (опционально)
  // Если хотите показать только эту склейку:
  setFilters({ imtId });

  // 3. Скроллить к строке с этой склейкой
  const element = document.querySelector(`[data-imt-id="${imtId}"]`);
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

---

## 🧪 Testing Recommendations

### Unit Tests (Frontend)

**Файл**: `src/components/analytics/__tests__/ProductRowBadge.test.tsx`

```typescript
describe('ProductRowBadge - Request #87', () => {
  it('should NOT render badge when imtId is null', () => {
    const item: AdvertisingItem = {
      key: 'sku:12345',
      nmId: 12345,
      vendorCode: 'test',
      imtId: null,  // ✅ Не в склейке
      totalSpend: 5000,
      totalRevenue: 7500,
      totalOrders: 10,
      financials: { roas: 1.5, roi: 0.5 },
    };

    const { container } = render(<ProductRowBadge item={item} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render "Главный в склейке" badge when spend > 0', () => {
    const item: AdvertisingItem = {
      key: 'sku:270937054',
      nmId: 270937054,
      vendorCode: 'ter-13-1',
      imtId: 328632,  // ✅ В склейке
      totalSpend: 11337,
      totalRevenue: 31464,
      totalOrders: 12,
      financials: { roas: 2.77, roi: 1.77 },
    };

    const { getByText } = render(<ProductRowBadge item={item} />);
    expect(getByText(/Главный в склейке #328632/i)).toBeInTheDocument();
  });

  it('should render "Товар в склейке" badge when spend = 0', () => {
    const item: AdvertisingItem = {
      key: 'sku:173588306',
      nmId: 173588306,
      vendorCode: 'ter-09',
      imtId: 328632,  // ✅ В склейке
      totalSpend: 0,  // Дочерний артикул
      totalRevenue: 1105,
      totalOrders: 1,
      financials: { roas: null, roi: null },
    };

    const { getByText } = render(<ProductRowBadge item={item} />);
    expect(getByText(/Товар в склейке #328632/i)).toBeInTheDocument();
  });

  it('should call onShowMergedGroup with correct imtId', () => {
    const mockCallback = jest.fn();
    const item: AdvertisingItem = {
      key: 'sku:173588306',
      nmId: 173588306,
      vendorCode: 'ter-09',
      imtId: 328632,
      totalSpend: 0,
      totalRevenue: 1105,
      totalOrders: 1,
      financials: { roas: null, roi: null },
    };

    const { getByText } = render(
      <ProductRowBadge item={item} onShowMergedGroup={mockCallback} />
    );

    fireEvent.click(getByText(/Показать метрики склейки/i));
    expect(mockCallback).toHaveBeenCalledWith(328632);
  });
});
```

### Integration Tests (API)

**Тест сценарий**:
```typescript
describe('GET /v1/analytics/advertising?group_by=sku - Request #87', () => {
  it('should return imtId for all products', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/analytics/advertising')
      .query({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'sku',
      })
      .set('Authorization', `Bearer ${token}`)
      .set('X-Cabinet-Id', cabinetId)
      .expect(200);

    // Verify all items have imtId field
    response.body.data.forEach((item: AdvertisingItem) => {
      expect(item).toHaveProperty('imtId');
      expect(item.imtId === null || typeof item.imtId === 'number').toBe(true);
    });
  });

  it('should return correct imtId for merged products', async () => {
    // Arrange: Ensure test product has imtId in DB
    await prisma.products.upsert({
      where: { nm_id: 173588306 },
      update: { imt_id: 328632 },
      create: {
        nm_id: 173588306,
        vendor_code: 'ter-09',
        imt_id: 328632,
        cabinet_id: cabinetId,
      },
    });

    const response = await request(app.getHttpServer())
      .get('/v1/analytics/advertising')
      .query({
        from: '2025-12-01',
        to: '2025-12-21',
        group_by: 'sku',
      })
      .set('Authorization', `Bearer ${token}`)
      .set('X-Cabinet-Id', cabinetId)
      .expect(200);

    const product = response.body.data.find((p: AdvertisingItem) => p.nmId === 173588306);
    expect(product.imtId).toBe(328632);
  });
});
```

---

## ✅ Acceptance Criteria

Request #87 считается выполненным когда:

**Backend**:
- [x] `imtId` field added to `AdvertisingItemDto` (required, not optional)
- [x] `getProductInfo()` includes `imt_id` in SELECT query
- [x] Response mapping includes `imtId: number | null` for all SKUs
- [x] Unit tests pass (advertising-analytics.service.spec.ts)
- [x] Integration tests pass (API returns imtId for all products)
- [x] No breaking changes (backward compatible)

**Frontend** (ожидается реализация):
- [ ] TypeScript types updated (`imtId?: number | null` → `imtId: number | null`)
- [ ] `ProductRowBadge` component created
- [ ] Badge logic implements 3 cases (null, spend>0, spend=0)
- [ ] "Показать метрики склейки" button navigates to imtId view
- [ ] Tooltip explains why ROAS/ROI is null for child SKUs
- [ ] Unit tests pass (ProductRowBadge.test.tsx)
- [ ] Integration tests pass (badge renders correctly)
- [ ] E2E tests pass (navigation flow works)

---

## 📊 Performance Impact

**Database Query**: No performance degradation
- ✅ `imt_id` already indexed (`idx_products_imt_id`)
- ✅ JOIN with `products` table already exists
- ✅ No additional queries added

**API Response Size**: Minimal increase
- ✅ Added 1 field per product: `"imtId": 328632` (~15 bytes)
- ✅ For 100 products: ~1.5 KB increase (negligible)

**Backend Processing**: No change
- ✅ Same JOIN operation
- ✅ Same aggregation logic
- ✅ Only response mapping updated

---

## 🔗 Related Documentation

**Epic 36 Documentation**:
- **[Request #82](./82-card-linking-product-bundles.md)** - Original problem investigation
- **[Request #83](./83-epic-36-api-contract.md)** - API contract for Epic 36
- **[Request #84](./84-epic-36-frontend-integration-guide.md)** - Frontend integration guide
- **[Request #85](./85-epic-36-production-status.md)** - Production status & bugfix
- **[Request #86](./86-epic-36-sku-mode-imtid-field.md)** - Frontend request (this response)

**Backend Documentation**:
- `docs/epics/epic-36-product-card-linking.md` - Epic 36 overview
- `docs/stories/epic-36/story-36.0-product-model-database.md` - Database schema
- `docs/API-PATHS-REFERENCE.md` - Full API reference (lines 986-1102)

**Test API**:
- `test-api/07-advertising-analytics.http` - REST Client examples
- `test-api/README.md` - Epic 36 testing guide

---

## 📞 Support & Questions

**Backend Team**:
- **Implementation**: ✅ COMPLETE (2025-12-28)
- **API Endpoint**: `GET /v1/analytics/advertising?group_by=sku`
- **New Field**: `imtId: number | null` (always present)

**Frontend Team**:
- **Action Required**: Update TypeScript types and create `ProductRowBadge` component
- **Estimated Effort**: 2-3 hours (types + component + tests)
- **Swagger Docs**: `http://localhost:3000/api` - explore live API

**Questions**:
- Slack: `#epic-36-product-linking`
- Technical: Backend Team Lead
- Business Logic: Product Owner

---

## 📝 Change Log

### 2025-12-28 - Initial Implementation
- ✅ Added `imtId` field to SKU mode response
- ✅ Updated DTO: `imtId?: number | null` → `imtId: number | null`
- ✅ Modified `getProductInfo()` to include `imt_id`
- ✅ Updated response mapping in `buildSkuModeResponse()`
- ✅ Tests updated and passing
- ✅ Documentation complete

---

**Document Version**: 1.0
**Last Updated**: 2025-12-28
**Status**: ✅ **IMPLEMENTED** - Ready for frontend integration
**Next Action**: Frontend Team - integrate `ProductRowBadge` component

---

**Backend Commitment**: API change deployed, no breaking changes, backward compatible. Frontend can start integration immediately.
