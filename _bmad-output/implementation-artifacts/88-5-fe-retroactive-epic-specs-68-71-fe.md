# Story 88.5-FE: Retroactive Epic Specs for Epics 68-71 (Marketing Analytics)

Status: done

## Story

**As a** future engineer looking up why Marketing Analytics (Funnel / Buyout / Returns / Search) was built the way it was,
**I want** proper epic specs for Epics 68-FE, 69-FE, 70-FE, 71-FE — code exists in production, formal spec does not,
**so that** the documentation debt accumulated during rapid delivery doesn't cost us diagnostic cycles on every future refactor or handoff.

**Epic**: 88-FE Tech Debt Cleanup & Process Hardening
**Priority**: P3
**Estimate**: 4 story points

---

## Problem Statement

`docs/EPICS-AND-STORIES-TRACKER.md` explicitly flags (at line 111–113, 545–547, 822):

> "Epics 68-FE, 70-FE, 71-FE noted: code exists, pending formal spec & validation (Backend Request #151)"
> "Epic 69-FE Buyout: `docs/epics/epic-69-fe-buyout-rate-analytics.md` (pending)"

These epics shipped before the team formalized the create-story → dev-story → retrospective workflow. The implementation is sound and in production — routes like `/analytics/funnel`, `/analytics/buyout`, `/analytics/returns`, `/analytics/search` all work — but if a new engineer wants to understand the business goals, backend dependencies, or architectural decisions, they have to reverse-engineer ~20 files across `src/app/(dashboard)/analytics/`, `src/lib/api/`, and `src/types/`.

### Pre-story discovery — epic-numbering conflicts surfaced

The dev MUST be aware of these conflicts before starting:

