# Story 101.1: Archive Stale Documentation

Status: done

## Story

As a developer,
I want stale documentation archived and truly obsolete docs deleted,
so that the docs/ directory contains only current, relevant documentation.

## Acceptance Criteria

1. **`docs/BACKLOG-FRONTEND.md` deleted** (Dec 2025, 5 months stale)
2. **`docs/backlog/epics-80-83-frontend-integration.md` deleted** (absorbed into Epics 84-86)
3. **~60 stale docs moved** to `docs/archive/` (session summaries, bug fix reports, old epic changelogs, integration verification reports, BMAD setup guides from Jan 2025)
4. **Living docs preserved**: api-integration-guide, front-end-spec, front-end-architecture, prd, MARGIN-COGS, DATA-SOURCES-REFERENCE, EPICS-AND-STORIES-TRACKER, recent analytics docs
5. **Doc citations baseline** updated if count changed
6. **Sprint-status.yaml** updated

## Tasks / Subtasks

- [x] Task 1: Create docs/archive/ directory (AC: #3)
- [x] Task 2: Delete fully stale files (AC: #1, #2)
  - [x] 2a. Delete docs/BACKLOG-FRONTEND.md
  - [x] 2b. Delete docs/backlog/epics-80-83-frontend-integration.md
- [x] Task 3: Move stale docs to archive (AC: #3, #4)
  - [x] 3a. Identified ~60 Jan-2025-batch files for archival
  - [x] 3b. Preserved living docs (api guide, spec, architecture, prd, references)
  - [x] 3c. Moved stale files to docs/archive/
- [x] Task 4: Update doc citations baseline (AC: #5)
- [x] Task 5: Update sprint-status (AC: #6)

## Dev Notes

### Keep List (living docs)
- `api-integration-guide.md` — living doc, referenced in CLAUDE.md
- `front-end-spec.md` + `front-end-spec-epic-24.md` — living doc
- `front-end-architecture.md` — living doc
- `prd.md` + `brief.md` — living doc
- `MARGIN-COGS-BACKEND-INTEGRATION.md` — reference
- `DATA-SOURCES-REFERENCE.md` — reference
- `EPICS-AND-STORIES-TRACKER.md` — rewritten in Story 101.2
- `MARKETING-ANALYTICS-*.md` (Apr 15) — recent
- `VALIDATION-PLAN.md`, `FRONTEND-VALIDATION-REPORT.md`, `FRONTEND-WORK-SUMMARY.md` (Feb) — recent
- `DASHBOARD-ANALYTICS-VALIDATION-W08.md` (Feb 28) — recent
- Integration analysis files (Jan 30 batch) — still relevant for reference
- `PRIVACY-ESLINT-RULE-PROPOSAL.md`, `BMAD-METHOD-ISSUES-TO-FILE.md` (Apr) — recent
- All backlog/ files except epics-80-83 (triaged in 101.3)

### Archive List (stale docs)
All Jan 29 batch files that are epic-specific reports, session summaries, old changelogs, verification reports, BMAD setup guides, deployment guides for old versions.

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created. Archive stale documentation from 93→~30 current docs. |
| 2026-05-13 | Implementation complete. 2 files deleted, ~60 files moved to docs/archive/. |
