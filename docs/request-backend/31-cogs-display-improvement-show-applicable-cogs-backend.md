# Backend Request #31: Add `applicable_cogs` Field to Products API

**Date**: 2025-11-28
**Type**: 🔧 **BACKEND IMPLEMENTATION REQUEST**
**Priority**: 🟡 Medium - UX Improvement
**Requested By**: Frontend Team
**Component**: Backend API - Products Module + COGS Module

---

## Backend Team Response
**Status**: RESOLVED
**Resolution**: Request to add `applicable_cogs` field to Products API showing which COGS version is actually used for the current week's margin calculation, and which COGS will take effect in future weeks. This was a frontend request for backend implementation.
**Frontend Action**: Awaiting backend implementation confirmation. See the full document for requested API changes.

Добавить поле `applicable_cogs` в ответ Products API, чтобы фронтенд мог показать:
1. Какой COGS **реально используется** для расчёта маржи текущей недели
2. С какой недели **новый COGS** (если отличается) вступит в силу

---

## Problem

Когда пользователь назначает новый COGS с датой после midpoint текущей недели:

```
Product 173589742:
  Latest COGS:     11₽ (valid_from: 2025-11-23) ← показывается в UI
  Applied COGS:    121₽ (valid_from: 2025-11-07) ← используется для W46 margin

UI показывает:
  "11,00 ₽ с 23.11.2025"
  "(COGS с будущей даты)"

Пользователь НЕ понимает:
  - Какой COGS используется для маржи
  - Когда новый COGS вступит в силу
```

---

## Requested Changes

### 1. Add `applicable_cogs` to Products Response

**Endpoint**: `GET /v1/products` and `GET /v1/products/:nmId`

**Current Response** (simplified):
```json
{
  "nm_id": "173589742",
  "cogs": {
    "unit_cost_rub": 11,
    "valid_from": "2025-11-23T00:00:00.000Z"
  },
  "current_margin_pct": null,
  "missing_data_reason": "COGS_NOT_ASSIGNED"
}
```

**Requested Response**:
```json
{
  "nm_id": "173589742",
  "cogs": {
    "unit_cost_rub": 11,
    "valid_from": "2025-11-23T00:00:00.000Z"
  },
  "applicable_cogs": {
    "unit_cost_rub": 121,
    "valid_from": "2025-11-07T00:00:00.000Z",
    "applies_to_week": "2025-W46",
    "is_same_as_current": false
  },
  "current_margin_pct": 85.5,
  "missing_data_reason": null
}
```

### 2. New Fields Description

| Field | Type | Description |
|-------|------|-------------|
| `applicable_cogs` | object \| null | COGS record used for last completed week margin |
| `applicable_cogs.unit_cost_rub` | number | COGS value used for margin calculation |
| `applicable_cogs.valid_from` | string (ISO date) | When this COGS became effective |
| `applicable_cogs.applies_to_week` | string (ISO week) | Which week this COGS applies to (last completed) |
| `applicable_cogs.is_same_as_current` | boolean | `true` if same as `cogs`, `false` if different |

### 3. Logic for `applicable_cogs`

```typescript
// ProductsService.getMarginDataForProducts() or new helper

async function getApplicableCogs(nmId: string, week: string): Promise<ApplicableCogs | null> {
  const midpoint = getWeekMidpointDate(week); // Thursday of the week

  const applicableCogs = await prisma.cogs.findFirst({
    where: {
      nmId,
      validFrom: { lte: midpoint }
    },
    orderBy: { validFrom: 'desc' }
  });

  if (!applicableCogs) return null;

  return {
    unit_cost_rub: applicableCogs.unitCostRub,
    valid_from: applicableCogs.validFrom,
    applies_to_week: week,
    is_same_as_current: /* compare with latest COGS */
  };
}
```

---

## Use Cases

### Case 1: Latest COGS = Applicable COGS
```json
{
  "cogs": { "unit_cost_rub": 100, "valid_from": "2025-11-01" },
  "applicable_cogs": {
    "unit_cost_rub": 100,
    "valid_from": "2025-11-01",
    "applies_to_week": "2025-W46",
    "is_same_as_current": true
  }
}
```
**Frontend**: Shows only "100₽ с 01.11.2025" (no additional info needed)

