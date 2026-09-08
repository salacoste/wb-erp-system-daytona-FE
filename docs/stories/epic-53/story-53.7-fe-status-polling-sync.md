# Story 53.7-FE: Status Polling & Sync

## Story Info

- **Epic**: 53-FE - Supply Management UI
- **Sprint**: 5 (Mar 31 - Apr 11, 2026)
- **Priority**: High
- **Points**: 3
- **Status**: Ready for Dev

## User Story

**As a** WB seller managing FBS supplies,
**I want** to see real-time updates when my supply status changes,
**So that** I know when my delivery is being processed and delivered to Wildberries.

## Background

After closing a supply, the status transitions automatically as WB processes the delivery:

- `CLOSED` -> WB accepts supply, starts processing
- `DELIVERING` -> Supply is in transit to WB warehouse
- `DELIVERED` -> Supply received at warehouse

Sellers need real-time visibility into these status changes without manual page refreshes. This story implements automatic polling for active supplies and manual sync functionality with rate limiting.

### Status Lifecycle Reference

```
OPEN -> CLOSED -> DELIVERING -> DELIVERED
          |            |
          v            v
     (user action)  (WB sync)
```

---

## Acceptance Criteria

### AC1: Auto-Polling Activation

- [ ] Polling starts automatically when supply status is `CLOSED`
- [ ] Polling continues when status changes to `DELIVERING`
- [ ] Poll interval: 30 seconds
- [ ] Uses TanStack Query `refetchInterval` option
- [ ] Polling enabled only on supply detail page (not list)

### AC2: Auto-Polling Deactivation

- [ ] Polling stops when status becomes `DELIVERED`
- [ ] Polling stops when status becomes `CANCELLED`
- [ ] Polling stops when user navigates away from page
- [ ] No polling for `OPEN` status supplies

### AC3: Polling Status Indicator

- [ ] `PollingStatusBadge` component shows polling state
- [ ] Animated indicator when actively polling (pulsing dot)
- [ ] Tooltip: "Автообновление каждые 30 секунд"
- [ ] Badge hidden when polling is inactive
- [ ] Badge positioned in `SupplyHeader`

### AC4: Sync Status Indicator Enhancement

- [ ] `SyncStatusIndicator` shows last sync time
- [ ] Format: "Обновлено: 14:35" (time only for today)
- [ ] Format: "Обновлено: 25.03, 14:35" (date + time for older)
- [ ] Updates after each successful poll/sync
- [ ] Uses `formatRelativeTime` utility

### AC5: Manual Sync Button

- [ ] "Обновить статусы" button in `SupplyHeader`
- [ ] Button visible for all statuses (allows force refresh)
- [ ] Primary outline variant with RefreshCw icon
- [ ] Loading spinner during sync operation
- [ ] Disabled during active sync

### AC6: Rate Limit Handling

- [ ] Backend rate limit: 1 sync per 5 minutes per cabinet
- [ ] Countdown timer shows seconds until next allowed sync
- [ ] Button disabled during cooldown period
- [ ] Tooltip shows: "Доступно через X:XX" during cooldown
- [ ] Toast notification: "Слишком частые запросы" on rate limit hit

### AC7: Status Change Notification

- [ ] Toast notification when status changes during polling
- [ ] Toast message format: "Статус изменился: Доставляется"
- [ ] Different toast colors per status (info, success)
- [ ] Notification dismissed after 5 seconds

### AC8: Error Handling

- [ ] Network errors don't stop polling (retry automatically)
- [ ] Error toast after 3 consecutive failures
- [ ] Manual sync shows error toast on failure
- [ ] Rate limit error (429) shows specific message

---

## UI Wireframes

### Supply Header with Polling Indicators

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   Поставка #WB-12345678                                                    │
│                                                                            │
│   ┌────────────────┐  ● Автообновление      Обновлено: 14:35              │
│   │   DELIVERING   │    (pulsing dot)                                      │
│   │   Доставляется │                        [🔄 Обновить статусы]         │
│   └────────────────┘                                                       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Sync Button States

