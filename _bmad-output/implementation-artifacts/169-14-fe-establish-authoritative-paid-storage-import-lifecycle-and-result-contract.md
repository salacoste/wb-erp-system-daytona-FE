# Story 169.14: Establish the Authoritative Paid-Storage Import Lifecycle and Result Contract

Status: in-progress

## Story

As a user importing paid-storage data,
I want the trigger and status endpoints to expose one authoritative lifecycle and result contract,
so that the frontend can report progress, imported rows, failure details, and safe whole-range recovery truthfully.

## Acceptance Criteria

1. Canonical request keys are exactly `dateFrom` and `dateTo`; undocumented aliases such as `date_from` and `date_to` are rejected by the production validation policy.
2. Manual and smart accepted starts return `pending`, never undocumented `queued`, and never fabricate `rows_imported` before completion.
3. Polling exposes only `pending | processing | completed | failed`; known BullMQ waiting/delayed/prioritized/waiting-children states map to `pending`, `active` maps to `processing`, and an explicit BullMQ `unknown` state fails closed as wire `failed` with stable sanitized `UNKNOWN_QUEUE_STATE` detail rather than masquerading as normal progress. Story 169.15 separately preserves its frontend-only `unknown` sentinel for an actually unrecognized backend wire value.
4. Completed paid-storage polling exposes the processor's authoritative `job.returnvalue.rowsImported` as optional `rows_imported`; non-completed and unrelated Excel status responses do not emit that field.
5. Failed polling preserves actionable nested `error.code` and `error.message` without exposing a completion result.
6. JWT-claim cabinet isolation is enforced at paid-storage start and method-level at the shared Excel/paid-storage `GET /v1/imports/:id` polling boundary, including the necessary top-of-file `CabinetGuard` import and directly related Swagger decorators. Authorized same-cabinet Excel polling remains runtime-compatible; unknown and cross-cabinet jobs remain indistinguishable where the existing service contract returns 404.
7. Apart from the intentional shared polling authorization hardening and directly related OpenAPI correction, the handler body, unrelated controller methods, queue selection, retry behavior, processor/orchestration/storage semantics, database writes, current all-or-failure date-range processing, and unrelated generic import behavior remain unchanged.
8. DTO/OpenAPI, controller/guard, status-builder, unit/integration/E2E, API documentation, targeted/full gates, exact scope audit, and two independent reviews pass.
9. No partial-success state, partial count, retry subset, cast, unrelated response-shape broadening, schema/dependency change, deploy, production operation, direct-main push, or force-push occurs.
10. Before the first backend production edit, exact backend base/foreign-WIP evidence, honest RED evidence, reviewer identity, and the frozen reviewed backend manifest are committed to this artifact with the exact machine-readable markers and delimiters defined below. Evidence-preflight must authorize the extracted canonical nonempty manifest as a subset of the Story 169.14 allowed manifest containing every required path; delivery and publish recovery retain the same gate. The trusted frontend origin must resolve to `salacoste/wb-erp-system-daytona-FE`, and the evidence commit must be reachable from refreshed frontend `origin/main` before its committed bytes are consumed.
11. Backend collision proof asserts repository identity `salacoste/wb-erp-system-daytona`, scans linked-worktree WIP/divergence, clean unattached local-branch divergence, and open-PR overlap, rejects PR-list truncation, and requires fully paginated changed-file enumeration to equal each PR's authoritative `changedFiles` count.
12. Story completion additionally requires exactly one verified fetch URL and push URL per repository, independent expected-repository checks, backend and frontend mode-600 review-bootstrap, reviewed-head, and PR records, absence-leased first publication, atomic --match-head-commit merge protection, exact feature → merge → refreshed-origin ancestry in both repositories, and lease-protected verified-push-endpoint deletion that rejects concurrent branch advancement. Before backend branch/worktree deletion, cleanup atomically publishes the strict nine-line mode-600 `story-169-14-branch-worktree-cleanup-authority-v1`, binding the exact backend reviewed-head/PR hashes, branch/worktree identity, backend-main mode, and byte-exact reservation hash; publication is create-or-byte-identical. Before each final commit, the exact bootstrap binds reviewed parent/tree, manifest or artifact hashes, both independent reviewer identities/PASS dispositions, and applicable predecessor-record hashes, including that cleanup authority for final handoff. Commit-before-reviewed-head recovery is authorized only by that byte-identical bootstrap; it must reauthenticate the direct parent, tree, manifest/artifact, reviewers, and remote absence, then cross-check and consume the bootstrap before first push. Missing, foreign, malformed, wrong-mode, or symlinked bootstrap state fails closed. REST all-state PR enumeration normalizes lowercase REST `state` together with `merged_at` to `OPEN | MERGED | CLOSED_UNMERGED`; closed-unmerged/invalid state fails closed, post-create state is re-read, and an already merged exact PR is not merged again. The backend records bind exact base/evidence/feature/direct-parent/tree/frozen-manifest/two-review truth, the backend PR, and cleanup-reservation authority; the frontend records bind the exact twice-reviewed artifact-only final-handoff commit/tree, its version-3 30-line committed payload, all three backend record hashes, and the exact frontend PR/merge. Before bootstrap/commit, the final-handoff parser requires clean-local-main to carry byte-exact `NONE\n`, or recorded-origin-deferral to carry canonical sorted unique nonempty newline-delimited bytes exactly matching the cleanup-authority hash; self-hash alone is never authority. Cleanup publishes the self-contained mode-600 48-line `story-169-14-record-retirement-transaction-v1` before deleting any of the five source records. That strict ordered transaction binds both repositories, reviewed bases/evidence/commits/trees/manifests/artifact/reviewer pairs, both exact PR topologies and merges, advancing-main ancestry, source paths/hashes, deletion set, and cleanup proof. Recovery reauthenticates live Git/GitHub topology and validates every transaction-bound source SHA-256 as exactly 64 lowercase hexadecimal characters before source existence is considered. A source is accepted only as exact-present or already absent under the authenticated transaction; a malformed bound hash fails closed in either state, with executable synthetics covering malformed and valid hashes for both present and absent sources. Malformed/reordered/extra/missing fields, wrong mode/type, symlink, foreign hash, or topology drift also fail before further deletion. The transaction is removed only after all five sources are proven absent. Story/sprint status reconciliation follows transaction-complete retirement, so this Story cannot be marked `done` earlier.
13. Every authoritative Git absence, cleanliness, and manifest query is captured under an explicit command-failure guard before its output is tested or composed. A failed `branch --list`, `ls-remote`, `status --porcelain`, `diff`, or `ls-files` command must exit before worktree/branch removal, cleanup-complete publication, artifact publication, source-record deletion, or Story 169.15 successor authorization. Executable invalid-repository and missing-remote synthetics prove these mutation boundaries remain unreachable on query failure.

