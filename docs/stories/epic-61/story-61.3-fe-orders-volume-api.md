# Story 61.3-FE: Orders Volume API Integration

**Epic**: 61-FE Dashboard Data Integration
**Status**: 📋 Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 5 SP

---

## Title

Интегрировать API объёма заказов

---

## Business Requirement

From stakeholder diagram:
- **Заказы** - First metric in the list
- Shows potential revenue from all orders (not just fulfilled sales)

---

## Problem Statement

| Current State | Required State |
|---------------|----------------|
| Dashboard shows only "Выкупы" (sales) | Dashboard needs "Заказы" (orders) |
| No Orders Volume API integration | Full integration with `/v1/analytics/orders/volume` |
| Can't calculate theoretical profit | Orders amount needed for formula |

**Backend endpoint exists but is NOT used on dashboard**.

---

## API Contract

**Endpoint**: `GET /v1/analytics/orders/volume`

**Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | string | Yes | Start date (YYYY-MM-DD) |
| `to` | string | Yes | End date (YYYY-MM-DD) |
| `aggregation` | string | No | `day` or `hour` (default: total) |

**Response**:
```typescript
interface OrdersVolumeResponse {
  total_orders: number;        // Total order count
  total_amount: number;        // Total order amount (Заказы ₽)
  avg_order_value: number;     // Average order value
  by_status: {
    new: number;               // Pending orders
    confirm: number;           // Confirmed orders
    complete: number;          // Completed orders
    cancel: number;            // Cancelled orders
  };
  by_day?: Array<{             // Only when aggregation=day
    date: string;              // YYYY-MM-DD
    orders: number;
    amount: number;
  }>;
  by_hour?: Array<{            // Only when aggregation=hour
    hour: number;              // 0-23
    orders: number;
    amount: number;
  }>;
}
```

---

## Acceptance Criteria

- [ ] Create `src/lib/api/orders-volume.ts` with `getOrdersVolume()` function
- [ ] Create `src/types/orders-volume.ts` with TypeScript interfaces
- [ ] Create `src/hooks/useOrdersVolume.ts` with React Query hook
- [ ] Support `aggregation=day` parameter for daily breakdown
- [ ] Handle date range conversion from ISO week to YYYY-MM-DD
- [ ] Add to query keys factory
- [ ] Cache configuration: staleTime 5 min, gcTime 10 min
- [ ] Export from hooks index

---

## Technical Implementation

### 1. Types (orders-volume.ts)

```typescript
// src/types/orders-volume.ts

export interface OrdersVolumeParams {
  from: string;  // YYYY-MM-DD
  to: string;    // YYYY-MM-DD
  aggregation?: 'day' | 'hour';
}

export interface OrderStatusBreakdown {
  new: number;
  confirm: number;
  complete: number;
  cancel: number;
}

export interface DailyOrderVolume {
  date: string;
  orders: number;
  amount: number;
}

export interface HourlyOrderVolume {
  hour: number;
  orders: number;
  amount: number;
}

export interface OrdersVolumeResponse {
  total_orders: number;
  total_amount: number;
  avg_order_value: number;
  by_status: OrderStatusBreakdown;
  by_day?: DailyOrderVolume[];
  by_hour?: HourlyOrderVolume[];
}

// Derived type for dashboard use
export interface OrdersVolumeMetrics {
  totalOrders: number;
  totalAmount: number;         // Заказы ₽
  avgOrderValue: number;
  completionRate: number;      // complete / total * 100
  cancellationRate: number;    // cancel / total * 100
  dailyBreakdown?: DailyOrderVolume[];
}
```

### 2. API Client (orders-volume.ts)

```typescript
// src/lib/api/orders-volume.ts

import { apiClient } from '@/lib/api-client';
import type {
  OrdersVolumeParams,
  OrdersVolumeResponse,
  OrdersVolumeMetrics,
} from '@/types/orders-volume';

/**
 * Get orders volume analytics for a date range
 *
 * @param params - Date range and aggregation options
 * @returns Orders volume with breakdown
 */
export async function getOrdersVolume(
  params: OrdersVolumeParams
): Promise<OrdersVolumeResponse> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  });

  if (params.aggregation) {
    searchParams.set('aggregation', params.aggregation);
  }

  return apiClient.get<OrdersVolumeResponse>(
    `/v1/analytics/orders/volume?${searchParams.toString()}`
  );
}

/**
 * Transform API response to dashboard-friendly metrics
 */
export function transformToMetrics(
  response: OrdersVolumeResponse
): OrdersVolumeMetrics {
  const total = response.total_orders || 1; // Avoid division by zero

  return {
    totalOrders: response.total_orders,
    totalAmount: response.total_amount,
    avgOrderValue: response.avg_order_value,
    completionRate: (response.by_status.complete / total) * 100,
    cancellationRate: (response.by_status.cancel / total) * 100,
    dailyBreakdown: response.by_day,
  };
}

// Query keys factory
export const ordersVolumeQueryKeys = {
  all: ['orders-volume'] as const,
  byRange: (from: string, to: string) =>
    [...ordersVolumeQueryKeys.all, from, to] as const,
  byRangeWithAggregation: (from: string, to: string, aggregation: string) =>
    [...ordersVolumeQueryKeys.byRange(from, to), aggregation] as const,
};
```

