---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-08-14'
workflowType: testarch-atdd
storyId: '167.3'
storyTitle: Migrate Login `/login`
primaryLevel: component
tddPhase: browser-green
inputDocuments:
  - .omx/plans/167.3-migrate-login.md
  - .omx/plans/shadcn-full-ui-migration-master.md
  - _bmad-output/implementation-artifacts/167-3-fe-migrate-login-login.md
  - _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
  - _bmad-output/planning-artifacts/shadcn-route-ledger.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/implementation-artifacts/167-2-fe-migrate-root-entry.md
  - _bmad-output/test-artifacts/atdd-checklist-167.2.md
  - _bmad/tea/config.yaml
  - package.json
  - vitest.config.ts
  - playwright.config.ts
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/login/__tests__/page.test.tsx
  - src/components/custom/LoginForm.tsx
  - src/components/custom/LoginForm.test.tsx
  - e2e/login-dashboard.spec.ts
---

# ATDD Checklist — Epic 167-FE, Story 167.3

**Date:** 2026-08-14
**Author:** R2d2 / BMad TEA
**Primary test level:** Vitest route/component tests, with Playwright critical-journey evidence
**Current phase:** REVIEW — genuine RED history plus accepted malformed-percent review RED, direct and proxy GREEN, official Chromium matrix, full regression suite, production build, universal gates, privacy cleanup, exact-scope audit, and the fresh sequential `APPROVE` then `CLEAR` final review pair are complete; Git integration has not started

## Story Summary

A registered user must be able to sign in from `/login` with clear validation, recover from invalid credentials or network failure without re-entering safe information, and return to a validated same-origin intended destination. The migration must retain the existing JWT/session write and full-page destination sequence while preventing duplicate credential submission and password leakage.

## Controlling Acceptance Criterion

> **Given** valid or invalid credentials and recoverable failures **when** the route is migrated **then** JWT/session and destination behavior remain unchanged, safe input is retained, feedback is associated, duplicate submission is prevented **and** keyboard/touch completion works.

Requirements: `FR1`, `FR2`, `FR27`.

## RED-to-GREEN Status

- Active Story-owned tests now exist in both direct Vitest files and the existing Playwright login/dashboard specification.
- The exact targeted Vitest command completes deterministically with seven failures caused by missing Story 167.3 behavior and 27 preserved-behavior passes.
- All authored tests are active. Scans found zero `skip`, `todo`, or `only` modifiers and zero hard waits (`waitForTimeout` or `sleep`).
- Production files remained unchanged during the initial RED. The later owned implementation and accepted review remediations reached current targeted GREEN at 45/45; the focused redirect selection, official browser matrix, universal gates, exact-scope audit, and fresh final review pair passed. Git integration remains pending.

## Preflight

- Stack: `frontend` — Next.js 16, React 19, Vitest 4, React Testing Library, jest-axe, and Playwright are configured.
- Exact branch: `cdx/epic-167-story-3-login`.
- Exact worktree: `/private/tmp/wb-fe-167-3-migrate-login`.
- Original Story base: `8eee14bb2f5862518280eef2b557c287bd09c738` (Story 167.2 merge PR `#154`).
- Final prerequisite/base sequence: proxy PR `#155` merged as `0fbc922d90060314df222e668abd433686b4bbbe`; slash/backslash hardening prerequisite PR `#156` used commit `67d914f02d122a932b64dcf80bd3b365d1b77af7` and merged as `b1ca85992277828c658711fc8dd2a7a33a4aeefd`. Its branch/worktree cleanup completed, and the Story worktree was fast-forwarded to that SHA before final validation. Story `HEAD`, local `main`, and `origin/main` now match `b1ca85992277828c658711fc8dd2a7a33a4aeefd`.
- Story and ACs: present in `167-3-fe-migrate-login-login.md`, canonical Epic 167, route ledger, and OMX plan.
- Test framework: `vitest.config.ts` and `playwright.config.ts` exist.
- Worktree dependencies are installed and the pinned Node `24.18.0` / npm `11.11.0` baseline passes both direct login targets with `14/14` tests. Local frontend/backend runtime and credentials remain outside the component RED precondition and will be established before browser evidence.
- Generation mode: AI planning from canonical requirements and current code. Browser recording is unnecessary before active test authorship because the current component seams and existing E2E route are explicit.