```
Normal State:
┌─────────────────────────────┐
│  🔄 Обновить статусы        │
└─────────────────────────────┘

Loading State:
┌─────────────────────────────┐
│  ⟳ Обновление...            │  (spinner)
└─────────────────────────────┘

Rate Limited State:
┌─────────────────────────────┐
│  🔄 Обновить (4:32)         │  (disabled, countdown)
└─────────────────────────────┘
```

### Status Change Toast

```
┌────────────────────────────────────────────┐
│ ✓ Статус изменился: Доставляется           │
└────────────────────────────────────────────┘
```

---

## Components to Create/Update

### New Components

| File                     | Purpose                     | Lines Est. |
| ------------------------ | --------------------------- | ---------- |
| `PollingStatusBadge.tsx` | Animated polling indicator  | ~50        |
| `SyncButton.tsx`         | Manual sync with rate limit | ~80        |

### Components to Update

| File                      | Changes                                 | Notes                          |
| ------------------------- | --------------------------------------- | ------------------------------ |
| `SyncStatusIndicator.tsx` | Add last sync time display              | May already exist from 53.2-FE |
| `SupplyHeader.tsx`        | Integrate polling badge and sync button | Story 53.4-FE component        |
| `SupplyDetailPage`        | Add polling configuration               | page.tsx                       |

### Component Location

```
src/app/(dashboard)/supplies/[id]/
├── page.tsx                          # Update: polling config
└── components/
    ├── SupplyHeader.tsx              # Update: add polling badge
    ├── PollingStatusBadge.tsx        # NEW: This story
    ├── SyncButton.tsx                # NEW: This story
    └── SyncStatusIndicator.tsx       # Update: last sync time

src/components/custom/
└── SyncStatusIndicator.tsx           # If shared across pages
```

---

## Hooks to Create/Update

| Hook               | File Path                       | Purpose                     |
| ------------------ | ------------------------------- | --------------------------- |
| `useSupplyPolling` | `src/hooks/useSupplyPolling.ts` | Conditional polling logic   |
| `useSyncSupplies`  | `src/hooks/useSyncSupplies.ts`  | Manual sync with rate limit |
| `useSyncCooldown`  | `src/hooks/useSyncCooldown.ts`  | Cooldown timer management   |

---

## API Integration

### Poll Supply Detail

Uses existing `useSupplyDetail` hook with conditional `refetchInterval`:

```typescript
// Existing query with polling configuration
const { data: supply } = useSupplyDetail(supplyId, {
  refetchInterval: shouldPoll ? 30000 : false,
})
```

### Manual Sync

```typescript
POST /v1/supplies/sync
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}

Response (200):
{
  "data": {
    "syncedAt": "2026-03-25T14:35:00Z",
    "suppliesUpdated": 3
  }
}

Error (429 - Rate Limited):
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many sync requests",
    "retryAfter": 245  // seconds until next allowed request
  }
}
```

---

## Technical Implementation

### useSupplyPolling Hook

```typescript
// src/hooks/useSupplyPolling.ts
import { useCallback, useMemo } from 'react'
import { useSupplyDetail } from './useSupplyDetail'
import type { SupplyStatus } from '@/types/supplies'

const POLL_INTERVAL = 30000 // 30 seconds
const POLL_STATUSES: SupplyStatus[] = ['CLOSED', 'DELIVERING']

interface UseSupplyPollingOptions {
  onStatusChange?: (newStatus: SupplyStatus, oldStatus: SupplyStatus) => void
}

export function useSupplyPolling(
  supplyId: string,
  options: UseSupplyPollingOptions = {}
) {
  const { onStatusChange } = options

  // Determine if polling should be active
  const shouldPoll = useCallback((status: SupplyStatus | undefined) => {
    return status ? POLL_STATUSES.includes(status) : false
  }, [])

  const { data: supply, isLoading, error, refetch } = useSupplyDetail(supplyId, {
    refetchInterval: (data) => {
      return shouldPoll(data?.status) ? POLL_INTERVAL : false
    },
  })

  const isPolling = useMemo(() => {
    return supply ? shouldPoll(supply.status) : false
  }, [supply, shouldPoll])

  return {
    supply,
    isLoading,
    error,
    isPolling,
    refetch,
  }
}
```

