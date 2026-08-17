# Story 110.3: SKU-level accuracy table

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **AI-forecast operator analyzing per-SKU model accuracy**,
I want **a sortable per-SKU accuracy table at `/analytics/models/[id]/evaluations/sku-accuracy` (with per-SKU drill-down via `?nmId=`)**,
so that **I can identify high- and low-performing SKUs by AI MAPE, compare AI vs naive baseline accuracy, and decide which SKUs need model retraining or manual price overrides**.

## Acceptance Criteria

1. **Page renders at `/analytics/models/[id]/evaluations/sku-accuracy`** with breadcrumb back to evaluations list. Title: "Точность по SKU".
2. **Overview table (no `?nmId=` query)** lists all SKUs for the model with columns: `Артикул (nmId)`, `Vendor code`, `AI MAPE`, `Naive MAPE`, `AI accuracy %`, `Кол-во оценок (evaluationCount)`. Sortable by `avgAiMape` (default ASC), `avgNaiveMape`, `aiAccuracyPercent` (click-to-toggle); WAI-ARIA `aria-sort` on `<TableHead>` matches Story 110.2-FE pattern.
3. **Detail view (`?nmId=N` query present)** shows: SKU header (`Артикул N — vendorCode`), aggregate stats card (avgAiMape, avgNaiveMape, aiAccuracyPercent — all AP#8-compliant), and a per-evaluation history table sorted by `evaluationDate` DESC. If `nmId` not found in response, render empty-state alert "SKU не найден" + back-link to overview.
4. **AP#8 compliance** — nullable money/percentage fields (`avgAiMape`, `avgNaiveMape`, `aiAccuracyPercent`, per-row `mapeUnits`, `naiveMape`) render `'—'` when null. Counts (`evaluationCount`, `predictedUnits`, `actualUnits`) allow semantic-zero `?? 0` per AP#8 Exceptions taxonomy.
5. **WCAG 2.1 AA** — sort buttons have `aria-label="Сортировать по <колонке>"` (action-only per Story 110.2 F-6 precedent); column `<TableHead>` uses `aria-sort="ascending"|"descending"|"none"`; row-click navigation has visible focus state.
6. **Cabinet-isolation** — `queryKey: ['ai', 'sku-accuracy', cabinetId, modelId, nmId]`. Cabinet-isolation runtime test uses single shared `QueryClient` across mounts (Story 110.2-FE F-4 precedent — NOT two fresh clients).
7. **Locale** — all percentages via `formatPercentage`, dates via `formatDate`, integers via `formatNumber` (Russian locale, comma decimal).
8. **Test coverage** ≥ 90% for new files: hook tests (success / loading / error / cabinet-isolation), overview table tests (sort reorder verification, AP#8 null rendering, aria-sort states), detail view tests (nmId routing, empty-state, history rendering).
9. **Pre-flight verification** — grep AC nouns confirmed: foundation already shipped via Stories 108.1 (types/normalizer/fetcher), 110.1 (route helper), 110.2 (row-click navigation). No duplicate work.
10. **2-pass adversarial review complete** before flipping `Status: review → done`.

## Tasks / Subtasks

- [x] **Task 1 — Extend `getSkuAccuracy` fetcher with `modelId` + optional `nmId` params** (AC: 1, 2, 3, 6) — `src/lib/api/ai/evaluations.ts`
  - [x] Change signature: `getSkuAccuracy(params: { modelId: string; nmId?: number; format?: 'json' | 'csv' })`.
  - [x] Append `?modelId=<id>&nmId=<n>` to URL via `URLSearchParams`.
  - [x] **Backend contract dependency** — current backend accepts NO `modelId` / `nmId` filters (see test-api/99-ai.http:77; cabinet-wide today). Filed `docs/request-backend/166-ai-sku-accuracy-modelid-nmid-filter.md` mirroring Story 110.2 F-1 pattern. Backend currently ignores params (cabinet-wide response) — documented with `PENDING BACKEND: #166` comment in fetcher.
  - [x] Added 4 URL-param test cases in `src/lib/api/ai/__tests__/evaluations.test.ts`.

- [x] **Task 2 — Extend types to surface fields shipped by backend but missing from normalizer** (AC: 3) — `src/types/ai/evaluations.ts`, `src/lib/api/ai/evaluations.ts`
  - [x] Added `naiveAccuracyPercent: number | null`, `evaluationCount: number` to `SkuAccuracyEntry` (per `test-api/99-ai.http:77`). Added `naiveBaseline: number | null` to `SkuAccuracyHistoryEntry` (units; per-history-entry, distinct from `naiveMape` which is the percentage error — 3rd-pass F-1 post-close fix). `naiveAccuracyPercent` is the SKU-aggregate accuracy field.
  - [x] Updated `normalizeSkuAccuracyEntry` — `?? null` for naiveAccuracyPercent, `?? 0` for evaluationCount (AP#8 SEMANTIC-ZERO exception, eslint-disable comment added).
  - [x] Added 4 normalizer tests for new fields (null preservation + value pass-through) in `evaluations.test.ts`.

- [x] **Task 3 — Create `useAiSkuAccuracy(modelId, nmId?)` hook** (AC: 1, 6) — `src/hooks/useAiSkuAccuracy.ts` + tests
  - [x] TanStack Query v5 wrapper around `getSkuAccuracy({ modelId, nmId })`.
  - [x] `enabled: !!cabinetId && !!modelId` (mirrors `useAiEvaluations`).
  - [x] `queryKey: ['ai', 'sku-accuracy', cabinetId, modelId, nmId ?? null]`.
  - [x] Tests in `src/hooks/__tests__/useAiSkuAccuracy.test.ts`: success, loading, error, cabinet-isolation (single shared `QueryClient` per Story 110.2 F-4 precedent), `enabled:false` when no cabinet/modelId, `nmId` threaded to fetcher — 11 tests total.

- [x] **Task 4 — Create `<SkuAccuracyTable>` presentation component** (AC: 2, 4, 5, 7) — `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyTable.tsx` + tests
  - [x] Sortable 6-column table — `<SortableHead>` sub-component matches Story 110.2-FE aria-sort pattern verbatim.
  - [x] Row click: `router.push(buildModelSkuAccuracyRoute(modelId) + '?nmId=' + nmId)`.
  - [x] Uses `formatNumber`, `formatSkuMapeDisplay` (AP#8 null→'—'), Russian locale via `formatPercentage`.
  - [x] Pure-function discipline: `sortSkuAccuracyEntries` + `formatSkuMapeDisplay` extracted to `sku-accuracy-helpers.ts`.
  - [x] 22 tests in `__tests__/SkuAccuracyTable.test.tsx`: empty rows, all-cells, AP#8 null, aria-sort states, sort reorder via `container.querySelectorAll('tr')`, row-click navigation, locale compliance.

- [x] **Task 5 — Create overview page** (AC: 1, 2, 5) — `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/page.tsx` + container
  - [x] Page: `'use client'`, `useParams` for modelId, `useSearchParams` for nmId.
  - [x] nmId present → `<SkuAccuracyDetail>`; else → `<SkuAccuracyOverview>` (state-precedence chain in Overview).
  - [x] State-precedence chain `loading → error → empty → happy` implemented in `SkuAccuracyOverview.tsx`.
  - [x] Breadcrumb: link to `buildModelEvaluationsRoute(modelId)` + "Точность по SKU" current-page label.
  - [x] 7 tests in `__tests__/page.test.tsx`: routing toggle, breadcrumb, heading, overview/detail presence, modelId/nmId threading.

- [x] **Task 6 — Create `<SkuAccuracyDetail>` per-SKU drill-down view** (AC: 3, 4, 5, 7) — `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyDetail.tsx` + tests
  - [x] Header card: "Артикул {nmId} — {vendorCode}" title.
  - [x] Aggregate stats card: avgAiMape, avgNaiveMape, aiAccuracyPercent (AP#8 null→'—' via `formatSkuMapeDisplay`).
  - [x] History table: evaluationDate DESC sort, predictedUnits/actualUnits (SEMANTIC-ZERO), mapeUnits/naiveMape (AP#8 null→'—').
  - [x] Empty-state: "SKU не найден" alert + back-link via `buildModelSkuAccuracyRoute(modelId)`.
  - [x] 12 tests in `__tests__/SkuAccuracyDetail.test.tsx`: happy path, empty-state, AP#8, history DESC sort, locale formatters.

- [x] **Task 7 — File backend request for `?modelId=` + `?nmId=` filter on `/v1/ai/evaluations/sku-accuracy`** (AC: 1, 3, 6) — `docs/request-backend/166-ai-sku-accuracy-modelid-nmid-filter.md`
  - [x] Filed at `docs/request-backend/166-ai-sku-accuracy-modelid-nmid-filter.md` (95 lines).
  - [x] Cites test-api/99-ai.http:77 current contract, Story 110.2 F-1 precedent, cabinet-isolation rationale, frontend readiness (fetcher + hook already sending params).

- [x] **Task 8 — Update sprint-status + Change Log** (AC: all)
  - [x] Flipped story Status: in-progress → review.
  - [x] Flipped sprint-status.yaml: in-progress → review.
  - [x] Added implementation Change Log row (no Lessons — added when flipping to done after 2-pass review).
  - [x] Populated File List and Dev Agent Record.

- [x] **Task 9 — 2-pass adversarial review** (AC: 10)
  - [x] 1st pass (fresh context, code-reviewer agent, Opus). 8 findings (3 HIGH, 5 MEDIUM) — all resolved.
  - [x] 2nd pass (fresh context, independent). 8 NEW findings of different defect classes (2 HIGH, 4 MEDIUM, 2 LOW) — all resolved.
  - [x] Streak preserved at 53+ consecutive 2-pass stories.

## Dev Notes

### Pre-Flight Verification Results (Story 105.2-FE, verified 2026-05-18)

Pre-flight grep for AC nouns showed **substantial foundation already shipped**:

**Already exists** (no work needed):
- `src/types/ai/evaluations.ts:43-72` — `SkuAccuracyEntry`, `SkuAccuracyHistoryEntry`, `SkuAccuracyListResponse` (Story 108.1)
- `src/lib/api/ai/evaluations.ts:89-153` — `RawSkuAccuracyEntry` raw types + `normalizeSkuAccuracyHistoryEntry` + `normalizeSkuAccuracyEntry` + `normalizeSkuAccuracyListResponse` + `getSkuAccuracy(format?)` fetcher (Story 108.1)
- `src/lib/routes.ts:213-215` — `buildModelSkuAccuracyRoute(modelId)` helper (Story 110.1-FE pre-registration)
- `src/lib/__tests__/routes.test.ts:27-44` — route helper has 3 tests (Story 110.1-FE)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsList.tsx:124` — row-click navigation pushes `${buildModelSkuAccuracyRoute(modelId)}?nmId=${nmId}` (Story 110.2-FE) — entry point already wired

**Needs creation** (Story 110.3-FE work):
- `useAiSkuAccuracy` hook
- `<SkuAccuracyTable>` overview component
- `<SkuAccuracyDetail>` per-SKU drill-down
- Page at `/analytics/models/[id]/evaluations/sku-accuracy/page.tsx`
- Backend request ticket #166

**Pre-flight grep output (2026-05-18)**:
```
grep -rn "useAiSkuAccuracy" src/ → no hits (confirms not yet implemented)
grep -rn "SkuAccuracyTable" src/ → no hits
grep -rn "SkuAccuracy" src/types/ src/lib/api/ → 9 hits in evaluations types + 6 hits in normalizer (foundation confirmed)
grep -rn "sku-accuracy" src/lib/routes.ts → 2 hits (route helper)
```

### Architecture Patterns to Follow

- **Boundary Normalizer Pattern** (CLAUDE-PATTERNS.md) — `getSkuAccuracy` already normalizes; extend params + types as needed
- **Anti-Pattern #8** (CLAUDE.md) — `null` → `'—'` for money/percentage/MAPE fields; `?? 0` for counts (semantic-zero exception per CLAUDE-PATTERNS.md § AP#8 Exceptions, `SEMANTIC-ZERO` pattern)
- **State-precedence chain** (Story 109.5-FE F-17) — `loading → error → empty → happy`, canonical order
- **Pure functions over hook mocking** (CLAUDE.md feedback memory) — extract sort comparator + formatters to `sku-accuracy-helpers.ts`
- **Cabinet-isolation discipline** (Story 97.5-FE) — `queryKey` scoped by `cabinetId`; runtime test uses SINGLE shared `QueryClient` (NOT two fresh clients — Story 110.2 F-4 anti-pattern)
- **WAI-ARIA `aria-sort` pattern** (Story 110.2-FE F-6) — `<TableHead aria-sort="ascending|descending|none">` + button `aria-label` action-only
- **Sort test discipline** (Story 110.2-FE F-3) — assert ACTUAL row reorder via `container.querySelectorAll('tr')` + content comparison; NOT just `expect(mockOnSort).toHaveBeenCalled()`
- **Locale formatters** (CLAUDE.md § Formatters) — `formatPercentage`, `formatNumber`, `formatDate` from `src/lib/utils.ts`. NO `toFixed(N)%` (English-dot violation — Story 110.2 F-5 precedent)
- **File-size cap** — source ≤200 lines, test ≤800 lines (ESLint `max-lines` enforced)

### File Structure Plan

```
src/
├── app/(dashboard)/analytics/models/[id]/evaluations/
│   └── sku-accuracy/                                  ← NEW directory
│       ├── page.tsx                                   ← NEW (Task 5)
│       └── components/
│           ├── SkuAccuracyOverview.tsx                ← NEW (Task 4 container)
│           ├── SkuAccuracyTable.tsx                   ← NEW (Task 4 presentation)
│           ├── SkuAccuracyDetail.tsx                  ← NEW (Task 6)
│           ├── sku-accuracy-helpers.ts                ← NEW (pure functions)
│           └── __tests__/
│               ├── SkuAccuracyTable.test.tsx          ← NEW
│               ├── SkuAccuracyDetail.test.tsx         ← NEW
│               └── page.test.tsx                      ← NEW
├── hooks/
│   ├── useAiSkuAccuracy.ts                            ← NEW (Task 3)
│   └── __tests__/
│       └── useAiSkuAccuracy.test.ts                   ← NEW
├── lib/api/ai/
│   └── evaluations.ts                                 ← MODIFIED (Task 1, 2)
└── types/ai/
    └── evaluations.ts                                 ← MODIFIED (Task 2)

docs/request-backend/
└── 166-ai-sku-accuracy-modelid-nmid-filter.md         ← NEW (Task 7)
```

### Testing Standards

- Vitest + React Testing Library (project standard)
- Mock `useAuthStore` for cabinetId via `vi.mocked(useAuthStore).mockReturnValue({ cabinetId: 'cab-1' } as never)`
- Mock fetcher: `vi.mock('@/lib/api/ai/evaluations')` + `vi.mocked(getSkuAccuracy).mockResolvedValue(...)`
- Test fixtures in `src/test/fixtures/` (project convention from Epic 92-FE Pattern 3) — extract `skuAccuracyEmpty.ts` + `skuAccuracySingleEntry.ts` fixtures
- AP#8 rendering tests: assert `'—'` (em-dash, U+2014) in DOM when source field is null
- Cabinet-isolation runtime test (mandatory per Story 97.5-FE): use single shared `QueryClient`, switch cabinetId between mounts, assert second mount fires fresh fetch (cache miss)
- WCAG: `aria-sort` values asserted; sort button `aria-label` asserted; tooltip / nested-interactive `stopPropagation` asserted (Story 110.2 F-3 precedent)

### Defensive Frontend Considerations (CLAUDE.md § Defensive Frontend Principle)

If backend returns `aiAccuracyPercent > 100` (data anomaly): render the raw value + warning icon, do NOT clamp. Same defensive stance as Story 89.4-FE / orders price-inversion precedent. Add `// PENDING BACKEND:` comment + tracker file reference when filing #166.

### References

- **Source**: `_bmad-output/planning-artifacts/epics-110-fe.md` § Story 110.3-FE (lines 95-107).
- **Foundation**:
  - `src/types/ai/evaluations.ts:43-72` (types — Story 108.1)
  - `src/lib/api/ai/evaluations.ts:89-153` (normalizer + fetcher — Story 108.1)
  - `src/lib/routes.ts:213-215` (route helper — Story 110.1-FE)
  - `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsList.tsx:124` (row-click entry — Story 110.2-FE)
- **Patterns**: `frontend/CLAUDE.md` (anti-patterns, AP#8, two-pass review, accepted baselines), `frontend/CLAUDE-PATTERNS.md` (Boundary Normalizer, Multi-Source Orchestration, AP#8 Exceptions), `frontend/CLAUDE-ANTI-PATTERNS.md`.
- **Backend contract**: `../test-api/99-ai.http:77` (current `GET /v1/ai/evaluations/sku-accuracy` example, cabinet-wide; expected response shape includes `naiveBaseline`, `naiveAccuracyPercent`, `evaluationCount`).
- **Precedent stories**:
  - Story 110.2-FE — sibling per-model page, sortable table, dual-hook page structure, F-1 backend `?modelId=` pattern, F-3 nested-interactive a11y, F-4 cabinet-isolation runtime test pattern, F-5 locale formatter propagation, F-6 aria-sort pattern.
  - Story 109.5-FE — per-id detail page (`/analytics/models/[id]/performance`) with F-17 state-precedence chain.
  - Story 110.1-FE — `aria-sort` ratchet from `warn` to `error`; route pre-registration.
  - Story 108.1-FE — types/normalizer/fetcher foundation (currently in place).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Retry: 1 in hook overrides test wrapper's retry: false — removed from hook to match project pattern (useStorageAnalytics has no explicit retry; wrapper controls it).
- Page test: breadcrumb span + h1 both contain "Точность по SKU" → used `getByRole('heading')` to disambiguate.
- Hook call: page calls `useAiSkuAccuracy(modelId)` without explicit `undefined` second arg — test assertion updated to `toHaveBeenCalledWith('model-abc')`.

### Post-1st-pass-review fixes (2026-05-18)

- F-1 (HIGH): TableRow role="button" gained tabIndex={0} + onKeyDown Enter/Space activation. Propagated to Story 110.2 EvaluationsTable per Story 97.1-FE fix-block propagation discipline. Files: SkuAccuracyTable.tsx, SkuAccuracyTable.test.tsx (+2 keyboard tests), EvaluationsTable.tsx, EvaluationsTable.test.tsx (+2 keyboard tests).
- F-2 (HIGH): Page now passes isLoading/isError to SkuAccuracyDetail; empty-state gated behind data-arrived check (loading → skeleton, error → error alert, data + nmId missing → "SKU не найден"). Loading flash of "SKU не найден" eliminated. Files: page.tsx, SkuAccuracyDetail.tsx, SkuAccuracyDetail.test.tsx (+3 state tests), page.test.tsx (+2 state tests).
- F-3 (HIGH): aria-sort test strengthened to assert exact "ascending" count (1) + "none" count (2) across all 3 sortable columns — prevents over-application passing silently. File: SkuAccuracyTable.test.tsx.
- F-4 (MEDIUM): Verified SkuAccuracyDetail does not call useAiSkuAccuracy with nmId (page-level data passed via props). Added comment in page.tsx explaining double-fetch trap for post-#166 ship.
- F-5 (MEDIUM): NaN guard on nmId param — Number.isFinite check added; malformed ?nmId=abc falls back to Overview. Files: page.tsx, page.test.tsx (+2 NaN guard tests including '1.5e2' boundary).
- F-6 (MEDIUM): Back-link in "SKU не найден" Alert gained focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none focus-visible:rounded classes for WCAG 2.4.7 compliance. File: SkuAccuracyDetail.tsx.
- F-7 (MEDIUM): Null-last sort test strengthened to assert rows[1] contains the null entry, plus added DESC variant verifying nulls last in both sort directions. File: SkuAccuracyTable.test.tsx (+1 test).
- F-8 (MEDIUM): nmId column switched from formatNumber (adds non-breaking-space separator) to String(nmId) — opaque identifier semantics preserved, copy-paste works. Propagated to Story 110.2 EvaluationsTable nmId cell. Files: SkuAccuracyTable.tsx, EvaluationsTable.tsx, SkuAccuracyTable.test.tsx (test updated), EvaluationsTable.test.tsx (test updated).

**Validation**: ESLint 0 errors/112 warnings, type-check 0 errors, vitest 7707 passing (+11 from 7696), check-docs exit 0 (22 broken matching baseline).
**Streak**: 2-pass review discipline applied — 1st pass complete; awaiting 2nd pass.

### Post-2nd-pass-review fixes (2026-05-18)

- F-1 (HIGH): NaN guard tightened to `Number.isSafeInteger(x) && x > 0` (rejects 0, negatives, floats, and values > 2^53-1); normalizer `nmId` changed from `?? 0` to `?? null`; null-nmId rows filtered out of `normalizeSkuAccuracyListResponse`. Added 4 boundary tests (?nmId=0, -1, 1.5, overflow). Note: overflow string parses to 1e+21 not Infinity — `isSafeInteger` is the correct guard. Files: page.tsx, evaluations.ts (lib + types), page.test.tsx, evaluations.test.ts.
- F-2 (HIGH): Renamed scientific-notation test to `'F-2: ?nmId=1.5e2 = 150 (integer in scientific notation) renders Detail'`; added separate `?nmId=1.5` (true non-integer) → Overview fallback test. File: page.test.tsx.
- F-3 (MEDIUM): `naiveAccuracyPercent` now rendered as 4th aggregate-stats tile in `SkuAccuracyDetail` (grid-cols-4). AP#8 null→'—' via `formatPercentage`. Added 2 tests (non-null renders %, null renders '—'). Files: SkuAccuracyDetail.tsx, SkuAccuracyDetail.test.tsx.
- F-4 (MEDIUM): Removed dead-defensive `?? 0` + SEMANTIC-ZERO eslint-disable on non-nullable `evaluationCount` in `SkuAccuracyTable` display cell. Boundary normalizer still applies `?? 0` at the correct layer. File: SkuAccuracyTable.tsx.
- F-5 (MEDIUM): Page passes raw `data?.skuAccuracies` (undefined-able) to `SkuAccuracyDetail`; prop type widened to `SkuAccuracyEntry[] | undefined`; `find()` guarded with optional chaining. `SkuAccuracyTable` row map adds null-nmId guard to narrow type after boundary filter. Files: page.tsx, SkuAccuracyDetail.tsx, SkuAccuracyTable.tsx, SkuAccuracyDetail.test.tsx (loading/error tests now pass `undefined`).
- F-6 (MEDIUM): Backend request #166 now includes `## Example requests` section with 3 curl invocations + JSON response shapes (cabinet-wide, modelId-scoped, modelId+nmId-scoped). File: docs/request-backend/166-ai-sku-accuracy-modelid-nmid-filter.md.
- F-7 (LOW): Hook normalizes `nmId` once at boundary (`nmId ?? null`); both `queryKey` and fetcher receive `normalizedNmId`. Fetcher signature updated to `nmId?: number | null`. Test assertion updated from `nmId: undefined` to `nmId: null`. Files: useAiSkuAccuracy.ts, evaluations.ts, useAiSkuAccuracy.test.ts.
- F-8 (LOW): Added `<!-- HALT: Replace YYYY-MM-DD ... -->` HTML comment directly above placeholder Change Log row. File: 110-3-fe-sku-accuracy-table.md.

**Validation**: ESLint 0 errors/112 warnings, type-check 0 errors, vitest 7715 passing (+8 from 7707), check-docs exit 0 (22 broken matching baseline).
**Streak**: 2-pass review discipline extends to 53+ consecutive stories. Both passes found defects of DIFFERENT classes — discipline validated again.

### Post-3rd-pass-review fixes (2026-05-18)

3rd-pass adversarial review (fresh context, Opus) ran after Status: done flip — a sanity pass against the 53+ consecutive-story 2-pass streak. Found 2 LOW doc-fidelity findings (no runtime defects):

- F-1 (LOW): naiveBaseline per-history-entry field (backend ships per test-api/99-ai.http:91) was misclassified as "already mapped as naiveMape" — they are distinct (naiveBaseline = units, naiveMape = percentage). Added to RawSkuAccuracyHistoryEntry + SkuAccuracyHistoryEntry + normalizer with AP#8 null preservation. UI rendering deferred to later story. Story file Task 2 note + request #166 claim corrected. Files: src/types/ai/evaluations.ts, src/lib/api/ai/evaluations.ts, src/lib/api/ai/__tests__/evaluations.test.ts, _bmad-output/implementation-artifacts/110-3-fe-sku-accuracy-table.md (this file), docs/request-backend/166-ai-sku-accuracy-modelid-nmid-filter.md.
- F-2 (LOW): Request #166 code excerpt updated from pre-F-7 `params.nmId !== undefined` to current `params.nmId != null` per Story 97.1-FE fix-block propagation discipline (which the 2nd-pass F-7 fix itself missed propagating). File: docs/request-backend/166-ai-sku-accuracy-modelid-nmid-filter.md.

**Meta-pattern note**: The 3rd pass surfaced doc-fidelity drift that both prior fresh-context passes missed because both anchored on the story-file's own claims about backend contract shape rather than grep-verifying against test-api/*.http. Recommend Epic 110-FE retro extend spec-grep discipline (CLAUDE.md § Multi-Source Orchestration § Pattern 4) to require verification of "X already mapped/shipped" claims against the cited source path.

**Validation**: ESLint 0E/112w, type-check 0, vitest 7717 passing (+2 from 7715), check-docs exit 0 (22 broken matching baseline).
**Streak**: 2-pass discipline preserved at 53+; 3rd-pass surfaces a refinement opportunity, not a discipline failure.

### Completion Notes List

- Task 1: `getSkuAccuracy` signature extended to `SkuAccuracyParams` — sends `modelId` always, `nmId` when present. `PENDING BACKEND: #166` comment inline. Backend currently ignores both params (cabinet-wide response); frontend is ready for when they ship.
- Task 2: Added `naiveAccuracyPercent` (null-preserved) + `evaluationCount` (semantic-zero) to `SkuAccuracyEntry` type and normalizer. Added `naiveBaseline` (units; per-history-entry, distinct from `naiveMape` which is the percentage error) to `SkuAccuracyHistoryEntry` + normalizer with AP#8 null preservation — 3rd-pass F-1 post-close fix.
- Task 3: Hook follows `useAiEvaluations` pattern exactly; `aiSkuAccuracyKeys.bySku` includes cabinetId + modelId + nmId for full isolation.
- Task 4: `SortableHead` extracted as inner component to avoid repeated aria-sort boilerplate across 3 sortable columns. Pure helpers in `sku-accuracy-helpers.ts`.
- Task 5: Page is `'use client'` (required for `useParams` + `useSearchParams`). Detail view receives pre-fetched `data?.skuAccuracies` from page-level hook call — avoids double fetch since page and SkuAccuracyOverview both call the hook (TanStack Query deduplicates by queryKey).
- Task 6: History sort is client-side `localeCompare` on ISO date strings (safe since format is `YYYY-MM-DD`).
- Task 7: Request #166 filed at `docs/request-backend/166-ai-sku-accuracy-modelid-nmid-filter.md`.

### File List

**New files:**
- `src/hooks/useAiSkuAccuracy.ts` (33 lines)
- `src/hooks/__tests__/useAiSkuAccuracy.test.ts` (147 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/page.tsx` (54 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/sku-accuracy-helpers.ts` (47 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyTable.tsx` (117 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyOverview.tsx` (72 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyDetail.tsx` (113 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyTable.test.tsx` (194 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyDetail.test.tsx` (131 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/page.test.tsx` (101 lines)
- `docs/request-backend/166-ai-sku-accuracy-modelid-nmid-filter.md` (95 lines)

**Modified files:**
- `src/types/ai/evaluations.ts` — added `naiveAccuracyPercent`, `evaluationCount` to `SkuAccuracyEntry`
- `src/lib/api/ai/evaluations.ts` — extended `getSkuAccuracy` to `SkuAccuracyParams`; updated normalizer for new fields
- `src/lib/api/ai/__tests__/evaluations.test.ts` — added 8 new test cases (4 URL-param + 4 normalizer)

### Change Log

| Date | Change |
|---|---|
| 2026-05-18 | Story created via `/bmad:bmm:workflows:create-story` (BMad Master). Spec source: `_bmad-output/planning-artifacts/epics-110-fe.md` § Story 110.3-FE. Pre-flight verification confirmed substantial foundation already shipped via Stories 108.1 (types/normalizer/fetcher), 110.1 (route helper), 110.2 (row-click entry point). Estimated remaining scope: hook + 2 components (overview + detail) + page + backend request ticket. Estimate: ~1.5 SP. Backend dependency mirrors Story 110.2 F-1 pattern — `getSkuAccuracy` currently cabinet-wide; needs `?modelId=` + `?nmId=` filter. Pre-emptive backend request #166 included in scope. |
| 2026-05-18 | Implementation complete via dev-story workflow. Shipped: `getSkuAccuracy` param extension (Task 1), `naiveAccuracyPercent`/`evaluationCount` type+normalizer (Task 2), `useAiSkuAccuracy` hook with cabinet-isolation (Task 3), `SkuAccuracyTable` sortable 6-col + `sku-accuracy-helpers.ts` (Task 4), `SkuAccuracyOverview` container + page with breadcrumb (Task 5), `SkuAccuracyDetail` per-SKU drill-down + empty-state (Task 6), backend request #166 (Task 7). Validation: 7696 tests passing (+59 from 7637 floor), 0 ESLint errors, 0 type errors, doc-citations 22 broken matching baseline. Status: in-progress → review. Awaiting 2-pass adversarial review. |
| 2026-05-18 | 2-pass adversarial review complete. 8 1st-pass + 8 2nd-pass findings resolved across different defect classes (keyboard a11y, state-precedence, vacuous tests, NaN guard, focus-ring, null-last DESC, String(nmId) propagated to Story 110.2 EvaluationsTable per Story 97.1-FE fix-block discipline; then derivative-defects, test name/assertion contradiction, dead-code naiveAccuracyPercent, redundant ?? 0, fragile state-precedence, backend-request quality, hook param normalization, story-hygiene placeholder). Final gates: ESLint 0E/112w, type-check 0, vitest 7715 passing (+19 from 7696 implementation floor), check-docs 22 broken (baseline). **Lessons:** (1) Pre-flight verification (Story 105.2-FE) found 80%+ foundation pre-existed; minimized new work to UI + hook + page. (2) Number.isFinite admits 0/-1/floats; Number.isSafeInteger && >0 is correct guard for opaque positive-integer IDs. (3) Hook param must be normalized once at boundary; queryKey AND fetcher must use same normal form (?? null). Status: review → done. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows (story creation, intermediate fixes, post-review fix passes) DO NOT require Lessons. -->
