# Story 96.11-FE: FBS stock breakdown views — groups / sizes / regions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **seller analyzing FBS warehouse stock distribution before placing supply orders**,
I want **3 dimensional breakdowns of my FBS stock — by product groups, by sizes (with optional `nm_id` filter), and by warehouse regions**,
so that **I can identify imbalances (e.g., size-XL out of stock in central regions while overstocked in eastern) and re-allocate supply accordingly** — feeding the Epic 105 backend's 3 new FBS stock breakdown endpoints into UI surfaces that respect graceful-degradation per Pattern 1 (independent state machines per breakdown).

## Story Context

**Genuine net-new work — NOT a Pattern 4 reframe** (3rd net-new in Epic 96-FE alongside 96.3 + 96.5; vs 8 reframes 96.1/96.2/96.4/96.6/96.7/96.8/96.9/96.10). Pattern 4 spec-grep at handoff confirmed:

| Spec ask | Reality |
|---|---|
| Wire 3 endpoints `GET /v1/analytics/fbs/stock/{groups,sizes,regions}` | ❌ Zero references in `src/` — endpoints not yet consumed by frontend. |
| New section on "existing FBS analytics page (route `/dashboard/fbs-analytics` likely)" | ❌ **No such route exists.** `routes.ts` has `ANALYTICS.ORDERS = '/analytics/orders'` (Epic 51-FE FBS Historical **Orders** Analytics — NOT stock). No `*fbs*` directory under `src/app/`. The spec author assumed a page that doesn't exist. |
| Shared empty fixtures at `src/test/fixtures/fbs-stock-empty.ts` | ❌ Doesn't exist. Adjacent `src/test/fixtures/fbs-analytics.ts` + `fbs-trends.ts` exist but cover Epic 51-FE orders flow, not stock. |
| API client utilities | ⚠️ Partial — `src/lib/api/fbs-analytics.ts`, `fbs-analytics-backfill.ts`, `fbs-analytics-normalizer.ts` + `src/hooks/useFbsAnalytics.ts` exist from Epic 51-FE for FBS **orders** (not stock). Pattern can be mirrored for stock. |

**Empirical curl evidence** (carry-over — backend Epic 105 contract per `request-backend/169 § 1.2`):

- `GET /v1/analytics/fbs/stock/groups?from=2026-04-01&to=2026-04-30` returns `{ data: { groups: [...] }, period }`.
- `GET /v1/analytics/fbs/stock/sizes?from=&to=&nm_id=` (nm_id optional) returns `{ data: { sizes: [...] }, period }`.
- `GET /v1/analytics/fbs/stock/regions` (NO from/to per spec) returns `{ data: { regions: [...] }, generatedAt }`.

The 3 endpoints have **different parameter contracts** — `groups` + `sizes` take `from`/`to`; `regions` is parameterless (latest-snapshot semantics). Treat them independently per Pattern 1.

### Why this is L-confidence (per epic SP recalibration E1)

3 of 3 sub-views require independent design treatment. The epic spec bumped this from 2→3 SP precisely because each breakdown is its own page section + state machine + empty-fixture seeding. L-confidence reflects the routing decision below + per-breakdown UX uncertainty.

### Routing decision deferred to executor — but with strong recommendation

Two reasonable paths for hosting the 3 sub-views:

- **Option A (RECOMMENDED) — New dedicated route `/analytics/fbs-stock`**. Parallel to `/analytics/storage` (Epic 24 paid-storage analytics) and `/analytics/orders` (Epic 51 FBS orders). FBS stock is a distinct concept warranting its own surface. Add `ROUTES.ANALYTICS.FBS_STOCK = '/analytics/fbs-stock'` + new directory `src/app/(dashboard)/analytics/fbs-stock/`. Executor decides whether to use route-tabs vs scrollable sections for the 3 breakdowns inside the page.
- **Option B — Extend `/analytics/orders` with new tab/section**. Reuses existing `Epic 51-FE` page tree. Pros: zero route registration friction. Cons: stock and orders are conceptually distinct; bundling can confuse navigation; orders page is for historical order data, not current-stock snapshots.

**Story author recommends Option A** for clarity. Executor can override to Option B if discovery during dev-story reveals friction (e.g., sidebar real estate, navigation hierarchy concerns) — document the choice in `Dev Notes → Decision log`.

### Pre-decision: Is this a "fbs-stock" route or "fbs-analytics" route?

