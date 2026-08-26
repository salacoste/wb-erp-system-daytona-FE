# Sprint Change Proposal — Story 169.14 Preflight and Polling-Isolation Correction

**Date:** 2026-08-24

**Decision:** Approved for autonomous execution under the previously approved Batch Correct Course authority

**Affected DAG:** Story 169.14 → Story 169.15 → Story 169.12 contract closeout

**Change class:** narrow documentation, execution-lifecycle, and backend ownership correction

**Route-ledger impact:** none; the authoritative 76-route mapping remains unchanged

## 1. Change trigger

Fresh Story 169.14 preflight found three execution-contract gaps before any backend Story worktree or production edit was created:

1. The approved plan requires the exact post-RED reviewed backend manifest to be durably recorded before the first production edit, but no Story 169.14 implementation artifact exists.
2. Backend local `main` cannot be safely fast-forwarded because foreign OpenWiki WIP overlaps the newest remote OpenWiki commit, although every Story-owned backend path is clean and non-overlapping.
3. Paid-storage lifecycle polling uses the shared Excel/paid-storage `GET /v1/imports/:id` method in `src/imports/imports.controller.ts`. The current Story manifest does not permit the necessary top-of-file `CabinetGuard` import, method-level guard, and directly related OpenAPI correction required to bind `X-Cabinet-Id` to JWT claims and document both job-ID forms truthfully.

These are orchestration and security-ownership defects in the approved execution package. They do not change the Story outcome, introduce a new product feature, alter the 76-route ledger, or authorize deployment/production work.

Subsequent exact-SHA adversarial review also found lifecycle-integrity defects in the first correction draft: independent marker extractors permitted cross-type nesting; Story 169.15 did not recompute retained RED/reviewer payload hashes; BullMQ `unknown` was treated as normal pending work; first publication could take over a foreign fast-forwardable branch; cleanup could not restart after worktree deletion; Story 169.14 removed its only durable lifecycle records before publishing a trusted successor; and Story 169.15 trusted caller-supplied prerequisite values without authenticating the exact backend PR/topology/cleanup. A later independent exact-SHA pair found three remaining blockers: frontend final-handoff publication was prose-only rather than executable and restartable; both evidence scanners missed common prefixed credential variables and Story 169.15 omitted `-=`; and Story 169.15 shape-checked predecessor evidence values without independently authenticating the exact evidence commit, retained payload hashes, authorized backend manifest, real backend diff, or frontend final-handoff PR/base/head/merge lineage. The accepted medium follow-up found that final-handoff delivery still trusted the adjacent foreign-WIP payload only through its self-declared hash and enum, while exact reservation comparison occurred only during later record retirement. The corrected package closes that precommit authority gap with a retained cleanup record and executable semantic matrix while preserving one serialized lifecycle leader and the approved product scope.

The post-Story-171.8 exact-SHA Pass B then found a final scope-accounting bypass: nineteen staged, unstaged, cumulative, delivery, recovery, retirement, and cleanup manifest enumerations still used Git's default rename detection. A forbidden tracked source renamed byte-for-byte into an allowed destination could therefore appear as only the allowed destination and pass an exact allowlist comparison. The replacement correction requires explicit `--no-renames` on every scope-bearing path enumeration and executable forbidden-source → allowed-destination synthetics that prove the vulnerable control view folds the rename while the production staged, three-dot cumulative, and two-endpoint final views expose both paths and fail authorization. The same review also rejected the latest Story artifact's false Remaining-order statement; the current baseline is 56/94, Epic 171 closed at 9/9, Program NEXT Story 172.1, with the paid-storage chain first in the global Remaining order.

Exact-SHA Review A then rejected replacement seal `05ccde49eeeae3076401b5442d2b55b4aea7297c` because Bash `errexit` does not propagate a failed Git command substitution through a successful outer `test -z` or `printf`. A failing `branch --list`, `ls-remote`, `status --porcelain`, `diff`, or `ls-files` query could therefore be misclassified as branch absence, remote absence, worktree cleanliness, or an empty manifest and authorize cleanup, record retirement, or successor startup. The repaired contract captures every authoritative Git query independently inside an explicit `if ! OUTPUT="$(git ...)"; then exit 71; fi` guard before evaluating its output. Executable failure synthetics use invalid repositories/remotes and prove that worktree/branch removal, cleanup-complete publication, source-record deletion, artifact publication, and Story 169.15 authorization markers remain unreachable when any query fails. The rejected seal and every review over it are superseded.

## 2. Evidence

### 2.1 Repository and base evidence

