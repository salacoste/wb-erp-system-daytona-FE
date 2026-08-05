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

- [x] Task 1: Prove the dependency and isolation gate before generation (AC: #1, #2)
  - [x] Confirm the clean Story 165.3 feature worktree is based on `a3425d96` (`origin/main` after PR #90).
  - [x] Record that Story 165.1 closeout is merged through PR #89 and Story 165.2 is merged through PR #90.
  - [x] Confirm the active ref is a Story 165.3 feature branch, not `main`, and capture `git status --short` before generation.
  - [x] Use the repository-pinned Node.js `24.18.0` and npm `11.11.0` runtime.

- [x] Task 2: Establish the permanent PR-safe generation workflow (AC: #1, #2, #3)
  - [x] Do **not** dispatch or execute the current direct-`main` workflow path: it can commit and push `HEAD:main`, which conflicts with the repository's PR-only merge policy.
  - [x] For scheduled runs from `main`, generate on a unique automation branch, push that branch without force, and open a normal PR targeting `main`; the workflow must never merge the PR itself.
  - [x] For `workflow_dispatch`, reject `main` and run only from an existing non-main feature ref; commit generated changes on the checked-out ref and use a normal fast-forward push to that same remote feature branch.
  - [x] Preserve the scheduled workflow's runner, concurrency, provider configuration, generated-boundary protections, and intended refresh behavior while replacing direct-main delivery permanently.
  - [x] The workflow must never push to `main`, force-push, merge a PR, expose a credential, or manufacture output when generation fails.

- [x] Task 3: Run the pinned OpenWiki generator with the configured provider (AC: #1, #2, #5)
  - [x] Run exactly `npx --yes openwiki@0.3.0 code --update --print`; do not resolve or substitute `latest`.
  - [x] Configure `OPENWIKI_PROVIDER=anthropic`, `ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic`, and `OPENWIKI_MODEL_ID=glm-5.2`.
  - [x] Map `ANTHROPIC_API_KEY` from the configured z.ai repository secret (`ZAI_API_KEY`) only inside the runner environment; never print, persist, download, or commit its value.
  - [x] After the credentialed runner fast-forward-pushes its generator-owned commit to the Story 165.3 branch, fetch that ref and fast-forward the local worktree with `--ff-only`; do not copy, download, reconstruct, or hand-edit generated output.

- [x] Task 4: Enforce generated and protected-file boundaries (AC: #1, #3)
  - [x] Accept generator output only under `openwiki/**` and the explicitly reviewed OpenWiki-generated region of `CLAUDE.md`.
  - [x] Treat `README.md` or another source document as editable only when a verified source correction is required; make that source correction explicitly and rerun the generator rather than patching generated pages.
  - [x] Reject or restore generator mutations to `**/AGENTS.md`, `.agents/**`, `.codex/**`, `.omx/**`, `_bmad/**`, `_bmad-output/**`, unrelated source files, lockfiles, and workflows.
  - [x] Review `.github/workflows/openwiki-update.yml` separately as intentional workflow code: preserve its valid schedule/provider semantics, remove the direct-`main` delivery path, and retain only a PR-safe update flow.
  - [x] If a generated statement is wrong, correct its authoritative source and regenerate; never manually repair `openwiki/*.md` or `openwiki/.last-update.json`.

- [x] Task 5: Validate content, navigation, and stale-guidance removal (AC: #3, #4, #5)
  - [x] Verify YAML frontmatter and required metadata for every generated Markdown page, plus JSON validity for `openwiki/.last-update.json`.
  - [x] Verify `openwiki/index.md` and all links needed to reach quickstart, architecture, workflows, integrations/API guidance, testing/operations, domain concepts, and source maps.
  - [x] Confirm generated guidance reports Next.js 16, frontend `localhost:3100`, backend `localhost:3000`, current Epic 127/162-165 state, and local-only validation semantics.
  - [x] Confirm obsolete Next.js 14, backend `localhost:3001`, PM2, Tier-0, production-certification, mandatory-CI, and stale warning-baseline guidance is absent or explicitly historical/non-authoritative.
  - [x] Run `npm run check:docs`, `npm run format:check`, and `git diff --check`; record exact results and any expected citation baseline rather than relying on prose claims.

- [ ] Task 6: Record provenance and complete independent delivery review (AC: #2, #3, #5)
  - [x] Record base SHA, feature ref, generator `0.3.0`, exact command, Node/npm versions, provider/base URL/model identifiers, UTC start/end, command exit status, workflow run ID/URL, and generator-owned commit SHA.
  - [x] Record `git diff --name-status`, generator-produced provenance from `openwiki/.last-update.json`, fast-forward proof, and evidence that no secret values appear in logs or the diff.
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

- Correlated plan scope: `.github/workflows/openwiki-update.yml`, `openwiki/`, `README.md`, `CLAUDE.md`, `scripts/story-128-10/README.md`, and `scripts/story-128-10/frontend-command-manifest.json`.
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
- 2026-08-05: Recovery source commit `2248530b17b397dfa4f539a991c241a770647b9d` was dispatched on the feature ref in GitHub Actions workflow run [30966394210](https://github.com/salacoste/wb-erp-system-daytona-FE/actions/runs/30966394210). The run started at `2026-08-05T01:26:46Z`, completed successfully at `2026-08-05T01:30:14Z`, and created generator commit `616474d7e6f180c860aadf9d64dc100ca0d13f34` with parent `2248530b17b397dfa4f539a991c241a770647b9d`.
- 2026-08-05: Second-run provenance reports `updatedAt: 2026-08-05T01:29:49.609Z`, `gitHead: 2248530b17b397dfa4f539a991c241a770647b9d`, `model: glm-5.2`, and `status: complete`. The generator commit changed only `openwiki/.last-update.json`, `openwiki/conventions-and-quality.md`, `openwiki/domain-logic.md`, and `openwiki/testing-and-ops.md`; the local story worktree fast-forwarded to `616474d7`.
- 2026-08-05: Second-run targeted documentation, workflow, provenance, and diff gates passed. This technical PASS does not satisfy AC4/AC5 because the independent code-reviewer verdict is `REQUEST_CHANGES` and the verifier verdict is `NOT_VERIFIED`.
- 2026-08-05: The second generated result was rejected because it still omitted visible current-delivery/local-only guidance, retained the historical Story 128.10 verifier as if it were a current project-wide validation entry point, and retained the false architecture claim that every page uses `use client`. Source-led repairs now include `README.md`, `openwiki/INSTRUCTIONS.md`, `scripts/story-128-10/README.md`, and `scripts/story-128-10/frontend-command-manifest.json`, plus workflow protection for `openwiki/INSTRUCTIONS.md`; a third complete generation is pending.
- 2026-08-05: Third-run source commit `5c96699c5ae59dfb695548bdffdd62bfba1f8d15` was dispatched on the feature ref in GitHub Actions workflow run [30967725988](https://github.com/salacoste/wb-erp-system-daytona-FE/actions/runs/30967725988). The run started at `2026-08-05T01:53:23Z`, completed successfully at `2026-08-05T01:57:15Z`, and created generator commit `aeffcc2cc88f3e3bba3fdb551178188d6e40aba8` with parent `5c96699c5ae59dfb695548bdffdd62bfba1f8d15`.
- 2026-08-05: Third-run provenance reports `updatedAt: 2026-08-05T01:57:07.364Z`, `gitHead: 5c96699c5ae59dfb695548bdffdd62bfba1f8d15`, `model: glm-5.2`, and `status: complete`. The generator commit changed only `openwiki/.last-update.json`, `openwiki/architecture.md`, `openwiki/conventions-and-quality.md`, `openwiki/index.md`, `openwiki/quickstart.md`, and `openwiki/testing-and-ops.md`; the local story worktree fast-forwarded to `aeffcc2c`.
- 2026-08-05: Third-run targeted documentation, workflow, provenance, generated-boundary, and diff gates passed. The run resolved every prior systemic blocker: current local-only delivery guidance, historical Story 128.10 validator framing, client/server architecture wording, Epic state, and provenance are now accepted.
- 2026-08-05: Independent third-run review still returned `REQUEST_CHANGES`, and verification returned `NOT_VERIFIED`, only because `openwiki/architecture.md` contains one malformed duplicated Configuration fragment and the two Anti-Pattern #8 links in `openwiki/domain-logic.md` use a broken single-hyphen anchor. Run 4 source-control instructions are being repaired for a fresh complete generation; generated pages remain untouched by hand.
- 2026-08-05: Run 4 workflow run [30968672409](https://github.com/salacoste/wb-erp-system-daytona-FE/actions/runs/30968672409) failed during generation because the configured provider returned `overloaded_error` with HTTP `500`. The failed attempt produced no generated output, generator commit, or push; the local and remote feature ref remained at `1cdd721ac5cd82eb8a02a0fcd9032264f7b18eaa`, with the prepared source-repair diff unchanged. A fresh retry was required.
- 2026-08-05: Run 4 retry workflow run [30968987777](https://github.com/salacoste/wb-erp-system-daytona-FE/actions/runs/30968987777) started at `2026-08-05T02:18:46Z` and completed successfully at `2026-08-05T02:22:08Z`. It ran from source SHA `1cdd721ac5cd82eb8a02a0fcd9032264f7b18eaa` and produced generator commit `ed94e3c541f726ea3507a8d573ca49a9560e7d36` with parent `1cdd721ac5cd82eb8a02a0fcd9032264f7b18eaa`.
- 2026-08-05: Retry provenance reports `updatedAt: 2026-08-05T02:22:00.793Z`, `gitHead: 1cdd721ac5cd82eb8a02a0fcd9032264f7b18eaa`, `model: glm-5.2`, and `status: complete`. The generator commit changed only `openwiki/.last-update.json`, `openwiki/architecture.md`, and `openwiki/domain-logic.md`; user-authored `openwiki/INSTRUCTIONS.md` was preserved unchanged.
- 2026-08-05: Run 4 targeted documentation, provenance, navigation, protected-boundary, workflow-syntax, and diff validation passed. This targeted `PASS` is not final acceptance evidence.
- 2026-08-05: Fresh independent code review returned `REQUEST_CHANGES`, and verification remained `NOT_VERIFIED`. The blocking findings are false generated source/citation stamps, a HIGH workflow credential-persistence risk, and a MEDIUM manual tag-dispatch safety mismatch. Source/workflow repairs followed by a complete Run 5 generation are pending; generated pages remain untouched by hand.
- 2026-08-05: Run 5 workflow run [30970119251](https://github.com/salacoste/wb-erp-system-daytona-FE/actions/runs/30970119251) started from source SHA `0b27cd9ac7db1e1103acbd1359467b3625cb0e01`. The generator, protected-guidance restore, generated-change inspection, and commit steps succeeded. The runner created provisional commit `1cee5de9`, changing only four generated paths: `openwiki/.last-update.json`, `openwiki/api-and-normalizers.md`, `openwiki/domain-logic.md`, and `openwiki/testing-and-ops.md`.
- 2026-08-05: Run 5 failed while publishing the provisional commit because `gh auth setup-git` could not run on the self-hosted runner (`gh: command not found`, exit `127`). The remote feature ref remained unchanged at `0b27cd9a`; provisional commit `1cee5de9` was not pushed and is not accepted or recoverable through the required feature-ref fast-forward path. No merge occurred.
- 2026-08-05: Run 6 workflow run [30971010131](https://github.com/salacoste/wb-erp-system-daytona-FE/actions/runs/30971010131) completed successfully from source `0112d53ece9812d395296948040294c522ec4e51` and created generator commit `b59d11d97a1a64e57301dbbe4002f8158ea960e8` with that exact parent. The run changed only `openwiki/.last-update.json`, `openwiki/api-and-normalizers.md`, `openwiki/domain-logic.md`, and `openwiki/testing-and-ops.md`; `openwiki/INSTRUCTIONS.md` remained unchanged with SHA-256 `00868a992c9e4af8547d011c789b700c4dcf4aa35d80b49a2d1e95054927e318`, and the local worktree fast-forwarded cleanly to the remote feature ref.
- 2026-08-05: Run 6 targeted validation passed under Node `24.18.0` and npm `11.11.0`: documentation citations matched the `75`/`18` baseline, project-scoped Prettier `3.9.5` passed, frontmatter was `7/7`, `25` relative links resolved, provenance JSON was valid, Story 128 self-test passed `4/4`, workflow YAML and all `7` embedded Bash blocks passed, `actionlint 1.7.11` passed with only the custom runner-label warning excluded, and diff checks passed.
- 2026-08-05: Independent Run 6 review returned `REQUEST_CHANGES` for two generated-content findings: `openwiki/testing-and-ops.md` incompletely describes the protected `openwiki/INSTRUCTIONS.md` boundary, and `openwiki/quickstart.md` still advertises deployment navigation despite the local-only/no-platform contract. The workflow security design, provenance, generated boundary, current product facts, anchors, and Story 128 framing were approved. The authoritative `openwiki/INSTRUCTIONS.md` control source was strengthened for a fresh Run 7 generation; generated pages remain untouched by hand.
- 2026-08-05: Run 7 workflow run [30972049311](https://github.com/salacoste/wb-erp-system-daytona-FE/actions/runs/30972049311) completed successfully from source `53cccb0b9a1e7123487adc579aacb0efb9beebd6`, creating generator commit `3a2f4a26cc3f0d5c56bafcab42c81f555c77c869` with that exact parent. It changed only `openwiki/.last-update.json`, `openwiki/quickstart.md`, and `openwiki/testing-and-ops.md`; `openwiki/INSTRUCTIONS.md` remained unchanged with SHA-256 `92077a5b67801ec9777065e2bcc8ddb18772972567fd44655d66e8b6eddc6517`.
- 2026-08-05: Independent Run 7 review returned `APPROVE`. Both Run 6 blockers are resolved exactly, provenance and the three-path generated boundary agree, protected files remained unchanged, relative links/frontmatter/anchors pass, and the PR-safe workflow retained its ref guards, token isolation, normal pushes, and no direct-main/force/auto-merge behavior.
- 2026-08-05: Lifecycle sources now record Epic 165 completion through the current Story 165.3 delivery, keep Stories 165.4/165.5 deferred, and remove the temporary stale-OpenWiki redirect. One final complete regeneration is required so generated documentation reflects this closeout state before full validation and delivery.
- 2026-08-05: No PR or merge is claimed. Story status remains `in-progress`; AC4, AC5, final independent approval, merge, and cleanup remain open.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story prepared for implementation; no OpenWiki generation or workflow/source mutation was performed during story creation.
- First credentialed feature-ref generation completed in workflow run `30963482084`, producing generator commit `c5b632e2`.
- The first generated output is not accepted: independent review returned `REQUEST_CHANGES` for factual workflow/validator/Epic-state defects, broken stamps, and malformed generated content.
- Second credentialed feature-ref generation completed in workflow run `30966394210`, producing generator commit `616474d7` from source parent `2248530b`; targeted gates passed.
- The second generated output is also not accepted: code review returned `REQUEST_CHANGES` and verification returned `NOT_VERIFIED` because current delivery/local-only guidance remained absent and architecture/validator guidance remained inaccurate.
- Third credentialed feature-ref generation completed in workflow run `30967725988`, producing generator commit `aeffcc2c` from source parent `5c96699c`; targeted gates passed and all prior systemic findings were resolved.
- The third generated output is not accepted: code review returned `REQUEST_CHANGES` and verification returned `NOT_VERIFIED` only for one malformed duplicated Configuration fragment in `openwiki/architecture.md` and two broken Anti-Pattern #8 anchors in `openwiki/domain-logic.md`.
- Run 4 source-control repairs were committed in user-authored `openwiki/INSTRUCTIONS.md`; generated pages were not manually repaired.
- Run 4 workflow run `30968672409` failed on provider `overloaded_error` / HTTP `500` before producing output, a commit, or a push. The feature ref and prepared source-repair diff remained unchanged at `1cdd721a`.
- Run 4 retry workflow run `30968987777` completed successfully from source `1cdd721a`, producing generator commit `ed94e3c5` with parent `1cdd721a` and changing only `openwiki/.last-update.json`, `openwiki/architecture.md`, and `openwiki/domain-logic.md`; `openwiki/INSTRUCTIONS.md` remained unchanged.
- Run 4 targeted validation passed, but the output is not accepted: independent review returned `REQUEST_CHANGES` and verification remained `NOT_VERIFIED` for false generated stamps, HIGH credential persistence, and MEDIUM tag-dispatch handling.
- Run 5 workflow run `30970119251` completed generation and protected-guidance restoration from source `0b27cd9a`, then created provisional commit `1cee5de9` with four generated-path changes.
- Run 5 publish failed because the self-hosted runner did not provide the `gh` command (`command not found`, exit `127`). The remote feature ref stayed at `0b27cd9a`; provisional output was neither published nor accepted and cannot be recovered through the approved fast-forward integration path.
- Run 6 completed and published generator commit `b59d11d9` through the token-scoped, `gh`-free feature-branch path; provenance, boundaries, workflow safety, and targeted validation passed.
- Run 6 remains unaccepted because independent review found two MEDIUM generated-content defects in protected-boundary wording and stale deployment navigation. The author-controlled `openwiki/INSTRUCTIONS.md` source now requires both repairs; Run 7 regeneration is pending.
- Run 7 generated `3a2f4a26` from source `53cccb0b` and received independent `APPROVE`; both Run 6 findings are resolved without manual generated-page edits.
- Epic/story lifecycle sources are prepared for completion through the current PR merge. A final regeneration remains pending because those authoritative sources changed after Run 7.
- No PR or merge has occurred for Story 165.3.

### File List

- `_bmad-output/implementation-artifacts/165-3-fe-regenerate-openwiki-from-corrected-sources.md` (created; ignored, force-add exact path)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story 165.3 lifecycle only)
- `.github/workflows/openwiki-update.yml` (PR-safe generator delivery and recovery controls)
- `CLAUDE.md` (authoritative OpenWiki source/control guidance)
- `README.md` (authoritative OpenWiki source guidance)
- `docs/EPICS-AND-STORIES-TRACKER.md` (authoritative current Epic/story state)
- `docs/FRONTEND-WORK-SUMMARY.md` (authoritative frontend delivery summary)
- `openwiki/INSTRUCTIONS.md` (user-authored OpenWiki control metadata; Run 7 source repair prepared after Run 6 review)
- `scripts/story-128-10/README.md` (expected authoritative historical-evidence warning for the next generation)
- `scripts/story-128-10/frontend-command-manifest.json` (expected authoritative historical lifecycle and current-entrypoint metadata for the next generation)
- `openwiki/.last-update.json` (Run 7 provenance from source `53cccb0b` in generator commit `3a2f4a26`; final lifecycle regeneration pending)
- `openwiki/api-and-normalizers.md` (Run 6 generated page; anchor repair remains accepted)
- `openwiki/architecture.md` (Run 4 retry generated page; targeted validation passed, final review rejected the output)
- `openwiki/conventions-and-quality.md` (third-run generated page; prior workflow/validator findings resolved)
- `openwiki/domain-logic.md` (Run 6 generated page; corrected Anti-Pattern 8 links remain accepted)
- `openwiki/index.md` (third-run generated page; current local-only delivery guidance resolved)
- `openwiki/quickstart.md` (Run 7 generated page; deployment navigation corrected and independently approved)
- `openwiki/testing-and-ops.md` (Run 7 generated page; exact protected/control-file boundary independently approved)

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Dedicated Story 165.3 implementation context created and marked ready-for-dev. |
| 2026-08-05 | Story moved to in-progress after PR-safe workflow repair was prepared; feature-ref generation remains pending. |
| 2026-08-05 | First pinned OpenWiki generation completed through workflow run `30963482084` and generator commit `c5b632e2`; prior targeted Node 24 gates passed. |
| 2026-08-05 | Independent review returned `REQUEST_CHANGES`; no merge occurred because generated factual guidance, validator/Epic status, stamps, and a malformed fragment require source-led regeneration. |
| 2026-08-05 | Recovery source/workflow changes and user-authored `openwiki/INSTRUCTIONS.md` control metadata prepared for a second generation. |
| 2026-08-05 | Second generation completed in workflow run `30966394210` from `2248530b`, producing `616474d7`; targeted gates passed, but review returned `REQUEST_CHANGES` and verification returned `NOT_VERIFIED`. |
| 2026-08-05 | Second output rejected; additional authoritative-source and workflow-protection repairs prepared. Third source-led generation remains pending and status stays `in-progress`. |
| 2026-08-05 | Third generation completed in workflow run `30967725988` from `5c96699c`, producing `aeffcc2c`; targeted gates passed and every prior systemic blocker was resolved. |
| 2026-08-05 | Third output retained `REQUEST_CHANGES` / `NOT_VERIFIED` only for one malformed duplicated architecture fragment and two broken anchors; Run 4 source repair and generation remain pending, with AC4/AC5/final review/merge still open. |
| 2026-08-05 | Run 4 workflow run `30968672409` failed on provider `overloaded_error` / HTTP `500` without generated output, commit, or push; the feature ref remained `1cdd721a`, status stayed `in-progress`, and a fresh retry was required. |
| 2026-08-05 | Run 4 retry workflow run `30968987777` completed successfully from source `1cdd721a`, producing generator commit `ed94e3c5` with exactly three generated-file changes while preserving `openwiki/INSTRUCTIONS.md`; fresh validation/review remain pending and AC4/AC5/final review/merge stay open. |
| 2026-08-05 | Run 4 targeted validation passed, but independent review returned `REQUEST_CHANGES` and verification remained `NOT_VERIFIED` for false generated stamps, HIGH credential persistence, and MEDIUM tag-dispatch handling; Run 5 source/workflow repair and regeneration are pending, with AC4/AC5/final review/merge still open. |
| 2026-08-05 | Run 5 workflow run `30970119251` generated from source `0b27cd9a`, preserved protected guidance, and created provisional four-path commit `1cee5de9`, but publish failed because `gh` was unavailable (exit `127`). The remote ref remained unchanged, output was not accepted or recoverable, and Run 6 workflow repair plus fresh generation are pending; status stays `in-progress`, with AC4/AC5/final review/merge open. |
| 2026-08-05 | Run 6 workflow run `30971010131` completed from source `0112d53e` and published generator commit `b59d11d9`; targeted validation and workflow security checks passed, but independent review rejected two generated-content defects. The control source was repaired for Run 7; status stays `in-progress`. |
| 2026-08-05 | Run 7 workflow run `30972049311` completed from source `53cccb0b`, published generator commit `3a2f4a26`, and received independent `APPROVE`; lifecycle sources now close Epic 165 through the current Story 165.3 delivery, requiring one final regeneration before full validation and merge. |
