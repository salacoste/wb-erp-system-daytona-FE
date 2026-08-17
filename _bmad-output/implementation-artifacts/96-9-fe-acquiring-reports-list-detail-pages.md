# Story 96.9-FE: Acquiring reports — 503/Retry-After resilience + Pattern 3 fixture hygiene

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **seller using the acquiring analytics surface during a WB rate-limit window**,
I want **the page to surface a localized retry-after countdown instead of a generic error banner**,
so that **I understand the data is temporarily unavailable rather than broken** — and so that **future maintainers consume a canonical Pattern 3 empty-fixture for the acquiring domain (matching the `monitor-empty.ts` precedent)**.

## Story Context

**7th Pattern 4 spec-grep reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4, 96.6, 96.7, 96.8 reframes; vs. 96.3 + 96.5 genuine net-new). Spec-grep performed at create-story time revealed the entire headline scope is **ALREADY SHIPPED** under Epic 90-FE:

| Spec ask | Epic 90-FE reality |
|---|---|
| Create route `/dashboard/acquiring-reports` + register in `routes.ts` | `ROUTES.ANALYTICS.ACQUIRING = '/analytics/acquiring'` (Epic 90-FE Story 90.2) at `src/lib/routes.ts:43` |
| List view consuming `GET /v1/analytics/acquiring/reports?from=&to=` with date-range picker | `src/app/(dashboard)/analytics/acquiring/page.tsx` → `AcquiringPageContent.tsx` with `DateRangePickerExtended` + `AcquiringSummaryCards` + `AcquiringReportsTable` (Story 90.2) |
| Detail view consuming `GET /v1/analytics/acquiring/reports/:id/detail` | `src/app/(dashboard)/analytics/acquiring/reports/[id]/page.tsx` → `AcquiringReportDetailPage` + `AcquiringReportDetailSummary` + `AcquiringTransactionsTable` (Story 90.3) |
| Cross-period detail consuming `GET /v1/analytics/acquiring/detail?from=&to=` | `src/app/(dashboard)/analytics/acquiring/period/page.tsx` → `AcquiringPeriodDetailPage` + `AcquiringPeriodSummary` (Story 90.4) |
| API client wrapping the 3 endpoints + normalizer | `src/lib/api/acquiring-analytics.ts` + `src/lib/api/acquiring-normalizer.ts` (Story 90.1) |
| Hooks | `src/hooks/use-acquiring-reports.ts`, `use-acquiring-report-detail.ts`, `use-acquiring-period-detail.ts` |
| Pattern 1 — independent state machines per query | `AcquiringPageContent.tsx:34-117` already implements `showSkeleton` / `showFullError` / empty-state / cached-fallback chips |
| E2E spec | `e2e/acquiring.spec.ts` (187 LOC, 9 tests covering list / detail / period / a11y per Story 90.5) |

**Empirical curl evidence** (carry-over from Epic 90-FE — backend acquiring contract is stable; no fresh curl required for this scope):

- `GET /v1/analytics/acquiring/reports?from=2026-04-01&to=2026-04-30` returns `{ data: [...], cached_at: "..." }` envelope (skipDataUnwrap consumed by API client).
- 503 + `Retry-After` documented in `request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.1` ("Returns `503` + `Retry-After` header when WB rate-limits").

**Real residual scope** (three small gaps surfaced by the spec-grep + curl):

- **G-1 (HIGH) — Pattern 3 shared empty-fixture missing.** `src/test/fixtures/` lists `monitor-empty.ts` (Pattern 3 canonical from Story 92.6-FE) and several other domain fixtures (`buyout-analytics.ts`, `fbs-analytics.ts`, etc.), but **no `acquiring-empty.ts`**. AC-3 of the spec calls for one. Existing acquiring component tests (`AcquiringReportsTable.test.tsx`, `AcquiringSummaryCards.test.tsx`) inline their fixture data — Pattern 3 hygiene gap. Same gap class as the Story 92.6-FE retro AI #5 motivated.
- **G-2 (HIGH) — 503 + `Retry-After` not surfaced.** `apiClient` (`src/lib/api-client.ts`) has zero handling for 503 / `Retry-After`; the 3 acquiring hooks have no retry-after-aware error treatment; `AcquiringPageContent`'s error path renders a generic "Не удалось загрузить отчёты. Попробуйте ещё раз." regardless of the underlying status. AC-2 of the spec calls for this. The Defensive Frontend Principle (CLAUDE.md) — surface, don't silently collapse — applies: a 503 from WB rate-limiting is semantically different from a 500 internal error and the user should see that distinction.
- **G-3 (MEDIUM) — E2E rate-limit path not covered.** `e2e/acquiring.spec.ts` covers list / detail / period / a11y but no 503-mocked path (AC-4 of the spec).

