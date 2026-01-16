# Backend Response: Request #27 - COGS History & Advanced Analytics

**Date**: 2025-11-26 (Updated: 2025-11-26)
**From**: Backend Team
**To**: Frontend Team (PO Sarah)
**Status**: ✅ **PARTIALLY IMPLEMENTED** - Stories 5.1, 6.1, 6.3 DONE

---

## Executive Summary

**Great news!** Sprint 1 is complete! Stories 5.1, 6.1, and 6.3 are now **implemented and deployed**.

### ✅ What's Available NOW for Frontend

| Story | Feature | Status | Endpoint |
|-------|---------|--------|----------|
| **5.1** | COGS History | ✅ DONE | `GET /v1/cogs/history?nm_id=...` |
| **6.1** | Date Range Analytics | ✅ DONE | `?weekStart=...&weekEnd=...` |
| **6.3** | ROI & Profit Metrics | ✅ DONE | `roi`, `profit_per_unit` fields |

### 📋 Remaining Stories (Not Yet Implemented)

| Story | Feature | Status |
|-------|---------|--------|
| 5.2 | Edit COGS | 📋 Planned |
| 5.3 | Delete COGS | 📋 Planned |
| 6.2 | Period Comparison | 📋 Planned |
| 6.4 | Cabinet Dashboard | 📋 Planned |
| 6.5 | Export to CSV/Excel | 📋 Planned |

**Remaining Effort**: ~12-15 days (Stories 5.2, 5.3, 6.2, 6.4, 6.5)

---

## Part 1: Answers to Epic 5 Questions (COGS History)

### Q1: Is `cogs_id` (UUID) available for unique record identification?

**Answer**: ✅ **YES** - Available

**Current Schema** (`prisma/schema.prisma:388`):
```prisma
model Cogs {
  id String @id @default(uuid()) @db.Uuid  // ← UUID available as `cogs_id`
  ...
}
```

**API Response Example**:
```json
{
  "cogs_id": "550e8400-e29b-41d4-a716-446655440000",  // Use `id` field
  "nm_id": "12345678",
  "unit_cost_rub": 999.00
}
```

---

### Q2: How is `valid_to` calculated?

**Answer**: ✅ **Already Implemented** - Automatic versioning

**Current Logic** (`src/cogs/services/cogs.service.ts:169-191`):
```typescript
// When new version created:
// 1. Close old version: set valid_to = new_version.valid_from
// 2. Create new version: valid_to = null (current)

const [, newVersion] = await this.prisma.$transaction([
  // Close old version
  this.prisma.cogs.update({
    where: { id: currentVersion.id },
    data: { validTo: newValidFrom },  // ← valid_to set to new version's valid_from
  }),
  // Create new version
  this.prisma.cogs.create({
    data: { validTo: null, ... }  // ← new version is current (valid_to = null)
  }),
]);
```

**Timeline Example**:
```
Version 1: valid_from=2025-01-01, valid_to=2025-02-01 (closed)
Version 2: valid_from=2025-02-01, valid_to=null       (current)
```

---

### Q3: Is `created_by` stored for audit trail?

**Answer**: ✅ **YES** - Already stored

**Current Schema** (`prisma/schema.prisma:405`):
```prisma
model Cogs {
  createdBy String   @map("created_by") @db.VarChar(100) // User ID or 'system'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  notes     String?  @db.Text
}
```

**Stored Values**:
- User email/ID from JWT when assigned via API
- `"system"` when assigned via import
- `"manual"` source + user ID for manual entries

---

### Q4: Can `valid_from` be changed when editing COGS?

**Answer**: ⚠️ **NOT RECOMMENDED** - Use versioning instead

**Reason**: Changing `valid_from` would break temporal lookup logic and could corrupt margin calculations for past weeks.

**Recommended Approach**:
| Use Case | Solution |
|----------|----------|
| Fix typo in cost | PATCH endpoint - update `unit_cost_rub` and `notes` (same `valid_from`) |
| Change effective date | Create new version with new `valid_from` |
| Backdate COGS | Create new version with past `valid_from` |

