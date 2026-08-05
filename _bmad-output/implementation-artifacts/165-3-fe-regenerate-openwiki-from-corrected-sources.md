# Story 165.3: Regenerate OpenWiki from Corrected Sources

Status: in-progress

<!-- Note: This artifact is intentionally ignored by the repository-wide _bmad-output rule. Force-add this exact file when committing the story. -->

## Story

As a project maintainer,
I want OpenWiki regenerated after source documentation is corrected,
so that recurring project documentation reflects the same current architecture and workflow state.

## Acceptance Criteria

1. **Clean, dependency-complete generation (AC1)**
   - **Given** Stories 165.1 and 165.2 source-document corrections are complete
   - **When** OpenWiki refresh begins
   - **Then** the configured generator workflow is used from a clean isolated worktree
   - **And** generated `openwiki/**` pages are not hand-edited.

2. **Honest credential/runtime blocker (AC2)**
   - **Given** the generator requires a provider credential or external service
   - **When** that prerequisite is unavailable
   - **Then** the run stops with a documented credential/runtime blocker
   - **And** no fabricated generated output or manual substitute is committed.

3. **Protected control and source boundaries (AC3)**
   - **Given** OpenWiki may propose changes outside generated pages
   - **When** the generated diff is reviewed
   - **Then** BMad/OMX control files and the workflow definition are preserved according to repository policy
   - **And** only intended generated documentation and approved source-document updates remain.

4. **Generated documentation agrees with source (AC4)**
   - **Given** regenerated pages are available
   - **When** their content is validated
   - **Then** quickstart, architecture, workflows, integrations, testing, and source-map links resolve
   - **And** current Next.js, localhost port, Epic status, and validation guidance no longer contradict source documents.

5. **Validated, reproducible refresh evidence (AC5)**
   - **Given** the refresh is complete
   - **When** documentation checks and a final generated-diff review run
   - **Then** links, frontmatter, citations, and generated-file boundaries pass
   - **And** the refresh evidence records the generator version and command used.

## Tasks / Subtasks

