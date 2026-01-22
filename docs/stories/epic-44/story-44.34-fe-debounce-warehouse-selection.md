# Story 44.34: Debounce Warehouse Selection & Rate Limit Handling

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P1 - MEDIUM
**Effort**: 2 SP
**Depends On**: Story 44.12 (Warehouse Selection), Story 44.27 (Warehouse Integration)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 4.2, FRONTEND-INTEGRATION-GUIDE.md Section "Rate Limits Reference"
**Backend API**: `GET /v1/tariffs/acceptance/coefficients` (rate limited: 6/min)

---

## User Story

**As a** Seller,
**I want** the price calculator to handle warehouse selection smoothly without rate limit errors,
**So that** I can quickly compare different warehouses without being blocked by API rate limits.

**Non-goals**:
- Backend rate limit changes (backend limits are fixed)
- Complex rate limit prediction UI
- Rate limit bypassing (correct implementation only)

---

## Background: Rate Limit Confusion Issue

Backend Request #98 revealed a critical rate limit issue:

**Acceptance Coefficients API** uses `orders_fbw` scope: **6 requests/minute** (NOT `tariffs` scope: 10/min)

**Impact**: Rapid warehouse switching can trigger 429 errors before user realizes it.

**Current Problem**:
- User selects warehouse → immediate API call
- User changes warehouse again → another immediate API call
- After 6 rapid changes → HTTP 429 "Too Many Requests" error
- User sees error message, doesn't understand why

**Solution**: Implement debouncing (500ms delay) + intelligent rate limit handling.

**Source**: `PRICE-CALCULATOR-REQUIREMENTS.md` Section 4.2 (Rate Limits Reference)

---

## Acceptance Criteria

### AC1: Warehouse Selection Debouncing
- [ ] Implement 500ms debounce on warehouse selection changes
- [ ] Show loading indicator during debounce delay
- [ ] Cancel pending debounce if user changes warehouse again
- [ ] Only fetch coefficients after debounce period completes
- [ ] No API calls until user stops changing warehouses

### AC2: Loading State During Debounce
- [ ] Show "Загрузка коэффициентов..." indicator during debounce
- [ ] Show spinner/skeleton in coefficient fields
- [ ] Disable warehouse dropdown during debounce
- [ ] Display countdown: "Получение данных через {ms}..." (optional UX)
- [ ] Clear loading state when API call completes

### AC3: Rate Limit Error Handling
- [ ] Detect HTTP 429 responses from acceptance coefficients API
- [ ] Show user-friendly error message: "Слишком много запросов. Подождите {N} секунд."
- [ ] Display retry countdown timer in error message
- [ ] Disable warehouse dropdown during rate limit cooldown
- [ ] Auto-retry after cooldown period (optional)

### AC4: Rate Limit Cooldown UI
- [ ] Show progress bar for cooldown period
- [ ] Display remaining time: "Доступно через {сек} сек"
- [ ] Visual indicator: locked warehouse dropdown
- [ ] Tooltip explains: "Лимит запросов WB: 6/мин. Подождите немного."
- [ ] Re-enable dropdown after cooldown expires

### AC5: Intelligent Caching Strategy
- [ ] Cache warehouse coefficients for 1 hour (as per backend TTL)
- [ ] Use cached data if available (no API call)
- [ ] Show "Из кэша" badge when using cached data
- [ ] Invalidate cache on warehouse change
- [ ] Prefetch coefficients for recently used warehouses (optional)

### AC6: User Guidance for Rate Limits
- [ ] Show info tooltip on warehouse dropdown: "Коэффициенты обновляются автоматически. Не переключайте склады слишком часто."
- [ ] Display rate limit status: "Запросов осталось: {N}/6" (if available from backend)
- [ ] Show warning when approaching limit: "Осталось мало запросов ({N}/6). Подождите {сек} сек."
- [ ] Help text explains: "Лимит установлен Wildberries API"

### AC7: Fallback to Previous Selection
- [ ] If rate limited, revert to previously working warehouse selection
- [ ] Keep previous coefficients in form during cooldown
- [ ] Show message: "Восстановлен предыдущий выбор: {warehouse_name}"
- [ ] Don't lose form data on rate limit error

