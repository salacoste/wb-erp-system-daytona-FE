---
stepsCompleted: [step-01-preflight-and-context, step-02-generation-mode, step-03-test-strategy, step-04-generate-tests, step-04c-aggregate, step-05-validate-and-complete]
lastStep: step-05-validate-and-complete
lastSaved: '2026-08-14'
workflowType: testarch-atdd
workflowMode: create
tddPhase: green
storyId: '167.4'
storyTitle: Migrate Registration `/register`
detectedStack: frontend
frontendStack: 'Next.js 16, React 19, Vitest 4, React Testing Library, jest-axe, Playwright'
primaryLevel: component
inputDocuments:
  - AGENTS.md
  - .agents/skills/bmad-testarch-atdd/SKILL.md
  - .agents/skills/bmad-testarch-atdd/workflow.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-01-preflight-and-context.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-02-generation-mode.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-03-test-strategy.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-04-generate-tests.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-04a-subagent-api-failing.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-04b-subagent-e2e-failing.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-04c-aggregate.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-05-validate-and-complete.md
  - .agents/skills/bmad-testarch-atdd/checklist.md
  - .agents/skills/bmad-testarch-atdd/resources/tea-index.csv
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/data-factories.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/component-tdd.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/test-quality.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/test-healing-patterns.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/selector-resilience.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/timing-debugging.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/overview.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/api-request.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/network-recorder.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/auth-session.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/intercept-network-call.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/recurse.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/log.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/file-utils.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/network-error-monitor.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/fixtures-composition.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/playwright-cli.md
  - .omx/plans/167.4-migrate-registration.md
  - .omx/plans/shadcn-full-ui-migration-master.md
  - _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
  - _bmad-output/planning-artifacts/shadcn-route-ledger.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad/tea/config.yaml
  - package.json
  - vitest.config.ts
  - playwright.config.ts
  - src/app/(auth)/register/page.tsx
  - src/app/(auth)/register/__tests__/page.test.tsx
  - src/components/custom/RegistrationForm.tsx
  - src/components/custom/RegistrationForm.test.tsx
  - e2e/onboarding.spec.ts
  - _bmad-output/test-artifacts/atdd-checklist-167.3.md
  - /private/tmp/tea-atdd-api-tests-2026-08-14T05-55-05-680Z.json
  - /private/tmp/tea-atdd-e2e-tests-2026-08-14T05-55-05-680Z.json
  - /private/tmp/tea-atdd-summary-2026-08-14T05-55-05-680Z.json
---

# ATDD Checklist — Epic 167-FE, Story 167.4

**Date:** 2026-08-14
**Author:** R2d2 / BMad TEA
**Primary test level:** Vitest route/component tests, with later Playwright critical-journey evidence
**Checkpoint scope:** ATDD workflow Steps 1–5 and every historical RED, blocked-host, diagnostic, accessibility, contrast, browser, universal, earlier-review, and ownership-adjudication checkpoint remain preserved. Frozen candidate 3 ended `REJECT`; its accepted M-1 classifier finding was repaired through an honest hostile-password-like HTTP-500 `1`-failure/`23`-pass RED and final two-target `27/27` GREEN. Current-byte Chromium remains authoritatively `3/3` GREEN in `3.9s`, the real computed-style focus delta and synthetic-`503` logger boundary remain synchronized below, and the fresh universal/local-gate plus exact-scope sequence predates this bounded repair. Task 7 requires a new freeze and sequential `APPROVE` then `CLEAR`, Task 8 remains open, and Story/sprint remain `in-progress`.

## Step 1 — Preflight and Context

### Story identity and controlling acceptance criterion

- Canonical identity: Epic `167-FE`, Story `167.4`, **Migrate Registration `/register`**.
- Requirements: `FR1`, `FR27`.
- Canonical route-ledger row: `167.4 | /register | src/app/(auth)/register/page.tsx | auth | planned`.
- User value: a new seller can create an account and begin onboarding without losing valid input.
- Controlling acceptance criterion:

> **Given** valid, duplicate, invalid, or network cases **when** registration is migrated **then** account creation and next navigation remain unchanged, feedback is actionable, input persists, duplicates are prevented **and** login navigation remains semantic.

The canonical Story block, route ledger, Story plan, inherited master plan, and current brownfield source/tests agree on the Story identity and owned route.

### Stack and prerequisite detection

- Detected stack: `frontend`. `package.json` identifies Next.js 16 and React 19; `vitest.config.ts` and `playwright.config.ts` configure the direct and browser test frameworks.
- Primary level: `component`, covering the register route component and `RegistrationForm`; the existing onboarding Playwright specification is the later critical-journey evidence surface.
- TEA flags: `tea_use_playwright_utils: true`, `tea_use_pactjs_utils: false`, `tea_pact_mcp: none`, `tea_browser_automation: auto`, `test_stack_type: auto`.
- The approved canonical acceptance criterion is clear, the frontend test frameworks are configured, dependencies are installed, and the pinned development toolchain is available.

### Factual repository baseline

