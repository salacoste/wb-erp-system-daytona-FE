# Request #35: Check Applicable COGS for Margin Validity

## Date
2025-11-28

## Priority
High

## Category
Bug Fix / UX Enhancement

## Problem Description

После фикса Request #34 (проверка revenue вместо total_units), товар 173589742 стал корректно показывать исторический контекст маржи. Однако товары **270958752** и **168120815** всё ещё показывают "Последняя: — • шт • недавно".

**Ожидаемое**:
```
Последняя: W44 • 92.3% • 1 шт • 3 нед. назад
```

**Фактическое**:
```
Последняя: — • шт • недавно
```

---

## Investigation Summary

### 1. Анализ данных товаров 270958752 и 168120815

| Параметр | 270958752 | 168120815 |
|----------|-----------|-----------|
| COGS exists | ✅ YES | ✅ YES |
| COGS valid_from | 2025-11-23 | 2025-11-23 |
| W47 midpoint | 2025-11-21 | 2025-11-21 |
| COGS applicable for W47? | ❌ NO (23 > 21) | ❌ NO (23 > 21) |
| Has sales in W47? | ✅ YES | ✅ YES |
| margin_pct in DB | 100% (stale) | 100% (stale) |
| missing_data_reason | undefined | undefined |

### 2. Root Cause Identified

**File**: `src/products/products.service.ts`
**Method**: `getMarginDataForProducts()` (lines 665-689)

**Problem**: Код проверяет только **существует ли COGS** (`hasCogs = !!cogsMap[item.nm_id]`), но НЕ проверяет **применим ли COGS для целевой недели**.

```typescript
// OLD CODE (BUG):
const hasCogs = !!cogsMap[item.nm_id];  // true - COGS exists
if (!hasCogs) {
  // ... COGS_NOT_ASSIGNED
} else {
  // WRONG: Returns margin_pct=100% (stale value from DB)
  marginMap[item.nm_id] = {
    margin_pct: item.margin_pct,  // 100% - STALE!
    ...
  };
}
```

**Week Midpoint Strategy** (см. CLAUDE.md):
- W47: Mon 18.11 - Sun 24.11 → Midpoint: **Thu 21.11**
- COGS valid_from = 2025-11-23 > midpoint → **COGS НЕ применим**
- Маржа в БД рассчитана когда COGS ещё не был назначен → **100% (stale)**

---

## The Fix

### Solution: Use `applicableCogsMap` instead of just `cogsMap`

**File**: `src/products/products.service.ts`

**Changes Made**:

1. **Line 602-608**: Added `applicableCogsMap` lookup after `cogsMap`
```typescript
const cogsMap = await this.getCogsForProducts(nmIds);

// Request #35 Fix: Also check APPLICABLE COGS (uses week midpoint strategy)
const applicableCogsMap = await this.getApplicableCogsForProducts(nmIds, cogsMap);
```

2. **Lines 623-670**: Updated logic for products with `margin_pct === null`
```typescript
const hasCogs = !!cogsMap[item.nm_id];
const hasApplicableCogs = !!applicableCogsMap[item.nm_id];  // NEW

if (!hasCogs || !hasApplicableCogs) {  // UPDATED condition
  missingReason = 'COGS_NOT_ASSIGNED';
} else if (!hasSales) {
  missingReason = 'NO_SALES_DATA';
}
```

3. **Lines 673-718**: Updated logic for products with `margin_pct !== null`
```typescript
const hasCogs = !!cogsMap[item.nm_id];
const hasApplicableCogs = !!applicableCogsMap[item.nm_id];  // NEW

if (!hasCogs) {
  // No COGS at all
  marginMap[item.nm_id] = { missing_reason: 'COGS_NOT_ASSIGNED', ... };
} else if (!hasApplicableCogs) {
  // NEW: COGS exists but not applicable (future valid_from)
  marginMap[item.nm_id] = { missing_reason: 'COGS_NOT_ASSIGNED', margin_pct: null, ... };
} else {
  // COGS exists AND applicable - margin is valid
  marginMap[item.nm_id] = { margin_pct: item.margin_pct, ... };
}
```

4. **Lines 721-750**: Updated logic for products NOT in analytics
```typescript
const hasCogs = !!cogsMap[nmId];
const hasApplicableCogs = !!applicableCogsMap[nmId];  // NEW
const missingReason = hasCogs && hasApplicableCogs ? 'NO_SALES_DATA' : 'COGS_NOT_ASSIGNED';
```

---

## Logic After Fix

### Scenario: Product with COGS (future valid_from) + Sales in W47

| Step | Old Behavior | New Behavior |
|------|--------------|--------------|
| 1. Check hasCogs | true | true |
| 2. Check hasApplicableCogs | (not checked) | false |
| 3. Return | margin_pct=100% (stale) | margin_pct=null, missing_reason='COGS_NOT_ASSIGNED' |
| 4. productsNeedingHistory | NOT included | INCLUDED |
| 5. getLastSalesWeekForProducts | (not called) | Returns W44 data |
| 6. Frontend display | "— • шт • недавно" | "W44 • 92.3% • 1 шт" |

---

## Flow After Fix

```
Product 270958752/168120815 (COGS valid_from=2025-11-23, W47 midpoint=2025-11-21)
    ↓
getMarginDataForProducts()
    ↓
cogsMap[nm_id] = { valid_from: 2025-11-23, ... }  // COGS exists
    ↓
applicableCogsMap[nm_id] = null  // COGS NOT applicable (future valid_from > midpoint)
    ↓
hasApplicableCogs = false
    ↓
marginMap[nm_id] = { margin_pct: null, missing_reason: 'COGS_NOT_ASSIGNED' }
    ↓
productsNeedingHistory filter (line 277):
  missing_data_reason === 'COGS_NOT_ASSIGNED' && has_cogs && cogs → TRUE ✅
    ↓
getLastSalesWeekForProducts([270958752, 168120815])
    ↓
Returns W44 data: { margin_percent: 92.32, quantity_sold: 1 }
    ↓
enrichedPage includes last_sales_week, last_sales_margin_pct
    ↓
Frontend shows: "Последняя: W44 • 92.3% • 1 шт • 3 нед. назад" ✅
```

---

## Verification

After fix, products 270958752 and 168120815 should show:
```
(COGS с будущей даты)
Последняя: W44 • 92.32% • 1 шт • 3 нед. назад
ⓘ COGS для 2025-W47: 11₽
```

Instead of broken:
```
(COGS с будущей даты)
Последняя: — • шт • недавно
ⓘ COGS для 2025-W47: 11₽
```

---

## Related

- Request #34: Historical Margin Not Showing for Product 173589742 (revenue check)
- Request #33: COGS createCogs() Not Closing Previous Versions
- Request #31: Applicable COGS in Products API
- Request #29: COGS Temporal Versioning and Margin Calculation
- CLAUDE.md: Week Midpoint Strategy documentation

---

## Files Modified

**Backend**:
- `src/products/products.service.ts` - Added applicableCogsMap check in getMarginDataForProducts()

---

## Implementation Status

✅ **IMPLEMENTED** - 2025-11-28

### Changes Made

1. Added `applicableCogsMap` lookup using `getApplicableCogsForProducts()`
2. Updated all three branches in `getMarginDataForProducts()` to check `hasApplicableCogs`
3. Products with COGS but not applicable for target week now get `missing_reason: 'COGS_NOT_ASSIGNED'`
4. These products are included in `productsNeedingHistory` and get historical margin context