## Tasks / Subtasks

- [x] Run read-only backend collision, contract, and test-surface inventories.
- [x] Identify the missing durable delivery record and approve this artifact as that record.
- [x] Correct the verified-base lifecycle for foreign WIP that blocks a safe local-main fast-forward.
- [x] Correct ownership for method-level shared polling `CabinetGuard`/OpenAPI decorator hunks and direct Excel/paid-storage regression evidence.
- [ ] Merge the docs-only preflight correction and clean its frontend branch/worktree.
- [ ] Re-fetch backend `origin/main`, assert exact backend identity, and re-run fail-closed collision proof across uncommitted/committed linked worktrees, clean unattached local branches, and open-PR paths whose fully paginated enumeration count equals `changedFiles`; create the exact Story backend branch/worktree from the approved base only after the scan passes.
- [ ] Add and retain honest behavioral RED controller/guard/status-builder/E2E tests.
- [ ] Independently review the RED matrix and exact backend implementation manifest.
- [ ] Commit the exact base, RED, reviewer, review-evidence, and frozen reviewed-manifest markers/delimiters to this artifact before the first backend production edit; require the retained reviewer payload's unique exact privacy attestation, authorize the extracted canonical manifest against the allowed/required sets, fetch/assert the exact frontend origin, prove evidence-commit ancestry on refreshed frontend `origin/main`, and re-read these committed bytes.
- [ ] Implement the smallest GREEN backend correction inside the frozen manifest.
- [ ] Run targeted and universal backend gates, exact scope audit, two fresh reviews, and all required reruns.
- [ ] After both final reviews, atomically publish the exact mode-600 review-bootstrap record before the final commit; recover a commit-before-reviewed-head crash only from that byte-identical authority; cross-check and consume it before first push; then create the remote branch only with an absence-expecting lease for the captured feature SHA, create or byte-validate the adjacent-temp three-line PR record, normalize/re-read REST all-state PR truth with `merged_at`, retain exact OPEN/main/head/headRefOid checks, reject closed-unmerged state, skip re-merge for an already merged exact PR, and merge only with --match-head-commit for that SHA.
- [ ] Reuse the exact reviewed-head and PR records; prove feature → exact merge → refreshed backend `origin/main`, delete the remote branch only through the verified push endpoint with an exact-old-SHA lease, and remove the local branch/worktree through the restartable record-driven cleanup phase while retaining both records.
- [ ] Publish and merge the exact twice-reviewed artifact-only frontend final-handoff record from `cdx/epic-169-story-14-final-handoff` through the executable `create | delivery | publish-recovery | cleanup` lifecycle; authenticate its payload against the retained backend cleanup authority before bootstrap/commit, retain its own precommit review-bootstrap plus separate reviewed-head/PR records, bind the committed version-3 payload and all three backend record hashes to the exact frontend PR/merge, then run backend `record-retirement` through the authenticated 48-line transaction so partial deletion is restartable and all five records are cross-verified before removal.
- [ ] Reconcile Story/sprint status only after final handoff ancestry plus record-retirement proof.

## Dev Notes

### Exact execution lanes

Frontend canonical evidence repository:

- Repository: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`
- GitHub identity: `salacoste/wb-erp-system-daytona-FE`
- Preflight branch: `cdx/epic-169-story-14-preflight-docs`
- Preflight worktree: `/private/tmp/wb-repricer-fe-169-14-preflight-docs`

Backend implementation repository:

- Repository: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new`
- GitHub identity: `salacoste/wb-erp-system-daytona`
- Branch: `cdx/epic-169-story-14-paid-storage-import-contract`
- Worktree: `/private/tmp/wb-repricer-be-169-14-paid-storage-import-contract`
- Executable plan: `frontend/.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`

### Allowed backend manifest

Static allowed paths:

```text
docs/API-PATHS-REFERENCE.md
src/imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts
src/imports/controllers/__tests__/paid-storage-import.controller.spec.ts
src/imports/controllers/paid-storage-import.controller.ts
src/imports/dto/import-status.dto.ts
src/imports/dto/paid-storage-import.dto.ts
src/imports/imports.controller.ts
src/imports/services/import-status-builder.service.spec.ts
src/imports/services/import-status-builder.service.ts
test/imports/paid-storage.e2e-spec.ts
```