**PATCH Endpoint Design**:
```http
PATCH /v1/cogs/:cogsId
{
  "unit_cost_rub": 950.00,   // ✅ Allowed
  "notes": "Corrected",      // ✅ Allowed
  "valid_from": "2025-01-15" // ❌ NOT allowed - use versioning instead
}
```

---

### Q5: Who can edit/delete COGS? (Role restrictions)

**Answer**: 🔒 **Owner/Manager Only** - Same as create

**Role Matrix** (consistent with Story 23.10):
| Role | View History | Create COGS | Edit COGS | Delete COGS |
|------|-------------|-------------|-----------|-------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Owner** | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ✅ | ✅ | ✅ | ✅ |
| **Analyst** | ✅ | ❌ | ❌ | ❌ |
| **Service** | ✅ | ✅ | ✅ | ✅ |

**Implementation**: Use existing `RolesGuard` with `@Roles(Role.MANAGER, Role.OWNER, Role.ADMIN)` decorator.

---

### Q6: Hard delete or soft delete?

**Answer**: 💡 **SOFT DELETE** - Recommended

**Proposed Schema Enhancement**:
```prisma
model Cogs {
  // ... existing fields
  isActive    Boolean  @default(true) @map("is_active")  // NEW: soft delete flag
  deletedAt   DateTime? @map("deleted_at")               // NEW: deletion timestamp
  deletedBy   String?  @map("deleted_by")                // NEW: who deleted
}
```

**Benefits**:
- ✅ Audit trail preserved
- ✅ Can restore accidentally deleted COGS
- ✅ Margin history remains explainable
- ✅ Temporal lookup still works (filter `is_active = true`)

**API Behavior**:
```http
DELETE /v1/cogs/:cogsId
```
```json
{
  "deleted": true,
  "cogs_id": "uuid-1",
  "deletion_type": "soft",  // "soft" | "hard"
  "can_restore": true
}
```

---

### Q7: What happens to margin data after COGS delete?

**Answer**: Margin recalculated → `COGS_NOT_ASSIGNED` if no valid COGS remains

**Scenario Analysis**:

| Scenario | Before Delete | After Delete | Result |
|----------|---------------|--------------|--------|
| Product has 2 COGS versions, delete older | W44-W45: 100₽, W46+: 150₽ | W44-W45: ❌, W46+: 150₽ | W44-W45 margin = null, reason = `COGS_NOT_ASSIGNED` |
| Product has 1 COGS, delete it | W46+: 150₽ | No COGS | All weeks = null, reason = `COGS_NOT_ASSIGNED` |
| Product has 2 versions, delete newer | W44-W45: 100₽, W46+: 150₽ | W44+: 100₽ (reopened) | Old version becomes current (`valid_to = null`) |

**Automatic Recalculation**:
- DELETE triggers `enqueueMarginRecalculation()` (same as Epic 20)
- Affected weeks determined by deleted COGS's `valid_from`/`valid_to`
- Task queued: `recalculate_weekly_margin`

---

## Part 2: Answers to Epic 6 Questions (Advanced Analytics)

### Q8: Is cross-week aggregation supported in current schema?

**Answer**: ⚠️ **NOT YET** - Requires new implementation

**Current State**:
- `weekly_margin_fact` stores per-week, per-product data
- Each row = 1 week + 1 product
- No aggregate views for multi-week periods

**Required Implementation**:
```sql
-- Example: Aggregate W40 to W47
SELECT
  nm_id,
  SUM(revenue_net_rub) as revenue_net,
  SUM(cogs_rub) as cogs_total,
  SUM(profit_rub) as profit,
  SUM(units) as qty,
  SUM(profit_rub) / NULLIF(SUM(revenue_net_rub), 0) * 100 as margin_pct
FROM weekly_margin_fact
WHERE week BETWEEN '2025-W40' AND '2025-W47'
  AND cabinet_id = $1
GROUP BY nm_id;
```

