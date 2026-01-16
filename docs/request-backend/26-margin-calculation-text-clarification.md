# Request #26: Frontend Text Clarification - Margin Calculation Week Lookback

**Date**: 2025-11-26
**Priority**: ✅ **RESOLVED** (Was: Low - UI Text Correction)
**Status**: ✅ **COMPLETED** - Frontend Text Updated
**Component**: Frontend UI - COGS Assignment Form Text

---

## Issue

Frontend displays the following text in COGS assignment form:

> "После назначения себестоимости маржа будет рассчитана автоматически на основе данных продаж за последнюю неделю. **Если продаж не было, будут проанализированы последние 4 недели.**"

This statement is **partially misleading** about the actual backend behavior.

---

## Backend Behavior Analysis

### What Actually Happens:

#### 1. Week Selection (4-Week Fallback for Data Availability)

**Code**: `src/products/products.service.ts:421-457`

```typescript
// Build fallback weeks list (completed-week, -1, -2, -3)
const fallbackWeeks: string[] = [targetWeek];
for (let i = 1; i <= 3; i++) {
  const fallbackDate = new Date(targetWeekBounds.start);
  fallbackDate.setDate(fallbackDate.getDate() - 7 * i);
  fallbackWeeks.push(this.isoWeekService.getIsoWeek(fallbackDate));
}

// Try each week in sequence until we get data
for (const week of fallbackWeeks) {
  const data = await this.weeklyAnalyticsService.getWeeklyBySku(...);
  if (data && data.data && data.data.length > 0) {
    analyticsData = data;
    usedWeek = week;
    break; // ← Uses this week for ALL products
  }
}
```

**Purpose**: This 4-week fallback is for **WB API data availability timing**, NOT for per-product sales lookup.

**When Triggered**:
- Monday/Tuesday when WB hasn't published data yet for the last completed week
- WB typically publishes weekly data on Tuesday ~10:00 MSK

**How It Works**:
- Tries week W, then W-1, W-2, W-3 in sequence
- **Once ANY week has data → uses that week for ALL products**
- This is NOT "if product X has no sales, look back for product X"

#### 2. Per-Product Sales Status

After week selection, each product is evaluated **within that single week**:

| `missing_data_reason` | Meaning | When Set |
|----------------------|---------|----------|
| `null` | Margin available or being calculated | Product has sales + COGS |
| `"NO_SALES_IN_PERIOD"` | No sales in selected week | Product in analytics but 0 units sold |
| `"COGS_NOT_ASSIGNED"` | Sales exist but no COGS | Product has sales but `has_cogs=false` |
| `"NO_SALES_DATA"` | Never had sales | Product not in analytics response |

#### 3. Historical Context (Story 23.9 - 12-Week Lookback)

**Code**: `src/products/products.service.ts:232-275`

For products with `missing_data_reason === "NO_SALES_DATA"`, system provides **12-week** historical context:

| Field | Description |
|-------|-------------|
| `last_sales_week` | Last ISO week when product had sales (up to 12 weeks back) |
| `last_sales_margin_pct` | Margin % from that week |
| `last_sales_qty` | Units sold in that week |
| `weeks_since_last_sale` | Number of weeks elapsed |

**Note**: This is 12 weeks, not 4 weeks.

---

## Recommended Text Corrections

### Option 1: Simplified (Recommended)

**Current**:
> "После назначения себестоимости маржа будет рассчитана автоматически на основе данных продаж за последнюю неделю. Если продаж не было, будут проанализированы последние 4 недели."

**Corrected**:
> "После назначения себестоимости маржа будет рассчитана автоматически на основе данных продаж за последнюю завершённую неделю."

### Option 2: With Historical Context Detail

**Corrected**:
> "После назначения себестоимости маржа будет рассчитана автоматически на основе данных продаж за последнюю завершённую неделю. Для товаров без продаж в этот период будет показан исторический контекст за последние 12 недель."

### Option 3: Technical (For Advanced Users)

**Corrected**:
> "Маржа рассчитывается на основе продаж за последнюю ISO-неделю (Пн-Вс, Europe/Moscow). Для товаров без текущих продаж доступен исторический анализ до 12 недель назад."

---

## Visual Summary

```
Frontend Statement:
"4 недели lookback для товаров без продаж"
         ↓
Actual Behavior:
┌─────────────────────────────────────────────────────────────┐
│ 1. Week Selection (4-week fallback for WB API availability) │
│    [W-0] → no data? → [W-1] → no data? → [W-2] → [W-3]     │
│    Once ANY week has data → use for ALL products            │
├─────────────────────────────────────────────────────────────┤
│ 2. Per-Product Status (within selected week)                │
│    • Has sales + COGS → margin calculated                   │
│    • Has sales, no COGS → "COGS_NOT_ASSIGNED"              │
│    • No sales → "NO_SALES_IN_PERIOD" or "NO_SALES_DATA"    │
├─────────────────────────────────────────────────────────────┤
│ 3. Historical Context (Story 23.9 - 12 weeks)              │
│    Only for "NO_SALES_DATA" products:                       │
│    last_sales_week, last_sales_margin_pct, etc.            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Resolution

**Frontend text updated** in two files:

### 1. `frontend/src/app/(dashboard)/cogs/page.tsx` (Alert Banner)
```tsx
<AlertDescription>
  После назначения себестоимости маржа будет рассчитана автоматически на основе
  данных продаж за последнюю завершённую неделю. Для товаров без продаж в этот
  период будет показан исторический контекст за последние 12 недель.
</AlertDescription>
```

### 2. `frontend/src/components/custom/SingleCogsForm.tsx` (Tip Text)
```tsx
'После назначения себестоимости маржа будет рассчитана автоматически на основе данных продаж за последнюю завершённую неделю.'
```

**No Backend Changes Required** - this was a frontend text correction only.

---

## Related Documentation

- **Epic 19**: Completed weeks logic - `docs/stories/epic-19/EPIC-19-OVERVIEW.md`
- **Epic 20**: Automatic margin recalculation - `docs/stories/epic-20/EPIC-20-OVERVIEW.md`
- **Story 23.9**: Historical margin context - `docs/stories/epic-23/story-23.9-historical-margin-context-in-products.md`
- **Request #16**: COGS & margin data structure - `frontend/docs/request-backend/16-cogs-history-and-margin-data-structure.md`
- **Request #18**: Missing margin scenarios - `frontend/docs/request-backend/18-missing-margin-and-missing-data-reason-scenarios-backend.md`

---

**Document Version**: 1.1
**Status**: ✅ Completed
**Resolved**: 2025-11-26
**Changes**: Frontend text updated in cogs/page.tsx and SingleCogsForm.tsx
