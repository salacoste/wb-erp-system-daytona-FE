# Story 117.3: Search Seller Profile Card

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Wildberries seller viewing the Search Analytics page,
I want to see my seller name / trademark in the page header,
so that I can confirm at a glance which cabinet's search data I'm looking at (personalization + multi-cabinet disambiguation).

## Acceptance Criteria

1. The Search Analytics page (`/analytics/search`) header displays the seller's **trademark** (preferred), falling back to **name**, falling back to **"Кабинет"** — sourced from `useSellerInfo(cabinetId)` where `cabinetId` comes from `authStore`. [Source: docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md §3.2 row "Seller Profile Card"; src/components/custom/SidebarCabinetInfo.tsx:32-36]
2. **Loading** → render a skeleton placeholder (not blank, not "Кабинет"). **`available === false`** → render the resolved fallback name **plus** a warning indicator (`AlertTriangle`) whose tooltip shows the `SELLER_INFO_REASON_LABELS[reason]` (or "Нет данных от WB" when reason absent). This follows the Defensive Frontend Principle — **indicate** the anomaly, do not hide it. [Source: src/components/custom/SidebarCabinetInfo.tsx:37,49-58; src/types/cabinet.ts:165-178]
3. **Independent state machine (Multi-Source Orchestration Pattern 1)**: a seller-info fetch failure, `undefined`, or `available:false` MUST NOT blank or unmount the page `<h1>` title, subtitle, date picker, or tabs. The badge degrades in isolation. [Source: frontend/CLAUDE.md § Multi-Source Orchestration Pattern 1]
4. When `cabinetId` is absent (null/empty), the badge renders nothing (`null`) — no crash, no error boundary trip. [Source: src/components/custom/SidebarCabinetInfo.tsx:30]
5. The display-name derivation is extracted as a **pure exported function** (e.g. `resolveSellerDisplayName(seller)`) and unit-tested directly (pure-functions-over-hook-mocking convention). The new badge component and `SearchPageContent.tsx` both stay **< 200 lines** (target ≤ 150). [Source: frontend/CLAUDE.md § Mandatory file size limit; § Pure functions over hook mocking]
6. **WCAG 2.1 AA**: decorative icons carry `aria-hidden`; the warning tooltip trigger is keyboard-focusable and announces its reason. No new ESLint `jsx-a11y` violations (rule is `error` since Story 110.1-FE). [Source: frontend/CLAUDE.md § WCAG 2.1 AA Accessibility]
7. All UI copy is Russian-locale (e.g. "Кабинет", reason labels). [Source: frontend/CLAUDE.md § Design System]
8. Quality gates hold at baseline: `type-check` 0 errors, ESLint 0 errors / 112 warnings, `check:docs` 22 broken (NOT ratcheted), vitest ≥ 8003 passing / 0 failed (current floor + new tests). [Source: frontend/CLAUDE.md § Accepted Baselines]

## Tasks / Subtasks

