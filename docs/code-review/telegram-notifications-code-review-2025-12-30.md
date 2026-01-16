# Telegram Notifications Code Review - Frontend

**Date**: 2025-12-30
**Epic**: Epic 34-FE - Telegram Notifications
**Reviewer**: James (Frontend Developer)
**Scope**: Phase 1 (Status Check - Foundation)

---

## Executive Summary

✅ **Overall Status**: **FUNCTIONAL** - Implementation is complete and follows most project patterns.

⚠️ **Issues Found**: 2 moderate inconsistencies
✅ **Strengths**: Well-structured components, comprehensive hooks, proper TypeScript typing

**Recommendation**: Refactor API client and hooks to match project standards before Phase 2.

---

## 1. API Client Review (`src/lib/api/notifications.ts`)

### ⚠️ Issue #1: Inconsistent API Client Pattern

**Severity**: Moderate
**Impact**: Maintenance, code consistency

**Current Implementation**:
```typescript
// lib/api/notifications.ts (INCONSISTENT)
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getAuthHeaders(): HeadersInit {
  const { token, cabinetId } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}',
    'X-Cabinet-Id': cabinetId || '',
  };
}

export async function startTelegramBinding() {
  const response = await fetch(`${API_BASE_URL}/v1/notifications/telegram/bind`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params || {}),
  });
  // ... error handling
}
```

**Project Standard** (Used by all other API clients):
```typescript
// lib/api/storage-analytics.ts (CORRECT)
import { apiClient } from '../api-client'

export async function getStorageBySku(
  params: StorageBySkuParams
): Promise<StorageBySkuResponse> {
  const queryString = buildQueryString(params)
  const endpoint = `/v1/analytics/storage/by-sku${queryString ? `?${queryString}` : ''}`

  return apiClient.get<StorageBySkuResponse>(endpoint)
}
```

**Comparison**:
| Aspect | notifications.ts | Other API clients |
|--------|------------------|-------------------|
| Base client | Raw `fetch` | `apiClient` class |
| Auth headers | Manual injection | Auto-injected |
| Error handling | Custom function | Built-in `ApiError` |
| Base URL | Manual env var | Centralized config |

**Recommendation**: ✅ **Refactor Required**

Refactor `lib/api/notifications.ts` to use `apiClient`:
```typescript
// RECOMMENDED IMPLEMENTATION
import { apiClient } from '../api-client'
import type { BindingCodeResponseDto, BindingStatusResponseDto } from '@/types/notifications'

export async function startTelegramBinding(
  params?: StartBindingRequestDto
): Promise<BindingCodeResponseDto> {
  return apiClient.post<BindingCodeResponseDto>(
    '/v1/notifications/telegram/bind',
    params || {}
  )
}

export async function getBindingStatus(): Promise<BindingStatusResponseDto> {
  return apiClient.get<BindingStatusResponseDto>(
    '/v1/notifications/telegram/status'
  )
}

export async function unbindTelegram(): Promise<void> {
  return apiClient.delete('/v1/notifications/telegram/unbind')
}
```

**Benefits**:
- ✅ Consistent error handling across all APIs
- ✅ Automatic JWT + Cabinet-Id headers
- ✅ Centralized config (no duplicate env var access)
- ✅ Easier testing and mocking
- ✅ Better type safety with `ApiError` class

---

## 2. Hooks Review (`src/hooks/useTelegramBinding.ts`)

### ⚠️ Issue #2: Missing Query Keys Factory Pattern

**Severity**: Moderate
**Impact**: Cache management, maintainability

**Current Implementation**:
```typescript
// hooks/useTelegramBinding.ts (INCONSISTENT)
export function useTelegramBinding() {
  const { data: status } = useQuery({
    queryKey: ['telegram-status'],  // ❌ Inline string array
    queryFn: getBindingStatus,
    refetchInterval: (query) => {
      return query.state.data?.bound ? false : 3000;
    },
  });

  // ...
}
```