**Estimate**: 3-4 days (Story 6.1)

---

### Q9: How to calculate weighted average margin?

**Answer**: ✅ **Confirmed Formula**

```
weighted_margin_pct = SUM(profit) / SUM(revenue) × 100
```

**Example**:
| Week | Revenue | COGS | Profit | Margin % |
|------|---------|------|--------|----------|
| W45 | 100,000 | 60,000 | 40,000 | 40.0% |
| W46 | 50,000 | 35,000 | 15,000 | 30.0% |
| **Total** | **150,000** | **95,000** | **55,000** | **36.67%** |

**Note**: Simple average would be `(40 + 30) / 2 = 35%` — INCORRECT!
Weighted average: `55,000 / 150,000 × 100 = 36.67%` — CORRECT!

---

### Q10: Performance concerns for large date ranges (52 weeks)?

**Answer**: 💡 **Manageable with SQL aggregation**

**Strategy**:
1. **SQL-level aggregation** - NOT N+1 queries per week
2. **Index optimization** - Already have indexes on `(cabinet_id, week)`
3. **Pagination** - Return top N products, not all
4. **Caching** - Cache aggregates for historical periods (immutable)

**Benchmark Estimates** (based on current data volumes):
| Period | Products | Expected p95 |
|--------|----------|--------------|
| 4 weeks | 1,000 | < 200ms |
| 12 weeks | 1,000 | < 500ms |
| 52 weeks | 1,000 | < 1.5s |

**Mitigation for Slow Queries**:
- Add summary table `weekly_margin_aggregate` if needed
- Pre-calculate monthly/quarterly aggregates

---

### Q11: Is range comparison feasible (e.g., "W40-W43 vs W36-W39")?

**Answer**: ✅ **YES** - Feasible

**Implementation Approach**:
1. Execute two aggregate queries (one per period)
2. Join results on `nm_id` / `brand` / `category`
3. Calculate deltas (absolute and percentage)

**Query Structure**:
```sql
-- Period 1: W40-W43
WITH period1 AS (
  SELECT nm_id, SUM(revenue_net_rub) as revenue, ...
  FROM weekly_margin_fact
  WHERE week BETWEEN '2025-W40' AND '2025-W43'
  GROUP BY nm_id
),
-- Period 2: W36-W39
period2 AS (
  SELECT nm_id, SUM(revenue_net_rub) as revenue, ...
  FROM weekly_margin_fact
  WHERE week BETWEEN '2025-W36' AND '2025-W39'
  GROUP BY nm_id
)
SELECT
  COALESCE(p1.nm_id, p2.nm_id) as nm_id,
  p1.revenue as period1_revenue,
  p2.revenue as period2_revenue,
  (p1.revenue - p2.revenue) as delta_absolute,
  ((p1.revenue - p2.revenue) / NULLIF(p2.revenue, 0) * 100) as delta_pct
FROM period1 p1
FULL OUTER JOIN period2 p2 ON p1.nm_id = p2.nm_id;
```

**Estimate**: 4-5 days (Story 6.2)

---

### Q12: How to handle ROI when cogs = 0?

**Answer**: 💡 **Return `null`** (undefined)

**Edge Cases**:
| Scenario | `cogs_total` | `profit` | ROI Result |
|----------|-------------|----------|------------|
| Normal | 60,000 | 40,000 | `66.67%` |
| No COGS assigned | 0 | 100,000 | `null` |
| COGS = 0 (free sample) | 0 | 50,000 | `null` |
| Negative profit | 60,000 | -10,000 | `-16.67%` |

**Formula with Safety**:
```typescript
const roi = cogs_total > 0 ? (profit / cogs_total) * 100 : null;
```

**profit_per_unit Edge Cases**:
```typescript
const profit_per_unit = qty > 0 ? profit / qty : null;
```

---

### Q13: Is async export processing preferred (for large datasets)?

**Answer**: ✅ **YES** - Use existing BullMQ pattern

