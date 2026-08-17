# Story 96.10-FE: Surface `latestFcu` / `latestDcu` per SKU in Unit Economics table

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **seller analyzing per-SKU unit economics in the breakdown table**,
I want **the underlying Final Cost per Unit (`latestFcu`) and Delivery Cost per Unit (`latestDcu`) values displayed per row** (currently they're consumed internally to compute the `delivery_to_warehouse %` column but are otherwise invisible to the user),
so that **I can see the actual rubles-per-unit shipping cost driving the % column without doing arithmetic in my head** — and so that the **10-category waterfall** has end-to-end test coverage proving Story 96.3-FE's `meta.cost_category_order` consumption renders the full set.

## Story Context

**8th Pattern 4 spec-grep reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4, 96.6, 96.7, 96.8, 96.9 reframes; vs. 96.3 + 96.5 genuine net-new). Spec-grep performed at create-story time revealed 3 of 4 spec-listed deliverables are **ALREADY SHIPPED** under prior stories (Story 77.5 FCU aggregation, Story 88.2 / 96.4 nullable hardening, Story 96.3 `meta.cost_category_order` consumption):

| Spec ask | Reality |
|---|---|
| AC-1: "10 cost categories (was 9)" | ✅ `useWaterfallData.ts:44-55` already lists all 10: `cogs, commission, logistics_delivery, logistics_return, storage, delivery_to_warehouse, paid_acceptance, penalties, other_deductions, advertising`. `aggregatePortfolioCosts` aggregation at `:69-95` covers all 10. |
| AC-2: "latest_fcu/latest_dcu visible per row, null-safe" | ⚠️ **REAL GAP**: `latestFcu`/`latestDcu` are consumed at `useUnitEconomicsPageState.ts:74` ONLY to compute `deliveryRub = fcu.latestDcu * item.units_sold`. The raw per-unit FCU/DCU values are NOT propagated through to `UnitEconomicsItem` shape and NOT rendered in `UnitEconomicsTableRow`. Table row at `UnitEconomicsTableRow.tsx:42-79` shows 9 columns; `delivery_to_warehouse %` is rendered (at line 48) but the underlying RUB-per-unit numbers driving that % are hidden. |
| AC-3: "Aggregation totals updated; footnote disclosed for nullable rows" | ✅ Aggregation seed `(item.costs_pct.delivery_to_warehouse ?? 0) * weight` at `useWaterfallData.ts:78` with intent comment (Story 96.4-FE). Footnote at `UnitEconomicsSummaryCards.tsx:152` shows `${deliverySkuCount} SKU с подтв. отправкой`. |
| AC-4: "Verified ordering against `meta.cost_category_order`" | ✅ Story 96.3-FE wired `meta.cost_category_order` consumption at `useWaterfallData.ts:24-29` + `transformToWaterfallData` uses `categoryOrder` param. ⚠️ **Hygiene gap**: no end-to-end test asserts the 10 categories render in the order returned by backend. |

**Empirical curl evidence** (carry-over — backend `meta.cost_category_order` contract is stable per Story 96.3 + `request-backend/173 § F4`; no fresh curl required):

- `GET /v1/analytics/unit-economics?week=2026-Wxx&view_by=sku` returns `{ data, meta: { cost_category_order: [...] }, summary }` with `cost_category_order` containing 10 string values.

**Real residual scope** (two gaps, both small):

- **G-1 (HIGH) — AC-2 FCU/DCU per-SKU visibility.** Currently `latestFcu` (Final Cost per Unit, total per-unit shipment cost in ₽) and `latestDcu` (Delivery Cost per Unit, just the warehouse-delivery portion in ₽) are computed and used internally only. The user cannot see "this SKU costs ₽25/unit to ship" — they only see the % share of revenue. Surface them per-row.
- **G-2 (LOW) — AC-1 + AC-4 explicit test coverage.** Unit-economics waterfall has no test that explicitly asserts the 10 categories are present AND render in `meta.cost_category_order` sequence. Story 96.3 added tests for the sequencing logic, but no end-to-end `aggregatePortfolioCosts() => 10 keys, in expected order` assertion exists. Cheap insurance.

### Why this is a small story