**Project Standard** (Used in advertising analytics):
```typescript
// hooks/useAdvertisingAnalytics.ts (CORRECT)
export const advertisingQueryKeys = {
  all: ['advertising'] as const,
  analytics: (params: AdvertisingAnalyticsParams) =>
    [...advertisingQueryKeys.all, 'analytics', params] as const,
  syncStatus: () => [...advertisingQueryKeys.all, 'sync-status'] as const,
}

export function useAdvertisingAnalytics(params: AdvertisingAnalyticsParams) {
  return useQuery({
    queryKey: advertisingQueryKeys.analytics(params),  // ✅ Factory pattern
    queryFn: () => getAdvertisingAnalytics(params),
    staleTime: 30000,
  })
}
```

**Recommendation**: ✅ **Refactor Required**

Add query keys factory to `hooks/useTelegramBinding.ts`:
```typescript
// RECOMMENDED IMPLEMENTATION
export const telegramQueryKeys = {
  all: ['telegram'] as const,
  status: () => [...telegramQueryKeys.all, 'status'] as const,
  bindingCode: () => [...telegramQueryKeys.all, 'binding-code'] as const,
}

export function useTelegramBinding() {
  const { data: status } = useQuery({
    queryKey: telegramQueryKeys.status(),  // ✅ Factory pattern
    queryFn: getBindingStatus,
    refetchInterval: (query) => {
      return query.state.data?.bound ? false : 3000;
    },
  });

  // In mutations:
  const unbind = useMutation({
    mutationFn: unbindTelegram,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: telegramQueryKeys.status()  // ✅ Consistent invalidation
      });
    },
  });
}
```

**Benefits**:
- ✅ Type-safe query key management
- ✅ Easier refactoring (centralized keys)
- ✅ Better cache invalidation patterns
- ✅ Consistent with project standards
- ✅ Follows TanStack Query v5 best practices

---

## 3. Component Review

### ✅ Strengths

**1. TelegramBindingModal.tsx** - Excellent UX patterns:
```typescript
// ✅ Dynamic polling messages based on elapsed time
const getPollingMessage = () => {
  if (pollingDuration <= 5) return 'Ожидаем подтверждения...';
  if (pollingDuration <= 60) return 'Всё ещё ожидаем... Проверьте Telegram.';
  return 'Подтверждение занимает дольше обычного. Убедитесь, что вы отправили команду боту.';
};

// ✅ Color-coded progress bar
const getProgressColor = () => {
  if (timeRemaining > 120) return 'bg-[#0088CC]'; // Telegram Blue
  if (timeRemaining > 30) return 'bg-orange-500'; // Warning
  return 'bg-red-500'; // Critical
};
```

**2. Settings Page** - Excellent empty state handling:
```typescript
// ✅ Hero banner when not bound (good onboarding)
{!isBound && (
  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
    {/* Feature list with checkmarks */}
    {/* CTA button */}
  </Card>
)}

// ✅ Disabled overlay for locked features
{!isBound && (
  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10">
    <Lock className="h-12 w-12 text-gray-400" />
    <p>Подключите Telegram</p>
  </div>
)}
```

**3. Accessibility**:
```typescript
// ✅ ARIA labels and roles
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`Время до истечения кода: ${formatTime(timeRemaining)}`}
/>

<div role="status" aria-live="polite" aria-atomic="true">
  <p>{getPollingMessage()}</p>
</div>
```

**4. Component Composition**:
```typescript
// ✅ Clear separation of concerns
TelegramBindingCard         // Status display + trigger bind/unbind
TelegramBindingModal        // Binding flow with QR code + polling
NotificationPreferencesPanel // Event type toggles
QuietHoursPanel            // Quiet hours configuration
UnbindConfirmationDialog   // Unbind confirmation
```

### Minor Suggestions (Non-blocking)

**1. Bot username hardcoded**:
```typescript
// Current (hardcoded)
<p>Отправьте боту @Kernel_crypto_bot:</p>

// Suggestion (use env var)
<p>Отправьте боту @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}:</p>
```

**2. Magic numbers**:
```typescript
// Current
const [timeRemaining, setTimeRemaining] = useState(600); // What is 600?

// Suggestion
const BINDING_CODE_TTL_SECONDS = 600; // 10 minutes
const [timeRemaining, setTimeRemaining] = useState(BINDING_CODE_TTL_SECONDS);
```

---

## 4. TypeScript Types Review

### ✅ Excellent Type Safety

**File**: `src/types/notifications.ts`

**Strengths**:
- ✅ Complete DTOs matching backend contract
- ✅ Enums for type-safe constants
- ✅ JSDoc comments for all interfaces
- ✅ Frontend-only helper types (BindingFlowState enum)
- ✅ Error response types

