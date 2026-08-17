# Story 110.4: Thumbs feedback mutation + UI integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **AI-forecast operator reviewing predictions**,
I want **thumbs-up / thumbs-down feedback buttons on each forecast row (both ForecastTable and EvaluationsList) that submit my judgment to the backend**,
so that **the AI team can use my labeled examples to retrain models and improve forecast accuracy on future predictions**.

## Acceptance Criteria

1. **New mutation hook** `useAiFeedback()` at `src/hooks/useAiFeedback.ts` wrapping existing `postFeedback` fetcher (Story 108.1 foundation). TanStack Query v5 `useMutation`. Inputs: `{ forecastId: string, feedbackType: 'thumbs_up' | 'thumbs_down', modelId?: string }` (modelId optional — used only for cache-invalidation scoping). Output: `void` (backend returns 201 with `{acknowledged, feedbackId}` but frontend ignores body — fire-and-forget UX).
2. **Cache invalidation on success** — when modelId provided, invalidate `useAiEvaluations` queryKey for that model: `queryClient.invalidateQueries({ queryKey: ['ai', 'evaluations', cabinetId, modelId] })` (cabinet-scoped + model-scoped, matching Story 110.2-FE F-1 queryKey shape). Also invalidate `useAiSkuAccuracy` for the same model so the per-SKU view refreshes if user navigates there.
3. **New presentation component** `<FeedbackButtons forecastId={string} modelId?={string} />` at `src/components/custom/ai/FeedbackButtons.tsx`. Renders two icon-only buttons: ThumbsUp (lucide-react) and ThumbsDown. WCAG: each button has `aria-label="Полезный прогноз"` / `"Бесполезный прогноз"` AND `title` attribute for hover hint. Visible focus ring per WCAG 2.4.7.
4. **Optimistic UI** — clicking a thumb: (a) immediately disables BOTH buttons (`mutation.isPending` from useAiFeedback); (b) on success, replace buttons with a subtle success indicator (`<CheckCircle className="text-success-600">` + small "Спасибо" text, 2s timeout) before re-enabling; (c) on error, re-enable both buttons + render small inline `<Alert>` error message with `role="alert"` (auto-dismiss after 5s).
5. **Anti-Pattern #8 not applicable** — feedback inputs are enum/boolean, not money/ratio. Stay vigilant if rendering any numerical state.
6. **Integration: `ForecastTable` rows (Story 109.x)** — add a new column `<TableHead>Оценка</TableHead>` between any existing column and the row-end. Each row renders `<FeedbackButtons forecastId={forecast.id} modelId={modelId} />`. Update `ForecastTable` props if needed to thread `modelId` from parent (currently exists via the forecast page route param). Preserve existing tests; add new assertions for column rendering + button accessibility.
7. **Integration: `EvaluationsList` rows (Story 110.2-FE)** — add `<FeedbackButtons forecastId={entry.forecastId} modelId={modelId} />` as a new column in `EvaluationsTable.tsx` (between existing columns and the row-end), via the row's `onRowClick` boundary. WCAG: ensure `stopPropagation` on button clicks so they don't trigger row navigation (per Story 110.2-FE F-3 nested-interactive discipline).
8. **WCAG 2.1 AA**: icon-only buttons MUST have `aria-label` (action verb, Russian) AND visible focus ring (`focus-visible:ring-2 focus-visible:ring-offset-2` Tailwind). Test with keyboard navigation: Tab → button → Enter/Space → mutation fires; Escape during pending state cancels nothing (mutation already in flight; just visual).
9. **Cabinet-isolation**: queryClient.invalidateQueries uses cabinetId in the queryKey shape — verify cabinetId from `useAuthStore` is included in invalidation pattern so Story 97.5-FE multi-tenant discipline is preserved.
10. **Test coverage** ≥ 90% for new files: hook tests (success, error, optimistic disable, cache invalidation pattern), component tests (both thumbs render, click triggers mutation, aria-label correctness, focus ring class present, success indicator after mutation success, error alert on failure, stopPropagation on row-nested usage). Integration tests for `ForecastTable` + `EvaluationsTable` columns.
11. **Pre-flight verification** — foundation confirmed shipped: `postFeedback` fetcher + `AiFeedbackRequest` type + `FeedbackType` enum all exist (Story 108.1). No duplicate work in fetcher/types layer.
12. **2-pass adversarial review complete** before flipping `Status: review → done`.

