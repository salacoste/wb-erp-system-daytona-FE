# Request #33: createCogs() Does Not Close Previous COGS Versions

## Date
2025-11-28

## Priority
High

## Category
Bug Fix

## Problem Description

При создании новой записи COGS через `createCogs()` (вызывается из `POST /v1/products/:nmId/cogs`), предыдущие версии **не закрываются** (поле `valid_to` остаётся `NULL`).

Это нарушает принцип temporal versioning, где:
- Текущая версия: `valid_to = NULL`
- Закрытые версии: `valid_to = дата_начала_следующей_версии`

### Evidence

Для товара 173589742 в БД **7 записей COGS**, но **ВСЕ** имеют `valid_to = NULL`:

```sql
SELECT nm_id, unit_cost_rub, valid_from, valid_to, is_active
FROM cogs WHERE nm_id = '173589742' ORDER BY valid_from DESC;

nm_id     | unit_cost_rub | valid_from   | valid_to | is_active
----------|---------------|--------------|----------|----------
173589742 | 11.00         | 2025-11-23   | NULL     | true
173589742 | 111.00        | 2025-11-20   | NULL     | true
173589742 | 112.00        | 2025-11-06   | NULL     | true
173589742 | 121.00        | 2025-11-07   | NULL     | true
173589742 | 119.00        | 2025-11-02   | NULL     | true
173589742 | 110.00        | 2025-11-01   | NULL     | true
173589742 | 110.00        | 2025-01-01   | NULL     | true  ← первая запись!
```

### Root Cause

**File**: `src/cogs/services/cogs.service.ts`

**Method**: `createCogs()` (lines 99-151)

```typescript
// Текущий код (БАГ):
async createCogs(dto: CreateCogsDto, userId?: string): Promise<Cogs> {
  // Проверяет только точное совпадение (nm_id, valid_from)
  const existing = await this.prisma.cogs.findUnique({
    where: {
      idx_cogs_nm_id_valid_from: {
        nmId: dto.nm_id,
        validFrom: new Date(dto.valid_from),
      },
    },
  });

  if (existing) {
    // Если (nm_id, valid_from) совпадает → UPDATE существующей
    return this.prisma.cogs.update({ ... });
  }

  // Если не совпадает → CREATE новой БЕЗ закрытия предыдущих!
  return this.prisma.cogs.create({
    data: {
      nmId: dto.nm_id,
      validFrom: new Date(dto.valid_from),
      validTo: null, // ← всегда NULL, не закрывает предыдущие!
      ...
    },
  });
}
```

**Сравнение с `updateCogs()`** (lines 165-222) - **ПРАВИЛЬНАЯ** логика:

```typescript
async updateCogs(nmId: string, dto: UpdateCogsDto, userId?: string): Promise<Cogs> {
  // 1. Находит текущую версию (valid_to = NULL)
  const currentVersion = await this.prisma.cogs.findFirst({
    where: { nmId, validTo: null, isActive: true },
  });

  // 2. В транзакции: закрывает старую + создаёт новую
  const [, newVersion] = await this.prisma.$transaction([
    // Закрывает старую версию
    this.prisma.cogs.update({
      where: { id: currentVersion.id },
      data: { validTo: newValidFrom }, // ← ПРАВИЛЬНО!
    }),
    // Создаёт новую версию
    this.prisma.cogs.create({
      data: { nmId, validFrom: newValidFrom, validTo: null, ... },
    }),
  ]);

  return newVersion;
}
```

## Expected Behavior

При создании COGS с новой `valid_from` должна **автоматически закрываться предыдущая версия**:

1. Если есть текущая версия (`valid_to = NULL`) с `valid_from < new_valid_from`:
   - Закрыть её: `valid_to = new_valid_from`
2. Создать новую версию с `valid_to = NULL`

### Example

**До**:
- Record A: `valid_from = 2025-01-01, valid_to = NULL`

**Создание COGS с `valid_from = 2025-11-20`**

**После**:
- Record A: `valid_from = 2025-01-01, valid_to = 2025-11-20` (закрыта)
- Record B: `valid_from = 2025-11-20, valid_to = NULL` (текущая)

