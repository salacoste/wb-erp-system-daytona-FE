# Request #34: Historical Margin Context Not Showing for Product 173589742

## Date
2025-11-28

## Priority
High

## Category
Bug Investigation / UX Fix

## Problem Description

На странице списка товаров (`/cogs`) для товара `173589742` не отображается исторический контекст маржи. Вместо ожидаемого:

**Ожидаемое (как у товара 664280874):**
```
Последняя: W44 • 92.3% • 1 шт • 3 нед. назад
```

**Фактическое:**
```
Последняя: — • шт • недавно
```

Это происходит несмотря на то, что данные маржи существуют в БД.

---

## Investigation Summary

### 1. Database Verification ✅

Данные маржи для товара 173589742 **существуют**:

```sql
SELECT week, margin_percent, quantity_sold FROM weekly_margin_fact
WHERE nm_id = '173589742' AND report_type = 'total'
ORDER BY week DESC;

-- Results:
-- 2025-W44 | 92.32 | 1  ← последняя неделя с продажами
-- 2025-W42 | 93.05 | 1
-- 2025-W41 | 93.09 | 1
-- 2025-W40 | 90.33 | 1
```

### 2. SQL Query Works ✅

Прямой запрос `getLastSalesWeekForProducts` возвращает данные корректно:

```javascript
// Query: cabinetId='f75836f7-c0bc-4b2c-823c-a1f3508cce8e', nmIds=['173589742']
// Result: [{ nm_id: '173589742', week: '2025-W44', margin_percent: '92.32', quantity_sold: 1 }]
```

### 3. Root Cause Identified ❌

**Debug logs показывают:**
```
Request #33 DEBUG: Product 173589742 - missing_data_reason=undefined, has_cogs=true, cogs={...}
```

**Проблема:** `missing_data_reason = undefined` вместо ожидаемого `'NO_SALES_DATA'` или `'COGS_NOT_ASSIGNED'`.

**Условие для включения в исторический контекст:**
```typescript
// Line 273:
if (p.missing_data_reason === 'NO_SALES_DATA') return true;

// Line 277:
if (p.missing_data_reason === 'COGS_NOT_ASSIGNED' && p.has_cogs && p.cogs) return true;
```

Поскольку `missing_data_reason = undefined`, товар **НЕ попадает** в `productsNeedingHistory`.

---

## Technical Analysis

### Сценарий товара 173589742

| Параметр | Значение |
|----------|----------|
| `nm_id` | 173589742 |
| `cabinet_id` | f75836f7-c0bc-4b2c-823c-a1f3508cce8e |
| `has_cogs` | `true` |
| `cogs.valid_from` | 2025-11-23 (после midpoint W47 = 2025-11-21) |
| W47 margin data | **НЕТ записей** (нет продаж в W47) |
| W44 margin data | `92.32%`, 1 шт ← последняя продажа |

### Analytics Response (getWeeklyBySku для W47)

Товар 173589742 **НЕ возвращается** в `analyticsData.data` для W47, т.к. в `weekly_margin_fact` нет записи для W47.

### Логика getMarginDataForProducts

```typescript
// Line 606: Iterate over analyticsData.data
for (const item of analyticsData.data) {
  // 173589742 NOT here (no W47 data)
}

// Line 675: For products NOT in analytics response
for (const nmId of nmIds) {
  if (!marginMap[nmId]) {
    const hasCogs = !!cogsMap[nmId];  // true for 173589742
    marginMap[nmId] = {
      missing_reason: hasCogs ? 'NO_SALES_DATA' : 'COGS_NOT_ASSIGNED',
      // 173589742 should get 'NO_SALES_DATA' here
    };
  }
}
```

### Где теряется missing_reason?

**Вопрос для расследования:** Почему `marginMap['173589742'].missing_reason` не равен `'NO_SALES_DATA'` после выполнения строки 692?

**Гипотезы:**
1. Товар 173589742 попадает в `analyticsData.data` с `margin_pct !== null` (маловероятно - W47 данных нет)
2. Логика `getCogsForProducts` не возвращает COGS для 173589742 (проверить!)
3. Товар 173589742 не входит в `pageNmIds` на этой странице (пагинация?)

---

## Current Debug Logging

Добавлены debug логи в `products.service.ts`:

```typescript
// Line 262-268: Debug product 173589742 state before filtering
if (product173) {
  this.logger.debug(`Request #33 DEBUG: Product 173589742 - missing_data_reason=${...}`);
}

// Line 607-612: Debug when product IS in analytics
if (item.nm_id === '173589742') {
  this.logger.debug(`Request #33 DEBUG getMarginDataForProducts: nmId=173589742 IN analytics...`);
}

// Line 636-640: Debug when product has missing margin
if (item.nm_id === '173589742') {
  this.logger.debug(`Request #33 DEBUG getMarginDataForProducts: nmId=173589742 missing margin...`);
}

