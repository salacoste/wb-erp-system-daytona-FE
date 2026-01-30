# Backend Investigation: Margin Calculation & COGS System

## Summary of Findings

This document answers the FrontEnd team's questions about weekly_margin_fact population, COGS validity dates, cabinet isolation, and margin recalculation triggers.

---

## Question 1: Is weekly_margin_fact table being populated?

**Answer: Currently EMPTY - Not being populated automatically**

### Evidence

1. **Population Trigger** (`src/imports/imports.service.ts:661-689`):
   ```typescript
   // Story 17.1: Trigger margin calculation after aggregation
   if (aggregationResults.length > 0) {
     const weeks = aggregationResults.map((result) => result.week);
     for (const week of weeks) {
       await this.marginCalculation.calculateWeeklyMargin(week, importRecord.cabinetId);
     }
   }
   ```

2. **Data Requirement** (`src/analytics/services/margin-calculation.service.ts:303-325`):
   - Margin calculation queries `wb_finance_raw` table for sales data
   - Only weeks with sales data (`docType IN ('sale', 'return')`) are populated
   - No sales data → empty result → weekly_margin_fact not populated

3. **Root Cause**:
   - `weekly_margin_fact` is populated **only during import pipeline**
   - Requires: `wb_finance_raw` sales transactions exist for the week
   - If no imports have been run, table remains empty
   - COGS upload alone does NOT trigger margin calculation

### For Weeks 2026-W01 through 2026-W05

**Status**: NOT populated unless weekly finance reports have been imported via:
- `POST /v1/finances/weekly/upload` (Excel upload)
- `finances_weekly_ingest` task (WB API automatic download)

---

## Question 2: COGS valid_from Date Validity Check

**Answer: Feb 1st, 2026 COGS will NOT apply to Jan 2026 weeks**

### Temporal COGS Lookup Logic (`src/cogs/services/cogs.service.ts:320-337`)

```typescript
async findFogsAtDate(nmId: string, validAt: Date): Promise<Cogs | null> {
  const cogs = await this.prisma.cogs.findFirst({
    where: {
      nmId,
      isActive: true,
      validFrom: { lte: validAt },              // COGS valid_from must be ≤ lookup date
      OR: [
        { validTo: null },                        // Current version
        { validTo: { gt: validAt } },            // Historical version still valid
      ],
    },
    orderBy: { validFrom: 'desc' },
  });
  return cogs;
}
```

### Margin Calculation Lookup (`src/analytics/services/margin-calculation.service.ts:514-519`)

```typescript
// Use midpoint of week for COGS lookup
const midpoint = new Date((start.getTime() + end.getTime()) / 2);

for (const revenue of revenues) {
  // Find COGS valid at week midpoint
  const cogs = await this.cogsService.findFogsAtDate(revenue.nmId, midpoint);
  // ...
}
```

### Date Examples

| Week | Week Range | Midpoint | COGS valid_from | Result |
|------|------------|----------|-----------------|--------|
| 2026-W01 | Dec 29, 2025 - Jan 4, 2026 | Jan 1, 2026 | Feb 1, 2026 | ❌ No COGS (Feb 1 > Jan 1) |
| 2026-W02 | Jan 5 - Jan 11, 2026 | Jan 8, 2026 | Feb 1, 2026 | ❌ No COGS (Feb 1 > Jan 8) |
| 2026-W04 | Jan 19 - Jan 25, 2026 | Jan 22, 2026 | Feb 1, 2026 | ❌ No COGS (Feb 1 > Jan 22) |
| 2026-W05 | Jan 26 - Feb 1, 2026 | Jan 29, 2026 | Feb 1, 2026 | ❌ No COGS (Feb 1 > Jan 29) |
| 2026-W06 | Feb 2 - Feb 8, 2026 | Feb 5, 2026 | Feb 1, 2026 | ✅ COGS found (Feb 1 ≤ Feb 5) |

**Key Finding**: If COGS valid_from = Feb 1st, 2026, it will only apply to weeks starting Feb 2nd or later. January 2026 weeks will show `COGS_NOT_ASSIGNED`.

**Recommendation**: When uploading COGS, set `valid_from` to the **earliest week** where the cost applies. For backfilled COGS, use dates like `2025-12-29` (start of W01) instead of future dates.

---

## Question 3: Cabinet Isolation Verification

**Answer: COGS records are cabinet-isolated by unique constraint**

### Cabinet Isolation Implementation

1. **Unique Constraint** (`prisma/schema.prisma`):
   ```prisma
   model Cogs {
     id               String   @id @default(uuid())
     cabinetId        String   @db.Uuid
     nmId             String
     validFrom        DateTime @db.Date

     @@unique([cabinetId, nmId, validFrom], name: "idx_cogs_cabinet_nm_id_valid_from")
   }
   ```

