# ATDD Checklist — Story 167.8

**Story:** Establish Authoritative Cabinet Session Reconciliation and Create-Idempotency Contracts
**Phase:** RED design only
**Status:** Planned; no scenario is claimed passing

## Acceptance Test Scenarios

- [ ] RED: first authenticated create records one durable account-scoped operation and cabinet.
- [ ] RED: same account + same key + same payload repeated serially returns/reconciles the same canonical operation/cabinet.
- [ ] RED: concurrent same-key/same-payload requests cannot create two cabinets.
- [ ] RED: same account/key with a different payload rejects with the frozen deterministic error.
- [ ] RED: reconciliation exposes explicit unknown, in-progress, succeeded, and failed states.
- [ ] RED: JWT account identity overrides/rejects any caller-supplied account identity.
- [ ] RED: account B cannot discover, infer, or settle account A's operation.
- [ ] RED: a late response after a committed create resolves to the same canonical result.
- [ ] RED: transaction failure cannot leave a cabinet and operation in contradictory states.
- [ ] RED: database uniqueness/account binding and audit fields survive restart/retry.
- [ ] RED: OpenAPI/API-path documentation matches the executable contract and endpoint-drift check.

## RED Evidence Contract

The executor must freeze the final endpoint, DTOs, responses, errors, and operation-state schema in tests/OpenAPI before implementation. Retain the exact failing command, exit code, assertion, and reason; missing imports, invalid fixtures, or environment failures do not count as behavioral RED.

## Planned Validation

Targeted unit/integration/e2e contract tests, followed by `npm run format:check`, `npm run lint:check`, `npm run type-check`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run check:endpoint-drift`, `npm run docs:validate`, and `git diff --check`.

No GREEN, implementation, review, merge, or cleanup evidence exists at checklist creation.
