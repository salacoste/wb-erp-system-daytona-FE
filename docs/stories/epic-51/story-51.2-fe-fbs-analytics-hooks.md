# Story 51.2-FE: FBS Analytics React Query Hooks

**Epic**: [51-FE FBS Historical Analytics](../../epics/epic-51-fe-fbs-historical-analytics.md)
**Status**: ✅ Complete
**Priority**: High
**Points**: 3
**Estimated Time**: 3-4 hours
**Sprint**: 2 (Feb 17-28)

---

## User Story

**As a** frontend developer,
**I want** React Query hooks for FBS historical analytics endpoints,
**So that** I can fetch trends, seasonal patterns, period comparisons, and manage backfill operations with proper caching and error handling.

---

## Background

Story 51.1 created TypeScript types and API client functions for FBS analytics. This story creates React Query hooks that:
- Provide data fetching with smart caching (5 min for analytics, 10s for backfill polling)
- Include smart aggregation helper for date ranges
- Support role-based access (backfill hooks = Owner only)
- Follow existing project patterns from `useStorageAnalytics.ts` and `useMarginTrends.ts`

**Dependencies**: Story 51.1 (Types & API Module) must be complete.

---

## Acceptance Criteria

### AC1: Query Keys Factory
- [ ] `fbsAnalyticsQueryKeys` object created with factory functions
- [ ] Keys follow TanStack Query v5 patterns with `as const`
- [ ] Separate keys for: `trends`, `seasonal`, `compare`, `backfillStatus`
- [ ] Keys include relevant params for cache differentiation

### AC2: Analytics Hooks (Public - All Roles)
- [ ] `useFbsTrends(params, options?)` hook for historical trends
- [ ] `useFbsSeasonal(params, options?)` hook for seasonal patterns
- [ ] `useFbsCompare(params, options?)` hook for period comparison
- [ ] All hooks support `enabled` option
- [ ] Proper error handling with type safety

### AC3: Backfill Admin Hooks (Owner Only)
- [ ] `useBackfillStatus(cabinetId?, options?)` hook with polling support
- [ ] `useStartBackfill()` mutation hook
- [ ] `usePauseBackfill()` mutation hook
- [ ] `useResumeBackfill()` mutation hook
- [ ] Mutations invalidate status queries on success

### AC4: Cache Configuration
- [ ] Analytics hooks: `staleTime: 5 * 60 * 1000` (5 minutes)
- [ ] Analytics hooks: `gcTime: 30 * 60 * 1000` (30 minutes)
- [ ] Backfill status: `staleTime: 10 * 1000` (10 seconds) for polling
- [ ] Backfill status: `refetchInterval` configurable (default 10s when enabled)

### AC5: Smart Aggregation Helper
- [ ] `getSmartAggregation(daysDiff)` function exported
- [ ] Returns `'day'` for 0-90 days
- [ ] Returns `'week'` for 91-180 days
- [ ] Returns `'month'` for 181-365 days

### AC6: Role-Based Access
- [ ] Backfill hooks check user role before execution
- [ ] Non-Owner users get clear error message
- [ ] Analytics hooks available to all authenticated roles

---

## Technical Implementation

### New File: `src/hooks/useFbsAnalytics.ts`

