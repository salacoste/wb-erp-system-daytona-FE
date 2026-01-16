# Request #16: COGS History and Margin Data Structure Guide

**Date**: 2025-01-26  
**Priority**: 🟡 Medium - Documentation Request  
**Status**: ✅ **RESOLVED** - Backend Documentation Provided  
**Component**: Backend API - COGS Module + Analytics Module

---

## Executive Summary

Frontend team needs clear guidance on:
1. **How to check if COGS was assigned historically** (earlier dates)
2. **How margin calculation works and where margin data is returned** (unique per week)
3. **Data structure for margin analytics** (week-by-week uniqueness)

This document provides API endpoints, request examples, and response structures to answer these questions.

---

## Problem Description

Frontend developers are experiencing confusion about:
- **COGS History**: How to query if a product had COGS assigned in the past (not just current COGS)
- **Margin Calculation**: Understanding where margin data comes from and how it's structured
- **Week Uniqueness**: Confirming that margin data is unique per ISO week (not aggregated across weeks)

---

## Solution: API Endpoints and Data Structure Guide

### 1. ✅ Checking Historical COGS Assignments

#### API Endpoint: `GET /v1/cogs`

**Purpose**: Query all COGS entries (current and historical) with filters.

**Query Parameters**:
- `nm_id?: string` - Filter by product article number
- `sa_name?: string` - Filter by product name (partial match)
- `valid_at?: string` - **Temporal lookup**: Get COGS valid at specific date (ISO 8601 format: `YYYY-MM-DD`)
- `cursor?: string` - Pagination cursor
- `limit?: number` - Items per page (1-1000, default: 50)

**Example 1: Get All Historical COGS for a Product**

```http
GET /v1/cogs?nm_id=321678606&limit=100
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid-1",
      "nmId": "321678606",
      "saName": "Краска для мебели",
      "validFrom": "2025-01-01T00:00:00Z",
      "validTo": "2025-02-28T23:59:59Z",
      "unitCostRub": "1000.00",
      "currency": "RUB",
      "source": "manual",
      "createdBy": "user@example.com",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z",
      "notes": "Initial cost entry"
    },
    {
      "id": "uuid-2",
      "nmId": "321678606",
      "saName": "Краска для мебели",
      "validFrom": "2025-03-01T00:00:00Z",
      "validTo": null,
      "unitCostRub": "1200.00",
      "currency": "RUB",
      "source": "import",
      "createdBy": "user@example.com",
      "createdAt": "2025-03-01T09:15:00Z",
      "updatedAt": "2025-03-01T09:15:00Z",
      "notes": "Price increase from supplier"
    }
  ],
  "pagination": {
    "cursor": "uuid-2",
    "hasMore": false
  }
}
```

**Key Fields**:
- `validFrom`: When this COGS version became effective
- `validTo`: When this version expired (NULL = current active version)
- `unitCostRub`: Cost per unit in RUB
- `source`: Origin (`manual`, `import`, `system`)

**Example 2: Get COGS Valid at Specific Date (Temporal Lookup)**

```http
GET /v1/cogs?nm_id=321678606&valid_at=2025-02-15
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Response**: Returns COGS entry that was valid on 2025-02-15 (first entry from Example 1, since `validFrom <= 2025-02-15` and `validTo >= 2025-02-15`).

**Example 3: Get Current Active COGS Only**

```http
GET /v1/cogs/:nmId/current
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Response**:
```json
{
  "id": "uuid-2",
  "nmId": "321678606",
  "saName": "Краска для мебели",
  "validFrom": "2025-03-01T00:00:00Z",
  "validTo": null,
  "unitCostRub": "1200.00",
  "currency": "RUB",
  "source": "import",
  "createdBy": "user@example.com",
  "createdAt": "2025-03-01T09:15:00Z",
  "updatedAt": "2025-03-01T09:15:00Z",
  "notes": "Price increase from supplier"
}
```

**Note**: Returns 404 if no current COGS exists (`validTo = NULL`).

---

### 1.1 🆕 Dedicated COGS History Endpoint (Story 5.1 - November 2025)

#### API Endpoint: `GET /v1/cogs/history`

**Purpose**: Get complete version history of COGS for a specific product with **affected weeks analysis**.

