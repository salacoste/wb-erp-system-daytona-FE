# Request #62: Storage Data - Two Sources Comparison Guide

**Date**: 2025-12-16
**Priority**: 📚 **DOCUMENTATION**
**Status**: ✅ **COMPLETE**
**Component**: Frontend Integration Guide

---

## Overview

В системе есть **два источника данных** о стоимости хранения:

| Источник | Таблица | Гранулярность | Назначение |
|----------|---------|---------------|------------|
| **Storage API** | `paid_storage_daily` | По SKU, по дню | Детальная аналитика по артикулам |
| **Weekly Reports** | `weekly_payout_summary` | По неделе (total) | Финансовая сводка для payout_total |

**Ключевой вывод**: Оба источника показывают **одинаковые суммы** при корректном импорте (~100% match).

---

## Data Comparison Results (2025-12-16)

| Неделя | Weekly Report (₽) | Storage API (₽) | Match % |
|--------|-------------------|-----------------|---------|
| W49 | 1,923.34 | 1,923.38 | **100.00%** ✅ |
| W48 | 1,849.95 | 1,850.21 | **100.01%** ✅ |
| W47 | 1,763.35 | 1,763.75 | **100.02%** ✅ |
| W46 | 1,849.69 | 1,849.85 | **100.01%** ✅ |

---

## Source 1: Storage API (Detailed per-SKU)

### Когда использовать
- Анализ затрат на хранение **по каждому товару**
- Топ товаров по стоимости хранения
- Тренды расходов по неделям для конкретного SKU
- Оптимизация ассортимента

### API Endpoints

#### 1. Хранение по SKU
```http
GET /v1/analytics/storage/by-sku?weekStart=2025-W46&weekEnd=2025-W49
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

**Response**:
```json
{
  "period": {
    "from": "2025-W46",
    "to": "2025-W49",
    "days_count": 28
  },
  "data": [
    {
      "nm_id": "12345678",
      "vendor_code": "SHIRT-001",
      "product_name": "Футболка хлопок",
      "brand": "MyBrand",
      "storage_cost_total": 450.00,
      "storage_cost_avg_daily": 16.07,
      "volume_avg": 0.5,
      "warehouses": ["Коледино", "Казань"],
      "days_stored": 28
    }
  ],
  "summary": {
    "total_storage_cost": 7260.62,
    "products_count": 150,
    "avg_cost_per_product": 48.40
  }
}
```

#### 2. Топ потребителей хранения
```http
GET /v1/analytics/storage/top-consumers?weekStart=2025-W49&weekEnd=2025-W49&limit=10&include_revenue=true
```

**Response**:
```json
{
  "period": { "from": "2025-W49", "to": "2025-W49" },
  "top_consumers": [
    {
      "rank": 1,
      "nm_id": "87654321",
      "vendor_code": "COAT-XL-001",
      "storage_cost": 150.00,
      "percent_of_total": 7.8,
      "revenue_net": 15000.00,
      "storage_to_revenue_ratio": 1.0
    }
  ],
  "total_storage_cost": 1923.38
}
```

#### 3. Тренды хранения
```http
GET /v1/analytics/storage/trends?weekStart=2025-W46&weekEnd=2025-W49
```

**Response**:
```json
{
  "period": { "from": "2025-W46", "to": "2025-W49" },
  "data": [
    { "week": "2025-W46", "storage_cost": 1849.85 },
    { "week": "2025-W47", "storage_cost": 1763.75 },
    { "week": "2025-W48", "storage_cost": 1850.21 },
    { "week": "2025-W49", "storage_cost": 1923.38 }
  ],
  "summary": {
    "storage_cost": {
      "min": 1763.75,
      "max": 1923.38,
      "avg": 1846.80,
      "trend": 3.97
    }
  }
}
```

#### 4. Хранение в списке товаров
```http
GET /v1/products?include_storage=true&limit=25
```

**Response** (поля storage):
```json
{
  "products": [
    {
      "nm_id": "12345678",
      "sa_name": "Футболка",
      "storage_cost_daily_avg": 12.50,
      "storage_cost_weekly": 87.50,
      "storage_period": "2025-W49"
    }
  ]
}
```

---

## Source 2: Weekly Reports (Financial Summary)

### Когда использовать
- Финансовая сводка за неделю
- Расчёт `payout_total` (к перечислению)
- Сверка с WB Dashboard
- Общие расходы без детализации по SKU

### API Endpoints

#### 1. Недельная финансовая сводка
```http
GET /v1/analytics/weekly?week=2025-W49
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

