---
workflow: correct-course
initiative: shadcn-full-ui-migration
triggerStory: '169.12'
mode: batch
status: approved
date: 2026-08-24
scopeClassification: moderate
---

# Sprint Change Proposal — Story 169.12 Paid-Storage Import Contract Reconciliation

## 1. Issue Summary

### Trigger

Story 169.12, **Migrate Storage Analytics and Paid-Storage Import**, is the next backlog item after merged Story 169.11. Its route-only implementation surface is `src/app/(dashboard)/analytics/storage/**`, while its canonical acceptance criteria require a truthful paid-storage import lifecycle, result summary, safe recovery, and evidence for an import `partial` state.

The implementation-readiness audit found that the route cannot satisfy that contract using the current authoritative shared frontend and backend boundaries. This is not a presentation gap that can be repaired honestly inside the Story-owned route tree.

### Concrete evidence

1. **The canonical Story requires an import state that the endpoint does not expose.**

   - Canonical Story 169.12 currently requires `idle/uploading/processing/partial/success/failure` and explicit safe retry scope.
   - At the initial readiness audit, the shared frontend union was only `pending | processing | completed | failed` in `src/types/storage-analytics-trends.ts`.
   - At that same baseline, `src/lib/api/storage-import-normalizer.ts` accepted only those four values and converted any unknown status to `failed`.
   - Before this proposal was integrated, preface PR #226 merged at `2c7a3c5931dbc9890ed585eaf71f5717c04453b2`. It retained the four backend-authoritative wire values but added a frontend-only `unknown` sentinel, changed the normalizer to preserve unrecognized values as `unknown`, and kept that sentinel nonterminal in the route consumer. This preface removes the false `unknown -> failed` coercion; it does not complete Story 169.15's post-169.14 request, result/error, polling, diagnostic, contract-test, review, or cleanup work.
   - The route-local state machine is only `idle | processing | success | error` in `src/app/(dashboard)/analytics/storage/components/storage-import-utils.ts`.
   - The backend paid-storage status DTO and BullMQ status builder expose only `pending | processing | completed | failed`.
   - The paid-storage processor returns `{ rowsImported, importStrategy? }`; it does not return attempted, failed, skipped, pending, or retry-subset data.
   - The current import pipeline is all-or-failure for its requested range. It does not expose a paid-storage `partial` terminal result.

2. **The current frontend write request does not match the current backend DTO.**

   - `src/lib/api/storage-analytics.ts` serializes `{ date_from, date_to }`.
   - The backend `PaidStorageImportRequestDto` validates `{ dateFrom, dateTo }`.
   - The backend global `ValidationPipe` uses `whitelist: true` and `forbidNonWhitelisted: true`; it does not rename snake-case request keys. The current frontend payload is therefore not an authoritative match for the current backend controller contract.

3. **The backend start/status responses drift from their declared contract and from the frontend result UI.**

   - The backend response DTO documents `pending | processing | completed | failed`, but `PaidStorageImportController` currently returns `status: 'queued'` after enqueue.
   - `src/imports/dto/import-status.dto.ts` is the shared response DTO. Story 169.14 must add only an optional paid-storage result field there, audit every consumer, and prove that unrelated import-status response shapes remain unchanged.
   - The paid-storage status builder maps the BullMQ state but does not project the completed job return value to `rows_imported`.
   - The status builder returns a nested `error` object, while the frontend normalizer expects `error_message` or `errorMessage`.
   - The route success view reads `rows_imported` and falls back to `0`; the failure view falls back to a generic message. A route-only visual migration would preserve misleading result evidence rather than prove a trustworthy lifecycle.

4. **The Story plan's Playwright command selects no Story 169.12 test.**

   - `e2e/storage-analytics.spec.ts` contains the existing storage route test, but its test title has no `Story 169.12-FE` marker.
   - `npm run test:e2e` uses the bounded default `e2e/orders.spec.ts` target before forwarding CLI arguments.
   - Therefore `npm run test:e2e -- --grep "Story 169.12-FE"` searches the orders smoke for a marker that is not present and cannot validate the storage route.
   - The correct existing-spec command is `npm run test:e2e:full -- e2e/storage-analytics.spec.ts --project=chromium`. `--full` is required so the preflight forwards the explicit storage path instead of prepending the default orders spec.

