# Story 167.5: Migrate Cabinet Onboarding `/cabinet`

Status: done — (was: "review"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)

## Story

As a new seller,
I want clear first-cabinet creation,
so that I can proceed to WB token setup confidently.

## Current Review State

Story 167.5 remains `in-progress` under an active correct-course blocker and is not freeze-ready or
merge-ready. Freeze v7 is
invalidated, freeze v8 does not exist, and the Git index is empty. No Story 167.5 commit, push, PR,
merge, branch cleanup, or worktree cleanup has occurred.

- Freeze v7 review: `REQUEST CHANGES` — Critical `0`, High `2`, Medium `2`.
- Latest independent preflight: `REQUEST CHANGES` — Critical `0`, High `1`, Medium `2`.
- Honest account-switch RED is preserved at
  `/private/tmp/story1675-v8-account-cas-red.log` (SHA-256
  `e77dc3b27569209c408a7f1a0ad1ee0371ce777356a0b270deb1c7e9956d1de8`): `1` failed file,
  `2` failed tests. With account A's first POST held, A -> B -> A switching produced four create
  calls instead of one; stale A settlement also removed B's recovery marker.
- The bounded Story-owned account-scoped version-2/CAS/extraction work now has fresh GREEN evidence.
  `/private/tmp/story1675-v8-account-cas-green.log` (SHA-256
  `af38f666ae92a63d2ea830d2954bfc09c9f3afd48d0ec1a3a64935f2c4decea6`) records `5/5` files and
  `43/43` tests passing, including both prior A/B regressions.
  `/private/tmp/story1675-v8-account-cas-static.log` (SHA-256
  `ff73b3a80dc4f227382bbd00b6ab7dfae2229170b8d6ed2e011063184513c086`) records max-lines,
  targeted ESLint, type-check, targeted Prettier, and `git diff --check` PASS with the pinned
  runtime. The controller is `91` physical lines; the split direct tests are `247`, `394`, and
  `132` physical lines; and no file-wide `max-lines` suppression remains. This proves the
  Story-owned marker/admission/stale-UI slice only. It does not resolve the shared frontend/backend
  settlement blocker or make the Story freeze-ready.
- Full accepted remediation is blocked by shared ownership. The backend auth controller has only
  register, login, and logout routes; it does not implement `POST /v1/auth/refresh`. The frontend
  helper for that path is therefore not an authoritative recovery contract.
- `src/services/cabinets.service.ts` can late-commit account A's refreshed user/token and cabinet ID
  over a live account B before Story-owned stale-UI guards run. In addition,
  `src/lib/api.ts:createCabinet` ignores its token argument and `src/lib/api-client.ts` reads mutable
  global auth/cabinet state immediately before requests.
- No canonical Story owns that shared frontend/backend repair. A mock-only reconciliation flow must
  not be presented as GREEN. The pending Batch-mode proposal is recorded at
  `/private/tmp/story1675-correct-course-proposal.md` and requires explicit owner approval before
  canonical backlog or master-plan changes.

The entries below preserve earlier RED/GREEN and browser evidence as historical execution history.
They do not override the bounded GREEN or active correct-course blocker above.

- Test-first persistence-boundary RED: form regression `1 failed / 25 passed`; the expected
  `/кабинет уже создан/i` recovery instead received the raw persistence error.
- The first freeze-v5 review returned `REQUEST CHANGES`: direct/native form submission while the
  first create was pending could start a second non-idempotent POST, and the first freeze-v5
  evidence run failed its timing/integrity requirement. That review and every historical freeze-v4
  and freeze-v5 aggregate are invalidated and unusable for approval.
- Honest High-fix RED: expected create count `1`, observed `2`.
- Freeze-v5 GREEN was `28/28` for the form and `3/3` files / `40/40` tests for the targeted
  route/form/guard suite. It is retained as historical evidence, not the current candidate.
- The first frozen final code/spec/security review returned `REQUEST CHANGES` with one high and two
  medium findings. All three were accepted and resolved: non-idempotent create disables automatic
  mutation retry, the Story browser block intercepts the entire cabinet endpoint family
  fail-closed, and the lifecycle plan force-stages only the two ignored BMAD artifacts before
  cached-manifest verification.
- The next exact-freeze code/spec/security review returned `APPROVE`, but architecture returned
  `BLOCK` with two high findings. Both were reproduced and resolved: token partial success no longer
  permits another deliberate POST in the live mount, and stale cabinet hydration cannot replace the
  retained margin while the initial PUT is pending or recovering.
- Architecture freeze v3 then returned `BLOCK` with one high reload-recovery finding. The prior
  mount-local block disappeared on reload, while old persisted auth could still have no cabinet ID
  and reopen the create form. That freeze and its earlier `APPROVE` are invalidated historical
  evidence only.
- Test-first reload remediation added a `restoring` phase and an account-scoped
  `sessionStorage` marker containing only version/phase and the minimum non-secret current-user
  discriminator. It contains no token, password, cabinet ID, form value, cabinet payload, or email.
  The marker restores the block after ordinary reload/remount, is removed for another user or an
  active cabinet, and is rechecked by `onSubmit` so a native-submit bypass cannot issue POST.
- Safe recovery copy now states that the cabinet already exists, prohibits duplicate creation, and
  requires sign-out/sign-in plus server reconciliation; it never recommends refreshing the page.
- The existing message-based partial-success path still requires proof of both cabinet creation and
  token/refresh failure. Independently, fresh state after a raw storage error can prove a newly
  emerged live cabinet ID. A pre-create authentication/token error without either proof stays
  visible and deliberately retryable without persisting a marker.
