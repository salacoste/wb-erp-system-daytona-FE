# Story 167.3: Migrate Login `/login`

Status: review

## Story

As a registered user,
I want clear sign-in validation and recovery,
so that I safely return to my intended destination.

## Outcome

Migrate the complete `/login` route-owned render tree to the merged semantic shadcn presentation contract while preserving authentication behavior. The finished route must provide visible and associated validation, retain safe input after recoverable failures, prevent duplicate credential submission, support keyboard and touch completion, and return a successful user only to an approved same-origin destination.

The implementation must preserve the current auth boundary: `loginUser` remains the sole login API call, `useAuthStore().login` remains the JWT/session writer, the first cabinet ID selection remains unchanged, the success navigation remains a full-page navigation after the existing persistence delay, and auth API/store/provider/hooks, proxy/middleware, route constants, protected-route modeling, and public/backend contracts remain read-only.

## Acceptance Criteria

1. **Default and pre-hydration states are safe and usable**
   - **Given** the server render or the first client render before hydration,
   - **When** `/login` is displayed,
   - **Then** email, password, and submit controls are disabled until hydration completes,
   - **And** the form cannot perform native submission or place a password in the URL,
   - **And** after hydration the email field is the predictable initial focus target without changing DOM order.
   - **Given** the hydrated default state,
   - **Then** one semantic `main` contains one page-level heading, a constrained form, visible email and password labels, `autocomplete="email"` and `autocomplete="current-password"`, and a full-width primary action on mobile.

2. **Client validation is associated and blocks invalid requests**
   - **Given** a missing or malformed email or a missing password,
   - **When** the user blurs a field or submits the form by keyboard or touch,
   - **Then** the field exposes its invalid state and an associated actionable message,
   - **And** focus moves predictably to the first invalid field on invalid submission,
   - **And** `loginUser` is not called.

3. **Credential and network failures retain safe input and permit recovery**
   - **Given** invalid credentials,
   - **When** the single login request fails,
   - **Then** the user receives associated, non-secret feedback without exposing backend details,
   - **And** the entered email remains available for correction,
   - **And** the password is cleared and focus returns to the password field.
   - **Given** a network or unavailable-service failure,
   - **Then** the feedback distinguishes a recoverable connection/service problem from invalid credentials,
   - **And** the email remains available, the password is cleared, and the user can retry deliberately.

4. **Submitting prevents duplicate authentication attempts**
   - **Given** valid credentials and a pending request,
   - **When** the user clicks, taps, presses Enter, or repeats activation,
   - **Then** email, password, and submit controls remain disabled,
   - **And** the submit control exposes a truthful busy state,
   - **And** exactly one `POST /v1/auth/login` occurs for that submission.
   - **Given** the application QueryClient enables global mutation retries,
   - **Then** the login mutation still uses `retry: false` and does not repeat credential submission.

5. **Successful login preserves session and destination behavior**
   - **Given** a successful `loginUser` response,
   - **When** the mutation completes,
   - **Then** `useAuthStore().login` receives the unchanged user, JWT, and first cabinet ID or `null`,
   - **And** the success feedback remains available,
   - **And** navigation occurs once after the existing persistence delay using the existing full-page navigation boundary.
   - **Given** no redirect query value,
   - **Then** the destination remains `/dashboard`.
   - **Given** a valid same-origin absolute-path redirect including its query or fragment,
   - **Then** that destination is preserved.
   - **Given** an external, malformed, backslash-based, or protocol-relative redirect such as `//evil.example`,
   - **Then** navigation falls back to `/dashboard`.

6. **Session-expired re-authentication is clear and predictable**
   - **Given** `/login` is entered with the existing protected-route `redirect` query contract,
   - **When** the login presentation renders,
   - **Then** it identifies the visit as a re-authentication/session-expired recovery entry without exposing protected content,
   - **And** the intended same-origin path remains intact through validation or recoverable failure,
   - **And** successful login returns to that path under AC5's redirect safety rules.
   - **And** no new query protocol, proxy/middleware behavior, route constant, auth-store behavior, or protected-route model is introduced.

7. **Responsive, theme, accessibility, and privacy evidence is complete**
   - **Given** default, invalid, credential-error, network-error, submitting, success, and session-expired states,
   - **When** tested at `320`, `390`, `768`, `1024`, `1280`, and `1440+` widths in light and dark themes,
   - **Then** the form remains constrained on desktop, its primary action remains full-width on mobile, Russian labels and error copy wrap, there is no page-level horizontal overflow, and controls retain visible focus and adequate touch targets.
   - **And** keyboard order is email → password → submit, Enter submission works, touch completion works, 200% zoom reflows, reduced motion is respected, and automated accessibility checks report no Story-owned violations.
   - **And** evidence proves no password appears in URLs, navigation logs, diagnostics, screenshots, traces, or committed fixtures.

