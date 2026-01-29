# Story 51.1-FE: FBS Analytics Types & API Module

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Priority**: High
- **Points**: 2
- **Status**: ✅ Complete
- **Sprint**: Sprint 2 (Feb 17-28)

## User Story

**As a** frontend developer,
**I want** TypeScript types and API client functions for FBS historical analytics,
**So that** I can safely integrate with the backend API endpoints for trends, seasonal patterns, and period comparison.

## Acceptance Criteria

### AC1: TypeScript Types for Analytics Endpoints
- [ ] Create `types/fbs-analytics.ts` with all response/request types
- [ ] Types match backend API response structure (from `15-analytics-fbs.http`)
- [ ] Proper nullability handling where applicable
- [ ] Discriminated unions for aggregation types

### AC2: TypeScript Types for Admin Backfill Endpoints
- [ ] Backfill status types (pending, in_progress, completed, failed, paused)
- [ ] Backfill progress tracking types
- [ ] Start/Pause/Resume request/response types

### AC3: API Client Functions
- [ ] `getFbsTrends(params)` - GET /v1/analytics/orders/trends
- [ ] `getFbsSeasonal(params)` - GET /v1/analytics/orders/seasonal
- [ ] `getFbsCompare(params)` - GET /v1/analytics/orders/compare
- [ ] `startBackfill(params)` - POST /v1/admin/backfill/start
- [ ] `getBackfillStatus(cabinetId?)` - GET /v1/admin/backfill/status
- [ ] `pauseBackfill(cabinetId)` - POST /v1/admin/backfill/pause
- [ ] `resumeBackfill(cabinetId)` - POST /v1/admin/backfill/resume

### AC4: Query Parameter Types
- [ ] `FbsTrendsParams` with from, to, aggregation, metrics
- [ ] `FbsSeasonalParams` with months, view
- [ ] `FbsCompareParams` with period1_from/to, period2_from/to
- [ ] Proper enum types for aggregation and view options

## Tasks / Subtasks

### Phase 1: Analytics Response Types
- [ ] Create `src/types/fbs-analytics.ts`
- [ ] Define `TrendDataPoint` interface
- [ ] Define `TrendsSummary` interface
- [ ] Define `DataSourceInfo` interface
- [ ] Define `TrendsPeriodInfo` interface
- [ ] Define `TrendsResponse` interface
- [ ] Define `MonthlyPattern` interface
- [ ] Define `WeekdayPattern` interface
- [ ] Define `QuarterlyPattern` interface
- [ ] Define `SeasonalPatterns` interface
- [ ] Define `SeasonalInsights` interface
- [ ] Define `SeasonalResponse` interface
- [ ] Define `PeriodMetrics` interface
- [ ] Define `ComparisonMetrics` interface
- [ ] Define `CompareResponse` interface

### Phase 2: Admin Backfill Types
- [ ] Define `BackfillStatus` type (union)
- [ ] Define `DataSource` type (union)
- [ ] Define `StartBackfillRequest` interface
- [ ] Define `StartBackfillResponse` interface
- [ ] Define `BackfillCabinetStatus` interface
- [ ] Define `BackfillStatusResponse` type (array)
- [ ] Define `BackfillActionRequest` interface
- [ ] Define `BackfillActionResponse` interface

### Phase 3: Query Parameter Types
- [ ] Define `AggregationType` type ('day' | 'week' | 'month')
- [ ] Define `SeasonalViewType` type ('monthly' | 'weekly' | 'quarterly')
- [ ] Define `FbsTrendsParams` interface
- [ ] Define `FbsSeasonalParams` interface
- [ ] Define `FbsCompareParams` interface

### Phase 4: API Client Functions
- [ ] Create `src/lib/api/fbs-analytics.ts`
- [ ] Implement `getFbsTrends(params)`
- [ ] Implement `getFbsSeasonal(params)`
- [ ] Implement `getFbsCompare(params)`
- [ ] Implement `startBackfill(params)`
- [ ] Implement `getBackfillStatus(cabinetId?)`
- [ ] Implement `pauseBackfill(cabinetId)`
- [ ] Implement `resumeBackfill(cabinetId)`
- [ ] Add query string builder utility
- [ ] Add request/response logging (dev mode)
- [ ] Add error handling for 400/401/403