- Architecture freeze v4 (`93da6b4...ad8c4`) independently reproduced a distinct committed-state
  split in Zustand 5.0.14: refreshed auth can persist with `cabinetId: null`, the next
  `setCabinetId` call can update live memory and then throw from persistence, and the raw storage
  error was misclassified as a retryable create failure. Freeze v4 and its earlier code/spec/security
  `APPROVE` remain invalidated historical evidence only.
- The ownership-safe repair snapshots the pre-create user and cabinet ID, reads fresh state with
  `useAuthStore.getState()` after failure, and classifies a newly emerged live cabinet ID for the
  same user as committed/uncertain partial success even for a raw `SecurityError` or
  `QuotaExceededError`. The exact minimal session marker remains `{ version, phase, userId }`; the
  uncertain cabinet identity is held only in module memory for the current JavaScript realm.
  Same-realm remount and hard reload remain fail-closed, while genuine reconciled/rehydrated cabinet
  state and a different user clear the block. Raw pre-create failures with no newly emerged cabinet
  ID remain deliberately retryable, and margin recovery retains higher-priority PUT-only behavior.
- The authorized credential wrapper removed inherited password variables, read the approved backend
  `TEST_PASSWORD`, passed it only in memory as `E2E_TEST_PASSWORD` to the child E2E process, and
  emitted or persisted no secret. After restoring the backend and frontend locally, the official
  setup-dependent onboarding Chromium command ran `READ-ONLY` without `--no-deps`, excluded
  `@mutating`, did not edit `.env.e2e`, and passed `23` tests; the optional Manager setup was the
  sole skip (`23 passed`, `1 skipped`, exit `0`). The aggregate includes the official preflight's
  two-test read-only orders smoke. All four `CABINET-BROWSER-01..04` scenarios pass, no real cabinet
  mutation escaped the synthetic/fail-closed family dispatcher, auth-state cleanup was proved
  `AUTH_STATE=ABSENT`, and the local validation services were stopped afterward.
- Protected/forbidden scope and the original first 620 lines of `e2e/onboarding.spec.ts` remain
  byte-identical at SHA-256
  `ffe54309ffb46a31a6148f837d0594f630bea06f77096ba44894c666a9ff2911`. Git index remains empty.
- Immutable freeze v6 aggregate
  `68119af632b9c6a4084e64b5c0fba2b78961b6dc75900e2da614e6610cb41c5c` was invalidated by the
  second independent architecture/scope/contracts review. It returned `BLOCK` with exactly one
  Medium: the visible target-margin helper was a raw paragraph without the
  `FormControl`-generated stable description ID, leaving both the margin and name inputs with
  dangling `aria-describedby` references. The same review reported Critical `0`, High `0`, and Low
  `0` and confirmed the scope, recovery, privacy, and E2E boundaries.
- Before production repair, the focused two-test command matching
  `associates the target-margin helper|does not leave the cabinet name` was honestly RED: `1` file
  failed, `2` failed / `28` skipped, and both failures resolved their `aria-describedby` IDs to
  `null`.
- Minimal GREEN reused the existing `FormDescription` primitive: the name received a meaningful
  screen-reader-only description, and the visible target-margin helper changed from a raw paragraph
  to `FormDescription` while retaining `text-xs`. Shared `src/components/ui/form.tsx` is unchanged.
- Historical post-accessibility GREEN: focused `2 passed / 28 skipped`; form `30/30`; targeted route/form/guard `3/3`
  files and `42/42`; full host Vitest `1136/1136` files and `18470/18470` tests. `format:check`,
  full lint, type-check, `check:max-lines`, E2E assertions (`19` files), fixed waits (`47` targets),
  bare skips (`0`), YAML parse, and `git diff --check` pass.
- The post-remediation production build initially failed only because the sandbox denied its
  subprocess/local-port operation. The host rerun passed compilation, TypeScript, and `70/70`
  static pages.
- Existing success, generic create, margin, and update toast behavior remains intact.
  Token-partial-success copy was deliberately strengthened to prohibit duplicate creation and
  unsafe refresh guidance; prior blanket claims that every toast string remained unchanged were
  inaccurate and are superseded by this precise statement.
- Story and sprint row are `in-progress`. Every freeze-v6 approval/verdict and freeze v7 are
  invalidated. Freeze v8 does not exist; accepted cross-boundary prerequisites, final remediation,
  fresh validation, two sequential independent reviews, and Git integration/cleanup remain open.

## Canonical Acceptance Criterion

**Given** valid, invalid, existing, or failed cabinet states **when** migrated **then** creation
contract, safe input retention, current-step recovery, and next transition remain unchanged
**and** `/wb-token` consumes the guard without editing it.

## Historical Validated Implementation Before Active Correct-Course Remediation

### Route-owned presentation

- Replaced the route's outer `div` with exactly one semantic `main`.
- Reused `PageHeader` from the merged `@/components/product` barrel, producing the route's single
  H1 without editing the product composition.
- Preserved visible Russian current-step copy:
  `Шаг 1 из 3: Создайте кабинет для организации ваших данных`.
- Reused the merged shadcn `Card`/`CardContent` primitives for the focused, constrained,
  responsive `max-w-md` onboarding surface.
- Kept the named `Форма создания кабинета` inside the same `main` landmark.

### Form-owned presentation and recovery

- Added Story-local `min-h-11` at both input call sites and the primary action call site; generic
  `Input` and `Button` primitives remain unchanged.
- Added persistent in-form recoverable feedback using the existing shadcn `Alert` primitive.
- Associated the active feedback with the named form through `aria-describedby`.
- Focuses the in-form alert deterministically after create or update failure.
- Retains the feedback when the user returns to an input, and clears it when a valid deliberate
  retry starts.
- Overrides the global mutation retry policy with `retry: false` for the non-idempotent create
  workflow. A failed create is retried only by deliberate user submission; after a successful
  create followed by margin failure, recovery uses only the existing-cabinet update path.