```typescript
/**
 * FBS Analytics React Query Hooks
 * Story 51.2-FE: FBS Analytics Hooks
 * Epic 51-FE: FBS Historical Analytics (365 Days)
 * Reference: docs/epics/epic-51-fe-fbs-historical-analytics.md
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFbsTrends,
  getFbsSeasonal,
  getFbsCompare,
  getBackfillStatus,
  startBackfill,
  pauseBackfill,
  resumeBackfill,
} from '@/lib/api/fbs-analytics'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import type {
  FbsTrendsParams,
  FbsTrendsResponse,
  FbsSeasonalParams,
  FbsSeasonalResponse,
  FbsCompareParams,
  FbsCompareResponse,
  BackfillStatusResponse,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillActionResponse,
} from '@/types/fbs-analytics'

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Cache configuration for FBS analytics
 * Analytics: 5 min stale, 30 min gc (matches backend cache TTL)
 * Backfill: 10s stale (for polling status updates)
 */
export const FBS_ANALYTICS_CACHE = {
  analytics: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes
  },
  backfill: {
    staleTime: 10 * 1000,       // 10 seconds
    gcTime: 5 * 60 * 1000,      // 5 minutes
    refetchInterval: 10 * 1000, // 10 seconds polling
  },
}

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for FBS analytics
 * Follows TanStack Query v5 patterns with factory functions
 */
export const fbsAnalyticsQueryKeys = {
  /** Base key for all FBS analytics queries */
  all: ['fbs-analytics'] as const,

  /** Key for trends queries */
  trends: (params: FbsTrendsParams) =>
    [...fbsAnalyticsQueryKeys.all, 'trends', params] as const,

  /** Key for seasonal patterns queries */
  seasonal: (params: FbsSeasonalParams) =>
    [...fbsAnalyticsQueryKeys.all, 'seasonal', params] as const,

  /** Key for period comparison queries */
  compare: (params: FbsCompareParams) =>
    [...fbsAnalyticsQueryKeys.all, 'compare', params] as const,

  /** Base key for backfill operations */
  backfill: () => [...fbsAnalyticsQueryKeys.all, 'backfill'] as const,

  /** Key for backfill status queries */
  backfillStatus: (cabinetId?: string) =>
    [...fbsAnalyticsQueryKeys.backfill(), 'status', cabinetId] as const,
}

// ============================================================================
// Smart Aggregation Helper
// ============================================================================

/**
 * Determine optimal aggregation level based on date range
 *
 * @param daysDiff - Number of days in the date range
 * @returns Aggregation level: 'day' | 'week' | 'month'
 *
 * @example
 * getSmartAggregation(30)   // 'day'
 * getSmartAggregation(120)  // 'week'
 * getSmartAggregation(365)  // 'month'
 */
export function getSmartAggregation(daysDiff: number): 'day' | 'week' | 'month' {
  if (daysDiff <= 90) return 'day'
  if (daysDiff <= 180) return 'week'
  return 'month'
}

/**
 * Calculate days difference between two dates
 * @param from - Start date string (YYYY-MM-DD)
 * @param to - End date string (YYYY-MM-DD)
 * @returns Number of days between dates
 */
export function calculateDaysDiff(from: string, to: string): number {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// ============================================================================
// Analytics Query Hooks (Public - All Roles)
// ============================================================================

export interface UseFbsTrendsOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
}

/**
 * Hook to fetch FBS historical order trends
 *
 * @param params - Query parameters (from, to, aggregation, metrics)
 * @param options - Hook options
 * @returns Query result with time series trend data
 *
 * @example
 * const { data, isLoading } = useFbsTrends({
 *   from: '2025-12-01',
 *   to: '2026-01-28',
 *   aggregation: 'day',
 * });
 *
 * @example
 * // With smart aggregation
 * const daysDiff = calculateDaysDiff(from, to);
 * const { data } = useFbsTrends({
 *   from,
 *   to,
 *   aggregation: getSmartAggregation(daysDiff),
 * });
 */
export function useFbsTrends(
  params: FbsTrendsParams,
  options: UseFbsTrendsOptions = {},
) {
  const { enabled = true, refetchInterval } = options

  return useQuery<FbsTrendsResponse, Error>({
    queryKey: fbsAnalyticsQueryKeys.trends(params),
    queryFn: () => getFbsTrends(params),
    enabled: enabled && !!params.from && !!params.to,
    staleTime: FBS_ANALYTICS_CACHE.analytics.staleTime,
    gcTime: FBS_ANALYTICS_CACHE.analytics.gcTime,
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

export interface UseFbsSeasonalOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch FBS seasonal patterns
 *
 * @param params - Query parameters (months, view)
 * @param options - Hook options
 * @returns Query result with seasonal patterns and insights
 *
 * @example
 * // Monthly patterns for last 12 months
 * const { data } = useFbsSeasonal({
 *   months: 12,
 *   view: 'monthly',
 * });
 *
 * @example
 * // Day of week patterns for last 6 months
 * const { data } = useFbsSeasonal({
 *   months: 6,
 *   view: 'weekly',
 * });
 */
export function useFbsSeasonal(
  params: FbsSeasonalParams,
  options: UseFbsSeasonalOptions = {},
) {
  const { enabled = true } = options

  return useQuery<FbsSeasonalResponse, Error>({
    queryKey: fbsAnalyticsQueryKeys.seasonal(params),
    queryFn: () => getFbsSeasonal(params),
    enabled,
    staleTime: FBS_ANALYTICS_CACHE.analytics.staleTime,
    gcTime: FBS_ANALYTICS_CACHE.analytics.gcTime,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

export interface UseFbsCompareOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to compare two time periods (MoM, QoQ, YoY)
 *
 * @param params - Query parameters with two period date ranges
 * @param options - Hook options
 * @returns Query result with comparison metrics and deltas
 *
 * @example
 * // Month-over-month comparison
 * const { data } = useFbsCompare({
 *   period1_from: '2025-12-01',
 *   period1_to: '2025-12-31',
 *   period2_from: '2026-01-01',
 *   period2_to: '2026-01-28',
 * });
 */
export function useFbsCompare(
  params: FbsCompareParams,
  options: UseFbsCompareOptions = {},
) {
  const { enabled = true } = options

  const isValid =
    !!params.period1_from &&
    !!params.period1_to &&
    !!params.period2_from &&
    !!params.period2_to

  return useQuery<FbsCompareResponse, Error>({
    queryKey: fbsAnalyticsQueryKeys.compare(params),
    queryFn: () => getFbsCompare(params),
    enabled: enabled && isValid,
    staleTime: FBS_ANALYTICS_CACHE.analytics.staleTime,
    gcTime: FBS_ANALYTICS_CACHE.analytics.gcTime,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// ============================================================================
// Backfill Admin Hooks (Owner Only)
// ============================================================================

export interface UseBackfillStatusOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Enable polling (default: false) */
  enablePolling?: boolean
  /** Polling interval in ms (default: 10000) */
  pollingInterval?: number
}

/**
 * Hook to fetch backfill status (Owner role required)
 *
 * @param cabinetId - Optional cabinet ID (all cabinets if not provided)
 * @param options - Hook options including polling configuration
 * @returns Query result with backfill status for cabinet(s)
 *
 * @example
 * // Get status for all cabinets with polling
 * const { data, isLoading } = useBackfillStatus(undefined, {
 *   enablePolling: true,
 * });
 *
 * @example
 * // Get status for specific cabinet
 * const { data } = useBackfillStatus(cabinetId);
 */
export function useBackfillStatus(
  cabinetId?: string,
  options: UseBackfillStatusOptions = {},
) {
  const { enabled = true, enablePolling = false, pollingInterval } = options
  const { user } = useAuthStore()

  // Role check: Only Owner can access backfill endpoints
  const isOwner = user?.role === 'owner'

  return useQuery<BackfillStatusResponse[], Error>({
    queryKey: fbsAnalyticsQueryKeys.backfillStatus(cabinetId),
    queryFn: async () => {
      if (!isOwner) {
        throw new Error('Доступ запрещен: требуется роль Owner')
      }
      return getBackfillStatus(cabinetId)
    },
    enabled: enabled && isOwner,
    staleTime: FBS_ANALYTICS_CACHE.backfill.staleTime,
    gcTime: FBS_ANALYTICS_CACHE.backfill.gcTime,
    refetchInterval: enablePolling
      ? (pollingInterval ?? FBS_ANALYTICS_CACHE.backfill.refetchInterval)
      : undefined,
    retry: 1,
  })
}

export interface UseStartBackfillOptions {
  /** Callback on successful start */
  onSuccess?: (data: StartBackfillResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook to start backfill process (Owner role required)
 *
 * @param options - Mutation options (callbacks)
 * @returns Mutation object with mutate function and state
 *
 * @example
 * const { mutate: startBackfill, isPending } = useStartBackfill({
 *   onSuccess: (data) => {
 *     console.log(`Started ${data.jobCount} jobs`);
 *   },
 * });
 *
 * startBackfill({
 *   cabinetId: 'uuid',
 *   dataSource: 'both',
 * });
 */
export function useStartBackfill(options: UseStartBackfillOptions = {}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation<StartBackfillResponse, Error, StartBackfillRequest>({
    mutationFn: async (request) => {
      // Role check
      if (user?.role !== 'owner') {
        throw new Error('Доступ запрещен: требуется роль Owner')
      }
      return startBackfill(request)
    },
    onSuccess: (data) => {
      console.info('[FBS Analytics] Backfill started:', {
        jobCount: data.jobCount,
        message: data.message,
      })

      // Invalidate backfill status to refetch
      queryClient.invalidateQueries({
        queryKey: fbsAnalyticsQueryKeys.backfill(),
      })

      toast.success('Импорт исторических данных запущен', {
        description: `Создано ${data.jobCount} задач`,
      })

      options.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('[FBS Analytics] Backfill start failed:', error)

      toast.error('Ошибка запуска импорта', {
        description: error.message,
      })

      options.onError?.(error)
    },
  })
}

export interface UsePauseBackfillOptions {
  /** Callback on successful pause */
  onSuccess?: (data: BackfillActionResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook to pause backfill process (Owner role required)
 *
 * @param options - Mutation options (callbacks)
 * @returns Mutation object with mutate function and state
 *
 * @example
 * const { mutate: pause, isPending } = usePauseBackfill();
 * pause({ cabinetId: 'uuid' });
 */
export function usePauseBackfill(options: UsePauseBackfillOptions = {}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation<BackfillActionResponse, Error, { cabinetId: string }>({
    mutationFn: async ({ cabinetId }) => {
      // Role check
      if (user?.role !== 'owner') {
        throw new Error('Доступ запрещен: требуется роль Owner')
      }
      return pauseBackfill(cabinetId)
    },
    onSuccess: (data) => {
      console.info('[FBS Analytics] Backfill paused:', data.message)

      // Invalidate backfill status to refetch
      queryClient.invalidateQueries({
        queryKey: fbsAnalyticsQueryKeys.backfill(),
      })

      toast.success('Импорт приостановлен', {
        description: data.message,
      })

      options.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('[FBS Analytics] Backfill pause failed:', error)

      toast.error('Ошибка приостановки импорта', {
        description: error.message,
      })

      options.onError?.(error)
    },
  })
}

export interface UseResumeBackfillOptions {
  /** Callback on successful resume */
  onSuccess?: (data: BackfillActionResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook to resume backfill process (Owner role required)
 *
 * @param options - Mutation options (callbacks)
 * @returns Mutation object with mutate function and state
 *
 * @example
 * const { mutate: resume, isPending } = useResumeBackfill();
 * resume({ cabinetId: 'uuid' });
 */
export function useResumeBackfill(options: UseResumeBackfillOptions = {}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation<BackfillActionResponse, Error, { cabinetId: string }>({
    mutationFn: async ({ cabinetId }) => {
      // Role check
      if (user?.role !== 'owner') {
        throw new Error('Доступ запрещен: требуется роль Owner')
      }
      return resumeBackfill(cabinetId)
    },
    onSuccess: (data) => {
      console.info('[FBS Analytics] Backfill resumed:', data.message)

      // Invalidate backfill status to refetch
      queryClient.invalidateQueries({
        queryKey: fbsAnalyticsQueryKeys.backfill(),
      })

      toast.success('Импорт возобновлен', {
        description: data.message,
      })

      options.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('[FBS Analytics] Backfill resume failed:', error)

      toast.error('Ошибка возобновления импорта', {
        description: error.message,
      })

      options.onError?.(error)
    },
  })
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to invalidate all FBS analytics queries
 * Use after successful backfill completion to refresh data
 *
 * @returns Function to invalidate all FBS analytics queries
 *
 * @example
 * const invalidateFbs = useInvalidateFbsAnalyticsQueries();
 * if (status === 'completed') {
 *   invalidateFbs();
 * }
 */
export function useInvalidateFbsAnalyticsQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[FBS Analytics] Invalidating all FBS analytics queries')
    queryClient.invalidateQueries({ queryKey: fbsAnalyticsQueryKeys.all })
  }
}

/**
 * Hook to check if current user can access backfill admin features
 *
 * @returns Object with canAccessBackfill boolean and user role
 *
 * @example
 * const { canAccessBackfill } = useCanAccessBackfill();
 * if (!canAccessBackfill) return <AccessDenied />;
 */
export function useCanAccessBackfill() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'

  return {
    canAccessBackfill: isOwner,
    userRole: user?.role ?? null,
  }
}
```

