# Story 51.10-FE: Backfill Admin Types & Hooks

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 6
- **Priority**: P1 (Infrastructure)
- **Points**: 2 SP
- **Status**: Ready for Dev
- **Dependencies**: Story 51.1 (base types already include backfill types)

---

## User Story

**As a** frontend developer building the backfill admin page,
**I want** complete TypeScript types and React Query hooks for the backfill API,
**So that** I can safely integrate with backend backfill management endpoints.

---

## Background

The backend provides admin endpoints for managing historical data backfill. This story implements the types and hooks needed for the admin UI (Story 51.11). While basic types were included in Story 51.1, this story extends them with:
- Complete validation logic
- React Query hooks with mutations
- Progress polling mechanism
- Error handling utilities

**Backend Endpoints** (from `docs/request-backend/110-epic-51-fbs-historical-analytics-api.md`):
- `GET /v1/admin/backfill/status` - Get all cabinet backfill statuses
- `POST /v1/admin/backfill/start` - Start backfill for cabinet
- `POST /v1/admin/backfill/pause` - Pause running backfill
- `POST /v1/admin/backfill/resume` - Resume paused backfill

---

## Acceptance Criteria

### AC1: Extended Type Definitions

- [ ] Extend `BackfillStatus` with all possible states
- [ ] Add `BackfillProgress` type with detailed progress info
- [ ] Add `BackfillError` type for error handling
- [ ] Add `BackfillActionType` discriminated union

### AC2: React Query Hooks

- [ ] `useBackfillStatus()` - Query hook for status list
- [ ] `useStartBackfill()` - Mutation hook to start
- [ ] `usePauseBackfill()` - Mutation hook to pause
- [ ] `useResumeBackfill()` - Mutation hook to resume
- [ ] All hooks include proper error handling
- [ ] Mutations invalidate status query on success

### AC3: Polling Mechanism

- [ ] Status query supports automatic polling
- [ ] Polling interval configurable (default: 5 seconds)
- [ ] Polling enabled only when backfill is active
- [ ] Polling stops when all backfills complete/failed

### AC4: Query Keys

- [ ] Define `backfillQueryKeys` factory
- [ ] Keys support proper cache invalidation
- [ ] Include cabinet-specific keys

### AC5: Utility Functions

- [ ] `isBackfillActive(status)` - Check if running
- [ ] `canStartBackfill(status)` - Check if can start
- [ ] `canPauseBackfill(status)` - Check if can pause
- [ ] `canResumeBackfill(status)` - Check if can resume
- [ ] `formatBackfillProgress(progress)` - Human-readable progress

---

## Technical Details

### Files to Create

```
src/types/backfill.ts           # Extended backfill types
src/hooks/useBackfill.ts        # React Query hooks
src/lib/api/backfill.ts         # API client functions
src/lib/backfill-utils.ts       # Utility functions
```

### Type Definitions

```typescript
// src/types/backfill.ts

export type BackfillStatus =
  | 'idle'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'paused'

export type DataSource = 'api' | 'report' | 'none'

export interface BackfillProgress {
  total_days: number
  completed_days: number
  current_date: string | null
  percentage: number
  estimated_remaining_seconds: number | null
}

export interface BackfillCabinetStatus {
  cabinet_id: string
  cabinet_name: string
  status: BackfillStatus
  data_source: DataSource
  oldest_available_date: string | null
  newest_available_date: string | null
  progress: BackfillProgress | null
  last_error: string | null
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

export interface StartBackfillRequest {
  cabinet_id: string
  from_date?: string  // Optional, defaults to oldest available
  to_date?: string    // Optional, defaults to today
}

export interface StartBackfillResponse {
  cabinet_id: string
  status: BackfillStatus
  message: string
  estimated_duration_minutes: number
}

export interface BackfillActionRequest {
  cabinet_id: string
}

export interface BackfillActionResponse {
  cabinet_id: string
  status: BackfillStatus
  message: string
}
```

### API Client Functions