| Item | Verified result |
| --- | --- |
| Branch | `cdx/epic-167-story-4-register` |
| Worktree | `/private/tmp/wb-fe-167-4-migrate-registration` |
| Base / initial `HEAD` | `c2a96943ff65a6ce60467608b01c17ad3a901716` |
| Initial worktree state | Clean: `git status --short` produced no paths |
| Toolchain | Node `v24.18.0`; npm `11.11.0` |
| Direct baseline command | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx` |
| Direct baseline result | Exit `0`; 2/2 files passed; 14/14 tests passed; duration `1.74s` |
| State after baseline | Clean: `git status --short` still produced no paths |
| Production edits | None; the register route and form remained unchanged |

This is an unchanged brownfield baseline only. No new acceptance test was authored or executed, and no result is classified as ATDD RED or implementation GREEN.

### Ownership and change boundaries

- **Owned surface:** the `/register` route, `RegistrationForm`, and their direct tests.
- **Allowed change surface:** register route/form/tests only, plus the bounded Story evidence and lifecycle records declared below when their later workflow owners authorize them.
- **Forbidden shared files:** auth API, auth store, auth schema, generic primitives, login, onboarding implementation, backend/public contracts, packages/lockfiles, global configuration, and unrelated routes or evidence.
- **Production scope for this checkpoint:** forbidden. No source or production file was edited.
- Any need outside the exact prospective manifest must be reported rather than silently expanding Story scope.

### Exact eight-file prospective manifest

The complete prospective Story lifecycle manifest is exactly:

1. `src/app/(auth)/register/__tests__/page.test.tsx`
2. `src/components/custom/RegistrationForm.test.tsx`
3. `e2e/onboarding.spec.ts` — only the relevant registration block
4. `_bmad-output/test-artifacts/atdd-checklist-167.4.md`
5. `_bmad-output/implementation-artifacts/167-4-fe-migrate-registration-register.md` — later factual Story task/evidence updates only; absent and not created at this checkpoint
6. `src/app/(auth)/register/page.tsx`
7. `src/components/custom/RegistrationForm.tsx`
8. `_bmad-output/implementation-artifacts/sprint-status.yaml` — later Story `167.4` lifecycle row and permitted timestamp/comment only; not edited at this checkpoint

Files 1–5 are the bounded future test/evidence surface; files 6–8 remain developer/lifecycle-owned later surfaces. This checkpoint creates only file 4. It does not authorize edits to any of the other seven files.

### Current behavior

- The register route renders the Russian registration purpose with one level-one `Регистрация` heading, a responsive constrained card-like surface, the current `RegistrationForm`, and a semantic Next.js link with `href="/login"` and accessible name `Войти`.
- The route currently uses outer `div` elements rather than a semantic `main` landmark.
- `RegistrationForm` uses React Hook Form in `onBlur` mode. Email is required and pattern-validated; password is required with an eight-character minimum. Both controls have visible labels, relevant autocomplete values, and field-level `aria-invalid` state.
- A valid submission calls the existing `registerUser` API with email and password. TanStack Query exposes pending state that disables both inputs and the submit button; the button also exposes `aria-busy` and changes its visible label.
- On success, the current form shows the success toast and calls `router.push('/login')`.
- Duplicate-email and password-message failures are classified from the current error message; all other failures use a generic registration-error toast. The form does not call `reset` on failure, so entered values remain in the form.
- The unchanged direct baseline contains six route tests and eight form tests. It covers route rendering and login-link destination; field validation; pending/loading state; the `registerUser` call; duplicate feedback; and generic network feedback.
- The relevant current `e2e/onboarding.spec.ts` registration block contains two reachability checks only: the form and its email/password inputs are visible, and the login link is visible.

### Current acceptance-evidence gaps

- Existing direct tests do not prove the complete success contract: successful account creation, exactly one semantic transition to `/login`, or unchanged next-navigation behavior.
- Duplicate-submission prevention is not directly exercised. The current tests verify pending disabling only after submission has entered the observable pending state.
- Input persistence after duplicate or network failure is not asserted.
- Request failures are surfaced through toasts rather than form-associated inline feedback; recovery focus and actionable association are neither implemented nor directly evidenced.
- Invalid-state focus, keyboard/touch completion, full submitting semantics, and accessibility behavior are not comprehensively evidenced.
- The route lacks a semantic `main` landmark, and the direct route suite does not assert one.
- The existing Playwright registration block does not exercise valid, duplicate, invalid, network, submitting, or success behavior and does not provide responsive, theme, accessibility, privacy, or duplicate-request evidence.
- Live browser prerequisites and selectors were not recorded in this checkpoint. Browser evidence remains a later workflow activity.

### Step 1 completion boundary

All required context for Steps 1–2 is loaded and the prerequisites are satisfied. No test strategy, scenario matrix, failing acceptance test, production implementation, browser run, review result, Story artifact, sprint-status update, staging, commit, push, PR, merge, or cleanup evidence is claimed here.

## Step 2 — Generation Mode

### Selected mode: AI generation

AI generation is selected because the canonical acceptance criterion is explicit and the relevant scenarios are standard authentication/form behaviors: valid registration, client invalidity, duplicate-account failure, network failure, pending/duplicate prevention, success navigation, retained input, and semantic navigation to login. The existing route, form, direct tests, and bounded onboarding Playwright block expose the necessary component seams for a later test-strategy step without live recording now.

### Recording decision

The configured browser automation mode is `auto`, but live Playwright CLI or MCP recording is deferred. It may be used later only when browser evidence is being gathered to confirm rendered selectors, interaction timing, responsive behavior, focus, themes, and the critical journey. No CLI/MCP browser session was opened and no browser evidence is recorded in this checkpoint.

### Step 2 completion boundary

At the Step 2 checkpoint, generation-mode selection was complete and `step-03-test-strategy` plus every later ATDD step remained unstarted. Step 3 progress is recorded separately below.

## Step 3 — Prioritized Test Strategy

### Strategy and phase classification

The controlling acceptance criterion is exercised once at the narrowest reliable level. Vitest route/component tests own deterministic DOM semantics, validation, request/mutation behavior, failure recovery, focus, and navigation. The bounded registration block in `e2e/onboarding.spec.ts` owns only evidence that requires a real rendered browser: responsive/theme/reflow behavior, computed touch-target geometry, keyboard-visible focus, hydration cleanliness, and privacy at the browser boundary. Browser scenarios must not repeat API payload, mutation-count, inline association, input-retention, or router-call assertions already owned by direct tests.

Phase labels are intentionally strict:

- **`RED-DIRECT`** — an implementation-owned route/component acceptance expectation that fails against the unchanged production source and is suitable for Step 4 test generation.
- **`RED-BROWSER-LATER`** — an implementation-owned rendered-browser expectation that fails against unchanged production, but remains later Playwright evidence rather than Step 4 direct-test RED.
- **`LOCK-DIRECT`** — preservation coverage for brownfield behavior that already exists. It is expected to pass unchanged production and must never be reported as ATDD RED.
- **`LOCK-BROWSER-LATER`** — later browser regression/privacy evidence expected to pass unchanged production; it is not RED and no browser result exists at this checkpoint.

Priority means: **P0** blocks account creation, contract safety, duplicate prevention, or deterministic completion; **P1** blocks recoverable failure, accessibility, responsive operation, or privacy; **P2** protects important presentation/interaction quality; **P3** is optional low-risk polish. No P3 scenario is added because the controlling acceptance criterion and migration contract contain no optional behavior worth duplicating at a lower level.

### Non-duplicative scenario matrix

| ID | AC / required state | Scenario and decisive oracle | Best level | Priority | Phase expectation against unchanged production |
| --- | --- | --- | --- | --- | --- |
| `REG-ROUTE-01` | AC: login navigation remains semantic; `default` | Render the route and preserve exactly one level-one `Регистрация` heading plus the named `Войти` **link** with exact `href="/login"`; do not replace it with a click-handler button or generic element. This is the sole owner of login-link semantics. | Route | P0 | `LOCK-DIRECT` — the unchanged route and existing route test already establish this preservation behavior; strengthening uniqueness is a regression lock, not RED. |
| `REG-ROUTE-02` | AC: migrated route remains understandable and accessible; `default` | Require a semantic `main` landmark containing the route heading, registration form, and login affordance, with no second `main`. | Route | P1 | `RED-DIRECT` — unchanged production uses outer `div` elements and exposes no `main`. |
| `REG-FORM-01` | AC: invalid cases are actionable and do not create an account; `invalid` | Submit empty and malformed values; assert no `registerUser` call, persistent visible field labels, text errors associated to the corresponding controls, non-color invalid meaning, a focusable error summary when both fields fail, and deterministic focus on the first invalid control (`email`). Cover malformed email, empty fields, and a 7-character password as one validation table rather than separate browser cases. | Component | P0 | `RED-DIRECT` — unchanged production has field messages, but no focusable multi-error summary, so the complete acceptance oracle fails. |
| `REG-FORM-02` | AC: account creation and request contract remain unchanged; `default` → `submitting` | For one valid submit, assert the sole API interaction is exactly one `registerUser({ email, password })` call, with no extra keys, transformed credentials, or alternate registration client. | Component | P0 | `LOCK-DIRECT` — exact payload behavior exists today; add/retain the explicit one-call assertion as a migration regression lock and never cite it as RED. |
| `REG-FORM-03` | AC: duplicates are prevented; `submitting` | Hold the mutation pending, attempt rapid click plus Enter resubmission, and assert one request only; email, password, and submit remain disabled, the submit control has busy semantics and a submitting label, and no retry control is exposed until failure. | Component | P0 | `LOCK-DIRECT` — pending disabling/busy behavior exists and is expected to prevent the repeated gesture; this is high-risk preservation evidence, not implementation RED. |
| `REG-FORM-04` | AC: duplicate feedback is actionable and input persists; `duplicate` | Reject with a duplicate-account failure; retain the entered email and password in their controls, keep the password masked, expose safe text feedback programmatically associated with the email/form (not toast-only and not color-only), provide a semantic `/login` recovery action, focus the associated recovery surface deterministically, allow a bounded corrected-email retry, and never render the raw backend message, response body, stack, identifier, or credential. | Component | P0 | `RED-DIRECT` — unchanged production emits only a toast and has no associated recovery surface, focus target, or inline semantic login action. |
| `REG-FORM-05` | AC: network feedback is actionable, input persists, and retry is safe; `network` | Reject with a network/unknown error containing hostile raw detail; retain both entered values while the password remains masked, expose a form-associated generic Russian explanation and one bounded retry action, focus that recovery surface, reveal none of the raw backend detail/PII/stack, and on retry issue exactly one new request without duplicate concurrent mutation. | Component | P0 | `RED-DIRECT` — unchanged production has generic toast-only feedback and no associated bounded retry/focus surface. |
| `REG-FORM-06` | AC: success preserves next navigation and prevents duplicate completion; `success` | Resolve a valid request and require a terminal success lock: controls cannot resubmit while transition is outstanding, feedback communicates completion without color alone, and exactly one `router.push('/login')` occurs even after repeated click/Enter attempts or a repeated resolution callback. | Component | P0 | `RED-DIRECT` — unchanged production navigates once in the ordinary case but releases `isPending` after resolution and has no terminal success lock, so the complete oracle fails. |
| `REG-BROWSER-01` | Migration accessibility/visual contract; `default`, `invalid`, `submitting`, `success` presentation only | In the existing registration Playwright block, use one rendered evidence matrix across supported narrow/desktop widths and light/dark themes: no task-breaking overflow at 200% zoom/reflow, visible labels and non-color state meaning, visible focus throughout keyboard-only completion, task-order focus, comfortable Russian-content wrapping, and computed primary input/button touch targets of at least `44×44` CSS px. Do not reassert request payload, call count, server-error association, retained values, or router spies. | E2E | P1 | `RED-BROWSER-LATER` — the unchanged Input and default Button primitives both use `h-9` (36 CSS px), below the required 44px primary-control height, so the complete rendered migration evidence must fail before implementation. No browser execution/result is claimed. |
| `REG-BROWSER-02` | Runtime safety; `default` → `submitting` | During one browser journey, assert no hydration warning or pre-hydration disclosure, password stays a masked password control, and credentials never enter the URL, history, serialized page source, or browser console. This scenario owns only browser-boundary leakage/hydration evidence; direct tests exclusively own request shape, safe error mapping, and absence of raw backend detail in user feedback. | E2E | P1 | `LOCK-BROWSER-LATER` — these are privacy/runtime regression guards expected to hold on unchanged production; they are not RED, and no browser evidence is claimed. |
| `REG-BROWSER-03` | Semantic interaction continuity; `default` | With touch input, activate the semantic `Войти` link and confirm browser navigation to `/login`; with keyboard input, traverse the route in visual/task order without pointer-only or hover-only requirements. Direct route coverage remains the semantic source of truth, while this scenario owns device interaction only. | E2E | P2 | `LOCK-BROWSER-LATER` — expected brownfield interaction continuity, retained only as later device evidence and not mislabeled as RED. |

### Acceptance-criterion and state coverage check

| Controlling expectation | Single owning scenario(s) | State coverage |
| --- | --- | --- |
| Account creation/request remains unchanged | `REG-FORM-02` | `default`, `submitting` |
| Next navigation remains unchanged and completes once | `REG-FORM-06` | `success` |
| Login navigation remains semantic | `REG-ROUTE-01`; device-only activation in `REG-BROWSER-03` | `default` |
| Invalid feedback and deterministic recovery | `REG-FORM-01` | `invalid` |
| Duplicate feedback is associated/actionable and safe | `REG-FORM-04` | `duplicate` |
| Network feedback is associated/actionable and safe | `REG-FORM-05` | `network` |
| Failure input persists without privacy leakage | `REG-FORM-04`, `REG-FORM-05`; browser-boundary privacy only in `REG-BROWSER-02` | `duplicate`, `network` |
| Duplicate submissions are prevented and retries are bounded | `REG-FORM-03`, `REG-FORM-05`, `REG-FORM-06` | `submitting`, `network`, `success` |
| Semantic route structure and accessible/non-color meaning | `REG-ROUTE-02`, `REG-FORM-01`, `REG-FORM-04`, `REG-FORM-05`, `REG-FORM-06` | all implementation-owned UI states |
| Responsive/theme/reflow/touch/keyboard rendered proof | `REG-BROWSER-01`, device-only semantic activation in `REG-BROWSER-03` | browser presentation/interaction only |
| Hydration/privacy and absence of raw backend detail | direct safe mapping in `REG-FORM-04`/`REG-FORM-05`; browser-boundary leakage only in `REG-BROWSER-02` | `default`, `duplicate`, `network`, `submitting` |

All six required Story states are planned: `default`, `invalid`, `duplicate`, `network`, `submitting`, and `success`. High-risk negative cases include malformed/empty inputs, short password, rapid multi-gesture submission, duplicate account, hostile unknown/network detail, retry after failure, repeated success completion, credential leakage, hydration warnings, narrow reflow, and pointer-independent operation.

### RED-phase confirmation and Step 3 boundary

Every implementation-owned expectation marked `RED-DIRECT` or `RED-BROWSER-LATER` has a decisive assertion that the unchanged production source does not satisfy: missing semantic `main`; missing multi-error summary; toast-only duplicate/network handling without associated recovery and focus; absent bounded retry; absent terminal success lock; and unchanged `h-9` (36px) Input/default Button heights below the 44px primary-control requirement. These are the only scenarios eligible to be called acceptance RED after their future tests are generated and actually fail for the intended reason.

The `LOCK-DIRECT` and `LOCK-BROWSER-LATER` rows protect already-present behavior—semantic `/login` navigation, the exact `{ email, password }` contract and sole `registerUser` call, pending duplicate prevention, hydration/privacy, and device continuity. They are explicitly excluded from RED accounting even if Step 4 later strengthens their assertions. Existing passing regression tests remain brownfield baseline evidence only.

Step 3 is complete and saved. No test was created or changed; no production, Story, sprint-status, package, config, planning, or other file was edited. Step 4 was neither loaded nor executed. No RED, GREEN, browser, review, staging, commit, push, PR, merge, or cleanup evidence is claimed.

## Step 4 — Adaptive Test Generation and Step 4C Aggregation

### Orchestration and recovery evidence

- The requested execution mode was `subagent`, the capability probe was enabled, and both worker payloads resolve their supported mode as `subagent` through OMX missions.
- API and E2E worker missions were initially dispatched as OMX subagents. The first API launch encountered the shared session-pointer collision while the E2E worker continued successfully. API generation was then recovered sequentially through the dedicated `story1674-atdd-api-red-recovery` mission, which completed successfully without changing repository files. The factual execution label is **OMX SUBAGENTS (E2E worker plus sequential API recovery after the initial session-pointer collision)**.
- The API worker correctly produced zero tests: `tests: []` and `test_count: 0`. Story 167.4 preserves the existing `registerUser` contract and forbids API, auth store/schema, backend, provider-contract, and public-contract ownership, so no API test or API fixture was invented.
- The E2E worker produced exactly one proposal for `e2e/onboarding.spec.ts` with exactly three registration-only tests: `REG-BROWSER-01`, `REG-BROWSER-02`, and `REG-BROWSER-03`. Each proposed test uses `test.skip()`, contains substantive expected-behavior assertions rather than `expect(true).toBe(true)`, and is metadata-marked `expected_to_fail: true`.

### Aggregation evidence

- `/private/tmp/tea-atdd-api-tests-2026-08-14T05-55-05-680Z.json` parsed successfully and has SHA-256 `cb77aad2e32147f9535f71d17a2bfa5ec88ecc8f7e6d1f74cd7353f74cbcf410`.
- `/private/tmp/tea-atdd-e2e-tests-2026-08-14T05-55-05-680Z.json` parsed successfully and has SHA-256 `62570af5bfecb4776a0b9d615e45687a0fa6695c0e4b928ccbf53ae03941ae05`.
- The initial E2E proposal parsed as TypeScript with zero syntax diagnostics. Its full proposed content SHA-256 is `dc231a69ed374ad8635206fff620753afb406f18c747c8f4831b27bee56f4074`, and that exact content was applied to `e2e/onboarding.spec.ts` using `apply_patch` during Step 4. Step 5 later found and corrected one registration-local Playwright wrapper contract defect; the current validated file hash and correction are recorded below.
- Only the existing `Register Page Functionality` describe block changed. The bytes before that block remain SHA-256 `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668`; the bytes after it remain SHA-256 `a99c77bda0d7b921d4711b356e72f93e83e242816d63db046fed6a3cfbe36c0e`. Therefore the existing cabinet, processing, WB-token, login, and authenticated blocks are preserved byte-for-byte.
- All fixture needs are either proposal-local or already supplied by the existing unauthenticated Playwright context. No shared fixture was created and `fixtures_created` is `0`.
- The three skipped E2E tests cover responsive/theme geometry and 200% reflow, keyboard focus/task order, touch login-link activation, hydration/console cleanliness, masked-password and browser-boundary credential privacy, and Russian validation wrapping/non-color invalid meaning. Component-owned payload, request-count, router-spy, failure-association, and retained-input assertions remain excluded.
- Live selector verification and browser execution remain deferred because no localhost application was available and the worker mandate prohibited starting one. No tests or browser were run during Step 4 or Step 4C.
- `expected_to_fail: true` records design intent only. Because every generated test remains skipped and nothing was executed, this checkpoint makes **no claim of genuine executed ATDD RED**, failure reason, GREEN, or passing browser evidence.

### Step 4C completion boundary

Step 4 generation outputs are aggregated: API tests `0`, E2E tests `3` (all skipped), total tests `3`, and fixtures created `0`. The Step 4 summary is stored at `/private/tmp/tea-atdd-summary-2026-08-14T05-55-05-680Z.json`. No Story artifact, sprint-status row, route, form, direct test, production file, package, lockfile, configuration, planning file, or shared fixture was created or edited. Step 5 was not loaded or executed; no staging, commit, push, PR, merge, browser, or test execution occurred.

## Step 5 — Validate and Complete

### Validation disposition

Step 5 is complete for the bounded generated-test checkpoint. The prerequisites, reports, proposal structure, Story mapping, priorities, ordering, selectors, TypeScript syntax, Playwright collection, path ownership, and non-registration byte boundaries were validated. The result is **not** a claim that the ATDD RED phase was executed or passed: all three generated E2E proposals remain `test.skip()`, the summary report says `red_execution_status: "not-executed"`, and no direct route/component RED test was generated or run. The next required handoff is therefore an active direct route/component RED mission, described below.

### Prerequisites and generic-checklist reconciliation

| Checklist area | Story 167.4 result | Disposition |
| --- | --- | --- |
| Approved, testable acceptance criterion | Present in the canonical BMAD planning artifact and Story plan; it covers valid, duplicate, invalid, network, retained-input, duplicate-prevention, next-navigation, and semantic-login behavior. | Satisfied |
| Story markdown input | The later implementation Story artifact is intentionally absent and its creation is outside this mission. The approved Story plan plus canonical BMAD artifact are the authoritative brownfield inputs. | N/A for this checkpoint; not a prerequisite gap |
| Framework scaffolding/configuration | `playwright.config.ts` sets `testDir: './e2e'`; Vitest and Playwright configuration and existing fixtures are present. | Satisfied |
| Installed/pinned test toolchain | `package.json` requires Node `24.18.0` and npm `11.11.0`; `/opt/homebrew/opt/node@24/bin/node` and `/opt/homebrew/bin/npm` provide exactly those versions. The interactive default `node` was `v25.8.1`, so validation commands used the pinned Node binary. | Satisfied with pinned executable |
| API acceptance tests | The API worker returned `tests: []`, `test_count: 0`, and no fixture needs. API/auth/backend/public-contract ownership is forbidden and the current `registerUser` contract must be preserved. | N/A; zero tests is correct |
| New factories or shared fixtures | The proposal uses existing unauthenticated storage and proposal-local setup. No data creation/cleanup surface is needed, and shared fixtures are outside the allowed change surface. | N/A; `0` factories and `0` fixtures is correct |
| New `data-testid` attributes | The generated tests use accessible roles, labels, visible text, and the semantic login link; no missing stable selector requires a production `data-testid`. | N/A; `0` requirements is correct |
| Generic `tests/e2e/` path | This repository's configured Playwright directory is `e2e/`, and the proposal correctly extends the existing `e2e/onboarding.spec.ts`. | Repository-specific equivalent satisfied |
| One assertion per test | The browser-owned proposal intentionally uses three cohesive evidence scenarios with multiple related assertions for responsive/theme, privacy/runtime, and touch interaction matrices. Splitting every matrix cell would duplicate navigation and obscure the browser-evidence ownership boundary. | Generic recommendation adapted, not claimed literally |
| Given–When–Then readability | The tests use explicit setup, interaction, and oracle blocks with descriptive scenario IDs/titles. They do not add ceremonial Given/When/Then comments where the code already makes the sequence clear. | Intent satisfied |
| Executed RED | No proposal was enabled or executed; `expected_to_fail: true` is design metadata only. | **Open gap — not passed** |
| Browser/app execution | Prohibited by this mission. Only Playwright list-only collection and static parsing were used. | Deferred |
| CLI/browser cleanup | Every list/static command exited; no app or browser was started, so no browser session was orphaned. No Step 5 temporary output remains. The three pre-existing `/private/tmp/tea-atdd-*.json` reports were mandated read-only inputs and were not moved because only this checklist and a proven registration-local test correction were authorized. | Satisfied within the mission boundary |

### Proposal structure, acceptance mapping, and priority validation

- The API JSON parses and contains exactly `0` tests, `0` fixture needs, and no repository mutation.
- The E2E JSON parses and contains exactly one file proposal for `e2e/onboarding.spec.ts`, exactly three new tests, and no repository mutation by the worker. The aggregate summary parses and agrees: total `3`, API `0`, E2E `3`, fixtures `0`, `all_tests_skipped: true`, and `red_execution_status: "not-executed"`.
- The current registration block contains exactly three `test.skip()` calls and exactly one title for each `REG-BROWSER-01`, `REG-BROWSER-02`, and `REG-BROWSER-03`. The generated-test checkpoint contract is therefore preserved after the Step 5 correction.
- Priority tags are exact: P0 `0`, P1 `2`, P2 `1`, P3 `0`. P0 registration behavior remains correctly assigned to the future direct route/component RED mission rather than duplicated in browser tests.
- `REG-BROWSER-01` is the sole E2E proposal with a decisive implementation RED oracle: the browser-computed primary-control height must reach `44` CSS px across the viewport/theme matrix. It maps to responsive, reflow, touch-target, visible-label, non-color invalid-state, Russian-copy wrapping, and reduced-motion evidence.
- `REG-BROWSER-02` is a deferred browser regression/privacy guard, not RED evidence. It maps to task-order keyboard focus, visible focus, clean hydration/console/page-error channels, masked password, and absence of synthetic credentials in URL/history/source/console evidence.
- `REG-BROWSER-03` is a deferred browser interaction lock, not RED evidence. It maps only to touch activation of the semantic Russian `Войти` link and navigation to `/login`.
- Component-owned payload, registration call count, duplicate-submit prevention, router-call count, failure association, retained values, retry, and recovery focus remain excluded from these E2E proposals. That exclusion prevents cross-level duplication but leaves the direct RED handoff mandatory.

### Network-first ordering and selector semantics

- `page.route('**/v1/auth/register', ...)` is registered before the first registration navigation in `REG-BROWSER-02`.
- `page.waitForRequest(...)` is created before `submit.click()`, and `page.waitForURL(...)` is created before the held success response is released.
- In `REG-BROWSER-03`, `page.waitForURL(...)` is created before `loginLink.tap()`.
- No hard wait or sleep is present in the three proposals.
- User-facing elements use `getByRole`, `getByLabel`, and `getByText`; the only raw structural locator in the generated block is `html` for theme-class verification. No class-based user-control selector and no new `data-testid` requirement is present.

### Proven Playwright contract correction

The first list-only collection with complete synthetic list-time environment values exposed a real collection defect in the initial proposal: `e2e/fixtures/playwright-network-guard.ts` permits only `serviceWorkers` and `storageState` through `test.use()`, so `test.use({ hasTouch: true })` was rejected by `epic128-test-network-policy/v1` before discovery. The correction was made with `apply_patch` inside only the Story 167.4 registration block:

- removed the forbidden `test.use({ hasTouch: true })` override;
- changed the skipped touch scenario to use the existing repository pattern `browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 }, storageState: { cookies: [], origins: [] } })`;
- retained the semantic role selector, network-before-action navigation wait, `test.skip()` checkpoint, and touch oracle;
- added `try/finally` cleanup for the future browser context.

No route, form, direct test, shared fixture, package, configuration, planning, Story, or sprint artifact was edited. The corrected `e2e/onboarding.spec.ts` has SHA-256 `0b22abc4ce99f616bfc1c654f151790f98d7899d505fc3342d227bb97d54a936`; the initial worker proposal remains preserved in its JSON report with SHA-256 `dc231a69ed374ad8635206fff620753afb406f18c747c8f4831b27bee56f4074`.

### Exact non-browser validation commands and results

| Command | Result |
| --- | --- |
| `/opt/homebrew/opt/node@24/bin/node --version` | Exit `0`; `v24.18.0` |
| `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm --version` | Exit `0`; `11.11.0` |
| `/opt/homebrew/opt/node@24/bin/node node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --list` | Collection blocked before loading tests by the required local E2E preflight handshake; no app/browser started. This established that direct local discovery cannot bypass repository preflight. |
| `CI=1 E2E_BASE_URL=http://localhost:3100 E2E_API_URL=http://localhost:3000 E2E_TEST_EMAIL=story-167-4-list-only@example.invalid E2E_TEST_PASSWORD=Story1674-ListOnly-Secret /opt/homebrew/opt/node@24/bin/node node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --project=chromium --list` before correction | Exit `1`; collection stopped at the registration-local `test.use({ hasTouch: true })` with `Outbound test request denied by epic128-test-network-policy/v1`; total `0` collected. No app/browser started. |
| The same Playwright `--list` command after the registration-local correction | Exit `0`; `18` tests in `1` file collected across the setup dependency and chromium project, including all three Story 167.4 proposal IDs with P1/P1/P2 tags. No test body, app, web server, or browser ran. |
| TypeScript `transpileModule` syntactic-diagnostic check for `e2e/onboarding.spec.ts` using the pinned Node and installed `typescript` package | Exit `0`; `TYPESCRIPT_SYNTACTIC_ERRORS=0`. |
| Static JSON/proposal validator over the three `/private/tmp/tea-atdd-*.json` inputs and the current/HEAD E2E blocks | Exit `0`; all checks true for JSON parsing, counts, skipped-test structure, priority tags, scenario IDs, semantic selectors, no `data-testid`, no fragile class selector, network-before-action ordering, proposal localization, and prefix/suffix equality. |
| `git diff --check -- e2e/onboarding.spec.ts` | Exit `0`; no whitespace errors. |
| `git diff --numstat -- e2e/onboarding.spec.ts` | Exit `0`; `293` insertions, `0` deletions, one tracked file. |