1. **Epic 68 identity conflict**:
   - `docs/epics/epic-68-fe-monitoring-health-dashboard.md` exists but describes a DIFFERENT "Epic 68" (Monitoring Health Dashboard for `/monitoring`).
   - Code comments (`src/app/(dashboard)/analytics/funnel/page.tsx:3`) label the funnel page as "Epic 68: Marketing Funnel".
   - **Resolution**: this story creates `epic-68-fe-funnel-analytics.md` for the funnel domain. The existing `epic-68-fe-monitoring-health-dashboard.md` file is untouched (it's a separate/older Epic 68 initiative that was either never shipped or shipped under a different number — out of scope for this story).

2. **Epic 69 — existing draft**:
   - `docs/epics/epic-69-fe-buyout-analytics.md` already exists (not in the AC-named format).
   - Tracker explicitly says the canonical filename should be `epic-69-fe-buyout-rate-analytics.md` (pending).
   - **Resolution**: create the canonical file per AC-2. If the existing draft has reusable content, lift it; otherwise ignore and write fresh.

3. **Epic 70 identity conflict**:
   - `docs/epics/epic-70-fe-validation-fixes.md` exists and describes "Frontend Validation Fixes" (complete per tracker line 144).
   - Backend Request #151 labels Epic 70 as "Conversion Analytics".
   - Code at `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx:3` labels returns as "Epic 71: Return Analytics".
   - Story 88.5 AC explicitly asks for `epic-70-fe-returns-analytics.md`.
   - **Resolution**: follow the AC literally. The new `epic-70-fe-returns-analytics.md` documents the returns domain. The old `epic-70-fe-validation-fixes.md` is untouched — we note the number-reuse in the tracker and accept it as a one-time artifact of pre-workflow delivery.

4. **Epic 71 — two claims in code**:
   - `src/app/(dashboard)/analytics/search/page.tsx:3` says "Epic 71-FE: Search Analytics & Jam Gating".
   - `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx:3` says "Epic 71: Return Analytics".
   - Tracker line 113 says "Epic 71-FE: Returns Analytics UI (pending)".
   - Sprint-status shows `epic-71-fe-search-analytics` as DONE (Stories 71.1 through 71.8).
   - **Resolution**: Epic 71 is canonically **Search Analytics** (matches sprint-status, which is the system of record). The code comment in `ReturnsPageContent.tsx` is a stale label and MAY be cleaned up as drive-by (add to AC-4 below). The tracker note about "Epic 71 = Returns Analytics" is outdated and should be removed.

5. **Backend Request #151 labels don't match**:
   - BE #151 says Epic 70 = Conversion, Epic 71 = Returns.
   - Frontend numbering settled differently over time.
   - **Resolution**: document the rename history as "Numbering History" in each affected spec. Do NOT try to retroactively renumber.

### Implementation domains (code already exists)

| Epic | Route | Types | API module | Hook | Page entry |
|---|---|---|---|---|---|
| 68 Funnel | `/analytics/funnel` | `src/types/analytics-funnel.ts` | `src/lib/api/funnel-analytics.ts` | `src/hooks/use-funnel-analytics.ts` | `src/app/(dashboard)/analytics/funnel/page.tsx` |
| 69 Buyout | `/analytics/buyout` | `src/types/buyout-analytics.ts` | `src/lib/api/buyout-analytics.ts` | `src/hooks/use-buyout-*.ts` | `src/app/(dashboard)/analytics/buyout/page.tsx` |
| 70 Returns | `/analytics/returns` | `src/types/return-analytics.ts` | `src/lib/api/return-analytics.ts` | (inside returns/hooks) | `src/app/(dashboard)/analytics/returns/page.tsx` |
| 71 Search | `/analytics/search` | `src/types/search-analytics.ts` | `src/lib/api/search-analytics.ts` | `src/hooks/use-search-*.ts` | `src/app/(dashboard)/analytics/search/page.tsx` |

Each spec pulls its content from the canonical code location above, not from scratch.

---

## Acceptance Criteria

### AC-1: Create `docs/epics/epic-68-fe-funnel-analytics.md`

- [ ] Filename exactly `epic-68-fe-funnel-analytics.md`.
- [ ] Structure follows `docs/epics/epic-74-fe-file-size-compliance.md` as format reference (since AC epic spec reference `epic-86-fe-*.md` does not exist).
- [ ] Sections required:
  - **Header**: Priority (P1 per tracker), SP estimate (retroactive — note as "delivered Q1 2026, 6+ stories"), route `/analytics/funnel`.
  - **Business Goal** (2-3 sentences): per-SKU marketing funnel (views → cart → orders → buyouts) for ad spend optimization.
  - **Numbering History**: one paragraph explaining the Epic 68 identity conflict (see Problem Statement #1).
  - **Backend Dependencies**: link to `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md`; list the 2 funnel endpoints (`/v1/analytics/funnel`, `/v1/analytics/funnel/sync-status`).
  - **File List** (pulled from grep of `funnel` in src/): types, API module, hook(s), page, components.
  - **Key Decisions / Gotchas**: WoW comparison period (Story 73.3-FE), product filter combobox (Story 73.4-FE), funnel/advertising chart overlay (Story 73.8-FE). These post-Epic-68 enhancements depend on Epic 68 — call them out.
  - **Related Stories**: enumerate all 72.x, 73.x, 87.x, 88.2-FE stories that touched funnel code.

### AC-2: Create `docs/epics/epic-69-fe-buyout-rate-analytics.md`

- [ ] Filename exactly `epic-69-fe-buyout-rate-analytics.md` (per tracker line 547, not the legacy `epic-69-fe-buyout-analytics.md`).
- [ ] If the existing `epic-69-fe-buyout-analytics.md` has reusable content, lift it into the new file; DO NOT delete the legacy file (preserve as historical reference). Add a note at the top of the legacy file: `> Superseded by [epic-69-fe-buyout-rate-analytics.md](./epic-69-fe-buyout-rate-analytics.md) — see Story 88.5-FE.`
- [ ] Content: per-SKU buyout rate analytics at `/analytics/buyout`. 7 stories, 28 SP per tracker line 103-109.
- [ ] Backend: `/v1/analytics/buyout/by-sku`, `/v1/analytics/buyout/summary` (per BE #151).
- [ ] File List: types `src/types/buyout-analytics.ts`, API `src/lib/api/buyout-analytics.ts`, page, components.
- [ ] Key decisions: data source transparency UX (weekly report vs orders API badge), buyout hook migration (Story 72.6), profit-multiplication warning (Story 72.4).

### AC-3: Create `docs/epics/epic-70-fe-returns-analytics.md`

- [ ] Filename exactly `epic-70-fe-returns-analytics.md`.
- [ ] Explicit **Numbering History** section acknowledging Epic 70 number-reuse (original Epic 70 was "Frontend Validation Fixes" — see `epic-70-fe-validation-fixes.md`, completed 2026-02-28).
- [ ] Content: returns analytics with reason breakdown at `/analytics/returns`.
- [ ] Backend: `/v1/analytics/returns/reasons`, `/v1/analytics/returns/reasons/by-sku` (per BE #151).
- [ ] File List: types `src/types/return-analytics.ts`, API `src/lib/api/return-analytics.ts`, page, `ReturnsPageContent.tsx`, `ReturnReasonsPieChart.tsx`, `ReturnsSummaryCards.tsx`, `ReturnsTable.tsx`.
- [ ] Note the code-label inconsistency in `ReturnsPageContent.tsx:3` ("Epic 71: Return Analytics" — should say "Epic 70"). See AC-5 for the drive-by fix.

### AC-4: Create `docs/epics/epic-71-fe-search-analytics.md`

- [ ] Filename exactly `epic-71-fe-search-analytics.md`.
- [ ] Content: Search analytics with Jam-tier gating at `/analytics/search`.
- [ ] Scope: Stories 71.1 through 71.8 (all DONE per sprint-status). This epic is ALREADY tracked in sprint-status as complete — the spec is purely retroactive.
- [ ] Sections: business goal (keyword/search performance for SKUs), backend deps (search-analytics endpoints), Jam-gating decision (RequireJam component — Story 71.3), three tabs (Orders, By-Product, By-Query) per Stories 71.5-71.7.
- [ ] File List: `src/types/search-analytics.ts`, `src/lib/api/search-analytics.ts`, hooks, page, tab components.

### AC-5: Drive-by code-comment fix for the Epic 71 / Epic 70 label mix

- [ ] Update `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx:3` header comment: change `* Epic 71: Return Analytics` → `* Epic 70-FE: Returns Analytics`. This aligns the code label with the newly-canonical epic spec from AC-3.
- [ ] Verify no other files carry the same mislabel: `grep -rn "Epic 71.*Return" src/` should return zero after the fix.
- [ ] ESLint + type-check remain clean (comment-only change, zero semantic impact).

### AC-6: Update `docs/EPICS-AND-STORIES-TRACKER.md`

- [ ] Line 547 (Epic 69-FE spec reference): update path from `docs/epics/epic-69-fe-buyout-rate-analytics.md` (pending) → `docs/epics/epic-69-fe-buyout-rate-analytics.md` ✅ (remove "(pending)" marker).
- [ ] Line 822 (status table): same update.
- [ ] Lines 111-114: remove the "pending formal documentation" note (now all 4 epics have specs). Replace with a one-line confirmation: `> **Note — Epics 68-FE, 69-FE, 70-FE (Returns), 71-FE**: Retroactive specs added by Story 88.5-FE (2026-04-15). See `docs/epics/epic-{68,69,70,71}-fe-*.md`.`
- [ ] Section 200 "Analytics Extensions" and Section 545 "Epic 69-FE detail": verify cross-references to the new spec files.

### AC-7: Validation

- [ ] All 4 new epic spec markdown files render cleanly (markdown preview check).
- [ ] Every file:line citation in each spec resolves to real code (spot-check 5 citations per spec).
- [ ] `grep -rn "pending" docs/EPICS-AND-STORIES-TRACKER.md` returns zero hits for Epics 68-71 (other unrelated "pending" items are fine).
- [ ] `npm run lint && npm run type-check` pass (AC-5 code-comment change must not break anything).
- [ ] Existing 6764 unit tests remain green.
- [ ] `find docs/epics -name "epic-{68,69,70,71}-fe-*.md"` returns the 4 new files (plus any legacy files which remain untouched).

---

## Tasks / Subtasks

### Task 1: Gather canonical content for each epic (AC-1/2/3/4)

- [ ] 1.1: For each of the 4 domains (funnel, buyout, returns, search), run `grep -rn "Epic {N}" src/` to find all files labeled with that epic number. Record file paths.
- [ ] 1.2: For each domain, read the page entry (`src/app/(dashboard)/analytics/{domain}/page.tsx`), the types file (`src/types/*{domain}*.ts`), and the API module (`src/lib/api/*{domain}*.ts`). Note key exports, backend endpoints hit, hooks exported.
- [ ] 1.3: Cross-reference with `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md` for the formal backend contract per epic.
- [ ] 1.4: For each epic, enumerate downstream stories that touched the code (grep `implementation-artifacts/*.md` for `funnel|buyout|returns|search` mentions, especially 72.x / 73.x / 87.x / 88.x).

### Task 2: Write `epic-68-fe-funnel-analytics.md` (AC-1)

- [ ] 2.1: Use `docs/epics/epic-74-fe-file-size-compliance.md` as structural template.
- [ ] 2.2: Populate each required section per AC-1.
- [ ] 2.3: Spot-check 3 file:line citations.

### Task 3: Write `epic-69-fe-buyout-rate-analytics.md` (AC-2)

- [ ] 3.1: Check `docs/epics/epic-69-fe-buyout-analytics.md` — any reusable content? Lift if yes.
- [ ] 3.2: Write the new spec at the canonical path.
- [ ] 3.3: Prepend "Superseded by" note to the legacy file (preserve as historical reference).

### Task 4: Write `epic-70-fe-returns-analytics.md` (AC-3)

- [ ] 4.1: Include the **Numbering History** paragraph explaining Epic 70 reuse.
- [ ] 4.2: Populate from code + BE #151.

### Task 5: Write `epic-71-fe-search-analytics.md` (AC-4)

- [ ] 5.1: This spec is retroactive — all 8 stories are already `done` per sprint-status. Cite each.
- [ ] 5.2: Include Jam-gating decision + 3-tab structure.

### Task 6: Drive-by code-comment fix (AC-5)

- [ ] 6.1: Edit `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx:3`.
- [ ] 6.2: `grep -rn "Epic 71.*Return" src/` returns zero.
- [ ] 6.3: Lint + type-check clean.

### Task 7: Update tracker (AC-6)

- [ ] 7.1: Remove "(pending)" markers for Epics 68-71 spec references.
- [ ] 7.2: Update the note at lines 111-114 to point at the new specs.
- [ ] 7.3: Verify cross-references in Sections 200 and 545.

### Task 8: Validation (AC-7)

- [ ] 8.1: Run `npm run lint && npm run type-check` — clean.
- [ ] 8.2: Run `npm test -- --run` — maintain 6764 passing.
- [ ] 8.3: Verify all 4 new epic files exist at canonical paths.
- [ ] 8.4: Verify `grep -n "pending" docs/EPICS-AND-STORIES-TRACKER.md` has no Epic 68-71 hits.

---

## Dev Notes

### The number-conflict reality

Four numbered epic identities overlap between the code, the docs, and the backend contracts. This story does NOT try to renumber anything — renumbering a shipped epic would break every retrospective, sprint-status entry, and commit message that references it. Instead:

- **Documentation wins**: the new spec files establish the canonical name for each epic.
- **Legacy files untouched**: `epic-68-fe-monitoring-health-dashboard.md`, `epic-69-fe-buyout-analytics.md`, `epic-70-fe-validation-fixes.md` all stay. They represent earlier or parallel Epic-N initiatives.
- **One drive-by comment fix** (AC-5) corrects the most confusing code mislabel. All other historical references stay as-is; each epic spec explains the history in its "Numbering History" section.

### Structural template

Use `docs/epics/epic-74-fe-file-size-compliance.md` (~100-150 lines) as the visual/structural template:
- H1 title with epic number + name
- Header block with Priority / SP / Files Affected / Goal
- Context section (why this epic was built)
- Story Overview table
- Per-story detail
- Dependencies / References

Adapt for retroactive specs: replace "Story Overview" with a "Delivered Stories" table (all stories are already `done`), and include "Numbering History" where applicable.

### File-size budget

Each epic spec ≈ 100-150 lines. CLAUDE.md is not touched in this story. Tracker is existing markdown (no size constraint).

### Out of scope

- **Renumbering any existing epic.** Story 88.5 is pure documentation backfill.
- **Deleting legacy epic files** (`epic-68-fe-monitoring-health-dashboard.md`, etc.). They're preserved as historical context.
- **Adding new tests.** Zero code changes beyond the single AC-5 comment fix.
- **Writing Russian translations.** The existing epic specs are mixed Russian/English; match the language of the surrounding spec when quoting code comments, but write the new content in English for consistency with Epic 88 sibling stories (88.1-88.4 are all English).
- **Backfilling sprint-status with a retroactive epic-68-fe key.** Current sprint-status correctly tracks `epic-71-fe-...` stories; adding fake historical epic-68-fe-* entries would corrupt the audit trail.

### Anti-patterns to avoid

- ❌ Creating a meta-doc that explains "why we have 4 different Epic 70s." One sentence per spec is enough. Over-explaining dignifies the mess.
- ❌ Trying to re-derive story-level AC from the source code. If a story's AC is lost, it's lost — note at the bottom of the epic spec "Stories 71.1-71.8 delivered pre-workflow; per-story ACs exist in retrospective form at `_bmad-output/implementation-artifacts/71-*.md`."
- ❌ Adding TODO markers in the new specs. If a section can't be filled (e.g., "unknown backend contact"), write "unknown — investigate when next touched" without the literal word "TODO" (per CLAUDE.md mandate).

---

## References

### Canonical code for each epic

- **Epic 68 Funnel**: `src/app/(dashboard)/analytics/funnel/page.tsx`, `src/lib/api/funnel-analytics.ts`, `src/types/analytics-funnel.ts`, `src/hooks/use-funnel-analytics.ts`, `src/app/(dashboard)/analytics/funnel/components/FunnelTable.tsx`, `FunnelChart.tsx`.
- **Epic 69 Buyout**: `src/app/(dashboard)/analytics/buyout/page.tsx`, `src/lib/api/buyout-analytics.ts`, `src/types/buyout-analytics.ts`, `src/hooks/use-buyout-*.ts`.
- **Epic 70 Returns**: `src/app/(dashboard)/analytics/returns/page.tsx`, `src/lib/api/return-analytics.ts`, `src/types/return-analytics.ts`, `ReturnsPageContent.tsx`, `ReturnReasonsPieChart.tsx`, `ReturnsSummaryCards.tsx`, `ReturnsTable.tsx`.
- **Epic 71 Search**: `src/app/(dashboard)/analytics/search/page.tsx`, `src/lib/api/search-analytics.ts`, `src/types/search-analytics.ts`, `src/hooks/use-search-*.ts`, all `SearchPageContent.tsx` / tab components.

### Backend contract source of truth

- `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md` — all 8 endpoints documented with request/response shapes.
- `test-api/29-funnel-analytics.http`, `test-api/32-buyout-analytics.http`, `test-api/33-return-analytics.http` — runnable request examples.

### Tracker references to update

- `docs/EPICS-AND-STORIES-TRACKER.md` lines 111-114 (pending note), 547 (Epic 69 path), 822 (status table).

### Story-numbering history

- Stories 72.x-73.x (Q1 2026 Marketing Analytics enhancements) touch Epic 68 funnel, Epic 69 buyout extensively. Story list in the tracker starting around line 200.
- Stories 71.1-71.8 (Search Analytics) — all DONE per sprint-status; implementation-artifacts files exist.
- Stories 87.3, 88.2 touched SKU financials and null handling; reference from Epic 68/69 specs for COGS-related caveats.

### Template references

- Structural template: `docs/epics/epic-74-fe-file-size-compliance.md`.
- AC epic template reference (`docs/epics/epic-86-fe-*.md`) DOES NOT EXIST — use epic-74 instead.

### Previous stories (Epic 88 sibling context)

- `88-1-fe-clean-source-todos.md` — TODO marker cleanup (done).
- `88-2-fe-null-type-audit-propagation.md` — null-vs-zero invariant (done).
- `88-3-fe-e2e-networkidle-migration-dashboard.md` — E2E test migration (done).
- `88-4-fe-boundary-normalizer-pattern-documentation.md` — Boundary Normalizer Pattern (done). Similar "pure documentation" shape as 88.5.

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- **AC-1 (funnel spec)**: Created `docs/epics/epic-68-fe-funnel-analytics.md` with Numbering History (Epic 68 = Funnel here; `epic-68-fe-monitoring-health-dashboard.md` is a separate initiative), business goal, 9-row Delivered Stories table (Epic 68 base + 72.1 / 73.1-73.4 / 73.8-73.9 / 87-88.2 touches), File List (route, components, state, nav), backend dependency table (2 endpoints), Key Decisions section, dependencies.
- **AC-2 (buyout spec)**: Created `docs/epics/epic-69-fe-buyout-rate-analytics.md` with 7 stories @ 28 SP delivered 2026-02-25, backend dependencies incl. open Request #154, File List, transparency-badge rationale. Prepended "Superseded by" note to legacy `epic-69-fe-buyout-analytics.md` (preserved as historical reference).
- **AC-3 (returns spec)**: Created `docs/epics/epic-70-fe-returns-analytics.md` with extended Numbering History explaining the two-way conflict (Epic 70 previously = Validation Fixes; BE #151 labels Returns as Epic 71). Documented dual-format detection (raw classification records vs pre-aggregated), locale parameter, anomaly flags, cursor pagination.
- **AC-4 (search spec)**: Created `docs/epics/epic-71-fe-search-analytics.md` citing all 8 delivered stories (71.1-71.8) by artifact path, 3 endpoints, Jam-gating via `RequireJam`, 3-tab structure (Orders / By-Product / By-Query).
- **AC-5 (drive-by code fix)**: Expected scope was 1 file; discovery found **9 unique files** (10 edit locations — `routes.ts` at two sites) carrying "Epic 71" for Returns in production code. All corrected to "Epic 70-FE":
  - `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx:3`
  - `src/app/(dashboard)/analytics/returns/components/ReturnsSummaryCards.tsx:3`
  - `src/app/(dashboard)/analytics/returns/components/ReturnReasonsPieChart.tsx:3`
  - `src/app/(dashboard)/analytics/returns/page.tsx:3`
  - `src/hooks/use-return-analytics.ts:3`
  - `src/lib/api/return-analytics.ts:3` (also added rename-trail note pointing at the new spec)
  - `src/types/analytics-returns.ts:2` (also added canonical spec link)
  - `src/lib/routes.ts:44` (route constant comment)
  - `src/lib/routes.ts:116` (nav order comment)
  - `src/components/custom/sidebar-navigation.ts:76` (sidebar label)
  - Verification: `grep -E "Epic 71.*[Rr]eturn" src/` → zero hits.
- **AC-6 (tracker update)**: Updated `docs/EPICS-AND-STORIES-TRACKER.md` at lines 111-114 (replaced "pending" note with 4 cross-references to new specs), line 549 (Epic 69 path marker "(pending)" removed, link added), lines 822-825 (status table now lists all 4 Epic 68-71 spec paths). Also annotated the historical 2026-02-25 changelog entry at line 652 as "RESOLVED 2026-04-15 by Story 88.5-FE" to preserve history while clearing the `(pending)` grep.
- **AC-7 (validation)**: `npm run lint` zero warnings. `npm run type-check` zero errors. `npm test -- --run` → 6764 passing (same 3 pre-existing DashboardPeriodSelector failures unrelated to this story). All 4 new epic spec files present at canonical paths. `grep "\\(pending\\)" docs/EPICS-AND-STORIES-TRACKER.md | grep -iE "epic 6[89]|epic 7[01]"` returns zero hits.
- **Closes Epic 88-FE**: all 5 stories (88.1 / 88.2 / 88.3 / 88.4 / 88.5) now done. Epic-88 retrospective (currently `optional`) becomes actionable.

### File List

**Created (4 epic spec files):**
- `docs/epics/epic-68-fe-funnel-analytics.md`
- `docs/epics/epic-69-fe-buyout-rate-analytics.md`
- `docs/epics/epic-70-fe-returns-analytics.md`
- `docs/epics/epic-71-fe-search-analytics.md`

**Modified docs (2):**
- `docs/epics/epic-69-fe-buyout-analytics.md` — prepended "Superseded by" note (preserve as historical reference)
- `docs/EPICS-AND-STORIES-TRACKER.md` — replaced "pending" note at lines 111-114; removed "(pending)" at line 549; added 4 spec paths to status table at lines 822-825; annotated resolution in 2026-02-25 changelog entry

**Modified code (9 files — drive-by Epic 71 → Epic 70-FE comment fix; `routes.ts` edited at 2 lines):**
- `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnsSummaryCards.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnReasonsPieChart.tsx`
- `src/app/(dashboard)/analytics/returns/page.tsx`
- `src/hooks/use-return-analytics.ts`
- `src/lib/api/return-analytics.ts`
- `src/types/analytics-returns.ts`
- `src/lib/routes.ts` (2 lines: 44 and 116)
- `src/components/custom/sidebar-navigation.ts`

**Deleted:** None (all legacy files preserved with superseded-by notes where applicable)

### Change Log

| Date | Change |
|---|---|
| 2026-04-15 | Story created via create-story workflow. Scope: 4 new epic spec files + 1 drive-by code-comment fix + tracker update. Epic-numbering conflicts surfaced during pre-story discovery and captured in Problem Statement + Dev Notes so the implementer doesn't re-diagnose them. Sibling to Story 88.4 (also pure-docs); closes Epic 88-FE. |
| 2026-04-15 | Implementation complete. 4 epic specs created (funnel, buyout-rate, returns, search). AC-5 expanded to 9 unique code files (10 edit locations — `routes.ts` at 2 lines) rather than 1 as initially scoped. Tracker updated at 3 sites + historical changelog annotated. Lint + type-check clean; 6764 tests pass (zero regressions). Status → review. |
| 2026-04-15 | Code review: 0 HIGH, 1 MEDIUM, 3 LOW findings; all 4 fixed. `MARKETING-ANALYTICS-PRODUCT-PLAN.md` + `MARKETING-ANALYTICS-ARCHITECTURE.md` updated to remove stale "Epic 71 / pending formal spec" references for Returns. File count corrected from "10" → "9 unique files". Epic-70 spec line range refined. Epic-68 base-row annotated "no per-story artifact". Lint + type-check still clean. Status → done. |

### Code Review Fixes (2026-04-15)

Adversarial review surfaced 4 findings; all fixed:

- **M-1 (fixed)**: Scope of AC-6 (tracker update) was narrow — only `EPICS-AND-STORIES-TRACKER.md` was in scope. However, two sibling docs carried the same stale references to Returns:
  - `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md:25` — said "Epic 71-FE | Complete (code exists, pending formal spec)" for Returns
  - `docs/MARKETING-ANALYTICS-ARCHITECTURE.md:34` — labeled Returns row as "Epic 71"
  Both updated to Epic 70-FE with links to the new canonical spec and notes about BE #151's divergent numbering. A reader landing on either doc now sees current state, not 2-day-stale state.
- **L-1 (fixed)**: Story Completion Notes claimed "Modified code (10 files)" but File List enumerated 9 unique paths (`routes.ts` was listed once with "(2 lines: 44 and 116)" inline annotation). Corrected to "9 unique files; `routes.ts` edited at 2 lines".
- **L-2 (fixed)**: `epic-70-fe-returns-analytics.md` cited `return-analytics.ts:47-51` for dual-format detection docstring — the actual docstring spans lines 47-55 with the detection-specific comment at 51-53. Refined both citations to show the full docstring range plus the specific detection-comment lines.
- **L-3 (fixed)**: `epic-68-fe-funnel-analytics.md` Delivered Stories table had an "(Epic 68 base)" row without an artifact citation — could lead readers to hunt for a non-existent implementation-artifact file. Annotated the row: "No per-story artifact — delivered pre-workflow; code is the source of truth".

**Post-fix verification**: `npm run lint` zero warnings. `npm run type-check` zero errors. No unit-test run needed — doc-only changes in this review pass.

### Final "even minors" sweep (2026-04-15)

Per user directive, another deeper pass surfaced 2 more issues:

- **N-1 (fixed)**: `epic-69-fe-buyout-rate-analytics.md:39` cited `72-5-fe-*.md` and `72-6-fe-*.md` (dash separator) — actual artifact filenames use DOT separator for Stories 72.x / 73.x / 87.x (e.g., `72.5-fe-buyout-table-refactor-enrichment-fix.md`). Broken file reference — same class of bug as M-1 caught in Story 88.4 review. Corrected to `72.5-fe-*.md` / `72.6-fe-*.md` and added a note about the dot/dash separator convention across epoch ranges (important nuance: Stories 88.x use dash).
- **N-2 (fixed)**: `epic-71-fe-search-analytics.md:15` read "One stale label — `search/page.tsx:3` — correctly labels this epic" — self-contradictory phrasing (calling the label "stale" while claiming it "correctly labels"). Rewrote to: "The Search codebase already labels itself correctly… The OTHER half of the Epic 71 conflict — the stale 'Epic 71: Return Analytics' comment at `ReturnsPageContent.tsx:3` and 8 sibling files — was corrected…".