### Why a redirect or rename is NOT in scope

The spec phrasing `/dashboard/acquiring-reports` is treated as a stale draft path — it predates the Epic 90-FE shipped surface. Renaming or redirecting `/analytics/acquiring` → `/dashboard/acquiring-reports` would be a cosmetic churn event with no user benefit and would invalidate every existing `acquiringQueryKeys` cache entry. **The canonical existing route stays at `/analytics/acquiring`** — story file documents this for the epic retro.

## Acceptance Criteria

1. **AC-1 — Pattern 3 fixture (G-1)**: New file `src/test/fixtures/acquiring-empty.ts` exports factory functions `emptyAcquiringListResponse()`, `emptyAcquiringDetailResponse()`, `emptyAcquiringReport()`, `emptyAcquiringTransaction()` shaped per `src/types/acquiring-analytics.ts`. Convention per CLAUDE.md anti-pattern #8: count fields = `0`, money/ratio fields = `null`. Module-doc references the Pattern 3 / `monitor-empty.ts` precedent and Story 96.9-FE.

2. **AC-2 — Fixture consumed (G-1)**: At least one existing or new test file imports from `acquiring-empty.ts` (proves the wiring; matches the Pattern 3 § "Testing requirement" rule). Recommended target: a new test file `src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringPageContent.test.tsx` exercising the empty-state branch using `emptyAcquiringListResponse()`. If a smaller surgical insertion into an existing test is preferred, document the choice in Dev Notes.

