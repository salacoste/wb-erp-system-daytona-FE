# Story 169.15: Align the Shared Frontend Paid-Storage Import Boundary

Status: in-progress

## Story

As a user importing paid-storage data,
I want the shared frontend boundary to consume the merged backend contract exactly,
so that route presentation receives truthful lifecycle, result, and failure evidence without duplicating contract logic.

## Acceptance Criteria

1. The paid-storage start request serializes exactly `dateFrom` and `dateTo`, and the accepted start response preserves the authoritative pending lifecycle and date range.
2. Shared status types and normalization accept the backend wire lifecycle `pending | processing | completed | failed`, while a malformed or future frontend wire value remains the distinguishable non-terminal `unknown` sentinel.
3. Polling continues through `pending`, `processing`, and frontend `unknown`, stops at `completed` and `failed`, and preserves missing-ID and disabled behavior.
4. Completed `rows_imported`, including zero, and actionable nested `error.code`, `error.message`, and optional `error.details` reach consumers without fabricated partial state or lost compatibility detail.
5. Malformed and future lifecycle values emit sanitized defensive diagnostics without logging the complete response.
6. Direct tests, universal frontend gates, exact scope audit, two independent final reviews, PR merge, and mandatory branch/worktree/lifecycle-record cleanup pass.
7. No route-owned presentation, route E2E, generic UI primitive, dependency, backend source, deploy, production operation, direct push to `main`, force-push, or partial-success feature changes.

## Tasks / Subtasks

- [x] Authenticate Story 169.14 completion and create the isolated Story 169.15 worktree from refreshed frontend `origin/main`.
- [x] Inventory PR #226 preface behavior and the merged backend request/status/result/error contract.
- [x] Add honest behavioral RED tests without relabeling already-green `unknown` preservation.
- [x] Resolve the first pre-implementation review findings and freeze the corrected seven-path manifest.
- [ ] Commit this evidence artifact alone and pass the canonical evidence-preflight fence.
- [ ] Implement the smallest shared request/type/normalizer/polling correction inside the frozen manifest.
- [ ] Run targeted tests and all universal frontend validation gates.
- [ ] Complete adversarial review pass 1, resolve accepted findings, and rerun affected gates.
- [ ] Complete fresh verifier review pass 2 and final PR-readiness audit.
- [ ] Deliver through the canonical guarded commit/push/PR/merge lifecycle and remove the Story branch, worktree, bootstrap, reviewed-head, PR, and cleanup-transaction records.
- [ ] Reconcile Story and sprint documentation after merge and cleanup.

## Dev Notes

### Exact Scope

Allowed production files:

- `src/hooks/useImportStatus.ts`
- `src/lib/api/storage-analytics.ts`
- `src/lib/api/storage-import-normalizer.ts`
- `src/types/storage-analytics-trends.ts`

Allowed direct tests:

- `src/hooks/__tests__/useStorageAnalytics.test.ts`
- `src/lib/api/__tests__/storage-analytics.test.ts`
- `src/lib/api/__tests__/storage-import-normalizer.test.ts`

The public barrel `src/types/storage-analytics/index.ts` remains unchanged because no new consumer-facing named export is required. Route-owned storage presentation and `e2e/storage-analytics.spec.ts` remain Story 169.12 ownership.

## Dev Agent Record

### Agent Model Used

Primary autonomous orchestrator with local native explorer, independent pre-implementation code-review, final adversarial review, and fresh verifier lanes.

### Base and Prerequisite Evidence

- Frontend Story base: `4fd78774ba26ed1b858cbd28c04d0ead6d76db7a`.
- Story branch: `cdx/epic-169-story-15-storage-import-boundary`.
- Story worktree: `/private/tmp/wb-repricer-fe-169-15-storage-import-boundary`.
- Backend Story 169.14 feature: `1513e3acf858cdbdc20006dcb457ef752bb5eb30`.
- Backend Story 169.14 merge: `8fbfc80e0cc756d9f1767c533513004e459192a2`.
- Frontend Story 169.14 final-handoff merge: `83f29b7ff48360ed496f3ef9ce6c56ca61173141`.
- Story 169.14 reconciliation merge and Story 169.15 base: `4fd78774ba26ed1b858cbd28c04d0ead6d76db7a`.
- PR #226 preface merge: `2c7a3c5931dbc9890ed585eaf71f5717c04453b2`.
- Preflight authenticated the committed version-3 handoff, reconstructed cleanup authority, backend/frontend merge ancestry, retired-record absence, branch/worktree cleanup, collision absence, and immutable backend contract blobs before this worktree was created.
- The concurrently owned primary frontend checkout was not mutated; the verified refreshed `origin/main` object was used directly as the isolated worktree base.