**Response**:
```json
{
  "week": "2025-W49",
  "summary": {
    "to_pay_goods": 135186.71,
    "logistics_cost": 26139.82,
    "storage_cost": 1923.34,
    "paid_acceptance_cost": 0,
    "penalties_total": 0,
    "other_adjustments_net": 51063.00,
    "wb_commission_adj": 2153.28,
    "payout_total": 53907.27
  }
}
```

#### 2. Список доступных недель
```http
GET /v1/analytics/weekly/available-weeks
```

**Response**:
```json
{
  "weeks": [
    { "week": "2025-W49", "has_data": true },
    { "week": "2025-W48", "has_data": true },
    { "week": "2025-W47", "has_data": true }
  ]
}
```

#### 3. Тренд хранения из Weekly Reports
```http
GET /v1/analytics/weekly/payout-total?weekStart=2025-W46&weekEnd=2025-W49
```

**Response** (поле storage_cost в каждой неделе):
```json
{
  "data": [
    { "week": "2025-W46", "storage_cost": 1849.69, "payout_total": 45000 },
    { "week": "2025-W47", "storage_cost": 1763.35, "payout_total": 52000 },
    { "week": "2025-W48", "storage_cost": 1849.95, "payout_total": 48000 },
    { "week": "2025-W49", "storage_cost": 1923.34, "payout_total": 53907.27 }
  ]
}
```

---

## Comparison: When to Use Which Source

| Use Case | Recommended Source | Why |
|----------|-------------------|-----|
| **Общие расходы на хранение за неделю** | Weekly Reports | Быстрее, уже агрегировано |
| **Расчёт payout_total** | Weekly Reports | Это официальный источник для финансов |
| **Какой SKU дороже всего хранить?** | Storage API | Есть детализация по артикулам |
| **Тренд хранения конкретного товара** | Storage API | Есть фильтр по nm_id |
| **Сверка с WB Dashboard** | Weekly Reports | Данные идентичны WB |
| **Оптимизация ассортимента** | Storage API | Нужна детализация |
| **Колонка "Хранение" в таблице товаров** | Storage API (`include_storage=true`) | Per-SKU данные |

---

## TypeScript Types

```typescript
// types/storage.ts

// === Storage API Types ===

export interface StorageBySku {
  nm_id: string;
  vendor_code: string | null;
  product_name: string | null;
  brand: string | null;
  storage_cost_total: number;
  storage_cost_avg_daily: number;
  volume_avg: number | null;
  warehouses: string[];
  days_stored: number;
}

export interface StorageBySkuResponse {
  period: {
    from: string;  // "2025-W46"
    to: string;
    days_count: number;
  };
  data: StorageBySku[];
  summary: {
    total_storage_cost: number;
    products_count: number;
    avg_cost_per_product: number;
  };
  pagination: {
    total: number;
    cursor: string | null;
    has_more: boolean;
  };
}

export interface StorageTrendPoint {
  week: string;
  storage_cost: number | null;
  volume?: number | null;
}

export interface StorageTrendsResponse {
  period: { from: string; to: string; days_count: number };
  nm_id: string | null;
  data: StorageTrendPoint[];
  summary?: {
    storage_cost: {
      min: number;
      max: number;
      avg: number;
      trend: number;  // % change
    };
  };
}

// === Weekly Reports Types ===

export interface WeeklySummary {
  week: string;
  to_pay_goods: number;
  logistics_cost: number;
  storage_cost: number;        // <-- Хранение из Weekly Reports
  paid_acceptance_cost: number;
  penalties_total: number;
  other_adjustments_net: number;
  wb_commission_adj: number;
  payout_total: number;
}

export interface WeeklyPayoutTotalResponse {
  data: Array<{
    week: string;
    storage_cost: number;
    payout_total: number;
    // ... other fields
  }>;
}

// === Product with Storage ===

export interface ProductWithStorage {
  nm_id: string;
  sa_name: string;
  brand: string | null;
  // Storage fields (from include_storage=true)
  storage_cost_daily_avg: number | null;
  storage_cost_weekly: number | null;
  storage_period: string | null;  // "2025-W49"
}
```