## Test Ownership and RED Manifest

The active RED owns exactly these test/evidence files:

1. `src/app/(auth)/login/__tests__/page.test.tsx`
2. `src/components/custom/LoginForm.test.tsx`
3. `e2e/login-dashboard.spec.ts`
4. `_bmad-output/test-artifacts/atdd-checklist-167.3.md` for actual RED/GREEN evidence
5. `_bmad-output/implementation-artifacts/167-3-fe-migrate-login-login.md` for factual task/evidence updates only

The developer may later modify only:

6. `src/app/(auth)/login/page.tsx`
7. `src/components/custom/LoginForm.tsx`
8. `_bmad-output/implementation-artifacts/sprint-status.yaml`, limited to the Story 167.3 lifecycle row and `last_updated` comment

Do not create a new helper, fixture, E2E spec, primitive, package, route policy, or auth owner. A need outside this manifest must be reported upward before editing.

## ATDD Scenario Matrix

| ID        | Priority | Level               | State/risk                  | Active expectation to author                                                                                                                                  | RED reason on exact base                                                         |
| --------- | -------- | ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 167.3-C01 | P0       | Page component      | Default semantics           | One `main`, one level-1 page heading, constrained form surface, and clear login purpose                                                                       | Current page uses outer `div` and `h2`                                           |
| 167.3-C02 | P0       | Form component      | Pre-hydration privacy       | Server/pre-effect email, password, and submit controls are disabled; submit event cannot call API; password is absent from URL                                | Existing controls should pass; retain as regression lock                         |
| 167.3-C03 | P0       | Form component      | Hydrated default/focus      | Hydration enables controls and predictably focuses email without changing logical order                                                                       | Current form does not focus email                                                |
| 167.3-C04 | P0       | Form component      | Invalid email               | Blur/submit associates `Неверный формат email`, sets invalid state, focuses email, and sends no request                                                       | Existing message may pass; focus behavior is missing                             |
| 167.3-C05 | P0       | Form component      | Missing fields              | Enter/click submit exposes required field errors, focuses first invalid field, and sends no request                                                           | Required messages exist; focus contract is not locked                            |
| 167.3-C06 | P0       | Form component      | Invalid credentials         | One rejected request produces credential feedback associated with the form, retains email, clears password, and focuses password                              | Current toast-only path retains password and does not focus it                   |
| 167.3-C07 | P0       | Form component      | Network/service failure     | One network failure produces distinct recoverable feedback, retains email, clears password, focuses password, and allows deliberate retry                     | Current path collapses to invalid-credential toast                               |
| 167.3-C08 | P0       | Form component      | Submitting/duplicates       | Deferred request disables all controls, exposes busy state, and repeated click/tap/Enter still yields one API call                                            | Existing basic pending test does not cover all controls/repeated activation      |
| 167.3-C09 | P0       | Form component      | Mutation retry invariant    | Global retry configuration cannot make the login mutation call `loginUser` more than once                                                                     | Existing test should pass; retain as Task 38 lock                                |
| 167.3-C10 | P0       | Form component      | Success/session             | Successful response calls auth-store `login` once with unchanged user/JWT/first cabinet ID or `null` and preserves success feedback                           | Existing tests partially cover; consolidate exact contract                       |
| 167.3-C11 | P0       | Form component      | Success timing              | Fake timers prove zero early navigation and exactly one navigation at the existing `100ms` boundary                                                           | Current test waits but does not lock timing/exactly-once navigation              |
| 167.3-C12 | P0       | Form component      | Default destination         | Missing/empty redirect navigates once to `/dashboard`                                                                                                         | Existing default test should pass; retain                                        |
| 167.3-C13 | P0       | Form component      | Valid intended destination  | `/orders?week=2026-W32#row-1` remains byte-preserved through success                                                                                          | Current implementation should pass; add explicit evidence                        |
| 167.3-C14 | P0       | Form component      | Open redirect/privacy       | `https://evil.example`, `//evil.example`, `\\evil.example`, malformed encodings, and non-path values all fall back to `/dashboard`                            | `//evil.example` currently passes `startsWith('/')`; active RED required         |
| 167.3-C15 | P0       | Page/form component | Session-expired entry       | Existing safe `redirect` query causes clear re-auth/session-expired context while retaining the same intended destination                                     | Current page/form presents no re-auth context                                    |
| 167.3-C16 | P1       | Form component      | Error association/a11y      | Client and request feedback has a named role/region and stable field/form association; axe reports no violations                                              | Current request feedback is toast-only                                           |
| 167.3-C17 | P1       | Form component      | Keyboard path               | Tab order is email → password → submit; Enter submits once; focus-visible is not suppressed                                                                   | Partially implicit; not directly locked                                          |
| 167.3-C18 | P1       | Source contract     | Forbidden owners            | Production imports/calls remain bounded; `retry: false`, password type/autocomplete, and no `method="get"` or route/auth owner edits                          | Current invariants exist; source lock prevents regression                        |
| 167.3-E01 | P0       | Playwright          | Critical login journey      | Unauthenticated `/login` renders, keyboard submission issues one POST, writes session through current flow, and reaches dashboard or safe intended route once | Existing file validates authenticated dashboard, not this complete login journey |
| 167.3-E02 | P0       | Playwright          | Safe redirect               | Protocol-relative redirect never leaves localhost and success falls back to dashboard                                                                         | Current form would navigate protocol-relative after success                      |
| 167.3-E03 | P1       | Playwright          | Credential/network recovery | Mocked/local failures retain email, clear/focus password, show correct associated feedback, and permit one deliberate retry                                   | Current behavior does not satisfy recovery contract                              |
| 167.3-E04 | P1       | Playwright          | Responsive/theme/touch      | All states fit at `320/390/768/1024/1280/1440+`, both themes, touch submission, no horizontal overflow, 200% zoom reflow                                      | Existing mobile smoke covers only reachability                                   |
| 167.3-E05 | P1       | Playwright          | Accessibility/privacy       | Visible labels, focus order/visibility, session-expired context, axe, zero console/page errors, and no password in URL or retained artifacts                  | Existing login-dashboard evidence does not cover login state matrix              |