### Phase 5: Export & Integration
- [ ] Export all types from types index (if exists)
- [ ] Verify no TypeScript errors
- [ ] Add JSDoc comments for all interfaces

## Technical Details

### Types Definition

```typescript
// src/types/fbs-analytics.ts

/**
 * FBS Historical Analytics Types
 * Story 51.1-FE: Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 * Reference: test-api/15-analytics-fbs.http
 */

// ============================================================================
// Aggregation & View Types
// ============================================================================

/**
 * Aggregation level for trends data
 */
export type AggregationType = 'day' | 'week' | 'month'

/**
 * View type for seasonal patterns
 */
export type SeasonalViewType = 'monthly' | 'weekly' | 'quarterly'

/**
 * Metrics that can be requested
 */
export type TrendMetric = 'orders' | 'revenue' | 'cancellations'

// ============================================================================
// GET /v1/analytics/orders/trends Types
// ============================================================================

/**
 * Single data point in time series
 */
export interface TrendDataPoint {
  /** Date or period identifier (YYYY-MM-DD for daily, YYYY-Www for weekly) */
  date: string
  /** Number of orders in this period */
  ordersCount: number
  /** Total revenue in RUB */
  revenue: number
  /** Number of cancelled orders */
  cancellations: number
  /** Cancellation rate as percentage */
  cancellationRate: number
  /** Number of returned orders */
  returns: number
  /** Return rate as percentage */
  returnRate: number
  /** Average order value in RUB */
  avgOrderValue: number
}

/**
 * Summary statistics for the entire period
 */
export interface TrendsSummary {
  /** Total orders in the period */
  totalOrders: number
  /** Total revenue in RUB */
  totalRevenue: number
  /** Average daily order count */
  avgDailyOrders: number
  /** Overall cancellation rate % */
  cancellationRate: number
  /** Overall return rate % */
  returnRate: number
}

/**
 * Information about data source
 */
export interface DataSourceInfo {
  /** Primary data source used */
  primary: 'orders_fbs' | 'reports' | 'analytics'
}

/**
 * Period information for the query
 */
export interface TrendsPeriodInfo {
  /** Start date (YYYY-MM-DD) */
  from: string
  /** End date (YYYY-MM-DD) */
  to: string
  /** Aggregation level used */
  aggregation: AggregationType
  /** Number of days included in the period */
  daysIncluded: number
}

/**
 * Response from GET /v1/analytics/orders/trends
 */
export interface TrendsResponse {
  /** Time series data points */
  trends: TrendDataPoint[]
  /** Aggregated summary statistics */
  summary: TrendsSummary
  /** Data source information */
  dataSource: DataSourceInfo
  /** Query period details */
  period: TrendsPeriodInfo
}

// ============================================================================
// GET /v1/analytics/orders/seasonal Types
// ============================================================================

/**
 * Monthly pattern data
 */
export interface MonthlyPattern {
  /** Month name (e.g., "January", "February") */
  month: string
  /** Average orders for this month */
  avgOrders: number
  /** Average revenue for this month in RUB */
  avgRevenue: number
}

/**
 * Day of week pattern data
 */
export interface WeekdayPattern {
  /** Day name (e.g., "Sunday", "Monday") */
  dayOfWeek: string
  /** Average orders for this day */
  avgOrders: number
}

/**
 * Quarterly pattern data
 */
export interface QuarterlyPattern {
  /** Quarter identifier (e.g., "Q1", "Q2") */
  quarter: string
  /** Average orders for this quarter */
  avgOrders: number
  /** Average revenue for this quarter in RUB */
  avgRevenue: number
}

/**
 * Collection of seasonal patterns
 */
export interface SeasonalPatterns {
  /** Monthly averages (available when view=monthly or default) */
  monthly?: MonthlyPattern[]
  /** Day of week averages (available when view=weekly) */
  weekday?: WeekdayPattern[]
  /** Quarterly averages (available when view=quarterly) */
  quarterly?: QuarterlyPattern[]
}

/**
 * Insights derived from seasonal analysis
 */
export interface SeasonalInsights {
  /** Month with highest average orders */
  peakMonth: string
  /** Month with lowest average orders */
  lowMonth: string
  /** Day of week with highest average orders */
  peakDayOfWeek: string
  /** Seasonality index (0-1, higher = more seasonal variation) */
  seasonalityIndex: number
}

/**
 * Response from GET /v1/analytics/orders/seasonal
 */
export interface SeasonalResponse {
  /** Seasonal patterns by view type */
  patterns: SeasonalPatterns
  /** Insights derived from patterns */
  insights: SeasonalInsights
}

// ============================================================================
// GET /v1/analytics/orders/compare Types
// ============================================================================

/**
 * Metrics for a single period in comparison
 */
export interface PeriodMetrics {
  /** Start date (YYYY-MM-DD) */
  from: string
  /** End date (YYYY-MM-DD) */
  to: string
  /** Number of orders in this period */
  ordersCount: number
  /** Total revenue in RUB */
  revenue: number
  /** Cancellation rate % */
  cancellationRate: number
  /** Average order value in RUB */
  avgOrderValue: number
}

/**
 * Calculated differences between two periods
 */
export interface ComparisonMetrics {
  /** Absolute change in order count */
  ordersChange: number
  /** Percentage change in order count */
  ordersChangePercent: number
  /** Absolute change in revenue (RUB) */
  revenueChange: number
  /** Percentage change in revenue */
  revenueChangePercent: number
  /** Change in cancellation rate (percentage points) */
  cancellationRateChange: number
  /** Absolute change in average order value (RUB) */
  avgOrderValueChange: number
  /** Percentage change in average order value */
  avgOrderValueChangePercent: number
}

/**
 * Response from GET /v1/analytics/orders/compare
 */
export interface CompareResponse {
  /** First period metrics */
  period1: PeriodMetrics
  /** Second period metrics */
  period2: PeriodMetrics
  /** Calculated comparison metrics */
  comparison: ComparisonMetrics
}

// ============================================================================
// Admin Backfill Types
// ============================================================================

/**
 * Backfill job status
 */
export type BackfillStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'paused'

/**
 * Data source for backfill
 */
export type BackfillDataSource = 'reports' | 'analytics' | 'both'

/**
 * Request to start backfill
 * POST /v1/admin/backfill/start
 */
export interface StartBackfillRequest {
  /** Target cabinet ID (optional - omit for all cabinets) */
  cabinetId?: string
  /** Data source to backfill */
  dataSource: BackfillDataSource
  /** Custom start date (optional, defaults to 365 days ago) */
  dateFrom?: string
  /** Custom end date (optional, defaults to today) */
  dateTo?: string
  /** Job priority (optional, default 10) */
  priority?: number
}

/**
 * Response from POST /v1/admin/backfill/start
 */
export interface StartBackfillResponse {
  /** Operation success flag */
  success: boolean
  /** Status message */
  message: string
  /** Number of jobs enqueued */
  jobCount: number
  /** List of job IDs created */
  jobIds: string[]
}

/**
 * Status of backfill for a single cabinet
 */
export interface BackfillCabinetStatus {
  /** Cabinet UUID */
  cabinetId: string
  /** Cabinet display name */
  cabinetName: string
  /** Status of reports backfill */
  reportsStatus: BackfillStatus
  /** Status of analytics backfill */
  analyticsStatus: BackfillStatus
  /** Overall progress percentage (0-100) */
  overallProgress: number
  /** Estimated completion time (ISO 8601) or null if not calculable */
  estimatedEta: string | null
  /** List of error messages (empty if no errors) */
  errors: string[]
}

/**
 * Response from GET /v1/admin/backfill/status
 * Returns array of cabinet statuses
 */
export type BackfillStatusResponse = BackfillCabinetStatus[]

/**
 * Request for pause/resume actions
 * POST /v1/admin/backfill/pause
 * POST /v1/admin/backfill/resume
 */
export interface BackfillActionRequest {
  /** Target cabinet ID */
  cabinetId: string
}

/**
 * Response from pause/resume actions
 */
export interface BackfillActionResponse {
  /** Operation success flag */
  success: boolean
  /** Status message */
  message: string
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Parameters for GET /v1/analytics/orders/trends
 */
export interface FbsTrendsParams {
  /** Start date (YYYY-MM-DD) */
  from: string
  /** End date (YYYY-MM-DD) */
  to: string
  /** Aggregation level (default: 'day') */
  aggregation?: AggregationType
  /** Metrics to include (optional filter) */
  metrics?: TrendMetric[]
}

/**
 * Parameters for GET /v1/analytics/orders/seasonal
 */
export interface FbsSeasonalParams {
  /** Number of months to analyze (1-12, default: 12) */
  months?: number
  /** View type for patterns (default: returns all) */
  view?: SeasonalViewType
}

/**
 * Parameters for GET /v1/analytics/orders/compare
 */
export interface FbsCompareParams {
  /** First period start date (YYYY-MM-DD) */
  period1From: string
  /** First period end date (YYYY-MM-DD) */
  period1To: string
  /** Second period start date (YYYY-MM-DD) */
  period2From: string
  /** Second period end date (YYYY-MM-DD) */
  period2To: string
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * API error codes for FBS analytics
 */
export type FbsAnalyticsErrorCode =
  | 'INVALID_DATE_FORMAT'
  | 'INVALID_DATE_RANGE'
  | 'DATE_RANGE_EXCEEDED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CABINET_NOT_FOUND'

/**
 * Structured error response
 */
export interface FbsAnalyticsError {
  error: {
    code: FbsAnalyticsErrorCode
    message: string
  }
}
```

