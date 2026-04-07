# BMad-Method Workflow Improvements — Issues to File

**Source**: Epic 86-FE retro action items #1-4 + #6 (D6 in 2026-04-07 quality hardening sprint)
**Target repo**: https://github.com/bmad-code-org/BMAD-METHOD
**Status**: Ready to file (manual step — requires GitHub access)
**Date**: 2026-04-07

---

## Why these are upstream issues, not local fixes

These improvements target the BMad-Method workflow tooling itself (the `bmad-method` npm package), not the WB Repricer frontend. They were surfaced during the Epic 86-FE retrospective as recurring footguns that affected multiple stories. Filing them upstream:

1. Benefits the entire BMad community, not just this project
2. Avoids forking workflow files and creating maintenance debt
3. Lets the maintainer (Murat / @bmad-code-org) make architectural decisions

If the upstream maintainer doesn't accept these, they can be implemented as **local workflow overrides** in `_bmad/bmm/workflows/` — but upstream fixes are preferred.

---

## Issue #1 (HIGH) — `dev-story` workflow needs Story File Completion Gate

**Title**: `dev-story workflow should refuse completion when story file is unupdated`

**Body**:

The `dev-story` workflow (`bmad-dev-story` skill) has a Step 8 that says to update the story file Status, Tasks/Subtasks, Dev Agent Record, and File List before marking sprint-status as `review`. However, the validation is **soft** — the workflow can mark sprint-status `review` while leaving the story file completely empty.

### Concrete example from production

Story 86.1 (`86-1-bid-recommendations-ui`) was committed with:
- `Status: ready-for-dev` (should be `review`)
- All `Tasks/Subtasks` boxes unchecked `[ ]`
- `Dev Agent Record → Completion Notes List` empty
- `Dev Agent Record → File List` empty

But sprint-status.yaml said `done`. The lie was only caught by an adversarial second code review with fresh context, hours later.

### Proposed fix

In `bmad-dev-story` workflow Step 8 (Validate and mark task complete), add a hard gate before allowing the step to complete:

```
GATE: Verify story file integrity
1. Read the story file
2. If Status == 'ready-for-dev' or 'in-progress' → HALT with error
3. If ANY task in Tasks/Subtasks list has unchecked checkbox `[ ]` → HALT with error
4. If File List section is empty → HALT with error
5. If Dev Agent Record → Completion Notes List is empty → HALT with error
6. If all checks pass → proceed to mark sprint-status `review`
```

The HALT messages should be loud and actionable: "Story file Status is still 'ready-for-dev' but you're trying to mark sprint-status `review`. Update the Status field first."

### Severity

**HIGH** — this caused a real process failure in Epic 86-FE that took an entire second code-review cycle to catch. Without this gate, the same bug will recur on every story in every project using BMad.

### Source

Action item #1 from Epic 86-FE retrospective:
`frontend/_bmad-output/implementation-artifacts/epic-86-fe-retro-2026-04-07.md`

---

## Issue #2 (HIGH) — `dev-story` workflow needs Task Verification Gate

**Title**: `dev-story workflow should verify each completed task has corresponding code/tests`

**Body**:

When marking the final task `[x]` in a story, the `dev-story` workflow should enumerate every task in the original list and confirm each has corresponding code or test artifact. Currently, a developer (or AI agent) can mark a task complete without writing the code.

### Concrete example from production

Story 86.1 had Task 5 explicitly listed: "Add click handler on campaign rows in advertising table to navigate to detail". The dev workflow marked Task 5 `[x]` but the click handler **was never implemented**. The campaign detail page existed but had no UI path to it — users would have had to manually craft URLs.

This was only caught in code review when the reviewer searched for `buildCampaignDetailRoute` and found zero callers in the advertising components.

### Proposed fix

Add a gate after Step 8 (or as part of Step 9) that runs a simple completion verification:

```
GATE: Task → Code Verification
For each task that mentions a file/function/route/class name:
1. Extract the keyword (e.g., 'buildCampaignDetailRoute', 'CAMPAIGN_DETAIL', 'click handler')
2. Grep the codebase (excluding the story file itself)
3. If keyword not found → HALT with: "Task X says 'add Y' but Y is not present in the codebase"
```

For tasks that don't mention specific identifiers, fall back to: "I have not been able to verify Task X automatically. Please confirm the implementation is in place."