5. **The current route baseline itself is stable.**

   Fresh baseline evidence on Node 24.18.0:

   ```text
   npx vitest run "src/app/(dashboard)/analytics/storage"
   Test Files: 12 passed
   Tests:      119 passed
   ```

   This is sufficient to lock current route behavior before presentation work, but it does not prove the cross-repository import lifecycle.

### Problem classification

- Primary: technical limitation and cross-repository contract drift discovered during implementation readiness.
- Secondary: canonical acceptance-criteria applicability error (`partial` was required without an authoritative paid-storage partial-result contract).
- Secondary: validation-command defect (zero-selection Story grep).
- Secondary: tracking documentation drift (master snapshot and sprint header still identify Story 169.11 as next, while sprint data and the debt registry identify Story 169.12).

## 2. Impact Analysis

### Epic impact

Epic 169-FE remains viable and retains its product goal. No route is removed and no existing route owner changes. Two non-route prerequisite Stories are required before Story 169.12:

1. **Story 169.14 — Establish the Authoritative Paid-Storage Import Lifecycle and Result Contract** in the backend repository.
2. **Story 169.15 — Align the Shared Frontend Paid-Storage Import Boundary** in the frontend repository.

Execution order becomes:

```text
169.14 backend authority
  -> 169.15 shared frontend boundary
    -> 169.12 route contract closeout
```

Story 169.13 remains technically independent, but it must not be used as evidence that Story 169.12 is complete. The orchestrator may execute it only according to the approved DAG and one-writer ownership rules.

### Story impact

- **169.12:** remains route-only; gains explicit prerequisites; replaces the impossible paid-storage `partial` requirement with authoritative lifecycle states. PR #227 merged its route presentation early, so the remaining delivery is a bounded contract closeout rather than a second migration. Route-level partial analytical sections remain required.
- **169.14:** new backend-only prerequisite and explicit cross-repository exception. It reconciles the paid-storage request, start response, poll response, terminal result, and failure contract.
- **169.15:** new shared-frontend prerequisite. It aligns types, request serialization, normalization, polling, and contract tests without editing the storage route.
- **169.13 and Epics 170–174:** no product-scope change. Epic 174 parity counts must reflect 94 Stories rather than 92 after approval.

The integration baseline includes frontend preface PR #226 (`2c7a3c5931dbc9890ed585eaf71f5717c04453b2`). Its exact eleven-file surface was:

```text
src/app/(dashboard)/analytics/storage/components/TopConsumersWidget.tsx
src/app/(dashboard)/analytics/storage/components/useStorageImport.ts
src/components/custom/dashboard/StorageTopConsumersWidget.tsx
src/lib/api/__tests__/storage-import-normalizer.test.ts
src/lib/api/__tests__/storage-queries-normalizer.test.ts
src/lib/api/storage-import-normalizer.ts
src/lib/api/storage-queries-normalizer.ts
src/test/fixtures/storage-analytics.ts
src/types/storage-analytics-trends.ts
src/types/storage-analytics/by-sku.ts
src/types/storage-analytics/top-consumers.ts
```

Only the three shared import-boundary paths in that preface overlap Story 169.15's allowed surface. The route and unrelated storage-query paths remain outside Story 169.15 ownership. Story 169.15 must start from PR #226 or a descendant, treat its `unknown` sentinel behavior as locked baseline rather than RED work, and prove only the remaining gaps against the merged Story 169.14 contract.

### PRD impact

No PRD goal or MVP scope changes. The PRD requires truthful recovery and preservation of established backend behavior; the proposal restores that invariant rather than adding a new product capability.

### Architecture impact

No technology-stack change and no new dependency are proposed. The existing boundary remains:

```text
backend DTO/controller/status builder
  -> shared frontend API/type/normalizer/hooks
    -> route-owned state and presentation
```

The change makes each layer authoritative for its existing responsibility. It does not move domain logic into generic shadcn primitives or product compositions.

### UX impact

No change to the generic UX specification is required. Its `partial success` contract is explicitly conditional on an operation having authoritative succeeded/failed scope. For the current paid-storage endpoint, import-level partial success is not applicable. Route-level partial analytical data remains applicable and must still identify trustworthy and unavailable sections.

### Route-ledger impact

No route-ledger row is added or reassigned. `/analytics/storage` remains owned exactly once by Story 169.12. Stories 169.14 and 169.15 are non-route prerequisites and receive no ledger row.

### Backend exception invariant

