# Story 167.4: Migrate Registration `/register`

Status: done

## Story

As a new seller,
I want understandable account creation,
so that I can begin onboarding without losing valid input.

## Outcome

Migrate the complete `/register` route-owned render tree to the merged semantic shadcn presentation contract while preserving the existing registration boundary. A new seller must be able to understand and complete account creation, recover from invalid, duplicate-account, and network failures without losing safe input, avoid duplicate requests, and move to `/login` through unchanged semantic navigation.

This is a bounded brownfield presentation and interaction migration. `registerUser` remains the sole account-creation client; the request remains `POST /v1/auth/register` with `skipAuth: true` and the existing `{ email, password }` payload; registration still does not create an authenticated frontend session; successful completion still transitions exactly once to `/login`; and auth API, store, schema, provider, generic primitives, login, onboarding implementation, backend/public contracts, packages, and configuration remain read-only.

## Acceptance Criteria

### Canonical functional acceptance criterion

1. **Registration behavior and recovery remain correct**
   - **Given** valid, duplicate, invalid, or network cases,
   - **When** registration is migrated,
   - **Then** account creation and next navigation remain unchanged,
   - **And** feedback is actionable,
   - **And** input persists,
   - **And** duplicates are prevented,
   - **And** login navigation remains semantic.

### Inherited delivery acceptance checks

The following checks make the canonical criterion and inherited Universal Story Delivery Contract falsifiable; they do not add product scope beyond the canonical BMAD Story, route ledger, OMX plan, UX contract, and existing brownfield registration behavior.

2. **Default presentation is semantic, understandable, responsive, and safe**
   - **Given** `/register` renders in its default or hydration transition,
   - **When** the route is inspected,
   - **Then** one semantic `main` contains one level-one `Регистрация` heading, the registration purpose, the form, and the login affordance,
   - **And** persistent visible labels, `autocomplete="email"`, `autocomplete="new-password"`, required/invalid semantics, logical DOM order, and a constrained comfortable form remain available,
   - **And** hydration does not trigger native credential submission, expose a password, or produce a protected-content or console-warning flash.

3. **Invalid input is associated, actionable, and request-free**
   - **Given** empty fields, malformed email, or a password shorter than eight characters,
   - **When** validation runs after blur or attempted submission,
   - **Then** `registerUser` is not called,
   - **And** visible Russian messages are programmatically associated with the corresponding controls and do not rely on color,
   - **And** an invalid multi-error submit provides a focusable summary and moves focus deterministically to the first invalid control without changing field order.

4. **Duplicate-account and network failures retain safe input and provide bounded recovery**
   - **Given** one deliberate request fails as a duplicate account,
   - **Then** email and password values remain available in their controls, the password remains masked, safe feedback is associated with the email/form rather than existing only in a toast, a semantic `/login` recovery action is available, and focus moves to the recovery surface.
   - **Given** one deliberate request fails because of a network or unknown service error,
   - **Then** both entered values remain available with the password masked, a safe generic Russian explanation and one bounded retry action are associated with the form, focus moves to the recovery surface, and one deliberate retry creates exactly one new request.
   - **And** neither failure path renders raw backend messages, response bodies, stack traces, identifiers, credentials, or other diagnostic detail.

5. **Submitting and success prevent duplicate account creation and preserve navigation**
   - **Given** valid credentials and a pending request,
   - **When** click, touch, Enter, or repeated activation occurs,
   - **Then** a synchronous submission lock prevents the same gesture window from issuing more than one request,
   - **And** email, password, and submit controls remain disabled with truthful busy and submitting semantics,
   - **And** automatic mutation retry cannot duplicate account creation.
   - **Given** the request succeeds,
   - **Then** a terminal transition lock prevents resubmission, completion is communicated without color alone, and `router.push('/login')` occurs exactly once,
   - **And** the route does not write JWT, auth-store, cabinet, or onboarding state and does not change the response contract.

6. **Responsive, theme, accessibility, and privacy evidence is complete**
   - **Given** the six required states—default, invalid, duplicate, network, submitting, and success,
   - **When** applicable route evidence is collected at `320`, `390`, `768`, `1024`, `1280`, and `1440+` widths in light and dark themes,
   - **Then** focused-form content remains constrained on desktop, controls/actions remain task-preserving on narrow screens, primary touch targets are at least `44×44` CSS pixels, Russian copy wraps, and no page-level horizontal overflow occurs,
   - **And** keyboard and touch completion, visible focus, task-order focus, 200% reflow, reduced motion, manual reading order, and automated accessibility evidence meet the WCAG 2.2 AA target,
   - **And** only synthetic credentials are used and no password or raw registration response appears in URLs, history, serialized page source, console/page errors, screenshots, traces, videos, logs, diagnostics, or committed fixtures.

7. **Ownership, validation, and review stay exact**
   - **Given** the canonical Story, route ledger, OMX plan, ATDD checkpoint, and exact prospective manifest,
   - **When** implementation is proposed for integration,
   - **Then** only the eight declared manifest paths have Story-owned changes,
   - **And** all Forbidden Shared Files and unrelated portions of `e2e/onboarding.spec.ts` remain unchanged,
   - **And** genuine active direct RED precedes production edits, targeted GREEN and browser evidence are real, all applicable universal local gates pass, and an independent sequential `APPROVE` then `CLEAR` review pair applies to the same frozen snapshot with no unresolved accepted finding.

8. **Git integration and cleanup are fully evidenced**
   - **Given** validation and the independent review pair pass,
   - **When** the Story is integrated,
   - **Then** ignored Story/ATDD artifacts are force-staged intentionally, the staged manifest matches the exact eight paths, a detailed conventional commit is pushed only to the feature branch, a ready PR is merged normally into `main`, and no direct/force push to `main` occurs,
   - **And** merge ancestry, remote/local feature-branch deletion, exact worktree removal, `git worktree prune`, worktree absence, route evidence, and final primary-checkout status are recorded before the Story is marked done.

**Current evidence boundary:** The credential/privacy requirements above remain canonical route-level requirements. `REG-BROWSER-01` executes the real production `registerUser → apiClient → logApiError/logger` non-2xx branch with a synthetic, non-sensitive JSON `503` response. That scenario does not capture or prove cleanliness of the shared logger channel; the strict clean in-page console/page-error oracle applies only to the success journey. The authoritative run's local server output visibly contained the expected shared logger error for the synthetic `503`. The shared raw-body logging concern remains an **`OUT_OF_SCOPE_BASELINE_GAP`**: Story 167.4 does not repair or claim closure of it, and all shared files remain unchanged.

## Six-State Matrix

| State | Required presentation and preserved behavior | Decisive direct/browser evidence |
| --- | --- | --- |
| Default | One `main` and one `h1`; visible email/password labels; email/new-password autocomplete; constrained comfortable form; semantic named `Войти` link with exact `href="/login"`; clean hydration/privacy boundary | Route semantics and uniqueness test; baseline form semantics; browser widths/themes, hydration, focus order, touch-target, overflow, and privacy checks |
| Invalid | Empty/malformed email and empty/7-character password remain invalid; associated non-color messages; focusable multi-error summary; first invalid focus; zero registration calls | Active route/component validation table and focus assertions; browser Russian wrapping/non-color evidence only |
| Duplicate | One duplicate response; safe associated email/form feedback; entered values retained; password masked; semantic `/login` recovery action; deterministic recovery focus; corrected-email retry | Component rejection/recovery test with raw-detail exclusion and one request per deliberate attempt |
| Network | Safe associated generic Russian message; values retained; password masked; bounded deliberate retry; recovery focus; no hostile backend/stack/PII disclosure | Component hostile-error and second-attempt test; browser-boundary privacy/console evidence, without duplicating component request or association assertions |
| Submitting | Synchronous duplicate lock; one `registerUser` call; all primary controls disabled; truthful busy/submitting label; no automatic mutation retry or concurrent retry action | Held-promise component test with rapid click, Enter, and request-count assertions |
| Success | Completion meaning is explicit; terminal lock prevents repeated account creation; unchanged `registerUser` response handling; no auth-store write; exactly one `router.push('/login')` | Deferred-resolution component test with exact router-call count; later browser navigation/privacy lock |

## Tasks / Subtasks

- [x] Task 1: Reconfirm prerequisites, the isolated lane, and exact ownership before any new edit (AC: 1–8)
  - [x] Verify branch `cdx/epic-167-story-4-register`, worktree `/private/tmp/wb-fe-167-4-migrate-registration`, and current base `c2a96943ff65a6ce60467608b01c17ad3a901716` against current local/remote `main`; record any newer base rather than silently rebasing a dirty lane.
  - [x] Prove the merged prerequisite ancestry for Stories 166.1–166.8 and registration contracts; record Story 167.3 merge PR `#157`/merge SHA `c2a96943ff65a6ce60467608b01c17ad3a901716` as sequencing evidence without treating login as a shared registration owner.
  - [x] Confirm the prior Story branch/worktree and remote branch are absent. Local branch, remote-tracking ref, and worktree checks are empty; root's authorized `2026-08-14 10:32` `git ls-remote --heads origin cdx/epic-167-story-3-login` result is exit `0` with empty output. A bounded mission recheck was attempted but DNS was unavailable, so it does not supersede the authoritative root result.
  - [x] Reconcile concurrent work before editing. Preserve the existing ATDD/e2e work; stop and report a collision or newly required shared file instead of expanding scope.
  - [x] Freeze the exact eight-file manifest and mission-start hashes for all protected files.

- [x] Task 2: Convert the existing ATDD design checkpoint into genuine active direct RED (AC: 1–7)
  - [x] Preserve the completed ATDD Steps 1–5 record and its three skipped E2E proposals; do not rewrite their history or count `expected_to_fail` metadata as execution.
  - [x] Edit only `src/app/(auth)/register/__tests__/page.test.tsx` and `src/components/custom/RegistrationForm.test.tsx` first.
  - [x] Add active direct expectations mapped by the ATDD checklist as `REG-ROUTE-02`, `REG-FORM-01`, `REG-FORM-04`, `REG-FORM-05`, and `REG-FORM-06`.
  - [x] Preserve or strengthen `REG-ROUTE-01`, `REG-FORM-02`, and `REG-FORM-03` as brownfield locks; never mislabel a passing preservation test as RED.
  - [x] Run the exact targeted command against unchanged production and capture failing names, intended missing-behavior reasons, exit code, passing lock count, and unchanged production hashes. No skip/todo/only, conditional pass, swallowed assertion, fixture failure, or environment failure qualifies as RED.
  - [x] Do not edit either production file until genuine Story-owned direct RED is recorded.

- [x] Task 3: Migrate only the route-owned `/register` presentation (AC: 1–3, 6–7)
  - [x] Keep the route at `src/app/(auth)/register/page.tsx`; use one semantic `main`, one `h1`, semantic tokens, and the existing `RegistrationForm` composition.
  - [x] Preserve the Russian purpose copy and exact semantic Next.js `Войти` link to `/login`.
  - [x] Keep comfortable constrained desktop presentation, full-width focused mobile controls/actions, logical DOM/reading order, theme semantics, reduced motion, and no page-level overflow.
  - [x] Do not edit generic primitives or global tokens/styles to meet route-owned geometry; apply Story-owned composition classes only.

- [x] Task 4: Implement actionable invalid, duplicate, and network recovery inside `RegistrationForm` (AC: 1, 3–4, 6–7)
  - [x] Preserve visible labels, email/new-password autocomplete, required rules, email pattern, password minimum length, and `onBlur` validation timing.
  - [x] Provide stable field/form error association, non-color meaning, a focusable summary for multi-error invalid submit, and deterministic first-invalid focus.
  - [x] Replace toast-only duplicate/network recovery with safe associated feedback and bounded actions while retaining existing safe toast acknowledgements only when nonessential.
  - [x] Retain entered values after duplicate/network failure; keep the password masked; move focus to the relevant recovery surface; never reveal raw errors, response bodies, credentials, identifiers, or stack data.
  - [x] Keep duplicate-account recovery linked semantically to `/login`; keep network recovery as exactly one deliberate new attempt per activation.

- [x] Task 5: Preserve request, submitting, success, navigation, and privacy contracts (AC: 1, 4–7)
  - [x] Keep `registerUser` as the sole client and the exact `{ email, password }` payload to `POST /v1/auth/register` with the existing unauthenticated client boundary.
  - [x] Add/retain a synchronous duplicate-submission guard and prevent automatic mutation retries from duplicating account creation.
  - [x] Keep all primary controls disabled and busy state truthful while pending; prevent concurrent retry and terminal-success resubmission.
  - [x] Preserve the successful registration sequence: safe completion feedback followed by exactly one `router.push('/login')`; do not authenticate, write JWT/session/cabinet state, or start onboarding directly.
  - [x] Keep credentials out of URLs, serialized evidence, diagnostics, logs, screenshots, traces, videos, and committed fixtures.

