# Epic 101-FE: Documentation & Backlog Cleanup

**Priority**: P3 (organizational, no code changes)
**Estimate**: ~5 SP
**Source**: Stale docs audit — 93 top-level `docs/*.md` files (most from Jan 2025), 7 stale backlog tasks, EPICS-AND-STORIES-TRACKER 2+ months out of date.
**Created**: 2026-05-13

## Objective

Clean up stale documentation, rewrite the epics tracker to current state, and triage backlog items. Zero code changes — pure documentation and organizational work.

## Stories

### Story 101.1-FE: Archive stale documentation (~2 SP)

**Delete (fully stale, no value):**
- `docs/BACKLOG-FRONTEND.md` (Dec 2025, 5 months stale)
- `docs/backlog/epics-80-83-frontend-integration.md` (absorbed into Epics 84-86)

**Move to `docs/archive/` (historical value but not current):**
- ~20-30 top-level `docs/*.md` files from 2025: session summaries, bug fix reports, integration guides, verification reports, etc.

**Keep current:**
- `docs/EPICS-AND-STORIES-TRACKER.md` (rewritten in 101.2)
- `docs/api-integration-guide.md` (living doc)
- `docs/front-end-spec.md` (living doc)
- `docs/front-end-architecture.md` (living doc)
- `docs/prd.md` (living doc)
- `docs/MARGIN-COGS-BACKEND-INTEGRATION.md` (reference)
- `docs/backlog/expense-chart-redesign.md` (triaged in 101.3)
- `docs/backlog/frontend-error-fixes-2026-03-30.md` (triaged in 101.3)
- `backlog/docs/doc-2` (backend changelog reference)

### Story 101.2-FE: Full rewrite of EPICS-AND-STORIES-TRACKER (~2 SP)

`docs/EPICS-AND-STORIES-TRACKER.md` (830 lines) was last updated 2026-03-13 and is missing Epics 75-100 (26 epics). Full rewrite to catch up through Epic 100, including:
- All epics 71-100 with titles, status, story counts
- Route structure (add missing routes)
- Sprint history through current date
- Changelog entries for each epic
- Cross-reference to `_bmad-output` artifacts

### Story 101.3-FE: Triage backlog items + mark stale tasks done (~1 SP)

**Triage `docs/backlog/frontend-error-fixes-2026-03-30.md`:**
- Cross-reference each fix (F1-F7) against current code
- Mark resolved items as done, identify genuinely open items

**Mark stale backlog tasks as done:**
- `backlog/tasks/task-12` → Done (scope update fulfilled)
- `backlog/tasks/task-16` through `task-21` → Done (Monitor Dashboard shipped in Epic 92)

**Triage `docs/backlog/expense-chart-redesign.md`:**
- Update AC checkboxes for items already implemented
- Leave unimplemented items as-is (covered by Epic 102-FE)

**Verification**: `bash scripts/check-doc-citations.sh` baseline match.