Exactly Stories 167.8 and 169.14 are backend exceptions. Story 167.8 remains bounded to the authoritative cabinet session reconciliation/create-idempotency contract; Story 169.14 is separately bounded to the authoritative paid-storage import request/lifecycle/result/error contract. Neither Story has a route-ledger row, and no other Story inherits either exception.

A frontend coordination artifact may not claim either backend Story `review`, `done`, backend completion, or cleanup without the exact backend merge SHA, proof that SHA is an ancestor of current backend `main`, proof that the Story's local and remote backend branches are absent, and backend worktree removal/prune evidence.

### Test and delivery impact

- Add backend contract and integration tests under Story 169.14.
- Add shared frontend API/normalizer/hook contract tests under Story 169.15.
- Keep Story 169.12 route tests inside its route-owned surface.
- Run the existing storage Playwright spec by exact path through the full preflight forwarding mode.
- Continue local-only validation; no required CI gate, deploy, direct push to `main`, or force-push is introduced.

## 3. Recommended Approach

### Recommendation: Direct Adjustment with two sequential prerequisites

Classify the change as **Moderate** because it reorganizes the backlog and adds one explicitly bounded backend exception plus one shared frontend owner Story. It does not redefine the product, replace an Epic, or reduce route scope.

Why this path is recommended:

- It preserves the requested full migration outcome rather than declaring a broken import lifecycle out of scope.
- It keeps Story 169.12 route-only and prevents forbidden edits to shared types, API clients, hooks, or backend files from leaking into the route PR.
- It makes result counts and failure evidence authoritative before the route presents them.
- It avoids fabricating a paid-storage `partial` state that neither repository can support truthfully.
- It creates behavior-locking contract tests at the layer that owns each behavior.
- It retains the current UX rule: partial success is required where the API actually exposes partial scope, not as a decorative state label.

### Effort and risk

| Work item                                                | Estimated effort | Risk   |
| -------------------------------------------------------- | ---------------- | ------ |
| Correct Course documentation and plan parity             | Low              | Low    |
| Story 169.14 backend contract reconciliation             | Medium           | Medium |
| Story 169.15 shared frontend boundary alignment          | Low–Medium       | Medium |
| Story 169.12 route contract closeout after prerequisites | Medium–High      | Medium |

The principal risk is accidental contract expansion. Mitigation is exact request/response fixtures, local backend/frontend contract tests, strict ownership, sequential merge order, and no paid-storage `partial` claim without counts and retry scope.

### Alternatives considered

#### Alternative A — Route-only adjustment and mark import partial as N/A

Not recommended as the complete solution. It resolves the impossible `partial` wording and E2E target, but leaves the request-key mismatch, undocumented `queued` response, missing row count, and lost error detail unresolved. Story 169.12 would still be unable to prove its full import-lifecycle acceptance criteria.

#### Alternative B — Add a backend partial-result feature

Not recommended for this migration. It would require a new public contract for attempted/succeeded/failed/skipped counts, partial status, retry subset, and duplicate-execution safety. The current endpoint processes one bounded date range and exposes an all-or-failure lifecycle. Adding partial semantics would be new product/backend scope rather than contract reconciliation.

#### Alternative C — Roll back completed migration Stories

Not viable. Stories 166–169.11 do not cause the paid-storage contract drift, and rollback provides no simplification.

#### Alternative D — Reduce migration/MVP scope by dropping paid-storage import

Not viable. Story 169.12 explicitly owns the existing import UI and FR16/FR27 require preserving the complete owned render tree and implemented operational workflow.

## 4. Detailed Change Proposals

### 4.1 Canonical Epic/Story artifact

