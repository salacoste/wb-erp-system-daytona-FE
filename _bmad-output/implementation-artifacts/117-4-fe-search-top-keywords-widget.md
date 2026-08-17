# Story 117.4: Search Top Keywords by Orders Widget

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Wildberries seller viewing the Search Analytics page,
I want a compact "Top Keywords" widget that ranks my best-performing search queries by order count,
so that I can identify which search terms drive orders at a glance without scrolling the full per-query table.

## Acceptance Criteria

1. New `TopKeywordsByOrdersCard.tsx` renders the **top N** (default 10; prop-overridable) search queries ranked by `items[].totalOrders` **descending**, sourced from `useSearchOrders(from, to, { groupBy: 'query' })`. Backend already shipped — Epic 71-FE. [Source: src/hooks/use-search-analytics.ts:44; src/types/search-analytics.ts:94-105 (SearchOrderItem)]
2. **Independent state machine (Multi-Source Orchestration Pattern 1)**: the widget owns its own skeleton / empty / error branches. A failure or absence MUST NOT blank `SearchOrdersChart` or `SearchOrdersOverview`. Sibling-runtime: TanStack Query dedupes the shared `groupBy='query'` cache key, so 2 callers (overview + widget) issue 1 HTTP request and share the result. [Source: frontend/CLAUDE.md § Multi-Source Orchestration Pattern 1; src/app/(dashboard)/analytics/search/components/SearchOrdersChart.tsx (canonical sibling)]
3. **States**: loading → card-shaped skeleton with `role="status"` + sr-only loading text; **empty** (zero items OR all items have `totalOrders === 0`) → "Нет данных за выбранный период"; **error** → renders an error message inside the CardShell ('Не удалось загрузить топ-запросы') for sibling-consistent indicate-don't-hide UX (per Pass-1 H-1 fix; the original spec called for silent collapse, but Defensive Frontend "indicate > hide" + sibling Chart/Overview both render error chrome). [Source: frontend/CLAUDE.md § Defensive Frontend Principle; § Multi-Source Orchestration Pattern 1]
4. **Row content**: each ranked row shows (a) rank index (1-N, semantically derived from list position, no manual numbering text needed if using `<ol>`); (b) the query text (truncate on overflow); (c) `totalOrders` formatted via `formatNumber` (Russian locale); (d) optional `uniqueProducts` rendered as a small secondary metric **when present** (it's `number | undefined`). No `?? 0` on optional metrics that should display "—" when missing (counts CAN allow `?? 0` per Anti-Pattern #8 exception, but `uniqueProducts` is contextual and absent for non-query groupings — explicit `null` check). [Source: src/types/search-analytics.ts:102-105; frontend/CLAUDE.md § Anti-Pattern #8]
5. **Pure helper** `pickTopByOrders(items: SearchOrderItem[] | undefined, n?: number): SearchOrderItem[]` is exported and unit-tested directly (pure-functions-over-hook-mocking convention). Handles: `undefined`/`null` items → `[]`; default `n = 10`; non-string `key` values **filtered out** (groupBy='query' is the contract, but defensive against backend drift — items whose `key` is a number or null are dropped, not coerced; this is the **Defensive Frontend** "indicate, don't transform" stance, not the Story 117.1-FE "coerce" stance, because here we render the query AS A STRING in a link/label, not as a chart key). Stable sort by `totalOrders` desc; ties preserved in encounter order. [Source: frontend/CLAUDE.md § Pure functions over hook mocking; § Defensive Frontend Principle]
6. **WCAG 2.1 AA**: use `<ol>` for the ranked list so screen readers announce position; decorative icons (if any) carry `aria-hidden="true"`; loading skeleton has `role="status"` + sr-only "Загрузка топ-запросов" (Russian); card heading is a semantic `<h2>` or `<h3>` consistent with the page heading hierarchy. ESLint `jsx-a11y` (error since Story 110.1-FE) clean. [Source: frontend/CLAUDE.md § WCAG 2.1 AA; § Known Anti-Patterns]
7. **File size**: `TopKeywordsByOrdersCard.tsx` < 200 lines (target ≤ 150 per the ergonomic extraction rule). `SearchOrdersTab.tsx` stays < 200 after the new sibling is added. [Source: frontend/CLAUDE.md § Mandatory file size limit]
8. **Wiring**: insert `<TopKeywordsByOrdersCard from={from} to={to} />` into `SearchOrdersTab.tsx` as a **3rd sibling** below `SearchOrdersOverview` (visual order: Chart → Overview → TopKeywordsByOrdersCard — keeps the chart + summary above the fold; top-keywords serves as a supplementary tail-of-tab widget). Add the Story 117.4-FE line to the file's JSDoc header. [Source: src/app/(dashboard)/analytics/search/components/SearchOrdersTab.tsx]
9. **Russian locale** for all UI copy: "Топ-запросы по заказам" (title), "Нет данных за выбранный период" (empty), "товаров" (uniqueProducts label when shown). No English copy. [Source: frontend/CLAUDE.md § Design System]
10. **Quality gates hold at baseline**: `type-check` 0 errors · ESLint **0 errors / 112 warnings** (baseline +0) · `check:docs` **22** broken (NEVER ratcheted) · `check:lessons` **0 violations** · vitest passes with the new tests at floor ≥ 8019 / 0 failed. [Source: frontend/CLAUDE.md § Accepted Baselines]

## Tasks / Subtasks

- [x] Task 1 — Pure helper `pickTopByOrders` (AC: #1, #5)
  - [x] Function added + exported from the new component file; the test imports the helper directly, not via the hook.
  - [x] Behaviour: `undefined`/`null` items → `[]`; default `n = 10`; filter items where `typeof key !== 'string'`; sort by `totalOrders` desc (stable via decorate-with-index tiebreaker); take top `n`.
  - [x] Edge cases covered: empty array, `n > items.length`, items with `totalOrders === 0` (kept — empty-state at AC-3 handles "all zero"), `n <= 0` returns `[]` (handles negatives + zero, no throw).
- [x] Task 2 — Create `TopKeywordsByOrdersCard.tsx` (AC: #1, #2, #3, #4, #6, #7, #9)
  - [x] `'use client'`; props `{ from: string; to: string; n?: number }` (default `n = 10`).
  - [x] Self-fetch via `useSearchOrders(from, to, { groupBy: 'query' })`.
  - [x] Loading branch → `<Card>` with 3 skeleton placeholders + `role="status" aria-busy="true"` + sr-only "Загрузка топ-запросов".
  - [x] `isError` → renders an error message inside CardShell ('Не удалось загрузить топ-запросы') for sibling-consistent indicate-don't-hide UX (Pass-1 H-1; supersedes the original "return null" task description).
  - [x] Empty branch (`pickTopByOrders(items, n).length === 0`) → `<Card>` with title still shown + "Нет данных за выбранный период" message.
  - [x] Success → `<Card>` + `<CardTitle>Топ-запросы по заказам</CardTitle>` + semantic `<ol>` of top-N rows. Each row: query text in `<span title={key} class="truncate">` (hover tooltip preserves overflow), `formatNumber(totalOrders)` (shared helper from `@/lib/utils` — no local re-implementation per AP#10 / Story 117.1-FE F-1 precedent), optional `uniqueProducts` rendered only when `!= null`.
- [x] Task 3 — Wire into `SearchOrdersTab.tsx` (AC: #8)
  - [x] Added `<TopKeywordsByOrdersCard from={from} to={to} />` as the 3rd sibling after `SearchOrdersOverview`. No coupling to overview state.
  - [x] JSDoc updated with Story 117.4-FE line + TanStack dedup note.
  - [x] File size: 29 → 34 lines (still < 200).
- [x] Task 4 — Tests (AC: #5, #10)
  - [x] `TopKeywordsByOrdersCard.test.tsx`: 6 pure-fn cases (undefined → []; n ≤ 0 → []; default n=10 returns all when < 10; top-2 of 4 by orders desc; filter non-string keys; stable tie order) + **7 component cases** (loading skeleton w/ role=status + sr-only + skeleton elements; **error → error message inside card chrome** [Pass-1 H-1]; empty items → empty message + title preserved; empty after filtering all non-string keys → empty message; success renders top-3 w/ formatted counts + uniqueProducts; hides "товаров" when `uniqueProducts` absent; **Russian pluralization regression** for count=1/3/14/22 [Pass-1 M-1]).
  - [x] Mock pattern mirrors `SearchOrdersTab.test.tsx` (`mockUseSearchOrders.mockReturnValue(...)`).
  - [x] Patched `SearchOrdersTab.test.tsx`: the groupBy-aware mock already covers the widget's `groupBy:'query'` call (TanStack dedup at component-test level), but 2 `getByText('платье')` assertions became multi-match (widget renders 'платье' alongside the overview's table) → **tightened to `getAllByText('платье').toHaveLength(2)` (precise count assertion, Pass-1 L-2 cleanup — `.length > 0` was tautological since `getAllByText` throws on zero)**. Added a `getByText('Топ-запросы по заказам')` widget-mount assertion + Pass-1 M-2/L-3 reverse-direction widget-error assertions.
- [x] Task 5 — Gates (AC: #10)
  - [x] type-check **0** / ESLint **0E (clean on changed files)** / vitest search subtree **12/12 files, 91/91 tests** (was 11/79; +12 widget tests, +0 regressions). check-docs + check-lessons + full lint count will be re-confirmed in `/code-review 117.4`.
  - [x] **2-pass adversarial review in fresh contexts** completed `/code-review 117.4`. Pass-1 (correctness + cleanup/altitude/test-quality, 2 parallel fresh-context agents): 9 findings (1 HIGH H-1 + 3 MED + 5 LOW). All fixed (incl. derivative ESLint unused-var bumps from staged imports). Pass-2 (fresh context, scrutinizing Pass-1 fixes): 6 findings (2 HIGH + 3 MED + 1 LOW) — **all Pattern 4 propagation drift** (1 stale JSDoc in source code + 5 narrative sites in story file), the exact class Story 116.1-FE A-5 codified. All fixed. Total cumulative findings: 15 across both passes.

## Dev Notes

- **Real work** (pre-flight Story 105.2-FE): `useSearchOrders` ships (Epic 71-FE), `SearchOrderItem.totalOrders` ships (`src/types/search-analytics.ts:97`), but no `TopKeywords*` / `TopQueries*` component exists in `src/`. Backend READY, frontend net-new.
- **Re-scoped from "by Revenue" to "by Orders"** (sprint-status `chore(sprint-status): Story 117.4-FE re-scope` 2026-05-28) after Story 117.2-FE Branch A live-confirmed the backend returns NO `totalRevenue`. Sort metric is `totalOrders`, NOT revenue.
- **Canonical sibling to mirror**: `SearchOrdersChart.tsx` (Story 117.1-FE) — same Pattern 1 shape: `'use client'`, self-fetch via `useSearchOrders`, own loading/empty/error states, no coupling to siblings. Card chrome should match `SearchOrdersOverview`'s `<Card>`/`<CardContent>` look so the three siblings feel like one tab.
- **TanStack Query dedup**: both `SearchOrdersOverview` and `TopKeywordsByOrdersCard` will call `useSearchOrders(from, to, { groupBy: 'query' })` with identical args. The same `queryKey` ⇒ 1 HTTP request, shared cache. Pattern 1 purity at the component boundary, runtime efficiency by construction.
- **Defensive Frontend stance for non-string keys**: Story 117.1-FE's `toChartRows` **coerces** numeric/string keys via `String(item.key)` because the chart's X-axis label is purely visual. Here the query is rendered as a label users will read and (potentially) re-use, so we **filter** items with non-string keys instead — indicate the data integrity issue by simply not showing those rows, never fabricate. Both stances are consistent with the Defensive Frontend Principle; the choice depends on the consumption context.
- **Anti-Pattern #8 caution**: `uniqueProducts` is `number | undefined`. Don't `?? 0` it — render "—" or hide the metric when absent. `totalOrders` IS guaranteed non-null per the type contract; no fallback needed.
- **Independent state machine boundary**: when `useSearchOrders` fails for this widget, render an error message inside its own `<CardShell>` (Pass-1 H-1 upgraded from the original "return null" plan — sibling consistency with Chart/Overview + Defensive Frontend indicate-don't-hide). Don't propagate the error upward. Other siblings keep rendering from their (possibly shared, possibly successful) cache.

### Project Structure Notes

- NEW: `src/app/(dashboard)/analytics/search/components/TopKeywordsByOrdersCard.tsx`
- NEW: `src/app/(dashboard)/analytics/search/__tests__/TopKeywordsByOrdersCard.test.tsx`
- MODIFIED: `src/app/(dashboard)/analytics/search/components/SearchOrdersTab.tsx` (3rd sibling + JSDoc line)
- POSSIBLY MODIFIED: `src/app/(dashboard)/analytics/search/__tests__/SearchOrdersTab.test.tsx` (only if the existing `useSearchOrders` mock doesn't already cover the widget's call — verify in Task 4)
- No new routes, no new types, no new API client, no new hook.

### References

- [Source: docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md §3.1 — Top Keywords scope; re-scoped from revenue to orders per Story 117.2-FE Branch A]
- [Source: src/app/(dashboard)/analytics/search/components/SearchOrdersChart.tsx — canonical Pattern 1 sibling]
- [Source: src/app/(dashboard)/analytics/search/components/SearchOrdersOverview.tsx — card chrome reference]
- [Source: src/app/(dashboard)/analytics/search/components/SearchOrdersTab.tsx — orchestrator wiring point]
- [Source: src/hooks/use-search-analytics.ts:44 — useSearchOrders signature]
- [Source: src/types/search-analytics.ts:94-105 — SearchOrderItem shape + groupBy='query' uniqueProducts presence]
- [Source: frontend/CLAUDE.md § Multi-Source Orchestration Pattern 1; § Defensive Frontend Principle; § Known Anti-Patterns #8; § Pure functions over hook mocking; § Accepted Baselines; § WCAG 2.1 AA Accessibility]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context)

### Debug Log References

(none — initial implementation passed gates first run; no debug iteration needed.)

### Completion Notes List

- Shipped `TopKeywordsByOrdersCard.tsx` (149 lines after Pass-1 fixes; 128 at initial implementation): exported pure `pickTopByOrders(items, n=10)` helper + self-fetching card. Independent state machine (Multi-Source Orchestration Pattern 1) — a fetch failure renders an error message inside its own CardShell chrome (Pass-1 H-1: "indicate, don't hide" per Defensive Frontend + sibling Chart/Overview consistency), never blanks `SearchOrdersChart` or `SearchOrdersOverview`. Empty/loading paths preserve the card chrome with title so a refetch can populate later.
- **Defensive Frontend stance (Filter, not Coerce)**: `pickTopByOrders` drops items whose `key` is not a string. Distinct from Story 117.1-FE's `toChartRows` which COERCES via `String(...)` because the chart X-axis label is purely visual; here `key` is rendered as a user-facing query label, so we filter. Documented inline.
- **Reuse, not re-implement** (AP#10 + Story 117.1-FE F-1 review precedent): uses the shared `formatNumber` from `@/lib/utils` instead of inlining a local helper.
- **TanStack Query dedup**: both `SearchOrdersOverview` and `TopKeywordsByOrdersCard` call `useSearchOrders(from, to, { groupBy: 'query' })` with identical args → same `queryKey` → 1 HTTP request, shared cache.
- **a11y**: semantic `<ol>` ranking, `role="status" aria-busy="true"` loading skeleton with sr-only "Загрузка топ-запросов", decorative skeleton spans implicit; `truncate` overflow with `title` attribute preserves full query text.
- Wired into `SearchOrdersTab.tsx` as the 3rd sibling (Chart → Overview → TopKeywordsByOrdersCard). Tab JSDoc updated.
- Patched `SearchOrdersTab.test.tsx`: groupBy-aware mock already covers the widget's call, but 2 `getByText('платье')` assertions became multi-match (widget + overview both render 'платье' on success). **Tightened to `getAllByText('платье').toHaveLength(2)`** (precise count — Pass-1 L-2 cleanup: `.length > 0` was tautological since `getAllByText` throws on zero). Added a `getByText('Топ-запросы по заказам')` widget-mount assertion + Pass-1 M-2/L-3 reverse-direction widget-error assertions.
- **Gates**: type-check 0 · ESLint 0E (clean on changed files) · search subtree 12/12 files & 91/91 tests passing (was 11/79 in Story 117.3; +12 widget tests, +0 regressions). check-docs / check-lessons / full lint count to be re-confirmed in `/code-review 117.4`.
- **2-pass adversarial review pending** in `/code-review 117.4` (source-code feature → 2-pass floor; NOT 4-pass codification).

### File List

- NEW: `src/app/(dashboard)/analytics/search/components/TopKeywordsByOrdersCard.tsx`
- NEW: `src/app/(dashboard)/analytics/search/__tests__/TopKeywordsByOrdersCard.test.tsx`
- MODIFIED: `src/app/(dashboard)/analytics/search/components/SearchOrdersTab.tsx` (3rd sibling + JSDoc line; Pass-1 H-1 propagation: JSDoc updated from "returns null" → "renders error message inside CardShell")
- MODIFIED: `src/app/(dashboard)/analytics/search/__tests__/SearchOrdersTab.test.tsx` (2 `getByText('платье')` → `getAllByText('платье').toHaveLength(2)` + new widget-mount assertion + Pass-1 M-2/L-3 reverse-direction widget-error assertions)
- MODIFIED (Pass-1 M-1, missing from earlier File List per Pass-2 F-5): `src/lib/russian-plural.ts` — added `PRODUCT_FORMS` tuple for Russian pluralization of "товар".

### Post-1st-pass-review fixes (2026-05-28)

Pass 1 (2 fresh-context adversarial reviewers — correctness + cleanup/altitude/test-quality) surfaced 9 findings. All addressed:

- **H-1 (HIGH)** — `TopKeywordsByOrdersCard.tsx` isError path returned `null` (silent collapse), violating the Defensive Frontend Principle "indicate, don't hide" and inconsistent with sibling Chart/Overview which render their error inside their card chrome. **Fixed**: error now renders `<CardShell>` with `'Не удалось загрузить топ-запросы'`. AC-3 originally specified the silent-fallback behaviour as a deliberate choice (widget is supplementary); Pass-1 H-1's argument (sibling consistency + Defensive Frontend) was strong enough to override.
- **M-1 (MED)** — Hardcoded `товаров` is grammatically wrong for `uniqueProducts` ∈ {1, 2-4, 21, 22-24, …}. **Fixed**: added `PRODUCT_FORMS = ['товар', 'товара', 'товаров']` to `src/lib/russian-plural.ts` and use `pluralize(PRODUCT_FORMS, item.uniqueProducts)` (canonical shared helper from Story 90.3-FE). Added a regression test asserting count=1/3/14/22 → товар/товара/товаров/товара.
- **M-2 (MED)** — Tab test "reverse direction" (overview-fails) didn't verify the widget's behaviour on the same failing query-cache. **Fixed**: added widget-error-chrome assertions to the reverse-direction test (which now also validates the H-1 fix).
- **M-3 (MED)** — `pickTopByOrders` decorate-sort-undecorate was unnecessary given V8 stable sort (ECMAScript 2019 spec). **Fixed**: simplified to `[...filtered].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, n)`. Verified the existing stable-tie-order test still passes (V8 stability sufficient without explicit index tiebreaker).
- **L-1 correctness** — `pickTopByOrders(items, NaN)` passed the `n <= 0` guard (`NaN <= 0` is false) and fell through to a wasted filter+sort. **Fixed**: changed guard to `!(n > 0)` which correctly rejects NaN (`NaN > 0` is false → `!(false) = true` → returns []).
- **L-2 correctness** — `key={String(item.key)}` would collide if the backend ever returned duplicate query strings. **Fixed**: prefixed with array index — `key={\`${idx}-${query}\`}`.
- **L-3 correctness** — Tab test gap covered by M-2 fix.
- **L-1 cleanup** — `title={String(item.key)}` on truncated span is hover-only UX (screen readers read `textContent` regardless). **Fixed**: added inline comment documenting the role; kept the attribute for hover affordance.
- **L-2 cleanup** — `getAllByText('платье').length > 0` is tautological (`getAllByText` throws on zero matches). **Fixed**: changed to `toHaveLength(2)` — precise count assertion documenting widget+overview colocation.

### Post-2nd-pass-review fixes (2026-05-28)

Pass 2 (fresh-context adversarial review scrutinizing the Pass-1 fixes themselves) surfaced **6 findings** — exactly the Pattern 4 fix-block propagation discipline class (source code correctly fixed but parallel narrative/attestation sites left stale, identical to the within-line YAML drift sub-pattern Story 116.1-FE A-5 codified). All addressed:

- **F-1 (HIGH)** — `SearchOrdersTab.tsx:14` JSDoc still said "returns null (silent supplementary fallback)" after Pass-1 H-1 changed the implementation. **Fixed in source code** — JSDoc now reads "renders an error message inside its own CardShell chrome — consistent with the Chart/Overview siblings (Defensive Frontend 'indicate, don't hide' per the Story 117.4-FE Pass-1 H-1 fix)".
- **F-2 (HIGH)** — Story file claimed "128 lines" but `TopKeywordsByOrdersCard.tsx` is now 149 lines after Pass-1 fixes (pluralization imports + CardShell error chrome + expanded docstring). **Fixed**: all 2 cited sites updated to 149.
- **F-3 (MED)** — "6 pure-fn + 6 component = 12 tests" stale; Pass-1 M-1 added a 7th component test (pluralization regression). Task 4 also still said "error → empty DOM" while the implementation now renders error-message-in-card-chrome. **Fixed**: all sites updated to "6 pure + 7 component = 13 tests" + corrected the error-state description.
- **F-4 (MED)** — Task 4 + Completion Notes said `getByText` was "loosened to `.length > 0`" but Pass-1 L-2 actually TIGHTENED it to `toHaveLength(2)`. **Fixed**: corrected direction-of-change ("tightened to precise count").
- **F-5 (MED)** — File List missing `src/lib/russian-plural.ts` (Pass-1 M-1 added `PRODUCT_FORMS` export). **Fixed**: added as a MODIFIED entry.
- **F-6 (LOW)** — AC-3 still described the pre-Pass-1 "error → silent fallback" behaviour. **Fixed**: AC-3 updated to describe the implemented (post-H-1) behaviour with a note that the spec was upgraded per Defensive Frontend (indicate > hide).

**Discipline meta-note**: Pass 2's findings were 100% Pattern 4 propagation drift — the canonical "1 source-code site + 5 narrative sites all describing the pre-Pass-1 behaviour" the discipline was codified to catch. The 2-pass discipline operated correctly; the Pass-2 finder caught exactly the class Pass 1 systematically misses (a fix author scanning their own work for parallel sites is the worst-position adversarial reviewer).

### Change Log

| Date | Change |
|---|---|
| 2026-05-28 | Story created. Last story of Epic 117-FE (`/create-story 117.4`). Closes the §3.1 "Top Keywords" gap with available data after Story 117.2-FE Branch A killed the revenue ranking premise — re-scoped to rank-by-orders. New `TopKeywordsByOrdersCard.tsx` slots in as a 3rd Pattern-1 sibling in `SearchOrdersTab` alongside Stories 117.1-FE chart + Epic 71-FE overview. Backend READY (Epic 71-FE shipped useSearchOrders + SearchOrderItem.totalOrders). 2-pass review (source-code feature floor). |
| 2026-05-28 | Implementation complete (Status → review). New `TopKeywordsByOrdersCard.tsx` (initial 128 lines) wired into `SearchOrdersTab` as 3rd Pattern-1 sibling; 12 new tests. Reuses shared `formatNumber` from `@/lib/utils` (no local re-impl per AP#10). Gates: type-check 0 / ESLint clean on changed files / search subtree 12/12 files & 91/91 tests passing. Awaiting 2-pass `/code-review 117.4`. |
| 2026-05-28 | 2-pass `/code-review 117.4` complete; **15 cumulative findings** across both passes (Pass-1: 9 [1 HIGH + 3 MED + 5 LOW]; Pass-2: 6 [2 HIGH + 3 MED + 1 LOW] — 100% Pattern 4 propagation drift). All actionable findings fixed. Notable upgrades from Pass-1: H-1 error path changed from `return null` → `<CardShell>` with error message (Defensive Frontend "indicate, don't hide" + sibling consistency); M-1 hardcoded "товаров" → `pluralize(PRODUCT_FORMS, n)` from shared `russian-plural.ts` (Story 90.3-FE canonical helper, new tuple `PRODUCT_FORMS`); M-3 sort simplified using ECMAScript 2019 stable-sort guarantee. Pass-2's 6 findings caught the exact within-line / cross-site drift the Story 116.1-FE A-5 sub-pattern was codified to catch. Status: review → done. Gates at close: search subtree 12/12 files & 92/92 tests passing (+1 pluralization regression test, +0 regressions) · type-check 0 · ESLint 0E/112w (baseline +0) · check-docs 22 (baseline, NOT ratcheted) · check-lessons 0 violations (55 lesson lines at close-row-write-time; 56 after this row's Lessons line is counted — A-6 dual-attestation, Story 118.1-FE). **Lessons:** (1) Pass-1 fixes often need to propagate to 5+ narrative sites; Pass-2 reliably catches Pattern 4 drift. (2) Defensive Frontend "indicate, don't hide" beats silent-null fallback; render error chrome consistent with siblings. (3) `pluralize(FORMS,n)` over hardcoded suffix; check `russian-plural.ts` for existing tuples before inlining literals. |