### RED Evidence

- Runtime: Node `v24.18.0`; npm `11.11.0`.
- Result: 3 failing test files; 15 expected behavioral contract failures; 50 passing tests; 65 total.
- Classification: request serialization, response fidelity, zero-row preservation, structured failure detail, lifecycle diagnostics, non-completed result omission, and terminal polling behavior.
- Non-terminal polling for pending, processing, and frontend `unknown` remained green.
- Missing-ID, disabled-query, fixture loading, imports, syntax, and unrelated storage behavior remained green.
- Fresh ESLint over all three modified tests and `git diff --check` passed.
- Type diagnostics contain exactly four expected future response-field references for `date_range` and structured `error`; no persistent test-only or unrelated TypeScript error remains.

STORY_169_15_BASE_SHA: 4fd78774ba26ed1b858cbd28c04d0ead6d76db7a
STORY_169_15_RED_CLASSIFICATION: BEHAVIORAL_CONTRACT_FAILURE
STORY_169_15_RED_COMMAND: /opt/homebrew/Cellar/node@24/24.18.0/bin/node /private/tmp/wb-repricer-npm-11-11/node_modules/npm/bin/npx-cli.js vitest run src/lib/api/__tests__/storage-analytics.test.ts src/lib/api/__tests__/storage-import-normalizer.test.ts src/hooks/__tests__/useStorageAnalytics.test.ts
STORY_169_15_RED_EXIT_CODE: 1
STORY_169_15_RED_OUTPUT_SHA256: b8e2978dc804488192554b7a4abc7ce56d5cb6054c65a227269061ca0221c1d4
STORY_169_15_PRE_IMPLEMENTATION_REVIEWER_ID: omx-native-code-reviewer-16915-preimplementation-r2-20260827-dcfec2ee
STORY_169_15_PRE_IMPLEMENTATION_REVIEW_DISPOSITION: PASS
STORY_169_15_REVIEWED_MANIFEST_SHA256: 6dc3ded4bdc1b6f34f3a2bfc1cb7d87c4b7a49aa72ddbeaf573fce55914f9b06
STORY_169_15_REVIEW_EVIDENCE_SHA256: 805a469fb6ebd245a8e5a5ce87447f68ef837fb25b6310bffa5fa353673f68bc
STORY_169_15_FROZEN_MANIFEST_SHA256: 6dc3ded4bdc1b6f34f3a2bfc1cb7d87c4b7a49aa72ddbeaf573fce55914f9b06

<!-- STORY_169_15_RETAINED_RED_OUTPUT:START -->

 RUN  v4.1.10 /private/tmp/wb-repricer-fe-169-15-storage-import-boundary

 ❯ src/lib/api/__tests__/storage-import-normalizer.test.ts (10 tests | 9 failed) 6ms
     × happy path: normalizes completed import status 3ms
     × normalizes the authoritative nested failure contract without losing compatibility detail 0ms
     × null input preserves unknown status with empty id 1ms
     × missing fields default safely to unknown status 0ms
     × unrecognized status string is preserved distinguishably as unknown (not failed) 0ms
     × does not expose row counts for pending lifecycle data 0ms
     × does not expose row counts for processing lifecycle data 0ms
     × does not expose row counts for failed lifecycle data 0ms
     × preserves an authoritative completed rows_imported value of zero 0ms
 ❯ src/lib/api/__tests__/storage-analytics.test.ts (22 tests | 3 failed) 9ms
       × calls API with correct endpoint and body 2ms
       × preserves an authoritative completed zero-row result and date range 0ms
       × returns failed status with structured actionable error detail 0ms
 ❯ src/hooks/__tests__/useStorageAnalytics.test.ts (33 tests | 3 failed) 2963ms
       × triggers import mutation successfully 56ms
       × stops polling for completed lifecycle data 1ms
       × stops polling for failed lifecycle data 2ms