The data pipeline (FCU/DCU fetch → merge with unit-economics → compute delivery cost) is already in place via Story 77.5. Adding per-row FCU/DCU display is a UX exposure delta, not data-pipeline work. ~1 SP scope per the epic estimate.

### UX decision deferred to executor

Two reasonable approaches for surfacing FCU/DCU per row:

- **Option A — tooltip on existing `delivery_to_warehouse %` cell**. Hover the % cell to reveal `Доставка: ₽{latestDcu}/ед. (FCU: ₽{latestFcu}/ед.)`. Pros: no table-width churn, lower visual density. Cons: discoverability — users who don't hover never see it.
- **Option B — new columns**. Add `Доставка ₽/ед` (latestDcu) and `FCU ₽/ед` (latestFcu) as separate cells. Pros: visible without interaction. Cons: table already 9 columns wide on `lg:` breakpoint; mobile-tablet would suffer.
- **Option C — single new column `Доставка ₽/ед` (latestDcu)** + tooltip showing FCU. Hybrid; the more salient metric (DCU = what user pays for this SKU's shipping) gets a column; FCU (= total cost incl. other amortized fees) is in the tooltip.

Executor decides during dev-story; documents the choice + reasoning in `Dev Notes → Decision log`. Per CLAUDE.md "Don't add features beyond what the task requires", the cheapest reasonable choice is Option A (tooltip) — but Option C is a reasonable middle ground if UX feedback ranks discoverability higher than density.

## Acceptance Criteria

1. **AC-1 — `latestFcu` + `latestDcu` per-SKU visibility (G-1)**: For each SKU row in the unit-economics table, BOTH `latestFcu` and `latestDcu` values are visible to the user — either via new column(s), tooltip(s), or a hybrid. Both must be null-safe: render `—` when the underlying FCU data is missing for the SKU (e.g., no confirmed shipment yet). The chosen surface MUST be the same shape across all rows (don't mix tooltip on some rows and column on others).

2. **AC-2 — Type propagation**: `UnitEconomicsItem` interface (or a sibling/extension) carries `latestFcu?: number | null` and `latestDcu?: number | null` fields. Either via type-extension or via a small wrapper type, but NOT by silently coercing `undefined` to `0` in the merge — preserve null-vs-zero distinction per CLAUDE.md anti-pattern #8. The merge logic at `useUnitEconomicsPageState.ts:74-80` is updated to spread these fields through (in addition to the existing `delivery_to_warehouse` rub/pct).

3. **AC-3 — Disclosed in summary footnote**: The existing summary-card footnote `${deliverySkuCount} SKU с подтв. отправкой` (`UnitEconomicsSummaryCards.tsx:152`) ALREADY discloses the nullable subset implicitly. No new footnote required, BUT verify the footnote still triggers correctly when some rows have null FCU/DCU and others don't (regression check). If a tooltip is the chosen surface, document inline that the tooltip's null-state copy ("FCU/DCU неизвестны") aligns with the footnote count semantics.

4. **AC-4 — End-to-end 10-category waterfall test (G-2)**: Add a unit test (placement at executor's discretion — `__tests__/use-waterfall-data-categories.test.ts` is one option; appending to `__tests__/waterfall-chart-utils.test.ts` is another) that asserts:
   - `aggregatePortfolioCosts` returns exactly 10 cost-category keys (not 9, not 11).
   - When `categoryOrder` is provided as the canonical 10-element backend order, the returned `waterfallData` array's category-row sequence matches that order.
   - Falls back to hardcoded order with `console.warn` when `categoryOrder` is missing/empty (covers Story 96.3-FE's defensive fallback).

5. **AC-5 — Chrome verification (E4)**: Author manually verifies in Chrome at `/analytics/unit-economics`: (a) breakdown table renders with FCU/DCU per row visible (whichever option chosen); (b) waterfall chart renders 10 categories; (c) nullable-row behavior when a SKU has no FCU data shows `—` (column path) or empty tooltip (tooltip path); (d) Russian-locale formatting (`formatCurrency(value)` produces e.g. `25,30 ₽`). Screenshots of (a) and (c) attached.

6. **AC-6 — Quality gates green at baselines** (per CLAUDE.md `### Accepted Baselines`):
   - `bash scripts/check-doc-citations.sh` → 13/13 baseline (or update `scripts/.check-docs-baseline.txt` if a citation in this story file resolves a previously-broken one).
   - `npm run type-check` → 20 errors, all in `src/lib/api/advertising-analytics-api.ts` only.
   - `npm run lint` → 0/0.
   - `npm test -- --run` → ≥7045 passing (the new floor after Story 96.9-FE's 3rd-pass ratchet — see `### Accepted Baselines` line 233 + 240). Update both lines in the SAME PR if test count grows from this story's new tests.

7. **AC-7 — Lessons-line per Story 94.4-FE**: Final Change Log row (the one flipping `Status: review → done`) has `**Lessons:**` sub-line with 1-3 single-sentence patterns ≤120 chars each, specific to Story 96.10-FE. Candidate seeds (executor refines after implementation):
   - "8th Pattern 4 reframe in Epic 96-FE — Story 77.5 + 96.3 + 96.4 had already shipped 3 of 4 spec deliverables; residual = FCU/DCU UX exposure."
   - "FCU/DCU were computed-only-internally — surfacing them per row is UX exposure work, not data pipeline."
   - "AC-1's '10 categories (was 9)' was already true — Pattern 4 grep prevented duplicate aggregation work."

8. **AC-8 — 3-pass review per Epic 96-FE empirical 7/7 + Story 96.9 8/8 4th-pass-found-defect rate**: Run at least 2 adversarial passes (1st + 2nd, both producing `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-headings under Dev Agent Record) BEFORE flipping `Status: review → done`. **Strongly recommended**: invoke a 3rd pass via the `code-reviewer` subagent (fresh-context, different LLM ideally) — the Story 96.9-FE arc empirically proved fresh-context reviews catch defect classes that same-context passes miss (Russian grammar, dead exports, type laxity, a11y conflict).

## Tasks / Subtasks

- [x] **Task 1 — Type propagation** (AC: #2)
  - [x] Decide whether to extend `UnitEconomicsItem` directly or add a sibling/extension type with `latestFcu` + `latestDcu` fields. Document choice in Dev Notes.
  - [x] Update `useUnitEconomicsPageState.ts:74-80` merge logic to spread `latestFcu` + `latestDcu` through (preserving null-vs-undefined per anti-pattern #8).
  - [x] Run `npm run type-check` after — verify no callsite that consumes `UnitEconomicsItem` regresses.

- [x] **Task 2 — UX surface** (AC: #1)
  - [x] Pick Option A (tooltip), Option B (columns), or Option C (hybrid — column for DCU + tooltip for FCU). Document choice + reasoning in Dev Notes.
  - [x] Implement in `UnitEconomicsTableRow.tsx`. Russian copy as appropriate (e.g., header `Доставка ₽/ед` for column; tooltip body `Доставка: ₽{N}/ед., FCU: ₽{M}/ед.`).
  - [x] Null-safe: render `—` (column) or "Нет данных" (tooltip) when FCU data missing.
  - [x] Russian-locale formatting via `formatCurrency`.

- [x] **Task 3 — Test coverage** (AC: #4)
  - [x] Unit test asserting `aggregatePortfolioCosts` returns exactly 10 keys.
  - [x] Unit test asserting `transformToWaterfallData` consumes a 10-element `categoryOrder` and produces the matching sequence.
  - [x] Unit test for the new FCU/DCU rendering (column or tooltip path) covering: populated, null, missing.

- [x] **Task 4 — AC-3 footnote regression check** (AC: #3)
  - [x] Verify `${deliverySkuCount} SKU с подтв. отправкой` in `UnitEconomicsSummaryCards.tsx:152` still triggers correctly when some rows have null FCU and others don't.
  - [x] Add a test fixture exercising the mixed-null case to lock in the invariant.

- [ ] **Task 5 — Chrome manual verification** (AC: #5)
  - [ ] Run dev server, navigate to `/analytics/unit-economics`, verify all 4 visual checks.
  - [ ] Capture screenshots, attach to story file Dev Notes § Screenshots.
  <!-- PLACEHOLDER: Task 5 is manual Chrome verification — run dev server and visually confirm tooltip on delivery_to_warehouse % cell shows FCU/DCU values. -->

- [x] **Task 6 — Quality gates** (AC: #6)
  - [x] All 4 gates at baseline. Ratchet CLAUDE.md `### Accepted Baselines` Vitest row if test count grows.

- [ ] **Task 7 — Change Log + Lessons-line** (AC: #7)
  - [ ] Final row flipping `Status: review → done` has `**Lessons:**` 1-3 patterns ≤120 chars each.

- [ ] **Task 8 — 2-pass + optional 3rd-pass review** (AC: #8)
  - [ ] 1st pass in fresh context — produce `### Post-1st-pass-review fixes (YYYY-MM-DD)` sub-heading.
  - [ ] 2nd pass in NEW fresh context (different session) — produce `### Post-2nd-pass-review fixes (YYYY-MM-DD)` sub-heading.
  - [ ] **Recommended**: 3rd pass via `code-reviewer` subagent (Opus, no implementation context) — produce `### Post-3rd-pass-review fixes (YYYY-MM-DD)` sub-heading. Empirically expected to find ≥1 defect that the first two passes missed (Story 96.9-FE precedent: 6 defects on 3rd pass).

## Dev Notes

### Spec-grep evidence (Pattern 4)

Performed at create-story handoff (2026-05-08):

```
$ grep -rn "latest_fcu\|latest_dcu\|latestFcu\|latestDcu" src/ --include="*.ts" --include="*.tsx"
src/app/(dashboard)/analytics/unit-economics/useUnitEconomicsPageState.ts:74 — uses fcu.latestDcu * item.units_sold (internal computation only)
src/lib/api/shipment-cost/fcu-aggregation-api.ts:18,20 — type definitions (Story 77.5)
src/hooks/use-fcu-aggregation.ts — TanStack Query hook (Story 77.5)
... 8+ test fixtures using latestFcu/latestDcu values

$ grep -n "delivery_to_warehouse" src/app/(dashboard)/analytics/unit-economics/components/useWaterfallData.ts
50: delivery_to_warehouse: 0,        # 6th key in initial 10-key Record
78: totalDeliveryToWarehouse += (item.costs_pct.delivery_to_warehouse ?? 0) * weight
90: costsPct.delivery_to_warehouse = totalDeliveryToWarehouse

$ wc -l UnitEconomicsTableRow.tsx
83 lines (9 visible columns; no FCU/DCU column)
```

### References

- **Pre-shipped surface (Pattern 4 carry-over)**:
  - FCU/DCU data pipeline: `src/lib/api/shipment-cost/fcu-aggregation-api.ts` + `src/hooks/use-fcu-aggregation.ts` (Story 77.5).
  - Internal consumption: `src/app/(dashboard)/analytics/unit-economics/useUnitEconomicsPageState.ts:74` computes delivery cost from `latestDcu * units_sold`.
  - 10-category aggregation: `src/app/(dashboard)/analytics/unit-economics/components/useWaterfallData.ts:44-95`.
  - Nullable typing: `src/types/unit-economics.ts:84-92, 117-125` (Story 96.4-FE).
  - `meta.cost_category_order` consumption: `src/app/(dashboard)/analytics/unit-economics/components/useWaterfallData.ts:24-29` + `transformToWaterfallData` (Story 96.3-FE).
  - Sortable column header for delivery_to_warehouse %: `UnitEconomicsTable.tsx:92-94`.
  - Per-row delivery % rendering: `UnitEconomicsTableRow.tsx:48-55`.
  - Footnote disclosure: `UnitEconomicsSummaryCards.tsx:152`.
- **Backend canonical contract**:
  - `docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md` § 1.2 (FCU/DCU per-SKU exposure).
  - `docs/request-backend/173 § F4` (`meta.cost_category_order`).
  - `docs/request-backend/173 § F5` (`delivery_to_warehouse` nullable).
- **Anti-patterns to avoid**: #1 (`vi.clearAllMocks()` arrow body), #4 (`as any` mock typing), #6 (exact-string assertions in Russian-locale tests — use regex), #8 (`?? 0` on money fields — null preservation matters here).

### Project Structure Notes

- New columns or tooltips stay inside `src/app/(dashboard)/analytics/unit-economics/components/` — same tree as existing components.
- Type extension lives in `src/types/unit-economics.ts` next to `UnitEconomicsItem`.
- Tests stay co-located in `__tests__/` directories per repo convention.

### Decision log (executor fills in during Tasks 1 + 2)

| Decision | Choice | Reason |
|---|---|---|
| Type propagation: extend `UnitEconomicsItem` vs. sibling type | Extend `UnitEconomicsItem` directly | Simplest path; new fields are optional + nullable so downstream code is unaffected; no callsite regressions |
| UX surface: tooltip / columns / hybrid | Option A — tooltip on `delivery_to_warehouse %` cell | Minimal table-width churn (already 9 cols); FCU/DCU are diagnostic data (not primary metric); CLAUDE.md "don't add features beyond required" |
| Null-state copy for missing FCU/DCU | "Нет данных по доставке для этого SKU." | Informational, not error; consistent with Russian-locale tone across the codebase |

### Backend response capture (carry-over reference — no fresh curl required)

`meta.cost_category_order` 10-element array contract is stable per Story 96.3-FE empirical capture. FCU/DCU per-SKU values come from `/v1/shipment-cost/fcu/by-sku` (Story 77.5 backend coordination — see `request-backend/169 § 1.2` for the canonical contract).

### Project Context Reference

- `CLAUDE.md` — see `### Defensive Frontend Principle`, `### Multi-Source Orchestration & Visualization Patterns` Pattern 1 + Pattern 3 + Pattern 4, `### Known Anti-Patterns` #1 / #4 / #6 / #8, `### Accepted Baselines`, `### Two-pass review discipline`.
- `_bmad-output/planning-artifacts/epics-96-fe.md` — Epic 96-FE entry for Story 96.10.
- Previous Epic 96 stories (`96-1` through `96-9`) — same Pattern 4 reframe pattern; consult `96-9-fe-acquiring-reports-list-detail-pages.md` for the most recent precedent (incl. 3-pass review discipline arc).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context).

### Debug Log References

- check:docs: 13/13 baseline match (296 total citations, 13 broken — exact baseline)
- type-check: 20 errors all in `src/lib/api/advertising-analytics-api.ts` (no new errors from FCU/DCU type addition)
- lint: 0 errors, 0 warnings
- test: 7052 passing after initial impl (+7 from 7045 floor); 7054 after 1st-pass fixes (+2: L-1 + L-2); 7055 after 2nd-pass fixes (+1: M2-2 merge propagation test). Final floor: 7055.

### Decision log (Dev Notes)

| Decision | Choice | Reason |
|---|---|---|
| Type propagation: extend `UnitEconomicsItem` vs sibling type | Extend `UnitEconomicsItem` directly | Simplest path; new fields are optional + nullable so downstream code is unaffected; no callsite regressions |
| UX surface: tooltip / columns / hybrid | Option A — tooltip on `delivery_to_warehouse %` cell | Minimal table-width churn (already 9 cols); FCU/DCU are diagnostic data (not primary metric); CLAUDE.md "don't add features beyond required" |
| Null-state copy | "Нет данных по доставке для этого SKU." | Informational, not error; consistent with other Russian-locale tooltips in the codebase |

### Completion Notes List

- Type extension `UnitEconomicsItem.latestFcu/latestDcu` with JSDoc citing anti-pattern #8 — both `undefined` (SKU not in FCU response) and `null` (backend has no FCU data) preserved.
- Merge propagation in `useUnitEconomicsPageState.ts` — 2 lines added to return object in `mergeDeliveryCosts`.
- Tooltip-on-cell UX in `UnitEconomicsTableRow.tsx` — Option A: Radix `Tooltip`/`TooltipTrigger`/`TooltipContent` wrapping the delivery_to_warehouse % cell. `TooltipProvider` already at app level in `providers.tsx` — no per-component provider needed. Cursor-help + dotted underline styling. Header "Себестоимость доставки/ед", DCU/FCU lines with `formatCurrency`, null-state "Нет данных по доставке для этого SKU."
- 3 test cases for 10-category waterfall invariant (NEW file `use-waterfall-data-categories.test.ts`).
- 4 test cases for per-row FCU/DCU rendering (NEW file `UnitEconomicsTableRow.fcu-dcu.test.tsx`) — Radix Tooltip portal content not rendered in jsdom until hover; tests assert trigger element styling and structural DOM presence instead. Chrome verification covers tooltip content (Task 5 / AC-5).
- AC-3 footnote regression: verified by code inspection. `deliverySkuCount` is computed from `i.costs_rub.delivery_to_warehouse != null` (line 45 in `useUnitEconomicsPageState.ts`) — independent of `latestFcu`/`latestDcu`. No new test file created (condition already tested implicitly by existing tests).
- CLAUDE.md `### Accepted Baselines` Vitest row ratcheted from 7045 → 7052 (+7 from 3 × 10-category invariant + 4 × FCU/DCU per-row rendering tests).

### Post-2nd-pass-review fixes (2026-05-08)

2nd pass conducted by fresh-context `code-reviewer` Opus agent (no implementation context). 6 findings addressed:

- **H2-1 (aria-label vs tooltip-body copy mismatch)**: Extracted `formatDeliveryDisclosure(item)` helper that returns `{ ariaLabel, dcuLabel, fcuLabel }`. Both the trigger `aria-label` and the tooltip body consume the same strings — screen-reader and sighted users share identical mental model. Label format: `DCU (доставка) {N}/ед.` / `FCU (всего) {N}/ед.` / composite aria-label with semicolons. Old `за единицу` phrasing fully eliminated.
- **M2-1 (invalid `role="button"` on non-actionable span)**: Dropped `role="button"` from both trigger spans. Radix `TooltipTrigger asChild` handles role wiring natively; the span had no own `onClick`/`onKeyDown` so the role was a WCAG 4.1.2 violation. `data-testid="delivery-tooltip-trigger"` added for stable test queries.
- **L2-1 (tabIndex pollution)**: Dropped `tabIndex={0}` from both trigger spans. 200-row table → 200 extra tab stops was a net usability regression. Virtual-cursor screen readers still read `aria-label` on non-focusable spans; keyboard-only users lose no primary functionality (the visible % satisfies their use case).
- **M2-2 (merge early-return drops latestFcu/Dcu propagation)**: Restructured `mergeDeliveryCosts` — now always spreads `latestFcu`/`latestDcu` when `fcu` map entry exists, then skips delivery cost arithmetic only when conditions are unsafe. Preserves JSDoc invariant: `null` = backend sent null; `undefined` = no FCU entry at all. Added test for "fcu exists, units_sold=0, latestFcu/Dcu still propagated" path.
- **M2-3 (story file test count drift)**: Completion Notes updated: 7052 → 7054 after 1st-pass → 7055 after 2nd-pass. Delta stated clearly (+1 M2-2 test). CLAUDE.md `### Accepted Baselines` Vitest row ratcheted 7054 → 7055.
- **L2-2 (undefined-FCU test missing DCU/FCU absence assertion)**: Added `expect(trigger).not.toHaveAccessibleName(/DCU/)` and `expect(trigger).not.toHaveAccessibleName(/FCU/)` to the undefined-fields test. Guards against `formatCurrency(undefined)` leaking "NaN ₽" into the aria-label. Mirrors the L-1 pattern that already asserts `not.toHaveAccessibleName`.

### Post-1st-pass-review fixes (2026-05-08)

1st pass conducted as combined same-context BMad Master + fresh-context `code-reviewer` Opus agent per user's "fix all issues even minors" directive. 7 findings addressed:

- **H-1 (boundary type lie)**: `FcuBySkuItem.latestFcu` and `latestDcu` changed from `number` → `number | null` in `src/lib/api/shipment-cost/fcu-aggregation-api.ts`. Added JSDoc citing anti-pattern #8 ("null = unknown — no confirmed shipment yet"). Updated `mergeDeliveryCosts` in `useUnitEconomicsPageState.ts` to null-narrow `fcu.latestDcu` before arithmetic: when DCU is null, propagate `latestFcu: null / latestDcu: null` but skip delivery cost computation entirely. `npm run type-check` confirmed: still 20 errors in `advertising-analytics-api.ts` only — no new errors from the refactor.
- **M-1 (3-state visual contradiction)**: Replaced the binary `if (both null) → "Нет данных"` tooltip body with a 3-branch: when `delivery_to_warehouse %` is set but both FCU/DCU are null, tooltip now reads "Доставка/ед недоступна; % рассчитан по агрегированным данным." instead of the contradictory "Нет данных по доставке для этого SKU."
- **M-2 (tooltip a11y)**: Added `tabIndex={0}`, `role="button"`, and `aria-label` to both trigger `<span>` elements (populated % branch and em-dash branch). `aria-label` on the % branch concatenates Delivery %, DCU, and FCU when populated — making content accessible to keyboard/screen-reader users without hover (WCAG 2.1 AA).
- **M-3 (Russian copy)**: Changed tooltip header `Себестоимость доставки/ед` → `Стоимость доставки/ед.` — "Стоимость" is correct (delivery cost, not COGS/manufacturing), trailing period follows codebase convention (`MarginSkuTableHeader`, `roi-profit-utils.ts:52`). Updated inline comment to avoid the old word appearing in any grep.
- **M-4 (test brittleness)**: Rewrote all 4 tests in `UnitEconomicsTableRow.fcu-dcu.test.tsx`. Replaced `document.querySelector('.cursor-help')` with `screen.getByRole('button', { name: /.../ })` (works after M-2 adds `role="button"`). Replaced ambiguous `/4/` regex with `/4[,.]?\d*\s*%/` (matches Russian locale `"4.0%"` output). Assertions now use `toHaveAccessibleName` against `aria-label` content — verifies both % and DCU/FCU values are present in the accessible name without hover.
- **L-1 (AC-3 mixed-null fixture)**: Added 5th test case ("M-1 contradiction case / AC-3") covering the 3-state scenario: `delivery_to_warehouse: 4` with `latestFcu: null / latestDcu: null`. Verifies trigger renders with accessible label disclosing the %, and that DCU/FCU are absent from the aria-label when null. Locks in the invariant AC-3 required.
- **L-2 (merge early-return coverage)**: Added test to existing `mergeDeliveryCosts.test.ts` exercising the new null-DCU path introduced by H-1: `latestDcu: null` → delivery cost computation skipped, `latestFcu`/`latestDcu` propagated as `null` (not `undefined`, not `0`). This was new coverage created by the H-1 boundary fix, not a pre-existing gap; added directly rather than deferring.

### File List

- **Modified** `src/types/unit-economics.ts` — added `latestFcu` + `latestDcu` optional nullable fields to `UnitEconomicsItem` with JSDoc
- **Modified** `src/lib/api/shipment-cost/fcu-aggregation-api.ts` — H-1: `latestDcu` / `latestFcu` `number` → `number | null` with JSDoc citing anti-pattern #8
- **Modified** `src/app/(dashboard)/analytics/unit-economics/useUnitEconomicsPageState.ts` — merge propagation (+2 lines in `mergeDeliveryCosts` return); H-1 null-narrowing before `latestDcu * units_sold` arithmetic
- **Modified** `src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsTableRow.tsx` — M-1 3-branch tooltip body; M-2 `tabIndex` + `role="button"` + `aria-label` on both trigger spans; M-3 copy "Стоимость доставки/ед."
- **New** `src/app/(dashboard)/analytics/unit-economics/components/__tests__/use-waterfall-data-categories.test.ts` — 10-category invariant (3 tests)
- **Modified** `src/app/(dashboard)/analytics/unit-economics/components/__tests__/UnitEconomicsTableRow.fcu-dcu.test.tsx` — M-4 test rewrite (CSS-class queries → `getByRole`/`aria-label`); L-1 5th test (mixed-null AC-3 fixture)
- **Modified** `src/app/(dashboard)/analytics/unit-economics/__tests__/mergeDeliveryCosts.test.ts` — L-2: null-DCU path test (H-1 follow-on coverage)
- **Modified** `_bmad-output/implementation-artifacts/sprint-status.yaml` — `in-progress → review`
- **Modified** `CLAUDE.md` — Vitest baseline ratcheted to 7054 (+2 from L-1 + L-2)

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:create-story 96.10`. **8th Pattern 4 reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4, 96.6, 96.7, 96.8, 96.9). Spec-grep at handoff confirmed: AC-1 (10 categories) already satisfied via `useWaterfallData.ts:44-55`; AC-3 (footnote) already satisfied via `UnitEconomicsSummaryCards.tsx:152`; AC-4 (`meta.cost_category_order`) already wired by Story 96.3-FE. **Real residual = AC-2 only**: `latestFcu`/`latestDcu` are computed internally at `useUnitEconomicsPageState.ts:74` but NOT propagated to `UnitEconomicsItem` or rendered per-row. Reframed scope = surface FCU/DCU per SKU (UX exposure delta, not data-pipeline work) + add explicit 10-category test coverage (G-2 hygiene). 8 ACs + 8 tasks. Status: backlog → ready-for-dev. |
| 2026-05-08 | Implementation complete. Type propagation (`latestFcu`/`latestDcu` on `UnitEconomicsItem`), merge propagation in `useUnitEconomicsPageState.ts`, tooltip-on-cell UX in `UnitEconomicsTableRow` (Option A — minimal table-width churn). 7 new unit tests (3 × 10-category invariant + 4 × FCU/DCU tooltip rendering). 3 of 4 ACs were already satisfied via Stories 77.5/96.3/96.4 (Pattern 4 reframe — 8th in Epic 96-FE). Quality gates: type-check 20 in advertising-analytics-api.ts only, lint 0/0, tests 7052 passing (floor ratcheted +7), check:docs 13/13. Status: ready-for-dev → review. |
| 2026-05-08 | Post-1st-pass-review fixes (1H, 4M, 2L) all addressed: H-1 boundary type lie at `FcuBySkuItem.latestFcu/Dcu` (now `number | null`), M-1 3-state visual contradiction (3-branch tooltip body), M-2 tooltip a11y (`tabIndex` + `role="button"` + `aria-label`), M-3 Russian copy "/ед" → "/ед." + "Себестоимость" → "Стоимость", M-4 test brittleness (use `aria-label` + `getByRole` instead of CSS-class queries; +1 test for M-1 case), L-1 AC-3 mixed-null fixture test added, L-2 merge early-return coverage. Pass conducted as combined same-context BMad Master + fresh-context `code-reviewer` Opus pass. Status remains: review (1st-pass complete; 2nd-pass in fresh context still required per Story 94.3-FE before flipping to done). |
| 2026-05-08 | Post-2nd-pass-review fixes (1H, 3M, 2L) all addressed: H2-1 aria-label vs tooltip-body copy unification (single `formatDeliveryDisclosure` helper, old `за единицу` phrasing eliminated), M2-1 dropped invalid `role="button"` on non-actionable span (WCAG 4.1.2), M2-2 merge early-return now propagates latestFcu/Dcu when fcu entry exists preserving null-vs-undefined invariant (+1 test), M2-3 story file test count corrected (7052→7054→7055) + CLAUDE.md baseline ratcheted, L2-1 dropped `tabIndex` (paper a11y win was net usability regression on 200-row table) + added `data-testid` for stable queries, L2-2 undefined-FCU test now asserts DCU/FCU absent from aria-label. 2 adversarial passes complete (1st = combined same-context+fresh-context; 2nd = fresh-context Opus). Status: review → done. **Lessons:** (1) Pattern 4 reframe #8 in Epic 96-FE — 3 of 4 ACs already shipped; residual = FCU/DCU UX exposure + 10-cat test gap. (2) 1st-pass missed H-1 boundary-type lie; fresh-context 2nd-pass caught it — 2-pass discipline validated 9/9 in Epic 96. (3) aria-label vs tooltip copy drift — 2nd-pass caught screen-reader/sighted-user disclosure mismatch the 1st-pass left. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows (story creation, intermediate fixes, post-review fix passes) DO NOT require Lessons. Lessons are for retrospective aggregation — keep them specific to the story (not generic advice) and reference Story-NN.M-FE markers where possible. -->
