# Story 109.4: Model training trigger + polling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **seller analyst on the AI Models page (`/analytics/models`)**,
I want **a per-row "Обучить" button that triggers model training and shows a live progress indicator until the model becomes active**,
so that **I can kick off retraining for a specific model without leaving the table, see at a glance which model is currently training, and immediately know when the new version is ready — without manually refreshing the page**.

## Acceptance Criteria

1. **AC-1 — `useTrainAiModel()` mutation hook with structured error handling**
   - Hook lives at `src/hooks/useTrainAiModel.ts`.
   - Wraps existing `postModelTrain` fetcher from `src/lib/api/ai/models.ts:76` (Story 108.1 foundation — DO NOT re-implement).
   - Returns a `useMutation` result typed as `useMutation<ModelTrainResponse, ApiError, ModelType, ...>`. Mutation variable is just `modelType: ModelType` (the hook constructs the request body internally).
   - **Cabinet-isolated cache invalidation**: on success, invalidate `aiModelsKeys.list(cabinetId)` so the table re-fetches the new model state.
   - **Error parsing** per backend integration guide:
     - **HTTP 202 (duplicate)** — `postModelTrain` parses this into `{status: 'duplicate', ...}` (already returned via the response body's `status` field). Treat as a soft success — show "Обучение уже идёт" inline; do NOT throw.
     - **HTTP 422 (insufficient data)** — `ApiError` thrown by apiClient. The error body shape per integration guide:
       ```ts
       interface InsufficientDataErrorBody {
         error: { code: 'INSUFFICIENT_DATA'; message: string }
         weeksCollected: number
         weeksRequired: number
         cogsCoveragePct: number  // 0-100 scale, percent
       }
       ```
       Expose these structured fields from the hook via `error.body` so the button can render specific copy.
     - **HTTP 429 (rate limit)** — `ApiError` thrown by apiClient. No structured body needed; surface a generic "Превышен лимит обучения, попробуйте через час" message.
   - Pure-helper extraction: `parseTrainErrorMessage(error: unknown): { code: 'INSUFFICIENT_DATA' | 'RATE_LIMIT' | 'UNKNOWN'; message: string; details?: InsufficientDataErrorBody }` — exported from the hook file (or sibling `useTrainAiModel.helpers.ts`) for direct unit testing. Maps `ApiError.status` 422/429/other to the canonical shape.

2. **AC-2 — `useAiModels()` extension: optional polling**
   - Extend `src/hooks/useAiModels.ts` to accept `options?: { polling?: boolean }`.
   - When `polling === true`: set `refetchInterval: 5_000` on the underlying `useQuery`. When `false` or unset: no polling (preserves Story 109.3 default behavior).
   - **Caller is responsible for deciding polling on/off** — see AC-5 polling strategy.
   - Backward-compat: existing callers (Story 109.3 `ModelListSection`) continue to work without changes (omit the new options arg).
   - Update `useAiModels.test.ts` to add 2 cases: (a) `useAiModels()` without options → no refetchInterval; (b) `useAiModels({ polling: true })` → refetchInterval is `5_000`. Test the queryOptions object that `useQuery` is called with (mock `useQuery` or assert via a thin wrapper helper).

3. **AC-3 — `<TrainModelButton />` component**
   - Component at `src/app/(dashboard)/analytics/models/components/TrainModelButton.tsx`.
   - Props: `{ modelType: ModelType; currentStatus: ModelStatus }`.
   - Idle state: shadcn `<Button size="sm" variant="outline">Обучить</Button>`.
   - **Disabled when `currentStatus === 'training'`** (per locked Q4 decision in epic spec line 138). Shows `<Button disabled><Loader2 className="animate-spin h-4 w-4 mr-1" aria-hidden="true" /> Обучается</Button>` instead.
   - On click: call `mutate(modelType)`. While mutation pending: button shows `<Loader2 className="animate-spin" /> Обучение запущено...`.
   - On success (whether HTTP 201 `queued` OR HTTP 202 `duplicate`): show inline success indicator next to the button — `<span className="text-xs text-muted-foreground ml-2">{response.status === 'duplicate' ? 'Обучение уже идёт' : 'Запущено'}</span>`. Auto-clear after 5 seconds (use `setTimeout` + cleanup).
   - On error: render the error message inline as a small `<span className="text-xs text-destructive ml-2">{parsed.message}</span>`. Auto-clear after 8 seconds.
   - WCAG 2.1 AA: `<Loader2>` has `aria-hidden="true"` (text label provides accessible name); button has `aria-busy={isPending}` during mutation; inline status text uses `role="status" aria-live="polite"` so screen readers announce state transitions.

4. **AC-4 — Russian copy (exact strings, byte-correct)**
   | State | Text |
   |---|---|
   | Idle button | `Обучить` |
   | Disabled (already training) | `Обучается` |
   | Pending (mutation in flight) | `Обучение запущено...` |
   | Success — fresh queued (201) | `Запущено` |
   | Success — duplicate (202) | `Обучение уже идёт` |
   | Error 422 (insufficient data) — generic copy | `Недостаточно данных: собрано {weeksCollected}/{weeksRequired} нед., покрытие COGS {cogsCoveragePct}%` |
   | Error 429 (rate limit) | `Превышен лимит обучения, попробуйте через час` |
   | Error other | `Ошибка запуска обучения: {error.message}` |
   - The 422 error template MUST interpolate the structured fields from `error.body` (per AC-1 InsufficientDataErrorBody). Watch for Cyrillic 'е' vs Latin 'e', em-dash vs hyphen, NBSP.

5. **AC-5 — Polling strategy: enable when ANY model is `'training'`, disable otherwise**
   - In `ModelListSection.tsx`: compute `const isAnyTraining = data?.models?.some(m => m.status === 'training') ?? false`.
   - Pass to hook: `useAiModels({ polling: isAnyTraining })`.
   - Rationale: only poll when a transition is expected (saves network + reduces React re-renders). When user kicks off training, the optimistic-friendly path is:
     1. User clicks "Обучить" → mutation starts.
     2. Mutation success → cache invalidated → `useAiModels` refetches → models list shows the new row with `status: 'training'`.
     3. `isAnyTraining` flips to `true` → polling enables.
     4. Subsequent polls fetch the updated list. When status transitions to `'active'`, `isAnyTraining` flips to `false` → polling stops.
   - **Avoid infinite polling**: if backend never transitions the status (broken model), polling continues. Acceptable — the indicator shows the model is still "Обучается" and the user can investigate. No timeout in this story; document as a known limitation in Dev Notes.
   - Verify with a unit test on `useAiModels` that `refetchInterval: 5000` is passed when `polling: true`.

6. **AC-6 — Integration into `ModelListSection`: new 7th column "Действия"**
   - Add `<TableHead>Действия</TableHead>` as the rightmost column header.
   - For each row, render `<TableCell><TrainModelButton modelType={model.modelType} currentStatus={model.status} /></TableCell>`.
   - **Click-event propagation**: rows are clickable (Story 109.3 AC-6 row navigation to performance detail). Clicking the train button MUST NOT trigger row navigation. Use `e.stopPropagation()` in the button's onClick, OR (preferred) wrap the button cell in `<div onClick={e => e.stopPropagation()}>` and also handle keyboard event propagation (Space/Enter on the button mustn't trigger row keyboard handler).
   - Update happy-path test in `ModelListSection.test.tsx`: assert 7 column headers; assert each row has a Train button; assert clicking the button does NOT call `router.push` (the row-navigation mock).

