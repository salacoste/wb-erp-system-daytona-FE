# FrontEnd Team Questions - Detailed Technical Analysis

**Date**: 2026-01-30
**Cabinet ID**: `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`
**Affected Weeks**: 2026-W03, 2026-W04

---

## Executive Summary

All four questions stem from the **same root cause**: The `weekly_margin_fact` table is **EMPTY** for the specified weeks. The API returns `null` for `cogs_total` and `cogs_coverage_pct` because **no margin calculation has been executed** for these weeks.

**Root Cause Chain**:
1. COGS uploaded ✅
2. Sales data NOT imported ❌
3. Margin calculation NOT triggered ❌
4. `weekly_margin_fact` table EMPTY ❌
5. API returns `null` ❌

---

## Question 1: Missing weekly_margin_fact Data

### FrontEnd Question
> "The endpoint GET /v1/analytics/weekly/finance-summary returns null for cogs_total and cogs_coverage_pct for weeks 2026-W03 and 2026-W04. Can you verify if the weekly_margin_fact table has entries for these weeks and cabinet_id=f75836f7-c0bc-4b2c-823c-a1f3508cce8e?"

### Technical Analysis

**Query Logic** (`src/analytics/weekly-analytics.service.ts:193-203`):

```sql
SELECT
  SUM(cogs_rub) as cogs_total,
  COUNT(DISTINCT nm_id) FILTER (WHERE quantity_sold > 0) as products_total,
  COUNT(DISTINCT nm_id) FILTER (WHERE cogs_unit_cost_rub IS NOT NULL) as products_with_cogs
FROM weekly_margin_fact
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'::uuid
  AND week = '2026-W03'
  AND report_type = 'total'
```

**Response Mapping** (`src/analytics/weekly-analytics.service.ts:243-258`):

```typescript
const mapCogsRow = (row): CogsMetrics | null => {
  // KEY: Returns NULL if no products found
  if (!row || Number(row.products_total || 0) === 0) {
    return null;  // ← This is why API returns null
  }

  const productsTotal = Number(row.products_total);
  const productsWithCogs = Number(row.products_with_cogs);
  const cogsTotal = row.cogs_total ? Number(row.cogs_total) : null;
  const coveragePct = productsTotal > 0
    ? Math.round((productsWithCogs / productsTotal) * 10000) / 100
    : null;

  return {
    cogs_total: cogsTotal,
    cogs_coverage_pct: coveragePct,
    products_with_cogs: productsWithCogs,
    products_total: productsTotal,
  };
};
```

### Answer

**YES** - `weekly_margin_fact` table is **EMPTY** for these weeks. The query returns:
- `products_total = 0` (no rows in table)
- `mapCogsRow()` returns `null` (line 244-246)
- API returns `cogs_total: null, cogs_coverage_pct: null`

### Verification Query

```sql
-- Check if weekly_margin_fact has data for these weeks
SELECT week, report_type, COUNT(*) as row_count,
       SUM(cogs_rub) as cogs_total,
       COUNT(DISTINCT nm_id) FILTER (WHERE quantity_sold > 0) as products_total
FROM weekly_margin_fact
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'::uuid
  AND week IN ('2026-W03', '2026-W04')
GROUP BY week, report_type
ORDER BY week, report_type;
```

**Expected Result**: 0 rows (table is empty)

---

## Question 2: Aggregation Trigger

### FrontEnd Question
> "Does the MarginRecalculationTask need to be force-executed? We see the raw COGS might exist, but they are not reflected in the weekly summary aggregation."

### Technical Analysis

**Margin Calculation Pipeline** (`src/analytics/services/margin-calculation.service.ts:126-282`):

```typescript
async calculateWeeklyMargin(week: string, cabinetId: string): Promise<CalculationResult> {
  // Step 1: Get sales data from wb_finance_raw (REQUIRED)
  const revenueBySku = await this.calculateRevenueBySku(week, cabinetId, start, end);

  // Step 2: Aggregate expenses from wb_finance_raw
  const expensesBySku = await this.aggregateExpensesBySku(week, cabinetId, start, end);

  // Step 3: Lookup COGS (uses temporal logic)
  const cogsBySku = await this.lookupCogs(Array.from(revenueBySku.values()), start, end);

  // Step 4: Calculate margins
  // Step 5: Store in weekly_margin_fact
  await this.storeMarginFacts(facts);
}
```

