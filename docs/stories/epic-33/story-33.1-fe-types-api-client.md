# Story 33.1-FE: TypeScript Types & API Client

## Story Info

- **Epic**: 33-FE - Advertising Analytics (Frontend)
- **Priority**: High
- **Points**: 3
- **Status**: ✅ Ready

## User Story

**As a** frontend developer,
**I want** TypeScript types and API client functions for advertising analytics,
**So that** I can safely integrate with the backend API.

## Acceptance Criteria

### AC1: TypeScript Types
- [ ] Create `types/advertising-analytics.ts` with all response types
- [ ] Types match backend API response structure (Request #71)
- [ ] Proper nullability handling (`| null` where applicable)
- [ ] Include all efficiency status types
- [ ] **Handle partial responses**: Optional fields (sku_id, campaign_id, brand, category) are `undefined` based on `view_by` mode

### AC2: API Client Functions
- [ ] `getAdvertisingAnalytics(params)` - GET /v1/analytics/advertising
- [ ] `getAdvertisingCampaigns(params)` - GET /v1/analytics/advertising/campaigns
- [ ] `getAdvertisingSyncStatus()` - GET /v1/analytics/advertising/sync-status

### AC3: React Query Hooks
- [ ] `useAdvertisingAnalytics(params)` with proper caching
- [ ] `useAdvertisingCampaigns(params)` with offset-based pagination
- [ ] `useAdvertisingSyncStatus()` with auto-refresh (60s interval)
- [ ] Proper error handling for all hooks

### AC4: Error Handling (Localized)
- [ ] Error messages in Russian
- [ ] 400: "Неверные параметры запроса"
- [ ] 401: "Требуется авторизация"
- [ ] 403: "Нет доступа к этому кабинету"
- [ ] 404: "Данные не найдены"
- [ ] 500: "Ошибка сервера. Попробуйте позже"

## Tasks / Subtasks

### Phase 1: Types Definition
- [ ] Create `src/types/advertising-analytics.ts`
- [ ] Define `EfficiencyStatus` type (union of 6 values)
- [ ] Define `ViewByMode` type ('sku' | 'campaign' | 'brand' | 'category')
- [ ] Define `AdvertisingMeta` interface
- [ ] Define `AdvertisingSummary` interface
- [ ] Define `AdvertisingItem` interface
- [ ] Define `AdvertisingAnalyticsResponse` interface
- [ ] Define `Campaign` interface
- [ ] Define `CampaignsResponse` interface
- [ ] Define `HealthStatus` type
- [ ] Define `SyncStatusResponse` interface
- [ ] Define query params interfaces

### Phase 2: API Client Functions
- [ ] Create `src/lib/api/advertising-analytics.ts`
- [ ] Implement `getAdvertisingAnalytics(params)`
- [ ] Implement `getAdvertisingCampaigns(params)`
- [ ] Implement `getAdvertisingSyncStatus()`
- [ ] Add proper error handling for 400/401/403/404/500

### Phase 3: React Query Hooks
- [ ] Create `src/hooks/useAdvertisingAnalytics.ts`
- [ ] Implement `useAdvertisingAnalytics` hook
- [ ] Implement `useAdvertisingCampaigns` hook
- [ ] Implement `useAdvertisingSyncStatus` hook with refetchInterval
- [ ] Define query key factory
- [ ] Add cache invalidation utility

## Technical Details

### Types (from Request #71)

```typescript
// src/types/advertising-analytics.ts

export type EfficiencyStatus =
  | 'excellent'  // ROAS >= 5.0, ROI >= 1.0
  | 'good'       // ROAS 3.0-5.0, ROI 0.5-1.0
  | 'moderate'   // ROAS 2.0-3.0, ROI 0.2-0.5
  | 'poor'       // ROAS 1.0-2.0, ROI 0-0.2
  | 'loss'       // ROAS < 1.0, ROI < 0
  | 'unknown';   // No profit data

export type ViewByMode = 'sku' | 'campaign' | 'brand' | 'category';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'stale';

export interface AdvertisingMeta {
  cabinet_id: string;
  date_range: {
    from: string;  // YYYY-MM-DD
    to: string;
  };
  view_by: ViewByMode;
  last_sync: string;  // ISO datetime
}

export interface AdvertisingSummary {
  total_spend: number;
  total_revenue: number;
  total_profit: number;
  overall_roas: number;
  overall_roi: number;
  avg_ctr: number;
  avg_conversion_rate: number;
  campaign_count: number;
  active_campaigns: number;
}

export interface AdvertisingItem {
  // Identifiers (depend on view_by)
  sku_id?: string;
  campaign_id?: number;
  brand?: string;
  category?: string;
  product_name?: string;

  // Metrics
  views: number;
  clicks: number;
  orders: number;
  spend: number;
  revenue: number;
  profit: number;

  // Calculated metrics
  roas: number;
  roi: number;
  ctr: number;
  cpc: number;
  conversion_rate: number;
  profit_after_ads: number;

  // Classification
  efficiency_status: EfficiencyStatus;
}

export interface AdvertisingAnalyticsResponse {
  meta: AdvertisingMeta;
  summary: AdvertisingSummary;
  data: AdvertisingItem[];
}

export interface Campaign {
  campaign_id: number;
  name: string;
  type: number;
  type_name: string;
  status: number;
  status_name: string;
  created_at: string;
  start_time: string;
  end_time: string | null;
  daily_budget: number;
  nm_ids: string[];
  sku_count: number;
}

export interface CampaignsResponse {
  meta: {
    cabinet_id: string;
    total_count: number;
    active_count: number;
  };
  data: Campaign[];
}

export interface SyncStatusResponse {
  cabinet_id: string;
  last_sync_at: string | null;
  last_sync_status: 'success' | 'error' | 'partial';
  next_scheduled_sync: string;
  campaigns_synced: number;
  stats_records_synced: number;
  cost_records_synced: number;
  sync_duration_seconds: number;
  error_count_last_24h: number;
  health_status: HealthStatus;
}

// Query params
export interface AdvertisingAnalyticsParams {
  from: string;       // YYYY-MM-DD (required)
  to: string;         // YYYY-MM-DD (required)
  view_by?: ViewByMode;
  efficiency_filter?: EfficiencyStatus | 'all';
  campaign_ids?: string;  // comma-separated
  sku_ids?: string;       // comma-separated
  sort_by?: 'spend' | 'roas' | 'roi' | 'conversions';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CampaignsParams {
  status?: string;   // comma-separated: '9' (active), '11' (paused)
  type?: number;     // 8 (auto), 9 (unified/auction)
  search?: string;
  limit?: number;
  offset?: number;
}
```

### Query Keys

```typescript
export const advertisingQueryKeys = {
  all: ['advertising'] as const,
  analytics: (params: AdvertisingAnalyticsParams) =>
    [...advertisingQueryKeys.all, 'analytics', params] as const,
  campaigns: (params?: CampaignsParams) =>
    [...advertisingQueryKeys.all, 'campaigns', params] as const,
  syncStatus: () =>
    [...advertisingQueryKeys.all, 'sync-status'] as const,
};
```

## Dev Notes

### Relevant Source Tree

```
src/
├── types/
│   ├── storage-analytics.ts        # Reference: similar pattern
│   └── advertising-analytics.ts    # NEW: Story 33.1-fe
├── lib/api/
│   ├── storage-analytics.ts        # Reference: API client pattern
│   └── advertising-analytics.ts    # NEW: Story 33.1-fe
└── hooks/
    ├── useStorageAnalytics.ts      # Reference: hook pattern
    └── useAdvertisingAnalytics.ts  # NEW: Story 33.1-fe
```

### Implementation Reference

- **Hook Pattern**: See `useStorageAnalytics.ts` for React Query patterns
- **Error Handling**: Follow pattern in `src/lib/api.ts`
- **Query Keys**: Follow TanStack Query v5 factory pattern

### Sync Status Auto-Refresh

```typescript
useAdvertisingSyncStatus({
  refetchInterval: 60000,  // 1 minute
  refetchIntervalInBackground: false,
});
```

## Testing

### Test Cases

- [ ] Types compile without errors
- [ ] `useAdvertisingAnalytics` returns correct data structure
- [ ] `useAdvertisingCampaigns` returns correct data structure
- [ ] `useAdvertisingSyncStatus` auto-refreshes
- [ ] Error handling works for 400/401/403/404/500
- [ ] Query params are correctly serialized

## Definition of Done

- [ ] Types created and exported from `src/types/advertising-analytics.ts`
- [ ] API client functions implemented in `src/lib/api/advertising-analytics.ts`
- [ ] React Query hooks implemented in `src/hooks/useAdvertisingAnalytics.ts`
- [ ] No TypeScript errors (`npm run type-check` passes)
- [ ] ESLint passes (`npm run lint`)
- [ ] File size <200 lines per file

## Dependencies

- Backend API: Request #71 (complete)
- React Query already configured
- Existing API client patterns

## Related

- Backend API: `docs/request-backend/71-advertising-analytics-epic-33.md`
- Similar implementation: `src/hooks/useStorageAnalytics.ts`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | James (Dev Agent) | Initial draft |
| 2025-12-22 | James (Dev Agent) | PO Review: Added AC4 (localized errors), partial response handling |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress_

```
Status: ✅ Complete
Agent: James (Dev)
Started: 2025-12-22
Completed: 2025-12-22
Notes: All phases complete. TypeScript types, API client, and React Query hooks implemented.
       ESLint and TypeScript checks pass.
       Files created:
       - src/types/advertising-analytics.ts (types)
       - src/lib/api/advertising-analytics.ts (API client)
       - src/hooks/useAdvertisingAnalytics.ts (React Query hooks)
```