2. **CabinetId Required** (`src/cogs/services/cogs.service.ts:112-114`):
   ```typescript
   if (!cabinetId) {
     throw new Error('cabinetId is required for creating COGS (Epic 32)');
   }
   ```

3. **All Queries Filter by CabinetId** (`src/cogs/services/cogs.service.ts`):
   - Line 119-127: Existing COGS check uses `(cabinetId, nmId, validFrom)`
   - Line 153-160: Current version lookup filters by cabinetId
   - Line 506-510: Soft delete validates cabinetId ownership
   - Line 732: Edit COGS validates cabinetId matches

### For Cabinet ID `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`

**Status**: All COGS operations are isolated by cabinetId.

**Verification Query** (if database access is available):
```sql
SELECT nm_id, valid_from, unit_cost_rub, cabinet_id
FROM cogs
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'::uuid
ORDER BY valid_from DESC;
```

**Note**: The FrontEnd must include `cabinetId` in all COGS requests (from JWT claims). COGS created without cabinetId will be rejected with an error.

---

## Question 4: Margin Recalculation Trigger Requirements

**Answer: Automatic for edit/delete, MANUAL for bulk upload**

### Automatic Triggers

1. **After COGS Deletion** (`src/cogs/services/cogs.service.ts:562-569`):
   ```typescript
   if (affectedWeeks.length > 0) {
     taskUuid = await this.enqueueMarginRecalculationForDelete(cabinetId, cogs.nmId, affectedWeeks);
     marginTriggered = true;
   }
   ```

2. **After COGS Edit** (`src/cogs/services/cogs.service.ts:768-771`):
   ```typescript
   if (affectedWeeks.length > 0) {
     taskUuid = await this.enqueueMarginRecalculationForEdit(cabinetId, updatedCogs.nmId, affectedWeeks);
     marginTriggered = true;
   }
   ```

### NOT Automatic: Bulk Upload

**Issue** (`src/cogs/services/cogs.service.ts:416-470`):
```typescript
async bulkUpload(items: CreateCogsDto[], userId: string, cabinetId: string): Promise<BulkUploadResult> {
  // ... COGS created/updated ...
  // NO margin recalculation triggered here!
  return result;
}
```

### Manual Trigger Required After Bulk Upload

**Option 1: Direct API Call**
```
POST /v1/tasks/enqueue
{
  "task_type": "recalculate_weekly_margin",
  "cabinet_id": "f75836f7-c0bc-4b2c-823c-a1f3508cce8e",
  "payload": {
    "weeks": ["2026-W01", "2026-W02", "2026-W03", "2026-W04", "2026-W05"]
  }
}
```

**Option 2: Background Task** (`src/queue/processors/margin-calculation.processor.ts:94-156`)
- Task processed by BullMQ worker
- Calls `calculateWeeklyMargin()` for each week
- Upserts `weekly_margin_fact` table

**Option 3: Backfill API** (if exists)
- Check for `/v1/analytics/weekly/backfill` endpoint
- May accept date range to calculate margin for multiple weeks

---

## Summary & Recommendations

| Question | Finding | Action Needed |
|----------|---------|---------------|
| weekly_margin_fact populated? | **NO** - Table is empty | Trigger margin calculation for weeks 2026-W01 to 2026-W05 |
| COGS valid_from = Feb 1 applies to Jan? | **NO** - Temporal lookup fails | Set valid_from to `2025-12-29` (start of W01) instead of Feb 1st |
| Cabinet isolation working? | **YES** - All operations filter by cabinetId | Verify COGS records exist for cabinet `f75836f7...` |
| Auto-recalc after bulk upload? | **NO** - Manual trigger required | Call `/v1/tasks/enqueue` with `recalculate_weekly_margin` task |

### Recommended Action Plan

1. **Fix COGS Dates**: Re-upload COGS with `valid_from = 2025-12-29` (start of first week)
2. **Trigger Margin Calculation**: Enqueue task for weeks 2026-W01 through 2026-W05
3. **Verify Data**: Query `weekly_margin_fact` to confirm records created
4. **Consider Enhancement**: Add automatic margin recalculation to `bulkUpload()` method (future Epic)

---

## References

- `src/analytics/services/margin-calculation.service.ts` - Core margin calculation logic
- `src/cogs/services/cogs.service.ts` - COGS CRUD with temporal versioning
- `src/queue/processors/margin-calculation.processor.ts` - Background worker
- `src/imports/imports.service.ts` - Import pipeline with margin trigger
- `docs/stories/epic-20/story-20.3-background-worker.md` - Margin recalculation worker
- `docs/stories/epic-10/story-10.4-margin-profit-calculation.md` - Margin formulas
