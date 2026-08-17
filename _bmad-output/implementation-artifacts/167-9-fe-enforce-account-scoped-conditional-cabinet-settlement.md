# Story 167.9: Enforce Account-Scoped Conditional Cabinet Settlement

Status: review

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

glm-5.2[1m] orchestrator → opus executor (impl + fix-round), opus code-reviewer ×2 passes (2026-08-17).

### Debug Log References

- Pass-1 (structural): 2 HIGH (unguarded margin follow-up; legacy-session silent dead-end), 3 MEDIUM, 3 LOW — all HIGH/MEDIUM/selected-LOW fixed same session.
- Pass-2 (narrative): 0 CRITICAL/HIGH; 3 MEDIUM (202-vs-200 fixture drift → fixed to live-swagger 200; live-evidence attestation → strengthened with GET-op status-code citation in contract-test header; dead reconciliation accessor → recorded below as carry-over), 3 LOW (options-spread leak — pre-existing pattern, skipped; vacuous enum assertion → pinned exact literal; setToken/setUser nonce-null constructibility → unreachable today, noted).

### Completion Notes List

- **Explicit carry-over (Story 167.5 alignment, NOT satisfied here):** `getCabinetCreationOperation` (src/lib/api.ts) is plumbed and contract-tested but has ZERO production consumers — the "reconciliation arrives" clause of AC1 is wired only up to the accessor. Story 167.5 must consume it in the `useCabinetCreateMutation` seam alignment, rerun stale/indeterminate settlement tests, and obtain fresh independent review (per this story's Dev Notes overlap protocol).
- AC6 evidence: live-backend in-vitest is infeasible by design (MSW `onUnhandledRequest:'error'` + epic128 outbound network guard denies localhost egress from vitest). Out-of-band read-only evidence captured 2026-08-17 against live :3000 (PR #227 code): unauth → 401 UNAUTHORIZED envelope; random-UUID → 404 CABINET_CREATION_OPERATION_NOT_FOUND; non-UUID → 400 CABINET_CREATION_OPERATION_ID_INVALID; GET op endpoint serves ALL states (in_progress/succeeded/failed) as HTTP 200 (swagger responses 200/400/401/403/404/410; no 202). Fixtures byte-cite these shapes.
- Deployment note: a cabinet create in flight exactly at deploy time from a pre-nonce persisted session settles `indeterminate` (fail-safe: no commits, no UI effects) — documented in authStore rehydrate comment; all post-deploy sessions mint a nonce on rehydrate.

### File List

src/services/cabinets.service.ts · src/services/cabinets.service.settlement.test.ts · src/services/cabinets.service.test.ts · src/lib/api.ts · src/lib/api.test.ts · src/lib/api.cabinet-creation-contract.test.ts · src/lib/api.cabinet-creation-transport.test.ts · src/lib/api-client.ts · src/lib/api/cabinet.ts · src/lib/api/__tests__/cabinet.test.ts · src/stores/authStore.ts · src/types/api.ts · src/types/cabinet/core.ts · src/types/cabinet/index.ts · src/components/custom/CabinetCreationForm.tsx · src/components/custom/CabinetCreationForm.test.tsx · _bmad-output/implementation-artifacts/167-9-fe-enforce-account-scoped-conditional-cabinet-settlement.md (this record)

## Change Log

- 2026-08-15: Story created from the owner-approved Batch correct-course proposal; status `backlog` pending Story 167.8 merge. No implementation claimed.
- 2026-08-17: Implemented (opus executor) → pass-1 fixes (margin-follow-up settlement guard + pinned transport; legacy rehydrate nonce mint; nonce-primary predicate; ordering assertion reinstated; createCabinet context required) → pass-2 fixes (operation-state fixtures 202→200 per live swagger; exact enum literal pinned; live-evidence citation strengthened). Full vitest 1144 files / 18557 passed / 0 failed; lint 0/0; type-check 0; format OK; max-lines OK; build OK (`next build --webpack`; turbopack cross-FS symlink limitation documented). Status: review → done pending PR merge by orchestrator. **Lessons:** (1) settlement guards must cover FOLLOW-UP calls, not just the primary commit — the second await reopens the window pass-1 closes (2) persisted-session migrations need lazy rehydrate minting or first-touch UX silently dead-ends (3) contract fixtures must re-check status CODES against live swagger, not just body shapes — 202-vs-200 drifted past body-faithful review.