Artifact: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md`

#### A. Story 169.12 — Shared Dependencies

OLD:

```text
C2; existing storage hooks/contracts, import endpoint/lifecycle, URL filters, and financial formatting.
```

NEW:

```text
C2; merged Story 169.14 authoritative backend paid-storage import contract;
merged Story 169.15 shared frontend paid-storage import boundary; existing
storage analytics hooks/contracts, URL filters, and financial formatting.
```

Rationale: route implementation must consume an already-merged truthful contract and may not edit forbidden shared/backend files.

#### B. Story 169.12 — Acceptance criterion 2

OLD:

```text
Given no data, filtered-empty, stale/partial sections, import
idle/uploading/processing/partial/success/failure, or background refresh, when
rendered, then current trustworthy data remains visible and import outcome/safe
retry scope is explicit.
```

NEW:

```text
Given no data, filtered-empty, stale/partial analytical sections, import idle,
validation/submission, pending, processing, success, or failure, or background
refresh, when rendered, then current trustworthy data remains visible and the
authoritative import outcome plus safe whole-range retry guidance is explicit.
Paid-storage import partial success is not applicable unless a future approved
backend contract exposes partial counts and a safe retry subset; the route must
not synthesize it.
```

Rationale: preserves route-level partial data while removing an impossible import-level state.

#### C. Story 169.12 — State Coverage

OLD:

```text
SC plus week-filter mismatch, alert, import
validation/uploading/processing/partial/success/failure, and per-section error states.
```

NEW:

```text
SC plus week-filter mismatch, alert, import idle, validation/submission, pending,
processing, success, failure, and per-section error states. Paid-storage import
partial success is N/A under the merged 169.14 contract; route-level partial
analytical sections remain required.
```

#### D. Story 169.12 — Test and Visual Evidence

OLD:

```text
VE plus alert, filtered-empty, partial section, and full import lifecycle evidence.
```

NEW:

```text
VE plus alert, filtered-empty, partial analytical section, and the complete
authoritative import lifecycle from idle through success/failure, including
request/status/result contract evidence. No import partial-success screenshot is
required while that state is contractually N/A.
```

#### E. Add Story 169.14

```text
Story 169.14: Establish the Authoritative Paid-Storage Import Lifecycle and Result Contract

Requirements: FR16, FR18, FR19, FR20, FR35
Repository: backend (`/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new`)
Branch: cdx/epic-169-story-14-paid-storage-import-contract
Worktree: /private/tmp/wb-repricer-be-169-14-paid-storage-import-contract

Outcome:
- one canonical request key contract for the paid-storage trigger;
- start response uses a documented lifecycle value;
- polling exposes pending/processing/completed/failed only;
- `src/imports/dto/import-status.dto.ts` gains only an optional paid-storage result field after a complete shared-consumer audit;
- completed status exposes the authoritative imported-row result;
- failed status exposes actionable error detail;
- cabinet isolation and existing queue/retry behavior remain unchanged;
- DTO/OpenAPI regression proof preserves unrelated import-status consumers and forbids casts or unrelated response-shape broadening;
- no partial-success status is introduced.

Prerequisites: current backend main; no overlapping backend writer.
No route-ledger row.
```

#### F. Add Story 169.15

```text
Story 169.15: Align the Shared Frontend Paid-Storage Import Boundary

Requirements: FR16, FR18, FR19, FR20, FR35
Repository: frontend
Branch: cdx/epic-169-story-15-storage-import-boundary
Worktree: /private/tmp/wb-repricer-fe-169-15-storage-import-boundary

Outcome:
- frontend request serialization matches merged Story 169.14;
- shared types and normalizers accept exactly the authoritative lifecycle;
- polling continues through pending/processing and stops at completed/failed;
- rows imported and error details are preserved at the boundary;
- the four backend-authoritative wire values remain distinct from the frontend-only `unknown` sentinel; unrecognized values stay distinguishable from `failed`, emit defensive diagnostics, and never become false success/failure evidence;
- shared contract tests lock request, response, result, and failure behavior;
- no route-owned presentation changes.

