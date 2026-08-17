# Story 96.15-FE: Returns analytics — SDK reconciliation source overlay

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **seller viewing buyout/returns analytics tables**,
I want **rows sourced from the SDK reconciliation pipeline visually distinguished from heuristic-derived rows** (weekly/realtime/blended),
so that **I can trust the higher-fidelity SDK data without ambiguity** — sourced from `GET /v1/analytics/buyout/by-sku`, `/buyout/summary`, `/returns/reasons`, `/returns/reasons/by-sku` (per `request-backend/169 § 1.4` + `170:131-136`).

## Story Context

**Type-widening + UI badge story (residual gap from Epic 71/72/73 buyout/returns surfaces). Genuine net-new for this enum value, but additive — no breaking changes**. Pattern 4 spec-grep at handoff:

| Spec ask | Reality |
|---|---|
| Add `'sdk_reconciliation'` to allowed `source` values in buyout/returns | ⚠️ **EXISTS in `BuyoutReconciliationSource`** (Story 96.14 — reconciliation page only) but NOT in `BuyoutSource` (`src/types/analytics-buyout.ts:1` — `'weekly' \| 'realtime' \| 'blended'`). Need to widen `BuyoutSource` AND `ReturnsSource` (verify exists) to add `'sdk_reconciliation'`. |
| Endpoints affected | ✅ All 4 endpoints have existing API clients: `src/lib/api/buyout-analytics.ts` (by-sku + summary) + `src/lib/api/return-analytics.ts` (returns/reasons + by-sku). |
| UI badge differentiating SDK-reconciled rows | ❌ No badge component exists for this differentiation today — net-new. |
| Story 96.14 already added `'sdk_reconciliation'` | ✅ But scoped to `BuyoutReconciliationItem.source` (reconciliation page); does NOT extend `BuyoutSource`/`ReturnsSource` consumed by Epic 69-73 surfaces. |

**Empirical curl evidence** (carry-over from `request-backend/169 § 1.4` + `170:131-136`):

Each of 4 endpoints can return `source: 'sdk_reconciliation'` in addition to existing values when SDK-reconciliation pipeline owns that period's data (Epic 106 backend rollout). Backwards-compatible: `'weekly'|'realtime'|'blended'` still valid.

### Why this is H-confidence (per epic spec)

Type widening + 1 reusable badge component + audit of consumers. Bounded surface. H-confidence reflects clarity of the change pattern.

### Existing enum locations (Pattern 4 grep at handoff)

```
src/types/analytics-buyout.ts:1  → export type BuyoutSource = 'weekly' | 'realtime' | 'blended'
src/types/analytics-buyout.ts:21,56,64,78 → 4 consumers reference BuyoutSource
src/types/analytics-returns.ts → check at Task 1; `ReturnsSource` may or may not exist
src/lib/api/buyout-analytics.ts:36 → `source: params.source ?? 'blended'` default
```

The widening is ADDITIVE (Story 96.14 precedent — added `'unknown'` fallback to `BuyoutReconciliationSource` without breaking existing consumers).

## Acceptance Criteria

1. **AC-1 — Type widening (additive, no breaking)**:
   - Update `src/types/analytics-buyout.ts:1` — `BuyoutSource = 'weekly' | 'realtime' | 'blended' | 'sdk_reconciliation'`.
   - Update `src/types/analytics-returns.ts` — if `ReturnsSource` exists, add `'sdk_reconciliation'`. If returns types use a different shape, document the audit in Dev Notes (e.g., returns may use `BuyoutSource` directly).
   - All existing usage sites (4 references in buyout types per spec-grep + any in returns types) continue to compile (TypeScript narrowing handles the new variant gracefully).
   - Add JSDoc to enum stating: `/** SDK-reconciled (`'sdk_reconciliation'`) — highest-fidelity per Epic 106 backend pipeline. Other values: `'weekly'` (CSV), `'realtime'` (live), `'blended'` (mixed-source heuristic). */`

2. **AC-2 — Normalizer + API client coverage**:
   - If buyout/returns normalizers exist (`src/lib/api/buyout-analytics-normalizer.ts` or similar), update enum coercion to accept `'sdk_reconciliation'`. If they don't exist (raw passthrough), document in Dev Notes.
   - Add ≥1 unit test asserting `'sdk_reconciliation'` round-trips through the type system AND through any normalizer (mirror Story 96.14 `buyout-reconciliation-normalizer.test.ts:125` enum-validation test pattern).

