# Request #27: COGS History Management & Advanced Analytics Roadmap

**Date**: 2025-11-26
**Priority**: 🔴 High - Core Business Features
**Status**: 🟡 Discussion / Planning
**Component**: Backend API - COGS Module + Analytics Module
**Related**: Request #16 (COGS History Guide), Epic 17-20, Guide #24

---

## Executive Summary

Frontend team requests backend support for two major feature sets that are currently **missing from the platform**:

1. **Epic 5: COGS History & Management** — View, edit, and delete COGS records with automatic margin recalculation
2. **Epic 6: Advanced Analytics & Reporting** — Date range selection, period comparison, multi-filter analytics, ROI metrics, and export

**Business Context**: Users need to:
- View and manage historical COGS assignments (fix errors, track changes)
- Analyze financial performance across custom time periods
- Compare different periods side-by-side
- Export data for external analysis

**Implementation Approach**: All features to be implemented incrementally as stories, phased delivery.

---

## Part 1: Epic 5 — COGS History & Management

### Current State

| Feature | Status | Notes |
|---------|--------|-------|
| View current COGS | ✅ | `GET /v1/products/:nmId` returns `cogs` object |
| Assign new COGS | ✅ | `POST /v1/products/:nmId/cogs` |
| Temporal versioning | ✅ | `valid_from` field creates new version |
| **View COGS history** | ❌ Missing | No endpoint to list all versions |
| **Edit past COGS** | ❌ Missing | No `PATCH` endpoint |
| **Delete/deactivate COGS** | ❌ Missing | No `DELETE` endpoint |

### Business Requirements

> **Clarification from PO**:
> - COGS records **CAN** be edited/deleted
> - Weekly report data (from WB) **CANNOT** be edited
> - When COGS is edited/deleted, **margin MUST be recalculated** for all affected weeks

### Requested Endpoints

#### 5.1: GET /v1/cogs/history — View COGS History

**Purpose**: List all COGS versions for a product with change tracking

**Request**:
```http
GET /v1/cogs/history?nm_id=12345678
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `nm_id` | string | ✅ | Product ID |
| `limit` | number | ❌ | Max records (default: 50) |
| `cursor` | string | ❌ | Pagination cursor |

**Expected Response** (200 OK):
```json
{
  "data": [
    {
      "cogs_id": "uuid-1",
      "nm_id": "12345678",
      "unit_cost_rub": 999.00,
      "valid_from": "2025-11-01T00:00:00Z",
      "valid_to": "2025-11-15T00:00:00Z",  // null = current
      "source": "manual",
      "notes": "Initial COGS from supplier invoice",
      "created_by": "user@example.com",
      "created_at": "2025-11-01T10:30:00Z",
      "updated_at": "2025-11-01T10:30:00Z",
      "is_active": true,
      "affected_weeks": ["2025-W44", "2025-W45"]  // Weeks using this COGS
    },
    {
      "cogs_id": "uuid-2",
      "nm_id": "12345678",
      "unit_cost_rub": 1100.00,
      "valid_from": "2025-11-15T00:00:00Z",
      "valid_to": null,  // Current active COGS
      "source": "manual",
      "notes": "Price increase from supplier",
      "created_by": "user@example.com",
      "created_at": "2025-11-15T14:00:00Z",
      "updated_at": "2025-11-15T14:00:00Z",
      "is_active": true,
      "affected_weeks": ["2025-W46", "2025-W47"]
    }
  ],
  "pagination": {
    "total": 2,
    "cursor": null
  },
  "meta": {
    "nm_id": "12345678",
    "product_name": "Товар XYZ",
    "current_cogs": {
      "unit_cost_rub": 1100.00,
      "valid_from": "2025-11-15"
    }
  }
}
```

**Questions for Backend**:
1. Is `cogs_id` (UUID) available in current schema? If not, what identifier to use?
2. How is `valid_to` calculated? (Next version's `valid_from` - 1 day?)
3. Is `created_by` stored? If not, can we add it for audit trail?

---

#### 5.2: PATCH /v1/cogs/:cogsId — Edit Existing COGS

**Purpose**: Modify a past COGS record (e.g., fix typo, correct amount)

**Request**:
```http
PATCH /v1/cogs/uuid-1
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
Content-Type: application/json