---

## Tasks / Subtasks

### Phase 1: Create Query Keys and Cache Config (20 min)
- [ ] Create `src/hooks/useFbsAnalytics.ts`
- [ ] Define `FBS_ANALYTICS_CACHE` configuration object
- [ ] Define `fbsAnalyticsQueryKeys` factory object
- [ ] Export `getSmartAggregation` and `calculateDaysDiff` helpers

### Phase 2: Implement Analytics Hooks (45 min)
- [ ] Implement `useFbsTrends` hook
- [ ] Implement `useFbsSeasonal` hook
- [ ] Implement `useFbsCompare` hook
- [ ] Add JSDoc with usage examples

### Phase 3: Implement Backfill Hooks (60 min)
- [ ] Implement `useBackfillStatus` hook with polling
- [ ] Implement `useStartBackfill` mutation hook
- [ ] Implement `usePauseBackfill` mutation hook
- [ ] Implement `useResumeBackfill` mutation hook
- [ ] Add role checks to all backfill hooks
- [ ] Add toast notifications

### Phase 4: Helper Hooks (15 min)
- [ ] Implement `useInvalidateFbsAnalyticsQueries`
- [ ] Implement `useCanAccessBackfill`

### Phase 5: Verification (30 min)
- [ ] Run `npm run type-check` - must pass
- [ ] Run `npm run lint` - must pass
- [ ] Verify hook exports in component
- [ ] Manual test with browser console

