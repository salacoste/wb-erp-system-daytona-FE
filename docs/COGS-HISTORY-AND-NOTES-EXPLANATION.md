# COGS History & Notes - Technical Documentation

**Date:** 2025-11-23
**Status:** ✅ Complete
**Related Story:** 4.1 - Single Product COGS Assignment

---

## Overview

This document answers key questions about COGS (Cost of Goods Sold) data storage, history tracking, and the notes field implementation.

---

## 1. 📝 Where is the "Description/Notes" field stored?

### Database Schema

**Table:** `cogs`
**Column:** `notes`

```typescript
// prisma/schema.prisma:410
notes String? @db.Text  // Optional notes field for COGS entries
```

### Field Details
- **Type:** `String?` (optional text)
- **Database Type:** PostgreSQL `TEXT` (unlimited length)
- **Purpose:** Store additional information about COGS entries
- **Examples:**
  - "Первоначальная себестоимость"
  - "Рост цены закупки на 20%"
  - "Скидка от поставщика 10%"
  - "Акция до конца месяца"

### API Integration

**Request Format:**
```typescript
POST /v1/products/:nmId/cogs

{
  "unit_cost_rub": 999.00,
  "valid_from": "2025-11-23",
  "source": "manual",
  "notes": "Первоначальная себестоимость"  // Optional
}
```

**Response Format:**
```typescript
{
  "cogs": {
    "id": "uuid",
    "nm_id": "321678606",
    "unit_cost_rub": "999.00",
    "valid_from": "2025-11-23T00:00:00.000Z",
    "valid_to": null,
    "notes": "Первоначальная себестоимость",
    "created_at": "2025-11-23T10:30:00.000Z"
  }
}
```

---

## 2. 📊 How is COGS "History" Implemented?

### Temporal Versioning System

The system uses **temporal versioning** - each COGS change creates a **new record** without deleting the old one.

### Database Schema

```typescript
// prisma/schema.prisma:394-397
model Cogs {
  // ... other fields ...

  // Temporal versioning: allows cost changes over time
  validFrom DateTime  @map("valid_from") @db.Timestamptz(3) // Start of validity
  validTo   DateTime? @map("valid_to")   @db.Timestamptz(3) // End (NULL = current)

  // Audit fields
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)
  createdBy String   @map("created_by") @db.VarChar(100)
  source    String   @db.VarChar(50) // 'manual', 'import', 'system'
}
```

### How It Works

#### First COGS Assignment (Creation)
```sql
-- User assigns COGS for the first time
INSERT INTO cogs (nm_id, unit_cost_rub, valid_from, valid_to, notes)
VALUES ('321678606', 100.00, '2025-01-01', NULL, 'Первоначальная');

-- Result:
nm_id      | unit_cost | valid_from  | valid_to | notes
-----------|-----------|-------------|----------|---------------
321678606  | 100.00    | 2025-01-01  | NULL     | Первоначальная
```
- `valid_to = NULL` means this is the **current active** COGS

#### Second COGS Assignment (Update)
```sql
-- User changes COGS on 2025-02-01
-- Step 1: Close old version
UPDATE cogs
SET valid_to = '2025-01-31'
WHERE nm_id = '321678606' AND valid_to IS NULL;

-- Step 2: Create new version
INSERT INTO cogs (nm_id, unit_cost_rub, valid_from, valid_to, notes)
VALUES ('321678606', 120.00, '2025-02-01', NULL, 'Рост цены закупки');

-- Result (history preserved):
nm_id      | unit_cost | valid_from  | valid_to    | notes
-----------|-----------|-------------|-------------|------------------
321678606  | 100.00    | 2025-01-01  | 2025-01-31  | Первоначальная
321678606  | 120.00    | 2025-02-01  | NULL        | Рост цены (current)
```

#### Third COGS Assignment (Another Update)
```sql
-- User changes COGS again on 2025-03-01
-- Result (full history):
nm_id      | unit_cost | valid_from  | valid_to    | notes
-----------|-----------|-------------|-------------|------------------
321678606  | 100.00    | 2025-01-01  | 2025-01-31  | Первоначальная
321678606  | 120.00    | 2025-02-01  | 2025-02-28  | Рост цены закупки
321678606  | 110.00    | 2025-03-01  | NULL        | Скидка поставщика (current)
```

### Benefits of Temporal Versioning

1. **Complete History:** All COGS changes preserved
2. **Audit Trail:** Know exactly when each cost was active
3. **Historical Margin Calculation:** Calculate margins for past periods with correct COGS
4. **Compliance:** Required for financial audits
5. **Rollback Support:** Can revert to previous COGS values

---

## 3. 🕒 Where are COGS Change Dates Stored?