The production edit to `src/imports/imports.controller.ts` is limited to the necessary top-of-file `CabinetGuard` import hunk plus method-level `CabinetGuard` and directly related `@ApiParam`, `@ApiOperation`, `@ApiHeader`, and `@ApiResponse` decorator hunks on the shared Excel/paid-storage `GET /v1/imports/:id` status boundary. Its handler body, unrelated methods, and class-wide guard behavior remain forbidden. `src/imports/dto/paid-storage-import.dto.ts` is optional and may be frozen only if honest RED proves a DTO production correction is required.

`src/imports/imports.service.ts`, paid-storage processor/orchestration/storage paths, the shared polling handler body, unrelated controller methods, class-wide guard behavior, Prisma, packages, dependencies, frontend runtime source, deployment, and production operations remain forbidden. Authorized same-cabinet Excel polling must retain its runtime response/lifecycle contract.

## Dev Agent Record

### Agent Model Used

Primary orchestrator with independent repository-inventory, architecture, test-design, implementation, review, and verification lanes. Exact final reviewer identities and dispositions are recorded below when each gate completes.

### Backend Base Evidence

Preflight evidence before backend Story worktree creation:

- Backend local `main`: `e8cff608da1aa87e1c482a68566e8ba824fe1e2d`.
- Refreshed backend `origin/main`: `25b41be67f9f7e3b0aa6e8081f741b263dbecd64`.
- Local `main` ancestry on refreshed `origin/main`: proven.
- Approved planned Story base: refreshed `origin/main` `25b41be67f9f7e3b0aa6e8081f741b263dbecd64` under the foreign-WIP fallback.
- Actual Story base after worktree creation: pending.
- Exact incoming paths that overlap foreign local WIP and block a safe local-main fast-forward:
  - `openwiki/.last-update.json`;
  - `openwiki/workflows/fe-shadcn-migration.md`.
- Broader foreign WIP remains under `frontend/**`, `openwiki/**`, and `.env.bak-*`; it must not be staged, committed, stashed, reset, restored, cleaned, or otherwise mutated by Story 169.14.
- Story-owned backend paths: clean and non-overlapping at preflight; fresh fail-closed proof remains mandatory immediately before worktree creation and must cover staged, unstaged, and untracked WIP plus clean committed divergence in every linked worktree, committed divergence in every clean unattached local branch, and open-PR changed-file overlap. PR discovery must reject list results at the configured limit, enumerate changed files with `gh api --paginate`, and require the enumerated count to equal `changedFiles` before overlap comparison.

### Baseline Evidence

- Runtime: Node `v24.18.0`; npm `11.16.0`.
- Command: `npx jest src/imports/services/import-status-builder.service.spec.ts --runInBand --no-cache`.
- Result: exit 0; 1 suite passed; 18 tests passed; 0 failed.
- Classification: pre-edit baseline only, not Story RED or GREEN evidence.

### RED Evidence

Status: pending backend worktree creation and Story-specific failing tests.

The retained RED update must record:

- exact commands and exit codes;
- failing assertion names and complete behavioral failure output;
- proof that failures are not missing imports, fixtures, types, databases, Redis, or WB network access;
- manual and smart `queued` → `pending` drift;
- fabricated pre-completion `rows_imported` removal;
- completed `rowsImported` projection;
- paid-storage start and polling JWT-claim cabinet isolation;
- unchanged Excel status runtime shape.

Story-specific RED unit commands must use `JEST_NO_RETRY=1` so repository-wide Jest retries cannot hide the first behavioral failure. The direct E2E command must use the package script's existing `--maxWorkers=1` and must not add the invalid `--runInBand` combination.

### Frozen Reviewed Manifest

Status: **not yet frozen**.

Hard gate: after honest RED and before the first backend production edit, update this section in a separate frontend documentation branch/PR and merge or otherwise durably commit it to the canonical frontend history. Record reviewer identity/disposition, the exact evidence commit SHA, and the exact sorted newline-delimited manifest's SHA-256. The evidence commit must have exactly one parent and change exactly this artifact; prove both properties from the committed objects, then read the artifact with `git show <evidence-commit>:_bmad-output/implementation-artifacts/169-14-fe-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md` into a temporary file. Embed the complete behavioral RED output and independent review evidence as exact nonempty delimited blocks produced with synthetic identities and sanitized logging. First validate all six retained/manifest delimiters with one global exact-order state machine that rejects duplicate, same-type or cross-type nested, mismatched/early END, reordered, and unclosed markers; then extract every payload to a file. Canonical payload bytes exclude delimiter lines and contain one LF for every complete payload line, including every trailing blank payload line; hash the nonempty extracted files directly, never command-substitution strings. Evidence-preflight must fail closed until that extracted manifest is canonical, nonempty, a subset of the Story 169.14 allowed manifest, and contains every required path; delivery and publish recovery rerun the same authorization. Before commit or consumption, run a fail-closed non-echoing scan that rejects common credential-bearing headers, Bearer/Basic values, supported plain or compound credential assignments, private-key material, and credential-bearing URI userinfo. The retained reviewer payload must contain exactly one complete `STORY_169_14_PRIVACY_REVIEW_ATTESTATION: PASS_NO_SECRET_OR_CUSTOMER_PII` line inside the committed bytes covered by `STORY_169_14_REVIEW_EVIDENCE_SHA256`; missing or duplicate attestations fail closed. The independent reviewer confirms no secret or customer/PII bytes are retained; repair the emitting test/logger and rerun instead of redacting hashed evidence. Require equality with the committed markers, then export identical manifest lines as `STORY_169_14_FROZEN_REVIEWED_MANIFEST` and its file hash as `STORY_169_14_FROZEN_MANIFEST_SHA256` in the backend lane.