Prerequisites: merged Story 169.14 backend contract.
No route-ledger row.
```

### 4.2 OMX master plan

Artifact: `.omx/plans/shadcn-full-ui-migration-master.md`

Proposed edits:

1. `expectedStories: 92` → `expectedStories: 94`.
2. Replace every invariant that calls Story 167.8 the _sole_ backend exception with an explicit exception set: Stories 167.8 and 169.14, each limited to its declared backend surface and evidence.
3. Add DAG edges `169.14 -> 169.15 -> 169.12`.
4. Add plan-index rows for 169.14 and 169.15 with exact branches/worktrees.
5. Update parity acceptance from 92 to 94 Stories/plans while keeping 76 route rows.
6. Refresh the dated status snapshot:

   ```text
   completed before new prerequisites: 39
   total after approval: 94
   Epic 169 shipped: 11/15
   NEXT: 169.14 -> 169.15 -> 169.12
   independent remaining route: 169.13
   ```

### 4.3 Story 169.12 OMX plan

Artifact: `.omx/plans/169.12-migrate-storage-analytics-and-paid-storage-import.md`

Proposed edits:

- add merged 169.14 and 169.15 to the prerequisite stop gate and DAG;
- replace every import `partial` matrix entry with the authoritative disposition above;
- distinguish route-level partial analytical sections from import partial success;
- require request/status/result contract evidence from prerequisite artifacts;
- replace the zero-selection E2E command.

OLD:

```bash
npm run test:e2e -- --grep "Story 169.12-FE"
```

NEW:

```bash
npm run test:e2e:full -- e2e/storage-analytics.spec.ts --project=chromium
```

Rationale: the default `test:e2e` preflight prepends `e2e/orders.spec.ts`; the current storage spec has no Story grep marker. Full-mode forwarding with an exact path selects the existing storage test without editing the forbidden external E2E file.

### 4.4 New OMX plans

Add:

```text
.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md
.omx/plans/169.15-align-shared-frontend-paid-storage-import-boundary.md
```

Each plan must contain exact Owned/Allowed/Forbidden surfaces, prerequisite SHAs, validation, two independent review passes, PR/merge evidence, and mandatory local/remote branch plus worktree cleanup.

Update `.omx/plans/174.1-prove-bmad-route-ledger-and-omx-plan-parity.md` so its downstream parity contract uses the approved `94 Stories = 94 OMX plans` invariant and validates both separately bounded backend exceptions, Stories 167.8 and 169.14. Leaving its former `92/92` and sole-167.8 wording would make the approved canonical package internally contradictory.

### 4.5 Sprint backlog

Artifact: `_bmad-output/implementation-artifacts/sprint-status.yaml`

The initially approved execution order placed all three rows in `backlog`:

```yaml
169-14-fe-establish-authoritative-paid-storage-import-lifecycle-and-result-contract: backlog
169-15-fe-align-shared-frontend-paid-storage-import-boundary: backlog
169-12-fe-migrate-storage-analytics-and-paid-storage-import: backlog
```

The existing 169.12 key is not duplicated. After concurrent PR #227 merged its route presentation, its lifecycle is reconciled to `review`, not `done`: both prerequisites and final contract-closeout evidence remain incomplete. Update `last_updated` and the summary comment to identify 169.14 as NEXT.

### 4.6 Migration status/debt registry

Artifact: `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`

Correct the already-inconsistent Epic 169 table and record the approved prerequisite chain:

```text
Epic 169 total: 13 -> 15
Epic 169 shipped: 10 -> 11
Remaining: 169.14 -> 169.15 -> 169.12; 169.13 remains independent
```

### 4.7 Route ledger, UX, PRD, and architecture

No edits proposed:

- `_bmad-output/planning-artifacts/shadcn-route-ledger.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `docs/prd.md`
- `docs/front-end-architecture.md`
- `docs/front-end-spec.md`

Their current generic requirements remain valid. The Correct Course changes applicability and ownership, not product goals or route mapping.

### 4.8 Exact documentation-package staging and merge manifest

The documentation PR contains exactly these ten files and no others. The tenth path is the already-existing Story 169.12 implementation artifact, added only because concurrent PR #227 merged it with stale pre-merge lifecycle text while this package was under review:

```text
.omx/plans/169.12-migrate-storage-analytics-and-paid-storage-import.md
.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md
.omx/plans/169.15-align-shared-frontend-paid-storage-import-boundary.md
.omx/plans/174.1-prove-bmad-route-ledger-and-omx-plan-parity.md
.omx/plans/shadcn-full-ui-migration-master.md
_bmad-output/implementation-artifacts/169-12-fe-migrate-storage-analytics-and-paid-storage-import.md
_bmad-output/implementation-artifacts/sprint-status.yaml
_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md
_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-24.md
```

The proposal and both new Story plans are ignored in a normal status view, so the docs owner must force-stage exactly those three paths. Stage the other seven tracked documents explicitly, then compare the cached manifest byte-for-byte with the expected sorted ten-file manifest:

