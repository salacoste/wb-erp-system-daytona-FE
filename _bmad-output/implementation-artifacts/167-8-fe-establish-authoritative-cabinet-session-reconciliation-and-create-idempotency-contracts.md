# Story 167.8: Establish Authoritative Cabinet Session Reconciliation and Create-Idempotency Contracts

Status: ready-for-dev

## Story

As a seller creating a cabinet,
I want repeated or uncertain submissions to reconcile to one durable account-bound operation,
so that transport ambiguity cannot create duplicate cabinets or disclose another account's state.

## Acceptance Criteria

1. Given an authenticated account starts or repeats cabinet creation with an operation/idempotency key, when requests are retried, delayed, concurrent, or reconciled, then authentication/account binding comes only from the JWT and same account + same key + same payload resolves to one canonical operation/cabinet.
2. The same account/key with a different payload rejects deterministically; unknown, in-progress, succeeded, and failed states are explicit and documented.
3. Another account cannot discover or settle the operation, and repeated/late transport outcomes cannot create another cabinet.
4. The executor freezes the final endpoint, request/response/error/status schema in failing tests and OpenAPI before production code; this planning artifact does not guess it.
5. Database constraints/migration, transaction behavior, auditability, API documentation, endpoint-drift evidence, and direct unit/integration/e2e tests pass.
6. No frontend, unrelated backend domain, deployment, production, direct-main, or force-push change occurs.
7. A frontend coordination artifact cannot advance this Story to `review` or `done` without the exact backend merge SHA, ancestry on current backend `main`, and backend local/remote branch plus worktree cleanup evidence.

## Tasks / Subtasks

- [ ] Re-run and clear the backend collision gate before creating the Story worktree.
  - [ ] Record historical evidence: PR #212 merged; backend local/origin `main` = `75a080c6b857f8e7998e2ac0736b2b4d9ae3bfa4`; former SPP path/branch absent; only primary worktree remains; `prisma/schema.prisma`, `docs/API-PATHS-REFERENCE.md`, `src/cabinets`, and `src/auth` clean. Do not treat it as a substitute for the immediate pre-creation recheck.
  - [ ] Inventory every registered/present backend worktree immediately before creation and inspect any returned overlapping lane read-only.
  - [ ] Hard-stop on true concurrent path/hunk overlap in `prisma/schema.prisma`, `docs/API-PATHS-REFERENCE.md`, or another required file; never clean or overwrite another lane.
  - [ ] A documented non-overlapping hunk reservation may pass the gate only after recheck; record both owners, exact files/hunks, integration order, conflict owner, and latest diff evidence, and invalidate it on scope expansion.
- [ ] Create the exact backend branch/worktree from updated backend `main`; record base and prerequisite evidence.
- [ ] Inventory cabinet/auth controllers, services, DTOs, module wiring, Prisma schema/migrations, API docs, and direct tests.
- [ ] Write and retain behavioral RED tests/OpenAPI assertions for identity, states, retries, conflicts, concurrency, cross-account access, transaction failure, and late outcomes.
- [ ] Implement the smallest durable operation model, constraints, migration, service/controller contract, and audit behavior that makes RED GREEN.
  - [ ] Select a Prisma migration timestamp greater than both the then-current migration maximum and `20260815140000`; do not reuse or backdate a timestamp.
- [ ] Update authoritative OpenAPI and API-path documentation.
- [ ] Run targeted tests, all backend local gates, exact scope audit, two independent review passes, and reruns after accepted findings.
- [ ] Commit, push, open/merge the PR, then delete local/remote branch and remove/prune the worktree with absence evidence.

## Dev Notes

### Exact execution lane

- Repository: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new`
- Branch: `cdx/epic-167-story-8-cabinet-reconciliation-contract`
- Worktree: `/private/tmp/wb-be-167-8-cabinet-reconciliation-contract`
- Executable plan: `frontend/.omx/plans/167.8-establish-authoritative-cabinet-session-reconciliation-and-create-idempotency-contracts.md`

### Current contract truth

- `src/auth/auth.controller.ts` exposes register/login/logout; it has no real refresh endpoint.
- `POST /v1/cabinets` currently creates a cabinet, appends the cabinet ID to the user, and signs a new token.
- `CreateCabinetDto` currently contains only `name`.
- No durable idempotency key/operation/status resource exists.
- JWT identity must remain the only account-binding source. Do not accept a caller-supplied user ID as authority.

### Allowed and forbidden scope

Allowed: cabinet/auth/domain files required by the frozen contract; DTO/module wiring; Prisma schema/migration; direct tests; OpenAPI/API path/docs/endpoint-drift evidence. Forbidden: frontend; unrelated pricing/reporting/queue domains; production/deploy; unrelated dependencies; direct/force push to `main`.

### Test requirements

Run targeted RED/GREEN unit, integration, and e2e tests first, then `npm run format:check`, `npm run lint:check`, `npm run type-check`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run check:endpoint-drift`, `npm run docs:validate`, and `git diff --check`. Preserve exact output; unavailable checks are gaps.

### Architecture and security guardrails

- Durable operation identity and uniqueness must be account-scoped and transaction-safe.
- Same key/different payload cannot silently reuse an earlier operation.
- Status lookup must not reveal whether another account's key exists.
- Error/status semantics must permit safe frontend reconciliation without inventing success.
- Do not over-specify or implement an endpoint before RED/OpenAPI freeze and review.

## Project Structure Notes

This Story is the sole approved backend exception in the frontend migration program and has no route-ledger row. Keep all canonical frontend planning artifacts in the frontend repository; implement only the backend contract in the backend worktree.

## References

- `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md` — canonical Story and DAG.
- `.omx/plans/shadcn-full-ui-migration-master.md` — program lifecycle and cross-repository exception.
- `.omx/plans/167.8-establish-authoritative-cabinet-session-reconciliation-and-create-idempotency-contracts.md` — executable plan.
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-15-story-167-5-cabinet-settlement.md` — approved correction.

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

- 2026-08-15: Story created from the owner-approved Batch correct-course proposal; status `ready-for-dev`. No implementation claimed.