The committed artifact must contain exactly one of every marker below. The RED exit code is nonzero; every SHA-256 is 64 lowercase hexadecimal characters; the reviewer identifier is nonempty and constrained by the executable plan; reviewed/frozen manifest hashes match; and the manifest is exact, nonempty, sorted, newline-delimited, a subset of the allowed manifest, contains all required paths, and is enclosed by the exact delimiters. The privacy attestation is retained reviewer-payload content, not a new top-level marker.

- `STORY_169_14_BACKEND_BASE_SHA`
- `STORY_169_14_RED_CLASSIFICATION: BEHAVIORAL_CONTRACT_FAILURE`
- `STORY_169_14_RED_COMMAND`
- `STORY_169_14_RED_EXIT_CODE`
- `STORY_169_14_RED_OUTPUT_SHA256`
- `STORY_169_14_PRE_IMPLEMENTATION_REVIEWER_ID`
- `STORY_169_14_PRE_IMPLEMENTATION_REVIEW_DISPOSITION: PASS`
- `STORY_169_14_REVIEWED_MANIFEST_SHA256`
- `STORY_169_14_REVIEW_EVIDENCE_SHA256`
- `STORY_169_14_FROZEN_MANIFEST_SHA256`
- `<!-- STORY_169_14_RETAINED_RED_OUTPUT:START -->`
- `<!-- STORY_169_14_RETAINED_RED_OUTPUT:END -->`
- `<!-- STORY_169_14_RETAINED_REVIEW_EVIDENCE:START -->`
- `<!-- STORY_169_14_RETAINED_REVIEW_EVIDENCE:END -->`
- `<!-- STORY_169_14_FROZEN_REVIEWED_MANIFEST:START -->`
- `<!-- STORY_169_14_FROZEN_REVIEWED_MANIFEST:END -->`

Before consuming these values, fetch the exact frontend origin, assert `salacoste/wb-erp-system-daytona-FE`, and prove the single-parent artifact-only evidence commit is reachable from refreshed frontend `origin/main`. Caller-supplied hashes without byte-for-byte recomputation of the committed retained RED/reviewer blocks, a PR body, backend-local note, untrusted local object, or later diff are not evidence.

Do not derive the manifest from the final backend diff. No backend production edit is authorized while this section remains `not yet frozen`.

Reviewer: pending.

Frontend evidence commit: pending.

Frozen manifest SHA-256: pending.

Frozen after honest RED and before first production edit: pending.

```text
PENDING — replace with the exact sorted newline-delimited reviewed backend manifest
```

### Review Evidence

- Preflight collision audit: no Git-level overlap on any Story-owned backend path; foreign WIP preserved.
- Architecture review: required a durable frontend delivery record and verified-`origin/main` fallback before backend worktree creation.
- Test-architecture review: identified honest lifecycle/result REDs and the polling JWT-claim isolation ownership gap.
- [x] [Review][Patch] Enumerate known BullMQ nonterminal states and fail closed for explicit `unknown` rather than hiding contract drift as `pending`.
- [x] [Review][Patch] Validate all Story 169.14 evidence delimiters through one global exact-order/no-cross-nesting marker state machine.
- [x] [Review][Patch] Retain and byte-recompute Story 169.15 RED/reviewer payloads instead of accepting caller-supplied hashes.
- [x] [Review][Patch] Authenticate the 169.14 → 169.15 prerequisite through an exact committed final-handoff artifact and exact backend PR/topology proof.
- [x] [Review][Patch] Make first branch publication absence-leased and both cleanup fences record-driven/restartable with direct feature → merge ancestry.
- [x] [Review][Patch] Apply synthetic/sanitized evidence policy, non-echoing sensitive-byte scans, and reviewer privacy confirmation before evidence commit.
- [x] [Review][Patch] Authorize the extracted canonical nonempty manifest against the Story 169.14 allowed and required sets before evidence-preflight success, and retain the same gate during delivery/recovery.
- [x] [Review][Patch] Reject credential-bearing headers, Bearer/Basic values, plain/compound credential assignments, private keys, and credential-bearing URIs; bind exactly one Story-specific privacy attestation inside the committed and hashed reviewer payload.
- [x] [Review][Patch] Replace prose-only frontend final-handoff publication with executable restartable `create | delivery | publish-recovery | cleanup` phases, separate frontend reviewed-head/PR records, exact PR/head/merge proof, and delayed cross-bound retirement of all publication records.
- [x] [Review][Patch] Make both privacy scanners suffix-aware for conventional prefixed credential variables and cover all seven assignment operators with mandatory negative synthetics plus a benign prose control.
- [x] [Review][Patch] Require Story 169.15 to independently authenticate the exact evidence commit, committed payload hashes, authorized backend manifest, frontend handoff PR/base/head/merge lineage, and final cleanup before worktree creation.
- [x] [Review][Patch] Normalize GitHub REST all-state PR rows with `merged_at`, fail closed on `CLOSED_UNMERGED`/invalid combinations, re-read after creation, and never issue a second merge for an already merged exact PR.
- [x] [Review][Patch] Close the final-commit-before-reviewed-head crash window with exact mode-600 review-bootstrap authority for backend delivery, frontend final handoff, and Story 169.15; require bootstrap cross-check/removal before first push and reject missing, foreign, wrong-mode, or symlinked state.
- [x] [Review][Patch] Replace sequential record deletion with self-contained authenticated retirement transactions: 48 ordered fields for the five-record Story 169.14 cross-bound retirement and 24 ordered fields for Story 169.15's two-record cleanup, including immutable reviewed authority, live topology reauthentication, partial-deletion recovery, and fail-closed mode/type/symlink/hash checks.
- [x] [Review][Patch] Authenticate final-handoff foreign-WIP semantics before bootstrap/commit through a retained strict mode-600 backend cleanup-authority record; cover clean `NONE`, empty/blank/unsorted/duplicate deferrals, exact canonical reservation, and foreign self-hashed payload synthetics; retire the authority only in the five-source transaction and require its Story 169.15 absence.
- [x] [Review][Patch] Authenticate the backend PR head branch and head OID together during final-handoff preflight; prove that the exact Story branch plus reviewed OID passes and a foreign branch with the identical OID fails.
- [x] [Review][Patch] Require every present lifecycle-authority record to be a non-symlink regular mode-600 file and every expected-absent record/worktree path to be nonexistent and non-symlinked; cover regular/live-symlink, absent/dangling-symlink, and cleanup-before-deletion ordering synthetics in both Story plans.
- [x] [Review][Patch] Reject exact seal `05ccde49eeeae3076401b5442d2b55b4aea7297c`; capture every authoritative Git absence, cleanliness, and manifest query under an explicit failure guard before testing or composition, and cover invalid-repository/missing-remote failure before cleanup, retirement, publication, and successor-authorization mutations.
- RED-manifest review: pending.
- Backend adversarial review pass 1: pending.
- Backend fresh verifier review pass 2: pending.

