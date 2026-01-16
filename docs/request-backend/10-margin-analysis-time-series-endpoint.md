# Request #10: Margin Analysis Time-Series Endpoint

**Date**: 2025-11-23
**Priority**: Medium
**Status**: ✅ **IMPLEMENTED & WORKING** - Bugfixes applied 2025-12-04
**Component**: Backend API - Analytics Module
**Requester**: Frontend Team (Epic 4 - Story 4.7)
**Related Stories**:
- Frontend: `docs/stories/4.7.margin-analysis-by-time-period.md`
- Backend Epic 17: COGS & Margin Feature Integration (already complete)

---

## Executive Summary

~~Frontend needs a **time-series endpoint** to display margin trends over multiple weeks for Story 4.7~~

✅ **IMPLEMENTED**: The endpoint `GET /v1/analytics/weekly/margin-trends` is now fully functional after 3 critical bugfixes applied on 2025-12-04.

**Current Status**: Production-ready, returns margin trend data for up to 52 weeks.

---

## 🐛 Bugfix History (2025-12-04)

Three bugs were discovered and fixed in `src/analytics/weekly-analytics.service.ts`:

| # | Line | Error | Root Cause | Fix |
|---|------|-------|------------|-----|
| 1 | 1253 | `column "qty" does not exist` | SQL used wrong column name | `SUM(qty)` → `SUM(quantity_sold)` |
| 2 | 1259 | `uuid = text` type mismatch | Missing PostgreSQL type cast | Added `::uuid` cast |
| 3 | 1289 | `Cannot mix BigInt and other types` | JS BigInt incompatibility | Added `Number()` conversion |

**Verification**: Endpoint returns 200 OK with 12 weeks of data (2025-W37 to 2025-W48).

---

## Feature Description

A new endpoint that returns margin analysis data aggregated across a **time range** (multiple weeks), allowing frontend to visualize margin trends with a line chart.

**Key Use Cases**:
1. Financial directors track margin trends over last 12 weeks
2. Identify profitability patterns (seasonal, promotional impact)
3. Compare margin performance across different time periods
4. Detect margin degradation early for corrective action

**Frontend Visualization**: Line chart showing margin % on Y-axis, time period (ISO weeks) on X-axis, with interactive tooltips.

---

## Proposed API Endpoint

### Endpoint Details

**Method**: `GET`
**Path**: `/v1/analytics/weekly/margin-trends`
**Authentication**: JWT Bearer token (existing)
**Cabinet Isolation**: X-Cabinet-Id header (existing)

### Query Parameters

```typescript
interface MarginTrendsQueryParams {
  // Date range (one of the following options)
  weekStart: string;         // ISO week start (e.g., "2025-W40")
  weekEnd: string;           // ISO week end (e.g., "2025-W47")

  // OR: Alternative approach with relative weeks
  weeks?: number;            // Number of recent weeks (e.g., 12 for last 12 weeks)

  // Aggregation level (optional)
  aggregation?: 'week' | 'month';  // Default: 'week'

  // Grouping (optional)
  groupBy?: 'total' | 'brand' | 'category';  // Default: 'total'

  // COGS inclusion (should default to true for this endpoint)
  includeCogs?: boolean;     // Default: true
}
```

**Examples**:
```
GET /v1/analytics/weekly/margin-trends?weekStart=2025-W40&weekEnd=2025-W47
GET /v1/analytics/weekly/margin-trends?weeks=12&aggregation=week
GET /v1/analytics/weekly/margin-trends?weeks=12&groupBy=brand
```

---

## Response Schema

### Option 1: Simplified Time Series (Recommended for MVP)

```typescript
interface MarginTrendsResponse {
  data: MarginTrendPoint[];
  pagination?: {
    total: number;
    has_next: boolean;
  };
  message?: string;
}

interface MarginTrendPoint {
  // Time period
  week: string;                    // ISO week (e.g., "2025-W47")
  week_start_date: string;         // ISO date (e.g., "2025-11-17")
  week_end_date: string;           // ISO date (e.g., "2025-11-23")

  // Margin metrics (aggregated across all SKUs for the week)
  margin_pct: number | null;       // Average margin % for the week
  revenue_net: number;             // Total revenue for the week
  cogs: number | null;             // Total COGS for the week
  profit: number | null;           // Total profit for the week

  // Metadata
  qty: number;                     // Total units sold
  sku_count: number;               // Number of unique SKUs with sales
  missing_cogs_count: number;      // Number of SKUs without COGS
}
```

**Example Response**:
```json
{
  "data": [
    {
      "week": "2025-W40",
      "week_start_date": "2025-10-06",
      "week_end_date": "2025-10-12",
      "margin_pct": 35.5,
      "revenue_net": 125000.50,
      "cogs": 80000.00,
      "profit": 45000.50,
      "qty": 150,
      "sku_count": 25,
      "missing_cogs_count": 2
    },
    {
      "week": "2025-W41",
      "week_start_date": "2025-10-13",
      "week_end_date": "2025-10-19",
      "margin_pct": 32.8,
      "revenue_net": 118500.75,
      "cogs": 79600.00,
      "profit": 38900.75,
      "qty": 142,
      "sku_count": 23,
      "missing_cogs_count": 3
    }
  ],
  "pagination": {
    "total": 8,
    "has_next": false
  }
}
```