```bash
DOCS_WORKTREE="/private/tmp/wb-repricer-fe-169-12-correct-course"
EXPECTED_DOCS_MANIFEST="$(printf '%s\n' \
  '.omx/plans/169.12-migrate-storage-analytics-and-paid-storage-import.md' \
  '.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md' \
  '.omx/plans/169.15-align-shared-frontend-paid-storage-import-boundary.md' \
  '.omx/plans/174.1-prove-bmad-route-ledger-and-omx-plan-parity.md' \
  '.omx/plans/shadcn-full-ui-migration-master.md' \
  '_bmad-output/implementation-artifacts/169-12-fe-migrate-storage-analytics-and-paid-storage-import.md' \
  '_bmad-output/implementation-artifacts/sprint-status.yaml' \
  '_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md' \
  '_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md' \
  '_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-24.md' | sort)"

test -z "$(git -C "$DOCS_WORKTREE" diff --cached --name-only)"
git -C "$DOCS_WORKTREE" add -- \
  '.omx/plans/169.12-migrate-storage-analytics-and-paid-storage-import.md' \
  '.omx/plans/174.1-prove-bmad-route-ledger-and-omx-plan-parity.md' \
  '.omx/plans/shadcn-full-ui-migration-master.md' \
  '_bmad-output/implementation-artifacts/169-12-fe-migrate-storage-analytics-and-paid-storage-import.md' \
  '_bmad-output/implementation-artifacts/sprint-status.yaml' \
  '_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md' \
  '_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md'
git -C "$DOCS_WORKTREE" add -f -- \
  '.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md' \
  '.omx/plans/169.15-align-shared-frontend-paid-storage-import-boundary.md' \
  '_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-24.md'

CACHED_DOCS_MANIFEST="$(git -C "$DOCS_WORKTREE" diff --cached --name-only | sort)"
test "$CACHED_DOCS_MANIFEST" = "$EXPECTED_DOCS_MANIFEST"
git -C "$DOCS_WORKTREE" diff --cached --check
```

Stop before commit if any expected file is missing, any eleventh file is cached, or either manifest differs. Do not replace the explicit commands with `git add .`, `git add -A`, or another repository-wide staging expression.

### 4.9 Independent-review traceability and manifest supersession

Fresh review pass 1 requested seven mandatory corrections, all incorporated before integration:

1. Replace the stale “Story 167.8 alone” invariant with exactly two separately bounded backend exceptions, Stories 167.8 and 169.14, each requiring backend merge-SHA ancestry and complete branch/worktree cleanup proof and neither owning a route-ledger row.
2. Add the shared `src/imports/dto/import-status.dto.ts` optional paid-storage result field to Story 169.14's exact allowed surface, with shared-consumer, DTO, and OpenAPI regression proof and no cast or unrelated response-shape broadening.
3. Split Story 169.12's prerequisite stop gate into backend-main evidence for Story 169.14 and frontend-main evidence for frontend prerequisites, then create the route worktree only from refreshed frontend `main`.
4. Replace the invalid backend E2E invocation that combined `--maxWorkers=1` and `--runInBand` with `npm run test:e2e -- test/imports/paid-storage.e2e-spec.ts`.
5. Replace broad diff-derived staging in Stories 169.12, 169.14, and 169.15 with Story-specific allowlists, extra/missing-file stops, explicit staging, and exact cached-manifest equality.
6. Force-stage only the ignored approved proposal and the two new ignored OMX plans, then prove the complete cached documentation manifest before commit.
7. Reconcile the status/debt registry from stale `11/13`, protected-WIP, and historical base wording to `11/15` plus PR #225 merge/cleanup evidence, while preserving the still-relevant Story 172.6 prerequisite and ownership warnings.

Fresh review pass 2 then requested six additional execution-contract corrections, all incorporated before integration:

1. Replace Story 174.1's dirty-worktree-derived staging with a predeclared reviewed manifest, empty-index proof, exact actual-manifest equality, quoted per-path staging, and exact cached-manifest equality.
2. Require Story 169.15 to consume the exact recorded Story 169.14 merge SHA, refresh backend `origin/main`, prove ancestry against refreshed backend refs, and prove complete backend branch/worktree cleanup before frontend worktree creation.
3. Require Story 169.12 to consume exact recorded merge SHAs for Epic 166, Stories 167.1, 168.1, 169.14, and 169.15; refresh the appropriate repository; prove each ancestor against the appropriate `origin/main` and local `main`; and prove prerequisite cleanup before route worktree creation.
4. Replace Story 174.1's route-migration, browser, visual, accessibility, and render-tree boilerplate with planning/parity-validator-specific RED/GREEN fixtures, evidence, review, risk, and acceptance contracts; runtime UI remains forbidden.
5. Separate Story 169.14's unconditional required paths from optional allowed paths and forbid implicit conditional expansion: any newly necessary fixture or OpenAPI path requires an ownership correction that updates the plan and reviewed manifest before editing.
6. Replace Story 169.12's fixed snapshot allowlist and forced fourteen-file edit set with a frozen post-RED reviewed manifest, an acceptance-necessary required subset, route-root containment checks, exact actual/cached equality, and a separate review/refreeze requirement for later colocated-test additions.