### Backend Validation Evidence

Pending RED → GREEN implementation. Required final gates:

```text
npm run format:check
npm run lint:check
npm run type-check
npm test -- --runInBand
npm run test:e2e
npm run build
npm run check:endpoint-drift
npm run docs:validate
git diff --check
```

### PR, Merge, and Cleanup Evidence

- Backend feature commit: pending.
- Backend PR URL/number: pending.
- Pre-merge PR identity plus atomic --match-head-commit: pending.
- Backend merge SHA: pending.
- Merge ancestry on refreshed backend `origin/main`: pending.
- Cleanup consumed the exact recorded PR number: pending.
- Ambiguous PR-create recovery proved exact zero-or-one repository/base/head/head-SHA identity and atomically persisted PR number/URL/feature SHA before merge: pending.
- Remote ref equality (`<reviewed-feature-SHA>\trefs/heads/<Story-branch>`) before any present-remote deletion: pending.
- Already-absent remote handling, if applicable, after exact merged-PR identity and refreshed-`origin/main` ancestry proof: pending.
- Local-main equality/ancestry or exact still-valid foreign-WIP deferral: pending.
- Remote Story branch absence: pending.
- Local Story branch absence: pending.
- Local Story branch compare-and-delete used the expected reviewed feature SHA and rejected concurrent ref advancement: pending.
- Backend Story worktree removal/prune: pending.

### Final Machine-Readable Handoff Record

After the exact backend PR is merged and the backend branch/worktree have been removed, but while the backend mode-600 reviewed-head, three-line PR, and strict nine-line cleanup-authority records remain retained, run the Story 169.14 frontend final-handoff fence in the exact sequence `create → delivery` or `publish-recovery → cleanup`. The cleanup-authority record was atomically published before backend branch/worktree deletion and binds the exact selected mode plus byte-exact reservation hash to both backend publication-record hashes. The fence creates frontend branch `cdx/epic-169-story-14-final-handoff` in worktree `/private/tmp/wb-repricer-fe-169-14-final-handoff` from verified refreshed frontend `origin/main`, requires two distinct PASS reviews of the exact artifact-only head, semantically authenticates the adjacent payload against cleanup authority before bootstrap/commit, publishes that captured commit with an absence-expecting lease, recovers an ambiguous PR through exact zero-or-one count-checked identity, merges only with `--match-head-commit`, proves handoff commit → exact frontend merge → refreshed frontend `origin/main`, and removes the exact branch/worktree with restartable record-driven cleanup.

The durable payload deliberately cannot self-record its own handoff commit/tree, frontend PR number/URL, or frontend merge SHA. Instead, its exact version-3 bytes bind the frontend repository/base/static PR topology, both final-handoff reviewer identities/PASS dispositions, and the SHA-256 of all three retained backend records. Separate mode-600 frontend reviewed-head and PR records bind those committed bytes to the exact handoff commit/tree and exact frontend PR/head/merge. Backend `record-retirement` authenticates all five records, the committed payload, both Git/GitHub topologies, and both merge chains before deleting all five records. Canonical Story/sprint reconciliation follows that delayed cross-bound retirement and cannot weaken or amend the twice-reviewed handoff commit.

The record contains exactly the following 30 nonempty keys once finalized. `STORY_169_14_BACKEND_MAIN_MODE` is `clean-local-main` or `recorded-origin-deferral`. The foreign-WIP payload is canonical sorted unique nonempty newline-delimited bytes exactly authenticated by backend cleanup for deferral, or the byte-exact file `NONE\n` for clean local main; hash its complete file bytes, including the final LF. The parser rejects empty, blank-line, unsorted, duplicate, foreign-self-hashed, or mode-incompatible payloads before review-bootstrap publication or commit.