**Example**:
```typescript
/**
 * Response from POST /v1/notifications/telegram/bind
 * Contains verification code and instructions for user
 */
export interface BindingCodeResponseDto {
  binding_code: string;          // e.g., "A1B2C3D4" (8 chars)
  expires_at: string;             // ISO 8601 timestamp
  instructions: string;           // User instructions (ru/en)
  deep_link: string;              // https://t.me/Kernel_crypto_bot?start=...
}

export enum BindingFlowState {
  IDLE = 'idle',
  GENERATING_CODE = 'generating_code',
  POLLING = 'polling',
  SUCCESS = 'success',
  ERROR = 'error',
  EXPIRED = 'expired',
}
```

---

## 5. Testing Readiness

### Component Tests Structure

**Found**: `src/components/notifications/__tests__/` directory

**Status**: ⚠️ **Test files exist but need verification**

**Recommendation**: Verify test coverage before Phase 2:
```bash
npm test -- --coverage src/components/notifications
```

---

## 6. Build Verification

### ✅ TypeScript Compilation

**Result**: ✅ **PASSING**

```bash
$ npm run build
✓ Compiled successfully in 6.0s
   Linting and checking validity of types ...
   Generating static pages (25/25)

Route (app)                      Size  First Load JS
├ ○ /settings/notifications   15.5 kB     185 kB  # ✅ Page exists
```

**Analysis**:
- ✅ No TypeScript errors
- ✅ Route `/settings/notifications` built successfully
- ✅ Bundle size reasonable (185 KB First Load JS)

---

## Summary of Issues & Recommendations

| # | Issue | Severity | Effort | Priority |
|---|-------|----------|--------|----------|
| 1 | API client uses raw `fetch` instead of `apiClient` | Moderate | 1-2h | **HIGH** |
| 2 | Hooks lack query keys factory pattern | Moderate | 30min | **HIGH** |
| 3 | Bot username hardcoded | Low | 5min | Low |
| 4 | Magic numbers in timer | Low | 10min | Low |

---

## Refactoring Plan

### Priority 1: API Client (1-2h)

**Steps**:
1. Read `lib/api-client.ts` to understand `apiClient` class interface
2. Refactor all 6 functions in `lib/api/notifications.ts` to use `apiClient`
3. Remove `getAuthHeaders()` and `handleApiError()` helper functions
4. Update imports
5. Run tests to verify no regressions

**Estimated Time**: 1-2 hours
**Risk**: Low (existing tests should catch breakages)

---

### Priority 2: Query Keys Factory (30min)

**Steps**:
1. Add `telegramQueryKeys` factory to `hooks/useTelegramBinding.ts`
2. Replace all inline `['telegram-status']` with factory calls
3. Update invalidation calls in mutations
4. Verify polling still works

**Estimated Time**: 30 minutes
**Risk**: Very Low

---

### Priority 3: Minor Improvements (15min)

**Steps**:
1. Extract bot username to env var
2. Replace magic numbers with named constants
3. Update tests if needed

**Estimated Time**: 15 minutes
**Risk**: Minimal

---

## Code Review Checklist

### API Client
- [ ] Uses centralized `apiClient` class
- [ ] Follows project error handling patterns
- [ ] No duplicate auth header logic

### Hooks
- [ ] Query keys factory pattern
- [ ] Proper TypeScript typing
- [ ] Consistent caching strategies
- [ ] Mutation error handling

### Components
- [x] Accessibility (ARIA labels, roles)
- [x] Loading states
- [x] Error states
- [x] Empty states
- [x] Responsive design
- [ ] No hardcoded values (bot username)

### TypeScript
- [x] Complete type definitions
- [x] No `any` types
- [x] JSDoc comments
- [x] Type exports

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual test plan created

---

## Next Steps

1. ✅ **Code Review Complete**
2. ⏳ **Refactor API Client & Hooks** (Priority 1 & 2)
3. ⏳ **Manual Testing** (Part A)
4. ⏳ **Phase 2 Planning**

**Estimated Total Refactoring Time**: 2.5 hours

---

**Document Version**: 1.0
**Last Updated**: 2025-12-30
**Next Review**: After refactoring completion