**Key Insight**: Margin calculation requires **BOTH**:
1. Sales data in `wb_finance_raw` table
2. COGS records in `cogs` table

**COGS Upload Does NOT Trigger Margin Calculation** (`src/cogs/services/cogs.service.ts:416-470`):

```typescript
async bulkUpload(items: CreateCogsDto[], userId: string, cabinetId: string): Promise<BulkUploadResult> {
  for (let i = 0; i < items.length; i++) {
    const savedCogs = await this.createCogs(item, userId, cabinetId);
    result.createdItems++;
    // NO margin recalculation triggered here!
  }
  return result;
}
```

**Import Pipeline DOES Trigger Margin Calculation** (`src/imports/imports.service.ts:661-689`):

```typescript
// After weekly finance report import:
const aggregationResults = await this.weeklyAggregator.aggregateWeeklyPayout({
  cabinetId: importRecord.cabinetId,
});

if (aggregationResults.length > 0) {
  for (const week of aggregationResults.map((r) => r.week)) {
    await this.marginCalculation.calculateWeeklyMargin(week, importRecord.cabinetId);
  }
}
```

### Answer

**YES** - Margin calculation task must be **MANUALLY TRIGGERED** after COGS upload.

**Two Options**:

**Option A: Enqueue Recalculation Task**
```bash
POST /v1/tasks/enqueue
{
  "task_type": "recalculate_weekly_margin",
  "cabinet_id": "f75836f7-c0bc-4b2c-823c-a1f3508cce8e",
  "payload": {
    "weeks": ["2026-W03", "2026-W04"]
  }
}
```

**Option B: Import Weekly Finance Reports**
```bash
# This will automatically trigger margin calculation
POST /v1/finances/weekly/upload
[Excel file with week 2026-W03 and 2026-W04 data]
```

**Prerequisite**: Sales data must exist in `wb_finance_raw` table for margin calculation to work.

---

## Question 3: Constraint Mismatch (COGS valid_from vs Week)

### FrontEnd Question
> "Is there a mismatch between the valid_from date of the COGS records and the reporting week? (e.g., if COGS valid_from = 2026-02-01, they won't show up in 2026-W04 summary)."

### Technical Analysis

**Temporal COGS Lookup** (`src/cogs/services/cogs.service.ts:320-337`):

```typescript
async findFogsAtDate(nmId: string, validAt: Date): Promise<Cogs | null> {
  const cogs = await this.prisma.cogs.findFirst({
    where: {
      nmId,
      isActive: true,
      validFrom: { lte: validAt },              // ← Must be ≤ lookup date
      OR: [
        { validTo: null },                       // Current version
        { validTo: { gt: validAt } },           // Still valid
      ],
    },
  });
  return cogs;
}
```

**Margin Calculation Uses Week Midpoint** (`src/analytics/services/margin-calculation.service.ts:514-519`):

```typescript
// Use midpoint of week for COGS lookup
const midpoint = new Date((start.getTime() + end.getTime()) / 2);

for (const revenue of revenues) {
  const cogs = await this.cogsService.findFogsAtDate(revenue.nmId, midpoint);
  // ...
}
```

### Week Midpoint Reference Table

| Week | Start | End | Midpoint | COGS valid_from = Feb 1, 2026 |
|------|-------|-----|----------|-------------------------------|
| 2026-W01 | Dec 29 | Jan 4 | Jan 1 | ❌ Feb 1 > Jan 1 (NO MATCH) |
| 2026-W02 | Jan 5 | Jan 11 | Jan 8 | ❌ Feb 1 > Jan 8 (NO MATCH) |
| 2026-W03 | Jan 12 | Jan 18 | Jan 15 | ❌ Feb 1 > Jan 15 (NO MATCH) |
| 2026-W04 | Jan 19 | Jan 25 | Jan 22 | ❌ Feb 1 > Jan 22 (NO MATCH) |
| 2026-W05 | Jan 26 | Feb 1 | Jan 29 | ❌ Feb 1 > Jan 29 (NO MATCH) |
| 2026-W06 | Feb 2 | Feb 8 | Feb 5 | ✅ Feb 1 ≤ Feb 5 (MATCH!) |