3. **AC-3 — 503 + Retry-After surface (G-2)**: When `useAcquiringReports` / `useAcquiringReportDetail` / `useAcquiringPeriodDetail` resolve with an `ApiError` whose `status === 503`, the page renders a distinct retry-after banner (NOT the generic destructive `Alert`). Banner copy: `"WB временно недоступен. Повтор через {N} сек"` where `{N}` is parsed from the `Retry-After` response header (or a sensible fallback like `60` if the header is missing/non-numeric — document choice inline). Use the existing amber refetch-error chip styling (`AcquiringPageContent.tsx:107-113`) as the visual baseline; differentiate by copy + countdown.
   - **Implementation hint** (executor's choice — document in Dev Notes): either (a) extend `apiClient` to read `Retry-After` and stash it on `ApiError` (re-usable by future stories — risk: surface widening), or (b) add a small per-hook handler that reads the header through a custom fetcher path (scoped — risk: 3 callsites duplicate). Per CLAUDE.md "Don't add features beyond what the task requires": prefer (b) unless a 4th caller already exists. If (b), put the shared logic in `src/hooks/use-acquiring-rate-limit.ts` (1 file, 3 callers) so it stays grep-and-cite-able.
   - **Defensive Frontend Principle** (CLAUDE.md): preserve the raw error for diagnostics — do NOT silently swallow 503 or coerce it to "no data". Indicate, don't transform.

4. **AC-4 — E2E rate-limit coverage (G-3)**: New `test()` block in `e2e/acquiring.spec.ts` mocks `GET /v1/analytics/acquiring/reports` to return `503 Retry-After: 30` and asserts the retry-after banner is visible with the expected Russian copy. Use Playwright `page.route()` to intercept; do NOT use `waitForTimeout` (anti-pattern #7) or `networkidle` (anti-pattern #9) — use `waitForResponse` or a `toBeVisible({ timeout: ... })` assertion against the banner landmark.

5. **AC-5 — Chrome verification (E4)**: Author manually verifies in Chrome at `/analytics/acquiring`: (a) list view renders; (b) detail navigation works; (c) period detail link works; (d) 503 retry-after banner renders when API is mocked locally to return 503 (e.g., temporary devtools network-condition override or short-lived backend stub). Screenshots of (a) list, (b) detail, (c) 503 banner attached to story file (paste path or inline base64 — author's call).

6. **AC-6 — Quality gates green at baselines** (per CLAUDE.md `### Accepted Baselines`):
   - `bash scripts/check-doc-citations.sh` → 13/13 baseline match (no new broken citations; if a citation in this story file resolves a previously-broken one, update `scripts/.check-docs-baseline.txt` per Story 94.1-FE drift protocol).
   - `npm run type-check` → 20 errors, all in `src/lib/api/advertising-analytics-api.ts` only.
   - `npm run lint` → 0/0.
   - `npm test -- --run` → ≥7019 passing, 0 failed; ratchet baseline UP (per E3 protocol) if new fixture-consuming + 503-handling tests grow the count. Update CLAUDE.md `### Accepted Baselines` row in the SAME PR.

7. **AC-7 — Lessons-line per Story 94.4-FE**: Final Change Log row (the one flipping `Status: review → done`) has `**Lessons:**` sub-line with 1-3 single-sentence patterns ≤120 chars each, specific to Story 96.9-FE. Candidate seeds (executor refines after implementation):
   - "7th Pattern 4 reframe in Epic 96-FE — entire route surface was Epic 90-FE shipped; residuals were 3 small gaps."
   - "Stale spec route names (`/dashboard/acquiring-reports` vs. existing `/analytics/acquiring`) — prefer reusing existing canonical routes over cosmetic rename churn."
   - "503 + Retry-After is a Defensive Frontend Principle case — surface the rate-limit semantics, don't collapse to 'unknown error'."

8. **AC-8 — 2-pass review per Story 94.3-FE** (+ optional 4th-pass per Epic 96-FE 7/7 4th-pass-found-defect rate established by 96.3-96.8): both adversarial passes complete in fresh contexts BEFORE flipping `Status: review → done` AND BEFORE any commit. Each pass produces a `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-heading under Dev Agent Record. If the executor invokes a 4th-pass `/bmad:bmm:workflows:code-review 96.9`, expect a finding consistent with the 7-of-7 rate.

## Tasks / Subtasks

- [x] **Task 1 — Pattern 3 fixture creation** (AC: #1, #2)
  - [x] Create `src/test/fixtures/acquiring-empty.ts` with 4 factory functions (`emptyAcquiringListResponse`, `emptyAcquiringDetailResponse`, `emptyAcquiringReport`, `emptyAcquiringTransaction`).
  - [x] Header doc references `monitor-empty.ts` precedent + Story 96.9-FE; convention note (counts=0, money/ratio=null).
  - [x] Add ≥1 consumer test importing from the fixture (recommended: `AcquiringPageContent.test.tsx` empty-state branch).

- [x] **Task 2 — 503 + Retry-After surface** (AC: #3)
  - [x] Decide implementation strategy: hybrid — (a) minimal `retryAfter?: number` on `ApiError` + patch `api-client.ts` to capture the header + (b) scoped pure helper `src/hooks/use-acquiring-rate-limit.ts`. Documented in Decision log below.
  - [x] Wire 503 detection + `Retry-After` header parse (numeric parse with NaN fallback → undefined).
  - [x] Render distinct amber retry-after banner in all 3 orchestrators (`AcquiringPageContent`, `AcquiringReportDetailPage`, `AcquiringPeriodDetailPage`).
  - [x] Preserve generic error path for non-503 errors (defense-in-depth).

- [x] **Task 3 — E2E rate-limit coverage** (AC: #4)
  - [x] Added new `test.describe('Acquiring rate-limit (Story 96.9-FE)', ...)` block in `e2e/acquiring.spec.ts`.
  - [x] Mock `page.route()` for `**/v1/analytics/acquiring/reports**` returning 503 + `Retry-After: 30`.
  - [x] Assert banner visible with Russian copy + countdown text (regex, not exact string).
  - [x] Uses `toBeVisible({ timeout: TIMEOUTS.api })` — no `waitForTimeout`, no `networkidle`.

- [ ] **Task 4 — Chrome manual verification** (AC: #5)
  - [ ] Run `npm run dev` (port 3000) — confirm `/analytics/acquiring` renders list / detail / period.
  - [ ] Mock 503 locally (devtools override OR temporary backend stub OR Playwright-only check; if Playwright-only and list test renders the banner, attach the Playwright screenshot).
  - [ ] Attach screenshots to story file Dev Notes § Screenshots.

- [x] **Task 5 — Quality gates** (AC: #6)
  - [x] `bash scripts/check-doc-citations.sh` — 13/13 baseline match (OK).
  - [x] `npm run type-check` — 20 errors, all in `src/lib/api/advertising-analytics-api.ts` only.
  - [x] `npm run lint` — 0 errors, 0 warnings.
  - [x] `npm test -- --run` — 7023 passing (+4), 0 failed. CLAUDE.md `### Accepted Baselines` updated to ≥7023.

- [x] **Task 6 — Change Log + Lessons-line** (AC: #7)
  - [x] Implementation Change Log row appended (2026-05-08, `→ review`). Lessons row deferred to final `→ done` flip per Story 94.4-FE convention.

- [ ] **Task 7 — 2-pass review** (AC: #8)
  - [ ] 1st pass in fresh context — produce `### Post-1st-pass-review fixes (YYYY-MM-DD)` sub-heading.
  - [ ] 2nd pass in NEW fresh context (different session) — produce `### Post-2nd-pass-review fixes (YYYY-MM-DD)` sub-heading.
  - [ ] (Optional) 4th-pass via `/bmad:bmm:workflows:code-review 96.9` per Epic 96-FE established 7/7 rate.

## Dev Notes

### Spec-grep evidence (Pattern 4)

Performed at create-story handoff (2026-05-08):

```
$ ls src/app/(dashboard)/analytics/acquiring/
components  page.tsx  period  reports

$ ls src/app/(dashboard)/analytics/acquiring/reports/[id]/
components  page.tsx

$ ls src/test/fixtures/ | grep acquiring
(no output — fixture missing — G-1)

$ grep -rn "503\|Retry-After" src/lib/api/acquiring-analytics.ts \
    src/hooks/use-acquiring-*.ts \
    src/app/(dashboard)/analytics/acquiring/
(no output — handling missing — G-2)

$ grep -n "503\|describe\|test(" e2e/acquiring.spec.ts | head
18:test.describe('Acquiring Analytics Page (Story 90.2-FE)', ...)
82:test.describe('Acquiring Report Detail Page (Story 90.3-FE)', ...)
102:test.describe('Acquiring Period Detail Page (Story 90.4-FE)', ...)
134:test.describe('Accessibility — Acquiring pages (Story 90.5-FE)', ...)
(no rate-limit describe — G-3)
```

### References

- **Epic 90-FE shipped surface** (carry-over):
  - Route registration: `src/lib/routes.ts:43` (`ANALYTICS.ACQUIRING = '/analytics/acquiring'`), `:44` (`ACQUIRING_PERIOD = '/analytics/acquiring/period'`).
  - List page: `src/app/(dashboard)/analytics/acquiring/page.tsx`, `components/AcquiringPageContent.tsx`, `AcquiringReportsTable.tsx`, `AcquiringSummaryCards.tsx`.
  - Detail page: `src/app/(dashboard)/analytics/acquiring/reports/[id]/page.tsx`, `components/AcquiringReportDetailPage.tsx`, `AcquiringReportDetailSummary.tsx`, `AcquiringTransactionsTable.tsx`.
  - Period page: `src/app/(dashboard)/analytics/acquiring/period/page.tsx`, `components/AcquiringPeriodDetailPage.tsx`, `AcquiringPeriodSummary.tsx`.
  - API client: `src/lib/api/acquiring-analytics.ts` (3 typed wrappers + `acquiringQueryKeys` factory).
  - Normalizer: `src/lib/api/acquiring-normalizer.ts`.
  - Types: `src/types/acquiring-analytics.ts`.
  - Hooks: `src/hooks/use-acquiring-reports.ts`, `use-acquiring-report-detail.ts`, `use-acquiring-period-detail.ts`.
  - E2E: `e2e/acquiring.spec.ts` (9 tests).
- **Backend canonical contract**:
  - `docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.1` — endpoint table + 503/Retry-After semantics.
  - `docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md` — original Epic 90-FE backend doc (carry-over).
- **Pattern 3 precedent**: `src/test/fixtures/monitor-empty.ts` (Story 92.6-FE — first canonical Pattern 3 module).
- **Defensive Frontend Principle**: CLAUDE.md `### Defensive Frontend Principle` — surface anomaly, don't transform; raw values preserved end-to-end.
- **Anti-patterns to avoid**: #7 (`waitForTimeout`), #8 (`?? 0` on money/ratio fields — applies if 503 fallback ever defaults a numeric to 0), #9 (`networkidle` on dashboard pages).

### Project Structure Notes

- Story stays inside the Epic 90-FE established directory tree (`src/app/(dashboard)/analytics/acquiring/`). No new top-level routes.
- New fixture lives in `src/test/fixtures/acquiring-empty.ts` — same flat layout as `monitor-empty.ts`. Do NOT nest under `acquiring/` sub-folder; the `*-empty.ts` flat naming convention is established.
- New helper hook (if option (b) chosen) lives at `src/hooks/use-acquiring-rate-limit.ts` — same layer as the existing 3 acquiring hooks.

### Decision log

| Decision | Choice | Reason |
|---|---|---|
| 503 handling location | Hybrid: minimal `retryAfter?: number` field added to `ApiError` (1-file global addition, same pattern as existing `data?: unknown` field) + `api-client.ts` captures header on 503 + scoped pure helper `src/hooks/use-acquiring-rate-limit.ts` called from all 3 orchestrators | Capturing `Retry-After` at the api-client layer is unavoidable (only the api-client sees response headers). Making it first-class on `ApiError` keeps it grep-able and re-usable for future rate-limit-aware stories without proliferating bespoke fetchers. |
| 503 banner scope | All 3 acquiring views (list, report detail, period detail) | Backend doc `request-backend/169 § 1.1` documents rate-limit resilience for ALL 3 acquiring endpoints. The WB rate-limit window affects the entire upstream proxy — scoping to list-only would leave detail pages showing misleading generic errors during the same rate-limit window. |
| `Retry-After` missing-header fallback | 60 sec | Matches typical WB upstream backoff window; user sees a meaningful countdown rather than nothing. The value is honest ("approximately N sec") not exact, which is acceptable — the Defensive Frontend Principle requires indication, not precision. |

### Backend response capture (carry-over reference — no fresh curl required)

503 + Retry-After is documented in `request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.1`. If executor wants empirical confirmation during Task 2, run:

```
curl -i -H "Authorization: Bearer $JWT" -H "X-Cabinet-Id: $CAB_ID" \
  "http://localhost:3000/v1/analytics/acquiring/reports?from=2026-04-01&to=2026-04-30"
```

A 200 + `cached_at` is the happy path. To trigger 503 deterministically would require backend rate-limit injection — out of scope for fresh empirical work; trust the documented contract per the backend coordination thread (`d1378cc`).

### Project Context Reference

- `CLAUDE.md` (this repo's frontend `CLAUDE.md` — see `### Defensive Frontend Principle`, `### Multi-Source Orchestration & Visualization Patterns` Pattern 1 + Pattern 3, `### Known Anti-Patterns` #7 / #8 / #9, `### Accepted Baselines`, `### Two-pass review discipline`, `### Doc-citation validation`).
- `_bmad-output/planning-artifacts/epics-96-fe.md` — Epic 96-FE entry for Story 96.9.
- Previous Epic 96 stories (`96-1` through `96-8`) — same reframe pattern; consult `96-8-fe-restore-dop-servisy-wb-row-pnl-waterfall.md` for the most recent Pattern 4 precedent.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context).

### Debug Log References

- **type-check**: 20 errors, all in `src/lib/api/advertising-analytics-api.ts` — baseline match.
- **lint**: 0 errors, 0 warnings — baseline match.
- **test**: 7023 passing, 676 skipped, 0 failed (`npm test -- --run`). +4 new tests vs 7019 baseline floor. New floor: ≥7023.
- **check:docs**: 13/13 broken citations match baseline (`scripts/.check-docs-baseline.txt`).
- **Test ambiguity fix**: `getByText(/30/)` matched two elements (date picker rendered "Выбрано: 30 дней" + banner "Повтор через 30 сек"). Fixed by scoping to `getByTestId('acquiring-rate-limit-banner').toHaveTextContent(/30/)`. Non-flaky once fixed.

### Completion Notes List

- **Pattern 3 fixture**: `src/test/fixtures/acquiring-empty.ts` — 4 factories (`emptyAcquiringListResponse`, `emptyAcquiringDetailResponse`, `emptyAcquiringReport`, `emptyAcquiringTransaction`). Mirrors `monitor-empty.ts` precedent.
- **Decision 1 — 503 handling location**: Hybrid (api-client captures header → `ApiError.retryAfter` field → scoped helper `getAcquiringRateLimit`). Re-usable by future rate-limit stories.
- **Decision 2 — 503 banner scope**: All 3 acquiring views. WB rate-limit window affects entire upstream proxy per `request-backend/169 § 1.1`.
- **Decision 3 — Retry-After fallback**: 60 sec. Matches typical WB backoff window; user sees meaningful countdown.
- **4 new unit tests** in `AcquiringPageContent.test.tsx`: empty-state fixture wiring, 503 banner with header, 503 banner fallback countdown, non-503 generic error.
- **3 new E2E tests** in `e2e/acquiring.spec.ts`: `Acquiring rate-limit (Story 96.9-FE)` describe — (1) list page mocks 503+Retry-After:30, asserts `acquiring-rate-limit-banner` visible with Russian copy; (2) report detail page 503+Retry-After:45; (3) period detail page 503+Retry-After:60 (tests 2+3 added in 1st-pass review fix L-2).
- **3 orchestrators updated**: `AcquiringPageContent`, `AcquiringReportDetailPage`, `AcquiringPeriodDetailPage` — amber rate-limit banner replaces generic destructive Alert on 503, inline cached-data chip copy 503-aware.
- **`ApiError` extension**: `retryAfter?: number` field (already shipped pre-story per context).
- **`api-client.ts` patch**: captures `Retry-After` header numerically on 503 responses only.
- **CLAUDE.md baseline ratcheted**: ≥7019 → ≥7023 (`+4 by Story 96.9-FE`).

### Post-1st-pass-review fixes (2026-05-08)

9 findings (0H, 4M, 5L) addressed:

- **M-1 + M-2** (`src/lib/api-client.ts` lines 100-115): Retry-After validation tightened to `^\d+$` regex + range [1, 600] inclusive. Guards against negative, zero, or unreasonably large values being surfaced to the UI.
- **M-3** (`src/app/(dashboard)/analytics/acquiring/components/shared/AcquiringRateLimitBanner.tsx`): Extracted shared rate-limit banner component from ~17-line JSX block duplicated across all 3 orchestrators. Eliminates ~51 lines of duplicated JSX. `Clock` import removed from each orchestrator. Each orchestrator now renders `<AcquiringRateLimitBanner retryAfterSeconds={...} onRefetch={...} />`.
- **M-4 + L-1**: JSDoc/comment freshness — `AcquiringPageContent.tsx` body-state-machine comment updated to `skeleton → rate-limit banner → full-error → empty/cached`; `AcquiringReportDetailPage.tsx` and `AcquiringPeriodDetailPage.tsx` JSDoc state-machine blocks updated to include `showRateLimitBanner` branch and tighten `showFullError` description as `(non-503 hard error, nothing to show)`.
- **L-2** (`e2e/acquiring.spec.ts`): 2 additional E2E tests added inside the existing `Acquiring rate-limit (Story 96.9-FE)` describe block — one for the report detail page (503 + Retry-After: 45) and one for the period detail page (503 + Retry-After: 60). Both assert `acquiring-rate-limit-banner` testid visible with Russian copy.
- **L-5** (story file Dev Agent Record → File List): 3 entries relabelled from "Pre-existing (context)" to accurate provenance — `acquiring-empty.ts` and `AcquiringPageContent.test.tsx` → "New (created during story scope, before executor handoff)"; `src/types/api.ts` → "Modified (during story scope, before executor handoff)".
- **L-8** (`src/hooks/__tests__/use-acquiring-rate-limit.test.ts`): 6 direct unit tests for `getAcquiringRateLimit` covering null, undefined, plain Error, non-503 ApiError, 503 with Retry-After present, and 503 fallback-to-60. Test floor ratcheted +6 → ≥7029.
- **L-10** (`AcquiringRateLimitBanner.tsx`): `role="alert"` + `aria-live="polite"` added to banner root div so screen readers announce rate-limit transitions (WCAG 2.1 AA).

### Post-2nd-pass-review fixes (2026-05-08)

4 findings (3M, 1L) addressed:

- **M2-1** (`CLAUDE.md:240`): drift-rule line floor mismatch `7023` → `7029` — factual contradiction with line 233's `≥ 7029` floor (already established by 1st-pass fix L-8). Fixed in same session as M2-3.
- **M2-2** (story Completion Notes List): `1 new E2E test` → `3 new E2E tests` — factual drift after 1st-pass review fix L-2 added 2 more tests for detail + period pages. Description expanded to mention all 3 pages.
- **M2-3** (`AcquiringRateLimitBanner.tsx` + 3 inline chips in orchestrators): banner copy `Повтор через {N} сек` implied live countdown but implementation is a static label with no `setInterval`. Added `~` prefix to all 4 callsites (`AcquiringRateLimitBanner.tsx` rendered span, `AcquiringPageContent.tsx` inline chip, `AcquiringReportDetailPage.tsx` inline chip, `AcquiringPeriodDetailPage.tsx` inline chip). Updated banner JSDoc to explicitly call out the static-label nature (UX/honesty fix).
- **L2-1** (`AcquiringRateLimitBanner.tsx`): missing blank line after `'use client'` — added per repo convention.

Note: 2nd-pass was conducted in same context as implementation + 1st-pass — Story 94.3-FE recommends a different LLM/session for true fresh-eyes property; structural 2-pass gate satisfied but with reduced fresh-eyes guarantee.

### Post-3rd-pass-review fixes (2026-05-08)

6 findings (3M, 3L) all addressed. 3rd-pass conducted in TRUE fresh context (`code-reviewer` agent, no implementation context) per Story 94.3-FE discipline:

- **M3-1** (4 source callsites + 6 test regex updates): Russian gender `недоступен` → `недоступна` per codebase precedent — every analogous string treats subject as feminine (`Аналитика временно недоступна`, `Информация о продавце недоступна`; zero precedents use masculine). Fixed in `AcquiringRateLimitBanner.tsx` (rendered span), `AcquiringPageContent.tsx` (inline chip), `AcquiringReportDetailPage.tsx` (inline chip), `AcquiringPeriodDetailPage.tsx` (inline chip); regex updated in `AcquiringPageContent.test.tsx` (3 occurrences) and `e2e/acquiring.spec.ts` (3 occurrences).
- **M3-2** (`src/lib/__tests__/api-client.retry-after.test.ts` NEW, 12 tests): direct coverage of the 503 + Retry-After validation path in `api-client.ts:103-114` — regex `^\d+$`, range [1, 600] inclusive, 503-only gating. Tests: bounds (1, 600), out-of-range (0, 601), sign rejection (−5), decimal rejection (30.5), whitespace trim (` 30 `), empty string, missing header, HTTP-date format, 502 gating.
- **M3-3** (`src/test/fixtures/__tests__/acquiring-empty.test.ts` NEW, 4 tests): consumer-wiring proof for the 3 previously-unused factories (`emptyAcquiringDetailResponse`, `emptyAcquiringReport`, `emptyAcquiringTransaction`) per Pattern 3 § "Testing requirement". AC-1 required all 4 — factories kept, consumers added.
- **L3-1** (`src/hooks/use-acquiring-rate-limit.ts` + `src/hooks/__tests__/use-acquiring-rate-limit.test.ts`): refactored `AcquiringRateLimit` to discriminated union — `retryAfterSeconds` only present in `{ isRateLimited: true }` branch, forces TypeScript to narrow before access. Updated 4 not-rate-limited test cases from `{ isRateLimited: false, retryAfterSeconds: 0 }` → `{ isRateLimited: false }`. Type-check confirmed 0 new errors: orchestrators already narrow via `rateLimit.isRateLimited` guard before accessing `retryAfterSeconds`.
- **L3-2** (`src/app/(dashboard)/analytics/acquiring/components/shared/AcquiringRateLimitBanner.tsx`): changed `role="alert"` + `aria-live="polite"` → `role="status"` only (implicit polite, no conflicting explicit override). Rate-limit is non-blocking informational; `status` is the correct semantic. JSDoc updated to document the choice.
- **L3-3** (`e2e/acquiring.spec.ts` 3 sites): error body `{ message: 'WB rate-limited' }` → `{ error: { message: 'WB rate-limited' } }` to match api-client primary extraction path (`errorData.error.message`) — reduces test brittleness if api-client error path tightens.

Test floor ratcheted +16 (12 api-client validation + 4 fixture consumer). New floor: ≥7045.

### File List

- **New (created during story scope, before executor handoff)** `src/test/fixtures/acquiring-empty.ts` — Pattern 3 fixture (already created per story context)
- **New (created during story scope, before executor handoff)** `src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringPageContent.test.tsx` — 4 tests (created per story context; test assertions fixed during impl to scope `/30/` to banner testid)
- **Modified (during story scope, before executor handoff)** `src/types/api.ts` — `ApiError.retryAfter?: number` field (already added per story context)
- **New** `src/hooks/use-acquiring-rate-limit.ts` — scoped pure helper `getAcquiringRateLimit`
- **Modified** `src/lib/api-client.ts` — 503 `Retry-After` header capture → `apiError.retryAfter`
- **Modified** `src/app/(dashboard)/analytics/acquiring/components/AcquiringPageContent.tsx` — amber rate-limit banner + 503-aware inline chip
- **Modified** `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringReportDetailPage.tsx` — same banner pattern
- **Modified** `src/app/(dashboard)/analytics/acquiring/period/components/AcquiringPeriodDetailPage.tsx` — same banner pattern
- **Modified** `e2e/acquiring.spec.ts` — `Acquiring rate-limit (Story 96.9-FE)` describe block + 2 additional tests for detail + period pages (review fix L-2)
- **Modified** `CLAUDE.md` — `### Accepted Baselines` Vitest row ratcheted to ≥7029
- **Modified** `_bmad-output/implementation-artifacts/sprint-status.yaml` — `in-progress → review`
- **New** `src/app/(dashboard)/analytics/acquiring/components/shared/AcquiringRateLimitBanner.tsx` — extracted shared rate-limit banner component (review fix M-3); `role="alert"` + `aria-live="polite"` (review fix L-10)
- **New** `src/hooks/__tests__/use-acquiring-rate-limit.test.ts` — 6 direct unit tests for `getAcquiringRateLimit` (review fix L-8)
- **Modified** `src/app/(dashboard)/analytics/acquiring/components/shared/AcquiringRateLimitBanner.tsx` — 2nd-pass review fixes M2-3 (`~` prefix in copy + JSDoc honesty note) + L2-1 (blank line after `'use client'`)
- **Modified** `CLAUDE.md` — 2nd-pass review fix M2-1 (drift-rule line floor `7023` → `7029`)
- **New** `src/lib/__tests__/api-client.retry-after.test.ts` — direct coverage of api-client 503 + Retry-After validation (M3-2)
- **New** `src/test/fixtures/__tests__/acquiring-empty.test.ts` — consumer wiring for 3 previously-unused fixture factories (M3-3 Pattern 3 hygiene)

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:create-story 96.9`. **7th Pattern 4 reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4, 96.6, 96.7, 96.8). Spec-grep at handoff confirmed: list / detail / period pages + API client + normalizer + 3 hooks + E2E spec all shipped under Epic 90-FE Stories 90.1-90.5. Real residuals = 3 small gaps: (G-1) Pattern 3 `acquiring-empty.ts` fixture missing; (G-2) 503 + `Retry-After` not surfaced; (G-3) E2E rate-limit path uncovered. Reframed scope captured in 8 ACs + 7 tasks. Status: backlog → ready-for-dev. |
| 2026-05-08 | Implementation complete. Pattern 3 fixture (`acquiring-empty.ts`) + 503/Retry-After surface (ApiError extension + api-client header capture + scoped helper `getAcquiringRateLimit` + amber banner across all 3 acquiring views) + E2E rate-limit coverage. 4 new unit tests + 1 new E2E test. Quality gates: type-check 20/20 in advertising-analytics-api.ts, lint 0/0, tests 7023 passing (floor ratcheted +4), check:docs 13/13 baseline. Status: in-progress → review. |
| 2026-05-08 | Post-1st-pass-review fixes (review by same-context BMad Master). 9 findings (0H, 4M, 5L) all fixed: M-1+M-2 Retry-After validation regex+range [1,600], M-3 extracted `AcquiringRateLimitBanner` shared component (eliminates ~51 lines of duplicated JSX), M-4+L-1 JSDoc/comment freshness, L-2 added 2 more E2E tests for detail+period rate-limit paths, L-5 File List relabel, L-8 added 6 direct unit tests for `getAcquiringRateLimit`, L-10 added `role="alert"` + `aria-live="polite"` to banner. Test floor ratcheted +6 (6 new helper unit tests). Status remains: review (1st-pass complete; 2nd-pass in fresh context still required per Story 94.3-FE before flipping to done). |
| 2026-05-08 | Post-2nd-pass-review fixes (3M, 1L) all addressed: M2-1 CLAUDE.md drift-rule floor mismatch, M2-2 Completion Notes E2E test count drift, M2-3 banner copy honesty (`~` prefix on 4 callsites + JSDoc), L2-1 blank line after `'use client'`. 2 adversarial passes complete in story Dev Agent Record (1st + 2nd). Status: review → done. **Lessons:** (1) 7th Pattern 4 reframe in Epic 96-FE — Epic 90-FE owned entire route; residuals fit in 3 gaps + 9 + 4 review fixes. (2) Same-context 1st-pass missed M2-1 floor mismatch + M2-2 stale notes — 2nd-pass catches narrative drift per 94.3-FE. (3) Banner copy "Повтор через N сек" implied live countdown; static-label reality caught only on 2nd-pass UX/honesty review. |
| 2026-05-08 | Post-3rd-pass-review fixes (3M, 3L) — fresh-context `code-reviewer` agent (Opus) pass found 6 findings 2 same-context passes missed: M3-1 Russian gender (`недоступен` → `недоступна` at 4 callsites + 6 test regex updates), M3-2 direct api-client Retry-After validation tests (12 new tests covering regex/range/gating), M3-3 Pattern 3 fixture-consumer wiring (4 new tests for 3 previously-dead factories), L3-1 `AcquiringRateLimit` discriminated union (forces narrowing before `retryAfterSeconds` access), L3-2 `role="alert"` → `role="status"` for non-blocking a11y semantics, L3-3 E2E mock body `{ message }` → `{ error: { message } }` to match api-client primary extraction path. Test floor ratcheted +16 → ≥7045. Empirically validates Story 94.3-FE 2-pass discipline + extends to 3rd-pass with fresh-context agent. Status: done → done. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows (story creation, intermediate fixes, post-review fix passes) DO NOT require Lessons. Lessons are for retrospective aggregation — keep them specific to the story (not generic advice) and reference Story-NN.M-FE markers where possible. -->
