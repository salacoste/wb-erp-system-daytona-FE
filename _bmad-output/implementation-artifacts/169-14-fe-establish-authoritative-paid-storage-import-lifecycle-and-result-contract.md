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
- [x] Merge the docs-only preflight correction and clean its frontend branch/worktree.
- [x] Re-fetch backend `origin/main`, assert exact backend identity, and re-run fail-closed collision proof across uncommitted/committed linked worktrees, clean unattached local branches, and open-PR paths whose fully paginated enumeration count equals `changedFiles`; create the exact Story backend branch/worktree from the approved base only after the scan passes.
- [x] Add and retain honest behavioral RED controller/guard/status-builder/E2E tests.
- [x] Independently review the RED matrix and exact backend implementation manifest.
- [x] Commit the exact base, RED, reviewer, review-evidence, and frozen reviewed-manifest markers/delimiters to this artifact before the first backend production edit; require the retained reviewer payload's unique exact privacy attestation, authorize the extracted canonical manifest against the allowed/required sets, fetch/assert the exact frontend origin, prove evidence-commit ancestry on refreshed frontend `origin/main`, and re-read these committed bytes.
- [x] Implement the smallest GREEN backend correction inside the frozen manifest.
- [x] Run targeted and universal backend gates, exact scope audit, two fresh reviews, and all required reruns.
- [x] After both final reviews, atomically publish the exact mode-600 review-bootstrap record before the final commit; recover a commit-before-reviewed-head crash only from that byte-identical authority; cross-check and consume it before first push; then create the remote branch only with an absence-expecting lease for the captured feature SHA, create or byte-validate the adjacent-temp three-line PR record, normalize/re-read REST all-state PR truth with `merged_at`, retain exact OPEN/main/head/headRefOid checks, reject closed-unmerged state, skip re-merge for an already merged exact PR, and merge only with --match-head-commit for that SHA.
- [x] Reuse the exact reviewed-head and PR records; prove feature → exact merge → refreshed backend `origin/main`, delete the remote branch only through the verified push endpoint with an exact-old-SHA lease, and remove the local branch/worktree through the restartable record-driven cleanup phase while retaining both records.
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
- Refreshed backend `origin/main`: `250a329c616194cf1e263a4fa8303a574939e615`.
- Local `main` ancestry on refreshed `origin/main`: proven.
- Approved planned Story base: refreshed `origin/main` `250a329c616194cf1e263a4fa8303a574939e615` under the foreign-WIP fallback.
- Actual Story base after worktree creation: `250a329c616194cf1e263a4fa8303a574939e615`.
- Exact incoming paths that overlap foreign local WIP and block a safe local-main fast-forward:
  - `openwiki/.last-update.json`;
  - `openwiki/quickstart.md`;
  - `openwiki/workflows/fe-shadcn-migration.md`.
- The previously merged two-path reservation was superseded after OpenWiki Bot advanced backend `main` from `25b41be67f9f7e3b0aa6e8081f741b263dbecd64` to `250a329c616194cf1e263a4fa8303a574939e615`; the exact current path intersection above is the canonical recorded-origin fallback reservation.
- Broader foreign WIP remains under `frontend/**`, `openwiki/**`, and `.env.bak-*`; it must not be staged, committed, stashed, reset, restored, cleaned, or otherwise mutated by Story 169.14.
- Story-owned backend paths: clean and non-overlapping at preflight; fresh fail-closed proof remains mandatory immediately before worktree creation and must cover staged, unstaged, and untracked WIP plus clean committed divergence in every linked worktree, committed divergence in every clean unattached local branch, and open-PR changed-file overlap. PR discovery must reject list results at the configured limit, enumerate changed files with `gh api --paginate`, and require the enumerated count to equal `changedFiles` before overlap comparison.

### Baseline Evidence

- Runtime: Node `v24.18.0`; npm `11.16.0`.
- Command: `npx jest src/imports/services/import-status-builder.service.spec.ts --runInBand --no-cache`.
- Result: exit 0; 1 suite passed; 18 tests passed; 0 failed.
- Classification: pre-edit baseline only, not Story RED or GREEN evidence.

### RED Evidence

Status: **complete behavioral RED retained before the first backend production edit**.

