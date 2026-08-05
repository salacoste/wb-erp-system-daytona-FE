# OMX Story Plan 162.4: Replace Vacuous Operations and Settings E2E Assertions

## Requirements Summary

As a frontend developer,
I want operations and settings browser tests to verify concrete workflow states,
So that broken backfill, supply, COGS, and pricing behavior cannot appear green.

- **Story ID:** 162.4
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.2
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `e2e/settings/backfill-admin.spec.ts`
- `e2e/settings/backfill-a11y.spec.ts`
- `e2e/backfill-page.spec.ts`
- `e2e/supply-planning.spec.ts`
- `e2e/supplies/`
- `e2e/fixtures/story-162-4-supplies.ts`
- `e2e/cogs-assignment.spec.ts`
- `e2e/cogs-pages.spec.ts`
- `e2e/price-calculator.spec.ts`
- `src/app/(dashboard)/settings/backfill/`
- `src/app/(dashboard)/supplies/page.tsx`
- `src/components/custom/supplies/`
- `src/hooks/useDownloadDocument.ts`
- `src/lib/api/supplies-documents.ts`
- `src/lib/api/__tests__/supplies-documents.test.ts`
- `src/test/fixtures/stickers.ts`
- `src/test/fixtures/supplies-responses.ts`
- `src/types/supply-orders.ts`
- `src/types/__tests__/supplies-stickers-errors.test.ts`
- `scripts/check-e2e-vacuous-assertions.mjs`
- `src/test/e2e-vacuous-assertions.test.ts`
- `scripts/manage-omx-story-plans.mjs`
- `.omx/plans/story-162-4-replace-vacuous-operations-and-settings-e2e-assertions.md`
- `_bmad-output/implementation-artifacts/162-4-fe-replace-vacuous-operations-and-settings-e2e-assertions.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Acceptance Criteria (canonical)

**Given** the operations/settings E2E scope contains 36 tautological assertion sites
**When** the affected specs are remediated
**Then** all unconditional truth fallbacks are removed
**And** the owned-scope count becomes zero.

**Given** backfill administration has loading, empty, running, paused, failed, and permission-gated states
**When** its tests run
**Then** each test asserts its intended state explicitly
**And** a missing required control or status causes failure.

**Given** supplies and supply-planning flows depend on backend records
**When** deterministic seed data exists
**Then** lifecycle, detail, list, and accessibility tests assert the expected records and actions
**And** missing required seed data fails preflight rather than passing an empty assertion.

**Given** COGS assignment or price-calculator behavior is under test
**When** the UI submits or calculates data
**Then** the test verifies the visible result and relevant request/response outcome
**And** does not accept element absence as success.

**Given** a scenario is legitimately unavailable for the configured local fixture
**When** it cannot execute
**Then** it uses a conditional skip with a concrete reason
**And** remains visible in the Playwright report.

**Given** the remediation is complete
**When** targeted backfill, supplies, supply-planning, COGS, and price-calculator specs run
**Then** they pass against prepared localhost fixtures
**And** the global prohibited-assertion static check remains at zero findings.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Lock the canonical raw 36-site inventory and exact 38-site semantic inventory at base SHA `9a882a1de72e8716a1969002a648e027f4a05c0f`, while preserving the exact 57-site Story 162.3 regression.
3. Replace each operations/settings truth fallback with explicit fixture, visible-state, and request/response assertions; apply only the minimal application/API/type boundary repairs required for deterministic, contract-accurate evidence.
4. Run backfill, supplies, supply-planning, COGS, and calculator coverage and record semantic `38 → 0` evidence.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Mutating paths remain behind the sandbox acknowledgement guard and require deterministic fixtures; production-path edits stay limited to focus semantics, deterministic interaction state, and the existing backend sticker generation/download contract with focused unit and lifecycle coverage.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "expect\([^\n]*(\|\| true|>= 0)" e2e/settings e2e/backfill-page.spec.ts e2e/supply-planning.spec.ts e2e/supplies e2e/cogs-assignment.spec.ts e2e/cogs-pages.spec.ts e2e/price-calculator.spec.ts`
- `npm run check:e2e-assertions`
- `npx vitest run src/test/e2e-vacuous-assertions.test.ts`
- `npm run test:e2e:full -- e2e/settings/backfill-admin.spec.ts e2e/settings/backfill-a11y.spec.ts e2e/backfill-page.spec.ts e2e/supply-planning.spec.ts e2e/supplies/supplies-a11y.spec.ts e2e/supplies/supplies-list.spec.ts e2e/supplies/supply-detail.spec.ts e2e/supplies/supply-lifecycle.spec.ts e2e/cogs-assignment.spec.ts e2e/cogs-pages.spec.ts e2e/price-calculator.spec.ts`
- `npx eslint scripts/check-e2e-vacuous-assertions.mjs src/test/e2e-vacuous-assertions.test.ts e2e/settings/backfill-admin.spec.ts e2e/settings/backfill-a11y.spec.ts e2e/backfill-page.spec.ts e2e/supply-planning.spec.ts e2e/supplies/*.spec.ts e2e/cogs-assignment.spec.ts e2e/cogs-pages.spec.ts e2e/price-calculator.spec.ts --max-warnings=0`
- `npx prettier --check scripts/check-e2e-vacuous-assertions.mjs src/test/e2e-vacuous-assertions.test.ts scripts/manage-omx-story-plans.mjs .omx/plans/story-162-4-replace-vacuous-operations-and-settings-e2e-assertions.md`
- `npm run format:check`
- `git diff --check`
- Browser-facing acceptance criteria require a fresh localhost result; if credentials/services are unavailable, record the gap and do not claim those criteria passed.

## Completion Evidence

- Dependency gate and base SHA.
- Changed-file list limited to this story's scope.
- Targeted test output plus required typecheck/lint/format/build evidence.
- Independent `code-reviewer` findings and `verifier` verdict.
- Commit SHA, PR URL, merge SHA, and proof that the feature SHA is an ancestor of `origin/main`.
- Proof that the story worktree path is absent, the merged local branch is deleted, remote branch cleanup is reconciled, and `git worktree prune` completed.

## Stop Condition

Stop only when every canonical acceptance criterion is evidenced, the PR is merged, and cleanup is verified; otherwise preserve the worktree and report the precise blocker.
