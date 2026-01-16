# Request #40: Epic 6-FE Deferred Items - Backend Response

**Date**: 2025-12-05
**Priority**: 🟢 Low - Documentation/Clarification
**Status**: ✅ **RESOLVED** - All features already supported by backend
**Component**: Backend API - Analytics Module
**Related**: Epic 6-FE QA Review, Stories 6.1-FE through 6.5-FE

---

## Executive Summary

В результате QA Review Epic 6-FE были выявлены deferred items, которые якобы требуют доработки backend.

**Хорошая новость**: ✅ **Backend уже полностью поддерживает все необходимые поля!**

| Deferred Item | Backend Status | Frontend Action |
|---------------|----------------|-----------------|
| DEFER-001: `weeks_with_sales` display | ✅ **Already supported** | Use existing fields |
| DEFER-002: Summary row in comparison | ❌ Frontend-only | Table refactoring |
| DEFER-003: TopTables unit tests | ❌ Frontend-only | Add tests |

---

## DEFER-001: `weeks_with_sales` / `weeks_with_cogs` Display

### ✅ Backend Status: ALREADY IMPLEMENTED

Поля `weeks_with_sales` и `weeks_with_cogs` **уже возвращаются** во всех analytics endpoints при использовании date range (`weekStart`/`weekEnd`).

### API Response Fields

Все три analytics endpoints включают эти поля когда используется date range:

#### GET /v1/analytics/weekly/by-sku

```typescript
// Response item when weekStart/weekEnd are provided
interface SkuAnalyticsItem {
  nm_id: string
  sa_name: string
  revenue_net: number
  qty: number
  profit: number
  margin_pct: number
  // ...

  // ✅ Date range specific fields (NEW - already available!)
  weeks_with_sales?: number   // Count of weeks with qty > 0
  weeks_with_cogs?: number    // Count of weeks with COGS assigned
}
```

#### GET /v1/analytics/weekly/by-brand

```typescript
interface BrandAnalyticsItem {
  brand: string
  revenue_net: number
  // ...

  // ✅ Already available
  weeks_with_sales?: number
  weeks_with_cogs?: number
}
```

#### GET /v1/analytics/weekly/by-category

```typescript
interface CategoryAnalyticsItem {
  category: string
  // ...

  // ✅ Already available
  weeks_with_sales?: number
  weeks_with_cogs?: number
}
```

### Example Request/Response

**Request**:
```http
GET /v1/analytics/weekly/by-sku?weekStart=2025-W44&weekEnd=2025-W47&includeCogs=true&limit=10
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

**Response**:
```json
{
  "data": [
    {
      "nm_id": "321678606",
      "sa_name": "Куртка зимняя",
      "revenue_net": 125000.00,
      "qty": 45,
      "cogs": 50000.00,
      "profit": 75000.00,
      "margin_pct": 60.0,
      "profit_per_unit": 1666.67,
      "roi": 150.0,
      "weeks_with_sales": 4,    // ← 4 из 4 недель были продажи
      "weeks_with_cogs": 4      // ← 4 из 4 недель был COGS
    },
    {
      "nm_id": "173589742",
      "sa_name": "Футболка хлопок",
      "revenue_net": 85000.00,
      "qty": 120,
      "weeks_with_sales": 3,    // ← Продажи были только 3 недели
      "weeks_with_cogs": 2      // ← COGS был назначен только 2 недели
    }
  ],
  "meta": {
    "week_range": {
      "start": "2025-W44",
      "end": "2025-W47",
      "weeks_count": 4
    }
  }
}
```

### Frontend Integration

#### 1. Update TypeScript Types

```typescript
// src/types/analytics.ts - ADD these optional fields
export interface SkuAnalyticsItem {
  nm_id: string
  sa_name: string
  revenue_net: number
  qty: number
  profit: number
  margin_pct: number
  profit_per_unit: number
  roi: number

  // Date range fields (returned when weekStart/weekEnd used)
  weeks_with_sales?: number   // ← ADD
  weeks_with_cogs?: number    // ← ADD
}