### Severity

**HIGH** — same root cause as Issue #1 (lying-by-checkbox). The two gates work together: #1 catches "story file forgot to be updated", #2 catches "story file says done but code says no".

### Source

Action item #2 from Epic 86-FE retrospective.

---

## Issue #3 (HIGH) — `dev-story` and `create-story` need Backend Contract Verification

**Title**: `dev-story / create-story should require reading test-api files before writing API clients`

**Body**:

When implementing a story that touches a new backend API endpoint, the workflow currently allows the developer (or AI agent) to invent the contract from natural language description in the story file. This produces "build against an imaginary endpoint" failures that surface only during integration testing.

### Concrete example from production

Story 86.2 (Client Info PII) was planned with this estimated contract:
- `POST /v1/cabinets/:id/orders/client-info` with JSON body
- Response: `{ items: [{ orderId, name, phone }] }`

The actual backend contract (verified by reading `src/cabinets/cabinets.controller.ts` and `test-api/03-cabinets.http` BEFORE implementation):
- `GET /v1/cabinets/:id/orders/client-info?orderIds=123,456` (comma-separated query string)
- Response: bare array `[{ orderId: number, clientName?: string, clientPhone?: string }]`
- `orderId` is JSON `number`, but frontend `OrderFbsItem.orderId` is `string` (BigInt safety)
- Field names are `clientName` / `clientPhone`, not `name` / `phone`

EVERY assumption in the story estimate was wrong. Catching this BEFORE implementation saved ~2-4 hours of rework. But the workflow didn't enforce the verification step — the dev agent simply read the controller because of recent training.

### Proposed fix

Add a mandatory step early in `create-story` (during context loading) AND in `dev-story` Step 5 (before implementation):