The finalized record schema uses these exact 30 ordered assignments:

1. `STORY_169_14_FINAL_HANDOFF_RECORD_VERSION=3`
2. `STORY_169_14_BACKEND_REPOSITORY=salacoste/wb-erp-system-daytona`
3. `STORY_169_14_BACKEND_BASE_SHA=<40-lowercase-hex>`
4. `STORY_169_14_EVIDENCE_COMMIT_SHA=<40-lowercase-hex>`
5. `STORY_169_14_FEATURE_SHA=<40-lowercase-hex>`
6. `STORY_169_14_FEATURE_TREE_SHA=<40-lowercase-hex>`
7. `STORY_169_14_FROZEN_MANIFEST_SHA256=<64-lowercase-hex>`
8. `STORY_169_14_REVIEW_PASS_1_ID=<nonempty>`
9. `STORY_169_14_REVIEW_PASS_1_DISPOSITION=PASS`
10. `STORY_169_14_REVIEW_PASS_2_ID=<distinct-nonempty>`
11. `STORY_169_14_REVIEW_PASS_2_DISPOSITION=PASS`
12. `STORY_169_14_PR_NUMBER=<positive-decimal>`
13. `STORY_169_14_PR_URL=https://github.com/salacoste/wb-erp-system-daytona/pull/<same-number>`
14. `STORY_169_14_MERGE_SHA=<40-lowercase-hex>`
15. `STORY_169_14_BACKEND_MAIN_MODE=<clean-local-main-or-recorded-origin-deferral>`
16. `STORY_169_14_FOREIGN_WIP_PATHS_SHA256=<64-lowercase-hex>`
17. `STORY_169_14_BRANCH_WORKTREE_CLEANUP_DISPOSITION=PASS`
18. `STORY_169_14_FRONTEND_REPOSITORY=salacoste/wb-erp-system-daytona-FE`
19. `STORY_169_14_FINAL_HANDOFF_FRONTEND_BASE_SHA=<40-lowercase-hex>`
20. `STORY_169_14_FINAL_HANDOFF_ARTIFACT=_bmad-output/implementation-artifacts/169-14-fe-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`
21. `STORY_169_14_FINAL_HANDOFF_PR_BASE_BRANCH=main`
22. `STORY_169_14_FINAL_HANDOFF_PR_HEAD_BRANCH=cdx/epic-169-story-14-final-handoff`
23. `STORY_169_14_FINAL_HANDOFF_REVIEW_PASS_1_ID=<nonempty>`
24. `STORY_169_14_FINAL_HANDOFF_REVIEW_PASS_1_DISPOSITION=PASS`
25. `STORY_169_14_FINAL_HANDOFF_REVIEW_PASS_2_ID=<distinct-nonempty>`
26. `STORY_169_14_FINAL_HANDOFF_REVIEW_PASS_2_DISPOSITION=PASS`
27. `STORY_169_14_BACKEND_REVIEWED_HEAD_RECORD_SHA256=<64-lowercase-hex>`
28. `STORY_169_14_BACKEND_PR_RECORD_SHA256=<64-lowercase-hex>`
29. `STORY_169_14_BACKEND_CLEANUP_AUTHORITY_RECORD_SHA256=<64-lowercase-hex>`
30. `STORY_169_14_EPHEMERAL_RECORDS_DISPOSITION=RETAINED_UNTIL_CROSS_BOUND_VERIFIED`

<!-- STORY_169_14_FINAL_HANDOFF_RECORD:START -->

PENDING — replace with the exact 30-line version-3 final handoff record
<!-- STORY_169_14_FINAL_HANDOFF_RECORD:END -->

<!-- STORY_169_14_FINAL_FOREIGN_WIP_PATHS:START -->

PENDING — replace with exact sorted paths or NONE
<!-- STORY_169_14_FINAL_FOREIGN_WIP_PATHS:END -->

### Story 169.15 Handoff Contract

Before its first implementation edit, Story 169.15 must commit all required markers and delimiters. The evidence-only commit must be the single-parent direct child of `STORY_169_15_BASE_SHA`, change exactly the ignored Story artifact, and pass nonzero-RED/hash/reviewer/manifest validation. One global exact-order/no-cross-nesting state machine must reject duplicate, mismatched, reordered, and unclosed markers before retained RED, reviewer, and manifest payloads are extracted to files; all three hashes are recomputed from committed file bytes. Evidence-preflight, delivery, and publish recovery must each authorize the extracted blank-line-stripped canonical nonempty manifest as a subset of the static allowed manifest and prove the Story evidence-artifact path is excluded. The same non-echoing credential-header/Bearer-Basic/assignment/private-key/credential-bearing-URI scan applies, and the committed, hashed retained reviewer payload must contain exactly one complete `STORY_169_15_PRIVACY_REVIEW_DISPOSITION: PASS` line; missing or duplicate lines fail closed.

