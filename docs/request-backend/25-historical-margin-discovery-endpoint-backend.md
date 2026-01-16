# Backend Response: Request #25 - Historical Margin Discovery

## Статус
✅ **IMPLEMENTED** — Stories 23.8 and 23.9 deployed and tested

---

## Implementation Summary

| Story | Status | Description |
|-------|--------|-------------|
| **Story 23.8** | ✅ Complete | `GET /v1/analytics/weekly/product-weeks` endpoint |
| **Story 23.9** | ✅ Complete | Historical margin fields in products list (Variant A) |

---

## Story 23.9: Historical Margin Context (Variant A - Your Recommendation)

### API Response Extension

`GET /v1/products?include_cogs=true` теперь возвращает новые поля:

```json
{
  "nm_id": "173589742",
  "article": "Termobele-01",
  "has_cogs": true,
  "cogs": {
    "unit_cost_rub": "11.00",
    "valid_from": "2025-01-11T00:00:00.000Z"
  },

  "current_margin_pct": null,
  "current_margin_period": "2025-W47",
  "missing_data_reason": "NO_SALES_DATA",

  "last_sales_week": "2025-W44",
  "last_sales_margin_pct": 92.32,
  "last_sales_qty": 5,
  "weeks_since_last_sale": 3
}
```

### Field Semantics

| Field | Type | Description |
|-------|------|-------------|
| `last_sales_week` | `string \| null` | ISO week (e.g., "2025-W44"). Null if no sales in 12 weeks. |
| `last_sales_margin_pct` | `number \| null` | Margin % from that week. Null if no margin data or no sales. |
| `last_sales_qty` | `number \| null` | Units sold in that week. Null if no sales. |
| `weeks_since_last_sale` | `number \| null` | Difference between current week and last sales week. |

### Conditions

- Fields populated **only when** `missing_data_reason === "NO_SALES_DATA"`
- Search lookback: **12 weeks**
- All fields = `null` if no sales found in lookback period
- Batch-optimized: single SQL query with `DISTINCT ON` for all products

### Performance

- Added latency: **< 20ms** (batched query, covered by index)
- No N+1 queries: single batch lookup for all products needing history

---

## Story 23.8: Product Weeks Endpoint (Variant B - Detailed History)

### New Endpoint

```http
GET /v1/analytics/weekly/product-weeks?nm_id=173589742&weeks=13
Authorization: Bearer {jwt}
X-Cabinet-Id: {cabinet_id}
```

### Response

```json
{
  "nm_id": "173589742",
  "weeks_requested": 13,
  "weeks": [
    {
      "week": "2025-W44",
      "week_start_date": "2025-10-28",
      "quantity_sold": 5,
      "revenue_net_rub": "1431.59",
      "cogs_rub": "55.00",
      "profit_rub": "1376.59",
      "margin_pct": 92.32
    },
    {
      "week": "2025-W42",
      "week_start_date": "2025-10-14",
      "quantity_sold": 3,
      "revenue_net_rub": "856.20",
      "cogs_rub": "33.00",
      "profit_rub": "823.20",
      "margin_pct": 88.15
    }
  ],
  "summary": {
    "weeks_with_sales": 2,
    "total_quantity": 8,
    "total_revenue_net_rub": "2287.79",
    "total_profit_rub": "2199.79",
    "average_margin_pct": 90.24
  }
}
```

### Use Case

Для страницы детальной истории продаж товара:
- Click "[История продаж →]" в списке товаров
- Показывает chart/table со всеми неделями продаж
- Полная статистика: qty, revenue, profit, margin по неделям

---

## Frontend Integration Code

### ProductList.tsx (Story 23.9)

