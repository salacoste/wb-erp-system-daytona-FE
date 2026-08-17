# Story 86.2: Client Info (PII) for FBS Orders

Status: done

## Story

As an **Owner** viewing FBS orders,
I want to see **client name and phone number** for my orders,
so that I can **contact buyers when needed for delivery coordination**.

## Acceptance Criteria

1. **Owner role gate** — When the user has role "Owner" and the orders table loads, a "Клиент" column is rendered AND client info is fetched in batches (max 100 orderIds per request).
2. **Non-Owner gate** — When the user has role Manager / Analyst / Service, the "Клиент" column is completely hidden AND no client-info API calls are made (network tab clean, hook `enabled: false`).
3. **Partial data graceful handling** — When the API returns partial data (some orders have no client info), the affected rows show "—" in the client column and no error is displayed.
4. **PII never persisted** — When client PII data is received, it is NOT persisted to localStorage, sessionStorage, or any browser cache, AND it is NOT logged to console.
5. **PII evicted on unmount** — When the `useClientInfo` hook unmounts (user navigates away), TanStack Query `gcTime: 0` causes immediate eviction. A unit test inspects `localStorage` and `sessionStorage` after unmount and asserts that NO keys contain client names or phone numbers.
6. **Batch chunking** — If the orders list contains more than 100 orderIds, the hook splits the request into chunks of 100 and merges the results before exposing them to the component.

## Tasks / Subtasks