### Files, counts, and byte-preservation evidence

| Item | Validated result |
| --- | --- |
| API test files/tests | `0` files / `0` tests — N/A by ownership |
| E2E test files/tests | `1` existing file / `3` new proposals, all `test.skip()` |
| Direct route/component RED tests | `0` generated / `0` executed — open handoff gap |
| New factories | `0` — N/A |
| New shared fixtures | `0` — N/A |
| New `data-testid` requirements | `0` — N/A |
| Tracked changed path | `e2e/onboarding.spec.ts` only |
| Ignored evidence path | `_bmad-output/test-artifacts/atdd-checklist-167.4.md` exists under the existing `_bmad-output/` ignore rule |
| Non-registration prefix | HEAD and current SHA-256 both `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668` |
| Non-registration suffix | HEAD and current SHA-256 both `a99c77bda0d7b921d4711b356e72f93e83e242816d63db046fed6a3cfbe36c0e` |
| Registration-only ownership | The initial JSON proposal and the Step 5 correction are both localized between the unchanged prefix and suffix boundaries |

The other six prospective manifest paths remain unchanged or absent: both direct test files, both production files, and sprint status are byte-identical to HEAD; the later Story artifact remains absent in both HEAD and the worktree. Nothing is staged.

### Risks and assumptions

- Playwright list-only collection proves TypeScript loading, fixture-wrapper compatibility, titles/tags, and discovery; it does not prove rendered selectors, layout, focus visibility, browser privacy, navigation, or any expected failure reason.
- `expected_to_fail: true` and the `ATDD RED` proposal label describe future intent only. They are not execution evidence.
- `REG-BROWSER-02` and `REG-BROWSER-03` are lock scenarios carried in the skipped proposal, not failure-expected RED scenarios. They must not be counted as RED even when later enabled.
- The successful list command used synthetic `.invalid` credentials and loopback URLs only to satisfy module-load configuration. List mode did not execute setup, global setup, web-server plugins, tests, or browsers.
- Live selector verification remains deferred. The current selectors are supported only by source/direct-test semantics plus successful Playwright collection.
- The interactive shell's default Node version is newer than the project pin; later missions must continue to invoke the pinned Node/npm pair or repair their PATH before validating.
- The pre-existing Step 4 JSON reports remain in `/private/tmp` because they were explicit inputs and this mission forbids relocating or expanding artifacts. Their hashes and contents were validated, but their location is not generalized as a preferred artifact pattern.

### Required implementation handoff

The immediate next mission is **active direct route/component RED generation and execution**, not production implementation and not browser execution. It must stay within `src/app/(auth)/register/__tests__/page.test.tsx` and `src/components/custom/RegistrationForm.test.tsx`, generate the direct expectations already mapped as `REG-ROUTE-02`, `REG-FORM-01`, `REG-FORM-04`, `REG-FORM-05`, and `REG-FORM-06`, preserve/strengthen the `REG-ROUTE-01`, `REG-FORM-02`, and `REG-FORM-03` brownfield locks without mislabeling them RED, run the targeted Vitest command against unchanged production, and capture genuine intended failures rather than skips or design metadata.

Only after that direct mission records genuine RED for the intended missing behavior may the developer mission change the owned route/form surfaces toward GREEN. The three Playwright proposals remain skipped until a later browser-evidence mission has an authorized localhost preflight and can verify rendered selectors and failure/pass reasons. No estimate, Story artifact, sprint transition, production task, headed/debug command, staging instruction, or lifecycle transition is created here because those belong to later owners.

### Truthful stop boundary

This Step 5 mission stops after validating, correcting the one proven registration-local Playwright collection defect, polishing this checklist, and recording the evidence above. It does not create the Story artifact, transition sprint status, generate or execute active direct RED tests, implement production behavior, start an app/server/browser, stage, commit, push, open a PR, merge, or perform any later workflow step. **Step 5 validation is complete; executed ATDD RED remains explicitly incomplete and is the required next handoff.**

## Active Direct RED Evidence — 2026-08-14

This section is a later direct-test checkpoint and does not rewrite the historical Steps 1–5 record above. Story lifecycle moved from `ready-for-dev` to `in-progress` before direct test editing; that transition explicitly made no RED claim. Production and the existing E2E registration block remained byte-identical throughout authoring and execution.

### Exact commands and results

| Check | Exact command | Exit/result |
| --- | --- | --- |
| Scoped format | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec prettier -- --write 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx` | Exit `0`; both direct test files formatted; authoritative rerun reported both unchanged |
| Scoped zero-warning lint | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec eslint -- --max-warnings 0 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx` | Exit `0`; zero warnings |
| TypeScript | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec tsc -- --noEmit` | Exit `0` |
| Diff whitespace | `git diff --check` | Exit `0` |
| Direct targeted RED | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx` | Exit `1`; 2/2 files failed; 22 tests collected; 10 passed and 12 failed; duration `2.49s` |

The first static authoring pass correctly blocked execution with TypeScript exit `2` because three assertions used the unsupported matcher `toHaveBeenOnlyCalledWith`. Test code only was corrected to the supported pair `toHaveBeenCalledTimes` plus `toHaveBeenCalledWith`; the complete authoritative format/lint/type/diff rerun above then passed. The final targeted output is retained outside the repository at `/tmp/story-167-4-direct-red-targeted.log` (951 lines, 51,050 bytes, SHA-256 `9ecb3d19a27e475874413b081bf37c0b2e943045e3371f95b9316b21bd019f7b`).

### Genuine failing expectations and observed-versus-required mismatches

1. `[REG-ROUTE-02] contains the complete route content in exactly one semantic main` — observed no `main`; required exactly one `main` containing the heading, form, and `/login` link.
2. `[REG-FORM-01] provides Story-local 44px minimum primary controls` — observed inherited `h-9` (36px) classes on email, password, and submit; required Story-local `min-h-11` (44px minimum) on all three primary controls.
3. `[REG-FORM-01] associates empty-field errors, exposes a focusable summary, focuses email, and sends no request` — field messages were associated, email received first-invalid focus, and `registerUser` remained at zero calls, but no focusable named multi-error summary existed.
4. `[Story 167.4 RED] synchronously locks duplicate valid submits before a pending render commits` — two synchronous valid submit events created two `registerUser` calls; required one same-render synchronous lock. This new missing-behavior expectation is deliberately not labeled as the passing `REG-FORM-03` pending-state lock.
5. `[REG-FORM-04] classifies ApiError status 409 as duplicate without trusting hostile detail` — a real `ApiError` with `status === 409` and a non-keyword hostile message produced generic feedback; required duplicate classification by stable status, independent of backend wording.
6. `[REG-FORM-04] retains masked credentials and exposes associated duplicate recovery with focus and a login link` — email/password retention, password masking, and raw-detail exclusion held, but feedback existed only in the safe toast; required associated in-form feedback, deterministic recovery focus, and a semantic `/login` recovery link.
7. `[REG-FORM-05] classifies ApiError status 0 as safe associated service recovery` — retained/masked values and hostile-detail exclusion held, but there was no associated focused service-recovery surface or retry action.
8. `[REG-FORM-05] classifies ApiError status 503 as safe associated service recovery` — retained/masked values and hostile-detail exclusion held, but there was no associated focused service-recovery surface or retry action.
9. `[REG-FORM-05] creates exactly one new request for one deliberate retry` — the first request failed safely, but no deliberate retry control existed; required one retry activation to create exactly one additional request with the retained exact payload.
10. `[REG-FORM-05] disables automatic mutation retry even when the QueryClient enables it` — observed three `registerUser` calls under global mutation retry `2`; required an explicit per-mutation retry opt-out yielding one call.
11. `[REG-FORM-05] keeps associated service feedback axe-clean` — the error-state axe scan could not begin because the required associated `alert` surface was absent; the default-state axe test passed.
12. `[REG-FORM-06] keeps a terminal success lock and ignores repeated activation after resolution` — after the ordinary successful transition the controls re-enabled, leaving resubmission possible; required a terminal lock while navigation is outstanding and one request/navigation only.

These are assertion failures against collected tests and unchanged Story-owned production. They are not fixture, collection, environment, timeout, skip/todo/only, conditional-pass, swallowed-assertion, or unrelated failures.

### Passing preservation and partial-lock evidence

The 10 passing tests are brownfield evidence, not RED inflation:

- both `REG-ROUTE-01` tests passed: one `h1`, exactly one semantic named `Войти` link with `href="/login"`, purpose copy, and form composition;
- `REG-FORM-01` default semantics and default-state axe scan passed, including visible labels, email/password types, autocomplete, required semantics, and password masking;
- malformed-email and seven-character-password validation passed with associated field feedback and zero requests;
- `REG-FORM-02` passed with exactly one sole `registerUser` interaction and the exact `{ email, password }` payload;
- both designated `REG-FORM-03` brownfield locks passed: all primary controls disabled with truthful pending semantics, and rapid click/Enter activation after pending remained at one request with no retry control;
- the ordinary `REG-FORM-06` success lock passed: existing success toast, exactly one `router.push('/login')`, and no mocked auth-store or browser storage write.

The failed invalid/duplicate/network tests also proved useful preserved subcontracts before reaching their intended missing oracle: field-level association and first-invalid focus for empty validation, input retention, masked password type, safe toast copy where already present, and raw hostile-detail exclusion from the DOM.

### Protected hashes and scope boundary at RED

- `e2e/onboarding.spec.ts`: `0b22abc4ce99f616bfc1c654f151790f98d7899d505fc3342d227bb97d54a936`.
- `src/app/(auth)/register/page.tsx`: `f9f9bcbfec3d71045b75172e9e0ac8d44e1702e4eabaa3f67548986ea86e0fe7`.
- `src/components/custom/RegistrationForm.tsx`: `3a9eb9a73443e7702b6dbe30aa50211cc453eb3a1c878b1169992fdb0efcacc4`.
- The existing three `REG-BROWSER-*` proposals remain skipped and were neither edited nor executed.
- Direct RED mission mutations are limited to the Story artifact, exact Story sprint row, this checklist, and the two direct test files. Nothing is staged.

### Direct RED checkpoint

- [x] Lifecycle moved truthfully to `in-progress` before direct test editing without claiming RED.
- [x] Active deterministic direct expectations cover `REG-ROUTE-02`, `REG-FORM-01`, `REG-FORM-04`, `REG-FORM-05`, and `REG-FORM-06`.
- [x] Passing brownfield locks cover `REG-ROUTE-01`, `REG-FORM-02`, and `REG-FORM-03`.
- [x] Scoped format, zero-warning lint, TypeScript `--noEmit`, and `git diff --check` pass.
- [x] The exact pinned targeted command produces decisive genuine RED against unchanged production.
- [ ] Production implementation or direct GREEN.
- [ ] Browser execution or browser GREEN.
- [ ] Universal validation, independent review, staging, commit, push, PR, merge, or cleanup.

### Immediate production handoff

Implement only `src/app/(auth)/register/page.tsx` and `src/components/custom/RegistrationForm.tsx` toward the active expectations without changing API/store/schema/primitives/packages/configuration or weakening tests. Preserve `registerUser` and the exact payload as the sole request, use real `ApiError.status` values for classification, add explicit mutation retry opt-out plus synchronous and terminal locks, keep recoverable input masked/retained, provide associated focused safe recovery, and retain the existing success toast and single `/login` navigation. Then rerun the exact targeted command to GREEN before any browser work.

## Production Direct GREEN Evidence — 2026-08-14

This later checkpoint records only the bounded production direct RED-to-GREEN handoff. The protected direct tests and E2E proposal were not changed, no browser/server was started, and no browser, universal-suite, build, review, staging, commit, push, PR, merge, or cleanup result is claimed.

### Implemented direct behavior

- `src/app/(auth)/register/page.tsx` now places the complete route content in exactly one semantic `main` while preserving one `Регистрация` `h1`, the Russian purpose copy, the existing `RegistrationForm`, constrained responsive composition, and the semantic Next.js `/login` link.
- `RegistrationForm` retains React Hook Form `mode: 'onBlur'`, visible labels, email/password types and autocomplete, the exact validation rules, stable field-message association, masked retained password values, and Story-local `min-h-11` classes on email, password, and submit.
- An invalid multi-error submission renders a focusable named summary, deterministically focuses the first invalid field, and does not issue a request.
- Duplicate classification is limited to `error instanceof ApiError && error.status === 409`; hostile backend wording and payload detail are ignored. The retained fields remain associated with a focused safe alert containing a semantic `/login` recovery link.
- Status `0`, status `503`, and every other non-409 failure map to the same safe associated focused service alert with exactly one deliberate retry action. One retry issues exactly one new `registerUser` call with retained `{ email, password }` values.
- The mutation explicitly sets `retry: false`. A synchronous ref lock prevents same-render duplicate submissions, pending state disables all primary controls with truthful busy text, and a terminal success/navigation lock keeps controls disabled and ignores resubmission after resolution.
- `registerUser` remains the sole request and receives exactly one argument with exactly `{ email, password }`. The existing success toast remains unchanged and `router.push('/login')` occurs exactly once. No auth/session/cabinet/onboarding or browser-storage write was introduced.