```
GATE: Backend Contract Verification
For each task that mentions a new backend endpoint:
1. Identify the domain (orders, cabinets, products, etc.)
2. Search for `test-api/*.http` files in the parent monorepo or referenced backend repo
3. Search for the corresponding `*.controller.ts` file
4. If found → display the actual endpoint signature to the developer/agent
5. If not found → HALT with: "Could not verify backend contract for endpoint X. File a request before continuing."
6. Document any contract corrections in the story's Dev Agent Record
```

For frontend-only changes that don't touch backend, this gate is a no-op.

### Severity

**HIGH** — this is the highest-leverage gate because it prevents an entire class of failure (imaginary contracts) at the cheapest possible time (before any code is written).

### Source

Action item #3 from Epic 86-FE retrospective.

---

## Issue #4 (HIGH) — `code-review` workflow needs structured 8-point checklist

**Title**: `code-review workflow should use a structured checklist instead of free-form "find 3-10 issues"`

**Body**:

The current `code-review` workflow says "find at least 3-10 specific issues". This is open-ended and depends entirely on the reviewer's mental checklist. In practice, first reviews systematically miss issues that fresh-eye second reviews catch.

### Concrete example from production

Story 86.1 had ALREADY been code-reviewed once. Review #1 found 4 issues. A second adversarial review (different LLM context) found **12 additional issues** including HIGH severity ones:
- Story file completely unupdated
- Task 5 (navigation) not implemented
- Hook had no test file at all
- Component had no test file at all
- Multiple missing accessibility attributes
- `as any` cast bypassing TypeScript

That's a **4x miss rate** on the first review. The reviewer knew to "look for problems" but didn't have a structured checklist of WHERE to look.

### Proposed fix

Replace the free-form "find issues" instruction in `bmad-code-review` workflow with a structured 8-point checklist that the reviewer must walk through systematically:

```
For each story being reviewed, evaluate against ALL 8 categories:

1. STORY FILE INTEGRITY
   - [ ] Status updated (not 'ready-for-dev')
   - [ ] All tasks `[x]` checked
   - [ ] File List populated
   - [ ] Dev Agent Record → Completion Notes Listed

2. TASK → CODE MAPPING
   - [ ] Each listed task has corresponding code or test artifact
   - [ ] No "phantom tasks" (listed but not implemented)

3. TYPE SAFETY
   - [ ] No `as` casts (use widening with optional fields)
   - [ ] No `!` non-null assertions inside async closures
   - [ ] No `any` type usage
   - [ ] No `eslint-disable-next-line` for TypeScript rules

4. TEST COVERAGE
   - [ ] Hook has test file (if hook was created)
   - [ ] Component has test file (if component was created)
   - [ ] API function has test file (if API function was created)
   - [ ] Error paths are tested (not just happy paths)

5. ACCESSIBILITY
   - [ ] Decorative icons have aria-hidden="true"
   - [ ] Interactive elements have aria-label or visible label
   - [ ] Keyboard navigation works (no click-only handlers)
   - [ ] Color is not the sole carrier of meaning

6. CONSOLE / LOGGING DISCIPLINE
   - [ ] No console.log/info/debug in production code
   - [ ] Files handling sensitive data have ZERO console calls
   - [ ] No PII / tokens / passwords in error messages

7. FILE SIZE / COMPLEXITY
   - [ ] Each source file < 200 lines (project rule)
   - [ ] No monolithic functions > 50 lines
   - [ ] Pure helper functions extracted from hooks/components

8. PROCESS HYGIENE
   - [ ] beforeEach uses block body (not arrow expression)
   - [ ] Tests use mockRejectedValueOnce (not mockRejectedValue)
   - [ ] Mocks use proper types (not `as any`)
```

Each category should be evaluated in turn. Checkboxes that are unchecked become findings.

### Severity

**HIGH** — code review is the LAST defense before code lands. A 4x miss rate means real bugs ship.

### Source

Action item #4 from Epic 86-FE retrospective.

---

## Issue #5 (MEDIUM) — `sprint-status` should auto-detect epic promotion candidates

**Title**: `sprint-status workflow should detect when an epic is fully done and offer auto-promotion`

**Body**:

When all child stories of an epic are marked `done` in `sprint-status.yaml`, the epic itself often remains as `in-progress`. The status definitions document say the promotion is manual, but every epic in this project's recent sprint had this issue — meaning the manual step is consistently forgotten.

### Concrete example from production

After completing Story 86.2 (`86-2-client-info-pii: done`), Story 86.1 (`86-1-bid-recommendations-ui: done`), AND `epic-86-fe-retrospective: done`, the epic itself was still:
```yaml
epic-86-fe: in-progress
```

This had to be manually flipped to `done` during the next sprint-status check.

### Proposed fix

In `bmad-sprint-status` workflow Step 2 (after parsing), add detection logic:

```
For each epic in development_status:
1. Find all child stories (keys matching `{epic_num}-*` pattern, excluding `epic-*` and `*-retrospective`)
2. Count children with status `done`
3. If 100% of children are `done` AND epic status is `in-progress`:
   - Add to `risks` list: "epic-X-fe is in-progress but all child stories are done — auto-promote candidate"
4. In Step 5 (Offer actions), add option:
   - "Auto-promote N epics from in-progress to done"
   - On confirmation, update sprint-status.yaml in place
```

### Severity

**MEDIUM** — not critical but adds friction every single sprint closure. Easy fix, high frequency.

### Source

Action item #6 from Epic 86-FE retrospective.

---

## How to file these

Option A — via GitHub web UI:
1. Go to https://github.com/bmad-code-org/BMAD-METHOD/issues/new/choose
2. Select "Bug report" or "Feature request" template
3. Copy/paste each issue title and body above
4. Tag with appropriate labels: `workflow`, `bmm`, `dev-story`, `code-review`, `sprint-status`

Option B — via `gh` CLI (faster, batch):

```bash
# From any directory with gh authenticated to your GitHub account:

gh issue create --repo bmad-code-org/BMAD-METHOD \
  --title "dev-story workflow should refuse completion when story file is unupdated" \
  --body-file <(sed -n '/^## Issue #1/,/^---$/p' frontend/docs/BMAD-METHOD-ISSUES-TO-FILE.md)

# Repeat for each of the 5 issues, or write a small loop.
```

After filing, this document can be deleted.

## Cross-references

- Source retrospective: `_bmad-output/implementation-artifacts/epic-86-fe-retro-2026-04-07.md`
- Action items section in retro lists 7 items total — items #5 and #7 are local-repo concerns (CLAUDE.md anti-patterns ✅ done in commit `19fa85c`, Privacy ESLint rule see `PRIVACY-ESLINT-RULE-PROPOSAL.md`).
- These 5 issues are the cross-cutting workflow improvements that benefit all BMad users.