---

## API Endpoints Reference

### Analytics Endpoints (All Roles)

| Endpoint | Hook | Cache |
|----------|------|-------|
| `GET /v1/analytics/orders/trends` | `useFbsTrends` | 5 min |
| `GET /v1/analytics/orders/seasonal` | `useFbsSeasonal` | 5 min |
| `GET /v1/analytics/orders/compare` | `useFbsCompare` | 5 min |

### Admin Endpoints (Owner Only)

| Endpoint | Hook | Cache |
|----------|------|-------|
| `GET /v1/admin/backfill/status` | `useBackfillStatus` | 10s (polling) |
| `POST /v1/admin/backfill/start` | `useStartBackfill` | - |
| `POST /v1/admin/backfill/pause` | `usePauseBackfill` | - |
| `POST /v1/admin/backfill/resume` | `useResumeBackfill` | - |

---

## Testing Checklist

### Unit Tests: `src/hooks/__tests__/useFbsAnalytics.test.ts`

```typescript
describe('fbsAnalyticsQueryKeys', () => {
  it('should generate correct trends query key')
  it('should generate correct seasonal query key')
  it('should generate correct compare query key')
  it('should generate correct backfill status query key')
})

describe('getSmartAggregation', () => {
  it('should return day for 0-90 days')
  it('should return week for 91-180 days')
  it('should return month for 181-365 days')
})

describe('useFbsTrends', () => {
  it('should fetch trends with proper params')
  it('should respect enabled option')
  it('should use correct cache times')
})

describe('useFbsSeasonal', () => {
  it('should fetch seasonal patterns')
  it('should handle view parameter')
})

describe('useFbsCompare', () => {
  it('should fetch period comparison')
  it('should validate both periods are provided')
})

describe('useBackfillStatus', () => {
  it('should fetch status for Owner role')
  it('should throw error for non-Owner')
  it('should poll when enabled')
})

describe('useStartBackfill', () => {
  it('should start backfill and invalidate status')
  it('should show success toast')
  it('should block non-Owner users')
})
```

