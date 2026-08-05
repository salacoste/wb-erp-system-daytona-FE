# Story 162.2: Add a Reproducible Local E2E Preflight

Status: done

Completion is effective through the current normal PR merge. Post-merge ancestry and cleanup evidence is retained in the durable orchestration manifest.

<!-- Note: This artifact is intentionally ignored by the repository-wide _bmad-output rule. Force-add this exact file when committing the story. -->

## Story

As a frontend developer,
I want one localhost E2E preflight command,
so that missing services, credentials, authentication, or fixtures fail early with actionable guidance.

## Acceptance Criteria

1. **Unavailable services fail before Playwright (AC1)**
   - **Given** frontend `:3100` or backend `:3000` is unavailable
   - **When** the preflight runs
   - **Then** it exits non-zero before Playwright starts
   - **And** identifies the unavailable service without printing secrets.

2. **Missing configuration is actionable and redacted (AC2)**
   - **Given** `.env.e2e` is absent or required variables are empty
   - **When** the preflight runs
   - **Then** it lists the missing variable names
   - **And** links to corrected local setup instructions based on `.env.e2e.example`.

3. **Authentication state is regenerated (AC3)**
   - **Given** credentials are configured
   - **When** authentication setup runs
   - **Then** it creates fresh Playwright storage state through the live login flow
   - **And** does not rely on expired committed or ignored auth artifacts.

4. **Default execution remains read-only (AC4)**
   - **Given** mutation variables are not explicitly acknowledged
   - **When** the default E2E command runs
   - **Then** mutating tests remain excluded
   - **And** the preflight reports that the run is read-only.

5. **Success path is executable and tested (AC5)**
   - **Given** every prerequisite is available
   - **When** the preflight completes
   - **Then** it launches the bounded smoke command or prints the exact next command
   - **And** its own success and failure branches have automated tests.

6. **Fresh-checkout documentation matches repository reality (AC6)**
   - **Given** a developer follows the E2E documentation from a fresh local checkout
   - **When** they configure the backend-seeded test user
   - **Then** all commands reference the correct repository and ports
   - **And** no frontend-local `npm run seed` command is documented unless that script exists.

## Tasks / Subtasks