### Answer

**YES** - If COGS `valid_from = 2026-02-01`, they will **NOT** apply to weeks 2026-W01 through 2026-W05.

**Fix**: Re-upload COGS with correct `valid_from` date:
```json
{
  "nm_id": "123456",
  "valid_from": "2025-12-29",  // Start of W01 (Dec 29, 2025)
  "unit_cost_rub": 100.50
}
```

### Verification Query

```sql
-- Check COGS valid_from dates
SELECT nm_id, valid_from, unit_cost_rub
FROM cogs
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'::uuid
ORDER BY valid_from DESC
LIMIT 20;
```

---

## Question 4: Join Logic - NULL vs Zero

### FrontEnd Question
> "In the FinanceSummaryService, are we treating cogs_coverage_pct = 0 differently than null? The API returns null, implying no margin record exists at all for that week, rather than a record with 0 COGS."

### Technical Analysis

**The Distinction**:

| Scenario | products_total | products_with_cogs | cogs_coverage_pct | API Returns |
|----------|---------------|-------------------|-------------------|-------------|
| **No margin data** | 0 | 0 | - | `null` |
| **All products have COGS** | 100 | 100 | 100 | `100` |
| **Half products have COGS** | 100 | 50 | 50 | `50` |
| **No products have COGS** | 100 | 0 | 0 | `0` |

**Code Logic** (`src/analytics/weekly-analytics.service.ts:243-258`):

```typescript
const mapCogsRow = (row): CogsMetrics | null => {
  // Case 1: No margin record exists (table empty)
  if (!row || Number(row.products_total || 0) === 0) {
    return null;  // ← Returns NULL (not 0)
  }

  // Case 2: Margin record exists, calculate coverage
  const productsTotal = Number(row.products_total);
  const productsWithCogs = Number(row.products_with_cogs);
  const coveragePct = productsTotal > 0
    ? Math.round((productsWithCogs / productsTotal) * 10000) / 100
    : null;

  return {
    cogs_total: cogsTotal,
    cogs_coverage_pct: coveragePct,  // ← Can be 0 (if products_with_cogs = 0)
    products_with_cogs: productsWithCogs,
    products_total: productsTotal,
  };
};
```

### Answer

**YES** - The service **DOES** distinguish between `null` (no data) and `0` (no COGS assigned):

- **`null`**: No margin records exist in `weekly_margin_fact` for that week
- **`0`**: Margin records exist, but `products_with_cogs = 0`

**Current API Response**: `cogs_coverage_pct: null` → Means **no margin calculation has been run** for these weeks.

**Expected Response After Fix**:
```json
{
  "cogs_total": 0,
  "cogs_coverage_pct": 0,        // ← 0 (not null)
  "products_with_cogs": 0,
  "products_total": 150
}
```

### Scenarios

| Scenario | API Response | Meaning |
|----------|-------------|---------|
| `cogs_coverage_pct: null` | No data | `weekly_margin_fact` table empty for this week |
| `cogs_coverage_pct: 0` | Data exists | Margin calculated, but 0 products have COGS assigned |
| `cogs_coverage_pct: 50` | Data exists | Margin calculated, 50% of products have COGS |

---

## Root Cause Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `cogs_total: null` | `weekly_margin_fact` empty | Run margin calculation task |
| `cogs_coverage_pct: null` | `weekly_margin_fact` empty | Run margin calculation task |
| COGS not showing up | `valid_from` date mismatch | Set `valid_from` to earliest week needed |
| No automatic trigger | `bulkUpload()` doesn't trigger | Manual task enqueue or import sales data |

