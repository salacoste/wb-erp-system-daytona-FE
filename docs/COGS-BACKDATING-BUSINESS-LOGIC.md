# COGS Backdating Business Logic

**Date:** 2025-11-23
**Topic:** What happens when you assign COGS with a past date (3 weeks ago)?
**Status:** ✅ Documented

---

## 🎯 Business Question

**User asks:** "Какая бизнес логика позади опции выбрать дату 3 недели назад и назначить себестоимость? Что тогда будет делать backend?"

**Translation:** What's the business logic behind choosing a date 3 weeks ago when assigning COGS? What will the backend do?

---

## 📊 High-Level Answer

When you assign COGS with a **past date** (e.g., 3 weeks ago):

1. ✅ **COGS record is created** with `valid_from` = 3 weeks ago
2. ✅ **Historic sales now have COGS data** for temporal margin calculation
3. ⚠️ **Existing weekly_margin_fact data is NOT automatically recalculated**
4. 📋 **Manual recalculation required** to update historic margin analytics

**Key Point:** The system uses **temporal versioning** - it can look up "what was the COGS on date X?" - but it doesn't automatically recalculate all past periods when you add retrospective COGS.

---

## 🔍 Detailed Explanation

### Scenario Example

**Today:** 2025-11-23 (Week 2025-W47)

**Action:** User assigns COGS to product "Краска для мебели" (nm_id: 321678606)
- Cost: 999.00 ₽
- **Date:** 2025-11-02 (3 weeks ago, Week 2025-W44)

---

### What Happens Step by Step

#### Step 1: COGS Record Created

**Database Table:** `cogs`

**New Record:**
```sql
INSERT INTO cogs (
  nm_id,
  sa_name,
  unit_cost_rub,
  valid_from,       -- 2025-11-02 (3 weeks ago!)
  valid_to,         -- NULL (current version)
  source,
  created_by,
  created_at,
  notes
) VALUES (
  '321678606',
  'Краска для мебели',
  999.00,
  '2025-11-02T00:00:00Z',  -- ✅ 3 weeks ago
  NULL,                    -- Current version
  'manual',
  'user_123',
  '2025-11-23T14:30:00Z',  -- Today (when user clicked save)
  'Первоначальная себестоимость'
);
```

**Key Fields:**
- `valid_from` = **2025-11-02** (effective date chosen by user)
- `created_at` = **2025-11-23** (technical timestamp when record was created)
- `valid_to` = **NULL** (this is the current active COGS)

**Result:** COGS is now "retroactively valid" starting from 2025-11-02.

---

#### Step 2: Temporal Lookup Works

**Concept:** When calculating margin for **any past date**, the system can find the correct COGS.

**SQL Query Example** (find COGS valid on 2025-11-10):
```sql
-- What was the COGS for product 321678606 on 2025-11-10?
SELECT *
FROM cogs
WHERE nm_id = '321678606'
  AND valid_from <= '2025-11-10'  -- COGS was valid at that time
  AND (valid_to IS NULL OR valid_to >= '2025-11-10')
ORDER BY valid_from DESC
LIMIT 1;

-- Result: 999.00 ₽ (from the COGS we just created)
```

**Use Case:** This allows the system to calculate **historical margins** using the correct cost data.

---

#### Step 3: Margin Calculation (On-Demand)

**Table:** `weekly_margin_fact` (pre-calculated weekly margin analytics)

**Current State (BEFORE adding retroactive COGS):**

| week | nm_id | revenue | cogs | margin_pct | missing_cogs_units |
|------|-------|---------|------|------------|-------------------|
| 2025-W44 | 321678606 | 5000.00 | 0.00 | 0% | 10 ❌ |
| 2025-W45 | 321678606 | 6000.00 | 0.00 | 0% | 12 ❌ |
| 2025-W46 | 321678606 | 7000.00 | 0.00 | 0% | 15 ❌ |
| 2025-W47 | 321678606 | No sales yet | — | — | — |

**Problem:** All past weeks show `missing_cogs_units` because COGS didn't exist when those weeks were calculated.

---

#### Step 4: What DOES NOT Happen Automatically ⚠️

**Backend does NOT:**
- ❌ Automatically recalculate `weekly_margin_fact` for weeks 2025-W44, W45, W46
- ❌ Trigger background job to update past periods
- ❌ Retroactively fix `missing_cogs_units` counters

**Reason:** Performance and design decision
- Recalculating ALL past periods after every COGS change would be expensive
- Users might upload 1000 products with retroactive COGS → would trigger 1000 recalculations
- Better to batch recalculate manually when needed

