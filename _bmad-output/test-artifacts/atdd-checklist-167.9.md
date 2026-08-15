# ATDD Checklist — Story 167.9

**Story:** Enforce Account-Scoped Conditional Cabinet Settlement
**Phase:** RED design only
**Status:** Planned; blocked on merged Story 167.8; no scenario is claimed passing

## Acceptance Test Scenarios

- [ ] RED: account A request carries immutable A session/account/operation context through API transport.
- [ ] RED: A pending → B live → A success cannot change B token, user, cabinet, or session.
- [ ] RED: A pending → B live → A failure cannot show B a toast/error or clear/reset B state.
- [ ] RED: A pending → B → A with a different A session/operation cannot settle into the newer session.
- [ ] RED: logout/login during the request invalidates settlement against the former session.
- [ ] RED: stale settlement cannot navigate, reset the form, or clear another account's recovery marker.
- [ ] RED: the shared boundary returns exactly typed `applied | stale | indeterminate`; the minimal form consumer continues success effects only for `applied`.
- [ ] RED: `stale` and `indeterminate` consumer outcomes cannot toast, navigate, reset, clear a marker, or expose error UI.
- [ ] RED: supplied immutable token/session context is used; mutable global API context is not reread as authority.
- [ ] RED: real Story 167.8 unknown/in-progress/succeeded/failed outcomes reconcile without duplicate create.
- [ ] RED: mock-only reconciliation cannot satisfy integration GREEN when the local backend contract is absent.
- [ ] RED: recovery markers and logs contain no password, token, cabinet payload, or email.

## RED Evidence Contract

Retain the exact failing command, exit code, assertion, and current shared-boundary behavior. Tests must fail for the confirmed settlement/request-context defect, not because Story 167.8 is unmerged, fixtures are invalid, or imports are missing.

The consumer scenario may exercise only the reviewed `CabinetCreationForm` result-handling hunk. Route, presentation, validation, and recovery-marker implementation remain Story 167.5-owned.

## Planned Validation

Focused Vitest/integration tests and real local Story 167.8 contract proof, followed by `npm run format:check`, `npm run lint`, `npm run type-check`, `npm run check:max-lines`, `npm run build`, and `git diff --check`.

No GREEN, implementation, review, merge, or cleanup evidence exists at checklist creation.
