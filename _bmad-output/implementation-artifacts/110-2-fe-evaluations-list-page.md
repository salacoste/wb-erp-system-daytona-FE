# Story 110.2: Evaluations list page

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **seller analyst inspecting a model's accuracy history on `/analytics/models/[id]/performance`**,
I want **a dedicated `Подробные оценки` page that lists every evaluation entry the model has produced, showing per-row predicted vs. actual units and MAPE for both units and revenue, plus aggregate cabinet-level MAPE + evaluation date + SKU count headers**,
so that **I can drill from the model's overall MAPE-trend chart into the specific predictions that drove that trend, identify outlier forecasts, and decide whether the model deserves a thumbs-up/down (Story 110.4) or retraining (Story 109.4)**.

## Acceptance Criteria

1. **AC-1 — `useAiEvaluations(modelId)` hook with cabinet-scoped queryKey**
   - Hook lives at `src/hooks/useAiEvaluations.ts`.
   - Wraps existing `getAiEvaluations(modelId)` fetcher from `src/lib/api/ai/evaluations.ts` (Story 108.1 foundation — DO NOT re-implement).
   - QueryKey shape (cabinet-isolation discipline, Story 97.5-FE):
     ```ts
     export const aiEvaluationsKeys = {
       all: (cabinetId: string | null) => ['ai', 'evaluations', cabinetId] as const,
       byModel: (cabinetId: string | null, modelId: string) =>
         [...aiEvaluationsKeys.all(cabinetId), modelId] as const,
     }
     ```
   - Use `useAuthStore(s => s.cabinetId)` per `useModelPerformance.ts` precedent (Story 109.5). `enabled: !!cabinetId && !!modelId` gate.
   - `staleTime: 60_000` (1 min — evaluations rarely change between renders); `gcTime: 5 * 60_000`; `retry: 1`. Mirror `useModelPerformance` defaults exactly.
   - **No polling** in this story (matches `useModelPerformance` Story 109.5 default).

2. **AC-2 — New dynamic route `/analytics/models/[id]/evaluations`**
   - Page file at `src/app/(dashboard)/analytics/models/[id]/evaluations/page.tsx`. Next.js App Router dynamic-segment convention.
   - Page extracts `params.id` (async per Next.js 15). Server Component shell renders `<EvaluationsList modelId={params.id} />` (no `'use client'` on the page; client logic lives in the section component).
   - **Resolves Story 110.1 `buildModelEvaluationsRoute(modelId)` helper destination** — clicking a "Подробные оценки" button on `ModelPerformanceDetail` (Story 109.5 page) navigates here. AC-7 below wires that button.

3. **AC-3 — `<EvaluationsList modelId={...} />` component header**
   - Component at `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsList.tsx`. Client component (`'use client'`).
   - Header section (Card with title row):
     - **Page title**: `Оценки точности модели` (CardTitle)
     - **Model identity row**: render the model's `modelType` (using `MODEL_TYPE_LABELS` from `src/types/ai/forecast.ts` — Story 109.3 extraction) + `v{version}` + status badge.
     - **Header data source**: fetch the model row from `useAiModels()` (Story 109.3) AND `useAiEvaluations(modelId)` (this story). Model identity from `useAiModels`; evaluations data from `useAiEvaluations`. Mirrors `ModelPerformanceDetail` Story 109.5 dual-fetch pattern.
     - If the modelId is not found in `useAiModels` data (deep-link to deleted model), render `Модель не найдена. Возможно, она была удалена или ещё не загружена.` Alert with `<Link href={ROUTES.ANALYTICS.MODELS}>Вернуться к списку моделей</Link>`. Reuse the Story 109.5 model-not-found pattern verbatim.

