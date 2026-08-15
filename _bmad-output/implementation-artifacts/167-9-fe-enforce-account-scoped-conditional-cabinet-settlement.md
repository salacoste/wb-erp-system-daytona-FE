# Story 167.9: Enforce Account-Scoped Conditional Cabinet Settlement

Status: backlog

## Story

As a user who may switch accounts while cabinet creation is pending,
I want late results settled only into their initiating session,
so that stale work from account A cannot alter live account B or drive B's UI.

## Acceptance Criteria

1. Given account A initiates cabinet creation and the live account/session changes before settlement, when success, failure, or reconciliation arrives, then an immutable initiating account/session/operation context reaches transport and settlement.
2. Auth/cabinet state changes only if the expected live account/session/operation still matches; stale A cannot mutate B.
3. Stale settlement produces no B-visible toast, navigation, reset, marker clear, or error UI.
4. The shared boundary returns a typed `applied | stale | indeterminate` result; only `applied` may continue existing success effects in the minimal `CabinetCreationForm` consumer hunk, while `stale` and `indeterminate` cannot toast, navigate, reset, or clear a recovery marker.
5. Recovery markers contain no password, token, cabinet payload, or email.
6. GREEN consumes the real merged Story 167.8 unknown/in-progress/succeeded/failed and idempotency contract; a mock-only endpoint cannot satisfy acceptance.
7. Story 167.5 route, form presentation/validation, recovery-marker implementation, backend code, unrelated UI/shared state, deployment, production, direct-main, and force-push remain untouched.

## Tasks / Subtasks

- [ ] Verify and record merged Story 167.8 backend contract/OpenAPI and cleanup evidence; change status only after that prerequisite is satisfied.
- [ ] Create the exact frontend branch/worktree from updated frontend `main`; record base SHA.
- [ ] Inventory all consumers of cabinet service, API helper/client, auth/session settlement, login, and onboarding guard state; freeze an explicit allowed path manifest.
- [ ] Add honest behavioral RED tests for A→B, A→B→A, logout/login, stale success/failure, immutable transport context, conditional commits, and suppressed stale UI effects.
- [ ] Add privacy tests proving recovery markers exclude password, token, cabinet payload, and email.
- [ ] Implement the smallest immutable request-context and conditional account/session/operation settlement boundary.
- [ ] Prove supplied context reaches API transport instead of being ignored or replaced by mutable global state.
- [ ] Return typed `applied | stale | indeterminate` and integrate only the exact reviewed `CabinetCreationForm` consumer hunk; prove stale/indeterminate suppress toast/navigation/reset/marker clear without changing presentation or recovery implementation.
- [ ] Consume and integration-test the real local Story 167.8 contract; reject mock-only GREEN.
- [ ] Run targeted/universal gates, exact scope audit, two independent review passes, and reruns.
- [ ] Commit, push, open/merge the PR, then delete local/remote branch and remove/prune the worktree with absence evidence.

## Dev Notes

### Exact execution lane

- Repository: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`
- Branch: `cdx/epic-167-story-9-account-scoped-cabinet-settlement`
- Worktree: `/private/tmp/wb-fe-167-9-account-scoped-cabinet-settlement`
- Prerequisite: merged Story 167.8 real backend contract.
- Executable plan: `.omx/plans/167.9-enforce-account-scoped-conditional-cabinet-settlement.md`

### Current defect truth

- `src/services/cabinets.service.ts` snapshots account A, but late success can unconditionally commit A's returned token/user/cabinet into global state after B is live.
- `src/lib/api.ts:createCabinet(data, _token?)` accepts but ignores `_token`.
- `src/lib/api-client.ts` reads mutable global token/cabinet state immediately before requests.
- Story-owned callback guards can suppress some UI but cannot repair the shared synchronous auth-state mutation.

### Allowed and forbidden scope

Allowed: inventoried shared cabinet service; API helper/client request-context plumbing; auth/session conditional-settlement helpers; direct login/session/guard coordination; the smallest reviewed `CabinetCreationForm` consumer hunk and direct test for typed `applied | stale | indeterminate`; direct unit/integration/privacy tests and evidence. Forbidden: Story 167.5 route, form presentation/validation, recovery-marker implementation, unrelated form behavior, and active worktree; other routes; tokens/primitives/AppShell; backend code; unrelated stores/services; new dependencies; production/deploy; direct/force push to `main`.

### Test requirements

Run focused Vitest/integration proof first, including the real local backend contract, then `npm run format:check`, `npm run lint`, `npm run type-check`, `npm run check:max-lines`, `npm run build`, and `git diff --check`. Route E2E/freeze remains Story 167.5's later integration evidence.

### Architecture, privacy, and session guardrails

- Initiating context must be immutable and minimal; do not clone global auth state into a second authority.
- Conditional settlement must compare the expected account/session/operation with live state at commit time.
- Stale outcomes may be reconciled for their initiating account but cannot affect the current account's state or UI.
- No secret or personally identifying payload enters recovery markers or logs.
- Do not edit or destructively align the dirty Story 167.5 worktree. The consumer seam is a known semantic and textual overlap: Story 167.9 merges first and owns the typed-result behavior plus direct regression tests. During later Story 167.5 alignment, port and preserve that behavior in the refactored `useCabinetCreateMutation` seam, rerun targeted stale/indeterminate settlement tests, and obtain fresh independent review after the overlap is resolved.

## Project Structure Notes

This non-route Story owns the shared settlement boundary and only its minimal typed-result form consumer seam. It adds no route-ledger row and must not absorb Story 167.5 route, presentation, validation, or recovery implementation.

## References

- `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md` — canonical Story and DAG.
- `.omx/plans/shadcn-full-ui-migration-master.md` — program lifecycle.
- `.omx/plans/167.9-enforce-account-scoped-conditional-cabinet-settlement.md` — executable plan.
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-15-story-167-5-cabinet-settlement.md` — approved correction.
- Story 167.8 implementation artifact and final API/OpenAPI evidence — required before execution.

## Dev Agent Record

### Agent Model Used

Not started.

### Debug Log References

Not started.

### Completion Notes List

Not started. Do not add completion, review, merge, or cleanup claims without exact evidence.

### File List

Not started; executor must record the exact reviewed manifest.

## Change Log

- 2026-08-15: Story created from the owner-approved Batch correct-course proposal; status `backlog` pending Story 167.8 merge. No implementation claimed.