8. **Ownership, validation, review, and lifecycle remain exact**
   - **Given** the canonical Story, route ledger, and OMX plan,
   - **When** Story 167.3 is proposed for integration,
   - **Then** production changes are limited to the login route and `LoginForm`, with direct login tests/evidence and Story-owned artifacts only,
   - **And** every forbidden or unrelated surface remains unchanged,
   - **And** active test-only RED precedes production edits, targeted GREEN and browser evidence pass, universal local validation passes, and two fresh independent reviews have no unresolved accepted findings.
   - **And** the detailed commit, ready PR, merge SHA, remote/local branch deletion, exact worktree removal, prune, and clean-main evidence are recorded before Story 167.4 begins.

## State Matrix

| State                         | Required presentation and behavior                                                                  | Required evidence                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Pre-hydration                 | All controls disabled; no native submit; no password URL leakage                                    | Component SSR/pre-hydration test and privacy assertion                   |
| Default                       | Visible labels; email/password semantics; constrained desktop form; full-width mobile action        | Page/form component tests plus browser widths/themes                     |
| Invalid client input          | Associated field messages; no request; first invalid focus                                          | Component keyboard and submit tests                                      |
| Invalid credentials           | Non-secret credential feedback; email retained; password cleared; password focused                  | Component test with one rejected mutation                                |
| Network failure               | Distinct recoverable service/network feedback; email retained; password cleared; deliberate retry   | Component deliberate-retry test and two-attempt browser recovery journey |
| Submitting                    | Controls disabled; busy state; one request despite repeated activation; `retry: false`              | Deferred-promise component test and request count                        |
| Success                       | Existing store login arguments, success feedback, delay, and one safe destination navigation        | Fake-timer component tests and login-dashboard E2E                       |
| Session-expired/re-auth entry | Existing `redirect` contract is explained, retained, validated, and never exposes protected content | Page/form tests and unauthenticated browser journey                      |

## Tasks / Subtasks

- [x] Task 1: Reconfirm the isolated lane, prerequisites, and exact ownership boundary (AC: 1–8)
  - [x] Verify branch `cdx/epic-167-story-3-login`, worktree `/private/tmp/wb-fe-167-3-migrate-login`, and base `8eee14bb2f5862518280eef2b557c287bd09c738` before implementation.
  - [x] Verify Stories 166.1–166.8, 167.1, and 167.2 are ancestors of the base and that current auth contracts are present without editing them.
  - [x] Reconcile concurrent work before editing; report any shared-file collision or scope expansion immediately.
  - [x] Freeze the prospective eight-file manifest and confirm every forbidden surface is read-only.

- [x] Task 2: Author active Story-owned ATDD RED before production edits (AC: 1–8)
  - [x] Extend the two existing direct Vitest files and `e2e/login-dashboard.spec.ts` according to `atdd-checklist-167.3.md`; keep every new test active, unskipped, and deterministic.
  - [x] Prove initial RED comes from missing Story 167.3 behavior, including protocol-relative redirect rejection, rather than broken fixtures or environment setup.
  - [x] Preserve Task 38 regression locks: disabled pre-hydration controls, `retry: false`, one POST per submission, and no password in a URL.
  - [x] Record the exact RED command, failing test names, failure reason, exit code, and unchanged production diff.

- [x] Task 3: Migrate the route-owned login page presentation (AC: 1, 6–8)
  - [x] Use one semantic `main`, one `h1`, semantic tokens, a constrained readable form surface, and an honest Suspense fallback without changing shared primitives or global tokens/styles.
  - [x] Expose the existing redirect-based re-authentication entry as clear contextual text without adding or modifying auth/proxy/route protocols.
  - [x] Preserve logical DOM/reading order, responsive wrapping, light/dark semantics, reduced motion, and mobile action width.

- [x] Task 4: Harden form validation, failure recovery, focus, and privacy inside `LoginForm` (AC: 1–4, 6–8)
  - [x] Preserve visible labels, email/current-password autocomplete, associated field errors, and disabled pre-hydration controls.
  - [x] Move focus to the first invalid field on invalid submission; after request failure retain email, clear password, and focus password.
  - [x] Distinguish recoverable network/service failure feedback from invalid credentials without exposing backend details.
  - [x] Keep controls disabled and `aria-busy` truthful while the mutation is pending; preserve one submission and `retry: false`.