### useSyncCooldown Hook

```typescript
// src/hooks/useSyncCooldown.ts
import { useState, useEffect, useCallback } from 'react'

const COOLDOWN_KEY = 'supply_sync_cooldown'

interface CooldownState {
  isOnCooldown: boolean
  remainingSeconds: number
  startCooldown: (seconds: number) => void
}

export function useSyncCooldown(): CooldownState {
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  // Check localStorage on mount for existing cooldown
  useEffect(() => {
    const stored = localStorage.getItem(COOLDOWN_KEY)
    if (stored) {
      const expiresAt = parseInt(stored, 10)
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setRemainingSeconds(remaining)
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0) return

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1
        if (next <= 0) {
          localStorage.removeItem(COOLDOWN_KEY)
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [remainingSeconds])

  const startCooldown = useCallback((seconds: number) => {
    const expiresAt = Date.now() + seconds * 1000
    localStorage.setItem(COOLDOWN_KEY, expiresAt.toString())
    setRemainingSeconds(seconds)
  }, [])

  return {
    isOnCooldown: remainingSeconds > 0,
    remainingSeconds,
    startCooldown,
  }
}
```

### useSyncSupplies Hook

```typescript
// src/hooks/useSyncSupplies.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncSupplies } from '@/lib/api/supplies'
import { suppliesQueryKeys } from '@/lib/api/supplies'
import { useSyncCooldown } from './useSyncCooldown'
import { toast } from 'sonner'

const DEFAULT_COOLDOWN = 300 // 5 minutes

export function useSyncSupplies() {
  const queryClient = useQueryClient()
  const { isOnCooldown, remainingSeconds, startCooldown } = useSyncCooldown()

  const mutation = useMutation({
    mutationFn: syncSupplies,
    onSuccess: (data) => {
      toast.success('Статусы обновлены')

      // Invalidate all supply queries to refresh data
      queryClient.invalidateQueries({
        queryKey: suppliesQueryKeys.all
      })

      // Start cooldown timer (default 5 minutes)
      startCooldown(DEFAULT_COOLDOWN)
    },
    onError: (error: any) => {
      const statusCode = error?.response?.status
      const retryAfter = error?.response?.data?.error?.retryAfter

      if (statusCode === 429) {
        toast.error('Слишком частые запросы')
        if (retryAfter) {
          startCooldown(retryAfter)
        }
      } else {
        toast.error('Не удалось обновить статусы')
      }
    },
  })

  return {
    sync: mutation.mutate,
    isSyncing: mutation.isPending,
    isOnCooldown,
    remainingSeconds,
    canSync: !isOnCooldown && !mutation.isPending,
  }
}
```

### PollingStatusBadge Component

```typescript
// src/app/(dashboard)/supplies/[id]/components/PollingStatusBadge.tsx
'use client'

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PollingStatusBadgeProps {
  isPolling: boolean
  className?: string
}

export function PollingStatusBadge({
  isPolling,
  className,
}: PollingStatusBadgeProps) {
  if (!isPolling) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span>Автообновление</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Автообновление каждые 30 секунд</p>
      </TooltipContent>
    </Tooltip>
  )
}
```

### SyncButton Component

```typescript
// src/app/(dashboard)/supplies/[id]/components/SyncButton.tsx
'use client'

import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSyncSupplies } from '@/hooks/useSyncSupplies'
import { formatCooldownTime } from '@/lib/utils'

interface SyncButtonProps {
  className?: string
}

export function SyncButton({ className }: SyncButtonProps) {
  const { sync, isSyncing, isOnCooldown, remainingSeconds, canSync } = useSyncSupplies()

  const handleClick = () => {
    if (canSync) {
      sync()
    }
  }

  const buttonContent = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={!canSync}
      className={className}
    >
      {isSyncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Обновление...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Обновить статусы
          {isOnCooldown && ` (${formatCooldownTime(remainingSeconds)})`}
        </>
      )}
    </Button>
  )

  if (isOnCooldown && !isSyncing) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>Доступно через {formatCooldownTime(remainingSeconds)}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return buttonContent
}
```

