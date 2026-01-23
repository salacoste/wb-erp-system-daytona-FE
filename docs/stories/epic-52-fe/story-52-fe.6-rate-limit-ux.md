# Story 52-FE.6: Rate Limit UX & Error Handling

**Epic**: Epic 52-FE - Tariff Settings Admin UI
**Story ID**: 52-FE.6
**Title**: Rate Limit UX & Error Handling
**Status**: ✅ Complete
**Story Points**: 2
**Priority**: Required

---

## User Story

**As an** Admin,
**I want to** see rate limit status and clear error messages,
**So that** I understand when I'm approaching limits and can act accordingly.

---

## Acceptance Criteria

- [x] **AC1**: Rate limit indicator shows remaining requests (from response headers)
- [x] **AC2**: Warning toast when <3 requests remaining
- [x] **AC3**: 429 error handling with retry countdown timer
- [x] **AC4**: 403 error redirects to dashboard with "Требуется роль Admin" message
- [x] **AC5**: 400 validation errors shown inline on form fields
- [x] **AC6**: 409 conflict error shows: "Версия на эту дату уже существует"
- [x] **AC7**: Network errors show generic: "Ошибка сети. Попробуйте позже."
- [x] **AC8**: Rate limit resets tracked and displayed

---

## API Response Headers

Backend returns rate limit info in headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1705932000
```

**Affected endpoints** (10 req/min shared limit):
- `PUT /v1/tariffs/settings`
- `PATCH /v1/tariffs/settings`
- `POST /v1/tariffs/settings/schedule`

---

## Technical Design

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `RateLimitIndicator` | `RateLimitIndicator.tsx` | Shows remaining requests |
| `RateLimitContext` | `RateLimitContext.tsx` | Tracks rate limit state |

### Rate Limit Store (Zustand)

```typescript
// src/stores/rateLimitStore.ts
interface RateLimitState {
  limit: number
  remaining: number
  resetAt: number | null
  updateFromHeaders: (headers: Headers) => void
  decrementRemaining: () => void
}

