# Request #31: COGS Display Improvement - Show Applicable COGS for Current Week

**Date**: 2025-11-28
**Type**: 🎨 **UX IMPROVEMENT**
**Priority**: Medium
**Component**: Backend API + Frontend Display

---

## Problem Statement

Когда пользователь назначает новый COGS с датой после midpoint текущей недели:

1. UI показывает **только последний COGS** (например, 11₽ с 23.11.2025)
2. Сообщение "COGS с будущей даты" не объясняет какой COGS **реально применяется**
3. Пользователь не понимает какой COGS использован для расчёта маржи текущей недели

### Пример проблемы

**Product 173589742:**
```
COGS история:
  2025-01-01: 110₽
  2025-11-07: 121₽  ← применяется для W46/W47
  2025-11-23: 11₽   ← показывается в UI, но ещё не применяется

UI показывает:
  Себестоимость: 11,00 ₽ с 23.11.2025
  Маржа: (COGS с будущей даты)  ← непонятно

Должно показывать:
  Себестоимость: 11,00 ₽ с 23.11.2025
  ⓘ Для W46 используется: 121₽ (с 07.11.2025)
  ⓘ Новый COGS (11₽) применится с W48
```

---

## Proposed Solution

### Backend Changes

**Option A: Add `applicable_cogs` field to Products API**

```typescript
// GET /v1/products response
{
  "nm_id": "173589742",
  "cogs": {
    "unit_cost_rub": 11,           // Latest COGS
    "valid_from": "2025-11-23"
  },
  "applicable_cogs": {              // NEW: COGS for last completed week
    "unit_cost_rub": 121,
    "valid_from": "2025-11-07",
    "applies_to_week": "2025-W46"
  },
  "margin_pct": 85.5,               // Calculated using applicable_cogs
  "missing_data_reason": null
}
```

**Option B: Add `cogs_history` with `is_applicable` flag**

```typescript
// GET /v1/products/:nmId response (detailed view)
{
  "cogs_history": [
    { "unit_cost_rub": 11, "valid_from": "2025-11-23", "is_applicable": false, "applies_from_week": "2025-W48" },
    { "unit_cost_rub": 121, "valid_from": "2025-11-07", "is_applicable": true, "applies_to_week": "2025-W46" }
  ]
}
```

### Frontend Changes

**ProductList / COGSPage:**

```tsx
// Current:
<span>11,00 ₽ с 23.11.2025</span>
<span className="text-gray-400">(COGS с будущей даты)</span>

// Improved:
<span>11,00 ₽ с 23.11.2025</span>
<div className="text-xs text-blue-600">
  ⓘ Для W46 используется: 121₽
</div>
<div className="text-xs text-gray-400">
  Новый COGS (11₽) применится с W48
</div>
```

---

## Implementation Notes

### Week Midpoint Strategy (Reference)

```typescript
// COGS lookup uses week midpoint (Thursday)
// See: src/analytics/services/margin-calculation.service.ts:244-249

const midpoint = new Date((weekStart.getTime() + weekEnd.getTime()) / 2);
const cogs = await cogsService.findCogsAtDate(nmId, midpoint);
```

### COGS Applicability Logic

```typescript
function getApplicableCogs(nmId: string, week: string): CogsRecord | null {
  const midpoint = getWeekMidpointDate(week);
  return prisma.cogs.findFirst({
    where: {
      nmId,
      validFrom: { lte: midpoint }
    },
    orderBy: { validFrom: 'desc' }
  });
}
```

---

## Acceptance Criteria

1. ✅ Backend returns both `cogs` (latest) and `applicable_cogs` (for current week)
2. ✅ Frontend shows which COGS is used for margin calculation
3. ✅ Clear indication when displayed COGS differs from applicable COGS
4. ✅ Tooltip/info explaining the midpoint rule

---

## Related Documentation

- [CLAUDE.md: COGS Temporal Lookup - Week Midpoint Strategy](../../../CLAUDE.md)
- [Guide #29: COGS Temporal Versioning](./29-cogs-temporal-versioning-and-margin-calculation.md)
- [Guide #30: SKU Analytics Data Architecture](./30-sku-analytics-data-architecture.md)

---

**Status**: 📋 PROPOSED
**Estimated Effort**: 4-6 hours (backend + frontend)
