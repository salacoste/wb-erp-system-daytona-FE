# Story 84.1: Seller Info — handle `available` field and `sid` type change

Status: ready-for-dev

## Story

As a seller using the dashboard,
I want to see my store name in the sidebar even when WB API is temporarily unavailable,
so that I always know which cabinet I'm working with and understand if there's a data issue.

## Acceptance Criteria

1. **available: true** — Sidebar shows tradeMark (or name) as before. No warning indicators.
2. **available: false** — Sidebar shows "Кабинет" with warning icon. Hover shows reason in Russian.
3. **Settings page** — When `available: false`, yellow warning banner: "Информация о продавце недоступна: {reason}" with link to update WB token.
4. **sid type** — Typed as `string` everywhere (already correct — verify, remove any `String()` casts).
5. **No 500 handling** — Backend always returns 200 now. Remove error-based fallbacks.

## Tasks / Subtasks

- [ ] Task 1: Update types (AC: #1, #2, #4)
  - [ ] 1.1: Add `available: boolean` and `reason?: SellerInfoReason` to `SellerInfoResponse` in `src/types/cabinet.ts`
  - [ ] 1.2: Add `SellerInfoReason` type literal and `SELLER_INFO_REASON_LABELS` record
  - [ ] 1.3: Verify `sid` is already `string` (no `number` union anywhere)

- [ ] Task 2: Update SidebarCabinetInfo (AC: #1, #2)
  - [ ] 2.1: Replace `sellerResolved` logic with `seller?.available` check
  - [ ] 2.2: Add `AlertTriangle` warning icon when `available: false`
  - [ ] 2.3: Add `Tooltip` with `SELLER_INFO_REASON_LABELS[seller.reason]` on hover
  - [ ] 2.4: Remove `isError: sellerError` destructuring (no longer needed — backend always 200)

- [ ] Task 3: Update CabinetInfoCard (AC: #3, #4)
  - [ ] 3.1: Add yellow `Alert` banner when `seller?.available === false`
  - [ ] 3.2: Banner text: "Информация о продавце недоступна: {reason}"
  - [ ] 3.3: Add link to `/settings/cabinet` (WB token update)
  - [ ] 3.4: Remove `String(seller.sid)` cast — `sid` is already `string`
  - [ ] 3.5: Remove `sellerError` handling (backend always 200)

- [ ] Task 4: Update tests (AC: #1, #2)
  - [ ] 4.1: Update mock in `src/hooks/__tests__/useSellerInfo.test.ts` — add `available: true` to success mock
  - [ ] 4.2: Add test case for `available: false, reason: 'token_error'`
  - [ ] 4.3: Run `npx vitest run src/hooks/__tests__/useSellerInfo.test.ts`

- [ ] Task 5: Update E2E test (AC: #1, #2)
  - [ ] 5.1: Update `e2e/dashboard-session-fixes.spec.ts` sidebar tests if needed
  - [ ] 5.2: Run `npx playwright test e2e/dashboard-session-fixes.spec.ts`

- [ ] Task 6: Verify in browser
  - [ ] 6.1: Check sidebar shows "Space Chemical" (available: true)
  - [ ] 6.2: Check settings page shows seller info without warning

## Dev Notes

### Backend Response Shape (confirmed)

```typescript
// Success:
{ name: "ИП Дергачев И.М.", sid: "87935c94-...", tradeMark: "Space Chemical", available: true }

// WB API failure:
{ name: "", sid: "", tradeMark: "", available: false, reason: "token_error" }
```

Reason values: `"token_error" | "insufficient_permissions" | "timeout" | "wb_api_error"`

### Key Architecture Constraints

- **File size**: All files < 200 lines (ESLint enforced)
- **No `as` casts**: Widen types with `?:` or `?? fallback`
- **No `any`**: Use `unknown` or specific types
- **Russian UI text**: All user-facing strings in Russian
- **shadcn/ui**: Use `Alert`, `Tooltip` from existing components
- **Imports**: Use `@/components`, `@/types`, `@/hooks` path aliases

### Files to Touch (6 files)

| File | Lines | Change |
|------|:---:|--------|
| `src/types/cabinet.ts` | 146 | Add `available`, `reason`, `SellerInfoReason`, labels |
| `src/components/custom/SidebarCabinetInfo.tsx` | 62 | Replace fallback logic, add warning icon + tooltip |
| `src/components/custom/settings/CabinetInfoCard.tsx` | 117 | Add warning banner, remove String() cast |
| `src/hooks/useSellerInfo.ts` | 25 | No changes needed (already correct) |
| `src/lib/api/cabinet.ts` | 57 | No changes needed (type flows through) |
| `src/hooks/__tests__/useSellerInfo.test.ts` | 78 | Update mocks, add available/reason tests |

### Current SidebarCabinetInfo Logic (to replace)

```typescript
// CURRENT (remove):
const sellerResolved = seller !== undefined || sellerError
const displayName = seller?.tradeMark || seller?.name || (sellerResolved ? 'Кабинет' : '')

// NEW (implement):
const displayName = seller?.available
  ? (seller.tradeMark || seller.name || 'Кабинет')
  : seller !== undefined ? 'Кабинет' : '' // empty = still loading
const showWarning = seller?.available === false
```

### Previous Story Intelligence

This is the first story in Epic 84-FE. Previous session already implemented partial seller-info handling:
- Commit `0c12e6f`: Added `sellerResolved` fallback in SidebarCabinetInfo
- Commit `f288a58`: Added `retry: false` to useSellerInfo
- These changes need to be REPLACED (not extended) with the `available` field logic

### Git Intelligence

Recent commits show:
- `bf99122`: Expense chart redesign (horizontal bars) — same file pattern (component + config)
- `186c816`: E2E tests for dashboard fixes — existing tests to update
- `0f741e2`: Trends fix with `skipDataUnwrap` — similar API response shape handling

### Testing Standards

- **Unit**: Vitest, `renderHookWithClient` for hooks, `mockResolvedValueOnce` (not `mockResolvedValue`)
- **E2E**: Playwright, `page.locator().first()` for duplicates, `waitForLoadState('networkidle')`
- **Pattern**: Export pure functions for testing, mock API at hook level

### Project Structure Notes

- Types in `src/types/cabinet.ts` — extend existing interface (don't create new file)
- Reason labels in same file as type — follows project pattern (see `JAM_TIER_LABELS`)
- Tooltip from `@/components/ui/tooltip` (shadcn/ui, already used in sidebar)
- Alert from `@/components/ui/alert` (already used in CabinetInfoCard)

### References

- [Source: _bmad-output/planning-artifacts/epics-80-83-fe.md#Story-841]
- [Source: docs/backlog/epics-80-83-frontend-integration.md#Story-1A]
- [Source: CLAUDE.md#Critical-Development-Rules]
- [Source: docs/front-end-spec.md#Color-Palette] — Yellow #F59E0B for warnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

### File List