- Models the form-local create lifecycle explicitly as `restoring`, `idle`, `creating`,
  `margin-recovery`, or `token-recovery-blocked`. `restoring` prevents an enabled-create window
  before reload recovery has been checked. Token partial success disables another create across
  ordinary reload/remount for the same user, while create-originated cabinet-detail hydration
  cannot replace the retained name or margin during pending or recovery states.
- Persists only `{ version, phase, userId }` under the Story-local
  `cabinet-creation:token-recovery:v1` session key. The user ID is the minimum non-secret identity
  discriminator; no cabinet/auth secret material or form payload is stored. Mismatched-user and
  active-cabinet markers are removed.
- Rechecks the persistent marker inside `onSubmit`, covering direct native form submission in
  addition to disabled-button, click, and Enter paths. A same-realm in-memory fallback remains
  fail-closed when `sessionStorage.setItem` throws.
- Rechecks the active lifecycle phase inside the submission path itself. Direct/native submission
  cannot start a second POST while the first create is pending and cannot restart create while the
  dependent margin PUT is pending, even if the disabled action is bypassed.
- Snapshots the pre-create user/cabinet state and reads fresh `useAuthStore.getState()` after create
  failure. A newly emerged live cabinet ID for the same user is treated as committed/uncertain
  partial success even if Zustand throws a raw storage exception after publishing the live ID.
- Keeps the reload-safe session marker minimal and stores the uncertain cabinet identity only in
  module memory. Same-realm remount and hard reload stay blocked; genuine reconciliation and user
  change clear the block.
- Classifies token partial success only when the error includes both `cabinet created` and either
  `token` or `refresh`; ordinary pre-create token/auth failures remain deliberately retryable.
- Preserved existing success, generic create, margin, and update toast behavior by routing the same
  messages to both toast and persistent feedback where applicable. Token-partial-success copy was
  deliberately strengthened to prohibit duplicate creation and unsafe refresh guidance.

### Max-lines-required extraction

The first minimal in-place implementation passed all `33` targeted tests but targeted ESLint
reported:

```text
src/components/custom/CabinetCreationForm.tsx
218:1  error  File has too many lines (224). Maximum allowed is 200  max-lines
```

That result activated the Story's explicit permission for one exclusive presentation helper.
`CabinetCreationFormPresentation.tsx` contains only the existing form JSX plus the new owned
presentation state. Mutation, service, query, store, role, retry, toast, and navigation logic
remain in `CabinetCreationForm.tsx`.

Final raw line counts (the configured max-lines gate counts effective lines):

```text
35  src/app/(onboarding)/cabinet/page.tsx
222 src/components/custom/CabinetCreationForm.tsx
132 src/components/custom/CabinetCreationFormPresentation.tsx
839 src/components/custom/CabinetCreationForm.test.tsx
```

## Behavior Preservation Matrix

| Contract/state                | Targeted evidence                                                  | Result |
| ----------------------------- | ------------------------------------------------------------------ | ------ |
| Existing cabinet IDs          | shared guard replaces to `/dashboard` once                         | Pass   |
| Empty/undefined cabinet IDs   | no redirect                                                        | Pass   |
| Empty → populated IDs         | one redirect; unrelated store update does not repeat               | Pass   |
| Router dependency replacement | effect addresses replacement router                                | Pass   |
| Default form                  | name, `20%`, create action, role gate                              | Pass   |
| Invalid margin/name           | RHF/Zod blocks mutation                                            | Pass   |
| Explicit `0%`                 | submitted and retained as zero                                     | Pass   |
| Create pending                | action busy/disabled; duplicate activation blocked                 | Pass   |
| Recoverable create failure    | safe inputs retained; established toast behavior; associated alert | Pass   |
| Deliberate create retry       | one additional create; alert clears; one `/wb-token` push          | Pass   |
| Token partial success         | recovery blocks click/Enter/direct resubmit; no duplicate POST     | Pass   |
| Reload/remount recovery       | same-user marker restores alert/focus/disabled create              | Pass   |
| Marker account isolation      | another user is unblocked; active cabinet clears marker            | Pass   |
| Storage write failure         | same-realm fallback remains fail-closed                            | Pass   |
| Zustand cabinet-ID split      | emerged live ID blocks remount/reload duplicate create             | Pass   |
| Pre-create token failure      | no false cabinet-created claim/marker; deliberate retry allowed    | Pass   |
| Post-create margin failure    | no advance; update-only retry; no duplicate create                 | Pass   |
| Stale GET during failed PUT   | stale/null hydration cannot replace retained name or margin        | Pass   |
| Existing cabinet hydration    | name/margin hydrate without write                                  | Pass   |
| Existing cabinet update       | one update while pending; no create; one transition                | Pass   |
| Route semantics               | one `main`, one H1, visible step, named form                       | Pass   |
| Focused controls              | both inputs and action contain Story-local `min-h-11`              | Pass   |
| `/wb-token` guard consumer    | same guard import/call; source unchanged                           | Pass   |

## Browser-Owned Evidence

The appended Story-only block in `e2e/onboarding.spec.ts` leaves the existing first 620 lines
byte-identical and adds four fully synthetic, read-only Chromium scenarios:

- `CABINET-BROWSER-01`: one `main`, one H1, visible current step, named form, 44px controls,
  320/390/768/1024/1280/1440 widths, light/dark themes, no horizontal overflow, axe, keyboard
  order, reduced motion, and the 200% reflow-equivalent viewport.