### API Client Implementation

```typescript
// src/lib/api/fbs-analytics.ts

/**
 * FBS Historical Analytics API Client
 * Story 51.1-FE: Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 * Reference: test-api/15-analytics-fbs.http
 */

import { apiClient } from '../api-client'
import type {
  FbsTrendsParams,
  TrendsResponse,
  FbsSeasonalParams,
  SeasonalResponse,
  FbsCompareParams,
  CompareResponse,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillStatusResponse,
  BackfillActionRequest,
  BackfillActionResponse,
} from '@/types/fbs-analytics'

/**
 * Build query string from params object
 * Filters out undefined/null values
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.append(key, value.join(','))
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

// ============================================================================
// Analytics Endpoints (Public)
// ============================================================================

/**
 * Get historical order trends
 * GET /v1/analytics/orders/trends
 *
 * @param params - Query parameters (from, to, aggregation, metrics)
 * @returns Time series data with summary and period info
 *
 * @example
 * const data = await getFbsTrends({
 *   from: '2025-12-01',
 *   to: '2026-01-28',
 *   aggregation: 'day',
 * });
 */
export async function getFbsTrends(
  params: FbsTrendsParams,
): Promise<TrendsResponse> {
  const queryParams = buildQueryString({
    from: params.from,
    to: params.to,
    aggregation: params.aggregation,
    metrics: params.metrics,
  })

  console.info('[FBS Analytics] Fetching trends:', {
    from: params.from,
    to: params.to,
    aggregation: params.aggregation ?? 'day',
  })

  const response = await apiClient.get<TrendsResponse>(
    `/v1/analytics/orders/trends?${queryParams}`,
    { skipDataUnwrap: true },
  )

  console.info('[FBS Analytics] Trends response:', {
    dataPoints: response.trends?.length ?? 0,
    period: response.period?.daysIncluded ?? 0,
  })

  return response
}

/**
 * Get seasonal patterns analysis
 * GET /v1/analytics/orders/seasonal
 *
 * @param params - Query parameters (months, view)
 * @returns Seasonal patterns with insights
 *
 * @example
 * const data = await getFbsSeasonal({
 *   months: 12,
 *   view: 'monthly',
 * });
 */
export async function getFbsSeasonal(
  params?: FbsSeasonalParams,
): Promise<SeasonalResponse> {
  const queryParams = buildQueryString({
    months: params?.months,
    view: params?.view,
  })

  console.info('[FBS Analytics] Fetching seasonal patterns:', {
    months: params?.months ?? 12,
    view: params?.view ?? 'all',
  })

  const url = queryParams
    ? `/v1/analytics/orders/seasonal?${queryParams}`
    : '/v1/analytics/orders/seasonal'

  const response = await apiClient.get<SeasonalResponse>(url, {
    skipDataUnwrap: true,
  })

  console.info('[FBS Analytics] Seasonal response:', {
    hasMonthly: !!response.patterns?.monthly,
    hasWeekday: !!response.patterns?.weekday,
    hasQuarterly: !!response.patterns?.quarterly,
  })

  return response
}

/**
 * Compare two time periods
 * GET /v1/analytics/orders/compare
 *
 * @param params - Two period date ranges
 * @returns Period metrics and comparison deltas
 *
 * @example
 * // Month-over-month comparison
 * const data = await getFbsCompare({
 *   period1From: '2025-12-01',
 *   period1To: '2025-12-31',
 *   period2From: '2026-01-01',
 *   period2To: '2026-01-28',
 * });
 */
export async function getFbsCompare(
  params: FbsCompareParams,
): Promise<CompareResponse> {
  const queryParams = buildQueryString({
    period1_from: params.period1From,
    period1_to: params.period1To,
    period2_from: params.period2From,
    period2_to: params.period2To,
  })

  console.info('[FBS Analytics] Fetching comparison:', {
    period1: `${params.period1From} - ${params.period1To}`,
    period2: `${params.period2From} - ${params.period2To}`,
  })

  const response = await apiClient.get<CompareResponse>(
    `/v1/analytics/orders/compare?${queryParams}`,
    { skipDataUnwrap: true },
  )

  console.info('[FBS Analytics] Comparison response:', {
    ordersChange: response.comparison?.ordersChangePercent ?? 0,
    revenueChange: response.comparison?.revenueChangePercent ?? 0,
  })

  return response
}

// ============================================================================
// Admin Backfill Endpoints (Owner Role Required)
// ============================================================================

/**
 * Start historical data backfill
 * POST /v1/admin/backfill/start
 *
 * @param params - Backfill configuration
 * @returns Job info with count and IDs
 *
 * @example
 * const result = await startBackfill({
 *   cabinetId: 'cabinet-uuid',
 *   dataSource: 'both',
 * });
 */
export async function startBackfill(
  params: StartBackfillRequest,
): Promise<StartBackfillResponse> {
  console.info('[FBS Analytics] Starting backfill:', {
    cabinetId: params.cabinetId ?? 'all',
    dataSource: params.dataSource,
  })

  const response = await apiClient.post<StartBackfillResponse>(
    '/v1/admin/backfill/start',
    {
      cabinetId: params.cabinetId,
      dataSource: params.dataSource,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      priority: params.priority,
    },
  )

  console.info('[FBS Analytics] Backfill started:', {
    jobCount: response.jobCount,
    success: response.success,
  })

  return response
}

/**
 * Get backfill status for all or specific cabinet
 * GET /v1/admin/backfill/status
 *
 * @param cabinetId - Optional cabinet ID filter
 * @returns Array of cabinet backfill statuses
 *
 * @example
 * // Get all cabinets
 * const statuses = await getBackfillStatus();
 *
 * // Get specific cabinet
 * const status = await getBackfillStatus('cabinet-uuid');
 */
export async function getBackfillStatus(
  cabinetId?: string,
): Promise<BackfillStatusResponse> {
  const queryParams = cabinetId ? `?cabinetId=${cabinetId}` : ''

  console.info('[FBS Analytics] Fetching backfill status:', {
    cabinetId: cabinetId ?? 'all',
  })

  const response = await apiClient.get<BackfillStatusResponse>(
    `/v1/admin/backfill/status${queryParams}`,
    { skipDataUnwrap: true },
  )

  console.info('[FBS Analytics] Backfill status:', {
    cabinetCount: response?.length ?? 0,
  })

  return response
}

/**
 * Pause backfill for a cabinet
 * POST /v1/admin/backfill/pause
 *
 * @param cabinetId - Cabinet ID to pause
 * @returns Action result
 */
export async function pauseBackfill(
  cabinetId: string,
): Promise<BackfillActionResponse> {
  console.info('[FBS Analytics] Pausing backfill:', { cabinetId })

  const request: BackfillActionRequest = { cabinetId }
  const response = await apiClient.post<BackfillActionResponse>(
    '/v1/admin/backfill/pause',
    request,
  )

  return response
}

/**
 * Resume paused backfill for a cabinet
 * POST /v1/admin/backfill/resume
 *
 * @param cabinetId - Cabinet ID to resume
 * @returns Action result
 */
export async function resumeBackfill(
  cabinetId: string,
): Promise<BackfillActionResponse> {
  console.info('[FBS Analytics] Resuming backfill:', { cabinetId })

  const request: BackfillActionRequest = { cabinetId }
  const response = await apiClient.post<BackfillActionResponse>(
    '/v1/admin/backfill/resume',
    request,
  )

  return response
}
```