{
  "unit_cost_rub": 950.00,       // Optional: new value
  "notes": "Corrected amount",   // Optional: update notes
  "recalculate_margin": true     // Required: trigger margin recalculation
}
```

**Expected Response** (200 OK):
```json
{
  "cogs_id": "uuid-1",
  "nm_id": "12345678",
  "unit_cost_rub": 950.00,
  "valid_from": "2025-11-01T00:00:00Z",
  "valid_to": "2025-11-15T00:00:00Z",
  "notes": "Corrected amount",
  "updated_at": "2025-11-26T12:00:00Z",
  "margin_recalculation": {
    "triggered": true,
    "task_uuid": "task-uuid-123",
    "affected_weeks": ["2025-W44", "2025-W45"],
    "estimated_time_sec": 30
  }
}
```

**Business Logic**:
1. Validate user has permission (Owner/Manager only?)
2. Update COGS record in database
3. **Automatically recalculate margin** for all affected weeks
4. Return task UUID for polling status

**Questions for Backend**:
1. Can `valid_from` be changed? Or only `unit_cost_rub` and `notes`?
2. Role restrictions: who can edit COGS? (Owner/Manager only?)
3. Should there be an audit log of changes?

---

#### 5.3: DELETE /v1/cogs/:cogsId — Delete/Deactivate COGS

**Purpose**: Remove erroneous COGS record (soft delete preferred)

**Request**:
```http
DELETE /v1/cogs/uuid-1
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Expected Response** (200 OK):
```json
{
  "deleted": true,
  "cogs_id": "uuid-1",
  "nm_id": "12345678",
  "margin_recalculation": {
    "triggered": true,
    "task_uuid": "task-uuid-456",
    "affected_weeks": ["2025-W44", "2025-W45"],
    "estimated_time_sec": 30
  },
  "message": "COGS deactivated. Margin will be recalculated."
}
```

**Business Logic**:
1. **Soft delete** preferred (set `is_active = false`, keep for audit)
2. If deleting current COGS, previous version becomes active (or no COGS)
3. **Automatically recalculate margin** for affected weeks (will show `COGS_NOT_ASSIGNED` if no valid COGS remains)

**Questions for Backend**:
1. Hard delete or soft delete (is_active flag)?
2. What happens to margin data for weeks that now have no COGS?
3. Can we delete the only COGS record for a product? (Result: margin = null)

---

## Part 2: Epic 6 — Advanced Analytics & Reporting

### Current State

| Feature | Status | Notes |
|---------|--------|-------|
| Single week selection | ✅ | ISO week picker on each page |
| Time period (N weeks) | ✅ | `/analytics/time-period` with 4-52 weeks |
| **Date range (from-to)** | ❌ Missing | No week-to-week range selector |
| **Period comparison** | ❌ Missing | No side-by-side comparison |
| **Multi-filter analytics** | ❌ Missing | Filters isolated per page |
| **ROI, profit/unit** | ❌ Missing | Only margin % available |
| **Cabinet-level KPIs** | ❌ Missing | No aggregate dashboard |
| **Export CSV/Excel** | ❌ Missing | No export functionality |

### Business Requirements

> **Critical Metrics (from PO)**:
> - Маржинальность (margin %) — ✅ Already available
> - Прибыль в рублях (profit RUB) — ✅ Already available
> - Прибыль на единицу (profit per unit) — ❌ **NEW**
> - ROI (Return on Investment) — ❌ **NEW**

### Requested Endpoints

#### 6.1: Date Range Support for Analytics Endpoints

**Purpose**: Allow week range selection (from W40 to W47)

**Current Endpoints** (need enhancement):
- `GET /v1/analytics/weekly/by-sku`
- `GET /v1/analytics/weekly/by-brand`
- `GET /v1/analytics/weekly/by-category`