### AC8: Analytics & Logging
- [ ] Log rate limit occurrences for monitoring
- [ ] Track debounce effectiveness (canceled calls)
- [ ] Monitor cache hit rate
- [ ] Alert if rate limits hit frequently (indicates UX issue)

---

## Context & References

- **Requirements**: `PRICE-CALCULATOR-REQUIREMENTS.md` Section 4.2 (Rate Limits Reference)
- **Integration Guide**: `frontend/docs/request-backend/FRONTEND-INTEGRATION-GUIDE.md`
- **Backend Request**: `frontend/docs/request-backend/98-warehouses-tariffs-coefficients-api.md`
- **Parent Epic**: `docs/stories/epic-44/README.md`
- **Story 44.12**: Warehouse Selection (dropdown component)
- **Story 44.27**: Warehouse Integration (coefficients fetching)

**Rate Limits Reference**:

| Scope | Limit | Window | Endpoints |
|-------|-------|--------|-----------|
| `tariffs` | 10/min | 60s | commissions, warehouses, box |
| `orders_fbw` | **6/min** | 60s | **acceptance coefficients** ⚠️ |
| Standard | 600/min | 60s | price-calculator |

---

## API Contract

### Backend Rate Limit Response

**HTTP 429 Too Many Requests**:
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded for orders_fbw scope. Retry after 10 seconds.",
  "retryAfter": 10
}
```

### Acceptance Coefficients Endpoint

**GET /v1/tariffs/acceptance/coefficients?warehouseId={id}**:
- **Rate Limit**: 6 requests/minute (orders_fbw scope)
- **Cache TTL**: 1 hour (backend)
- **Response Time**: ~200-500ms

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── WarehouseSelector.tsx         # UPDATE - Add debouncing
│           ├── RateLimitWarning.tsx         # CREATE - Rate limit UI
│           └── CoefficientsLoadingSkeleton.tsx # CREATE - Loading state
├── hooks/
│   ├── useWarehouseCoefficients.ts          # UPDATE - Add debouncing
│   └── useRateLimitCooldown.ts             # CREATE - Cooldown management
├── lib/
│   └── debounce.ts                          # UPDATE - Reusable debounce hook
└── stores/
    └── rateLimitStore.ts                    # CREATE - Rate limit state management
```

### Hook: Debounced Warehouse Coefficients

```typescript
// src/hooks/useWarehouseCoefficients.ts (UPDATE)

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebouncedCallback } from '@/lib/debounce';
import { apiClient } from '@/lib/api-client';
import type { WarehouseCoefficients } from '@/types/tariffs';

interface UseWarehouseCoefficientsOptions {
  debounceMs?: number;
  enabled?: boolean;
}

export function useWarehouseCoefficients(
  warehouseId: number | undefined,
  options: UseWarehouseCoefficientsOptions = {}
) {
  const { debounceMs = 500, enabled = true } = options;
  const queryClient = useQueryClient();
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [debouncedWarehouseId, setDebouncedWarehouseId] = useState<number | undefined>();

  // Debounced warehouse ID setter
  const debouncedSetWarehouse = useDebouncedCallback(
    (id: number) => {
      setIsDebouncing(false);
      setDebouncedWarehouseId(id);
    },
    debounceMs,
    [setIsDebouncing, setDebouncedWarehouseId]
  );

  // Update debounced value when warehouse changes
  useEffect(() => {
    if (warehouseId !== undefined && enabled) {
      setIsDebouncing(true);
      debouncedSetWarehouse(warehouseId);
    }
  }, [warehouseId, enabled, debouncedSetWarehouse]);

  // Fetch coefficients (only after debounce)
  const {
    data,
    isLoading,
    error,
    isRefetching,
  } = useQuery({
    queryKey: ['tariffs', 'acceptance', 'coefficients', debouncedWarehouseId],
    queryFn: async () => {
      if (!debouncedWarehouseId) throw new Error('Warehouse ID required');

      const response = await apiClient.get<WarehouseCoefficients>(
        `/v1/tariffs/acceptance/coefficients`,
        { params: { warehouseId: debouncedWarehouseId } }
      );

      return response;
    },
    enabled: debouncedWarehouseId !== undefined && enabled,
    staleTime: 60 * 60 * 1000, // 1h cache (match backend)
    gcTime: 60 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on rate limit (429)
      if (error instanceof ApiError && error.status === 429) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    coefficients: data,
    isLoading: isLoading || isDebouncing,
    isDebouncing,
    error,
    isRefetching,
    refetch: () => queryClient.refetchQueries({
      queryKey: ['tariffs', 'acceptance', 'coefficients', debouncedWarehouseId],
    }),
  };
}
```