⎯⎯⎯⎯⎯⎯ Failed Tests 15 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/hooks/__tests__/useStorageAnalytics.test.ts > Storage Analytics Hooks > usePaidStorageImport > triggers import mutation successfully
AssertionError: expected "vi.fn()" to be called with arguments: [ '/v1/imports/paid-storage', …(1) ]

Received:

  1st vi.fn() call:

  [
    "/v1/imports/paid-storage",
    {
-     "dateFrom": "2025-11-18",
-     "dateTo": "2025-11-24",
+     "date_from": "2025-11-18",
+     "date_to": "2025-11-24",
    },
  ]


Number of calls: 1

 ❯ src/hooks/__tests__/useStorageAnalytics.test.ts:356:30
    354|       await waitFor(() => expect(result.current.isSuccess).toBe(true))
    355|
    356|       expect(apiClient.post).toHaveBeenCalledWith('/v1/imports/paid-st…
       |                              ^
    357|         dateFrom: '2025-11-18',
    358|         dateTo: '2025-11-24',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/15]⎯

 FAIL  src/hooks/__tests__/useStorageAnalytics.test.ts > Storage Analytics Hooks > useImportStatus > stops polling for completed lifecycle data
 FAIL  src/hooks/__tests__/useStorageAnalytics.test.ts > Storage Analytics Hooks > useImportStatus > stops polling for failed lifecycle data
AssertionError: expected "vi.fn()" to be called 1 times, but got 6 times
 ❯ src/hooks/__tests__/useStorageAnalytics.test.ts:491:33
    489|             await vi.advanceTimersByTimeAsync(100)
    490|           })
    491|           expect(apiClient.get).toHaveBeenCalledTimes(1)
       |                                 ^
    492|         } finally {
    493|           unmount()

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/15]⎯

 FAIL  src/lib/api/__tests__/storage-analytics.test.ts > Storage Analytics API Client > triggerPaidStorageImport > calls API with correct endpoint and body
AssertionError: expected "vi.fn()" to be called with arguments: [ '/v1/imports/paid-storage', …(1) ]

Received:

  1st vi.fn() call:

  [
    "/v1/imports/paid-storage",
    {
-     "dateFrom": "2025-11-18",
-     "dateTo": "2025-11-24",
+     "date_from": "2025-11-18",
+     "date_to": "2025-11-24",
    },
  ]


Number of calls: 1

 ❯ src/lib/api/__tests__/storage-analytics.test.ts:325:30
    323|       })
    324|
    325|       expect(apiClient.post).toHaveBeenCalledWith('/v1/imports/paid-st…
       |                              ^
    326|         dateFrom: '2025-11-18',
    327|         dateTo: '2025-11-24',

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/15]⎯

 FAIL  src/lib/api/__tests__/storage-analytics.test.ts > Storage Analytics API Client > getImportStatus > preserves an authoritative completed zero-row result and date range
AssertionError: expected undefined to be +0 // Object.is equality

- Expected:
0

+ Received:
undefined

 ❯ src/lib/api/__tests__/storage-analytics.test.ts:389:36
    387|       const result = await getImportStatus('import-uuid-zero')
    388|
    389|       expect(result.rows_imported).toBe(0)
       |                                    ^
    390|       expect(result.date_range).toEqual(mockResponse.date_range)
    391|     })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/15]⎯

 FAIL  src/lib/api/__tests__/storage-analytics.test.ts > Storage Analytics API Client > getImportStatus > returns failed status with structured actionable error detail
AssertionError: expected undefined to be 'WB API timeout' // Object.is equality

- Expected:
"WB API timeout"

+ Received:
undefined

 ❯ src/lib/api/__tests__/storage-analytics.test.ts:420:36
    418|
    419|       expect(result.status).toBe('failed')
    420|       expect(result.error_message).toBe('WB API timeout')
       |                                    ^
    421|       expect(result.error).toEqual(mockResponse.error)
    422|     })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/15]⎯

 FAIL  src/lib/api/__tests__/storage-import-normalizer.test.ts > normalizeImportStatusResponse > happy path: normalizes completed import status
AssertionError: expected undefined to deeply equal { start: '2025-01-01', …(1) }

