# Request #64: Per-SKU Margin Missing Expense Components - Backend Response

## Date
2025-12-18

## Status
✅ **IMPLEMENTED** - Epic 31: Complete Per-SKU Financial Analytics

## Summary

Request #64 о недостающих компонентах расходов в per-SKU маржинальной аналитике **полностью решён** новым endpoint'ом `/v1/analytics/sku-financials` (Epic 31).

**Ключевые решения**:
1. ✅ Storage из `paid_storage_daily` (не 0!)
2. ✅ Commission/acquiring как visibility поля (уже в net_for_pay)
3. ✅ Operating profit с правильной формулой
4. ✅ Классификация прибыльности
5. ✅ 26 unit tests

---

## ⚠️ Важно: Перезапуск Backend

> **Backend должен быть перезапущен для активации нового endpoint.**
>
> Если endpoint вернёт **404 Not Found**, необходимо перезапустить backend сервер:
> ```bash
> # PM2
> pm2 restart wb-repricer-backend
>
> # или npm
> npm run build && npm run start:prod
> ```
>
> После перезапуска endpoint `/v1/analytics/sku-financials` станет доступен.

---

## Новый Endpoint

### `GET /v1/analytics/sku-financials`

Полная финансовая картина по каждому SKU с операционной прибылью.