### Four Temporal Fields

```typescript
validFrom DateTime  // When THIS version of COGS becomes active
validTo   DateTime? // When THIS version expires (NULL = current)
createdAt DateTime  // When database record was created
updatedAt DateTime  // When database record was last updated
```

### Additional Audit Fields

```typescript
createdBy String    // Who created this COGS entry (user_id or 'system')
source    String    // How it was created: 'manual', 'import', 'system'
```

### Example Timeline

```sql
-- Product: 321678606 (краска для мебели)

-- Version 1: Created manually on 2025-01-05, effective from 2025-01-01
nm_id      | unit_cost | valid_from  | valid_to    | created_at           | created_by | source
-----------|-----------|-------------|-------------|----------------------|------------|--------
321678606  | 100.00    | 2025-01-01  | 2025-01-31  | 2025-01-05 10:30:00  | user_123   | manual

-- Version 2: Created manually on 2025-02-01, effective from 2025-02-01
321678606  | 120.00    | 2025-02-01  | 2025-02-28  | 2025-02-01 14:20:00  | user_123   | manual

-- Version 3: Imported via CSV on 2025-03-01, effective from 2025-03-01
321678606  | 110.00    | 2025-03-01  | NULL        | 2025-03-01 09:15:00  | user_123   | import
```

**Key Insights:**
- `valid_from` = business effective date (when price actually changed)
- `created_at` = technical record creation timestamp
- `valid_to` = business expiration date (when this version stopped being active)

---

## 4. 🔍 SQL Queries for COGS History

### Get Full History for Product

```sql
-- All COGS versions for product (ordered newest first)
SELECT
  nm_id,
  unit_cost_rub,
  valid_from,
  valid_to,
  notes,
  created_at,
  created_by,
  source
FROM cogs
WHERE nm_id = '321678606'
ORDER BY valid_from DESC;
```

### Get Current Active COGS

```sql
-- Current COGS for product
SELECT * FROM cogs
WHERE nm_id = '321678606'
  AND valid_to IS NULL;
```

### Get COGS for Specific Date (Time Travel Query)

```sql
-- What was the COGS on 2025-02-15?
SELECT * FROM cogs
WHERE nm_id = '321678606'
  AND valid_from <= '2025-02-15'
  AND (valid_to IS NULL OR valid_to >= '2025-02-15')
LIMIT 1;
```

### Get All Products Changed in Date Range

```sql
-- All COGS changes in February 2025
SELECT
  nm_id,
  sa_name,
  unit_cost_rub,
  valid_from,
  notes
FROM cogs
WHERE valid_from BETWEEN '2025-02-01' AND '2025-02-28'
ORDER BY valid_from DESC;
```

### Count History Entries per Product

```sql
-- How many times was COGS changed for each product?
SELECT
  nm_id,
  sa_name,
  COUNT(*) as version_count,
  MIN(valid_from) as first_assignment,
  MAX(valid_from) as last_assignment
FROM cogs
GROUP BY nm_id, sa_name
HAVING COUNT(*) > 1  -- Only products with multiple versions
ORDER BY version_count DESC;
```

---

## 5. 🐛 Bug Fix: Input Not Updating When Switching Products

### Problem Description

**Bug:** When user assigns COGS to Product 1 (999.00 ₽), then navigates to Product 2, the input field still shows "999" instead of Product 2's existing COGS (or empty if none).

**Root Cause:** React Hook Form's `defaultValues` only apply on **initial render**. When props change (`nmId`, `existingCogs`), the form doesn't automatically reset.

### Code Before Fix

```typescript
// SingleCogsForm.tsx (BROKEN)
const { register, reset } = useForm<FormData>({
  defaultValues: {
    unit_cost_rub: existingCogs?.unit_cost_rub || '', // Set ONCE on mount
    valid_from: existingCogs?.valid_from?.split('T')[0] || today,
    notes: existingCogs?.notes || '',
  },
})

// No reset when nmId changes!
```

### Code After Fix

```typescript
// SingleCogsForm.tsx (FIXED - 2025-11-23)
import { useState, useEffect } from 'react' // Added useEffect

const { register, reset } = useForm<FormData>({
  defaultValues: {
    unit_cost_rub: existingCogs?.unit_cost_rub || '',
    valid_from: existingCogs?.valid_from?.split('T')[0] || today,
    notes: existingCogs?.notes || '',
  },
})

// Reset form when nmId changes (switching between products)
// This fixes the bug where input retains old values when navigating between products
useEffect(() => {
  reset({
    unit_cost_rub: existingCogs?.unit_cost_rub || '',
    valid_from: existingCogs?.valid_from?.split('T')[0] || today,
    notes: existingCogs?.notes || '',
  })
  setValidationErrors([]) // Clear validation errors when switching products
}, [nmId, existingCogs, reset, today])
```