## RED Authoring Order

1. Update page tests for semantic `main`/`h1`, re-auth context, route source boundary, semantic tokens, and accessibility.
2. Update `LoginForm.test.tsx` for pre-hydration privacy, hydration focus, invalid focus, credential/network recovery, duplicate prevention, retry false, exact store args, fake-timer navigation, valid redirect preservation, and unsafe redirect rejection.
3. Extend `e2e/login-dashboard.spec.ts` with a bounded unauthenticated Story 167.3 describe block using the repository's network-test fixture and local outbound guard.
4. Run only the two Vitest files before production edits. Browser scenarios may remain failing/not-run until the local server is available, but they must be active and free of skips.
5. Record a genuine RED report here: command, exit code, failing names, why each failure is Story-owned, and `git diff --name-only` proving no production change.
6. Hand off to the developer only after the RED report passes review.

## Required Test Design Details

### Component fixtures

- Keep `LoginForm`'s injected `navigate` seam; do not spy on real cross-origin navigation.
- Use a fresh QueryClient per test. For retry evidence, configure global mutation retry > 0 and still expect one `loginUser` call.
- Use controlled deferred promises for pending state. Assert every control is disabled and repeated activations do not enqueue requests.
- Use fake timers for the existing `100ms` post-success delay. Assert no navigation before the boundary and one navigation after it; clean timers deterministically.
- Make search params configurable per test instead of retaining the current module-global empty `URLSearchParams` object.
- Mock `loginUser` with synthetic data only. Never place a real password, JWT, cookie, authorization header, or backend response in output.
- Prefer accessible queries by label, role, name, and associated message. `data-testid` is acceptable only for a non-semantic source-boundary seam.
- Test password clearing through its DOM value and focus, not by logging form data.

### Redirect safety cases