### Utility Function

```typescript
// Add to src/lib/utils.ts
export function formatCooldownTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatLastSyncTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()

  const time = d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isToday) {
    return `Обновлено: ${time}`
  }

  const dateStr = d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  })

  return `Обновлено: ${dateStr}, ${time}`
}
```

---

## Polling Configuration Matrix

| Status     | Auto-Poll | Poll Interval | Manual Sync |
| ---------- | --------- | ------------- | ----------- |
| OPEN       | No        | -             | Yes         |
| CLOSED     | Yes       | 30s           | Yes         |
| DELIVERING | Yes       | 30s           | Yes         |
| DELIVERED  | No        | -             | Yes         |
| CANCELLED  | No        | -             | Yes         |

---

## Error Handling

| HTTP Status | Error Code          | Message (Russian)        | Action               |
| ----------- | ------------------- | ------------------------ | -------------------- |
| 401         | UNAUTHORIZED        | "Сессия истекла"         | Redirect to login    |
| 403         | FORBIDDEN           | "Нет доступа"            | Show error toast     |
| 429         | RATE_LIMIT_EXCEEDED | "Слишком частые запросы" | Start cooldown timer |
| 500         | SERVER_ERROR        | "Ошибка сервера"         | Show retry toast     |
| Network     | -                   | "Проблемы с сетью"       | Auto-retry polling   |

---

## Testing

### Framework & Location

- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/hooks/__tests__/`, component `__tests__/` folders

### Test Cases

#### useSupplyPolling Hook

- [ ] Polling starts for CLOSED status
- [ ] Polling starts for DELIVERING status
- [ ] Polling stops for DELIVERED status
- [ ] Polling stops for CANCELLED status
- [ ] Polling stops for OPEN status
- [ ] Interval is 30 seconds
- [ ] Status change callback fires correctly

#### useSyncCooldown Hook

- [ ] Initial state is not on cooldown
- [ ] startCooldown sets remaining seconds
- [ ] Countdown decrements every second
- [ ] Cooldown persists in localStorage
- [ ] Cooldown restores from localStorage on mount
- [ ] Cooldown clears when reaching 0

#### useSyncSupplies Hook

- [ ] sync() calls API
- [ ] Success invalidates queries
- [ ] Success starts cooldown
- [ ] Rate limit error starts cooldown with retryAfter
- [ ] Other errors show toast

#### PollingStatusBadge Component

- [ ] Not rendered when isPolling=false
- [ ] Rendered with pulsing animation when isPolling=true
- [ ] Tooltip shows correct text
- [ ] Accessible with proper ARIA

#### SyncButton Component

- [ ] Enabled when canSync=true
- [ ] Disabled when syncing
- [ ] Disabled during cooldown
- [ ] Shows spinner during sync
- [ ] Shows countdown during cooldown
- [ ] Tooltip visible during cooldown

---

## Definition of Done

- [ ] `useSupplyPolling` hook created
- [ ] `useSyncCooldown` hook created
- [ ] `useSyncSupplies` hook created/updated
- [ ] `PollingStatusBadge` component created
- [ ] `SyncButton` component created
- [ ] `SyncStatusIndicator` updated with last sync time
- [ ] `SupplyHeader` updated with polling indicators
- [ ] Auto-polling for CLOSED/DELIVERING statuses
- [ ] Polling stops on DELIVERED/CANCELLED
- [ ] Manual sync with rate limit handling
- [ ] Cooldown timer with countdown
- [ ] Status change toast notifications
- [ ] Error handling with appropriate messages
- [ ] All text in Russian
- [ ] WCAG 2.1 AA compliant
- [ ] Unit tests passing
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] File size <200 lines per component
- [ ] Code review approved

---

## Dependencies

### Required (Blocking)

| Dependency         | Story   | Status   | Notes              |
| ------------------ | ------- | -------- | ------------------ |
| Types & API Client | 53.1-FE | Required | SupplyStatus type  |
| Supply Detail Page | 53.4-FE | Required | Integration point  |
| Close Supply       | 53.6-FE | Required | Status transitions |

### Backend

| Endpoint            | Method | Status   |
| ------------------- | ------ | -------- |
| `/v1/supplies/:id`  | GET    | Complete |
| `/v1/supplies/sync` | POST   | Complete |

---

## Dev Notes

### Source Tree

```
src/
├── app/(dashboard)/supplies/[id]/
│   ├── page.tsx                          # Update: polling setup
│   └── components/
│       ├── SupplyHeader.tsx              # Update: Story 53.4-FE
│       ├── PollingStatusBadge.tsx        # NEW: This story
│       ├── SyncButton.tsx                # NEW: This story
│       └── SyncStatusIndicator.tsx       # Update or create
├── hooks/
│   ├── useSupplyPolling.ts               # NEW: This story
│   ├── useSyncSupplies.ts                # NEW: This story
│   ├── useSyncCooldown.ts                # NEW: This story
│   └── useSupplyDetail.ts                # Story 53.4-FE
└── lib/
    └── utils.ts                          # Add formatCooldownTime