### Query Keys Factory (for Story 51.2)

```typescript
// Preview - to be implemented in Story 51.2-FE

export const fbsAnalyticsQueryKeys = {
  all: ['fbs-analytics'] as const,
  trends: (params: FbsTrendsParams) =>
    [...fbsAnalyticsQueryKeys.all, 'trends', params] as const,
  seasonal: (params?: FbsSeasonalParams) =>
    [...fbsAnalyticsQueryKeys.all, 'seasonal', params ?? {}] as const,
  compare: (params: FbsCompareParams) =>
    [...fbsAnalyticsQueryKeys.all, 'compare', params] as const,
}

export const backfillQueryKeys = {
  all: ['backfill'] as const,
  status: (cabinetId?: string) =>
    [...backfillQueryKeys.all, 'status', cabinetId ?? 'all'] as const,
}
```

## Dev Notes

### Relevant Source Tree

```
src/
├── types/
│   ├── analytics.ts          # Reference: existing analytics types
│   ├── storage-analytics.ts  # Reference: similar pattern
│   └── fbs-analytics.ts      # NEW: Story 51.1-FE
├── lib/
│   ├── api-client.ts         # Reference: API client patterns
│   └── api/
│       ├── storage-analytics.ts  # Reference: similar pattern
│       └── fbs-analytics.ts      # NEW: Story 51.1-FE
```