// Line 681-685: Debug when product NOT in analytics
if (nmId === '173589742') {
  this.logger.debug(`Request #33 DEBUG getMarginDataForProducts: nmId=173589742 NOT in analytics...`);
}
```

---

## Expected Flow

1. `getMarginDataForProducts(['173589742'], cabinetId)` вызывается
2. Analytics query для W47 не возвращает 173589742 (нет данных)
3. Loop по `nmIds` находит что `!marginMap['173589742']`
4. `hasCogs = !!cogsMap['173589742']` = `true`
5. `missing_reason = 'NO_SALES_DATA'`
6. `enrichedPage` получает `missing_data_reason = 'NO_SALES_DATA'`
7. `productsNeedingHistory` включает 173589742
8. `getLastSalesWeekForProducts` возвращает W44 данные
9. Product показывает "Последняя: W44 • 92.3% • 1 шт • 3 нед. назад"

---

## Questions for Backend Team

1. **Почему `missing_data_reason = undefined`?**
   - Товар должен получить `'NO_SALES_DATA'` на строке 692
   - Нужно проверить что код дойдёт до строки 687-697

2. **Попадает ли товар 173589742 в `pageNmIds`?**
   - Если товар на второй странице (не в первых 25), debug логи могут не сработать

3. **Возвращает ли `getCogsForProducts` COGS для 173589742?**
   - `valid_at: new Date()` может не найти COGS с будущей датой?
   - Нужно проверить что `cogsMap['173589742']` существует

4. **Есть ли товар 173589742 в `analyticsData.data` для W47?**
   - Не должен быть (W47 нет данных)
   - Но если есть со странными значениями - это bug

---

## Files to Check

- `src/products/products.service.ts`:
  - `getMarginDataForProducts()` (lines 530-720)
  - `getCogsForProducts()` (lines 427-453)
  - `enrichedPage` mapping (lines 232-254)
  - `productsNeedingHistory` filter (lines 270-283)

- `src/analytics/weekly-analytics.service.ts`:
  - `getWeeklyBySku()` - что возвращает для W47
  - `getLastSalesWeekForProducts()` - работает корректно

---

## Next Steps

1. **Сделать запрос и проверить новые debug логи** (перезапустить API после изменений)
2. **Проверить какой лог появляется:**
   - "IN analytics" = товар в analytics response → проблема в margin_pct/total_units
   - "NOT in analytics" = товар НЕ в analytics → проблема в cogsMap или nmIds
3. **Если товар NOT in analytics, проверить `hasCogs`:**
   - `true` → должен быть `'NO_SALES_DATA'`, почему undefined?
   - `false` → проблема в `getCogsForProducts`, COGS не найден

---

## Related

- Request #33: COGS createCogs() Not Closing Previous Versions (UX part)
- Story 23.9: Historical Margin Context in Products
- Story 4.9: Historical Margin Discovery (Frontend)
- Epic 19: Completed Weeks Only

---

## ROOT CAUSE FOUND ✅

### The Problem

**Товар 173589742 имеет service-записи (хранение) в W47:**

```sql
SELECT doc_type, qty, gross FROM wb_finance_raw
WHERE nm_id = '173589742' AND week = 'W47';

-- Results (60+ rows):
-- doc_type | qty | gross
-- service  |  2  |   0    ← хранение, НЕ продажа!
-- service  |  2  |   0
-- ...
-- total_qty = 120 (сумма storage units)
```

**Логика `getWeeklyBySku`** агрегирует ВСЕ строки из `wb_finance_raw`:
- `SUM(qty) = 120` (включает service-записи)
- `SUM(gross) = 0` (нет продаж)
- `SUM(net_for_pay) = 0` (нет выручки)

**Логика `getMarginDataForProducts`** проверяла:
```javascript
const hasSales = (item.total_units || 0) > 0;  // 120 > 0 = true (НЕВЕРНО!)
```

Это приводило к:
- `hasSales = true` (неверно - только хранение!)
- `missingReason = undefined` (ветка "COGS assigned but margin not calculated")
- Товар НЕ включался в `productsNeedingHistory`

### The Fix (Request #34)

**File:** `src/products/products.service.ts:617-622`

```typescript
// Request #34 Fix: Check revenue, not just total_units, to detect real sales
// Problem: total_units includes service rows (storage) with qty>0 but gross=0
// Solution: Consider "has sales" only if revenue > 0 (actual sales generate revenue)
const hasRevenue = (item.revenue_net || 0) > 0 || (item.revenue_gross || 0) > 0;
const hasSales = hasRevenue && (item.total_units || 0) > 0;
```

**Логика после фикса:**
- `hasRevenue = (0 > 0) || (0 > 0) = false`
- `hasSales = false && true = false` ✅
- `missingReason = 'NO_SALES_DATA'` ✅
- Товар включается в `productsNeedingHistory` ✅
- `getLastSalesWeekForProducts` возвращает W44 данные ✅

---

## Implementation Status

✅ **IMPLEMENTED** - 2025-11-28

### Changes Made

**Backend:** `src/products/products.service.ts`

- Lines 617-622: Added revenue check to determine if product has real sales
- Service rows (storage, penalties) with qty>0 but gross=0 now correctly identified as "no sales"

### Verification

After fix, product 173589742 should show:
```
Последняя: W44 • 92.3% • 1 шт • 3 нед. назад
```

Instead of broken:
```
Последняя: — • шт • недавно
```