4. **AC-4 — Aggregate summary row**
   - Below the header, before the table, render a 3-card metric strip:
     | Metric | Field | Format |
     |---|---|---|
     | Средняя точность (MAPE) | `data.cabinetMape` | `formatPercentage` if non-null, else `'—'` (AP#8 compliance) |
     | Последняя оценка | `data.evaluatedAt` | `formatDate(value)` (DD.MM.YYYY) if non-null, else `'—'` |
     | SKU оценено | `data.skuCount` | `formatNumber(value)` (count — semantic-zero OK; `0` renders as `'0'`) |
   - Use existing dashboard summary-card UI primitive (mirror `ForecastMetrics` Story 108.4 or `<Card>` with grid layout). Russian labels exact-match the table above.
   - MAPE scale verified at 0-100 per Story 109.3 F-3 / Story 109.5 AC-5 (no `× 100` transformation).

5. **AC-5 — Evaluations table — 6 columns**
   - Per-row columns:
     | Column header (Russian) | Source field | Format |
     |---|---|---|
     | Дата | (use `data.evaluatedAt` shared header — rows don't carry date; SHOW the forecastId as a tooltip or short hash instead) | Render `<TooltipProvider>` with hover showing `forecastId` (Story 109.2 `ForecastChartTooltip` precedent for tooltip pattern) |
     | Артикул | `entry.nmId` | `formatNumber(value)` if non-null, else `По кабинету` (cabinet-level evaluation marker) |
     | Прогноз (ед.) | `entry.predictedUnits` | `formatNumber(value)` — semantic-zero OK |
     | Факт (ед.) | `entry.actualUnits` | `formatNumber(value)` — semantic-zero OK |
     | MAPE (ед.) | `entry.mapeUnits` | `formatPercentage(value)` if non-null, else `'—'` (AP#8) |
     | MAPE (₽) | `entry.mapeRevenue` | `formatPercentage(value)` if non-null, else `'—'` (AP#8) |
   - Use shadcn `<Table>` primitives for consistency with Story 109.5 evaluation table.
   - Sort entries by `mapeUnits` ASC (best-performing forecasts first; nulls last). Provide a click-to-sort header for `mapeUnits` and `mapeRevenue` columns.
   - For Story 110.3 forward-compat: row hover shows a `cursor-pointer` if drill-down to SKU detail is meaningful; click → `useRouter.push(\`${ROUTES.ANALYTICS.MODELS}/\${modelId}/evaluations/sku-accuracy?nmId=\${entry.nmId}\`)` ONLY when `entry.nmId !== null`. Cabinet-level rows (nmId === null) are non-interactive. Use `buildModelSkuAccuracyRoute(modelId)` from Story 110.1 + append the `?nmId` query param.

6. **AC-6 — Loading / error / empty / model-not-found states**
   - **Loading** (either hook): `<Skeleton>` header + 5 skeleton rows. Mirror Story 109.5 ModelPerformanceDetail skeleton pattern.
   - **Error** (`useAiEvaluations.isError`): `<Alert variant="destructive">` with `Ошибка загрузки оценок модели` + `error?.message` interpolation.
   - **List-error** (`useAiModels.isError`): destructive Alert `Ошибка загрузки списка моделей` BEFORE the model-not-found check. Mirror Story 109.5 post-2nd-pass F-17 state-precedence: loading → list-error → model-not-found → perf-error → happy.
   - **Empty** (`data.evaluations.length === 0`): non-destructive `<Alert>` with `Нет оценок этой модели. Модель должна быть оценена хотя бы один раз для появления данных здесь.`
   - **Model not found**: per AC-3.

7. **AC-7 — Link from `ModelPerformanceDetail` (Story 109.5) — "Подробные оценки" button**
   - Add a `<Link>` (Next.js) styled as button at the top of `ModelPerformanceDetail.tsx` near the page title. Label: `Подробные оценки`. Icon: `lucide-react` `ListChecks` or similar.
   - Href: `buildModelEvaluationsRoute(modelId)` from Story 110.1.
   - Style: shadcn `<Button variant="outline" size="sm">` wrapping a `<Link>` (use `asChild` prop pattern if shadcn Button supports it; mirror existing Button+Link patterns in the codebase).
   - Update the existing `ModelPerformanceDetail.test.tsx` (Story 109.5) with 1 test asserting the button renders + has correct href.

8. **AC-8 — Tests**
   - **`useAiEvaluations.test.ts`** (~5 tests):
     - cabinet-isolation regression: 3 assertions (different cabinetIds + null + same cabinet).
     - `enabled` gate: `modelId === ''` → query disabled.
     - QueryKey shape exact-match: `aiEvaluationsKeys.byModel('cab-1', 'model-X')` deep-equals `['ai', 'evaluations', 'cab-1', 'model-X']` (Story 109.5 F-9 lesson — assert exact shape, not just isolation).
   - **`EvaluationsList.test.tsx`** (~14 tests):
     - Loading state → renders Skeleton.
     - List-error state → renders destructive Alert with list error message.
     - Error state → renders destructive Alert with evaluations error message.
     - Model-not-found state → renders Alert with link to MODELS list.
     - Empty mapeTrend → renders chart empty-state Alert.
     - Happy path: header renders modelType label + version + status badge; aggregate summary cards show correct values + AP#8 null handling; 6 column headers render in correct order; rows render in `mapeUnits` ASC order; nmId null → "По кабинету" rendered; sort-by-mapeUnits click reverses order; row navigation: click on a row with non-null nmId calls `router.push` with expected URL; row navigation: cabinet-level row (nmId null) does NOT navigate.
     - AP#8 compliance: cabinet-level summary card (cabinetMape null) renders `'—'` not `0`; evaluatedAt null renders `'—'`; mapeUnits null renders `'—'`.
   - Pattern: extract sortable helper `sortEvaluationsByMape(entries, direction)` as pure function in a sibling `evaluations-list-helpers.ts` if `EvaluationsList.tsx` approaches 150 lines.

9. **AC-9 — All baseline quality gates remain green (tighter floor)**
   - Per CLAUDE.md § Accepted Baselines (post-Story-110.1):
     - `npm run type-check` → 0 errors
     - `npx eslint 'src/**/*.{ts,tsx}'` → **0 errors, 112 warnings** (Story 110.1 ratchet — new ESLint violations would block CI now that `jsx-a11y/control-has-associated-label` is `error`)
     - `npm test -- --run` → ≥ **7591 passing** (current floor), 0 failed (target: ~+19 new tests)
     - `bash scripts/check-doc-citations.sh` → exit 0, 22 broken (baseline)
     - `bash scripts/check-eslint-rules.sh` → OK
     - `bash scripts/count-test-changes.sh --self-test` → 12/12 pass
   - **Key reminder**: `jsx-a11y/control-has-associated-label` now blocks at `error` severity (Story 110.1). Every clickable row, sort button, interactive control in this story MUST have an accessible name from day 1 — no post-hoc batches.

10. **AC-10 — 2-pass adversarial code review BEFORE commit**
    - Per CLAUDE.md § Two-pass review discipline. Capture findings under `### Post-1st-pass-review fixes (YYYY-MM-DD)` and `### Post-2nd-pass-review fixes (YYYY-MM-DD)` sub-headings.
    - This story counts toward the **51+** consecutive-story 2-pass streak.

11. **AC-11 — Pre-flight verification logged**
    - Per Story 105.2-FE Step 4.5, executor re-runs the 4 greps from § Pre-Flight Verification below; pastes output into `### Debug Log References`.

## Tasks / Subtasks

- [x] **Task 1 — Pre-flight verification re-run** (AC: #11) — `src/hooks/useAiEvaluations.ts` created clean; pre-flight grep confirmed 0 conflicts.
  - [x] Run the 4 greps in § Pre-Flight Verification; paste output into Debug Log References.
  - [x] Confirm: no existing `useAiEvaluations` / `EvaluationsList`; types/fetcher unchanged from Story 108.1; `buildModelEvaluationsRoute(modelId)` exists at `src/lib/routes.ts:206`; `useAiModels` from Story 109.3 unchanged.

- [x] **Task 2 — `useAiEvaluations` hook + cabinet-isolation test** (AC: #1, #8) — `src/hooks/useAiEvaluations.ts` + `src/hooks/__tests__/useAiEvaluations.test.ts` created; cabinet-isolation rewritten with single shared QueryClient (2nd-pass F-4).
  - [x] Create `src/hooks/useAiEvaluations.ts` with hook + `aiEvaluationsKeys` registry.
  - [x] Create `src/hooks/__tests__/useAiEvaluations.test.ts` — cabinet-isolation (3 assertions) + enabled-gate + queryKey-shape exact-match (5 tests total).

- [x] **Task 3 — Pure helpers + tests (if EvaluationsList grows large)** (AC: #5, #8) — `evaluations-list-helpers.ts` extracted with `sortEvaluationsByMape` + `formatMapeDisplay`.
  - [x] If `EvaluationsList.tsx` approaches 150 lines, extract `evaluations-list-helpers.ts` with `sortEvaluationsByMape(entries, direction)` pure helper. Unit-test directly.
  - [x] Otherwise inline.

- [x] **Task 4 — `<EvaluationsList modelId={...} />` component** (AC: #3, #4, #5, #6) — `EvaluationsList.tsx` + `EvaluationsTable.tsx` created; all 5 UI states; 2nd-pass F-1/F-3/F-6 applied.
  - [x] Header section (CardTitle + model identity row + drift badge IF wanted).
  - [x] Aggregate summary card strip (3 cards per AC-4).
  - [x] 6-column table sorted by `mapeUnits` ASC; click-to-sort headers; row hover/click affordances.
  - [x] Loading/error/list-error/empty/model-not-found states.
  - [x] All clickable rows + sort buttons have semantic Russian `aria-label` per Story 110.1 ratchet.

- [x] **Task 5 — Page route** (AC: #2) — `src/app/(dashboard)/analytics/models/[id]/evaluations/page.tsx` created as async Server Component.
  - [x] Create `src/app/(dashboard)/analytics/models/[id]/evaluations/page.tsx` — Server Component shell extracts `params.id`.

- [x] **Task 6 — Link from `ModelPerformanceDetail`** (AC: #7) — "Подробные оценки" button added; 1 test added to `ModelPerformanceDetail.test.tsx`.
  - [x] Add `<Button asChild variant="outline" size="sm"><Link href={buildModelEvaluationsRoute(modelId)}>Подробные оценки</Link></Button>` near the page title.
  - [x] Extend `ModelPerformanceDetail.test.tsx` with 1 test asserting button renders + correct href.

- [x] **Task 7 — Component tests** (AC: #8) — `EvaluationsList.test.tsx` (26 tests) + `EvaluationsTable.test.tsx` (17 tests incl. 2nd-pass F-1/F-3/F-6 additions).
  - [x] `EvaluationsList.test.tsx` with all 14 cases.
  - [x] Mock `useAiEvaluations` + `useAiModels` + `useRouter` per existing precedents.

- [x] **Task 8 — Run baseline quality gates** (AC: #9) — ESLint 0E/112w, type-check 0, vitest 7637 passing, check-docs 22 broken (baseline match).
  - [x] All 6 gates from AC-9.

- [x] **Task 9 — 2-pass adversarial code review** (AC: #10) — both passes complete; fixes applied.
  - [x] 1st pass (fresh context, code-reviewer agent, Opus). Apply fixes.
  - [x] 2nd pass (fresh context, independent). Apply fixes.

- [x] **Task 10 — Update sprint-status + Change Log** (AC: all)
  - [x] Flip `110-2-fe-evaluations-list-page` from `ready-for-dev` → `in-progress` → `review` → `done` (`_bmad-output/implementation-artifacts/sprint-status.yaml`).
  - [x] Final Change Log row with `**Lessons:**` sub-line per Story 94.4-FE convention (3 lessons, all ≤120 chars).

## Dev Notes

### Pre-Flight Verification Results (verified at story-author time, 2026-05-17)

```bash
# 1. No existing useAiEvaluations / EvaluationsList / dynamic route
grep -rln "useAiEvaluations\|EvaluationsList\|analytics/models/\[id\]/evaluations" src/ | grep -v node_modules
#   → 0 hits

# 2. Foundation types + fetcher present (Story 108.1)
grep -n "getAiEvaluations\|AiEvaluationListResponse\|EvaluationEntry" src/types/ai/evaluations.ts src/lib/api/ai/evaluations.ts
#   → src/types/ai/evaluations.ts:7 EvaluationEntry (forecastId, nmId, predictedUnits, actualUnits, mapeUnits, mapeRevenue)
#   → src/types/ai/evaluations.ts:22 AiEvaluationListResponse (evaluations, cabinetMape, evaluatedAt, skuCount)
#   → src/lib/api/ai/evaluations.ts has normalizeAiEvaluationListResponse + getAiEvaluations fetcher

# 3. buildModelEvaluationsRoute from Story 110.1 (destination resolved)
grep -n "buildModelEvaluationsRoute" src/lib/routes.ts
#   → :206 export const buildModelEvaluationsRoute = (modelId: string): string => ...

# 4. ModelPerformanceDetail precedent (Story 109.5) — page structure to mirror
ls "src/app/(dashboard)/analytics/models/[id]/performance/components/" 2>/dev/null
#   → ModelPerformanceDetail.tsx + MapeTrendChart.tsx + model-performance-helpers.ts + __tests__/
```

### Architecture Patterns Inherited

- **Boundary Normalizer Pattern**: `getAiEvaluations` returns canonical `AiEvaluationListResponse` (Story 108.1). Hook consumes directly; no re-normalization.
- **Cabinet-isolation discipline** (Story 97.5-FE): `aiEvaluationsKeys.byModel` MUST scope by `cabinetId` + `modelId`. Mirrors `modelPerformanceKeys.byId` from Story 109.5.
- **Dual-hook page composition** (Story 109.5 `ModelPerformanceDetail`): fetch `useAiModels()` for model identity (header) + `useAiEvaluations(modelId)` for evaluations data. Same precedent.
- **State-precedence chain** (Story 109.5 post-2nd-pass F-17): loading → list-error → model-not-found → evaluations-error → happy. DO NOT silently misclassify list errors as model-not-found.
- **Anti-Pattern #8**: `cabinetMape`, `evaluatedAt`, `mapeUnits`, `mapeRevenue` are all nullable. Render `'—'` for null, NEVER `0` or `'0%'`. `predictedUnits`/`actualUnits`/`skuCount` are counts (semantic-zero OK).
- **WCAG 2.1 AA + jsx-a11y ratchet** (Story 110.1 closed `warn → error`): every clickable row, sort header, "Подробные оценки" button MUST have semantic Russian `aria-label` from day 1. Lint blocks CI now.
- **MAPE scale**: 0-100 per Story 109.3 F-3 + Story 109.5 AC-5. NO `× 100` transformation.
- **`MODEL_TYPE_LABELS` reuse**: import from `src/types/ai/forecast.ts` (Story 109.3 Task 2 canonical source). Do NOT re-declare.
- **Recharts pattern**: N/A — this story has no chart (Story 110.3 may add one for SKU accuracy trends).
- **Routes registry** (Story 110.1 + Story 109.5): use `buildModelEvaluationsRoute(modelId)` + `buildModelSkuAccuracyRoute(modelId)` helpers — NEVER inline route templates (Story 109.5 F-6 lesson).

### Why a separate page (not a tab on ModelPerformanceDetail)

Per Epic 110-FE spec § Design Decisions #2: evaluations nests under `/analytics/models/[id]/evaluations` as a dedicated route. Rationale:
- Story 109.5 `ModelPerformanceDetail` is already dense (drift badge + MAPE trend chart + previous-version comparison + evaluation rows table). Adding evaluations list would overload.
- Dedicated route enables Story 110.3 (SKU accuracy) to nest further: `/analytics/models/[id]/evaluations/sku-accuracy?nmId=...`.
- Story 110.4 feedback buttons live ON evaluation rows — having the row-level surface on its own page makes feedback affordances obvious.

### Forward-compatibility for Story 110.3 (SKU accuracy)

- Row click on a non-cabinet-level evaluation navigates to `buildModelSkuAccuracyRoute(modelId)?nmId={nmId}`. The destination route doesn't exist yet (Story 110.3 builds it) — will 404 until 110.3 lands. Acceptable per spec.
- Story 110.3 may consume the same `useAiEvaluations` hook OR a dedicated `useAiSkuAccuracy(modelId, nmId)` hook. TBD in 110.3 spec.

### Source Tree Components to Touch

| File | Change | Lines (approx.) |
|---|---|---|
| `src/hooks/useAiEvaluations.ts` | CREATE | ~30 |
| `src/hooks/__tests__/useAiEvaluations.test.ts` | CREATE | ~80 |
| `src/app/(dashboard)/analytics/models/[id]/evaluations/page.tsx` | CREATE | ~15 |
| `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsList.tsx` | CREATE | ~150 (cap 200; extract helpers if approaching) |
| `src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsList.test.tsx` | CREATE | ~220 |
| (optional) `src/app/(dashboard)/analytics/models/[id]/evaluations/components/evaluations-list-helpers.ts` | CREATE if sort logic + tooltip helpers grow | ~40 |
| `src/app/(dashboard)/analytics/models/[id]/performance/components/ModelPerformanceDetail.tsx` | EXTEND (add "Подробные оценки" button) | ~+5 |
| `src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx` | EXTEND (1 button-render test) | ~+10 |

**File-size discipline**: `EvaluationsList.tsx` is the largest new file. Target ≤150 lines. Extract `evaluations-list-helpers.ts` if approaching the 200-line cap.

### Testing Standards

- **Framework**: Vitest. No E2E required.
- **Mock patterns**: mock `useAiEvaluations` + `useAiModels` + `useRouter` per Story 109.5 `ModelPerformanceDetail.test.tsx` precedent.
- **Pure-function discipline**: any helper extracted to `evaluations-list-helpers.ts` tested directly.
- **Test count target**: ~19 new tests (5 hook + 14 component). Total floor ≥ **7591 passing**.
- **AP#8 test pattern**: include AT LEAST one explicit null-render assertion per nullable field (`cabinetMape`, `evaluatedAt`, `mapeUnits`, `mapeRevenue`).
- **a11y enforcement**: jsx-a11y/control-has-associated-label is `error` post-Story 110.1 — sortable headers + clickable rows MUST have aria-label at write-time, not post-hoc.

### Project Structure Notes

- **Alignment**: new directory `src/app/(dashboard)/analytics/models/[id]/evaluations/` mirrors the Story 109.5 `[id]/performance/` sibling structure.
- **Naming**: PascalCase for components. camelCase for hooks (`useAiEvaluations`). Helper file kebab-case (`evaluations-list-helpers.ts`).
- **Detected conflicts**: NONE (pre-flight clean).

### References

- **Spec source**: `_bmad-output/planning-artifacts/epics-110-fe.md` § Story 110.2-FE.
- **Canonical types**: `src/types/ai/evaluations.ts` (Story 108.1).
- **Existing fetcher**: `src/lib/api/ai/evaluations.ts` `normalizeAiEvaluationListResponse` + `getAiEvaluations`.
- **Cabinet-isolation hook precedent**: `src/hooks/useModelPerformance.ts:17-27` (Story 109.5).
- **Dual-hook page precedent**: `src/app/(dashboard)/analytics/models/[id]/performance/components/ModelPerformanceDetail.tsx` (Story 109.5).
- **State-precedence chain** (loading → list-error → model-not-found → evaluations-error → happy): Story 109.5 post-2nd-pass F-17 codification.
- **`buildModelEvaluationsRoute`**: `src/lib/routes.ts:206` (Story 110.1).
- **`buildModelSkuAccuracyRoute`**: `src/lib/routes.ts:215` (Story 110.1) — used for row navigation.
- **`MODEL_TYPE_LABELS`**: `src/types/ai/forecast.ts` (Story 109.3 Task 2).
- **shadcn primitives**: `Card`, `Table`, `Skeleton`, `Alert`, `Badge`, `Button`, `Link` (Next.js).
- **Russian formatters**: `formatDate`, `formatNumber`, `formatPercentage` at `src/lib/utils.ts`.
- **Jsx-a11y ratchet context**: Story 110.1 (rule at `error` severity; control labels mandatory).
- CLAUDE.md disciplines: § Two-pass review, § Pre-flight verification, § Defensive Frontend Principle, § Multi-tenant cabinet-isolation discipline, § Critical Development Rules (200-line cap, no `any`, no `as`), § Anti-Pattern #8.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

**Pre-flight grep output (2026-05-18):**

```
# 1. No existing useAiEvaluations / EvaluationsList / dynamic route
→ 0 hits (clean)

# 2. Foundation types + fetcher (Story 108.1):
src/types/ai/evaluations.ts:7: export interface EvaluationEntry
src/types/ai/evaluations.ts:21: export interface AiEvaluationListResponse
src/lib/api/ai/evaluations.ts: normalizeAiEvaluationListResponse + getEvaluations fetcher

# 3. buildModelEvaluationsRoute present at routes.ts:206
# 4. performance/components/ → ModelPerformanceDetail.tsx + MapeTrendChart.tsx + model-performance-helpers.ts + __tests__/
```

**Deviations from spec:**
1. Spec says wrap `getAiEvaluations(modelId)` — the actual fetcher is `getEvaluations(params?)` (no modelId param). Hook wraps `getEvaluations()` per actual implementation in Story 108.1. The `modelId` is used in the cabinet-scoped queryKey for isolation.
2. `formatNumber` from utils.ts does not exist — used `String(value)` for integer counts (predictedUnits, actualUnits, skuCount, nmId). `formatMapeValue` extracted to helpers (toFixed(1)% style matching model-list-helpers.ts `formatMape`).
3. EvaluationsList.tsx exceeded 200 lines → table extracted to `EvaluationsTable.tsx` (additional file not in original spec Source Tree, but required by file-size discipline).
4. `ListChecks` lucide icon imported in initial write but not yet placed — removed immediately per lint error.
5. Spec mentioned `formatPercentage` for MAPE — used `formatMapeValue` (toFixed format) instead, as `formatPercentage` from utils divides by 100 internally and the MAPE values at 0-100 scale would need careful handling. `formatMapeValue` matches the existing `formatMape` pattern in the codebase.

### Completion Notes List

- Task 1: Pre-flight verification — CLEAN. Zero conflicts.
- Task 2: `useAiEvaluations` hook + `aiEvaluationsKeys` + 6 tests (4 key-shape + 2 enabled-gate). Cabinet-isolation mirrors `useModelPerformance.ts` exactly.
- Task 3: `evaluations-list-helpers.ts` extracted with `sortEvaluationsByMape` + `formatMapeValue`. Additional `EvaluationsTable.tsx` extracted to keep EvaluationsList.tsx under 200 lines (formatter made it 263 lines before extraction).
- Task 4: `EvaluationsList.tsx` component — header, 3-card aggregate strip, table, all 5 UI states, state-precedence chain mirrors F-17.
- Task 5: `page.tsx` Server Component shell — async params per Next.js 15.
- Task 6: "Подробные оценки" button added to `ModelPerformanceDetail.tsx` + 1 test.
- Task 7: 26 component tests in EvaluationsList.test.tsx (2 pure-helper + 14 component + 10 helper unit tests in total across files).
- Task 8: All 6 quality gates pass — type-check 0 errors, ESLint 0 errors / 112 warnings, 7617 passing (+26 vs 7591 floor), citations 22 broken (matches baseline), eslint-rules OK, self-test 12/12.

### File List

- `src/hooks/useAiEvaluations.ts` — CREATED (~30 lines)
- `src/hooks/__tests__/useAiEvaluations.test.ts` — CREATED (~90 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/page.tsx` — CREATED (~18 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsList.tsx` — CREATED (~184 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsTable.tsx` — CREATED (~110 lines, extracted for file-size discipline)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/evaluations-list-helpers.ts` — CREATED (~45 lines)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsList.test.tsx` — CREATED (~260 lines, test file cap 800)
- `src/app/(dashboard)/analytics/models/[id]/performance/components/ModelPerformanceDetail.tsx` — EXTENDED (+5 lines for button)
- `src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx` — EXTENDED (+10 lines for 1 button test)

### Post-1st-pass-review fixes (2026-05-18)

- F-1 (CRITICAL): threaded `modelId` through `EvaluationParams` → `getEvaluations({ modelId })` → `useAiEvaluations` queryFn. Added 6 new backend fields (`modelId`, `forecastDate`, `horizonDays`, `predictedRevenue`, `actualRevenue`, `evaluationDate`) to `EvaluationEntry`, `RawEvaluationEntry`, and `normalizeEvaluationEntry`. Hook test now asserts `mockGetEvaluations` called with `{ modelId: 'model-1' }`. Files: `src/types/ai/evaluations.ts`, `src/lib/api/ai/evaluations.ts`, `src/hooks/useAiEvaluations.ts`.
- F-2 (HIGH): replaced `formatMapeValue` (English dot `toFixed(1)%`) with `formatMapeDisplay` using `formatPercentage` from `src/lib/utils.ts` (Russian locale `Intl` — comma decimal, space before %). Null→'—' preserved per AP#8. Files: `evaluations-list-helpers.ts`, `EvaluationsTable.tsx`. Tests updated: `formatMapeValue` describe block renamed to `formatMapeDisplay`; assertion updated to verify no English dot format.
- F-3 (HIGH): strengthened sort-click test to assert actual row order before/after click. Uses `container.querySelectorAll('tr')` (bypasses `getAllByRole('row')` exclusion of `role="button"` rows) and `aria-label` attribute to locate SKU row. Asserts `cabinetRowIndex < skuRowIndex` (ASC) then `skuRowIndex < cabinetRowIndex` (DESC). File: `EvaluationsList.test.tsx`.
- F-4 (HIGH): added runtime cabinet-isolation test to `useAiEvaluations.test.ts` — mounts hook under `cab-A`, primes cache, then mounts under `cab-B` with fresh `QueryClient`, asserts a second fetch fires (call count increases). Confirms separate cache entries per cabinetId at runtime. File: `src/hooks/__tests__/useAiEvaluations.test.ts`.
- F-5 (HIGH): renamed skeleton container testid from generic `"skeleton"` to `"evaluations-skeleton"` with indexed per-skeleton testids (`evaluations-skeleton-header`, `-summary`, `-table`). Test updated to `getByTestId('evaluations-skeleton')`. File: `EvaluationsList.tsx`, `EvaluationsList.test.tsx`.
- F-6 (HIGH): created `EvaluationsTable.test.tsx` (13 tests) covering: empty rows, all 6 headers, forecastId hash render, nmId formatNumber, "По кабинету", AP#8 null dashes, Russian locale %, sort-header clicks fire `onSortClick`, row clicks fire `onRowClick`, sort indicators ↑/↓, no indicator when different column active. File: `src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsTable.test.tsx`.
- F-7 (HIGH): changed column header from `"Дата / ID прогноза"` to `"Дата"` per spec AC-5 verbatim. Tooltip already shows `forecastId` on hover. Test assertion updated to match `"Дата"`. Files: `EvaluationsTable.tsx`, `EvaluationsList.test.tsx`.
- F-8 (HIGH): replaced `String(value)` with `formatNumber(value)` from `src/lib/fbs-analytics-formatters.ts` (Russian locale `Intl.NumberFormat`) for `nmId`, `predictedUnits`, `actualUnits` in `EvaluationsTable`. Also replaced bare `{skuCount}` with `{formatNumber(skuCount)}` in `EvaluationsList` summary card. Files: `EvaluationsTable.tsx`, `EvaluationsList.tsx`.
- All test fixtures updated with 6 new `EvaluationEntry` fields to satisfy TypeScript strict checking after F-1 type expansion. `newFields` helper object extracted in test file to keep fixtures DRY.
- Added `// FUTURE:` comment in `EvaluationsTable.tsx` noting horizon/revenue columns available for Stories 110.3+.

**Validation**: ESLint 0 errors / 112 warnings (baseline match), type-check 0 errors, vitest 7632 passing (+41 vs 7591 floor, +15 vs pre-fix 7617), 676 skipped, 0 failed, check-docs 22 broken (baseline match).
**Streak**: 2-pass review discipline — 1st pass complete; awaiting 2nd pass.

### Post-2nd-pass-review fixes (2026-05-18)

- F-1 (HIGH): "Дата" cell now renders `formatDate(new Date(entry.evaluationDate))` per-row; forecastId moved to tooltip content as `Прогноз ID: {entry.forecastId}` (full id, no slice). `evaluatedAt` prop removed from `EvaluationsTableProps` (now unused). Files: `EvaluationsTable.tsx`, `EvaluationsList.tsx`, `EvaluationsTable.test.tsx`.
- F-2 (HIGH): Updated FUTURE comment to specifically name the 4 remaining unused fields (`forecastDate`, `horizonDays`, `predictedRevenue`, `actualRevenue`) with Story 110.3 reference. Types retained per Boundary Normalizer Pattern. File: `EvaluationsTable.tsx`.
- F-3 (HIGH): Added `onClick={e => e.stopPropagation()}` and `onKeyDown` guard on the date `<span>` (TooltipTrigger child) to prevent nested-interactive conflict with TableRow `onClick`. Unit test asserts `onRowClick` NOT called on date span click. Files: `EvaluationsTable.tsx`, `EvaluationsTable.test.tsx`.
- F-4 (HIGH): Rewrote cabinet-isolation runtime test to use single shared `QueryClient` across both mounts (cabinet A then cabinet B). Added explanatory comment block explaining WHY single client is required for the assertion to be meaningful (two separate clients always cache-miss regardless of queryKey). File: `src/hooks/__tests__/useAiEvaluations.test.ts`.
- F-5 (MEDIUM): Propagated `formatPercentage` (Russian locale) to `ModelPerformanceDetail.tsx` at all 3 `toFixed(1)%` sites (`prevMape`, `currentMape`, `cabinetMape` table cell). Test assertions for comparison paragraph switched to `/14[,.]0\s*%/` and `/12[,.]5\s*%/` regex. Files: `ModelPerformanceDetail.tsx`, `ModelPerformanceDetail.test.tsx`.
- F-6 (MEDIUM): Replaced ambiguous `aria-label` with WAI-ARIA `aria-sort` attribute on `<TableHead>` for both sortable columns (`ascending`/`descending`/`none`). Button `aria-label` simplified to action-only (`"Сортировать по MAPE единиц"` / `"Сортировать по MAPE выручки"`). 3 new test cases assert `aria-sort` values in active/inactive/desc states. Files: `EvaluationsTable.tsx`, `EvaluationsTable.test.tsx`.
- F-7 (LOW): Resolved automatically by F-1 (`forecastId.slice(0, 8)` removed entirely).
- F-8 (LOW): Tasks 1-9 marked `[x]` with one-line evidence pointers. Task 10 left `[ ]` (parent session handles sprint-status and Change Log close).

**Validation**: ESLint 0E/112w (baseline), type-check 0 errors, vitest 7637 passing (+5 vs 7632 post-1st-pass, +46 total vs 7591 floor), 676 skipped, 0 failed, check-docs exit 0 / 22 broken (baseline match).
**Streak**: 2-pass review discipline extends to 52+ consecutive stories. Both passes found defects of DIFFERENT classes (1st pass: spec/locale/test-strength/contract; 2nd pass: dead-prop/nested-interactive/vacuous-isolation-test/fix-block-propagation/aria-sort).

### Change Log

| Date | Change |
|---|---|
| 2026-05-17 | Story created via `/bmad:bmm:workflows:create-story` (SM agent — BMad Master). Spec source: `_bmad-output/planning-artifacts/epics-110-fe.md` § Story 110.2-FE. Pre-flight verification completed — zero conflicts. Foundation: Story 108.1 types/fetcher + Story 109.3 useAiModels + Story 109.5 dual-hook page precedent + Story 110.1 `buildModelEvaluationsRoute` helper. Estimate: ~2 SP. First FEATURE story of Epic 110-FE (110.1 was pure cleanup). |
| 2026-05-18 | Implementation + 2-pass review complete. Per-model evaluations page wired through F-1 backend filter (`?modelId=`); 8 1st-pass findings + 8 2nd-pass findings resolved (different defect classes — validates discipline). Gates: ESLint 0E/112w, type-check 0, vitest 7637 passing (+5), check-docs 22 broken (baseline). **Lessons:** (1) Frontend stubs expose backend contract gaps — `useAiEvaluations(modelId)` revealed missing `?modelId=` filter. (2) 1st-pass type-expansion shipped 5 dead UI fields; 2nd pass repurposed `evaluationDate` to fix "Дата" column UX bug. (3) Cabinet-isolation tests need a shared QueryClient — two fresh clients cannot collide on queryKey scope. Status: review → done. |
| 2026-05-19 | Disclosure (Story 111.1-FE F-2): Story 111.1-FE 1st-pass trimmed the original 2026-05-18 Lessons L1 and L3 in-place (byte-count interpretation, later corrected to char-count by F-1). The pre-trim original text is unrecoverable (_bmad-output/ is gitignored — no git history). Under char-count: L1 was approximately 140+ chars (142 bytes, mostly ASCII = ~142 chars, over cap); L3 was approximately 124 chars (124 bytes, ASCII). Both violated the 120-char cap. The 2026-05-18 row now contains post-trim content (L1=109c, L2=114c, L3=102c — all under cap). Story 110.2 is in the Story 111.1-FE KNOWN_CARRYOVER_ALLOWLIST. Convention: closed-story Change Log rows are APPEND-ONLY — later stories may add new dated rows for transparency but MUST NOT edit prior rows' content. |
| 2026-05-19 | Correction (Story 111.1-FE 3rd-pass F-1): Story 110.2 is **NOT** in the Story 111.1-FE `KNOWN_CARRYOVER_ALLOWLIST`. The prior row's claim was incorrect — verified by reading `scripts/check-lessons-length.sh`'s actual `KNOWN_CARRYOVER_ALLOWLIST` array contents (16 entries, none = `110-2-fe-evaluations-list-page.md`). Story 110.2's current post-trim Lessons (L1=109c, L2=114c, L3=102c) pass the 120-char gate cleanly and do not require allowlist exemption. The prior row above is preserved verbatim per APPEND-ONLY convention; this correction adds the authoritative status. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows (story creation, intermediate fixes, post-review fix passes) DO NOT require Lessons. -->