- [x] Task 6: Reach targeted GREEN and collect truthful browser/accessibility/privacy evidence (AC: 1–7)
  - [x] Run both direct Vitest targets to GREEN and retain the exact command, counts, duration, and exit code.
  - [x] After direct GREEN and authorized localhost preflight, enable the three existing Story 167.4 proposals in only the registration block of `e2e/onboarding.spec.ts`; preserve every non-registration byte.
  - [x] Treat `REG-BROWSER-01` as the later browser-owned implementation RED/geometry proof and `REG-BROWSER-02`/`REG-BROWSER-03` as regression/privacy/device locks; do not count skipped or unexecuted tests as evidence.
  - [x] Prove widths/themes, 200% reflow, reduced motion, Russian wrapping, `44×44` targets, keyboard/task order, visible focus, touch activation, semantic `/login` navigation, success-journey in-page console/page-error cleanliness, and browser-boundary credential privacy; document the separate synthetic-`503` shared logger boundary without claiming a clean logger channel.
  - [x] Run automated accessibility checks plus manual keyboard, focus, reading-order, non-color meaning, and responsive review. Record unavailable browser/assistive-technology coverage as a gap, never a pass.
  - [x] Resolve the accepted frozen-candidate-2 review findings and synchronize the Story/ATDD evidence: safe lower-cased `password`/`пароль` policy interpretation without raw detail, truthful synthetic-`503` logger scope, a real before/after computed-style focus delta, and one authoritative fresh Chromium timing set.

- [x] Task 7: Run universal local gates, exact-scope audit, and sequential independent reviews (AC: 6–8)
  - [x] Run targeted checks first, then full Vitest, format, zero-warning lint, type-check, max-lines, privacy, E2E static-policy checks, build, YAML parsing, dependency/package immutability, diff-check, and exact-manifest gates with pinned Node/npm.
  - [x] Prove every Forbidden Shared File, package/lock/config/planning file, login/onboarding implementation, and unrelated E2E block remains unchanged.
  - [x] Freeze one deterministic snapshot hash over the exact eight manifest paths after all gates pass.
  - [x] Obtain a fresh independent code/spec/security review with terminal verdict `APPROVE`; resolve accepted findings test-first, rerun affected gates, and refreeze if anything changes.
  - [x] Only after `APPROVE`, obtain a separate fresh independent architecture/scope/contract review over the same frozen hash with terminal verdict `CLEAR`.
  - [x] Any accepted finding or snapshot change invalidates the pair; repeat sequential `APPROVE` then `CLEAR`. Integration requires both verdicts on one exact hash and zero unresolved accepted findings.

- [ ] Task 8: Force-stage the exact manifest, integrate normally, and remove the Story lane (AC: 8)
  - [ ] Force-stage only the ignored Story artifact and ATDD checklist; stage the six tracked manifest paths normally; compare `git diff --cached --name-only` with the exact eight-file manifest before committing.
  - [ ] Create the detailed conventional commit, push only `cdx/epic-167-story-4-register`, open a ready PR against `main`, and merge normally after local gates and sequential reviews pass. Never force-push or push directly to `main`.
  - [x] Synchronize primary `main`, prove the merge SHA is its ancestor and the forced artifacts are present, delete the remote feature branch, remove the exact worktree without force, delete the local branch, and prune. <!-- closed by Story 174.5 collective absence audit 2026-09-02 -->
  - [x] Prove the remote/local branch, exact worktree path, and worktree-list entry are absent; record final primary-checkout status and route-ledger evidence before moving the Story from review to done. <!-- closed by Story 174.5 collective absence audit 2026-09-02 -->

## Dev Notes

### Prerequisites, Base, Branch, and Worktree

- Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`.
- Story branch: `cdx/epic-167-story-4-register`.
- Dedicated worktree: `/private/tmp/wb-fe-167-4-migrate-registration`.
- Exact Story creation base/HEAD: `c2a96943ff65a6ce60467608b01c17ad3a901716`.
- Story creation evidence: the branch and worktree match the canonical OMX plan; `HEAD` and `merge-base HEAD main` both equal `c2a96943ff65a6ce60467608b01c17ad3a901716`.
- That base is merge PR `#157` for Story 167.3 and contains merge PRs `#145`–`#152` for Stories 166.1–166.8, PR `#153` for Story 167.1, PR `#154` for Story 167.2, and auth redirect prerequisites `#155`–`#156`.
- Current local repository metadata shows no local Story 167.3 branch or worktree. Its artifact/sprint prose still says Task 8 is pending, so later lifecycle verification must rely on Git/remote evidence and must not silently rewrite Story 167.3 from this Story.
- Canonical prerequisites are merged Epic 166-FE and existing registration contracts. Story 167.3 is historical sequencing evidence, not a registration shared-file owner.
- The lane already exists. Do not rerun the plan's worktree-creation block. At implementation start, fetch/verify the authoritative base and report a collision instead of destroying or recreating concurrent work.

### Requirements, Ownership, and Scope

- Requirements: `FR1`, `FR27`.
- Route ledger: `167.4 | /register | src/app/(auth)/register/page.tsx | auth | planned`.
- **Route/User Value:** a new seller can create an account and continue to sign-in/onboarding without losing valid input.
- **Owned Surface:** `/register`, `RegistrationForm`, their direct tests, and the existing Story 167.4 registration evidence block in `e2e/onboarding.spec.ts`.
- **Shared Dependencies:** merged Epic 166-FE semantic foundation and current registration contracts.
- **Allowed Change Surface:** the exact eight-file prospective manifest only. Within `e2e/onboarding.spec.ts`, only the existing `Register Page Functionality` / Story 167.4 block is writable.
- **Forbidden Shared Files:** auth API/client/store/schema/provider/hooks; `src/lib/api.ts`; `src/types/auth.ts`; `src/components/ui/**`; global tokens/styles; login route/form/tests; cabinet/processing/WB-token/onboarding implementation and guards; proxy/middleware; route constants; AppShell/navigation; shared product compositions; backend/public contracts; package/lock files; framework/test configuration; planning artifacts; generated OpenWiki; unrelated routes/tests/evidence.
- Any need outside the exact manifest is a blocker. Route it to the declared owner; do not move shared auth behavior into `RegistrationForm`, modify a primitive, add a helper in a shared directory, or broaden E2E ownership.
- No dependency changes. No latest-version or upgrade research is required or authorized.

### Exact Prospective Eight-File Manifest

The complete Story lifecycle manifest is exactly:

1. `src/app/(auth)/register/__tests__/page.test.tsx` — active direct route RED/GREEN and semantic/accessibility locks.
2. `src/components/custom/RegistrationForm.test.tsx` — active form RED/GREEN for validation, request, recovery, focus, duplicate prevention, success, and privacy.
3. `e2e/onboarding.spec.ts` — only the relevant registration block; preserve all other bytes.
4. `_bmad-output/test-artifacts/atdd-checklist-167.4.md` — existing ATDD record and later truthful RED/GREEN/browser evidence only; ignored artifact requires force-stage.
5. `_bmad-output/implementation-artifacts/167-4-fe-migrate-registration-register.md` — Story lifecycle/evidence updates only after evidence is real; ignored artifact requires force-stage.
6. `src/app/(auth)/register/page.tsx` — route-owned semantic/responsive presentation.
7. `src/components/custom/RegistrationForm.tsx` — route-exclusive validation/recovery/submission/success interaction.
8. `_bmad-output/implementation-artifacts/sprint-status.yaml` — only Story `167-4-fe-migrate-registration-register` lifecycle transition and an explicitly permitted later timestamp/comment when factually required.

Do not add, remove, rename, or edit a ninth path. Stop and report any manifest collision.

### Historical Brownfield Registration Contract at Story Creation

This subsection preserves the pre-implementation brownfield snapshot; later GREEN and repair checkpoints supersede its present-tense observations without rewriting the historical record.

- `src/app/(auth)/register/page.tsx` owns the centered registration purpose, `Регистрация` `h1`, `RegistrationForm`, and semantic Next.js `Войти` link to `/login`. It currently uses outer `div` elements and has no `main`; that is the route-owned semantic RED target.
- `RegistrationForm` uses React Hook Form in `onBlur` mode, TanStack Query `useMutation`, existing shadcn `Form`/`Input`/`Button`, `registerUser`, Next.js `useRouter`, and Sonner.
- Existing validation is email required/pattern plus password required/minimum eight characters. Visible labels, `autocomplete="email"`, `autocomplete="new-password"`, `aria-required`, and field-level `aria-invalid` are established behavior.
- A valid submit currently calls `registerUser` with exactly `{ email, password }`. `registerUser` posts to `/v1/auth/register` with `skipAuth: true`. Do not add request keys, normalize credentials, change the endpoint, replace the client, or introduce auth/session writes.
- Pending mutation state disables both inputs and the submit button, sets `aria-busy`, and changes the action label. Strengthen duplicate prevention with an active synchronous-lock test before changing production.
- Current success is success toast then `router.push('/login')`. Preserve the destination and one-transition behavior; registration does not log the user in or start onboarding directly.
- Current duplicate/password/network handling is toast-only. React Hook Form does not reset after failure, so entered values remain. The Story must make recovery associated, focusable, safe, and actionable without discarding that retention behavior or exposing raw diagnostics.
- The unchanged direct baseline recorded by ATDD was 2/2 files and 14/14 tests passing. That is brownfield baseline evidence only, not Story RED or GREEN.

### Preserved Auth, Request, Navigation, and Privacy Contracts

- **Auth boundary:** account creation is unauthenticated. Do not read/write JWT, auth store, cabinet selection, protected-route state, or onboarding state.
- **Request boundary:** one deliberate request uses the existing `registerUser({ email, password })` call and `/v1/auth/register` `skipAuth: true` behavior. No automatic retry, alternate API, direct `fetch`, response remapping, or contract change.
- **Navigation boundary:** the page-level `Войти` affordance remains a real link with `href="/login"`; success remains exactly one Next.js router transition to `/login`.
- **Failure boundary:** map known duplicate and generic network/unknown failures to safe Russian field/form feedback. Never show the raw `Error.message`, response body, status payload, stack, token, identifier, email, or password as diagnostics.
- **Input boundary:** valid entered values persist through recoverable duplicate/network failure. Password content may remain in the password control because that is current and canonical ATDD behavior, but it remains masked and absent from every other browser/artifact channel.
- **Privacy boundary:** synthetic credentials only; no credentials in URL/history/page source/console/log/screenshot/trace/video/fixture; no credential-bearing debug output; clean up all temporary browser artifacts.

### Historical ATDD Checkpoint and Direct RED Handoff

This subsection preserves the Story-creation ATDD handoff. The current phase and active browser state are recorded in the later evidence and Completion Notes sections.

- The authoritative ATDD checklist reports Steps 1–5 complete for test design/generation/validation.
- API proposal count is correctly `0`: API/auth/backend/public-contract ownership is forbidden and the existing registration contract is preserved.
- Exactly three Story 167.4 proposals exist in the current registration E2E block: `REG-BROWSER-01`, `REG-BROWSER-02`, and `REG-BROWSER-03`. All three remain `test.skip()`.
- Playwright list-only collection is valid after the registration-local touch-context correction replaced forbidden `test.use({ hasTouch: true })` with a disposable `browser.newContext({ hasTouch: true, ... })` and `try/finally` cleanup.
- The current E2E file hash at Story creation is `0b22abc4ce99f616bfc1c654f151790f98d7899d505fc3342d227bb97d54a936`; the ATDD checklist hash is `18d483a739da5e5cfe744a7f1cf08591ff86015d6e4e440f5229ce0d396ccc60`.
- `expected_to_fail: true`, proposal labels, static parsing, and list-only collection are not executed RED. Genuine executed ATDD RED remains incomplete.
- The immediate implementation handoff is active direct route/component RED in only the two direct test files. Production must remain byte-identical until the targeted command produces intended Story-owned failures.
- Required RED scenarios: `REG-ROUTE-02`, `REG-FORM-01`, `REG-FORM-04`, `REG-FORM-05`, and `REG-FORM-06`. Preservation locks `REG-ROUTE-01`, `REG-FORM-02`, and `REG-FORM-03` must pass and must not inflate RED counts.

### Browser Evidence Contract

- Browser execution is deferred until active direct RED is recorded, production reaches targeted GREEN, and the repository's localhost/network preflight is authorized and satisfied.
- Use frontend `http://localhost:3100` and backend `http://localhost:3000`; do not bypass `scripts/e2e-preflight.mjs` or the repository network guard.
- Enable and execute the three existing proposals only in the registration block. Successful prior `--list` collection proves discovery/wrapper compatibility only, not rendered selectors, browser behavior, or pass/fail results.
- Required matrix: `320`, `390`, `768`, `1024`, `1280`, `1440+`; light/dark; 200%-equivalent reflow; reduced motion; long Russian validation text; no horizontal page overflow; at least `44×44` primary controls.
- Required interaction: keyboard-only task order, visible focus, Enter submission, real touch activation of the semantic login link, non-color invalid/error meaning, and deterministic recovery focus.
- Required accessibility: automated axe/equivalent scan plus manual landmarks/headings, labels/error association, keyboard, focus, reading order, announcements, contrast, theme, zoom/reflow, and touch review.
- Required privacy/runtime: strict unexpected console-warning/error and page-error maps; masked password; no synthetic email/password in URL, history, page source, console, screenshot, trace, video, or retained artifact.
- Any unavailable browser, engine, screen-reader, or environment check is recorded as a gap with next-best evidence; it is never declared passing.