**Current Infrastructure**:
- BullMQ queue: `queue:default`
- Export table: `exports` (already exists, see `prisma/schema.prisma:656-692`)
- Task pattern: same as `finances_weekly_ingest`

**Existing Export Schema**:
```prisma
model Export {
  id          String       @id @default(uuid())
  cabinetId   String
  status      ExportStatus // pending, processing, completed, failed
  format      ExportFormat // csv, xlsx
  fileUrl     String?      // S3/storage URL
  fileName    String?
  fileSize    Int?
  rowsCount   Int?
  expiresAt   DateTime?    // 48h from completion
  createdBy   String       // User ID from JWT
  // ...
}
```

**Flow**:
1. `POST /v1/exports/analytics` → 202 Accepted + `export_id`
2. BullMQ processes export
3. `GET /v1/exports/:exportId` → status + download URL

---

### Q14: Export file storage location?

**Answer**: 💡 **S3 with presigned URLs** (recommended)

**Options Analysis**:
| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **S3** | Scalable, secure, CDN | Setup required | ✅ Production |
| **Local** | Simple, fast dev | No scaling | Dev only |
| **Database BLOB** | No external deps | Size limits, slow | ❌ Not recommended |

**Current Implementation** (already prepared):
- `fileUrl` field in `exports` table for S3 URL
- `expiresAt` field for TTL (48 hours default)
- Cleanup job removes expired files

**Presigned URL Pattern**:
```typescript
// Generate presigned URL (valid 1 hour)
const downloadUrl = await s3.getSignedUrl('getObject', {
  Bucket: 'exports',
  Key: `${cabinetId}/${exportId}.xlsx`,
  Expires: 3600
});
```

---

## Implementation Roadmap (Backend)

### ✅ Sprint 1: COMPLETED (2025-11-26)

| Story | Feature | Status | QA Score |
|-------|---------|--------|----------|
| **5.1** | `GET /v1/cogs/history` | ✅ **DONE** | 90/100 |
| **6.1** | `weekStart`/`weekEnd` params for analytics | ✅ **DONE** | 90/100 |
| **6.3** | `roi`, `profit_per_unit` fields | ✅ **DONE** | 95/100 |

**Migration Applied**: `is_active` column added to `cogs` table for soft delete support.

### 📋 Sprint 2: Planned (Pending PO Prioritization)

| Story | Feature | Estimate | Status |
|-------|---------|----------|--------|
| **5.2** | `PATCH /v1/cogs/:cogsId` + recalculation | 3-4 days | 📋 Ready |
| **5.3** | `DELETE /v1/cogs/:cogsId` (soft) + recalculation | 2-3 days | 📋 Ready |

### 📋 Sprint 3: Planned

| Story | Feature | Estimate | Status |
|-------|---------|----------|--------|
| **6.2** | `GET /v1/analytics/weekly/comparison` | 4-5 days | 📋 Depends on 6.1 ✅ |
| **6.4** | `GET /v1/analytics/cabinet-summary` | 3-4 days | 📋 Depends on 6.1, 6.3 ✅ |

### 📋 Sprint 4: Export

| Story | Feature | Estimate | Status |
|-------|---------|----------|--------|
| **6.5** | `POST /v1/exports/analytics` | 3-4 days | 📋 Uses existing infra |

---

## Summary: All Questions Answered

### Epic 5: COGS History & Management

| # | Question | Answer | Notes |
|---|----------|--------|-------|
| Q1 | `cogs_id` available? | ✅ YES | UUID field `id` |
| Q2 | `valid_to` calculation? | ✅ Implemented | Automatic versioning |
| Q3 | `created_by` stored? | ✅ YES | Audit trail exists |
| Q4 | Can change `valid_from`? | ⚠️ Not recommended | Use versioning |
| Q5 | Role restrictions? | 🔒 Owner/Manager | Same as create |
| Q6 | Hard/soft delete? | 💡 Soft delete | Add `is_active` flag |
| Q7 | Margin after delete? | Recalculated | `COGS_NOT_ASSIGNED` |

### Epic 6: Advanced Analytics