- Backend base: `250a329c616194cf1e263a4fa8303a574939e615`.
- Exact combined command exited `1` by design after both Story-specific lanes failed behaviorally.
- Unit/controller result: 3 suites failed; 9 failed, 27 passed, 36 total.
- E2E result: 1 suite failed; 5 failed, 4 passed, 9 total.
- All failures are current contract drift: missing method-level/start cabinet guards, `queued` instead of `pending`, fabricated pre-completion `rows_imported`, missing completed `rowsImported` projection, and BullMQ `unknown` incorrectly mapped to `pending`.
- Corrected real-service same-cabinet Excel, absent/foreign paid-storage 404 boundary, snake_case rejection, and completed-result pass-through fixtures execute successfully.
- No failure is caused by a missing import, fixture, type, database, Redis, or WB-network dependency.

STORY_169_14_BACKEND_BASE_SHA: 250a329c616194cf1e263a4fa8303a574939e615
STORY_169_14_RED_CLASSIFICATION: BEHAVIORAL_CONTRACT_FAILURE
STORY_169_14_RED_COMMAND: PATH=/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/bin:/bin bash -c 'set +e; JEST_NO_RETRY=1 npm test -- --runInBand src/imports/services/import-status-builder.service.spec.ts src/imports/controllers/__tests__/paid-storage-import.controller.spec.ts src/imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts; unit_exit=$?; npm run test:e2e -- test/imports/paid-storage.e2e-spec.ts; e2e_exit=$?; printf "STORY_169_14_UNIT_RED_EXIT=%s\\nSTORY_169_14_E2E_RED_EXIT=%s\\n" "$unit_exit" "$e2e_exit"; if test "$unit_exit" -eq 0 || test "$e2e_exit" -eq 0; then exit 70; fi; exit 1'
STORY_169_14_RED_EXIT_CODE: 1
STORY_169_14_RED_OUTPUT_SHA256: 9586f76dda5527ad82923192c69c1146f94a80d3e178a4c389724aeee9feb32b
STORY_169_14_REVIEWED_MANIFEST_SHA256: 3e0f8c47508f81109ded9add476663ff928794d55aee0c5a21a1f2c9e29c429e
STORY_169_14_REVIEW_EVIDENCE_SHA256: 00325d7ebc014abb6622ee09f3a8075b0aca92a96f27bf0d9ce1223664c872ed
STORY_169_14_FROZEN_MANIFEST_SHA256: 3e0f8c47508f81109ded9add476663ff928794d55aee0c5a21a1f2c9e29c429e

<!-- STORY_169_14_RETAINED_RED_OUTPUT:START -->

> wb-repricer-system@1.0.0 test
> jest --runInBand src/imports/services/import-status-builder.service.spec.ts src/imports/controllers/__tests__/paid-storage-import.controller.spec.ts src/imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts

FAIL src/imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts
  ● ImportsController shared paid-storage polling boundary › applies method-level CabinetGuard to the shared polling route

    expect(received).toEqual(expected) // deep equality

    - Expected  - 3
    + Received  + 1

    - Array [
    -   [Function CabinetGuard],
    - ]
    + Array []

      20 |     const guards = (Reflect.getMetadata('__guards__', ImportsController.prototype.getImportStatus) as unknown[]) ?? [];
      21 |
    > 22 |     expect(guards).toEqual([CabinetGuard]);
         |                    ^
      23 |   });
      24 |
      25 |   it('preserves the authorized same-cabinet Excel lookup delegation', async () => {

      at Object.<anonymous> (imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts:22:20)

FAIL src/imports/controllers/__tests__/paid-storage-import.controller.spec.ts
  ● PaidStorageImportController lifecycle contract › returns pending for an accepted manual import

    expect(received).toBe(expected) // Object.is equality

    Expected: "pending"
    Received: "queued"

      29 |     });
      30 |
    > 31 |     expect(result.status).toBe('pending');
         |                           ^
      32 |   });
      33 |
      34 |   it('does not fabricate rows_imported before manual work completes', async () => {

      at Object.<anonymous> (imports/controllers/__tests__/paid-storage-import.controller.spec.ts:31:27)

  ● PaidStorageImportController lifecycle contract › does not fabricate rows_imported before manual work completes

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      38 |     });
      39 |
    > 40 |     expect(Object.prototype.hasOwnProperty.call(result, 'rows_imported')).toBe(false);
         |                                                                           ^
      41 |   });
      42 |
      43 |   it('preserves the canonical manual queue payload', async () => {

      at Object.<anonymous> (imports/controllers/__tests__/paid-storage-import.controller.spec.ts:40:75)

  ● PaidStorageImportController lifecycle contract › returns pending for an accepted smart import

    expect(received).toBe(expected) // Object.is equality

    Expected: "pending"
    Received: "queued"

      66 |     const result = await controller.smartImportPaidStorage(CABINET_ID);
      67 |
    > 68 |     expect(result.status).toBe('pending');
         |                           ^
      69 |   });
      70 |
      71 |   it.each(['importPaidStorage', 'smartImportPaidStorage'] as const)(

      at Object.<anonymous> (imports/controllers/__tests__/paid-storage-import.controller.spec.ts:68:27)

  ● PaidStorageImportController lifecycle contract › applies CabinetGuard before RolesGuard to importPaidStorage

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 0

      Array [
    -   [Function CabinetGuard],
        [Function RolesGuard],
      ]

      75 |         (Reflect.getMetadata('__guards__', PaidStorageImportController.prototype[method]) as unknown[]) ?? [];
      76 |
    > 77 |       expect(guards).toEqual([CabinetGuard, RolesGuard]);
         |                      ^
      78 |     },
      79 |   );
      80 | });

      at imports/controllers/__tests__/paid-storage-import.controller.spec.ts:77:22

  ● PaidStorageImportController lifecycle contract › applies CabinetGuard before RolesGuard to smartImportPaidStorage

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 0

      Array [
    -   [Function CabinetGuard],
        [Function RolesGuard],
      ]

      75 |         (Reflect.getMetadata('__guards__', PaidStorageImportController.prototype[method]) as unknown[]) ?? [];
      76 |
    > 77 |       expect(guards).toEqual([CabinetGuard, RolesGuard]);
         |                      ^
      78 |     },
      79 |   );
      80 | });

      at imports/controllers/__tests__/paid-storage-import.controller.spec.ts:77:22

