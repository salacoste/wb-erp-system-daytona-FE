# Sprint Change Proposal — Story 167.5 Cross-Account Cabinet Settlement

**Status:** APPROVED — FINAL
**Mode:** Batch
**Date:** 2026-08-15
**Trigger:** Story 167.5 — Migrate Cabinet Onboarding `/cabinet`
**Classification:** Major — cross-repository public contract and shared auth/session boundary
**Owner decision:** Approved two sequential prerequisite Stories, canonical epics/master DAG/sprint backlog changes, and execution in separate branches/worktrees/PRs. Deployment, production operations, direct push to `main`, and force-push remain forbidden.

## Issue and Evidence

Story 167.5 cannot satisfy its behavior-preservation and recovery acceptance criterion within its route-owned surface. Independent review and honest A/B timing tests proved two shared gaps:

1. Backend cabinet creation has no durable account-scoped idempotency operation or authoritative status reconciliation. The frontend's putative auth refresh helper does not correspond to a real backend endpoint, so mock-only reconciliation is not production evidence.
2. Shared frontend settlement can commit account A's late cabinet response into global auth/cabinet state after account B becomes live. `createCabinet(data, _token?)` ignores the supplied token, while the API client rereads mutable global state.

The reviewed Story 167.5 work may suppress some stale UI effects, but it cannot make the shared auth commit or server outcome authoritative without crossing forbidden ownership.

## Approved Correction

```text
167.8 Establish Authoritative Cabinet Session Reconciliation and Create-Idempotency Contracts
  -> 167.9 Enforce Account-Scoped Conditional Cabinet Settlement
     -> resume and merge 167.5 Migrate Cabinet Onboarding
        -> 167.6 Migrate Processing
        -> 167.7 Migrate WB Token
```

Numeric Story order is identity, not execution order. Higher-numbered owner-approved correct-course prerequisites execute first when the canonical DAG requires it. Stories 167.8 and 167.9 are non-route prerequisites; the 76 route-ledger rows remain unchanged.

### Story 167.8

- Title: Establish Authoritative Cabinet Session Reconciliation and Create-Idempotency Contracts
- Repository: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new`
- Branch: `cdx/epic-167-story-8-cabinet-reconciliation-contract`
- Worktree: `/private/tmp/wb-be-167-8-cabinet-reconciliation-contract`
- Status at proposal finalization: `ready-for-dev`; no implementation claim.
- Outcome: durable JWT-account-bound idempotent cabinet create plus authoritative unknown/in-progress/succeeded/failed reconciliation, deterministic payload conflicts, cross-account privacy, database/audit/API documentation proof.
- Contract endpoint/schema must be frozen in RED tests and OpenAPI before production code; planning does not guess them.

### Story 167.9

- Title: Enforce Account-Scoped Conditional Cabinet Settlement
- Repository: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`
- Branch: `cdx/epic-167-story-9-account-scoped-cabinet-settlement`
- Worktree: `/private/tmp/wb-fe-167-9-account-scoped-cabinet-settlement`
- Status at proposal finalization: `backlog`, blocked on merged 167.8; no implementation claim.
- Outcome: immutable initiating account/session/operation request context and typed `applied | stale | indeterminate` conditional settlement; only a minimal reviewed `CabinetCreationForm` consumer hunk may continue existing success effects for `applied`, while stale/indeterminate cannot toast, navigate, reset, or clear a marker; route, presentation, validation, and recovery-marker implementation remain Story 167.5-owned; privacy markers contain no password, token, cabinet payload, or email; real 167.8 integration is required.

## Story 167.5 Preservation and Alignment

Story 167.5 remains `in-progress`. Its dirty worktree `/private/tmp/wb-fe-167-5-migrate-cabinet-onboarding` contains reviewed, unstaged Story work and remains separate from these canonical updates.

Do not use `git reset --hard`, destructively rebase the dirty lane, overwrite unstaged Story files, manufacture a new freeze, or claim commit/PR/merge/cleanup. After 167.8 and 167.9 merge, preserve the reviewed slice as an explicit patch/commit or other non-destructive recovery point, refresh from updated `main`, integrate deliberately, rerun the A/B and full final validation, generate a new immutable freeze, and require fresh sequential independent reviews.

## Impact

- Program totals: 92 BMAD Stories and 92 numeric OMX plans.
- Epic counts: `166=8`, `167=9`, `168=11`, `169=13`, `170=7`, `171=9`, `172=17`, `173=13`, `174=5`.
- Routes and route-ledger rows remain 76.
- Story 167.6 now requires merged 167.5. Story 167.7 requires merged 167.5 and therefore the same prerequisite chain.
- Story 167.8 is the sole approved backend exception; ordinary frontend migration Stories continue to forbid backend changes.

## Alternatives Rejected

- Mock-only reconciliation: no real backend authority.
- Story-local restoration of an account-B token snapshot: duplicates security-sensitive state and still races newer state.
- Rollback of completed foundation work: does not repair the pre-existing shared boundary.
- Reduced acceptance criteria: duplicate create or cross-account state clobber is not acceptable migration behavior.

## Success and Stop Conditions

The correction is implemented only after 167.8 merges and cleans up, 167.9 consumes its real contract and merges/cleans up, the preserved 167.5 slice is safely aligned and fully revalidated, fresh reviews clear it, and 167.5 merges/cleans up before 167.6 or 167.7 begins.

This document records approval and canonical planning only. It does not claim implementation, freeze, review approval, commit, PR, merge, branch deletion, or worktree cleanup for Stories 167.8, 167.9, or 167.5.

## Change Navigation Checklist

| Item                           | Status   | Finding                                                                        |
| ------------------------------ | -------- | ------------------------------------------------------------------------------ |
| Trigger/evidence               | Complete | Story 167.5 review, A/B RED, backend/API and shared-settlement trace recorded. |
| Epic viability                 | Complete | Epic 167 remains viable with two prerequisites.                                |
| Direct adjustment              | Approved | 167.8 → 167.9 → 167.5 → 167.6/167.7.                                           |
| Canonical IDs/owners           | Complete | Exact IDs, titles, repositories, branches, and worktrees assigned.             |
| Explicit approval (6.3)        | Complete | Owner approval recorded 2026-08-15.                                            |
| Sprint/canonical updates (6.4) | Complete | Epics/master/sprint update authorized.                                         |
| Final handoff (6.5)            | Complete | Full plans, Story artifacts, ATDD skeletons, and execution order defined.      |
