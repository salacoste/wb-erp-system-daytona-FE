# OMX Story Plan 163.4: Distinguish Monetary Zero from Missing Unit-Economics Data

## Requirements Summary

As an operator,
I want genuine zero monetary values displayed differently from unavailable data,
So that I can interpret unit-economics tables and summaries without mistaking no activity for missing information.

- **Story ID:** 163.4
- **Epic:** 163-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Initial status:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `src/lib/unit-economics-formatters.ts`
- `src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsMetricCard.tsx`
- `src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsSummaryCards.tsx`
- `src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsTableRow.tsx`
- `src/app/(dashboard)/analytics/unit-economics/components/unit-economics-table-utils.tsx`
- `src/lib/unit-economics-config.ts`

## Acceptance Criteria (canonical)

**Given** a unit-economics monetary field contains the numeric value `0`
**When** it is rendered in a table, summary card, tooltip, or supporting label
**Then** it displays as `0 ₽` using the page's established whole-ruble formatting
**And** it is not replaced by `—`.

**Given** a monetary value is `null`, `undefined`, or non-finite
**When** the formatter or component renders it
**Then** it displays as `—`
**And** it is not coerced into a fabricated zero.

**Given** positive or negative finite monetary values are rendered
**When** the shared unit-economics formatter is used
**Then** Russian locale grouping, sign, rounding, and ruble notation remain unchanged
**And** existing percentage formatting is unaffected.

**Given** unit-economics rows and summary cards consume revenue, price, delivery-cost, and related monetary fields
**When** the affected call sites are remediated
**Then** they consistently use the approved `0 ₽` versus `—` semantics
**And** redundant component-level guards do not contradict the shared formatter.

**Given** backend data crosses the unit-economics boundary
**When** zero and missing monetary values are normalized
**Then** numeric zero is preserved as zero and missing data remains nullable
**And** no `|| 0`, unconditional `?? 0`, or equivalent fallback erases that distinction.

**Given** the semantic change is tested
**When** formatter, table-row, summary-card, tooltip, and localhost browser coverage runs
**Then** it explicitly verifies zero, null, undefined, non-finite, positive, and negative cases
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Implementation Steps

1. Verify the canonical dependency/status metadata above and record the exact clean `origin/main` base SHA.
2. Add regression fixtures for positive, zero, null, undefined, and unavailable currency values.
3. Centralize the approved currency display semantics through existing formatters/utilities and apply them to affected cards/rows.
4. Verify visual, accessible, CSV/export, and sorting behavior remains semantically correct.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Falsy checks can collapse zero into missing; normalize the distinction before formatting.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/app/\(dashboard\)/analytics/unit-economics src/lib/unit-economics`
- `npx playwright test e2e/unit-economics.spec.ts`
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