### Repository-Pinned Toolchain and Commands

Use the repository engines exactly: Node `24.18.0`, npm `11.11.0`. Relevant direct declaration specifiers in `package.json` are Next.js `^16.2.12`, React/React DOM `^19.0.0`, React Hook Form `^7.66.1`, TanStack React Query `^5.0.0`, Sonner `^2.0.7`, Vitest `4.1.10`, React Testing Library `^16.0.0`, user-event `^14.5.0`, Playwright `^1.41.0`, Tailwind PostCSS `^4.1.17`, and TypeScript `^5.0.0`. These are repository facts, not upgrade recommendations.

Targeted direct RED/GREEN:

```bash
/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run \
  'src/app/(auth)/register/__tests__/page.test.tsx' \
  src/components/custom/RegistrationForm.test.tsx
```

Applicable browser target after preflight and direct GREEN:

```bash
/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm run test:e2e -- \
  e2e/onboarding.spec.ts --project=chromium
```

Universal local gates, in this order after targeted GREEN/browser evidence:

```bash
npm test -- --run
npm run format:check
npm run lint
npm run type-check
npm run check:max-lines
npm run check:privacy
npm run test:privacy
npm run check:e2e-assertions
npm run check:e2e-waits
npm run check:e2e-bare-skips
npm run build
```

Also parse `_bmad-output/implementation-artifacts/sprint-status.yaml`, run `git diff --check`, inspect the complete tracked and ignored diff, prove exact-manifest equality, prove package/lock/config/planning/forbidden paths unchanged, scan evidence for credential leakage, and retain exact exit codes plus complete failure output. Do not introduce a required CI gate.

### Independent Sequential Review Contract

1. Finish implementation, targeted/browser evidence, universal gates, privacy cleanup, and exact-scope proof.
2. Compute and record a deterministic frozen hash over all eight manifest paths, including ignored Story/ATDD files.
3. A fresh independent reviewer who did not author the change reviews code, canonical AC, tests, security/privacy, and evidence. Required terminal verdict: `APPROVE`.
4. Resolve every accepted finding test-first. Any edit invalidates the frozen hash and any verdict; rerun affected gates and restart the pair.
5. Only after `APPROVE`, a different fresh independent reviewer who did not author the change reviews architecture, ownership, allowed/forbidden scope, contracts, lifecycle, and evidence on the same frozen hash. Required terminal verdict: `CLEAR`.
6. Integration requires the chronological pair `APPROVE` then `CLEAR`, both bound to the identical frozen hash, with zero unresolved accepted findings. Parallel, reversed, stale-hash, self-review, advisory-only, or superseded verdicts do not satisfy the gate.

### Git Lifecycle, Force-Stage, Merge, and Cleanup

The commands below are future lifecycle requirements, not actions performed during Story creation.

Before staging, print the exact approved manifest and prove no ninth path exists. Because `_bmad-output/` is ignored, force-stage only the two ignored evidence artifacts, then stage the six tracked paths explicitly:

```bash
git add -f -- \
  _bmad-output/implementation-artifacts/167-4-fe-migrate-registration-register.md \
  _bmad-output/test-artifacts/atdd-checklist-167.4.md
git add -- \
  _bmad-output/implementation-artifacts/sprint-status.yaml \
  'src/app/(auth)/register/__tests__/page.test.tsx' \
  src/components/custom/RegistrationForm.test.tsx \
  e2e/onboarding.spec.ts \
  'src/app/(auth)/register/page.tsx' \
  src/components/custom/RegistrationForm.tsx
git diff --cached --check
git diff --cached --name-only
```

The cached names must equal the exact eight-file manifest. Unstage and stop on any mismatch. Then use the canonical lifecycle from `.omx/plans/167.4-migrate-registration.md`: detailed conventional subject `feat(shadcn): deliver Story 167.4`, push only the Story branch, create a ready PR targeting `main`, and merge normally only after local gates and the sequential review pair. No direct push to `main`, no force push, no deploy, and no production operation.

After the PR reports merged, run the plan's checkout-independent cleanup from the primary checkout: synchronize `main`; prove merge ancestry; delete the remote branch; remove `/private/tmp/wb-fe-167-4-migrate-registration` without force; delete the local branch; run `git worktree prune`; and prove the exact path, worktree-list entry, local branch, and remote branch are absent. Never force-remove a lane to conceal unmerged changes.

### Project Structure Notes

- Keep the route at `src/app/(auth)/register/page.tsx` and the exclusive form at `src/components/custom/RegistrationForm.tsx`.
- Do not relocate `RegistrationForm`, extract a shared auth form framework, or add a shared error classifier from this route Story.
- Consume the merged semantic foundation and existing generic shadcn primitives without modifying `src/components/ui/**`.
- Use route-owned composition classes to meet comfortable form, theme, wrapping, and `44×44` target requirements.
- Keep API response interpretation in existing API/type owners; the form coordinates only the existing request and Story-owned presentation/recovery/navigation behavior.
- Preserve the non-registration prefix and suffix of `e2e/onboarding.spec.ts` byte-for-byte.

### Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Existing ATDD work is overwritten or mislabeled | Freeze current hashes, edit neither ATDD nor E2E during context creation, preserve three skipped proposals, and distinguish design metadata/list collection from genuine executed RED |
| Shared auth or primitive scope expands | Enforce the exact manifest and Forbidden Shared Files; stop and route the need to the named owner |
| Visual migration changes account creation | Lock the exact client, payload, endpoint, `skipAuth`, failure retention, and one `/login` transition before production edits |
| Same-tick or retry duplication creates multiple accounts | Use active held-promise/rapid-gesture tests, a synchronous form lock, no automatic retry, bounded deliberate retry, and a terminal success lock |
| Toast-only failure is inaccessible or unactionable | Put safe error and recovery semantics in the affected form/field, associate and focus them, and keep toast secondary only |
| Retained password leaks through evidence | Keep it masked in the input only; use synthetic credentials; scan URL/history/source/console/artifacts; disable or sanitize capture; clean browser outputs |
| Responsive repair edits generic primitives | Apply route/form-owned sizing and layout only; primitives remain forbidden |
| Stale prerequisite prose conflicts with Git truth | Record base/merge ancestry and verify remote cleanup without modifying Story 167.3 or unrelated sprint rows |
| Review verdict applies to stale bytes | Bind sequential `APPROVE` then `CLEAR` to one deterministic eight-path snapshot hash; restart after any edit |
| Repository lane remains after merge | Treat remote/local branch deletion, exact worktree removal, prune, and absence proof as Story completion blockers |

### References

- [Source: `.omx/plans/167.4-migrate-registration.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md#Standard-Story-Execution-Protocol`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1674-Migrate-Registration-register`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Universal-Story-Delivery-Contract`]
- [Source: `_bmad-output/planning-artifacts/shadcn-route-ledger.md#Route-Ownership`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Journey-1-First-Time-Value-Registration-to-Credible-Margin`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design-Accessibility`]
- [Source: `_bmad-output/implementation-artifacts/167-3-fe-migrate-login-login.md`]
- [Source: `_bmad-output/test-artifacts/atdd-checklist-167.4.md`]
- [Source: `src/app/(auth)/register/page.tsx`]
- [Source: `src/app/(auth)/register/__tests__/page.test.tsx`]
- [Source: `src/components/custom/RegistrationForm.tsx`]
- [Source: `src/components/custom/RegistrationForm.test.tsx`]
- [Source: `e2e/onboarding.spec.ts#Register-Page-Functionality`]
- [Source: `src/lib/api.ts#registerUser`]
- [Source: `src/types/auth.ts#RegisterRequest`]
- [Source: `package.json`]

## Dev Agent Record

### Agent Model Used

GPT-5.6 bounded implementation/evidence agents for the direct RED-to-GREEN, browser/accessibility/privacy, three independent candidate-review repair rounds, and documentation-handoff slices. Frozen candidate 3 ended with terminal verdict `REJECT`; its accepted M-1 classifier finding is repaired and revalidated, but the required new deterministic freeze and fresh sequential `APPROVE` then `CLEAR` pair have not executed successfully.

### Debug Log References

- Story context created on `2026-08-14` from base `c2a96943ff65a6ce60467608b01c17ad3a901716` on branch `cdx/epic-167-story-4-register` in `/private/tmp/wb-fe-167-4-migrate-registration`.
- At Story creation, existing ATDD Steps 1–5 were accepted as a bounded design/generation/validation checkpoint: the three E2E proposals were still skipped, Playwright list collection was valid after the touch-context correction, and genuine executed RED was still incomplete. Later checkpoints preserve and supersede that historical state.
- Story creation does not claim test execution, browser execution, implementation, RED, GREEN, review, staging, commit, push, PR, merge, or cleanup.
- Direct RED authoring began on `2026-08-14` after the branch, concurrent ATDD/E2E work, and protected production/E2E hashes were verified. No direct test has executed yet, so RED is not claimed at this lifecycle transition.
- Authoritative direct RED executed with the pinned command on unchanged production: exit `1`; 2/2 files failed; 22 tests collected; 10 passed and 12 failed in `2.49s`. Collection, Prettier, scoped zero-warning ESLint, TypeScript `--noEmit`, and `git diff --check` are clean. The failures are the intended Story-owned gaps recorded in the ATDD checklist; no fixture, environment, timeout, skip/todo/only, or unrelated failure qualifies the verdict.
- Production implementation began only after reconfirming the exact worktree/branch, zero staging, `HEAD`/`main`/`origin/main`/merge-base at `c2a96943ff65a6ce60467608b01c17ad3a901716`, prerequisite merge history through PR `#157`, the recorded RED production hashes, the exact contributor-owned status, and every protected SHA-256. Local and remote-tracking Story 167.3 branch refs plus its worktree entry are absent; authoritative live remote deletion proof remains deferred to the lifecycle gate, so Task 1 stays open.
- The first production iteration reached 21/22 direct tests; the remaining invalid-summary failure was repaired by consuming React Hook Form's fresh invalid-callback errors rather than prior-render `formState`. A later line-count simplification briefly exposed TanStack Query's second mutation-context argument by passing `registerUser` directly; the final local one-argument wrapper restored the exact sole-call contract without changing tests.
- Final authoritative targeted GREEN used `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx`: exit `0`; 2/2 files passed; 22/22 tests passed; duration `2.36s`.
- Final scoped gates on Node `v24.18.0` and npm `11.11.0`: four-file Prettier `--check` exit `0`; four-file ESLint `--max-warnings 0` exit `0`; `/opt/homebrew/opt/node@24/bin/node ./node_modules/typescript/bin/tsc --noEmit` exit `0`; `git diff --check` exit `0`. Browser, universal-suite, build, review, staging, and Git lifecycle gates were intentionally not run in this bounded mission.
- Browser evidence mission baseline at `2026-08-14 10:34 MSK` matched branch `cdx/epic-167-story-4-register`, HEAD/base/merge-base `c2a96943ff65a6ce60467608b01c17ad3a901716`, zero staging, Status/sprint `in-progress`, and every supplied protected SHA-256. The full E2E file was frozen at mission start as `/tmp/story-167-4-onboarding.mission-start.ts` with SHA-256 `0b22abc4ce99f616bfc1c654f151790f98d7899d505fc3342d227bb97d54a936`, compared after editing, and removed during credential-residue cleanup.
- Task 1 is now complete: no local Story 167.3 branch, remote-tracking ref, or worktree entry exists, and root's authorized `2026-08-14 10:32 MSK` remote check exited `0` with empty output. The bounded recheck could not resolve `github.com` and exited `128`; it is recorded as a network gap rather than contradicting the authoritative empty result. Sprint status was not edited for this correction.
- Only the three registration-local `test.skip()` wrappers for `REG-BROWSER-01`, `REG-BROWSER-02`, and `REG-BROWSER-03` were removed semantically. Repository Prettier then normalized only the owned registration block; mission-start prefix/suffix comparison proves every byte outside `Register Page Functionality` remains identical. Static CI list-only collection exits `0` with 7 collected tests in 1 file: 4 setup dependency tests plus the 3 active Story IDs.
- Browser execution is environment-blocked, not product-failed: the exact pinned `npm run dev` launch from this worktree captured PID `75789` but exited before readiness with `listen EPERM 0.0.0.0:3100`; it created no listener. A later, unowned PID `82734` appeared on port 3100 with this shared worktree as cwd, but it is not the captured process, remains unreachable from the sandbox, and was preserved untouched. The existing contributor-owned backend listener was likewise not touched. Official preflight-gated list and targeted execution both exit `1` before browser launch with `Frontend unavailable` and `Backend unavailable`; the post-format exact targeted rerun has the same result. Consequently no rendered geometry, keyboard, touch, hydration, console, browser privacy, automated browser accessibility, screen-reader, or non-Chromium pass is claimed.
- Post-format non-browser gates on Node `v24.18.0`/npm `11.11.0`: Prettier `--check` exit `0`; scoped zero-warning ESLint exit `0`; TypeScript `--noEmit` exit `0`; `check:e2e-assertions` exit `0` (19 files); `check:e2e-waits` exit `0` (47 timer-free owned targets); `check:e2e-bare-skips` exit `0` (0 bare skips); and `git diff --check` exit `0`. Task 6 remains open and the next handoff is execution of the same official target on an authorized host that can bind/reach localhost ports 3100/3000.