### Manual Testing

1. **Analytics Hooks**
   ```typescript
   // In browser console (after logging in)
   const { data } = await queryClient.fetchQuery({
     queryKey: ['fbs-analytics', 'trends', { from: '2026-01-01', to: '2026-01-28' }],
     queryFn: () => getFbsTrends({ from: '2026-01-01', to: '2026-01-28' }),
   });
   console.log(data.trends.length);
   console.log(data.summary);
   ```

2. **Backfill Hooks (Owner only)**
   ```typescript
   // Start backfill
   const startMutation = useStartBackfill();
   startMutation.mutate({ cabinetId: 'uuid', dataSource: 'both' });

   // Check status with polling
   const { data } = useBackfillStatus(undefined, { enablePolling: true });
   ```

3. **Smart Aggregation**
   ```typescript
   console.log(getSmartAggregation(30));   // 'day'
   console.log(getSmartAggregation(120));  // 'week'
   console.log(getSmartAggregation(365));  // 'month'
   ```

---

## Dependencies

- **Prerequisite**: Story 51.1 (Types & API Module) complete
- **Backend**: Epic 51 API ready (all endpoints)
- **Libraries**: `@tanstack/react-query`, `sonner` (toast)

---

## Definition of Done

- [ ] `fbsAnalyticsQueryKeys` factory created with all keys
- [ ] `FBS_ANALYTICS_CACHE` configuration exported
- [ ] `getSmartAggregation` helper function works correctly
- [ ] `useFbsTrends` hook implemented and tested
- [ ] `useFbsSeasonal` hook implemented and tested
- [ ] `useFbsCompare` hook implemented and tested
- [ ] `useBackfillStatus` hook with polling implemented
- [ ] `useStartBackfill` mutation hook with toast
- [ ] `usePauseBackfill` mutation hook with toast
- [ ] `useResumeBackfill` mutation hook with toast
- [ ] All backfill hooks enforce Owner role check
- [ ] `useCanAccessBackfill` helper hook created
- [ ] `useInvalidateFbsAnalyticsQueries` helper hook created
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] JSDoc documentation complete with examples
- [ ] Unit tests written (>=80% coverage)
- [ ] Manual testing complete
- [ ] Code review approved
- [ ] Story marked DONE