export const useRateLimitStore = create<RateLimitState>((set) => ({
  limit: 10,
  remaining: 10,
  resetAt: null,

  updateFromHeaders: (headers: Headers) => {
    const limit = parseInt(headers.get('X-RateLimit-Limit') || '10')
    const remaining = parseInt(headers.get('X-RateLimit-Remaining') || '10')
    const resetAt = parseInt(headers.get('X-RateLimit-Reset') || '0') * 1000

    set({ limit, remaining, resetAt })

    // Warning toast when low
    if (remaining <= 3 && remaining > 0) {
      toast.warning(`Осталось ${remaining} запросов. Лимит сбросится через ${formatTimeUntil(resetAt)}.`)
    }
  },

  decrementRemaining: () => set((state) => ({ remaining: Math.max(0, state.remaining - 1) })),
}))
```

### API Client Integration

```typescript
// In src/lib/api/tariffs-admin.ts
export async function putTariffSettings(data: UpdateTariffSettingsDto) {
  const response = await apiClient.put('/v1/tariffs/settings', data, {
    returnFullResponse: true // Get headers
  })

  // Update rate limit from headers
  useRateLimitStore.getState().updateFromHeaders(response.headers)

  return response.data
}
```

### Error Handler Utility

```typescript
// src/lib/tariff-error-handler.ts
export function handleTariffApiError(error: ApiError, router: NextRouter) {
  switch (error.status) {
    case 400:
      // Validation errors - return for inline display
      return {
        type: 'validation',
        errors: Array.isArray(error.message) ? error.message : [error.message]
      }

    case 403:
      toast.error('Требуется роль Admin')
      router.push('/dashboard')
      return { type: 'redirect' }

    case 409:
      toast.error('Версия на эту дату уже существует')
      return { type: 'conflict' }

    case 429:
      const resetTime = error.headers?.get('X-RateLimit-Reset')
      const resetAt = resetTime ? parseInt(resetTime) * 1000 : Date.now() + 60000
      toast.error(`Превышен лимит запросов. Попробуйте через ${formatTimeUntil(resetAt)}.`, {
        duration: 10000
      })
      return { type: 'rateLimit', resetAt }

    default:
      toast.error('Ошибка сети. Попробуйте позже.')
      return { type: 'network' }
  }
}
```

---

## UI/UX Specifications

### Rate Limit Indicator

```
┌────────────────────────────────────────┐
│  Запросов: 8/10   [████████░░]         │
│                                        │
│  Сброс через: 0:45                     │
└────────────────────────────────────────┘
```

**Visual states**:
- **Green** (7-10 remaining): Normal
- **Yellow** (4-6 remaining): Caution
- **Red** (0-3 remaining): Warning

### Component Implementation

```typescript
// RateLimitIndicator.tsx
export function RateLimitIndicator() {
  const { limit, remaining, resetAt } = useRateLimitStore()
  const [timeUntilReset, setTimeUntilReset] = useState('')

  useEffect(() => {
    if (!resetAt) return

    const interval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.floor((resetAt - Date.now()) / 1000))
      setTimeUntilReset(formatSeconds(secondsLeft))

      if (secondsLeft === 0) {
        // Reset the remaining count
        useRateLimitStore.setState({ remaining: limit })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [resetAt, limit])

  const percentage = (remaining / limit) * 100
  const color = remaining <= 3 ? 'red' : remaining <= 6 ? 'yellow' : 'green'

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Запросов: {remaining}/{limit}</span>
      <Progress value={percentage} className={`w-20 h-2 ${getProgressColor(color)}`} />
      {resetAt && remaining < limit && (
        <span>Сброс: {timeUntilReset}</span>
      )}
    </div>
  )
}
```

### Error Messages (Russian)

| Error | Message |
|-------|---------|
| 400 Validation | Inline field errors |
| 403 Forbidden | "Требуется роль Admin" + redirect |
| 409 Conflict | "Версия на эту дату уже существует" |
| 429 Rate Limit | "Превышен лимит запросов. Попробуйте через {time}." |
| Network Error | "Ошибка сети. Попробуйте позже." |
| 500 Server Error | "Ошибка сервера. Попробуйте позже." |

### 429 Countdown Toast

```
┌─────────────────────────────────────────────┐
│  ⚠️ Превышен лимит запросов                  │
│                                              │
│  Попробуйте через 0:45                       │
│                                              │
│  [━━━━━━━━━━━━━━━━━━░░░░░░░░]               │
│                                              │
└─────────────────────────────────────────────┘
```

---

## Testing Requirements

### Unit Tests

- [x] RateLimitIndicator displays correct values
- [x] Progress bar color changes at thresholds
- [x] Countdown timer updates correctly
- [x] Warning toast at ≤3 remaining
- [x] Store updates from response headers

### Integration Tests

- [x] Rate limit headers extracted from API responses
- [x] 429 error shows countdown
- [x] 403 error redirects to dashboard
- [x] 400 errors display inline
- [x] Rate limit resets after timeout

---

## Dependencies

- Story 52-FE.7 (Page Layout - indicator placement)
- Story 52-FE.2 (Form - inline validation)
- Zustand store or Context for state management

---

## Files to Create/Modify

### New Files

```
src/components/custom/tariffs-admin/RateLimitIndicator.tsx
src/stores/rateLimitStore.ts (or src/contexts/RateLimitContext.tsx)
src/lib/tariff-error-handler.ts
```

### Modified Files

```
src/lib/api/tariffs-admin.ts (add header extraction)
src/hooks/useUpdateTariffSettings.ts (add error handling)
src/hooks/useScheduleTariffVersion.ts (add error handling)
```

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests written and passing
- [x] Rate limit visible on all mutation pages
- [x] Error messages user-friendly (Russian)
- [x] Countdown timer works accurately
- [ ] Code reviewed and approved

---

**Created**: 2026-01-22
**Last Updated**: 2026-01-22