FAIL src/imports/services/import-status-builder.service.spec.ts
  ● ImportStatusBuilderService › buildPaidStorageJobStatus() › should project completed rowsImported value 37

    expect(received).toHaveProperty(path, value)

    Expected path: "rows_imported"
    Received path: []

    Expected value: 37
    Received value: {"cabinet_id": "cab-1", "completed_at": "2026-08-26T20:53:00.742Z", "date_range": {"end": "2026-01-31", "start": "2026-01-01"}, "duration_ms": 6000, "error": null, "file_size_bytes": 0, "import_id": "job-1", "original_filename": "paid_storage_api", "progress": null, "report_type": "paid_storage", "started_at": "2026-08-26T20:52:54.742Z", "status": "completed", "uploaded_at": "2026-08-26T20:52:52.742Z", "week_range": undefined, "weeks_included": undefined}

      220 |       expect(result.duration_ms).toBe(6000);
      221 |       expect(result.error).toBeNull();
    > 222 |       expect(result).toHaveProperty('rows_imported', rowsImported);
          |                      ^
      223 |     });
      224 |
      225 |     it('should preserve ordinary JOB_FAILED detail without exposing a completion result', async () => {

      at imports/services/import-status-builder.service.spec.ts:222:22

  ● ImportStatusBuilderService › buildPaidStorageJobStatus() › should project completed rowsImported value 0

    expect(received).toHaveProperty(path, value)

    Expected path: "rows_imported"
    Received path: []

    Expected value: 0
    Received value: {"cabinet_id": "cab-1", "completed_at": "2026-08-26T20:53:00.745Z", "date_range": {"end": "2026-01-31", "start": "2026-01-01"}, "duration_ms": 6000, "error": null, "file_size_bytes": 0, "import_id": "job-1", "original_filename": "paid_storage_api", "progress": null, "report_type": "paid_storage", "started_at": "2026-08-26T20:52:54.745Z", "status": "completed", "uploaded_at": "2026-08-26T20:52:52.745Z", "week_range": undefined, "weeks_included": undefined}

      220 |       expect(result.duration_ms).toBe(6000);
      221 |       expect(result.error).toBeNull();
    > 222 |       expect(result).toHaveProperty('rows_imported', rowsImported);
          |                      ^
      223 |     });
      224 |
      225 |     it('should preserve ordinary JOB_FAILED detail without exposing a completion result', async () => {

      at imports/services/import-status-builder.service.spec.ts:222:22

  ● ImportStatusBuilderService › buildPaidStorageJobStatus() › should fail closed with sanitized detail when BullMQ reports unknown

    expect(received).toBe(expected) // Object.is equality

    Expected: "failed"
    Received: "pending"

      302 |       const result = await service.buildPaidStorageJobStatus(job as unknown as Job);
      303 |
    > 304 |       expect(result.status).toBe(ImportStatus.failed);
          |                             ^
      305 |       expect(result.error).toEqual({
      306 |         code: 'UNKNOWN_QUEUE_STATE',
      307 |         message: expect.any(String),

      at Object.<anonymous> (imports/services/import-status-builder.service.spec.ts:304:29)

Test Suites: 3 failed, 3 total
Tests:       9 failed, 27 passed, 36 total
Snapshots:   0 total
Time:        2.853 s, estimated 3 s
Ran all test suites matching /src\/imports\/services\/import-status-builder.service.spec.ts|src\/imports\/controllers\/__tests__\/paid-storage-import.controller.spec.ts|src\/imports\/controllers\/__tests__\/imports-paid-storage-status.controller.spec.ts/i.

> wb-repricer-system@1.0.0 test:e2e
> jest --config ./test/jest-e2e.json --forceExit --maxWorkers=1 test/imports/paid-storage.e2e-spec.ts

FAIL test/imports/paid-storage.e2e-spec.ts
  Paid-storage import HTTP contract
    ✕ accepts canonical camelCase dates and returns pending without a fabricated result (13 ms)
    ✓ rejects undocumented snake_case date aliases before enqueue (2 ms)
    ✕ returns pending for an accepted smart import (1 ms)
    ✕ rejects a JWT/header cabinet mismatch before enqueue at /v1/imports/paid-storage (1 ms)
    ✕ rejects a JWT/header cabinet mismatch before enqueue at /v1/imports/paid-storage/smart (1 ms)
    ✓ preserves authorized same-cabinet Excel polling (2 ms)
    ✕ rejects a JWT/header cabinet mismatch before shared polling lookup (1 ms)
    ✓ passes through a completed paid-storage result from the shared status boundary (1 ms)
    ✓ keeps unknown and cross-cabinet job identifiers on the same 404 boundary (2 ms)

  ● Paid-storage import HTTP contract › accepts canonical camelCase dates and returns pending without a fabricated result

    expect(received).toBe(expected) // Object.is equality

    Expected: "pending"
    Received: "queued"

      123 |       .expect(202);
      124 |
    > 125 |     expect(response.body.status).toBe('pending');
          |                                  ^
      126 |     expect(Object.prototype.hasOwnProperty.call(response.body, 'rows_imported')).toBe(false);
      127 |     expect(queueService.enqueueTask).toHaveBeenCalledWith(
      128 |       expect.objectContaining({

      at Object.<anonymous> (imports/paid-storage.e2e-spec.ts:125:34)

  ● Paid-storage import HTTP contract › returns pending for an accepted smart import

    expect(received).toBe(expected) // Object.is equality

    Expected: "pending"
    Received: "queued"

      150 |       .expect(202);
      151 |
    > 152 |     expect(response.body.status).toBe('pending');
          |                                  ^
      153 |     expect(Object.prototype.hasOwnProperty.call(response.body, 'rows_imported')).toBe(false);
      154 |   });
      155 |

      at Object.<anonymous> (imports/paid-storage.e2e-spec.ts:152:34)

  ● Paid-storage import HTTP contract › rejects a JWT/header cabinet mismatch before enqueue at /v1/imports/paid-storage

    expected 403 "Forbidden", got 202 "Accepted"

      164 |       }
      165 |
    > 166 |       await pendingRequest.expect(403);
          |                            ^
      167 |       expect(queueService.enqueueTask).not.toHaveBeenCalled();
      168 |     },
      169 |   );

      at imports/paid-storage.e2e-spec.ts:166:28
      ----
      at Test._assertStatus (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:252:14)
      at ../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:308:13
      at Test._assertFunction (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:285:13)
      at Test.assert (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:164:23)
      at Server.localAssert (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:120:14)

  ● Paid-storage import HTTP contract › rejects a JWT/header cabinet mismatch before enqueue at /v1/imports/paid-storage/smart

    expected 403 "Forbidden", got 202 "Accepted"

      164 |       }
      165 |
    > 166 |       await pendingRequest.expect(403);
          |                            ^
      167 |       expect(queueService.enqueueTask).not.toHaveBeenCalled();
      168 |     },
      169 |   );

      at imports/paid-storage.e2e-spec.ts:166:28
      ----
      at Test._assertStatus (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:252:14)
      at ../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:308:13
      at Test._assertFunction (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:285:13)
      at Test.assert (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:164:23)
      at Server.localAssert (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:120:14)

  ● Paid-storage import HTTP contract › rejects a JWT/header cabinet mismatch before shared polling lookup

    expected 403 "Forbidden", got 404 "Not Found"

      194 |       .get('/v1/imports/paid-storage-job-1')
      195 |       .set('X-Cabinet-Id', FOREIGN_CABINET_ID)
    > 196 |       .expect(403);
          |        ^
      197 |
      198 |     expect(paidStorageQueue.getJob).not.toHaveBeenCalled();
      199 |   });

      at Object.<anonymous> (imports/paid-storage.e2e-spec.ts:196:8)
      ----
      at Test._assertStatus (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:252:14)
      at ../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:308:13
      at Test._assertFunction (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:285:13)
      at Test.assert (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:164:23)
      at Server.localAssert (../../../../Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/node_modules/supertest/lib/test.js:120:14)