- Expected:
{
  "end": "2025-01-07",
  "start": "2025-01-01",
}

+ Received:
undefined

 ❯ src/lib/api/__tests__/storage-import-normalizer.test.ts:34:31
     32|     expect(result.rows_imported).toBe(150)
     33|     expect(result.completed_at).toBe('2025-01-01T12:00:00Z')
     34|     expect(result.date_range).toEqual({ start: '2025-01-01', end: '202…
       |                               ^
     35|   })
     36|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/15]⎯

 FAIL  src/lib/api/__tests__/storage-import-normalizer.test.ts > normalizeImportStatusResponse > normalizes the authoritative nested failure contract without losing compatibility detail
AssertionError: expected undefined to be 'Connection timeout' // Object.is equality

- Expected:
"Connection timeout"

+ Received:
undefined

 ❯ src/lib/api/__tests__/storage-import-normalizer.test.ts:50:34
     48|     const result = normalizeImportStatusResponse(raw)
     49|     expect(result.status).toBe('failed')
     50|     expect(result.error_message).toBe('Connection timeout')
       |                                  ^
     51|     expect(result.error).toEqual(raw.error)
     52|   })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/15]⎯

 FAIL  src/lib/api/__tests__/storage-import-normalizer.test.ts > normalizeImportStatusResponse > null input preserves unknown status with empty id
AssertionError: expected "vi.fn()" to be called with arguments: [ …(2) ]

Number of calls: 0

 ❯ src/lib/api/__tests__/storage-import-normalizer.test.ts:64:25
     62|     expect(result.error_message).toBeUndefined()
     63|     expect(result.completed_at).toBeUndefined()
     64|     expect(logger.warn).toHaveBeenCalledWith(
       |                         ^
     65|       '[Storage Import] Unrecognized import status received',
     66|       { status: '<missing>' }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/15]⎯

 FAIL  src/lib/api/__tests__/storage-import-normalizer.test.ts > normalizeImportStatusResponse > missing fields default safely to unknown status
AssertionError: expected "vi.fn()" to be called with arguments: [ …(2) ]

Number of calls: 0

 ❯ src/lib/api/__tests__/storage-import-normalizer.test.ts:74:25
     72|     expect(result.import_id).toBe('')
     73|     expect(result.status).toBe('unknown')
     74|     expect(logger.warn).toHaveBeenCalledWith(
       |                         ^
     75|       '[Storage Import] Unrecognized import status received',
     76|       { status: '<missing>' }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/15]⎯

 FAIL  src/lib/api/__tests__/storage-import-normalizer.test.ts > normalizeImportStatusResponse > unrecognized status string is preserved distinguishably as unknown (not failed)
AssertionError: expected "vi.fn()" to be called with arguments: [ …(2) ]

Number of calls: 0

 ❯ src/lib/api/__tests__/storage-import-normalizer.test.ts:83:25
     81|     const result = normalizeImportStatusResponse({ import_id: 'x', sta…
     82|     expect(result.status).toBe('unknown')
     83|     expect(logger.warn).toHaveBeenCalledWith(
       |                         ^
     84|       '[Storage Import] Unrecognized import status received',
     85|       { status: 'partially_stuck' }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/15]⎯

 FAIL  src/lib/api/__tests__/storage-import-normalizer.test.ts > normalizeImportStatusResponse > does not expose row counts for pending lifecycle data
 FAIL  src/lib/api/__tests__/storage-import-normalizer.test.ts > normalizeImportStatusResponse > does not expose row counts for processing lifecycle data
 FAIL  src/lib/api/__tests__/storage-import-normalizer.test.ts > normalizeImportStatusResponse > does not expose row counts for failed lifecycle data
AssertionError: expected 50 to be undefined

- Expected:
undefined

+ Received:
50

 ❯ src/lib/api/__tests__/storage-import-normalizer.test.ts:104:36
    102|         rows_imported: 50,
    103|       })
    104|       expect(result.rows_imported).toBeUndefined()
       |                                    ^
    105|     }
    106|   )

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/15]⎯

 FAIL  src/lib/api/__tests__/storage-import-normalizer.test.ts > normalizeImportStatusResponse > preserves an authoritative completed rows_imported value of zero