Before Story 169.15 creates its worktree, it must fetch the frontend repository, read this exact final handoff record and foreign-WIP payload from the recorded committed object, strict-parse both, and independently reconstruct the complete strict nine-line cleanup-authority bytes from the committed backend repository, exact static backend Story branch/worktree, retained reviewed-head/PR hashes, backend-main mode, foreign-WIP hash, version, and `PASS` authorization. The complete reconstructed-byte SHA-256 must equal the committed cleanup-authority-record hash; executable synthetics require the valid reconstruction to pass and every changed field or expected hash to fail. It then independently authenticates the mode-specific payload: clean mode accepts only byte-exact `NONE\n`, while deferral rejects empty, whitespace-blank, unsorted, or duplicate payloads and accepts only exact canonical sorted-unique nonempty bytes. It proves the actual handoff commit parent equals the recorded frontend base, independently queries the exact merged frontend handoff PR and exact merged backend Story PR, validates both repository/base/head/head-SHA/URL/merge topologies, and proves handoff commit → exact frontend merge → refreshed frontend `origin/main` plus reviewed backend feature → exact backend merge → refreshed backend `origin/main`. It then authenticates the recorded Story 169.14 evidence commit as a single-parent artifact-only ancestor, reads that exact artifact with `git show`, globally validates and extracts its RED/reviewer/manifest blocks, recomputes their hashes directly, reapplies the suffix-aware privacy scan, authorizes the frozen manifest against Story 169.14's allowed/required sets, and requires byte/hash equality with the real backend base-to-feature manifest. It also proves all five retired source records, both Story branches/worktrees, and the retirement transaction are absent. Every expected-absent record, bootstrap, transaction, and exact worktree path must be both nonexistent and non-symlinked, with dangling-symlink rejection covered by an executable synthetic. Environment inputs are expected-value assertions only and cannot substitute for committed handoff bytes, Git objects, GitHub topology, or cleanup authority.

Before its first push, Story 169.15 atomically publishes a mode-600 reviewed-head record binding exact base/evidence/feature/direct-parent/tree/cumulative-manifest/two-review truth and creates the remote branch for that captured feature commit object only with an absence-expecting lease. Separately, it creates or byte-validates the exact ten-line lifecycle record with `STORY_169_15_MERGE_SHA=PENDING`; recovery validates an existing PENDING record and its recorded OPEN PR before any remote mutation, merges with --match-head-commit, verifies the exact merged PR, and finalizes only if the existing bytes are the exact matching PENDING record. A finalized record routes directly to restartable cleanup. Cleanup consumes and removes both records only after exact feature → merge → refreshed-origin ancestry and exact PR identity proof, and it uses lease-protected deletion.

## File List

Frontend preflight correction owns exactly:

- `.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`;
- `.omx/plans/169.15-align-shared-frontend-paid-storage-import-boundary.md`;
- `.omx/plans/shadcn-full-ui-migration-master.md`;
- `_bmad-output/implementation-artifacts/169-14-fe-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`;
- `_bmad-output/implementation-artifacts/sprint-status.yaml`;
- `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md`;
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`;
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-24-story-169-14-preflight-correction.md`.

The final backend File List is pending the honest RED freeze and must equal the committed Frozen Reviewed Manifest exactly.

## Change Log

