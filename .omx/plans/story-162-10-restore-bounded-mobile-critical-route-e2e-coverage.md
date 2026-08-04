# OMX Story Plan 162.10: Restore Bounded Mobile Critical-Route E2E Coverage

## Requirements Summary

As a frontend developer,
I want a supported mobile Playwright smoke project,
So that critical user journeys remain usable on the product's secondary mobile target.

- **Story ID:** 162.10
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.2, 162.9
- **Initial status:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `playwright.config.ts`
- `e2e/mobile/`
- `e2e/auth.setup.ts`
- `src/app/(dashboard)/layout/MobileSidebarSheet.tsx`
- `src/components/custom/Sidebar.tsx`
- `src/components/custom/sidebar-navigation.ts`
- `e2e/README.md`

## Acceptance Criteria (canonical)

**Given** the Playwright configuration currently lacks an active mobile project
**When** mobile smoke coverage is restored
**Then** it uses one documented device profile, such as iPhone 14
**And** it runs through the same reproducible localhost preflight as the desktop projects.

**Given** the full desktop suite is already the primary coverage surface
**When** the mobile project is defined
**Then** it contains a bounded critical-route subset rather than duplicating the full desktop suite
**And** its scope includes login or onboarding, dashboard navigation, one analytics table, and settings or dialog behavior.

**Given** the application uses a collapsible sidebar and responsive navigation
**When** the mobile smoke route navigates between critical pages
**Then** it verifies the collapsed navigation can be opened, used, and dismissed with visible state assertions
**And** no required destination is reachable only through a desktop-only control.

**Given** analytics tables may exceed the mobile viewport width
**When** the selected analytics table renders on the configured device
**Then** the test verifies intentional horizontal scrolling or an equivalent responsive presentation
**And** required data and controls are not trapped in inaccessible overflow.

**Given** a critical dialog or interactive control is exercised on mobile
**When** the user opens, operates, and closes it
**Then** focus, viewport placement, and dismissal behavior remain usable
**And** critical touch controls provide an effective target of at least 44 by 44 CSS pixels.

**Given** desktop and mobile layouts legitimately differ
**When** the mobile tests assert behavior
**Then** they use mobile-specific locators and expectations for the supported layout
**And** they are not disabled solely because desktop selectors or geometry differ.

**Given** the mobile smoke project runs against prepared localhost fixtures
**When** the critical-route suite completes
**Then** it has zero unexplained skips
**And** the report records the device profile, viewport, localhost endpoints, and fresh pass evidence.

## Implementation Steps

1. Verify the canonical dependency/status metadata above and record the exact clean `origin/main` base SHA.
2. Define one supported device project and a bounded mobile critical-route test match.
3. Implement mobile-specific navigation, table overflow, dialog/focus, and 44×44 target assertions.
4. Run the mobile project through the same preflight and record device, viewport, endpoints, and skips.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Do not duplicate the desktop suite or reuse desktop-only selectors as mobile expectations.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npx playwright test --project=mobile --list`
- `npx playwright test --project=mobile`
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