- `CABINET-BROWSER-02`: one intercepted HTTP 503 create failure, retained safe input,
  focused/associated recovery, and an explicit user retry that performs the second and only
  successful POST. After create publishes the cabinet ID, a synthetic cabinet GET returns stale
  `targetMarginPct: null` while the first margin PUT is held; the entered `37%` remains visible.
  That PUT then fails once, and deliberate recovery performs an update-only second PUT while the
  POST count remains unchanged. Exact POST/PUT payloads,
  original-token POST headers, refreshed-token plus cabinet-context PUT headers, pending states,
  and one `/wb-token` history transition pass.
- `CABINET-BROWSER-03`: intercepted transport failure via `route.abort('connectionrefused')`,
  focused/associated recovery, retained inputs, route retention, exactly one aborted POST, and zero
  PUTs.
- `CABINET-BROWSER-04`: holds the first synthetic POST, issues a direct native submit while create
  is pending, and proves POST remains exactly one. After the held POST succeeds, refreshed-token
  persistence is followed by a `QuotaExceededError` only on the cabinet-ID auth write. Persisted
  auth retains the new token with `cabinetId: null`, the exact minimal session marker survives
  reload, recovery is focused and disables create/native submit, and PUT remains zero.

No `@mutating` marker was added. Each scenario installs one family-wide
`**/v1/cabinets**` dispatcher, fulfills only exact expected synthetic operations, records every
unexpected family request, returns synthetic `405`, and asserts the unexpected collection is
empty. No handler uses `route.continue`, `route.fallback`, or `route.fetch`, so no real cabinet
mutation can escape the Story block. The final setup-dependent run passed all four Story browser
scenarios with the synthetic original/refreshed JWT and same-origin auth cookie fixture.

## Test-First Evidence

### Authoritative active RED before production edits

```text
Command: env PATH=/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/bin:/bin /opt/homebrew/bin/npm exec vitest run -- 'src/app/(onboarding)/cabinet/__tests__/page.test.tsx' 'src/components/custom/CabinetCreationForm.test.tsx' 'src/hooks/__tests__/useOnboardingGuard.test.ts'
Exit: 1
Test Files: 2 failed | 1 passed (3)
Tests: 2 failed | 31 passed (33)
Duration: 3.14s
Reasons: missing semantic `main`; first Story input missing `min-h-11`.
```

### Strengthened recovery RED before production edits

The existing form test was strengthened to require the real named form, persistent associated
feedback, deterministic alert focus, and clearing when retry starts. `handleCreateCabinet` is
reset per test to keep mock implementations isolated.

```text
Exit: 1
Test Files: 2 failed | 1 passed (3)
Tests: 4 failed | 29 passed (33)
Duration: 3.27s
Reasons: missing `main`, named real form, Story-local sizing, and associated focused recovery.
```

### Targeted GREEN

```text
Command: env PATH=/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/bin:/bin /opt/homebrew/bin/npm exec vitest run -- 'src/app/(onboarding)/cabinet/__tests__/page.test.tsx' 'src/components/custom/CabinetCreationForm.test.tsx' 'src/hooks/__tests__/useOnboardingGuard.test.ts'
Exit: 0
Test Files: 3 passed (3)
Tests: 33 passed (33)
Post-extraction duration: 2.38s
```

The same suite also passed `33/33` before the max-lines-required extraction (`2.42s`), proving the
extraction did not change behavior.

### Architecture-blocker RED and GREEN

Before the first containment repair, the form-only suite failed `2` of `22` tests: the token-refresh
partial-success action remained enabled, and delayed stale cabinet hydration replaced
`Retry Cabinet` with `Stale Cabinet`. The minimal Story-owned repair then passed `22/22`; the full
targeted route/form/guard suite passed `34/34`.

Architecture freeze v3 then exposed that the mount-local block did not survive reload. Honest RED
before the reload-safe production repair was `3 failed / 21 passed`: unsafe refresh guidance,
missing account-scoped marker cleanup, and missing fail-closed behavior when marker persistence
threw. A second classification RED was `3 failed / 22 passed`; a pre-create auth/token error was
incorrectly presented as if the cabinet already existed, and that defect leaked the marker into two
later tests. After the bounded repair, the form suite passed `25/25`, and the full targeted
route/form/guard suite passed `37/37`.

### Freeze-v4 persistence-boundary RED and GREEN

The new form regression was added before the production repair and honestly failed `1` of `26`
tests (`1 failed / 25 passed`): it expected `/кабинет уже создан/i` but received the raw auth
persistence error. The ownership-safe repair then passed the final form suite `27/27`. After a
pinned local worktree `npm ci`, the final route/form/guard target passed `3/3` files and `39/39`
tests.

### Freeze-v5 pending-submit High RED and GREEN

The first freeze-v5 review returned `REQUEST CHANGES`. Direct/native form submission while the
first create was pending bypassed the disabled action and started a second non-idempotent POST; the
honest regression expected create count `1` and observed `2`. The same freeze-v5 evidence attempt
also failed its timing/integrity requirement. That review and all historical freeze-v4/freeze-v5
aggregates are invalidated and unusable as approval evidence.

The accepted High fix rechecks lifecycle phase inside submission. The final form suite passes
`28/28`: a held first POST plus direct native submit keeps the create count at one, and direct native
submit while the dependent margin PUT is pending also leaves the single create unchanged. The final
route/form/guard target passes `3/3` files and `40/40` tests.

### Freeze-v6 accessibility Medium RED and GREEN

Immutable freeze v6 aggregate
`68119af632b9c6a4084e64b5c0fba2b78961b6dc75900e2da614e6610cb41c5c` reached a second
independent architecture/scope/contracts review, which returned `BLOCK` with exactly one Medium.
The visible target-margin helper was still a raw paragraph and therefore did not receive the stable
description ID generated by the existing `FormControl`/`FormDescription` relationship. The margin
and cabinet-name inputs consequently carried dangling `aria-describedby` references. The review
otherwise found Critical `0`, High `0`, and Low `0` and confirmed scope, recovery, privacy, and E2E
boundaries. Every freeze-v6 approval, verdict, and aggregate became unusable when remediation changed
the frozen files.

