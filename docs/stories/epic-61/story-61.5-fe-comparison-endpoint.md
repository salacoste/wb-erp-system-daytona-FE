# Story 61.5-FE: Comparison Endpoint Integration

**Epic**: 61-FE Dashboard Data Integration
**Status**: 📋 Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 5 SP

---

## Title

Интегрировать эндпоинт сравнения периодов

---

## Problem Statement

| Current Implementation | Required Implementation |
|------------------------|------------------------|
| 2 separate API calls for current + previous period | Single `/comparison` endpoint |
| Manual delta calculation on frontend | Server-calculated deltas |
| Date ranges (YYYY-MM-DD) | ISO week format (YYYY-Www) |
| No breakdown by SKU/brand/category | Supports groupBy parameter |

**Backend provides dedicated comparison endpoint that is NOT used**.

---

## API Contract

**Endpoint**: `GET /v1/analytics/weekly/comparison`

**Parameters**:
| Param | Type | Required | Example |
|-------|------|----------|---------|
| `period1` | string | Yes | `2026-W05` or `2026-W01:W05` |
| `period2` | string | Yes | `2026-W04` or `2025-W49:W52` |
| `groupBy` | string | No | `sku`, `brand`, or `category` |

**Period Formats**:
- Single week: `2026-W05`
- Range (short): `2026-W01:W05` (same year)
- Range (full): `2025-W49:2026-W04` (cross-year)

**Response**:
```typescript
interface ComparisonResponse {
  period1: {
    week: string;           // "2026-W05" or "2026-W01:W05"
    revenue: number;        // wb_sales_gross
    profit: number;
    margin_pct: number;
    orders: number;
    cogs: number;
    logistics: number;
    storage: number;
    advertising: number;
  };
  period2: {
    week: string;
    revenue: number;
    profit: number;
    margin_pct: number;
    orders: number;
    cogs: number;
    logistics: number;
    storage: number;
    advertising: number;
  };
  delta: {
    revenue: { absolute: number; percent: number };
    profit: { absolute: number; percent: number };
    margin_pct: { absolute: number; percent: number };
    orders: { absolute: number; percent: number };
    cogs: { absolute: number; percent: number };
    logistics: { absolute: number; percent: number };
    storage: { absolute: number; percent: number };
    advertising: { absolute: number; percent: number };
  };
  breakdown?: Array<{       // Only when groupBy specified
    id: string;             // SKU/brand/category identifier
    name: string;
    period1_value: number;
    period2_value: number;
    delta_absolute: number;
    delta_percent: number;
  }>;
}
```

---

## Acceptance Criteria

- [ ] Create `src/lib/api/analytics-comparison.ts`
- [ ] Create `src/types/analytics-comparison.ts`
- [ ] Create `src/hooks/useAnalyticsComparison.ts`
- [ ] Support ISO week format for periods
- [ ] Support range format: `2026-W01:W05`
- [ ] Handle optional `groupBy` parameter
- [ ] Parse comparison response with delta values
- [ ] Replace existing 2-call pattern where applicable
- [ ] Add query keys factory

---

## Technical Implementation

### 1. Types (analytics-comparison.ts)

```typescript
// src/types/analytics-comparison.ts

export interface ComparisonParams {
  period1: string;  // "2026-W05" or "2026-W01:W05"
  period2: string;  // "2026-W04" or "2025-W49:W52"
  groupBy?: 'sku' | 'brand' | 'category';
}

export interface PeriodMetrics {
  week: string;
  revenue: number;
  profit: number;
  margin_pct: number;
  orders: number;
  cogs: number;
  logistics: number;
  storage: number;
  advertising: number;
}

export interface DeltaValue {
  absolute: number;
  percent: number;
}

export interface ComparisonDeltas {
  revenue: DeltaValue;
  profit: DeltaValue;
  margin_pct: DeltaValue;
  orders: DeltaValue;
  cogs: DeltaValue;
  logistics: DeltaValue;
  storage: DeltaValue;
  advertising: DeltaValue;
}

export interface BreakdownItem {
  id: string;
  name: string;
  period1_value: number;
  period2_value: number;
  delta_absolute: number;
  delta_percent: number;
}

export interface ComparisonResponse {
  period1: PeriodMetrics;
  period2: PeriodMetrics;
  delta: ComparisonDeltas;
  breakdown?: BreakdownItem[];
}

// Helper type for UI components
export interface MetricComparison {
  current: number;
  previous: number;
  change: number;        // Absolute difference
  changePercent: number; // Percentage change
  direction: 'up' | 'down' | 'neutral';
}
```

### 2. API Client (analytics-comparison.ts)