## Tasks / Subtasks

- [x] **Task 1 — Create `useAiFeedback` mutation hook** (AC: 1, 2, 9) — `src/hooks/useAiFeedback.ts` + tests
  - [x] TanStack Query `useMutation<void, ApiError, { forecastId: string; feedbackType: FeedbackType; modelId?: string }>`.
  - [x] mutationFn calls `postFeedback({ forecastId, feedbackType })` from `src/lib/api/ai/system.ts:66`. modelId is hook-local — NOT forwarded to backend (used only for cache-invalidation scoping per AC-1).
  - [x] `onSuccess`: when `modelId` provided, invalidate cabinet-scoped queries: `['ai', 'evaluations', cabinetId, modelId]` AND `['ai', 'sku-accuracy', cabinetId, modelId]`. When `modelId` absent, defensively invalidates `['ai']` root key to refresh forecast page cache (F-1 fix). Read cabinetId from `useAuthStore`.
  - [x] Use precedent: `src/hooks/useTrainAiModel.ts:105-108` for `useMutation` + `invalidateQueries` pattern.
  - [x] Tests in `src/hooks/__tests__/useAiFeedback.test.ts`:
    - success path → fetcher called with right body
    - error path → mutation.error populated
    - `modelId` provided → invalidateQueries called twice (evaluations + sku-accuracy)
    - `modelId` absent → invalidateQueries called once with `['ai']` root key (F-1 fix)
    - cabinet-isolation: changing cabinetId between mounts produces different invalidation keys (single shared QueryClient pattern per Story 110.2-FE F-4)
    - behavioral cache-collision: cab-B mutation never touches cab-A's keys (F-6 fix)

- [x] **Task 2 — Create `<FeedbackButtons>` component** (AC: 3, 4, 5, 8) — `src/components/custom/ai/FeedbackButtons.tsx` + tests
  - [x] Props: `{ forecastId: string; modelId?: string }`.
  - [x] Two `<Button variant="ghost" size="sm">` with `lucide-react` `ThumbsUp` / `ThumbsDown` icons.
  - [x] WCAG: `aria-label="Полезный прогноз"` / `"Бесполезный прогноз"`, `title` matching, `focus-visible:ring-2 focus-visible:ring-offset-2` classes.
  - [x] State machine: idle → pending (both disabled) → success (Check icon + "Спасибо", 2s timeout, then back to idle) OR error (Alert, 5s timeout, then back to idle).
  - [x] Use `useState<'idle' | 'success' | 'error'>` for the visible-state machine; pull `isPending` from `useAiFeedback()` result. Declarative `useEffect` watching `mutation.isSuccess/isError` (F-5 fix — prevents setState-on-unmount race).
  - [ ] Optional: track `lastClicked: 'up' | 'down' | null` for visual feedback on WHICH thumb was clicked (deferred — optional per spec; not implemented in this iteration).
  - [x] `onClick` handlers: `e.stopPropagation()` first (mandatory per Story 110.2-FE F-3 nested-interactive discipline), then `mutation.mutate({ forecastId, feedbackType, modelId })`.
  - [x] Tests in `src/components/custom/ai/__tests__/FeedbackButtons.test.tsx`:
    - Both thumbs render with correct aria-labels
    - Click ThumbsUp → mutation called with `feedbackType: 'thumbs_up'`
    - Click ThumbsDown → mutation called with `feedbackType: 'thumbs_down'`
    - During pending: both buttons disabled; second click does not fire mutation (F-3 fix)
    - On success: Check icon + "Спасибо" rendered, buttons hidden for 2s; role="status" asserted (F-9 fix)
    - On error: Alert with `role="alert"` rendered; 403 → "Нет доступа", other → generic (F-7 fix)
    - Keyboard: Tab → focus visible ring class present; Enter/Space triggers
    - stopPropagation: parent onClick NOT triggered when button clicked; control baseline proves propagation works (F-4 fix)

