# OMX Story Plan 164.1: Add Direct API Interceptor Error-Path Regression Tests

## Requirements Summary

As a frontend developer,
I want direct tests for every API interceptor branch,
So that error handling and observability can be maintained without accidental behavior changes.

- **Story ID:** 164.1
- **Epic:** 164-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `src/lib/api-interceptors.ts`
- `src/lib/api-client.ts`
- `src/lib/api-client.test.ts`
- `src/lib/__tests__/api-client.retry-after.test.ts`
- `src/lib/analytics/telegram-metrics-helpers.ts`
- `src/lib/logger.ts`

## Acceptance Criteria (canonical)

**Given** JSON, nested JSON, flat JSON, text, empty, and malformed error bodies
**When** `extractErrorMessage` is tested directly
**Then** it selects the documented message or fallback for each shape
**And** never throws while inspecting untrusted payloads.

**Given** `Retry-After` may be supplied through a header or JSON body
**When** parsing is tested for `429` and `503` responses
**Then** valid integers from 1 through 600 are accepted, with the header taking precedence
**And** zero, negatives, decimals, whitespace-only values, HTTP dates, non-finite values, and out-of-range values are rejected.

**Given** an API error is classified as an expected missing-WB-token response
**When** its status and message are evaluated
**Then** only the documented `401` WB-token condition is suppressed from error logging
**And** near matches, other statuses, and unrelated authentication errors remain observable.

**Given** an endpoint belongs or does not belong to the Telegram notification API
**When** HTTP and network tracking helpers run
**Then** Telegram metrics receive the correct endpoint, status, and message only for matching notification endpoints
**And** unrelated API traffic produces no Telegram metric.

**Given** the API logger receives JSON or non-JSON error data
**When** an unexpected error is logged
**Then** the correct serialized or raw payload branch is used
**And** expected-error suppression is verified independently from logging format.

**Given** `ApiClient` receives an HTTP `ApiError`, a network exception, or a request using `suppressNetworkErrorLog`
**When** integration-level tests execute
**Then** existing `ApiError` instances are rethrown without being reclassified as network failures
**And** network logging/tracking is suppressed only when explicitly requested.

**Given** the interceptor test suite is complete
**When** targeted coverage is collected
**Then** all exported interceptor helpers and their decision branches are exercised directly
**And** the full test suite, typecheck, zero-warning lint, and formatting checks pass without changing established product behavior.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Enumerate every message, Retry-After, WB-token, Telegram, logging, and network suppression branch.
3. Add direct table-driven unit tests around exported helpers plus focused ApiClient integration cases.
4. Collect targeted branch coverage before running the full local quality gates.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Mocks must not bypass the response/body/error shapes that define the real interceptor branches.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/lib/api-client.test.ts src/lib/__tests__/api-client.retry-after.test.ts src/lib/analytics`
- `npm run test:coverage -- --run src/lib/api-client.test.ts src/lib/__tests__/api-client.retry-after.test.ts`
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