- [x] Task 1: Types — `src/types/orders-client-info.ts` (AC: #1, #3)
  - [x] 1.1: Defined `ClientInfoItem` interface (matches backend `ClientInfoItemDto` — `orderId: number`, `clientName?`, `clientPhone?`)
  - [x] 1.2: Defined `ClientInfoResponse` as bare array (backend returns `ClientInfoItemDto[]`, not wrapper)
  - [x] 1.3: Defined `ClientInfoMap` as `Record<string, ClientInfoItem>` (keyed by stringified orderId for O(1) row lookup matching `OrderFbsItem.orderId: string`)

- [x] Task 2: API function — `src/lib/api/orders/client-info-api.ts` (AC: #1, #6)
  - [x] 2.1: Created new directory `src/lib/api/orders/` (first file in it)
  - [x] 2.2: Implemented `getClientInfo(cabinetId, orderIds): Promise<ClientInfoResponse>`
  - [x] 2.3: Rejects empty input AND > 100 IDs with descriptive error
  - [x] 2.4: Uses `URLSearchParams` for query string
  - [x] 2.5: Zero `console.*` calls — no PII in logs
  - [x] 2.6: Added 8-test API unit test covering: validation guards, endpoint shape, BigInt safety, exact-100 boundary, error propagation
  - [x] 2.7: **Backend contract correction** — backend uses GET (not POST as estimated in story planning); response is bare array (uses `skipDataUnwrap: true`)

- [x] Task 3: Hook — `src/hooks/useClientInfo.ts` (AC: #1, #2, #4, #5, #6)
  - [x] 3.1: Uses `useAuthStore(state => state.user)` + computes `isOwner = user?.role === 'Owner'`
  - [x] 3.2: Uses `useAuthStore(state => state.cabinetId)` for the request
  - [x] 3.3: `enabled: isOwner && cabinetId != null && orderIds.length > 0`
  - [x] 3.4: **`gcTime: 0`** ✅
  - [x] 3.5: `staleTime: 5 * 60_000` ✅
  - [x] 3.6: `retry: false` ✅
  - [x] 3.7: Chunking via pure `chunkOrderIds()` helper + `Promise.all`; single-fetch fast path for ≤100
  - [x] 3.8: Merging via pure `buildClientInfoMap()` helper — keyed by `String(item.orderId)`
  - [x] 3.9: Zero `console.*` calls in hook — no PII in logs
  - [x] 3.10: `clientInfoQueryKeys.byOrderIds()` sorts input for deterministic cache keys

- [x] Task 4: Hook tests — `src/hooks/__tests__/useClientInfo.test.ts` (AC: #2, #4, #5, #6)
  - [x] 4.1: Tests `does NOT fetch when user role is Manager/Analyst/Service/null` (4 separate tests)
  - [x] 4.2: Test `does NOT fetch when orderIds is empty (even for Owner)`
  - [x] 4.3: Test `does NOT fetch when cabinetId is null (even for Owner)`
  - [x] 4.4: Test `fetches and returns merged ClientInfoMap for Owner`
  - [x] 4.5: Test `chunks 250 orderIds into 3 parallel calls (AC #6)` — asserts 100/100/50 split
  - [x] 4.6: Test `handles partial response — orders missing from API absent from map`
  - [x] 4.7: **Test `does NOT persist PII to localStorage after success (AC #5)`** ✅
  - [x] 4.8: **Test `does NOT persist PII to sessionStorage after success (AC #5)`** ✅
  - [x] 4.9: **Test `does NOT log PII to console.info on success (AC #4)`** — spies on info/log/warn ✅
  - [x] 4.10: **Test `PII is not in storage after hook unmounts (gcTime: 0 — AC #5)`** ✅
  - [x] 4.11: Query key factory tests (sort stability + non-mutation)
  - [x] 4.12: Pure helper tests for `chunkOrderIds` (4) and `buildClientInfoMap` (4)
  - [x] 4.13: Test `does NOT retry on error (retry: false)`

- [x] Task 5: OrdersTable — render new "Клиент" column (AC: #1, #2, #3)
  - [x] 5.1: Added `clientInfoMap?: ClientInfoMap` and `showClientColumn?: boolean` props to `OrdersTable`
  - [x] 5.2: Conditionally appends `CLIENT_COLUMN` (`Клиент`, w-44) to `columns` when `showClientColumn`
  - [x] 5.3: Passes `clientInfo={clientInfoMap?.[order.orderId]}` and `showClientColumn` down to `OrdersTableRow`
  - [x] 5.4: Added `clientInfo?` and `showClientColumn?` props to `OrdersTableRow`; renders new `<TableCell>` conditionally
  - [x] 5.5: Phone link `<a href="tel:...">` with `aria-label="Позвонить клиенту по номеру {phone}"` and `e.stopPropagation()` (prevents row modal from opening)
  - [x] 5.6: Line counts verified: `OrdersTable.tsx` = 168 lines, `OrdersTableRow.tsx` = 192 lines (both under 200)
  - [x] 5.7: Extracted `<ClientInfoCell>` sub-component within `OrdersTableRow.tsx` for null-safe rendering ("—" for missing PII)

- [x] Task 6: Wire hook into orders page (AC: #1, #2)
  - [x] 6.1: Added `useClientInfo` call in `OrdersPageContent`
  - [x] 6.2: `orderIds = useMemo(() => data?.items?.map(o => o.orderId) ?? [], [data?.items])` — memoized for stable hook input
  - [x] 6.3: `showClientColumn = userRole === 'Owner'` via `useAuthStore(state => state.user?.role)`
  - [x] 6.4: Passes `showClientColumn` and `clientInfoMap` to `<OrdersTable>`
  - [x] 6.5: Page line count = 193 (under 200)

- [x] Task 7: Component test — `src/components/custom/orders/__tests__/OrdersTable.client-column.test.tsx` (AC: #1, #2, #3)
  - [x] 7.1: Test column header renders when `showClientColumn=true`
  - [x] 7.2: Test column header absent when `showClientColumn=false` AND when prop omitted (default)
  - [x] 7.3: Test row renders client name + phone when present
  - [x] 7.4: Test "—" when orderId not in map (4 tests covering different missing scenarios)
  - [x] 7.5: Test phone link has `href="tel:..."` and aria-label
  - [x] 7.6: **BONUS** Test `clicking phone link does NOT trigger row onClick (stopPropagation)` ✅
  - [x] 7.7: **BONUS** Test `does NOT render client name/phone even if clientInfoMap provided` (defense-in-depth for AC #2)

- [x] Task 8: Lint + type-check — zero errors on all 9 Story 86.2 files

- [x] Task 9: Final verification
  - [x] 9.1: All new test files pass (11 + 26 + 11 = 48 new tests after code review fixes)
  - [x] 9.2: Zero regressions across 141 orders + Story 86.2 tests
  - [x] 9.3: File List populated below

### Review Follow-ups (AI)

- [x] [AI-Review][High] H1 — Removed `cabinetId!` non-null assertions in queryFn; replaced with `if (!cabinetId) return {}` runtime guard + `safeCabinetId` local
- [x] [AI-Review][Medium] M1 — Added 2 console.* spy tests in `client-info-api.test.ts` to lock down API module privacy (info/log/warn/error all spied)
- [x] [AI-Review][Medium] M2 — Added `console.error` to hook test spy list + new error-path privacy test
- [x] [AI-Review][Medium] M3 — Set `staleTime: 0` to align with `gcTime: 0` (removed dead 5min stale window)
- [x] [AI-Review][Medium] M4 — Renamed `state => state.user?.role` selector to `auth => auth.user?.role` (no shadowing)
- [x] [AI-Review][Low] L1 — `cabinetId` now `encodeURIComponent`-encoded in API path + dedicated test
- [x] [AI-Review][Low] L2 — Removed unnecessary single-fetch fast path in queryFn (Promise.all handles arity 1 correctly)
- [x] [AI-Review][Low] L3 — Removed emoji markers (🚨) from source comments; replaced with prose
- [x] [AI-Review][Low] L4 — Added explicit `chunkOrderIds([])` empty-input contract test

## Dev Notes

### 🚨 Privacy & Security Constraints (NON-NEGOTIABLE — NFR3)

This story handles **PII** (personally identifiable information). The following are MANDATORY:

1. **NEVER persist client data to browser storage** — no `localStorage`, no `sessionStorage`, no IndexedDB, no cookies.
2. **NEVER log client data to console** — no `console.info(response)`, no `console.log({ name, phone })`, no `console.warn(clientInfo)`.
3. **TanStack Query `gcTime: 0`** — guarantees in-memory eviction the moment all observers unmount.
4. **TanStack Query `retry: false`** — failed requests must NOT auto-retry (one network attempt per call).
5. **Test the privacy guarantees** — AC #5 explicitly mandates an automated test that verifies storage is clean after unmount. This is a GUARDRAIL — do not skip Task 4.7 / 4.8 / 4.9.
6. **Hook should NOT default to `console.info` even for "fetching..." status messages** — the previous Story 86.1 hook pattern logs metadata; Story 86.2 must NOT inherit this convention because logged URLs would contain `orderIds` that link to PII.

### Backend Endpoint (estimated — confirm with backend before merge)

The exact contract is not yet documented in the epic. Two viable options:

**Option A (recommended) — POST with body:**
```
POST /v1/cabinets/:id/orders/client-info
Headers: Authorization, X-Cabinet-Id, Content-Type: application/json
Body: { "orderIds": ["123", "456", ...] }   // max 100

Response: { "items": [{ "orderId": "123", "name": "Иван И.", "phone": "+79001234567" }, ...] }
```

**Option B — GET with query string:**
```
GET /v1/cabinets/:id/orders/client-info?orderIds=123,456,789
```

**Why Option A is preferred:**
- 100 BigInt orderIds × ~20 chars each ≈ 2000+ chars in URL → risks 414 URI Too Long on some proxies/browsers
- POST is more semantically correct for batch lookups
- Body is not logged in standard access logs (mild PII benefit)

⚠️ **Action for dev agent:** Before implementing Task 2, check `frontend/test-api/14-orders.http` and `../docs/API-PATHS-REFERENCE.md` for the actual contract. If neither documents the endpoint, write a note in `frontend/docs/request-backend/NNN-client-info-pii-endpoint.md` and use Option A as the placeholder while waiting for backend confirmation.

### Role Gate Pattern (from Sidebar.tsx:29 + useBackfill.ts)

```typescript
// In hook
import { useAuthStore } from '@/stores/authStore'
const user = useAuthStore(state => state.user)
const isOwner = user?.role === 'Owner'
```

User type: `'Owner' | 'Manager' | 'Analyst' | 'Service'` — see `src/types/auth.ts:9`.

Project pattern is to use `user?.role === 'Owner'` directly (no separate `isOwner` selector). Do not introduce a new auth helper for this story.

### Existing Patterns to Follow (from Story 86.1)

- **API function**: `src/lib/api/bid-recommendations.ts` — `URLSearchParams`, `Number.isFinite` validation, no console logging of sensitive fields
- **Hook**: `src/hooks/useBidRecommendations.ts` — `staleTime`, `retry: false`, validation gating in `enabled`
- **Hook tests**: `src/hooks/__tests__/useBidRecommendations.test.ts` — uses `renderHookWithClient` from `@/test/test-utils`, mocks the API module, asserts `getX.not.toHaveBeenCalled()` for guard tests
- **Component tests**: `src/components/custom/advertising/__tests__/BidRecommendationsCard.test.tsx` — wraps in `QueryClientProvider`, uses `mockHook` helper, tests all render branches
- **`beforeEach` style** (TS strict): use block body `beforeEach(() => { vi.clearAllMocks() })` — NOT arrow expression `beforeEach(() => vi.clearAllMocks())` — the latter triggers TS2322 VitestUtils error

### Existing Orders Architecture (Epic 40-FE — already in place)

```
src/app/(dashboard)/orders/page.tsx              ← entry point — wire hook here
src/components/custom/orders/
  ├── OrdersTable.tsx                            ← MODIFY: add Клиент column conditionally
  ├── OrdersTableRow.tsx                         ← MODIFY: add Клиент cell conditionally
  └── OrderDetailsModal.tsx                      ← lazy-loaded, NOT touched
src/types/orders.ts                              ← OrderFbsItem.orderId is string (BigInt compat)
src/lib/api/orders.ts                            ← getOrders() — no changes
src/hooks/useOrders.ts                           ← useOrders() — no changes
```

The existing `OrdersTableRow` already has `tabIndex={0}`, `role="button"`, `aria-label`, and a click handler that opens the details modal. **Do not break that interaction pattern** — the new Клиент cell must use `e.stopPropagation()` on the phone link (similar to the existing `nmId` link at `OrdersTableRow.tsx:101`) so clicking the phone does not also open the modal.

### File Structure Requirements

| File | Action | Why |
|------|--------|-----|
| NEW `src/types/orders-client-info.ts` | Type definitions | Keeps types isolated from generic `orders.ts` |
| NEW `src/lib/api/orders/` (directory) | Create dir | First file in `lib/api/orders/` — confirm Next.js path alias picks it up |
| NEW `src/lib/api/orders/client-info-api.ts` | API function | Per epic file list spec (line 362) |
| NEW `src/lib/api/orders/__tests__/client-info-api.test.ts` | API unit tests | Mirrors `__tests__` pattern from `lib/api` |
| NEW `src/hooks/useClientInfo.ts` | Hook with chunking + role gate + gcTime:0 | Per epic file list spec |
| NEW `src/hooks/__tests__/useClientInfo.test.ts` | 10+ hook tests including AC #5 storage assertions | Privacy guardrail tests |
| NEW `src/components/custom/orders/__tests__/OrdersTable.client-column.test.tsx` | Component tests | New column rendering logic |
| MODIFY `src/components/custom/orders/OrdersTable.tsx` | Add column conditionally | Stay under 200 lines |
| MODIFY `src/components/custom/orders/OrdersTableRow.tsx` | Add cell conditionally | Stay under 200 lines |
| MODIFY `src/app/(dashboard)/orders/page.tsx` | Wire hook | Stay under 200 lines |

**Total NEW files: 6 · MODIFIED files: 3**

### Architecture Constraints (project-wide)

- File size: < 200 lines (ESLint enforced)
- TypeScript strict — no `any`, no `as` casts (use type guards or widen with optional fields)
- Path aliases: `@/components`, `@/hooks`, `@/lib`, `@/types`, `@/stores`
- Error test pattern: `mockRejectedValueOnce` (NOT `mockRejectedValue`) — pattern from CLAUDE.md
- Do NOT edit `src/components/ui/*` (shadcn) — use CLI to add components

### Testing Standards

- Unit tests via Vitest (`vitest.config.ts`)
- Hook tests use `renderHookWithClient` from `@/test/test-utils`
- Component tests use `render` from `@testing-library/react` wrapped in `QueryClientProvider`
- All test files live in nearest `__tests__/` subdirectory
- Coverage goal: 60%+ unit, 30%+ integration

### Performance / Accessibility

- WCAG 2.1 AA — phone link must be keyboard-accessible (it inherits anchor behavior, no extra work)
- Phone link `aria-label`: `Позвонить клиенту по номеру {phone}` for screen readers
- Russian formatting only — no transliteration
- Use `cn()` from `@/lib/utils` for conditional classes

## Project Structure Notes

- **New directory `src/lib/api/orders/`** — first file in this directory. Verify TypeScript path resolution (it should "just work" with the existing `tsconfig.json` `@/lib/*` alias) and that the import `from '@/lib/api/orders/client-info-api'` resolves before writing the hook.
- **No conflicts detected** — orders table is currently 8 columns wide; adding a 9th column at width `w-40` will fit on a 1280px viewport without horizontal scroll. Verify on 1024px; if it cramps, consider hiding this column on viewports < 1280px via Tailwind `hidden xl:table-cell`.
- The orders page currently does NOT pass user context to the table — Story 86.2 introduces the first role-gated column on this page.

## Previous Story Intelligence (Story 86.1 learnings)

**What worked well in 86.1 (do this again):**
- Keep the API function tiny (~22 lines) — pure validation + apiClient.get
- Hook returns the raw query object (`data`, `isLoading`, `isError`) — let the component handle rendering branches
- Use `URLSearchParams` for query strings even for one parameter (consistency)
- Module-level constants for color/style maps (no per-render allocation)
- `aria-hidden="true"` on decorative icons
- JSDoc on every public prop interface field
- Use the prop value (not echoed API value) for display when both exist — defends against backend bugs

**Mistakes from 86.1 that the dev agent must NOT repeat:**
1. **Story file left unupdated** — Story 86.1 was committed with the story file claiming `Status: ready-for-dev` and all `[ ]` tasks. Code review caught this as a HIGH finding. **Update the story file fully BEFORE marking sprint-status `done`.**
2. **Forgot to implement listed tasks** — Story 86.1 Task 5 (navigation from main table) was not implemented in the first round. The dev workflow's final review must enumerate every task and confirm corresponding code exists before marking complete.
3. **No tests for hooks/components** — initial commits had only API tests. Both hook tests AND component tests must exist BEFORE marking the story `review`.
4. **`beforeEach(() => vi.clearAllMocks())`** — TS2322 error on VitestUtils return type. Use block body: `beforeEach(() => { vi.clearAllMocks() })`.
5. **`enabled: !!nmId` was too loose** — `nmId === 0` is finite and non-null, fired wasted API call. For Story 86.2: `enabled: isOwner && cabinetId != null && orderIds.length > 0` (not `!!orderIds`).

### Git Intelligence (recent commits)

Recent dev workflow established this pattern (commits `936b9bb`, `2ae980a`, `e94bd5f`, `a21625c`, `57f6884`):
1. `feat(story-XX.X): <scope>` — initial implementation
2. `fix(story-XX.X): code review — <items>` — addressing review findings
3. Each story commit includes test files alongside source

Story 86.2 should follow the same convention.

## References

- [Source: _bmad-output/planning-artifacts/epics-80-83-fe.md#Story-862] — original ACs and file list (lines 329-364)
- [Source: _bmad-output/planning-artifacts/epics-80-83-fe.md#NFR3] — PII non-caching requirement (line 36)
- [Source: _bmad-output/implementation-artifacts/86-1-bid-recommendations-ui.md] — previous story patterns and review learnings
- [Source: src/types/auth.ts:9] — User role union type
- [Source: src/components/custom/Sidebar.tsx:29] — `user?.role === 'Owner'` precedent
- [Source: src/components/custom/orders/OrdersTable.tsx] — table to extend (8 cols → 9 cols)
- [Source: src/components/custom/orders/OrdersTableRow.tsx:101] — `e.stopPropagation()` precedent for in-row links
- [Source: src/hooks/useBidRecommendations.ts] — hook structure to mirror (validation + retry + staleTime)
- [Source: src/hooks/__tests__/useBidRecommendations.test.ts] — test patterns to mirror
- [Source: frontend/CLAUDE.md#Critical-Development-Rules] — file size, TS strict, error test pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- ESLint pre-commit hook caught 3 unused-import violations during incremental edits to `OrdersTableRow.tsx` and `orders/page.tsx`. Fixed each in the same edit pass by also adding the consuming code (props rendering / hook wiring). This is the expected workflow when ESLint blocks on unused-vars — combine declaration and usage in a single edit.
- jsdom emits a benign "Not implemented: navigation" warning when the click test fires on the `<a href="tel:...">` link. The test still passes because we only assert `onRowClick` was NOT called (proving `stopPropagation` worked).

### Completion Notes List

**Implementation summary:**
- Story 86.2 implements PII-aware client info display for FBS orders, gated to Owner role with comprehensive privacy guardrails per NFR3.
- 6 NEW files (types, API + test, hook + test, component test) and 3 MODIFIED files (table, row, page) — total 9 files.
- 43 new tests across 3 test files: 8 API, 24 hook (including 4 explicit privacy guardrail tests), 11 component.
- Zero regressions across 173 tests in the orders area.
- All 9 source files under 200-line limit (largest: `OrdersTableRow.tsx` at 192).

**Backend contract correction (vs story planning estimate):**
- Story file estimated POST endpoint with body. Backend actually uses **GET with comma-separated query string**: `GET /v1/cabinets/:id/orders/client-info?orderIds=123,456`.
- Response is a **bare array** of `ClientInfoItemDto`, not wrapped in `{ items: [...] }`. Implementation uses `apiClient.get(..., { skipDataUnwrap: true })`.
- `orderId` in backend response is a JSON `number`, but `OrderFbsItem.orderId` is `string` (BigInt safety). Map keys are stringified via `String(item.orderId)` to keep both representations consistent.
- Field names are `clientName` and `clientPhone` (not `name`/`phone` as I assumed in the story planning).
- Backend caps batches at 100 IDs and enforces Owner role server-side. Frontend chunking (Task 3.7) handles client-side splits when the orders page has more than 100 rows.

**Privacy guardrails (NFR3) — verification:**
- ✅ `gcTime: 0` set on the query (Hook line 78)
- ✅ `retry: false` set on the query (Hook line 79)
- ✅ Zero `console.*` calls in API module or hook (grep verified)
- ✅ Hook is `enabled: false` for non-Owner roles → no network call (4 separate role-gate tests in `useClientInfo.test.ts`)
- ✅ Test `does NOT log PII to console.info on success` — spies on `info`/`log`/`warn`, asserts no PII strings serialized
- ✅ Test `does NOT persist PII to localStorage after success` — exhaustive sweep of all keys/values
- ✅ Test `does NOT persist PII to sessionStorage after success` — exhaustive sweep
- ✅ Test `PII is not in storage after hook unmounts (gcTime: 0)` — calls `unmount()`, then re-sweeps both storages

**Defense-in-depth note (AC #2):**
The frontend role gate (`isOwner`) prevents the API call for non-Owners. The component test additionally verifies that even if a malicious caller passes `clientInfoMap` with `showClientColumn={false}`, the PII strings never reach the DOM. Combined with backend `@Roles(UserRole.Owner)` enforcement, this is three layers of defense.

**Pure helpers extracted for testability:**
- `chunkOrderIds(orderIds: string[]): string[][]` — exported, 4 tests
- `buildClientInfoMap(responses: ClientInfoResponse[]): ClientInfoMap` — exported, 4 tests

These are pure functions that can be tested in isolation without React/TanStack Query setup, following the project pattern (CLAUDE.md: "Pure functions over hook mocking").

### File List

**New files (6):**
- `src/types/orders-client-info.ts` — Type definitions
- `src/lib/api/orders/client-info-api.ts` — API function with `URLSearchParams` query builder, `skipDataUnwrap: true`
- `src/lib/api/orders/__tests__/client-info-api.test.ts` — 8 API unit tests
- `src/hooks/useClientInfo.ts` — Hook with role gate, chunking, `gcTime: 0`, exported pure helpers
- `src/hooks/__tests__/useClientInfo.test.ts` — 24 hook tests (12 query/role, 4 privacy guardrails, 8 pure helpers)
- `src/components/custom/orders/__tests__/OrdersTable.client-column.test.tsx` — 11 component tests

**Modified files (3):**
- `src/components/custom/orders/OrdersTable.tsx` — Added `clientInfoMap` + `showClientColumn` props, conditional `CLIENT_COLUMN` append (168 lines)
- `src/components/custom/orders/OrdersTableRow.tsx` — Added `clientInfo` + `showClientColumn` props, new `<ClientInfoCell>` sub-component with tel: link + stopPropagation (192 lines)
- `src/app/(dashboard)/orders/page.tsx` — Added `useClientInfo` wiring + role-gated `showClientColumn` (193 lines)

## Change Log

| Date       | Change                                                          |
|------------|-----------------------------------------------------------------|
| 2026-04-06 | Story file created via create-story workflow                    |
| 2026-04-07 | Implementation complete — 6 new files, 3 modified, 43 new tests, zero regressions |
| 2026-04-07 | Code review fixes — addressed 9 findings (1 High, 4 Medium, 4 Low). +5 tests, 48 total. Status → done. |
