# Story 84.2: Jam Status — handle `available` field and reason

Status: ready-for-dev

## Story

As a seller with a Jam subscription,
I want to see my correct Jam tier in the sidebar badge,
so that I know my subscription is active and I can use Jam features.

## Acceptance Criteria

1. `available: true, tier: "standard"` — blue "Джем Стандарт" badge in sidebar
2. `available: true, tier: "none"` — no badge in sidebar, settings shows "Нет подписки"
3. `available: false` — no badge in sidebar, settings shows "Статус неизвестен: {reason}"
4. Search analytics respects `available` — RequireJam gates on `available && tier`

## Tasks / Subtasks

- [ ] Task 1: Update types (AC: #1-#4)
  - [ ] 1.1: Add `available: boolean` and `reason?: JamStatusReason` to `JamStatusResponse`
  - [ ] 1.2: Add `JamStatusReason` type literal and `JAM_STATUS_REASON_LABELS` record

- [ ] Task 2: Update SidebarCabinetInfo (AC: #1, #2, #3)
  - [ ] 2.1: Change `showJamBadge` from `jam && jam.tier !== 'none'` to `jam?.available && jam.tier !== 'none'`

- [ ] Task 3: Update CabinetInfoCard Jam section (AC: #2, #3)
  - [ ] 3.1: Wrap tier badge + searchTextsLimit in `jam.available` check
  - [ ] 3.2: Add yellow Alert when `available: false` with reason label
  - [ ] 3.3: Import `JAM_STATUS_REASON_LABELS` from types

- [ ] Task 4: Update tests
  - [ ] 4.1: `useJamStatus.test.ts` — add `available: true` to existing mock, add unavailable test
  - [ ] 4.2: `RequireJam.test.tsx` — add `available: true` to all mocks
  - [ ] 4.3: `SearchPageContent.test.tsx` — add `available: true` to mock
  - [ ] 4.4: Run all affected tests

- [ ] Task 5: Lint + type-check + E2E

## Dev Notes

### Backend Response Shape

```typescript
// Available:
{ tier: "standard", available: true, checkedAt: "...", probeCallsMade: 2, searchTextsLimit: 30 }

// Unavailable:
{ tier: "none", available: false, checkedAt: "...", probeCallsMade: 0, searchTextsLimit: 0, reason: "token_error" }
```

Reason values: `"no_products" | "token_error" | "insufficient_permissions" | "timeout" | "wb_api_error"`

### Key Logic

| available | tier | Sidebar | Settings |
|:-:|:-:|---|---|
| true | none | No badge | "Нет подписки" |
| true | standard | Blue badge | "Джем Стандарт" + limit |
| true | advanced | Purple badge | "Джем Продвинутый" + limit |
| false | * | No badge | Yellow alert with reason |

### Files to Touch

| File | Lines | Change |
|------|:---:|--------|
| `src/types/cabinet.ts` | 162 | Add `JamStatusReason`, labels, update interface |
| `src/components/custom/SidebarCabinetInfo.tsx` | 79 | 1-line: add `?.available` check |
| `src/components/custom/settings/CabinetInfoCard.tsx` | 133 | Wrap Jam section in `available` conditional + alert |
| `src/hooks/__tests__/useJamStatus.test.ts` | 79 | Add `available` to mock, add unavailable test |
| `src/components/custom/jam/__tests__/RequireJam.test.tsx` | 269 | Add `available: true` to all mocks |
| `src/app/(dashboard)/analytics/search/__tests__/SearchPageContent.test.tsx` | 130 | Add `available: true` to mock |

### Files NOT changing

- `src/hooks/useJamStatus.ts` — already has `retry: false`, type flows through
- `src/lib/api/cabinet.ts` — type flows through
- `src/components/custom/jam/RequireJam.tsx` — existing fail-closed logic handles `available: false`

### Previous Story (84.1) Intelligence

- Commit `a58ff4b`: code review fixes — removed `as` casts, used `&&` guard pattern
- Pattern: `(seller.reason && SELLER_INFO_REASON_LABELS[seller.reason])` — reuse same pattern for Jam
- CabinetInfoCard already has yellow Alert pattern from 84.1 seller section — copy for Jam section

### Architecture Constraints

- Files < 200 lines, no `as` casts, no `any`, Russian UI text
- Use `&&` guard for reason labels (not `as` cast) — per 84.1 review fix

### References

- [Source: _bmad-output/planning-artifacts/epics-80-83-fe.md#Story-842]
- [Source: _bmad-output/implementation-artifacts/84-1-seller-info-available.md] — previous story patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

### File List