Before production repair, the focused two-test command matching
`associates the target-margin helper|does not leave the cabinet name` was honestly RED:

```text
Command: npm exec vitest run -- src/components/custom/CabinetCreationForm.test.tsx -t 'associates the target-margin helper|does not leave the cabinet name'
Test Files: 1 failed (1)
Tests: 2 failed | 28 skipped (30)
Failure detail: both aria-describedby references resolved to null.
```

The minimal production repair imported the existing `FormDescription` primitive, added a meaningful
screen-reader-only `FormDescription` for the cabinet name, and changed the visible target-margin
helper from a raw `p` to `FormDescription` while preserving `text-xs`. Shared
`src/components/ui/form.tsx` remained unchanged.

```text
Focused GREEN: 2 passed | 28 skipped (30)
Form GREEN: 30 passed (30)
Targeted route/form/guard GREEN: 3 files passed, 42 tests passed
```

## Universal Local Validation

Pinned runtime for every npm command: Node `v24.18.0`, npm `11.11.0`.

```text
Focused accessibility Vitest: 2 passed, 28 skipped.
Form Vitest: 30/30 passed.
Targeted route/form/guard Vitest: 3 files, 42 tests passed.
Full Vitest host rerun: 1136 files, 18470 tests passed, exit 0.
Format check: `format:check`, passed.
Full ESLint: exit 0, zero warnings.
Targeted E2E/file ESLint: exit 0, zero warnings.
TypeScript: `tsc --noEmit`, exit 0.
Max-lines: exit 0.
Production build: sandbox attempt failed only on subprocess/local-port denial; host rerun compiled,
passed TypeScript, generated 70/70 static pages, exit 0.
Privacy source scan: 3435 text files, zero violations.
Privacy policy tests: 29/29 passed.
E2E vacuous-assertion scan: 19 files passed.
E2E fixed-wait scan: 47 owned targets timer-free.
E2E bare-skip scan: zero bare skips.
Docs citations: historical baseline matched at 18 entries.
Story markers: 31 files scanned, zero violations.
Lessons, Next async params, locale-percent baseline, and normalizer baseline: passed.
Sprint YAML parse: passed.
Whitespace: `git diff --check`, exit 0.
Forbidden scope: unchanged.
Git index: empty.
```

The worktree dependency audit found a forbidden external `node_modules` symlink. Only that generated
symlink was removed; pinned Node `24.18.0` / npm `11.11.0` `npm ci` installed `759` packages into a
local worktree directory, and `package.json` plus `package-lock.json` remained unchanged. The initial
Turbopack symlink failure is invalidated. The host build after local install passed compilation,
TypeScript, and `70/70` generated pages, exit `0`.

The authoritative post-remediation host rerun passed `1136/1136` files and `18470/18470` tests,
exit `0`.

After resolving the two medium preliminary E2E audit defects, pinned Node `v24.18.0` / npm
`11.11.0` reruns passed targeted Prettier, targeted ESLint, the E2E assertion/wait/bare-skip scans,
the targeted Vitest suite (`3/3` files, `33/33` tests), `npm run type-check`, and
`git diff --check`.

The mandatory Story-only Chromium loop first resolved E2E-evidence defects around synthetic auth,
guarded fixtures, hydration readiness, and alert targeting. The first frozen final review then
identified that the production create mutation unsafely inherited `mutations.retry: 1`, that exact
endpoint interceptors were not family-wide fail-closed, and that the lifecycle plan omitted
force-staging for ignored evidence. The accepted repair adds `retry: false`, production-faithful
unit coverage under a global retrying QueryClient, one family-wide fail-closed dispatcher per
browser scenario, and explicit two-file force-staging in the plan. Fresh targeted and universal
gates pass, and the final credentialed Chromium command again completed with `6 passed`, `1`
optional Manager skip, and exit `0`.

The following architecture review reproduced two additional partial-success defects on freeze
`9fb57ebf8fa6f8bbd5872b3021888d3779a2db2fe12b4aa02bfee94cd3fd3001` and returned `BLOCK`.
Test-first remediation stayed inside the Story-owned controller/tests/E2E surface: the explicit
phase machine blocks token-partial-success resubmission and suppresses stale query hydration after
creation begins.

Architecture freeze v3 later reproduced one additional high-severity reload-recovery defect and
returned `BLOCK`: the mount-local phase disappeared on reload and could expose another create when
persisted auth still had no cabinet ID. The accepted repair added the `restoring` phase, same-user
session marker, account/active-cabinet cleanup, native-submit recheck, safe re-authentication copy,
and partial-success-only token classification. Those freeze-v3 results were later superseded by the
freeze-v4 persistence-boundary remediation and fresh final-candidate validation above.

After restoring the backend and frontend locally, the official memory-only credential wrapper
removed inherited `TEST_PASSWORD` and `E2E_TEST_PASSWORD`, read only the approved backend
`TEST_PASSWORD`, and supplied only child-process `E2E_TEST_PASSWORD`. It printed and persisted no
secret, did not edit `.env.e2e`, ran `READ-ONLY` without `--no-deps`, and excluded `@mutating`. The
final command passed `23` tests with one optional Manager skip, exit `0`; the aggregate includes the
official preflight's two-test read-only orders smoke. All four Story scenarios passed.
Cabinet-family traffic was fully synthetic/fail-closed, no real mutation escaped, cleanup proved
`AUTH_STATE=ABSENT`, and the local validation services were stopped afterward.
`CABINET-BROWSER-04` held the first
POST and proved direct native submission kept the POST count at exactly one before continuing into
the synthetic cabinet-ID persistence failure and reload-safe recovery.