### Case 2: Latest COGS ≠ Applicable COGS (Future COGS)
```json
{
  "cogs": { "unit_cost_rub": 11, "valid_from": "2025-11-23" },
  "applicable_cogs": {
    "unit_cost_rub": 121,
    "valid_from": "2025-11-07",
    "applies_to_week": "2025-W46",
    "is_same_as_current": false
  }
}
```
**Frontend**: Shows:
- "11₽ с 23.11.2025"
- "ⓘ Для W46 используется: 121₽"
- "ⓘ Новый COGS применится с W48"

### Case 3: No Applicable COGS (First COGS is Future)
```json
{
  "cogs": { "unit_cost_rub": 777, "valid_from": "2025-11-23" },
  "applicable_cogs": null
}
```
**Frontend**: Shows:
- "777₽ с 23.11.2025"
- "(COGS с будущей даты)"
- "ⓘ Нет предыдущих COGS для расчёта маржи"

### Case 4: No COGS at All
```json
{
  "cogs": null,
  "applicable_cogs": null
}
```
**Frontend**: Shows "Не назначена"

---

## Performance Considerations

1. **Query Optimization**: Use existing `findCogsAtDate` method from `CogsService`
2. **Batch Loading**: For product list, batch lookup applicable COGS for all products
3. **Caching**: Consider caching applicable COGS per (nmId, week) since week is fixed

**Estimated Impact**: +1 DB query per product (can be batched)

---

## Files to Modify

### Backend
1. `src/products/dto/product-response.dto.ts` - Add `applicable_cogs` field
2. `src/products/products.service.ts` - Add `getApplicableCogs()` logic in `getMarginDataForProducts()`
3. `src/cogs/services/cogs.service.ts` - Ensure `findCogsAtDate()` is reusable

### Frontend (after backend implementation)
1. `src/components/custom/ProductMarginCell.tsx` - Display applicable COGS info
2. `src/types/api.ts` - Add `applicable_cogs` type

---

## Acceptance Criteria

- [ ] `GET /v1/products` returns `applicable_cogs` for each product
- [ ] `GET /v1/products/:nmId` returns `applicable_cogs` for single product
- [ ] `applicable_cogs` correctly uses week midpoint strategy (Thursday)
- [ ] `is_same_as_current` accurately reflects COGS comparison
- [ ] `applicable_cogs: null` when no COGS applies to last completed week
- [ ] Performance: < 50ms additional latency for product list (50 products)

---

## Related Documentation

- [CLAUDE.md: COGS Temporal Lookup - Week Midpoint Strategy](../../../CLAUDE.md)
- [Guide #29: COGS Temporal Versioning](./29-cogs-temporal-versioning-and-margin-calculation.md)
- [Code: `src/cogs/services/cogs.service.ts:findCogsAtDate()`](../../../src/cogs/services/cogs.service.ts)
- [Code: `src/analytics/services/margin-calculation.service.ts:lookupCogs()`](../../../src/analytics/services/margin-calculation.service.ts)

---

## Timeline

**Estimated Effort**: 4-6 hours
- Backend DTO + Service: 2-3 hours
- Testing: 1-2 hours
- Frontend integration: 1-2 hours

---

**Status**: ✅ **IMPLEMENTED** (2025-11-28)
**Assigned To**: Backend Team

## Implementation Summary

### Files Modified
- `src/products/dto/product-response.dto.ts` - Added `ApplicableCogsDto` class and `applicable_cogs` field to `ProductResponseDto`
- `src/products/products.service.ts` - Added `getApplicableCogsForProducts()` method and integrated into `getProductsList()` and `getProduct()`

### Key Implementation Details
1. **Week Midpoint Strategy**: Uses `isoWeekService.getLastCompletedWeek()` and calculates midpoint (Thursday ~12:00)
2. **Temporal Lookup**: Uses existing `cogsService.findCogsAtDate(nmId, midpoint)` for COGS lookup
3. **Comparison Logic**: Compares applicable COGS with current COGS by `id` field to set `is_same_as_current`
4. **Performance**: O(n) queries for n products (could be optimized with batch query if needed)

### API Test Examples
See `test-api/08-products.http` for testing different COGS Assignment scenarios
