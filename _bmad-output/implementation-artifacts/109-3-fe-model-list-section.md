# Story 109.3: Model list page/section

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **seller analyst using the AI features**,
I want **a dedicated `/analytics/models` page that lists every ML model my cabinet has, with type, engine, version, status, MAPE, and last-trained date**,
so that **I can monitor which models are active, see their accuracy at a glance, spot training/degradation/retirement issues, and drill into per-model performance details without leaving the AI surface area**.

## Acceptance Criteria

1. **AC-1 — New `useAiModels()` hook with cabinet-scoped queryKey**
   - Hook lives at `src/hooks/useAiModels.ts`.
   - Wraps existing `getAiModels` fetcher from `src/lib/api/ai/models.ts:69` (Story 108.1 foundation — DO NOT re-implement).
   - QueryKey shape (cabinet-isolation discipline, Story 97.5-FE):
     ```ts
     export const aiModelsKeys = {
       all: (cabinetId: string | null) => ['ai', 'models', cabinetId] as const,
       list: (cabinetId: string | null) => [...aiModelsKeys.all(cabinetId)] as const,
     }
     ```
   - Use `useAuthStore(s => s.cabinetId)` per `useAiForecast.ts:24` precedent. `enabled: !!cabinetId` gate.
   - `staleTime: 60_000` (1 min — model list rarely changes); `gcTime: 5 * 60_000`; `retry: 1`. Mirror `useAiForecast` defaults.
   - **Polling NOT in this story.** Polling is Story 109.4 (training trigger + 5s poll); 109.3 hook is a one-shot fetch with revalidation on tab focus (TanStack default).

2. **AC-2 — New `/analytics/models` route**
   - Page file at `src/app/(dashboard)/analytics/models/page.tsx`. Next.js App Router convention; route auto-registers from filesystem.
   - Page is a **Server Component shell** (no `'use client'`) that renders a `<ModelListSection />` client component. Keeps the route file under 50 lines.
   - Add `MODELS: '/analytics/models'` constant to `ROUTES.ANALYTICS` in `src/lib/routes.ts` (insert after `FORECAST: '/analytics/forecast'` for source-order clarity; also add to the route-union type expansion at lines 109-120 if applicable).