### Root-Host Chromium RED Diagnostic Continuation — 2026-08-14

- Newer authoritative root-host evidence used `/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'` with the repository network-guard bootstrap, mutation guard, outbound-network policy, Chromium Desktop device, empty storage state, and trace/screenshot/video disabled. Exit was `1`; all three Story tests executed in about `37.8s`: `REG-BROWSER-01` **FAIL**, `REG-BROWSER-02` **FAIL**, and `REG-BROWSER-03` **PASS**. This supersedes the earlier managed-sandbox no-execution gap only for those real Chromium results; the earlier localhost blocker remains preserved as truthful mission history.
- `REG-BROWSER-01` failed at the exact Russian short-password visibility oracle after `password.fill('коротко')` plus keyboard `Tab`. The bounded harness repair changes only the interaction stimulus to the unambiguous seven-character value `1234567` and explicit `password.blur()`. The exact message `Пароль должен содержать минимум 8 символов`, `aria-invalid="true"`, wrapping, non-overflow, and non-color assertions remain unchanged.
- `REG-BROWSER-02` timed out at the separate `page.waitForRequest(...)` observer while the installed route handler was itself holding the matching request behind a response gate. The repaired block now records the intercepted request directly from `route.request()` before waiting on that gate, asserts through guarded `expect.poll` that it is exactly `POST /v1/auth/register`, and removes the loose request-event promise. Before submit, a seven-character password blur must produce the exact validation message and invalid semantics; correcting it to the synthetic valid password must clear the message and invalid state. The final email/password values, enabled submit, and native form validity are asserted before activation; the pending disabled submit is asserted after activation. The held response, privacy checks, strict empty console/page-error oracles, and exact `/login` navigation remain intact. Direct 22/22 GREEN remains the authoritative exact payload contract; no production or direct-test mutation was inferred.
- The diagnostic mission did not rerun Chromium and makes no post-repair browser result claim. Static evidence after the E2E edit is clean on Node `v24.18.0`/npm `11.11.0`: E2E Prettier `--check`, scoped ESLint `--max-warnings 0`, TypeScript `--noEmit`, `check:e2e-assertions` (19 files), `check:e2e-waits` (47 timer-free owned targets), `check:e2e-bare-skips` (0 bare skips), static collection of exactly the three active Story IDs, and `git diff --check` all exit `0`. Current E2E SHA-256 is `909b74cf545a374445b15031102eaeb06522f18bc6fe9c3f104f8dc6082e8046`; the protected prefix and suffix remain byte-identical at `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668` and `685f8b06ba2b8cafe4ca739e3a1521c432370fadc992d7c575669f0d7b327665`.
- Task 6 and all browser-dependent subtasks remain open. Tasks 7–8 remain open, Story/sprint status remains `in-progress`, and no browser GREEN, universal-gate completion, review, staging, commit, push, PR, merge, or cleanup is claimed. Root handoff is the same exact isolated command above; the next evidence must record each of `REG-BROWSER-01`, `REG-BROWSER-02`, and `REG-BROWSER-03` independently from that real rerun.

### Root-Host Identical Blur RED Continuation — 2026-08-14

- Newer authoritative host evidence for E2E SHA-256 `909b74cf545a374445b15031102eaeb06522f18bc6fe9c3f104f8dc6082e8046` used the exact command `/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'`: exit `1`; `3` tests executed; duration `13.0s`; `REG-BROWSER-01` **FAIL** at line `226`; `REG-BROWSER-02` **FAIL** at line `362`; `REG-BROWSER-03` **PASS**. Both failures were identical: after `password.fill('1234567')` and `password.blur()`, exact text `Пароль должен содержать минимум 8 символов` was not found within `5s`. The earlier request-observation timeout was not reached in this round.
- The identical failures after explicit blur isolate the remaining defect to the shared final-navigation readiness boundary: both scenarios stopped at `domcontentloaded`, where SSR form markup can be visible before the client RHF `onBlur` handler is attached. Direct Vitest remains independently GREEN `22/22` for the same seven-character on-blur contract, so production and direct tests remain protected.
- The smallest E2E-only repair makes only the two final interaction navigations await the browser `load` lifecycle event, enters the invalid password with real sequential keyboard input, and uses keyboard `Tab` for blur. `REG-BROWSER-02` uses `ControlOrMeta+A`, sequential valid-password entry, and keyboard `Tab` for the later recovery. The exact Russian message, `aria-invalid` invalid/valid transition, later valid-password recovery, intercepted exact `POST /v1/auth/register`, pending submit lock, privacy evidence, strict empty console/page-error oracles, held response, and one `/login` navigation remain unchanged. No request body is inspected or logged.
- Pinned non-browser validation is GREEN: E2E Prettier `--check`, scoped ESLint `--max-warnings 0`, TypeScript `--noEmit`, `check:e2e-assertions` (19 files), `check:e2e-waits` (47 timer-free owned targets), `check:e2e-bare-skips` (0 bare skips), exact isolated static collection (3 active tests in 1 file), and `git diff --check` all exit `0`. Post-repair E2E SHA-256 is `55351d51841d4932b20107ef5f9e738a48553010925a929d1514cf059b296c40`; protected prefix/suffix remain exact at `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668` and `685f8b06ba2b8cafe4ca739e3a1521c432370fadc992d7c575669f0d7b327665`.
- This bounded mission did not rerun Chromium and makes no post-repair browser GREEN claim. Task 6 and all browser-dependent subtasks remain open; Tasks 7–8 remain open; Story/sprint status remains `in-progress`; and no universal-gate completion, review, staging, commit, push, PR, merge, or cleanup is claimed.
- The newer candidate-review, repair, browser, targeted, and universal evidence is recorded in the final current-state section below. The historical `24/24`, earlier E2E synchronization, and earlier universal results in this debug chronology remain valid checkpoints, but they are not the current repaired-byte counts or hashes.

### Completion Notes List

- Ultimate context engine analysis completed; comprehensive developer guide created from the canonical OMX plan, BMAD Story/route ledger, UX contract, current brownfield source/tests, prior Story intelligence, and existing ATDD evidence.
- Status remains `in-progress`. Tasks 1–6 are complete. Task 7 universal gates and exact-scope audit are complete, while its snapshot freeze and sequential reviews remain open; Task 8 remains open.
- Historical implementation RED remains `12` intended failures with `10` passing preservation tests, followed by historical `22/22`, `24/24`, and `25/25` GREEN checkpoints. Frozen candidate 2 then produced a distinct authoritative repair RED: after one explicitly non-counted selector-authoring failure, the corrected-selector run exited `1` with `1` intended failure and `25` passes of `26` across `2` files in `2.90s`.
- Current targeted implementation evidence is GREEN at `2/2` files and `27/27` tests; the authoritative final current-byte targeted rerun passed in `3.34s`.
- Current implemented behavior retains the validation-gated retry and live RHF association repairs, safely interprets established lower-cased `password`/`пароль` HTTP `4xx` backend signatures as password-policy feedback without rendering raw detail, keeps credentials masked, focuses and associates the safe message, and clears stale password-policy feedback on password edit.
- Historical host Chromium, manual browser review, contrast repair, earlier reviews, and accessibility evidence remain valid chronology. The authoritative current-byte Chromium result is exactly `3/3` passed in `3.9s`: `REG-BROWSER-01` `2.5s`, `REG-BROWSER-02` `687ms`, and `REG-BROWSER-03` `208ms`.
- No dependency or latest-version decision is needed; use the repository-pinned toolchain and current declarations.
- The strengthened visible-focus oracle covers email, password, submit, and the semantic login link in both themes: it captures unfocused computed styles, presses real `Tab`, preserves `toBeFocused()`, and requires either a changed box-shadow or a changed visibly rendered outline. A permanent base shadow alone cannot pass.
- Privacy and logger claims are deliberately separated: the strict clean in-page console/page-error oracle applies only to the success journey. `REG-BROWSER-01` executes the real production non-2xx chain with synthetic non-sensitive JSON `503`; its local server output contained the expected shared logger error, and it neither captures nor proves shared logger cleanliness. The shared raw-body concern remains `OUT_OF_SCOPE_BASELINE_GAP`; shared files are unchanged and Story 167.4 does not claim closure.
- Historical RED checkpoint: a later root-host Chromium run established `01 FAIL / 02 FAIL / 03 PASS`; the bounded E2E-only repair strengthened blur, hydration/readiness, form-validity, pending-state, and route-interception synchronization without changing production, direct tests, payload/privacy/navigation intent, or any Story lifecycle checkbox. At that checkpoint, post-repair Chromium remained unexecuted and Task 6 remained open.
- Historical RED checkpoint: the next root-host rerun again established `01 FAIL / 02 FAIL / 03 PASS`, with both failures identically missing the exact short-password message after explicit `fill('1234567')` plus `blur()`. The follow-up repair moved the shared interaction boundary from `domcontentloaded` to `load` and used real sequential keyboard entry plus `Tab`; at that checkpoint, post-repair Chromium remained unexecuted and GREEN was not claimed.
- Current lifecycle remains exact: Task 6 is complete; Task 7 universal/local-gate and exact-scope subtasks are complete; Task 7 freeze and sequential `APPROVE` then `CLEAR` remain open; Task 8 remains open; Story and sprint remain `in-progress`. No approval, frozen candidate, review-ready transition, staging, commit, push, PR, merge, cleanup, or deployment is claimed.
- Frozen-candidate-4 review accepted one LOW documentation-consistency finding: the live Story/ATDD summaries retained the superseded `26/26` count and candidate-2 Chromium timings. This bounded documentation-only repair reconciles those live surfaces to the final current-byte evidence while preserving older sections as history; it does not establish a current freeze, `APPROVE`, or `CLEAR`.

### File List

- `src/app/(auth)/register/page.tsx` — production mutation in this slice: complete route content moved into one semantic responsive `main` while preserving the one `h1`, Russian purpose copy, form composition, and `/login` link.
- `src/components/custom/RegistrationForm.tsx` — production mutation across implementation and review-repair slices: local geometry, live RHF-derived validation summary/association, safe classified recovery with password-policy signatures bounded to HTTP 4xx, validation-gated retry/submission/terminal locks, exact request/navigation behavior, disabled SSR/pre-hydration named credential controls, hydration enablement without request-busy semantics, duplicate-feedback clearing on email change, and Story-local `Повторить` minimum geometry.
- `_bmad-output/implementation-artifacts/167-4-fe-migrate-registration-register.md` — ignored evidence artifact preserving historical execution and recording frozen-candidate-2 `REJECT`, its accepted findings, authoritative 26-test RED→GREEN repair, corrected logger/focus/timing boundaries, invalidated freeze, and open review/lifecycle handoff.
- `_bmad-output/test-artifacts/atdd-checklist-167.4.md` — ignored ATDD artifact preserving historical RED/browser evidence and recording the current `27/27` GREEN phase, authoritative browser/universal evidence, corrected logger/focus/timing boundaries, invalidated freeze, and open review/lifecycle gates.
- `src/app/(auth)/register/__tests__/page.test.tsx` — pre-existing contributor-owned direct RED/GREEN test change; protected and unchanged by this slice.
- `src/components/custom/RegistrationForm.test.tsx` — direct RED/GREEN suite plus regressions for pre-hydration named-control locking, corrected-email duplicate retry, invalid edited network-recovery attempts, exact corrected retry, retry geometry, live summary removal/association, masked/associated lower-cased HTTP-422 password-policy signature handling with stale-feedback clearing, and hostile password-like HTTP-500 detail remaining generic service recovery.
- `e2e/onboarding.spec.ts` — only the existing registration evidence block changed: the three Story 167.4 wrappers are active and the owned block is Prettier-normalized; every non-registration byte is preserved from mission start.
- `e2e/onboarding.spec.ts` — later bounded browser-RED diagnostic continuation: `REG-BROWSER-01` now uses `1234567` plus explicit blur; `REG-BROWSER-02` adds an RHF readiness/validity handshake, pending-state proof, and route-handler request observation in place of the loose `waitForRequest` promise. All original exact privacy, console, endpoint, and navigation oracles remain active.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — pre-existing contributor-owned Story lifecycle change; protected and unchanged by this slice.
- `e2e/onboarding.spec.ts` — newer bounded readiness continuation: only the two final Story interaction navigations now wait for `load`, and the short/valid password transitions use sequential keyboard entry plus real `Tab` blur; all endpoint, pending, privacy, console/page-error, response, and one-navigation oracles remain intact.
- `e2e/onboarding.spec.ts` — active current wording no longer describes the scenario as RED or inherited `36px`: the title states that primary controls remain usable across the responsive/theme matrix and the comment states the retained `44px` minimum target. Historical RED checkpoints remain preserved in the evidence artifacts.
- `e2e/onboarding.spec.ts` — current registration-block evidence executes the one-shot synthetic non-sensitive `503` production branch and uses a before/after computed-style delta plus real `Tab`/`toBeFocused()` for all four focusable controls in both themes; protected non-registration prefix/suffix remain exact.

