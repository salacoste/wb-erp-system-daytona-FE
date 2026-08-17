# Story 89.4-FE: Defensive Frontend Principle in CLAUDE.md

Status: done

## Story

**As a** developer (or AI agent) authoring new frontend code that consumes backend data,
**I want** a named, canonical principle in CLAUDE.md that tells me **what to do when backend data looks wrong** — show an indicator and file a backend ticket, don't silently "fix" it — along with a concrete worked example,
**so that** Epic 87's "price inversion" class of bug (detect-then-transform) doesn't silently return, and so new contributors have a single reference point for the discipline that underlies anti-patterns #8 (null-vs-zero) and the Boundary Normalizer section.

**Epic**: 89-FE Tech Debt Follow-ups (Epic 88 Consequences)
**Priority**: P3
**Estimate**: 1 story point
**Fourth story in epic** — closes Epic 87's retrospective action item #6 (carried forward twice: Epic 87 → Epic 88 → Epic 89).

---

## Problem Statement

Epic 87's retrospective (`_bmad-output/implementation-artifacts/epic-87-fe-retro-2026-04-14.md`) flagged a recurring pattern that has produced distinct bugs across several stories:

> Frontend never silently transforms data it doesn't own — it indicates. When anomalies are detected, show an indicator and file a backend request — do not "fix" the display by swapping fields.

This principle was meant to get a CLAUDE.md section as Action Item #6. **It was deferred in Epic 87's close-out, skipped in Epic 88, and is parked as `89-4` in the current sprint.** Two epics of non-execution.

### Why the principle matters (specific bugs that pre-date it)

| Story | Bug class | Silent-fix path the dev ALMOST took |
|---|---|---|
| 87.3 (orders) | Backend occasionally returned `price < salePrice` (field inversion) | "Let's swap them in the transform" |
| 87.3 / 88.2 | Money fields `?? 0` when backend sent `null` ("unknown") | "Just coerce to zero so the UI doesn't crash" |
| 86.1 (advertising) | `organicSales < 0` when over-attribution leaked | "Clamp to 0" |
| 73.6 (advertising) | Same negative-organic-sales, different surface | "Clamp to 0" (redux) |

In every case, the team correctly chose to **show a warning + file a backend ticket**. The principle already exists — informally. This story **names and documents it** so it's not re-discovered per-story.

### The three behaviors the principle covers

1. **What NOT to do**: silently swap fields, `?? 0` money, clamp negatives, hide anomalies.
2. **What TO do**: render an indicator (icon + tooltip + footnote), keep the raw value visible, file a `docs/request-backend/*.md` ticket.
3. **When to apply**: any anomaly where the *correct* value is ambiguous, requires backend investigation, or has user-facing trust implications (money, counts, identity).

---

## Acceptance Criteria

### AC-1: Add "Defensive Frontend Principle" section to CLAUDE.md