---

### Option 2: Grouped Time Series (Future Enhancement)

If `groupBy` parameter is used, return grouped trends:

```typescript
interface GroupedMarginTrendsResponse {
  data: GroupedMarginTrend[];
  pagination?: {
    total: number;
    has_next: boolean;
  };
  message?: string;
}

interface GroupedMarginTrend {
  group_key: string;               // Brand name or category name
  group_type: 'brand' | 'category';
  trends: MarginTrendPoint[];      // Time series for this group
}
```

**Example Response** (groupBy=brand):
```json
{
  "data": [
    {
      "group_key": "Brand A",
      "group_type": "brand",
      "trends": [
        {
          "week": "2025-W40",
          "margin_pct": 40.2,
          "revenue_net": 50000.00,
          "profit": 20100.00,
          ...
        },
        {
          "week": "2025-W41",
          "margin_pct": 38.5,
          "revenue_net": 48000.00,
          "profit": 18480.00,
          ...
        }
      ]
    },
    {
      "group_key": "Brand B",
      "group_type": "brand",
      "trends": [...]
    }
  ]
}
```

---

## Business Logic & Calculations

### Margin Calculation (Per Week)

**Formula** (same as Epic 17):
```
margin_pct = (profit / |revenue_net|) × 100
profit = revenue_net - cogs
```

**Aggregation Across SKUs**:
- **Total Profit**: `SUM(profit)` across all SKUs for the week
- **Total Revenue**: `SUM(revenue_net)` across all SKUs for the week
- **Total COGS**: `SUM(cogs)` across all SKUs with COGS data
- **Margin %**: `(total_profit / |total_revenue|) × 100`

**Missing COGS Handling**:
- SKUs without COGS are excluded from `total_profit` and `total_cogs` calculations
- `missing_cogs_count` field shows how many SKUs were excluded
- If ALL SKUs missing COGS → `margin_pct = null`, `cogs = null`, `profit = null`

### Date Range Logic

**Week Range**:
- `weekStart` to `weekEnd` are inclusive (both weeks included in results)
- Weeks must follow ISO 8601 week numbering (Monday start)
- Maximum range: 52 weeks (1 year) for performance

**Data Availability**:
- Only return weeks that have actual sales data (skip weeks with zero revenue)
- OR: Return all weeks in range with `revenue_net: 0` for weeks without sales (frontend preference: skip empty weeks)

---

## Performance Considerations

**Expected Load**:
- Typical query: 12 weeks (~3 months)
- Maximum query: 52 weeks (~1 year)
- Response size: ~50 KB for 52 weeks (Option 1), ~500 KB for grouped (Option 2)

**Optimization Suggestions**:
1. Use existing `weekly_payout_summary` and `weekly_margin_fact` tables
2. Add composite index: `(cabinet_id, week)` for fast range queries
3. Cache frequently requested ranges (e.g., last 12 weeks) for 5 minutes
4. Consider materialized view for common aggregations

**Target Performance**:
- Response time: <500ms for 12 weeks
- Response time: <1000ms for 52 weeks

---

## Error Scenarios

### 400 Bad Request
```json
{
  "error": {
    "code": "INVALID_WEEK_RANGE",
    "message": "weekEnd must be greater than or equal to weekStart",
    "details": [
      {
        "field": "weekEnd",
        "issue": "invalid_range",
        "value": "2025-W40"
      }
    ]
  }
}
```

### 400 Bad Request (Range Too Large)
```json
{
  "error": {
    "code": "WEEK_RANGE_TOO_LARGE",
    "message": "Maximum week range is 52 weeks. Requested: 60 weeks",
    "details": [
      {
        "field": "weekStart",
        "issue": "range_exceeded",
        "max_weeks": 52
      }
    ]
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NO_DATA_AVAILABLE",
    "message": "No margin data available for the requested week range",
    "details": [
      {
        "field": "weekStart",
        "issue": "no_data",
        "value": "2025-W40"
      }
    ]
  }
}
```

---

## Frontend Requirements

### Display Format

**Chart Type**: Line chart (Recharts LineChart component)

**X-Axis**:
- Label: ISO week (e.g., "W40", "W41") for short labels
- Tooltip: Full date range (e.g., "2025-W40 (06.10 - 12.10)")

**Y-Axis**:
- Label: "Маржа (%)"
- Format: Percentage with 2 decimal places
- Range: Auto-scale based on data

**Tooltip**:
```
Неделя: 2025-W40 (06.10 - 12.10)
Маржа: 35,50%
Выручка: 125 000,50 ₽
Прибыль: 45 000,50 ₽
Продано: 150 шт.
```