3. **AC-3 — Sidebar entry "Модели AI" inserted directly after "AI Прогноз"**
   - Edit `src/components/custom/sidebar-navigation.ts` — after line 100 (`{ label: 'AI Прогноз', href: ROUTES.ANALYTICS.FORECAST, icon: Brain },`), insert:
     ```ts
     // Epic 109-FE: AI Model Management
     { label: 'Модели AI', href: ROUTES.ANALYTICS.MODELS, icon: <ICON> },
     ```
   - Pick a sensible `lucide-react` icon that visually differentiates from `Brain` (the forecast icon). Recommended: `Cpu` or `Boxes` or `Layers`. Avoid icons already in the sidebar nav (run `grep "icon: [A-Z]" src/components/custom/sidebar-navigation.ts | sort | uniq -c | sort -rn` to see what's in use).
   - Snapshot/test: `Sidebar.test.tsx` already covers sidebar rendering — if it has a fixture array, add the new entry. Otherwise no new test needed.

4. **AC-4 — `<ModelListSection />` component renders the model table**
   - Component at `src/app/(dashboard)/analytics/models/components/ModelListSection.tsx`. Client component (`'use client'`).
   - Six columns in this exact order:
     | Column header (Russian) | Source field | Format |
     |---|---|---|
     | Тип | `model.modelType` | Use `MODEL_TYPE_LABELS` from Story 109.1's `src/app/(dashboard)/analytics/forecast/components/ModelTypeSelector.tsx`. **Do NOT re-declare the labels** — import them. If the export is awkward (location is in the forecast subtree), consider extracting `MODEL_TYPE_LABELS` to a shared location like `src/types/ai/forecast.ts` as part of THIS story (small refactor; document in Change Log). |
     | Движок | `model.engine` | Display as `'MindsDB'` (for `'mindsdb'`) or `'Prophet'` (for `'prophet'`) — capitalize per backend guide convention. Extract `ENGINE_LABELS: Record<ModelEngine, string>` constant inside `ModelListSection.tsx`. |
     | Версия | `model.version` | Render as `v{number}` (e.g., `v3`). `version` is `number` (semantic-zero OK per `models.ts:31`). |
     | Статус | `model.status` | shadcn `<Badge>` with semantic colour + Russian label per AC-5. |
     | MAPE | `model.metrics.mape` | Render as `{(value * 100).toFixed(1)}%` (e.g., `12.4%`) if non-null, else `'—'` (AP#8 compliance — null is unknown, NOT 0). Verify backend MAPE scale — `models.ts:21` JSDoc says "Mean Absolute Percentage Error — lower is better, null when not yet evaluated"; if backend already sends 0-100 not 0-1, drop the `× 100` (verify against `_bmad-output/implementation-artifacts/108-1-fe-...` or the backend guide). |
     | Обучен | `model.trainedAt` | Russian-locale date via `formatDate(model.trainedAt)` (renders `DD.MM.YYYY`). Render `'—'` when `trainedAt` is `undefined` (never trained). |
   - Wrap in `<Card><CardHeader><CardTitle>Модели AI</CardTitle><CardDescription>Список ML-моделей вашего кабинета</CardDescription></CardHeader><CardContent><Table>...</Table></CardContent></Card>`. Use shadcn `<Table>` primitives for consistency with `ForecastTable.tsx` precedent (Story 109.1).

5. **AC-5 — Status badge: 4-state colour map + Russian labels**
   - Status → colour + label mapping (exact strings per epic spec line 110-111):
     | `ModelStatus` | Colour | Russian label | Visual hint |
     |---|---|---|---|
     | `active` | green | Активна | Solid green badge |
     | `training` | blue | Обучается | Solid blue + **animated pulse dot** (use Tailwind `animate-pulse` on a small `●` prefix, OR a `<Loader2 className="animate-spin" />` icon) |
     | `degraded` | amber | Деградировала | Solid amber badge |
     | `retired` | gray | Снята | Solid gray badge |
   - Extract as `STATUS_BADGE_CONFIG: Record<ModelStatus, { className: string; label: string }>` constant — exported for direct unit testing. Use shadcn `<Badge variant="outline" className={...}>` or compose a custom Tailwind span. Match the project's existing badge style (see `AiEngineStatusBadge.tsx` from Epic 108 for a reference pattern).
   - WCAG 2.1 AA: text label "Активна"/"Обучается"/etc. is the accessible name — colour alone is insufficient (Epic 108-FE retro § C-3 lesson). The animated pulse on `training` should have `aria-hidden="true"` on the visual indicator; the text label provides screen-reader semantics.

6. **AC-6 — Row click navigates to performance detail (Story 109.5 destination)**
   - Each `<TableRow>` is clickable: `onClick={() => router.push(`${ROUTES.ANALYTICS.MODELS}/${model.id}/performance`)}`.
   - Use `useRouter` from `next/navigation` (matches existing Next.js App Router pattern in this project; e.g., `ForecastPageContent` uses client-side state but other pages do navigation).
   - Add `cursor-pointer hover:bg-muted/50` Tailwind utilities to indicate interactivity.
   - **Story 109.5 dependency**: the destination route `/analytics/models/[id]/performance` does NOT exist yet — it will 404 until Story 109.5 lands. This is acceptable for 109.3 scope; document in Dev Notes.
   - WCAG: clickable rows are problematic for keyboard nav. Mitigate by adding `role="button" tabIndex={0}` + `onKeyDown` handler for Enter/Space, OR (preferred) make the model `id` cell an explicit `<Link>` while the row click is a convenience for mouse users. Pick the simpler approach that doesn't fight shadcn `<Table>` semantics.

7. **AC-7 — Empty state, loading state, error state**
   - **Loading** (`isLoading === true`): render `<Skeleton>` rows (mirror `ForecastPageContent.tsx:117-124` pattern — `<Skeleton className="h-8 w-48" />` + several `<Skeleton className="h-12 w-full" />` for table rows). DO NOT show an empty table during loading — confuses users.
   - **Error** (`isError === true`): render `<Alert variant="destructive">` with Russian message `"Ошибка загрузки списка моделей"` + the error message from `error?.message`. Reuse the pattern from `ForecastPageContent.tsx:128-135`.
   - **Empty** (`data?.models?.length === 0`): render `<Alert>` (non-destructive variant) with message `"Модели ещё не обучены. Перейдите на страницу AI Прогноз для запуска обучения."` Include a `<Link href={ROUTES.ANALYTICS.FORECAST}>` to make the suggestion actionable. Story 109.4 will add a Train button to this page itself — for 109.3 scope, point to the forecast page as a temporary workaround.

8. **AC-8 — Cabinet-isolation regression test**
   - Add `src/hooks/__tests__/useAiModels.test.ts` with a queryKey-isolation test: call `aiModelsKeys.list('cab-A')` and `aiModelsKeys.list('cab-B')`, assert the returned arrays are NOT equal (different keys → no cache collision). Mirror the pattern from `src/hooks/__tests__/useAiForecast.test.ts` (added in Story 109.1).
   - Also assert `aiModelsKeys.list(null)` produces a key with `null` — ensures unauthenticated/no-cabinet state doesn't accidentally share with any cabinet.

9. **AC-9 — Unit + component tests**
   - `src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx`. Required cases (~10 tests):
     - **STATUS_BADGE_CONFIG**: 4 assertions — one per `ModelStatus`, asserts correct Russian label.
     - **Empty state**: `data.models = []` → renders the empty-state Alert with the link to Forecast page.
     - **Loading state**: `isLoading=true` → renders `<Skeleton>` (not a table).
     - **Error state**: `isError=true, error.message='boom'` → renders destructive Alert containing `'boom'`.
     - **Happy path**: mock `useAiModels` returns 2 models with different statuses; assert (a) all 6 column headers visible; (b) 2 rows rendered; (c) status badges show correct Russian labels; (d) MAPE column renders `'—'` for null and `'12.4%'` for non-null; (e) `trainedAt` undefined renders `'—'`.
     - **Row navigation**: simulate click on a row; assert `router.push` mock called with `/analytics/models/{id}/performance`. Use the `vi.mock('next/navigation', ...)` pattern from `Sidebar.test.tsx`.
     - **Keyboard navigation**: simulate Enter key on a focused row; assert same `router.push` invocation.
   - Hook tests are in `useAiModels.test.ts` per AC-8.

10. **AC-10 — All baseline quality gates remain green**
    - Per `CLAUDE.md` § Accepted Baselines:
      - `npm run type-check` → 0 errors.
      - `npx eslint 'src/**/*.ts' 'src/**/*.tsx'` → 0 errors, ≤112 warnings (baseline).
      - `npm test -- --run` → ≥ **7473 passing** (current floor after Story 109.2 close), 0 failed.
      - `bash scripts/check-doc-citations.sh` → exit 0, 22 broken (baseline match).
      - `bash scripts/check-eslint-rules.sh` → **OK: all rule names valid in 2 file(s)**.
    - Tests added by this story: target ~12-15 new tests (4 STATUS_BADGE_CONFIG + 6 ModelListSection + 3 useAiModels/aiModelsKeys + 1-2 ENGINE_LABELS).

11. **AC-11 — 2-pass adversarial code review BEFORE commit**
    - Per `CLAUDE.md` § Two-pass review discipline. Capture findings under `### Post-1st-pass-review fixes (YYYY-MM-DD)` and `### Post-2nd-pass-review fixes (YYYY-MM-DD)` sub-headings in Dev Agent Record.
    - This story counts toward the **46+** consecutive-story 2-pass streak (preserved after Story 109.2).

12. **AC-12 — Pre-flight verification logged**
    - Per Story 105.2-FE Step 4.5, executor re-runs the 4 greps from § Pre-Flight Verification below; pastes raw output into `### Debug Log References`; confirms zero conflicts.

## Tasks / Subtasks

- [ ] **Task 1 — Pre-flight verification re-run** (AC: #12)
  - [ ] Run the 4 greps in § Pre-Flight Verification; paste output into Debug Log References.
  - [ ] Confirm: no existing `useAiModels` / `ModelListSection` / `/analytics/models` route; `MODEL_TYPE_LABELS` still exported from `ModelTypeSelector.tsx`; `getAiModels` fetcher unchanged at `src/lib/api/ai/models.ts:69`.

- [ ] **Task 2 — Decide `MODEL_TYPE_LABELS` location + (optional) extract to shared module** (AC: #4)
  - [ ] Inspect current export site (`src/app/(dashboard)/analytics/forecast/components/ModelTypeSelector.tsx`).
  - [ ] Decide: (a) import from there directly (acceptable; cross-feature import), OR (b) extract to `src/types/ai/forecast.ts` adjacent to `MODEL_TYPES` constant — preferred because the labels are shared between Forecast (109.1) and Models (109.3) features.
  - [ ] If (b): move the const + update `ModelTypeSelector.tsx` import to consume from the new location. Run `ModelTypeSelector.test.tsx` to confirm zero regressions. Update Change Log to note the move.

- [ ] **Task 3 — Add `MODELS: '/analytics/models'` to routes registry** (AC: #2)
  - [ ] Edit `src/lib/routes.ts` `ROUTES.ANALYTICS` object — insert `MODELS: '/analytics/models'` right after `FORECAST: '/analytics/forecast'`. If a route-union type exists at lines 109-120, append `ROUTES.ANALYTICS.MODELS` there as well.

- [ ] **Task 4 — `useAiModels` hook + cabinet-isolation test** (AC: #1, #8)
  - [ ] Create `src/hooks/useAiModels.ts` with `useAiModels()` + exported `aiModelsKeys` registry.
  - [ ] Create `src/hooks/__tests__/useAiModels.test.ts` — cabinet-isolation regression (3 assertions).

- [ ] **Task 5 — `ModelListSection` component** (AC: #4, #5, #7)
  - [ ] Create `src/app/(dashboard)/analytics/models/components/ModelListSection.tsx`.
  - [ ] Export `STATUS_BADGE_CONFIG: Record<ModelStatus, { className: string; label: string }>` constant.
  - [ ] Export `ENGINE_LABELS: Record<ModelEngine, string>` constant.
  - [ ] Render six columns per AC-4 table; status badges per AC-5; loading/empty/error states per AC-7.
  - [ ] Reuse `formatDate` from `@/lib/utils` for the `Обучен` column.

- [ ] **Task 6 — Row click + keyboard navigation** (AC: #6)
  - [ ] Wire `router.push` on row click and `onKeyDown` for Enter/Space.
  - [ ] Add WCAG affordances: `role="button" tabIndex={0}` + visible focus ring (Tailwind `focus:ring-2 focus:ring-ring`).

- [ ] **Task 7 — Page route + sidebar entry** (AC: #2, #3)
  - [ ] Create `src/app/(dashboard)/analytics/models/page.tsx` — Server Component shell renders `<ModelListSection />`.
  - [ ] Edit `src/components/custom/sidebar-navigation.ts` to add the "Модели AI" entry after the forecast entry. Choose a non-conflicting `lucide-react` icon.

- [ ] **Task 8 — Tests** (AC: #9)
  - [ ] Create `src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx` with all 10 cases from AC-9.
  - [ ] Mock `useAiModels` + `useRouter` per existing precedents (`Sidebar.test.tsx`, `ForecastPageContent.test.tsx`).

- [ ] **Task 9 — Run baseline quality gates** (AC: #10)
  - [ ] `npm run type-check` — 0 errors.
  - [ ] `npx eslint 'src/**/*.ts' 'src/**/*.tsx'` — 0 errors. Document any new warnings in Change Log.
  - [ ] `npm test -- --run` — ≥ 7473 passing, 0 failed. Note final count.
  - [ ] `bash scripts/check-doc-citations.sh` — exit 0 against baseline.
  - [ ] `bash scripts/check-eslint-rules.sh` — expect OK.

- [ ] **Task 10 — 2-pass adversarial code review** (AC: #11)
  - [ ] Spawn `code-reviewer` agent in fresh context (1st pass); apply fixes under `### Post-1st-pass-review fixes (YYYY-MM-DD)`.
  - [ ] Spawn `code-reviewer` agent in a SECOND fresh context (2nd pass); apply fixes under `### Post-2nd-pass-review fixes (YYYY-MM-DD)`.
  - [ ] Only AFTER both passes: commit + flip story status to `done`.

- [ ] **Task 11 — Update sprint-status + Change Log** (AC: all)
  - [ ] Flip `109-3-fe-model-list-section` from `ready-for-dev` → `in-progress` at start, `→ review` after Task 9, `→ done` after Task 10.
  - [ ] Add the final Change Log row with `**Lessons:**` sub-line per Story 94.4-FE convention.

## Dev Notes

### Pre-Flight Verification Results (verified at story-author time, 2026-05-17)

Per Story 105.2-FE Step 4.5 — executor MUST re-run before writing code:

```bash
# 1. No existing useAiModels / ModelListSection / /analytics/models route
grep -rln "useAiModels\|ModelListSection\|analytics/models" src/ | grep -v node_modules
#   → 0 hits

# 2. Types/fetcher foundation from Story 108.1 present
ls src/types/ai/models.ts src/lib/api/ai/models.ts
#   → both exist (Story 108.1)

# 3. Sidebar uses ROUTES.ANALYTICS.* registry — locate forecast entry to insert after
grep -n "forecast\|FORECAST" src/components/custom/sidebar-navigation.ts | head -5
#   → :100 — { label: 'AI Прогноз', href: ROUTES.ANALYTICS.FORECAST, icon: Brain }

# 4. MODEL_TYPE_LABELS export site (decide Task 2: keep there or extract to shared)
grep -rn "MODEL_TYPE_LABELS" src/ | head -5
#   → src/app/(dashboard)/analytics/forecast/components/ModelTypeSelector.tsx (Story 109.1)
```

### Architecture Patterns Inherited from Stories 108.1 + 109.1 + 109.2

- **Boundary Normalizer Pattern** (CLAUDE-PATTERNS.md § Boundary Normalizer Pattern): `getAiModels` (src/lib/api/ai/models.ts:69) already returns frontend-canonical `AiModelListResponse`. Hook + component consume directly; no re-normalization.
- **Cabinet-isolation discipline** (Story 97.5-FE): `aiModelsKeys` MUST scope by `cabinetId`. The hook-level test in Task 4 is the regression-lock (mirrors Story 109.1's `useAiForecast` cache-collision test).
- **Anti-Pattern #8** (CLAUDE.md): `metrics.mape` is nullable per the canonical type. Renders `'—'` for null, NEVER `0` or `'0%'`. `metrics.dataPointsCount` is `number` (count, semantic-zero OK per JSDoc).
- **Russian-locale formatting** (CLAUDE.md § Design System): reuse `formatDate` for `trainedAt`. All UI strings in Russian.
- **WCAG 2.1 AA** (Epic 108-FE retro § C-3 + Story 109.1 lesson): status badges use BOTH colour AND text label. Clickable rows have keyboard affordance. Animated training-status pulse has `aria-hidden`.
- **MODEL_TYPE_LABELS reuse**: Story 109.1 introduced the Russian labels for 7 model types. This story consumes them. If the export location is awkward (cross-feature import from `forecast/components/` to `models/components/`), Task 2 offers an optional extract to `src/types/ai/forecast.ts` — small refactor with zero behavioural change, tracked in Change Log.

### Story 109.4 / 109.5 forward-compatibility

- Story 109.4 will add a per-row `<TrainModelButton />` to the table (locked decision: per-row, not section-level). Leave room in the table layout — e.g., either an empty trailing "Действия" column OR design the table so a 7th column slots in cleanly without disrupting the current 6.
- Story 109.5 implements the `/analytics/models/[id]/performance` destination. THIS story wires the navigation; the destination route file is Story 109.5's responsibility. 109.5's spec already references the navigation contract from this story.

### Why a separate `/analytics/models` route (decision context)

Locked 2026-05-17 in Epic 109-FE spec § Risks/Open Questions Q1:
- Epic 111-FE planned role-gating (Owner-only model rollback) is trivial on a dedicated route.
- Epic 110-FE evaluations + feedback naturally nest under `/analytics/models/[id]/evaluations`.
- `/analytics/forecast` already renders 7+ sections in `ready` state — adding model list would overload cognitive density.
- Cost is only +1 route file + 1 sidebar entry. Mid-term ROI strongly favours the separate route.

### Source Tree Components to Touch

| File | Change | Lines (approx.) |
|---|---|---|
| `src/lib/routes.ts` | EXTEND (add `MODELS` constant + union entry) | ~+2 |
| `src/components/custom/sidebar-navigation.ts` | EXTEND (add 1 nav entry) | ~+3 |
| `src/hooks/useAiModels.ts` | CREATE | ~30 |
| `src/hooks/__tests__/useAiModels.test.ts` | CREATE | ~40 |
| `src/app/(dashboard)/analytics/models/page.tsx` | CREATE | ~10 (server component shell) |
| `src/app/(dashboard)/analytics/models/components/ModelListSection.tsx` | CREATE | ~150 (cap 200; extract `model-list-helpers.ts` if approaching 150) |
| `src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx` | CREATE | ~180 |
| (optional Task 2) `src/types/ai/forecast.ts` | EXTEND (relocate `MODEL_TYPE_LABELS`) | ~+15 |
| (optional Task 2) `src/app/(dashboard)/analytics/forecast/components/ModelTypeSelector.tsx` | MODIFY (consume from new location) | ~-15 +5 |

**File-size discipline** (CLAUDE.md § Critical Development Rules): `ModelListSection.tsx` will be the largest. Target ≤150 lines. Extract `model-list-helpers.ts` if approaching the 200-line cap (pure functions: `formatMape`, `formatTrainedDate`, `getStatusBadgeProps` — all testable in isolation).

### Testing Standards

- **Framework**: Vitest (unit + component). No E2E required for this story; visual UAT deferred until cabinet has trained models in production.
- **Mocking**: mock `useAiModels`, `useRouter`, `useAuthStore` at top of test file per `Sidebar.test.tsx` and `ForecastPageContent.test.tsx` precedents.
- **Pure-function discipline** (memory: `feedback_pure_functions_over_hook_mocking.md`): `STATUS_BADGE_CONFIG`, `ENGINE_LABELS`, and any extracted `formatMape`/`formatTrainedDate` are pure exports — test directly without React render.
- **Test count target**: ~12-15 new tests. Total suite floor for this story is ≥7473 passing.

### Project Structure Notes

- **Alignment**: new directory `src/app/(dashboard)/analytics/models/` mirrors the `forecast/` sibling structure (`page.tsx` + `components/` + `components/__tests__/`). Same convention.
- **Naming convention**: PascalCase for component files. Hook is `useAiModels.ts` (camelCase, matches `useAiForecast.ts`).
- **Detected conflicts / variances**: NONE (pre-flight verification confirmed zero collisions).

### References

- **Locked decision Q1**: `_bmad-output/planning-artifacts/epics-109-fe.md:115` (placement: separate route).
- **Backend integration guide**: `docs/AI-FRONTEND-INTEGRATION-GUIDE.md` § Model Management Section (source of the 4 statuses + engine values + MAPE semantics).
- **Canonical types**: `src/types/ai/models.ts` (`AiModel`, `ModelStatus`, `ModelEngine`, `AiModelListResponse`, `AiModelMetrics`).
- **Existing fetcher**: `src/lib/api/ai/models.ts:69` (`getAiModels`) + `:39-57` (`normalizeModelMetrics`, `normalizeAiModel`).
- **`MODEL_TYPE_LABELS`**: currently in `src/app/(dashboard)/analytics/forecast/components/ModelTypeSelector.tsx` (Story 109.1). Task 2 considers extraction to `src/types/ai/forecast.ts`.
- **`useAiForecast.ts` precedent**: `src/hooks/useAiForecast.ts:11-21` (cabinet-isolated queryKey shape).
- **Sidebar pattern**: `src/components/custom/sidebar-navigation.ts:100` (forecast entry insertion site).
- **Routes registry**: `src/lib/routes.ts:27-52` (`ROUTES.ANALYTICS` block).
- **Russian formatter**: `formatDate` at `src/lib/utils.ts`.
- **shadcn primitives**: `Badge` at `src/components/ui/badge.tsx`, `Table` siblings, `Card`, `Alert`, `Skeleton`.
- **Test mock precedent**: `Sidebar.test.tsx` (useRouter mock), `ForecastPageContent.test.tsx:53-55` (child-component mocks).
- CLAUDE.md disciplines: § Two-pass review, § Pre-flight source-trace verification, § Defensive Frontend Principle, § Multi-tenant cabinet-isolation discipline, § Critical Development Rules (200-line cap, no `any`, no `as`), § Anti-Pattern #8.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (Executor)

### Debug Log References

**Pre-flight verification (2026-05-17):**

```
# Grep 1: No existing useAiModels / ModelListSection / analytics/models
grep -rln "useAiModels\|ModelListSection\|analytics/models" src/ | grep -v node_modules
→ (no output — zero conflicts confirmed)

# Grep 2: Story 108.1 foundation files exist
ls src/types/ai/models.ts src/lib/api/ai/models.ts
→ /Users/.../src/lib/api/ai/models.ts
→ /Users/.../src/types/ai/models.ts

# Grep 3: Forecast sidebar entry location
grep -n "forecast\|FORECAST" src/components/custom/sidebar-navigation.ts | head -5
→ 100:  { label: 'AI Прогноз', href: ROUTES.ANALYTICS.FORECAST, icon: Brain },

# Grep 4: MODEL_TYPE_LABELS export site
grep -rn "MODEL_TYPE_LABELS" src/ | head -5
→ src/app/(dashboard)/analytics/forecast/components/ModelTypeSelector.tsx:22:export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
→ (Story 109.1 — confirmed for Task 2 extraction)
```

**MAPE scale finding:** Backend sends 0-100 scale (e.g., `12` = 12% MAPE). Evidence: `docs/AI-FRONTEND-INTEGRATION-GUIDE.md:369` — "MAPE degraded from 12% to 45%". The `normalizeModelMetrics` in `src/lib/api/ai/models.ts:41` passes `mape` through as-is (`raw?.mape ?? null`). Display formula: `{value.toFixed(1)}%` — NO `× 100` multiplication.

**Task 2 decision:** Extracted `MODEL_TYPE_LABELS` to `src/types/ai/forecast.ts` (preferred shared location). `ModelTypeSelector.tsx` now imports from `@/types/ai/forecast` and re-exports `MODEL_TYPE_LABELS` for backward compatibility with existing tests. Also added `MODEL_TYPE_LABELS` to the barrel re-export in `src/types/ai-forecast.ts`. Zero regressions in ModelTypeSelector tests confirmed.

**Icon chosen:** `Cpu` — not previously used in sidebar (confirmed via `grep "icon: [A-Z]" sidebar-navigation.ts`). `Boxes` was already used for "Остатки FBS".

### Completion Notes List

- **MAPE scale confirmed 0-100**: Backend sends percentage values directly (12 = 12%). `formatMape` renders as `{value.toFixed(1)}%` without `× 100`. Evidence: integration guide line 369.
- **Task 2 — MODEL_TYPE_LABELS extracted**: Moved from `ModelTypeSelector.tsx` to `src/types/ai/forecast.ts`. `ModelTypeSelector.tsx` re-exports for backward compat. Barrel `ai-forecast.ts` also updated. All 10 existing ModelTypeSelector tests pass.
- **Icon: Cpu** — not previously used. `Boxes` was taken by "Остатки FBS".
- **`as unknown as ReturnType<typeof useAiModels>`** pattern used in tests — avoids TS2352 overlap error with TanStack Query's union discriminant types (per CLAUDE.md anti-pattern #4).
- **Dual `'—'` cells in happy-path fixture**: `modelTraining` has both `mape: null` AND `trainedAt: undefined`, yielding two `'—'` cells. Used `getAllByText('—')` instead of `getByText` to avoid "multiple elements" error.
- **Story 109.5 dependency documented**: Row click navigates to `/analytics/models/{id}/performance` which 404s until Story 109.5 ships. Noted in component JSDoc.
- **Quality gates**: type-check 0 errors, ESLint 0 errors/112 warnings (baseline), 7500 tests passing (floor 7473, added 27 net), doc-citations 22 broken (baseline match), eslint-rules OK.

### File List

**Created:**
- `src/hooks/useAiModels.ts` (27 lines)
- `src/hooks/__tests__/useAiModels.test.ts` (26 lines)
- `src/app/(dashboard)/analytics/models/page.tsx` (10 lines)
- `src/app/(dashboard)/analytics/models/components/model-list-helpers.ts` (65 lines)
- `src/app/(dashboard)/analytics/models/components/ModelListSection.tsx` (139 lines)
- `src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx` (299 lines — grew from 264 with M-1/M-2/M-3 + F-2 fixes)

**Modified:**
- `src/types/ai/forecast.ts` — added `MODEL_TYPE_LABELS` export (112 lines total)
- `src/types/ai-forecast.ts` — added `MODEL_TYPE_LABELS` to barrel re-export (24 lines total)
- `src/app/(dashboard)/analytics/forecast/components/ModelTypeSelector.tsx` — updated import to `@/types/ai/forecast`, added `export { MODEL_TYPE_LABELS }` re-export (49 lines total)
- `src/lib/routes.ts` — added `MODELS: '/analytics/models'` + protected route entry (188 lines total)
- `src/components/custom/sidebar-navigation.ts` — added `Cpu` import + "Модели AI" nav entry (119 lines total)

### Post-1st-pass-review fixes (2026-05-17)

1st-pass adversarial review (code-reviewer agent, Opus, fresh context) returned **APPROVE AFTER FIXES** — 0 CRITICAL / 0 HIGH / 3 MEDIUM / 3 LOW. Clean structural pass; all 12 ACs verified; cabinet-isolation + AP#8 + WCAG + MAPE scale all correctly implemented; Story 109.1 regression-locks intact (5 ForecastPageContent + 12 ModelTypeSelector tests pass after `MODEL_TYPE_LABELS` extraction).

Applied fixes (3 test-coverage strengthening edits in `ModelListSection.test.tsx`):
- **M-1 (MEDIUM)**: Added positive `formatTrainedAt('2026-01-15T12:00:00Z') → '15.01.2026'` test. Original `formatTrainedAt` describe block only covered the `undefined → '—'` branch — a regression in upstream `formatDate` would have escaped.
- **M-2 (MEDIUM)**: Replaced 2 tautological tests using `getAllByText('—').length >= 1` with 3 specific assertions: `expect(screen.getByText('12.4%'))`, `expect(screen.getByText('15.01.2026'))`, and `expect(getAllByText('—')).toHaveLength(2)` (exact count). Now distinguishes `formatMape` from `formatTrainedAt` regressions.
- **M-3 (MEDIUM)**: Added a `version=0` semantic-zero test asserting `v0` renders (not `'—'`). Locks AP#8 exemption for the `version` count field; catches a future `${version || '—'}` regression.

**NOT addressed** (LOW — deferred or non-blocking):
- **L-1 (LOW)**: Redundant `error?.message` optional-chain. Cosmetic; TanStack guarantees `error` is non-null when `isError=true`. Defer.
- **L-2 (LOW)**: Helpers tests co-located in component test file. Existing project precedent is mixed (some helpers have own files, others don't). Defer.
- **L-3 (LOW)**: Change Log placeholder `YYYY-MM-DD` — addressed in this story-close pass (final row populated below).

Test count delta: 7500 → **7503 passing** (+3 net from MEDIUM fixes). All other gates unchanged.

### Post-2nd-pass-review fixes (2026-05-17)

2nd-pass adversarial review (code-reviewer agent, Opus, independent fresh context) returned **APPROVE AS-IS** — 0 CRITICAL / 0 HIGH / 0 MEDIUM / 2 LOW + 1 INFO. The 2nd pass caught a propagation gap the 1st pass missed (F-2: M-2's "no tautological assertions" strengthening principle was not propagated to the sibling loading-state test) AND an attestation drift from the 1st-pass author (F-1: claimed L-3 Change Log was populated but it wasn't). Validates the 2-pass discipline once again — Story 97.1-FE fix-block propagation pattern manifested as predicted.

Applied fixes:
- **F-2 (LOW)**: Strengthened the loading-state test in `ModelListSection.test.tsx`. Added positive assertion `container.querySelectorAll('[class*="animate-pulse"]').length >= 1` alongside the negative `querySelector('table') === null`. A regression to `return null` would now fail. Propagates the M-2 strengthening principle to the sibling test.
- **F-3 (INFO)**: Updated File List line count for `ModelListSection.test.tsx` from `264` to `299` (post-1st-pass M-1/M-2/M-3 + post-2nd-pass F-2 growth).
- **F-1 (LOW)**: Populated the final Change Log row (this story-close pass) with date + Lessons sub-line per Story 94.4-FE convention.

**NOT addressed**: none. All 2nd-pass findings resolved before commit.

**Gate verification (final post-2nd-pass)**:
- `npm run type-check` → 0 errors ✓
- `npx eslint 'src/**/*.ts' 'src/**/*.tsx'` → 0 errors, 112 warnings (baseline) ✓
- `npm test -- --run` → **7503 passing**, 676 skipped, 0 failed ✓ (F-2 fix added 1 positive assertion to an existing test, no net test count change)
- `bash scripts/check-doc-citations.sh` → exit 0, 22 broken (baseline) ✓
- `bash scripts/check-eslint-rules.sh` → OK: all rule names valid in 2 file(s) ✓
- Story 109.1 regression: `ForecastPageContent.test.tsx` 5/5 PASS ✓; `ModelTypeSelector.test.tsx` 12/12 PASS ✓ (post `MODEL_TYPE_LABELS` extraction)
- Story 109.2 regression: `ForecastChart.test.tsx` 22/22 PASS ✓

**2-pass review streak**: **47+** consecutive stories preserved (46 → 47 after this story).

### Senior Developer Review (AI)

**Reviewer**: BMad Master + `code-reviewer` agent (Opus, 2 fresh contexts)
**Date**: 2026-05-17
**Review outcome**: **Approve**

**Story Coverage**:
- 12/12 ACs implemented and verified
- 30 net new tests (7473 floor → 7503 passing; 27 from executor + 3 from 1st-pass M-1/M-2/M-3 + 0 from 2nd-pass F-2 which strengthened existing test)
- 5 quality gates pass at baseline
- Story 109.1 + 109.2 regression-locks preserved (39/39 tests pass)
- `MODEL_TYPE_LABELS` extraction (Task 2) successful with backward-compat barrel + re-export

**Review history**:
1. **1st-pass adversarial** (Opus, fresh): APPROVE AFTER FIXES — 3 MEDIUM (test coverage gaps) + 3 LOW. M-1/M-2/M-3 fixed; L-3 mistakenly claimed addressed (caught by 2nd pass).
2. **2nd-pass adversarial** (Opus, fresh, independent): APPROVE AS-IS — 2 LOW (F-1 attestation drift from 1st pass + F-2 sibling test propagation) + 1 INFO. All addressed.

**Action Items**: None.

**Recommendation**: Story mergeable. 47+ consecutive-story 2-pass discipline streak preserved.

### Change Log

| Date | Change |
|---|---|
| 2026-05-17 | Story created via `/bmad:bmm:workflows:create-story` (SM agent — BMad Master). Spec source: `_bmad-output/planning-artifacts/epics-109-fe.md` § Story 109.3-FE (lines 102-122) + locked decision Q1 (separate `/analytics/models` route). Pre-flight verification completed at author time — zero conflicts. Foundation: Story 108.1 fetcher + types ready; Story 109.1 `MODEL_TYPE_LABELS` available for reuse; Story 109.2 closed cleanly with 46+ 2-pass streak. Estimate: ~2 SP. |
| 2026-05-17 | Implementation + 2-pass review complete. Shipped: `/analytics/models` route + sidebar entry (Cpu icon), `<ModelListSection>` with 6 columns + 4-state Russian status badges + 3 UI states (loading/error/empty), `useAiModels` hook cabinet-isolated, `MODEL_TYPE_LABELS` relocated to `src/types/ai/forecast.ts` (Task 2 — backward-compat barrel + re-export). 30 net new tests (7473→7503). 1st pass: 3 MEDIUM test-coverage gaps + 3 LOW — M-1/M-2/M-3 fixed. 2nd pass: caught 1st-pass attestation drift (F-1) + sibling-test propagation gap (F-2) — both fixed. **Lessons:** (1) 2nd pass caught self-claim drift from 1st pass — Story 97.1-FE propagation discipline applies to fix-block attestation too, not just code. (2) M-2 strengthening principle must propagate to ALL sibling weak-assertion tests, not just the one originally flagged (loading-state test missed). (3) `MODEL_TYPE_LABELS` extraction to shared types worked with zero consumer breakage via backward-compat re-export — pattern reusable for future cross-feature constants. Status: review → done. |
| 2026-05-21 | Story 112.5-FE allowlist cleanup: original Lessons line (above) was authored pre-validator deployment (Story 111.1-FE, 2026-05-19) when the ≤120-char Lessons cap (Story 94.4-FE, 2026-04-25) had no automated enforcement. Per APPEND-ONLY closed-story Change Log convention (Story 111.1-FE F-2), the original Lessons text is retained verbatim; this disclosure row supersedes it for validator purposes only. Status: review → done. **Lessons:** (1) Closed before ≤120-char cap validator existed (Story 111.1-FE, 2026-05-19); original Lessons retained above. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows (story creation, intermediate fixes, post-review fix passes) DO NOT require Lessons. Lessons are for retrospective aggregation — keep them specific to the story (not generic advice) and reference Story-NN.M-FE markers where possible. -->