At minimum, table-drive these values:

| Query value                   | Expected destination       |
| ----------------------------- | -------------------------- |
| absent                        | `/dashboard`               |
| empty                         | `/dashboard`               |
| `/dashboard`                  | `/dashboard`               |
| `/orders?week=2026-W32#row-1` | unchanged same-origin path |
| `https://evil.example/phish`  | `/dashboard`               |
| `//evil.example/phish`        | `/dashboard`               |
| `\\evil.example\phish`        | `/dashboard`               |
| `javascript:alert(1)`         | `/dashboard`               |
| malformed/unparseable value   | `/dashboard`               |

The test must fail on the exact base specifically for the protocol-relative case. The production repair remains local to `LoginForm`; do not introduce a shared route helper in this Story.

### Failure classification

- Do not assert raw backend messages.
- Invalid credentials should map to a generic non-secret credential message.
- Network/unavailable failures should map to a distinct generic recoverable message.
- If current error types do not provide a stable safe discriminator, the developer may use only information already exposed through the existing `loginUser` rejection inside `LoginForm`; do not modify API types or clients. Escalate if accurate classification cannot be implemented locally.
- Both failure classes retain email, clear password, and focus password.

### E2E isolation and privacy

- The existing Chromium project uses authenticated storage state. The new unauthenticated block must explicitly create/prepare an unauthenticated context using existing Playwright capabilities without modifying shared config/setup files.
- Use frontend `http://localhost:3100` and backend `http://localhost:3000` only after repository preflight succeeds.
- Intercept or observe only the login endpoint necessary for the scenario. Assert method and request count; never print or attach request bodies.
- Keep Playwright trace, screenshot, and video policy unchanged. Any approved screenshot must exclude entered secrets and follow the repository diagnostic-capture policy.
- Do not use fixed waits. Wait on named UI state, request, response, URL, or focus transitions.
- Keep the test independent of production credentials and rate limits; use the repository's authorized local synthetic/mock path where available.

## Preserved Task 38 Regression Locks

These tests are mandatory even where they already pass on the exact base:

- Before hydration, email/password/submit are disabled.
- A pre-hydration submit cannot invoke `loginUser` and cannot put a password in the URL.
- The login mutation contains `retry: false`.
- Exactly one `POST /v1/auth/login` occurs per deliberate submission.
- Repeated click/tap/Enter while pending cannot create another request.
- Password values never appear in a URL, navigation destination, log assertion, diagnostic artifact, or committed fixture.

## Targeted Commands

The active RED was executed with the pinned Node/npm toolchain:

```bash
/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/login/__tests__/page.test.tsx' src/components/custom/LoginForm.test.tsx
```

Run after production reaches targeted GREEN and local E2E preflight succeeds:

```bash
npm run test:e2e -- e2e/login-dashboard.spec.ts --project=chromium
```

Then run the universal gates from the Story, including full Vitest, format check, lint, type-check, max-lines, privacy checks, E2E static checks, build, YAML parse, `git diff --check`, and exact-manifest/forbidden-surface audit.

## Active RED Evidence

| Field             | Evidence recorded 2026-08-14                                                                                                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State             | Test/evidence-only working tree before any production edit                                                                                                                                                                                                                               |
| Command           | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/login/__tests__/page.test.tsx' src/components/custom/LoginForm.test.tsx`                                                                                                                         |
| Result            | Exit `1`; 2 test files failed; 34 tests collected; 27 passed and 7 failed; duration 7.62 s                                                                                                                                                                                               |
| Static quality    | Prettier check exit `0`; ESLint on the three owned test files exit `0`; `tsc --noEmit` exit `0`                                                                                                                                                                                          |
| Production diff   | `git diff -- 'src/app/(auth)/login/page.tsx' src/components/custom/LoginForm.tsx` produced no output                                                                                                                                                                                     |
| Bypass/wait scans | `rg` found zero `skip`/`todo`/`only` modifiers and zero `waitForTimeout`/`sleep(...)` hard waits                                                                                                                                                                                         |
| E2E status        | Three active, network-first Story 167.3 scenarios were authored. `playwright test ... --list` was attempted but repository preflight rejected direct Playwright invocation before collection; browser E2E was not runtime-executed. ESLint and TypeScript statically validated the spec. |

