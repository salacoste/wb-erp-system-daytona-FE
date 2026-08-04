# OMX Story Plan 163.3: Add the Installed Automation Rule Editor

## Requirements Summary

As an operator,
I want to open and safely update an installed automation rule,
So that its thresholds, scope, cooldown, enabled state, and actions match my cabinet's operating policy.

- **Story ID:** 163.3
- **Epic:** 163-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 163.2
- **Initial status:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `src/app/(dashboard)/automation/rules/[id]/`
- `src/lib/api/automation.ts`
- `src/hooks/useAutomation.ts`
- `src/types/automation.ts`
- `src/components/custom/automation/`

## Acceptance Criteria (canonical)

**Given** an installed rule ID is opened from the rules list or post-install action
**When** the editor route loads
**Then** it requests `GET /v1/automation/rules/:id`
**And** renders independent loading, not-found, authorization, malformed-response, and retryable error states.

**Given** a valid installed rule is returned
**When** the editor renders
**Then** supported fields are populated from normalized backend data
**And** unknown or unsupported parameters remain safe and are not silently overwritten.

**Given** the operator changes editable values
**When** client validation runs
**Then** required names, numeric thresholds, cooldowns, and action-specific values are validated with clear Russian messages
**And** invalid or ambiguous values cannot be submitted.

**Given** the rule uses `WRITEBACK_PRICE`
**When** its editor is displayed or enabled
**Then** the UI explains the separate `PRICE_WRITEBACK_ENABLED` safety gate and the effect of enabling the rule
**And** saving requires an explicit acknowledgement when the change could activate price writeback.

**Given** the operator submits valid changes
**When** `PATCH /v1/automation/rules/:id` succeeds
**Then** only supported editable fields are sent
**And** the detail and installed-rules caches are refreshed with visible success feedback.

**Given** the update request fails
**When** the backend returns validation, authorization, conflict, or service errors
**Then** the editor preserves unsaved input and shows an actionable error
**And** it does not claim that the rule was updated.

**Given** the operator attempts to leave with unsaved changes
**When** navigation or dismissal occurs
**Then** the UI warns about losing those changes
**And** allows the operator to remain in the editor.

**Given** the editor is operated by keyboard or assistive technology
**When** focus moves through fields, safety acknowledgement, save, cancel, and retry controls
**Then** every control has an accessible name, visible focus, and logical order
**And** status feedback is announced without moving focus unexpectedly.

**Given** editor coverage runs
**When** targeted API, normalizer, hook, component, and localhost E2E tests execute
**Then** they cover load, edit, validation, safe writeback, success, failure, and unsaved-change behavior
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Implementation Steps

1. Verify the canonical dependency/status metadata above and record the exact clean `origin/main` base SHA.
2. Lock GET/PATCH rule contracts, query keys, and invalidation behavior with API/hook tests.
3. Implement editor loading, error, validation, enabled/safety messaging, save, and dirty-state behavior.
4. Cover success/failure feedback, cache refresh, keyboard access, and graceful page isolation.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Price-writeback safety must be explicit and ambiguous or stale saves must be rejected.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/components/custom/automation src/lib/api/automation src/hooks`
- `npm run type-check`
- `npm run lint`
- `npm run build`
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
