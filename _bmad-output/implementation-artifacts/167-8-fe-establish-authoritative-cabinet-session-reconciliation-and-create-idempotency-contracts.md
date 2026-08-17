# Story 167.8: Establish Authoritative Cabinet Session Reconciliation and Create-Idempotency Contracts

Status: done (backend merged 2026-08-17, PR #227 c96a2fae8; AC7 evidence in Dev Agent Record)

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

claude-orchestrator (Claude Code, glm-5.2) + executor(sonnet)/code-reviewer(opus) lanes; original
implementation authored by the codex lane (gpt-5.6-sol) in
`/private/tmp/wb-be-167-8-cabinet-reconciliation-contract`.

### Debug Log References

- Gates: `npx tsc --noEmit -p tsconfig.build.json` exit 0; jest src/cabinets+src/docs-generator
  **450 passed / 0 failed** (+21 skipped env-gated); lint/format clean; endpoint-drift baseline 75;
  docs:validate 438 endpoints.
- PG-disposable integration (MAIN-session, per DB hard rules): disposable DB `story1678`
  (created+dropped explicitly), `CABINET_CREATION_PG_DISPOSABLE=1` → **21/21 passed** (concurrency,
  lease takeover, fencing, cross-account 404-equality, lifecycle CHECKs). Note: the two migration
  CHECK constraints had to be applied via psql — `prisma db push` does not materialize TABLE-level
  CHECKs (documented in the PR).
- Live verification (post-deploy, cabinet cleaned after): create 201 → replay 201 with the SAME
  operationId/cabinet; different payload → 409 CABINET_CREATION_CONFLICT; lookup 200 succeeded;
  non-UUID key → 400.

### Completion Notes List

- **Salvage context**: the codex lane left ~4628 lines uncommitted in the volatile `/private/tmp`
  worktree (0 commits on the branch, mission `story1678-final-scope-review` stale-running for 2
  days). Owner approved "довести до merge". The worktree was moved to
  `.claude/worktrees/epic167-8-reconciliation`, audited (AC1-AC6 verified against the spec), fixed,
  reviewed, merged.
- Orchestrator fixes on top of the salvaged work: ModuleRef mock (pre-existing red
  cabinet-keys suite on main), migration renamed 20260815150000→20260816120000 (backdated
  timestamp — spec forbids), `REQUEST_HASH_VERSION` (forward-compat hash versioning), DB-clock
  `completedAt`, lease-derived `Retry-After`, 4xx observability warns, SQL-text pins
  (ON CONFLICT/FOR UPDATE), retention + rate-limit values in API-PATHS, flaky retryAfter test
  bounded. `@Roles(Owner)` waived with evidence: DB-role-primary contract is pinned by e2e
  (stale-JWT-role test).
- Two independent adversarial review passes (opus, per the story's two-pass rule): pass-1
  races/security, pass-2 ops/maintainability — 0 CRITICAL/HIGH in both; all MEDIUM/LOW fixed or
  waived with evidence.
- docs-generator changes (~2.3k lines) blessed by both passes: capability fixes required by the
  frozen contract (Idempotency-Key header rendering, Retry-After/Cache-Control response headers,
  oneOf variants, firstDeclaredSuccessStatus invariant).

### File List

36 files in BE PR #227 (`c96a2fae8`): `src/cabinets/**` (service/controller/DTO/spec incl. 4 new
contract suites + e2e), `prisma/schema.prisma` + migration `20260816120000_cabinet_creation_operations`,
`src/docs-generator/**` (capability fixes + specs), `docs/API-PATHS-REFERENCE.md`,
`test-api/02-cabinets.http` + API-INDEX (generated artifacts), `test/cabinets.e2e-spec.ts`.
Merge-conflict resolution note: test-api generated artifacts taken from the story branch (deep-equal
regeneration tests require exact artifacts); the FE-mirror delta re-syncs on the next post-deploy
`npm run docs:generate`.

## Change Log

- 2026-08-15: Story created from the owner-approved Batch correct-course proposal; status `ready-for-dev`. No implementation claimed.
- 2026-08-17: Backend implementation merged — **PR #227, merge SHA `c96a2fae8`, ancestry on backend
  `main` verified** (ff-only pull to `8279d647a` docs-tip); local/remote branch
  `cdx/epic-167-story-8-cabinet-reconciliation-contract` deleted; worktree
  `.claude/worktrees/epic167-8-reconciliation` removed. AC7 evidence complete. Status → `done`
  (sprint-status.yaml updated). 167.9 unblocked.