### Color Coding
- Line color: Blue (#2563EB) for consistent brand color
- Positive margin area: Light green background
- Negative margin area: Light red background
- Zero margin line: Gray dashed horizontal line

### Interactive Features
- Hover tooltip showing detailed metrics
- Click to drill down to week detail (navigate to `/analytics/sku?week=2025-W40`)
- Zoom/pan for large date ranges (optional)

---

## Alternative Implementation Options

### Option A: New Dedicated Endpoint (Recommended)
**Pros**:
- Optimized query for time-series data
- Better performance for large ranges
- Clear API semantics

**Cons**:
- New endpoint to implement and maintain

### Option B: Extend Existing `/by-sku` Endpoint
Add multi-week support to existing endpoint:
```
GET /v1/analytics/weekly/by-sku?weekStart=2025-W40&weekEnd=2025-W47&aggregate=week
```

**Pros**:
- Reuse existing logic
- No new endpoint

**Cons**:
- Endpoint becomes more complex
- May impact existing performance
- Less semantic clarity

### Option C: Client-Side Aggregation (Current Workaround)
Frontend fetches individual weeks and aggregates:
```typescript
const weeks = generateWeekRange('2025-W40', '2025-W47'); // ['2025-W40', 'W41', ...]
const promises = weeks.map(week =>
  fetch(`/v1/analytics/weekly/by-sku?week=${week}&includeCogs=true`)
);
const results = await Promise.all(promises);
const trends = aggregateClientSide(results);
```

**Pros**:
- No backend changes needed
- Works immediately

**Cons**:
- Multiple HTTP requests (8 requests for 8 weeks)
- Higher latency (~800ms for 8 weeks vs ~200ms for single request)
- More complex frontend logic
- Higher bandwidth usage

**Recommendation**: **Option A (New Dedicated Endpoint)** for best performance and UX.

---

## Implementation Priority

**Suggested Timeline**:
- **Phase 1 (MVP)**: Implement Option 1 (Simplified Time Series) with `groupBy='total'` only
- **Phase 2 (Enhancement)**: Add `groupBy='brand'` and `groupBy='category'` support
- **Phase 3 (Future)**: Add month aggregation support

**Frontend Impact**:
- **Without this endpoint**: Story 4.7 cannot be completed optimally (using workaround with 12× API calls)
- **With this endpoint**: Story 4.7 can be completed with excellent UX and performance

---

## Testing Requirements

### Backend Tests
1. Unit tests for margin calculation across time range
2. Integration tests for week range queries
3. Edge cases:
   - No data in range
   - Partial data (some weeks missing)
   - All SKUs missing COGS
   - Week range exceeds 52 weeks
4. Performance tests for 52-week queries

### Frontend Integration Tests
1. MSW mock for time-series endpoint
2. Chart rendering with trend data
3. Tooltip interactivity
4. Error handling (no data, invalid range)

---

## Related Documentation

**Frontend**:
- Story 4.7: `docs/stories/4.7.margin-analysis-by-time-period.md`
- Epic 4 Overview: COGS Management & Margin Analysis

**Backend**:
- Epic 17: COGS & Margin Feature Integration
- Request #07: `docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md`
- Backend Response: `docs/request-backend/09-epic-18-backend-response.md`

**API Documentation**:
- Swagger: `/v1/analytics/weekly/*` endpoints
- Test API: `test-api/06-analytics-advanced.http` (Margin Trends)

---

## Questions for Backend Team

1. **Preferred date range parameter**: `weekStart/weekEnd` OR `weeks` (relative)?
2. **Maximum week range**: 52 weeks acceptable, or should we limit to fewer (e.g., 26)?
3. **Empty weeks behavior**: Skip weeks with no sales OR return with `revenue_net: 0`?
4. **Grouped trends priority**: Implement `groupBy` in Phase 1 or Phase 2?
5. **Caching strategy**: Backend caching for common ranges (e.g., last 12 weeks)?
6. **Month aggregation**: Include in initial implementation or defer to Phase 2?

---

## Status & Next Steps

**Current Status**: ✅ **IMPLEMENTED & WORKING** - Production-ready

**Backend Implementation**:
- ✅ Endpoint implemented: `GET /v1/analytics/weekly/margin-trends`
- ✅ Query parameters: `weeks` (relative, e.g., `?weeks=12`) or `weekStart/weekEnd` (ISO weeks)
- ✅ 3 critical bugfixes applied (2025-12-04) - see Bugfix History section above
- ✅ Returns 200 OK with margin trend data for up to 52 weeks
- ✅ Verified: 12 weeks of data returned successfully (2025-W37 to 2025-W48)

**Frontend Team Actions**:
- ✅ Created this request document
- ✅ Completed Stories 4.1-4.6 (6/7 Epic 4 stories)
- ✅ **Story 4.7 UNBLOCKED** - endpoint now available for integration
- ⏳ Integrate with `useMarginTrends` hook

**Files Changed (2025-12-04)**:
- `src/analytics/weekly-analytics.service.ts` - 3 bugfixes in `getMarginTrends()` method
- `test-api/06-analytics-advanced.http` - Margin Trends examples

---

## Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2025-11-23 | 1.0 | Initial request created | Frontend Team (Claude Code) |
| 2025-12-04 | 2.0 | **IMPLEMENTED** - 3 bugfixes applied, endpoint working | Backend Team (Claude Code) |