## Scope and Hash Proof

### Pre-GREEN protected baseline

A protected manifest was captured before production editing from tracked production/configuration
paths, excluding all tests and the two authorized existing production files. It includes all other
onboarding routes, guard/query/API/service/store/schema/route contracts, generic/product
compositions, and package/compiler/configuration files.

```text
Protected entries: 2096
Manifest SHA-256: a1bf40fd8e7451c19f6a039598ecd081defd676684f3a599bd70c3891e0912c6
Post-GREEN shasum verification: PROTECTED_MANIFEST_IDENTICAL=yes
```

Named forbidden/protected paths retain these baseline SHA-256 values:

| Path                                     | SHA-256                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `src/hooks/useOnboardingGuard.ts`        | `6872f52006a7e4f35cd2a89cd97080e1cad9cd33b28991422da8cb40ecb000f1` |
| `src/app/(onboarding)/wb-token/page.tsx` | `c98eaa5097c3b8c38ae9774b49d05245c990271b3382e922c030cc44b2ea13f2` |
| `src/hooks/useCabinetTaxSettings.ts`     | `6a3c7fef197ad9b682dfa2683f963fe85ae396f2280665e7035e71e5a13dd75b` |
| `src/lib/api/cabinet.ts`                 | `993f20645cadb9ca2a2af856c3d656bbf232b663fb985f38bae53955cfe03b32` |
| `src/services/cabinets.service.ts`       | `19642271a4fd119aadd85d0fd31329579f295fb53fc14873fc650ca18cbfbf48` |
| `src/stores/authStore.ts`                | `10a75298cf5573ce2d91b44af5ab988fab82775b18c933438f3717e235dae49c` |
| `src/lib/routes.ts`                      | `736e6d5d35f98c6ea07cc33c90e99b398825c20133204e32cc82611715499004` |
| `src/components/product/index.ts`        | `44c71eb66fae258ebe030c3cab2adcbf9191239efd1d71a8ebecd59a330994d0` |
| `src/components/product/PageHeader.tsx`  | `1b97b8ccc127883b8430db22e41e2de30b2fe48af7bc229b90dc7ea50d626dae` |
| `src/components/ui/input.tsx`            | `ce4f733e347ae79217fb9a304441c0e79bb1b0676a048e8f8ec8141bfce2763e` |
| `src/components/ui/button.tsx`           | `609eb70c51be0d358129e85363d0a468c1c8423928a30a46286a908b25f3f426` |
| `src/components/ui/card.tsx`             | `28440e4f29debba1a8d1db0c50e25d4a03e641794f2f4d3757b13876ad263684` |
| `src/components/ui/alert.tsx`            | `50b1eef158fb21fde198febca5bf4dc63082c5a11469b9e4e564d9095264acea` |
| `package.json`                           | `09291c9463d0f970c3013ab0a919cf95be3d6743d84f6f249002771c29305823` |
| `package-lock.json`                      | `ac72c9297e4b457bee252f6297d81c381d4a7a1cf9c6cdef92ec3ad01a491ef9` |
| `tsconfig.json`                          | `dbd59d5b3f11855b6414b61386ead3d12c1ac2385c1094a6ac3d45f11ad808e9` |
| route ledger                             | `2d1ebb2ab3801170f1c0497c8051cec17319b4654072bc5416d5e08d84cf9fb9` |

Historical freeze-v6 owned/evidence hashes after accessibility remediation (invalidated):

| Path                                                        | SHA-256                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/app/(onboarding)/cabinet/page.tsx`                     | `1eb46782aa4b2d392a9ff445678870a6e2ddd979c68d0966bc7c4fdcb1450906` |
| `src/components/custom/CabinetCreationForm.tsx`             | `af4d0d9d397b8c53e4dfde92f4b4e4f2a3392682dddc7ec80b5645db33b32b24` |
| `src/components/custom/CabinetCreationFormPresentation.tsx` | `4eecbd2fdcea45690b5a895675f6a52f760c8ae3558260ca62494423df190399` |
| `src/components/custom/CabinetCreationForm.test.tsx`        | `4ca02b7b0838a3bf3ba6155a9c7c860e7398b6e9bd4a310bcccebcb64624d616` |
| `e2e/onboarding.spec.ts`                                    | `9e2f20a7adedbd8ccbfe6e633321bd7a9148301402fc3243fdadbe0461dfa8fa` |

Physical line evidence: `CabinetCreationFormPresentation.tsx` is `132` lines;
`CabinetCreationForm.test.tsx` is `839` lines and the repository max-lines gate passes;
`CabinetCreationForm.tsx` is unchanged at `222` lines. The full `e2e/onboarding.spec.ts` hash is
unchanged by this remediation.

## Current Unstaged Candidate Manifest — Not Frozen

1. `.omx/plans/167.5-migrate-cabinet-onboarding.md` — corrected ignored-evidence staging contract
2. `_bmad-output/implementation-artifacts/167-5-fe-migrate-cabinet-onboarding.md`
3. `_bmad-output/test-artifacts/atdd-checklist-167.5.md`
4. `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story 167.5 row only
5. `e2e/onboarding.spec.ts` — appended Story-only browser evidence
6. `src/app/(onboarding)/cabinet/__tests__/page.test.tsx`
7. `src/app/(onboarding)/cabinet/page.tsx`
8. `src/components/custom/CabinetCreationForm.test.tsx`
9. `src/components/custom/CabinetCreationForm.tsx`
10. `src/components/custom/CabinetCreationForm.accountRecovery.test.tsx`
11. `src/components/custom/CabinetCreationFormPresentation.tsx`
12. `src/components/custom/cabinetCreationRecovery.test.ts`
13. `src/components/custom/cabinetCreationRecovery.ts`
14. `src/components/custom/cabinetCreationSubmission.ts`
15. `src/components/custom/useCabinetCreateMutation.ts`
16. `src/components/custom/useCabinetCreationRecovery.ts`
17. `src/components/custom/useCabinetCreationSubmission.ts`
18. `src/hooks/__tests__/useOnboardingGuard.test.ts`