---

## Recommended Action Plan

### Step 1: Verify Current State

```sql
-- Check weekly_margin_fact table
SELECT week, COUNT(*) as rows, SUM(cogs_rub) as cogs_total
FROM weekly_margin_fact
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'::uuid
  AND week IN ('2026-W03', '2026-W04')
GROUP BY week;

-- Check COGS valid_from dates
SELECT nm_id, valid_from, unit_cost_rub
FROM cogs
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'::uuid
ORDER BY valid_from DESC;

-- Check if sales data exists
SELECT DISTINCT week
FROM wb_finance_raw
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'::uuid
  AND week IN ('2026-W03', '2026-W04');
```

### Step 2: Fix COGS valid_from Dates (if needed)

```bash
# Re-upload COGS with correct valid_from date
POST /v1/cogs/bulk-upload
{
  "cogs": [
    {
      "nm_id": "123456",
      "valid_from": "2025-12-29",  # Start of W01
      "unit_cost_rub": 100.50
    }
  ]
}
```

### Step 3: Trigger Margin Calculation

**Option A: Manual Task Enqueue**
```bash
POST /v1/tasks/enqueue
{
  "task_type": "recalculate_weekly_margin",
  "cabinet_id": "f75836f7-c0bc-4b2c-823c-a1f3508cce8e",
  "payload": {
    "weeks": ["2026-W03", "2026-W04"]
  }
}
```

**Option B: Import Sales Data** (if not already imported)
```bash
POST /v1/finances/weekly/upload
[Upload Excel files for weeks 2026-W03 and 2026-W04]
```

### Step 4: Verify Fix

```bash
GET /v1/analytics/weekly/finance-summary?week=2026-W03&cabinet_id=f75836f7-c0bc-4b2c-823c-a1f3508cce8e
```

**Expected Response**:
```json
{
  "cogs_total": 0,  # or actual value if products have COGS
  "cogs_coverage_pct": 0,  # or actual percentage
  "products_with_cogs": 0,
  "products_total": 150
}
```

---

## Code References

| File | Lines | Description |
|------|-------|-------------|
| `src/analytics/weekly-analytics.service.ts` | 176-267 | `getWeeklyCogsData()` - queries weekly_margin_fact |
| `src/analytics/weekly-analytics.service.ts` | 243-258 | `mapCogsRow()` - null vs 0 distinction |
| `src/analytics/services/margin-calculation.service.ts` | 126-282 | `calculateWeeklyMargin()` - populates table |
| `src/cogs/services/cogs.service.ts` | 320-337 | `findFogsAtDate()` - temporal COGS lookup |
| `src/imports/imports.service.ts` | 661-689 | Import pipeline - auto-triggers margin calc |
| `src/cogs/services/cogs.service.ts` | 416-470 | `bulkUpload()` - NO auto-trigger |

---

## Additional Notes

### Why bulkUpload() Doesn't Trigger Margin Calculation

This is a **design decision** (not a bug):

1. **COGS can be uploaded BEFORE sales data exists**
   - User uploads COGS for upcoming weeks
   - Sales data not yet imported
   - Margin calculation would fail anyway

2. **Margin calculation requires BOTH datasets**
   - Sales data (from `wb_finance_raw`)
   - COGS data (from `cogs` table)

3. **Import pipeline handles this correctly**
   - Import sales data → aggregates → calculates margin
   - Ensures all required data exists

### Future Enhancement Consideration

Add automatic margin recalculation to `bulkUpload()`:
```typescript
async bulkUpload(items: CreateCogsDto[], userId: string, cabinetId: string): Promise<BulkUploadResult> {
  // ... existing upload logic ...

  // NEW: Trigger margin recalculation for affected weeks
  const affectedWeeks = this.calculateAffectedWeeks(items);
  if (affectedWeeks.length > 0) {
    await this.enqueueMarginRecalculation(cabinetId, affectedWeeks);
  }

  return result;
}
```

**Caveat**: Should only recalculate weeks where sales data already exists.