### Change Log

| Date | Change |
| --- | --- |
| 2026-08-14 | Story created and checklist-hardened as a comprehensive implementation-ready registration migration guide; existing ATDD Steps 1–5 and skipped E2E proposals are preserved, while genuine direct RED, implementation, GREEN, browser evidence, reviews, staging, Git integration, merge, and cleanup remain pending. |
| 2026-08-14 | Transitioned Story 167.4 from `ready-for-dev` to `in-progress` and began active direct RED authoring; execution evidence and any RED verdict remain pending. |
| 2026-08-14 | Completed the active direct RED slice against byte-identical production: 22 targeted tests collected, 10 preservation tests passed, and 12 intended Story-owned expectations failed; static gates are clean and production implementation is the immediate handoff. |
| 2026-08-14 | Completed the bounded production direct RED-to-GREEN handoff without weakening protected tests: final targeted 22/22 GREEN in `2.36s`, scoped Prettier/ESLint/TypeScript/diff gates exit `0`, and only the two production files plus permitted Story/ATDD evidence were mutated by this mission. Browser, universal, review, staging, and Git lifecycle work remains pending; Status stays `in-progress`. |
| 2026-08-14 | Completed Task 1 from authoritative Git absence evidence and activated all three registration-local browser scenarios without changing non-registration E2E bytes. Static collection and all non-browser E2E quality gates pass, but official Playwright execution is blocked before launch because this sandbox cannot bind or reach localhost services; Task 6, Tasks 7–8, and Status remain open/`in-progress`. |
| 2026-08-14 | Recorded newer root-host real Chromium RED exactly as `REG-BROWSER-01` FAIL, `REG-BROWSER-02` FAIL, `REG-BROWSER-03` PASS, then applied the smallest E2E-only synchronization repairs: explicit seven-character blur, RHF readiness/validity proof, pending-submit proof, and request capture from the installed route handler. Static gates and protected-boundary hashes pass; no post-repair browser rerun or GREEN is claimed, and Task 6 plus Status remain open/`in-progress`. |
| 2026-08-14 | Recorded the newer 13.0s host rerun exactly: both `REG-BROWSER-01` and `REG-BROWSER-02` still failed at the identical exact Russian short-password oracle after explicit fill/blur, while `REG-BROWSER-03` passed and the request-observation timeout was not reached. Applied an E2E-only `load` lifecycle plus real sequential keyboard/Tab readiness repair; pinned static gates pass, protected E2E boundaries remain exact, no post-repair browser GREEN is claimed, and Tasks 6–8 plus Status remain open/`in-progress`. |
| 2026-08-14 | Closed Task 6 only after the dynamic axe scan, manual browser review, bounded input-border contrast RED→GREEN repair, and final 3/3 host Chromium rerun passed. Closed Task 7 universal-gate and exact-scope-audit subtasks from the pinned all-GREEN sequence and exact eight-file audit; snapshot freeze, independent reviews, integration, and Status remain open/`in-progress`. |
| 2026-08-14 | Recorded Review 1 terminal verdict `REJECT` with four accepted findings, adjudicated the shared non-2xx logging defect as `OUT_OF_SCOPE_BASELINE_GAP`, and recorded the bounded repair RED (`2` intended failures/`22` passes/`24` total) through final targeted `24/24` GREEN, including the `2.57s` post-compaction rerun. No fresh post-repair Chromium/full-suite/build, approval, freeze, staging, integration, or cleanup is claimed; Story/sprint remain `in-progress`. |
| 2026-08-14 | Recorded authoritative post-Review-1 evidence: fresh targeted `24/24` GREEN in `2.83s`; the first Chromium `1 failed/2 passed` synchronization diagnosis; the E2E-only web-first enabled-state repair with final hash `557f332263a5a84847834d7a898b33f053eeb64a2d9837db7f87ea046409eac8`; authoritative Chromium `3/3` GREEN in `3.3s`; pinned universal/local-gate GREEN; and the corrected exact eight-path scope audit. Task 7 freeze plus sequential `APPROVE` then `CLEAR`, Task 8, and Story/sprint `in-progress` remain open; no later lifecycle or deployment claim is made. |
| 2026-08-14 | Recorded the current frozen-candidate review `REJECT`, four accepted Story-owned findings, bounded `25`-test repair RED→GREEN, source hashes, honest post-repair Chromium RED, one-line E2E keyboard-blur repair, final `3/3` Chromium GREEN, independent `25/25` rerun, fresh universal/build evidence including the two environment-only `EPERM` first attempts, and exact-scope proof. The old eight-path freeze is invalidated; Task 7 freeze and sequential `APPROVE` then `CLEAR`, Task 8, and Story/sprint `in-progress` remain open. |
| 2026-08-14 | Recorded frozen candidate 2 terminal `REJECT` and all four accepted findings; synchronized the honest selector-corrected `1`-failure/`25`-pass RED, final `26/26` GREEN, real computed-style focus delta, truthful synthetic-`503` production/logger boundary, authoritative `3/3` Chromium timing (`2.2s`/`697ms`/`205ms`, `3.5s` total), fresh universal/build evidence, invalidated old freeze, and open Task 7/8 lifecycle. Story and sprint remain `in-progress`; no approval or integration is claimed. |
| 2026-08-14 | Recorded frozen candidate 3 terminal `REJECT` and accepted M-1 service-classifier finding; added an honest hostile-password-like HTTP-500 RED (`1` intended failure/`23` passes), bounded password-policy recognition to HTTP 4xx, reached final direct `27/27` GREEN, and passed focused format/lint/type/max-lines/diff checks. Candidate freeze 3 is invalidated; Task 7 freeze/reviews and Task 8 remain open, with Story/sprint still `in-progress`. |
| 2026-08-14 | Repaired the single accepted frozen-candidate-4 LOW documentation-consistency finding by reconciling the live Story/ATDD summaries to current `27/27` targeted GREEN and the final `2.5s`/`687ms`/`208ms`, `3.9s` Chromium set while preserving historical checkpoints. Task 6 remains complete; Task 7 freeze/reviews and Task 8 remain open; Story/sprint remain `in-progress`; no current freeze, `APPROVE`, or `CLEAR` is claimed. |

### Root-Host Pending Accessible-Name Oracle Repair — 2026-08-14

- Newer authoritative root-host evidence used the exact command `/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'`: exit `1`; `3` tests executed; duration `8.6s`; `REG-BROWSER-01` **PASS** in `1.9s`; `REG-BROWSER-02` **FAIL** in `5.6s`; and `REG-BROWSER-03` **PASS** in `239ms`.
- `REG-BROWSER-02` reached submit successfully. Its line 381 pending oracle `await expect(submit).toBeDisabled()` timed out because `submit` was the locator bound before activation to accessible name `Зарегистрироваться`, while production truthfully changed that same disabled, busy button's accessible name to `Регистрация...` during the held pending request. The generated `test-results` context preserved this exact failure: `.last-run.json` reported status `failed` with failed test ID `fe534f0825407f213faa-46e826f1954818256fa3`, and `error-context.md` showed disabled email/password controls plus a disabled button named `Регистрация...`; their SHA-256 values were `ea6cfa07daf88106b9a2f82245a35dd893f9a899e45f93d8fe380d9a327b3f58` and `24aa6c76ef99cf215546f7a5de76645f4c90f1a4d9e611e37832f17b4c696424` respectively.
- This is a demonstrated E2E locator/oracle defect, not a production defect. The smallest Story-block-only repair keeps the earlier enabled `Зарегистрироваться` pre-submit oracle unchanged, then locates the real pending button by exact accessible name `Регистрация...` and asserts both disabled state and `aria-busy="true"`. Every later intercepted-request, URL/source/history/console credential-privacy, masked-password, held-response, strict console/page-error, and single `/login` navigation oracle remains unchanged; no wait, retry, skip, conditional, or production/direct-test mutation was added.
- No post-repair Chromium rerun occurred in this bounded mission, so browser GREEN is not claimed. Task 6 and all browser-dependent subtasks remain open; Tasks 7–8 remain open; Story/sprint status remains `in-progress`; and no universal-gate completion, review, staging, commit, push, PR, merge, or cleanup is claimed.

### Root-Host During-Submission Privacy-Oracle Failure and Bounded Repair — 2026-08-14

- The newest authoritative root-host Chromium execution used the exact command `/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'`: exit `1`; three tests completed in `3.5s`; `REG-BROWSER-01` **PASS** in `1.8s`; `REG-BROWSER-02` **FAIL** in `578ms`; and `REG-BROWSER-03` **PASS** in `232ms`.
- The repaired accessible-name, disabled-state, and `aria-busy` pending oracles passed. `REG-BROWSER-02` then reached line `394`, where `expect(sourceDuringSubmission).not.toContain(SYNTHETIC_EMAIL)` failed. Playwright `page.content()` serializes the live DOM, including the exact value intentionally retained by the disabled email input; the failure context likewise showed the masked password input retaining its exact value. Those two inputs are intentional credential carriers already required by exact value assertions, so counting their own values as a document leak made the during-submission oracle self-contradictory. This is an E2E privacy-oracle defect, not a production defect.
- Before cleanup, the generated authoritative residue was preserved by hash: `test-results/.last-run.json` SHA-256 `ea6cfa07daf88106b9a2f82245a35dd893f9a899e45f93d8fe380d9a327b3f58`; `test-results/onboarding-Onboarding-Flow-72e8b-tion-and-credential-privacy-chromium/error-context.md` SHA-256 `47d7901c1cb499bd4daf189f09ec93717ab81c6571a28e668719b0e0e2aab8ed`. The earlier managed-sandbox-only browser launch attempt remains historical evidence: it failed before test bodies because Chromium could not acquire the required MachPort permission and is not product RED.
- The smallest Story-block-only repair preserves the exact email/password input value assertions and password masking, then scans a detached clone of `document.documentElement`. It first counts exactly one intended registration email control and one intended registration password control by form/name/type/autocomplete identity; only when both counts equal one does it blank and remove the `value` carrier on those two cloned controls. Serialization of the detached clone still covers document scripts, text, every other element, and every other attribute. The page evaluation returns only the two counts and two compact leak booleans, so a failure cannot dump the serialized document, and the live page is never mutated.
- URL, observed-history, console, post-navigation source, intercepted request path/method, response gate, strict console/page-error, and exact one-`/login`-navigation oracles remain unchanged. The request body is neither inspected nor printed. No production source, direct test, package/lock/config/planning file, sprint row, or non-registration E2E byte was changed.
- No post-repair Chromium rerun occurred, so browser GREEN is not claimed. Task 6 and every browser-dependent subtask remain open; Tasks 7–8 remain open; Story and sprint status remain `in-progress`; and no universal-gate completion, review, staging, commit, push, PR, merge, or lifecycle cleanup is claimed.

### Privacy-Oracle Repair Static Validation and Residue Cleanup — 2026-08-14

- Pinned Node `v24.18.0` and npm `11.11.0` validation is clean: E2E Prettier `--write`, scoped ESLint `--max-warnings 0`, TypeScript `--noEmit`, `check:e2e-assertions` (19 files), `check:e2e-waits` (47 timer-free owned targets), `check:e2e-bare-skips` (0 bare skips), exact isolated static collection (3 active Story tests in 1 file), and `git diff --check` all exited `0`. Static collection did not run a test body or browser.
- Final E2E SHA-256 for this repair is `79afffd5585a5e7f57c13867fb08a5c78805f25d0f6e3b2e3b697862c7bc949f`. Mechanically replacing only the new detached-clone scan with the prior six-line `page.content()` oracle reconstructs the required mission-start SHA-256 `6135f352feda4fc63742e67ff21c6a61714e6781a6556534cbbbd05a7f375e9f`. The protected prefix and suffix remain exact at `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668` and `685f8b06ba2b8cafe4ca739e3a1521c432370fadc992d7c575669f0d7b327665`.
- Contributor-owned sprint, route/form production, and direct-test files; package/lock/plan; and Playwright network/mutation/outbound policy files all retained their preflight hashes. The Git index remains empty. The exact eight-path lifecycle manifest remains the only changed/evidence surface when the two ignored append-only evidence files are included.
- Before deletion, the two generated browser residue files re-matched their recorded hashes, were ignored and untracked, and had no open file handles. Only the ignored `test-results` directory was removed; it is now absent. Backend PID `9905` and frontend PID `82734` were not touched or inspected through process-control operations.
- Chromium was not rerun. Task 6/browser subtasks, Task 7, Task 8, Story, and sprint remain open/`in-progress`.

### Authoritative Root-Host Chromium GREEN Evidence — 2026-08-14