The seven genuine RED failures are:

1. `renders exactly one level-one heading with the login purpose` — the current route renders `h2`, not the required single page `h1`.
2. `renders the login form inside one semantic main landmark` — the current route has no `main` landmark.
3. `focuses email after hydration` — hydration enables the email field but does not focus it.
4. `shows associated generic feedback and restores password focus after invalid credentials` — the current failure path is toast-only and retains the password without focusing it.
5. `shows distinct recoverable feedback and restores password focus after network failure` — network failure is collapsed into credential feedback and does not clear/focus the password field.
6. `explains a valid redirect entry as re-authentication without protected content` — the current form provides no session-expired/re-authentication context.
7. `falls back to dashboard for an unsafe protocol-relative URL redirect` — the current `startsWith('/')` check accepts `//evil.example/phish` and navigates to it.

The 27 green tests preserve required regression locks: disabled and non-native pre-hydration submission; visible labels/types/autocomplete; logical keyboard order; default-state jest-axe scan; client validation and first-invalid focus; one login call; truthful pending disabled/busy state; duplicate prevention; mutation `retry: false`; exact auth-store arguments including null cabinet; existing 100 ms navigation delay and exactly-one navigation; default dashboard and valid path/query/fragment preservation; rejection of the other unsafe redirect classes; field error association; Enter submission; and no password URL leakage.

The owned active-RED manifest is exactly:

1. `src/app/(auth)/login/__tests__/page.test.tsx`
2. `src/components/custom/LoginForm.test.tsx`
3. `e2e/login-dashboard.spec.ts`
4. `_bmad-output/test-artifacts/atdd-checklist-167.3.md`
5. `_bmad-output/implementation-artifacts/167-3-fe-migrate-login-login.md`

The worktree also contains a concurrent, pre-existing `sprint-status.yaml` lifecycle change outside this test-engineer ownership; it was neither edited nor reverted during RED.

## Targeted GREEN Evidence

- Command: `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/login/__tests__/page.test.tsx' src/components/custom/LoginForm.test.tsx`.
- Initial GREEN result: exit `0`; 2 files passed; 34/34 tests passed; duration 3.65 s.
- The same seven active RED expectations now pass without changing their test assertions: page `main`/`h1`, hydration email focus, credential recovery, distinct network recovery, safe re-authentication context, and protocol-relative redirect rejection.
- Scoped Prettier and zero-warning ESLint for `page.tsx` and `LoginForm.tsx`, full `npm run type-check`, and `git diff --check` all exited `0`.
- Production changes are exactly `src/app/(auth)/login/page.tsx` and `src/components/custom/LoginForm.tsx`. Package/lock, auth API/client/store/provider/hooks, proxy/routes, shared primitives, registration, and global token/style surfaces have zero diff.
- This was the initial implementation-stage checkpoint. The later final current-snapshot browser and universal evidence is recorded below; the two fresh final reviews are complete and Git integration remains pending.

### Review-remediation RED/GREEN