### Iteration and final command evidence

| Check | Exact command | Exit/result |
| --- | --- | --- |
| First production GREEN attempt | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx` | Exit `1`; 21/22 passed. The sole intended implementation defect was stale prior-render error inspection in the invalid callback, so the multi-error summary did not render. Production only was corrected to consume RHF's callback error argument. |
| First complete GREEN | Same exact targeted command | Exit `0`; 2/2 files and 22/22 tests passed in `2.64s`. |
| Scoped lint discovery | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec eslint -- --max-warnings 0 'src/app/(auth)/register/page.tsx' src/components/custom/RegistrationForm.tsx 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx` | Exit `1`; only `RegistrationForm.tsx` exceeded the repository 200-line rule. Duplicate local markup was reduced without changing assertions or scope. |
| Exact-call regression during line reduction | Exact targeted command | Exit `1`; 20/22 passed because passing `registerUser` directly let TanStack Query supply a second mutation-context argument. The final local one-argument wrapper restored the exact sole-request call contract. |
| Final authoritative direct GREEN | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx` | Exit `0`; 2/2 files and 22/22 tests passed in `2.36s`. |
| Final scoped format | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec prettier -- --check 'src/app/(auth)/register/page.tsx' src/components/custom/RegistrationForm.tsx 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx` | Exit `0`; all four files use Prettier style. |
| Final scoped zero-warning lint | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec eslint -- --max-warnings 0 'src/app/(auth)/register/page.tsx' src/components/custom/RegistrationForm.tsx 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx` | Exit `0`; zero warnings/errors. |
| Final TypeScript | `/opt/homebrew/opt/node@24/bin/node ./node_modules/typescript/bin/tsc --noEmit` | Exit `0`. |
| Final diff whitespace | `git diff --check` | Exit `0`. |

The final toolchain was Node `v24.18.0` and npm `11.11.0`. Direct GREEN proves all 22 current route/component expectations without skip/todo/only or weakened assertions.

### Scope and remaining gates

- This mission mutated exactly four paths: the two production files plus this ignored ATDD checklist and the ignored Story artifact. The existing contributor-owned direct tests, E2E proposal, and sprint-status changes were preserved byte-for-byte.
- Browser proposal enablement/execution, responsive/theme/real-focus/touch/axe/privacy evidence, universal local gates, build, exact eight-path frozen snapshot, sequential independent `APPROVE` then `CLEAR`, staging, Git integration, PR/merge, and branch/worktree cleanup remain pending. No skipped E2E proposal is counted as GREEN evidence.

## Browser/Accessibility/Privacy Evidence Attempt — 2026-08-14

This later checkpoint records the bounded Story 167.4 browser-owned mission after genuine direct RED and production GREEN. It does not rewrite the historical RED/GREEN records above. The browser tests are active and collectable, but the managed sandbox cannot bind or reach localhost services, so no rendered browser pass/fail result exists and Task 6 remains open.

### Mission baseline and prerequisite correction

- At `2026-08-14 10:34 MSK`, branch `cdx/epic-167-story-4-register`, `HEAD`, local `main`, and `merge-base HEAD main` all resolved to `c2a96943ff65a6ce60467608b01c17ad3a901716`; the index was empty and Story/sprint status was `in-progress`.
- Every supplied SHA-256 matched: sprint `1e70d799ced6942e2751586f6abb9dcaaa0788df963be2ddf4e9153600b87361`; route test `eac67057fbd77d8050168759afd8223ce35e90a4103fe7ca13e6ada32d22d917`; form test `f0e2ce9e2c5597b95f2ff1f758b1f5b898d447d8f4e294dc958b7d5507cfa8b2`; E2E `0b22abc4ce99f616bfc1c654f151790f98d7899d505fc3342d227bb97d54a936`; package `09291c9463d0f970c3013ab0a919cf95be3d6743d84f6f249002771c29305823`; lockfile `ac72c9297e4b457bee252f6297d81c381d4a7a1cf9c6cdef92ec3ad01a491ef9`; route production `98f19c1942ca6a4f071c9b2e007d5f649f334edfa73a08bc99d4041b48efa816`; form production `952ce64a20862ded9f9b7a84445dc5a97aec1d7cf09cd67ab320f1b84e85be8a`; Story artifact `78a05a495f8b04656d31fb40c99908873b7055a1903cf4032d2086bd7ab3e2d9`; and ATDD checklist `22aea9df448b9561c1ffe5151eb51dbbf55a08be3e9910849e1ab44d707500a9`.
- No local Story 167.3 branch, remote-tracking ref, or worktree entry exists. Root's authorized `2026-08-14 10:32 MSK` `git ls-remote --heads origin cdx/epic-167-story-3-login` result is exit `0` with empty output. This mission attempted a recheck, but DNS resolution for `github.com` was unavailable and the command exited `128`; that gap does not supersede the supplied authoritative absence result. Task 1 and its remaining subtask were closed in the Story artifact only; sprint status was not edited.

### Exact E2E mutation and byte-preservation evidence

- The complete mission-start file was copied to `/tmp/story-167-4-onboarding.mission-start.ts` with SHA-256 `0b22abc4ce99f616bfc1c654f151790f98d7899d505fc3342d227bb97d54a936` before editing.
- The only semantic test changes are the three registration-local `test.skip(` wrappers changed to `test(` for `REG-BROWSER-01`, `REG-BROWSER-02`, and `REG-BROWSER-03`. No assertion, route, selector, timeout, console policy, privacy oracle, touch context, or cleanup path was weakened or conditionally bypassed.
- Repository Prettier subsequently normalized only the existing `Register Page Functionality` block. A formatter preview proved its prefix and suffix were identical before application. Against the frozen mission-start file, the entire prefix before `Register Page Functionality` remains byte-identical with SHA-256 `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668`; the entire suffix beginning with `Authenticated Onboarding Tests` remains byte-identical with SHA-256 `685f8b06ba2b8cafe4ca739e3a1521c432370fadc992d7c575669f0d7b327665`.
- Current formatted E2E SHA-256 is `437e9c2b46b6a7c635c2c60283610f78b616094b63dca63cfed3303558596b85`. The owned registration block contains zero `test.skip()` calls and exactly one active title for each Story browser ID.

### Collection, service, and execution evidence

| Check | Exact command/action | Exit/result |
| --- | --- | --- |
| Toolchain | `/opt/homebrew/opt/node@24/bin/node --version`; `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm --version` | Exit `0`; Node `v24.18.0`; npm `11.11.0` |
| Service inspection | `lsof -nP -iTCP:3000 -sTCP:LISTEN`; `lsof -nP -iTCP:3100 -sTCP:LISTEN`; bounded `curl --max-time 5` probes | Contributor-owned backend listener PID `9905` exists on port 3000 and was not touched; no frontend listener existed; sandbox probes to both ports exited `7`/HTTP `000` |
| Pinned frontend attempt | From this exact worktree, `PATH=/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/bin:/bin /opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run dev`, with launcher PID `75789` captured explicitly | Exit `1` before readiness; Next.js reported `listen EPERM: operation not permitted 0.0.0.0:3100`; no listener was created and PID `75789` exited |
| Official preflight list-only | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run test:e2e -- e2e/onboarding.spec.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)' --list` | Exit `1` in `<1s`; preflight reported both frontend and backend unavailable; no Playwright process/test body/browser launched |
| Static CI list-only fallback | `CI=1 /opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)' --list` | Exit `0` in `<1s`; 7 tests in 1 file collected: 4 setup dependency tests and all 3 active Story IDs; no test body/browser/server ran |
| Official targeted execution attempt | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run test:e2e -- e2e/onboarding.spec.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'` | Exit `1` in `<1s` at preflight with frontend/backend unavailable; 0 Story tests executed |
| Post-format official rerun | Same exact official targeted command | Exit `1` in `<1s` at the same preflight boundary; 0 Story tests executed |
| Post-format static list rerun | Same static CI list-only command | Exit `0` in `<1s`; same 7 tests in 1 file collected, including all 3 active Story IDs |

The failure is an execution-environment blocker rather than a product or E2E assertion failure. The sandbox prevents binding the required frontend port and denies localhost probes even to the existing backend listener. Bypassing the preflight, weakening assertions, fabricating service health, or treating static collection as browser evidence was rejected.

### Static quality evidence after the final E2E edit

| Check | Exact command | Exit/result |
| --- | --- | --- |
| Prettier | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec prettier -- --check e2e/onboarding.spec.ts` | Exit `0`; file uses repository Prettier style |
| Scoped ESLint | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec eslint -- --max-warnings 0 e2e/onboarding.spec.ts` | Exit `0`; zero warnings/errors |
| TypeScript | `/opt/homebrew/opt/node@24/bin/node ./node_modules/typescript/bin/tsc --noEmit` | Exit `0` |
| E2E assertion policy | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run check:e2e-assertions` | Exit `0`; 19 files passed |
| Fixed-wait policy | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run check:e2e-waits` | Exit `0`; 47 owned targets are timer-free |
| Bare-skip policy | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run check:e2e-bare-skips` | Exit `0`; 0 bare skips |
| Diff whitespace | `git diff --check` | Exit `0` |

### Responsive, accessibility, interaction, and privacy disposition

| Required evidence | Current disposition |
| --- | --- |
| Widths `320/390/768/1024/1280/1440`, light/dark, 200%-equivalent reflow, reduced motion, Russian wrapping, no horizontal overflow, and `44×44` geometry | Assertions remain active in `REG-BROWSER-01`, but no rendered browser executed. **Gap, not pass.** |
| Keyboard-only task order, visible focus, Enter behavior, deterministic invalid/recovery focus, manual reading order, non-color meaning | Direct tests in the authoritative 22/22 GREEN prove deterministic invalid/recovery focus, associated/non-color text semantics, and Enter/duplicate locks. Real-browser keyboard focus order/indicator and manual reading-order review did not execute. **Partial direct evidence; browser/manual gap.** |
| Semantic `/login` navigation and real touch activation | Direct route tests prove the semantic link and exact `href`; active `REG-BROWSER-03` owns touch navigation but did not execute. **Direct semantic pass; touch gap.** |
| Automated accessibility | The authoritative direct 22/22 GREEN includes the encoded `jest-axe` default and service-feedback checks. No browser axe/equivalent scan executed in this mission because no page could launch. **Direct automated pass; browser automation gap.** |
| Hydration, strict unexpected console warnings/errors, and page errors | Active `REG-BROWSER-02` retains an empty allowlist and requires all warning/error/page-error arrays to be empty, but it did not execute. **Gap, not pass.** |
| Password masking and browser privacy | Direct tests prove password type/retention and safe hostile-detail exclusion. `REG-BROWSER-02` actively asserts no synthetic credentials in URL, observed history, serialized source, or console, with Playwright trace/screenshot/video disabled by configuration, but it did not execute. **Direct pass; browser-boundary gap.** |
| Screen reader and non-Chromium engines | Not available or executed in this bounded Chromium mission. **Explicit gap.** |

No screenshot, trace, video, Playwright test result, or browser storage state was produced by this mission. The temporary `.env.e2e` was a symlink to the authorized primary-checkout file rather than a credential copy; no environment value was printed. Final cleanup removed `playwright-report`, `test-results`, that exact symlink, the failed-launch PID/log files, the formatter preview, and the mission-start E2E copy. A concurrent process regenerated `test-results` after the first cleanup; after no relevant process or open file remained, the directory was rescanned for known synthetic credential markers (no matching path) and removed again. A final repository scan found no trace ZIP, screenshot, WebM/MP4 video, `user.json`, or `manager.json`; only the tracked `e2e/.auth/.gitkeep` remains. Captured mission PID `75789` is absent. Contributor-owned backend PID `9905` remains untouched. A later unowned frontend PID `82734` appeared with this shared worktree as cwd, but it is not the captured launcher, is unreachable from the sandbox, and was preserved untouched rather than killed or claimed.

### Browser checkpoint and handoff

- [x] Three Story-local skips removed; all three IDs are active and statically collectable.
- [x] Non-registration E2E prefix and suffix preserved byte-for-byte.
- [x] Prettier, zero-warning ESLint, TypeScript, assertion/wait/skip policies, and diff-check pass.
- [x] Official preflight reaches healthy frontend `localhost:3100` and backend `localhost:3000`.
- [x] `REG-BROWSER-01`, `REG-BROWSER-02`, and `REG-BROWSER-03` execute and pass in Chromium.
- [x] Browser/manual responsive, focus, touch, hydration, console, automated browser accessibility, and browser-boundary privacy evidence is collected.

Next handoff: run the unchanged official targeted command on an authorized host/runtime that can bind and reach ports 3100/3000, then update Task 6 only from genuine browser results. Universal gates, review, staging, commit, push, PR, merge, and cleanup remain Task 7/8 work; Status stays `in-progress`.

## Root-Host Chromium RED and Bounded Harness Repair — 2026-08-14

This append-only checkpoint preserves the managed-sandbox blocker above while recording the newer authoritative root-host execution. It diagnoses and repairs only the Story 167.4 registration block; it does not claim a post-repair browser rerun, production mutation, direct-test mutation, browser GREEN, universal-gate completion, review, staging, Git integration, or cleanup.

### Authoritative newer browser execution

The root host ran exactly:

```bash
/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test \
  e2e/onboarding.spec.ts \
  --config=/private/tmp/story1674-playwright.config.ts \
  --project=chromium \
  --grep 'REG-BROWSER-(01|02|03)'
```

The isolated configuration loaded the repository network-guard bootstrap, mutation guard, and outbound-network policy; used the Chromium Desktop device and an empty storage state; and kept trace, screenshot, and video capture off. Exit was `1`; three Story tests executed in about `37.8s`:

| Scenario | Real Chromium result | Decisive observed failure/pass |
| --- | --- | --- |
| `REG-BROWSER-01` | **FAIL** | Around original line 226, the exact text `Пароль должен содержать минимум 8 символов` never became visible after `password.fill('коротко')` and `password.press('Tab')`. |
| `REG-BROWSER-02` | **FAIL** | Around original line 356, the separate `page.waitForRequest(...)` observer timed out after the theme/focus loops, final navigation, valid fills, and submit click; no registration request was observed through that waiter. |
| `REG-BROWSER-03` | **PASS** | Real touch activation of the semantic `Войти` link navigated to `/login`. |

The earlier managed-sandbox record remains valid for that earlier environment: it executed zero browser tests. The root-host result is newer and authoritative for real Chromium behavior, so the truthful aggregate browser state is `01 FAIL / 02 FAIL / 03 PASS`, not GREEN.

### Failure diagnosis and smallest block-local repair

`REG-BROWSER-01` retained a correct seven-character intent but coupled it to a keyboard focus transition. The repair changes only the stimulus and blur mechanism:

- `password.fill('коротко')` → `password.fill('1234567')`;
- `password.press('Tab')` → `password.blur()`.

The value is unambiguously seven ASCII characters. The exact Russian message, `aria-invalid="true"`, wrapping, multi-line height, width, and viewport containment assertions are unchanged; no oracle is weakened.

`REG-BROWSER-02` had two harness-local synchronization risks before any production inference was justified:

1. `domcontentloaded` plus an SSR-visible heading did not prove that React Hook Form's on-blur handlers had hydrated and accepted the filled values.
2. The matching `page.route()` handler deliberately stalled the request behind `registrationResponseGate`, while a separate `page.waitForRequest(...)` promise was awaited before the gate was released. Playwright documents that routed requests stall until the handler fulfills, continues, or aborts them and exposes the request directly as `route.request()`/the handler request argument. Observing the already intercepted request inside that handler avoids an event-order dependency and a loose waiter.

The repaired deterministic sequence now:

1. captures only `{ method, pathname }` from `route.request()` immediately on interception, before awaiting the response gate;
2. uses the exact seven-character password plus explicit blur to require the exact Russian validation message and `aria-invalid="true"`, proving the RHF on-blur behavior is live;
3. fills the synthetic valid password, explicitly blurs, and requires the validation message to become hidden and `aria-invalid="false"`;
4. requires the exact final email/password control values, an enabled submit, and `form.checkValidity() === true` before activation;
5. clicks submit, requires the submit to become disabled as truthful pending-state proof, and uses guarded `expect.poll` to require the installed route to have observed exactly `POST /v1/auth/register`;
6. preserves the held response, source/URL/history/password privacy assertions, strict empty hydration/console/page-error allowlist, response release, and exact `/login` navigation.

The browser test does not inspect or print the request body. The already authoritative direct 22/22 GREEN remains the exact `{ email, password }` payload proof, so no cross-level payload duplication or credential-bearing diagnostic was added. No fixed wait, broad timeout, swallowed error, alternate endpoint, skip/todo/only, conditional pass, console allowlist, or production mutation was introduced.

### Post-edit non-browser validation

This bounded mission cannot claim a Chromium rerun. It ran only the requested deterministic static checks with Node `v24.18.0` and npm `11.11.0`:

| Check | Exact command | Exit/result |
| --- | --- | --- |
| E2E Prettier | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec prettier -- --check e2e/onboarding.spec.ts` | Exit `0`; matched repository style. |
| Scoped zero-warning ESLint | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm exec eslint -- --max-warnings 0 e2e/onboarding.spec.ts` | Exit `0`; zero warnings/errors. |
| TypeScript | `/opt/homebrew/opt/node@24/bin/node ./node_modules/typescript/bin/tsc --noEmit` | Exit `0`. |
| E2E assertion policy | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run check:e2e-assertions` | Exit `0`; 19 files passed. |
| Fixed-wait policy | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run check:e2e-waits` | Exit `0`; 47 owned targets are timer-free. |
| Bare-skip policy | `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run check:e2e-bare-skips` | Exit `0`; 0 bare skips. |
| Static Story collection | `/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)' --list` | Exit `0`; exactly 3 tests in 1 file, one active title for each Story ID. No test body/browser ran. |
| Diff whitespace | `git diff --check` | Exit `0`. |

Current E2E SHA-256 is `909b74cf545a374445b15031102eaeb06522f18bc6fe9c3f104f8dc6082e8046`. Against the frozen pre-diagnostic file, the prefix before `Register Page Functionality` remains byte-identical at `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668`, and the suffix beginning with the preceding newline before `Authenticated Onboarding Tests` remains byte-identical at `685f8b06ba2b8cafe4ca739e3a1521c432370fadc992d7c575669f0d7b327665`.

### Open browser checkpoint and exact root handoff

- [x] Preserve the earlier managed-sandbox blocker as historical evidence.
- [x] Record real root-host Chromium RED exactly as `REG-BROWSER-01` FAIL, `REG-BROWSER-02` FAIL, `REG-BROWSER-03` PASS.
- [x] Apply only the minimal registration-block harness repairs described above and keep all three Story IDs active.
- [x] Pass formatting, zero-warning lint, TypeScript, E2E assertion/wait/skip policies, static collection, diff whitespace, and protected prefix/suffix checks.
- [ ] Rerun the exact isolated root-host command after the repair and record all three independent outcomes.
- [ ] Close Task 6 browser-dependent subtasks only after genuine browser GREEN plus the required manual/browser evidence exists.

Root rerun must use the exact command in this section. Expected decisive evidence is: `REG-BROWSER-01` reaches the unchanged Russian wrapping/geometry oracles after explicit blur; `REG-BROWSER-02` proves RHF readiness, valid/enabled pre-submit state, disabled pending state, exact intercepted `POST /v1/auth/register`, privacy, clean console/page errors, response release, and `/login` navigation without a loose request waiter; and `REG-BROWSER-03` continues to pass touch navigation. Until that rerun is real, Task 6 and all browser-dependent subtasks remain open, Tasks 7–8 remain open, and Story/sprint status remains `in-progress`.

## Root-Host Identical Blur RED and Load/Keyboard Readiness Repair — 2026-08-14

This append-only checkpoint records the newer authoritative host Chromium result for E2E SHA-256 `909b74cf545a374445b15031102eaeb06522f18bc6fe9c3f104f8dc6082e8046` and the subsequent bounded browser-harness repair. It preserves every earlier checkpoint and does not claim a post-repair browser rerun or GREEN.

### Newer authoritative host result

The exact command was:

```bash
/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'
```

- Exit `1`; `3` tests executed; duration `13.0s`.
- `REG-BROWSER-01` **FAIL** at line `226`.
- `REG-BROWSER-02` **FAIL** at line `362`.
- `REG-BROWSER-03` **PASS**.
- Both failures were identical: after `password.fill('1234567')` and `password.blur()`, exact text `Пароль должен содержать минимум 8 символов` was not found within `5s`.
- The earlier request-observation timeout was not reached in this round.

This newer result proves that changing the value to seven ASCII characters and calling `blur()` explicitly did not establish React Hook Form handler readiness. Both failures occur immediately after the same final `page.goto(..., { waitUntil: 'domcontentloaded' })` pattern. The SSR-visible form and heading can therefore be actionable before the client `RegistrationForm` hydration has attached the `onBlur` path that owns the exact Russian validation message. Direct Vitest remains independently GREEN `22/22` for the same seven-character `onBlur` behavior, so no production or direct-test expansion is justified.

### Bounded event-driven repair

Only the existing Story 167.4 registration block changed:

1. The two final interaction navigations now wait for the browser `load` lifecycle event rather than stopping at `domcontentloaded`; no `networkidle`, fixed delay, or arbitrary timeout was added.
2. The invalid password is entered through `click()` plus `pressSequentially('1234567')`, followed by a real keyboard `Tab` focus transition. The unchanged exact Russian message and `aria-invalid="true"` assertions are the browser-observable proof that the hydrated RHF handler processed the blur.
3. `REG-BROWSER-02` corrects the password through `ControlOrMeta+A`, `pressSequentially(SYNTHETIC_PASSWORD)`, and keyboard `Tab`, then preserves the existing hidden-message, `aria-invalid="false"`, exact control-value, enabled-submit, and native-form-validity recovery oracles.
4. The exact intercepted `POST /v1/auth/register`, pending disabled-submit lock, held response, credential privacy, strict empty console/page-error evidence, response release, and one `/login` navigation remain unchanged. The request body is neither inspected nor logged; direct tests remain the payload proof.

No private React key, evaluate-dispatched synthetic event, conditional pass, retry, skip, `waitForTimeout`, sleep, swallowed error, weakened assertion, production change, direct-test change, package/config/planning change, or non-registration E2E change was introduced.

### Post-repair non-browser evidence

All checks used Node `v24.18.0` and npm `11.11.0`:

| Check | Result |
| --- | --- |
| E2E Prettier `--check` | Exit `0`; repository style matched. |
| Scoped ESLint `--max-warnings 0` | Exit `0`; zero warnings/errors. |
| TypeScript `tsc --noEmit` | Exit `0`. |
| `check:e2e-assertions` | Exit `0`; 19 files passed. |
| `check:e2e-waits` | Exit `0`; 47 owned targets are timer-free. |
| `check:e2e-bare-skips` | Exit `0`; 0 bare skips. |
| Exact isolated static collection with the host config and Story grep | Exit `0`; exactly 3 active tests in 1 file. No test body/browser ran. |
| `git diff --check` | Exit `0`. |

Post-repair E2E SHA-256 is `55351d51841d4932b20107ef5f9e738a48553010925a929d1514cf059b296c40`. The protected prefix remains `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668`, and the protected suffix remains `685f8b06ba2b8cafe4ca739e3a1521c432370fadc992d7c575669f0d7b327665`.

### Open checkpoint and exact root handoff

- [ ] Rerun the exact isolated host command above against E2E SHA-256 `55351d51841d4932b20107ef5f9e738a48553010925a929d1514cf059b296c40` and record all three independent outcomes.
- [ ] Claim browser GREEN only if the real rerun passes the unchanged decisive oracles.
- [ ] Keep Task 6 and every browser-dependent subtask open until genuine browser/manual evidence exists.

Tasks 7–8 remain open, Story/sprint status remains `in-progress`, and no browser GREEN, universal-gate completion, review, staging, commit, push, PR, merge, or cleanup is claimed.

## Root-Host Pending Accessible-Name Failure and Bounded Oracle Repair — 2026-08-14

This append-only checkpoint records the newer authoritative host result for E2E SHA-256 `55351d51841d4932b20107ef5f9e738a48553010925a929d1514cf059b296c40` and the subsequent Story-block-only locator repair. It preserves every prior result and does not claim a post-repair browser rerun or GREEN.

### Newer authoritative host result

The exact command was:

```bash
/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'
```

- Exit `1`; `3` tests executed; duration `8.6s`.
- `REG-BROWSER-01` **PASS** in `1.9s`.
- `REG-BROWSER-02` **FAIL** in `5.6s`.
- `REG-BROWSER-03` **PASS** in `239ms`.
- `REG-BROWSER-02` reached submit successfully, then line 381 `await expect(submit).toBeDisabled()` timed out because `submit` remained a role/name locator for accessible name `Зарегистрироваться`. During the held pending request, production changed the same button's accessible name to `Регистрация...`, so the name-bound locator no longer matched even though the real button was disabled and busy.

The generated residue corroborated the host diagnosis before cleanup. `test-results/.last-run.json` reported status `failed` and failed test ID `fe534f0825407f213faa-46e826f1954818256fa3` (SHA-256 `ea6cfa07daf88106b9a2f82245a35dd893f9a899e45f93d8fe380d9a327b3f58`). `test-results/onboarding-Onboarding-Flow-72e8b-tion-and-credential-privacy-chromium/error-context.md` recorded `element(s) not found` for the old `Зарегистрироваться` locator while its accessibility snapshot showed disabled email/password controls and a disabled button named `Регистрация...` (SHA-256 `24aa6c76ef99cf215546f7a5de76645f4c90f1a4d9e611e37832f17b4c696424`). This is decisive E2E oracle/locator evidence, not a production failure.

### Smallest pending-state oracle repair

- The earlier exact enabled `Зарегистрироваться` pre-submit oracle remains unchanged.
- Immediately after activation, the test now resolves the real pending button with `page.getByRole('button', { name: 'Регистрация...', exact: true })`.
- The pending button must be disabled and must expose `aria-busy="true"`; the repair therefore preserves and strengthens truthful pending semantics.
- The intercepted exact `POST /v1/auth/register`, source/URL/history/console credential-privacy checks, masked password, held response, strict empty console/page-error oracles, and one `/login` navigation remain unchanged.
- No assertion was removed or weakened, and no wait, retry, skip, conditional, timeout expansion, production edit, direct-test edit, package/config/lock/planning edit, or non-registration E2E change was introduced.

No post-repair browser rerun occurred, so browser GREEN is not claimed. Task 6 and every browser-dependent subtask remain open; Tasks 7–8 remain open; Story/sprint status remains `in-progress`; and no universal-gate completion, independent review, staging, commit, push, PR, merge, or cleanup is claimed.

## Root-Host During-Submission Privacy-Oracle Failure and Bounded Repair — 2026-08-14

This append-only checkpoint records the newest authoritative host result and repairs only the contradictory during-submission privacy oracle inside the existing Story 167.4 registration block. It preserves all earlier evidence and makes no post-repair browser rerun or GREEN claim.

### Newest authoritative host result and residue

The exact command was:

```bash
/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'
```

- Exit `1`; three tests completed in `3.5s`.
- `REG-BROWSER-01` **PASS** in `1.8s`.
- `REG-BROWSER-02` **FAIL** in `578ms`.
- `REG-BROWSER-03` **PASS** in `232ms`.
- The repaired accessible-name, disabled-state, and `aria-busy` pending oracles passed. Execution reached line `394`, where `expect(sourceDuringSubmission).not.toContain(SYNTHETIC_EMAIL)` failed.
- Playwright `page.content()` serialized the live disabled email input with the exact value that the same test intentionally requires it to retain. The failure context also showed the masked password input retaining its exact required value. Treating either intended input's own value carrier as a leak contradicts the preceding exact value and masking assertions; this is an E2E privacy-oracle defect, not a production defect.
- Before cleanup, `test-results/.last-run.json` matched SHA-256 `ea6cfa07daf88106b9a2f82245a35dd893f9a899e45f93d8fe380d9a327b3f58`, and `test-results/onboarding-Onboarding-Flow-72e8b-tion-and-credential-privacy-chromium/error-context.md` matched SHA-256 `47d7901c1cb499bd4daf189f09ec93717ab81c6571a28e668719b0e0e2aab8ed`.
- The earlier managed-sandbox launch attempt remains historical only: it failed before any test body because Chromium was denied the required MachPort permission, so it is not product RED.

### Smallest deterministic privacy-oracle repair

The exact email/password input value assertions and `type="password"` masking oracle remain unchanged. The contradictory whole-live-DOM string assertion is replaced by one detached-clone scan:

1. Count the intended registration email and password controls using the registration form plus exact `name`, `type`, and `autocomplete` identities.
2. Require exactly one intended email control and exactly one intended password control.
3. Clone `document.documentElement` without mutating the live page.
4. Only when both counts equal one, blank and remove the `value` property/attribute on those two exact cloned controls and no other node or attribute.
5. Serialize the detached clone and return only the two counts plus booleans reporting whether either synthetic credential occurs anywhere else. Scripts, document text, every other element, and every other attribute remain within the scan, while failures cannot print the whole document.

The URL, observed-history, console, post-navigation source, request path/method, held response gate, strict console/page-error, and exactly one `/login` navigation oracles remain unchanged. The request body is not inspected or printed. No assertion was removed or weakened; no waits, retries, skips, conditionals, timeout expansion, test-only production hook, alternate endpoint, production change, direct-test change, sprint change, package/lock/config/planning change, or non-registration E2E change was introduced.

No post-repair Chromium rerun occurred, so browser GREEN is not claimed. Task 6 and all browser-dependent subtasks remain open; Tasks 7–8 remain open; Story/sprint status remains `in-progress`; and no universal-gate completion, independent review, staging, commit, push, PR, merge, or lifecycle cleanup is claimed.

### Post-repair static evidence and safe residue cleanup

All checks used Node `v24.18.0` and npm `11.11.0`:

| Check | Result |
| --- | --- |
| E2E Prettier `--write` | Exit `0`; the owned file was formatted with the pinned repository Prettier. |
| Scoped ESLint `--max-warnings 0` | Exit `0`; zero warnings/errors. |
| TypeScript `tsc --noEmit` | Exit `0`. |
| `check:e2e-assertions` | Exit `0`; 19 files passed. |
| `check:e2e-waits` | Exit `0`; 47 owned targets are timer-free. |
| `check:e2e-bare-skips` | Exit `0`; 0 bare skips. |
| Exact isolated Story collection | Exit `0`; exactly 3 active tests in 1 file. No test body/browser ran. |
| `git diff --check` | Exit `0`. |

Final E2E SHA-256 is `79afffd5585a5e7f57c13867fb08a5c78805f25d0f6e3b2e3b697862c7bc949f`. Replacing only the new detached-clone scan with the prior six-line live-source oracle reconstructs preflight SHA-256 `6135f352feda4fc63742e67ff21c6a61714e6781a6556534cbbbd05a7f375e9f`, proving the mission delta is confined to that oracle. Protected prefix/suffix SHA-256 remain `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668` and `685f8b06ba2b8cafe4ca739e3a1521c432370fadc992d7c575669f0d7b327665`.

Contributor-owned sprint, direct-test, route/form production, package/lock/plan, and Playwright network/mutation/outbound policy files retained their preflight hashes. The Git index remains empty. The exact eight-path lifecycle manifest is unchanged when these two ignored append-only evidence artifacts are included with the six tracked Story paths.

Before cleanup, both browser residue files re-matched the recorded hashes, were confirmed ignored and untracked, and had no open file handles. Only the generated ignored `test-results` directory was removed, and its absence was verified. Backend PID `9905` and frontend PID `82734` were left untouched.

Chromium was not rerun. Task 6/browser subtasks, Task 7, Task 8, Story, and sprint remain open/`in-progress`; browser GREEN and every later lifecycle gate remain unclaimed.

## Authoritative Root-Host Chromium GREEN — 2026-08-14

This append-only checkpoint supersedes only the prior post-repair no-rerun gap. It preserves every historical RED, diagnosis, repair, and managed-sandbox record above. The final registration E2E file remained byte-identical at SHA-256 `79afffd5585a5e7f57c13867fb08a5c78805f25d0f6e3b2e3b697862c7bc949f`.

### Exact command and independent results

The newest authoritative root-host execution was exactly:

```bash
/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'
```

- Exit `0`; one worker; `3 passed (3.2s)`.
- `REG-BROWSER-01` **PASS** in `1.8s`.
- `REG-BROWSER-02` **PASS** in `624ms`.
- `REG-BROWSER-03` **PASS** in `208ms`.
- The sole `NO_COLOR`/`FORCE_COLOR` process warning is non-product. It is outside the rendered application channels and does not weaken the unchanged `REG-BROWSER-02` requirement that the in-page warning/error console collection and page-error collection are empty.

### Evidence disposition

- `REG-BROWSER-01` proves the unchanged six-width light/dark matrix, 200%-equivalent reflow, reduced-motion execution, Russian validation wrapping and non-color invalid semantics, lack of page-level horizontal overflow, and `44×44` minimum primary-control geometry.
- `REG-BROWSER-02` proves keyboard-only task order and visible focus in light/dark themes; hydrated seven-character on-blur invalidity and valid-password recovery; masked password; exact intended input values; enabled/native-valid pre-submit form; disabled `aria-busy` pending state; exact intercepted `POST /v1/auth/register`; credential absence outside the two intended cloned input value carriers and from URL, observed history, post-navigation source, and console; strict clean hydration-warning/console/page-error channels; held-response release; and `/login` navigation.
- `REG-BROWSER-03` proves real touch activation of the semantic Russian `Войти` link and navigation to `/login`.
- The run did not execute axe, a screen reader, non-Chromium engines, or a human manual reading-order/non-color/responsive review. The combined automated browser accessibility/manual-review checkbox remains open; no unsupported manual or assistive-technology pass is claimed.

### Residue, hashes, and lifecycle boundary

- The only successful generated residue was `test-results/.last-run.json`, with exact content `status: passed` and `failedTests: []`, SHA-256 `91d1c43004802cd49950d78eb11c8fa7d05da8ffffe219a8b13b2f561bc00903`, ignored by `.gitignore:46:/test-results/`, untracked by Git, and unopened according to empty `lsof -- test-results/.last-run.json` output. Only that generated `test-results` residue was removed; its absence was then verified. No backend or frontend process was manipulated.
- Protected E2E prefix/suffix SHA-256 values remain exact at `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668` and `685f8b06ba2b8cafe4ca739e3a1521c432370fadc992d7c575669f0d7b327665`. The Git index remains empty, and every production, direct-test, E2E, sprint, package/lock/config/planning, and other contributor-owned byte remains unchanged by this evidence mission.
- Story Task 6 and its enabled-scenarios, classification/execution, and browser matrix subtasks are closed. The combined automated-accessibility/manual-review subtask stays open as the explicit gap above. Tasks 7–8 stay open; Story/sprint remains `in-progress`; and no universal gates, independent review, review-ready/staging state, commit, push, PR, merge, branch/worktree cleanup, Story completion, or deployment is claimed.

## Final Accessibility, Contrast, Universal-Gate, and Scope Evidence — 2026-08-14

This append-only checkpoint supersedes only the prior current-state Task 6 inconsistency. The earlier unavailable/RED/no-rerun checkpoints remain historical evidence. Independent review correctly rejected closing Task 6 while its accessibility child was still a gap: a gap is not a pass.

### Automated and manual browser accessibility closure

- Existing `REG-BROWSER-01` now performs a dynamic `@axe-core/playwright` scan limited to semantic `main`, tagged `wcag2a` and `wcag2aa`, at the stable 320px default state in both light and dark themes. The non-registration prefix SHA-256 remained exact at `2339c9d40ba61cf91f2246f21e03007ad0e10d27363e95fdb09a83db23dae356`; the suffix SHA-256 remained exact at `d052f7bc64b2cb157465fd13099445f06fe99f9ca68aa3dbc25979685e6f7966`.
- Manual Chromium review proved keyboard order email → password → submit → semantic `/login`, visible focus on all four, Enter invalid submission, exactly one semantic `main`, one `h1`, and one named form, focus on the first invalid email, a focusable named summary, associated text errors, and non-color error meaning.
- Responsive review proved no overflow at `320`, `720`, or `1440` CSS px and acceptable light/dark wrapping. Browser warning/error collection remained empty: `0` warnings and `0` errors.
- Screen-reader operation and non-Chromium engines were unavailable. They remain explicit coverage gaps and are not reported as PASS.

### Input-border contrast RED→GREEN and final Chromium rerun

- Visual review found default input-border contrast failures of `1.88:1` in light theme and `2.70:1` in dark theme.
- The bounded repair added only semantic `border-foreground/50` to the two Story inputs plus direct assertions. Targeted RED was `1 failed/21 passed` of `22` in `2.72s`; targeted GREEN was `22/22` in `2.35s`.
- Post-repair screenshots passed at `3.19:1` light and `5.17:1` dark. Visual change was confined to the two input-boundary pixel regions.
- The final authoritative host execution used the exact existing command:

```bash
/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'
```

- Exit `0`; `REG-BROWSER-01` **PASS** in `2.5s`; `REG-BROWSER-02` **PASS** in `722ms`; `REG-BROWSER-03` **PASS** in `238ms`; `3/3` passed in `4.0s`.
- The official preflight was healthy and the automated/manual browser-accessibility checklist item is now closed from real evidence. Task 6 and all of its children are complete without inferring screen-reader or non-Chromium results.

### Final universal sequence and exact-scope audit

All universal checks used pinned Node `24.18.0` and npm `11.11.0` and exited `0`: targeted `22/22` in `2.66s`; full Vitest `1135/1135` files and `18445/18445` tests in `220.77s`; format; zero-warning lint; type-check; max-lines; privacy scan; `29/29` privacy tests; E2E assertion, wait, and bare-skip policies; production build of `70` static pages; and Git diff-check.

The read-only exact-scope audit parsed the full sprint-status YAML document and proved:

- branch `cdx/epic-167-story-4-register`;
- HEAD and merge-base `c2a96943ff65a6ce60467608b01c17ad3a901716`;
- the exact eight-file manifest, comprising six tracked files plus two ignored artifacts;
- empty Git index and zero non-ignored untracked files;
- empty immutable/forbidden diff;
- only `e2e/onboarding.spec.ts` contains the two deliberate synthetic credential constants; and
- browser residue is absent.

Task 7 universal-gate and exact-scope-audit subtasks are complete. Deterministic snapshot freeze, sequential independent reviews, review-ready/staging state, and integration remain open. Story and sprint remain `in-progress`; screen-reader and non-Chromium coverage remain explicit unavailable gaps.

## Historical Earlier Review 1 `REJECT`, Ownership Adjudication, and Repair GREEN — 2026-08-14

This append-only checkpoint preserves every earlier RED, blocked-host, diagnostic, browser RED, GREEN, contrast, manual-review, and universal-gate record above. It updates only the current ATDD phase/summary and records the later Review 1 repair evidence. It does not convert older checkpoints into current claims.

### Terminal verdict and four accepted findings

This earlier review checkpoint, distinct from the current candidate review recorded at the end of this artifact, ended with terminal verdict **`REJECT`**. Its four findings were accepted:

1. **HIGH:** missing pre-hydration credential-control lock.
2. **HIGH:** the shared `apiClient`/`logApiError`/`logger` path may log raw or serialized non-2xx bodies.
3. **MEDIUM:** missing corrected-email retry test after duplicate `409`.
4. **LOW:** active E2E/ATDD wording still described the current state as RED/`36px`.

Review 1 is not approval evidence. The Task 7 snapshot-freeze, review, and freeze/review-ready subtasks remain open, and Task 8 remains open.

### Independent ownership adjudication: `OUT_OF_SCOPE_BASELINE_GAP`

The shared raw non-2xx logging defect is real, but it is not owned by Story 167.4. Canonical Story 164.1 currently regression-locks that shared behavior. API/client/interceptor/logger paths are forbidden here, and no bypass, monkey-patch, direct `fetch`, alternate client, or assertion weakening is allowed. Shared redaction is deferred to a separately owned follow-up provisionally named **`Shared API Error-Logging Redaction`**. It is not a prerequisite and does not block Story 167.4 after truthful claim narrowing.

Current evidence is deliberately separated:

- the successful browser path has clean in-page console and page-error evidence;
- hostile component errors are not rendered;
- direct component tests mock `registerUser`;
- at that historical Review 1 checkpoint, Story 167.4 had not executed or repaired the real shared non-2xx logging path; and
- the shared baseline concern was therefore left open for separately owned redaction work.

Accordingly, Story 167.4 does not claim that all real non-2xx registration response bodies are absent from console/log output. The canonical route-level credential/privacy requirements remain unchanged.

### Authoritative targeted repair RED

The exact targeted repair RED was exit `1`; `1` failed file/`1` passed file; `2` intended failures/`22` passes/`24` total:

1. SSR/pre-hydration named email, password, and submit controls were enabled.
2. Stale duplicate feedback survived email correction after a duplicate `409`.

### Implemented behavior and final targeted GREEN

- SSR/pre-hydration named email, password, and submit controls are disabled.
- Native `FormData` contains no credential keys before hydration.
- The form has no explicit native `method` or `action`.
- Hydration is not request-busy and the label remains `Зарегистрироваться`.
- Controls enable after hydration.
- Duplicate feedback clears on email change.
- The retained password stays masked.
- One deliberate corrected-email retry makes exactly one additional exact `{ email, password }` request and one `/login` transition.
- The active E2E label/comment now describes the current usable `44px` contract rather than RED/inherited `36px`; the historical `RED-BROWSER-LATER`/`h-9`/`36px` checkpoints above remain preserved in their original context.

Final targeted GREEN was exactly `2/2` files and `24/24` tests passed. The post-compaction rerun repeated `2/2` files and `24/24` tests passed in `2.57s`.

At that bounded repair checkpoint, Task 6 and all children remained complete because later dynamic axe, manual keyboard/focus/reading-order/non-color/responsive review, contrast evidence, and final `3/3` Chromium evidence genuinely superseded the earlier gap. Screen-reader and non-Chromium coverage remained explicitly unavailable and were never PASS. That checkpoint itself did not claim fresh post-repair Chromium, full-suite, or production-build evidence; the later authoritative sections recorded those checks. Review approval, a current freeze/review-ready state, staging, integration, and cleanup remain unclaimed. Story and sprint remain `in-progress`; Task 7 review/freeze work and Task 8 remain open.

## Authoritative Post-Review-1 Validation and E2E Synchronization GREEN — 2026-08-14

This append-only checkpoint supersedes only the live/current no-rerun and ungated handoff language above. It preserves every historical RED, blocked-host, diagnostic, accessibility, contrast, browser, universal, Review 1 `REJECT`, ownership-adjudication, and unavailable-coverage checkpoint without converting an older result into a current claim. The front matter remains `tddPhase: green`.

### Fresh targeted evidence

The exact pinned direct command was:

```bash
/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx
```

It exited `0`: `2/2` files and `24/24` tests passed in `2.83s`.

### First post-repair Chromium result and bounded E2E-only synchronization repair

The first fresh post-repair host Chromium execution used the existing isolated command against `/private/tmp/story1674-playwright.config.ts`:

```bash
/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'
```

- `REG-BROWSER-01` **PASS** in `2.1s`.
- `REG-BROWSER-02` **FAIL** in `5.1s`.
- `REG-BROWSER-03` **PASS** in `240ms`.
- Total: `1 failed/2 passed`.

The failure was an E2E synchronization defect: the first `Tab` occurred after `domcontentloaded` while the intentional pre-hydration credential lock still disabled the named controls. Production behavior was correct and remained unchanged.

The bounded repair changed only `e2e/onboarding.spec.ts`. It added web-first enabled assertions for the named email, password, and submit controls immediately before the real per-theme Tab-order loop. It added no sleep, forced focus/click, retry, skip, assertion weakening, or production change. Final E2E SHA-256 is `557f332263a5a84847834d7a898b33f053eeb64a2d9837db7f87ea046409eac8`; protected prefix SHA-256 is `2339c9d40ba61cf91f2246f21e03007ad0e10d27363e95fdb09a83db23dae356`; protected suffix SHA-256 is `d052f7bc64b2cb157465fd13099445f06fe99f9ca68aa3dbc25979685e6f7966`.

### Authoritative Chromium rerun

The authoritative fresh host rerun of the same isolated command exited `0`:

- `REG-BROWSER-01` **PASS** in `2.0s`.
- `REG-BROWSER-02` **PASS** in `689ms`.
- `REG-BROWSER-03` **PASS** in `198ms`.
- Total: `3/3` passed in `3.3s`.

Generated ignored `test-results/.last-run.json` reported passed status with zero failed tests. It was verified ignored, untracked, and unopened, then removed. No service or browser process was manipulated.

### Pinned universal/local gates and exact-scope evidence

The pinned Node `24.18.0`/npm `11.11.0` universal sequence exited `0` for every check: format check; zero-warning lint; type-check; max-lines; privacy scan; privacy tests `29/29`; E2E assertion, wait, and bare-skip policies; full Vitest `1135/1135` files and `18447/18447` tests in `152.24s`; production build compiled in `6.1s`, finished TypeScript in `14.7s`, and generated `70/70` static pages; and `git diff --check`.

Documentation and structural checks were also truthful and complete:

- `npm run check:docs` matched the existing baseline of exactly `18` broken historical citations.
- `npm run check:markers` found `0` violations across `30` files.
- The complete sprint YAML and ATDD front matter parsed successfully.
- Package/lock diff is zero.
- The corrected exact-scope audit passed with the exact eight-file manifest: six tracked changes plus two ignored artifacts, empty Git index, zero non-ignored untracked paths, empty immutable/forbidden diff, and no browser residue.
- Only `e2e/onboarding.spec.ts` carries the two deliberate synthetic credentials.
- The protected prefix and suffix hashes are exact at `2339c9d40ba61cf91f2246f21e03007ad0e10d27363e95fdb09a83db23dae356` and `d052f7bc64b2cb157465fd13099445f06fe99f9ca68aa3dbc25979685e6f7966`.

### Current lifecycle and claim boundary

- Task 6 remains complete.
- Task 7 universal/local-gate and exact-scope subtasks are complete.
- Task 7 deterministic freeze plus the sequential independent `APPROVE` then `CLEAR` pair remain open.
- Task 8 remains open.
- Story and sprint remain `in-progress`.

No approval, frozen candidate, review-ready transition, staging, commit, push, PR, merge, cleanup, or deployment is claimed.

## Historical Candidate 1 Review, 25-Test Repair, and Revalidation — 2026-08-14

This was authoritative for candidate 1 when recorded. It is now historical and superseded by the frozen-candidate-2 repair/current-byte checkpoint below; all earlier RED, GREEN, blocked-host, browser, accessibility, contrast, and review evidence remains preserved as chronology.

### Reviewed freeze and pre-edit manifest hashes

- `/private/tmp/story1674-candidate-freeze-1.sha256` had SHA-256 `6b0c1c40f15f6044640ac68d3732bfce1bf03b83cc53ffdc43e626654115da0f`.
- All eight freeze entries matched before the current independent review. Accepted repairs changed Story-owned bytes, so that freeze is now invalidated and is not a current integration snapshot.
- Documentation-synchronization pre-edit SHA-256 values were:

| Exact manifest path | Pre-edit SHA-256 |
| --- | --- |
| `_bmad-output/implementation-artifacts/167-4-fe-migrate-registration-register.md` | `a2d0f4db98cc67fbbf425945c224c692dc771e4fd550d73d49ca49ee4126c526` |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | `1e70d799ced6942e2751586f6abb9dcaaa0788df963be2ddf4e9153600b87361` |
| `_bmad-output/test-artifacts/atdd-checklist-167.4.md` | `f1e5b6063e3c422b61680bd019d19d968dc8bbf020e65035c04c3db701d70d32` |
| `e2e/onboarding.spec.ts` | `1f3996cf22aad6c3921431f456d4d04dd53b193d03ebbd742a734e11b743b2ca` |
| `src/app/(auth)/register/__tests__/page.test.tsx` | `eac67057fbd77d8050168759afd8223ce35e90a4103fe7ca13e6ada32d22d917` |
| `src/app/(auth)/register/page.tsx` | `98f19c1942ca6a4f071c9b2e007d5f649f334edfa73a08bc99d4041b48efa816` |
| `src/components/custom/RegistrationForm.test.tsx` | `63cb4d8cb1e1f400dc5b3e30b375dc20fdb67cf010046da0b0edd5960485b387` |
| `src/components/custom/RegistrationForm.tsx` | `e75d708680e3b562b3cac1a5ee8b00a9e79c195cad5ef34fbc5441e94dd59537` |

### Independent review terminal `REJECT`

- Runtime: `/private/tmp/story1674-omx-runtime-review1-approve`.
- Slug: `story1674-review1-approve`.
- Terminal reviewer line: **`VERDICT: REJECT`**. The mission process completing is not an `APPROVE` verdict.
- The four accepted Story-owned findings were exactly:
  1. **HIGH:** network recovery `Повторить` bypassed RHF validation by directly mutating `form.getValues()`.
  2. **MEDIUM:** the recovery button inherited 36px `h-9` and lacked a 44px minimum.
  3. **MEDIUM:** independently stored multi-error summary/association stayed stale after live corrections.
  4. **MEDIUM:** the then-current Story paragraph falsely claimed no fresh Chromium/full-suite/build despite already recorded GREEN evidence.

Finding 4 is corrected in the Story: no live/current sentence says fresh Chromium, full-suite, or build evidence is absent. Historical no-rerun/no-build claims remain explicitly bounded to their original checkpoint.

### Bounded production/test repair mission

- Runtime: `/private/tmp/story1674-omx-runtime-review-repair`.
- Slug: `story1674-review-repair`.
- Terminal result: **PASS**.
- Decisive repair RED: exit `1`; `1` failed file/`1` passed file; `4` intended failures/`21` passes/`25` total in `4.08s`.
- Production GREEN: `2/2` files and `25/25` tests passed in `2.88s`.
- Final targeted rerun: `2/2` files and `25/25` tests passed in `2.89s`.
- Final repaired source SHA-256 values: `src/components/custom/RegistrationForm.tsx` `e75d708680e3b562b3cac1a5ee8b00a9e79c195cad5ef34fbc5441e94dd59537`; `src/components/custom/RegistrationForm.test.tsx` `63cb4d8cb1e1f400dc5b3e30b375dc20fdb67cf010046da0b0edd5960485b387`.

The repair behavior is directly covered:

- `Повторить` enters through the same `form.handleSubmit(onSubmit, onInvalid)` boundary as normal submission, with the synchronous lock still inside `onSubmit`.
- Recovery attempts after editing to empty, malformed-email, or short-password values create no request and focus the first invalid field.
- Correcting those values and retrying creates exactly one additional exact request and exactly one `/login` transition.
- `Повторить` has Story-local `min-h-11 min-w-11`.
- Summary visibility and `aria-describedby` association derive from current RHF errors and disappear after live correction.

### First post-repair Chromium RED and one-line E2E repair

The first authoritative post-repair Chromium run was honest E2E RED: `REG-BROWSER-01` failed because `password.fill()` did not blur the field whose validation mode is `onBlur`; `REG-BROWSER-02` and `REG-BROWSER-03` passed; total `1 failed/2 passed`.

- E2E-only runtime: `/private/tmp/story1674-omx-runtime-browser-red-repair-2`.
- Slug: `story1674-browser-red-repair-2`.
- Terminal result: **PASS**.
- Exactly one real `page.keyboard.press('Tab')` was added inside the Story-owned block.
- Protected prefix SHA-256 stayed `2339c9d40ba61cf91f2246f21e03007ad0e10d27363e95fdb09a83db23dae356`.
- Protected suffix SHA-256 stayed `d052f7bc64b2cb157465fd13099445f06fe99f9ca68aa3dbc25979685e6f7966`.
- Final E2E SHA-256 is `1f3996cf22aad6c3921431f456d4d04dd53b193d03ebbd742a734e11b743b2ca`.

### Final Chromium, independent targeted, and universal results

The authoritative Chromium command was exactly:

```bash
/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'
```

It exited `0`:

- `REG-BROWSER-01` **PASS** in `2.0s`.
- `REG-BROWSER-02` **PASS** in `655ms`.
- `REG-BROWSER-03` **PASS** in `197ms`.
- Total: `3/3` passed in `3.3s`.

The executed browser evidence includes light/dark 320px one-shot synthetic `503` recovery and computed rendered `Повторить >=44x44`. Existing dynamic axe and manual accessibility evidence remains valid. Screen-reader and non-Chromium coverage remains explicitly unavailable, not PASS.

The independent targeted rerun passed `2/2` files and `25/25` tests in `3.17s`.

Fresh universal evidence:

| Check | Authoritative disposition |
| --- | --- |
| Format | Passed |
| Zero-warning lint | Passed |
| Typecheck | Passed |
| Max-lines | Passed |
| Privacy scan | Passed |
| Privacy tests | `29/29` passed |
| E2E assertion policy | Passed |
| E2E fixed-wait policy | Passed |
| E2E bare-skip policy | Passed |
| Documentation baseline | Passed with exactly `18` historical broken citations |
| Story markers | `0` violations across `30` files |
| Diff whitespace | `git diff --check` passed |
| First sandboxed full Vitest | One environment-only ephemeral-listener `EPERM`; `1134/1135` files and `18447/18448` tests passed |
| Authoritative localhost-bind full Vitest rerun | Exit `0`; `1135/1135` files and `18448/18448` tests in `207.56s` |
| First sandboxed production build | Turbopack port-bind `EPERM` |
| Authoritative production build | Compiled in `6.7s`; finished TypeScript in `13.9s`; `70/70` static pages generated |

### Historical candidate-1 ATDD/lifecycle boundary

- `tddPhase: green` remains truthful.
- Task 6 remains complete.
- Task 7 universal/exact-scope children remain complete; its deterministic freeze and both sequential reviews remain open.
- Task 8 remains open.
- Story and sprint remain `in-progress`; sprint status is read-only in this synchronization.
- No current `APPROVE` or `CLEAR`, valid freeze, review-ready transition, staging, commit, push, PR, merge, cleanup, or deployment is claimed.
- Required root handoff: create a new deterministic freeze over the current exact eight paths, then restart sequential review with terminal `APPROVE` first and terminal `CLEAR` second, both on the identical new frozen hash.

## Frozen-Candidate 2 Review Repair and Authoritative Current-Byte Evidence — 2026-08-14

### Review verdict, accepted findings, and invalidated freeze

- Old freeze: `/private/tmp/story1674-candidate-freeze-2.sha256`; SHA-256 `1ceac9eeb70a2dec882eed98a2efdf7409c9a5fad37f55cbe99cd1a2087bcc65`.
- Independent review runtime: `OMX_ROOT=/private/tmp/story1674-omx-runtime-review2-approve-2`; slug `story1674-review2-approve-2`. The terminal process passed, but the terminal review verdict was **`VERDICT: REJECT`**. It is not `APPROVE` evidence.
- The freeze was valid at review time and intentionally invalidated by the accepted repair. Its final check produced five `OK` entries and exactly three failures: `src/components/custom/RegistrationForm.tsx`, `src/components/custom/RegistrationForm.test.tsx`, and the Story-owned registration block of `e2e/onboarding.spec.ts`.
- Accepted findings: **HIGH** safely interpret established lower-cased `password`/`пароль` policy signatures without raw detail while retaining masking, truthful focus/association, and stale-feedback clearing on password edit; **HIGH** correct the synthetic-`503` production/logger evidence boundary; **HIGH** replace the permanent-base-shadow focus false positive with a real before/after computed-style delta; **LOW** use one authoritative fresh Chromium timing set.

### Honest direct RED → GREEN

- The first selector-authoring failure did not reach the intended oracle and is explicitly non-counted.
- After correcting only the selector, authoritative RED ran against byte-identical production/E2E: `2` files total; `1` failed, `1` passed; `1` intended failure and `25` passes of `26`; received generic service feedback rather than `Пароль не соответствует требованиям.`; duration `2.90s`; exit `1`. Log: `/private/tmp/story1674-review2-repair-red-authoritative.log`, SHA-256 `bc598e92fbacf5829a0001dad3ee369fc9ca42c5d9425394b6f00836b263f6dd`.
- After the minimal production repair and final max-lines-safe compaction, GREEN passed `2/2` files and `26/26` tests in `2.91s`, exit `0`. Log: `/private/tmp/story1674-review2-repair-green-final.log`, SHA-256 `01f264e1007a96bbdeb01faa90c1d780824a54660a64595f7a02b6bcb8da5f37`.
- The repaired direct evidence proves safe password-policy feedback for established lower-cased English/Russian signatures, no raw backend detail, retained password masking, deterministic focused/associated feedback, and stale-feedback removal on password edit.

### Browser focus and exact non-2xx/logger evidence boundary

- Authoritative Chromium: `REG-BROWSER-01` **PASS** `2.2s`; `REG-BROWSER-02` **PASS** `697ms`; `REG-BROWSER-03` **PASS** `205ms`; `3/3` passed in `3.5s`, Chromium, one worker, retries `0`.
- The strengthened focus oracle covers email, password, submit, and semantic login link in light and dark themes. For each control it records unfocused computed styles, presses real `Tab`, preserves `toBeFocused()`, then requires either changed box-shadow or a changed visibly rendered outline. A permanent base shadow cannot satisfy the oracle.
- `REG-BROWSER-01` executes the real production `registerUser → apiClient → logApiError/logger` non-2xx branch using synthetic non-sensitive JSON `503`. It does not capture or prove cleanliness of the shared logger channel. During the authoritative run, local server output visibly contained the expected shared logger error for that synthetic `503`.
- The strict clean in-page console/page-error oracle applies only to the success journey. The shared raw-body logging concern remains **`OUT_OF_SCOPE_BASELINE_GAP`**; Story 167.4 neither repairs nor claims closure, and the shared files remain unchanged.

### Current hashes and fresh validation

- Current SHA-256 values: `src/components/custom/RegistrationForm.tsx` `b6a2debf16cf68d5fea2487e74de7a3231539ed8d2fb439f155160cda9076183`; `src/components/custom/RegistrationForm.test.tsx` `d188966c10254e137f757bae1e5ffab64dc4f9d98402fbbac5ed25c85b5e751e`; `e2e/onboarding.spec.ts` `565142bf65865dd6e4af09cc865025d5432e8f60bdb34ec25fcb64f1f0850978`.
- Protected non-registration E2E boundaries remain byte-identical: prefix `1fbf2c6e28757f88b9fe969c40bd18e18dc1cba55891551ce20a70ef1a640526`; suffix `20e15b54e2b60aa37560dc5f682df04469fc9be914669626a52f87831cb8236f`.
- Root independent targeted rerun: `2/2` files, `26/26` tests, `3.00s`.
- Full Prettier passed; full ESLint reported zero errors and zero warnings; TypeScript `tsc --noEmit` exited `0`; max-lines passed with source cap `200` and test cap `800`; privacy scan passed across `3432` text files and `0` binary files; privacy policy tests passed `29/29`; E2E vacuous-assertion policy passed `19` files; fixed-wait policy found `47` timer-free owned targets; bare-skip policy found `0` bare skips; `git diff --check` exited `0`.
- Authoritative full Vitest outside the sandbox passed `1135/1135` files and `18449/18449` tests in `208.19s`. The earlier sandbox-only `listen EPERM` lifecycle failure was infrastructure-only, not a product failure.
- Authoritative production build outside the sandbox compiled in `7.1s`, completed TypeScript in `14.7s`, generated `70/70` static pages, and included `/register`. The earlier sandbox-only Turbopack internal-port `EPERM` failure was infrastructure-only, not a product failure.

### Current ATDD/lifecycle boundary

- `tddPhase: green` remains truthful; Task 6 and its accepted-finding/evidence-synchronization work are complete.
- Task 7 deterministic freeze and fresh sequential `APPROVE` then `CLEAR` remain open. Task 8 remains open.
- Story and sprint remain `in-progress`; sprint-status bytes are read-only in this synchronization.
- No approval, `CLEAR`, valid current freeze, review-ready transition, staging, commit, push, PR, merge, cleanup, completion, or deployment is claimed.

## Frozen-Candidate 3 Review Rejection and Classifier Repair GREEN — 2026-08-14

### Review verdict, freeze invalidation, and accepted M-1

- Candidate freeze 3: `/private/tmp/story1674-candidate-freeze-3.sha256`; SHA-256 `bb94a0602d7325aa11f492c67911aab3d5b91a425663afdaa9be46738fcfd133`. It matched all eight entries before and after the independent review and is now historical and invalidated by the accepted code/test/evidence repair.
- Independent runtime: `/private/tmp/story1674-omx-runtime-review3-approve-host`; slug `story1674-review3-approve-host`. Transport passed, but the reviewer ended with **`VERDICT: REJECT`** and exactly one accepted unresolved material finding.
- **MEDIUM M-1:** the prior classifier trusted password-like backend message text for any `ApiError` except statuses `0` and `503`. Thus HTTP `500` with `password`/`пароль` text incorrectly selected password-policy feedback instead of generic service recovery and removed `Повторить`.

### Authoritative direct RED → GREEN

- New regression: `[Review 3 finding M-1] keeps password-like hostile 5xx detail in generic service recovery` using `new ApiError('password hashing service unavailable raw-detail', 500)`.
- RED ran on unchanged production with the form-only target: exit `1`; `1` failed file; `1` intended failure and `23` prior passes of `24`; test time `2.01s`; Vitest duration `3.20s`. It found `Пароль не соответствует требованиям.` instead of generic service recovery. Log `/private/tmp/story1674-review3-repair-red.log`; SHA-256 `45ce0ba8041036e7c3708ab02fd3d3f652c423dee3a7663c788311d767559b87`.
- Minimal production repair bounds password-policy signature recognition to the HTTP `4xx` category. All HTTP `5xx` values now use generic safe service recovery regardless of hostile password-like message text; the existing HTTP `422` signature case still receives fixed safe password-policy feedback. Raw backend detail is not rendered, credentials remain retained and masked, the recovery surface is focused/associated, and generic recovery exposes one `Повторить` action.
- Final two-target GREEN: exit `0`; `2/2` files and `27/27` tests passed; duration `3.04s`. Log `/private/tmp/story1674-review3-repair-green-final.log`; SHA-256 `98ed809e8a7ada229a7769ecb25ef64586f8a95e7df0dab736646d58b6c3041d`.

### Focused validation and current boundary

- Non-mutating final checks passed on pinned Node `24.18.0`: Prettier check for the two code files; scoped zero-warning ESLint; TypeScript `--noEmit`; repository max-lines with source cap `200` and test cap `800`; and `git diff --check`. Log `/private/tmp/story1674-review3-repair-focused-checks-final.log`; SHA-256 `6dc11a02e26ea7f76df4c3561a4365b89e110a3a5bc111ec9bd09603bbbcc880`.
- Shared `ApiError`, API client, logger, backend contracts, E2E, route files, sprint status, packages, configs, and plans remain unchanged by this repair. The prior truthful shared-logger `OUT_OF_SCOPE_BASELINE_GAP` remains open and is not claimed clean.
- `tddPhase: green` remains truthful. Task 6 remains complete; Task 7 requires a fresh deterministic eight-path freeze and fresh sequential terminal `APPROVE` then `CLEAR`; Task 8 remains open. Story and sprint remain `in-progress`.
- No approval, `CLEAR`, valid current freeze, review-ready transition, staging, commit, push, PR, merge, cleanup, completion, screen-reader/non-Chromium execution, shared-logger cleanliness, or deployment is claimed.

## Final Post-Repair Universal-Validation Checkpoint — 2026-08-14

This append-only ATDD synchronization records the authoritative current-byte evidence after the accepted Review-3 M-1 repair. All historical RED, rejected-review, invalidated-freeze, infrastructure-only failure, and unavailable-coverage evidence remains intact; front matter remains truthfully `tddPhase: green`.

| Check | Authoritative final result |
| --- | --- |
| Toolchain | Node.js `24.18.0`; npm `11.11.0` |
| Targeted Vitest | Exit `0`; `2/2` files and `27/27` tests passed in `3.34s` |
| Chromium `REG-BROWSER-01` | **PASS** in `2.5s` |
| Chromium `REG-BROWSER-02` | **PASS** in `687ms` |
| Chromium `REG-BROWSER-03` | **PASS** in `208ms` |
| Chromium total | `3/3` passed in `3.9s`; one worker; retries `0` |
| Format | Passed for source plus the exact Story manifest/documents |
| ESLint | Passed with zero warnings |
| TypeScript | `--noEmit` passed |
| Max-lines | Passed; source cap `200`, test cap `800` |
| Privacy scan | Passed; `3432` text files, `0` binary files |
| Privacy tests | `29/29` passed |
| E2E assertion policy | Passed across `19` files |
| E2E fixed-wait policy | Passed across `47` targets |
| E2E bare-skip policy | `0` bare skips |
| Documentation baseline | Exactly `18` historical broken citations |
| Story markers | `0` violations across `30` files |
| Diff whitespace | `git diff --check` passed |
| Authoritative full Vitest outside sandbox | `1135/1135` files and `18450/18450` tests passed in `162.30s` |
| Authoritative production build outside sandbox | Compiled in `5.5s`; TypeScript `14.4s`; generated `70/70` static pages; included `/register` |

The synthetic non-sensitive `503` scenario still exercises the real shared-logger boundary. It is intentionally not evidence of a clean shared logger, and this checkpoint makes no shared-logger-cleanliness claim. The strict clean console/page-error assertion remains scoped only to the success journey.

Mission-start SHA-256 protection for the six tracked Story manifest paths, including sprint-status, is:

| Protected tracked path | Mission-start SHA-256 |
| --- | --- |
| `src/app/(auth)/register/__tests__/page.test.tsx` | `eac67057fbd77d8050168759afd8223ce35e90a4103fe7ca13e6ada32d22d917` |
| `src/components/custom/RegistrationForm.test.tsx` | `2781e5ee957326f27390a739c2d58ca95b8c6f85b1a8b7208afbae7ad49d3979` |
| `e2e/onboarding.spec.ts` | `565142bf65865dd6e4af09cc865025d5432e8f60bdb34ec25fcb64f1f0850978` |
| `src/app/(auth)/register/page.tsx` | `98f19c1942ca6a4f071c9b2e007d5f649f334edfa73a08bc99d4041b48efa816` |
| `src/components/custom/RegistrationForm.tsx` | `ed416ba28076f248bb5e0f05b21fdd4fc55c5e5b5106f72b1df366ca9ab2194e` |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | `1e70d799ced6942e2751586f6abb9dcaaa0788df963be2ddf4e9153600b87361` |

Task 6 remains complete. Task 7 freeze/review remains open. Task 8 remains open. Story and sprint remain `in-progress`. There is no current freeze, `APPROVE`, `CLEAR`, review status, staging, commit, push, PR, merge, cleanup, deployment, screen-reader/non-Chromium pass, or shared-logger-cleanliness claim.

## Frozen-Candidate 4 LOW Evidence-Summary Repair — 2026-08-14

- Frozen-candidate-4 review accepted one LOW documentation-consistency finding: the Story Completion Notes still presented candidate-2 `26/26` targeted evidence and the older `2.2s`/`697ms`/`205ms`, `3.5s` Chromium set as current, while this checklist's top checkpoint still presented the older `3.5s` total.
- This bounded documentation-only repair reconciles the live summaries to the final current-byte `27/27` targeted result and `2.5s`/`687ms`/`208ms`, `3.9s` Chromium set. Older clearly historical checkpoints remain unchanged.
- `tddPhase: green` remains truthful. Task 6 remains complete; Task 7 freeze/review and Task 8 remain open; Story and sprint remain `in-progress`. These documentation byte changes do not establish a current freeze, `APPROVE`, `CLEAR`, review status, staging, or integration evidence.

## Immutable Freeze-5 Initial Review Pair and Review-Status Transition — 2026-08-14

This append-only checkpoint supersedes only the current lifecycle state above; it does not rewrite or erase any historical RED, GREEN, rejected-review, invalidated-freeze, repair, infrastructure-only failure, or unavailable-coverage evidence. The YAML front matter remains truthfully `tddPhase: green`.

| Review-status evidence | Result |
| --- | --- |
| Immutable candidate | `/private/tmp/story1674-candidate-freeze-5.sha256` |
| Freeze-file SHA-256 | `15c65c5371b6518d123177aff917f74a36f5c46f186f4ebe63afbb03115cd872` |
| Pre-mutation manifest verification | Exactly `8/8` paths matched; zero mismatches |
| First independent review | Terminal **`VERDICT: APPROVE`**; zero accepted **HIGH**, **MEDIUM**, or **LOW** findings |
| Separate second review | Terminal **`VERDICT: CLEAR`** for architecture/scope/contract; zero accepted findings |
| Supported lifecycle transition | Task 7 and all freeze/review subtasks complete for freeze 5; Story and sprint move to `review` |

Task 8 remains open. No final integration review, staging, commit, push, PR, merge, branch/worktree cleanup, Story completion, deployment, shared-logger cleanliness, screen-reader execution, or non-Chromium execution is claimed.

Because this checkpoint updates the Story, ATDD checklist, and sprint-status documents, it changes three paths in the exact eight-path manifest and invalidates freeze 5 as a current integration snapshot. Before staging, root must create a new exact eight-path deterministic freeze and obtain a fresh final sequential terminal **`APPROVE`** then **`CLEAR`** pair over the same new freeze with zero accepted findings.

## Freeze-6 Final Review Pair and Integration-Gate Whitespace Repair — 2026-08-14

- Freeze 6, identified by SHA-256 `a084768fba3350d16b94cc23b274be9ae443e2230fad49bf1e10e4dc3ac312b6`, received the required final sequential terminal **`VERDICT: APPROVE`** followed by terminal **`VERDICT: CLEAR`**, with accepted **HIGH/MEDIUM/LOW** findings `0/0/0` in both final reviews.
- The first exact staging attempt was stopped when the staged whitespace gate exposed three trailing-whitespace violations in this previously ignored ATDD artifact: the Date, Author, and Primary test level lines. The index was safely returned to empty. This bounded repair removes only those three Markdown hard breaks and appends evidence to the two owned documents.
- These two document changes invalidate Freeze 6. A new exact eight-path freeze and a fresh final sequential **`APPROVE`** then **`CLEAR`** pair over identical bytes are required before any restaging.
- Current lifecycle truth remains unchanged: Story and sprint are `review`, Task 7 is complete, Task 8 is open, and this front matter remains `tddPhase: green`. The five source/test/E2E bytes, the shared-logger **`OUT_OF_SCOPE_BASELINE_GAP`**, and the unavailable screen-reader/non-Chromium gaps remain preserved. No staging state, commit, push, PR, merge, cleanup, completion, or deployment is established by this repair.

## Freeze-7 Rejection and Genuine-Enter Evidence Repair — 2026-08-14

- Freeze-file SHA-256 `55bfe91c24f7a0f2e3e6e85e18969326a8563710c6374b945cd5dbaca9dd6b26` received **`VERDICT: REJECT`** with accepted **HIGH/MEDIUM/LOW** findings `0/1/0`.
- The one MEDIUM evidence-quality finding was that `REG-FORM-03` claimed click-plus-Enter duplicate prevention while dispatching only `fireEvent.keyDown` on the form; that event does not perform native implicit form submission.
- Repaired direct evidence uses `userEvent` semantics from the focused enabled password control to perform the first valid Enter submission, holds the registration promise pending, attempts a second real Enter, and proves exactly one `registerUser` call. The independent trigger-agnostic synchronous double-submit lock is unchanged.
- Repaired `REG-BROWSER-02` focuses the enabled password control, initiates the held valid registration with real keyboard Enter, issues a second real Enter before response release, and proves the intercepted registration-request count remains one. Interception records method and endpoint pathname only; it neither reads nor prints request bodies. The pending controls/`aria-busy`, exact `/v1/auth/register` POST, privacy scans, clean console/page-error, controlled response release, and exactly one observed `/login` history navigation checks remain intact.
- Pinned Node `24.18.0`/npm `11.11.0` results: form-only Vitest `24/24` passed in `3.35s`; final targeted Vitest `2/2` files and `27/27` tests passed in `3.31s`; scoped ESLint passed with zero warnings; TypeScript `--noEmit`, max-lines, privacy scan, privacy tests `29/29`, and E2E vacuous-assertion/fixed-wait/bare-skip policies all passed.
- Browser status remains honestly blocked by this sandbox. With port `3100` absent, the captured worktree frontend exited on `listen EPERM 127.0.0.1:3100`. The exact isolated Chromium command then exited `1` before test execution because Chromium Mach-port registration was denied. This is infrastructure evidence, not a product failure and not a browser pass; no unrelated process was stopped.
- Freeze 7 is invalidated by these test/E2E/evidence bytes. A new exact eight-path deterministic freeze plus fresh sequential terminal **`APPROVE`** then **`CLEAR`** reviews on the identical freeze are required before Task 8.
- The front matter remains `tddPhase: green`; Story and sprint remain `review`; Task 7 remains complete and Task 8 remains open. **`OUT_OF_SCOPE_BASELINE_GAP`** for the shared logger and unavailable screen-reader/non-Chromium gaps remain unchanged. No staging, commit, push, PR, merge, cleanup, completion, or deployment is claimed.

## Root-Host Chromium GREEN After the Sandbox-Blocked Worker Attempt — 2026-08-14

- The earlier nested-worker browser attempt remains truthfully recorded as sandbox-blocked and supplied no browser pass. The root host then started only this Story worktree frontend on `127.0.0.1:3100`.
- Using pinned Node.js `24.18.0`, the root host ran Playwright Chromium with `e2e/onboarding.spec.ts`, config `/private/tmp/story1674-playwright.config.ts`, project `chromium`, and grep `REG-BROWSER-(01|02|03)`.
- Exit `0`: `3 passed (4.1s)`. `REG-BROWSER-01` passed in `2.7s`; `REG-BROWSER-02` passed in `697ms`; `REG-BROWSER-03` passed in `209ms`.
- `REG-BROWSER-02` genuinely focused the enabled password control, submitted with a real keyboard Enter, held the intercepted response, attempted a second real keyboard Enter before response release, and proved exactly one registration request and exactly one observed `/login` history navigation. No request body was inspected or logged.
- The captured frontend session was stopped afterward. No screen-reader execution and no browser/engine pass beyond Chromium is claimed.
- Freeze 7 remains invalidated. Story and sprint remain `review`; Task 7 remains complete; Task 8 remains open; and this checklist remains truthfully `tddPhase: green`. The shared logger remains **`OUT_OF_SCOPE_BASELINE_GAP`**; unavailable screen-reader and non-Chromium coverage remain explicit gaps.
- Task 8 remains gated on a new deterministic freeze over the exact established eight-path Story manifest followed by fresh independent terminal **`APPROVE`** and then **`CLEAR`** reviews, in that order, over the identical new freeze with zero accepted findings. No staging, commit, push, PR, merge, cleanup, Story completion, or deployment is claimed.

## Final Pre-Freeze Validation Checkpoint — 2026-08-14

This append-only checkpoint records the final current-byte validation before a new freeze. It preserves the preceding root-host Chromium `3/3` evidence, the Freeze 7 invalidation, and all earlier historical evidence without reclassification.

| Check | Final result |
| --- | --- |
| Pinned toolchain | Node.js `24.18.0`; npm `11.11.0` |
| Targeted Vitest | `2/2` files and `27/27` tests passed in `3.43s` |
| Sandboxed full Vitest | Reached `1134/1135` files and `18449/18450` tests; the sole failure was `src/test/historical-spp-server-lifecycle.test.ts`, caused by sandbox `listen EPERM 0.0.0.0` |
| Isolated host lifecycle rerun | `11/11` tests passed |
| Complete host full-suite rerun | `1135/1135` files and `18450/18450` tests passed in `185.15s` |
| Exact-manifest formatting | Prettier passed |
| Static validation | Scoped ESLint passed with zero warnings/errors; TypeScript `--noEmit` passed; max-lines passed at source `200` and test `800` |
| Privacy | Scan passed across `3432` text files and `0` binary files; privacy tests passed `29/29` |
| E2E policies | Assertion policy passed across `19` files; fixed-wait policy passed across `47` timer-free targets; bare skips `0` |
| Repository policies | Documentation matched the exact historical baseline `18`; markers `0` across `30` files |
| Sandboxed production build | Blocked by Turbopack process/port `EPERM`; this is infrastructure-only evidence, not a product failure |
| Complete host production build | Passed: compile `5.9s`, TypeScript `14.5s`, `70/70` static pages, with `/register` included |

Lifecycle truth is unchanged: this checklist remains `tddPhase: green`; Story and sprint remain `review`; Task 7 is complete; and Task 8 is open. The shared logger remains **`OUT_OF_SCOPE_BASELINE_GAP`**. Screen-reader and non-Chromium execution remain unavailable gaps. No Story completion, staging, commit, push, PR, merge, cleanup, or deployment is claimed.

These document bytes require a new deterministic freeze over the exact eight established paths. Fresh independent terminal reviews must then run sequentially over that identical freeze: **`APPROVE` first, then `CLEAR`**. The owned-document Prettier and trailing-whitespace checks, repository `git diff --check`, empty-index check, and outside-owned tracked/status stability check passed for this synchronization.