- [x] Task 1: Lock the preflight contract with automated regression tests (AC: #1, #2, #4, #5)
  - [x] Add `scripts/e2e-preflight.test.mjs` using `node:test`, temporary directories, and injected probe/filesystem/runner functions; the test module must not import `child_process` because repository static-boundary rules forbid code-execution modules in `*.test.mjs`.
  - [x] Cover `--help`, absent `.env.e2e`, whitespace-only values, every required variable name, frontend-only failure, backend-only failure, timeout/unhealthy response, manual redirect rejection, and aggregation of actionable failures.
  - [x] Prove configured credential values never appear in stdout, stderr, returned errors, or snapshots; only variable names may be reported.
  - [x] Cover every existing truthy enable alias (`1`, `true`, `yes`, `on`, case-insensitive), exact target/acknowledgement values, incomplete acknowledgement, read-only reporting, stale auth-state cleanup, no Playwright launch on failure, exact launch on success, and child exit-code propagation.

- [x] Task 2: Implement one localhost-only preflight entry point (AC: #1, #2, #4, #5)
  - [x] Add `scripts/e2e-preflight.mjs` with a testable exported core and a thin CLI boundary.
  - [x] Require a real `.env.e2e` and nonblank `E2E_BASE_URL`, `E2E_API_URL`, `E2E_TEST_EMAIL`, and `E2E_TEST_PASSWORD`; keep Manager credentials optional and report incomplete optional pairs without blocking the Owner smoke.
  - [x] Reuse the repository outbound URL policy, additionally require uncredentialed HTTP(S) loopback origins on exact ports `3100`/`3000`, and reject malformed URLs before I/O.
  - [x] Probe frontend `${E2E_BASE_URL}/login` and the verified backend `${E2E_API_URL}/v1/health` with bounded timeouts, `redirect: 'manual'`, and service-specific errors; treat every redirect as unhealthy rather than following it.
  - [x] Import/reuse the existing mutation policy rather than weakening or independently redefining it: `E2E_ENABLE_MUTATIONS` keeps all current truthy aliases, while target `sandbox` and the acknowledgement string remain exact.
  - [x] Print an explicit `READ-ONLY` result unless the shared mutation helper returns enabled; never print environment values, response bodies, headers, cookies, tokens, or storage state.
  - [x] On success, run or print the exact bounded Chromium smoke command; if executed, preserve setup-project dependencies and propagate signals/non-zero exit status.

- [x] Task 3: Guarantee fresh authenticated storage state (AC: #3, #5)
  - [x] Remove only the allowlisted ignored files `e2e/.auth/user.json` and `e2e/.auth/manager.json` after prerequisite checks pass and before Playwright launches; do not recursively delete user-owned directories.
  - [x] Preserve the existing dependency-backed `setup` project and live login flows in `e2e/auth.setup.ts` and `e2e/auth-manager.setup.ts` unless a targeted change is required by a failing regression test.
  - [x] Ensure the normal command cannot silently consume a stale auth artifact when preflight fails or is bypassed.
  - [x] Keep Manager authentication optional and visible as an explained coverage skip when its dedicated credentials are not configured.

- [x] Task 4: Wire package commands without adding dependencies (AC: #1, #4, #5)
  - [x] Make the documented default `npm run test:e2e` pass through preflight before Playwright collection or browser launch and run the bounded non-mutating `e2e/orders.spec.ts --project=chromium` smoke.
  - [x] Preserve a clearly named preflight-gated command for the full suite so the existing broad local coverage remains available without bypassing safety checks.
  - [x] Preserve forwarding of Playwright CLI arguments such as `--project`, `--grep`, and `--list`; never use `--no-deps` for the authenticated Chromium project.
  - [x] Provide a separately named preflight-only/help path for deterministic local diagnostics and automated verification.
  - [x] Keep `grepInvert: /@mutating/` active unless the existing shared mutation helper enables the sandbox run.
  - [x] Add `scripts/e2e-preflight.test.mjs` to `vitest.config.ts` exclusions so the Node test is not double-discovered by Vitest under the wrong runtime.

- [x] Task 5: Correct local E2E documentation and examples (AC: #2, #4, #6)
  - [x] Expand `e2e/README.md` with prerequisites, copy/configure steps, frontend `3100`, backend `3000`, backend health path, read-only default, optional Manager coverage, bounded smoke, full-suite, and failure-recovery commands.
  - [x] Update the root `README.md` browser-test section so a fresh checkout reaches the same preflight-gated smoke/full commands and backend-owned seed guidance.
  - [x] Update `.env.e2e.example` so required names are clear without publishable credentials and seeding instructions point to the backend repository/process.
  - [x] Remove the nonexistent frontend `npm run seed` instruction and do not add a fake frontend seed script.
  - [x] Keep root README and E2E README cross-references accurate; do not introduce production, deployment, CI-gate, or real-cabinet guidance.

- [x] Task 6: Validate, review, and deliver the story (AC: #1-#6)
  - [x] Run targeted Node tests, mutation-policy tests, CLI help, missing-env and unavailable-service CLI branches, then prove Playwright does not start on failure.
  - [x] With prerequisites available, run the bounded authenticated Chromium smoke and confirm a freshly written ignored `e2e/.auth/user.json`; otherwise record the exact missing runtime prerequisite and do not claim AC3/live AC5 passed. Alternative completed as `NOT_RUN_PREREQUISITES_UNMET`: `.env.e2e` is absent, frontend `localhost:3100/login` is unavailable, and backend `localhost:3000/v1/health` is unavailable.
  - [x] Run Playwright discovery through the documented safe path, typecheck, an explicit story-local ESLint command with `--max-warnings=0`, formatting, relevant static/privacy checks, production build, and `git diff --check` using Node `24.18.0` and npm `11.11.0`; do not change the package-wide allowance owned by Story 164.4.
  - [x] Obtain independent code-reviewer and verifier verdicts, then deliver through the current normal PR. Independent code review is `APPROVE` with 0 issues, architecture is `CLEAR`, and verification is `VERIFIED` / PR-ready; post-merge ancestry and cleanup evidence remains assigned to the durable orchestration manifest.
  - [x] [AI-Review] Build one effective environment from required `.env.e2e` values plus ambient overrides, and pass the exact validated/probed E2E values to Playwright without secret output.
  - [x] [AI-Review] List every required variable plus copy/setup guidance when `.env.e2e` is absent.
  - [x] [AI-Review] Remove the Manager auth-state collection-time skip and prove configured Manager tests are discovered from an absent `manager.json`.
  - [x] [AI-Review] Replace the caller-controlled marker with a fresh random handshake and reject `--no-deps` at the Playwright configuration boundary.
  - [x] [AI-Review] Migrate active orchestration and pending Epic 162 plan/browser-workflow commands to the preflight-gated full-suite command.
  - [x] [AI-Review] Fail closed when `e2e/.auth` is symlinked while retaining non-recursive allowlisted file cleanup.
  - [x] [AI-Review] Update E2E documentation, OMX scope, automated regressions, and delivery records for the hardened contract.
  - [x] [AI-Review] Define one explicit CI truth contract and use it for handshake gating, `forbidOnly`, retries, workers, and the CI web server so `CI=false` remains a local guarded run.
  - [x] [AI-Review] Inject temporary-handshake creation/cleanup and surface cleanup failures without leaking paths, tokens, or raw errors while preserving any existing child exit code.

## Dev Notes

### Implementation Readiness

- Dependency Story 162.1 is complete through PR #86. Story 162.2 branches from clean `origin/main` SHA `c15a591443cd3a7a792f7866627c9769144f19c9` after Story 165.3 merged through PR #91.
- Current branch/worktree contract: `codex/story-162-2-e2e-preflight` at `/private/tmp/wb-repricer-story-162-2-frontend`; one story, one normal PR, cleanup only after merge ancestry is proven.
- Immutable plan metadata remains `initial_status: backlog`; mutable lifecycle state is `ready-for-dev` in `sprint-status.yaml` and must advance independently.
- The durable `.omx/orchestration/story-delivery-manifest.json` is leader-owned state in the primary repository only. It is not created, edited, staged, or committed from this disposable worktree; the orchestrator updates it externally.
- No Story 162.1 implementation artifact exists to mine for code patterns. Its actionable inheritance is the clean localhost-only baseline and mandatory branch/worktree cleanup discipline.

### Current Gaps to Close

- `playwright.config.ts` silently tolerates a missing `.env.e2e`, defaults the frontend URL, checks no backend health, and starts a frontend server only under CI.
- Credential validation currently occurs during E2E module collection in `e2e/fixtures/test-data.ts`, after Playwright has already started, and reports one missing value at a time.
- Auth setup writes ignored state files but nothing removes stale state before the next normal run.
- `.env.e2e.example` names a frontend `npm run seed` command that does not exist. The backend repository owns test-user seeding.
- The existing mutation guard is correct: its enable flag accepts `1`, `true`, `yes`, or `on` case-insensitively, while target `sandbox` and acknowledgement `I_UNDERSTAND_THIS_MUTATES_TEST_DATA` are exact; default config excludes `@mutating`.

### Minimal Design and Reuse Guardrails

- Prefer one dependency-free Node ESM module plus `node:test`; do not add dotenv, wait-on, port-checking, shell helpers, or another runner.
- Use Node's pinned runtime capabilities, the existing outbound URL policy, `fetch` with an abort timeout and `redirect: 'manual'`, allowlisted file removal, and an injected process runner. Keep side effects at the CLI boundary so every branch is unit-testable.
- Verify the frontend through `/login`. The sibling backend source confirms `GET /v1/health` as its health endpoint; treat non-success or timeout as an unhealthy backend with an actionable service label, without retaining its body.
- Reuse the current Playwright setup-project dependency. Official Playwright guidance prefers setup projects for observable authentication and warns that storage state may contain impersonation-capable secrets.
- Use `e2e/orders.spec.ts --project=chromium` as the bounded default smoke. Its three explicit read-only tests trigger the setup dependency without inheriting the fixed waits, weak body-only assertions, or conditional logout path in `e2e/login-dashboard.spec.ts`, which later Epic 162 stories own.
- The preflight must not become a new general orchestration framework. It checks only the two local services, required Owner configuration, fresh auth-state boundary, and mutation policy needed to start the documented smoke/run.

### Security and Failure Semantics

- Fail closed before Playwright on invalid configuration or unhealthy services. Report all missing variable names together, but never their values.
- Accept only uncredentialed HTTP(S) loopback URLs (`localhost`, `127.0.0.1`, and `::1`) on exact frontend/backend ports `3100`/`3000`; use manual redirect handling and fail every redirect so a local service cannot escape the allowlist.
- Do not read or print response bodies, authentication storage, tokens, cookies, headers, cabinet IDs, or credentials. Run privacy/static checks against every changed script and document.
- Delete only the two known ignored auth-state files after all probes pass. A preflight failure must leave them untouched and must not invoke Playwright.
- Missing optional Manager credentials are not a story failure. The existing setup/test skip reason remains visible and specific; incomplete optional pairs may produce a non-secret warning.
- Child-process failure, signal, timeout, or interruption must remain non-zero and actionable. Never translate a failed smoke into success.

### Testing Requirements

Minimum targeted evidence:

```bash
node --test scripts/e2e-preflight.test.mjs
node scripts/e2e-preflight.mjs --help
npm run test:e2e -- --list
npm run type-check
npx eslint 'src/**/*.{ts,tsx}' --max-warnings=0
npm run format:check
npm run check:privacy
npm run build
git diff --check
```

The failure-path CLI tests must use temporary configuration and unavailable loopback ports, and must assert that no credential value is emitted. Live acceptance requires both services, a backend-seeded Owner test user, and an ignored `.env.e2e`. If those inputs remain unavailable, record `NOT_RUN_PREREQUISITES_UNMET`; automated preflight branches may pass, but AC3 and the live branch of AC5 remain unverified.

### Project Structure Notes

- Expected additions: `scripts/e2e-preflight.mjs`, `scripts/e2e-preflight.test.mjs`, and this story artifact.
- Expected modifications: `package.json`, `vitest.config.ts`, `.env.e2e.example`, `README.md`, `e2e/README.md`, `playwright.config.ts`, the story artifact/sprint registry, and only the auth/mutation files required by proved regressions.
- External leader-only update: the primary-repository durable manifest records branch/worktree/lifecycle evidence but is never part of the story diff or PR.
- Keep all source files within the enforced cap and retain existing network/privacy protections. No application UI, backend code, dependency, production, deployment, or mandatory-CI change is in scope.

### Git Intelligence

- Recent work merged Story 165.3 through PR #91 and left `main == origin/main` at `c15a5914`; the prior disposable branch/worktree was removed and pruned before this story began.
- Existing project Node scripts use ESM, `node:test`, dependency injection, temporary directories, and explicit cleanup; follow `scripts/check-privacy-console.mjs` and its tests rather than introducing a shell-only implementation.
- Test files must not import code-execution modules under `src/test/playwright-static-boundary.ts`; inject the runner into the exported preflight core and test calls/exit propagation without spawning from the test module.

### Latest Playwright Guidance

- Current official guidance retains setup-project dependencies as the preferred observable authentication pattern and treats saved storage state as sensitive.
- Dependencies still run when a project/test is filtered; do not pass `--no-deps` for the bounded authenticated smoke.
- `webServer` may reuse an existing local server, but this story deliberately verifies both already-running localhost services before browser execution rather than adding production/CI lifecycle management.

### References

- [Source: `_bmad-output/planning-artifacts/epics-162-165-fe.md` — FR1, NFR1-NFR3, NFR8-NFR12, Epic 162 and Story 162.2]
- [Source: `.omx/plans/story-162-2-add-a-reproducible-local-e2e-preflight.md` — dependency, scope, verification, risks, and stop condition]
- [Source: `playwright.config.ts` — environment loading, setup dependency, mutation filter, local web-server behavior]
- [Source: `e2e/fixtures/test-data.ts` — required Owner and optional Manager credential behavior]
- [Source: `e2e/fixtures/mutation-guard.ts` — shared mutation enable aliases and exact target/acknowledgement contract]
- [Source: `e2e/auth.setup.ts` and `e2e/auth-manager.setup.ts` — live login and storage-state generation]
- [Source: `.env.e2e.example`, `e2e/README.md`, `README.md`, and `SETUP.md` — current local E2E guidance]
- [Source: `src/test/playwright-static-boundary.ts` — restricted test-runtime imports]
- [Source: sibling backend `src/health/health.controller.ts` and `src/main.ts` — `GET /v1/health`]
- [Source: Playwright Authentication — https://playwright.dev/docs/auth]
- [Source: Playwright Project Dependencies — https://playwright.dev/docs/test-projects#dependencies]
- [Source: Playwright Web Server — https://playwright.dev/docs/test-webserver]
- [Source: Playwright CLI — https://playwright.dev/docs/test-cli]

## Dev Agent Record

### Agent Model Used

- Context creation: Codex leader with delegated `explore`, `architect`, `test-engineer`, and `researcher` read-only analysis lanes.
- Implementation: Codex `gpt-5.6-sol` executor lane.

### Debug Log References

- 2026-08-05: Story context created from clean base `c15a5914`; no implementation code was changed during context creation.
- 2026-08-05: Sibling backend source verified `GET /v1/health`; no backend mutation was performed.
- 2026-08-05: Red baseline failed with `ERR_MODULE_NOT_FOUND` for the absent preflight; the completed Node contract passes 42/42 tests.
- 2026-08-05: Safe Playwright discovery listed 4 setup and 3 Chromium orders tests under loopback-only response stubs; no browser or live login was used.
- 2026-08-05: `NOT_RUN_PREREQUISITES_UNMET` — `.env.e2e` was absent and both localhost service probes returned curl code `000`; AC3 and live AC5 remain unclaimed.
- 2026-08-05: Targeted validation passed: 42/42 preflight contract tests, 3/3 static-boundary tests, missing-env/raw-bypass/unavailable-service CLI branches, and redaction/auth-preservation assertions.
- 2026-08-05: Pinned Node `24.18.0` / npm `11.11.0` quality gates passed: typecheck, story-local ESLint with zero warnings, formatting, privacy across 3,229 text files, production build with 67 routes, and `git diff --check`.
- 2026-08-05: Clean bounded full regression passed 1,052 files and 17,409 tests with `--maxWorkers=4`; a prior overlapping run's sole static-boundary timeout was not reproducible cleanly.
- 2026-08-05: Review-fix RED baseline produced 42 passes and 6 expected failures covering missing-file diagnostics, effective-environment parity, symlink cleanup, handshake/no-deps enforcement, Manager discovery, and raw-command migration.
- 2026-08-05: Hardened preflight contract passes 52/52 tests; the fresh handshake is a random 256-bit token plus a mode-0600 temporary file bound to the repository cwd and initial 60-second freshness, with a token-matched inherited sentinel for Playwright workers/reloads and cleanup when the child exits.
- 2026-08-05: Legacy `E2E_PREFLIGHT_PASSED=1` plus raw Playwright `--no-deps --list` exits 1 at the configuration boundary before collection.
- 2026-08-05: Starting without `e2e/.auth/manager.json`, temporary loopback response stubs plus configured fake Owner/Manager values discovered 4 setup and 12 Chromium client-info tests, including all 3 Manager role-gate tests; no browser/login ran.
- 2026-08-05: Post-review pinned gates pass: 52/52 Node contract tests, 52/52 targeted static/network tests, typecheck, zero-warning story-local ESLint, formatting, privacy across 3,239 text files, production build with 67 routes, and the clean full suite at 1,052 files / 17,409 tests in 316.55 seconds.
- 2026-08-05: Rereview regression proved a matching caller-supplied TOKEN/VERIFIED pair could bypass handshake-file validation; the accidental-bypass guard (not an adversarial security boundary) now validates the real non-symlink file, cwd, record, and timing-safe token on every load while allowing token-matched verified reloads beyond the initial 60-second freshness window.
- 2026-08-05: Regenerated the correlated OMX plans from canonical `storyConfig`; `node scripts/manage-omx-story-plans.mjs --check` reports byte-exact one-to-one parity for all 25 BMad stories.
- 2026-08-05: Final-review RED regressions failed 3/3 as expected: `CI=false` still bypassed the local handshake, a successful child stayed green after handshake cleanup failure, and a failed child omitted the cleanup warning.
- 2026-08-05: The explicit CI truth contract recognizes only trimmed/case-insensitive `true` and `1`; `CI=false E2E_BASE_URL=http://localhost:3100 npx playwright test --project=chromium --list` exits 1 at the handshake boundary before collection.
- 2026-08-05: Final-review targeted contracts pass: 55/55 Node preflight tests and 52/52 static/network Vitest tests; typecheck is clean.
- 2026-08-05: Final-rework gates pass: 55/55 Node contract tests, 52/52 targeted static/network tests, typecheck, targeted Prettier, privacy across 3,245 text files, byte-exact 25/25 OMX plan parity, and `git diff --check`.
- 2026-08-05: Independent final evidence is complete: code review `APPROVE` with 0 issues, architecture `CLEAR`, and verifier `VERIFIED` / PR-ready.
- 2026-08-05: Live AC3/live AC5 remains `NOT_RUN_PREREQUISITES_UNMET`: `.env.e2e` is absent, frontend `localhost:3100/login` is unavailable, and backend `localhost:3000/v1/health` is unavailable. No live authentication or storage-state regeneration is claimed.
- 2026-08-05: Story lifecycle is complete through the current normal PR merge. No PR number, merge SHA, ancestry, or cleanup proof is claimed in this artifact; post-merge evidence is retained in the durable orchestration manifest.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Implemented a dependency-free, injected local preflight with aggregate redacted configuration/service failures, exact loopback ports, manual redirects, shared mutation policy, allowlisted auth cleanup, and signal/exit propagation.
- Wired bounded smoke, full-suite, UI, diagnostics, and help commands through preflight; local raw Playwright collection now fails with safe-command guidance.
- Corrected fresh-checkout E2E documentation and the tracked environment template without adding dependencies or a frontend seed script.
- Resolved all seven implementation review findings: effective-environment parity, complete missing-file diagnostics, runtime Manager auth consumption, random freshness handshake, configuration-level `--no-deps` rejection, preflight-gated active commands, and symlink-safe auth cleanup.
- Closed the rereview handshake bypass without breaking long UI/worker lifecycles: the verified sentinel relaxes only the initial TTL and never skips file, cwd, record, or token validation.
- Restored generator-owned OMX plan parity across all 25 correlated BMad stories, including the active raw-command migrations in Epic 163 and Epic 165 plans.
- Closed both final-review findings: false-like CI values remain local and guarded, while temporary-handshake cleanup failures are redacted, surfaced, and never overwrite an existing non-zero Playwright exit.
- Automated implementation gates pass, independent code review is `APPROVE` with 0 issues, architecture is `CLEAR`, and verification is `VERIFIED` / PR-ready. Live AC3/live AC5 remains truthfully recorded as `NOT_RUN_PREREQUISITES_UNMET` because `.env.e2e` and both required localhost services are unavailable. Story completion is effective through the current normal PR merge; post-merge ancestry and cleanup evidence belongs in the durable orchestration manifest.

### File List

Story 162.2 delivery files:

- `.env.e2e.example` (modified)
- `.omx/plans/story-162-2-add-a-reproducible-local-e2e-preflight.md` (modified; includes preserved context edits and review-fix scope)
- `.omx/plans/story-162-3-replace-vacuous-analytics-and-finance-e2e-assertions.md` (modified)
- `.omx/plans/story-162-4-replace-vacuous-operations-and-settings-e2e-assertions.md` (modified)
- `.omx/plans/story-162-5-remove-fixed-waits-from-liquidity-and-unit-economics-e2e.md` (modified)
- `.omx/plans/story-162-6-remove-fixed-waits-from-dashboard-and-analytics-e2e.md` (modified)
- `.omx/plans/story-162-7-remove-fixed-waits-from-supplies-and-supply-planning-e2e.md` (modified)
- `.omx/plans/story-162-8-remove-fixed-waits-from-pricing-backfill-cogs-and-authentication-e2e.md` (modified)
- `.omx/plans/story-162-9-make-e2e-skips-explicit-and-fixture-aware.md` (modified)
- `.omx/plans/story-162-10-restore-bounded-mobile-critical-route-e2e-coverage.md` (modified)
- `.omx/plans/story-163-1-make-advertising-sort-headers-keyboard-accessible.md` (modified)
- `.omx/plans/story-163-4-distinguish-monetary-zero-from-missing-unit-economics-data.md` (modified)
- `.omx/plans/story-163-5-display-the-units-based-naive-baseline-in-sku-accuracy-history.md` (modified)
- `.omx/plans/story-163-6-replace-dashboard-period-tabs-with-a-single-choice-toggle.md` (modified)
- `.omx/plans/story-165-4-activate-liquidity-trends-only-after-daily-snapshots-exist.md` (modified)
- `.omx/plans/story-165-5-add-per-status-backfill-retry-only-after-separate-contracts-exist.md` (modified)
- `README.md` (modified)
- `_bmad-output/implementation-artifacts/162-2-fe-add-a-reproducible-local-e2e-preflight.md` (added)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `docs/qa/BROWSER-TESTING-WORKFLOW.md` (modified)
- `e2e/README.md` (modified)
- `e2e/fixtures/mutation-guard.ts` (modified)
- `e2e/orders-client-info.spec.ts` (modified)
- `package.json` (modified)
- `playwright.config.ts` (modified)
- `scripts/e2e-preflight-handshake.mjs` (added)
- `scripts/e2e-preflight.mjs` (added)
- `scripts/e2e-preflight.test.mjs` (added)
- `scripts/manage-omx-story-plans.mjs` (modified; includes preserved context edits and review-fix command migration)
- `vitest.config.ts` (modified)

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Implemented and automated the localhost E2E preflight, safe command wiring, auth-state boundary, and fresh-checkout guidance. Automated quality gates passed; live auth and independent review remain pending, so status stays `in-progress`. |
| 2026-08-05 | Addressed seven implementation review findings with effective-environment parity, a random freshness handshake, configuration-level dependency enforcement, runtime Manager auth consumption, symlink-safe cleanup, and preflight-gated repository commands. Post-review automated gates pass; live auth and rereview remain pending. |
| 2026-08-05 | Closed the verified-sentinel handshake bypass with RED→GREEN coverage and restored byte-exact generated-plan parity for all 25 stories. Live AC3/live AC5 and independent rereview remain pending, so status stays `in-progress`. |
| 2026-08-05 | Applied one explicit CI truth contract and fail-closed, redacted handshake-cleanup propagation with RED→GREEN coverage. Targeted rereview gates pass; live AC3/live AC5 and independent rereview remain pending. |
| 2026-08-05 | Independent final review approved with 0 issues, architecture was clear, and verification returned verified/PR-ready. Live AC3/live AC5 remains `NOT_RUN_PREREQUISITES_UNMET`; Story 162.2 is done through the current normal PR merge, with post-merge ancestry and cleanup evidence retained in the durable orchestration manifest. |
