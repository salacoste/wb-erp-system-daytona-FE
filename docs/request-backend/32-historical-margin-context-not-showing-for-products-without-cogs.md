# Request #32: Historical Margin Context Not Showing for Products Without COGS

## Date
2025-11-28

## Priority
Medium

## Category
Bug Fix

## Problem Description

На странице списка товаров (`/cogs`) для товара "Карты Таро" (nm_id: 201916739) не отображается информация о том, что нет продаж за последние 12 недель, в отличие от товара "Обруч для похудения" (nm_id: 395996251), у которого эта информация отображается корректно.

### Screenshot Analysis

| Товар | nm_id | Отображается |
|-------|-------|--------------|
| Обруч для похудения | 395996251 | ✅ "Нет продаж за W47" + "Нет продаж за последние 12 недель" + "История продаж" |
| Карты Таро | 201916739 | ❌ Только "— (нет COGS для этой недели)" |

## Root Cause Analysis

### Database Investigation

```sql
-- Проверка записей в wb_finance_raw
SELECT nm_id, doc_type, COUNT(*)
FROM wb_finance_raw
WHERE nm_id IN ('201916739', '395996251')
GROUP BY nm_id, doc_type;

-- Результат:
-- nm_id: 201916739 - есть записи типа 'service' (хранение), но НЕТ записей с doc_type='Продажа'
-- nm_id: 395996251 - НЕТ записей вообще

-- Проверка COGS
SELECT nm_id FROM cogs WHERE nm_id IN ('201916739', '395996251');
-- Результат: НИ У ОДНОГО товара нет COGS
```

### Backend Code Bug

**File:** `src/products/products.service.ts:653`

```typescript
// Текущий код (БАГ):
missing_reason: hasCogs ? 'NO_SALES_DATA' : 'NO_SALES_DATA', // Both cases: no sales...

// Должно быть:
missing_reason: hasCogs ? 'NO_SALES_DATA' : 'COGS_NOT_ASSIGNED',
```

**Проблема:** Для товаров без записей в analytics response (нет продаж никогда), `missing_reason` всегда устанавливается как `'NO_SALES_DATA'` независимо от наличия COGS. Это приводит к тому, что:

1. **395996251** (Обруч) - нет записей в `wb_finance_raw` → попадает в ветку "NOT in analytics response" → `missing_reason = 'NO_SALES_DATA'` → показывается HistoricalMarginContext
2. **201916739** (Карты Таро) - есть записи `service` в `wb_finance_raw` → попадает в analytics response с `total_units=0` → строка 588-589: `if (!hasSales) missingReason = 'NO_SALES_IN_PERIOD'` → НЕ показывается HistoricalMarginContext

## Expected Behavior

Оба товара должны показывать одинаковую информацию о том, что нет продаж за последние 12 недель, если:
1. У товара нет COGS
2. У товара нет продаж (независимо от наличия записей типа `service`)

### UI Requirements (Story 4.9)

Компонент `HistoricalMarginContext` должен отображаться когда:
- `missing_data_reason === 'NO_SALES_DATA'`

Этот компонент показывает:
- "Нет продаж за {текущую неделю}"
- "Нет продаж за последние 12 недель" (если `lastSalesWeek === null`)
- Ссылку "История продаж"

## Proposed Fix

### Option A: Fix missing_reason Logic (Recommended)

В `src/products/products.service.ts`:

```typescript
// Строка 653: Для товаров NOT in analytics response
missing_reason: hasCogs ? 'NO_SALES_DATA' : 'COGS_NOT_ASSIGNED',

// Строка 588-589: Для товаров в analytics response с total_units=0
if (!hasSales) {
  // Изменить логику: если нет продаж - это NO_SALES_DATA, независимо от COGS
  // COGS влияет только на возможность расчёта маржи
  missingReason = 'NO_SALES_DATA';
}
```

### Option B: Change Frontend Logic

В `ProductMarginCell.tsx` показывать `HistoricalMarginContext` также для `NO_SALES_IN_PERIOD`:

```typescript
{(product.missing_data_reason === 'NO_SALES_DATA' ||
  product.missing_data_reason === 'NO_SALES_IN_PERIOD') && (
  <HistoricalMarginContext ... />
)}
```

**Note:** Option A предпочтительнее, так как `NO_SALES_IN_PERIOD` и `NO_SALES_DATA` семантически разные статусы.

## Acceptance Criteria

1. Товары без продаж (даже если есть записи `service`) должны показывать информацию о том, что нет продаж
2. Если есть COGS но нет продаж → `missing_data_reason = 'NO_SALES_DATA'` + показывать HistoricalMarginContext
3. Если нет COGS и нет продаж → `missing_data_reason = 'COGS_NOT_ASSIGNED'` + НЕ показывать HistoricalMarginContext (пользователь должен сначала назначить COGS)

## Related Stories

- Story 4.9: Historical Margin Discovery (Frontend)
- Story 23.9: Historical Margin Context in Products (Backend)

## Files to Modify

**Backend:**
- `src/products/products.service.ts` - Fix missing_reason logic in `getMarginDataForProducts()`

## Test Cases

1. Товар без COGS, без записей в wb_finance_raw → `COGS_NOT_ASSIGNED`
2. Товар без COGS, с записями service в wb_finance_raw → `COGS_NOT_ASSIGNED`
3. Товар с COGS, без записей в wb_finance_raw → `NO_SALES_DATA`
4. Товар с COGS, с записями service но без Продажа → `NO_SALES_DATA`
5. Товар с COGS, с продажами в текущей неделе → margin_pct calculated
6. Товар с COGS, с продажами только в прошлых неделях → `NO_SALES_DATA` + historical context

---

## Implementation Status

✅ **IMPLEMENTED** - 2025-11-28

### Changes Made

**File:** `src/products/products.service.ts`

**Bug #1 Fix (line 657):**
```typescript
// Before:
missing_reason: hasCogs ? 'NO_SALES_DATA' : 'NO_SALES_DATA',

// After:
missing_reason: hasCogs ? 'NO_SALES_DATA' : 'COGS_NOT_ASSIGNED',
```

**Bug #2 Fix (lines 586-600):**
```typescript
// Reordered logic to prioritize COGS check over sales check
let missingReason: string | undefined;
if (!hasCogs) {
  missingReason = 'COGS_NOT_ASSIGNED';
} else if (!hasSales) {
  missingReason = 'NO_SALES_DATA';  // Shows HistoricalMarginContext
} else {
  missingReason = undefined;
}
```

### Expected Behavior After Fix

| Товар | nm_id | COGS | Продажи | missing_data_reason | UI |
|-------|-------|------|---------|---------------------|-----|
| Обруч для похудения | 395996251 | ❌ | ❌ | `COGS_NOT_ASSIGNED` | "— (нет COGS для этой недели)" |
| Карты Таро | 201916739 | ❌ | service only | `COGS_NOT_ASSIGNED` | "— (нет COGS для этой недели)" |
| Любой товар | * | ✅ | ❌ | `NO_SALES_DATA` | HistoricalMarginContext |
| Любой товар | * | ✅ | ✅ | null | margin_pct displayed |
