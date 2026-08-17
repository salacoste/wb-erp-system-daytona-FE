# Story 84.3: Token Health Banner

Status: ready-for-dev

## Story

As a seller whose WB API token has expired or become invalid,
I want to see a clear warning banner on every page telling me there's a problem,
so that I can fix it before my data becomes stale.

## Acceptance Criteria

1. `healthy: false` — yellow banner below navbar on all dashboard pages with `recommendation` text
2. Banner dismissable per session — re-appears if `errorCount` increases
3. `healthy: true` — no banner, polling at reduced frequency
4. Polls every 60s while unhealthy, stops/slows when healthy
5. Not shown on login/onboarding pages (only dashboard layout)

## Tasks / Subtasks

- [ ] Task 1: Add types (AC: #1)
  - [ ] 1.1: Add `TokenHealthResponse` interface to `src/types/cabinet.ts`

- [ ] Task 2: Add API function (AC: #1)
  - [ ] 2.1: Add `getTokenHealth(cabinetId)` to `src/lib/api/cabinet.ts`

- [ ] Task 3: Create hook (AC: #1, #3, #4)
  - [ ] 3.1: Create `src/hooks/useTokenHealth.ts` with polling via `refetchInterval`
  - [ ] 3.2: Poll 60s when unhealthy, 5min when healthy
  - [ ] 3.3: `refetchOnWindowFocus: false` to avoid excess requests

- [ ] Task 4: Create banner component (AC: #1, #2)
  - [ ] 4.1: Create `src/components/custom/dashboard/TokenHealthBanner.tsx`
  - [ ] 4.2: Yellow Alert with `recommendation` text + link to Settings
  - [ ] 4.3: Dismiss button — store `{ dismissed: true, errorCount: N }` in sessionStorage
  - [ ] 4.4: Re-appear if `errorCount` increased since dismissal

- [ ] Task 5: Wire into layout (AC: #5)
  - [ ] 5.1: Import + render `TokenHealthBanner` in `src/app/(dashboard)/layout.tsx` after Navbar

- [ ] Task 6: Tests + lint
  - [ ] 6.1: Unit test for hook
  - [ ] 6.2: Lint + type-check

## Dev Notes

### Backend Response Shape

```typescript
interface TokenHealthResponse {
  healthy: boolean
  lastError?: string
  lastErrorAt?: string      // ISO 8601
  firstErrorAt?: string
  errorCount?: number
  lastSuccessAt?: string
  recommendation?: string   // Russian text for user
}
```

Endpoint: `GET /v1/cabinets/:id/token-status`
Data from Redis — lightweight, no WB API calls.

### Dismissal Pattern (from EfficiencyAlertBanner)

```typescript
// sessionStorage key: 'token-health-dismissed'
// Value: JSON { dismissed: true, errorCount: 5 }
// Re-appear logic: if current errorCount > stored errorCount
```

Reference: `src/lib/efficiency-alert-state.ts` — same pattern.

### Polling Pattern

```typescript
refetchInterval: (query) => {
  const data = query.state.data
  if (!data || data.healthy) return 5 * 60_000  // 5min when healthy
  return 60_000                                   // 60s when unhealthy
}
```

### Layout Integration Point

`src/app/(dashboard)/layout.tsx` — after `<Navbar />` (line ~175), before `<main>`.
Banner renders inside dashboard group only — login/onboarding use separate layouts.

### Banner Design

```
⚠️  Проблема с WB API токеном                              [✕]
    {recommendation}
    Последняя ошибка: {lastError} ({lastErrorAt})
    [Настройки кабинета →]
```

Yellow variant: `border-yellow-300 bg-yellow-50 text-yellow-800` (Alert `variant="warning"`)

### Architecture Constraints

- Files < 200 lines, no `as` casts, no `any`
- `refetchOnWindowFocus: false` — avoid burst on tab switch
- Use `sessionStorage` not `localStorage` (dismiss per session)
- Use `ROUTES.SETTINGS.CABINET` for link

### Previous Stories Intelligence

- 84.1: `SELLER_INFO_REASON_LABELS` pattern — reuse for reason display
- 84.2: `JAM_STATUS_REASON_LABELS` — same pattern
- Both removed `isError` handling — backend always 200
- Code review 84.1: removed `as` casts — don't reintroduce

### Files to Create/Modify

| File | Action | Lines |
|------|--------|:---:|
| `src/types/cabinet.ts` | ADD `TokenHealthResponse` | +10 |
| `src/lib/api/cabinet.ts` | ADD `getTokenHealth()` | +5 |
| NEW `src/hooks/useTokenHealth.ts` | CREATE | ~30 |
| NEW `src/components/custom/dashboard/TokenHealthBanner.tsx` | CREATE | ~80 |
| `src/app/(dashboard)/layout.tsx` | ADD import + render | +3 |

### References

- [Source: _bmad-output/planning-artifacts/epics-80-83-fe.md#Story-843]
- [Source: src/components/custom/dashboard/TaxWarningBanner.tsx] — dismissal pattern
- [Source: src/lib/efficiency-alert-state.ts] — smart re-appearance pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

### File List