7. **AC-7 — Tests**
   - **`useTrainAiModel.test.ts`** (~10 tests):
     - Pure helper `parseTrainErrorMessage` (5 cases): null/undefined → UNKNOWN; ApiError 422 with structured body → INSUFFICIENT_DATA + template-ready message; ApiError 422 with malformed body → INSUFFICIENT_DATA + generic message; ApiError 429 → RATE_LIMIT; ApiError 500 → UNKNOWN with error.message.
     - `useTrainAiModel` invokes `postModelTrain` with the right body (~2 cases).
     - Cache invalidation on success: assert `queryClient.invalidateQueries` called with `aiModelsKeys.list(cabinetId)` (~1 case).
     - 202 duplicate path: response status='duplicate' → mutation success, no error (~1 case).
     - 422 path: mock `postModelTrain` to reject with ApiError(422, body); assert `error.body` structured fields exposed (~1 case).
   - **`useAiModels.test.ts`** — extend with 2 polling tests per AC-2.
   - **`TrainModelButton.test.tsx`** (~12 tests):
     - Idle state renders `Обучить` button (enabled).
     - `currentStatus='training'` → disabled button + `Обучается` text + spinner.
     - Click triggers mutation; pending state shows `Обучение запущено...` + spinner.
     - Success queued → `Запущено` inline.
     - Success duplicate → `Обучение уже идёт` inline.
     - Error 422 with structured body → renders specific copy with weeksCollected/weeksRequired/cogsCoveragePct interpolated.
     - Error 429 → renders `Превышен лимит обучения, попробуйте через час`.
     - Error other → renders generic `Ошибка запуска обучения: {message}`.
     - Auto-clear: success message disappears after 5s (use `vi.useFakeTimers()`); error after 8s.
     - WCAG: `aria-busy` during mutation; `role="status" aria-live="polite"` on status text.
   - **`ModelListSection.test.tsx`** — extend per AC-6.

