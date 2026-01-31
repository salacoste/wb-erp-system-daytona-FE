# Story 63.3-FE: Advertising Sync Status Badge

## Story Info

- **Epic**: 63-FE - Dashboard Business Logic (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ Complete
- **Sprint**: 14
- **Completion Date**: 2026-01-31

## User Story

**As a** seller viewing the dashboard,
**I want** to see the sync status of my advertising data,
**So that** I understand how fresh my advertising metrics are.

## Description (RU)

**Бейдж статуса синхронизации рекламы**

Отображение статуса синхронизации рекламных данных на виджете рекламы в дашборде. Пользователь видит:
- Время последней синхронизации
- Текущий статус (синхронизация/завершено/ошибка)
- Период доступных данных
- Количество синхронизированных кампаний

## Acceptance Criteria

### AC1: Sync Status Badge Display
- [ ] Badge displays in advertising dashboard widget header
- [ ] Shows human-readable last sync time (relative format)
- [ ] Badge color reflects current sync status
- [ ] Badge is compact and doesn't interfere with other controls

### AC2: Status Color Coding
- [ ] `idle` - Gray (#9CA3AF) with clock icon
- [ ] `syncing` - Blue (#3B82F6) with animated spinner
- [ ] `completed` - Green (#22C55E) with checkmark icon
- [ ] `partial_success` - Yellow (#F59E0B) with warning icon
- [ ] `failed` - Red (#EF4444) with X icon

### AC3: Tooltip Information
- [ ] Last sync timestamp (full datetime, Moscow timezone)
- [ ] Next scheduled sync time
- [ ] Number of campaigns synced
- [ ] Data availability period (from-to dates)
- [ ] Status-specific message

### AC4: Auto-Refresh Behavior
- [ ] Poll sync status every 60 seconds when widget is visible
- [ ] Stop polling when tab is in background
- [ ] Resume polling when tab becomes active
- [ ] Show loading skeleton during initial fetch

### AC5: API Integration
- [ ] Connect to `GET /v1/analytics/advertising/sync-status`
- [ ] Handle 401/403 authentication errors
- [ ] Graceful fallback if API unavailable
- [ ] Cache response for 60 seconds (TanStack Query staleTime)

### AC6: Accessibility
- [ ] Status badge has descriptive `aria-label`
- [ ] Tooltip accessible via keyboard focus
- [ ] Color is supplemented with icon (not color-only)
- [ ] Screen reader announces status changes

## Technical Implementation

### API Endpoint

```http
GET /v1/analytics/advertising/sync-status
Authorization: Bearer <JWT_TOKEN>
X-Cabinet-Id: <CABINET_UUID>
```

### API Response Structure

```typescript
interface AdvertisingSyncStatusResponse {
  lastSyncAt: string | null;           // "2026-01-31T04:05:00.000Z"
  nextScheduledSync: string;           // "2026-02-01T04:00:00.000Z"
  status: 'idle' | 'syncing' | 'completed' | 'partial_success' | 'failed';
  campaignsSynced: number;             // 262
  dataAvailableFrom: string | null;    // "2025-12-01"
  dataAvailableTo: string | null;      // "2026-01-30"
}
```

### Type Updates

```typescript
// src/types/advertising-analytics.ts - Update SyncTaskStatus
export type SyncTaskStatus =
  | 'idle'
  | 'syncing'
  | 'completed'
  | 'partial_success'
  | 'failed';
```

### API Client Function

```typescript
// src/lib/api/advertising.ts
export async function getAdvertisingSyncStatus(): Promise<AdvertisingSyncStatusResponse> {
  return apiClient.get<AdvertisingSyncStatusResponse>(
    '/v1/analytics/advertising/sync-status'
  );
}
```

### TanStack Query Hook

```typescript
// src/hooks/use-advertising-sync-status.ts
export const advertisingSyncStatusKeys = {
  all: ['advertising-sync-status'] as const,
  status: () => [...advertisingSyncStatusKeys.all, 'status'] as const,
};

export function useAdvertisingSyncStatus(options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: advertisingSyncStatusKeys.status(),
    queryFn: getAdvertisingSyncStatus,
    staleTime: 60 * 1000,       // 60 seconds
    gcTime: 5 * 60 * 1000,      // 5 minutes
    refetchInterval: options?.refetchInterval ?? 60000, // Poll every 60s
    refetchIntervalInBackground: false, // Stop when tab hidden
    enabled: options?.enabled ?? true,
  });
}
```

### Component Implementation

```typescript
// src/components/custom/advertising/AdvertisingSyncStatusBadge.tsx
'use client';

import { useAdvertisingSyncStatus } from '@/hooks/use-advertising-sync-status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  idle: {
    label: 'Ожидание',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Clock,
    description: 'Синхронизация не запущена',
  },
  syncing: {
    label: 'Синхронизация...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Loader2,
    description: 'Идёт загрузка данных из WB',
    animate: true,
  },
  completed: {
    label: 'Синхронизировано',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
    description: 'Данные актуальны',
  },
  partial_success: {
    label: 'Частично',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: AlertTriangle,
    description: 'Часть данных загружена с ошибками',
  },
  failed: {
    label: 'Ошибка',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
    description: 'Синхронизация не удалась',
  },
} as const;

export function AdvertisingSyncStatusBadge() {
  const { data, isLoading, error } = useAdvertisingSyncStatus();

  if (isLoading) {
    return <Skeleton className="w-32 h-6 rounded-full" />;
  }

  if (error || !data) {
    return (
      <span className="text-xs text-muted-foreground">
        Статус недоступен
      </span>
    );
  }

  const config = statusConfig[data.status];
  const Icon = config.icon;

  const lastSyncText = data.lastSyncAt
    ? formatDistanceToNow(new Date(data.lastSyncAt), { addSuffix: true, locale: ru })
    : 'никогда';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary',
            config.bgColor,
            config.color
          )}
          aria-label={`Статус синхронизации: ${config.label}. Последняя синхронизация ${lastSyncText}`}
        >
          <Icon className={cn('w-3 h-3', config.animate && 'animate-spin')} />
          <span className="hidden sm:inline">{lastSyncText}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="w-64 p-3" side="bottom">
        <SyncStatusTooltipContent data={data} config={config} />
      </TooltipContent>
    </Tooltip>
  );
}

function SyncStatusTooltipContent({ data, config }) {
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      {/* Status Header */}
      <div className="flex items-center gap-2 font-medium">
        <Icon className={cn('w-4 h-4', config.color)} />
        <span>{config.label}</span>
      </div>
      <p className="text-sm text-muted-foreground">{config.description}</p>

      {/* Sync Details */}
      <div className="border-t pt-2 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Последняя синхр.:</span>
          <span>
            {data.lastSyncAt
              ? format(new Date(data.lastSyncAt), 'dd.MM.yyyy HH:mm', { locale: ru })
              : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Следующая:</span>
          <span>{format(new Date(data.nextScheduledSync), 'HH:mm', { locale: ru })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Кампаний:</span>
          <span>{data.campaignsSynced}</span>
        </div>
      </div>

      {/* Data Availability */}
      {data.dataAvailableFrom && data.dataAvailableTo && (
        <div className="border-t pt-2 text-sm">
          <span className="text-muted-foreground">Данные доступны:</span>
          <div className="mt-1">
            {format(new Date(data.dataAvailableFrom), 'dd.MM.yyyy', { locale: ru })} — {' '}
            {format(new Date(data.dataAvailableTo), 'dd.MM.yyyy', { locale: ru })}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Design Specifications

### Status Colors

| Status | Background | Text | Hex |
|--------|------------|------|-----|
| `idle` | `bg-gray-100` | `text-gray-600` | #9CA3AF |
| `syncing` | `bg-blue-100` | `text-blue-600` | #3B82F6 |
| `completed` | `bg-green-100` | `text-green-600` | #22C55E |
| `partial_success` | `bg-yellow-100` | `text-yellow-600` | #F59E0B |
| `failed` | `bg-red-100` | `text-red-600` | #EF4444 |

### Badge Dimensions
- Height: 24px (py-1)
- Padding: 8px horizontal (px-2)
- Border radius: full (rounded-full)
- Font size: 12px (text-xs)
- Icon size: 12px (w-3 h-3)

### Responsive Behavior
- Mobile: Show icon only, text visible on SM+ screens
- Tooltip: 256px width (w-64)

## Files to Create

```
src/
├── hooks/
│   └── use-advertising-sync-status.ts        # NEW: TanStack Query hook
├── lib/api/
│   └── advertising.ts                        # UPDATE: Add getSyncStatus function
├── components/custom/advertising/
│   └── AdvertisingSyncStatusBadge.tsx        # NEW: Badge component
└── types/
    └── advertising-analytics.ts              # UPDATE: Extend SyncTaskStatus
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/advertising-analytics.ts` | Add `partial_success` to SyncTaskStatus, add new response interface |
| `src/lib/api/advertising.ts` | Add `getAdvertisingSyncStatus()` function |
| Dashboard advertising widget | Integrate badge in header |

## Dependencies

- **Story 63.1**: Dashboard main page API integration (provides widget structure)
- **Epic 33-FE**: Existing advertising types and API client

## Testing Requirements

### Unit Tests
- [ ] Badge renders correctly for each status
- [ ] Tooltip displays all sync details
- [ ] Loading skeleton shown during fetch
- [ ] Error state displays gracefully
- [ ] Relative time formatting works correctly

### Integration Tests
- [ ] Hook fetches data from correct endpoint
- [ ] Auto-refresh works (mock timer)
- [ ] Polling stops when tab is hidden

### Accessibility Tests
- [ ] Badge is keyboard focusable
- [ ] Tooltip accessible via keyboard
- [ ] Screen reader announces status
- [ ] Color contrast meets WCAG AA

## Definition of Done

- [ ] Badge component created and styled for all 5 statuses
- [ ] TanStack Query hook with polling implemented
- [ ] API function added to advertising client
- [ ] Types updated with new status values
- [ ] Badge integrated into advertising widget
- [ ] All unit tests pass (>=80% coverage)
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings
- [ ] All files <200 lines
- [ ] Accessibility audit passes

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-31 | PM Agent | Initial draft based on backend docs 123 |

---

## Notes

### Backend API Reference
- Endpoint: `GET /v1/analytics/advertising/sync-status`
- Documentation: `docs/request-backend/123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md`
- Sync statuses: `idle`, `syncing`, `completed`, `partial_success`, `failed`

### Relation to Story 33.6-FE
This story is similar to Story 33.6-FE (Sync Status Display) but focuses on:
- Dashboard widget integration (not advertising page header)
- Simplified badge format (not full indicator)
- New backend endpoint with extended status values

---

## Implementation

**Component**: `src/components/custom/dashboard/AdvertisingSyncStatusBadge.tsx`
**Hook**: `src/hooks/useAdvertisingSyncStatusBadge.ts`
**Lines**: 200
**Key Features**:
- Status badge with 5 color-coded states (idle, syncing, completed, partial_success, failed)
- Relative time display (formatDistanceToNow)
- Auto-refresh every 60 seconds with refetchIntervalInBackground: false
- Detailed tooltip with sync details, next scheduled sync, campaign count
- Accessibility: aria-label, keyboard focusable

---

## Dev Agent Record

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with all acceptance criteria met. Badge integrates into advertising dashboard widget header.
```