```typescript
// src/lib/api/backfill.ts

export async function getBackfillStatus(): Promise<BackfillCabinetStatus[]> {
  return apiClient.get('/v1/admin/backfill/status')
}

export async function startBackfill(
  request: StartBackfillRequest
): Promise<StartBackfillResponse> {
  return apiClient.post('/v1/admin/backfill/start', request)
}

export async function pauseBackfill(
  cabinetId: string
): Promise<BackfillActionResponse> {
  return apiClient.post('/v1/admin/backfill/pause', { cabinet_id: cabinetId })
}

export async function resumeBackfill(
  cabinetId: string
): Promise<BackfillActionResponse> {
  return apiClient.post('/v1/admin/backfill/resume', { cabinet_id: cabinetId })
}
```

### React Query Hooks

```typescript
// src/hooks/useBackfill.ts

export const backfillQueryKeys = {
  all: ['backfill'] as const,
  status: () => [...backfillQueryKeys.all, 'status'] as const,
  cabinet: (id: string) => [...backfillQueryKeys.all, 'cabinet', id] as const,
}

export function useBackfillStatus(options?: {
  polling?: boolean
  pollingInterval?: number
}) {
  const { polling = false, pollingInterval = 5000 } = options ?? {}

  return useQuery({
    queryKey: backfillQueryKeys.status(),
    queryFn: getBackfillStatus,
    refetchInterval: polling ? pollingInterval : false,
  })
}

export function useStartBackfill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startBackfill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
    },
  })
}

export function usePauseBackfill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pauseBackfill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
    },
  })
}

export function useResumeBackfill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resumeBackfill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
    },
  })
}
```

### Utility Functions

```typescript
// src/lib/backfill-utils.ts

export function isBackfillActive(status: BackfillStatus): boolean {
  return status === 'in_progress' || status === 'pending'
}

export function canStartBackfill(status: BackfillStatus): boolean {
  return status === 'idle' || status === 'completed' || status === 'failed'
}

export function canPauseBackfill(status: BackfillStatus): boolean {
  return status === 'in_progress'
}

export function canResumeBackfill(status: BackfillStatus): boolean {
  return status === 'paused'
}

export function formatBackfillProgress(progress: BackfillProgress | null): string {
  if (!progress) return 'Нет данных'

  const { completed_days, total_days, percentage } = progress
  return `${completed_days} / ${total_days} дней (${percentage.toFixed(1)}%)`
}

export function formatEstimatedTime(seconds: number | null): string {
  if (!seconds) return 'Неизвестно'

  if (seconds < 60) return `< 1 мин`
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)} мин`
  return `~${Math.ceil(seconds / 3600)} ч`
}

export function getStatusLabel(status: BackfillStatus): string {
  const labels: Record<BackfillStatus, string> = {
    idle: 'Ожидает',
    pending: 'В очереди',
    in_progress: 'Выполняется',
    completed: 'Завершено',
    failed: 'Ошибка',
    paused: 'Приостановлено',
  }
  return labels[status]
}

export function getStatusColor(status: BackfillStatus): string {
  const colors: Record<BackfillStatus, string> = {
    idle: 'gray',
    pending: 'yellow',
    in_progress: 'blue',
    completed: 'green',
    failed: 'red',
    paused: 'orange',
  }
  return colors[status]
}
```

---

## Testing Requirements

### Unit Tests

- [ ] Type exports are correct
- [ ] API functions make correct requests
- [ ] Hooks return expected data shapes
- [ ] Utility functions work correctly
- [ ] Polling starts/stops appropriately

### Test Cases

```typescript
// src/hooks/__tests__/useBackfill.test.ts

describe('useBackfillStatus', () => {
  it('fetches backfill status list')
  it('enables polling when option set')
  it('stops polling when disabled')
})

describe('useStartBackfill', () => {
  it('sends start request')
  it('invalidates queries on success')
  it('handles errors')
})

describe('backfill-utils', () => {
  it('isBackfillActive returns true for in_progress')
  it('canStartBackfill returns true for idle/completed/failed')
  it('formatBackfillProgress formats correctly')
})
```

---

## Definition of Done

- [ ] All type definitions complete
- [ ] API client functions implemented
- [ ] React Query hooks working
- [ ] Utility functions tested
- [ ] No TypeScript errors
- [ ] Unit tests passing
- [ ] Code reviewed and approved

---

## Related Stories

- Story 51.1: Base FBS Analytics Types (dependency)
- Story 51.11: Backfill Admin Page (dependent)

---

## Notes

- Types should align with backend API response structure
- Polling is critical for real-time progress updates
- Consider optimistic updates for pause/resume actions