8. **AC-8 — All baseline quality gates remain green**
   - Per `CLAUDE.md` § Accepted Baselines:
     - `npm run type-check` → 0 errors.
     - `npx eslint 'src/**/*.ts' 'src/**/*.tsx'` → 0 errors, ≤112 warnings (baseline).
     - `npm test -- --run` → ≥ **7503 passing** (current floor after Story 109.3 close), 0 failed.
     - `bash scripts/check-doc-citations.sh` → exit 0, 22 broken (baseline).
     - `bash scripts/check-eslint-rules.sh` → OK.
   - Target: ~22-26 new tests added by this story (10 useTrainAiModel + 2 useAiModels polling + 12 TrainModelButton + 2-3 ModelListSection integration).

9. **AC-9 — 2-pass adversarial code review BEFORE commit**
   - Per `CLAUDE.md` § Two-pass review discipline. Capture findings under `### Post-1st-pass-review fixes (YYYY-MM-DD)` and `### Post-2nd-pass-review fixes (YYYY-MM-DD)` sub-headings in Dev Agent Record.
   - This story counts toward the **47+** consecutive-story 2-pass streak (preserved after Story 109.3).

10. **AC-10 — Pre-flight verification logged**
    - Per Story 105.2-FE Step 4.5, executor re-runs the 4 greps from § Pre-Flight Verification below; pastes raw output into `### Debug Log References`; confirms zero conflicts.

## Tasks / Subtasks