Test Suites: 1 failed, 1 total
Tests:       5 failed, 4 passed, 9 total
Snapshots:   0 total
Time:        2.665 s, estimated 3 s
Ran all test suites matching /test\/imports\/paid-storage.e2e-spec.ts/i.
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?
STORY_169_14_UNIT_RED_EXIT=1
STORY_169_14_E2E_RED_EXIT=1
<!-- STORY_169_14_RETAINED_RED_OUTPUT:END -->

### Frozen Reviewed Manifest

Status: **frozen and independently reviewed before the first backend production edit**.

- Reviewer: `omx-team-code-reviewer-story-16914-preimplementation-r2-20260826`.
- Disposition: **PASS** — Critical=0, High=0, Medium=0, Low=0.
- Frontend evidence commit: pending creation by this exact single-parent artifact-only lane; its feature SHA is supplied and authenticated by evidence-preflight after merge.
- Frozen manifest SHA-256: `3e0f8c47508f81109ded9add476663ff928794d55aee0c5a21a1f2c9e29c429e`.
- Frozen after honest RED and before first production edit: **PASS**.
- The reviewer independently confirmed the corrected E2E uses the real production `ImportsService`, the absent/foreign 404 boundary is sufficient, Story 169.15 owns the known frontend snake_case caller, `GET /v1/imports/paid-storage/status` remains excluded, and the nine-path manifest is minimal and sufficient.
- The exact reviewer payload below is authoritative for the unique reviewer identity, PASS disposition, and privacy attestation; those machine-readable lines are intentionally not duplicated elsewhere in this artifact.