| # | Question | Answer | Notes |
|---|----------|--------|-------|
| Q8 | Cross-week aggregation? | ⚠️ New implementation | SQL aggregation |
| Q9 | Weighted average margin? | ✅ Confirmed | `SUM(profit)/SUM(revenue)*100` |
| Q10 | Performance 52 weeks? | 💡 Manageable | < 1.5s with indexes |
| Q11 | Range comparison? | ✅ Feasible | FULL OUTER JOIN |
| Q12 | ROI when cogs=0? | 💡 Return `null` | Undefined case |
| Q13 | Async export? | ✅ YES | BullMQ pattern |
| Q14 | File storage? | 💡 S3 | Presigned URLs |

---

## Next Steps

1. **Frontend Team**: Review this response, clarify any remaining questions
2. **PO**: Prioritize stories based on business value
3. **Backend Team**: Create detailed story docs for approved features
4. **Sprint Planning**: Schedule Phase 1 (Epic 5) for next sprint

---

---

## 🚀 Frontend Integration Guide (Implemented Features)

### Story 6.1: Date Range Analytics - HOW TO USE

**Available on ALL analytics endpoints:**
- `GET /v1/analytics/weekly/by-sku`
- `GET /v1/analytics/weekly/by-brand`
- `GET /v1/analytics/weekly/by-category`
- `GET /v1/analytics/weekly/margin-trends`

**Query Parameters:**
```typescript
interface DateRangeParams {
  weekStart: string;  // ISO week, e.g., "2025-W40"
  weekEnd: string;    // ISO week, e.g., "2025-W47"
  includeCogs?: boolean; // Optional, for margin data
}
```

**Example Requests:**
```http
# By SKU - aggregate 8 weeks
GET /v1/analytics/weekly/by-sku?weekStart=2025-W40&weekEnd=2025-W47&includeCogs=true
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>

# By Brand - aggregate 12 weeks
GET /v1/analytics/weekly/by-brand?weekStart=2025-W35&weekEnd=2025-W47&includeCogs=true

# By Category - aggregate quarter
GET /v1/analytics/weekly/by-category?weekStart=2025-W35&weekEnd=2025-W47&includeCogs=true
```

**Response includes NEW fields:**
```json
{
  "data": [...],
  "meta": {
    "week_range": {
      "start": "2025-W40",
      "end": "2025-W47",
      "weeks_count": 8
    },
    "total_records": 150,
    "weeks_with_sales": 6,
    "weeks_with_cogs": 5
  }
}
```

**Validation Rules:**
- `weekEnd` must be >= `weekStart` → Error: `INVALID_WEEK_RANGE`
- Maximum 52 weeks → Error: `WEEK_RANGE_TOO_LARGE`
- Cannot combine `week` with `weekStart`/`weekEnd` → Use one or the other

**TypeScript Integration:**
```typescript
// Example: Fetch aggregated analytics for date range
async function fetchAnalyticsForRange(
  weekStart: string,
  weekEnd: string,
  type: 'sku' | 'brand' | 'category'
): Promise<AnalyticsResponse> {
  const response = await fetch(
    `/v1/analytics/weekly/by-${type}?weekStart=${weekStart}&weekEnd=${weekEnd}&includeCogs=true`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Cabinet-Id': cabinetId,
      },
    }
  );
  return response.json();
}
```

---

### Story 6.3: ROI & Profit Metrics - HOW TO USE

**Available when `includeCogs=true` on:**
- `GET /v1/analytics/weekly/by-sku?includeCogs=true`
- `GET /v1/analytics/weekly/by-brand?includeCogs=true`
- `GET /v1/analytics/weekly/by-category?includeCogs=true`
- `GET /v1/analytics/weekly/margin-trends` (always included)

**New Response Fields:**
```typescript
interface AnalyticsWithROI {
  // Existing fields
  nm_id: string;
  revenue_net: number;
  cogs: number | null;
  profit: number | null;
  margin_pct: number | null;
  qty: number;

  // NEW Story 6.3 fields
  roi: number | null;           // (profit / cogs) × 100%
  profit_per_unit: number | null; // profit / qty
}
```