**Proposed Enhancement**:
```http
GET /v1/analytics/weekly/by-sku?weekStart=2025-W40&weekEnd=2025-W47&includeCogs=true
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**New Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `weekStart` | string | ❌ | Start week (ISO format, e.g., "2025-W40") |
| `weekEnd` | string | ❌ | End week (ISO format, e.g., "2025-W47") |
| `week` | string | ❌ | Single week (existing, for backward compatibility) |

**Logic**:
- If `weekStart` + `weekEnd` provided: aggregate data across range
- If only `week` provided: current behavior (single week)
- Default: last completed week

**Expected Response** (aggregated across range):
```json
{
  "data": [
    {
      "nm_id": "12345678",
      "sa_name": "Товар XYZ",
      "brand": "Brand A",
      "category": "Category X",
      "revenue_net": 150000.00,      // Sum across weeks
      "cogs_total": 90000.00,        // Sum across weeks
      "profit": 60000.00,            // Sum across weeks
      "margin_pct": 40.0,            // Weighted average
      "qty": 120,                    // Sum across weeks
      "profit_per_unit": 500.00,     // NEW: profit / qty
      "roi": 66.67,                  // NEW: (profit / cogs) * 100%
      "weeks_with_sales": 5,         // NEW: count of weeks with sales
      "weeks_with_cogs": 5,          // NEW: count of weeks with COGS
      "missing_cogs_flag": false
    }
  ],
  "meta": {
    "week_range": {
      "start": "2025-W40",
      "end": "2025-W47",
      "weeks_count": 8
    },
    "aggregation": "sum_and_weighted_average"
  }
}
```

**Questions for Backend**:
1. Is aggregation across weeks supported in current schema?
2. How to calculate weighted average margin? `SUM(profit) / SUM(revenue)`?
3. Performance concerns for large date ranges (52 weeks)?

---

#### 6.2: GET /v1/analytics/weekly/comparison — Period Comparison

**Purpose**: Compare two periods side-by-side

**Request**:
```http
GET /v1/analytics/weekly/comparison?period1=2025-W46&period2=2025-W45&groupBy=sku&includeCogs=true
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period1` | string | ✅ | First period (week or range "2025-W40:W43") |
| `period2` | string | ✅ | Second period (week or range) |
| `groupBy` | string | ❌ | Aggregation: `sku`, `brand`, `category`, `cabinet` |
| `includeCogs` | boolean | ❌ | Include COGS and margin data |

**Expected Response** (200 OK):
```json
{
  "comparison": {
    "period1": {
      "label": "2025-W46",
      "data": {
        "revenue_net": 100000.00,
        "cogs_total": 60000.00,
        "profit": 40000.00,
        "margin_pct": 40.0,
        "qty": 80,
        "profit_per_unit": 500.00,
        "roi": 66.67
      }
    },
    "period2": {
      "label": "2025-W45",
      "data": {
        "revenue_net": 85000.00,
        "cogs_total": 55000.00,
        "profit": 30000.00,
        "margin_pct": 35.29,
        "qty": 65,
        "profit_per_unit": 461.54,
        "roi": 54.55
      }
    },
    "delta": {
      "revenue_net": {
        "absolute": 15000.00,
        "percent": 17.65
      },
      "profit": {
        "absolute": 10000.00,
        "percent": 33.33
      },
      "margin_pct": {
        "absolute": 4.71,
        "percent": 13.35
      },
      "qty": {
        "absolute": 15,
        "percent": 23.08
      },
      "roi": {
        "absolute": 12.12,
        "percent": 22.22
      }
    }
  },
  "breakdown": [
    {
      "nm_id": "12345678",
      "sa_name": "Товар XYZ",
      "period1": { "revenue_net": 50000, "profit": 20000, "margin_pct": 40.0 },
      "period2": { "revenue_net": 42000, "profit": 15000, "margin_pct": 35.71 },
      "delta": { "revenue_pct": 19.05, "profit_pct": 33.33, "margin_delta": 4.29 }
    }
  ],
  "meta": {
    "period1": "2025-W46",
    "period2": "2025-W45",
    "groupBy": "sku",
    "generated_at": "2025-11-26T12:00:00Z"
  }
}
```

**Questions for Backend**:
1. Is range comparison feasible (e.g., "W40-W43 vs W36-W39")?
2. What aggregation level makes sense? (SKU, brand, category, or all?)
3. Should delta calculation include ROI and profit_per_unit?

---

#### 6.3: New Metrics — ROI & Profit per Unit

**Purpose**: Add ROI and profit per unit to all analytics endpoints

**Formulas**:
```
profit_per_unit = profit / qty
ROI = (profit / cogs_total) × 100%
```

**Edge Cases**:
- `qty = 0` → `profit_per_unit = null`
- `cogs_total = 0` → `ROI = null` (or Infinity?)

**Affected Endpoints**:
- `GET /v1/analytics/weekly/by-sku`
- `GET /v1/analytics/weekly/by-brand`
- `GET /v1/analytics/weekly/by-category`
- `GET /v1/analytics/weekly/margin-trends`
- `GET /v1/products/:nmId` (product detail)

**Questions for Backend**:
1. Should ROI be calculated and stored, or calculated on-the-fly?
2. How to handle ROI when cogs = 0? (null, 0, or Infinity?)
3. Should these be opt-in via query param (`includeRoi=true`)?

---

#### 6.4: GET /v1/analytics/cabinet-summary — Cabinet-Level KPIs

**Purpose**: Overall business performance dashboard

**Request**:
```http
GET /v1/analytics/cabinet-summary?weeks=12
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `weeks` | number | ❌ | Number of weeks (default: 4) |
| `weekStart` | string | ❌ | Start week (alternative to `weeks`) |
| `weekEnd` | string | ❌ | End week (alternative to `weeks`) |