### 3. React Query Hook (useOrdersVolume.ts)

```typescript
// src/hooks/useOrdersVolume.ts

import { useQuery } from '@tanstack/react-query';
import {
  getOrdersVolume,
  transformToMetrics,
  ordersVolumeQueryKeys,
} from '@/lib/api/orders-volume';
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils';
import type { OrdersVolumeParams, OrdersVolumeMetrics } from '@/types/orders-volume';

interface UseOrdersVolumeOptions {
  /** Period type: 'week' or 'month' */
  periodType: 'week' | 'month';
  /** ISO week (YYYY-Www) or month (YYYY-MM) */
  period: string;
  /** Include daily breakdown */
  withDailyBreakdown?: boolean;
  /** Enable/disable query */
  enabled?: boolean;
}

/**
 * Hook to fetch orders volume for dashboard
 *
 * @example
 * const { data, isLoading } = useOrdersVolume({
 *   periodType: 'week',
 *   period: '2026-W05',
 *   withDailyBreakdown: true,
 * });
 */
export function useOrdersVolume(options: UseOrdersVolumeOptions) {
  const { periodType, period, withDailyBreakdown = false, enabled = true } = options;

  // Convert period to date range
  const dateRange = periodType === 'week'
    ? weekToDateRange(period)
    : monthToDateRange(period);

  const params: OrdersVolumeParams = {
    from: dateRange.from,
    to: dateRange.to,
    aggregation: withDailyBreakdown ? 'day' : undefined,
  };

  return useQuery({
    queryKey: ordersVolumeQueryKeys.byRangeWithAggregation(
      params.from,
      params.to,
      params.aggregation || 'total'
    ),
    queryFn: () => getOrdersVolume(params),
    select: transformToMetrics,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
    enabled: enabled && !!period,
    retry: 1,
  });
}

/**
 * Hook to fetch orders volume with comparison to previous period
 */
export function useOrdersVolumeWithComparison(options: UseOrdersVolumeOptions) {
  const currentQuery = useOrdersVolume(options);

  // Calculate previous period
  const previousPeriod = options.periodType === 'week'
    ? getPreviousWeek(options.period)
    : getPreviousMonth(options.period);

  const previousQuery = useOrdersVolume({
    ...options,
    period: previousPeriod,
  });

  return {
    current: currentQuery.data,
    previous: previousQuery.data,
    isLoading: currentQuery.isLoading || previousQuery.isLoading,
    isError: currentQuery.isError || previousQuery.isError,
  };
}

// Helper functions
function getPreviousWeek(week: string): string {
  // Implementation using date-fns
  // Input: "2026-W05" → Output: "2026-W04"
  // Handle year boundary: "2026-W01" → "2025-W52"
}

function getPreviousMonth(month: string): string {
  // Input: "2026-01" → Output: "2025-12"
}
```

---

## Integration with Dashboard

```typescript
// In DashboardContent.tsx or useDashboardMetrics.ts

import { useOrdersVolume } from '@/hooks/useOrdersVolume';
import { useDashboardPeriod } from '@/contexts/dashboard-period-context';

function DashboardOrdersMetric() {
  const { periodType, selectedWeek, selectedMonth } = useDashboardPeriod();

  const { data: ordersVolume, isLoading } = useOrdersVolume({
    periodType,
    period: periodType === 'week' ? selectedWeek : selectedMonth,
    withDailyBreakdown: true,
  });

  if (isLoading) return <Skeleton />;

  return (
    <MetricCardEnhanced
      title="Заказы"
      value={ordersVolume?.totalAmount}
      format="currency"
      tooltip="Потенциальный доход от всех заказов за период"
    />
  );
}
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/types/orders-volume.ts` | TypeScript interfaces |
| `src/lib/api/orders-volume.ts` | API client functions |
| `src/hooks/useOrdersVolume.ts` | React Query hook |

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/index.ts` | Export new hook |
| `src/types/index.ts` | Export new types |

---

## Test Cases

```typescript
describe('useOrdersVolume', () => {
  it('fetches orders volume for a week', async () => {
    // Mock API response
    // Verify correct date conversion
    // Verify metrics transformation
  });

  it('includes daily breakdown when requested', async () => {
    // Verify aggregation=day is passed
    // Verify dailyBreakdown is populated
  });

  it('handles API errors gracefully', async () => {
    // Mock 404 response
    // Verify error state
  });
});
```

---

## Definition of Done

- [ ] Types created and exported
- [ ] API client function implemented
- [ ] React Query hook with proper caching
- [ ] Date range conversion works for week/month
- [ ] Daily breakdown supported
- [ ] Query keys factory implemented
- [ ] Error handling for 404/400 responses
- [ ] Unit tests for transformations
- [ ] Code review approved

---

## References

- Backend doc: `docs/request-backend/121-DASHBOARD-MAIN-PAGE-ORDERS-API.md`
- Existing pattern: `src/hooks/useFinancialSummary.ts`
- Date utils: `src/lib/date-utils.ts`