**Example Response:**
```json
{
  "data": [
    {
      "nm_id": "147205694",
      "sa_name": "Куртка зимняя",
      "revenue_net": 125000.50,
      "cogs": 60000.00,
      "profit": 65000.50,
      "margin_pct": 52.0,
      "qty": 50,
      "roi": 108.33,             // NEW: (65000.50 / 60000) × 100
      "profit_per_unit": 1300.01  // NEW: 65000.50 / 50
    }
  ]
}
```

**Edge Cases (Frontend should handle):**
| Scenario | `cogs` | `qty` | `roi` | `profit_per_unit` |
|----------|--------|-------|-------|-------------------|
| Normal | 60000 | 50 | 108.33 | 1300.00 |
| No COGS | null | 50 | null | null |
| Free samples | 0 | 50 | **null** | 100.00 |
| No sales | 60000 | 0 | 108.33 | **null** |
| Loss | 80000 | 50 | **-25.00** | **-400.00** |

**TypeScript Types:**
```typescript
// Update your types to include new fields
interface SkuAnalyticsResponse {
  nm_id: string;
  sa_name: string;
  revenue_net: number;
  cogs: number | null;
  profit: number | null;
  margin_pct: number | null;
  markup_percent: number | null;
  qty: number;
  // Story 6.3 NEW fields
  roi: number | null;
  profit_per_unit: number | null;
}

// Display helpers
function formatROI(roi: number | null): string {
  if (roi === null) return '—';
  return `${roi.toFixed(2)}%`;
}

function formatProfitPerUnit(ppu: number | null): string {
  if (ppu === null) return '—';
  return `${ppu.toFixed(2)} ₽`;
}
```

**UI Recommendations:**
- Show `roi` as percentage with color coding (green > 0, red < 0)
- Show `profit_per_unit` as currency (₽)
- Display "—" for `null` values (not "0" or "N/A")
- Consider tooltip explaining why value is `null`

---

### Combined Usage: Date Range + ROI

**Most Powerful Query:**
```http
GET /v1/analytics/weekly/by-sku?weekStart=2025-W40&weekEnd=2025-W47&includeCogs=true&limit=100
```

**Returns aggregated data with:**
- Total revenue across 8 weeks
- Total COGS across 8 weeks
- Total profit across 8 weeks
- Weighted average margin %
- **ROI for the entire period**
- **Profit per unit for the entire period**

---

## Documentation References

| Feature | Documentation |
|---------|---------------|
| Story 5.1 | [story-5.1-view-cogs-history.md](../../../docs/stories/epic-5/story-5.1-view-cogs-history.md) |
| Story 6.1 | [story-6.1-date-range-analytics.md](../../../docs/stories/epic-6/story-6.1-date-range-analytics.md) |
| Story 6.3 | [story-6.3-roi-profit-metrics.md](../../../docs/stories/epic-6/story-6.3-roi-profit-metrics.md) |
| QA Gate 5.1 | [5.1-view-cogs-history.yml](../../../docs/qa/gates/5.1-view-cogs-history.yml) |
| QA Gate 6.1 | [6.1-date-range-analytics.yml](../../../docs/qa/gates/6.1-date-range-analytics.yml) |
| QA Gate 6.3 | [6.3-roi-profit-metrics.yml](../../../docs/qa/gates/6.3-roi-profit-metrics.yml) |
| API Reference | [API-PATHS-REFERENCE.md](../../../docs/API-PATHS-REFERENCE.md) |
| Test Examples | [test-api/](../../../test-api/) (см. 05-analytics-basic.http, 06-analytics-advanced.http, SECTION-MAPPING.md) |

---

**Document Version**: 2.0
**Backend Team Response**: 2025-11-26
**Implementation Update**: 2025-11-26 (Stories 5.1, 6.1, 6.3 DONE)
**Status**: ✅ Sprint 1 Complete - Frontend Can Start Integration