---

## React Hooks

```typescript
// hooks/useStorageData.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// === Storage API Hooks ===

export function useStorageBySku(weekStart: string, weekEnd: string, options?: {
  brand?: string;
  warehouse?: string;
  sort_by?: 'storage_cost' | 'volume' | 'nm_id';
  limit?: number;
}) {
  return useQuery({
    queryKey: ['storage-by-sku', weekStart, weekEnd, options],
    queryFn: () => api.get<StorageBySkuResponse>('/v1/analytics/storage/by-sku', {
      params: { weekStart, weekEnd, ...options }
    }),
    enabled: !!weekStart && !!weekEnd,
  });
}

export function useStorageTrends(weekStart: string, weekEnd: string, nmId?: string) {
  return useQuery({
    queryKey: ['storage-trends', weekStart, weekEnd, nmId],
    queryFn: () => api.get<StorageTrendsResponse>('/v1/analytics/storage/trends', {
      params: { weekStart, weekEnd, nm_id: nmId }
    }),
  });
}

export function useStorageTopConsumers(weekStart: string, weekEnd: string, limit = 10) {
  return useQuery({
    queryKey: ['storage-top-consumers', weekStart, weekEnd, limit],
    queryFn: () => api.get('/v1/analytics/storage/top-consumers', {
      params: { weekStart, weekEnd, limit, include_revenue: true }
    }),
  });
}

// === Weekly Reports Hooks ===

export function useWeeklySummary(week: string) {
  return useQuery({
    queryKey: ['weekly-summary', week],
    queryFn: () => api.get<WeeklySummary>(`/v1/analytics/weekly`, {
      params: { week }
    }),
    enabled: !!week,
  });
}

export function useWeeklyStorageTrend(weekStart: string, weekEnd: string) {
  return useQuery({
    queryKey: ['weekly-payout-total', weekStart, weekEnd],
    queryFn: () => api.get<WeeklyPayoutTotalResponse>('/v1/analytics/weekly/payout-total', {
      params: { weekStart, weekEnd }
    }),
  });
}
```

---

## UI Integration Examples

### 1. Dashboard Card - Total Storage Cost