- The newest authoritative root-host execution used the byte-identical final E2E file with SHA-256 `79afffd5585a5e7f57c13867fb08a5c78805f25d0f6e3b2e3b697862c7bc949f` and the exact command `/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'`.
- The command exited `0` using one worker: `3 passed (3.2s)`. Independent results were `REG-BROWSER-01` **PASS** in `1.8s`, `REG-BROWSER-02` **PASS** in `624ms`, and `REG-BROWSER-03` **PASS** in `208ms`. The sole `NO_COLOR`/`FORCE_COLOR` process warning is non-product and did not relax the strict in-page console/page-error oracles.
- `REG-BROWSER-01` therefore proves its unchanged rendered matrix: widths `320/390/768/1024/1280/1440`, light/dark themes, 200%-equivalent reflow, reduced motion, Russian validation wrapping/non-color invalid meaning, no page-level horizontal overflow, and at least `44×44` CSS-pixel primary controls. `REG-BROWSER-02` proves keyboard task order and visible focus in both themes, hydrated on-blur validation/recovery, valid/enabled pre-submit state, disabled and busy pending state, exact intercepted `POST /v1/auth/register`, masked password, detached-clone/URL/history/source/console credential privacy, empty hydration-warning/console/page-error channels, response release, and navigation to `/login`. `REG-BROWSER-03` proves real touch activation of the semantic `Войти` link and `/login` navigation.
- This exact matrix does not run axe, a screen reader, or a human manual reading-order/non-color/responsive review. The combined automated-accessibility/manual-review subtask remains open as an explicit gap; no assistive-technology or non-Chromium result is inferred. Task 6 and its three browser execution/matrix subtasks are closed from the genuine GREEN evidence above, while Tasks 7–8 remain open and Story/sprint status remains `in-progress`.
- Successful generated residue consisted only of ignored, untracked `test-results/.last-run.json`, whose exact content reported `status: passed` with `failedTests: []` and whose SHA-256 was `91d1c43004802cd49950d78eb11c8fa7d05da8ffffe219a8b13b2f561bc00903`. `git check-ignore -v` attributed it to `.gitignore:46:/test-results/`; `git ls-files --error-unmatch` proved it untracked; and `lsof -- test-results/.last-run.json` returned no open handle. Only that generated `test-results` residue was then removed and its absence verified; no service process was manipulated.
- Protected E2E prefix/suffix SHA-256 values remain `1595ed0683c3f5dac7e9447b498cf814ad57e1df4c2a8f76fe4206e38b307668` and `685f8b06ba2b8cafe4ca739e3a1521c432370fadc992d7c575669f0d7b327665`. The Git index remains empty. No production, direct-test, E2E, sprint, package/lock/config/planning, or other contributor-owned byte was changed by this evidence mission.
- No universal-gate completion, independent review, review-ready/staging state, commit, push, PR, merge, branch/worktree cleanup, Story completion, or deployment is claimed. Lifecycle remains deliberately open: Task 7 and Task 8 are unchecked, and both Story and sprint remain `in-progress`.

### Final Accessibility, Contrast, Universal-Gate, and Scope Evidence — 2026-08-14

- Independent review correctly rejected the earlier Task 6 inconsistency because an accessibility gap is not a pass. Task 6 is now genuinely complete: existing `REG-BROWSER-01` includes a dynamic `@axe-core/playwright` scan scoped to semantic `main`, tagged `wcag2a`/`wcag2aa`, and run at the stable 320px default state in both light and dark themes. The protected non-registration prefix SHA-256 `2339c9d40ba61cf91f2246f21e03007ad0e10d27363e95fdb09a83db23dae356` and suffix SHA-256 `d052f7bc64b2cb157465fd13099445f06fe99f9ca68aa3dbc25979685e6f7966` remained exact.
- The authoritative final host Chromium rerun used the unchanged three-scenario command with `/private/tmp/story1674-playwright.config.ts`: exit `0`; `REG-BROWSER-01` **PASS** in `2.5s`, `REG-BROWSER-02` **PASS** in `722ms`, and `REG-BROWSER-03` **PASS** in `238ms`; `3/3` passed in `4.0s`.
- Manual browser review proved keyboard order email → password → submit → semantic `/login`, visible focus on all four controls, Enter invalid submission, one `main`, one `h1`, one named form, focus on the first invalid email, a focusable named summary, associated text errors, non-color error meaning, no overflow at `320/720/1440`, responsive light/dark wrapping, and zero browser warnings/errors. Screen-reader and non-Chromium-engine coverage remains unavailable and is recorded as an explicit gap, not a pass.
- Visual review found default input-border contrast RED at `1.88:1` light and `2.70:1` dark. The bounded repair added only semantic `border-foreground/50` to both Story-owned inputs and corresponding assertions: RED was `1 failed/21 passed` of `22` in `2.72s`; GREEN was `22/22` in `2.35s`. Post-repair screenshots passed at `3.19:1` light and `5.17:1` dark, with changes confined to the two input-boundary pixel regions.
- The final pinned Node `24.18.0`/npm `11.11.0` universal sequence is GREEN: targeted `22/22` in `2.66s`; full Vitest `1135/1135` files and `18445/18445` tests in `220.77s`; format; zero-warning lint; type-check; max-lines; privacy scan; `29/29` privacy tests; E2E assertion, wait, and bare-skip policies; production build of `70` static pages; and Git diff-check all exited `0`.
- The exact-scope audit parsed the full sprint-status YAML document and proved branch `cdx/epic-167-story-4-register`, HEAD and merge-base `c2a96943ff65a6ce60467608b01c17ad3a901716`, the exact eight-file manifest with six tracked plus two ignored artifacts, an empty index, zero non-ignored untracked files, empty immutable/forbidden diff, browser residue absent, and only `e2e/onboarding.spec.ts` containing the two deliberate synthetic credential constants. Story and sprint remain `in-progress`; deterministic snapshot freeze, sequential `APPROVE`/`CLEAR` reviews, staging, and integration remain open and unclaimed.

### Historical Earlier Review 1 `REJECT`, Ownership Adjudication, and Targeted Repair — 2026-08-14

#### Terminal verdict and accepted findings

This earlier review checkpoint, distinct from the current frozen-candidate review recorded below, ended with terminal verdict **`REJECT`**. Its four findings were accepted:

1. **HIGH:** missing pre-hydration credential-control lock.
2. **HIGH:** the shared `apiClient`/`logApiError`/`logger` path may log raw or serialized non-2xx bodies.
3. **MEDIUM:** missing corrected-email retry test after duplicate `409`.
4. **LOW:** active E2E/ATDD wording still described the current state as RED/`36px`.

This is not an `APPROVE` verdict and does not satisfy either member of the required sequential `APPROVE` then `CLEAR` pair. Task 7 snapshot freeze, review, freeze/review-ready subtasks remain open; Task 8 remains open.

#### Independent ownership adjudication

The accepted shared-logging finding is adjudicated exactly as **`OUT_OF_SCOPE_BASELINE_GAP`**. The shared raw non-2xx logging defect is real, but it is not owned by Story 167.4. Canonical Story 164.1 currently regression-locks the shared behavior, and API/client/interceptor/logger paths are forbidden here. No bypass, monkey-patch, direct `fetch`, alternate client, or assertion weakening is allowed. Shared redaction is deferred to a separately owned follow-up provisionally named **`Shared API Error-Logging Redaction`**; it is not a prerequisite and does not block Story 167.4 after truthful claim narrowing.

The evidence boundary is explicit:

- the successful browser path has clean in-page console and page-error evidence;
- hostile component errors are not rendered;
- direct component tests mock `registerUser`;
- at that historical Review 1 checkpoint, Story 167.4 had not executed or repaired the real shared non-2xx logging path; and
- the shared baseline concern was therefore left open for separately owned redaction work.

Therefore Story 167.4 does not claim that all real non-2xx registration response bodies are absent from console/log output. The canonical route-level requirements to protect credentials, avoid rendering hostile detail, and keep browser evidence clean remain unchanged.

#### Authoritative targeted repair RED

The repair mission's authoritative targeted RED was exactly: exit `1`; `1` failed file/`1` passed file; `2` intended failures/`22` passes/`24` total. The two intended failures proved:

1. SSR/pre-hydration named email, password, and submit controls were enabled, so the credential-control lock was missing.
2. Stale duplicate feedback survived correction of the email after a duplicate `409`.

#### Implemented behavior and final targeted GREEN

- SSR/pre-hydration named email, password, and submit controls are disabled.
- Native `FormData` contains no credential keys before hydration.
- The form declares no explicit native `method` or `action`.
- Hydration is not request-busy and keeps the submit label `Зарегистрироваться`.
- Email, password, and submit controls enable after hydration.
- Duplicate feedback clears when the email changes.
- The retained password remains masked.
- One deliberate corrected-email retry makes exactly one additional exact `{ email, password }` request and exactly one `/login` transition.
- Active E2E title/comment wording now describes the current usable `44px` contract rather than RED/inherited `36px`; historical RED checkpoints remain unchanged.

Final targeted GREEN was exactly `2/2` files and `24/24` tests passed. The post-compaction targeted rerun repeated `2/2` files and `24/24` tests passed in `2.57s`.

At that bounded repair checkpoint, Task 6 and all children remained complete because the later dynamic axe, manual keyboard/focus/reading-order/non-color/responsive review, contrast evidence, and final `3/3` Chromium evidence genuinely superseded the earlier gap. Screen-reader and non-Chromium coverage remained unavailable and were never reported as PASS. That checkpoint itself did not claim a fresh post-repair Chromium run, full suite, or production build; the later authoritative post-repair sections recorded those checks. Review approval, a current valid snapshot freeze/review-ready state, staging, integration, and cleanup remain open and unclaimed. Story and sprint status remain `in-progress`.

### Historical Frozen-Candidate 1 Review, Repair, and Revalidation — 2026-08-14

This was the authoritative frozen-candidate-1 checkpoint when recorded. It is now historical and superseded by the frozen-candidate-2 review/repair/current-byte evidence below; its RED/GREEN, accessibility, contrast, browser, and earlier-review chronology remains preserved.

#### Pre-review freeze and exact candidate boundary

- The deterministic pre-review freeze file `/private/tmp/story1674-candidate-freeze-1.sha256` had SHA-256 `6b0c1c40f15f6044640ac68d3732bfce1bf03b83cc53ffdc43e626654115da0f`.
- Before independent review, all eight entries in that freeze matched the reviewed bytes. The accepted repairs changed owned production/test/E2E bytes, so the freeze is now **invalidated** and is not a current candidate freeze.
- The documentation-synchronization pre-edit eight-path hashes were:

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

#### Independent candidate review: terminal `REJECT`

- Independent review runtime: `/private/tmp/story1674-omx-runtime-review1-approve`.
- Mission slug: `story1674-review1-approve`.
- Terminal reviewer line: **`VERDICT: REJECT`**. The runtime mission transport completed, but the requested review verdict was rejection; it is not `APPROVE` evidence.
- The four accepted Story-owned findings were exactly:
  1. **HIGH:** network recovery `Повторить` bypassed RHF validation by directly mutating `form.getValues()`.
  2. **MEDIUM:** the recovery button inherited the shared 36px `h-9` size and lacked a Story-local 44px minimum.
  3. **MEDIUM:** independently stored multi-error summary visibility/association stayed stale after live field corrections.
  4. **MEDIUM:** the then-current Story paragraph falsely claimed no fresh Chromium/full-suite/build despite those GREEN results already being recorded.

Finding 4 is corrected rather than merely superseded: no live/current sentence now says fresh Chromium, full Vitest, or build evidence is absent. Older no-rerun/no-build language remains only where explicitly scoped to its historical checkpoint.

#### Bounded production/test repair

- Repair runtime: `/private/tmp/story1674-omx-runtime-review-repair`.
- Mission slug: `story1674-review-repair`.
- Terminal mission result: **PASS**.
- Decisive repair RED: exit `1`; `1` failed file/`1` passed file; `4` intended failures/`21` passes/`25` total in `4.08s`.
- Production GREEN: `2/2` files and `25/25` tests passed in `2.88s`.
- Final targeted rerun: `2/2` files and `25/25` tests passed in `2.89s`.
- Final repaired source hashes are `RegistrationForm.tsx` `e75d708680e3b562b3cac1a5ee8b00a9e79c195cad5ef34fbc5441e94dd59537` and `RegistrationForm.test.tsx` `63cb4d8cb1e1f400dc5b3e30b375dc20fdb67cf010046da0b0edd5960485b387`.
- `Повторить` now routes through the shared `form.handleSubmit(onSubmit, onInvalid)` boundary; the synchronous duplicate-submission lock remains inside `onSubmit`, after validation succeeds.
- Empty, malformed-email, and short-password edited recovery attempts create no request and focus the first invalid field. After correction, one deliberate retry creates exactly one additional exact request and exactly one `/login` transition.
- `Повторить` carries Story-local `min-h-11 min-w-11`.
- Multi-error summary visibility and the form's summary association derive from current RHF errors and disappear after live correction.

#### Honest post-repair Chromium RED and bounded E2E-only repair