- [ ] Task 1: Prove the dependency and isolation gate before generation (AC: #1, #2)
  - [ ] Confirm the clean Story 165.3 feature worktree is based on `a3425d96` (`origin/main` after PR #90).
  - [ ] Record that Story 165.1 closeout is merged through PR #89 and Story 165.2 is merged through PR #90.
  - [ ] Confirm the active ref is a Story 165.3 feature branch, not `main`, and capture `git status --short` before generation.
  - [ ] Use the repository-pinned Node.js `24.18.0` and npm `11.11.0` runtime.

- [ ] Task 2: Establish the permanent PR-safe generation workflow (AC: #1, #2, #3)
  - [ ] Do **not** dispatch or execute the current direct-`main` workflow path: it can commit and push `HEAD:main`, which conflicts with the repository's PR-only merge policy.
  - [ ] For scheduled runs from `main`, generate on a unique automation branch, push that branch without force, and open a normal PR targeting `main`; the workflow must never merge the PR itself.
  - [ ] For `workflow_dispatch`, reject `main` and run only from an existing non-main feature ref; commit generated changes on the checked-out ref and use a normal fast-forward push to that same remote feature branch.
  - [ ] Preserve the scheduled workflow's runner, concurrency, provider configuration, generated-boundary protections, and intended refresh behavior while replacing direct-main delivery permanently.
  - [ ] The workflow must never push to `main`, force-push, merge a PR, expose a credential, or manufacture output when generation fails.

- [ ] Task 3: Run the pinned OpenWiki generator with the configured provider (AC: #1, #2, #5)
  - [ ] Run exactly `npx --yes openwiki@0.3.0 code --update --print`; do not resolve or substitute `latest`.
  - [ ] Configure `OPENWIKI_PROVIDER=anthropic`, `ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic`, and `OPENWIKI_MODEL_ID=glm-5.2`.
  - [ ] Map `ANTHROPIC_API_KEY` from the configured z.ai repository secret (`ZAI_API_KEY`) only inside the runner environment; never print, persist, download, or commit its value.
  - [ ] After the credentialed runner fast-forward-pushes its generator-owned commit to the Story 165.3 branch, fetch that ref and fast-forward the local worktree with `--ff-only`; do not copy, download, reconstruct, or hand-edit generated output.

- [ ] Task 4: Enforce generated and protected-file boundaries (AC: #1, #3)
  - [ ] Accept generator output only under `openwiki/**` and the explicitly reviewed OpenWiki-generated region of `CLAUDE.md`.
  - [ ] Treat `README.md` or another source document as editable only when a verified source correction is required; make that source correction explicitly and rerun the generator rather than patching generated pages.
  - [ ] Reject or restore generator mutations to `**/AGENTS.md`, `.agents/**`, `.codex/**`, `.omx/**`, `_bmad/**`, `_bmad-output/**`, unrelated source files, lockfiles, and workflows.
  - [ ] Review `.github/workflows/openwiki-update.yml` separately as intentional workflow code: preserve its valid schedule/provider semantics, remove the direct-`main` delivery path, and retain only a PR-safe update flow.
  - [ ] If a generated statement is wrong, correct its authoritative source and regenerate; never manually repair `openwiki/*.md` or `openwiki/.last-update.json`.

- [ ] Task 5: Validate content, navigation, and stale-guidance removal (AC: #3, #4, #5)
  - [ ] Verify YAML frontmatter and required metadata for every generated Markdown page, plus JSON validity for `openwiki/.last-update.json`.
  - [ ] Verify `openwiki/index.md` and all links needed to reach quickstart, architecture, workflows, integrations/API guidance, testing/operations, domain concepts, and source maps.
  - [ ] Confirm generated guidance reports Next.js 16, frontend `localhost:3100`, backend `localhost:3000`, current Epic 127/162-165 state, and local-only validation semantics.
  - [ ] Confirm obsolete Next.js 14, backend `localhost:3001`, PM2, Tier-0, production-certification, mandatory-CI, and stale warning-baseline guidance is absent or explicitly historical/non-authoritative.
  - [ ] Run `npm run check:docs`, `npm run format:check`, and `git diff --check`; record exact results and any expected citation baseline rather than relying on prose claims.

- [ ] Task 6: Record provenance and complete independent delivery review (AC: #2, #3, #5)
  - [ ] Record base SHA, feature ref, generator `0.3.0`, exact command, Node/npm versions, provider/base URL/model identifiers, UTC start/end, command exit status, workflow run ID/URL, and generator-owned commit SHA.
  - [ ] Record `git diff --name-status`, generator-produced provenance from `openwiki/.last-update.json`, fast-forward proof, and evidence that no secret values appear in logs or the diff.
  - [ ] Obtain independent code-reviewer and verifier verdicts covering generated accuracy, protected boundaries, workflow safety, validation evidence, and acceptance-criteria traceability.
  - [ ] Commit and push only the reviewed feature branch, open/merge a normal PR, prove ancestry in `origin/main`, then remove the feature branch/worktree and prune metadata per repository policy.

## Dev Notes

### Implementation Readiness

- Canonical execution base: `a3425d9694ab47f07356ad89a475ee8fa69a7027` (`a3425d96`).
- Dependency evidence: PR #89 completed Story 165.1 closeout; PR #90 merged Story 165.2 local-development and validation corrections.
- Current story branch/worktree contract: one Story 165.3 feature branch, one disposable isolated worktree, one normal PR, and mandatory cleanup only after merge proof.
- Immutable plan metadata remains `initial_status: backlog`; current lifecycle state belongs in `sprint-status.yaml` and the durable orchestration manifest.

### Workflow Policy Tension and Required Resolution

The base-`a3425d96` `.github/workflows/openwiki-update.yml` is useful as configuration evidence but is not safe to run for this story as written. Its scheduled/manual job checks out the event ref, generates docs, then conditionally commits and pushes `HEAD:main`. Project policy explicitly forbids direct pushes to `main` and requires locally validated feature-branch changes to merge through a PR.

Therefore:

- Never run the existing path on `main` while implementing Story 165.3.
- Replace it with a permanent two-path workflow: scheduled `main` runs publish a unique automation branch and open a normal PR; manual runs are allowed only on non-main feature refs and fast-forward-push the generated commit to that same branch.
- Use the credentialed runner's commit as generator output. Fetch it and integrate with `git merge --ff-only`; do not copy text manually or reconstruct output after a failed run.
- Preserve legitimate schedule, runner, concurrency, provider, and protection behavior. A workflow that pushes directly to `main`, force-pushes, or auto-merges does not satisfy repository policy.

### Generator and Credential Contract

- Required generator: OpenWiki `0.3.0`.
- Exact command: `npx --yes openwiki@0.3.0 code --update --print`.
- Provider configuration:
  - `OPENWIKI_PROVIDER=anthropic`
  - `ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic`
  - `OPENWIKI_MODEL_ID=glm-5.2`
  - `ANTHROPIC_API_KEY` sourced from GitHub secret `ZAI_API_KEY`
- Secret-handling invariant: record only the secret name and whether it was available. Never echo, persist, or place the credential value in the story, logs, commits, branches, or PR.
- Do not clear broad user-owned caches or directories as part of story execution. Any temporary cache isolation must use a story-scoped location and be cleaned safely.

### Generated-File Boundaries

- Generator-owned: `openwiki/**`, including `openwiki/.last-update.json`.
- Conditionally generator-owned: the bounded OpenWiki region of `CLAUDE.md`, if and only if the pinned generator changes it.
- Human-reviewed source surfaces in correlated plan scope: `README.md`, `CLAUDE.md`, `.github/workflows/openwiki-update.yml`.
- Protected control surfaces: all BMad/OMX/Codex/agent files, especially `**/AGENTS.md`, `.omx/**`, `_bmad/**`, `_bmad-output/**`, `.agents/**`, and `.codex/**`. Generator changes to these paths must never be accepted.
- `openwiki/**` is generated-only. A content defect requires a source correction plus a fresh complete generation; it never authorizes a manual edit to generated output.

### Provenance Requirements

The PR/story evidence must make the refresh reproducible without exposing credentials:

- repository and feature-ref identity;
- base SHA `a3425d96` and generated `gitHead` value;
- OpenWiki version `0.3.0` and exact command;
- Node `24.18.0` and npm `11.11.0`;
- non-secret provider/base URL/model identifiers;
- start/end timestamps and exit code;
- workflow run URL/ID, generated commit SHA, pushed feature/automation ref, and fast-forward integration proof;
- scheduled-run automation PR URL/number when the scheduled path is exercised;
- final changed-file manifest and validation results;
- PR URL, feature commit, merge SHA, ancestry proof, and cleanup proof.

### Validation Requirements

Minimum evidence before review:

```bash
git status --short
git diff --name-status a3425d96...HEAD
npm run check:docs
npm run format:check
git diff --check
rg -n "Next\\.js 14|localhost:3001|PM2|Tier-0|cert:coverage:ci|test:tier0|max-warnings 112" openwiki
```

Also validate all generated Markdown frontmatter, `openwiki/.last-update.json`, relative Markdown links, index reachability, and any source-map links. The stale-guidance search is a failure when it finds an active contradictory instruction; a clearly labeled historical mention must be reviewed rather than silently accepted.

### Blocker Semantics

- Missing `ZAI_API_KEY`, unavailable self-hosted runner, provider/network failure, OpenWiki non-zero exit, missing generator commit, non-fast-forward branch divergence, corrupt provenance, unexpected protected-file mutation, or unresolved generated contradiction is a blocker.
- On a blocker: do not fabricate output, do not hand-edit `openwiki/**`, do not merge, and do not mark the story `review` or `done`.
- Keep the story lifecycle `in-progress`, add a dated blocker entry to the Dev Agent Record and durable orchestration manifest, preserve the isolated worktree/branch for diagnosis, and record the exact failed prerequisite without secrets.
- Resume from a fresh successful generator run after the blocker is resolved. Partial or stale output is never completion evidence.

### Project Structure Notes

- Correlated plan scope: `.github/workflows/openwiki-update.yml`, `openwiki/`, `README.md`, and `CLAUDE.md`.
- The story implementation artifact and sprint registry are lifecycle/control evidence, not generator output.
- No application source, API contract, UI, dependency manifest, or production deployment change is required by this documentation-only story.
- Browser-facing validation is not required because this story changes generated documentation and workflow behavior only; any unavailable external generation prerequisite is handled by the blocker contract above.

### Previous Story Intelligence

- Story 165.1 established truthful Epic 127 and current-program status and closed through PR #89.
- Story 165.2 made active localhost documentation authoritative, aligned ports/framework versions, and made doc citation checking deterministic over tracked sources; it merged through PR #90.
- Do not reopen or rewrite those source corrections merely to make generated output look correct. If generation reveals a real source defect, constrain the source edit, document it, and rerun the full generator.

### References

- [Source: `_bmad-output/planning-artifacts/epics-162-165-fe.md` — Epic 165-FE and Story 165.3]
- [Source: `.omx/plans/story-165-3-regenerate-openwiki-from-corrected-sources.md` — scope, gates, risks, verification, and stop condition]
- [Source: `.github/workflows/openwiki-update.yml` at base `a3425d96` — runner, provider, generator, protection, and pre-change direct-main delivery behavior]
- [Source: `AGENTS.md` — Local validation and merge policy; OpenWiki generated-only redirect]
- [Source: `README.md` — generated OpenWiki no-hand-edit rule]
- [Source: `CLAUDE.md` — OpenWiki usage and generation guidance]
- [Source: `package.json` — pinned Node.js/npm versions and local documentation commands]
- [Source: `openwiki/.last-update.json` — existing generator provenance shape]

## Dev Agent Record

### Agent Model Used

- Role: delegated OMX executor
- Model: exact model ID not recorded; no model identity is asserted beyond the delegated executor role.

### Debug Log References

- Story context created 2026-08-05 from base `a3425d96`.
- 2026-08-05: PR-safe workflow repair was committed on the Story 165.3 feature branch and dispatched without using a direct-`main` delivery path.
- 2026-08-05: GitHub Actions workflow run [30963482084](https://github.com/salacoste/wb-erp-system-daytona-FE/actions/runs/30963482084) completed successfully and fast-forward-pushed generator commit `c5b632e2` to `codex/story-165-3-openwiki`.
- 2026-08-05: Prior targeted validation at `c5b632e2` used isolated npm cache `/tmp/story-165-3-npm-cache.gKeHCr`. Toolchain probe `npx --yes -p node@24.18.0 -p npm@11.11.0 -- sh -c 'node --version; npm --version; command -v node; command -v npm'` reported Node `v24.18.0` and npm `11.11.0`.
- 2026-08-05: Prior targeted gates at `c5b632e2` passed: `npm run check:docs` in `0.56s` with `75` citations and `18` known broken citations exactly matching the baseline; `npm run format:check` was initially unavailable because `node_modules` was absent, then passed in `9.79s` through the same pinned Node/npm `npx` environment with `prettier@3.9.5`; `git diff --check` passed in `0.02s`; `git diff main...HEAD --check` passed in `0.01s`; workflow YAML parsing passed; all `7` embedded `run` blocks passed `bash -n`; and `actionlint 1.7.11` passed with only the repository-specific `wb-ci-fe` runner-label warning excluded.
- 2026-08-05: Independent review verdict was `REQUEST_CHANGES`. The first generated output was rejected for factual workflow guidance, a legacy validator reference, incorrect Epic status, broken source/citation stamps, and a malformed generated fragment. These findings block merge and final validation despite the successful generator process and prior targeted gates.
- 2026-08-05: Recovery source and workflow changes are prepared but uncommitted. The official user-authored `openwiki/INSTRUCTIONS.md` control metadata was added to direct the next OpenWiki update; it is not a generated documentation page and does not authorize manual edits to generated output.
- 2026-08-05: A second complete feature-ref generation is pending. No recovery commit, push, dispatch, PR, or merge is claimed.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story prepared for implementation; no OpenWiki generation or workflow/source mutation was performed during story creation.
- First credentialed feature-ref generation completed in workflow run `30963482084`, producing generator commit `c5b632e2`.
- The first generated output is not accepted: independent review returned `REQUEST_CHANGES` for factual workflow/validator/Epic-state defects, broken stamps, and malformed generated content.
- Recovery changes are prepared in authoritative source/workflow surfaces, including user-authored OpenWiki control metadata at `openwiki/INSTRUCTIONS.md`; the generated pages have not been manually repaired.
- Prior Node 24 targeted gates passed at `c5b632e2`, but they are not final recovery validation. Story 165.3 remains in progress until a fresh second generation passes content, boundary, review, and final delivery gates.
- No PR or merge has occurred for Story 165.3.

### File List

- `_bmad-output/implementation-artifacts/165-3-fe-regenerate-openwiki-from-corrected-sources.md` (created; ignored, force-add exact path)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story 165.3 lifecycle only)
- `.github/workflows/openwiki-update.yml` (PR-safe generator delivery and recovery controls)
- `CLAUDE.md` (authoritative OpenWiki source/control guidance)
- `README.md` (authoritative OpenWiki source guidance)
- `docs/EPICS-AND-STORIES-TRACKER.md` (authoritative current Epic/story state)
- `docs/FRONTEND-WORK-SUMMARY.md` (authoritative frontend delivery summary)
- `openwiki/INSTRUCTIONS.md` (user-authored OpenWiki control metadata; not a generated page)
- `openwiki/.last-update.json` (first-run generated provenance; pending replacement by second generation)
- `openwiki/conventions-and-quality.md` (first-run generated page; rejected pending second generation)
- `openwiki/index.md` (first-run generated page; rejected pending second generation)
- `openwiki/quickstart.md` (first-run generated page; rejected pending second generation)
- `openwiki/testing-and-ops.md` (first-run generated page; rejected pending second generation)

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Dedicated Story 165.3 implementation context created and marked ready-for-dev. |
| 2026-08-05 | Story moved to in-progress after PR-safe workflow repair was prepared; feature-ref generation remains pending. |
| 2026-08-05 | First pinned OpenWiki generation completed through workflow run `30963482084` and generator commit `c5b632e2`; prior targeted Node 24 gates passed. |
| 2026-08-05 | Independent review returned `REQUEST_CHANGES`; no merge occurred because generated factual guidance, validator/Epic status, stamps, and a malformed fragment require source-led regeneration. |
| 2026-08-05 | Recovery source/workflow changes and user-authored `openwiki/INSTRUCTIONS.md` control metadata prepared; second generation remains pending. |