```

### Design System Adherence

- **Colors**: Green for active polling, Muted for inactive
- **Animation**: Tailwind `animate-ping` for pulsing dot
- **Icons**: Lucide only (RefreshCw, Loader2)
- **Tooltip**: shadcn/ui Tooltip component
- **Button**: shadcn/ui Button with outline variant

### Performance Considerations

1. **Polling Efficiency**: Use `refetchInterval` from TanStack Query
2. **Cooldown Persistence**: localStorage prevents abuse across tabs
3. **Optimistic Updates**: Consider optimistic UI for better UX
4. **Error Backoff**: Query retries handle transient failures

---

## Tasks Breakdown

| #         | Task                         | Est. Hours | Notes                     |
| --------- | ---------------------------- | ---------- | ------------------------- |
| 1         | Create useSupplyPolling hook | 2          | Conditional polling logic |
| 2         | Create useSyncCooldown hook  | 2          | Cooldown timer            |
| 3         | Create useSyncSupplies hook  | 2          | Mutation with rate limit  |
| 4         | Create PollingStatusBadge    | 1          | Animated indicator        |
| 5         | Create SyncButton            | 2          | Button with states        |
| 6         | Update SyncStatusIndicator   | 1          | Last sync time            |
| 7         | Integrate into SupplyHeader  | 2          | Wire everything together  |
| 8         | Add utility functions        | 0.5        | formatCooldownTime        |
| 9         | Unit tests                   | 3          | All hooks and components  |
| 10        | Manual testing               | 1          | Full flow verification    |
| **Total** |                              | **16.5**   | ~2 days                   |

---

## Related

- **Parent Epic**: [Epic 53-FE: Supply Management UI](../../epics/epic-53-fe-supply-management.md)
- **Prerequisite**: [Story 53.6-FE: Close Supply & Stickers](./story-53.6-fe-close-supply-stickers.md)
- **Next Story**: [Story 53.8-FE: E2E Tests & Polish](./story-53.8-fe-e2e-tests-polish.md)
- **Backend API**: `test-api/16-supplies.http`

---

## Change Log

| Date       | Version | Description            | Author                 |
| ---------- | ------- | ---------------------- | ---------------------- |
| 2026-01-29 | 1.0     | Initial story creation | Claude Code (PM Agent) |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Ready for Dev
Agent:
Started:
Completed:
Notes:
```

---

## QA Results

_Section for QA to document review results_

```
Gate Decision:
Reviewer:
Date:
Quality Score: /100
```