<!-- STORY_169_14_RETAINED_REVIEW_EVIDENCE:START -->
# Story 169.14 Independent Pre-Implementation Review

Critical

- None.

High

- None.

Medium

- None.

Low

- None.

Scope and acceptance evidence

- Reviewed exactly the four current RED test changes against backend base `250a329c616194cf1e263a4fa8303a574939e615`; no production edit was treated as present or approved beyond the frozen manifest.
- Validation and start lifecycle are covered: canonical `dateFrom`/`dateTo` succeeds, snake_case aliases fail before enqueue, manual and smart starts require `pending`, and pre-completion `rows_imported` is absent.
- Status-builder coverage explicitly maps `waiting | delayed | prioritized | waiting-children` to `pending`, `active` to `processing`, and terminal states to `completed | failed`; explicit BullMQ `unknown` must fail closed with `UNKNOWN_QUEUE_STATE` without leaking the synthetic internal failure detail.
- Completed `job.returnvalue.rowsImported` projection covers both a positive value and zero. Pending, processing, failed, and Excel shapes are checked for result omission, while ordinary `JOB_FAILED` code/message detail is preserved.
- Guard metadata requires `CabinetGuard` before `RolesGuard` on exactly the manual and smart paid-storage start methods and method-level `CabinetGuard` on shared `GET /v1/imports/:id`. The unrelated `GET /v1/imports/paid-storage/status` exclusion is canonical and was not treated as a defect.
- The E2E harness uses the real production `ImportsService` with deterministic Prisma, queue, and status-builder seams. It proves same-cabinet Excel compatibility, rejects JWT/header cabinet mismatches before queue/service access, exercises absent and foreign-cabinet queue jobs through the existing common 404/`NOT_FOUND` shape, and proves the status builder is not invoked for either unauthorized/absent job.
- The E2E is deterministic and local: fixed synthetic identities/dates, one worker, no database, Redis, WB network, or external credential dependency.

RED evidence