**Expected Response** (200 OK):
```json
{
  "summary": {
    "period": {
      "start": "2025-W36",
      "end": "2025-W47",
      "weeks_count": 12
    },
    "totals": {
      "revenue_net": 1500000.00,
      "cogs_total": 900000.00,
      "profit": 600000.00,
      "margin_pct": 40.0,
      "qty": 1200,
      "profit_per_unit": 500.00,
      "roi": 66.67
    },
    "products": {
      "total": 150,
      "with_cogs": 120,
      "without_cogs": 30,
      "with_sales": 95,
      "coverage_pct": 80.0
    },
    "trends": {
      "revenue_trend": "up",       // up/down/stable
      "profit_trend": "up",
      "margin_trend": "stable",
      "week_over_week_growth": 5.2  // %
    }
  },
  "top_products": [
    {
      "nm_id": "12345678",
      "sa_name": "Товар XYZ",
      "revenue_net": 150000.00,
      "profit": 60000.00,
      "margin_pct": 40.0,
      "contribution_pct": 10.0  // % of total revenue
    }
  ],
  "top_brands": [
    {
      "brand": "Brand A",
      "revenue_net": 300000.00,
      "profit": 120000.00,
      "margin_pct": 40.0
    }
  ],
  "meta": {
    "cabinet_id": "uuid",
    "cabinet_name": "Кабинет 1",
    "generated_at": "2025-11-26T12:00:00Z"
  }
}
```

**Questions for Backend**:
1. What constitutes "trend" calculation? (Compare to previous period?)
2. How many top products/brands to return? (Configurable?)
3. Should this be a separate endpoint or extension of existing?

---

#### 6.5: POST /v1/exports/analytics — Export to CSV/Excel

**Purpose**: Export analytics data for external analysis

**Request**:
```http
POST /v1/exports/analytics
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
Content-Type: application/json

{
  "type": "by-sku",                    // by-sku, by-brand, by-category, cabinet-summary
  "weekStart": "2025-W40",
  "weekEnd": "2025-W47",
  "format": "xlsx",                    // csv, xlsx
  "includeCogs": true,
  "filters": {
    "brand": "Brand A",                // Optional
    "category": "Category X"           // Optional
  }
}
```