### Hook: Rate Limit Cooldown

```typescript
// src/hooks/useRateLimitCooldown.ts (CREATE)

import { useState, useEffect } from 'react';
import { ApiError } from '@/lib/api-client';

interface RateLimitCooldownState {
  isLimited: boolean;
  remainingSeconds: number;
  retryAfter: number | null;
}

export function useRateLimitCooldown() {
  const [cooldown, setCooldown] = useState<RateLimitCooldownState>({
    isLimited: false,
    remainingSeconds: 0,
    retryAfter: null,
  });

  const startCooldown = (retryAfter: number) => {
    const endTime = Date.now() + retryAfter * 1000;

    setCooldown({
      isLimited: true,
      remainingSeconds: retryAfter,
      retryAfter: endTime,
    });
  };

  const clearCooldown = () => {
    setCooldown({
      isLimited: false,
      remainingSeconds: 0,
      retryAfter: null,
    });
  };

  // Countdown timer
  useEffect(() => {
    if (!cooldown.isLimited) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((cooldown.retryAfter! - Date.now()) / 1000);

      if (remaining <= 0) {
        clearCooldown();
      } else {
        setCooldown((prev) => ({
          ...prev,
          remainingSeconds: remaining,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown.isLimited, cooldown.retryAfter]);

  return {
    cooldown,
    startCooldown,
    clearCooldown,
  };
}
```

### Component: Rate Limit Warning

```typescript
// src/components/custom/price-calculator/RateLimitWarning.tsx (CREATE)

'use client'

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock } from 'lucide-react';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';

interface RateLimitWarningProps {
  remainingSeconds: number;
}

export function RateLimitWarning({ remainingSeconds }: RateLimitWarningProps) {
  const progressPercent = (remainingSeconds / 60) * 100; // Assume 60s max cooldown

  return (
    <Alert variant="destructive" className="relative">
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1 space-y-2">
        <AlertDescription className="font-medium">
          Слишком много запросов. Подождите {remainingSeconds} сек.
        </AlertDescription>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>До повторной попытки:</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {remainingSeconds} сек
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <p className="text-xs opacity-90">
          Лимит запросов Wildberries API: 6 запросов в минуту.
        </p>
      </div>
    </Alert>
  );
}
```

### Component: Coefficients Loading Skeleton

```typescript
// src/components/custom/price-calculator/CoefficientsLoadingSkeleton.tsx (CREATE)

'use client'

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function CoefficientsLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          Загрузка коэффициентов...
        </div>
      </CardContent>
    </Card>
  );
}
```

### Component: Warehouse Selector with Debouncing

