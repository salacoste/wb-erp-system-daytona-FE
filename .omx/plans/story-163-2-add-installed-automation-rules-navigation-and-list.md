# OMX Story Plan 163.2: Add Installed Automation Rules Navigation and List

## Requirements Summary

As an operator,
I want to open and inspect the automation rules installed for my cabinet,
So that I can distinguish active rules from available templates and manage my automation workflow.

- **Story ID:** 163.2
- **Epic:** 163-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Initial status:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `src/app/(dashboard)/automation/canned-rules/page.tsx`
- `src/components/custom/automation/CannedRulesGallery.tsx`
- `src/lib/api/automation.ts`
- `src/hooks/useAutomation.ts`
- `src/types/automation.ts`
- `src/components/custom/sidebar-navigation.ts`

## Acceptance Criteria (canonical)

**Given** the sidebar currently opens the canned-rules gallery
**When** the automation section is updated
**Then** the operator can navigate clearly between "Шаблоны" and "Установленные правила"
**And** both destinations expose an unambiguous active navigation state.

**Given** the operator opens the installed-rules destination
**When** the rules request is loading, succeeds, returns no items, or fails
**Then** the page renders distinct loading, populated, empty, and error states
**And** a list failure does not blank or corrupt the templates gallery.

**Given** installed rules are returned by the backend
**When** the list renders
**Then** each item identifies the rule name, enabled or disabled state, trigger, action, and available safety classification
**And** unknown backend fields or enum values are normalized defensively rather than trusted directly.

**Given** no rules are installed
**When** the empty state renders
**Then** it explains that the cabinet has no installed automation rules
**And** provides a keyboard-accessible action leading to the templates gallery.

**Given** a canned rule is installed successfully
**When** the backend returns the created rule ID
**Then** the installed-rules query is invalidated
**And** the UI provides a direct action to open the installed-rules list with the new rule identifiable.

**Given** a price-writeback rule appears in the list
**When** its safety state is displayed
**Then** the UI explains that writeback requires the separate cabinet safety gate
**And** it never implies that installing a disabled or unarmed rule immediately changes prices.

**Given** the list and navigation are tested
**When** targeted component, API-boundary, hook, and localhost browser tests run
**Then** they cover navigation, loading, populated, empty, error, post-install, and safety states
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Implementation Steps

1. Verify the canonical dependency/status metadata above and record the exact clean `origin/main` base SHA.
2. Confirm the delivered canned-rule and installed-rule list contracts and existing query-key patterns.
3. Add installed-rule navigation and list states without disrupting canned-rule installation.
4. Cover loading, empty, error, enabled/disabled, refresh, and route navigation states.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Installed rules and canned templates are distinct resources and must not share ambiguous cache entries.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/components/custom/automation src/lib/api/automation`
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