### Implementation Reference

- **Similar Pattern**: See `src/types/storage-analytics.ts` for type organization
- **API Client Pattern**: See `src/lib/api/storage-analytics.ts` for client functions
- **Query String Builder**: Reuse or extract from storage-analytics.ts

### API Authentication

All endpoints require:
- `Authorization: Bearer {JWT_TOKEN}`
- `X-Cabinet-Id: {cabinet_id}`

Admin endpoints additionally require:
- User role: `Owner`

Headers are automatically added by `src/lib/api-client.ts`.

### Backend API Reference

- HTTP examples: `test-api/15-analytics-fbs.http`
- Rate limits: 60 req/min (analytics), 10 req/min (admin)
- Cache TTL: 5 minutes (analytics)
- Max date range: 365 days

### Error Handling

| Status | Error Code | Frontend Action |
|--------|------------|-----------------|
| 400 | INVALID_DATE_FORMAT | Show validation error |
| 400 | INVALID_DATE_RANGE | Show validation error |
| 400 | DATE_RANGE_EXCEEDED | Show max 365 days message |
| 401 | UNAUTHORIZED | Redirect to login |
| 403 | FORBIDDEN | Show permission error |
| 404 | CABINET_NOT_FOUND | Show not found error |

## Testing

### Test Cases