- [x] Task 5: Preserve success/session behavior and repair redirect validation (AC: 5–8)
  - [x] Keep `loginUser`, `useAuthStore().login(user, token, firstCabinetId || null)`, success feedback, the existing persistence delay, and full-page navigation unchanged.
  - [x] Accept only normalized same-origin absolute paths; preserve their query/fragment and reject external, malformed, backslash, and protocol-relative values such as `//evil.example` to `/dashboard`.
  - [x] Do not move redirect policy into routes, proxy/middleware, auth store/provider/hooks, or a new shared owner.

- [x] Task 6: Reach targeted GREEN and collect browser/accessibility/privacy evidence (AC: 1–8)
  - [x] Run both direct Vitest targets to GREEN and refactor only while they remain passing.
  - [x] Extend the existing login-dashboard evidence with an unauthenticated login journey covering keyboard/touch submission, exactly one request per deliberate attempt including a second retry after `503`, safe destination, session-expired entry, widths/themes, 200% zoom, focus, axe, overflow, and console/page errors.
  - [x] Prove no password enters URLs or retained browser artifacts; use only synthetic credentials and the repository's local network guard.

- [x] Task 7: Run universal local validation, exact-scope audit, and two fresh reviews (AC: 7–8)
  - [x] Run full Vitest, format check, zero-warning lint, type-check, max-lines, build, privacy, E2E static checks, YAML parse, dependency, diff, and exact-manifest gates with pinned Node/npm.
  - [x] Compare the complete diff with Owned/Allowed/Forbidden surfaces and prove only the prospective manifest changed.
  - [x] Complete two independent fresh-context reviews, resolve every accepted finding test-first, and rerun every affected gate.

- [ ] Task 8: Integrate and clean the exact Story lane (AC: 8)
  - [ ] Force-stage ignored Story/ATDD evidence and stage only the approved explicit manifest.
  - [ ] Create the detailed conventional commit, push only the feature branch, open a ready PR targeting `main`, and merge through GitHub after local gates and reviews pass.
  - [ ] Synchronize primary `main`, prove merge ancestry and artifact presence, delete the remote/local Story branches, remove the exact worktree without force, prune, and prove absence before Story 167.4.

## Dev Notes

### Exact Git Lane and Prerequisite Proof

- Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`.
- Branch: `cdx/epic-167-story-3-login`.
- Worktree: `/private/tmp/wb-fe-167-3-migrate-login`.
- Exact base: `8eee14bb2f5862518280eef2b557c287bd09c738`.
- After the separate auth/proxy prerequisite PR `#155` merged, the Story branch was fast-forwarded without losing its eight-file working diff to `0fbc922d90060314df222e668abd433686b4bbbe`; current `main`, `origin/main`, and Story `HEAD` then matched that SHA.
- Base identity verified on `2026-08-13`: worktree `HEAD`, local `main`, and `origin/main` all resolved to the exact base before Story artifact edits.
- The base is merge commit `8eee14bb` for PR `#154` (Story 167.2). Its ancestry contains PR `#153` (Story 167.1), PRs `#145`–`#152` (Stories 166.1–166.8), and the existing auth API/store/provider/proxy/route contracts.
- Sprint prerequisite status at creation: Stories 166.1–166.8, 167.1, and 167.2 are `review`; the repository history proves their merged implementation commits are present on the exact base. This Story does not reinterpret `review` as Story completion evidence and does not alter their rows.
- Worktree-local dependencies were installed with pinned Node `24.18.0` and npm `11.11.0`; package and lock files remained unchanged. The pre-Story baseline passed both direct login test files with `14/14` tests before active RED authoring.

### Requirements and Ownership

- Requirements: `FR1`, `FR2`, `FR27`.
- Route ledger row: Story `167.3`, route `/login`, entry `src/app/(auth)/login/page.tsx`, domain `auth`, ledger status `planned`.
- **Owned Surface:** `/login` route, `LoginForm`, and their direct tests/evidence.
- **Allowed Change Surface:** route/form/tests/evidence only.
- **Forbidden Surface:** auth API/store/provider/hooks; proxy/middleware; route constants and protected-route model; `src/components/ui/**`; registration; AppShell; product/foundation compositions outside the owned route; global tokens/styles; package or lock files; backend/public contracts; unrelated routes.
- A need to edit any forbidden or shared file is a blocker for this lane and must be routed upward. Do not silently expand ownership.
- Add no dependency. Consume only the merged primitives and semantic roles already present at the exact base.

### Current Brownfield Contract

