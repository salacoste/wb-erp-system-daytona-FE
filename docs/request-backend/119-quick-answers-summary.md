# Quick Answers - FrontEnd Team Questions (2026-01-30)

## TL;DR

**All 4 questions have the same root cause: `weekly_margin_fact` table is EMPTY for weeks 2026-W03/W04**

---

## Question 1: Missing weekly_margin_fact Data?

**Answer**: YES - Table is empty. Query returns 0 rows → `products_total = 0` → API returns `null`.

**SQL Check**:
```sql
SELECT COUNT(*) FROM weekly_margin_fact
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'::uuid
  AND week IN ('2026-W03', '2026-W04');
```
**Expected**: 0 rows

---

## Question 2: Does MarginRecalculationTask Need Force-Execution?

**Answer**: YES - COGS upload does NOT trigger margin calculation. Manual trigger required.

**API Call**:
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

**Prerequisite**: Sales data must exist in `wb_finance_raw` table.

---

## Question 3: COGS valid_from Date Mismatch?

**Answer**: YES - If `valid_from = Feb 1, 2026`, it will NOT apply to Jan weeks.

| Week | Midpoint | Feb 1 COGS |
|------|----------|-----------|
| 2026-W03 | Jan 15 | ❌ Feb 1 > Jan 15 |
| 2026-W04 | Jan 22 | ❌ Feb 1 > Jan 22 |
| 2026-W06 | Feb 5 | ✅ Feb 1 ≤ Feb 5 |

**Fix**: Re-upload with `valid_from = "2025-12-29"` (start of W01).

---

## Question 4: NULL vs Zero Distinction?

**Answer**: YES - Service distinguishes:

| Value | Meaning |
|-------|---------|
| `null` | No margin records exist (table empty) |
| `0` | Records exist, but 0 products have COGS |

**Current**: API returns `null` → means no calculation run yet.

**After Fix**: Will return `0` if products have no COGS, or actual % if some do.

---

## Action Items

| Step | Action | Command/Query |
|------|--------|--------------|
| 1 | Verify `weekly_margin_fact` is empty | `SELECT COUNT(*) FROM weekly_margin_fact WHERE week IN ('2026-W03', '2026-W04')` |
| 2 | Check COGS `valid_from` dates | `SELECT nm_id, valid_from FROM cogs ORDER BY valid_from DESC LIMIT 20` |
| 3 | Fix COGS dates (if Feb 1) | Re-upload with `valid_from: "2025-12-29"` |
| 4 | Trigger margin calculation | `POST /v1/tasks/enqueue` with `recalculate_weekly_margin` |
| 5 | Verify fix | `GET /v1/analytics/weekly/finance-summary?week=2026-W03` |

---

## Code References

| Component | File | Lines |
|-----------|------|-------|
| Finance Summary | `weekly-analytics.service.ts` | 176-267 |
| Margin Calculation | `margin-calculation.service.ts` | 126-282 |
| COGS Temporal Lookup | `cogs.service.ts` | 320-337 |
| Bulk Upload | `cogs.service.ts` | 416-470 |

---

## Key Insight

**COGS upload alone is NOT enough**. Margin calculation requires:
1. ✅ COGS data (in `cogs` table)
2. ✅ Sales data (in `wb_finance_raw` table)
3. ✅ Margin calculation task executed

**Only #3 is missing** - trigger it manually or import sales data.