- The retained transcript loads and executes every suite: unit/controller RED reports 9 behavioral failures and 27 passes; E2E reports 5 behavioral failures and 4 passes. All 14 failures are expected assertions for current lifecycle, result projection, or cabinet-isolation drift. There are no fixture, import, syntax, TypeScript, database, Redis, or WB-network failures.
- Verified RED transcript SHA-256: `9586f76dda5527ad82923192c69c1146f94a80d3e178a4c389724aeee9feb32b`.
- A non-echoing scan of the exact RED bytes found no credential-bearing header or assignment, Bearer/Basic value, credential-bearing URI userinfo, connection string, private-key material, secret, or real customer email/phone/PII.

Frozen manifest evidence

- Verified frozen-manifest SHA-256: `3e0f8c47508f81109ded9add476663ff928794d55aee0c5a21a1f2c9e29c429e`.
- The manifest has exactly nine sorted, unique, newline-delimited paths with a trailing LF. It is the smallest sufficient required set: four RED tests plus the paid-storage controller, shared polling controller, shared status DTO, status builder, and API-path documentation.
- `src/imports/dto/paid-storage-import.dto.ts` is correctly excluded because the canonical request DTO and start-response result optionality already satisfy the tested contract. `src/imports/imports.service.ts` remains production-read-only because the real-service E2E proves its existing Excel lookup and absent/foreign-cabinet queue branches. Processor/orchestration/storage, queue/module, Prisma/schema, dependencies, and frontend runtime remain excluded.
- The known frontend snake_case caller belongs to prerequisite Story 169.15 and is not a Story 169.14 finding. No scope expansion is recommended.

STORY_169_14_PRE_IMPLEMENTATION_REVIEWER_ID: omx-team-code-reviewer-story-16914-preimplementation-r2-20260826

STORY_169_14_PRE_IMPLEMENTATION_REVIEW_DISPOSITION: PASS

STORY_169_14_PRIVACY_REVIEW_ATTESTATION: PASS_NO_SECRET_OR_CUSTOMER_PII

Recommendation: APPROVE — Critical=0, High=0, Medium=0; the retained RED is behavioral, both evidence hashes verify exactly, privacy review passes, and the nine-path backend manifest is canonical and sufficient without crossing Story boundaries.
<!-- STORY_169_14_RETAINED_REVIEW_EVIDENCE:END -->

<!-- STORY_169_14_FROZEN_REVIEWED_MANIFEST:START -->
docs/API-PATHS-REFERENCE.md
src/imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts
src/imports/controllers/__tests__/paid-storage-import.controller.spec.ts
src/imports/controllers/paid-storage-import.controller.ts
src/imports/dto/import-status.dto.ts
src/imports/imports.controller.ts
src/imports/services/import-status-builder.service.spec.ts
src/imports/services/import-status-builder.service.ts
test/imports/paid-storage.e2e-spec.ts
<!-- STORY_169_14_FROZEN_REVIEWED_MANIFEST:END -->

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
- RED-manifest review: **PASS** — reviewer `omx-team-code-reviewer-story-16914-preimplementation-r2-20260826`; Critical=0, High=0, Medium=0, Low=0.
- Backend adversarial review pass 1: **PASS** — reviewer `omx-native-code-reviewer-16914-postfix-r3-20260827`; Critical=0, High=0, Medium=0, Low=0.
- Backend fresh verifier review pass 2: **PASS** — reviewer `omx-native-verifier-16914-r2-20260827`; Critical=0, High=0, Medium=0, Low=0.

### Backend Validation Evidence

Backend GREEN and final validation evidence:

- Targeted controller/status-builder suites: 3 suites passed, 39 tests passed, 0 failed.
- Story E2E: 1 suite passed, 9 tests passed, 0 failed; the suite exercises the production `ImportsService` ownership branch while mocking only external database, queue, and WB-facing dependencies.
- `npm run format:check`, `npm run lint:check`, `npm run type-check`, `npm run build`, `npm run check:endpoint-drift`, `npm run docs:validate`, `git diff --check`, and the exact nine-path manifest audit: **PASS**.
- TypeScript baseline/current errors: 0/0. Endpoint drift: 75 current, 75 baseline, PASS. Documentation: 63 passed, 0 warnings, 0 failed; API index: 443 endpoints.
- Full backend unit suite: 712 suites passed, 2 failed, 3 skipped; 13,186 tests passed, 2 failed, 124 skipped. `moysklad-dns-health.service.spec.ts` reproduced identically at base because global Jest setup sets `WORKER_MODE=true`; `wb-general.service.spec.ts` timed out only in the 83-minute serial run and passed in isolation. All Story 169.14 suites passed.
- Full backend E2E: 8 suites passed, 36 failed, 1 skipped; repository infrastructure is stale because the test database lacks `cabinets.promotion_daily_cap_rub`. Prisma/schema mutation is forbidden Story scope, so the infrastructure gap is retained explicitly; Story E2E remains 9/9 PASS.
- Pre-commit rerun on the reviewed tree passed ESLint, Prettier, endpoint-drift comparison, and documentation validation before feature commit creation.