- [x] Task 1 — Extract pure display helper (AC: #1, #5)
  - [x] Add `resolveSellerDisplayName(seller: SellerInfoResponse | undefined): string` returning `''` while loading (`seller === undefined`), `tradeMark || name || 'Кабинет'` when `available`, and `'Кабинет'` when `available === false`. Mirror `SidebarCabinetInfo.tsx:32-36` semantics exactly.
  - [x] Co-locate the helper with the new component (export it) so the test imports the pure function, not the hook.
- [x] Task 2 — Create `SearchSellerBadge.tsx` (AC: #1, #2, #3, #4, #6, #7)
  - [x] `'use client'`; read `cabinetId` via `useAuthStore(auth => auth.cabinetId)` (AP#5 — name the selector param after the store, NOT `state`).
  - [x] Call `useSellerInfo(cabinetId ?? '')` (hook already guards with `enabled: !!cabinetId`).
  - [x] `if (!cabinetId) return null` (AC#4).
  - [x] Render: `Store` icon (`aria-hidden`) + display name (skeleton `<div className="h-4 w-28 animate-pulse …">` when name is `''`); when `seller?.available === false`, append the `AlertTriangle` + `Tooltip` reason (keyboard-accessible trigger via `<button>`).
  - [x] Self-contained — no props that couple it to the page's other data (independent state machine, AC#3).
- [x] Task 3 — Wire badge into `SearchPageContent.tsx` header (AC: #1, #3)
  - [x] Place `<SearchSellerBadge />` in the existing header `<div>` (beneath the subtitle `<p>`, `mt-2`). Did not wrap the `<h1>`/tabs in any seller-conditional.
  - [x] Add the JSDoc Story 117.3-FE line to the file header comment block.
  - [x] Confirm `SearchPageContent.tsx` stays < 200 lines (now 79).
- [x] Task 4 — Tests (AC: #5, #8)
  - [x] `SearchSellerBadge.test.tsx`: 5 pure-fn cases (loading→`''`, available trademark, available name-only, available neither→"Кабинет", unavailable→"Кабинет") + 4 component cases (no cabinetId→nothing; loading→skeleton; unavailable→warning tooltip+keyboard focus; available→name shown). Mocks `useSellerInfo` + `useAuthStore` per existing patterns; `TooltipProvider` wrapper (Radix requirement).
  - [x] Regex/role assertions for locale text. No rejected-value error path needed (hook is stubbed at data level, not promise level — graceful-200 contract).
  - [x] Patched `SearchPageContent.test.tsx`: dual-form `useAuthStore` mock (RequireJam destructures bare `useAuthStore()`; badge uses a selector) + `useSellerInfo` stub.
- [x] Task 5 — Gates (AC: #8)
  - [x] type-check 0 / ESLint 0E/112w (baseline, +0) / check-docs 22 (baseline) / check-lessons 0 violations / solo vitest 8019 passing (1 pre-existing FeedbackButtons timer flake — passes 19/19 in isolation).
  - [x] **2-pass adversarial review in fresh contexts** (source-code feature → 2-pass floor; NOT 4-pass codification) — completed `/code-review 117.3`. Pass 1: 6 findings (1 MED dup-JSDoc + 1 MED mock-fragility + 4 LOW); all fixed (incl. derivative JSX syntax error). Pass 2 (fresh context): 1 actionable LOW (F-7 explicit aria) + 1 derivative TS2345 fix + 2 accepted-as-pattern. Total cumulative findings: 9 across passes (6+3 + 2 derivatives). Both passes before Status flip + before commit.

## Dev Notes

- **This is gap-closure, not a no-op.** Pre-flight (Story 105.2-FE) confirms: `useSellerInfo()` ships (`src/hooks/useSellerInfo.ts`), but no seller display exists on the Search page yet. Settings (`CabinetInfoCard.tsx`) and sidebar (`SidebarCabinetInfo.tsx`) already show seller info — the Search-page header is a NEW, in-scope location per Epic 117 §3.1/§3.2.
- **Canonical pattern to mirror**: `SidebarCabinetInfo.tsx` (compact badge: Store icon + tradeMark/name + skeleton + warning tooltip). The new badge is essentially a header-context twin. Do NOT re-derive the `available`/fallback logic — copy its exact branch semantics into the pure helper.
- **`SellerInfoResponse` shape** (`src/types/cabinet.ts:172-178`): `{ name, sid, tradeMark, available, reason? }`. `reason` ∈ `SELLER_INFO_REASON_LABELS` (token_error / insufficient_permissions / timeout / wb_api_error).
- **Boundary Normalizer**: seller-info is already normalized (`normalizeSellerInfoResponse` in `cabinet-normalizer.ts`) — consume the canonical shape directly; do NOT re-normalize.
- **AP#5 (Zustand selector shadowing)**: use `useAuthStore(auth => auth.cabinetId)`. Note `SidebarCabinetInfo.tsx:26` uses `state =>` — that's pre-existing; the new code follows the codified AP#5 form.
- **Defensive Frontend**: `available:false` is a backend-indicated anomaly → show the warning, keep the (fallback) name; never silently blank.
- Hook config (already set): `staleTime=60min`, `retry:false` (backend returns graceful 200 on WB SDK errors). No polling.

### Project Structure Notes

- New component: `src/app/(dashboard)/analytics/search/components/SearchSellerBadge.tsx` (co-located with `SearchPageContent.tsx` and the tab components — matches existing Search page structure).
- New test: `src/app/(dashboard)/analytics/search/__tests__/SearchSellerBadge.test.tsx` (mirrors the `__tests__/SearchPageContent.test.tsx` location).
- Edit: `src/app/(dashboard)/analytics/search/components/SearchPageContent.tsx` (header insertion only).
- No new routes, no new API client, no new types — all dependencies ship.

### References

- [Source: docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md#Feature-3.2 — "Seller Profile Card | Show seller name + trademark from useSellerInfo()"]
- [Source: src/components/custom/SidebarCabinetInfo.tsx — canonical compact seller-display pattern]
- [Source: src/components/custom/settings/CabinetInfoCard.tsx — full card variant (reference only; header wants compact)]
- [Source: src/hooks/useSellerInfo.ts — hook + queryKey + config]
- [Source: src/types/cabinet.ts:159-178 — SellerInfoResponse + reason labels]
- [Source: frontend/CLAUDE.md § Multi-Source Orchestration Pattern 1; § Defensive Frontend Principle; § Known Anti-Patterns #5; § Accepted Baselines]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context)

### Debug Log References

- Initial component-test failure: `Tooltip must be used within TooltipProvider` → wrapped renders in `TooltipProvider` (app supplies one layout-wide; `SidebarCabinetInfo` relies on the same). 9/9 pass after.
- Contended full vitest (tsc+eslint+check-lessons+vitest concurrent) showed 51 failed / 7969 passed (setup 1126s — resource starvation). Solo re-run: 8019 passed / 1 failed (`FeedbackButtons` 2s-timer auto-reset). FeedbackButtons passes 19/19 in isolation → confirmed pre-existing flake (documented Story 112.4-FE close note), not a 117.3 regression.

### Completion Notes List

- Shipped `SearchSellerBadge.tsx` (66 lines): exported pure `resolveSellerDisplayName()` + self-fetching badge. Independent state machine (Multi-Source Orchestration Pattern 1) — a seller-info failure/unavailable/loading never blanks the page header. Defensive Frontend Principle: `available===false` keeps the "Кабинет" fallback name AND renders a keyboard-accessible `AlertTriangle` warning with the reason label.
- AP#5 honoured: `useAuthStore(auth => auth.cabinetId)` (selector param named after the store).
- Wired into `SearchPageContent.tsx` header beneath the subtitle; `<h1>`/date-picker/tabs untouched (AC#3).
- WCAG: decorative icons `aria-hidden`; warning is a `<button type="button">` with `aria-label` (focusable trigger). ESLint `jsx-a11y` (error) clean.
- Regression-risk caught during test setup: `RequireJam.tsx:31` destructures bare `useAuthStore()`; a string-returning mock would break it. Used a dual-form mock (object when bare, selected value with a selector) in `SearchPageContent.test.tsx`.
- Gates: type-check 0 · ESLint 0E/112w (baseline, +0 from new files) · check-docs 22 (baseline) · check-lessons 0 violations (190 files / 54 lesson lines) · solo vitest 8019 passing.
- **2-pass adversarial review pending** in `/code-review 117.3` (source-code feature → 2-pass floor).

### File List

- NEW: `src/app/(dashboard)/analytics/search/components/SearchSellerBadge.tsx`
- NEW: `src/app/(dashboard)/analytics/search/__tests__/SearchSellerBadge.test.tsx`
- MODIFIED: `src/app/(dashboard)/analytics/search/components/SearchPageContent.tsx`
- MODIFIED: `src/app/(dashboard)/analytics/search/__tests__/SearchPageContent.test.tsx`
- MODIFIED (review carry-fix, Pass-1 F-1): `src/app/(dashboard)/analytics/search/components/SearchOrdersChart.tsx` (deleted duplicate JSDoc block; Story 117.1-FE source — was uncommitted)
- MODIFIED (review carry-fix, Pass-1 F-4): `src/app/(dashboard)/analytics/search/components/SearchOrdersOverview.tsx` (grid-cols-3→2 in both skeleton+real grids; skeleton count 3→2; Story 117.1-FE source — was uncommitted)

### Post-1st-pass-review fixes (2026-05-28)

Pass 1 surfaced 6 findings across the uncommitted Epic-117 working tree (correctness + cleanup/altitude agents in fresh contexts). All fixed:

- **F-1 (MED)** — `SearchOrdersChart.tsx`: duplicate JSDoc block (lines 46-52 verbatim-identical to lines 53-58) above `formatDayTick`. Deleted the first block. **Story 117.1-FE carry-fix** (uncommitted at review time).
- **F-2 (MED)** — `SearchSellerBadge.test.tsx`: `mockReturnValue('cab-1')` ignored the selector arg — fragile if a 2nd selector is added later. Converted to a selector-respecting `setCabinet()` helper consistent with the page test's dual-form mock.
- **F-3 (LOW)** — `SearchSellerBadge.tsx`: loading skeleton lacked `role="status"`/sr-only loading text. Wrapped with `<div role="status" aria-busy>` + `<span class="sr-only">Загрузка информации о продавце</span>` + decorative skeleton inside.
- **F-4 (LOW)** — `SearchOrdersOverview.tsx`: `sm:grid-cols-3` with only 2 cards (revenue card removed in Story 91.1-FE) left an empty 3rd column; the loading skeleton rendered 3 placeholders. Changed BOTH grids to `grid-cols-2` and skeleton count to 2 for layout-shift parity. **Story 117.1-FE carry-fix.**
- **F-5 (LOW)** — `SearchSellerBadge.test.tsx`: warning-button test asserted existence + keyboard focus but never the tooltip CONTENT (the `SELLER_INFO_REASON_LABELS[reason]` lookup was unverified). Added `findAllByText('Токен невалидный')` after focus + `delayDuration={0}` on the test's `TooltipProvider` for deterministic open.
- **F-6 (LOW)** — `SearchSellerBadge.tsx`: hook-call-before-guard ordering had no inline comment. Added: "Hook called before the !cabinetId early-return (rules-of-hooks). The fetch is inert when cabinetId is empty: useSellerInfo guards with `enabled: !!cabinetId`."
- **Derivative (caught by re-test)** — my F-4 fix added a JSX `{/* */}` comment as a sibling **inside** `return (...)`, creating two top-level nodes without a fragment → esbuild "Expected ) but found className". Re-test caught the file-level failure; moved the comment to a plain JS `//` comment above `return`. Lesson: JSX comments inside `return (single-element)` create siblings unless fragment-wrapped.

### Post-2nd-pass-review fixes (2026-05-28)

Pass 2 (fresh-context adversarial review scrutinizing the Pass-1 fixes themselves) surfaced 3 LOW findings:

- **F-7 (LOW, ACTIONABLE)** — `SearchSellerBadge.tsx`: bare `aria-busy`/`aria-hidden` JSX boolean props inconsistent with sibling components (`SearchOrdersOverview.tsx:42,111` use explicit `="true"`). Note: React stringifies bare aria-* boolean props to `"true"`, so the reviewer's "renders as empty string" premise was inaccurate; the consistency/explicitness argument stands. Changed 4 sites (1 `aria-busy` + 3 `aria-hidden`) to explicit `="true"`.
- **F-8 (LOW, ACCEPTED-AS-PATTERN)** — Radix tooltip open-on-focus in jsdom is an inherently brittle seam; same pattern documented in `MonitorPipelineHealth.test.tsx:110`. `delayDuration={0}` + `findAllByText` + `length > 0` is the established codebase mitigation. No code change.
- **F-9 (LOW, ACCEPTED-AS-PATTERN)** — `setCabinet` selector param typed as `{ cabinetId: string | null }` (narrower than full `AuthState`). Same narrow-typing pattern as `SearchPageContent.test.tsx:21-26`. Trade-off accepted: building a full AuthState for a single-selector mock is over-engineering. No code change.
- **Derivative (caught by post-Pass-2 type-check)** — Pass-1 F-2 `mockImplementation((selector?: ...narrow) => ...)` triggered `TS2345`: the narrow function type didn't satisfy zustand's strict `(state: AuthState) => U` overload. Added `as never` cast on the impl (AP#4 spirit: bridge complex library types with a localized cast).

### Change Log

| Date | Change |
|---|---|
| 2026-05-28 | Story created. Gap-closure for Epic 117 §3.2: surface seller trademark/name in the Search Analytics page header via existing `useSellerInfo()`, mirroring `SidebarCabinetInfo.tsx`. Pre-flight (Story 105.2-FE) confirmed the hook ships but no Search-page seller display exists yet — real work, not a no-op. 2-pass review (source-code feature floor). |
| 2026-05-28 | Implementation complete (Status → review). New `SearchSellerBadge.tsx` (pure `resolveSellerDisplayName` + self-fetching badge, independent state machine, Defensive Frontend warning) wired into Search page header; 9 new tests; `SearchPageContent.test.tsx` dual-form authStore mock + seller stub. Gates: type-check 0 / ESLint 0E/112w / check-docs 22 / check-lessons 0 / solo vitest 8019 pass (1 pre-existing FeedbackButtons flake). Awaiting 2-pass `/code-review 117.3`. |
| 2026-05-28 | 2-pass `/code-review 117.3` complete; 9 cumulative findings (Pass-1: 6 / Pass-2: 3 actionable+accepted; +2 derivative defects from fixes themselves caught by re-test + type-check gate). All actionable findings fixed; 2 LOW accepted-as-established-codebase-pattern (F-8 jsdom tooltip seam, F-9 mock-type narrowing). Status: review → done. Gates at close: search subtree 11/11 files & 79/79 tests passing · type-check 0 · ESLint 0E/112w (baseline +0) · check-docs 22 (baseline, NOT ratcheted) · check-lessons 0 violations (54 lesson lines at close-row-write-time; 55 after this row's Lessons line is counted — A-6 dual-attestation, Story 118.1-FE). **Lessons:** (1) JSX `{/* */}` as sibling inside `return (...)` breaks JSX; use JS `//` comment above `return`. Re-test catches. (2) Generic-zustand mock typing fails TS2345; `as never` cast on `mockImplementation` bypasses (AP#4 spirit). (3) Review of uncommitted multi-story tree surfaces carry-fixes; 2 Story 117.1-FE defects fixed in-scope here. |