| Test | Priority | Category |
|------|----------|----------|
| Types compile without errors | Critical | Type |
| TrendsResponse interface matches API | High | Type |
| SeasonalResponse interface matches API | High | Type |
| CompareResponse interface matches API | High | Type |
| BackfillStatusResponse matches API | High | Type |
| getFbsTrends returns correct structure | High | API |
| getFbsSeasonal returns correct structure | High | API |
| getFbsCompare returns correct structure | High | API |
| Admin endpoints return correct structure | Medium | API |
| Error handling for 400 errors | Medium | API |
| Error handling for 401/403 | Medium | API |
| Query params serialized correctly | Medium | API |

### Coverage Target

- Types: Compile-time verification
- API functions: >80% coverage (will be tested in Story 51.2)

## Definition of Done

- [ ] Types created in `src/types/fbs-analytics.ts`
- [ ] API client functions in `src/lib/api/fbs-analytics.ts`
- [ ] All TypeScript interfaces match backend API spec
- [ ] Query parameter types defined with proper optionality
- [ ] JSDoc comments for all public interfaces
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] File size <200 lines per file (split if needed)

## Dependencies

- Backend API: Epic 51 complete (Stories 51.4, 51.5)
- API reference: `test-api/15-analytics-fbs.http`
- React Query already configured in project
- Existing API client patterns in `src/lib/api-client.ts`

## Related

- Backend HTTP reference: `test-api/15-analytics-fbs.http`
- Similar implementation: `src/types/storage-analytics.ts`
- Similar implementation: `src/lib/api/storage-analytics.ts`
- Epic spec: `docs/epics/epic-51-fe-fbs-historical-analytics.md`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-29 | PM Agent | Initial draft |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Complete
Agent: Claude Code
Started: 2026-01-29
Completed: 2026-01-29
Notes: FBS Analytics types and API client functions implemented
```
