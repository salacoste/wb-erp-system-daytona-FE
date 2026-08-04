# OMX Story Plan 165.3: Regenerate OpenWiki from Corrected Sources

## Requirements Summary

As a project maintainer,
I want OpenWiki regenerated after source documentation is corrected,
So that recurring project documentation reflects the same current architecture and workflow state.

- **Story ID:** 165.3
- **Epic:** 165-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 165.1, 165.2
- **Initial status:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `.github/workflows/openwiki-update.yml`
- `openwiki/`
- `README.md`
- `CLAUDE.md`

## Acceptance Criteria (canonical)

**Given** Stories 165.1 and 165.2 source-document corrections are complete
**When** OpenWiki refresh begins
**Then** the configured generator workflow is used from a clean isolated worktree
**And** generated `openwiki/**` pages are not hand-edited.

**Given** the generator requires a provider credential or external service
**When** that prerequisite is unavailable
**Then** the run stops with a documented credential/runtime blocker
**And** no fabricated generated output or manual substitute is committed.

**Given** OpenWiki may propose changes outside generated pages
**When** the generated diff is reviewed
**Then** BMad/OMX control files and the workflow definition are preserved according to repository policy
**And** only intended generated documentation and approved source-document updates remain.

**Given** regenerated pages are available
**When** their content is validated
**Then** quickstart, architecture, workflows, integrations, testing, and source-map links resolve
**And** current Next.js, localhost port, Epic status, and validation guidance no longer contradict source documents.

**Given** the refresh is complete
**When** documentation checks and a final generated-diff review run
**Then** links, frontmatter, citations, and generated-file boundaries pass
**And** the refresh evidence records the generator version and command used.

## Implementation Steps

1. Verify the canonical dependency/status metadata above and record the exact clean `origin/main` base SHA.
2. Verify 165.1 and 165.2 source corrections are merged before starting generation.
3. Run the configured OpenWiki generator in a clean isolated worktree with its required credential; never hand-edit generated pages.
4. Review generated-only boundaries, links, framework/port/status truth, and record generator version/command.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** If provider credentials or the generator runtime are unavailable, stop with a documented blocker and preserve the worktree.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `git diff --check`
- `npm run check:docs`
- `rg -n "Next\.js 14|localhost:3001|PM2|Tier-0|cert:coverage:ci|test:tier0" openwiki`
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