Fresh final review then found one remaining manifest-control inconsistency, incorporated before integration: Story 169.15 now consumes the exact pre-edit `STORY_169_15_FROZEN_REVIEWED_MANIFEST`, proves it remains inside the static allowlist and contains every acceptance-required path, requires the final working-tree manifest to equal that frozen scope, and requires a separate ownership/scope review, affected RED rerun, manifest re-freeze, and both-review inclusion for any later path addition.

The expanded final review found two additional Story 174.1 execution-control inconsistencies, both incorporated before integration: its predeclared reviewed manifest is now machine-constrained to the positive planning/validator/evidence path surface before actual-diff comparison or staging, and its frontmatter is `blocked-on-prerequisites` until all Stories in Epics 166–173 are merged and all 76 route-ledger completion records are available. Any later expansion of the positive path surface requires an ownership correction, affected validation rerun, manifest re-freeze, and inclusion in both independent reviews.

A supplemental independent review then found three final delivery-authority gaps, all incorporated before integration: Story 174.1 now uses an explicit static nine-path allowlist instead of planning-directory wildcards and excludes the read-only UX specification plus unrelated historical planning; Stories 169.14 and 169.15 now distinguish their mandatory exact post-merge branch/worktree cleanup from forbidden destructive cleanup outside that scope; and the nine-file documentation staging procedure now requires an empty index before it stages any path.

The final current-byte review then detected that frontend `origin/main` had advanced through preface PR #226 while this package still described `069fd000` as the current shared-boundary baseline. The package was first reconciled onto merge `2c7a3c5931dbc9890ed585eaf71f5717c04453b2`: this proposal records PR #226's exact eleven-file surface, distinguishes the four authoritative backend lifecycle values from the frontend-only `unknown` sentinel, keeps Story 169.15 in `backlog`, and changes its RED/frozen-manifest contract so already-merged preface behavior is locked rather than recreated.

Before that corrected package could be staged, concurrent PR #227 merged the 27-file Story 169.12 route presentation plus its implementation artifact at `52f7f5061d73f5633fbc0fe575ff35f2055be194`. The final package was therefore reconciled again onto PR #227. The route delivery is retained, but it cannot satisfy the approved cross-repository contract criteria: Story 169.12 is now `review`/`blocked-on-prerequisites`, the remaining DAG is `169.14 -> 169.15 -> 169.12 contract closeout`, and the future lane uses `cdx/epic-169-story-12-contract-closeout`. The existing implementation artifact becomes the tenth documentation path solely to correct its stale “PR pending” state and record the remaining closeout task; no runtime, route-ledger, UX, PRD, architecture, package, dependency, E2E, or production file is added to this Correct Course PR.

The first reviewed package target contained eight files. A later full-parity scan added only the Story 174.1 plan, producing the reviewed nine-file target. Concurrent PR #227 then made the Story 169.12 implementation artifact materially stale, so section 4.8's explicit ten-file manifest supersedes both earlier targets. The two additions are limited to the downstream parity plan and the existing trigger-Story lifecycle artifact.

## 5. Change Navigation Checklist

### 1. Understand the Trigger and Context

- [x] **1.1** Triggering Story identified: 169.12.
- [x] **1.2** Core problem defined: technical contract limitation/drift plus an inapplicable state requirement and invalid E2E selector.
- [x] **1.3** Evidence collected from canonical Story/plan, current route/shared frontend source, current backend DTO/controller/status builder/processor, E2E preflight, E2E spec, and fresh targeted tests.

### 2. Epic Impact Assessment

- [x] **2.1** Epic 169 remains achievable after prerequisite correction.
- [x] **2.2** Two prerequisite Stories and the Epic 169 count/DAG are approved for canonical application.
- [x] **2.3** Remaining Epics reviewed; no route scope changes, but Epic 174 parity count changes to 94.
- [N/A] **2.4** No Epic becomes obsolete and no new Epic is needed.
- [x] **2.5** Remaining execution priority is 169.14 → 169.15 → 169.12 contract closeout; numeric identity remains canonical and does not imply execution order.

### 3. Artifact Conflict and Impact Analysis