- 2026-08-26: Exact-SHA Review A rejected seal `05ccde49eeeae3076401b5442d2b55b4aea7297c` because failed Git command substitutions could be converted to successful empty-output assertions by outer `test -z` or `printf` commands. Repaired every affected branch, remote-ref, status, diff, and untracked-file query with independent explicit failure capture; added executable invalid-repository/missing-remote regressions proving cleanup, retirement, artifact-publication, and Story 169.15 authorization mutations remain unreachable on failure. The rejected seal and all reviews over it are superseded; validation and two fresh exact-SHA reviews restart from a new empty seal.
- 2026-08-26: Closed the rejected-seal scope findings by adding explicit `--no-renames` to all nineteen scope-bearing staged, unstaged, committed, cumulative, delivery, recovery, handoff, retirement, and cleanup manifest enumerations across Stories 169.14 and 169.15. Executable forbidden-source → allowed-destination synthetics now prove the default control view hides the forbidden deletion, the hardened staged/three-dot/two-endpoint views expose both paths, and the real manifest-authorization semantics reject the result. The correction proposal records the new invariant; seal `dc821ce81df85726334e7fc28c238716dd1f7549` and every review over it remain superseded, so the complete validation suite and two independent exact-SHA reviews must run against a new empty seal.
- 2026-08-26: Forward-ported the complete eight-file correction after Story 171.9 and the Epic 171 closeout, preserving canonical readiness at 56/94, Epic 171 closed at 9/9, Program NEXT Story 172.1, the Remaining chain beginning with paid storage 169.14 → 169.15 → 169.12 closeout before Story 172.1, and the 19 281/0 Vitest floor. Exact-SHA Pass B rejected seal `dc821ce81df85726334e7fc28c238716dd1f7549` with one HIGH rename-accounting scope bypass and one MEDIUM Remaining-order contradiction; that seal and its earlier Pass A are superseded, and validation plus both independent exact-SHA reviews must restart from a new empty seal after repair.
- 2026-08-26: Forward-ported the complete eight-file correction again after the merged Story 171.8 closeout, preserving canonical readiness at 55/94, Epic 170 closed at 7/7, Epic 171 at 8/9, Program NEXT Story 171.9, the Remaining chain beginning at 171.9, and the 19 271/0 Vitest floor. The prior post-171.7 seal is superseded; validation and both independent exact-SHA reviews must restart from a new empty seal.
- 2026-08-26: Forward-ported the complete eight-file correction onto current frontend `main` after the merged Story 171.7 closeout, preserving canonical readiness at 54/94, Epic 171 at 7/9, Program NEXT Story 171.8, and the 19 263/0 Vitest floor. The prior post-171.6 seal is superseded; validation and both independent exact-SHA reviews must restart from a new empty seal.
- 2026-08-26: Fresh exact-SHA review repair authenticates the backend fetch/push endpoint pair inside the standalone frontend final-handoff fence; makes Story 169.14 and Story 169.15 collision/WIP/incoming/divergence inventories rename-source-safe with `--no-renames`; separates GitHub PR file-object counts from collision candidates built from both `filename` and `previous_filename`; and rejects ignored dangling symlinks at the Story 169.15 evidence-artifact path. Executable rename-away, PR-normalization, and ignored-symlink synthetics lock the repairs; both exact-SHA reviews must restart from a new seal.
- 2026-08-26: Forward-ported the correction onto current frontend `main` after Story 171.6, preserving the canonical 53/94 program snapshot, Epic 171 at 6/9, Program NEXT Story 171.7, and the 19 253/0 Vitest floor. Corrected the universal lifecycle narrative from "both" backend records to all three retained backend records plus both frontend final-handoff records—all five authenticated cross-bound sources—and invalidated the prior seal so two fresh exact-SHA reviews are required.
- 2026-08-26: Exact-SHA review repair binds backend PR `headRefName` and `headRefOid` together, rejects live or dangling symlink substitution for lifecycle records/worktrees, requires all present authority records to be regular non-symlink mode-600 files, and adds executable topology plus mutation-order synthetics to both Story plans.
- 2026-08-26: Follow-up lifecycle repair makes Story 169.15 independently reconstruct and hash the exact strict nine-line cleanup authority from committed/static authoritative fields before worktree creation, proves every changed field/hash fails, executes the clean/empty/whitespace-blank/unsorted/duplicate/canonical payload matrix, and rejects dangling symlinks at all expected-absent record/bootstrap/transaction/worktree paths.
- 2026-08-26: Accepted medium lifecycle repair publishes strict mode-600 cleanup authority before backend branch/worktree deletion, semantically authenticates clean `NONE\n` or canonical deferred foreign-WIP bytes before final-handoff bootstrap/commit, upgrades the durable schema to version 3 with 30 lines, binds the authority hash through frontend lifecycle records, expands delayed retirement to a strict 48-line five-source transaction, and makes Story 169.15 verify the committed authority hash plus record absence.
- 2026-08-26: Third exact-SHA correction replaced the prose-only frontend handoff with executable restartable `create | delivery | publish-recovery | cleanup` phases, the superseded version-2 29-line durable schema, separate frontend reviewed-head/PR records, exact frontend PR/head/merge proof, and delayed four-record cross-bound retirement. Both privacy scanners reject suffix-aware prefixed credential names across all seven assignment operators, and Story 169.15 independently reauthenticates the predecessor evidence commit, retained hashes, authorized manifest, real backend diff, frontend final-handoff PR lineage, and cleanup absence before worktree creation.
- 2026-08-25: Second exact-SHA correction makes evidence-preflight authorize the committed canonical nonempty manifest before success—Story 169.14 requires an allowed subset containing every required path, while Story 169.15 requires a static-allowlist subset excluding its evidence artifact—and retains the same gate for delivery/recovery. It expands the non-echoing privacy scan to credential-bearing headers, Bearer/Basic values, supported plain/compound assignments, private keys, and credential-bearing URI userinfo; each Story's exact unique privacy line now lives inside the committed and hashed reviewer payload, with missing/duplicate attestations rejected.
- 2026-08-25: Historical exact-SHA review iteration enumerated BullMQ state mapping with fail-closed `UNKNOWN_QUEUE_STATE`; added global cross-type marker validation, retained RED/reviewer byte hashing, sensitive-evidence rejection, create-only absence-leased publication, restartable record-driven cleanup, direct feature-to-merge ancestry, the then-current 18-line artifact-only final handoff, two-phase record retirement, and Story 169.15 committed-handoff/PR/topology/cleanup authentication. This historical handoff model was first superseded by the 2026-08-26 version-2 29-line/four-record lifecycle and is now superseded by the version-3 30-line/five-source lifecycle above; it is not current delivery authority. Story status remains `in-progress` until record retirement and canonical reconciliation.
- 2026-08-25: Accepted review correction binds both Stories' publish recovery to atomically published mode-600 reviewed-head records and direct single-parent feature topology; makes Story 169.14's three-line PR record adjacent-temp create-or-byte-identical; makes Story 169.15's ten-line PENDING lifecycle create-or-identical, exact-byte/recorded-OPEN-PR validated before remote mutation, and finalization exact-PENDING-only; pushes captured commit objects explicitly; makes cleanup remove exact records only after merge/ancestry proof; and defines strict file-based marker extraction with trailing-LF-preserving payload hashes.
- 2026-08-24: Story moved to `in-progress`; created the durable cross-repository delivery record; corrected verified-base handling for protected foreign WIP; authorized the necessary `CabinetGuard` import plus method-level shared Excel/paid-storage polling isolation and related OpenAPI decorators with Excel regression evidence; made collision, single-parent artifact-only evidence, retained RED/reviewer byte hashing, ambiguous PR recovery, reviewed-head merge, and compare-and-delete cleanup provenance fail closed; backend Story worktree and production edits remain blocked until this docs package merges, honest RED is retained, and the frozen reviewed manifest plus SHA-256 are committed here.