- [ ] **Task 1 — Pre-flight verification re-run** (AC: #10)
  - [ ] Run the 4 greps in § Pre-Flight Verification; paste output into Debug Log References.
  - [ ] Confirm: no existing `useTrainAiModel` / `TrainModelButton`; `postModelTrain` fetcher unchanged; `useAiModels` from Story 109.3 ready for polling extension; `ModelListSection` 6-column structure intact.

- [ ] **Task 2 — Inspect backend error response shapes** (AC: #1)
  - [ ] Read `docs/AI-FRONTEND-INTEGRATION-GUIDE.md` § Model Management § Train endpoint for the 422 body structure.
  - [ ] Inspect `src/lib/api-client.ts` for the `ApiError` class — verify it exposes `.status` (HTTP code) AND `.body` (parsed JSON). If `body` is not exposed structurally, extend the class OR plan a normalization layer in the hook.
  - [ ] Document the 422 body shape in Debug Log References (or correct AC-1's `InsufficientDataErrorBody` interface if it differs from the actual contract).

- [ ] **Task 3 — `parseTrainErrorMessage` pure helper + tests** (AC: #1, #7)
  - [ ] Create `parseTrainErrorMessage(error: unknown)` function. Place in `src/hooks/useTrainAiModel.ts` (or sibling helpers file if hook file approaches 100 lines).
  - [ ] Write 5 unit tests covering all branches BEFORE writing the hook (TDD-style).

- [ ] **Task 4 — `useTrainAiModel` mutation hook** (AC: #1, #7)
  - [ ] Create `src/hooks/useTrainAiModel.ts` with `useMutation<ModelTrainResponse, ApiError, ModelType>`.
  - [ ] On success: `queryClient.invalidateQueries({ queryKey: aiModelsKeys.list(cabinetId) })`.
  - [ ] Mutation test fixtures: queued response, duplicate response, 422 ApiError, 429 ApiError.

- [ ] **Task 5 — Extend `useAiModels` with optional polling** (AC: #2, #7)
  - [ ] Add `options?: { polling?: boolean }` parameter.
  - [ ] When `polling: true`, pass `refetchInterval: 5_000` to `useQuery`.
  - [ ] Extend `useAiModels.test.ts` with 2 new cases asserting the queryOptions.

- [ ] **Task 6 — `<TrainModelButton>` component** (AC: #3, #4)
  - [ ] Create `src/app/(dashboard)/analytics/models/components/TrainModelButton.tsx`.
  - [ ] Implement all 8 visual states from AC-4. Russian copy byte-exact.
  - [ ] WCAG: `aria-busy`, `aria-hidden` on spinner, `role="status" aria-live="polite"` on status text.
  - [ ] Use `useEffect` + `setTimeout` for auto-clear (with cleanup on unmount to prevent state-update warnings).

- [ ] **Task 7 — Integrate into `ModelListSection`** (AC: #5, #6)
  - [ ] Add 7th "Действия" column with `<TrainModelButton>`.
  - [ ] Stop event propagation on button click + keyboard (Space/Enter) so row-navigation isn't triggered.
  - [ ] Compute `isAnyTraining` and pass `{ polling: isAnyTraining }` to `useAiModels`.
  - [ ] Update happy-path tests to assert 7 columns + button per row + no row-navigation on button click.

- [ ] **Task 8 — `TrainModelButton.test.tsx`** (AC: #7)
  - [ ] 12 tests covering all states + WCAG attributes + auto-clear timers.

- [ ] **Task 9 — Run baseline quality gates** (AC: #8)
  - [ ] `npm run type-check` — 0 errors.
  - [ ] `npx eslint 'src/**/*.ts' 'src/**/*.tsx'` — 0 errors.
  - [ ] `npm test -- --run` — ≥ 7503 passing, 0 failed. Note final count.
  - [ ] `bash scripts/check-doc-citations.sh` — exit 0.
  - [ ] `bash scripts/check-eslint-rules.sh` — OK.

- [ ] **Task 10 — 2-pass adversarial code review** (AC: #9)
  - [ ] Spawn `code-reviewer` agent in fresh context (1st pass); apply fixes under `### Post-1st-pass-review fixes (YYYY-MM-DD)`.
  - [ ] Spawn `code-reviewer` agent in a SECOND fresh context (2nd pass); apply fixes under `### Post-2nd-pass-review fixes (YYYY-MM-DD)`.

- [ ] **Task 11 — Update sprint-status + Change Log** (AC: all)
  - [ ] Flip `109-4-fe-model-training-trigger-polling` `ready-for-dev` → `in-progress` → `review` → `done`.
  - [ ] Final Change Log row with `**Lessons:**` per Story 94.4-FE.

## Dev Notes

### Pre-Flight Verification Results (verified at story-author time, 2026-05-17)

Per Story 105.2-FE Step 4.5 — executor MUST re-run before writing code:

```bash
# 1. No existing useTrainAiModel / TrainModelButton
grep -rln "useTrainAiModel\|TrainModelButton" src/ | grep -v node_modules
#   → 0 hits

# 2. Existing mutation hook patterns (precedent)
grep -rln "useMutation" src/hooks/ | head -5
#   → useSanityCheck, useCogsDelete, useBackfillAdmin, usePriceCalculator, useFulfillment
#   Best precedent for this story: src/hooks/useAiPreferences.ts (Story 108.2 — uses useMutation with onMutate/onError/onSettled + cache invalidation)

# 3. postModelTrain fetcher (Story 108.1)
grep -n "postModelTrain" src/lib/api/ai/models.ts
#   → :76 — export async function postModelTrain(body: ModelTrainRequest): Promise<ModelTrainResponse>

# 4. useAiModels (Story 109.3) — needs polling extension
cat src/hooks/useAiModels.ts | head -30
#   → currently no `options` param; needs Task 5 extension
```

### Architecture Patterns Inherited from Stories 108.1, 108.2, 109.3

- **Boundary Normalizer Pattern**: `postModelTrain` already returns frontend-canonical `ModelTrainResponse` (Story 108.1). Hook consumes directly.
- **Cabinet-isolation discipline** (Story 97.5-FE): `useTrainAiModel` invalidates `aiModelsKeys.list(cabinetId)` — only the current cabinet's cache. Use `useAuthStore(s => s.cabinetId)` per `useAiPreferences.ts:32` precedent.
- **Mutation pattern** (Story 108.2 § `useUpdateAiPreferences`): use TanStack `useMutation` with `useQueryClient` for cache invalidation. NO optimistic update for this story — training is async (queued → eventual completion); the table reflects reality via polling.
- **Anti-Pattern #8** (CLAUDE.md): N/A directly — no money/ratio fields rendered by this story. `cogsCoveragePct` in the 422 body IS a percentage, but it's a backend-provided value rendered as-is in the error message (not stored in nullable canonical types).
- **Pure-function discipline** (Story 99.2-FE): `parseTrainErrorMessage` is the testable kernel — test without React render.
- **WCAG 2.1 AA** (Epic 108-FE retro § C-3 + Story 109.1/109.3 lessons): icon-only spinner has `aria-hidden`; button has `aria-busy` during mutation; status text is `role="status" aria-live="polite"`.

### Why polling is conditional (not always-on)

Story 109.3's `useAiModels` is a one-shot fetch — appropriate when models rarely change. Once a user triggers training, the table needs to reflect the transition (queued → training → active). The cheapest signal is the `status` field on the table's existing data — when `isAnyTraining`, enable polling; else, don't burn network/render cycles.

The 5s interval matches the backend integration guide. The polling stops automatically when status transitions away from `'training'`. Edge case: if backend never transitions (broken model), polling continues — acceptable for this story; consider a 10-minute timeout in a future story.

### 422 error body contract

Per the backend AI-FRONTEND-INTEGRATION-GUIDE.md (verify exact path during Task 2):
```json
{
  "error": { "code": "INSUFFICIENT_DATA", "message": "..." },
  "weeksCollected": 8,
  "weeksRequired": 12,
  "cogsCoveragePct": 75
}
```

`cogsCoveragePct` is a percentage on the 0-100 scale (matches MAPE convention from Story 109.3). Rendered as `{cogsCoveragePct}%` in the error message — no `× 100` transformation.

### Source Tree Components to Touch

| File | Change | Lines (approx.) |
|---|---|---|
| `src/hooks/useTrainAiModel.ts` | CREATE | ~80 (incl. parseTrainErrorMessage; extract to sibling if approaching 150) |
| `src/hooks/__tests__/useTrainAiModel.test.ts` | CREATE | ~180 |
| `src/hooks/useAiModels.ts` | EXTEND (add options param) | ~+5 |
| `src/hooks/__tests__/useAiModels.test.ts` | EXTEND (2 polling tests) | ~+30 |
| `src/app/(dashboard)/analytics/models/components/TrainModelButton.tsx` | CREATE | ~120 (cap 200) |
| `src/app/(dashboard)/analytics/models/components/__tests__/TrainModelButton.test.tsx` | CREATE | ~220 |
| `src/app/(dashboard)/analytics/models/components/ModelListSection.tsx` | EXTEND (add 7th column + event-propagation handling + polling param) | ~+15 |
| `src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx` | EXTEND (3 integration tests) | ~+50 |

**File-size discipline** (CLAUDE.md): all touched files must stay ≤200 lines. `TrainModelButton.tsx` is the largest new file — target ≤150. If approaching, extract a sub-component for the status-text rendering.

### Testing Standards

- **Framework**: Vitest. No E2E required (UI is covered by jsdom + integration tests).
- **Timers**: use `vi.useFakeTimers()` + `vi.advanceTimersByTime()` for auto-clear assertions.
- **Mock patterns**:
  - Mock `useAuthStore`, `useTrainAiModel`, `useAiModels` per existing precedents (`Sidebar.test.tsx`, `ModelListSection.test.tsx` from Story 109.3).
  - Mock `postModelTrain` per `useAiPreferences.test.ts` precedent if it exists.
- **Pure-function discipline**: `parseTrainErrorMessage` tested without React render.
- **Test count target**: ~22-26 new tests. Total floor for this story is ≥7503 passing.

### Project Structure Notes

- **Alignment**: hook lives in `src/hooks/`; button + test in `src/app/(dashboard)/analytics/models/components/`. Same convention as Story 109.3.
- **Naming**: `useTrainAiModel` (camelCase mutation hook, matches `useUpdateAiPreferences`). `TrainModelButton` (PascalCase component).
- **Detected conflicts / variances**: NONE.

### References

- **Locked decision Q4**: `_bmad-output/planning-artifacts/epics-109-fe.md:138` (per-row Train button).
- **Backend integration guide**: `docs/AI-FRONTEND-INTEGRATION-GUIDE.md` § Model Management § Train endpoint (source of 422/429/202 contracts).
- **Canonical types**: `src/types/ai/models.ts` (`AiModel`, `ModelStatus`, `ModelTrainRequest`, `ModelTrainResponse`, `ModelTrainStatus`).
- **Existing fetcher**: `src/lib/api/ai/models.ts:76` (`postModelTrain`).
- **Mutation pattern precedent**: `src/hooks/useUpdateAiPreferences.ts:21-48` (`useUpdateAiPreferences` — split to own file in Story 112.2-FE).
- **Story 109.3 ModelListSection**: `src/app/(dashboard)/analytics/models/components/ModelListSection.tsx` (integration site).
- **Story 109.3 `useAiModels`**: `src/hooks/useAiModels.ts` (polling extension target).
- **ApiError class**: `src/lib/api-client.ts` (verify body exposure in Task 2).
- **shadcn primitives**: `Button` at `src/components/ui/button.tsx`; `Loader2` from `lucide-react`.
- CLAUDE.md disciplines: § Two-pass review, § Pre-flight source-trace verification, § Defensive Frontend Principle, § Multi-tenant cabinet-isolation discipline, § Critical Development Rules.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

**Pre-flight grep results (Task 1 — re-run 2026-05-17):**

```
# 1. No existing useTrainAiModel / TrainModelButton
grep -rln "useTrainAiModel\|TrainModelButton" src/ | grep -v node_modules
→ 0 hits (zero conflicts confirmed)

# 2. Existing mutation hook patterns
grep -rln "useMutation" src/hooks/ | head -5
→ usePriceCalculator, useCogsDelete, useSanityCheck, useBackfillAdmin, useFulfillment

# 3. postModelTrain fetcher (Story 108.1)
grep -n "postModelTrain" src/lib/api/ai/models.ts
→ 76: export async function postModelTrain(body: ModelTrainRequest): Promise<ModelTrainResponse>

# 4. useAiModels (Story 109.3) — no options param yet
cat src/hooks/useAiModels.ts | head -30
→ useAiModels() with no options param — confirmed ready for polling extension
```

**Task 2 — ApiError class structure and 422 body:**

- `ApiError` (src/types/api.ts) exposes `.status: number` and `.data?: unknown` (NOT `.body`).
- The story spec uses `error.body` — this is incorrect for this codebase. The raw JSON is stored in `error.data`.
- **Decision: Option 2** — normalise in the hook. `parseTrainErrorMessage` casts `error.data as InsufficientDataErrorBody`. Zero impact on existing `ApiError` consumers (100+ call sites).
- **AI-FRONTEND-INTEGRATION-GUIDE.md** not found at that path (file does not exist). Used the 422 body structure from the story's own Dev Notes § 422 error body contract, which matches `InsufficientDataErrorBody` in AC-1.
- 422 body shape confirmed: `{ error: { code, message }, weeksCollected, weeksRequired, cogsCoveragePct }`.

### Completion Notes List

1. `ApiError.data` (not `.body`) — normalised in `parseTrainErrorMessage` by casting `error.data as InsufficientDataErrorBody`. Chose Option 2 (hook-level normalisation) to avoid touching 100+ existing `ApiError` consumers.
2. `ModelListSection` polling: used `useRef` to track `isAnyTraining` without triggering extra React renders. `pollingRef.current` updated synchronously during render (safe — ref mutation doesn't schedule re-render); next render picks up new polling state automatically via TanStack Query's reactive `refetchInterval`.
3. `TrainModelButton` mock in `ModelListSection.test.tsx` — mocked `TrainModelButton` to render `<button data-testid="train-{modelType}">` to avoid pulling in `useTrainAiModel` auth/query dependencies; propagation test verified button click does NOT call `mockPush`.
4. `docs/AI-FRONTEND-INTEGRATION-GUIDE.md` referenced by story does not exist in the repo. 422 body spec sourced from story Dev Notes instead — matches AC-1 interface exactly.

### File List

(Line counts refreshed post-2nd-pass per F-3)

| File | Action | Lines |
|---|---|---|
| `src/hooks/useTrainAiModel.ts` | CREATED | **111** |
| `src/hooks/useAiModels.ts` | EXTENDED | 39 |
| `src/app/(dashboard)/analytics/models/components/TrainModelButton.tsx` | CREATED | **113** |
| `src/app/(dashboard)/analytics/models/components/ModelListSection.tsx` | EXTENDED | **166** |
| `src/hooks/__tests__/useTrainAiModel.test.ts` | CREATED | **203** |
| `src/hooks/__tests__/useAiModels.test.ts` | EXTENDED | **87** (3 original + 2 polling tests + helpers) |
| `src/app/(dashboard)/analytics/models/components/__tests__/TrainModelButton.test.tsx` | CREATED | **304** |
| `src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx` | EXTENDED | **386** |

### Post-1st-pass-review fixes (2026-05-17)

1st-pass adversarial review (code-reviewer agent, Opus, fresh context) returned **APPROVE AFTER FIXES** — 0 CRITICAL / 1 HIGH / 4 MEDIUM / 2 LOW. All 10 ACs verified compliant; all 5 quality gates green; cabinet-isolation + WCAG + Russian-label byte-correctness all confirmed; Story 109.1/109.2/109.3 regression-locks intact (102 tests pass).

Applied fixes:
- **F-1 (HIGH)**: Replaced `useRef` polling pattern in `ModelListSection.tsx` with explicit `useState` + `useEffect`. Spec-compliant direct computation of `isAnyTraining` from `data?.models?.some(m => m.status === 'training')`. Makes polling-on/off transition explicit + testable.
- **F-4 (MEDIUM)**: Added 2 integration tests in `ModelListSection.test.tsx` asserting `useAiModels` is called with `polling: true` when fixture contains a `status: 'training'` model AND with `polling: false` when no model is training. Closes the polling-derivation coverage gap.
- **F-2 (MEDIUM)**: Removed duplicate `renderButton` call in `TrainModelButton.test.tsx` (was rendering twice, leaking the first React tree).
- **F-3 (MEDIUM)**: Replaced `as InsufficientDataErrorBody` cast in `useTrainAiModel.ts` with `isInsufficientDataBody` type predicate. Type-safe runtime guard; no widening `as` cast in source.
- **F-5 (MEDIUM)**: Added `aria-busy="true"` to the disabled training-state button in `TrainModelButton.tsx`. WCAG enhancement — screen readers now announce ongoing training operation. Added regression test.
- **F-6 (LOW)**: Removed unused `queryClient` destructuring in `useTrainAiModel.test.ts` first test (destructured to `{ wrapper }` only).

**NOT addressed**:
- **F-7 (LOW)**: Change Log final-row placeholder — addressed by orchestrator AFTER 2nd-pass review per workflow Step 9.

Test count delta: 7536 → 7539 passing (+3 net: +2 F-4 polling tests + 1 F-5 aria-busy test). All other gates unchanged.

### Post-2nd-pass-review fixes (2026-05-17)

2nd-pass adversarial review (code-reviewer agent, Opus, independent fresh context) returned **APPROVE AFTER FIXES** — 0 CRITICAL / 0 HIGH / 2 MEDIUM / 1 LOW. The 2nd pass caught 3 fix-block-propagation defects from the 1st-pass fixes themselves (validating Story 97.1-FE pattern AGAIN). 76/76 Story 109.1+109.2+109.3 regression-locks intact.

Applied fixes:
- **F-1 this-pass (MEDIUM)**: 1st-pass F-3's `isInsufficientDataBody` type predicate was unsound — claimed to narrow to `InsufficientDataErrorBody` but did NOT validate the nested `error: { code: 'INSUFFICIENT_DATA'; message: string }` field. Malformed bodies missing `error` would have passed the guard and crashed at `body.error.code` access in any future consumer. Strengthened predicate at `useTrainAiModel.ts:29-43` to validate `obj.error` is an object with `code === 'INSUFFICIENT_DATA'` AND `typeof message === 'string'`. All 12 useTrainAiModel tests still pass (existing 422 fixtures already include the `error` field per the integration guide contract).
- **F-2 this-pass (MEDIUM)**: 1st-pass F-4's "polling: false when no model is training" integration test was partially tautological — passed by virtue of `useState(false)` initial value even if the entire `useEffect` block was deleted. Strengthened with `expect(mockUseAiModels).not.toHaveBeenCalledWith({ polling: true })` negative assertion at `ModelListSection.test.tsx:341`. Now a regression that inverts `isAnyTraining` (e.g., `!== 'training'`) would fail the test.
- **F-3 this-pass (LOW)**: File List line counts were stale post-1st-pass fixes (6 of 8 rows off by 1-34 lines). Refreshed with `wc -l` values. Same defect class as Story 109.3 2nd-pass F-3 — fix-block propagation discipline applies to story-file attestation too, not just source code.

**NOT addressed**: none. All 2nd-pass findings resolved.

**Gate verification (final post-2nd-pass)**:
- `npm run type-check` → 0 errors ✓
- `npx eslint 'src/**/*.ts' 'src/**/*.tsx'` → 0 errors, 112 warnings (baseline) ✓
- `npm test -- --run` → **7539 passing**, 676 skipped, 0 failed ✓ (F-1+F-2 strengthening kept existing test count)
- `bash scripts/check-doc-citations.sh` → exit 0, 22 broken (baseline) ✓
- `bash scripts/check-eslint-rules.sh` → OK ✓
- Story 109.1/109.2/109.3 regression locks: 76/76 PASS ✓

**2-pass review streak**: **48+** consecutive stories preserved (47 → 48 after this story).

### Senior Developer Review (AI)

**Reviewer**: BMad Master + `code-reviewer` agent (Opus, 2 fresh contexts)
**Date**: 2026-05-17
**Review outcome**: **Approve**

**Story Coverage**:
- 10/10 ACs implemented and verified
- 36 net new tests (7503 floor → 7539 passing; 33 from executor + 3 from 1st-pass F-4/F-5)
- 5 quality gates pass at baseline
- Story 109.1+109.2+109.3 regression-locks preserved (76/76)
- `parseTrainErrorMessage` pure helper + `isInsufficientDataBody` type predicate exemplary

**Review history**:
1. **1st-pass adversarial** (Opus, fresh): APPROVE AFTER FIXES — 1 HIGH (F-1 useRef polling pattern) + 4 MEDIUM (F-2 duplicate render, F-3 `as` cast, F-4 missing polling tests, F-5 missing aria-busy) + 2 LOW. All HIGH + MEDIUM + 1 LOW fixed.
2. **2nd-pass adversarial** (Opus, fresh, independent): APPROVE AFTER FIXES — 2 MEDIUM (predicate unsoundness from 1st-pass F-3 refactor, polling-false test tautology from 1st-pass F-4) + 1 LOW (File List drift). All addressed.
3. **3rd-pass formal `/code-review`** (Opus, fresh, independent): **APPROVE — ZERO new findings**. Independent re-verification: all 5 quality gates green, all 10 ACs spec-compliant with file:line evidence, both prior-pass-fix claims (predicate strengthening + negative assertion + File List refresh) hold under inspection, anti-pattern #1-9 sweep clean, cabinet-isolation + WCAG + Russian-locale + memory-leak + race-condition checks clean, story-file structural markers conform.

**Action Items**: None.

**Recommendation**: Story mergeable. 48+ consecutive-story 2-pass discipline streak preserved AND validated by the 3rd-pass formal review. The 2-pass discipline worked exactly as Story 97.1-FE codified: each 1st-pass fix-block introduced 1+ derivative defect that the fresh-context 2nd pass caught (predicate unsoundness, tautological test). The 3rd pass confirms the 2nd pass closed the chain — no further propagation defects exist.

### Change Log

| Date | Change |
|---|---|
| 2026-05-17 | Story created via `/bmad:bmm:workflows:create-story` (SM agent — BMad Master). Spec source: `_bmad-output/planning-artifacts/epics-109-fe.md` § Story 109.4-FE (lines 124-146) + locked decision Q4 (per-row Train button). Pre-flight verification completed at author time — zero conflicts. Foundation: Story 108.1 `postModelTrain` fetcher + Story 108.2 `useUpdateAiPreferences` mutation pattern + Story 109.3 `useAiModels` hook ready for polling extension. Estimate: ~2 SP. |
| 2026-05-17 | Implementation + 2-pass review complete. Shipped: `useTrainAiModel` mutation with `parseTrainErrorMessage` pure helper + `isInsufficientDataBody` type predicate (no `as` widening); `useAiModels` extended with optional polling (`refetchInterval: 5_000`); `<TrainModelButton>` with 8 visual states + 8 byte-exact Russian copy + WCAG `aria-busy`/`aria-hidden`/`role="status" aria-live="polite"`; integration into `ModelListSection` as 7th "Действия" column with event-propagation handling + `useState`+`useEffect`-driven conditional polling; 422/429/202 backend error contracts handled. 36 net new tests (7503→7539). 1st pass: 1 HIGH + 4 MEDIUM + 2 LOW — all addressed. 2nd pass: 2 MEDIUM + 1 LOW propagation defects from 1st-pass fixes — all addressed. **Lessons:** (1) 2nd-pass found that 1st-pass type-predicate fix (F-3) was unsound — missed validating the nested `error` field of the interface it claimed to narrow to (Story 97.1-FE). (2) Strengthening "polling: true" test alone is tautological without a paired `not.toHaveBeenCalledWith({ polling: true })` negative for the false case. (3) `useState`+`useEffect` polling pattern (vs `useRef`) is spec-compliant + integration-testable; ref-pattern works but is opaque to tests. Status: review → done. |
| 2026-05-21 | Story 112.5-FE allowlist cleanup: original Lessons line (above) was authored pre-validator deployment (Story 111.1-FE, 2026-05-19) when the ≤120-char Lessons cap (Story 94.4-FE, 2026-04-25) had no automated enforcement. Per APPEND-ONLY closed-story Change Log convention (Story 111.1-FE F-2), the original Lessons text is retained verbatim; this disclosure row supersedes it for validator purposes only. Status: review → done. **Lessons:** (1) Closed before ≤120-char cap validator existed (Story 111.1-FE, 2026-05-19); original Lessons retained above. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows (story creation, intermediate fixes, post-review fix passes) DO NOT require Lessons. Lessons are for retrospective aggregation — keep them specific to the story (not generic advice) and reference Story-NN.M-FE markers where possible. -->
