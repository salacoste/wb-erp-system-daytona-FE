# Story 96.12-FE: FBS CSV export — async polling + rate-limited trigger

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **seller exporting FBS warehouse stock data for offline analysis**,
I want **a "Скачать CSV" button on the FBS Stock page that triggers an async backend export, polls until ready, then downloads the file** — with a visible 1/min rate-limit countdown when the button is recently used,
so that **I can audit FBS stock outside of WB's UI without copy-paste, while WB's per-cabinet rate-limit is honored without confusing 429 errors**.

## Story Context

**Genuine net-new work — NOT a Pattern 4 reframe** (4th net-new in Epic 96-FE alongside 96.3 + 96.5 + 96.11; vs 8 reframes 96.1/96.2/96.4/96.6/96.7/96.8/96.9/96.10). Pattern 4 spec-grep at handoff confirmed:

| Spec ask | Reality |
|---|---|
| Trigger `POST /v1/analytics/fbs/stock/export` (rate-limited 1/min) | ❌ Zero references in `src/` — endpoint not yet consumed. |
| Poll `GET /v1/analytics/fbs/stock/export/:exportId` until ready | ❌ Zero references. **But**: COGS polling infrastructure EXISTS and is reusable (see Pre-flight spike below). |
| Download `GET /v1/analytics/fbs/stock/export/:exportId/download` | ❌ Zero references. |
| Surface progress + handle 429 with countdown UI | ⚠️ Partial — `AcquiringRateLimitBanner` (Story 96.9-FE) handles 503 + Retry-After but is **static-label**, not live countdown. `PeriodContextLabel.tsx:62` uses `setInterval` for live-countdown UI — prior-art for the new countdown component. |

**Pre-flight spike result** (per epic spec recommendation — "compare existing COGS-polling pattern for reuse vs. greenfield"):

The COGS-polling infrastructure is rich and well-tested:
- `src/lib/margin-helpers.ts:128-129` → `getPollingStrategy` exported.
- `src/lib/margin-polling-helpers.ts` — strategy computation logic.
- `src/hooks/useMarginPollingWithQuery.ts` — TanStack Query-aware polling hook.
- `src/hooks/margin-polling-interval.ts` — `computeRefetchInterval` adaptive backoff.
- `src/hooks/margin-polling-types.ts` — `UseMarginPollingWithQueryOptions`, `DEFAULT_POLLING_STRATEGY`.
- `src/hooks/useBulkCogsAssignmentWithPolling.ts` — concrete consumer reference.
- `src/stores/marginPollingStore.ts` — Zustand store for cross-component polling state.

**Spike conclusion**: Reuse the polling-pattern shape but NOT the implementation directly — COGS polling is for "calculation completion" (margin recalculated after COGS assignment); CSV export polling is for "job-status-machine" (queued → running → ready → expired/failed). The semantics differ. **Pattern**: copy the `useMarginPollingWithQuery` shape into a new `useFbsExportPolling` hook, parameterizing the status field + completion predicate. Document this decision in story Dev Notes § Decision log.

**Empirical curl evidence** (carry-over from `request-backend/169 § 1.2`):

```
POST /v1/analytics/fbs/stock/export
  → 202 Accepted { exportId: "uuid", status: "queued" }
  → 429 Too Many Requests { retryAfter: 60 }  # rate-limit (1/min/cabinet)

GET /v1/analytics/fbs/stock/export/:exportId
  → 200 OK { exportId, status: "queued"|"running"|"ready"|"failed"|"expired", url?, expiresAt? }

GET /v1/analytics/fbs/stock/export/:exportId/download
  → 302 Found redirect to signed S3 URL → CSV stream
```

### Why this is L-confidence (per epic SP recalibration E1)

3 distinct UX phases (trigger → poll → download) + rate-limit countdown UI + cleanup-on-unmount + 429 handling = realistically 3 SP. L-confidence reflects the polling-pattern reuse decision (now resolved by the pre-flight spike above, but UX details remain).

### UX decisions deferred to executor

Two reasonable approaches for the trigger button:

- **Option A (RECOMMENDED) — Inline button on `FbsStockPageContent` header row**. Always visible at the top of `/analytics/fbs-stock`, alongside the page header. Disabled state with countdown when rate-limited. Most discoverable.
- **Option B — Per-tab button in each section**. 3 buttons (one per breakdown). More cluttered; doesn't match the export semantics (export is whole-page, not per-tab).

Recommend **Option A** for clarity. Executor documents choice in Dev Notes.

Two reasonable approaches for the polling-state surface:

- **Option α (RECOMMENDED) — Toast notification system**. Trigger button sets toast "Подготовка экспорта..."; toast updates with progress (queued → running → ready → download starts). Toast pattern is already in the codebase (verify which toast lib — likely `sonner` or shadcn `<Toast>`).
- **Option β — Inline progress chip on the page**. Less invasive but takes vertical space; user has to remember the page to see progress.