```tsx
// Используем Weekly Reports для общей суммы
function StorageCostCard({ week }: { week: string }) {
  const { data } = useWeeklySummary(week);

  return (
    <Card>
      <CardHeader>Расходы на хранение</CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {data?.storage_cost.toLocaleString('ru-RU')} ₽
        </div>
        <div className="text-sm text-muted-foreground">
          за неделю {week}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. Top Storage Consumers Table

```tsx
// Используем Storage API для детализации по SKU
function TopStorageConsumers({ weekStart, weekEnd }: Props) {
  const { data } = useStorageTopConsumers(weekStart, weekEnd, 5);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Товар</TableHead>
          <TableHead>Хранение</TableHead>
          <TableHead>% от общих</TableHead>
          <TableHead>Хран/Выручка</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.top_consumers.map(item => (
          <TableRow key={item.nm_id}>
            <TableCell>{item.rank}</TableCell>
            <TableCell>{item.vendor_code || item.nm_id}</TableCell>
            <TableCell>{item.storage_cost.toFixed(2)} ₽</TableCell>
            <TableCell>{item.percent_of_total.toFixed(1)}%</TableCell>
            <TableCell>
              {item.storage_to_revenue_ratio?.toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 3. Storage Trend Chart

```tsx
// Используем Storage API для трендов (или Weekly Reports)
function StorageTrendChart({ weekStart, weekEnd }: Props) {
  const { data } = useStorageTrends(weekStart, weekEnd);

  return (
    <LineChart data={data?.data}>
      <XAxis dataKey="week" />
      <YAxis />
      <Line
        dataKey="storage_cost"
        name="Хранение, ₽"
        stroke="#8884d8"
      />
      <Tooltip formatter={(v) => `${v.toLocaleString('ru-RU')} ₽`} />
    </LineChart>
  );
}
```

### 4. Product Table with Storage Column

```tsx
// Используем include_storage=true в products API
function ProductsTable() {
  const { data } = useQuery({
    queryKey: ['products-with-storage'],
    queryFn: () => api.get('/v1/products', {
      params: { include_storage: true, limit: 25 }
    }),
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Артикул</TableHead>
          <TableHead>Название</TableHead>
          <TableHead>Хранение/день</TableHead>
          <TableHead>Хранение/нед</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.products.map(p => (
          <TableRow key={p.nm_id}>
            <TableCell>{p.nm_id}</TableCell>
            <TableCell>{p.sa_name}</TableCell>
            <TableCell>
              {p.storage_cost_daily_avg
                ? `${p.storage_cost_daily_avg.toFixed(2)} ₽`
                : '—'}
            </TableCell>
            <TableCell>
              {p.storage_cost_weekly
                ? `${p.storage_cost_weekly.toFixed(2)} ₽`
                : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Data Availability

### Storage API (paid_storage_daily)
- **Доступные недели**: W46-W50 (на 2025-12-16)
- **Ограничение WB API**: Данные доступны только за ~2-3 последние недели
- **Автоимпорт**: Каждый день в 06:00 MSK (smart import)

### Weekly Reports (weekly_payout_summary)
- **Доступные недели**: W36-W49+ (полная история)
- **Источник**: Excel-отчёты WB или WB SDK
- **Автоимпорт**: По вторникам в 08:00 MSK

---

## Formula: payout_total (Reference)

```
payout_total = to_pay_goods
             - logistics_cost
             - storage_cost        ← Из Weekly Reports
             - paid_acceptance_cost
             - penalties_total
             - other_adjustments_net
             - wb_commission_adj
```

**Важно**: Для расчёта `payout_total` используйте `storage_cost` из **Weekly Reports** (weekly_payout_summary), так как это официальный источник, совпадающий с WB Dashboard.

---

## Related Documentation

- **Storage API Full Guide**: [36-epic-24-paid-storage-analytics-api.md](./36-epic-24-paid-storage-analytics-api.md)
- **Import Methods**: [51-paid-storage-import-methods.md](./51-paid-storage-import-methods.md)
- **WB Dashboard Metrics**: [docs/WB-DASHBOARD-METRICS.md](../../../docs/WB-DASHBOARD-METRICS.md)
- **Payout Formula**: [49-payout-total-formula-bug.md](./49-payout-total-formula-bug.md)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-16 | Backend Team | Initial documentation |
| 2025-12-16 | Backend Team | Added W46-W49 comparison results (100% match) |

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-12-16
- **Summary**: Storage data sources compared across Paid Storage API (`paid_storage_daily`) and Weekly Reports (`weekly_payout_summary`). W46-W49 comparison shows 100% match for total storage costs. For `payout_total` calculation, use `storage_cost` from Weekly Reports as the official source matching WB Dashboard. Per-SKU breakdown uses Paid Storage API data.
- **Remaining frontend action**: Use weekly reports for total storage display, Paid Storage API for per-SKU breakdown and trends.