- The first authoritative post-repair Chromium result was honest E2E RED: `REG-BROWSER-01` failed because `password.fill()` did not blur the `onBlur`-validating password field, while `REG-BROWSER-02` and `REG-BROWSER-03` passed; total `1 failed/2 passed`.
- E2E-only repair runtime: `/private/tmp/story1674-omx-runtime-browser-red-repair-2`.
- Mission slug: `story1674-browser-red-repair-2`.
- Terminal mission result: **PASS**.
- The mission added exactly one real `page.keyboard.press('Tab')` inside the Story-owned block. It preserved protected prefix SHA-256 `2339c9d40ba61cf91f2246f21e03007ad0e10d27363e95fdb09a83db23dae356` and protected suffix SHA-256 `d052f7bc64b2cb157465fd13099445f06fe99f9ca68aa3dbc25979685e6f7966`.
- Final E2E SHA-256 is `1f3996cf22aad6c3921431f456d4d04dd53b193d03ebbd742a734e11b743b2ca`.

#### Final authoritative browser, targeted, and universal evidence

The final authoritative browser command remained:

```bash
/opt/homebrew/opt/node@24/bin/node ./node_modules/@playwright/test/cli.js test e2e/onboarding.spec.ts --config=/private/tmp/story1674-playwright.config.ts --project=chromium --grep 'REG-BROWSER-(01|02|03)'
```

It exited `0`: `REG-BROWSER-01` **PASS** in `2.0s`, `REG-BROWSER-02` **PASS** in `655ms`, and `REG-BROWSER-03` **PASS** in `197ms`; `3/3` passed in `3.3s`. The matrix includes light/dark 320px one-shot synthetic `503` recovery and rendered `Повторить >=44x44`. The existing dynamic axe and manual accessibility evidence remains valid. Screen-reader and non-Chromium coverage remain explicit unavailable gaps, not passes.

An independent targeted rerun passed `2/2` files and `25/25` tests in `3.17s`.

The fresh universal sequence is truthful:

- format, zero-warning lint, typecheck, max-lines, privacy scan, privacy tests `29/29`, E2E assertion/wait/bare-skip policies, and `git diff --check` all passed;
- `check:docs` matched exactly `18` historical broken citations;
- `check:markers` reported `0` violations across `30` files;
- the first sandboxed full Vitest run encountered one environment-only ephemeral-listener `EPERM`, with `1134/1135` files and `18447/18448` tests otherwise passing;
- the authoritative localhost-bind rerun exited `0` with `1135/1135` files and `18448/18448` tests in `207.56s`;
- the first sandboxed build hit a Turbopack port-bind `EPERM`;
- the authoritative build compiled in `6.7s`, completed TypeScript in `13.9s`, and generated `70/70` static pages.

#### Historical candidate-1 lifecycle boundary and required handoff

- Task 6 remains complete.
- Task 7 universal/local-gate and exact-scope children remain complete.
- Task 7 deterministic freeze and both sequential independent reviews remain open.
- Task 8 remains open.
- Story and sprint status remain `in-progress`; sprint status was not changed by this evidence synchronization.
- There is no current `APPROVE` or `CLEAR`, no valid current freeze, and no staging, commit, push, PR, merge, cleanup, or deployment claim.
- Root must create a new deterministic freeze over the exact eight manifest paths after these two evidence files settle, then restart the sequential independent review pair: first terminal `APPROVE`, then terminal `CLEAR`, both bound to the same new frozen hash.

### Frozen-Candidate 2 `REJECT`, Accepted Repairs, and Current-Byte Revalidation — 2026-08-14

#### Review boundary and invalidated freeze

- The old freeze `/private/tmp/story1674-candidate-freeze-2.sha256` has SHA-256 `1ceac9eeb70a2dec882eed98a2efdf7409c9a5fad37f55cbe99cd1a2087bcc65`.
- Independent review ran with `OMX_ROOT=/private/tmp/story1674-omx-runtime-review2-approve-2`, slug `story1674-review2-approve-2`. The terminal process passed, but the reviewer verdict was **`VERDICT: REJECT`**; it is not approval evidence.
- The old freeze was valid at review time and was intentionally invalidated by the accepted repair. Its final post-repair check produced five `OK` entries and exactly three failures: `src/components/custom/RegistrationForm.tsx`, `src/components/custom/RegistrationForm.test.tsx`, and the Story-owned registration block in `e2e/onboarding.spec.ts`.
- Accepted findings were: **HIGH** safe established lower-cased `password`/`пароль` policy interpretation without raw detail, with masked/associated/focused feedback and stale-feedback clearing on password edit; **HIGH** truthful synthetic-`503` logger evidence boundary; **HIGH** replacement of the permanent-base-shadow false-positive focus oracle with a computed-style delta; and **LOW** removal of contradictory current Chromium timings.

#### Honest direct RED → GREEN repair

- An initial selector-authoring failure did not reach the intended oracle and is explicitly non-counted.
- After correcting only that selector, the authoritative RED ran against byte-identical production/E2E: `2` files total, `1` failed and `1` passed, `1` intended failure and `25` passes of `26`, duration `2.90s`, exit `1`. It received generic service feedback instead of `Пароль не соответствует требованиям.` Log: `/private/tmp/story1674-review2-repair-red-authoritative.log`, SHA-256 `bc598e92fbacf5829a0001dad3ee369fc9ca42c5d9425394b6f00836b263f6dd`.
- After the minimal production repair and final max-lines-safe compaction, GREEN passed `2/2` files and `26/26` tests in `2.91s`, exit `0`. Log: `/private/tmp/story1674-review2-repair-green-final.log`, SHA-256 `01f264e1007a96bbdeb01faa90c1d780824a54660a64595f7a02b6bcb8da5f37`.
- Final current hashes are `RegistrationForm.tsx` `b6a2debf16cf68d5fea2487e74de7a3231539ed8d2fb439f155160cda9076183`, `RegistrationForm.test.tsx` `d188966c10254e137f757bae1e5ffab64dc4f9d98402fbbac5ed25c85b5e751e`, and `e2e/onboarding.spec.ts` `565142bf65865dd6e4af09cc865025d5432e8f60bdb34ec25fcb64f1f0850978`. Protected non-registration E2E boundaries remain exact: prefix `1fbf2c6e28757f88b9fe969c40bd18e18dc1cba55891551ce20a70ef1a640526`, suffix `20e15b54e2b60aa37560dc5f682df04469fc9be914669626a52f87831cb8236f`.

#### Truthful browser and logger evidence

- The authoritative repaired-byte Chromium run used one worker with retries `0` and passed `3/3` in `3.5s`: `REG-BROWSER-01` `2.2s`, `REG-BROWSER-02` `697ms`, and `REG-BROWSER-03` `205ms`.
- The strengthened focus oracle covers email, password, submit, and the semantic login link in light and dark themes. It records unfocused computed styles, presses real `Tab`, preserves `toBeFocused()`, then requires either a changed box-shadow or a changed visibly rendered outline. A permanent base shadow cannot satisfy it.
- `REG-BROWSER-01` executes the real production `registerUser → apiClient → logApiError/logger` non-2xx branch with a synthetic non-sensitive JSON `503`. It does not capture or prove shared logger cleanliness. The strict clean console/page-error oracle applies only to the success journey, and the authoritative run's local server output visibly contained the expected shared logger error for the synthetic `503`.
- The shared raw-body logging concern remains **`OUT_OF_SCOPE_BASELINE_GAP`**. Story 167.4 neither repairs nor claims closure of it; shared API/logger files remain unchanged.

#### Fresh current-byte validation and lifecycle boundary

- Independent targeted rerun: `2/2` files, `26/26` tests, `3.00s`.
- Full Prettier passed; full ESLint reported zero errors and zero warnings; TypeScript `tsc --noEmit` exited `0`; max-lines passed at source cap `200`/test cap `800`; privacy static scan passed across `3432` text files and `0` binary files; privacy tests passed `29/29`; E2E assertion policy passed `19` files; fixed-wait policy found `47` timer-free owned targets; bare-skip policy found `0` bare skips; and `git diff --check` exited `0`.
- Authoritative full Vitest outside the sandbox passed `1135/1135` files and `18449/18449` tests in `208.19s`. The earlier sandbox-only `listen EPERM` result was infrastructure-only, not a product failure.
- Authoritative production build outside the sandbox compiled in `7.1s`, completed TypeScript in `14.7s`, generated `70/70` static pages, and included `/register`. The earlier sandbox-only Turbopack internal-port `EPERM` result was infrastructure-only, not a product failure.
- Task 6 and its accepted-finding/evidence-synchronization child are complete. Task 7 deterministic freeze and fresh sequential `APPROVE` then `CLEAR` remain open; Task 8 remains open. Story and sprint remain `in-progress`. No approval, `CLEAR`, valid current freeze, review-ready state, staging, commit, push, PR, merge, cleanup, completion, or deployment is claimed.

### Frozen-Candidate 3 `REJECT` and Bounded Service-Classifier Repair — 2026-08-14

#### Review boundary and accepted finding

- Candidate freeze 3 is `/private/tmp/story1674-candidate-freeze-3.sha256`, SHA-256 `bb94a0602d7325aa11f492c67911aab3d5b91a425663afdaa9be46738fcfd133`. It matched all eight manifest paths at the start and end of the independent review and is now historical and invalidated by this accepted repair.
- The authoritative independent review ran under `/private/tmp/story1674-omx-runtime-review3-approve-host`, slug `story1674-review3-approve-host`. Mission transport passed, but the terminal reviewer line was **`VERDICT: REJECT`** with exactly one unresolved accepted material finding.
- Accepted **MEDIUM M-1**: backend-controlled `password`/`пароль` text on an arbitrary service failure such as HTTP `500` incorrectly selected password-policy feedback, removed the canonical generic `Повторить` action, and misrepresented a server outage as a user password defect. No other material finding was accepted.

#### Honest focused RED and minimal production repair

- The new direct regression used `new ApiError('password hashing service unavailable raw-detail', 500)` and proved retained masked credentials, raw-detail exclusion, absence of password-policy feedback, focused/associated generic service recovery, and the bounded `Повторить` action.
- Against unchanged production, the form-only command exited `1`: `1` failed file, `1` intended failure and `23` prior passes of `24`; test time `2.01s`, Vitest duration `3.20s`. The intended assertion found `Пароль не соответствует требованиям.` when it required the generic service branch. Log: `/private/tmp/story1674-review3-repair-red.log`; SHA-256 `45ce0ba8041036e7c3708ab02fd3d3f652c423dee3a7663c788311d767559b87`.
- The minimal production repair now requires `ApiError` status category `4xx` before applying the preserved lower-cased English/Russian password-policy signature. Consequently every HTTP `5xx`, including password-like hostile message text, remains safe generic service recovery, while the existing HTTP `422` password-policy fixture remains safely classified without rendering raw detail. Shared `ApiError`, API client, logger, and backend contracts are unchanged.

#### Final GREEN, focused validation, and lifecycle boundary

- Final direct command: `/opt/homebrew/opt/node@24/bin/node /opt/homebrew/bin/npm test -- --run 'src/app/(auth)/register/__tests__/page.test.tsx' src/components/custom/RegistrationForm.test.tsx`; exit `0`; `2/2` files and `27/27` tests passed; duration `3.04s`. Log: `/private/tmp/story1674-review3-repair-green-final.log`; SHA-256 `98ed809e8a7ada229a7769ecb25ef64586f8a95e7df0dab736646d58b6c3041d`.
- Final non-mutating focused checks passed: Prettier check on the two code files; scoped ESLint with zero warnings; TypeScript `--noEmit`; repository max-lines at source cap `200` and test cap `800`; and `git diff --check`. Log: `/private/tmp/story1674-review3-repair-focused-checks-final.log`; SHA-256 `6dc11a02e26ea7f76df4c3561a4365b89e110a3a5bc111ec9bd09603bbbcc880`.
- Task 6 remains complete. Task 7 requires a new deterministic eight-path freeze followed by fresh sequential terminal `APPROVE` then `CLEAR`; Task 8 remains open. Story and sprint remain `in-progress`. No approval, `CLEAR`, valid current freeze, review-ready transition, staging, commit, push, PR, merge, cleanup, completion, screen-reader/non-Chromium execution, shared-logger cleanliness, or deployment is claimed.

### Final Post-Repair Universal-Validation Checkpoint — 2026-08-14

This append-only checkpoint synchronizes the authoritative current evidence after the accepted Review-3 M-1 repair. It does not delete or reinterpret any historical RED, rejected review, invalidated freeze, sandbox-only infrastructure failure, or unavailable-coverage evidence above.