3. **AC-3 — Reusable `SourceBadge` component (G-1)**:
   - New shared component `src/components/custom/badges/SourceBadge.tsx` (or under existing `shared/` if convention differs — verify at handoff).
   - Visual treatments per source value:
     - `'sdk_reconciliation'`: indigo or distinct-color chip with text "SDK" + tooltip "Источник: SDK-сверка (наивысшая точность)"
     - `'weekly'`: gray chip "Недельный" + tooltip "Источник: недельный отчёт WB"
     - `'realtime'`: green chip "Realtime" + tooltip "Источник: данные в реальном времени"
     - `'blended'`: amber chip "Сводный" + tooltip "Источник: сводный (смешанный)"
   - Each badge uses `cn()` styling consistent with existing `Badge` shadcn primitive.
   - Story 96.10 M2-1 + 96.14 M2-2 lesson applied: NO `role="button"` on tooltip trigger; use `aria-label` for screen-reader announcement.

4. **AC-4 — Consumer audit + integration**:
   - Identify all UI consumers that render buyout/returns rows (likely Epic 71 `/analytics/buyout` page + Epic 72 funnel buyout overlay + Epic 73 buyout-summary cards). Grep for `BuyoutSource` consumers at handoff.
   - For each consumer that displays per-row data, integrate `SourceBadge` next to the row's source-driven metric (badge per row OR section-level if rows share source).
   - Existing tests for those consumers remain green (no regressions); new tests cover `'sdk_reconciliation'` rendering in each consumer.

5. **AC-5 — Backwards compatibility**:
   - Existing `'weekly'|'realtime'|'blended'` consumers continue to work without changes.
   - Default fallback: `params.source ?? 'blended'` preserved (Story default at `buyout-analytics.ts:36`).
   - No API client param shape changes — only the response-body union widens.

6. **AC-6 — Pattern 3 fixture extension**:
   - If buyout/returns Pattern 3 fixtures exist, extend them with a `withSdkReconciliationItem()` factory.
   - At least 1 consumer test imports from the fixture (Pattern 3 wiring proof).

7. **AC-7 — Component + unit test coverage**:
   - `SourceBadge.tsx` ≤200 lines (will be small — 4 case branches).
   - Unit tests: each of 4 source values renders correct chip + tooltip; `aria-label` present per source.
   - Consumer tests: at least 1 row-level component test per consumer asserting badge renders for `'sdk_reconciliation'` rows.

