# OMX Story Plan 164.2: Replace the Recharts Tooltip `as any` Boundary

## Requirements Summary

As a frontend developer,
I want the FBS regional tooltip connected through a typed Recharts adapter,
So that third-party chart payload changes are caught without weakening application type safety.

- **Story ID:** 164.2
- **Epic:** 164-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `src/app/(dashboard)/analytics/fbs-enhanced/components/FbsRegionalDataSection.tsx`
- `src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsRegionalDataSection.test.tsx`
- `package.json`

## Acceptance Criteria (canonical)

**Given** the installed Recharts version defines the tooltip content contract
**When** the regional tooltip boundary is refactored
**Then** the implementation uses verified exported Recharts types or a narrow local adapter derived from them
**And** the production `RegionalTooltip as any` cast and its lint suppression are removed.

**Given** Recharts supplies an inactive, empty, malformed, or populated tooltip payload
**When** the adapter normalizes it
**Then** the custom tooltip receives only the label, name, color, and value fields it supports
**And** unsupported payload members do not leak into the application component.

**Given** the chart maps a missing percentage to a numeric plotting fallback
**When** the tooltip displays that point
**Then** it continues to use the preserved raw value and renders missing data as `—`
**And** a genuine zero remains distinguishable from missing data.

**Given** the regional chart renders populated data
**When** a tooltip is opened
**Then** existing Russian percentage formatting, series naming, color, and label behavior remain unchanged
**And** the chart's independent empty state is preserved.

**Given** the typed boundary is tested
**When** adapter, tooltip, and chart smoke tests run
**Then** they cover inactive, empty, null, zero, and populated payloads without `any`
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Confirm the installed Recharts tooltip content types and capture current tooltip behavior with tests.
3. Introduce the narrowest typed adapter/normalizer and remove the production `as any` cast.
4. Cover inactive, empty, malformed, null, zero, and populated payloads.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Third-party payload types are broader than the app model; normalize at the boundary without leaking library internals.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/app/\(dashboard\)/analytics/fbs-enhanced/components/__tests__/FbsRegionalDataSection.test.tsx`
- `npm run type-check`
- `npm run lint`
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