**Why Use This Instead of `GET /v1/cogs`?**
- ✅ Includes `affected_weeks` - ISO weeks with sales in each COGS period
- ✅ Includes `meta` section with product info, current COGS, total versions
- ✅ Cabinet isolation security (403 if product not in user's cabinet)
- ✅ Pagination optimized for history browsing
- ✅ Optional `include_deleted=true` for audit purposes

**Query Parameters**:
- `nm_id` (required): Product article number (e.g., `147205694`)
- `limit` (optional): Records per page (1-100, default: 50)
- `cursor` (optional): Pagination cursor (Base64-encoded)
- `include_deleted` (optional): Include soft-deleted records (default: false)

**Example Request**:

```http
GET /v1/cogs/history?nm_id=147205694&limit=50
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Example Response**:
```json
{
  "data": [
    {
      "id": "uuid-current",
      "nm_id": "147205694",
      "sa_name": "Краска для мебели",
      "unit_cost": 1200.00,
      "currency": "RUB",
      "valid_from": "2025-03-01T00:00:00Z",
      "valid_to": null,
      "is_active": true,
      "created_at": "2025-03-01T09:15:00Z",
      "updated_at": "2025-03-01T09:15:00Z",
      "affected_weeks": ["2025-W45", "2025-W46", "2025-W47"]
    },
    {
      "id": "uuid-previous",
      "nm_id": "147205694",
      "sa_name": "Краска для мебели",
      "unit_cost": 1000.00,
      "currency": "RUB",
      "valid_from": "2025-01-01T00:00:00Z",
      "valid_to": "2025-02-28T23:59:59Z",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z",
      "affected_weeks": ["2025-W03", "2025-W04", "2025-W05"]
    }
  ],
  "meta": {
    "nm_id": "147205694",
    "product_name": "Краска для мебели",
    "current_cogs": 1200.00,
    "total_versions": 2
  },
  "pagination": {
    "has_more": false,
    "next_cursor": null,
    "count": 2
  }
}
```

**Key Fields**:
- `affected_weeks`: ISO weeks when product had sales **during this COGS period** (from `weekly_margin_fact` table)
- `valid_to`: `null` means this is the **current active version**
- `is_active`: `false` if soft-deleted (only visible with `include_deleted=true`)
- `meta.current_cogs`: Quick access to current COGS value (or `null` if no active COGS)
- `meta.total_versions`: Total count including soft-deleted records

**Use Cases**:
1. **Cost Auditing**: Review all historical COGS changes for a product
2. **Margin Analysis**: See which weeks were affected by each COGS version
3. **Data Validation**: Verify COGS assignments are correct
4. **Error Investigation**: Find incorrect entries with `include_deleted=true`

**Error Responses**:
- `400 Bad Request`: Missing `nm_id` parameter
- `403 Forbidden`: Product not found in user's cabinet (security - cabinet isolation)
- `401 Unauthorized`: Invalid or missing JWT token

**Documentation**:
- Story Spec: `docs/stories/epic-5/story-5.1-view-cogs-history.md`
- API Reference: `docs/API-PATHS-REFERENCE.md`

---

### 2. ✅ Understanding Margin Calculation and Data Structure

#### How Margin is Calculated

**Formula**:
```
margin_percent = (gross_profit / revenue_net) × 100%
where:
  gross_profit = revenue_net - cogs_rub
  cogs_rub = quantity_sold × unit_cost_rub (from COGS table)
```

**Calculation Process**:
1. **Weekly Aggregation**: System aggregates sales data by ISO week (Monday-Sunday, Europe/Moscow timezone)
2. **COGS Lookup**: For each sale date, system finds COGS valid at that date using temporal versioning
3. **Margin Calculation**: Calculates `gross_profit = revenue_net - cogs_rub` per week
4. **Storage**: Results stored in `weekly_margin_fact` table (one row per `week + cabinet_id + nm_id + report_type`)

#### Where Margin Data is Returned

**API Endpoint 1: Product List with Margin** (`GET /v1/products?include_cogs=true`)

```http
GET /v1/products?include_cogs=true&limit=25
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Response**:
```json
{
  "products": [
    {
      "nm_id": "321678606",
      "sa_name": "Краска для мебели",
      "has_cogs": true,
      "cogs": {
        "id": "uuid-2",
        "unit_cost_rub": 1200.00,
        "valid_from": "2025-03-01T00:00:00Z",
        "currency": "RUB"
      },
      "current_margin_pct": 35.5,
      "current_margin_period": "2025-W46",
      "current_margin_sales_qty": 50,
      "current_margin_revenue": 125000.50,
      "missing_data_reason": null
    }
  ],
  "pagination": { ... }
}
```

**Key Fields**:
- `current_margin_pct`: Margin % from **last completed week** (uses `IsoWeekService.getLastCompletedWeek()`)
- `current_margin_period`: ISO week used for calculation (e.g., `2025-W46`)
- `current_margin_sales_qty`: Sales quantity in that week
- `current_margin_revenue`: Revenue in that week
- `missing_data_reason`: `null` if margin calculated, or reason if missing (see below)

**API Endpoint 2: Weekly Analytics by SKU** (`GET /v1/analytics/weekly/by-sku?include_cogs=true`)

```http
GET /v1/analytics/weekly/by-sku?week=2025-W46&include_cogs=true&limit=100
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Response**:
```json
{
  "data": [
    {
      "nm_id": "321678606",
      "sa_name": "Краска для мебели",
      "total_units": 50,
      "revenue_net": 125000.50,
      "cogs": 60000.00,
      "profit": 65000.50,
      "margin_pct": 52.0,
      "markup_percent": 108.33,
      "missing_cogs_flag": false
    }
  ],
  "pagination": {
    "count": 100,
    "has_more": true,
    "next_cursor": "..."
  }
}
```

**Key Fields**:
- `margin_pct`: Margin percentage for this specific week
- `cogs`: Total COGS (quantity × unit_cost) for this week
- `profit`: Gross profit (revenue_net - cogs)
- `missing_cogs_flag`: `true` if COGS was missing for some sales in this week

**API Endpoint 3: Margin Trends (Time Series)** (`GET /v1/analytics/weekly/margin-trends`)

```http
GET /v1/analytics/weekly/margin-trends?weeks=12
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Response**:
```json
{
  "data": [
    {
      "week": "2025-W46",
      "margin_pct": 35.5,
      "revenue_net": 125000.50,
      "cogs": 60000.00,
      "profit": 65000.50
    },
    {
      "week": "2025-W45",
      "margin_pct": 32.1,
      "revenue_net": 110000.00,
      "cogs": 55000.00,
      "profit": 55000.00
    }
  ],
  "meta": {
    "week_start": "2025-W35",
    "week_end": "2025-W46",
    "total_weeks": 12
  }
}
```

**Use Case**: Get margin evolution over time (last 12 weeks, or explicit range with `weekStart`/`weekEnd`).

---

### 3. ✅ Week Uniqueness: Margin Data Structure

#### Database Table: `weekly_margin_fact`

**Unique Constraint**: `(week, cabinet_id, nm_id, report_type)`

**Meaning**: **One margin record per product per week per report type**.

**Example Data**:
```sql
-- Week 2025-W46, Product 321678606, основной report
week          | cabinet_id | nm_id     | report_type | margin_pct | revenue_net | cogs
--------------|------------|-----------|-------------|------------|-------------|-------
2025-W46      | uuid-123   | 321678606 | основной    | 35.5       | 125000.50   | 60000.00

-- Week 2025-W45, Same Product, Same Report Type
2025-W45      | uuid-123   | 321678606 | основной    | 32.1       | 110000.00   | 55000.00

-- Week 2025-W46, Same Product, Different Report Type
2025-W46      | uuid-123   | 321678606 | по выкупам  | 28.3       | 45000.00    | 25000.00
```

**Key Points**:
1. ✅ **Margin is unique per week**: Each ISO week has its own margin calculation
2. ✅ **Margin can differ by report_type**: `основной` (RUS) vs `по выкупам` (EAEU) have separate calculations
3. ✅ **Margin changes over time**: Same product can have different margins in different weeks (due to price changes, COGS changes, or sales mix)

**Why Week Uniqueness Matters**:
- **COGS can change**: If COGS is updated (new `valid_from` date), future weeks use new COGS, but past weeks keep old COGS
- **Sales mix varies**: Different weeks may have different product mix, affecting average margin
- **Price changes**: Product prices may change week-to-week, affecting revenue and margin

---

## Missing Data Reasons

When `current_margin_pct` is `null`, `missing_data_reason` explains why:

| Reason | Description | When It Occurs |
|--------|-------------|----------------|
| `NO_SALES_IN_PERIOD` | Product had no sales in the last completed week | Product exists but no sales in margin period |
| `COGS_NOT_ASSIGNED` | Product has sales but no COGS assigned | Sales exist but `cogs` table has no entry for this product |
| `NO_SALES_DATA` | Product has never had any sales | Product exists in catalog but never sold |
| `ANALYTICS_UNAVAILABLE` | Analytics service unavailable (graceful degradation) | Backend error (rare) |
| `null` | Margin calculation in progress | COGS assigned, but margin recalculation task pending (Epic 20) |

**Important**: If `missing_data_reason` is `null` and `current_margin_pct` is `null`, it means:
- COGS is assigned ✅
- Sales exist ✅
- Margin calculation is in progress (task queued, will complete in 5-60 seconds)

---

## Practical Examples for Frontend

### Example 1: Check if Product Had COGS in the Past

```typescript
// Check if product has any historical COGS entries
async function hasHistoricalCogs(nmId: string): Promise<boolean> {
  const response = await fetch(`/v1/cogs?nm_id=${nmId}&limit=1`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Cabinet-Id': cabinetId,
    },
  });
  const data = await response.json();
  return data.data.length > 0;
}

// Get all historical COGS versions
async function getCogsHistory(nmId: string): Promise<CogsEntry[]> {
  const response = await fetch(`/v1/cogs?nm_id=${nmId}&limit=100`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Cabinet-Id': cabinetId,
    },
  });
  const data = await response.json();
  return data.data; // Array of all COGS versions (ordered by validFrom DESC)
}
```

### Example 2: Get Margin Data for Specific Week

```typescript
// Get margin for specific week
async function getMarginForWeek(nmId: string, week: string): Promise<MarginData | null> {
  const response = await fetch(
    `/v1/analytics/weekly/by-sku?week=${week}&include_cogs=true&limit=1000`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Cabinet-Id': cabinetId,
      },
    }
  );
  const data = await response.json();
  
  // Find product in results
  const product = data.data.find((item: any) => item.nm_id === nmId);
  if (!product) return null;
  
  return {
    margin_pct: product.margin_pct,
    revenue: product.revenue_net,
    cogs: product.cogs,
    profit: product.profit,
    week: week,
  };
}
```

### Example 3: Get Margin Trends Over Time

```typescript
// Get margin trends for last 12 weeks
async function getMarginTrends(nmId: string): Promise<MarginTrend[]> {
  const response = await fetch(
    `/v1/analytics/weekly/margin-trends?weeks=12`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Cabinet-Id': cabinetId,
      },
    }
  );
  const data = await response.json();
  
  // Filter by nm_id if needed (or use by-sku endpoint with nm_id filter)
  return data.data.filter((item: any) => item.nm_id === nmId);
}
```

---

## Data Flow Summary

### COGS Assignment Flow

```
User assigns COGS
  ↓
POST /v1/products/:nmId/cogs
  ↓
COGS stored in `cogs` table with valid_from date
  ↓
Epic 20: Automatic margin recalculation triggered (BullMQ queue)
  ↓
Margin calculated for affected weeks
  ↓
Results stored in `weekly_margin_fact` table
  ↓
API returns margin data via /v1/products?include_cogs=true
```

### Margin Calculation Flow

```
Weekly sales data imported (Excel or WB API)
  ↓
Aggregated by ISO week (Monday-Sunday)
  ↓
For each sale date, lookup COGS valid at that date (temporal versioning)
  ↓
Calculate: margin = (revenue - cogs) / revenue × 100%
  ↓
Store in weekly_margin_fact (one row per week + product + report_type)
  ↓
API queries weekly_margin_fact for margin data
```

---

## Key Takeaways

1. **🆕 COGS History (Story 5.1)**: Use `GET /v1/cogs/history?nm_id=<nmId>` for complete version history with `affected_weeks` analysis
2. **Historical COGS (Legacy)**: Use `GET /v1/cogs?nm_id=<nmId>` to get all COGS versions without affected weeks
3. **Temporal Lookup**: Use `GET /v1/cogs?nm_id=<nmId>&valid_at=<date>` to get COGS valid at specific date
4. **Current Margin**: Use `GET /v1/products?include_cogs=true` for current margin (last completed week)
5. **Week-Specific Margin**: Use `GET /v1/analytics/weekly/by-sku?week=<week>&include_cogs=true` for specific week
6. **Margin Trends**: Use `GET /v1/analytics/weekly/margin-trends?weeks=12` for time series
7. **Week Uniqueness**: Each ISO week has its own margin calculation (stored in `weekly_margin_fact` table)
8. **Missing Data**: Check `missing_data_reason` field to understand why margin might be null

---

## Related Documentation

- **🆕 Story 5.1 Spec**: `docs/stories/epic-5/story-5.1-view-cogs-history.md`
- **COGS History API Reference**: `docs/API-PATHS-REFERENCE.md` (Section: Story 5.1 Update)
- **COGS Management API**: `frontend/docs/request-backend/09-epic-18-cogs-management-api.md`
- **Margin Analytics**: `frontend/docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md`
- **Product List with Margin**: `frontend/docs/request-backend/15-add-includecogs-to-product-list-endpoint-completion-summary.md`
- **Automatic Margin Recalculation**: `frontend/docs/request-backend/14-automatic-margin-recalculation-on-cogs-update-backend.md`
- **Margin Trends Endpoint**: `frontend/docs/request-backend/10-margin-analysis-time-series-endpoint.md`
- **Margin-COGS Integration Guide**: `docs/MARGIN-COGS-INTEGRATION-GUIDE.md` (Section 7)

---

## Questions?

If you need clarification on:
- COGS temporal versioning logic
- Margin calculation formulas
- Week selection logic (completed weeks only)
- API response structures

Contact backend team or reference:
- Backend API Swagger: `http://localhost:3000/api` (when API is running)
- Database schema: `prisma/schema.prisma` (COGS and WeeklyMarginFact models)
- Epic 20 Documentation: `docs/stories/epic-20/EPIC-20-OVERVIEW.md`

---

**Last Updated**: 2025-11-26
**Backend Team**: James (Full Stack Developer)
**Status**: ✅ Documentation Complete (Updated with Story 5.1 COGS History endpoint)

