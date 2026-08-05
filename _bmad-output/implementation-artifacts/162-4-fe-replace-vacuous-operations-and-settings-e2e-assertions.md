# Story 162.4: Replace Vacuous Operations and Settings E2E Assertions

Status: done

<!-- Note: This artifact is intentionally ignored by the repository-wide _bmad-output rule. Force-add this exact file when committing the story. -->

## Story

As a frontend developer,
I want operations and settings browser tests to verify concrete workflow states,
so that broken backfill, supply, COGS, and pricing behavior cannot appear green.

## Acceptance Criteria

1. **The owned tautology inventory reaches zero (AC1)**
   - **Given** the operations/settings E2E scope contains 36 tautological assertion sites
   - **When** the affected specs are remediated
   - **Then** all unconditional truth fallbacks are removed
   - **And** the owned-scope count becomes zero.

2. **Backfill states and controls fail closed (AC2)**
   - **Given** backfill administration has loading, empty, running, paused, failed, and permission-gated states
   - **When** its tests run
   - **Then** each test asserts its intended state explicitly
   - **And** a missing required control or status causes failure.

3. **Supply workflows depend on deterministic evidence (AC3)**
   - **Given** supplies and supply-planning flows depend on backend records
   - **When** deterministic seed data exists
   - **Then** lifecycle, detail, list, and accessibility tests assert the expected records and actions
   - **And** missing required seed data fails preflight rather than passing an empty assertion.

4. **COGS and price calculation prove their result (AC4)**
   - **Given** COGS assignment or price-calculator behavior is under test
   - **When** the UI submits or calculates data
   - **Then** the test verifies the visible result and relevant request/response outcome
   - **And** does not accept element absence as success.

5. **Unavailable fixtures remain visible in reports (AC5)**
   - **Given** a scenario is legitimately unavailable for the configured local fixture
   - **When** it cannot execute
   - **Then** it uses a conditional skip with a concrete reason
   - **And** remains visible in the Playwright report.

6. **The complete scope passes locally and remains guarded (AC6)**
   - **Given** the remediation is complete
   - **When** targeted backfill, supplies, supply-planning, COGS, and price-calculator specs run
   - **Then** they pass against prepared localhost fixtures
   - **And** the global prohibited-assertion static check remains at zero findings.

## Tasks / Subtasks