```typescript
// src/components/custom/price-calculator/WarehouseSelector.tsx (UPDATE)

'use client'

import { Controller, Control } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WarehouseSelectorProps } from './WarehouseSelector.types';
import { useWarehousesWithSearch } from '@/hooks/useWarehousesWithSearch';
import { useWarehouseCoefficients } from '@/hooks/useWarehouseCoefficients';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';
import { ApiError } from '@/lib/api-client';
import { RateLimitWarning } from './RateLimitWarning';
import { CoefficientsLoadingSkeleton } from './CoefficientsLoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function WarehouseSelector({
  control,
  disabled,
}: WarehouseSelectorProps) {
  const {
    warehouses,
    isLoading: warehousesLoading,
    error: warehousesError,
  } = useWarehousesWithSearch('');

  const warehouseId = useWatch({
    control,
    name: 'warehouse_id',
  });

  const {
    coefficients,
    isLoading: coefficientsLoading,
    isDebouncing,
    error: coefficientsError,
  } = useWarehouseCoefficients(warehouseId, {
    debounceMs: 500,
    enabled: !!warehouseId,
  });

  const { cooldown } = useRateLimitCooldown();

  // Handle rate limit error
  useEffect(() => {
    if (coefficientsError instanceof ApiError && coefficientsError.status === 429) {
      const retryAfter = coefficientsError.response?.data?.retryAfter || 10;
      startCooldown(retryAfter);
    }
  }, [coefficientsError, startCooldown]);

  const isDisabled = disabled || cooldown.isLimited || warehousesLoading;

  return (
    <div className="space-y-4">
      {/* Warehouse Dropdown with Rate Limit Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Склад WB</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Коэффициенты обновляются автоматически. Не переключайте склады слишком часто
                  (лимит Wildberries API: 6 запросов/мин).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Controller
          name="warehouse_id"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value?.toString()}
              onValueChange={(value) => field.onChange(parseInt(value))}
              disabled={isDisabled}
            >
              <SelectTrigger className={cooldown.isLimited ? 'bg-muted' : ''}>
                <SelectValue placeholder="Выберите склад" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{warehouse.name}</span>
                      {warehouse.federalDistrict && (
                        <span className="text-xs text-muted-foreground">
                          {warehouse.federalDistrict}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {/* Rate Limit Status */}
        {cooldown.isLimited && (
          <RateLimitWarning remainingSeconds={cooldown.remainingSeconds} />
        )}

        {/* Loading State During Debounce */}
        {isDebouncing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            Загрузка коэффициентов...
          </div>
        )}
      </div>

      {/* Coefficients Display */}
      {coefficientsLoading && !isDebouncing && <CoefficientsLoadingSkeleton />}

      {coefficients && !coefficientsLoading && (
        <WarehouseCoefficients coefficients={coefficients} />
      )}

      {coefficientsError && !cooldown.isLimited && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не удалось загрузить коэффициенты. Попробуйте выбрать другой склад.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### Store: Rate Limit State Management

```typescript
// src/stores/rateLimitStore.ts (CREATE)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RateLimitEntry {
  endpoint: string;
  timestamp: number;
  retryAfter: number;
}

interface RateLimitStore {
  rateLimits: Record<string, RateLimitEntry>;
  addRateLimit: (endpoint: string, retryAfter: number) => void;
  isRateLimited: (endpoint: string) => boolean;
  getRemainingSeconds: (endpoint: string) => number;
  clearExpired: () => void;
}