### PR, Merge, and Cleanup Evidence

- Backend feature commit: `1513e3acf858cdbdc20006dcb457ef752bb5eb30`; direct parent `250a329c616194cf1e263a4fa8303a574939e615`; tree `b52706c237a53aeda685237faed6ce7279579057`.
- Backend PR: [#229](https://github.com/salacoste/wb-erp-system-daytona/pull/229); exact base/head/head OID `main` / `cdx/epic-169-story-14-paid-storage-import-contract` / `1513e3acf858cdbdc20006dcb457ef752bb5eb30`.
- Pre-merge PR identity plus atomic `--match-head-commit`: **PASS**.
- Backend merge SHA: `8fbfc80e0cc756d9f1767c533513004e459192a2`; feature → exact merge → refreshed backend `origin/main` ancestry: **PASS**.
- Publication recovery proved exact zero-or-one all-state PR identity and atomically retained the exact PR number/URL/feature SHA in the mode-600 PR record before merge.
- Cleanup consumed backend PR `229`, reauthenticated the reviewed-head and PR records, and selected `recorded-origin-deferral` for the untouched foreign primary-checkout WIP.
- Authenticated foreign-WIP reservation: `openwiki/.last-update.json`, `openwiki/quickstart.md`, `openwiki/workflows/fe-shadcn-migration.md`; complete-byte SHA-256 `2dbadf8282e9619adc6ee26f12091f36eb54b6bc6efa35e2ee16f0ea9ee5ee93`.
- Cleanup published mode-600 `story-169-14-branch-worktree-cleanup-authority-v1` before deletion and retained all three backend records for cross-bound retirement.
- Remote Story branch absence, local Story branch absence, compare-and-delete exact-SHA protection, and backend Story worktree removal/prune: **PASS**.

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
STORY_169_14_FINAL_HANDOFF_RECORD_VERSION=3
STORY_169_14_BACKEND_REPOSITORY=salacoste/wb-erp-system-daytona
STORY_169_14_BACKEND_BASE_SHA=250a329c616194cf1e263a4fa8303a574939e615
STORY_169_14_EVIDENCE_COMMIT_SHA=6733abf63bd6ec3d367118f77f4f753b9a46e496
STORY_169_14_FEATURE_SHA=1513e3acf858cdbdc20006dcb457ef752bb5eb30
STORY_169_14_FEATURE_TREE_SHA=b52706c237a53aeda685237faed6ce7279579057
STORY_169_14_FROZEN_MANIFEST_SHA256=3e0f8c47508f81109ded9add476663ff928794d55aee0c5a21a1f2c9e29c429e
STORY_169_14_REVIEW_PASS_1_ID=omx-native-code-reviewer-16914-postfix-r3-20260827
STORY_169_14_REVIEW_PASS_1_DISPOSITION=PASS
STORY_169_14_REVIEW_PASS_2_ID=omx-native-verifier-16914-r2-20260827
STORY_169_14_REVIEW_PASS_2_DISPOSITION=PASS
STORY_169_14_PR_NUMBER=229
STORY_169_14_PR_URL=https://github.com/salacoste/wb-erp-system-daytona/pull/229
STORY_169_14_MERGE_SHA=8fbfc80e0cc756d9f1767c533513004e459192a2
STORY_169_14_BACKEND_MAIN_MODE=recorded-origin-deferral
STORY_169_14_FOREIGN_WIP_PATHS_SHA256=2dbadf8282e9619adc6ee26f12091f36eb54b6bc6efa35e2ee16f0ea9ee5ee93
STORY_169_14_BRANCH_WORKTREE_CLEANUP_DISPOSITION=PASS
STORY_169_14_FRONTEND_REPOSITORY=salacoste/wb-erp-system-daytona-FE
STORY_169_14_FINAL_HANDOFF_FRONTEND_BASE_SHA=4e86272b645446189cd0d0bcd5e9c5e0c7f61942
STORY_169_14_FINAL_HANDOFF_ARTIFACT=_bmad-output/implementation-artifacts/169-14-fe-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md
STORY_169_14_FINAL_HANDOFF_PR_BASE_BRANCH=main
STORY_169_14_FINAL_HANDOFF_PR_HEAD_BRANCH=cdx/epic-169-story-14-final-handoff
STORY_169_14_FINAL_HANDOFF_REVIEW_PASS_1_ID=omx-native-code-reviewer-16914-final-handoff-r1-20260827
STORY_169_14_FINAL_HANDOFF_REVIEW_PASS_1_DISPOSITION=PASS
STORY_169_14_FINAL_HANDOFF_REVIEW_PASS_2_ID=omx-native-verifier-16914-final-handoff-r2-20260827
STORY_169_14_FINAL_HANDOFF_REVIEW_PASS_2_DISPOSITION=PASS
STORY_169_14_BACKEND_REVIEWED_HEAD_RECORD_SHA256=ca8811602c0b50f7e0475ae2db654250be21ded041144744f13a466bfcbc5056
STORY_169_14_BACKEND_PR_RECORD_SHA256=4e7d0dfa19711047eca7bec0f6d90e98b939933560333b1d92286c7271bdc567
STORY_169_14_BACKEND_CLEANUP_AUTHORITY_RECORD_SHA256=6d7cc0e642a108ca6575c0c1322edaef68182ea367daf4932ede11abb40aebe1
STORY_169_14_EPHEMERAL_RECORDS_DISPOSITION=RETAINED_UNTIL_CROSS_BOUND_VERIFIED
<!-- STORY_169_14_FINAL_HANDOFF_RECORD:END -->

<!-- STORY_169_14_FINAL_FOREIGN_WIP_PATHS:START -->
openwiki/.last-update.json
openwiki/quickstart.md
openwiki/workflows/fe-shadcn-migration.md
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

Backend delivered File List equals the committed and twice-reviewed nine-path manifest exactly:

- `docs/API-PATHS-REFERENCE.md`;
- `src/imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts`;
- `src/imports/controllers/__tests__/paid-storage-import.controller.spec.ts`;
- `src/imports/controllers/paid-storage-import.controller.ts`;
- `src/imports/dto/import-status.dto.ts`;
- `src/imports/imports.controller.ts`;
- `src/imports/services/import-status-builder.service.spec.ts`;
- `src/imports/services/import-status-builder.service.ts`;
- `test/imports/paid-storage.e2e-spec.ts`.

## Change Log

- 2026-08-27: Delivered backend GREEN as exact commit `1513e3acf858cdbdc20006dcb457ef752bb5eb30` (tree `b52706c237a53aeda685237faed6ce7279579057`) through merged PR #229 at merge `8fbfc80e0cc756d9f1767c533513004e459192a2`; retained 39/39 targeted and 9/9 Story E2E PASS, classified unrelated full-suite baseline/infrastructure gaps, completed two zero-finding reviews, removed the exact backend branch/worktree, published the cleanup-authority record, and populated the cleanup-authenticated version-3 final-handoff payload for two fresh frontend reviews. Story remains `in-progress` until final-handoff merge, cleanup, record retirement, and canonical reconciliation complete.
- 2026-08-27: Created the isolated backend Story lane from verified base `250a329c616194cf1e263a4fa8303a574939e615`, retained complete behavioral RED output (unit/controller 9 failed and 27 passed; E2E 5 failed and 4 passed), corrected the E2E to exercise the real `ImportsService` absent/foreign 404 branch, and froze the exact nine-path implementation manifest after an independent zero-finding PASS plus privacy attestation. This artifact-only evidence update remains `in-progress`; no backend production source has been edited, and GREEN remains blocked until this single-file evidence commit is merged and the canonical evidence-preflight succeeds.
- 2026-08-26: Refreshed the checkout-independent backend base after a newer OpenWiki Bot commit advanced live backend `main` to `250a329c616194cf1e263a4fa8303a574939e615`. Re-ran the fail-closed collision inventory: all ten Story-owned paths remain clean and non-overlapping, the prescribed branch/worktree and open-PR collision surfaces remain absent, and the exact foreign-WIP/incoming intersection is now the canonical three-path reservation `openwiki/.last-update.json`, `openwiki/quickstart.md`, and `openwiki/workflows/fe-shadcn-migration.md`. This artifact-only correction does not authorize a production edit; honest RED, independent manifest review, merged evidence bytes, and evidence-preflight remain mandatory before GREEN implementation.
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
