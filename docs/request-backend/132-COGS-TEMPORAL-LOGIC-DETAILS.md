# Guide #132: COGS Temporal Versioning and Margin Calculation Logic - Complete Technical Reference

**Date**: 2026-02-01
**Type**: TECHNICAL REFERENCE GUIDE
**Component**: Backend - COGS Module + Analytics Module
**Related**: Guide #29 (COGS Temporal Versioning), Epic 10/17/20/26, Story 5.1-5.3

---

## Executive Summary

This document provides a comprehensive technical reference for the COGS (Cost of Goods Sold) temporal versioning system and its integration with margin calculations. The system uses a **Week Midpoint Strategy** (Thursday) to determine which COGS version applies to each week's margin calculations, ensuring consistent and predictable financial analytics.

---

## Table of Contents

1. [Temporal Versioning Model](#1-temporal-versioning-model)
2. [Week Midpoint Rule](#2-week-midpoint-rule)
3. [COGS Assignment Algorithm](#3-cogs-assignment-algorithm)
4. [Temporal Lookup: findCogsAtDate()](#4-temporal-lookup-findcogsatdate)
5. [Margin Calculation Formulas](#5-margin-calculation-formulas)
6. [Recalculation Triggers](#6-recalculation-triggers)
7. [Affected Weeks Algorithm](#7-affected-weeks-algorithm)
8. [COGS Coverage Calculation](#8-cogs-coverage-calculation)
9. [Version Chain Management](#9-version-chain-management)
10. [Edge Cases and FAQ](#10-edge-cases-and-faq)

---

## 1. Temporal Versioning Model

### 1.1 Data Model

```sql
CREATE TABLE cogs (
  id            UUID PRIMARY KEY,
  cabinet_id    UUID NOT NULL,          -- Multi-tenancy isolation (Epic 32)
  nm_id         VARCHAR(50) NOT NULL,   -- Product article number
  sa_name       VARCHAR(255) NOT NULL,  -- Product name
  unit_cost_rub DECIMAL(15,2) NOT NULL, -- Cost per unit in RUB
  currency      VARCHAR(3) DEFAULT 'RUB',

  -- Temporal Versioning
  valid_from    TIMESTAMPTZ NOT NULL,   -- Version start date
  valid_to      TIMESTAMPTZ NULL,       -- Version end date (NULL = current)

  -- Audit
  source        VARCHAR(50) NOT NULL,   -- 'manual', 'import', 'system'
  created_by    VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Soft Delete (Story 5.3)
  is_active     BOOLEAN DEFAULT TRUE,
  deleted_at    TIMESTAMPTZ NULL,
  deleted_by    VARCHAR(100) NULL,

  -- Unique constraint: one version per (cabinet_id, nm_id, valid_from)
  UNIQUE(cabinet_id, nm_id, valid_from)
);
```

### 1.2 Versioning Principles

```
+-----------------------------------------------------------------------------+
|                        COGS Version Chain Model                              |
+-----------------------------------------------------------------------------+
|                                                                              |
|  valid_to = NULL indicates the CURRENT (active) version                      |
|                                                                              |
|  When creating a new version:                                                |
|  1. Old version is closed: valid_to = new_version.valid_from                |
|  2. New version is created: valid_to = NULL                                  |
|                                                                              |
|  Version Chain Example:                                                      |
|  v1: valid_from=2025-01-01, valid_to=2025-03-01 (closed)                    |
|  v2: valid_from=2025-03-01, valid_to=2025-06-15 (closed)                    |
|  v3: valid_from=2025-06-15, valid_to=NULL       (current)                   |
|                                                                              |
+-----------------------------------------------------------------------------+
```

### 1.3 Version State Diagram

```
[No COGS] --create--> [v1: current (valid_to=NULL)]
                            |
                     create new version
                            |
                            v
[v1: closed (valid_to=v2.valid_from)] <-- [v2: current (valid_to=NULL)]
                                                   |
                                            soft delete
                                                   |
                                                   v
                                    [v2: deleted (is_active=false)]
                                    [v1: reopened (valid_to=NULL)]
```

---

## 2. Week Midpoint Rule

### 2.1 Core Principle

When calculating margin for a week, the system determines which COGS version to use by checking the **week midpoint** (approximately Thursday 12:00 MSK).

```typescript
// margin-calculation.service.ts:558
const midpoint = new Date((start.getTime() + end.getTime()) / 2); // ≈ Thursday
const cogs = await this.cogsService.findCogsAtDate(revenue.nmId, midpoint);
```

### 2.2 Midpoint Calculation

For ISO weeks (Monday-Sunday):

| Week | Start (Mon 00:00) | End (Sun 23:59) | Midpoint |
|------|-------------------|-----------------|----------|
| W45  | 2025-11-03        | 2025-11-09      | **2025-11-06** (Thu) |
| W46  | 2025-11-10        | 2025-11-16      | **2025-11-13** (Thu) |
| W47  | 2025-11-17        | 2025-11-23      | **2025-11-20** (Thu) |

### 2.3 COGS Application Rule

```
+-----------------------------------------------------------------------+
| COGS APPLICATION RULE                                                  |
+-----------------------------------------------------------------------+
|                                                                        |
| IF cogs.valid_from <= week_midpoint (Thursday)                         |
|    THEN new COGS APPLIES to this week                                  |
|                                                                        |
| IF cogs.valid_from > week_midpoint (Thursday)                          |
|    THEN old COGS REMAINS for this week                                 |
|    (new COGS applies from NEXT week)                                   |
|                                                                        |
+-----------------------------------------------------------------------+
```

### 2.4 Day-of-Week Impact Table

| When COGS Changed | valid_from | Applies to Week | Reason |
|-------------------|------------|-----------------|--------|
| Monday W47        | 2025-11-17 | **W47** | valid_from (17) <= midpoint (20) |
| Tuesday W47       | 2025-11-18 | **W47** | valid_from (18) <= midpoint (20) |
| Wednesday W47     | 2025-11-19 | **W47** | valid_from (19) <= midpoint (20) |
| Thursday W47 (AM) | 2025-11-20 | **W47** | valid_from (20) <= midpoint (20) |
| Thursday W47 (PM) | 2025-11-20 | **W47/W48** | Depends on exact time |
| Friday W47        | 2025-11-21 | **W48** | valid_from (21) > midpoint (20) |
| Saturday W47      | 2025-11-22 | **W48** | valid_from (22) > midpoint (20) |
| Sunday W47        | 2025-11-23 | **W48** | valid_from (23) > midpoint (20) |

**User Recommendation**: If you change COGS late in the week (Fri-Sun) but want it to apply to the current week, backdate `valid_from` to Monday of that week.

---

## 3. COGS Assignment Algorithm

### 3.1 createCogs() Flow

```typescript
// cogs.service.ts:113
async createCogs(dto: CreateCogsDto, userId?: string, cabinetId?: string): Promise<Cogs>
```

**Decision Tree**:

```
                    START: createCogs(dto, userId, cabinetId)
                                    |
                                    v
                    +-------------------------------+
                    | Check: cabinetId provided?     |
                    +-------------------------------+
                         |                    |
                        NO                   YES
                         |                    |
                         v                    v
                    THROW Error     Check existing COGS with
                                   (cabinet_id, nm_id, valid_from)
                                            |
                          +-----------------+------------------+
                          |                                    |
                       EXISTS                             NOT EXISTS
                          |                                    |
                          v                                    v
                    UPDATE existing               Check for current version
                    (Request #12)                 (valid_to = NULL)
                          |                                    |
                          |                     +--------------+-------------+
                          |                     |                            |
                          |                  EXISTS                     NOT EXISTS
                          |                     |                            |
                          |    +----------------+-----------------+          |
                          |    |                                  |          |
                          | new.valid_from            new.valid_from         |
                          | > current.valid_from      < current.valid_from   |
                          |    |                                  |          |
                          |    v                                  v          v
                          | CASE 2:                         CASE 3:      CASE 1:
                          | Transaction:                    Create       Create
                          | close old + create new          historical   first version
                          |                                 version
                          v
                       RETURN updated/created COGS
```

### 3.2 Case Scenarios

**Case 1: No Current Version (First COGS)**
```typescript
// Simple create with valid_to = NULL (current version)
await this.prisma.cogs.create({
  data: {
    cabinetId,
    nmId: dto.nm_id,
    validFrom: newValidFrom,
    validTo: null, // Current version
    unitCostRub: dto.unit_cost_rub,
    // ...
  },
});
```

**Case 2: New Version After Current (Request #33)**
```typescript
// Transaction: close old + create new
if (newValidFrom > currentVersion.validFrom) {
  const [, newCogs] = await this.prisma.$transaction([
    // Close old version
    this.prisma.cogs.update({
      where: { id: currentVersion.id },
      data: { validTo: newValidFrom },
    }),
    // Create new current version
    this.prisma.cogs.create({
      data: {
        cabinetId,
        nmId: dto.nm_id,
        validFrom: newValidFrom,
        validTo: null, // New current version
        // ...
      },
    }),
  ]);
}
```

**Case 3: Historical Version (Before Current)**
```typescript
// Create historical with valid_to = current.valid_from
if (newValidFrom < currentVersion.validFrom) {
  await this.prisma.cogs.create({
    data: {
      cabinetId,
      nmId: dto.nm_id,
      validFrom: newValidFrom,
      validTo: currentVersion.validFrom, // Ends where current starts
      // ...
    },
  });
}
```

---

## 4. Temporal Lookup: findCogsAtDate()

### 4.1 Algorithm

```typescript
// cogs.service.ts:327
async findCogsAtDate(nmId: string, validAt: Date): Promise<Cogs | null> {
  const cogs = await this.prisma.cogs.findFirst({
    where: {
      nmId,
      isActive: true,           // Exclude soft-deleted records
      validFrom: { lte: validAt }, // Started before or on validAt
      OR: [
        { validTo: null },         // Current version
        { validTo: { gt: validAt } }, // Historical version still valid
      ],
    },
    orderBy: {
      validFrom: 'desc',        // Most recent version first
    },
  });
  return cogs;
}
```

### 4.2 SQL Equivalent

```sql
SELECT * FROM cogs
WHERE nm_id = ?
  AND is_active = true
  AND valid_from <= ?  -- midpoint date
  AND (valid_to > ? OR valid_to IS NULL)
ORDER BY valid_from DESC
LIMIT 1
```

### 4.3 Visual Algorithm

```
+-----------------------------------------------------------------------------+
|                    COGS LOOKUP ALGORITHM (for Week Margin)                   |
+-----------------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------+
|  STEP 1: Calculate week midpoint                                             |
|          midpoint = (monday_00:00 + sunday_23:59) / 2 ≈ thursday 12:00      |
+-----------------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------+
|  STEP 2: Query database                                                      |
|          WHERE nm_id = ?                                                     |
|            AND is_active = true                                              |
|            AND valid_from <= midpoint                                        |
|            AND (valid_to > midpoint OR valid_to IS NULL)                    |
|          ORDER BY valid_from DESC                                            |
|          LIMIT 1                                                             |
+-----------------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------+
|  STEP 3: Return result                                                       |
|          - Found: Return COGS record with unit_cost_rub                      |
|          - Not found: Return null (missing_data_reason: COGS_NOT_ASSIGNED)  |
+-----------------------------------------------------------------------------+
```

### 4.4 Default Behavior (No COGS Assigned)

When `findCogsAtDate()` returns `null`:

```typescript
// margin-calculation.service.ts:574-581
if (!cogs) {
  // No COGS found - track missing units
  cogsBySku.set(revenue.nmId, {
    nmId: revenue.nmId,
    unitCostRub: null,
    cogsRub: new Decimal(0),
    missingCogsUnits: revenue.quantitySold,
  });
}
```

**Frontend Display**:
- `missing_data_reason: "COGS_NOT_ASSIGNED"`
- `margin_pct: null`
- `cogs: null`

---

## 5. Margin Calculation Formulas

### 5.1 Gross Margin (Epic 10)

```typescript
// margin-calculation.service.ts:605-622
gross_profit = revenue_net - cogs
margin_percent = (gross_profit / |revenue_net|) * 100%
markup_percent = (gross_profit / |cogs|) * 100%
```

**Implementation**:
```typescript
calculateMargins(revenue: RevenueData, cogs: CogsData): MarginMetrics {
  const grossProfitRub = revenue.revenueNetRub.minus(cogs.cogsRub);

  // Margin %: (profit / revenue) × 100%
  const marginPercent = revenue.revenueNetRub.equals(0)
    ? new Decimal(0)
    : grossProfitRub.div(revenue.revenueNetRub.abs()).mul(100);

  // Markup %: (profit / cogs) × 100%
  const markupPercent = cogs.cogsRub.equals(0)
    ? new Decimal(0)
    : grossProfitRub.div(cogs.cogsRub.abs()).mul(100);

  return { grossProfitRub, marginPercent, markupPercent };
}
```

### 5.2 Operating Margin (Epic 26)

```typescript
// margin-calculation.service.ts:634-664
gross_profit = revenue_net - cogs
total_expenses = logistics + storage + paid_acceptance + penalties
               + loyalty_fee + commission_deductible
               + other_adjustments - loyalty_compensation
operating_profit = gross_profit - total_expenses
operating_margin_percent = (operating_profit / |revenue_net|) * 100%
```

**Note**: `acquiring_fee` and `commission_sales` are **excluded** from total_expenses (already deducted from net_for_pay).

### 5.3 Calculation Example

```
Product: nm_id = 147205694
Week: W47 (17-23.11.2025)
Midpoint: 20.11.2025 (Thursday)

COGS History:
  v1: 500₽ (valid_from: 01.10.2025, valid_to: 15.11.2025)
  v2: 650₽ (valid_from: 15.11.2025, valid_to: NULL) ← current

COGS Lookup: valid_from(15.11) <= midpoint(20.11) → v2 = 650₽

Sales Data:
  quantity_sold = 8 units
  revenue_net = 6,400₽

Calculation:
  cogs_total = 8 × 650 = 5,200₽
  gross_profit = 6,400 - 5,200 = 1,200₽
  margin_percent = (1,200 / 6,400) × 100% = 18.75%
```

---

## 6. Recalculation Triggers

### 6.1 Events That Trigger Recalculation

| Event | API Endpoint | Affected Weeks |
|-------|--------------|----------------|
| **COGS Assignment** | `POST /v1/products/:nmId/cogs` | From `valid_from` to last completed week |
| **COGS Edit** | `PATCH /v1/cogs/:cogsId` | From `valid_from` to `valid_to` (or now) |
| **COGS Delete** | `DELETE /v1/cogs/:cogsId` | From `valid_from` to `valid_to` (or now) |
| **Bulk Upload** | `POST /v1/products/cogs/bulk` | Aggregated for all affected weeks |

### 6.2 Recalculation Flow

```
+-----------------------------------------------------------------------------+
|                    MARGIN RECALCULATION WORKFLOW                             |
+-----------------------------------------------------------------------------+

1. User Action (POST/PATCH/DELETE /v1/cogs/...)
           |
           v
2. COGS Service saves/updates record
           |
           v
3. Calculate affected weeks using calculateAffectedWeeks()
           |
           v
4. Check: affectedWeeks.length > 0?
           |
    +------+------+
    |             |
   YES            NO
    |             |
    v             v
5a. Enqueue      Return without
    background   recalculation
    task         (valid_from in future)
    |
    v
6. BullMQ Queue: 'margin_calculation'
    Job: 'recalculate_weekly_margin'
    Data: { cabinetId, weeks, nmIds?, reason }
    |
    v
7. Worker processes job (Epic 20)
    For each week:
      - Get sales data from wb_finance_raw
      - Apply temporal COGS lookup (findCogsAtDate)
      - Calculate margin = (revenue - cogs) / revenue × 100%
      - UPSERT into weekly_margin_fact
    |
    v
8. Margin available in API responses
```

### 6.3 Performance Targets

| Scenario | Expected Time |
|----------|---------------|
| Single week (1 product) | 5-10 seconds |
| Single week (100 products) | ≤ 5 seconds |
| 7 weeks batch | ≤ 30 seconds |
| Bulk 500 products | ≤ 60 seconds |

### 6.4 Error Handling

- Failed margin calculation does **NOT** block COGS assignment
- Auto-retry: 3 attempts with exponential backoff
- Partial failures don't stop processing other weeks
- No duplicate tasks (idempotency via task_uuid hash)

---

## 7. Affected Weeks Algorithm

### 7.1 calculateAffectedWeeks() Function

```typescript
// affected-weeks.helper.ts:52
export function calculateAffectedWeeks(
  validFrom: Date | string,
  isoWeekService?: IsoWeekService
): string[]
```

### 7.2 Algorithm Steps

```
+-----------------------------------------------------------------------------+
|                    AFFECTED WEEKS CALCULATION                                |
+-----------------------------------------------------------------------------+

1. Parse validFrom date (convert string to Date if needed)
           |
           v
2. Determine end date:
   - With IsoWeekService: getLastCompletedWeek() (Epic 19 logic)
   - Without: current date (fallback for tests)
           |
           v
3. Convert dates to Europe/Moscow timezone
           |
           v
4. Early return if validFrom > endDate (future date)
   → Return []
           |
           v
5. Generate ISO week strings from validFrom to endDate
   Loop: while (currentDate <= endDate)
     - Calculate ISO week: YYYY-Www
     - Add to weeks array
     - Advance by 7 days
           |
           v
6. Deduplicate and sort weeks array
           |
           v
7. Return unique sorted weeks

+-----------------------------------------------------------------------------+
```

### 7.3 Examples

```typescript
// Example 1: Current week COGS assignment
// Today: Wednesday 2025-11-26 (W48)
// valid_from: 2025-11-24 (Monday W48)
calculateAffectedWeeks(new Date("2025-11-24"), isoWeekService);
// Result: ["2025-W47"] (W48 not completed yet)

// Example 2: Historical COGS (6 weeks back)
// valid_from: 2025-10-10 (W41)
calculateAffectedWeeks(new Date("2025-10-10"), isoWeekService);
// Result: ["2025-W41", "2025-W42", "2025-W43", "2025-W44", "2025-W45", "2025-W46", "2025-W47"]

// Example 3: Future date
// valid_from: 2025-12-25
calculateAffectedWeeks(new Date("2025-12-25"), isoWeekService);
// Result: [] (no completed weeks affected)
```

### 7.4 Epic 19 Integration

The algorithm uses `getLastCompletedWeek(conservative=true)` to exclude incomplete weeks:

- **Monday/Tuesday before 12:00 MSK**: Last completed = W-2
- **Tuesday after 12:00 MSK through Sunday**: Last completed = W-1

This ensures we only recalculate weeks where WB data is guaranteed to be available.

---

## 8. COGS Coverage Calculation

### 8.1 Coverage Metrics DTO

```typescript
// cogs-coverage-metrics.dto.ts
export class CoverageMetricsDataDto {
  total_products: number;      // COUNT(ALL products)
  products_with_cogs: number;  // COUNT(WHERE cogs IS NOT NULL)
  products_without_cogs: number; // COUNT(WHERE cogs IS NULL)
  coverage_percent: number;    // products_with_cogs / total_products * 100
}
```

### 8.2 Coverage Formula

```
Coverage % = (products_with_cogs / total_products) * 100

Example:
  Total products: 57
  Products with COGS: 40
  Products without COGS: 17
  Coverage: (40 / 57) * 100 = 70.18%

Display: "COGS: 40 из 57 товаров (70%)"
```

### 8.3 Coverage Sources

Coverage is calculated from:

1. **Products Service**: Query products with/without current COGS
2. **Margin Calculation**: Track `productsWithCogs` vs `productsWithoutCogs` during calculation
3. **Weekly Margin Facts**: Aggregate from stored margin data

```typescript
// margin-calculation.service.ts:244-248
if (!hasRevenue) {
  productsExpenseOnly++;
} else if (cogs.unitCostRub !== null) {
  productsWithCogs++;
} else {
  productsWithoutCogs++;
}
```

### 8.4 Coverage by Period

Coverage metrics can be filtered by:
- Brand
- Category
- Time period (specific week or range)

---

## 9. Version Chain Management

### 9.1 Delete COGS (Story 5.3)

When deleting the **current** version:
1. Soft delete: `is_active = false`, `deleted_at`, `deleted_by`
2. Find previous version (same nm_id, valid_to = deleted.valid_from)
3. Reopen previous version: set `valid_to = NULL`
4. Trigger margin recalculation

```typescript
// cogs.service.ts:624-645
if (isCurrentVersion) {
  const previousVersion = await tx.cogs.findFirst({
    where: {
      nmId: cogs.nmId,
      validTo: cogs.validFrom,
      isActive: true,
    },
  });

  if (previousVersion) {
    await tx.cogs.update({
      where: { id: previousVersion.id },
      data: { validTo: null }, // Reopen
    });
    previousVersionReopened = true;
  }
}
```

### 9.2 Edit COGS (Story 5.2)

Edit updates the **existing record** (in-place):
- Only `unit_cost_rub` and `notes` can be changed
- Does NOT create new version
- Triggers margin recalculation for affected weeks

### 9.3 Update COGS (updateCogs)

Update creates a **new version** with temporal versioning:
- Requires `valid_from` after current version's `valid_from`
- Closes old version, creates new current version

---

## 10. Edge Cases and FAQ

### 10.1 Q: What if COGS is not assigned?

**A**: Products without COGS:
- `missing_data_reason: "COGS_NOT_ASSIGNED"`
- `margin_pct: null`
- `cogs: null`
- Still tracked in `weekly_margin_fact` with `unitCostRub = null`

### 10.2 Q: What if COGS is changed retroactively?

**A**: System automatically recalculates margin for all affected weeks from `valid_from` to last completed week. Historical data is updated to reflect the new COGS.

### 10.3 Q: What if I delete the current COGS?

**A**:
- Previous version becomes current (valid_to = NULL)
- If no previous version exists, product has no active COGS
- Margins show COGS_NOT_ASSIGNED

### 10.4 Q: Can I assign COGS for the future?

**A**: Yes, but margin will only be calculated when:
1. The date arrives
2. The week becomes "completed" (Epic 19)
3. Sales data exists for that week

### 10.5 Q: Why is margin the same for W45-W46 but different for W47?

**A**: Example: COGS changed 15.11 (Saturday W46)
- W46 midpoint = 13.11, `valid_from(15.11) > 13.11` → OLD COGS
- W47 midpoint = 20.11, `valid_from(15.11) <= 20.11` → NEW COGS

### 10.6 Q: How to ensure COGS applies to current week?

**A**: Set `valid_from` to Monday of the current week (or any day before Thursday). If you set it Friday-Sunday, it will only apply from next week.

### 10.7 Q: What timezone is used?

**A**: All week calculations use **Europe/Moscow** timezone (consistent with Epic 19).

---

## Related Documentation

| Document | Description |
|----------|-------------|
| `docs/BUSINESS-LOGIC-REFERENCE.md` (lines 145-256) | COGS Margin System overview |
| `frontend/docs/request-backend/29-cogs-temporal-versioning-and-margin-calculation.md` | Original temporal versioning guide |
| `docs/stories/epic-10/story-10.4-margin-profit-calculation.md` | Core formulas & temporal COGS |
| `docs/stories/epic-20/` | Automatic margin recalculation infrastructure |
| `docs/stories/epic-5/story-5.1-view-cogs-history.md` | View COGS history |
| `docs/stories/epic-5/story-5.2-edit-cogs.md` | Edit COGS |
| `docs/stories/epic-5/story-5.3-delete-cogs.md` | Delete COGS with soft delete |

---

## Source Files Reference

| File | Purpose |
|------|---------|
| `src/cogs/services/cogs.service.ts` | COGS CRUD, temporal versioning, bulk upload |
| `src/analytics/services/margin-calculation.service.ts` | Margin calculation with COGS lookup |
| `src/analytics/helpers/affected-weeks.helper.ts` | Calculate affected weeks for recalculation |
| `src/products/dto/cogs-coverage-metrics.dto.ts` | Coverage metrics DTO |
| `src/aggregation/iso-week.service.ts` | Week bounds and completed week logic |

---

**Created**: 2026-02-01
**Author**: Claude Code (Financial Logic Documentation Specialist)
**Status**: Active Technical Reference