export const useRateLimitStore = create<RateLimitStore>()(
  persist(
    (set, get) => ({
      rateLimits: {},

      addRateLimit: (endpoint, retryAfter) => {
        const entry: RateLimitEntry = {
          endpoint,
          timestamp: Date.now(),
          retryAfter,
        };
        set((state) => ({
          rateLimits: {
            ...state.rateLimits,
            [endpoint]: entry,
          },
        }));
      },

      isRateLimited: (endpoint) => {
        const entry = get().rateLimits[endpoint];
        if (!entry) return false;

        const now = Date.now();
        const expiryTime = entry.timestamp + entry.retryAfter * 1000;
        return now < expiryTime;
      },

      getRemainingSeconds: (endpoint) => {
        const entry = get().rateLimits[endpoint];
        if (!entry) return 0;

        const now = Date.now();
        const expiryTime = entry.timestamp + entry.retryAfter * 1000;
        const remaining = Math.ceil((expiryTime - now) / 1000);
        return Math.max(0, remaining);
      },

      clearExpired: () => {
        const now = Date.now();
        set((state) => {
          const cleaned = Object.entries(state.rateLimits).reduce(
            (acc, [key, entry]) => {
              const expiryTime = entry.timestamp + entry.retryAfter * 1000;
              if (now < expiryTime) {
                acc[key] = entry;
              }
              return acc;
            },
            {} as Record<string, RateLimitEntry>
          );
          return { rateLimits: cleaned };
        });
      },
    }),
    {
      name: 'rate-limit-storage',
      partialize: (state) => ({ rateLimits: state.rateLimits }),
    }
  )
);
```

---

## Testing Scenarios

### Unit Tests
- [ ] Debounce delay works correctly (500ms)
- [ ] Debounce cancels on rapid changes
- [ ] Cooldown timer counts down correctly
- [ ] Rate limit detection works (HTTP 429)
- [ ] Cache retrieval works (1h TTL)

### Integration Tests
- [ ] Warehouse selection triggers debounced API call
- [ ] Loading state shows during debounce
- [ ] Rate limit error shows cooldown UI
- [ ] Cached data skips API call
- [ ] Form keeps previous data on rate limit

### E2E Tests
- [ ] User rapidly changes warehouses (no 429 error)
- [ ] User sees loading indicator during debounce
- [ ] User sees rate limit warning (if triggered)
- [ ] User can retry after cooldown expires
- [ ] Coefficients display correctly after debounce

---

## Invariants & Edge Cases

| Scenario | Handling |
|----------|----------|
| User changes warehouse rapidly | Debounce prevents API spam |
| Rate limit hit (429) | Show cooldown UI, revert to previous selection |
| No warehouse selected | Don't fetch coefficients |
| Cached data available | Skip API call, show "Из кэша" badge |
| Network error during debounce | Show error, allow retry |
| Component unmounts during debounce | Cancel debounce cleanup |

---

## Observability

- **Analytics**: Track rate limit occurrences, debounce effectiveness
- **Metrics**: Average debounce time, cache hit rate
- **Logs**: Log all 429 errors with context
- **Monitoring**: Alert if rate limits hit >10% of calls

---

## Security

- **Rate Limit Respect**: Never attempt to bypass rate limits
- **Error Handling**: Don't expose internal API details in errors
- **State Isolation**: Rate limit state doesn't persist across sessions

---

## Accessibility (WCAG 2.1 AA)

- [ ] Loading announcements by screen readers
- [ ] Rate limit error read as alert
- [ ] Cooldown timer accessible
- [ ] Keyboard navigation works during cooldown
- [ ] Visual indicators for disabled states

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/hooks/useWarehouseCoefficients.ts` | UPDATE | +40 | Add debouncing logic |
| `src/hooks/useRateLimitCooldown.ts` | CREATE | ~50 | Cooldown state management |
| `src/components/custom/price-calculator/WarehouseSelector.tsx` | UPDATE | +60 | Integrate debouncing + UI |
| `src/components/custom/price-calculator/RateLimitWarning.tsx` | CREATE | ~50 | Rate limit warning component |
| `src/components/custom/price-calculator/CoefficientsLoadingSkeleton.tsx` | CREATE | ~30 | Loading skeleton |
| `src/stores/rateLimitStore.ts` | CREATE | ~80 | Zustand store for rate limits |
| `src/lib/debounce.ts` | UPDATE | +20 | Reusable debounce hook |

### Dependencies on Previous Stories
| Story | Component/Type Used |
|-------|---------------------|
| 44.12 | WarehouseSelector (dropdown component) |
| 44.27 | Warehouse integration (coefficients fetching) |

### Change Log
_(To be filled by Dev Agent during implementation)_

---

## QA Results

_(To be filled after implementation)_

**Reviewer**:
**Date**:
**Gate Decision**:

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Warehouse Selection Debouncing | ⏳ | |
| AC2 | Loading State During Debounce | ⏳ | |
| AC3 | Rate Limit Error Handling | ⏳ | |
| AC4 | Rate Limit Cooldown UI | ⏳ | |
| AC5 | Intelligent Caching Strategy | ⏳ | |
| AC6 | User Guidance for Rate Limits | ⏳ | |
| AC7 | Fallback to Previous Selection | ⏳ | |
| AC8 | Analytics & Logging | ⏳ | |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC8)
- [ ] Components created with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] Integration tests with warehouse flow
- [ ] E2E tests for rapid warehouse switching
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] QA Gate passed

---

**Created**: 2026-01-21
**Last Updated**: 2026-01-21
**Priority**: P1 - MEDIUM (UX improvement, prevents API errors)
**Business Value**: Eliminates rate limit errors, improves user experience when comparing warehouses