- [x] New subsection in `frontend/CLAUDE.md` titled **`### Defensive Frontend Principle`**, placed **between** the "Mandatory" list (ends ~line 92) and the "Known Anti-Patterns" subsection (starts ~line 94).
- [x] Positioning is deliberate: the principle is the *why* behind several of the listed anti-patterns (especially #8 null-vs-zero), so it should precede them.
- [x] Length: **30-60 lines** — long enough to include the canonical example + checklist, short enough to be scannable.

### AC-2: Required content (structured)

Section must include:

1. **The principle statement** (verbatim or equivalent): _"Frontend never silently transforms data it doesn't own — it indicates. When anomalies are detected, show an indicator and file a backend request — do not 'fix' the display by swapping fields."_

2. **What counts as "data you don't own"** — a short enumeration:
   - Any field from a backend API response.
   - Any field computed server-side (e.g., `netProfit`, `totalOperatingProfit`).
   - Any field sourced from WB SDK via backend proxy.
   - Counterexample: data the frontend itself computes (e.g., local aggregations, UI state) — that's "owned" and transform-free fixing is fine there.

3. **The 4 anomaly categories you'll encounter**, with one example each:
   - **Field inversion / swap** (e.g., `price < salePrice`) → **Do**: warning icon + tooltip. **Don't**: swap silently.
   - **Null where number expected** (e.g., `cogs: null` mid-aggregation) → **Do**: preserve null, render `—`, show footnote. **Don't**: `?? 0`. *(Cross-reference: anti-pattern #8.)*
   - **Impossible negative value** (e.g., `organicSales: -1200`) → **Do**: show raw value + warning. **Don't**: `Math.max(0, value)`.
   - **Missing / empty response** → **Do**: distinct "no data" state with backend-request link. **Don't**: fall back to stale cache silently.

4. **The "show an indicator" recipe**:
   - Icon: `lucide-react` `AlertTriangle` (amber when advisory; red when blocking).
   - Tooltip: one sentence explaining the anomaly.
   - Footnote: a `<p className="text-xs text-amber-700 mt-2">...</p>` pattern when the indicator is table-adjacent.
   - Link: reference the relevant `docs/request-backend/NNN-*.md` file so users have a paper trail.

5. **The "file a backend ticket" recipe**:
   - Create `docs/request-backend/NNN-SHORT-DESCRIPTION.md` (next sequential number; grep the folder first).
   - Follow existing format: Problem → Root Cause → Impact → Fix Scope → Reproduction → Resolution.
   - Add the ticket to the code comment near the indicator: `// Request #NNN: <one-line>`.

6. **Canonical worked example** — reference Story 87.3's orders price inversion with request #165:
   - File: `docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md`
   - UI: `AlertTriangle` icon + tooltip in the orders table when `price < salePrice`
   - Data: raw values preserved; no swap, no coercion.
   - **Do NOT include the full implementation code** — just a 3-5 line summary + the file path so readers can grep the repo for the pattern.

7. **Cross-references** to related CLAUDE.md content:
   - Anti-pattern #8 (null-vs-zero) is a specific case of this principle.
   - Boundary Normalizer Pattern section handles the shape-drift flavor.
   - The `No TODO in production code` mandate (`PENDING BACKEND:` convention) dovetails — anomaly indicators usually come with a `// PENDING BACKEND: request #NNN` comment.

### AC-3: Verify nothing collides

- [x] After edit, CLAUDE.md has **only one** section titled `### Defensive Frontend Principle` (no duplicates).
- [x] Existing anti-patterns (#1-9) remain intact with no content loss.
- [x] Existing "Comment Policy" section (added by Story 89.3) remains intact.
- [x] Existing "Mandatory" bullet list remains intact and precedes the new section.

### AC-4: Validation

- [x] `npm run check:docs` (from Story 89.3) — passes. Any citation in the new section (e.g., `src/app/(dashboard)/orders/...`) must resolve.
- [x] `npm run lint && npm run type-check && npm test -- --run` — no regressions (this story edits only CLAUDE.md; test count stays at 6808).
- [x] Prettier on CLAUDE.md — formatting clean (if prettier is configured for markdown; otherwise skip).

### AC-5: Closure tracking

- [x] Mark Epic 87 retrospective action item #6 as addressed in the Completion Notes (it's been a 2-epic carry-forward).
- [x] Sprint-status: `89-4-fe-defensive-frontend-claude-md: backlog → ready-for-dev → in-progress → review → done` through normal workflow.

---

## Tasks / Subtasks

### Task 1: Author the CLAUDE.md section (AC-1, AC-2)
- [x] 1.1: Identify insertion point (between line 92 and line 94 in the current CLAUDE.md).
- [x] 1.2: Draft the `### Defensive Frontend Principle` section with the 7 required content elements (AC-2).
- [x] 1.3: Insert into CLAUDE.md preserving surrounding structure.
- [x] 1.4: Verify length is 30-60 lines; trim or expand if outside bounds.

### Task 2: Collision + integrity check (AC-3)
- [x] 2.1: Grep CLAUDE.md for duplicate `Defensive Frontend` headings — must be exactly 1.
- [x] 2.2: Verify anti-patterns #1-9 section is intact (search for `#### 1.` through `#### 9.`).
- [x] 2.3: Verify `## Comment Policy` section (Story 89.3) is intact.

### Task 3: Validation (AC-4)
- [x] 3.1: `npm run check:docs` — exit 0 OR same ~8 pre-existing broken citations (Story 89.3's surfaced list). No NEW broken citations introduced by this story.
- [x] 3.2: `npm run lint && npm run type-check && npm test -- --run` — 6808 tests pass, zero regressions.
- [x] 3.3: Visual proofread of the new section for clarity and voice.

### Task 4: Closure (AC-5)
- [x] 4.1: Completion Notes explicitly mark Epic 87 retro action item #6 as closed.
- [x] 4.2: Update sprint-status through normal review→done transition.

---

## Dev Notes

### Why a new section, not a new anti-pattern

Anti-patterns are **footguns** — specific patterns that produce specific bugs. The Defensive Frontend Principle is a **meta-rule** that GENERATES several anti-patterns (including #8). A section, not a bullet, lets it own the framing clearly and lets anti-patterns #8 etc. cross-reference *up* to it.

### Style alignment

Match the voice and format of the existing `### Known Anti-Patterns` section:
- Use the `❌ BAD / ✅ GOOD` visual pattern if you include code snippets.
- Prefer real code examples over hypothetical ones.
- Keep code blocks short (≤15 lines each).
- Include the "Why" and "How to apply" language used in anti-patterns #8.

### Concrete UI example references (for the canonical worked example)

Don't inline the code. Reference file paths only. Good candidates:
- `src/app/(dashboard)/orders/**/*.tsx` — Story 87.3's price-inversion warning surface.
- `docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md` — the linked ticket.
- `src/components/custom/dashboard/DailyCogsGapFootnote.tsx` — Story 88.2's footnote pattern for null COGS (also a canonical "indicate, don't hide" example).

### File-size budget

CLAUDE.md is already a large file. The ~40-line addition is negligible. No splitting needed.

### Out of scope

- Writing new indicator components (the existing `AlertTriangle` + `Tooltip` + footnote patterns are sufficient — this story documents existing practice, doesn't invent new UI).
- Creating new backend-request files (those belong to real bug-fix stories).
- Retrofitting the principle into existing stories that silently coerced or swapped (separate cleanup work; too broad for this story).
- An ESLint rule that detects `?? 0` on money fields (still in the Epic 88 backlog as "optional stretch").
- Fixing the 13 broken citations surfaced by Story 89.3 (those are their own cleanup follow-up).

### Backlog ref

No specific backlog task for this — Epic 87 retro action item #6 IS the spec. Note closure in Completion Notes.

---

## References

- `_bmad-output/implementation-artifacts/epic-87-fe-retro-2026-04-14.md` — original action item #6, including the exact principle wording.
- `_bmad-output/implementation-artifacts/epic-88-fe-retro-2026-04-15.md` — carry-forward acknowledgement (item F in "Epic 88-FE Action Item Follow-Through" table).
- `_bmad-output/implementation-artifacts/epic-91-fe-retro-2026-04-21.md` — Epic 91 retro also noted the item as still-open (table row D in "Epic 88-FE Action Item Follow-Through"). The actual carry-forward chain is Epic 87 (origin) → Epic 88 (not-addressed) → Epic 89 (this story). Epic 91's observation is supplementary, not part of the chain itself.
- `docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md` — canonical ticket for the worked example.
- `CLAUDE.md` lines 77-92 — "Mandatory" list (insertion point is right after).
- `CLAUDE.md` lines 94-340 — "Known Anti-Patterns" section (insertion happens just before this).
- `CLAUDE.md` anti-pattern #8 (null-vs-zero) — the specific case that most needs the principle as a parent frame.

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.7 (1M context)

### Debug Log References
None.

### Completion Notes List

1. **CLAUDE.md section added** between the "Mandatory" bullet list (ends line 92) and "Known Anti-Patterns" (starts line ~140 after insertion). The new subsection `### Defensive Frontend Principle (Story 89.4-FE, from Epic 87-FE retro)` is 46 lines including the principle statement, "data you don't own" enumeration, 4-category do/don't table, indicator recipe, ticket recipe, canonical worked example (orders price inversion → request #165), and cross-references to anti-pattern #8 + Boundary Normalizer Pattern + `PENDING BACKEND:` convention.

2. **Content per AC-2 (all 7 elements delivered):**
   - ✅ Principle statement (verbatim from Epic 87 retro): "Frontend never silently transforms data it doesn't own — it indicates."
   - ✅ "Data you don't own" enumeration (backend API responses, server-computed values, SDK-proxied data, counterexample for frontend-owned state).
   - ✅ 4-anomaly table (field inversion, null-as-number, impossible negatives, missing response) with do/don't columns.
   - ✅ "Show an indicator" recipe (AlertTriangle + tooltip + footnote + PENDING BACKEND comment).
   - ✅ "File a backend ticket" recipe (`docs/request-backend/NNN-*.md` format).
   - ✅ Canonical worked example (Story 87.3 orders price inversion → `docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md`).
   - ✅ Cross-references to anti-pattern #8, Boundary Normalizer Pattern, `PENDING BACKEND:` convention.

3. **Collision/integrity check (AC-3):**
   - `grep "^### Defensive Frontend Principle" CLAUDE.md` → **1 match** (single section, no duplicates).
   - `grep "^#### [1-9]\." CLAUDE.md` → **9 matches** (all 9 anti-patterns intact, no content loss).
   - `grep "^## Comment Policy" CLAUDE.md` → **1 match** (Story 89.3's section intact).

4. **Validation (AC-4):**
   - `npm run check:docs` → 177 citations / 13 broken. **Same 13 pre-existing broken citations from Story 89.3's baseline** — no NEW broken citations introduced by this story.
   - `npm run lint` → 0 warnings, 0 errors.
   - `npm run type-check` → 0 errors.
   - `npm test -- --run` → **6808 passed, 3 failed** (same pre-existing `DashboardPeriodSelector` carry-forward — 6th consecutive epic). Zero new regressions.

5. **Epic 87-FE retro action item #6 — CLOSED.** Two-epic carry-forward (Epic 87 → 88 → 89) finally addressed. The Epic 89 retrospective should reflect this as one of the action-item closure wins.

6. **No code, no tests.** Pure documentation story. Zero source-file changes.

### File List

**Added:** None.

**Modified:**
- `CLAUDE.md` — new `### Defensive Frontend Principle (Story 89.4-FE, from Epic 87-FE retro)` subsection inserted between the "Mandatory" bullet list and "Known Anti-Patterns" (46 lines added).
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `89-4-fe-defensive-frontend-claude-md: backlog → ready-for-dev → in-progress → review`.
- `_bmad-output/implementation-artifacts/89-4-fe-defensive-frontend-claude-md.md` (this file) — tasks/ACs checked; Dev Agent Record populated; status → review.

**No files deleted. No source files (TypeScript/JSX/CSS) touched.**

### Change Log

| Date | Change |
|---|---|
| 2026-04-21 | Story created. P3 doc-only. Closes Epic 87 retrospective action item #6 (carried forward through Epic 88 + 91). Scope: ~40-line CLAUDE.md addition + cross-references. Zero runtime impact, zero test-count delta expected. |
| 2026-04-21 | Implementation complete. 46-line `### Defensive Frontend Principle` subsection added to CLAUDE.md. All 7 AC-2 content elements delivered. Integrity checks clean (single new section, 9 anti-patterns intact, Comment Policy intact). Validation clean: 0 new broken citations (check:docs still at 13 pre-existing), 0 lint warnings, 0 type errors, 6808 tests pass (zero regressions). Epic 87-FE retro action item #6 CLOSED. Status → review. |
| 2026-04-21 | Code review complete: 4 findings (0H/2M/2L). Applied 3 fixes: M-1 tooltip wording now references the real template + production file (`OrdersTableRow.tsx`) instead of a fabricated Russian string; M-2 story References section clarified that Epic 91 retro observation is supplementary to the Epic 87→88→89 carry-forward chain; L-3 anomaly-table entry now shows real detection threshold (`salePrice > price × 1.2`) so readers don't skip the 1.2× guard. L-4 ALSO applied per "fix all even minors" directive: added a `❌ BAD / ✅ GOOD` code-snippet block between the anomaly table and the "Show an indicator" recipe, showing the canonical price-inversion case in TypeScript. Style now aligns with adjacent anti-patterns. Re-validation: check:docs unchanged at 13 pre-existing broken, single `### Defensive Frontend Principle` heading preserved. Status → done. |