- Backend repository: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new`.
- Exact backend GitHub identity: `salacoste/wb-erp-system-daytona`.
- Exact frontend GitHub identity: `salacoste/wb-erp-system-daytona-FE`.
- Backend local `main`: `e8cff608da1aa87e1c482a68566e8ba824fe1e2d`.
- Refreshed backend `origin/main`: `25b41be67f9f7e3b0aa6e8081f741b263dbecd64`.
- Local `main` is an ancestor of refreshed `origin/main`.
- The incoming commit is `25b41be67` (`docs: update backend OpenWiki [skip ci]`).
- Exact incoming paths that overlap foreign local WIP:
  - `openwiki/.last-update.json`;
  - `openwiki/workflows/fe-shadcn-migration.md`.
- Other foreign WIP remains under `frontend/**`, `openwiki/**`, and two untracked `.env.bak-*` files. It is outside the Story-owned backend manifest.
- No Story 169.14 backend branch, worktree, open PR, or overlapping Story-owned path was found during preflight. The corrected immediate-pre-creation gate must fail closed across staged, unstaged, and untracked WIP plus clean committed divergence in every linked worktree; committed Story-path divergence in every clean unattached local branch; and changed-file overlap from open PRs. GitHub list results at the configured limit are rejected as potentially truncated. Every open PR file list is fully enumerated with `gh api --paginate`, and its enumerated count must equal the authoritative `changedFiles` count before overlap comparison.

The primary backend checkout and local `main` ref must therefore remain untouched. Stash, temporary commit, reset, restore, clean, or any other mutation of the foreign WIP is forbidden.

### 2.2 Current contract evidence

- `PaidStorageImportRequestDto` accepts only `dateFrom` and `dateTo`.
- Production `ValidationPipe` uses `whitelist: true` and `forbidNonWhitelisted: true`; undocumented snake-case aliases are rejected and must not be added.
- Both manual and smart accepted starts currently return undocumented `queued`.
- Manual start currently fabricates `rows_imported: 0` before completion.
- The paid-storage processor already returns authoritative `rowsImported`; processor and orchestration semantics do not need modification.
- The status builder maps `completed`, `failed`, and `active` explicitly, but its broad default currently treats every other BullMQ result as `pending` and drops `job.returnvalue.rowsImported`. The corrected contract maps `waiting | delayed | prioritized | waiting-children` to `pending`, maps `active` to `processing`, preserves the terminal meanings, and fails closed when BullMQ returns its explicit `unknown` state by returning wire `failed` with sanitized `UNKNOWN_QUEUE_STATE` detail.
- Failure detail is already preserved as a nested `error` object.
- The generic polling service already compares `job.data.cabinet_id` with the requested cabinet header and returns an indistinguishable 404 for mismatch/unknown jobs.

### 2.3 Security ownership evidence

Both paid-storage start and generic polling currently use `JwtAuthGuard` without `CabinetGuard`. A caller whose JWT is scoped to cabinet A can supply cabinet B in `X-Cabinet-Id`; if it knows cabinet B's paid-storage job ID, the generic service comparison alone is insufficient to bind the header to the JWT claims.

The minimum correction is:

- apply `CabinetGuard` to the paid-storage controller boundary;
- permit the necessary top-of-file `CabinetGuard` import plus method-level guard and directly related Swagger decorator hunks on the shared Excel/paid-storage `GET /v1/imports/:id` method in `src/imports/imports.controller.ts`;
- add a direct controller/guard/OpenAPI contract spec at `src/imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts`, including authorized same-cabinet Excel regression evidence;
- keep `src/imports/imports.service.ts` read-only because its paid-storage job-to-header comparison is already correct;
- acknowledge the intentional authorization hardening for every job type polled through that shared method while preserving authorized same-cabinet Excel runtime shape/lifecycle;
- forbid changes to the shared handler body, unrelated methods, or a class-wide `CabinetGuard` on the generic controller.

## 3. Impact analysis

### 3.1 Story 169.14

Story 169.14 moves from `backlog` to `in-progress`. Its product outcome remains one authoritative paid-storage request/start/poll/result/error contract with current all-or-failure processing semantics.

The canonical frontend implementation artifact becomes the durable cross-repository delivery record:

`_bmad-output/implementation-artifacts/169-14-fe-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`

After honest backend RED and before the first backend production edit, a separate frontend documentation commit/PR must update that artifact with:

- exact local-main, refreshed-origin-main, and actual Story-base SHAs;
- exact foreign-WIP reservation and fresh no-overlap proof;
- exact RED commands, exit codes, and behavioral failures;
- reviewer identity and disposition;
- exact sorted newline-delimited frozen backend manifest and its SHA-256, bound to an exact single-parent artifact-only evidence commit, verified by reading the committed artifact with `git show <evidence-commit>:<artifact>`, and authorized before evidence-preflight success as a canonical nonempty subset of the Story 169.14 allowed manifest containing every required path; delivery and publish recovery retain the same gate;
- immutable nonempty retained blocks inside the committed artifact containing the complete behavioral RED output and independent reviewer evidence. Read the artifact into a file and run one global exact-order marker state machine before extraction; it rejects duplicate markers, same-type or cross-type nesting, mismatched or early END markers, reordered blocks, and unclosed blocks. Canonical payload bytes exclude delimiter lines and contain one LF per complete payload line, including all trailing blank payload lines; extract RED, reviewer, and manifest payloads to files and recompute every committed SHA-256 directly from those bytes so command substitution cannot strip data.

The commit must contain exactly one each of `STORY_169_14_BACKEND_BASE_SHA`, `STORY_169_14_RED_CLASSIFICATION: BEHAVIORAL_CONTRACT_FAILURE`, `STORY_169_14_RED_COMMAND`, `STORY_169_14_RED_EXIT_CODE`, `STORY_169_14_RED_OUTPUT_SHA256`, `STORY_169_14_PRE_IMPLEMENTATION_REVIEWER_ID`, `STORY_169_14_PRE_IMPLEMENTATION_REVIEW_DISPOSITION: PASS`, `STORY_169_14_REVIEWED_MANIFEST_SHA256`, `STORY_169_14_REVIEW_EVIDENCE_SHA256`, and `STORY_169_14_FROZEN_MANIFEST_SHA256`, plus exact retained blocks delimited by `<!-- STORY_169_14_RETAINED_RED_OUTPUT:START -->` / `:END -->`, `<!-- STORY_169_14_RETAINED_REVIEW_EVIDENCE:START -->` / `:END -->`, and the manifest block `<!-- STORY_169_14_FROZEN_REVIEWED_MANIFEST:START -->` / `:END -->`. Fetch the exact frontend origin, assert `salacoste/wb-erp-system-daytona-FE`, prove the evidence commit is a single-parent direct artifact-only change reachable from refreshed frontend `origin/main`, and only then re-read the committed artifact. The nonzero RED exit, byte-recomputed committed RED/reviewer/manifest hashes, 64-character lowercase hashes, constrained reviewer identity, identical reviewed/frozen hashes, and canonical nonempty sorted newline-delimited allowed/required manifest are executable gates. RED and review fixtures use synthetic identities and sanitized logging. A non-echoing sensitive-byte scan rejects common credential-bearing headers, Bearer/Basic values, private-key material, credential-bearing URI userinfo, and suffix-aware conventional prefixed credential assignments. Assignment operators are exactly `=`, `:=`, `+=`, `-=`, `?=`, `&&=`, and `||=`; the covered families include password/passwd, secret, token, auth/access/refresh tokens, client secret, API key, credential(s), AWS secret-access-key/access-key-ID, and the protected header names. Mandatory synthetics reject `DATABASE_PASSWORD=`, `OPENAI_API_KEY:=`, `GH_TOKEN+=`, `JWT_SECRET-=`, `AWS_ACCESS_KEY_ID?=`, `X_AUTH_TOKEN&&=`, and `service-refresh-token||=`, while benign prose such as `OPENAI_API_KEY field omitted` remains allowed. The independently authored retained reviewer payload must contain exactly one complete `STORY_169_14_PRIVACY_REVIEW_ATTESTATION: PASS_NO_SECRET_OR_CUSTOMER_PII` line inside the committed bytes covered by `STORY_169_14_REVIEW_EVIDENCE_SHA256`; missing or duplicate attestations fail closed. The independent reviewer confirms that no secret, customer, or PII bytes are retained. Repair the evidence emitter and rerun instead of redacting already-hashed evidence.

An environment variable containing an unverified hash, an unvalidated temporary file, later final diff, PR body, commit message, or backend-local untracked note is not equivalent evidence. The executable gate must extract the retained immutable RED/reviewer blocks and frozen manifest to files from the committed artifact, enforce exact marker order/closure, recompute hashes without command substitution, and bind them to the exact committed markers.

Exactly one serialized Story leader executes delivery, publish recovery, and cleanup; concurrent lifecycle-fence invocations are outside the supported contract. After both final reviews and before the final feature commit, Story 169.14 atomically publishes mode-600 `story-169-14-review-bootstrap-v1` in the backend Git common directory. It binds the exact repository, reviewed parent/tree, frontend evidence commit, frozen-manifest hash, and both final reviewer identities/PASS dispositions. A crash after bootstrap publication resumes only from byte-identical precommit authority; a crash after commit but before reviewed-head publication must reauthenticate the commit's direct parent/tree/manifest/reviewers and remote absence from that bootstrap. Missing, foreign, malformed, wrong-mode, or symlinked bootstrap state fails closed. The resulting reviewed-head record is cross-checked against the bootstrap, then the bootstrap is deleted and proven absent before first push. First publication reads the exact remote ref, requires absence, and creates the branch with an absence-expecting lease; recovery either creates an absent ref with the same lease, skips a ref already equal to the recorded feature SHA, or fails on any other value. This create-if-absent lease prevents takeover of a foreign fast-forwardable branch and does not authorize history rewriting. Delivery pushes the captured feature object explicitly. REST all-state enumeration combines lowercase REST `state` with `merged_at`, normalizes only `OPEN | MERGED | CLOSED_UNMERGED`, re-reads after creation, rejects closed-unmerged/invalid outcomes, and does not issue a second merge for an exact already merged PR. The distinct three-line PR record is created through an adjacent temp file or validated byte-for-byte if already present.

Story 169.14 backend cleanup is record-driven and restartable after its worktree or local branch is already absent. It proves the reviewed feature is an ancestor of the exact merge and that the merge is an ancestor of refreshed backend `origin/main`; existing local/remote refs must equal the recorded feature before compare-and-delete. After validating clean-local-main as byte-exact `NONE\n`, or recorded-origin-deferral as canonical sorted unique nonempty newline-delimited reservation bytes exactly equal to current authenticated cleanup overlap, the `branch-worktree` phase atomically publishes the strict nine-line mode-600 `story-169-14-branch-worktree-cleanup-authority-v1`. That create-or-byte-identical record binds both backend publication-record hashes, exact branch/worktree identity, selected mode, reservation hash, and deletion authorization before any backend branch/worktree deletion. The phase then removes the exact branch/worktree but retains all three backend mode-600 records.

It then runs a separate executable frontend final-handoff lifecycle with phases `create`, `delivery`, `publish-recovery`, and `cleanup`. That lifecycle creates the dedicated frontend lane from verified refreshed `origin/main`, requires two distinct PASS reviews of the exact artifact-only head, and before bootstrap/commit strict-parses the retained cleanup authority plus adjacent payload. Clean-local-main accepts only byte-exact `NONE\n`; recorded-origin-deferral accepts only canonical sorted unique nonempty newline-delimited bytes whose complete SHA-256 equals the cleanup authority. Empty, blank-line, unsorted, duplicate, and foreign self-hashed payloads fail closed. The lifecycle publishes mode-600 `story-169-14-final-handoff-review-bootstrap-v1` before the final commit, binds the cleanup-authority hash through bootstrap/reviewed-head/PR records, closes the same commit-before-reviewed-head crash window, consumes the bootstrap before first push, publishes the captured commit through an absence-expecting lease, recovers an ambiguous PR through count-checked exact zero-or-one normalized REST identity, merges only an exact `OPEN` PR with `--match-head-commit`, skips re-merge for exact `MERGED`, proves handoff commit → exact frontend merge → refreshed frontend `origin/main`, and removes the exact branch/worktree through restartable record-driven cleanup. The committed artifact contains an ordered 30-line version-3 record plus the authenticated adjacent foreign-WIP payload.

The durable record binds the frontend repository, exact pre-commit frontend base, static `main`/handoff-branch/artifact topology, two final-handoff reviewer identities/PASS dispositions, all three backend record hashes, and `RETAINED_UNTIL_CROSS_BOUND_VERIFIED`. It deliberately does not self-reference its own commit/tree or not-yet-created frontend PR/merge. Separate mode-600 frontend reviewed-head and PR records bind the committed payload to the exact handoff commit/tree and exact frontend PR/head/merge. Only the later backend `record-retirement` phase may publish and authenticate the strict self-contained 48-line mode-600 `story-169-14-record-retirement-transaction-v1` before deleting any source. The transaction binds both repositories, reviewed bases/evidence/commits/trees/manifests/artifact/reviewer pairs, both exact PR topologies/merges, recorded-main ancestry, all five source paths/hashes, the exact deletion set, and cleanup proof. Recovery reruns live Git/GitHub topology and validates every transaction-bound source SHA-256 as exactly 64 lowercase hexadecimal characters before considering source existence. It accepts each source only as exact-present or already absent under the authenticated transaction; malformed bound hashes fail closed in either state, and executable synthetics cover malformed and valid hashes with sources present and absent. Malformed/reordered/extra/missing fields, wrong mode/type, symlink, foreign hash, or topology drift fail before further deletion. The transaction is removed only after all five sources are proven absent; only then may Story/sprint status reconcile. Story 169.14 does not use a PENDING/final lifecycle-record transition.

### 3.2 Story 169.15

Story 169.15 accepts the caller-supplied Story 169.14 final-handoff commit SHA only as an expected-value assertion. Before it creates a worktree or trusts the backend prerequisite, it fetches verified frontend `origin/main`, proves that exact commit is a direct single-parent artifact-only ancestor whose actual parent equals the committed frontend-base field, and strict-parses the committed 30-line version-3 record plus adjacent cleanup-authenticated foreign-WIP payload from the exact artifact object. It independently reconstructs the complete strict nine-line cleanup-authority bytes from the committed backend repository, exact static Story branch/worktree, retained reviewed-head/PR hashes, backend-main mode, foreign-WIP hash, version, and `PASS` authorization, then requires the complete-byte SHA-256 to equal the committed cleanup-authority hash. Executable synthetics prove the valid reconstruction, reject every changed field or expected hash, require byte-exact clean `NONE\n`, reject empty/whitespace-blank/unsorted/duplicate deferrals, and accept the exact canonical deferral. Environment-only base, review, merge, branch, cleanup, record-hash, or foreign-WIP values are not authority.

A clean local-backend-`main` fast-forward and equality/ancestry proof remain preferred. Local-main equality/ancestry may be deferred only while the same exact recorded foreign-WIP reservation remains current, local `main` remains an ancestor of refreshed `origin/main`, and a fresh collision check proves no overlap. The primary checkout, foreign WIP, and local `main` ref must remain untouched.

The Story 169.15 prerequisite fence validates both publication paths independently. For the frontend handoff PR it requires repository `salacoste/wb-erp-system-daytona-FE`, `MERGED`, base `main`, the expected handoff branch, exact handoff `headRefOid`, exact URL, non-null merge SHA, and handoff commit → exact frontend merge → refreshed frontend `origin/main`. For the backend PR it authenticates `headRefName` and `headRefOid` together, requiring the exact backend Story branch and reviewed feature SHA as one topology assertion in addition to the exact number, URL, repository, `MERGED` state, `main` base, and merge SHA from the committed handoff; a pure executable synthetic proves that a foreign branch with the identical head OID fails. It then proves feature direct-parent equality to the recorded backend base and feature → exact merge → refreshed backend `origin/main`.

It also authenticates the recorded Story 169.14 evidence commit as a single-parent artifact-only ancestor of both the final-handoff base and refreshed frontend `origin/main`; reads the exact evidence artifact with `git show`; globally validates and extracts the RED/reviewer/manifest blocks; recomputes the direct payload hashes; reapplies the suffix-aware seven-operator privacy scan and unique privacy attestation; authorizes the frozen manifest against Story 169.14's allowed/required sets; and requires exact byte/hash equality with a freshly computed real backend base-to-feature manifest. Finally it proves exact backend and frontend branch/worktree cleanup and absence of all five source records plus retirement transaction. Every expected-absent record, bootstrap, transaction, and exact worktree path is also required to be non-symlinked, so a dangling symlink fails closed; an executable negative synthetic locks that rule. Any deferred local-main proof must still match the committed cleanup-authenticated foreign-WIP payload and current no-overlap evidence.

Before implementation, Story 169.15 commits exact RED/reviewer/manifest evidence in a direct single-parent artifact-only commit. It uses the same global marker validator, retained-byte extraction, direct SHA recomputation for all three payloads, synthetic/sanitized evidence, and non-echoing privacy gate as Story 169.14, including suffix-aware credential families, the exact seven assignment operators, the seven mandatory prefixed negative synthetics, and the benign prose control. Evidence-preflight authorizes the extracted blank-line-stripped canonical nonempty manifest as a subset of the static allowlist and excludes the Story evidence-artifact path; delivery and publish recovery retain the same gate. Its committed and hashed retained reviewer payload contains exactly one complete `STORY_169_15_PRIVACY_REVIEW_DISPOSITION: PASS` line, with missing or duplicate dispositions rejected. After both reviews and before the final feature commit, it atomically publishes mode-600 `story-169-15-review-bootstrap-v1`, binding evidence parent, reviewed tree, cumulative-manifest/evidence hashes, and both reviewer identities/PASS dispositions; post-commit/pre-reviewed-head recovery requires that exact authority and remote absence, and the bootstrap is cross-checked/removed before first push. First branch publication uses the same absence-expecting lease; recovery accepts only absence or exact recorded-SHA equality and rejects a foreign ref. Exact-head PR enumeration is count-checked before creation and after any ambiguous create response; REST state is normalized with `merged_at`, closed-unmerged/invalid rows fail closed, and an already merged exact PR is not merged again. The separate mode-600 ten-line lifecycle record uses create-or-identical `MERGE_SHA=PENDING` publication; an existing PENDING record is byte-validated, bound to the reviewed head/reviewers, and matched to its recorded OPEN PR before any remote mutation; finalization requires the exact matching PENDING bytes before adjacent-temp atomic replacement. A finalized lifecycle record routes to record-driven cleanup. Cleanup publishes the strict self-contained 24-line mode-600 `story-169-15-cleanup-transaction-v1` before deleting either source record. It binds base/evidence/feature/tree/cumulative-manifest/reviewer truth, exact PR/merge/main topology, source paths/hashes, deletion set, and cleanup proof. Recovery reruns live topology and validates each transaction-bound source SHA-256 as exactly 64 lowercase hexadecimal characters before source existence is considered. It accepts each source only as exact-present or already absent under the authenticated transaction; malformed bound hashes fail closed in either state, while executable synthetics cover malformed and valid hashes with sources present and absent. Malformed/reordered/extra/missing fields, wrong mode/type, symlink, foreign hash, or topology drift also fail closed. The transaction is removed only after both sources are proven absent.

Across both Story plans, every present authoritative lifecycle record is required to be a non-symlink regular file with mode `600`; every expected-absent authoritative record, exact Story worktree, bootstrap, and transaction path must be both nonexistent and non-symlinked. A live symlink to an otherwise valid mode-600 target and a dangling symlink at an expected-absent path both fail closed. Executable synthetics independently prove regular-record acceptance/live-symlink rejection, true-absence acceptance/dangling-symlink rejection, and that a residue failure occurs before cleanup-complete proof publication or source-authority deletion.

Across both plans, no authoritative Git query may be nested directly inside an absence/cleanliness assertion or a manifest-composition `printf`. Each query must first be captured under an explicit failure guard, and only a successfully captured value may be tested or combined. Executable invalid-repository and missing-remote synthetics cover `branch --list`, `ls-remote`, `status --porcelain`, `diff --no-renames --name-only`, and `ls-files --others --exclude-standard`, and prove query failure cannot reach any mutation or successor-authorization boundary.

### 3.3 Story 169.12 and route ledger

Story 169.12 remains `review` and blocked on the same prerequisite order. Its already-merged route presentation is preserved. No route-ledger row is added, removed, reassigned, or marked complete by this correction.

## 4. Corrected Story 169.14 backend surface

### Allowed production paths

- `src/imports/controllers/paid-storage-import.controller.ts`;
- only the necessary top-of-file `CabinetGuard` import hunk plus method-level guard and directly related `@ApiParam`, `@ApiOperation`, `@ApiHeader`, and `@ApiResponse` decorator hunks on the shared Excel/paid-storage `GET /v1/imports/:id` boundary in `src/imports/imports.controller.ts`;
- `src/imports/dto/paid-storage-import.dto.ts`, only if honest RED proves a DTO correction is required;
- `src/imports/dto/import-status.dto.ts`, only for the optional paid-storage completion result;
- only the paid-storage result/error projection in `src/imports/services/import-status-builder.service.ts`.

### Allowed direct evidence paths

- `src/imports/controllers/__tests__/paid-storage-import.controller.spec.ts`;
- `src/imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts`;
- `src/imports/services/import-status-builder.service.spec.ts`;
- `test/imports/paid-storage.e2e-spec.ts`;
- `docs/API-PATHS-REFERENCE.md`.

### Explicitly read-only or forbidden

- `src/imports/imports.service.ts`, unless a second honest-RED-driven canonical scope correction is approved before any edit;
- paid-storage processor, orchestration, queue, retry, and storage semantics;
- Prisma schema/migrations;
- the shared polling handler body, unrelated generic-controller methods, or class-wide guard changes;
- frontend runtime source during Story 169.14;
- packages/dependencies;
- deploy, production operations, direct push to `main`, and force-push.

## 5. Corrected lifecycle

```text
merge this docs-only preflight correction
  → fetch backend origin/main and re-run fail-closed collision proof across
    uncommitted/committed linked writers, clean unattached local branches,
    and non-truncated, fully paginated/count-verified open-PR path overlap
  → create backend Story branch/worktree from a clean fast-forwarded local main,
    or from verified origin/main under the recorded foreign-WIP fallback
  → establish baseline and honest RED tests
  → independently review the RED matrix and exact backend manifest
  → commit the exact machine-readable RED/base/reviewer/manifest evidence to the
    trusted frontend Story artifact; globally validate all markers, directly
    recompute retained RED/reviewer/manifest hashes, authorize the canonical
    allowed/required manifest, enforce the exact retained privacy-attestation gate,
    and prove refreshed-origin/main ancestry
  → first backend production edit
  → GREEN, targeted/full gates, scope audit, two fresh reviews
  → publish exact reviewed-head truth, push that captured commit object, prove exact PR identity,
    create the remote branch only with an absence-expecting lease, and create or
    byte-validate Story 169.14's separate three-line PR record
  → merge with --match-head-commit and prove feature → exact merge → refreshed backend origin/main
  → run restartable cleanup phase branch-worktree; authenticate the exact mode/reservation,
    atomically publish its strict nine-line mode-600 cleanup authority before deletion,
    delete through the verified push endpoint with an exact-old-SHA lease, remove the exact
    local branch/worktree, and retain all three backend records
  → run the executable frontend final-handoff create/delivery or publish-recovery/cleanup lifecycle;
    before bootstrap/commit authenticate the adjacent payload against cleanup authority,
    then publish and merge the exact twice-reviewed artifact-only 30-line version-3 handoff,
    retaining separate frontend reviewed-head/PR records
  → run cleanup phase record-retirement; authenticate the committed handoff against
    both exact PR/merge topologies and all five records, then remove all five records
  → reconcile Story/sprint status
  → Story 169.15 may start
```

## 6. Acceptance criteria for this correction

1. Story 169.14 is consistently `in-progress` in its plan, sprint backlog, master snapshot, canonical Epic, and debt registry.
2. The Story 169.14 implementation artifact exists and is the named durable cross-repository delivery record.
3. The local-main preferred path and verified-`origin/main` foreign-WIP fallback are explicit and checkout-independent; collision checks cover uncommitted/committed linked worktrees, clean unattached local branches, and non-truncated fully paginated/count-verified open-PR path overlap under exact backend/frontend repository identities.
4. Story 169.15 authenticates the committed Story 169.14 artifact-only final handoff before worktree creation, strict-parses the exact 30-line version-3 record and adjacent cleanup-authenticated foreign-WIP payload, independently reconstructs and hashes the exact strict nine-line cleanup authority from committed/static authoritative fields, and rejects every changed reconstruction field or expected hash. It proves the handoff commit's actual parent equals the committed frontend base, validates the exact frontend final-handoff PR identity/topology and handoff → merge → refreshed-origin ancestry, and independently validates the exact backend PR/topology and feature → merge → refreshed-origin ancestry. It authenticates the recorded evidence commit as a single-parent artifact-only ancestor, reads the exact committed evidence artifact, globally validates/extracts and directly hashes RED/reviewer/manifest payloads, reapplies the suffix-aware seven-operator privacy gate, authorizes the frozen manifest against Story 169.14's allowed/required sets, and requires exact byte/hash equality with the real backend base-to-feature manifest. It then proves backend and frontend branch/worktree cleanup plus absence of all five retired source records and the transaction, rejecting dangling symlinks at every expected-absent record/bootstrap/transaction/worktree path. Its own lifecycle preserves the recorded-base/foreign-WIP contract; uses retained RED/reviewer/manifest bytes with global marker validation and direct hash recomputation; authorizes the canonical nonempty manifest against its static allowlist while excluding the evidence artifact; requires its exact unique privacy disposition inside the committed and hashed reviewer payload; publishes reviewed-head truth before explicit-object push; uses absence-leased first branch publication; recovers ambiguous PR creation by exact zero-or-one repository/base/head/head-SHA enumeration; creates or validates identical PENDING lifecycle truth before atomic head-matched merge; finalizes only exact matching PENDING bytes after PR verification; routes finalized state to restartable cleanup; removes both records after proof; and uses lease-protected deletion.
5. Manual and smart accepted starts are both required to return `pending` and never fabricate completion results. Polling maps the known BullMQ waiting/delayed/prioritized/waiting-children states to `pending`, `active` to `processing`, retains terminal meanings, and maps explicit BullMQ `unknown` to wire `failed` with stable sanitized `UNKNOWN_QUEUE_STATE` detail. Story 169.15's separate frontend-only `unknown` sentinel remains reserved for an unrecognized backend wire value.
6. JWT-claim cabinet isolation covers paid-storage start and the necessary import plus method-level guard and directly related Swagger decorators for shared Excel/paid-storage polling; authorized same-cabinet Excel polling remains runtime-compatible, and the handler body, unrelated methods, and class-wide generic-controller behavior remain unchanged.
7. `ImportsService`, processor, orchestration, storage, queues, retries, and all-or-failure semantics remain read-only/unchanged unless a new canonical correction is approved.
8. Story-specific RED unit commands disable Jest retries; the direct E2E command retains the package script's serial worker policy without adding `--runInBand`.
9. The route ledger remains byte-for-byte unchanged and retains 76 authoritative routes.
10. Only the eight declared documentation files change; the route ledger stays byte-identical; every network fence validates the fetch/push endpoint pair; backend, frontend-handoff, and Story 169.15 publish fences create exact mode-600 precommit review-bootstrap authority, recover commit-before-reviewed-head only from byte-identical bootstrap truth, consume the bootstrap before first push, use absence-expecting first publication, normalize/re-read REST all-state PR truth with `merged_at`, reject closed-unmerged/invalid state, skip re-merge for exact `MERGED`, and recover ambiguous PR creation through exact count/identity proof; each pushes captured feature objects explicitly; merge uses atomic reviewed-head matching; remote cleanup uses server-atomic exact-old-SHA deletion; and local cleanup is record-driven and restartable after worktree/branch absence. Story 169.14 atomically publishes a strict nine-line cleanup authority before backend deletion, uses backend reviewed-head plus three-line PR records, a separate frontend reviewed-head plus PR record pair, executable final-handoff `create | delivery | publish-recovery | cleanup`, a durable exact 30-line version-3 cleanup-authenticated payload, and a self-contained 48-line authenticated five-source retirement transaction. Story 169.15 independently reconstructs and hashes that exact nine-line authority from committed/static fields, authenticates the handoff, both PR/merge lineages, the predecessor evidence commit and manifest, cleanup-authority/final record/transaction/branch/worktree absence, rejects dangling-symlink residue, and uses its own reviewed-head plus ten-line pending/final lifecycle truth and self-contained 24-line two-record cleanup transaction. Both transactions strict-parse exact ordered authority, reauthenticate live topology on rerun, reject mode/type/symlink/hash/topology drift, and are removed only after their complete deletion sets are absent.
11. Every present lifecycle-authority record is a non-symlink regular mode-600 file, and every expected-absent authority record, exact Story worktree, bootstrap, or transaction path is both nonexistent and non-symlinked. Story 169.14 authenticates the backend PR head branch and OID together. Pure executable matrices pass for regular versus live-symlink records, absent versus dangling-symlink worktrees, mutation ordering before cleanup proof/source deletion, and exact versus foreign backend PR branch topology with an identical head OID.
12. Every staged, unstaged, committed, cumulative, final, recovery, handoff, retirement, and cleanup path manifest uses explicit `--no-renames`. Executable negative synthetics in both Story plans create an identical-byte forbidden-source → allowed-destination rename, prove the default rename-aware control would hide the forbidden deletion, prove the hardened staged and committed/final command shapes expose both paths, and require the same manifest authorization semantics to reject the hardened result.
13. Every authoritative Git absence, cleanliness, and manifest query is independently captured under an explicit command-failure guard before its output is tested or composed. No failed `branch --list`, `ls-remote`, `status --porcelain`, `diff`, or `ls-files` command can be converted into successful empty output by an outer `test` or `printf`; executable failure synthetics prove worktree/branch removal, cleanup-complete publication, artifact publication, source-record deletion, and Story 169.15 successor authorization remain unreachable on query failure.

## 7. Approval and authority

The owner previously approved the two sequential paid-storage prerequisite Stories, authorized updates to canonical Epics/master DAG/sprint backlog, and instructed autonomous continuation with orchestrated subagents. This proposal repairs execution evidence, verified-base handling, and a security ownership omission inside the already-approved Story 169.14 outcome.

It does not authorize deployment, production operations, direct pushes to `main`, force-pushes, dependency changes, a partial-success feature, or backend work outside the corrected static Story surface.

## 8. Files changed by this correction

- `.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`;
- `.omx/plans/169.15-align-shared-frontend-paid-storage-import-boundary.md`;
- `.omx/plans/shadcn-full-ui-migration-master.md`;
- `_bmad-output/implementation-artifacts/169-14-fe-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`;
- `_bmad-output/implementation-artifacts/sprint-status.yaml`;
- `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md`;
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`;
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-24-story-169-14-preflight-correction.md`.