**Expected Response** (202 Accepted):
```json
{
  "export_id": "export-uuid-123",
  "status": "processing",
  "estimated_time_sec": 30,
  "download_url": null  // Will be available when complete
}
```

**Status Check**:
```http
GET /v1/exports/export-uuid-123
```

**Response** (200 OK):
```json
{
  "export_id": "export-uuid-123",
  "status": "completed",
  "download_url": "https://storage.example.com/exports/export-uuid-123.xlsx",
  "expires_at": "2025-11-27T12:00:00Z",
  "file_size_bytes": 125000,
  "rows_count": 150
}
```

**Questions for Backend**:
1. Is async export processing preferred (for large datasets)?
2. Where to store export files? (S3, local, temp?)
3. Expiration policy for download links?

---

## Implementation Roadmap

### Phase 1: COGS History (Epic 5) — Priority: HIGH

| Story | Feature | Estimate | Dependencies |
|-------|---------|----------|--------------|
| **5.1** | View COGS history | 2-3 days | None |
| **5.2** | Edit COGS + recalculate | 3-4 days | Story 5.1 |
| **5.3** | Delete COGS + recalculate | 2-3 days | Story 5.1 |

### Phase 2: Date Range & Metrics (Epic 6) — Priority: HIGH

| Story | Feature | Estimate | Dependencies |
|-------|---------|----------|--------------|
| **6.1** | Date range for analytics | 3-4 days | None |
| **6.3** | ROI & profit_per_unit | 2-3 days | None |

### Phase 3: Period Comparison (Epic 6) — Priority: MEDIUM

| Story | Feature | Estimate | Dependencies |
|-------|---------|----------|--------------|
| **6.2** | Period comparison endpoint | 4-5 days | Story 6.1 |

### Phase 4: Dashboard & Export (Epic 6) — Priority: LOW

| Story | Feature | Estimate | Dependencies |
|-------|---------|----------|--------------|
| **6.4** | Cabinet-level KPIs | 3-4 days | Story 6.1, 6.3 |
| **6.5** | Export to CSV/Excel | 3-4 days | Story 6.1 |

---

## Questions Summary for Backend Team

### Epic 5: COGS History & Management

| # | Question | Context |
|---|----------|---------|
| Q1 | Is `cogs_id` (UUID) available? | For unique record identification |
| Q2 | How is `valid_to` calculated? | For history display |
| Q3 | Is `created_by` stored? | For audit trail |
| Q4 | Can `valid_from` be changed? | Edit limitations |
| Q5 | Who can edit/delete COGS? | Role restrictions |
| Q6 | Hard delete or soft delete? | Data retention policy |
| Q7 | What happens to margin after delete? | `COGS_NOT_ASSIGNED` or null? |

### Epic 6: Advanced Analytics

| # | Question | Context |
|---|----------|---------|
| Q8 | Is cross-week aggregation supported? | Date range feature |
| Q9 | How to calculate weighted average margin? | `SUM(profit) / SUM(revenue)`? |
| Q10 | Performance for large date ranges? | 52 weeks feasibility |
| Q11 | Range comparison feasible? | Period comparison |
| Q12 | How to handle ROI when cogs = 0? | Edge case handling |
| Q13 | Async export processing preferred? | Large dataset handling |
| Q14 | Export file storage location? | S3, local, temp? |

---

## Acceptance Criteria

### Epic 5: COGS History
- [ ] User can view all COGS versions for a product
- [ ] User can edit past COGS (unit_cost_rub, notes)
- [ ] User can delete/deactivate erroneous COGS
- [ ] Margin is automatically recalculated after edit/delete
- [ ] Audit trail is maintained (created_by, updated_at)

### Epic 6: Advanced Analytics
- [ ] User can select date range (week-from to week-to)
- [ ] User can compare two periods side-by-side
- [ ] ROI and profit_per_unit are available in all analytics
- [ ] Cabinet-level KPI dashboard is available
- [ ] User can export data to CSV/Excel

---

## Related Documentation

