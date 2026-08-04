# OMX Story Plan 163.5: Display the Units-Based Naive Baseline in SKU Accuracy History

## Requirements Summary

As an operator evaluating forecast quality,
I want to see the naive baseline's predicted units beside the AI forecast and actual result,
So that I can compare forecast approaches without confusing unit values with percentage error metrics.

- **Story ID:** 163.5
- **Epic:** 163-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyDetail.tsx`
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyTable.tsx`
- `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/sku-accuracy-helpers.ts`
- `src/types/ai/evaluations.ts`

## Acceptance Criteria (canonical)

**Given** SKU accuracy history already contains normalized `naiveBaseline` values
**When** the history table renders
**Then** it includes a column labeled unambiguously as a baseline forecast in units, such as "Базовый прогноз (ед.)"
**And** the label is visually and semantically distinct from "Naive MAPE".

**Given** a history row has a finite `naiveBaseline` value
**When** the baseline column renders
**Then** the value is formatted as a unit count using the existing number formatter
**And** zero is displayed as `0`, not as missing data.

**Given** `naiveBaseline` is `null` or unavailable
**When** the history row renders
**Then** the baseline cell displays `—`
**And** it is not coerced into zero.

**Given** AI prediction, naive baseline, actual units, AI MAPE, and Naive MAPE appear together
**When** the operator reads the table
**Then** unit-based columns identify `(ед.)` and percentage-based columns retain MAPE labeling
**And** the values remain understandable without relying on color.

**Given** the history table is viewed on a narrow viewport
**When** all comparison columns are present
**Then** intentional horizontal scrolling or an equivalent responsive presentation remains usable
**And** the new column does not make existing data or controls inaccessible.

**Given** the display change is tested
**When** targeted component and localhost browser tests run
**Then** they verify positive, zero, null, ordering, labeling, and responsive behavior
**And** existing normalizer tests continue proving that `naiveBaseline` is preserved without calculation changes.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Lock the existing `naiveBaseline` normalizer and zero/null behavior.
3. Add a units-labeled baseline column distinct from Naive MAPE and preserve responsive access.
4. Cover positive, zero, null, order, labels, and narrow viewport behavior.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** The baseline is units, not currency or percentage; labels and formatting must preserve that scale.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/app/\(dashboard\)/analytics/models/\[id\]/evaluations/sku-accuracy`
- `npx playwright test e2e/forecast-accuracy.spec.ts`
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