- The first independent code/spec/security review returned `REQUEST CHANGES`; the architecture/devil's-advocate review returned `BLOCK`.
- Accepted findings: same-render duplicate submission, incomplete seven-state/theme/touch evidence, duplicate inline/toast error announcements, rejection of valid localized redirects, and a proxy-owned authenticated protocol-relative redirect.
- The proxy finding was first repaired in separate prerequisite PR `#155`, merged as `0fbc922d90060314df222e668abd433686b4bbbe`. Final slash/backslash hardening then landed through prerequisite PR `#156` from commit `67d914f02d122a932b64dcf80bd3b365d1b77af7`, merged as `b1ca85992277828c658711fc8dd2a7a33a4aeefd`; prerequisite branch/worktree cleanup completed and this Story fast-forwarded to that current base without expanding its eight-file manifest.
- Active remediation RED: `LoginForm.test.tsx` exited `1` with 5 failed and 28 passed tests. The new failures proved two same-turn mutations, the remaining error toast, and lost `/orders?q=книга`, `/orders?q=a b`, and `/orders#раздел` destinations.
- Form remediation GREEN: 33/33 tests passed after adding a synchronous submission lock, preserving validated localized redirect strings, using the inline Alert as the sole error announcement, and cancelling stale deferred focus frames.
- A subsequent frozen review returned code-review `APPROVE` and architecture `BLOCK`. The block was material: component and browser recovery both stopped after the first injected `503` and did not perform the required deliberate second retry. Both verdicts and frozen hash `3ba7fdff4a0e08c0b648e201fa9ad28466043b77e6aafe2cfbcb08257789bc27` are superseded after remediation; neither counts toward the later fresh final reviews, and at that checkpoint no replacement frozen hash or final `APPROVE`/`CLEAR` was claimed.
- The test engineer added `submits exactly one new request when the user deliberately retries after a network failure` and extended the browser recovery scenario through a second deliberate `503`. The named component retry test was GREEN against existing production: after the first failure it retained email, cleared/refocused password, proved no automatic request while the replacement password was entered, then proved the second deliberate activation issued exactly one new request and repeated safe recovery.
- The test engineer also added `preserves a valid decoded same-origin redirect containing a literal percent`. It produced genuine production-owned RED: `Expected /orders?q=50%`, `Received /dashboard`. `URLSearchParams` had already decoded the redirect query; production's redundant `decodeURIComponent` encountered the literal `%`, threw, and selected the dashboard fallback.
- The accepted production fix removed only that redundant second decoding step and applied the existing same-origin absolute-path, slash/backslash, control-character, and fixed-origin checks directly to the already-decoded redirect. Unsafe external, protocol-relative, backslash, script-protocol, malformed, and non-path cases remain rejected, while the original valid decoded destination is preserved unchanged.
- The post-retry-remediation checkpoint passed page/form at 43/43, the explicit deliberate-retry selection at 1/1, and proxy at 7/7. It was subsequently superseded by the malformed-percent remediation and the fresh evidence below.

### Malformed-percent final-review RED/GREEN

- Frozen hash `2a02b384c5d650389ef908c92e918ab25874c3754bbe1217c465753b35af530f` received code-review `APPROVE` and architecture `BLOCK`. The accepted material finding proved that malformed raw outer queries were decoded by `URLSearchParams` into the otherwise same-origin, path-shaped values `/orders?q=�%A` and `/orders?q=%GG`. The old malformed redirect test only rejected a no-leading-slash value, so it did not exercise this decoded path case.
- Both verdicts and the frozen hash are superseded after accepting the finding. They do not count toward the later required fresh final review pair, and at that checkpoint no replacement frozen hash or final `APPROVE`/`CLEAR` was claimed.
- Test-only RED touched no production file: `src/components/custom/LoginForm.test.tsx` collected 39 tests, 37 passed, and two failed with expected `/dashboard` versus actual `/orders?q=�%A` and `/orders?q=%GG`. The literal `/orders?q=50%` control remained GREEN.
- The minimal production repair remained local to `LoginForm.tsx`: reject `U+FFFD` and nonterminal malformed or incomplete percent sequences, while preserving a terminal literal `%`, complete `%HH` sequences, localized redirects, nested `%2F`, and all existing external, protocol-relative, backslash, script, control-character, and non-path fallbacks.
- Fresh authoritative GREEN on Node `v24.18.0`/npm `11.11.0`: focused redirect selection 3/3; page/form 2/2 files and 45/45 tests in `5.64s`; proxy 1/1 file and 7/7 tests in `457ms`. The current suite preserves success locking, truthful pre-hydration semantics, `44x44` route-owned controls, both axe-clean DOM states, localized, nested, terminal-literal-percent, and complete-percent redirects, and unchanged unsafe-redirect rejection.

## Browser GREEN Evidence

