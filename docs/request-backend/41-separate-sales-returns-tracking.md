# Request #41: Separate Sales & Returns Tracking

**Date:** 2025-12-05
**Status:** ✅ COMPLETE
**Backend:** ✅ Implemented
**Frontend:** ✅ Types Updated

---

## Problem

Previously, the `sale_gross` field in finance summary API returned a **NET value** (sales minus returns), losing visibility into individual components. WB ЛК (Личный кабинет) displays sales and returns separately, but our system only had the combined NET value.

**Business Requirement:** Track sales and returns as **separate business processes**. Sales happen first, then some customers return items - these are two independent processes that need separate metrics for accurate analysis.

---

## Solution

Backend now provides dedicated fields for gross sales and returns:

### New API Fields

**In `summary_rus` and `summary_eaeu`:**

| Field | Type | Description |
|-------|------|-------------|
| `sales_gross` | `number` | Gross sales only (doc_type='sale'), positive value |
| `returns_gross` | `number` | Gross returns only (doc_type='return'), positive value |
| `sale_gross` | `number` | NET = sales_gross - returns_gross (backward compatible) |

**In `summary_total`:**

| Field | Type | Description |
|-------|------|-------------|
| `sales_gross_total` | `number` | Consolidated sales (RUS + EAEU) |
| `returns_gross_total` | `number` | Consolidated returns (RUS + EAEU) |
| `sale_gross_total` | `number` | Consolidated NET (backward compatible) |

---

## API Response Example

**Endpoint:** `GET /v1/analytics/weekly/finance-summary?week=2025-W48`

```json
{
  "summary_total": {
    "week": "2025-W48",
    "sales_gross_total": 153220.48,
    "returns_gross_total": 7954.00,
    "sale_gross_total": 145266.48,
    "to_pay_goods_total": 120000.00,
    "payout_total": 95000.00
  },
  "summary_rus": {
    "week": "2025-W48",
    "report_type": "основной",
    "sales_gross": 145899.00,
    "returns_gross": 7954.00,
    "sale_gross": 137945.00
  },
  "summary_eaeu": {
    "week": "2025-W48",
    "report_type": "по выкупам",
    "sales_gross": 7321.48,
    "returns_gross": 0.00,
    "sale_gross": 7321.48
  },
  "meta": {
    "week": "2025-W48",
    "cabinet_id": "...",
    "generated_at": "2025-12-05T10:00:00Z",
    "timezone": "Europe/Moscow"
  }
}
```

---

## Formula Verification

```
sale_gross_total = sales_gross_total - returns_gross_total
```

**Example:**
- sales_gross_total: 153,220.48₽
- returns_gross_total: 7,954.00₽
- sale_gross_total: 145,266.48₽ = 153,220.48 - 7,954.00 ✓

---

## Frontend Integration

### Updated TypeScript Interface

**File:** `src/hooks/useDashboard.ts`

```typescript
export interface FinanceSummary {
  week: string

  // Request #41: Separate sales and returns tracking
  sales_gross_total?: number    // Только продажи (doc_type=sale) - from summary_total
  sales_gross?: number          // Только продажи - from summary_rus/eaeu
  returns_gross_total?: number  // Только возвраты (doc_type=return) - from summary_total
  returns_gross?: number        // Только возвраты - from summary_rus/eaeu

  // NET = sales - returns (backward compatible)
  sale_gross_total?: number     // from summary_total
  sale_gross?: number           // from summary_rus/eaeu

  // ... other existing fields
}
```

### Usage Example

```typescript
// Get finance summary
const { data } = useFinanceSummary(week)

// Access separate values
const salesGross = data?.summary_total?.sales_gross_total ?? 0
const returnsGross = data?.summary_total?.returns_gross_total ?? 0
const netSales = data?.summary_total?.sale_gross_total ?? 0

// Display
console.log(`Продажи: ${salesGross} ₽`)
console.log(`Возвраты: ${returnsGross} ₽`)
console.log(`Чистые продажи: ${netSales} ₽`)
```

---

## UI Recommendations

### Dashboard Metrics Display

Consider updating dashboard to show separate metrics:

```
┌─────────────────────────────────────────┐
│  Продажи            │  Возвраты         │
│  153,220.48 ₽       │  7,954.00 ₽       │
│  ↑ +5.2%            │  ↓ -2.1%          │
├─────────────────────┴───────────────────┤
│  Чистые продажи (NET)                   │
│  145,266.48 ₽                           │
└─────────────────────────────────────────┘
```

### Color Coding

| Metric | Value Type | Trend Up | Trend Down |
|--------|------------|----------|------------|
| Продажи | Good | 🟢 Green | 🔴 Red |
| Возвраты | Bad | 🔴 Red | 🟢 Green |
| Чистые продажи | Good | 🟢 Green | 🔴 Red |

---

## Backend Files Changed

- `prisma/schema.prisma` - New fields in WeeklyPayoutSummary and WeeklyPayoutTotal
- `prisma/migrations/20251205000000_add_separate_sales_returns_gross/migration.sql`
- `src/aggregation/weekly-payout-aggregator.service.ts` - SQL aggregation logic
- `src/analytics/dto/weekly-payout-summary.dto.ts` - DTO fields
- `src/analytics/dto/weekly-payout-total.dto.ts` - DTO fields
- `src/analytics/weekly-analytics.service.ts` - Mapping functions

---

## Related Documentation

- **Backend CHANGELOG:** `docs/CHANGELOG.md#request-41-separate-sales--returns-tracking-2025-12-05`
- **Backend Reference:** `docs/COMPLETED-EPICS-REFERENCE.md#request-41`
- **API Reference:** `docs/API-PATHS-REFERENCE.md` (Finance Summary section)
- **CLAUDE.md:** Updated Data Model section

---

## Testing Verification

Verified on all 13 weeks of data. Example Week W48:

| Field | RUS | EAEU | Total |
|-------|-----|------|-------|
| sales_gross | 145,899.00 | 7,321.48 | 153,220.48 |
| returns_gross | 7,954.00 | 0.00 | 7,954.00 |
| sale_gross (NET) | 137,945.00 | 7,321.48 | 145,266.48 |

**Formula verification:** 145,266.48 = 153,220.48 - 7,954.00 ✓

---

**Last Updated:** 2025-12-05