- `src/app/(auth)/login/page.tsx` owns the centered `/login` page, heading, Suspense boundary, and `LoginForm` composition.
- `src/components/custom/LoginForm.tsx` uses React Hook Form, the existing shadcn `Form`/`Input`/`Button`, TanStack Query mutation, `loginUser`, `useAuthStore().login`, Sonner feedback, and a `navigate` seam defaulting to `window.location.href`.
- The current success sequence is API response → auth-store login with first cabinet ID or `null` → success toast → `100ms` timer → full-page navigation. Preserve this sequence and delay unless an active RED proves a Story-owned defect requiring a narrower change.
- Current default destination is `/dashboard`; current valid redirect source is `useSearchParams().get('redirect')`.
- Current pre-hydration invariant is deliberate: `isHydrated` starts false, so email/password/submit are disabled before the first effect. This prevents native form submission and password leakage through a URL before React handlers attach.
- Current mutation explicitly sets `retry: false`; direct tests already prove one API call even when global mutation retries are enabled.
- Current redirect validation uses `redirectTo.startsWith('/')`. This is insufficient because `//evil.example` is protocol-relative and can leave the origin when assigned to `window.location.href`. Story 167.3 owns the failing test and repair inside `LoginForm`; it must not modify proxy, middleware, or route constants.
- Current invalid-credential and network branches collapse to the same toast, retain the password, and provide no predictable failure focus. Story 167.3 must make the recoverable states distinct and associated without exposing backend error details.
- Current direct page tests assert an `h2` and a `div` layout. The migration should lock one `main` and one page-level `h1`, not preserve obsolete presentational assertions.

### Interaction, Focus, Responsive, and Accessibility Contract

- Semantic order: page heading/context → email → password → submit. CSS must not create a contradictory reading or keyboard order.
- Default hydrated entry deliberately focuses email. Invalid submit focuses the first invalid field. A request failure clears and focuses password while retaining email. Successful navigation does not add a competing focus move.
- Visible labels stay present; placeholders are hints, not names. Maintain `type="email"`, `type="password"`, `autocomplete="email"`, `autocomplete="current-password"`, required and invalid states, and stable error association.
- Desktop forms remain constrained to readable width. Focused mobile forms use full-width controls/actions, at least `44×44px` primary touch targets, and no horizontal page overflow.
- Browser evidence covers `320`, `390`, `768`, `1024`, `1280`, and `1440+`, both themes, 200% zoom, reduced motion, long Russian copy, keyboard-only completion, touch completion, focus visibility, and axe plus manual reading-order review.
- Authentication timing must not depend on a timed gesture. The existing post-success persistence delay is not a user gesture deadline; preserve it and prove only one navigation timer/result.
- The session-expired state consumes the existing redirect query as contextual recovery evidence. Do not invent a new global session-expiry protocol in this route Story.

### RED → GREEN Contract

1. A later test engineer first edits only direct Story tests/evidence and runs the exact targeted Vitest command.
2. RED must be active: no `skip`, `todo`, `only`, conditional early return, swallowed assertion, or test that passes against the exact base.
3. At minimum the base must fail active expectations for protocol-relative redirect rejection, distinct recoverable failure feedback, email retention/password clearing/failure focus, invalid-submit focus, re-auth context, and migrated semantic/responsive presentation.
4. Preserve and rerun existing Task 38 locks for pre-hydration disablement, `retry: false`, one request, and no password in URL.
5. Only after RED is recorded may the developer edit `page.tsx` and `LoginForm.tsx`.
6. Reach targeted GREEN, then run browser evidence, universal gates, exact-scope audit, and independent reviews. A missing environment is a recorded gap, never a pass.

### Prospective Exact Manifest

No implementation file has been changed and no RED test has been authored at Story creation. The later implementation is limited to this prospective eight-file manifest:

1. `_bmad-output/implementation-artifacts/167-3-fe-migrate-login-login.md` — lifecycle and evidence updates only after the relevant work is real; ignored artifact requires force-stage.
2. `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story 167.3 row and `last_updated` comment only.
3. `_bmad-output/test-artifacts/atdd-checklist-167.3.md` — ATDD RED/GREEN and validation evidence; ignored artifact requires force-stage.
4. `src/app/(auth)/login/page.tsx` — route-owned presentation and re-auth entry context.
5. `src/app/(auth)/login/__tests__/page.test.tsx` — direct route semantics, state, source-boundary, and accessibility tests.
6. `src/components/custom/LoginForm.tsx` — route-exclusive form presentation/interaction, failure recovery, focus, and safe redirect repair.
7. `src/components/custom/LoginForm.test.tsx` — active component ATDD and preserved auth/session/privacy tests.
8. `e2e/login-dashboard.spec.ts` — existing critical login-to-dashboard/browser evidence extended for Story 167.3.

Stop and report upward before adding, removing, renaming, or editing any other path.

### Validation and Browser Contract

Targeted RED/GREEN command after tests exist:

```bash
npx vitest run 'src/app/(auth)/login/__tests__/page.test.tsx' src/components/custom/LoginForm.test.tsx
```

Applicable Story browser target after local frontend/backend preflight:

```bash
npm run test:e2e -- e2e/login-dashboard.spec.ts --project=chromium
```

Universal local gates use pinned Node/npm and include:

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

Also parse `sprint-status.yaml`, run `git diff --check`, verify the exact manifest, scan the complete diff for passwords/secrets and forbidden paths, and retain full failure output. Frontend browser validation uses `http://localhost:3100`; backend uses `http://localhost:3000`. Browser evidence must use synthetic/local credentials and follow repository network and raw-artifact privacy policy.