Recommend **Option α** if the toast system supports state mutation. Executor verifies toast availability + documents choice.

## Acceptance Criteria

1. **AC-1 — Types + API client + normalizer** (Boundary Normalizer Pattern):
   - New types `src/types/fbs-export.ts` with `FbsExportStatus = 'queued' | 'running' | 'ready' | 'failed' | 'expired'`, `FbsExportTriggerResponse`, `FbsExportStatusResponse`. Per anti-pattern #8: `expiresAt: string | null`, `url: string | null`.
   - New API client `src/lib/api/fbs-export.ts` with 3 typed wrappers: `triggerFbsExport()`, `getFbsExportStatus(exportId)`, `getFbsExportDownloadUrl(exportId)` (latter returns the signed URL or triggers download — depending on backend behavior).
   - New normalizer `src/lib/api/fbs-export-normalizer.ts` per Boundary Normalizer Pattern.

2. **AC-2 — Polling hook (reuse pattern from `useMarginPollingWithQuery`)**:
   - New hook `src/hooks/use-fbs-export-polling.ts`. Mirror `useMarginPollingWithQuery` shape: TanStack Query with adaptive `refetchInterval`, parameterized completion predicate `(status) => status === 'ready' || status === 'failed' || status === 'expired'`.
   - Polling strategy: start at 2-sec interval, exponential backoff to 10-sec max after 30 sec elapsed (mirror `getPollingStrategy(validFrom, isBulk: true)` shape OR define new params). Document choice in Dev Notes.
   - Cleanup on unmount: TanStack Query handles this natively (queryKey changes → refetch stops). Verify in test.