AssertionError: expected undefined to be +0 // Object.is equality

- Expected:
0

+ Received:
undefined

 ❯ src/lib/api/__tests__/storage-import-normalizer.test.ts:114:34
    112|       rows_imported: 0,
    113|     })
    114|     expect(result.rows_imported).toBe(0)
       |                                  ^
    115|   })
    116| })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/15]⎯


 Test Files  3 failed (3)
      Tests  15 failed | 50 passed (65)
   Start at  16:22:02
   Duration  4.04s (transform 392ms, setup 582ms, import 725ms, tests 2.98s, environment 501ms)

<!-- STORY_169_15_RETAINED_RED_OUTPUT:END -->
<!-- STORY_169_15_RETAINED_REVIEW_EVIDENCE:START -->
Reviewer ID: omx-native-code-reviewer-16915-preimplementation-r2-20260827-dcfec2ee
Disposition: PASS
Base SHA: 4fd78774ba26ed1b858cbd28c04d0ead6d76db7a
Reviewed test-diff SHA-256: dcfec2ee74c3b3db921a434b38441cbc09eabb5b14b76486b83dc8795e95652e
Reviewed manifest SHA-256: 6dc3ded4bdc1b6f34f3a2bfc1cb7d87c4b7a49aa72ddbeaf573fce55914f9b06
Retained RED SHA-256: b8e2978dc804488192554b7a4abc7ce56d5cb6054c65a227269061ca0221c1d4
Behavioral RED: PASS — 15 contract failures and 50 passing tests across 65 tests
Backend Story 169.14 fidelity: PASS
Observable polling coverage: PASS
Scope and manifest minimality: PASS
ESLint and diff check: PASS
Type diagnostics: PASS — exactly four intentional missing future response-field errors and no others
Severity counts: CRITICAL=0 HIGH=0 MEDIUM=0 LOW=0
STORY_169_15_PRIVACY_REVIEW_DISPOSITION: PASS
<!-- STORY_169_15_RETAINED_REVIEW_EVIDENCE:END -->
<!-- STORY_169_15_FROZEN_REVIEWED_MANIFEST:START -->
src/hooks/__tests__/useStorageAnalytics.test.ts
src/hooks/useImportStatus.ts
src/lib/api/__tests__/storage-analytics.test.ts
src/lib/api/__tests__/storage-import-normalizer.test.ts
src/lib/api/storage-analytics.ts
src/lib/api/storage-import-normalizer.ts
src/types/storage-analytics-trends.ts
<!-- STORY_169_15_FROZEN_REVIEWED_MANIFEST:END -->

### Implementation Plan

1. Serialize the exact backend request DTO in the shared start API.
2. Narrow shared status normalization to authoritative wire fields, preserve completed zero, structured error details, and status date range, and derive the existing route-compatible `error_message`.
3. Emit sanitized diagnostics for missing or future status values while retaining non-terminal frontend `unknown`.
4. Derive polling intervals from normalized lifecycle data and stop only at completed/failed.
5. Validate the full frozen manifest, run two independent reviews, and use the canonical protected delivery/cleanup fence.

### Completion Notes

- Preflight, behavioral RED, privacy scan, and corrected pre-implementation review are complete.
- No production file has been edited before this evidence artifact.
- The first review correctly blocked a TanStack-internal test, stale unsupported camelCase/count behavior, and incomplete malformed-status diagnostics; all three were corrected before this PASS freeze.

### File List

- `_bmad-output/implementation-artifacts/169-15-fe-align-shared-frontend-paid-storage-import-boundary.md`
- `src/hooks/__tests__/useStorageAnalytics.test.ts`
- `src/hooks/useImportStatus.ts`
- `src/lib/api/__tests__/storage-analytics.test.ts`
- `src/lib/api/__tests__/storage-import-normalizer.test.ts`
- `src/lib/api/storage-analytics.ts`
- `src/lib/api/storage-import-normalizer.ts`
- `src/types/storage-analytics-trends.ts`

## Change Log

- 2026-08-27: Added immutable Story base, corrected behavioral RED, independent privacy/manifest review, and frozen seven-path implementation evidence.
- **Lessons:** Test observable polling behavior, not library internals.
- **Lessons:** Authoritative row counts exist only after completion.