- Pinned runtime: Node.js `24.18.0`; npm `11.11.0`.
- Fresh targeted Vitest: exit `0`; `2/2` files and `27/27` tests passed in `3.34s`.
- Authoritative Chromium, one worker and retries `0`: `REG-BROWSER-01` **PASS** in `2.5s`, `REG-BROWSER-02` **PASS** in `687ms`, and `REG-BROWSER-03` **PASS** in `208ms`; total `3/3` passed in `3.9s`.
- The existing synthetic non-sensitive `503` scenario still crosses the real shared-logger boundary. It does not establish shared-logger cleanliness, and no shared-logger-cleanliness claim is made. The strict clean console/page-error oracle remains limited to the success journey.
- Format checks passed for the Story source files plus the exact Story manifest/documents. ESLint passed with zero warnings. TypeScript `--noEmit` passed. Max-lines passed with source cap `200` and test cap `800`.
- Privacy scan passed across `3432` text files and `0` binary files. Privacy tests passed `29/29`.
- E2E assertion policy passed across `19` files. Fixed-wait policy passed across `47` targets. Bare-skip policy found `0` bare skips.
- Documentation validation matched exactly the established baseline of `18` historical broken citations. Story-marker validation found `0` violations across `30` files. `git diff --check` passed.
- Authoritative full Vitest outside the sandbox passed `1135/1135` files and `18450/18450` tests in `162.30s`.
- Authoritative production build outside the sandbox compiled in `5.5s`, completed TypeScript in `14.4s`, generated `70/70` static pages, and included `/register`.

Mission-start SHA-256 protection for all six tracked manifest paths, including sprint-status, is:

| Protected tracked path | Mission-start SHA-256 |
| --- | --- |
| `src/app/(auth)/register/__tests__/page.test.tsx` | `eac67057fbd77d8050168759afd8223ce35e90a4103fe7ca13e6ada32d22d917` |
| `src/components/custom/RegistrationForm.test.tsx` | `2781e5ee957326f27390a739c2d58ca95b8c6f85b1a8b7208afbae7ad49d3979` |
| `e2e/onboarding.spec.ts` | `565142bf65865dd6e4af09cc865025d5432e8f60bdb34ec25fcb64f1f0850978` |
| `src/app/(auth)/register/page.tsx` | `98f19c1942ca6a4f071c9b2e007d5f649f334edfa73a08bc99d4041b48efa816` |
| `src/components/custom/RegistrationForm.tsx` | `ed416ba28076f248bb5e0f05b21fdd4fc55c5e5b5106f72b1df366ca9ab2194e` |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | `1e70d799ced6942e2751586f6abb9dcaaa0788df963be2ddf4e9153600b87361` |

Task 6 remains complete. Task 7 freeze/review work remains open, and Task 8 remains open. Story and sprint remain `in-progress`. There is no current freeze, `APPROVE`, `CLEAR`, review status, staging, commit, push, PR, merge, cleanup, deployment, screen-reader/non-Chromium pass, or shared-logger-cleanliness claim.

### Immutable Freeze-5 Initial Review Pair and Review-Status Transition — 2026-08-14

This append-only checkpoint supersedes only the live lifecycle state stated above. It preserves every historical RED, GREEN, rejected review, invalidated freeze, infrastructure-only failure, evidence repair, and unavailable-coverage record as chronology.

- The immutable reviewed candidate was `/private/tmp/story1674-candidate-freeze-5.sha256` with freeze-file SHA-256 `15c65c5371b6518d123177aff917f74a36f5c46f186f4ebe63afbb03115cd872`.
- Immediately before this three-document status mutation, the manifest verified exactly `8/8` paths with no mismatch.
- The fresh independent code/spec/security review completed first with terminal **`VERDICT: APPROVE`** and zero accepted **HIGH**, **MEDIUM**, or **LOW** findings.
- Only after that approval, a separate fresh independent architecture/scope/contract review over the same immutable freeze completed with terminal **`VERDICT: CLEAR`** and zero accepted findings.
- Task 7 and all of its freeze/review subtasks are therefore complete for the immutable freeze-5 candidate. Story status is now `review`; Task 8 and every staging, integration, commit, push, PR, merge, branch/worktree-cleanup, and final-completion item remain open.
- This Story/ATDD/sprint three-document status mutation necessarily changes three of the eight manifest paths and therefore invalidates freeze 5 as the current integration snapshot. Before any staging, root must create a new deterministic freeze over the exact eight paths and obtain a fresh final sequential terminal **`APPROVE`** then **`CLEAR`** pair over that identical new freeze with zero accepted findings.
- This checkpoint does not claim a final integration review, staging, commit, push, PR, merge, cleanup, Story completion, deployment, shared-logger cleanliness, screen-reader execution, or non-Chromium execution.

### Freeze-6 Final Review Pair and Integration-Gate Whitespace Repair — 2026-08-14

- Freeze 6, identified by SHA-256 `a084768fba3350d16b94cc23b274be9ae443e2230fad49bf1e10e4dc3ac312b6`, received the required final sequential terminal **`VERDICT: APPROVE`** followed by terminal **`VERDICT: CLEAR`**, with accepted **HIGH/MEDIUM/LOW** findings `0/0/0` in both final reviews.
- The first exact staging attempt was stopped when the staged whitespace gate exposed three trailing-whitespace violations in the previously ignored ATDD artifact: its Date, Author, and Primary test level lines. The index was safely returned to empty. This bounded repair removes only those three Markdown hard breaks and appends evidence to the two owned documents.
- These two document changes invalidate Freeze 6. A new exact eight-path freeze and a fresh final sequential **`APPROVE`** then **`CLEAR`** pair over identical bytes are required before any restaging.
- Story and sprint remain `review`; Task 7 remains complete; Task 8 remains open; and the ATDD front matter remains `tddPhase: green`. The five source/test/E2E bytes, the shared-logger **`OUT_OF_SCOPE_BASELINE_GAP`**, and the unavailable screen-reader/non-Chromium gaps remain preserved. No staging state, commit, push, PR, merge, cleanup, Story completion, or deployment is established by this repair.

### Freeze-7 Evidence-Quality Rejection and Genuine-Enter Repair — 2026-08-14

- Freeze 7, freeze-file SHA-256 `55bfe91c24f7a0f2e3e6e85e18969326a8563710c6374b945cd5dbaca9dd6b26`, ended **`VERDICT: REJECT`** with accepted **HIGH/MEDIUM/LOW** findings `0/1/0`.
- The accepted MEDIUM finding was exact: `REG-FORM-03` claimed rapid click-plus-Enter duplicate-prevention evidence but used only `fireEvent.keyDown` on the form, which does not perform native implicit form submission.
- The component repair removes that misleading bare-keydown oracle. It starts a valid held request with `userEvent` Enter from the focused enabled password control, attempts a second real Enter while the request remains pending, and proves `registerUser` stays at exactly one call. The separate trigger-agnostic synchronous double-`submit` lock remains unchanged.
- `REG-BROWSER-02` now starts the held valid request with a real keyboard Enter from the focused enabled password control, attempts another real Enter before releasing the response, and checks the intercepted registration-request count remains exactly one. The route records only method and endpoint path, never request bodies. Pending-state, exact endpoint, credential-privacy, clean console/page-error, response-release, and exactly one observed `/login` history navigation oracles remain present.
- Fresh pinned Node `24.18.0`/npm `11.11.0` Vitest is GREEN: form-only `24/24` in `3.35s`, followed by the genuine two-target rerun at `2/2` files and `27/27` tests in `3.31s`. Scoped zero-warning ESLint, TypeScript `--noEmit`, max-lines, privacy scan, privacy tests `29/29`, and all E2E assertion/wait/bare-skip policies passed.
- Fresh browser execution is environment-blocked, not product-failed or passing. Port `3100` was absent; the captured worktree-only frontend process exited on sandbox `listen EPERM 127.0.0.1:3100`. The exact isolated Chromium command was still executed and exited `1` before test bodies because the sandbox denied Chromium Mach-port registration. No unrelated listener was touched and no Chromium pass is claimed.
- This accepted repair invalidates Freeze 7. A new deterministic freeze over the exact eight manifest paths and a fresh sequential terminal **`APPROVE`** then **`CLEAR`** pair bound to that identical new freeze are required before Task 8 proceeds.
- Lifecycle truth is preserved: Story and sprint remain `review`; Task 7 remains complete; Task 8 remains open; `tddPhase` remains green. The shared logger remains **`OUT_OF_SCOPE_BASELINE_GAP`**, and unavailable screen-reader/non-Chromium coverage remains an explicit gap. No staging, commit, push, PR, merge, cleanup, Story completion, or deployment is claimed.

### Root-Host Chromium GREEN After the Sandbox-Blocked Worker Attempt — 2026-08-14

- The earlier nested-worker browser attempt remains truthfully recorded as sandbox-blocked. It did not produce browser execution evidence and is not reclassified as a product failure or pass.
- The root host subsequently started only this Story worktree frontend on `127.0.0.1:3100`. With pinned Node.js `24.18.0`, it ran Playwright against `e2e/onboarding.spec.ts` using config `/private/tmp/story1674-playwright.config.ts`, project `chromium`, and grep `REG-BROWSER-(01|02|03)`.
- The authoritative root-host result was exit `0`: `3 passed (4.1s)`. `REG-BROWSER-01` passed in `2.7s`, `REG-BROWSER-02` passed in `697ms`, and `REG-BROWSER-03` passed in `209ms`.
- `REG-BROWSER-02` genuinely focused the enabled password control, submitted with a real keyboard Enter, held the intercepted response, attempted a second real keyboard Enter while that response remained held, and proved exactly one registration request plus exactly one observed `/login` history navigation. The interception did not inspect or log any request body.
- The captured frontend session was stopped after the run. This checkpoint claims Chromium only; it does not claim a screen-reader run or any non-Chromium browser/engine pass.
- Freeze 7 remains invalidated. Story and sprint remain `review`; Task 7 remains complete; Task 8 remains open; and the ATDD phase remains `green`. The shared logger remains **`OUT_OF_SCOPE_BASELINE_GAP`**, and the unavailable screen-reader/non-Chromium gaps remain open.
- Before Task 8 can proceed, root must create a new deterministic freeze over the exact established eight-path Story manifest and then obtain fresh independent terminal reviews sequentially: **`APPROVE` first, then `CLEAR`**, both bound to the identical new freeze with zero accepted findings. No staging, commit, push, PR, merge, cleanup, Story completion, or deployment is claimed.

### Final Pre-Freeze Validation Checkpoint — 2026-08-14

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

Lifecycle truth is unchanged: Story and sprint remain `review`; Task 7 is complete; Task 8 is open; and the ATDD front matter remains `tddPhase: green`. The shared logger remains **`OUT_OF_SCOPE_BASELINE_GAP`**. Screen-reader and non-Chromium execution remain unavailable gaps. No Story completion, staging, commit, push, PR, merge, cleanup, or deployment is claimed.

These document bytes require a new deterministic freeze over the exact eight established paths. Fresh independent terminal reviews must then run sequentially over that identical freeze: **`APPROVE` first, then `CLEAR`**. The owned-document Prettier and trailing-whitespace checks, repository `git diff --check`, empty-index check, and outside-owned tracked/status stability check passed for this synchronization.

### Post-Merge Integration Checkpoint (2026-08-17, append-only)

Freeze-8 contract satisfied — a fresh sequential terminal pair ran over the exact merged bytes of this record:

- Pinned freeze: SHA-256 `1843cb9e26832da0aaca07e02b872d63569bf8a5466d94d628b7d03c4f485587`, 772 lines, byte-identical to merged branch tip `2951b8ae` and merge commit `d1401ca8` (PR #158, merged 2026-08-14T16:52:17Z; `git diff d1401ca8..main -- <this file>` = 0).
- **Pass 1 (code/spec/security, fresh opus context): VERDICT: APPROVE.** Source spot-checks corroborated every record claim (single `main`/`h1`, `min-h-11` targets, `retry:false`, `skipAuth` registerUser at `api.ts:47-48`, Russian-only feedback, pre-hydration disable); test-count chronology internally consistent; no fabricated evidence. 7 findings, none blocking: 2 MEDIUM (this integration gap; logger deferral — both resolved by this checkpoint), 1 MEDIUM→LOW (4xx message-text classifier), 4 LOW.
- **Pass 2 (architecture/scope/contract, fresh opus context): VERDICT: CLEAR.** Delivered diff confined to the declared eight-path manifest; no public-contract drift on the unauthenticated surface; epic-pattern conformance confirmed. 5 findings: 2 MEDIUM (the same integration + registration conditions — both satisfied here), 1 MEDIUM follow-up (classifier into API owner layer), 2 LOW.
- Integration facts: PR #158 merged; merge `d1401ca8` verified ancestor of origin/main `5fdd8553`; branch `cdx/epic-167-story-4-register` deleted on GitHub (PR merge auto-delete); Sprint row flipped `review → done` 2026-08-17.
- Deferral registration: the shared-logger `OUT_OF_SCOPE_BASELINE_GAP` is now tracked as **FE-D9** in the BE tech-debt ledger (`docs/tech-debt/TECH-DEBT-2026-08-SESSION.md`, Addendum-4 continuation-5) — redaction in `logApiError` before serialization, trigger = nearest FE story touching the apiClient/error path.
- Standing accepted gaps unchanged and disclosed: screen-reader/non-Chromium execution coverage; FE-D9 redaction.

**Lessons:** (1) do not merge before the record's own freeze contract completes — retrofit reviews cost a dedicated session (2) accepted out-of-scope findings need a tracker ID at acceptance time, not later (3) seven invalidation cycles held the append-only trail — keep per-freeze SHA chains.