```typescript
// src/lib/api/analytics-comparison.ts

import { apiClient } from '@/lib/api-client';
import type {
  ComparisonParams,
  ComparisonResponse,
  MetricComparison,
} from '@/types/analytics-comparison';

/**
 * Get comparison analytics between two periods
 *
 * @param params - Period specifications
 * @returns Comparison data with calculated deltas
 */
export async function getAnalyticsComparison(
  params: ComparisonParams
): Promise<ComparisonResponse> {
  const searchParams = new URLSearchParams({
    period1: params.period1,
    period2: params.period2,
  });

  if (params.groupBy) {
    searchParams.set('groupBy', params.groupBy);
  }

  return apiClient.get<ComparisonResponse>(
    `/v1/analytics/weekly/comparison?${searchParams.toString()}`
  );
}

/**
 * Transform delta to UI-friendly MetricComparison
 */
export function deltaToComparison(
  current: number,
  previous: number,
  delta: { absolute: number; percent: number }
): MetricComparison {
  const direction = delta.percent > 0 ? 'up'
    : delta.percent < 0 ? 'down'
    : 'neutral';

  return {
    current,
    previous,
    change: delta.absolute,
    changePercent: delta.percent,
    direction,
  };
}

/**
 * Build comparison period string for MoM/QoQ/YoY
 */
export function buildPeriodRange(weeks: string[]): string {
  if (weeks.length === 0) return '';
  if (weeks.length === 1) return weeks[0];

  const first = weeks[0];
  const last = weeks[weeks.length - 1];

  // Check if same year
  const firstYear = first.split('-W')[0];
  const lastYear = last.split('-W')[0];

  if (firstYear === lastYear) {
    // Short format: 2026-W01:W05
    const lastWeekNum = last.split('-W')[1];
    return `${first}:W${lastWeekNum}`;
  } else {
    // Full format: 2025-W49:2026-W04
    return `${first}:${last}`;
  }
}

// Query keys factory
export const comparisonQueryKeys = {
  all: ['analytics-comparison'] as const,
  periods: (period1: string, period2: string) =>
    [...comparisonQueryKeys.all, period1, period2] as const,
  withGroupBy: (period1: string, period2: string, groupBy: string) =>
    [...comparisonQueryKeys.periods(period1, period2), groupBy] as const,
};
```

### 3. React Query Hook (useAnalyticsComparison.ts)

```typescript
// src/hooks/useAnalyticsComparison.ts

import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsComparison,
  deltaToComparison,
  comparisonQueryKeys,
} from '@/lib/api/analytics-comparison';
import type {
  ComparisonParams,
  ComparisonResponse,
  MetricComparison,
} from '@/types/analytics-comparison';

interface UseComparisonOptions extends ComparisonParams {
  enabled?: boolean;
}

/**
 * Hook to fetch period comparison analytics
 *
 * @example
 * const { data } = useAnalyticsComparison({
 *   period1: '2026-W05',
 *   period2: '2026-W04',
 * });
 *
 * // With breakdown:
 * const { data } = useAnalyticsComparison({
 *   period1: '2026-W01:W05',
 *   period2: '2025-W49:W52',
 *   groupBy: 'brand',
 * });
 */
export function useAnalyticsComparison(options: UseComparisonOptions) {
  const { period1, period2, groupBy, enabled = true } = options;

  return useQuery({
    queryKey: groupBy
      ? comparisonQueryKeys.withGroupBy(period1, period2, groupBy)
      : comparisonQueryKeys.periods(period1, period2),
    queryFn: () => getAnalyticsComparison({ period1, period2, groupBy }),
    staleTime: 5 * 60 * 1000,  // 5 minutes (historical data)
    gcTime: 10 * 60 * 1000,
    enabled: enabled && !!period1 && !!period2,
    retry: 1,
  });
}

/**
 * Hook for dashboard metrics with automatic comparison to previous period
 */
export function useDashboardComparison(currentWeek: string) {
  const previousWeek = getPreviousIsoWeek(currentWeek);

  const { data, isLoading, error } = useAnalyticsComparison({
    period1: currentWeek,
    period2: previousWeek,
  });

  // Transform to UI-friendly format
  const metrics: Record<string, MetricComparison> | null = data
    ? {
        revenue: deltaToComparison(
          data.period1.revenue,
          data.period2.revenue,
          data.delta.revenue
        ),
        profit: deltaToComparison(
          data.period1.profit,
          data.period2.profit,
          data.delta.profit
        ),
        margin: deltaToComparison(
          data.period1.margin_pct,
          data.period2.margin_pct,
          data.delta.margin_pct
        ),
        orders: deltaToComparison(
          data.period1.orders,
          data.period2.orders,
          data.delta.orders
        ),
      }
    : null;

  return {
    metrics,
    isLoading,
    error,
    raw: data,
  };
}

// Helper
function getPreviousIsoWeek(week: string): string {
  // "2026-W05" → "2026-W04"
  // "2026-W01" → "2025-W52" (or W53 for 53-week years)
  // Use date-fns for accurate calculation
}
```

---

## Migration Path

### Replace Current Pattern

**Before** (2 separate calls):
```typescript
const currentQuery = useDashboardMetrics(currentWeek);
const previousQuery = useDashboardMetrics(previousWeek);

// Manual delta calculation
const revenueChange = ((current - previous) / previous) * 100;
```

**After** (single call):
```typescript
const { metrics } = useDashboardComparison(currentWeek);

// Pre-calculated delta
const revenueChange = metrics.revenue.changePercent;
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/types/analytics-comparison.ts` | TypeScript interfaces |
| `src/lib/api/analytics-comparison.ts` | API client + helpers |
| `src/hooks/useAnalyticsComparison.ts` | React Query hooks |

---

## Definition of Done

- [ ] Types for all response shapes
- [ ] API client with ISO week support
- [ ] Range format helper (`buildPeriodRange`)
- [ ] React Query hook with caching
- [ ] `useDashboardComparison` convenience hook
- [ ] Query keys factory
- [ ] Error handling for invalid periods
- [ ] Unit tests for period format building
- [ ] Code review approved

---

## References

- Backend doc: `docs/request-backend/124-DASHBOARD-MAIN-PAGE-PERIODS-API.md`
- Period presets: `src/components/custom/analytics/period-presets.ts`
- Related: Story 61.6-FE (Fix Period Presets)