The two BMAD evidence artifacts are intentionally ignored by the repository-wide
`_bmad-output/` rule. The corrected OMX lifecycle may eventually force-stage only those two paths,
but staging is forbidden until the remediation, prerequisites, validation, and two reviews finish.
The current eighteen-path list is an inspection snapshot, not a freeze; it must be regenerated after
the executor stops changing the source. The Git index is empty.

## Remaining Work — Correct Course, Then Review and Integration

- Obtain explicit owner approval for the Batch-mode course-correction proposal. Do not add sprint
  rows or modify canonical epics/master artifacts before that approval.
- Merge an authoritative backend prerequisite defining session/reconciliation or cabinet-create
  idempotency/status semantics.
- From updated `main`, merge a shared frontend auth/session prerequisite that conditionally commits
  account-scoped settlements, supplies immutable request context, and coordinates login/guard state.
- Resume Story 167.5 only after both prerequisites are merged. Complete the Story-owned version-2
  marker/CAS extraction and prove the current two-test account-switch RED is GREEN without mock-only
  backend behavior.
- Regenerate the exact changed manifest, rerun targeted and universal validation, run the authorized
  memory-only Chromium loop if still applicable, and create a new immutable freeze v8.
- Run two sequential fresh-context adversarial reviews on identical freeze v8: code/spec/security
  must end in `APPROVE`, then architecture/scope/contract must end in `CLEAR`.
- Only then commit, push, create a ready PR, merge, delete remote/local branches, remove the exact
  worktree, prune, and prove synchronized clean `main`.

No deploy, production operation, force-push, direct push to `main`, staging, commit, push, merge,
or cleanup occurred.

## Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-14 | Created active RED/ATDD behavior locks and moved the Story sprint row to `in-progress`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-08-14 | Implemented the minimal owned route/form GREEN, added focused associated recovery, made the max-lines-required presentation extraction, and stopped at `33/33` targeted GREEN with protected hashes and empty-index proof.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-08-14 | Added three synthetic Story-only browser scenarios, passed the prior universal gates, and recorded the recovered-backend credential mismatch that blocks runtime Chromium evidence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-08-14 | Resolved two medium preliminary E2E audit defects by adding `1440` to the viewport matrix and making the cabinet-detail interceptor method-aware; pinned targeted reruns passed. This was not final review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-08-14 | Re-ran mandatory setup-dependent Chromium from the preserved worktree; preflight and login/register smoke passed, while Owner auth remained on `/login` until timeout after backend `401 INVALID_CREDENTIALS`; all three Story browser tests remained not run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-08-14 | Completed the authorized memory-only credentialed browser loop. Corrected synthetic auth/proxy setup, guarded-fixture compatibility, hydration readiness, alert targeting, and retry-count evidence; final Chromium result was `6 passed`, `1` optional Manager skip, exit `0`. Story moved to `review`. **Lessons:** (1) Protected-route fixtures need both a future JWT and same-origin cookie. (2) Wait for store readiness before filling hydrated forms. (3) Browser evidence must reflect global mutation retries.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-08-14 | Resolved the first frozen final review (`REQUEST CHANGES`: 1 high, 2 medium). Disabled automatic retry for non-idempotent cabinet creation, added production-faithful unit evidence, replaced exact E2E routes with family-wide fail-closed dispatchers, corrected the ignored-artifact staging plan, and repeated targeted, universal, build, and credentialed Chromium validation successfully. **Lesson:** a global mutation retry default is unsafe for multi-step workflows containing a non-idempotent POST.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-08-14 | Resolved the architecture `BLOCK` on freeze `9fb57ebf...3001`: token partial success now blocks another create, and stale/null cabinet hydration cannot overwrite retained margin during a failing initial PUT. Fresh targeted `34/34`, full `18462/18462`, build, privacy, policy, and Chromium `6 passed` / `1` optional skip evidence pass. **Lessons:** (1) Automatic retry suppression does not prevent deliberate duplicate POSTs after partial success. (2) Publishing an ID before a dependent PUT requires hydration isolation.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-08-15 | Resolved architecture freeze-v3 `BLOCK` (1 high): token partial-success recovery now survives ordinary reload/remount through an account-scoped session marker, begins in `restoring`, blocks native resubmission, clears on user/cabinet change, uses safe sign-out/sign-in copy, and does not misclassify pre-create token failure. Fresh targeted `37/37`, full `18465/18465`, 70-route build, policy gates, and Chromium `20 passed` / `1` optional skip pass; auth state is `ABSENT`. **Lessons:** (1) A page-local phase cannot protect a non-idempotent partial success across reload. (2) Recovery persistence needs identity scoping and submit-time revalidation. (3) Error text classification must prove commit before declaring partial success. Status: in-progress → review.                                                                                                                                                                     |
| 2026-08-15 | Resolved architecture freeze-v4 `BLOCK` (1 high) inside Story ownership. Snapshotting pre-create identity plus fresh Zustand state detects a newly emerged live cabinet ID after a raw persistence throw; the minimal session marker and realm-local uncertain identity keep remount/reload fail-closed, while reconciliation/user change clears the block and raw pre-create failures remain retryable. Honest RED was `1 failed / 25 passed`; final form `27/27`, targeted `39/39`, host full `18467/18467`, build `70/70`, Chromium `23 passed` / `1` optional skip, and policy/scope gates pass. Freeze v5 and two independent reviews remain pending. **Lessons:** (1) A persistence middleware exception can split live from reloadable auth state. (2) Commit classification must inspect fresh state, not only error text. (3) Minimal durable markers and realm-local evidence serve different recovery boundaries. Status: in-progress → review.      |
| 2026-08-15 | Resolved the first freeze-v5 `REQUEST CHANGES` High: direct/native submission during a pending create could duplicate the non-idempotent POST (honest RED expected `1`, observed `2`), and that evidence run also failed timing/integrity. Submission now rechecks lifecycle phase; held-POST and pending-margin-PUT direct-submit proofs keep create at one. Final form `28/28`, targeted `40/40`, host full `18468/18468`, check:max-lines, build `70/70`, and Chromium `23 passed` / `1` optional skip pass. All freeze-v4/freeze-v5 aggregates and verdicts are invalidated and unusable; freeze v6 plus two fresh reviews remain pending. **Lessons:** disabled controls are presentation, not concurrency authority; mutation admission must enforce phase inside the submit path.                                                                                                                                                                        |
| 2026-08-15 | Invalidated immutable freeze v6 (`68119af...c5c`) after the second independent architecture/scope/contracts review returned `BLOCK` with exactly one Medium and Critical/High/Low `0`: both form inputs had dangling description references because the visible target-margin helper was a raw paragraph and the name lacked a real description. Honest focused RED was `2 failed / 28 skipped`, with both referenced IDs resolving to `null`. Minimal reuse of `FormDescription` produced focused `2 passed / 28 skipped`, form `30/30`, targeted `42/42`, host full `18470/18470`, all universal gates, host build `70/70`, and official read-only Chromium `23 passed` / `1` optional skip with `AUTH_STATE=ABSENT`; services were stopped afterward. Freeze v7 and two fresh reviews remain pending; no freeze-v7 verdict is claimed. **Lesson:** an `aria-describedby` token is evidence only when it resolves to an existing meaningful description node. |
| 2026-08-15 | Invalidated freeze v7 after independent review returned `REQUEST CHANGES` (`0` Critical, `2` High, `2` Medium); the latest preflight also returned `REQUEST CHANGES` (`0` Critical, `1` High, `2` Medium). Preserved the honest A/B account-switch RED (`2` failures), then verified bounded Story-owned version-2/CAS extraction GREEN at `5/5` files and `43/43` tests. Fresh `check:max-lines` passes; the controller and split direct tests are below their physical caps without file-wide suppressions. Story/sprint state is `in-progress`. Full acceptance remains blocked because the backend has no real `POST /v1/auth/refresh`, the shared cabinet service can late-commit account A over live B, and the create API ignores its token argument in favor of mutable global client state. A Batch-mode two-prerequisite proposal is pending explicit owner approval; no freeze v8, stage, commit, push, PR, merge, or cleanup exists. **Lesson:** Story-local stale-UI suppression cannot make a shared cross-account auth commit safe. |
| 2026-08-17 | Both Remaining-Work prerequisites landed (167.8 BE PR #227; 167.9 FE PR #164/main fa0cccef), so the dirty lane was fast-forwarded to main `6becd8ac` (stash/merge/pop; conflicts resolved in the Story's favor for the refactored form seam). Ported and preserved the 167.9 typed-result behavior into the refactored seam: `useCabinetCreateMutation` `onSuccess` now proceeds ONLY on `status==='applied' && result.cabinet`; stale/indeterminate return before `finishRecoveryOperation`/`clearRecoveryMarker` (marker survives for reconciliation), suppressing toast/navigation/reset/marker-clear. Wired the 167.9 carry-over: `CreateAttemptSnapshot` carries the immutable initiating `token`; a superseded settlement now calls `getCabinetCreationOperation(operationId, initiatingToken)` (Story 167.8 contract, first production consumer) for quiet account-scoped reconciliation. Added `CabinetCreationForm.accountSwitchRealSettlement.test.tsx`: the two historical account-switch RED scenarios now run against the REAL unmocked `handleCreateCabinet` (only `@/lib/api` transport mocked; fresh `sessionNonce` per `login()`), proving no duplicate creates across A→B→A, stale-A leaving B's marker/input untouched, and B's own live settlement legitimately applying. Ported the form-level stale/indeterminate suite (2 tests) into the condensed form test file and re-ran main's `cabinets.service.settlement.test.ts` (269 lines, GREEN). Gates: vitest full `18580/18580` (first pass had 1 unrelated flake; immediate rerun fully green), lint `0/0`, type-check `0`, format:check PASS, check:max-lines PASS, check:docs baseline-OK, `git diff --check` clean, `next build --webpack` 70/70 routes compiled successfully. **Lessons:** (1) Port behavior BEFORE resolving a refactor conflict — the guard belongs in the extracted seam, not the legacy file. (2) Real-semantics tests must drive `login()` so `sessionNonce` actually rotates; `setState` silently keeps the old session. (3) A full-suite 1-flake needs an immediate clean rerun before any GREEN claim. Status: in-progress → review (two adversarial reviews + orchestrator git handling pending; no commit/push/PR). |

## Accepted residual risk (2026-08-17, pass-2 review)

Cross-tab same-account create duplication: recovery markers + CAS live in
`sessionStorage` (tab-local); two tabs with no cabinet can both admit a create
(different operationIds, so 167.8 idempotency does not dedup them). Accepted for
this story — lowest-cost hardening (localStorage tombstone / Web Locks in
`admitRecoveryOperation`) recorded as a fast-follow candidate if multi-tab
onboarding becomes a real usage pattern. Single-tab flows (the overwhelmingly
common path) are fully protected by the marker + CAS + backend idempotency stack.