- [Request #16: COGS History Guide](./16-cogs-history-and-margin-data-structure.md)
- [Guide #24: Margin & COGS Integration](./24-margin-cogs-integration-guide.md)
- [Request #14: Automatic Margin Recalculation](./14-automatic-margin-recalculation-on-cogs-update-backend.md)
- [Epic 20: Automatic Margin Recalculation](../../../docs/stories/epic-20/)

---

**Requested by**: Frontend Team (PO Sarah)
**Date**: 2025-11-26
**Status**: ✅ **BACKEND REVIEWED** - All questions answered

---

## ✅ Backend Response

**All 14 technical questions have been answered!**

See: **[27-cogs-history-and-advanced-analytics-roadmap-backend.md](./27-cogs-history-and-advanced-analytics-roadmap-backend.md)**

### Summary of Answers:

| # | Question | Answer |
|---|----------|--------|
| Q1 | `cogs_id` available? | ✅ YES (UUID field `id`) |
| Q2 | `valid_to` calculation? | ✅ Automatic versioning |
| Q3 | `created_by` stored? | ✅ YES |
| Q4 | Can change `valid_from`? | ⚠️ Use versioning instead |
| Q5 | Role restrictions? | 🔒 Owner/Manager only |
| Q6 | Hard/soft delete? | 💡 Soft delete recommended |
| Q7 | Margin after delete? | Recalculated → `COGS_NOT_ASSIGNED` |
| Q8 | Cross-week aggregation? | ⚠️ New SQL implementation |
| Q9 | Weighted average margin? | ✅ `SUM(profit)/SUM(revenue)*100` |
| Q10 | 52-week performance? | 💡 < 1.5s with indexes |
| Q11 | Range comparison? | ✅ Feasible |
| Q12 | ROI when cogs=0? | 💡 Return `null` |
| Q13 | Async export? | ✅ BullMQ pattern |
| Q14 | File storage? | 💡 S3 with presigned URLs |

### Estimated Effort:
- **Epic 5 (COGS History)**: 7-10 days
- **Epic 6 (Advanced Analytics)**: 15-20 days
- **Total**: ~25-30 days backend

---

## Next Steps

1. ~~**Backend Team**: Review this document and answer questions~~ ✅ Done
2. ~~**Backend Team**: Provide estimates and technical feasibility~~ ✅ Done
3. ~~**Dev Team**: Create detailed story documents for approved features~~ ✅ Done
4. **PO**: Prioritize stories based on backend feedback ← **CURRENT**
5. **Implementation**: Phase-by-phase delivery

---

## 📚 Story Documentation (Created 2025-11-26)

### Epic 5: COGS History Management

| Story | Document | Status |
|-------|----------|--------|
| **Overview** | [Epic 5 Overview](../../../docs/epics/epic-5-cogs-history-management.md) | Approved |
| **5.1** | [View COGS History](../../../docs/stories/epic-5/story-5.1-view-cogs-history.md) | Approved |
| **5.2** | [Edit COGS](../../../docs/stories/epic-5/story-5.2-edit-cogs.md) | Approved |
| **5.3** | [Delete COGS](../../../docs/stories/epic-5/story-5.3-delete-cogs.md) | Approved |

### Epic 6: Advanced Analytics

| Story | Document | Status |
|-------|----------|--------|
| **Overview** | [Epic 6 Overview](../../../docs/epics/epic-6-advanced-analytics.md) | Approved |
| **6.1** | [Date Range Analytics](../../../docs/stories/epic-6/story-6.1-date-range-analytics.md) | Approved |
| **6.2** | [Period Comparison](../../../docs/stories/epic-6/story-6.2-period-comparison.md) | Approved |
| **6.3** | [ROI & Profit Metrics](../../../docs/stories/epic-6/story-6.3-roi-profit-metrics.md) | Approved |
| **6.4** | [Cabinet Summary Dashboard](../../../docs/stories/epic-6/story-6.4-cabinet-summary.md) | Approved |
| **6.5** | [Export Analytics](../../../docs/stories/epic-6/story-6.5-export-analytics.md) | Approved |

---

**Last Updated**: 2025-11-26
**Backend Response**: 2025-11-26
**Story Documentation**: 2025-11-26