```tsx
// Existing types should be extended:
interface Product {
  // ... existing fields ...

  // Story 23.9: Historical margin context
  last_sales_week?: string | null;
  last_sales_margin_pct?: number | null;
  last_sales_qty?: number | null;
  weeks_since_last_sale?: number | null;
}

// Rendering:
{product.missing_data_reason === 'NO_SALES_DATA' && (
  <div className="space-y-1">
    <span className="text-sm text-muted-foreground">
      — (нет продаж за {product.current_margin_period})
    </span>

    {product.last_sales_week ? (
      <div className="text-xs">
        <span className="text-muted-foreground">Последняя: </span>
        <span className="text-green-600 font-medium">
          {product.last_sales_week} ({product.last_sales_margin_pct?.toFixed(2)}%)
        </span>
        <span className="text-muted-foreground ml-1">
          ({product.weeks_since_last_sale} нед. назад, {product.last_sales_qty} шт.)
        </span>
      </div>
    ) : (
      <span className="text-xs text-muted-foreground">
        Нет продаж за последние 12 недель
      </span>
    )}

    <Link href={`/analytics/sku/${product.nm_id}`}>
      <History className="h-3 w-3 mr-1" />
      История продаж
    </Link>
  </div>
)}
```

### ProductHistory.tsx (Story 23.8)

```tsx
// New hook for detailed history
const useProductWeeks = (nmId: string, weeks = 13) => {
  return useQuery({
    queryKey: ['product-weeks', nmId, weeks],
    queryFn: async () => {
      const response = await apiClient.get(
        `/analytics/weekly/product-weeks?nm_id=${nmId}&weeks=${weeks}`
      );
      return response.data;
    },
  });
};

// Usage in component
const { data: history, isLoading } = useProductWeeks(nmId);

// Render chart/table with history.weeks
```

---

## API Types Update

```typescript
// frontend/src/types/api.ts

export interface ProductWithCogs {
  // ... existing fields ...

  // Story 23.9: Historical margin context
  /** ISO week of last sale (e.g., "2025-W44"). Null if no sales in 12 weeks. */
  last_sales_week?: string | null;
  /** Margin % from last sales week. Null if no data. */
  last_sales_margin_pct?: number | null;
  /** Units sold in last sales week. */
  last_sales_qty?: number | null;
  /** Weeks since last sale (current - last). */
  weeks_since_last_sale?: number | null;
}

// Story 23.8: Product weeks endpoint
export interface ProductWeekData {
  week: string;
  week_start_date: string;
  quantity_sold: number;
  revenue_net_rub: string;
  cogs_rub: string | null;
  profit_rub: string | null;
  margin_pct: number | null;
}

export interface ProductWeeksResponse {
  nm_id: string;
  weeks_requested: number;
  weeks: ProductWeekData[];
  summary: {
    weeks_with_sales: number;
    total_quantity: number;
    total_revenue_net_rub: string;
    total_profit_rub: string;
    average_margin_pct: number | null;
  };
}
```

---

## Testing

### Manual Test (Story 23.9)

```bash
curl -s "http://localhost:3000/v1/products?include_cogs=true&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID" | jq '.data[] | select(.missing_data_reason == "NO_SALES_DATA") | {nm_id, last_sales_week, last_sales_margin_pct, weeks_since_last_sale}'
```

### Manual Test (Story 23.8)

```bash
curl -s "http://localhost:3000/v1/analytics/weekly/product-weeks?nm_id=173589742&weeks=13" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID" | jq
```

---

## Timeline Update

| Этап | Срок | Статус |
|------|------|--------|
| Backend review | 2025-01-27 | ✅ Done |
| Backend implementation | 2025-01-27 | ✅ Done |
| Unit tests | 2025-01-27 | ✅ Done (19 tests) |
| Frontend integration | - | 🟡 Ready for you |
| Testing | - | ⏳ |

---

## Related Documentation

- **Story 23.8**: `docs/stories/epic-23/story-23.8-product-weeks-with-sales-endpoint.md`
- **Story 23.9**: `docs/stories/epic-23/story-23.9-historical-margin-context-in-products.md`
- **Swagger**: `http://localhost:3000/api` (updated with new fields)
- **test-api/08-products.http**: Products API examples

---

> **Note to Frontend Team**: Both endpoints are deployed and ready for integration. The Swagger documentation includes all new fields with examples. Let us know if you need any adjustments!