- Official command: `npm run test:e2e -- e2e/login-dashboard.spec.ts --project=chromium --grep 'Story 167.3 unauthenticated login'`.
- The repository preflight passed against localhost frontend/backend and launched Playwright through the required fresh handshake.
- Final pinned-Node result on the remediated current snapshot, after the sandbox preflight gap was classified: 10 tests collected, 9 passed, and one optional Manager setup test skipped; total duration `18.9s`. All six Story 167.3 scenarios passed, and the 84-combination matrix completed in `16.7s`.
- Scenarios prove semantic re-authentication without protected navigation; credential recovery; distinct network recovery through exactly two requests for two deliberate `503` attempts; one-request keyboard success with protocol-relative redirect fallback; real touch submission using `hasTouch: true` and `page.touchscreen.tap`; and responsive/theme/accessibility/privacy behavior.
- Matrix: all seven required states across `320`, `390`, `768`, `1024`, `1280`, and `1440` widths in both themes (84 combinations); submitting and success remain pending through geometry evidence; success 401 is no longer allowlisted; reduced motion; 720 CSS-pixel 200%-reflow equivalent; keyboard order; computed visible focus indicators on email/password/submit at 320px; explicit multi-line, in-form, non-clipped Russian session-expired and request-error copy; zoom-enabling viewport policy; no horizontal overflow; email, password, and submit controls each meet the `44x44` floor. Browser axe passed on the constrained default DOM in both themes, while component axe passed on both default and request-error DOM.
- Intentional injected 401/503/network failures are retained only as numeric expected categories. Raw console strings, URLs, bodies, trace IDs, tokens, and storage are not retained. Strict unexpected-console and page-error maps were empty; the synthetic success destination was held so unrelated dashboard APIs could not contaminate the login-state evidence.
- Synthetic credentials only. The tests assert that password input never enters the URL. Playwright trace, screenshot, and video remain disabled by repository configuration, so no raw credential-bearing browser artifact was retained.
- Browser recovery chronology: the original RED measured `36px` login-input height, and production first repaired the pre-hydration controls so they remained disabled without falsely exposing a busy state. The first geometry matrix then timed out at `90s`; replacing repeated field reads with one form evaluation per combination removed that bottleneck. A diagnostic run exposed 96 page errors, distributed as 12 for each non-success state and 24 for success. Fake clocks were removed in favor of a held `/dashboard` response, then the held-navigation ordering was repaired to observe the real request before release. The prior theme hypothesis was corrected when evidence showed `page.addInitScript` accessed null `document.documentElement` before `<html>` existed: 84 login navigations plus 12 success-destination navigations equaled all 96 errors. Removing only the two redundant pre-DOM root mutations, while retaining storage initialization and immediate post-navigation root assertions, produced final Chromium GREEN.
- Browser runtime also exposed a real focus timing defect after an error Alert mounted. The owned fix defers password focus restoration by one cancellable animation frame; that browser-remediation checkpoint reached direct 43/43 before the later malformed-percent tests raised the current total to 45/45.

## Universal Validation Evidence

- Toolchain: Node `v24.18.0`, npm `11.11.0`.
- The first sandboxed full-Vitest attempt hit listener `EPERM`; after that event was classified as sandbox-only, the fresh authoritative rerun passed 1,135/1,135 files and 18,437/18,437 tests in `149.64s`.
- Full `format:check`, zero-warning lint, type-check, and `check:max-lines` passed.
- The first sandboxed production-build attempt hit a port-bind failure. After that event was classified as sandbox-only, the authoritative official Next.js `16.2.12` Turbopack rerun passed with compile in `6.1s`, TypeScript in `12.8s`, and 70/70 pages generated.
- Exact manifest and forbidden-surface audits are clean: six tracked Story paths plus the two ignored evidence artifacts; no proxy, auth owner, primitive, registration, package/lock, token/style, config, or unrelated route diff. Package/lock, YAML, zero-nonignored-untracked, zero-staged, and `git diff --check` gates passed.
- Privacy tests passed 29/29. After browser execution, frontend port `3100` was stopped, backend port `3000` was left untouched, and `e2e/.auth/user.json`, `playwright-report/`, and `test-results/` were removed before the privacy rerun. The repository scan then passed 3,432 text files and 0 binary files with zero violations.
- E2E policy gates passed: assertion scan 19 files, fixed-wait scan 47 wait-free targets, and bare-skip scan 0. Story YAML parsed with status `in-progress`; package/lock had no diff; the exact unchanged eight-file manifest and forbidden-surface audits passed; zero nonignored untracked and zero staged paths were confirmed; and no lifecycle action was performed.