```http
GET /v1/analytics/sku-financials?week=2025-W50
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `week` | string | ✅ | - | ISO week (2025-W50) |
| `nm_ids` | string | - | all | Comma-separated SKU IDs |
| `sortBy` | enum | - | `operatingProfit` | See sorting options |
| `order` | enum | - | `desc` | `asc` \| `desc` |
| `includeVisibility` | boolean | - | `true` | Include commission/acquiring |
| `limit` | number | - | 50 | Max 500 |
| `offset` | number | - | 0 | Pagination offset |

**Sorting Options** (`sortBy`):
- `operatingProfit` - Операционная прибыль
- `operatingMarginPct` - Операционная маржа %
- `storageCost` - Затраты на хранение
- `logisticsCost` - Логистика
- `revenue` - Выручка
- `grossProfit` - Валовая прибыль

---

## Response Structure

```typescript
interface SkuFinancialsResponse {
  meta: {
    week: string;           // "2025-W50"
    cabinetId: number;
    generatedAt: string;    // ISO timestamp
  };
  data: SkuFinancialItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface SkuFinancialItem {
  nmId: number;
  productName: string;
  category: string | null;
  brand: string | null;

  revenue: {
    gross: number;          // retail_price_with_discount
    net: number;            // net_for_pay (после комиссии WB)
  };

  costs: {
    cogs: number | null;    // Себестоимость (Week Midpoint Strategy)
    logistics: number;      // delivery + return
    storage: number;        // ИЗ paid_storage_daily!
    penalties: number;
    paidAcceptance: number;
  };

  // Visibility - НЕ операционные расходы!
  visibility: {
    commission: number;     // total_commission_rub (INFO ONLY)
    acquiring: number;      // acquiring_fee (INFO ONLY)
  };

  profit: {
    gross: number;          // revenue.net - costs.cogs
    operating: number;      // gross - logistics - storage - penalties - acceptance
    operatingMarginPct: number;
  };

  profitabilityStatus: ProfitabilityStatus;
  missingCogs: boolean;
}

type ProfitabilityStatus =
  | 'excellent'   // > 25%
  | 'good'        // 15-25%
  | 'warning'     // 5-15%
  | 'critical'    // 0-5%
  | 'loss'        // < 0%
  | 'unknown';    // No COGS
```

---

## Формула Operating Profit

```
operatingProfit = grossProfit - logisticsCost - storageCost - penalties - paidAcceptance
```

### ВАЖНО: Commission и Acquiring НЕ вычитаются!

Они показаны как `visibility` поля только для информации. Причина:

1. **Уже учтены**: `net_for_pay = gross - commission - acquiring`
2. **Двойной учёт**: Если вычесть снова → завышение расходов
3. **WB логика**: Commission/acquiring — это "плата за платформу", не операционные расходы продавца

---

## Источники данных

| Поле | Источник | Notes |
|------|----------|-------|
| Транзакции | `wb_finance_raw` | sales, returns, logistics, fees |
| Storage | `paid_storage_daily` | **Epic 24** (LEFT JOIN by nm_id + date range) |
| COGS | `cogs` table | Week Midpoint Strategy (Thursday) |

### Storage из paid_storage_daily

**Было (Request #64 проблема)**:
```
storageCostRub: 0.00  ❌ Из wb_finance_raw (service rows без nm_id)
```

**Стало (Epic 31 решение)**:
```sql
LEFT JOIN paid_storage_daily psd
  ON psd.nm_id::text = wfr.nm_id
  AND psd.cabinet_id = wfr.cabinet_id
  AND psd.date BETWEEN week_start AND week_end
```

---

## Примеры запросов

### 1. Все SKU за неделю
```http
GET /v1/analytics/sku-financials?week=2025-W50
```

### 2. Конкретные SKU
```http
GET /v1/analytics/sku-financials?week=2025-W50&nm_ids=148190182,148190095
```

### 3. Сортировка по хранению (самые дорогие)
```http
GET /v1/analytics/sku-financials?week=2025-W50&sortBy=storageCost&order=desc&limit=20
```

### 4. Наименее прибыльные SKU
```http
GET /v1/analytics/sku-financials?week=2025-W50&sortBy=operatingMarginPct&order=asc&limit=20
```

### 5. Без visibility (компактный ответ)
```http
GET /v1/analytics/sku-financials?week=2025-W50&includeVisibility=false
```

### 6. Пагинация
```http
# Page 1
GET /v1/analytics/sku-financials?week=2025-W50&limit=25&offset=0

# Page 2
GET /v1/analytics/sku-financials?week=2025-W50&limit=25&offset=25
```

---

## Пример ответа

```json
{
  "meta": {
    "week": "2025-W50",
    "cabinetId": 1,
    "generatedAt": "2025-12-18T10:30:00Z"
  },
  "data": [
    {
      "nmId": 148190182,
      "productName": "m61-5",
      "category": "Электроника",
      "brand": "TechBrand",

      "revenue": {
        "gross": 35000.00,
        "net": 28680.99
      },

      "costs": {
        "cogs": 10656.00,
        "logistics": 3790.23,
        "storage": 6.44,
        "penalties": 0.00,
        "paidAcceptance": 0.00
      },

      "visibility": {
        "commission": 2525.77,
        "acquiring": 505.12
      },

      "profit": {
        "gross": 18024.99,
        "operating": 14228.32,
        "operatingMarginPct": 49.61
      },

      "profitabilityStatus": "excellent",
      "missingCogs": false
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## Сравнение с Request #64

| Поле | Request #64 (было) | Epic 31 (стало) |
|------|-------------------|-----------------|
| logisticsCostRub | 3790.23 ✅ | `costs.logistics: 3790.23` ✅ |
| storageCostRub | 0.00 ❌ | `costs.storage: 6.44` ✅ |
| commissionRub | 0.00 ❌ | `visibility.commission: 2525.77` ✅ |
| acquiringFeeRub | 0.00 ❌ | `visibility.acquiring: 505.12` ✅ |
| operatingProfitRub | 14234.76 (завышено) | `profit.operating: 14228.32` ✅ |
| operatingMarginPercent | 49.63% (завышено) | `operatingMarginPct: 49.61%` ✅ |

**Примечание**: Небольшая разница в operating profit (~6₽) из-за того, что commission/acquiring теперь **НЕ вычитаются** (они visibility only).

---

## Классификация прибыльности

| Status | Operating Margin % | Color (Frontend) | Hex |
|--------|-------------------|------------------|-----|
| `excellent` | > 25% | Green | `#22C55E` |
| `good` | 15-25% | Light Green | `#84CC16` |
| `warning` | 5-15% | Yellow | `#EAB308` |
| `critical` | 0-5% | Orange | `#F97316` |
| `loss` | < 0% | Red | `#EF4444` |
| `unknown` | N/A (no COGS) | Gray | `#9CA3AF` |

---

## TypeScript Types для Frontend

```typescript
// src/types/sku-financials.ts

export interface SkuFinancialsQuery {
  week: string;
  nm_ids?: string;
  sortBy?: SkuFinancialsSortBy;
  order?: 'asc' | 'desc';
  includeVisibility?: boolean;
  limit?: number;
  offset?: number;
}

export type SkuFinancialsSortBy =
  | 'operatingProfit'
  | 'operatingMarginPct'
  | 'storageCost'
  | 'logisticsCost'
  | 'revenue'
  | 'grossProfit';

export type ProfitabilityStatus =
  | 'excellent'
  | 'good'
  | 'warning'
  | 'critical'
  | 'loss'
  | 'unknown';

export interface SkuFinancialItem {
  nmId: number;
  productName: string;
  category: string | null;
  brand: string | null;
  revenue: {
    gross: number;
    net: number;
  };
  costs: {
    cogs: number | null;
    logistics: number;
    storage: number;
    penalties: number;
    paidAcceptance: number;
  };
  visibility?: {
    commission: number;
    acquiring: number;
  };
  profit: {
    gross: number;
    operating: number;
    operatingMarginPct: number;
  };
  profitabilityStatus: ProfitabilityStatus;
  missingCogs: boolean;
}

export interface SkuFinancialsResponse {
  meta: {
    week: string;
    cabinetId: number;
    generatedAt: string;
  };
  data: SkuFinancialItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

---

## React Hook Example

```typescript
// src/hooks/useSkuFinancials.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SkuFinancialsQuery, SkuFinancialsResponse } from '@/types/sku-financials';

export function useSkuFinancials(params: SkuFinancialsQuery) {
  return useQuery<SkuFinancialsResponse>({
    queryKey: ['sku-financials', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('week', params.week);

      if (params.nm_ids) searchParams.set('nm_ids', params.nm_ids);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.order) searchParams.set('order', params.order);
      if (params.includeVisibility !== undefined) {
        searchParams.set('includeVisibility', String(params.includeVisibility));
      }
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.offset) searchParams.set('offset', String(params.offset));

      const response = await api.get(`/v1/analytics/sku-financials?${searchParams}`);
      return response.data;
    },
    enabled: !!params.week,
    staleTime: 30 * 60 * 1000, // 30 min (matches backend cache TTL)
  });
}
```

---

## UI Component Example

```tsx
// src/components/custom/SkuFinancialsTable.tsx

import { useSkuFinancials } from '@/hooks/useSkuFinancials';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent } from '@/lib/utils';

const PROFITABILITY_COLORS: Record<string, string> = {
  excellent: 'bg-green-500',
  good: 'bg-lime-500',
  warning: 'bg-yellow-500',
  critical: 'bg-orange-500',
  loss: 'bg-red-500',
  unknown: 'bg-gray-400',
};

export function SkuFinancialsTable({ week }: { week: string }) {
  const { data, isLoading, error } = useSkuFinancials({
    week,
    sortBy: 'operatingProfit',
    order: 'desc',
    limit: 50,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Выручка</th>
          <th>COGS</th>
          <th>Логистика</th>
          <th>Хранение</th>
          <th>Опер. прибыль</th>
          <th>Маржа %</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        {data.data.map((item) => (
          <tr key={item.nmId}>
            <td>
              <div className="font-medium">{item.productName}</div>
              <div className="text-sm text-muted-foreground">{item.nmId}</div>
            </td>
            <td>{formatCurrency(item.revenue.net)}</td>
            <td>
              {item.missingCogs ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                formatCurrency(item.costs.cogs)
              )}
            </td>
            <td>{formatCurrency(item.costs.logistics)}</td>
            <td>{formatCurrency(item.costs.storage)}</td>
            <td className={item.profit.operating < 0 ? 'text-red-500' : ''}>
              {formatCurrency(item.profit.operating)}
            </td>
            <td>{formatPercent(item.profit.operatingMarginPct)}</td>
            <td>
              <Badge className={PROFITABILITY_COLORS[item.profitabilityStatus]}>
                {item.profitabilityStatus}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Caching

- **TTL**: 30 minutes (Redis)
- **Key pattern**: `sku-financials:{cabinetId}:{week}:*`
- **Fail-open**: При ошибке Redis данные возвращаются напрямую из БД

### Cache Invalidation Events

Кэш автоматически инвалидируется при:
- `import.completed` — новые данные импорта
- `cogs.assigned` / `cogs.updated` / `cogs.deleted` — изменения COGS
- `paid-storage.imported` — новые данные о хранении

---

## Отличие от существующих endpoints

| Endpoint | Storage Source | Commission/Acquiring | Use Case |
|----------|---------------|---------------------|----------|
| `/weekly/by-sku` (Epic 30) | `paid_storage_daily` | В расходах (net_profit) | Quick overview |
| **`/sku-financials` (Epic 31)** | `paid_storage_daily` | **Visibility only** | **Full P&L analysis** |
| `/unit-economics` (Epic 27) | `weekly_margin_fact` | В расходах (costs_pct) | Cost breakdown % |

**Epic 31 (`/sku-financials`)** — рекомендуемый endpoint для детального финансового анализа по SKU.

---

## Documentation

- **Epic**: `docs/epics/epic-31-complete-per-sku-financial-analytics.md`
- **Stories**: `docs/stories/epic-31/`
- **API Reference**: `docs/API-PATHS-REFERENCE.md#sku-financials-epic-31`
- **Test API**: `test-api/06-analytics-advanced.http` (секция SKU FINANCIALS)
- **Unit Tests**: `src/analytics/services/__tests__/sku-financials.service.spec.ts` (26 tests)

---

## Checklist для Frontend

- [ ] Добавить TypeScript types (`SkuFinancialsResponse`, `SkuFinancialItem`)
- [ ] Создать `useSkuFinancials` hook
- [ ] Создать компонент `SkuFinancialsTable`
- [ ] Добавить цветовую схему для `profitabilityStatus`
- [ ] Добавить tooltip с visibility (commission, acquiring) breakdown
- [ ] Обработать `missingCogs: true` (показать "—" вместо COGS)
- [ ] Добавить сортировку колонок
- [ ] Добавить пагинацию
- [ ] Интегрировать в страницу аналитики

---

**Backend Contact**: @backend-team
**Related Request**: #64 (Per-SKU Margin Missing Expense Components)
**Epic**: 31 - Complete Per-SKU Financial Analytics
**Status**: ✅ COMPLETE (2025-12-18)
