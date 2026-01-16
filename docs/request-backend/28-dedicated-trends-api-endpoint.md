# Request #28: Dedicated Trends API Endpoint

**Date:** 2025-11-27
**Priority:** Low (Optional Enhancement)
**Source:** QA Review Recommendation (Story 3.4)
**Status:** ✅ Completed (2025-11-27)

## Problem

Currently, the frontend TrendGraph component (Story 3.4) fetches trend data by making **N separate requests** to the weekly analytics endpoint for each week in the range.

```typescript
// Current approach in useMarginTrends.ts
const weeks = ['2025-W44', '2025-W45', '2025-W46', '2025-W47'];
// Makes 4 separate API calls
const results = await Promise.all(weeks.map(week =>
  api.get(`/v1/analytics/weekly/finance-summary?week=${week}`)
));
```

### Issues:
1. **Multiple HTTP requests** - N requests for N weeks
2. **Increased latency** - Sequential or parallel, still slower than single request
3. **Higher server load** - Multiple DB queries instead of one optimized query
4. **Network overhead** - Multiple request/response cycles

## Proposed Solution

Create a dedicated endpoint that returns trend data for a date range in a single request:

```
GET /v1/analytics/trends?from=2025-W44&to=2025-W47&metrics=payout_total,sale_gross,logistics_cost
```

### Response Format:

```json
{
  "period": {
    "from": "2025-W44",
    "to": "2025-W47"
  },
  "data": [
    {
      "week": "2025-W44",
      "payout_total": 125000.50,
      "sale_gross": 450000.00,
      "logistics_cost": 45000.00
    },
    {
      "week": "2025-W45",
      "payout_total": 132000.75,
      "sale_gross": 480000.00,
      "logistics_cost": 48000.00
    },
    {
      "week": "2025-W46",
      "payout_total": 128500.25,
      "sale_gross": 465000.00,
      "logistics_cost": 46500.00
    },
    {
      "week": "2025-W47",
      "payout_total": 145000.00,
      "sale_gross": 520000.00,
      "logistics_cost": 52000.00
    }
  ],
  "summary": {
    "payout_total": { "min": 125000.50, "max": 145000.00, "avg": 132625.38, "trend": "+16%" },
    "sale_gross": { "min": 450000.00, "max": 520000.00, "avg": 478750.00, "trend": "+15.5%" },
    "logistics_cost": { "min": 45000.00, "max": 52000.00, "avg": 47875.00, "trend": "+15.5%" }
  }
}
```

### Benefits:
1. **Single request** - 1 request instead of N
2. **Lower latency** - ~50-70% faster response time
3. **Optimized query** - Single DB query with date range filter
4. **Optional summary** - Pre-calculated trend statistics

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | Yes | Start week (ISO format: YYYY-Www) |
| `to` | string | Yes | End week (ISO format: YYYY-Www) |
| `metrics` | string | No | Comma-separated list of metrics (default: all) |
| `report_type` | string | No | Filter by report type (rus/eaeu/total) |
| `include_summary` | boolean | No | Include trend summary (default: true) |

## Available Metrics

From `weekly_payout_summary` table:
- `payout_total` - Итого к оплате
- `sale_gross` - Продажи (gross)
- `to_pay_goods` - К перечислению за товар
- `logistics_cost` - Логистика
- `storage_cost` - Хранение
- `paid_acceptance_cost` - Платная приёмка
- `penalties_total` - Штрафы
- `loyalty_fee` - Комиссия лояльности
- `wb_commission_adj` - Комиссия WB

## Implementation Notes

### Backend (NestJS):

```typescript
// weekly-analytics.controller.ts
@Get('trends')
@ApiOperation({ summary: 'Get trend data for date range' })
async getTrends(
  @Query('from') from: string,
  @Query('to') to: string,
  @Query('metrics') metrics?: string,
  @Query('report_type') reportType?: string,
  @Query('include_summary') includeSummary?: boolean,
  @Headers('X-Cabinet-Id') cabinetId: string,
) {
  return this.weeklyAnalyticsService.getTrends({
    cabinetId,
    from,
    to,
    metrics: metrics?.split(','),
    reportType,
    includeSummary: includeSummary !== false,
  });
}
```

### Database Query:

```sql
SELECT
  week,
  payout_total,
  sale_gross,
  logistics_cost
FROM weekly_payout_summary
WHERE cabinet_id = $1
  AND week >= $2
  AND week <= $3
  AND report_type = 'total'
ORDER BY week ASC;
```

## Frontend Integration

```typescript
// hooks/useMarginTrends.ts (updated)
export function useMarginTrends(from: string, to: string, metrics?: string[]) {
  return useQuery({
    queryKey: ['analytics', 'trends', from, to, metrics],
    queryFn: async () => {
      const params = new URLSearchParams({ from, to });
      if (metrics) params.set('metrics', metrics.join(','));

      const response = await api.get(`/v1/analytics/trends?${params}`);
      return response.data;
    },
  });
}
```

## Priority & Timeline

- **Priority:** Low - Current N-request approach works, just not optimal
- **MVP Impact:** None - Not blocking any features
- **Recommendation:** Implement when optimizing API performance

## Related

- Story 3.4: Trend Graphs for Key Metrics
- Request #10: Margin Analysis Time Series Endpoint (similar concept)
- Epic 6: Advanced Analytics (potential future enhancement)

---

## Resolution

**Implemented in Story 6.6** (2025-11-27)

### Backend Implementation:
- Endpoint: `GET /v1/analytics/weekly/trends`
- Story: `docs/stories/epic-6/story-6.6-dedicated-trends-endpoint.md`
- DTOs: `src/analytics/dto/query/trends-query.dto.ts`, `src/analytics/dto/response/trends-response.dto.ts`
- Service: `src/analytics/weekly-analytics.service.ts:getTrends()`
- Controller: `src/analytics/weekly-analytics.controller.ts`

### Features:
- Single request for N weeks of trend data
- Dynamic metric selection via `metrics` parameter
- Summary statistics (min, max, avg, trend %)
- ~50-70% faster response time vs N separate requests

### Frontend Integration:
Update `useMarginTrends.ts` to use new endpoint for optimal performance.