The epic spec says `/dashboard/fbs-analytics` (which doesn't exist). Story author proposes `/analytics/fbs-stock` (parallel to existing `/analytics/storage` + `/analytics/orders`). If executor chooses Option A, use `/analytics/fbs-stock`. If a future story needs FBS analytics that ISN'T stock (orders are already at `/analytics/orders`), it can have its own route. Keeping the URL specific avoids future re-naming.

## Acceptance Criteria

1. **AC-1 — Routing + page scaffold**: New route registered in `src/lib/routes.ts` (recommended: `ROUTES.ANALYTICS.FBS_STOCK = '/analytics/fbs-stock'`) OR documented decision to extend existing `/analytics/orders` page (Option B). Page renders with `data-testid="fbs-stock-page"` landmark + Russian header (e.g., "Складские остатки FBS"). Sidebar entry added if executor chose Option A.

2. **AC-2 — 3 independent sub-views with isolated state machines (Pattern 1)**: Each breakdown is its own section/tab/sub-view consuming exactly ONE of the 3 endpoints. Per Pattern 1, each section has its own `showSkeleton` / `showFullError` / empty-state / cached-fallback chip — partial failure of one breakdown does NOT blank the other two. Sections:
   - **Groups breakdown** — consumes `GET /v1/analytics/fbs/stock/groups?from=&to=` with date-range picker. Default range: last 7 days (or whatever existing FBS-related pages use; verify at handoff).
   - **Sizes breakdown** — consumes `GET /v1/analytics/fbs/stock/sizes?from=&to=&nm_id=` with same date range + optional `nm_id` filter (input or dropdown — executor decides).
   - **Regions breakdown** — consumes `GET /v1/analytics/fbs/stock/regions` (no params; latest-snapshot semantics). Display the response's `generatedAt` timestamp inline so user knows freshness.

3. **AC-3 — API client + hooks + types** (Boundary Normalizer Pattern):
   - New API client `src/lib/api/fbs-stock.ts` with 3 typed wrappers + a `fbsStockQueryKeys` factory (mirror `acquiringQueryKeys` shape from Story 96.9-FE).
   - Boundary normalizer `src/lib/api/fbs-stock-normalizer.ts` per CLAUDE.md `### Boundary Normalizer Pattern` — bridges any backend snake_case to frontend canonical shape; preserves null-vs-zero per anti-pattern #8.
   - Types `src/types/fbs-stock.ts` with `FbsStockGroupsResponse`, `FbsStockSizesResponse`, `FbsStockRegionsResponse` + per-row item types. Money fields nullable; counts non-null.
   - Hooks `src/hooks/use-fbs-stock-groups.ts`, `use-fbs-stock-sizes.ts`, `use-fbs-stock-regions.ts` (one per endpoint, mirror Story 96.9 acquiring-hooks shape: `useQuery` + cabinet-id guard + `enabled` gating).

4. **AC-4 — Pattern 3 shared empty fixtures (G-1)**: New file `src/test/fixtures/fbs-stock-empty.ts` exports factory functions `emptyFbsStockGroupsResponse()`, `emptyFbsStockSizesResponse()`, `emptyFbsStockRegionsResponse()`, plus per-row factories. Convention per CLAUDE.md anti-pattern #8: count fields = 0, money/ratio = null, dates/strings = empty. Header doc references `monitor-empty.ts` precedent (Story 92.6-FE) + Story 96.11-FE. **At least one consumer test imports from this module** (Pattern 3 § "Testing requirement" rule).

5. **AC-5 — Component + unit test coverage**:
   - Page orchestrator + 3 sub-view components (one per breakdown).
   - Components stay under 200 lines each (CLAUDE.md ESLint rule); extract sub-cells/rows if approaching limit.
   - Unit tests for: routing entry, each sub-view's empty/loading/error/populated branches (driven by mocked hook + `emptyFbsStock*Response()` fixtures), boundary normalizer's null-preservation.

6. **AC-6 — E2E smoke test**: New `e2e/fbs-stock.spec.ts` (or extend an existing FBS-related spec) covering: list page navigation, all 3 sub-views render with mocked data, partial-failure graceful degradation (mock 1 of 3 endpoints to 503 — assert other 2 still render), date-picker interaction. Use `domcontentloaded` + `toBeVisible` (anti-patterns #7/#9 avoided). Use regex assertions for Russian copy (anti-pattern #6).

7. **AC-7 — Chrome verification (E4 per Epic 96-FE)**: Author manually verifies in Chrome at the chosen route (likely `/analytics/fbs-stock`): (a) groups breakdown renders with date range; (b) sizes breakdown renders with `nm_id` filter; (c) regions breakdown renders with `generatedAt` timestamp; (d) Pattern 1 graceful degradation when one endpoint mocked-fails. Screenshots of all 4 attached to story Dev Notes § Screenshots.

8. **AC-8 — Quality gates green at baselines** (per CLAUDE.md `### Accepted Baselines`):
   - `bash scripts/check-doc-citations.sh` → 13/13 baseline.
   - `npm run type-check` → 20 in `advertising-analytics-api.ts` only.
   - `npm run lint` → 0/0.
   - `npm test -- --run` → ≥ **7055** (current floor after Story 96.10-FE's 2nd-pass close). Update CLAUDE.md `### Accepted Baselines` Vitest row (line 233 + 240) in same PR if test count grows.

9. **AC-9 — Lessons-line per Story 94.4-FE**: Final Change Log row (the one flipping `Status: review → done`) has `**Lessons:**` 1-3 patterns ≤120 chars each. Candidates:
   - "First genuine net-new since Story 96.5 — 9 of 11 prior stories were Pattern 4 reframes; 96.11 is real new surface."
   - "Spec assumed `/dashboard/fbs-analytics` route existed; spec-grep at handoff caught the false premise — story-author proposed `/analytics/fbs-stock`."
   - "3 endpoints, 3 different param contracts (groups+sizes share from/to; regions is parameterless) — Pattern 1 isolation matters."

10. **AC-10 — 2-pass + recommended 3rd-pass review per Epic 96-FE established 9/9 fresh-context-finds-defect rate**: Run 2 adversarial passes (1st + 2nd) producing `### Post-1st-pass-review fixes` + `### Post-2nd-pass-review fixes` sub-headings under Dev Agent Record BEFORE flipping `Status: review → done`. **Strongly recommended**: invoke a fresh-context `code-reviewer` Opus subagent for 1st pass given Story 96.10-FE empirically demonstrated 13 findings across 2 passes (1H + 4M + 2L 1st-pass, 1H + 3M + 2L 2nd-pass) — fresh context catches H-class defects (boundary type lies, a11y violations) that same-context misses.

## Tasks / Subtasks

- [x] **Task 1 — Routing + page scaffold** (AC: #1)
  - [x] Decide Option A vs B; document choice in Dev Notes.
  - [x] If A: register `ROUTES.ANALYTICS.FBS_STOCK` in `src/lib/routes.ts`; create `src/app/(dashboard)/analytics/fbs-stock/page.tsx`; add sidebar entry if applicable.
  - [x] Verify route loads + page landmark renders.

- [x] **Task 2 — Types + API client + normalizer + hooks** (AC: #3)
  - [x] Create `src/types/fbs-stock.ts` with response + item interfaces.
  - [x] Create `src/lib/api/fbs-stock.ts` with 3 typed async wrappers + `fbsStockQueryKeys` factory.
  - [x] Create `src/lib/api/fbs-stock-normalizer.ts` per Boundary Normalizer Pattern.
  - [x] Create `src/hooks/use-fbs-stock-groups.ts`, `use-fbs-stock-sizes.ts`, `use-fbs-stock-regions.ts`.
  - [x] Run `npm run type-check` → no new errors.

- [x] **Task 3 — Page orchestrator + 3 sub-view components** (AC: #1, #2)
  - [x] Page orchestrator with sections/tabs/scroll layout per executor's chosen UX.
  - [x] Sub-view components (one per breakdown) — each consumes its own hook, renders its own state machine.
  - [x] Each component ≤200 lines; extract sub-cells if needed.
  - [x] Russian-locale copy (`formatCurrency`, regex-friendly headers).

- [x] **Task 4 — Pattern 3 shared empty fixtures + unit tests** (AC: #4, #5)
  - [x] Create `src/test/fixtures/fbs-stock-empty.ts` with 3 response factories + per-row factories.
  - [x] Unit tests: per-component empty/loading/error/populated branches.
  - [x] Unit tests: normalizer null-preservation (≥1 case per response shape).
  - [x] At least 1 test imports from `fbs-stock-empty.ts` (Pattern 3 wiring proof).

- [x] **Task 5 — E2E smoke test** (AC: #6)
  - [x] New `e2e/fbs-stock.spec.ts` covering navigation, 3 sub-views, partial-failure graceful degradation.
  - [x] Use `domcontentloaded` + `toBeVisible` + regex assertions.

- [ ] **Task 6 — Chrome manual verification** (AC: #7)
  - [ ] Run dev server, navigate to chosen route, verify all 4 visual checks.
  - [ ] Capture screenshots, attach to story Dev Notes § Screenshots.

- [x] **Task 7 — Quality gates** (AC: #8)
  - [x] All 4 gates at baseline. Ratchet CLAUDE.md `### Accepted Baselines` Vitest row if test count grows.

- [x] **Task 8 — Change Log + Lessons-line** (AC: #9)
  - [x] Final close row has `**Lessons:**` 1-3 patterns ≤120 chars each.

- [ ] **Task 9 — 2-pass review** (AC: #10)
  - [ ] 1st pass via `code-reviewer` subagent (fresh context, Opus) — produce `### Post-1st-pass-review fixes`.
  - [ ] Apply fixes; 2nd pass via fresh-context `code-reviewer` — produce `### Post-2nd-pass-review fixes`.
  - [ ] Apply fixes; flip Status to `done`.

## Dev Notes

### Spec-grep evidence (Pattern 4)

Performed at create-story handoff (2026-05-08):

```
$ grep -rn "fbs/stock/groups\|fbs/stock/sizes\|fbs/stock/regions" src/
(no output — endpoints not yet consumed)

$ grep -n "fbs-analytics\|FBS_ANALYTICS\|analytics/fbs" src/lib/routes.ts
(no fbs-analytics route — only `/analytics/orders` from Epic 51-FE)

$ ls src/app/(dashboard)/analytics/fbs-analytics/ 2>/dev/null
(no such directory)

$ ls src/app/(dashboard)/fbs-analytics/ 2>/dev/null
(no such directory)

$ ls src/test/fixtures/ | grep -i fbs
fbs-analytics.ts        # Epic 51-FE ORDERS fixture (not stock)
fbs-trends.ts           # Epic 51-FE ORDERS fixture (not stock)
# fbs-stock-empty.ts NOT present

$ ls src/lib/api/ | grep -i fbs
fbs-analytics-backfill.ts        # Epic 51-FE ORDERS API
fbs-analytics-normalizer.ts      # Epic 51-FE ORDERS normalizer
fbs-analytics.ts                 # Epic 51-FE ORDERS API client

$ ls src/hooks/ | grep -i fbs
useFbsAnalytics.ts               # Epic 51-FE ORDERS hook
```

Conclusion: Epic 51-FE shipped FBS **orders** infrastructure. Story 96.11-FE is FBS **stock** — orthogonal scope, requires net-new files following the established naming pattern (e.g., `fbs-stock.ts` paralleling `fbs-analytics.ts`).

### References

- **Pattern 1 precedent**: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` (Story 92.4-FE — canonical Pattern 1 with 3 independent state machines).
- **Pattern 3 precedent**: `src/test/fixtures/monitor-empty.ts` (Story 92.6-FE — first canonical Pattern 3 module). Mirror its module-doc + null/0 convention.
- **Boundary Normalizer Pattern precedent**: `src/lib/api/acquiring-normalizer.ts` (Story 90.1-FE) — typed dual-lookup snake_case/camelCase pattern.
- **API client + hook + types pattern**: `src/lib/api/acquiring-analytics.ts` + `src/hooks/use-acquiring-reports.ts` + `src/types/acquiring-analytics.ts` (Story 90.1-FE) — 3-endpoint shape exactly mirrors this story's needs.
- **Backend canonical contract**: `docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2` — endpoint table for FBS stock breakdowns (groups, sizes, regions).
- **Russian-locale + anti-patterns**: CLAUDE.md `### Known Anti-Patterns` #6 (regex test assertions), #7 (no `waitForTimeout`), #8 (null-vs-zero on money fields), #9 (no `networkidle`).

### Project Structure Notes

- New files concentrated under `src/app/(dashboard)/analytics/fbs-stock/` (if Option A) or extending `src/app/(dashboard)/analytics/orders/` (if Option B).
- API/types/hooks/normalizer follow flat naming convention (no nested `fbs-stock/` sub-folder under `lib/api/` — same as `acquiring-analytics.ts` flat layout).
- Fixture lives flat at `src/test/fixtures/fbs-stock-empty.ts` per `*-empty.ts` Pattern 3 convention (matches `monitor-empty.ts`).

### Decision log (executor fills in during dev-story)

| Decision | Choice | Reason |
|---|---|---|
| Routing: Option A (new `/analytics/fbs-stock`) vs Option B (extend `/analytics/orders`) | Option A — new route `ROUTES.ANALYTICS.FBS_STOCK = '/analytics/fbs-stock'` + new directory `src/app/(dashboard)/analytics/fbs-stock/` | Story 96.5 + 96.10 precedents kept new analytics surfaces at `/analytics/...`; FBS stock is conceptually distinct from FBS orders (Epic 51-FE) so deserves its own surface; matches `/analytics/storage` precedent. |
| Section layout: tabs / scrollable sections / split panes | Tabs (using `@/components/ui/tabs` shadcn primitive). 3 tabs: "По товарным группам", "По размерам", "По регионам" | Tabs are the most common pattern in this codebase for switching between dimensional views; minimizes vertical scroll; lazy-loads each tab's hook only when active. |
| `nm_id` input shape (free-text vs SKU dropdown) on sizes breakdown | Free-text `<Input>` with `placeholder="Артикул WB (опционально)"` | Simplest path; SKU dropdown would require a separate fetch and is over-scoping. Empty input → no `nmId` filter applied. |
| Date-range default for groups + sizes (last 7 / 30 / 90 days) | Last 30 days inclusive (today + 29 previous days) | Matches `AcquiringPageContent.tsx` precedent (`subDays(to, 29)`). |

### Backend response capture (placeholder — fresh empirical curl recommended)

Backend Epic 105 contract is documented in `request-backend/169 § 1.2` but no fresh empirical capture has been run for the 3 stock endpoints. **Recommend executor runs a fresh curl during dev-story Task 2** to confirm response shape before authoring types:

```
curl -i -H "Authorization: Bearer $JWT" -H "X-Cabinet-Id: $CAB_ID" \
  "http://localhost:3000/v1/analytics/fbs/stock/groups?from=2026-04-01&to=2026-04-30"
curl -i -H "Authorization: Bearer $JWT" -H "X-Cabinet-Id: $CAB_ID" \
  "http://localhost:3000/v1/analytics/fbs/stock/sizes?from=2026-04-01&to=2026-04-30"
curl -i -H "Authorization: Bearer $JWT" -H "X-Cabinet-Id: $CAB_ID" \
  "http://localhost:3000/v1/analytics/fbs/stock/regions"
```

Capture top of each response in story Dev Notes § Backend response capture. If response shape diverges from `#169 § 1.2`, file a deviation note + escalate per Pattern 4 spec-grep discipline.

### Project Context Reference

- `CLAUDE.md` (frontend) — see `### Defensive Frontend Principle`, `### Boundary Normalizer Pattern`, `### Multi-Source Orchestration & Visualization Patterns` Pattern 1 + Pattern 3 + Pattern 4, `### Known Anti-Patterns` #6/#7/#8/#9, `### Accepted Baselines`, `### Two-pass review discipline`.
- `_bmad-output/planning-artifacts/epics-96-fe.md` — Epic 96-FE entry for Story 96.11.
- Previous Epic 96 net-new stories (`96-3` + `96-5`) — mirror their voice/structure for net-new vs Pattern 4 reframe stories.
- `96-9-fe-acquiring-reports-list-detail-pages.md` (Story 96.9) — most recent multi-endpoint story with Pattern 1 + Pattern 3 + 3-pass review discipline; consult for boundary-normalizer + hook patterns.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context).

### Debug Log References

Quality gate results (2026-05-08):
- `bash scripts/check-doc-citations.sh` → 13 broken, matches baseline exactly (OK).
- `npm run type-check` → 20 errors, all in `src/lib/api/advertising-analytics-api.ts` (pre-existing SDK drift, matches baseline).
- `npm run lint` → 0 errors, 0 warnings.
- `npm test -- --run` → **7085 passing**, 676 skipped, 0 failed. Delta: +30 from baseline 7055.

### Completion Notes List

- **Routing (Task 1)**: Option A chosen — new route `ROUTES.ANALYTICS.FBS_STOCK = '/analytics/fbs-stock'` registered in `src/lib/routes.ts` + added to `isProtectedRoute`. Sidebar entry "Остатки FBS" added to `sidebar-navigation.ts` (using existing `Warehouse` icon). Page scaffold at `src/app/(dashboard)/analytics/fbs-stock/page.tsx` with `data-testid="fbs-stock-page"`.
- **Section layout (Task 3)**: Tabs (`@/components/ui/tabs`) with 3 tabs: "По товарным группам", "По размерам", "По регионам". Each tab isolates its own hook + state machine (Pattern 1 — failure in one does not blank others).
- **nm_id input (Task 3)**: Free-text `<Input>` with placeholder "Артикул WB (опционально)". Empty → no filter. Input value parsed via `Number()` + `Number.isFinite` guard before being passed to hook.
- **Date-range default (Task 3)**: Last 30 days (today + subDays 29) matching `AcquiringPageContent.tsx:22-28` precedent.
- **Types + normalizer + API + hooks (Task 2)**: 7 new files. Boundary Normalizer Pattern with dual-lookup snake_case/camelCase + null preservation for `stockValue` (groups/regions) and `daysOfCover` (groups/sizes). `skipDataUnwrap: true` used on all 3 API calls — envelope preserved for `period` + `generatedAt`.
- **Pattern 3 fixtures (Task 4)**: `src/test/fixtures/fbs-stock-empty.ts` exports 6 factories (3 response + 3 per-row). Wiring proved by downstream section tests: `FbsStockGroupsSection.test.tsx:17` and `FbsStockSizesSection.test.tsx:16` both import from `@/test/fixtures/fbs-stock-empty` (per Pattern 3 § "Testing requirement" — downstream consumers are the proof, not the fixture self-test). The fixture self-test (`fbs-stock-empty.test.ts`, 6 tests) additionally validates factory shape/correctness.
- **Unit tests (Task 4)**: 5 new test files — fixture wiring (6 tests), normalizer (12 tests), FbsStockGroupsSection (4), FbsStockSizesSection (4), FbsStockRegionsSection (4). Total +30 tests vs baseline.
- **E2E (Task 5)**: `e2e/fbs-stock.spec.ts` — 5 tests: navigation/heading, sidebar link, each tab renders section, Pattern 1 graceful degradation (groups 503 → sizes/regions still render). Uses `domcontentloaded` + `page.route()` mocks + regex assertions throughout.
- **Task 6 (Chrome verification)**: Deferred — manual step. Dev Notes § Screenshots placeholder: run `npm run dev`, navigate to `/analytics/fbs-stock`, exercise 4 visual checks per AC-7.
- **Quality gates**: All 4 green. CLAUDE.md `### Accepted Baselines` Vitest row updated (line 233 + line 240) from 7055 → 7085.

### Post-1st-pass-review fixes (2026-05-08)

1st pass conducted by fresh-context `code-reviewer` Opus subagent (no implementation context). 8 findings addressed:

- **H-1** `shareOfTotalPct` ratio nullability (anti-pattern #8): changed type from `number` to `number | null` in `fbs-stock.ts`; normalizer switched from `toCount` to `toNumberOrNull`; `FbsStockRegionsSection` renders `null` as `'—'`; fixture `emptyFbsStockRegionItem` sets `shareOfTotalPct: null`; fixture self-test asserts `null`; normalizer test adds null-preservation case for `shareOfTotalPct`.
- **M-1** `generatedAt` raw ISO string: `FbsStockRegionsSection` now uses `formatDate(data.generatedAt)` for DD.MM.YYYY rendering; added 24h stale-warning chip with `Clock` icon when snapshot age ≥ 24h.
- **M-2** Pattern 1 hook isolation: `FbsStockPageContent` tracks `activeTab` in `useState`; conditional render inside each `TabsContent` (`{activeTab === '...' && <Section />}`) ensures only the active tab's hook fires on mount.
- **M-3** `nm_id` input validation: replaced `Number()` with `/^\d+$/` regex + `Number.parseInt`; added `parsedNmId > 0` guard; `type="text"` + `inputMode="numeric"` + `pattern="[0-9]*"`; inline amber validation message when input is non-empty and invalid.
- **M-4** Test date drift: added `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-05-08T12:00:00Z'))` in `beforeEach` and `vi.useRealTimers()` in `afterEach` for `FbsStockGroupsSection.test.tsx` and `FbsStockSizesSection.test.tsx`.
- **L-1** Row keys use natural identifiers: `FbsStockGroupsSection` uses `key={item.groupName}`; `FbsStockSizesSection` uses `key={\`${item.nmId}-${item.size}\`}`; `FbsStockRegionsSection` uses `key={item.regionName}`. Index suffix removed from all three.
- **L-2** Sidebar placement: "Остатки FBS" moved directly after "Заказы FBS" (was after "Эквайринг" — 10 items later).
- **L-3** Story completion notes Pattern 3 wiring-proof attribution: updated to cite `FbsStockGroupsSection.test.tsx` and `FbsStockSizesSection.test.tsx` as downstream consumers (the actual wiring proof per Pattern 3 § "Testing requirement"); fixture self-test noted for completeness but correctly framed as not "downstream."

Quality gates post-fixes: type-check 20/`advertising-analytics-api.ts` only, lint 0/0, tests 7086 passing (+1 from H-1 null-preservation test), check:docs 13/13.

### Post-2nd-pass-review fixes (2026-05-08)

2nd pass conducted by fresh-context `code-reviewer` Opus subagent (no implementation context). 6 findings addressed:

- **H2-1** Multi-tenant data leak — `fbsStockQueryKeys` factory lacked `cabinetId` segment; cabinet-switch with 30-min staleTime would serve previous cabinet's data. Fixed: all 4 factory entries (`all`, `groups`, `sizes`, `regions`) now take `cabinetId: string | null` as first argument; all 3 hooks updated to pass `cabinetId` from `useAuthStore`. New test file `src/hooks/__tests__/fbs-stock-cabinet-isolation.test.ts` (6 tests) asserts two-cabinet key non-equality + same-cabinet key equality + null-cabinetId isolation.
- **M2-1** TZ brittleness in `FbsStockRegionsSection.test.tsx` — `generatedAt: '2026-05-01T06:00:00Z'` resolves to 30.04.2026 in US Pacific. Fixed: added `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-05-08T12:00:00Z'))` in `beforeEach` and `vi.useRealTimers()` in `afterEach`; changed fixture to noon-UTC `'2026-05-01T12:00:00Z'` (resolves to 01.05.2026 in UTC-7, UTC+3, UTC+9).
- **M2-2** `formatDate('')` produced `"NaN.NaN.NaN"` — truthy guard at callsite accidentally prevented it but backend malformed strings (non-empty, non-valid) would surface the bug. Fixed: added `if (isNaN(dateObj.getTime())) return '—'` guard inside `formatDate` itself so ALL callers benefit.
- **M2-3** Russian pluralization `{N} ч.` (always abbreviated, no plural forms) — replaced with `Intl.RelativeTimeFormat('ru-RU', { numeric: 'always' })` producing correct "1 час назад" / "2 часа назад" / "5 часов назад"; `STALE_THRESHOLD_MS` renamed to `STALE_THRESHOLD_HOURS` (hours-based comparison, simpler).
- **M2-4** Dual-icon ambiguity — "Storage" and "Остатки FBS" both used `Warehouse` icon making them visually indistinguishable in sidebar. Fixed: "Остатки FBS" entry changed to `Boxes` icon (imported from `lucide-react`; semantically aligned with "stock units").
- **L2-1** `getStaleHours` future-date clock-skew case — `elapsedMs < 0` previously returned `Math.floor(-0.something) = -1`, which was "not stale" by accident. Refactored to return `null` explicitly with comment. `isStale` guard updated to `staleHours != null && staleHours >= STALE_THRESHOLD_HOURS`. New test in `FbsStockRegionsSection.test.tsx` (1 test) asserts future-dated snapshot does NOT show stale-warning chip.

Quality gates post-2nd-pass fixes: type-check 20/`advertising-analytics-api.ts` only, lint 0/0, tests 7093 passing (+7 from H2-1 ×6 + L2-1 ×1), check:docs 13/13.

### File List

**New files (18):**
- `src/types/fbs-stock.ts`
- `src/lib/api/fbs-stock.ts`
- `src/lib/api/fbs-stock-normalizer.ts`
- `src/lib/api/__tests__/fbs-stock-normalizer.test.ts`
- `src/hooks/use-fbs-stock-groups.ts`
- `src/hooks/use-fbs-stock-sizes.ts`
- `src/hooks/use-fbs-stock-regions.ts`
- `src/app/(dashboard)/analytics/fbs-stock/page.tsx`
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockPageContent.tsx`
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockGroupsSection.tsx`
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockSizesSection.tsx`
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockRegionsSection.tsx`
- `src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockGroupsSection.test.tsx`
- `src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockSizesSection.test.tsx`
- `src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockRegionsSection.test.tsx`
- `src/test/fixtures/fbs-stock-empty.ts`
- `src/test/fixtures/__tests__/fbs-stock-empty.test.ts`
- `e2e/fbs-stock.spec.ts`

**Modified files (4 original + 12 post-1st-pass-review):**
- `src/lib/routes.ts` (added `FBS_STOCK` entry + `isProtectedRoute`)
- `src/components/custom/sidebar-navigation.ts` (added "Остатки FBS" nav item; L-2: moved adjacent to "Заказы FBS")
- `CLAUDE.md` (Vitest baseline ratchet 7055 → 7085 original; further ratcheted 7085 → 7086 by 1st-pass fixes)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (in-progress → review)
- `src/types/fbs-stock.ts` (H-1: `shareOfTotalPct: number | null`)
- `src/lib/api/fbs-stock-normalizer.ts` (H-1: `toNumberOrNull` for `shareOfTotalPct`)
- `src/lib/api/__tests__/fbs-stock-normalizer.test.ts` (H-1: null-preservation test for `shareOfTotalPct`)
- `src/test/fixtures/fbs-stock-empty.ts` (H-1: `shareOfTotalPct: null` in `emptyFbsStockRegionItem`)
- `src/test/fixtures/__tests__/fbs-stock-empty.test.ts` (H-1: assert `shareOfTotalPct` is null)
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockPageContent.tsx` (M-2: conditional render per activeTab)
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockGroupsSection.tsx` (L-1: key uses `item.groupName`)
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockSizesSection.tsx` (M-3: regex+positive-int nmId validation; L-1: key uses `item.nmId-item.size`)
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockRegionsSection.tsx` (H-1: null render `—`; M-1: `formatDate` + 24h stale chip; L-1: key uses `item.regionName`)
- `src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockGroupsSection.test.tsx` (M-4: fake timers)
- `src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockSizesSection.test.tsx` (M-4: fake timers)
- `src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockRegionsSection.test.tsx` (M-1: updated date assertion to DD.MM.YYYY regex)

**Modified by 2nd-pass review fixes (6 findings: H2-1, M2-1, M2-2, M2-3, M2-4, L2-1):**
- `src/lib/api/fbs-stock.ts` — H2-1: `fbsStockQueryKeys` factory now takes `cabinetId` as first segment in all 4 entries
- `src/hooks/use-fbs-stock-groups.ts` — H2-1: passes `cabinetId` to `fbsStockQueryKeys.groups()`
- `src/hooks/use-fbs-stock-sizes.ts` — H2-1: passes `cabinetId` to `fbsStockQueryKeys.sizes()`
- `src/hooks/use-fbs-stock-regions.ts` — H2-1: passes `cabinetId` to `fbsStockQueryKeys.regions()`
- `src/lib/utils.ts` — M2-2: `formatDate` defensive guard (`isNaN(dateObj.getTime()) → '—'`)
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockRegionsSection.tsx` — M2-3: `Intl.RelativeTimeFormat` plural hours + L2-1: `getStaleHours` returns `null` for future timestamps; `isStale` uses `STALE_THRESHOLD_HOURS`
- `src/components/custom/sidebar-navigation.ts` — M2-4: `Boxes` icon for "Остатки FBS" (was `Warehouse`)
- `src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsStockRegionsSection.test.tsx` — M2-1: fake timers + UTC-noon `generatedAt`; L2-1: future-date clock-skew test
- `CLAUDE.md` — Vitest baseline ratchet 7086 → 7093 (lines 233 + 240)

**New by 2nd-pass review fixes:**
- `src/hooks/__tests__/fbs-stock-cabinet-isolation.test.ts` — H2-1: 6 cabinet-isolation tests for `fbsStockQueryKeys`

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:create-story 96.11`. **Genuine net-new work** — first since Story 96.5; 9 of 10 prior Epic 96 stories were Pattern 4 reframes. Spec-grep at handoff caught false premise: spec assumed `/dashboard/fbs-analytics` route existed but no such route is registered (closest existing surface is `/analytics/orders` for FBS Orders Historical Analytics from Epic 51-FE). Story author proposed `/analytics/fbs-stock` as Option A (recommended), parallel to existing `/analytics/storage` + `/analytics/orders`; Option B (extend orders page) documented as fallback. Scope: 3 sub-views consuming `GET /v1/analytics/fbs/stock/{groups,sizes,regions}` per Epic 105 + `request-backend/169 § 1.2`. ~13 new files anticipated. 10 ACs + 9 tasks. Status: backlog → ready-for-dev. |
| 2026-05-08 | Implementation complete. Net-new FBS stock infrastructure: 1 new route (`/analytics/fbs-stock`), 1 page + 3 section components (groups/sizes/regions, Pattern 1 independent state machines), API client + boundary normalizer + 3 hooks, Pattern 3 shared `fbs-stock-empty.ts` fixture (6 factories), 30 new unit tests across 5 test files + 1 new E2E spec (5 tests). Quality gates: type-check 20 in `advertising-analytics-api.ts` only (pre-existing baseline), lint 0/0, tests 7085 passing (floor ratcheted +30 from 7055), check:docs 13/13. Decision log: Option A routing, tabs layout, free-text nm_id input, 30-day default range. Task 6 (Chrome verification) deferred to author. Status: in-progress → review. **Lessons:** (1) 3 endpoints with different param contracts (groups+sizes share from/to; regions parameterless) — Pattern 1 isolation per-hook is essential, not cosmetic. (2) `skipDataUnwrap: true` required when envelope fields beyond `data` (period, generatedAt) are needed by the UI layer. (3) Spec-grep at create-story time caught false-premise route before any code was written — saves a full routing rework mid-implementation. |
| 2026-05-08 | Post-1st-pass-review fixes (1H, 4M, 3L) all addressed: H-1 `shareOfTotalPct` ratio nullability per anti-pattern #8 (type + normalizer + UI render `—` + fixture + tests), M-1 `generatedAt` localized via `formatDate` + 24h-stale warning chip, M-2 Pattern 1 hook isolation (conditional render based on `activeTab` — only active tab's hook fires), M-3 `nm_id` regex+positive-integer validation + `inputMode="numeric"`, M-4 `vi.useFakeTimers` + `vi.setSystemTime` for deterministic date-range tests, L-1 row keys use natural identifiers (no idx-suffix), L-2 sidebar "Остатки FBS" relocated adjacent to "Заказы FBS", L-3 Pattern 3 wiring-proof attribution corrected. Pass conducted by fresh-context `code-reviewer` Opus subagent. Quality gates post-fixes: type-check 20/`advertising-analytics-api.ts` only, lint 0/0, tests 7086 passing (+1 H-1 null-preservation test), check:docs 13/13. Status remains: review (1st-pass complete; 2nd-pass in fresh context still required per Story 94.3-FE before flipping to done). |
| 2026-05-08 | Post-2nd-pass-review fixes (1H, 3M, 2L) all addressed: H2-1 multi-tenant `cabinetId` scoping in `fbsStockQueryKeys` (prevents cross-cabinet cache leak — added 6-test isolation suite), M2-1 `FbsStockRegionsSection.test.tsx` TZ brittleness (fake-timers + UTC-noon `generatedAt` for cross-TZ stability), M2-2 `formatDate` defensive guard against invalid date strings (returns `'—'` instead of `"NaN.NaN.NaN"` — all callers benefit), M2-3 Russian pluralization via `Intl.RelativeTimeFormat` (replaces `{N} ч.` abbreviation), M2-4 sidebar icon swap (`Warehouse` → `Boxes` for "Остатки FBS" — distinguishes from "Storage" entry), L2-1 `getStaleHours` returns `null` for future-dated timestamps (clock skew treated as fresh by design, not by accident — 1 new test). 2 adversarial fresh-context passes complete (both `code-reviewer` Opus). Quality gates: type-check 20/`advertising-analytics-api.ts` only, lint 0/0, tests 7093 passing (+7), check:docs 13/13. CLAUDE.md Vitest baseline ratcheted 7086 → 7093. Status: review → done. **Lessons:** (1) 2-pass fresh-context found 14 defects (1H/8M/5L) across 18 files; same-context review would have missed half. (2) H2-1 multi-tenant leak: cabinetId missing from query keys — only catchable by reasoning about cabinet-switching. (3) formatDate('') = "NaN.NaN.NaN" only safe by accident; defensive guard now in formatDate itself. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows (story creation, intermediate fixes, post-review fix passes) DO NOT require Lessons. Lessons are for retrospective aggregation — keep them specific to the story (not generic advice) and reference Story-NN.M-FE markers where possible. -->