---

## Notes

### Cache Strategy Rationale

- **5 min staleTime for analytics**: Matches backend cache TTL. FBS order data doesn't change frequently (daily sync).
- **30 min gcTime for analytics**: Keep data in memory for users navigating between pages.
- **10s staleTime for backfill**: Admin needs near-real-time progress updates during active backfill.

### Role-Based Access

Only **Owner** role can access backfill admin endpoints. This is enforced:
1. Frontend: Hooks throw error before API call
2. Backend: 403 Forbidden if role check fails

Non-Owner users should see the analytics data but not the admin features.

### Smart Aggregation

Helps prevent overwhelming charts with too many data points:
- Daily data for short ranges (readable)
- Weekly aggregation for medium ranges (quarterly view)
- Monthly aggregation for yearly views

---

## Related

- [Epic 51-FE](../../epics/epic-51-fe-fbs-historical-analytics.md) - Parent epic
- [Story 51.1-FE](./story-51.1-fe-types-api-client.md) - Types & API Module (prerequisite)
- [Story 51.10-FE](./story-51.10-fe-backfill-admin-types-hooks.md) - Backfill specific story
- [Backend HTTP Reference](../../../../test-api/15-analytics-fbs.http) - API contracts

---

*Created: 2026-01-29*
*Sprint: 2 (Feb 17-28)*