- [x] **3.1** PRD reviewed; no conflict or edit required.
- [x] **3.2** Architecture reviewed; boundary ownership is preserved, with bounded backend/shared prerequisite work.
- [x] **3.3** UX reviewed; generic partial-success rules remain unchanged, while paid-storage applicability is corrected.
- [x] **3.4** Canonical Epic, master plan, two new OMX plans, Story 169.12 plan, downstream Story 174.1 parity plan, sprint status, and debt registry are approved for update. Route ledger and runtime route source remain unchanged during Correct Course.

### 4. Path Forward Evaluation

- [x] **4.1 Direct Adjustment:** viable; medium effort; medium risk.
- [N/A] **4.2 Rollback:** not viable or beneficial.
- [N/A] **4.3 MVP Review:** no scope reduction is required or recommended.
- [x] **4.4 Selected path:** Direct Adjustment with two sequential prerequisites.

### 5. Sprint Change Proposal Components

- [x] **5.1** Issue summary complete.
- [x] **5.2** Epic/story/artifact impact documented.
- [x] **5.3** Recommendation and alternatives documented.
- [x] **5.4** MVP unchanged; action plan and sequencing defined.
- [x] **5.5** Agent handoff defined below.

### 6. Final Review and Handoff

- [x] **6.1** Applicable checklist sections completed; action-needed items are explicit.
- [x] **6.2** Proposal checked against current source, tests, Story plan, route ledger, sprint backlog, and backend authority.
- [x] **6.3** Explicit owner approval was received for the two sequential prerequisite Stories and canonical backlog/DAG updates.
- [x] **6.4** Sprint backlog is updated as part of the approved canonical documentation change.
- [x] **6.5** Responsibilities, sequence, and success criteria are defined.

## 6. Implementation Handoff

### Classification

**Moderate** — backlog reorganization and cross-repository coordination are required, but the Epic/product architecture remains intact.

### Recipients and responsibilities

1. **Product Owner / Scrum Master / migration orchestrator**
   - apply the approved canonical edits in one docs-only feature branch/worktree/PR;
   - add both Story artifacts/plans and update counts/DAG/backlog;
   - merge and fully clean the docs branch/worktree.

2. **Backend development owner — Story 169.14**
   - implement only the declared paid-storage request/start/status/result contract;
   - preserve cabinet isolation, queue behavior, data processing, and idempotent storage semantics;
   - add unit/integration/contract tests;
   - complete review, PR, merge, and cleanup in the backend repository.

3. **Shared frontend boundary owner — Story 169.15**
   - align shared API serialization, types, normalizer, hooks, and tests to merged 169.14;
   - make no route presentation change;
   - complete review, PR, merge, and cleanup in the frontend repository.

4. **Route contract-closeout owner — Story 169.12**
   - retain PR #227's merged route presentation and create the exact contract-closeout worktree only after 169.14 and 169.15 merge SHAs are present;
   - modify only `src/app/(dashboard)/analytics/storage/**` when post-prerequisite validation proves a route-owned correction is necessary;
   - do not repeat or revert the already-merged shadcn presentation migration;
   - validate the truthful import lifecycle without synthesizing partial success;
   - complete two fresh reviews, PR/merge, documentation closeout, and cleanup.

### Success criteria

The Correct Course is implemented successfully when:

1. Canonical Story/plan/parity/backlog artifacts agree on 94 Stories, 76 routes, and the new prerequisite chain.
2. Backend trigger and status endpoints have one tested request/status/result/error contract.
3. Shared frontend types, serialization, normalization, and polling match that backend contract.
4. Story 169.12 retains PR #227, changes only its route-owned surface when contract closeout proves a correction is necessary, and passes targeted tests, exact-path storage E2E, universal local validation, responsive/theme/accessibility evidence, and two independent reviews against merged Stories 169.14 and 169.15.
5. Paid-storage partial success is not claimed without authoritative counts and retry scope; route-level partial analytical data remains covered.
6. Every docs/backend/frontend feature branch and temporary worktree is deleted after merge.
7. No deploy, production operation, required CI gate, direct push to `main`, or force-push occurs.

## 7. Approval Decision

This proposal is **approved for implementation**. The owner approved the two sequential prerequisite Stories and authorized the canonical Epic, master DAG, and sprint-backlog updates. Implementation remains constrained to separate branches/worktrees/PRs in the approved order; deploys, production operations, direct pushes to `main`, and force-pushes remain forbidden.