### Review and Git Lifecycle Contract

- Two fresh independent reviews are required after implementation and validation. Reviewers must receive the canonical Story/ATDD, exact diff, RED/GREEN evidence, browser evidence, gate outputs, and scope manifest.
- Resolve every accepted finding test-first and rerun affected targeted, browser, universal, privacy, scope, and diff gates.
- Do not claim review, implementation, or readiness for integration until the evidence exists.
- Git integration is Task 8 and intentionally remains incomplete. Do not commit, push, open or merge a PR, delete a branch, remove a worktree, or start Story 167.4 during Story creation/ATDD planning.
- After a later implementation is approved, follow the checkout-independent commit/PR/merge/cleanup commands in `.omx/plans/167.3-migrate-login.md` exactly, including remote/local branch deletion, exact worktree removal, prune, and absence proof.

### Project Structure Notes

- The canonical route entry remains `src/app/(auth)/login/page.tsx`; do not relocate it.
- `LoginForm` remains at `src/components/custom/LoginForm.tsx` for this bounded Story. Moving it or extracting shared auth helpers would expand scope and ownership.
- Existing shadcn primitives are consumers, not Story-owned files. Extend no primitive and add no package.
- Keep business/session behavior in the existing API/store owners. The form coordinates presentation and the existing mutation sequence only.

### References