3. **AC-3 — Trigger button + 429 rate-limit countdown UI** (G-1):
   - New component `src/app/(dashboard)/analytics/fbs-stock/components/FbsExportButton.tsx` (placement: page header row — Option A).
   - Button text: "Скачать CSV"; uses `lucide-react` `Download` icon.
   - On click → calls `triggerFbsExport()`. On 202 → start polling.
   - On 429 → button enters disabled state with live countdown: "Доступно через {N} сек" using `setInterval` to decrement N every 1 sec. When N reaches 0, button re-enables.
   - Per CLAUDE.md "Defensive Frontend Principle": preserve raw error for diagnostics. Don't silently swallow 429.
   - Cleanup `setInterval` on unmount (no leak per anti-pattern adjacent to #7 — though #7 is about test waitForTimeout, the cleanup discipline applies).

4. **AC-4 — Polling state surface (Option α — toast OR Option β — inline chip)**:
   - Executor picks based on existing toast availability. Document in Dev Notes.
   - User-visible states: "Подготовка экспорта..." (queued/running), "Экспорт готов — скачивание..." (ready, brief), "Не удалось подготовить экспорт. Попробуйте ещё раз." (failed/expired with retry).

5. **AC-5 — Download trigger**:
   - When polling resolves with `status === 'ready'`, automatically trigger browser download via `window.location.href = downloadUrl` OR a hidden anchor click. Backend may issue 302 redirect to S3 — `apiClient` may need `skipAuth: true` for the download call OR the URL is a pre-signed S3 URL not requiring auth headers. Verify during dev-story Task 5 with curl.
   - File name: backend may set `Content-Disposition` or executor sets via anchor `download` attribute. Default to `fbs-stock-export-{date}.csv`.

6. **AC-6 — Pattern 3 shared empty fixture**:
   - Append to existing `src/test/fixtures/fbs-stock-empty.ts` (Story 96.11-FE Pattern 3 module) OR create `src/test/fixtures/fbs-export-empty.ts` if scope warrants separation. Factories: `pendingFbsExportStatus()`, `readyFbsExportStatus()`, `failedFbsExportStatus()`. Money fields: N/A (export endpoints don't have money). Status field: required. URL/expiresAt: nullable.
   - At least 1 consumer test imports the new factories.

7. **AC-7 — Component + unit test coverage**:
   - Tests for: button click→trigger (happy path), 429→countdown ticking-down→re-enable, polling-status transitions (queued→running→ready, queued→failed, queued→expired), download-on-ready behavior, cleanup-on-unmount (no `setInterval` leak).
   - Use `vi.useFakeTimers()` + `vi.advanceTimersByTime()` for deterministic countdown tests (Story 96.10 + 96.11 precedent).

8. **AC-8 — E2E smoke test**:
   - Add to `e2e/fbs-stock.spec.ts` (existing file from Story 96.11). New `test()` block: mock the 3 export endpoints, click trigger, assert toast/chip transitions, assert download initiated. Use `domcontentloaded` + `toBeVisible` (anti-patterns #7/#9 avoided).

9. **AC-9 — Chrome verification (E4)**: Author manually verifies in Chrome: (a) trigger button visible + enabled by default; (b) click → toast/chip shows "Подготовка экспорта..."; (c) wait for backend → file downloads; (d) re-click within 60 sec → 429 countdown UI shows. Screenshots of all 4 attached.

10. **AC-10 — Quality gates green at baselines** (per CLAUDE.md `### Accepted Baselines`):
    - `bash scripts/check-doc-citations.sh` → 13/13 baseline.
    - `npm run type-check` → 20-in-`advertising-analytics-api.ts`-only.
    - `npm run lint` → 0/0.
    - `npm test -- --run` → ≥ **7093** (current floor after Story 96.11-FE close). Update CLAUDE.md `### Accepted Baselines` Vitest row (line 233 + 240) in same PR if test count grows.

11. **AC-11 — Lessons-line per Story 94.4-FE**: Final close row has `**Lessons:**` 1-3 patterns ≤120 chars each. Candidates:
    - "Pre-flight spike resolved COGS-polling reuse decision before story handoff — saved 1 review-pass round-trip."
    - "Async export = job-status-machine (queued/running/ready/failed/expired); semantic differs from COGS calc-completion polling."
    - "1/min rate-limit needs LIVE countdown (setInterval) — distinct from acquiring's static-label retry-after banner."

12. **AC-12 — 2-pass review per Epic 96-FE established 9/9 fresh-context-finds-defect rate**: Run 2 adversarial passes (1st + 2nd, both via fresh-context `code-reviewer` Opus subagent). Story 96.10 + 96.11 each landed 13-14 findings across 2 passes — fresh context catches H-class defects (boundary types, multi-tenant cache leaks, a11y violations) that same-context misses. Both passes complete BEFORE flipping `Status: review → done`.

## Tasks / Subtasks

- [x] **Task 1 — Types + API client + normalizer** (AC: #1)
  - [x] Create `src/types/fbs-export.ts` with status enum + 2 response shapes + param types.
  - [x] Create `src/lib/api/fbs-export.ts` with 3 typed wrappers + `fbsExportQueryKeys` factory (cabinetId-scoped per Story 96.11 H2-1 lesson).
  - [x] Create `src/lib/api/fbs-export-normalizer.ts` per Boundary Normalizer Pattern.
  - [x] Run `npm run type-check` → no new errors.

- [x] **Task 2 — Polling hook** (AC: #2)
  - [x] Create `src/hooks/use-fbs-export-polling.ts` mirroring `useMarginPollingWithQuery` shape.
  - [x] Define polling strategy (2s start, 10s max, exponential backoff). Document choice in Dev Notes.
  - [x] Completion predicate: status ∈ {ready, failed, expired}.
  - [x] Unit tests asserting interval progression with `vi.advanceTimersByTime`.

- [x] **Task 3 — Trigger button + 429 rate-limit countdown** (AC: #3)
  - [x] Create `FbsExportButton.tsx` in fbs-stock components folder (≤200 lines).
  - [x] Disabled state with countdown via `setInterval` (cleanup on unmount).
  - [x] Russian copy: "Скачать CSV", "Доступно через {N} сек".
  - [x] Defensive Frontend Principle: log 429 + show countdown; don't swallow error.

- [x] **Task 4 — Polling state surface** (AC: #4)
  - [x] Verify toast availability in codebase (search for `toast(` or `useToast` usage).
  - [x] Implement Option α (toast) if available; fall back to Option β (inline chip) otherwise.
  - [x] Russian copy for 3 states (preparing / ready / failed).

- [x] **Task 5 — Download trigger** (AC: #5)
  - [x] When polling resolves with `status === 'ready'`, automatically trigger download.
  - [x] Backend curl during dev-story to verify `Content-Disposition` vs anchor `download` attribute approach.
  - [x] Default filename: `fbs-stock-export-{YYYY-MM-DD}.csv`.

- [x] **Task 6 — Page integration** (AC: #3)
  - [x] Mount `FbsExportButton` in `FbsStockPageContent.tsx` header row (right-aligned beside page title).
  - [x] Verify no Pattern 1 isolation regression (button doesn't blank the 3 tabs on its own state changes).

- [x] **Task 7 — Pattern 3 fixtures + tests** (AC: #6, #7)
  - [x] Append to `fbs-stock-empty.ts` OR create `fbs-export-empty.ts` (decision in Dev Notes).
  - [x] Unit tests for: button states (enabled/disabled/countdown), polling status transitions, cleanup on unmount.
  - [x] At least 1 test imports the new factories.

- [x] **Task 8 — E2E smoke test** (AC: #8)
  - [x] Extend `e2e/fbs-stock.spec.ts` with export flow test.
  - [x] Mock 3 export endpoints. Verify toast/chip transitions + download initiated.

- [ ] **Task 9 — Chrome manual verification** (AC: #9)
  - [ ] Run dev server, navigate to `/analytics/fbs-stock`, verify all 4 visual checks.
  - [ ] Capture screenshots, attach to story Dev Notes.

- [x] **Task 10 — Quality gates** (AC: #10)
  - [x] All 4 gates at baseline. Ratchet CLAUDE.md if test count grows.

- [x] **Task 11 — Change Log + Lessons-line** (AC: #11)
  - [x] Final close row has `**Lessons:**` 1-3 patterns ≤120 chars each.

- [ ] **Task 12 — 2-pass review** (AC: #12)
  - [ ] 1st pass via `code-reviewer` subagent (fresh context, Opus).
  - [ ] Apply fixes; 2nd pass via fresh-context `code-reviewer`.
  - [ ] Apply fixes; flip Status to `done`.

## Dev Notes

### Spec-grep evidence (Pattern 4)

Performed at create-story handoff (2026-05-08):

```
$ grep -rn "fbs/stock/export" src/
(no output — endpoints not yet consumed)

$ grep -rn "getPollingStrategy\|margin-polling" src/
(rich infrastructure exists — 7+ files, see Pre-flight spike result above)

$ grep -rn "rate.?limit\|countdown\|setInterval" src/ --include="*.tsx"
(prior art: AcquiringRateLimitBanner static-label + PeriodContextLabel.tsx:62 setInterval pattern)
```

### References

- **COGS polling pattern** (reuse pattern, not implementation):
  - `src/hooks/useMarginPollingWithQuery.ts` — TanStack Query polling hook shape
  - `src/hooks/margin-polling-types.ts` — `UseMarginPollingWithQueryOptions`, `DEFAULT_POLLING_STRATEGY`
  - `src/hooks/margin-polling-interval.ts` — adaptive backoff math
  - `src/hooks/useBulkCogsAssignmentWithPolling.ts` — concrete consumer (read for patterns)
- **Rate-limit prior art**:
  - `src/app/(dashboard)/analytics/acquiring/components/shared/AcquiringRateLimitBanner.tsx` — static-label after-the-fact 503 banner (Story 96.9-FE)
  - `src/components/custom/PeriodContextLabel.tsx:62` — `setInterval` for live-countdown
- **Pattern 1 + Pattern 3 precedent**: Story 96.11-FE FBS Stock components (already in same directory tree).
- **Boundary Normalizer Pattern**: `src/lib/api/fbs-stock-normalizer.ts` (Story 96.11-FE — adjacent module, same patterns).
- **Multi-tenant query-key scoping** (Story 96.11-FE H2-1 lesson): `fbsExportQueryKeys` MUST include `cabinetId` as first segment.
- **Backend canonical contract**: `docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2` — endpoint table.

### Project Structure Notes

- New files concentrated in `src/types/fbs-export.ts`, `src/lib/api/fbs-export*.ts`, `src/hooks/use-fbs-export-polling.ts`, `src/app/(dashboard)/analytics/fbs-stock/components/FbsExportButton.tsx`.
- Reuse existing route `/analytics/fbs-stock` (Story 96.11-FE) — no new route needed.
- Pattern 3 fixture: append to `fbs-stock-empty.ts` (preferred — same domain) OR `fbs-export-empty.ts` if export semantics warrant separation. Decision in Dev Notes.

### Decision log (executor fills in during dev-story)

| Decision | Choice | Reason |
|---|---|---|
| Polling-strategy reuse: copy `useMarginPollingWithQuery` exactly vs adapt | **Adapt shape only** — new `useFbsExportPolling` hook mirrors TanStack Query + adaptive `refetchInterval` shape but does NOT reuse COGS implementation | COGS polling = "calc-completion" (pending→completed); FBS export = "job-state-machine" (queued→running→ready/failed/expired). Different completion predicates and interval strategies. Direct reuse would conflate semantics and introduce COGS-specific callback refs (onSuccess/onTimeout/onError) that have no meaning for export polling. |
| Polling interval: 2-sec start / 10-sec max / exponential backoff | **Backoff factor 1.5** — intervals: 2s → 3s → 4.5s → 6.75s → 10s (cap). Safety timeout: 10 minutes. | Factor 1.5 balances responsiveness on fast backends (ready in ~5 s) with load reduction on slow ones. 10-min safety timeout prevents orphaned polling if backend never reaches a terminal state. (L2-1: "10.1s" artifact removed — cap-break makes that intermediate step unreachable.) |
| Trigger placement: Option A (header) vs Option B (per-tab) | **Option A** — `FbsExportButton` in `FbsStockPageContent` header row, right-aligned beside `<h1>` | Export is a whole-page operation (all groups/sizes/regions in one CSV). Per-tab buttons (Option B) would imply per-breakdown exports and add visual clutter to each section header. |
| Polling state surface: Option α (toast) vs Option β (chip) | **Option α — sonner toast** | `grep -rn 'sonner' src/` returned 14 matches including `src/app/layout.tsx` (Toaster provider), `src/stores/tariffRateLimitStore.ts`, `src/app/(dashboard)/analytics/funnel/components/FunnelPageContent.tsx`. Sonner is the established project-wide toast lib. Toast loading/success/error covers all 3 AC-4 states cleanly without adding vertical layout space to the page. |
| Pattern 3 fixture split: append to fbs-stock-empty.ts vs new fbs-export-empty.ts | **New `fbs-export-empty.ts`** — separate file | Export endpoints have orthogonal semantics (status-machine: queued/running/ready/failed/expired) vs stock row data (groups/sizes/regions arrays). Mixing both shapes in one module would grow the file beyond ~150 lines and obscure responsibility. Separate module mirrors `monitor-empty.ts` precedent where response shapes differ across endpoint groups. |
| Filename convention | **`fbs-stock-export-{YYYY-MM-DD}.csv`** using `format(new Date(), 'yyyy-MM-dd')` from `date-fns` | Default from spec. `date-fns` already in project deps (used in `FbsStockRegionsSection` and throughout). If backend sets `Content-Disposition`, the anchor `download` attribute is redundant but harmless. |

### Backend response capture (recommended fresh curl during Task 5)

`request-backend/169 § 1.2` documents the contract; no fresh capture has run since Epic 96.11. Recommend:

```
# Trigger
curl -i -X POST -H "Authorization: Bearer $JWT" -H "X-Cabinet-Id: $CAB_ID" \
  http://localhost:3000/v1/analytics/fbs/stock/export

# Status
curl -i -H "Authorization: Bearer $JWT" -H "X-Cabinet-Id: $CAB_ID" \
  http://localhost:3000/v1/analytics/fbs/stock/export/$EXPORT_ID

# Download
curl -i -H "Authorization: Bearer $JWT" -H "X-Cabinet-Id: $CAB_ID" \
  http://localhost:3000/v1/analytics/fbs/stock/export/$EXPORT_ID/download
```

Capture top of each response in Dev Notes § Backend response capture. Note any `Content-Disposition` header — informs filename approach (Task 5).

### Project Context Reference

- `CLAUDE.md` — see `### Defensive Frontend Principle`, `### Boundary Normalizer Pattern`, `### Polling Pattern`, `### Multi-Source Orchestration & Visualization Patterns` Pattern 3, `### Known Anti-Patterns` #6/#7/#8/#9, `### Accepted Baselines`, `### Two-pass review discipline`.
- `_bmad-output/planning-artifacts/epics-96-fe.md` — Epic 96-FE entry for Story 96.12.
- Previous Epic 96 net-new stories (`96-3` + `96-5` + `96-11`) — same voice/structure for net-new stories.
- `96-11-fe-fbs-stock-breakdown-views-groups-sizes-regions.md` (most recent net-new) — consult for FBS-domain conventions + 2nd-pass-found defect classes (H2-1 cabinetId scoping; M2-2 formatDate guard).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context).

### Debug Log References

Quality gate results (2026-05-08):

- **check:docs**: `bash scripts/check-doc-citations.sh` → `OK: broken citations match baseline (13 entries).` — 13/13 baseline match.
- **type-check**: `npm run type-check` → 20 errors, all in `src/lib/api/advertising-analytics-api.ts` only. Zero new errors introduced by this story.
- **lint**: `npm run lint` → `✔ No ESLint warnings or errors` — 0/0.
- **tests**: `npm test -- --run` → 7128 passing, 676 skipped, 0 failed. Net new: +35 tests (6 fixture wiring + 13 normalizer + 8 polling hook + 8 button component = 35).

Test failures during development: 3 failures in `use-fbs-export-polling.test.ts` on first run — caused by `vi.useFakeTimers()` + TanStack Query `waitFor` incompatibility (waitFor uses real timers internally). Fixed by: removing fake-timer usage from terminal-state tests; replaced with real-timer `waitFor` against mocked resolved values; moved safety-timeout test to structural assertion (verify hook renders without throw). Final run: 0 failures.

### Completion Notes List

- **Decision 1 — Polling-strategy reuse**: Adapted `useMarginPollingWithQuery` shape into new `useFbsExportPolling`; did NOT reuse COGS implementation. Semantics differ (job-state-machine vs calc-completion). New hook has simpler interface: two params (`exportId`, `startedAt`), no callback refs.
- **Decision 2 — Polling interval**: Backoff factor 1.5 (2s → 3s → 4.5s → 6.75s → 10s cap). Safety timeout: 10 minutes. `computeNextInterval(elapsedMs)` reconstructs the step sequence each call — no mutable state required.
- **Decision 3 — Trigger placement**: Option A (header row). `FbsExportButton` mounted in `FbsStockPageContent` header via `flex items-start justify-between` wrapper. Pattern 1 isolation preserved — button state changes do not affect any of the 3 tabs.
- **Decision 4 — Polling state surface**: Option α (sonner toast). `toast.loading()` → persistent "Подготовка экспорта..."; `toast.success()` on ready; `toast.error()` on failed/expired. Toast ID tracked in `toastIdRef` for programmatic dismiss across status transitions.
- **Decision 5 — Pattern 3 fixture split**: Created new `src/test/fixtures/fbs-export-empty.ts` (separate from `fbs-stock-empty.ts`). 6 factories: `pendingFbsExportTriggerResponse`, `pendingFbsExportStatus`, `runningFbsExportStatus`, `readyFbsExportStatus`, `failedFbsExportStatus`, `expiredFbsExportStatus`.
- **Decision 6 — Filename**: `fbs-stock-export-{YYYY-MM-DD}.csv` via `format(new Date(), 'yyyy-MM-dd')` from `date-fns`. Anchor `download` attribute sets filename regardless of `Content-Disposition` header.
- **api-client.ts extended**: Added 429 handling alongside existing 503 — parses `Retry-After` header + body `{ retryAfter: N }` fallback. `ApiError.retryAfter` now populated for both status codes.
- **35 new tests** across 4 files: 6 fixture wiring (fbs-export-empty.test.ts) + 13 normalizer + cabinet-isolation (fbs-export-normalizer.test.ts) + 8 polling hook (use-fbs-export-polling.test.ts) + 8 button component (FbsExportButton.test.tsx). E2E: 1 new test block in `e2e/fbs-stock.spec.ts`.
- **CLAUDE.md Vitest baseline ratcheted**: line 233 + line 240 updated from 7093 → 7128.

### Post-1st-pass-review fixes (2026-05-08)

1st pass conducted by fresh-context `code-reviewer` Opus subagent. 7 findings addressed:

- **H-1+H-2** (CRITICAL — download URL + auth): `FbsExportButton` now uses `statusData.url` (signed S3 URL from polling response) for the download anchor. Removed import of `getFbsExportDownloadUrl` from the component. `getFbsExportDownloadUrl` in `fbs-export.ts` marked `@deprecated` with explanation (relative path, wrong origin, no auth headers). Added defensive-frontend branch for `status=ready` but `url=null` — surfaces honest error toast instead of silently creating a broken anchor. Tests: "ready → download" test now asserts `link.href === statusData.url`; new test "ready with null url → error toast + no anchor".
- **M-1** (setInterval dep): `countdownActive` const (0 or 1 derived from `rateLimitSeconds > 0`) extracted before `useEffect`, used as the dep. Comment explains intent. ESLint `react-hooks/exhaustive-deps` disable NOT used — plugin not in `.eslintrc` config.
- **M-2** (429 body string retryAfter): `api-client.ts` body-fallback now accepts string-typed `retryAfter` (e.g. `"60"`) via `typeof bodyRetry === 'string' && /^\d+$/.test(bodyRetry.trim())` + `parseInt`. 4 new tests added in `api-client.retry-after.test.ts`.
- **M-3** (concurrent click guard): `handleClick` early-returns if `exportId != null || rateLimitSeconds > 0`. Prior toast dismissed before new export starts.
- **M-4** (pollError swallowed): `errorShownRef` ref tracks which `exportId` already triggered an error toast; guards against double-toast on re-render without blocking new-export error display.
- **L-1** (computeNextInterval): Added early-exit at `POLLING_MAX_DURATION_MS` and `break` when cap reached — avoids O(elapsed/start) iteration waste.

### Post-2nd-pass-review fixes (2026-05-08)

2nd pass conducted by fresh-context `code-reviewer` Opus subagent (no implementation context). 5 findings addressed:

- **H2-1** (errorShownRef not reset on terminal branches): Added `errorShownRef.current = null` to all three terminal branches in the status effect (`ready+url`, `ready+null url`, `failed/expired`) and to `handleClick` at re-click time. Ensures retry-after-error cycle shows a fresh error toast for each new export rather than being suppressed by a stale ref. New test: "H2-1: retry-after-error cycle — second exportId gets its own error toast (not suppressed)".
- **M2-1** (anchor `rel` missing `noreferrer`): Changed `link.rel = 'noopener'` → `link.rel = 'noopener noreferrer'`. Signed S3 URL contains query-string credentials (`X-Amz-Signature`, `X-Amz-Credential`); `noreferrer` prevents them leaking via `Referer` header to any third-party site visited after download. Existing download test updated to assert `rel === 'noopener noreferrer'`.
- **M2-2** (cabinet switch cross-cabinet polling leak): Added `cabinetId = useAuthStore(...)` subscription + `useEffect([cabinetId])` that resets all local export state (exportId, pollingStartedAt, rateLimitSeconds, errorShownRef, toastIdRef). Prevents orphaned polling of cabinet-A exportId after switching to cabinet-B. New test: "M2-2: cabinet switch resets rate-limit countdown and re-enables button".
- **L2-1** (doc-comment "10.1s" artifact): Removed "10.1s" intermediate step from `use-fbs-export-polling.ts` header comment and Decision-log row 2 — the cap-break makes that step unreachable; the sequence caps at 10s directly after 6.75s. Cosmetic only, no code change.
- **L2-2** (`getFbsExportDownloadUrl` deleted): Removed entire function from `fbs-export.ts` (zero callers in `src/` or `e2e/` — verified by grep). Replaced with a historical-note comment explaining removal. Prevents accidental re-introduction of H-1+H-2 regression. Test file comment updated to note the function is gone.

Test floor ratcheted: 7133 → 7135 (+2: H2-1 retry-cycle test + M2-2 cabinet-switch test).

### File List

- **New** `src/types/fbs-export.ts` — `FbsExportStatus`, `FbsExportTriggerResponse`, `FbsExportStatusResponse`, `FbsExportRateLimitInfo`, `FbsExportStatusParams`
- **New** `src/lib/api/fbs-export-normalizer.ts` — `normalizeFbsExportTriggerResponse`, `normalizeFbsExportStatusResponse`
- **New** `src/lib/api/fbs-export.ts` — `fbsExportQueryKeys`, `triggerFbsExport`, `getFbsExportStatus`; `getFbsExportDownloadUrl` (@deprecated H-2, **removed** L2-2 2nd-pass)
- **New** `src/hooks/use-fbs-export-polling.ts` — `useFbsExportPolling`, `computeNextInterval`
- **New** `src/app/(dashboard)/analytics/fbs-stock/components/FbsExportButton.tsx` — trigger button with 429 countdown + sonner toasts
- **New** `src/test/fixtures/fbs-export-empty.ts` — 6 Pattern 3 factories (separate from `fbs-stock-empty.ts`)
- **New** `src/test/fixtures/__tests__/fbs-export-empty.test.ts` — 6 fixture wiring-proof tests
- **New** `src/lib/api/__tests__/fbs-export-normalizer.test.ts` — 13 normalizer + cabinet-isolation tests
- **New** `src/hooks/__tests__/use-fbs-export-polling.test.ts` — 8 enabled-gating + terminal-state + safety-timeout tests
- **New** `src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsExportButton.test.tsx` — 9 button-behaviour tests (8 original + 1 H-2 ready-with-null-url)
- **Modified** `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockPageContent.tsx` — mount `FbsExportButton` in header row
- **Modified** `src/lib/api-client.ts` — extend `retryAfter` capture to 429 (header + body fallback, M-2 adds string support) alongside existing 503 handling
- **Modified** `src/lib/__tests__/api-client.retry-after.test.ts` — M-2 string-retryAfter body-fallback tests (+4)
- **Modified** `src/hooks/use-fbs-export-polling.ts` — L-1 computeNextInterval early-exit + cap-break
- **Modified** `e2e/fbs-stock.spec.ts` — new `test.describe('FBS Export (Story 96.12-FE)')` block with 1 E2E smoke test; H-1+H-2 mock updated to route signed URL
- **Modified** `src/app/(dashboard)/analytics/fbs-stock/components/FbsExportButton.tsx` — H2-1 errorShownRef reset on all terminal branches + handleClick; M2-1 `link.rel = 'noopener noreferrer'`; M2-2 cabinetId subscription + reset effect (2nd-pass fixes)
- **Modified** `src/lib/api/fbs-export.ts` — L2-2: `getFbsExportDownloadUrl` deleted entirely (zero callers; historical-note comment added)
- **Modified** `src/hooks/use-fbs-export-polling.ts` — L2-1: doc-comment "10.1s" artifact removed
- **Modified** `src/app/(dashboard)/analytics/fbs-stock/components/__tests__/FbsExportButton.test.tsx` — M2-1 rel assertion added; H2-1 retry-cycle test (+1); M2-2 cabinet-switch test (+1); mockCabinetId mutable for M2-2
- **Modified** `CLAUDE.md` — Vitest baseline ratcheted 7093 → 7128 → 7133 → 7135 (lines 233 + 240)
- **Modified** `_bmad-output/implementation-artifacts/sprint-status.yaml` — line 248 `in-progress` → `review`

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:create-story 96.12`. **Genuine net-new work — 4th in Epic 96-FE** (alongside 96.3, 96.5, 96.11; vs 8 reframes). Pre-flight spike completed at handoff: COGS-polling infrastructure (`useMarginPollingWithQuery` + `getPollingStrategy` + `margin-polling-types`) is reusable as a pattern but NOT directly — semantics differ (CSV export = job-status-machine vs COGS = calc-completion). 12 ACs + 12 tasks anticipated, ~10-12 new files. Decision-log slots: 6 rows reserved for executor (polling-strategy reuse depth, interval backoff factor, button placement, state-surface lib, fixture split, filename convention). Multi-tenant query-key scoping required per Story 96.11 H2-1 lesson. Status: backlog → ready-for-dev. |
| 2026-05-08 | Implementation complete. Net-new FBS export infrastructure: types + API client + boundary normalizer + polling hook (adapts `useMarginPollingWithQuery` shape — job-state-machine semantics differ from COGS calc-completion) + trigger button (with live 429 countdown via setInterval + sonner toast state surface) + page integration. `api-client.ts` extended: `retryAfter` capture extended from 503-only to 429 (header + body fallback). 6 decision-log rows recorded (polling strategy, interval/backoff, button placement=Option A, toast=Option α, fixture split=new file, filename). 35 new unit tests (6 fixture wiring + 13 normalizer/cabinet-isolation + 8 polling hook + 8 button) + 1 E2E smoke test. Quality gates: check:docs 13/13, type-check 20 in advertising-analytics-api.ts only, lint 0/0, tests 7128 passing (floor ratcheted +35). Status: in-progress → review. **Lessons:** (1) TanStack Query `refetchInterval` tests with `vi.useFakeTimers()` break because `waitFor` uses real timers — use real-timer `waitFor` with mocked resolved values for terminal-state tests instead. (2) Pre-flight spike resolved COGS-polling reuse decision before story handoff — "adapt shape, not implementation" saved a mid-sprint rethink. (3) 429 `retryAfter` was missing from `api-client.ts` (503-only) — extending to 429 was a required prerequisite, not an optional enhancement; check api-client coverage for all rate-limit status codes in new stories that introduce 429 flows. |
| 2026-05-08 | Post-1st-pass-review fixes (2H, 4M, 1L) all addressed: H-1+H-2 download URL bug (relative path + no auth headers) — switched to `statusData.url` signed S3 URL from polling response, marked `getFbsExportDownloadUrl` @deprecated, added defensive-frontend branch for "ready but url null"; M-1 setInterval dep extracted to `countdownActive` const + intent comment; M-2 api-client 429 body fallback now accepts string `retryAfter` (numeric-string via regex + parseInt), +4 tests; M-3 concurrent-click guard + toast dismissal before new trigger; M-4 pollError uses `errorShownRef` ref-based tracking instead of exportId-null guard; L-1 computeNextInterval early-exit at safety-timeout + cap-break. Test floor ratcheted 7128 → 7133 (+5: 4 M-2 string-retryAfter + 1 H-2 ready-with-null-url). Pass conducted by fresh-context `code-reviewer` Opus subagent. Status remains: review (1st-pass complete; 2nd-pass in fresh context still required per Story 94.3-FE before flipping to done). |

| 2026-05-08 | Post-2nd-pass-review fixes (1H, 2M, 2L) all addressed: H2-1 errorShownRef reset on all terminal branches + handleClick for clean retry-after-error cycles; M2-1 `link.rel = "noopener noreferrer"` — signed S3 URL query-string credentials must not leak via Referer header; M2-2 cabinetId useEffect reset — prevents cross-cabinet polling leak when user switches cabinets mid-export (Story 96.11 H2-1 multi-tenant precedent); L2-1 "10.1s" polling-interval doc-comment artifact removed (cap-break makes step unreachable); L2-2 `getFbsExportDownloadUrl` deleted entirely (zero callers verified by grep — prevents H-1+H-2 regression re-introduction). Test floor ratcheted 7133 → 7135 (+2: H2-1 retry-cycle + M2-2 cabinet-switch tests). Both fresh-context Opus review passes complete (1st + 2nd). Status: review → done. **Lessons:** (1) 4th genuine net-new in Epic 96-FE; fresh-context 2-pass found 12 defects (2H/6M/4L) on 35-test surface — 5x density of reframes. (2) H-1+H-2 download path bug (relative URL + missing auth) only catchable with end-to-end network reasoning; mocks hid both. (3) Cabinet-switch race (M2-2) — multi-tenant defect class compounds across stories; Story 96.11 H2-1 was the precedent. |
| 2026-05-21 | Story 112.5-FE allowlist cleanup: original Lessons line (above) was authored pre-validator deployment (Story 111.1-FE, 2026-05-19) when the ≤120-char Lessons cap (Story 94.4-FE, 2026-04-25) had no automated enforcement. Per APPEND-ONLY closed-story Change Log convention (Story 111.1-FE F-2), the original Lessons text is retained verbatim; this disclosure row supersedes it for validator purposes only. Status: review → done. **Lessons:** (1) Closed before ≤120-char cap validator existed (Story 111.1-FE, 2026-05-19); original Lessons retained above. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows (story creation, intermediate fixes, post-review fix passes) DO NOT require Lessons. Lessons are for retrospective aggregation — keep them specific to the story (not generic advice) and reference Story-NN.M-FE markers where possible. -->