// Same for BrandAnalyticsItem and CategoryAnalyticsItem
```

#### 2. Display in Tables

**Option A: New Column**
```tsx
// Add column to MarginBySkuTable.tsx
{
  header: 'Недели',
  accessorKey: 'weeks_with_sales',
  cell: ({ row }) => {
    const weeksWithSales = row.original.weeks_with_sales
    const totalWeeks = meta?.week_range?.weeks_count || 1

    if (weeksWithSales === undefined) return null

    return (
      <span className="text-muted-foreground">
        {weeksWithSales}/{totalWeeks}
      </span>
    )
  }
}
```

**Option B: Tooltip on Product Name**
```tsx
// Tooltip showing weeks info
<Tooltip>
  <TooltipTrigger>{row.original.sa_name}</TooltipTrigger>
  <TooltipContent>
    Продажи: {row.original.weeks_with_sales} из {totalWeeks} недель
    {row.original.weeks_with_cogs !== undefined && (
      <br />
      COGS: {row.original.weeks_with_cogs} из {totalWeeks} недель
    )}
  </TooltipContent>
</Tooltip>
```

**Option C: Meta Info Bar**
```tsx
// Above table
<div className="text-sm text-muted-foreground mb-4">
  Период: {weekStart} — {weekEnd} ({totalWeeks} недель)
</div>
```

### When Fields Are Returned

| Scenario | `weeks_with_sales` | `weeks_with_cogs` |
|----------|-------------------|-------------------|
| Single week query (`week=2025-W47`) | ❌ Not returned | ❌ Not returned |
| Date range query (`weekStart`/`weekEnd`) | ✅ Returned | ✅ Returned |
| `includeCogs=false` | ✅ Returned | ❌ Not returned |
| `includeCogs=true` | ✅ Returned | ✅ Returned |

### SQL Implementation (Reference)

Backend уже реализует подсчёт через SQL:

```sql
SELECT
  nm_id,
  -- ... other fields
  COUNT(DISTINCT CASE WHEN quantity_sold > 0 THEN week END) as weeks_with_sales,
  COUNT(DISTINCT CASE WHEN cogs_rub > 0 THEN week END) as weeks_with_cogs
FROM weekly_margin_fact
WHERE cabinet_id = $1 AND week >= $2 AND week <= $3
GROUP BY nm_id
```

---

## DEFER-002: Summary Row in Comparison Tables

### Backend Status: ❌ Frontend-Only Task

Итоговая строка в таблицах сравнения — это **frontend refactoring task**. Backend уже возвращает все необходимые данные.

**Рекомендация**: Используйте `summary` поле в meta response или вычисляйте totals на клиенте:

```typescript
// Calculate totals from data array
const totals = data.reduce((acc, item) => ({
  revenue_net: acc.revenue_net + item.revenue_net,
  profit: acc.profit + item.profit,
  // ...
}), { revenue_net: 0, profit: 0 })
```

---

## DEFER-003: TopProductsTable/TopBrandsTable Tests

### Backend Status: ❌ Frontend-Only Task

Unit tests для table components — это frontend testing task. Backend API не требует изменений.

---

## Summary

| Item | Status | Action Required |
|------|--------|-----------------|
| `weeks_with_sales` | ✅ **DONE** | Frontend: use existing fields |
| `weeks_with_cogs` | ✅ **DONE** | Frontend: use existing fields |
| Summary row | ❌ N/A | Frontend: table refactoring |
| TopTables tests | ❌ N/A | Frontend: add tests |

---

## Updated Task List for Frontend (Story 6.1-FE)

**Task 6.2** (was deferred, now unblocked):
```markdown
- [ ] 6.2 Display `weeks_with_sales` count in table or meta info
  - Backend: ✅ Already returns field
  - Frontend action: Add column or tooltip
```

**Task 6.3** (was deferred, now unblocked):
```markdown
- [ ] 6.3 Display `weeks_with_cogs` count where applicable
  - Backend: ✅ Already returns field when includeCogs=true
  - Frontend action: Add column or tooltip
```

---

## Backend Files Reference

**DTOs** (fields already defined):
- `src/analytics/dto/response/sku-analytics.dto.ts:149-156`
- `src/analytics/dto/response/brand-analytics.dto.ts:128-135`
- `src/analytics/dto/response/category-analytics.dto.ts:121-128`

**Service** (fields already calculated):
- `src/analytics/weekly-analytics.service.ts:1747-1749` (SQL query)
- `src/analytics/weekly-analytics.service.ts:1784-1785` (mapping)

**Tests** (fields verified):
- `src/analytics/weekly-analytics.service.spec.ts:1049-1076`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-05 | Backend Team (James) | Clarified that `weeks_with_sales`/`weeks_with_cogs` are already supported |

---

**Status**: ✅ **RESOLVED** - No backend changes needed, all fields already available