- [Source: `.omx/plans/167.3-migrate-login.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md#Standard-Story-Execution-Protocol`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1673-Migrate-Login-login`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Universal-Story-Delivery-Contract`]
- [Source: `_bmad-output/planning-artifacts/shadcn-route-ledger.md#Route-Ownership`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design-Accessibility`]
- [Source: `_bmad-output/implementation-artifacts/167-2-fe-migrate-root-entry.md`]
- [Source: `_bmad-output/test-artifacts/atdd-checklist-167.2.md`]
- [Source: `src/app/(auth)/login/page.tsx`]
- [Source: `src/app/(auth)/login/__tests__/page.test.tsx`]
- [Source: `src/components/custom/LoginForm.tsx`]
- [Source: `src/components/custom/LoginForm.test.tsx`]
- [Source: `e2e/login-dashboard.spec.ts`]
- [Source: `src/proxy.ts`]
- [Source: `src/app/(dashboard)/layout.tsx`]
- [Source: `package.json`]

## Dev Agent Record

### Agent Model Used

GPT-5.6 Test Engineer (active RED slice); GPT-5.6 Executor (production GREEN/REFACTOR slice)

### Debug Log References

- Prerequisite sequence: proxy PR `#155` first merged as `0fbc922d90060314df222e668abd433686b4bbbe`. Final slash/backslash hardening then landed in prerequisite PR `#156` from commit `67d914f02d122a932b64dcf80bd3b365d1b77af7`, merged as `b1ca85992277828c658711fc8dd2a7a33a4aeefd`. The prerequisite branch/worktree cleanup completed, and this Story worktree was fast-forwarded to that merge SHA before final validation. Current Story `HEAD`, local `main`, and `origin/main` resolve to `b1ca85992277828c658711fc8dd2a7a33a4aeefd`.
- Genuine initial RED remains preserved: the pinned direct command collected 34 tests, with 27 passing and seven failing for the missing `h1`, `main`, hydration autofocus, classified and associated recovery, re-authentication context, and protocol-relative redirect rejection. Production files had no diff at that RED checkpoint.
- The first independent reviews returned `REQUEST CHANGES` and architectural `BLOCK`. Accepted findings were a same-render duplicate-submit race, incomplete state/theme/touch evidence, duplicate live error announcements, localized redirect loss, and the proxy-owned authenticated open redirect. Remediation RED then failed 5 of 33 form tests for the duplicate race, error-toast duplication, and loss of localized query/fragment/space destinations before reaching 33/33 GREEN.
- A later final-review cycle accepted four additional findings: pre-hydration controls were disabled but incorrectly exposed a busy state, route-owned inputs measured `36px` high instead of the `44px` touch-target floor, the E2E console policy masked a raw network failure, and theme setup registered unsafe pre-DOM root mutations. These findings were repaired test-first.
- The first frozen review of that repaired snapshot returned code-review `APPROVE` and architecture `BLOCK`. The architect found that both component and browser recovery stopped after the first injected `503`, so neither proved the required deliberate second retry. The two verdicts and frozen hash `3ba7fdff4a0e08c0b648e201fa9ad28466043b77e6aafe2cfbcb08257789bc27` are superseded by the accepted remediation and do not count as either member of the later fresh final review pair; at that checkpoint no replacement frozen hash or final `APPROVE`/`CLEAR` was claimed.
- The test engineer added an active component test proving exactly one new request on a deliberate retry after the first `503` and extended the browser recovery scenario through the second deliberate `503`. The named component retry test was already GREEN against the existing production behavior. A second test for the valid decoded redirect `/orders?q=50%` produced genuine production-owned RED: `Expected /orders?q=50%`, `Received /dashboard`. `URLSearchParams` had already decoded the query, but production redundantly called `decodeURIComponent`; the remaining literal `%` threw and forced the fallback.
- The accepted production remediation was minimal: `isSafeRedirect` now applies its existing path, slash/backslash, control-character, and fixed-origin checks directly to the already-decoded redirect and preserves the original valid value. No dependency, shared helper, alternate redirect contract, or weakening of unsafe redirect rejection was introduced. Direct page/form GREEN followed at 43/43.
- The post-retry-remediation checkpoint on Node `v24.18.0`/npm `11.11.0` passed the page/form targets at 43/43, the explicit deliberate-retry selection at 1/1, and proxy at 7/7. That checkpoint was later superseded by the malformed-percent remediation and its fresh validation below.
- Frozen hash `2a02b384c5d650389ef908c92e918ab25874c3754bbe1217c465753b35af530f` received code-review `APPROVE` and architecture `BLOCK`. The accepted material architecture finding showed that malformed raw outer queries were decoded by `URLSearchParams` into otherwise same-origin paths `/orders?q=�%A` and `/orders?q=%GG`; the existing malformed test only passed an encoded no-leading-slash value and therefore did not exercise this path-shaped case. Both verdicts and the frozen hash are superseded by the accepted finding and its remediation, do not count toward the later fresh final review pair, and were not a new final `APPROVE`/`CLEAR`.
- Test-only RED was isolated to `src/components/custom/LoginForm.test.tsx`: 39 tests collected, 37 passed, and two failed with `Expected /dashboard` versus the decoded destinations `/orders?q=�%A` and `/orders?q=%GG`. Production was untouched at the RED checkpoint, while the literal `/orders?q=50%` control remained GREEN.
- The minimal production repair in `LoginForm.tsx` rejects `U+FFFD` and nonterminal malformed or incomplete percent sequences while preserving a terminal literal `%`, complete `%HH` sequences, localized redirects, nested `%2F`, and every existing external, protocol-relative, backslash, script, control-character, and non-path fallback.
- Fresh authoritative GREEN on Node `v24.18.0`/npm `11.11.0`: the focused redirect selection passed 3/3; direct page/form targets passed 2/2 files and 45/45 tests in `5.64s`; and proxy passed 1/1 file and 7/7 tests in `457ms`. The form retains the synchronous submission lock, one request per deliberate attempt, localized, nested, literal-terminal-percent, and complete-percent destinations, one associated inline error announcement, cancellable recovery focus, and the real held `100ms` success-navigation boundary.
- Browser recovery chronology is exact: the original browser RED measured `36px` input height; production then repaired truthful pre-hydration disabled-versus-busy semantics. The first geometry matrix timed out at `90s`, after which geometry collection was reduced to a single form evaluation per combination. A diagnostic run exposed 96 page errors: 12 for each non-success state and 24 for success. Fake-clock usage was removed in favor of a held `/dashboard` response, and the held-navigation ordering was repaired so the test observes the real request before release. The earlier theme hypothesis was then corrected: `page.addInitScript` accessed a null `document.documentElement` before `<html>` existed, once for each of 84 login navigations plus 12 success-destination navigations, totaling 96. Removing only the two redundant pre-DOM root mutations while retaining storage initialization and post-navigation root assertions produced final Chromium GREEN.
- Official Chromium target on the repaired snapshot collected 10 tests: 9 passed and the optional Manager setup test skipped in `18.9s`, including the 84-combination matrix in `16.7s`, after the sandbox preflight gap was classified. All six Story scenarios passed, including recovery through exactly two requests for two deliberate `503` submissions. Strict unexpected-console and page-error maps were empty. Evidence covers seven states, six widths (`320`, `390`, `768`, `1024`, `1280`, `1440`), both themes, axe, keyboard and visible focus, real touch, `44x44` controls, 200%-equivalent reflow, Russian-copy wrapping/clipping, URL/privacy assertions, and real held `100ms` success navigation.
- Fresh authoritative universal validation passed 1,135/1,135 Vitest files and 18,437/18,437 tests in `149.64s` after the listener `EPERM` was classified as sandbox-only. Full format check, zero-warning lint, type-check, and max-lines all passed. The official Next.js `16.2.12` Turbopack build passed compile in `6.1s`, TypeScript in `12.8s`, and 70/70 pages after its sandbox-only port-bind failure was classified. Privacy passed 29/29 and the repository scan passed 3,432 text files and 0 binary files. E2E policy gates passed for 19 assertion files, 47 wait-free targets, and 0 bare skips.
- YAML parsed with Story status `in-progress`; the exact eight-file manifest, forbidden-surface, package/lock, zero-nonignored-untracked, zero-staged, and diff-check gates passed. The prospective manifest is unchanged, and package/lock plus every forbidden proxy/auth/shared primitive/registration surface retain zero diff.
- Cleanup stopped frontend port `3100` and left backend port `3000` untouched. `e2e/.auth/user.json`, `playwright-report/`, and `test-results/` are absent; no trace, screenshot, video, password-bearing request body, or retained authentication artifact remains.
- The final reviewed implementation/evidence snapshot used the deterministic framed SHA-256 `7b50199d31402fd66c270afece57af0da353f225dcb317869bd9512db22009b2`. The fresh independent code/spec/security mission completed first with terminal verdict `APPROVE` at `2026-08-14T04:53:07.343Z`; the fresh independent architecture/scope/contract mission then completed with terminal verdict `CLEAR` at `2026-08-14T05:06:03.321Z`. Both verdicts apply to that exact frozen snapshot, and there are no unresolved accepted findings.

### Completion Notes List

- Story context and ATDD planning completed on `2026-08-13`.
- Status is `review`; Tasks 1–7 are complete after the fresh sequential `APPROVE` then `CLEAR` review pair, while Task 8 remains open because Git integration has not started.
- The exact RED is stable and Story-owned: seven failures and 27 preserved regression passes with no production changes.
- Accepted review findings remain part of the record; both superseded frozen `APPROVE`/`BLOCK` pairs and their hashes are historical only. The final exact snapshot hash is `7b50199d31402fd66c270afece57af0da353f225dcb317869bd9512db22009b2`, its fresh terminal verdicts were sequentially `APPROVE` then `CLEAR`, and no accepted finding remains unresolved.
- GREEN provides one semantic `main`/`h1` card surface, honest Suspense status, accessible named form, hydration focus, associated classified recovery feedback, retained email plus cleared/focused password, safe re-authentication context, and local same-origin redirect validation.
- Existing login mechanics remain locked at GREEN: disabled but not falsely busy pre-hydration controls, one request per deliberate submission including recovery retry, `retry: false`, exact auth-store arguments, success feedback, and the single real held `100ms` full-page navigation boundary.
- Final current-snapshot browser evidence is 9 passed plus one optional Manager setup skip in `18.9s`; the 84-combination matrix completed in `16.7s`, and all six Story scenarios passed with the second deliberate retry plus empty strict unexpected-console and page-error maps.
- Final current-snapshot universal evidence is focused redirect 3/3, direct 45/45 in `5.64s`, proxy 7/7 in `457ms`, full Vitest 1,135/1,135 files and 18,437/18,437 tests in `149.64s`, official Next.js 16.2.12 Turbopack build with 70/70 pages, and format, zero-warning lint, type, max-lines, privacy, E2E-policy, YAML/status, package/lock, forbidden-surface, exact-manifest, zero-untracked/staged, and diff gates GREEN.
- Browser cleanup completed with frontend `3100` stopped and backend `3000` untouched. `e2e/.auth/user.json`, `playwright-report/`, and `test-results/` are absent; trace, screenshot, and video capture remained disabled; only synthetic credentials were used; and the password never entered a URL or retained artifact.

### File List

- `_bmad-output/implementation-artifacts/167-3-fe-migrate-login-login.md`
- `_bmad-output/test-artifacts/atdd-checklist-167.3.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/__tests__/page.test.tsx`
- `src/components/custom/LoginForm.tsx`
- `src/components/custom/LoginForm.test.tsx`
- `e2e/login-dashboard.spec.ts`

### Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 | Story created and validated as an implementation-ready login migration contract; ATDD RED, implementation, validation, reviews, and Git integration remain pending.                                                                                                                                                                                                                                                                                                 |
| 2026-08-14 | Authored and validated active Story-owned RED: 34 targeted Vitest tests with 27 passing and seven genuine missing-behavior failures; added three active unauthenticated E2E scenarios; production remained unchanged.                                                                                                                                                                                                                                               |
| 2026-08-14 | Implemented the owned login page/form GREEN and independently verified 34/34 targeted tests plus scoped format, lint, type-check, diff, and forbidden-surface audits; browser, universal gates, reviews, and Git integration remain pending.                                                                                                                                                                                                                        |
| 2026-08-14 | Reached the intermediate official preflight-gated browser checkpoint: 8 passed with one optional Manager setup skip; recorded responsive, theme, accessibility, recovery, focus, destination, and privacy evidence before later review hardening.                                                                                                                                                                                                                   |
| 2026-08-14 | Resolved the first independent review findings test-first; merged and cleaned separate proxy prerequisite PR #155, added synchronous duplicate prevention, localized safe redirects, single error announcement, cancellable focus recovery, real touch, and full seven-state browser evidence.                                                                                                                                                                      |
| 2026-08-14 | Completed final slash/backslash prerequisite PR #156 (`67d914f02d122a932b64dcf80bd3b365d1b77af7`, merge/base `b1ca85992277828c658711fc8dd2a7a33a4aeefd`), cleaned its branch/worktree, and fast-forwarded this Story before validation.                                                                                                                                                                                                                             |
| 2026-08-14 | Resolved later accepted review findings test-first: truthful pre-hydration busy state, 44x44 login controls, strict raw-network console handling, deterministic theme initialization, and real held 100ms success navigation. Browser recovery converged from the 36px RED, 90s timeout, and 96-page-error diagnostic to final Chromium GREEN.                                                                                                                      |
| 2026-08-14 | Recorded the superseded frozen code-review `APPROVE` and architecture `BLOCK`: recovery stopped after the first `503` and did not prove the required second deliberate retry, so neither verdict nor the old frozen hash counts as final.                                                                                                                                                                                                                           |
| 2026-08-14 | Accepted remediation added component and browser deliberate-retry evidence. The retry test was GREEN against existing production; a new `/orders?q=50%` redirect test produced genuine RED (`Expected /orders?q=50%`, `Received /dashboard`) because production redundantly decoded the already-decoded query. Removing only that second decode preserved all redirect safety checks and reached direct 43/43 GREEN.                                                |
| 2026-08-14 | Reconciled the post-retry checkpoint: direct 43/43, explicit retry 1/1, proxy 7/7, Chromium 9 passed plus one optional skip, full Vitest 18,435/18,435, official Turbopack 70/70 pages, and all then-applicable universal/privacy/scope gates GREEN. This checkpoint preceded the later malformed-percent review finding. |
| 2026-08-14 | Recorded frozen hash `2a02b384c5d650389ef908c92e918ab25874c3754bbe1217c465753b35af530f` with code-review `APPROVE` and architecture `BLOCK`, then superseded both verdicts/hash after accepting the material path-shaped malformed-outer-query finding. Test-only RED was 37/39 with production untouched and `/orders?q=50%` still GREEN; the minimal local validator repair reached focused redirect 3/3 and direct 45/45. |
| 2026-08-14 | Reconciled fresh authoritative evidence: proxy 7/7, Chromium 9 passed plus one optional skip in 18.9s with the 84-combination matrix in 16.7s, full Vitest 18,437/18,437 in 149.64s, official Turbopack 70/70 pages, and all format/lint/type/max-lines/privacy/E2E-policy/YAML/scope/manifest/worktree gates GREEN. Status remains in-progress because a new fresh final review pair and all Git integration/cleanup are pending; no new frozen hash or final verdict is claimed. |
| 2026-08-14 | Completed the fresh sequential independent final reviews on frozen snapshot `7b50199d31402fd66c270afece57af0da353f225dcb317869bd9512db22009b2`: code/spec/security returned terminal `APPROVE`, then architecture/scope/contract returned terminal `CLEAR`; no accepted finding remains unresolved. Task 7 is complete and status moved to `review`; Task 8, commit, PR, merge, branch/worktree cleanup, and all Git integration evidence remain pending. |