- [x] Task 1: Lock the complete Story 162.4 assertion contract before behavior edits (AC: #1, #6)
  - [x] Preserve the canonical raw inventory of 36 sites: 27 `|| true` assertions and 9 nonnegative-count assertions across the complete operations/settings scan boundary.
  - [x] Record the full semantic baseline as 38 actionable sites: the canonical 36 plus direct `expect(true)` and the disabled-or-enabled logical complement in `e2e/price-calculator.spec.ts`; distinguish it from comments and the valid keyboard-index guard.
  - [x] Extend `scripts/check-e2e-vacuous-assertions.mjs` with separate Story 162.3 and Story 162.4 allowlists and a combined default guard; keep the exact Story 162.3 `57`-site regression intact.
  - [x] Add scanner coverage for locator counts followed by `.catch(...)`, so `expect(skeletonCount >= 0)` in backfill cannot evade the guard.
  - [x] Detect logical complements such as `isButtonDisabled || isButtonEnabled` when both booleans are derived from the same locator state.
  - [x] Add an exact Story 162.4 `38`-site baseline regression at base SHA `9a882a1de72e8716a1969002a648e027f4a05c0f`, prove RED on the baseline, and require zero findings on the current combined allowlist.
  - [x] Reconcile the OMX plan/generator and durable manifest scope with `e2e/settings/backfill-a11y.spec.ts`, which is included by the canonical `e2e/settings` verification boundary.

- [x] Task 2: Replace Backfill false-green assertions (AC: #1, #2, #5)
  - [x] In `e2e/settings/backfill-admin.spec.ts`, replace all 17 semantic vacuities with exact Owner shell, subtitle, refresh/start controls, table/empty state, and status-action assertions.
  - [x] Require the exact `Управление бэкфиллом` shell and `Загрузка исторических данных FBS за 365 дней` subtitle for an Owner; a non-Owner case must prove redirect or permission denial rather than pass on `main`.
  - [x] Use canonical status semantics from `src/lib/backfill-utils.ts`: running rows expose progress/pause, paused rows expose resume, failed rows expose error/retry, and missing optional fixture states use a specific conditional skip only after the required shell is proven.
  - [x] Make loading/empty tests deterministic through bounded route fixtures and assert the documented empty state `Нет кабинетов для бэкфилла`; do not infer success from a nonnegative count.
  - [x] In `e2e/settings/backfill-a11y.spec.ts`, replace the four canonical sites with focus restoration, concrete live/progress semantics or a reasoned fixture skip, and exactly one selected analytics tab.
  - [x] Keep `e2e/backfill-page.spec.ts` in the targeted suite and retain or strengthen its explicit heading-or-redirect and named terminal-state assertions.

- [x] Task 3: Replace Supply Planning false greens (AC: #1, #3, #5)
  - [x] In `e2e/supply-planning.spec.ts`, replace the three `|| true` sites with named selector, risk-state, and metrics-bar assertions.
  - [x] Prefer exact labels already rendered by the product, including `Планирование поставок`, safety-stock/velocity choices, `Требуют внимания`, `Требуется капитал`, and `В пути`.
  - [x] For fixture-dependent risk or metric data, first prove the required page shell and stable terminal state, then assert prepared values or use a concrete conditional skip; never fall back to generic cards, body, or arbitrary numeric text.

- [x] Task 4: Replace Supplies lifecycle, detail, list, and accessibility false greens (AC: #1, #3, #5)
  - [x] Replace the five sites in `e2e/supplies/supplies-a11y.spec.ts` with exact focus, accessible-name, checkbox, live-region, and loading-state evidence; use reasoned skips only when the configured fixture legitimately has no relevant control.
  - [x] Replace pagination fallback in `e2e/supplies/supplies-list.spec.ts` with exact `Предыдущая страница` / `Следующая страница` controls for a multi-page fixture, or a specific fixture-aware skip.
  - [x] Replace download fallback in `e2e/supplies/supply-detail.spec.ts` with an observed download/request plus visible success state; do not accept the absence of a document or event.
  - [x] Replace the lifecycle loading fallback in `e2e/supplies/supply-lifecycle.spec.ts` with a concrete disabled/loading transition around the guarded mutation.
  - [x] Preserve the sandbox acknowledgement guard for every mutating supply test.

- [x] Task 5: Replace COGS and price-calculator false greens (AC: #1, #4, #5)
  - [x] In `e2e/cogs-assignment.spec.ts`, require the named search/filter control, fixture-aware pagination, and visible COGS input after selecting a deterministic product; remove adjacent `body`-visibility fallbacks that would still satisfy the same AC vacuously.
  - [x] Keep `e2e/cogs-pages.spec.ts` in the targeted suite and preserve its meaningful heading, route, table, empty, loading, and error states.
  - [x] In `e2e/price-calculator.spec.ts`, wait for mocked `POST /v1/products/price-calculator` and require the named results UI plus expected visible price output.
  - [x] Replace the disabled-or-enabled logical complement with the intended initial validation state and a concrete assertion.
  - [x] Replace reset-path `expect(true)` with explicit dialog-or-reset state evidence; element absence alone is never success.

- [x] Task 6: Preserve adjacent-story boundaries and repository safety contracts (AC: #2-#6)
  - [x] Do not sweep fixed waits owned by Stories 162.7 and 162.8 unless a remediated assertion cannot be made deterministic without a minimal local change.
  - [x] Do not perform the global conditional-skip cleanup owned by Story 162.9; only replace branches directly associated with these sites and keep introduced skips specific and report-visible.
  - [x] Do not introduce `networkidle`, broad `body`/generic `main` evidence, generic card/class counts, or catch-and-pass fallbacks.
  - [x] Preserve Story 162.2 preflight, authentication, setup-project, network boundary, mutation, localhost-only, and privacy/redaction contracts.
  - [x] Add no dependency, application feature, backend change, CI requirement, deployment behavior, production scope, force-push, or direct-main delivery.

- [x] Task 7: Validate, independently review, and deliver through a normal PR (AC: #1-#6)
  - [x] Run scanner unit tests, the global static command, and exact raw/semantic zero audits over the Story 162.4 allowlist.
  - [x] Run Playwright discovery, then the 11 owned specs against prepared frontend `localhost:3100` and backend `localhost:3000` through `npm run test:e2e:full -- ...`.
  - [x] Run targeted Vitest, typecheck, zero-warning ESLint, formatting, privacy/static checks, production webpack build, OMX/BMad parity, and `git diff --check` using pinned Node.js/npm versions.
  - [x] Obtain independent code-reviewer, architecture, and verifier verdicts; resolve every blocking finding before delivery.
  - [x] Force-add this ignored artifact, commit and push only the feature branch, merge through a normal PR, prove ancestry, fast-forward local `main`, and remove local/remote feature branches and the disposable worktree before completion.

## Dev Notes

### Implementation Readiness

- Story 162.2 is complete through PR #92 and supplies the mandatory E2E preflight/auth/mutation boundary. Story 162.3 is complete through PR #94 and supplies the reusable assertion scanner and explicit-state patterns.
- Story 162.4 branches from clean `origin/main` SHA `9a882a1de72e8716a1969002a648e027f4a05c0f` as `codex/story-162-4-meaningful-operations-e2e` at `/private/tmp/wb-repricer-story-162-4-frontend`.
- Immutable OMX plan metadata remains `initial_status: backlog`; lifecycle state is `ready-for-dev` here and in `sprint-status.yaml` and advances independently.
- The durable `.omx/orchestration/story-delivery-manifest.json` is leader-owned state in the primary repository and is not committed from the disposable worktree.

### Inventory and Regression Contract

- Canonical raw inventory: 36 sites = 27 `|| true` assertions plus 9 nonnegative-count assertions.
- Full semantic inventory: 38 sites. The two additional sites are direct `expect(true)` in the reset path and the always-true disabled-or-enabled assertion in price calculator.
- Existing scanner output over the full Story 162.4 file list is 36: it catches direct `expect(true)` but misses the backfill `locator.count().catch(...)`-derived `>= 0` assertion and the locator-state logical complement. The strengthened scanner must reproduce all 38 from the base revision and report zero after remediation.
- Per-file semantic baseline: backfill admin 17, backfill accessibility 4, supply planning 3, supplies accessibility 5, supplies list 1, supply detail 1, supply lifecycle 1, COGS assignment 3, price calculator 3; backfill page and COGS pages have zero prohibited sites but remain in the live targeted suite.
- The canonical `e2e/settings` boundary includes an FBS Orders Analytics accessibility assertion inside `backfill-a11y.spec.ts`. Remediate that site to make the global guard zero, but do not reopen Story 162.3 or expand into unrelated analytics changes.

### Required-State and Optional-Fixture Policy

- Required route, shell, heading, control, claimed interaction, or prepared fixture state is P0 and never skips. Missing required behavior fails on a named role, label, text, test-id, URL, or response assertion.
- Optional data may affect a detail assertion, not the page shell. First prove a stable shell and terminal state; then assert prepared data/empty/error state or call `test.skip(condition, 'specific fixture reason')`.
- A raw count is evidence only when bounded meaningfully (`> 0`, exact, or fixture-derived). Nonnegative counts, direct truth, generic containers, and absence-as-success are prohibited.
- Reuse deterministic route mocks already present in price calculator and repository fixtures/selectors for supplies. Prefer exact UI semantics from source over ad-hoc selectors.

### Scope Boundaries and Previous-Story Intelligence

- Story 162.2 made normal Playwright commands preflight-gated, requires fresh auth setup, rejects unsafe dependency bypasses, and keeps mutations disabled by default.
- Story 162.3 proved optional-fixture skips are trustworthy only after transient loading disappears and a required shell is visible. Its scanner masks comments/strings, fails closed on missing targets, and must retain the exact 57-site historical regression.
- Fixed waits and global skip-policy debt remain later-story work. This story is a bounded assertion remediation, not a synchronization, fixture-platform, UI, or backend refactor.

### Testing Requirements

Minimum targeted evidence:

```bash
npm run check:e2e-assertions
npx vitest run src/test/e2e-vacuous-assertions.test.ts
npm run test:e2e:full -- \
  e2e/settings/backfill-admin.spec.ts \
  e2e/settings/backfill-a11y.spec.ts \
  e2e/backfill-page.spec.ts \
  e2e/supply-planning.spec.ts \
  e2e/supplies/supplies-a11y.spec.ts \
  e2e/supplies/supplies-list.spec.ts \
  e2e/supplies/supply-detail.spec.ts \
  e2e/supplies/supply-lifecycle.spec.ts \
  e2e/cogs-assignment.spec.ts \
  e2e/cogs-pages.spec.ts \
  e2e/price-calculator.spec.ts
npm run type-check
npx eslint scripts/check-e2e-vacuous-assertions.mjs src/test/e2e-vacuous-assertions.test.ts \
  e2e/settings/backfill-admin.spec.ts e2e/settings/backfill-a11y.spec.ts \
  e2e/backfill-page.spec.ts e2e/supply-planning.spec.ts e2e/supplies/*.spec.ts \
  e2e/cogs-assignment.spec.ts e2e/cogs-pages.spec.ts e2e/price-calculator.spec.ts --max-warnings=0
npm run format:check
npm run check:privacy
npm run build -- --webpack
git diff --check
```

Playwright `--list` proves collection only; it does not satisfy live AC6. If local services, seeded credentials, or deterministic fixtures are unavailable, record the exact gap and do not claim browser acceptance passed.

### Project Structure Notes

- Expected E2E modifications: the 11 owned specs listed in Testing Requirements.
- Expected guard modifications: `scripts/check-e2e-vacuous-assertions.mjs` and `src/test/e2e-vacuous-assertions.test.ts`.
- Expected parity modifications: `scripts/manage-omx-story-plans.mjs` and `.omx/plans/story-162-4-replace-vacuous-operations-and-settings-e2e-assertions.md`.
- Expected lifecycle modifications: this artifact and `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- External leader-only modification: `.omx/orchestration/story-delivery-manifest.json` records branch/worktree/review/merge/cleanup evidence and is never part of the PR.

### References

- [Source: `_bmad-output/planning-artifacts/epics-162-165-fe.md` - Epic 162, Story 162.4]
- [Source: `.omx/plans/story-162-4-replace-vacuous-operations-and-settings-e2e-assertions.md` - dependency, scope, verification, risk, and stop condition]
- [Source: `_bmad-output/implementation-artifacts/162-3-fe-replace-vacuous-analytics-and-finance-e2e-assertions.md` - scanner, explicit-state, skip, validation, and delivery lessons]
- [Source: `_bmad-output/implementation-artifacts/162-2-fe-add-a-reproducible-local-e2e-preflight.md` - localhost preflight, auth, mutation, privacy, and delivery contracts]
- [Source: `src/app/(dashboard)/settings/backfill/page.tsx`, `src/lib/backfill-utils.ts`, and `src/hooks/useBackfillAdmin.ts` - exact Backfill states, controls, and API semantics]
- [Source: `e2e/fixtures/network-test.ts`, `e2e/fixtures/mutation-guard.ts`, and `e2e/fixtures/test-data.ts` - E2E transport, sandbox, routes, timeouts, and fixtures]
- [Source: owned Story 162.4 E2E specs - current test behavior and selectors]
- [Source: `scripts/check-e2e-vacuous-assertions.mjs` and `src/test/e2e-vacuous-assertions.test.ts` - existing Story 162.3 guard]
- [Source: `CLAUDE.md` - no silent skips, no hard waits, graceful-degradation coverage, and live E2E expectation]

## Dev Agent Record

### Agent Model Used

- Story context: Codex leader with delegated `explore` and `test-engineer` read-only analysis lanes.
- Implementation and delivery preparation: Codex leader orchestrating bounded executor, code-reviewer, architect, and verifier lanes.

### Implementation Plan

- Preserve the Story 162.3 57-site scanner baseline while adding the Story 162.4 38-site semantic baseline.
- Replace every owned vacuous assertion with deterministic shell, fixture, visible-state, request, response, or report-visible skip evidence.
- Apply only the application boundary repairs required to make the tests deterministic and contract-accurate.
- Validate locally with the pinned Node.js runtime, two fresh adversarial review passes, architecture review, and independent verification.

### Debug Log References

- 2026-08-05: Story context created from clean `origin/main` base `9a882a1d`; Story 162.2 dependency and Story 162.3 scanner predecessor are complete.
- 2026-08-05: BMAD create-story checklist and formatting gate passed; lifecycle advanced through `ready-for-dev` to `in-progress` in the isolated worktree.
- 2026-08-05: Canonical raw inventory reproduced as 36; exhaustive semantic audit found 38 actionable sites across 9 files, with 2 additional owned specs retained for live coverage.
- 2026-08-05: Scanner RED regressions proved `.count().catch(...)`, multiline matcher, and same-locator disabled/enabled complement gaps before the guard was strengthened.
- 2026-08-05: Sticker lifecycle RED regressions exposed the obsolete base64 response assumption before the flat metadata plus uppercase binary download contract was implemented.
- 2026-08-05: Initial live browser rerun hit a localhost backend rate limiter/auth timeout; `pm2 restart wb-repricer` restored the local test environment without a source change.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Dedicated implementation-ready context records exact inventory drift, full scan boundary, deterministic state semantics, adjacent-story boundaries, local validation, review, PR, and cleanup requirements.
- Replaced all 38 owned semantic false-green sites and kept the combined 19-file scanner at zero findings.
- Added deterministic backfill, supply, supply-planning, COGS, and price-calculator evidence while retaining specific report-visible skips for unavailable optional fixtures.
- Reconciled sticker generation with the backend flat metadata contract and the `POST generation -> GET /documents/STICKER -> blob download -> modal close` lifecycle.
- Local validation passed: scanner `14/14`; focused sticker/unit tests `107/107`; full Vitest `1,057` files and `17,427` tests; typecheck; zero-warning scoped ESLint; Prettier; privacy `3,239` files; production webpack build `67` pages; OMX/BMad parity `25/25`; `git diff --check`.
- Full owned Playwright passed `226`, reported `7` explicit skips, and failed `0`; post-review supply detail passed `20/20`, and the acknowledged localhost sandbox lifecycle passed `16` with `1` explicit skip and `0` failures.
- Independent final verdicts: code-reviewer `APPROVE`, architecture `CLEAR`, verifier `VERIFIED`.

### Post-1st-pass-review fixes (2026-08-05)

- Hardened the scanner against multiline `.toBeGreaterThanOrEqual(0)` formatting and added the failing-then-passing regression.
- Replaced the obsolete base64 sticker contract with backend metadata, uppercase binary download, `zplv -> zpl` mapping, and lifecycle coverage.

### Post-2nd-pass-review fixes (2026-08-05)

- Replaced the obsolete lowercase supply-detail download waiter with a deterministic uppercase `STICKER` fixture and exact response/download/toast evidence.
- Made Story 162.4 route fixtures fail closed with diagnostic HTTP 501 responses for unexpected method, path, or query combinations.
- Expanded the OMX generator and rendered plan lock scope to every changed application, API, type, fixture, test, story, and sprint path.

### Senior Developer Review (AI)

- Outcome: Approve.
- Two fresh adversarial review passes completed; all scanner, backend-contract, uppercase route, fail-closed fixture, and scope-lock findings were resolved before delivery.
- Independent final gates: code-reviewer `APPROVE`, architecture `CLEAR`, verifier `VERIFIED`.
- Delivery evidence: feature `b71a70c3` merged through PR #95 as `3f43b5e3`; ancestry, local-main fast-forward, branch/worktree cleanup, and service shutdown were proven.

### File List

- `.omx/plans/story-162-4-replace-vacuous-operations-and-settings-e2e-assertions.md` (modified)
- `_bmad-output/implementation-artifacts/162-4-fe-replace-vacuous-operations-and-settings-e2e-assertions.md` (added)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `e2e/backfill-page.spec.ts` (modified)
- `e2e/cogs-assignment.spec.ts` (modified)
- `e2e/cogs-pages.spec.ts` (modified)
- `e2e/fixtures/story-162-4-supplies.ts` (added)
- `e2e/price-calculator.spec.ts` (modified)
- `e2e/settings/backfill-a11y.spec.ts` (modified)
- `e2e/settings/backfill-admin.spec.ts` (modified)
- `e2e/supplies/supplies-a11y.spec.ts` (modified)
- `e2e/supplies/supplies-list.spec.ts` (modified)
- `e2e/supplies/supply-detail.spec.ts` (modified)
- `e2e/supplies/supply-lifecycle.spec.ts` (modified)
- `e2e/supply-planning.spec.ts` (modified)
- `scripts/check-e2e-vacuous-assertions.mjs` (modified)
- `scripts/manage-omx-story-plans.mjs` (modified)
- `src/app/(dashboard)/settings/backfill/__tests__/page.test.tsx` (modified)
- `src/app/(dashboard)/settings/backfill/components/StartBackfillDialog.tsx` (modified)
- `src/app/(dashboard)/settings/backfill/page.tsx` (modified)
- `src/app/(dashboard)/supplies/page.tsx` (modified)
- `src/components/custom/supplies/CreateSupplyModal.tsx` (modified)
- `src/components/custom/supplies/GenerateStickersModal.tsx` (modified)
- `src/components/custom/supplies/OrderPickerRow.tsx` (modified)
- `src/components/custom/supplies/OrderPickerTable.tsx` (modified)
- `src/components/custom/supplies/SuppliesPageHeader.tsx` (modified)
- `src/components/custom/supplies/__tests__/CreateSupplyModal.test.tsx` (modified)
- `src/components/custom/supplies/__tests__/GenerateStickersModal.test.tsx` (modified)
- `src/components/custom/supplies/__tests__/OrderPickerDrawer.test.tsx` (modified)
- `src/components/custom/supplies/__tests__/OrderPickerTable.test.tsx` (modified)
- `src/hooks/useDownloadDocument.ts` (modified)
- `src/lib/api/__tests__/supplies-documents.test.ts` (modified)
- `src/lib/api/supplies-documents.ts` (modified)
- `src/test/e2e-vacuous-assertions.test.ts` (modified)
- `src/test/fixtures/stickers.ts` (modified)
- `src/test/fixtures/supplies-responses.ts` (modified)
- `src/types/__tests__/supplies-stickers-errors.test.ts` (modified)
- `src/types/supply-orders.ts` (modified)

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Created implementation-ready Story 162.4 context from clean `origin/main`; canonical 36-site and full 38-site semantic inventories recorded. |
| 2026-08-05 | Implemented deterministic operations/settings assertions, strengthened the static guard, and aligned sticker generation/download with the backend contract. |
| 2026-08-05 | Addressed first-pass review findings: multiline scanner bypass and obsolete sticker response/download assumptions. |
| 2026-08-05 | Addressed second-pass review findings: uppercase document waiter, fail-closed fixtures, and complete OMX scope locks. |
| 2026-08-05 | Implementation complete. All ACs have local evidence and independent APPROVE/CLEAR/VERIFIED verdicts. **Lessons:** (1) E2E fixtures must fail closed; `route.fallback()` can leak into localhost. (2) Generation metadata and binary download are separate contracts. (3) OMX locks must include supporting source and fixture paths. Status: in-progress -> review. |
| 2026-08-05 | Senior developer review approved after all findings were resolved and PR #95 merged. Status: review -> done. |