### What Changed

1. **Added `useEffect` import** from React
2. **Added effect hook** that runs when `nmId` changes
3. **Calls `reset()`** with new values from `existingCogs`
4. **Clears validation errors** to prevent showing stale error messages

### Test Scenario

**Before Fix ❌:**
```
User flow:
1. Open Product 1 (321678606) - no COGS
2. Enter 999.00 ₽ in input
3. Click "Назначить себестоимость"
4. Navigate to Product 2 (147205694) - has COGS 500.00 ₽
5. Input shows: 999 ❌ WRONG! Should show 500

Result: User confused, sees wrong value
```

**After Fix ✅:**
```
User flow:
1. Open Product 1 (321678606) - no COGS
2. Enter 999.00 ₽ in input
3. Click "Назначить себестоимость"
4. Navigate to Product 2 (147205694) - has COGS 500.00 ₽
5. Input shows: 500 ✅ CORRECT!

Result: User sees correct value, can edit or confirm
```

---

## 6. 📋 Complete COGS Data Model

### Full Schema

```typescript
model Cogs {
  id String @id @default(uuid()) @db.Uuid

  // Product identifiers
  nmId   String @map("nm_id") @db.VarChar(50)     // WB Product ID
  saName String @map("sa_name") @db.VarChar(255)  // Product Name

  // Temporal versioning
  validFrom DateTime  @map("valid_from") @db.Timestamptz(3)
  validTo   DateTime? @map("valid_to") @db.Timestamptz(3)

  // Cost data
  unitCostRub Decimal @map("unit_cost_rub") @db.Decimal(15, 2)
  currency    String  @default("RUB") @db.VarChar(3)

  // Audit fields
  source    String   @db.VarChar(50)        // 'manual', 'import', 'system'
  createdBy String   @map("created_by") @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)

  // Notes (optional)
  notes String? @db.Text

  // Indexes
  @@unique([nmId, validFrom], name: "idx_cogs_nm_id_valid_from")
  @@index([nmId, validFrom, validTo], name: "idx_cogs_temporal_lookup")
  @@map("cogs")
}
```

### Field Reference

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `id` | UUID | Primary key | `550e8400-e29b-41d4-a716-446655440000` |
| `nm_id` | String | WB Product ID | `321678606` |
| `sa_name` | String | Product name | `Краска для мебели` |
| `valid_from` | DateTime | Version start date | `2025-01-01T00:00:00Z` |
| `valid_to` | DateTime? | Version end date | `2025-01-31T23:59:59Z` or `NULL` |
| `unit_cost_rub` | Decimal(15,2) | Unit cost | `999.00` |
| `currency` | String | Currency code | `RUB` |
| `source` | String | Entry source | `manual`, `import`, `system` |
| `created_by` | String | Creator | `user_123` or `system` |
| `created_at` | DateTime | Record creation | `2025-11-23T10:30:00Z` |
| `updated_at` | DateTime | Last update | `2025-11-23T14:20:00Z` |
| `notes` | String? | Optional notes | `Первоначальная себестоимость` |

---

## 7. 🔗 Related Documentation

**Story Documents:**
- Story 4.1: `docs/stories/4.1.single-product-cogs-assignment.md`
- Story 4.2: `docs/stories/4.2.bulk-cogs-assignment.md`

**Backend Documentation:**
- Epic 18 Spec: `docs/request-backend/09-epic-18-backend-response.md`
- Prisma Schema: `prisma/schema.prisma:387-419`

**Frontend Components:**
- Form Component: `src/components/custom/SingleCogsForm.tsx`
- Hook: `src/hooks/useSingleCogsAssignment.ts`
- Types: `src/types/cogs.ts`

---

## 8. ✅ Summary

### Questions Answered

1. ✅ **Where is notes stored?** → `cogs.notes` (TEXT field)
2. ✅ **How is history tracked?** → Temporal versioning (`valid_from`/`valid_to`)
3. ✅ **Where are dates stored?** → 4 fields: `valid_from`, `valid_to`, `created_at`, `updated_at`
4. ✅ **Bug: Input not updating** → Fixed with `useEffect` to reset form on product change

### Key Takeaways

- **Every COGS change creates a NEW record** (old ones preserved)
- **`valid_to = NULL` always means current active COGS**
- **Full audit trail** with `created_by`, `source`, `created_at`
- **Optional notes field** for additional context
- **Form now resets properly** when switching products

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Status:** ✅ Complete
**Bug Fix Applied:** 2025-11-23 (Input reset on product change)