## Fresh Final Review Evidence

- The exact reviewed implementation/evidence snapshot used deterministic framed SHA-256 `7b50199d31402fd66c270afece57af0da353f225dcb317869bd9512db22009b2` over the ordered eight-file Story manifest.
- The independent code/spec/security mission ran first and completed at `2026-08-14T04:53:07.343Z` with the exact terminal verdict `APPROVE`.
- The independent architecture/scope/contract mission ran afterward and completed at `2026-08-14T05:06:03.321Z` with the exact terminal verdict `CLEAR`.
- Both fresh verdicts apply to the same frozen hash. No accepted finding remains unresolved, so Task 7 is complete and the Story lifecycle advances to `review` while every Task 8 Git integration/PR/merge/cleanup item remains incomplete.

## Completion Evidence — Review Complete, Git Integration Pending

Recorded from real execution:

- One-request and redirect/privacy evidence.
- Universal gate commands and exit codes with complete failure output retained.
- Exact eight-file manifest and zero forbidden/unrelated diffs.
- Two fresh independent review verdicts and accepted-finding disposition: complete on frozen hash `7b50199d31402fd66c270afece57af0da353f225dcb317869bd9512db22009b2` with sequential terminal `APPROVE` then `CLEAR` and no unresolved accepted findings.

Still pending: commit, PR, merge, branch/worktree cleanup evidence may be recorded only after Git Task 8 completes.

Current result: **production implementation, accepted malformed-percent RED/GREEN remediation, targeted/browser/universal evidence, exact-scope audit, and the fresh final review pair are complete; Git integration remains pending**.

## Planning Validation Checklist

- [x] Canonical Story 167.3 and requirements `FR1`, `FR2`, `FR27` mapped.
- [x] Exact branch, worktree, and full base SHA recorded and verified.
- [x] Owned, allowed, forbidden, and prospective exact manifest declared.
- [x] All required states have at least one planned active scenario.
- [x] Task 38 privacy/retry/duplicate-submission invariants retained.
- [x] Protocol-relative `startsWith('/')` weakness has an explicit active RED and local repair requirement.
- [x] Component and E2E levels avoid unnecessary API/contract duplication.
- [x] Focus, keyboard, touch, responsive, theme, zoom, accessibility, and privacy evidence specified.
- [x] No test, production, package, route-ledger, planning/master, or unrelated sprint file was edited during planning.
- [x] Active failing tests authored by the Story test engineer.
- [x] Genuine RED executed and recorded before production edits.
- [x] Production implementation and targeted GREEN complete.
- [x] Browser runtime evidence complete through the official repository preflight workflow.
- [x] Universal local gates and exact-scope audit complete on pinned Node/npm.
- [x] A new fresh final review pair is complete on the exact frozen snapshot with no unresolved accepted findings.
- [ ] Git integration and cleanup complete.

## References

- [Story: `_bmad-output/implementation-artifacts/167-3-fe-migrate-login-login.md`]
- [Canonical Epic: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1673-Migrate-Login-login`]
- [Route ledger: `_bmad-output/planning-artifacts/shadcn-route-ledger.md#Route-Ownership`]
- [Story plan: `.omx/plans/167.3-migrate-login.md`]
- [Master protocol: `.omx/plans/shadcn-full-ui-migration-master.md#Standard-Story-Execution-Protocol`]
- [UX forms/accessibility: `_bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns`]
- [Prior ATDD lessons: `_bmad-output/test-artifacts/atdd-checklist-167.2.md`]
- [Current route: `src/app/(auth)/login/page.tsx`]
- [Current form: `src/components/custom/LoginForm.tsx`]
- [Current direct tests: `src/app/(auth)/login/__tests__/page.test.tsx`, `src/components/custom/LoginForm.test.tsx`]
- [Existing browser evidence: `e2e/login-dashboard.spec.ts`]