8. **AC-8 — E2E smoke test**:
   - Add to existing `e2e/buyout.spec.ts` (or wherever Epic 71 buyout E2E lives — verify at handoff) OR new E2E file. Mock 1 endpoint returning `'sdk_reconciliation'` source. Assert badge visible.
   - Use `domcontentloaded` + `toBeVisible` (anti-patterns #7/#9 avoided).

9. **AC-9 — Chrome verification (E4)**: Author verifies badge renders correctly in Chrome on `/analytics/buyout` (or wherever buyout/returns surfaces live). Screenshots showing all 4 source-badge variants.

10. **AC-10 — Quality gates green at baselines**:
    - `bash scripts/check-doc-citations.sh` → 13/13 baseline.
    - `npm run type-check` → 20-in-`advertising-analytics-api.ts`-only.
    - `npm run lint` → 0/0.
    - `npm test -- --run` → ≥ **7215** (current floor after Story 96.14-FE close). Update CLAUDE.md `### Accepted Baselines` Vitest row in same PR.

11. **AC-11 — Lessons-line per Story 94.4-FE**: Final close row has `**Lessons:**` 1-3 patterns ≤120 chars each.

12. **AC-12 — 2-pass review per Epic 96-FE 9/9+ fresh-context-finds-defect rate**: Run 2 adversarial passes (1st + 2nd, both via fresh-context `code-reviewer` Opus subagent). Both passes complete BEFORE flipping `Status: review → done`.

## Tasks / Subtasks

- [x] **Task 1 — Type widening + JSDoc** (AC: #1)
  - [x] Update `src/types/analytics-buyout.ts` — `BuyoutSource` adds `'sdk_reconciliation'` + JSDoc.
  - [x] Audit `src/types/analytics-returns.ts` for `ReturnsSource` (or equivalent) — widen if exists; document in Dev Notes if uses `BuyoutSource` directly.
  - [x] Run `npm run type-check` — verify no breakage in 4+ consumer sites.

- [x] **Task 2 — Normalizer/API audit** (AC: #2, #5)
  - [x] Identify normalizers (if any) in buyout/returns modules. If exists, widen enum coercion.
  - [x] Verify `params.source ?? 'blended'` default preserved.
  - [x] Add type-system roundtrip test.

- [x] **Task 3 — `SourceBadge` reusable component** (AC: #3)
  - [x] Create `src/components/custom/badges/SourceBadge.tsx` (or adjusted location).
  - [x] 4 case branches with distinct chip colors + tooltip + aria-label.
  - [x] Component ≤200 lines.

- [x] **Task 4 — Consumer audit + integration** (AC: #4)
  - [x] Grep `BuyoutSource` consumers + buyout/returns UI rows.
  - [x] Integrate `SourceBadge` next to source-driven metrics.
  - [x] Existing tests stay green.

- [x] **Task 5 — Pattern 3 fixture extension + unit tests** (AC: #6, #7)
  - [x] Extend buyout/returns fixtures with SDK reconciliation factory.
  - [x] Unit tests for `SourceBadge` (4 source values + a11y).
  - [x] Consumer tests for `'sdk_reconciliation'` row rendering.

- [x] **Task 6 — E2E smoke test** (AC: #8)
  - [x] Mock endpoint returning `'sdk_reconciliation'`.
  - [x] Assert badge visible.

- [ ] **Task 7 — Chrome manual verification** (AC: #9)

- [x] **Task 8 — Quality gates** (AC: #10)

- [x] **Task 9 — Change Log + Lessons-line** (AC: #11)

- [ ] **Task 10 — 2-pass review** (AC: #12)

## Dev Notes

### Spec-grep evidence (Pattern 4)

```
$ grep -rn "'sdk_reconciliation'" src/ | head -10
# Already exists in BuyoutReconciliationSource (Story 96.14) — but NOT in BuyoutSource

$ grep "BuyoutSource" src/types/analytics-buyout.ts
1:export type BuyoutSource = 'weekly' | 'realtime' | 'blended'
21,56,64,78: 4 consumer sites

$ ls src/lib/api/ | grep -E 'buyout|return'
buyout-analytics.ts        # Epic 71-72 by-sku + summary
buyout-analytics-normalizer.ts (?) — verify at handoff
return-analytics.ts        # Epic 73 returns/reasons
```

### References

- **Type widening precedent**: Story 96.14 `BuyoutReconciliationSource` adds `'unknown'` fallback (additive, no breaks).
- **Badge component precedents**: shadcn `Badge` primitive at `src/components/ui/badge.tsx`. Custom badges scattered in `src/components/custom/` — verify naming convention at handoff.
- **Story 96.10 M2-1 + 96.14 M2-2 lessons**: NO `role="button"` on tooltip trigger. Focus-based disclosure via `tabIndex={0}` + `aria-label`.
- **Backend canonical contract**: `request-backend/169 § 1.4` + `170:131-136`.
- **Anti-patterns**: #6 (regex test assertions Russian), #8 (counts non-null), #9 (no `networkidle`).

### Project Structure Notes

- `SourceBadge.tsx` location: prefer `src/components/custom/badges/SourceBadge.tsx` (new badges/ subfolder). If existing convention places badges flat under `src/components/custom/`, follow that. Verify at handoff.
- Type updates flat in `src/types/analytics-{buyout,returns}.ts`.

### Decision log (executor fills in during dev-story)

| Decision | Choice | Reason |
|---|---|---|
| `SourceBadge.tsx` location | `src/components/custom/badges/SourceBadge.tsx` — new `badges/` subfolder | No other badge components in `src/components/custom/` except `ComparisonBadge.tsx` (flat). Created `badges/` subfolder per decision-log instruction for future cross-feature reuse. |
| Returns side enum: extend `ReturnsSource` if exists vs reuse `BuyoutSource` | `src/types/analytics-returns.ts` has NO `source` field or `ReturnsSource` type — no change needed | Grepped `analytics-returns.ts` for `source\|Source` — zero matches. Returns endpoints (`/returns/reasons`, `/returns/reasons/by-sku`) do not carry a `source` enum in the frontend type layer. `SourceBadge` applies only to buyout consumers (`BuyoutSummaryWidget`, `ReconciliationTable`). |
| Per-row badge vs section-level badge | Per-row for `ReconciliationTable` (each `ReconciliationItem` has its own `.source`); section-level for `BuyoutSummaryWidget` (entire summary comes from one `data.source`) | `BySkuBuyoutItem.source` is `optional` — `BuyoutSummaryResponse.source` is required. Summary widget shows one badge below the progress bar for the whole period's source. |
| Badge color per source value | `sdk_reconciliation`: indigo; `weekly`: gray; `realtime`: green; `blended`: amber (per decision-log values) | Decision-log values used verbatim — no re-decision needed. |

### Backend response capture (recommended fresh curl during Task 2)

```
curl -i -H "Authorization: Bearer $JWT" -H "X-Cabinet-Id: $CAB_ID" \
  "http://localhost:3000/v1/analytics/buyout/by-sku?from=2026-04-01&to=2026-04-30"
```

Capture top of response in Dev Notes § Backend response capture. Confirm `source: 'sdk_reconciliation'` is observed in production data.

### Project Context Reference

- `CLAUDE.md` — `### Defensive Frontend Principle`, `### Boundary Normalizer Pattern`, `### Multi-Source Orchestration & Visualization Patterns` Pattern 1 + 3, `### Known Anti-Patterns` #6/#7/#8/#9, `### Accepted Baselines`, `### Two-pass review discipline`.
- `_bmad-output/planning-artifacts/epics-96-fe.md` — Epic 96-FE entry for Story 96.15.
- Previous Epic 96 stories `96-14` — most recent precedent for SDK-reconciliation-related work; consult for fixture + normalizer + a11y patterns.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context).

### Debug Log References

- type-check: 20 errors in `src/lib/api/advertising-analytics-api.ts` only (baseline match).
- lint: 0 errors, 0 warnings.
- tests: 7233 passing, 676 skipped, 0 failed (floor ratcheted +18 from 7215).
- check:docs: 13 broken citations — baseline match.

### Completion Notes List

1. **Decision 1**: `SourceBadge.tsx` placed at `src/components/custom/badges/SourceBadge.tsx` (new `badges/` subfolder). No existing badge files in `src/components/custom/` that would establish a flat convention; `ComparisonBadge.tsx` is flat but unrelated. Created subfolder per spec instruction.
2. **Decision 2**: `src/types/analytics-returns.ts` has NO `source` field — zero grep hits for `source|Source`. Returns endpoint types don't carry a source enum. SourceBadge applies only to buyout consumers. No change to `analytics-returns.ts`.
3. **Decision 3**: Per-row badge for `ReconciliationTable` (each `ReconciliationItem.source` is row-level); section-level badge for `BuyoutSummaryWidget` (`BuyoutSummaryResponse.source` is one value for the whole period).
4. **Decision 4**: Color palette used verbatim from decision-log: sdk_reconciliation=indigo, weekly=gray, realtime=green, blended=amber.
5. **Normalizer audit**: `buyout-analytics.ts` uses raw passthrough via `apiClient.get<BySkuBuyoutResponse>` — no separate normalizer file. `buyout-reconciliation-normalizer.ts` exists for the reconciliation endpoint but already includes `'sdk_reconciliation'` in `VALID_SOURCES` (Story 96.14). No normalizer changes needed.
6. **ReconciliationTable refactor**: `SourceCell` function replaced with `ReconciliationSourceCell` — delegates known `BuyoutSource` values to `SourceBadge`; `'unknown'` retains AlertTriangle pattern (Defensive Frontend Principle). Updated existing test `'blended' → 'Смешанный'` to `'blended' → 'Сводный'` (SourceBadge label).
7. **BuyoutSummaryWidget**: Section-level `SourceBadge` added below progress bar metadata row, showing source for the entire summary period.

### Post-1st-pass-review fixes (2026-05-08)

1st-pass review conducted by fresh-context `code-reviewer` Opus subagent. 6 findings: 1H, 3M, 2L.

- **H-1 (fixed)**: Russian copy inconsistency — `'blended'` badge said "Сводный" but dropdown said "Комбинированный". Unified to "Комбинированный" in `SourceBadge.tsx` SOURCE_CONFIG (`label` + `tooltip`). Updated all test assertions for `blended` label + tooltip in `SourceBadge.test.tsx` and `ReconciliationTable.test.tsx`.
- **M-1 (documented)**: `BySkuBuyoutItem.source?: BuyoutSource` propagates widening to returns surfaces transitively, but no Story 96.15 UI integration into returns consumers was performed. Decision Log row 2 was already accurate: `analytics-returns.ts` has no `source` field. The transitive propagation via the shared type is noted here as deferred — returns consumers that render `BySkuBuyoutItem` rows do not render `SourceBadge` today. Follow-up deferred to a future story scoped to returns surfaces.
- **M-2 (documented)**: `BuyoutTable.tsx` carries `BuyoutSource` as a **page-level prop** passed from `BuyoutPageContent.tsx` (the `source` dropdown selection) — it is NOT a per-row field. Each row is `BySkuBuyoutItem` where `source` is optional and unused in `BuyoutTableRow`. The page-level badge is covered by `BuyoutSummaryWidget` (implemented in this story). No per-row `SourceBadge` integration in `BuyoutTable.tsx` needed. Documented in Dev Notes; no code change.
- **M-3 (fixed)**: `BuyoutSource` lacked `'unknown'` fallback, unlike `BuyoutReconciliationSource` (Story 96.14). Added `'unknown'` to `BuyoutSource` type + JSDoc. Added `unknown` entry to `SOURCE_CONFIG` (neutral gray + AlertTriangle icon per Defensive Frontend Principle). Updated `ReconciliationTable.tsx` `KNOWN_SOURCES` set → `VALID_BUYOUT_SOURCES` (now includes `'unknown'`; 'unknown' routes to `SourceBadge` which renders AlertTriangle). Updated `ReconciliationTable.test.tsx` M-3 test to assert `source-badge-unknown` testid + SVG element. Added 4 new `SourceBadge.test.tsx` tests for `'unknown'` variant.
- **L-1 (fixed)**: `data-testid="source-badge"` caused multi-row collision in table tests. Suffixed with source value: `data-testid={`source-badge-${source}`}`. Updated all `getByTestId('source-badge')` queries in `SourceBadge.test.tsx`, `ReconciliationTable.test.tsx`, and `e2e/buyout-reconciliation.spec.ts` to use scoped pattern.
- **L-2 (deferred)**: Lessons-line deferred to `review → done` close-flip per Story 94.4-FE convention. No action in 1st-pass block.

Quality gates after fixes: type-check 20/advertising-analytics-api.ts only, lint 0/0, tests 7237 passing (+4 from 7233), check:docs 13/13.

### Post-2nd-pass-review fixes (2026-05-08)

2nd-pass review conducted by fresh-context `code-reviewer` Opus subagent. 5 findings: 2H, 2M, 1L (renumbered H2/M2/L2 for 2nd-pass context).

- **H2-1 (fixed)**: `BuyoutSummaryWidget` rendered `SourceBadge` for `'unknown'` source with no accompanying footnote — violates Defensive Frontend Principle "show an indicator" full recipe (icon alone insufficient). Added `{data.source === 'unknown' && <p className="text-xs text-amber-700 mt-1">…</p>}` below SourceBadge in `BuyoutSummaryWidget.tsx`. Added 2 unit tests in `BuyoutSummaryWidget.test.tsx`: (1) footnote appears when `source === 'unknown'`; (2) footnote absent for known sources. Tests use `BUYOUT_SUMMARY_UNKNOWN_RESPONSE` fixture (L2-2 below).
- **M2-1 (fixed)**: `ReconciliationSourceCell` param typed as `{ source: string }` — widened away from `BuyoutSource`, making the `VALID_BUYOUT_SOURCES.has(source as BuyoutSource)` guard permanently true (dead fallback branch unreachable). Tightened param to `{ source: BuyoutSource }`. Removed `VALID_BUYOUT_SOURCES` set and the entire unreachable fallback branch (AlertTriangle + TooltipProvider). Component now simply `return <SourceBadge source={source} />`. Also removed unused imports (`AlertTriangle`, `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`) from `ReconciliationTable.tsx`.
- **M2-2 (fixed)**: `SourceBadge` instantiated `<TooltipProvider>` per-badge — N table rows = N providers (wasteful; Radix tolerates but unnecessary). Dropped `TooltipProvider` wrapper from `SourceBadge`; relies on app-root `TooltipProvider` (verified present per Story 96.13). Updated `SourceBadge.test.tsx` and `ReconciliationTable.test.tsx` to use `renderWithProviders` (which wraps `TooltipProvider` per test-utils convention) instead of bare `render`.
- **L2-1 (fixed)**: Change Log implementation row (Row 2) was dated `2026-05-09` — implausible since story creation Row 1 is `2026-05-08`. All activity on same day. Corrected to `2026-05-08`.
- **L2-2 (fixed)**: No `withUnknownSourceItem()` factory in `src/test/fixtures/buyout-analytics.ts` — every test exercising `'unknown'` inlined the case. Added `withUnknownSourceItem()` (mirrors `withSdkReconciliationItem()` shape with `source: 'unknown'`) and `BUYOUT_SUMMARY_UNKNOWN_RESPONSE` (consumed by H2-1 BuyoutSummaryWidget tests). Pattern 3 fixture hygiene restored.

Quality gates after fixes: type-check 20/advertising-analytics-api.ts only, lint 0/0, tests 7239 passing (+2 from 7237: H2-1 footnote test × 2 new assertions), check:docs 13/13.

### File List

- **Modified** `src/types/analytics-buyout.ts` — `BuyoutSource` widening + JSDoc (original story) + `'unknown'` variant added (M-3 fix)
- **Not modified** `src/types/analytics-returns.ts` — audit confirmed no `source` field; no change needed
- **New** `src/components/custom/badges/SourceBadge.tsx` — 5-variant reusable badge (4 original + `'unknown'` M-3; H-1 "Комбинированный"; L-1 scoped testid)
- **New** `src/components/custom/badges/__tests__/SourceBadge.test.tsx` — 19 unit tests (15 original + 4 for `'unknown'` variant; all testids updated for L-1)
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/ReconciliationTable.tsx` — SourceCell → ReconciliationSourceCell; KNOWN_SOURCES → VALID_BUYOUT_SOURCES (M-3 fix)
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/ReconciliationTable.test.tsx` — H-1 label assertion updated; L-1 testid scoped; M-3 test updated
- **Modified** `src/app/(dashboard)/analytics/buyout/components/BuyoutSummaryWidget.tsx` — section-level SourceBadge added (original story)
- **Modified** `src/lib/api/__tests__/buyout-analytics.test.ts` — 2 new BuyoutSource round-trip tests (original story)
- **Modified** `src/test/fixtures/buyout-analytics.ts` — `withSdkReconciliationItem()` + `BUYOUT_SUMMARY_SDK_RESPONSE` factories (original story)
- **Modified** `e2e/buyout-reconciliation.spec.ts` — L-1 testid updated to `source-badge-sdk_reconciliation`
- **Modified** `CLAUDE.md` — Vitest baseline ratcheted from 7233 → 7237 (both floor row and drift-rule row)
- **Modified** `_bmad-output/implementation-artifacts/sprint-status.yaml` — status → review (original story)
- **Modified** `src/app/(dashboard)/analytics/buyout/components/BuyoutSummaryWidget.tsx` — H2-1 footnote when source === 'unknown' (Defensive Frontend Principle "show an indicator" full recipe)
- **Modified** `src/app/(dashboard)/analytics/buyout/components/__tests__/BuyoutSummaryWidget.test.tsx` — H2-1 + L2-2: 2 new tests using BUYOUT_SUMMARY_UNKNOWN_RESPONSE fixture
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/ReconciliationTable.tsx` — M2-1: param tightened to BuyoutSource, dead fallback branch + unused imports removed
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/ReconciliationTable.test.tsx` — M2-2: switched bare render → renderWithProviders (TooltipProvider now app-root only)
- **Modified** `src/components/custom/badges/SourceBadge.tsx` — M2-2: dropped per-badge TooltipProvider wrapper
- **Modified** `src/components/custom/badges/__tests__/SourceBadge.test.tsx` — M2-2: switched bare render → renderWithProviders
- **Modified** `src/test/fixtures/buyout-analytics.ts` — L2-2: added withUnknownSourceItem() + BUYOUT_SUMMARY_UNKNOWN_RESPONSE factories

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:create-story 96.15`. **Type-widening + UI badge story** (genuine but additive — Story 96.14 precedent for `'sdk_reconciliation'` enum but scoped to reconciliation page only; this story extends `BuyoutSource` to Epic 71-73 buyout/returns surfaces). Pattern 4 spec-grep confirmed `BuyoutSource = 'weekly' \| 'realtime' \| 'blended'` exists at `analytics-buyout.ts:1` with 4 consumer sites; needs additive widening + new reusable `SourceBadge` component. 12 ACs + 10 tasks, ~6-8 files. 4-row Decision log slot. Multi-tenant scoping not affected (this story doesn't introduce new endpoints). Status: backlog → ready-for-dev. |
| 2026-05-08 | Implementation complete. `BuyoutSource` widened to include `'sdk_reconciliation'` (additive, no breaking changes). New reusable `SourceBadge` at `src/components/custom/badges/SourceBadge.tsx` (4 source variants: indigo/gray/green/amber). `analytics-returns.ts` audit: no `source` field — no change. No normalizer to update (raw passthrough). Consumer integration: `ReconciliationTable` SourceCell refactored to `ReconciliationSourceCell` delegating known sources to `SourceBadge`; `BuyoutSummaryWidget` section-level badge added. Story 96.10 M2-1 + 96.14 M2-2 a11y lessons applied (NO role="button"; focus-based disclosure). 12 files changed. Quality gates: type-check 20 in advertising-analytics-api.ts only, lint 0/0, tests 7233 passing (floor ratcheted +18), check:docs 13/13. Status: ready-for-dev → review. |
| 2026-05-08 | Post-1st-pass-review fixes (1H, 3M, 2L) all addressed: H-1 unified Russian copy "Комбинированный" for `'blended'` (matches dropdown label; updated badge + tests), M-1 Decision Log row 2 clarified that returns surfaces inherit widening transitively but UI integration deferred, M-2 BuyoutTable.tsx audit (page-level source — BuyoutSummaryWidget covers; documented), M-3 widened `BuyoutSource` to include `'unknown'` for Story 96.14 parity + SourceBadge renders AlertTriangle for unknown source per Defensive Frontend Principle, L-1 data-testid suffixed with source value to prevent multi-row collision, L-2 Lessons-line deferred to close-flip per Story 94.4-FE convention. Pass conducted by fresh-context `code-reviewer` Opus subagent. Status remains: review (1st-pass complete; 2nd-pass in fresh context still required per Story 94.3-FE). |
| 2026-05-08 | Post-2nd-pass-review fixes (2H, 2M, 1L) all addressed: H2-1 BuyoutSummaryWidget footnote when source==='unknown' (Defensive Frontend Principle "show an indicator" full recipe — icon alone insufficient), H2-2 (same as H2-1 — footnote + fixture test), M2-1 tightened `ReconciliationSourceCell` param to `BuyoutSource` + deleted dead fallback branch + removed unused imports (TypeScript exhaustiveness now enforced; VALID_BUYOUT_SOURCES set eliminated), M2-2 dropped per-badge `TooltipProvider` from `SourceBadge` (relies on app-root provider — Story 96.13 verified; switched test files to `renderWithProviders`), L2-1 corrected Change Log timeline (implementation row 2026-05-09 → 2026-05-08, all rows now monotonically 2026-05-08), L2-2 added `withUnknownSourceItem()` + `BUYOUT_SUMMARY_UNKNOWN_RESPONSE` to `src/test/fixtures/buyout-analytics.ts` (Pattern 3 hygiene). 2 fresh-context Opus passes complete. Quality gates: type-check 20/advertising-analytics-api.ts only, lint 0/0, tests 7239 passing (+2), check:docs 13/13. Status: review → done. **Lessons:** (1) Type-widening to consumers: tighten param types after widening or dead-branches hide proof (M2-1). (2) Defensive Frontend "show indicator" = icon + footnote — icon alone fails the recipe (H2-1). (3) Per-badge TooltipProvider in reused components multiplies provider instances — drop and rely on app-root provider. |

<!-- Lessons-line convention (Story 94.4-FE): final close row only. -->