---

#### Step 5: What Users Need to Do (Manual Recalculation)

**Option A: Recalculate Specific Weeks (Frontend UI)**

**Frontend Implementation (Request #17 - 2025-01-27):**
- Warning alert appears in COGS assignment form when `valid_from` date is after last completed week
- Manual recalculation button triggers recalculation for specific week
- See: `docs/request-backend/17-cogs-assigned-after-completed-week-recalculation.md`

**API Endpoint (Manual):** `POST /v1/tasks/enqueue`
```json
{
  "task_type": "recalculate_weekly_margin",
  "payload": {
    "weeks": ["2025-W44", "2025-W45", "2025-W46"],
    "cabinet_id": "63e9ebc3-0203-4819-82ed-390f19f92e14"
  }
}
```

**Result:** Background job recalculates margin for specified weeks using the new COGS.

**Option B: Recalculate All Historical Data**

**Script:** `scripts/recalculate-direct.ts`
```bash
node scripts/recalculate-direct.ts <cabinet_id>
```

**Result:** Recalculates ALL weeks for the cabinet.

**Option C: Wait for Next Weekly Aggregation**

**Process:** Weekly aggregation job runs automatically (e.g., Monday morning)
- Picks up sales from previous week (2025-W47)
- Uses temporal COGS lookup → finds 999.00 ₽ for sales dated 2025-11-18 to 2025-11-24
- Creates `weekly_margin_fact` row for W47 with correct margin

**Timeline:**
- User assigns COGS: 2025-11-23 (Friday)
- Week ends: 2025-11-24 (Sunday)
- Aggregation runs: 2025-11-25 (Monday)
- **NEW margin data available** for week W47

---

## 💼 Real-World Business Scenarios

### Scenario 1: Late Invoice Received

**Situation:**
- You sold products in October (weeks W40-W43)
- Supplier sends invoice in late November
- Invoice dated: 2025-10-01

**Action:**
- Assign COGS with `valid_from` = 2025-10-01
- Trigger recalculation for weeks W40-W43
- Now you have **accurate historical margins**

**Business Value:**
- Financial reporting accuracy
- Tax compliance (COGS must match accounting period)
- Performance analysis (see which products were profitable in October)

---

### Scenario 2: Price Change Backdating

**Situation:**
- Supplier raised prices on 2025-11-01
- You forgot to update COGS in system
- Today is 2025-11-23

**Action:**
- **Old COGS:** 800.00 ₽ with `valid_from` = 2025-01-01
- **New COGS:** 999.00 ₽ with `valid_from` = 2025-11-01

**Backend Logic:**
```sql
-- Step 1: Close old version
UPDATE cogs
SET valid_to = '2025-11-01'
WHERE nm_id = '321678606' AND valid_to IS NULL;

-- Step 2: Create new version
INSERT INTO cogs (nm_id, valid_from, valid_to, unit_cost_rub)
VALUES ('321678606', '2025-11-01', NULL, 999.00);
```

**Timeline:**
```
Jan 1      Nov 1           Nov 23 (today)
├──────────┼───────────────┤
│  800 ₽   │   999 ₽       │
└──────────┴───────────────┘
 (closed)     (current)
```

**Margin Calculation:**
- Sales dated 2025-10-15 → uses COGS 800 ₽
- Sales dated 2025-11-05 → uses COGS 999 ₽
- Sales dated 2025-11-23 → uses COGS 999 ₽

---

### Scenario 3: Bulk Historical Upload

**Situation:**
- New seller onboarding
- Has 500 products with sales data from last 12 months
- Wants to upload all historical COGS at once

**Action:**
```json
POST /v1/cogs/bulk
{
  "items": [
    { "nm_id": "321678606", "unit_cost_rub": 999.00, "valid_from": "2025-01-01" },
    { "nm_id": "147205694", "unit_cost_rub": 500.00, "valid_from": "2025-01-01" },
    // ... 498 more items ...
  ]
}
```

**Backend Process:**
1. ✅ Creates 500 COGS records (all with `valid_from` = 2025-01-01)
2. ❌ Does NOT trigger 500 recalculations
3. 📋 User manually triggers: `POST /v1/tasks/enqueue { task_type: "recalculate_all_weeks" }`

**Timing:**
- COGS upload: ~5 seconds
- Recalculation: ~2-5 minutes (background job, non-blocking)

---

## 🏗️ Technical Architecture

### Temporal Versioning Table Structure

```sql
CREATE TABLE cogs (
  id UUID PRIMARY KEY,
  nm_id VARCHAR(50),
  sa_name VARCHAR(255),

  -- Temporal versioning fields
  valid_from TIMESTAMP NOT NULL,  -- Business effective date (user-chosen)
  valid_to TIMESTAMP NULL,        -- NULL = current version

  -- Cost data
  unit_cost_rub DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'RUB',

  -- Audit fields
  source VARCHAR(50),        -- 'manual', 'import', 'system'
  created_by VARCHAR(100),   -- User ID
  created_at TIMESTAMP,      -- Technical creation timestamp
  updated_at TIMESTAMP,
  notes TEXT,

  UNIQUE (nm_id, valid_from)  -- Prevents duplicate COGS for same date
);

-- Index for temporal lookup (critical for performance)
CREATE INDEX idx_cogs_temporal_lookup
ON cogs (nm_id, valid_from, valid_to);
```

---

### Margin Calculation Service (Pseudo-code)

```typescript
class MarginCalculationService {
  /**
   * Calculate margin for a specific week
   * Uses temporal COGS lookup for each sale
   */
  async calculateWeeklyMargin(week: string, cabinetId: string) {
    // 1. Get all sales for this week
    const sales = await this.getSalesForWeek(week, cabinetId);

    // 2. Group by product (nm_id)
    const revenueByProduct = this.groupByProduct(sales);

    // 3. For each product, lookup COGS valid at sale date
    const marginFacts = [];

    for (const [nmId, salesData] of revenueByProduct) {
      let totalCogs = 0;
      let missingCogsUnits = 0;

      // ✅ TEMPORAL LOOKUP: Find COGS valid at each sale date
      for (const sale of salesData.transactions) {
        const cogs = await this.findCogsAtDate(nmId, sale.sale_dt);

        if (cogs) {
          totalCogs += sale.qty * cogs.unit_cost_rub;
        } else {
          missingCogsUnits += sale.qty; // Track missing COGS
        }
      }

      // 4. Calculate margin
      const grossProfit = salesData.revenue - totalCogs;
      const marginPct = salesData.revenue > 0
        ? (grossProfit / salesData.revenue) * 100
        : 0;

      marginFacts.push({
        week,
        nm_id: nmId,
        revenue_net_rub: salesData.revenue,
        cogs_rub: totalCogs,
        gross_profit_rub: grossProfit,
        margin_percent: marginPct,
        missing_cogs_units: missingCogsUnits, // ⚠️ Shows data quality issue
      });
    }

    // 5. Store in weekly_margin_fact table
    await this.storeMarginFacts(marginFacts);
  }

  /**
   * Temporal COGS lookup
   * Finds COGS version valid at specific date
   */
  private async findCogsAtDate(nmId: string, saleDate: Date): Promise<Cogs | null> {
    return await this.prisma.cogs.findFirst({
      where: {
        nmId,
        validFrom: { lte: saleDate },      // COGS started before/on this date
        OR: [
          { validTo: null },                // Current version (no end date)
          { validTo: { gte: saleDate } },   // Old version that was still valid
        ],
      },
      orderBy: { validFrom: 'desc' },      // Most recent version
    });
  }
}
```

---

## 📋 Workflow Summary

### When User Assigns Retroactive COGS

**Step 1: User Action (Frontend)**
```
User opens: /cogs page
Selects: Product "Краска для мебели" (321678606)
Enters:
  - Cost: 999.00 ₽
  - Date: 02.11.2025 (3 weeks ago)
  - Notes: "Первоначальная себестоимость"
Clicks: "Назначить себестоимость"
```

**Step 2: API Call**
```
POST /v1/products/321678606/cogs
{
  "unit_cost_rub": 999.00,
  "valid_from": "2025-11-02",
  "source": "manual",
  "notes": "Первоначальная себестоимость"
}
```

**Step 3: Backend Processing**
```typescript
// CogsService.createCogs()
1. Check if COGS exists for (nm_id=321678606, valid_from=2025-11-02)
   → Not found
2. Create new COGS record
   → valid_from = 2025-11-02
   → valid_to = NULL (current version)
   → created_at = NOW() (2025-11-23)
3. Return success response
```

**Step 4: Frontend Updates**
```typescript
// SingleCogsForm.tsx onSuccess callback
1. Show success toast: "Себестоимость назначена успешно"
2. Reset form with saved values
3. Invalidate React Query caches
   → ['products'] - product list refreshes
   → ['products', '321678606'] - single product refreshes
   → ['analytics'] - analytics queries refresh (will show NEW margin for current week)
```

**Step 5: What User Sees**
- ✅ Form shows saved COGS: 999.00 ₽ with date 02.11.2025
- ✅ Product list shows "has_cogs" badge
- ✅ Current week margin (W47) will use this COGS
- ⚠️ **OLD weeks (W44, W45, W46) still show missing COGS** until manual recalculation

---

## 🎯 Key Takeaways

### What Backend DOES Automatically ✅

1. ✅ **Stores COGS with retroactive date** (`valid_from` = 3 weeks ago)
2. ✅ **Temporal lookup works** - can find COGS for any past date
3. ✅ **Future calculations use correct COGS** - next weekly aggregation will work correctly
4. ✅ **Current week margin updates** - Epic 17 analytics recalculates on query

### What Backend DOES NOT Do Automatically ❌

1. ❌ **Recalculate past weeks** - `weekly_margin_fact` rows for W44, W45, W46 remain unchanged
2. ❌ **Trigger background jobs** - no automatic job to update historic data
3. ❌ **Fix missing_cogs_units counters** - old analytics still show "missing COGS"

### What User Should Do 📋

**If historical accuracy is important:**
```bash
# Option 1: Trigger recalculation via API
curl -X POST http://localhost:3000/v1/tasks/enqueue \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID" \
  -d '{
    "task_type": "recalculate_weekly_margin",
    "payload": {
      "weeks": ["2025-W44", "2025-W45", "2025-W46"]
    }
  }'

# Option 2: Run recalculation script
node scripts/recalculate-direct.ts <cabinet_id>
```

**If only current data matters:**
- ✅ No action needed! Next week's aggregation will work correctly.

---

## 📊 Comparison: With vs Without Recalculation

### Scenario: COGS assigned with valid_from = 2025-11-02 (3 weeks ago)

**Without Manual Recalculation:**

| Week | Revenue | COGS | Margin | Missing COGS | Status |
|------|---------|------|--------|-------------|--------|
| W44 | 5000 ₽ | 0 ₽ | 0% | 10 units | ❌ Incorrect |
| W45 | 6000 ₽ | 0 ₽ | 0% | 12 units | ❌ Incorrect |
| W46 | 7000 ₽ | 0 ₽ | 0% | 15 units | ❌ Incorrect |
| W47 | 8000 ₽ | 7992 ₽ | 0.1% | 0 units | ✅ Correct (new) |

**With Manual Recalculation:**

| Week | Revenue | COGS | Margin | Missing COGS | Status |
|------|---------|------|--------|-------------|--------|
| W44 | 5000 ₽ | 9990 ₽ | -99.8% | 0 units | ✅ Correct |
| W45 | 6000 ₽ | 11988 ₽ | -99.8% | 0 units | ✅ Correct |
| W46 | 7000 ₽ | 14985 ₽ | -114.1% | 0 units | ✅ Correct |
| W47 | 8000 ₽ | 7992 ₽ | 0.1% | 0 units | ✅ Correct |

**Insight:** Product was UNPROFITABLE for 3 weeks! This information is only visible after recalculation.

---

## 🔗 Related Documentation

**Technical Specs:**
- Story 10.4: `docs/stories/epic-10/story-10.4-margin-profit-calculation.md`
- Epic 17: Weekly margin analytics with temporal COGS
- Epic 18: Products API with margin integration

**Backend Code:**
- COGS Service: `src/cogs/services/cogs.service.ts`
- Margin Calculation: `src/analytics/services/margin-calculation.service.ts`
- Temporal Lookup: Uses `valid_from`/`valid_to` indexes

**Database Schema:**
- COGS table: `prisma/schema.prisma:387-419`
- Weekly Margin Fact: `prisma/schema.prisma:421-460`

**Frontend Docs:**
- COGS History: `frontend/docs/COGS-HISTORY-AND-NOTES-EXPLANATION.md`
- Date Bug Fix: `frontend/docs/BUG-FIX-DATE-INPUT-RESET.md`

---

## ✅ Summary

**Question:** What happens when you assign COGS with a date 3 weeks ago?

**Answer:**
1. ✅ COGS record created with retroactive `valid_from` date
2. ✅ Temporal lookup works - system can find "COGS on date X"
3. ✅ Future margin calculations use correct COGS
4. ⚠️ Historic margin analytics NOT automatically recalculated
5. 📋 Manual recalculation needed for historical accuracy

**Business Value:**
- Supports late invoice entry
- Enables price change backdating
- Maintains financial reporting accuracy
- Provides complete cost history

**User Responsibility:**
- If historic data matters → trigger manual recalculation
- If only current data matters → no action needed

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Status:** ✅ Complete
**Complexity:** Advanced (Temporal Versioning)