- [x] **Task 3 — Integrate into `ForecastTable` (Story 109.x)** (AC: 6) — `src/app/(dashboard)/analytics/forecast/components/ForecastTable.tsx` + tests
  - [x] Add new `<TableHead>Оценка</TableHead>` column (after existing columns, before any action column if present).
  - [x] Each row renders `<FeedbackButtons forecastId={forecast.id} modelId={modelId} />`.
  - [x] Thread `modelId` from parent component (the page already has it via route param; if ForecastTable doesn't accept it, widen props).
  - [x] Preserve all existing tests; add new tests asserting:
    - Column "Оценка" renders
    - Each row has thumbs buttons
    - aria-labels present

- [x] **Task 4 — Integrate into `EvaluationsTable` (Story 110.2-FE)** (AC: 7) — `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsTable.tsx` + tests
  - [x] Add new `<TableHead>Оценка</TableHead>` column.
  - [x] Each row renders `<FeedbackButtons forecastId={entry.forecastId} modelId={modelId} />`.
  - [x] `modelId` already available in `EvaluationsTable` props (passed from parent — verify).
  - [x] Story 110.2-FE F-3 discipline: feedback buttons inside clickable row — stopPropagation already in FeedbackButtons component (Task 2); verify integration doesn't trigger row navigation accidentally.
  - [x] Update tests: assert new column renders, buttons aria-labels, stopPropagation works (click button → router.push NOT called).

- [x] **Task 5 — Verify Story 109.x ForecastTable thread + sprint-status + Change Log** (AC: all)
  - [x] Flip story through `ready-for-dev → in-progress → review → done`.
  - [x] Final Change Log row with `**Lessons:**` sub-line per Story 94.4-FE convention.

- [x] **Task 6 — 2-pass adversarial review** (AC: 12)
  - [x] 1st pass (fresh context, code-reviewer agent, Opus). Apply fixes — see Post-1st-pass-review fixes (2026-05-19).
  - [x] 2nd pass (fresh context, independent). Apply fixes — see Post-2nd-pass-review fixes (2026-05-19).
  - [x] Preserve 54+ consecutive-story 2-pass discipline streak.

## Dev Notes

### Pre-Flight Verification Results (Story 105.2-FE, verified 2026-05-19)

Pre-flight grep for AC nouns showed **partial foundation already shipped**:

**Already exists** (no work needed):
- `src/lib/api/ai/system.ts:66` — `postFeedback(body: AiFeedbackRequest): Promise<void>` fetcher (Story 108.1)
- `src/types/ai/system.ts:27-32` — `FeedbackType = 'thumbs_up' | 'thumbs_down'` enum + `AiFeedbackRequest` interface (Story 108.1)
- `src/lib/api/ai/index.ts:41` — re-exports postFeedback
- `src/app/(dashboard)/analytics/forecast/components/ForecastTable.tsx` — target for Task 3 (Story 109.x)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsTable.tsx` — target for Task 4 (Story 110.2-FE)

**Needs creation** (Story 110.4-FE work):
- `useAiFeedback` mutation hook
- `<FeedbackButtons>` presentation component
- Integration in 2 sibling tables
- ~4 new test files

**Backend contract discrepancy noted**:
- Epic 110-FE spec line 114 says `{forecastId, thumbsUp: boolean}` request body
- Actual backend (test-api/99-ai.http:866-868) uses `{forecastId, feedbackType: 'thumbs_up' | 'thumbs_down'}` enum
- Frontend foundation in `src/types/ai/system.ts:32` already uses enum (correct — matches backend)
- **Story 110.4 follows actual backend contract**, NOT epic spec text. Epic spec text was written before backend stub finalized.

**Pre-flight grep output (2026-05-19)**:
```
grep -rn "useAiFeedback\|FeedbackButtons" src/ → 0 hits (confirms not yet implemented)
grep -rn "postFeedback\|AiFeedbackRequest" src/ → 6 hits in system.ts + index.ts (foundation confirmed)
grep -rn "/v1/ai/feedback" src/ → 3 hits in types/system.ts + lib/api/ai/system.ts + lib/api/ai/index.ts
```

### Architecture Patterns to Follow

- **Mutation precedent**: `src/hooks/useTrainAiModel.ts:105-108` — `useMutation<TResponse, ApiError, TInput>` + `onSuccess: queryClient.invalidateQueries(...)`. Same shape; replicate.
- **Cache invalidation pattern** (Story 110.2-FE F-1): queryKey scoped by `cabinetId + modelId`. Invalidate both `evaluations` and `sku-accuracy` queries so the cascade ripples to any visible per-model views.
- **Nested-interactive discipline** (Story 110.2-FE F-3): buttons inside clickable rows MUST `e.stopPropagation()`. Mandatory for both ForecastTable + EvaluationsTable integrations.
- **WCAG 2.1.1 keyboard activation** (Story 110.3-FE F-1 propagation precedent): icon-only buttons are `<button>` elements which natively support Enter/Space — no custom keyDown needed. BUT verify visible focus ring class is applied so Tab navigation is perceivable.
- **WCAG 2.4.7 focus-visible** (Story 110.3-FE F-6 precedent): use Tailwind `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none`.
- **Optimistic UI vs deferred state**: NO need for `useMutation`'s `onMutate` rollback complexity — feedback POST is idempotent at the backend, and the UI just shows pending → success/error. Keep it simple per Epic 110 spec Risk Q4 ("Defer unless backend latency causes UX issues in practice").
- **Pure-function discipline**: state-machine reducer for `'idle' | 'success' | 'error' | 'pending'` can be inlined in the component (≤200 line cap; expect ~80 lines total). No need to extract unless component grows.
- **Russian locale**: ALL aria-labels and visible text in Russian (`"Полезный прогноз"`, `"Бесполезный прогноз"`, `"Спасибо"`, error message).

### File Structure Plan

```
src/
├── hooks/
│   ├── useAiFeedback.ts                              ← NEW (Task 1)
│   └── __tests__/
│       └── useAiFeedback.test.ts                     ← NEW
├── components/
│   └── custom/
│       └── ai/                                       ← NEW directory
│           ├── FeedbackButtons.tsx                   ← NEW (Task 2)
│           └── __tests__/
│               └── FeedbackButtons.test.tsx          ← NEW
└── app/(dashboard)/analytics/
    ├── forecast/components/
    │   ├── ForecastTable.tsx                         ← MODIFIED (Task 3)
    │   └── __tests__/
    │       └── ForecastTable.test.tsx                ← MODIFIED
    └── models/[id]/evaluations/components/
        ├── EvaluationsTable.tsx                      ← MODIFIED (Task 4)
        └── __tests__/
            └── EvaluationsTable.test.tsx             ← MODIFIED
```

### Testing Standards

- Vitest + React Testing Library
- Mock `useAuthStore` for cabinetId via `vi.mocked(useAuthStore).mockReturnValue({ cabinetId: 'cab-1' } as never)`
- Mock fetcher: `vi.mock('@/lib/api/ai/system')` + `vi.mocked(postFeedback).mockResolvedValue(undefined)` (or `.mockRejectedValueOnce` for error path — note `Once` per CLAUDE.md test pattern)
- WCAG assertions: `expect(button).toHaveAttribute('aria-label', 'Полезный прогноз')`; `expect(button.className).toContain('focus-visible:ring-2')`
- Optimistic-UI state transitions: use `act()` + `vi.useFakeTimers()` to advance through the 2s success timeout. Restore timers after each test.
- StopPropagation: spy on parent onClick handler; assert it WAS NOT called when button clicked

### Defensive Frontend Considerations (CLAUDE.md § Defensive Frontend Principle)

- Backend 400 (validation error) → render error Alert with generic message; do NOT expose the trace_id to users.
- Backend 403 (forbidden — wrong cabinet?) → render error Alert with "Нет доступа". Log to console for debugging.
- Network failure → mutation.error has standard ApiError shape; render generic "Не удалось сохранить отзыв".

### References

- **Source**: `_bmad-output/planning-artifacts/epics-110-fe.md` § Story 110.4-FE (lines 109-124).
- **Foundation**:
  - `src/lib/api/ai/system.ts:64-67` (postFeedback fetcher — Story 108.1)
  - `src/types/ai/system.ts:27-32` (FeedbackType + AiFeedbackRequest — Story 108.1)
- **Backend contract**: `../test-api/99-ai.http:861-910` — POST /v1/ai/feedback with `{forecastId, feedbackType}` body; 201 returns `{acknowledged, feedbackId}`; 400 / 401 / 403 error envelopes documented
- **Patterns**: `frontend/CLAUDE.md` (anti-patterns, two-pass review, accepted baselines, Defensive Frontend Principle), `frontend/CLAUDE-PATTERNS.md` (Boundary Normalizer, AP#8 Exceptions), `frontend/CLAUDE-ANTI-PATTERNS.md`.
- **Precedent stories**:
  - Story 108.1-FE — types/fetcher foundation
  - Story 109.x — `ForecastTable` integration target + `useTrainAiModel.ts` mutation precedent
  - Story 110.2-FE — F-3 nested-interactive discipline, F-1 queryKey scoping pattern, F-6 aria-sort pattern
  - Story 110.3-FE — F-1 keyboard activation discipline (icon buttons get this for free via native `<button>`), F-6 focus-visible ring class precedent

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (Executor)

### Debug Log References

None — clean implementation, no debug loops required.

### Completion Notes List

- ForecastTable `modelId` is optional (undefined in general forecast page context — no model-scoped cache to invalidate there; invalidation only fires when modelId is provided).
- EvaluationsList.test.tsx needed `QueryClientProvider` wrapper + `useAuthStore`/`postFeedback` mocks after FeedbackButtons was embedded in EvaluationsTable (integration test cascade).
- FeedbackButtons only renders when `p.forecastId` is defined (optional field) in ForecastTable — rows without forecastId show empty Оценка cell.

### File List

- `src/hooks/useAiFeedback.ts` (45 lines) — NEW
- `src/hooks/__tests__/useAiFeedback.test.ts` (158 lines) — NEW
- `src/components/custom/ai/FeedbackButtons.tsx` (97 lines) — NEW
- `src/components/custom/ai/__tests__/FeedbackButtons.test.tsx` (175 lines) — NEW
- `src/app/(dashboard)/analytics/forecast/components/ForecastTable.tsx` (103 lines) — MODIFIED
- `src/app/(dashboard)/analytics/forecast/components/__tests__/ForecastTable.test.tsx` (157 lines) — MODIFIED
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsTable.tsx` (170 lines) — MODIFIED
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsList.tsx` (185 lines) — MODIFIED (modelId prop thread)
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsTable.test.tsx` (244 lines) — MODIFIED
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsList.test.tsx` (400 lines) — MODIFIED (wrapper + mocks)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED

### Change Log

| Date | Change |
|---|---|
| 2026-05-19 | Story created via `/bmad:bmm:workflows:create-story` (BMad Master). Spec source: `_bmad-output/planning-artifacts/epics-110-fe.md` § Story 110.4-FE (lines 109-124). Pre-flight verification confirmed substantial foundation already shipped via Story 108.1 (postFeedback fetcher, AiFeedbackRequest type, FeedbackType enum). Backend contract discrepancy noted: epic spec text uses `thumbsUp: boolean` but actual backend (test-api/99-ai.http:867-868) + frontend types use `feedbackType: 'thumbs_up' \| 'thumbs_down'` enum — story follows actual contract. Scope: useAiFeedback mutation hook + FeedbackButtons component + 2 sibling table integrations. Estimate: ~0.5 SP. |
| 2026-05-19 | Implementation complete via dev-story workflow. useAiFeedback hook + FeedbackButtons component (idle/pending/success/error state machine) + Оценка column in ForecastTable + EvaluationsTable. EvaluationsList.test patched with QueryClientProvider wrapper. ESLint 0E/112w, type-check 0, vitest 7742 passing (+25), check-docs 22 broken (baseline). Status: in-progress → review. Awaiting 2-pass adversarial review. |
| 2026-05-19 | 2-pass adversarial review complete. 10 1st-pass + 8 2nd-pass findings resolved across different defect classes. F-4 (2nd pass) revealed a real state-machine bug: missing `mutation.submittedAt` in useEffect deps prevented second-click success transitions — discipline caught a production defect. Final gates: ESLint 0E/112w, type-check 0, vitest 7749 passing (+32 from 7717 floor), check-docs 22 broken (baseline). **Lessons:** (1) `['ai']` prefix invalidates 9 sibling AI caches; narrow to `['ai','forecast']` to scope to one cache. (2) useEffect deps for mutation state machines need `mutation.submittedAt` for repeat-click success transitions. (3) Plain `new Error()` in typed `useMutation<_, ApiError>` tests pass by coincidence — use real ApiError (AP#3). Status: review → done. |

### Post-1st-pass-review fixes (2026-05-19)

- F-1 (CRITICAL): `useAiFeedback` now invalidates `['ai']` root queryKey when `modelId` absent — defensive fallback that refreshes forecast page cache even without per-model identity. Story Task 1 sub-task description updated to document this path. Files: `useAiFeedback.ts`, `useAiFeedback.test.ts`.
- F-2 (HIGH): All nested sub-task checkboxes marked `[x]`; optional `lastClicked` highlight annotated as deferred. File: `110-4-fe-thumbs-feedback-mutation.md`.
- F-3 (HIGH): Pending-state test now fires second click + asserts `postFeedback` called only once (`toHaveBeenCalledOnce()`). File: `FeedbackButtons.test.tsx`.
- F-4 (HIGH): Added control baseline test proving jsdom event propagation works — sibling `<span>` click bubbles to parent; establishes infra correctness before stopPropagation test. File: `FeedbackButtons.test.tsx`.
- F-5 (MEDIUM): Replaced imperative `onSuccess`/`onError` mutation callbacks with declarative `useEffect` watching `mutation.isSuccess`/`mutation.isError` — prevents setState-on-unmounted-component race. File: `FeedbackButtons.tsx`.
- F-6 (MEDIUM): Added behavioral cache-collision test — cab-B mutation's `invalidateQueries` calls are inspected to assert no `cab-A` key appears (spy-based; data-persistence approach rejected due to `gcTime:0` eviction). File: `useAiFeedback.test.ts`.
- F-7 (MEDIUM): 403 errors now render "Нет доступа"; all other errors render "Не удалось сохранить отзыв". Two tests added covering each branch with real `ApiError` instances. Files: `FeedbackButtons.tsx`, `FeedbackButtons.test.tsx`.
- F-8 (MEDIUM): Added inline comment above `mutationFn` explaining `modelId` is hook-local — not forwarded to backend, only used for cache-invalidation scoping. File: `useAiFeedback.ts`.
- F-9 (LOW): Success `<span>` gained `role="status" aria-live="polite"` for screen-reader announcement; test asserts `getByRole('status')` returns the "Спасибо" node. Files: `FeedbackButtons.tsx`, `FeedbackButtons.test.tsx`.
- F-10 (LOW): Switched `text-green-600` → `text-green-700` (`#15803d`, ~6.5:1 contrast on white) for guaranteed WCAG 1.4.3 compliance on small text. File: `FeedbackButtons.tsx`.

**Validation**: ESLint 0 errors / 112 warnings, type-check 0 errors, vitest 7747 passing (+5 net from 7742 baseline), check-docs exit 0 / 22 broken matching baseline.
**Streak**: 2-pass review discipline applied — 1st pass complete; awaiting 2nd pass.

### Post-2nd-pass-review fixes (2026-05-19)

- F-1 (HIGH): Narrowed root invalidation from `['ai']` (9 hooks) to `['ai', 'forecast']` (forecast hook only) — avoids cache-scope-creep from broad prefix match. Test updated to assert `['ai', 'forecast']`. Files: `useAiFeedback.ts`, `useAiFeedback.test.ts`.
- F-2 (HIGH): Replaced tautological spy-based cabinet-isolation test with data-persistence test (`gcTime:Infinity` + `setQueryData` pre-seed + behavioral assertion that cab-A's cache survives cab-B's mutation). File: `useAiFeedback.test.ts`.
- F-3 (HIGH): Replaced `new Error('network error')` with `new ApiError('Internal Server Error', 500)` in two test cases (generic-error and auto-reset tests) per anti-pattern #3. File: `FeedbackButtons.test.tsx`.
- F-4 (MEDIUM): Added second-click-after-auto-reset test. Test **failed before fix** (confirmed real bug): `useEffect` deps `[mutation.isSuccess, mutation.isError]` didn't re-fire when `isSuccess` stayed `true` across mutations. Fix: added `mutation.submittedAt` to deps — changes on each call, forcing effect to fire regardless of prior `isSuccess` state. Files: `FeedbackButtons.tsx`, `FeedbackButtons.test.tsx`.
- F-5 (MEDIUM): Added `vi.useRealTimers()` defensive reset to `beforeEach` — prevents cross-test fake-timer leak. File: `FeedbackButtons.test.tsx`.
- F-6 (MEDIUM): Added `instanceof ApiError` guard before `.status` access — `errorStatus` is `undefined` for non-`ApiError` runtime errors, defaulting to generic message rather than silently undefined-accessing `.status`. File: `FeedbackButtons.tsx`.
- F-7 (LOW): Change Log placeholder — informational/deferred; parent session fills date + Lessons on done flip.
- F-8 (LOW): Added `Loader2` spinner (`animate-spin`) inline during `mutation.isPending` state for UX feedback on slow backends. Added test asserting `.animate-spin` element present during in-flight mutation. Files: `FeedbackButtons.tsx`, `FeedbackButtons.test.tsx`.

**Validation**: ESLint 0 errors / 112 warnings, type-check 0 errors, vitest 7749 passing (+2 from 7747 post-1st-pass baseline), check-docs exit 0 / 22 broken matching baseline.
**Streak**: 2-pass review discipline extends to 54+ consecutive stories. Both passes found defects of DIFFERENT classes (1st: spec-vs-impl-drift, story-hygiene, weak assertions, missing optimistic features, a11y; 2nd: cache-scope-creep, tautological tests, anti-pattern #3, state-machine transition gap, defense-in-depth).

### Post-3rd-pass-review fixes (2026-05-19)

3rd-pass adversarial review (fresh context, Opus) ran after Status: done flip — sanity check against the 54+ consecutive-story 2-pass streak. Found 1 LOW finding (no runtime defects):

- F-1 (LOW): Lessons line 1 in the Change Log final row was 137 chars, exceeding Story 94.4-FE's 120-char-per-lesson cap. Both prior fresh-context passes missed mechanical character counting. Shortened L1 from "[`['ai']` prefix-invalidation matches all sibling AI caches; narrow to ('ai','domain') to avoid scope-creep into 9 unrelated hooks.]" (137 chars) → "[`['ai']` prefix invalidates 9 sibling AI caches; narrow to `['ai','forecast']` to scope to one cache.]" (101 chars). Same defect class found in Story 110.3 L1 (121 chars, 1 over) — propagated fix there per Story 97.1-FE fix-block propagation discipline: replaced "confirmed" → "found" (saves 5 chars, brings to 115). All 6 Lessons lines across Stories 110.3 + 110.4 now ≤120 chars (verified via python `len()`).

**Meta-pattern note** (3rd-pass surfaces): mechanical character counts on Story 94.4-FE Lessons lines escape both adversarial fresh-context passes because reviewers focus on semantic/behavioral correctness, not byte-level attestation. Recommendation for Epic 110-FE retro: add a lightweight `scripts/check-lessons-length.sh` validator that scans final-Change-Log rows for `**Lessons:**` content and reports any sentence >120 chars. Pre-commit hook integration optional.

**Validation**: ESLint 0E/112w, type-check 0, vitest 7749 passing (unchanged — no test changes), check-docs exit 0 / 22 broken (baseline).
**Streak**: 2-pass discipline preserved at 54+; 3rd-pass surfaces a refinement opportunity (mechanical char-count automation), not a behavioral discipline failure.

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows (story creation, intermediate fixes, post-review fix passes) DO NOT require Lessons. -->