## Impact

1. **Неоднозначность COGS lookup**: `findCogsAtDate()` может вернуть неверную запись, когда несколько записей имеют `valid_to = NULL`
2. **Некорректные margin calculations**: Week Midpoint Strategy может выбрать неверный COGS
3. **Нарушение Data Integrity**: Temporal versioning семантика нарушена
4. **UI путаница**: Frontend показывает "COGS с будущей даты" + "applicable_cogs" для разных записей

## Proposed Fix

### Option A: Fix `createCogs()` to close previous versions (Recommended)

```typescript
async createCogs(dto: CreateCogsDto, userId?: string): Promise<Cogs> {
  // ... existing validation ...

  // NEW: Find and close current version if exists
  const currentVersion = await this.prisma.cogs.findFirst({
    where: {
      nmId: dto.nm_id,
      validTo: null,
      isActive: true,
    },
    orderBy: { validFrom: 'desc' },
  });

  const newValidFrom = new Date(dto.valid_from);

  // Check if new valid_from is after current valid_from
  if (currentVersion && newValidFrom > currentVersion.validFrom) {
    // Transaction: Close old + Create new
    const [, newCogs] = await this.prisma.$transaction([
      this.prisma.cogs.update({
        where: { id: currentVersion.id },
        data: { validTo: newValidFrom },
      }),
      this.prisma.cogs.create({
        data: {
          nmId: dto.nm_id,
          validFrom: newValidFrom,
          validTo: null,
          unitCostRub: new Decimal(dto.unit_cost_rub),
          // ... other fields
        },
      }),
    ]);
    return newCogs;
  }

  // No current version or new date is before current → just create
  return this.prisma.cogs.create({ ... });
}
```

### Option B: Use `updateCogs()` logic in `assignCogsToProduct()`

Изменить `products.service.ts:870` для вызова `updateCogs()` вместо `createCogs()` когда уже есть COGS.

## Data Migration (Fix Existing Records)

После исправления бага, необходимо исправить существующие записи:

```sql
-- 1. Identify affected products (multiple valid_to = NULL)
SELECT nm_id, COUNT(*) as versions
FROM cogs
WHERE valid_to IS NULL AND is_active = true
GROUP BY nm_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 2. For each product, close older versions
-- (need to run per-product to set correct valid_to values)
```

## Acceptance Criteria

1. При создании COGS с новой `valid_from > current.valid_from`:
   - Предыдущая версия закрывается (`valid_to = new_valid_from`)
   - Новая версия создаётся с `valid_to = NULL`

2. При создании COGS с `valid_from = current.valid_from`:
   - Обновляется существующая запись (текущее поведение)

3. При создании COGS с `valid_from < current.valid_from`:
   - Создаётся историческая запись с `valid_to = current.valid_from`

4. Миграция существующих данных исправляет все `valid_to = NULL` дубликаты

## Test Cases

1. Товар без COGS → создать COGS → `valid_to = NULL` (единственная версия)
2. Товар с COGS от 01.01 → создать COGS от 01.11 → старая закрыта (`valid_to = 01.11`), новая текущая
3. Товар с COGS от 01.11 → создать COGS от 01.11 → UPDATE существующей (текущее поведение)
4. Товар с COGS от 01.11 → создать COGS от 01.01 → новая историческая (`valid_to = 01.11`)

## Related

- Story 10.4: Margin Profit Calculation (temporal COGS versioning)
- Request #31: Applicable COGS in Products API
- Epic 20: Automatic Margin Recalculation on COGS Update

## Files to Modify

**Backend**:
- `src/cogs/services/cogs.service.ts` - Fix `createCogs()` method

**Migration Script**:
- `scripts/fix-cogs-valid-to.ts` - One-time migration to fix existing data

---

## Secondary Issue: No Sales in W46/W47

Отдельно от бага temporal versioning, товар 173589742 также имеет **нет продаж** в W46/W47:

```sql
SELECT to_char(sale_dt, 'YYYY-"W"IW') as week, doc_type, COUNT(*)
FROM wb_finance_raw WHERE nm_id = '173589742'
GROUP BY 1, 2 ORDER BY 1 DESC;

week     | doc_type | count
---------|----------|------
2025-W47 | service  | 62   ← только хранение!
2025-W46 | service  | 31   ← только хранение!
2025-W44 | sale     | 1    ← последняя продажа
2025-W44 | service  | 5
...
```

Поэтому маржа не рассчитана для W47 - **это корректное поведение**.

Frontend показывает:
- "COGS с будущей даты" - корректно (11₽ от 23.11 после midpoint W47 = 21.11)
- "ⓘ Для 2025-W47: 111₽" - показывает applicable_cogs

Однако маржа W47 не может быть показана, т.к. **нет продаж**.

Рекомендация для frontend:
- Показывать `HistoricalMarginContext` с последней маржой (W44: 92.32%, COGS 110₽)
- Текст: "Последняя маржа W44: 92.32% (нет продаж в W46-W47)"

---

## Implementation Status

✅ **IMPLEMENTED** - 2025-11-28

### Changes Made

**File:** `src/cogs/services/cogs.service.ts` - Method `createCogs()` (lines 83-226)

**Fix Logic:**
1. Check exact match `(nm_id, valid_from)` → UPDATE existing (unchanged)
2. Find current version (`valid_to = NULL, is_active = true`)
3. If `new_valid_from > current.valid_from` → Transaction:
   - Close old version: `valid_to = new_valid_from`
   - Create new current: `valid_to = NULL`
4. If `new_valid_from < current.valid_from` → Create historical:
   - `valid_to = current.valid_from`
5. If no current version → Simple create

**Migration Script:** `scripts/fix-cogs-valid-to.ts`

Usage:
```bash
# Dry run (show what would change)
npx ts-node scripts/fix-cogs-valid-to.ts --dry-run

# Fix specific product
npx ts-node scripts/fix-cogs-valid-to.ts --nm-id=173589742

# Fix all affected products
npx ts-node scripts/fix-cogs-valid-to.ts
```

---

## UX Enhancement (Part 2) - 2025-11-28

### Problem

Products with `COGS_NOT_ASSIGNED` + `has_cogs=true` (future COGS date) were not receiving historical margin data (`last_sales_week`, `last_sales_margin_pct`, etc.), while products with `NO_SALES_DATA` did receive this data.

This caused inconsistent frontend display:
- Product 664280874 (NO_SALES_DATA): Full historical context shown
- Product 173589742 (COGS_NOT_ASSIGNED + future COGS): "Последняя: — • шт • недавно" (broken)

### Root Cause

Backend `ProductsService.getProductsList()` (lines 257-318) only fetched historical data for products with `missing_data_reason === 'NO_SALES_DATA'`. Products with `COGS_NOT_ASSIGNED` that had COGS with a future `valid_from` date were excluded.

### Fix Applied

**File:** `src/products/products.service.ts`

**Changes:**
1. Updated filter condition (lines 262-275) to include:
   - `missing_data_reason === 'NO_SALES_DATA'` (original)
   - `missing_data_reason === 'COGS_NOT_ASSIGNED' && has_cogs && cogs` (new)

2. Updated merge loop (lines 289-316) to use same condition for populating historical fields

### Frontend Component

**File:** `frontend/src/components/custom/ProductMarginCell.tsx`

New component `FutureCogsWithHistoricalContext` displays:
1. "(COGS с будущей даты)" - status indicator
2. "⚠ Нет продаж в W47" - explicit no sales message
3. "ⓘ COGS для 2025-W47: 111₽" - applicable COGS info
4. "Последняя: W44 • 92.3% • 1 шт • 3 нед. назад" - historical context

### Verification

After fix, all three product types show consistent display:
- 412097633 (no COGS): "(нет COGS для этой недели)"
- 664280874 (NO_SALES_DATA): Full HistoricalMarginContext
- 173589742 (COGS_NOT_ASSIGNED + future COGS): Full FutureCogsWithHistoricalContext
