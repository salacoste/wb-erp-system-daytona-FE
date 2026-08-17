# Story 93.3-FE: Document Thresholds + Heuristics Inline Comments

Status: done

## Story

**As a** future maintainer of the pipeline-health + daily-aggregation code,
**I want** the two non-obvious magic values — the `errorRate >= 0.01` badge-display threshold and the `financeAd > 0 ? financeAd : advertising` source-preference heuristic — to carry inline comments that state their rationale AND point at the originating story,
**so that** readers don't have to dig through git blame or retros to understand why the code chose those cutoffs.

**Epic**: 93-FE Operational Cleanup & Pattern Codification
**Priority**: P3
**Estimate**: 1 story point
**Third story in Epic 93-FE.** Addresses Epic 91-FE retrospective action items #2 (PipelineStatusGrid threshold doc) and #3 (financeAd heuristic doc).

---

## Problem Statement

### Pre-flight grep (2026-04-24): the comments already partially exist

Both sites flagged by Epic 91's retro action items **already have inline comments** — but they're incomplete against the retro's ask:

**Site 1** — `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx:94-95`:
```typescript
// Gate on >= 1% to avoid showing "0%" badge for tiny error rates (e.g., 0.004 → rounds to 0)
const hasErrors = errorRate >= 0.01
```
Has the rationale. Missing: `@see Story 91.3-FE` back-reference (Story 91.3 was where this threshold originated; reviewers asked for it in that story's review pass but it never landed).

**Site 2** — `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx:95-96`:
```typescript
// Gate >= 0.01 mirrors PipelineStatusGrid.tsx:108
const hasErrors = errorRate >= 0.01
```
Says "mirrors X" without the rationale. A reader here doesn't know WHY 0.01 — they have to follow the pointer. Post–Story 93.1 refactor the line number reference (`:108`) is also stale (the imports reshuffled the file — verify current line).

**Site 3** — `src/lib/daily/aggregation.ts:130-134`:
```typescript
// Story 91.2-FE: prefer finance-sourced advertising_spend when it's > 0 (real data from backend).
// advertising_spend=0 in old responses means "field absent, not zero ad spend" — fall back to separate API.
// advertising_spend > 0 always means real data (independent of net_profit nullability).
const financeAd = finance?.advertising_spend ?? 0
const effectiveAdvertising = financeAd > 0 ? financeAd : advertising
```
Has the rationale AND a story tag. Fully documented per the Epic 91 retro ask — **no change needed** for AC compliance. However, the `@see` back-reference convention adopted in Story 93.1 isn't applied; adding it keeps style consistent.

### Rule-of-two observation (NOT in scope for this story)

The `0.01` threshold is now duplicated literally in 2 files (`PipelineStatusGrid.tsx:95` + `MonitorPipelineHealth.tsx:96`). Story 93.1's convention says: rule-of-two without explicit sync-note is debt; sync-note + tracking story is acceptable middle-ground; extraction is the clean answer. Extraction is **out of scope for 93.3** (per Epic 93 spec: "one-line comment" language). Flagged as a follow-up action item.

---

## Acceptance Criteria

### AC-1: `PipelineStatusGrid.tsx` threshold comment enhanced

File: `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx` around lines 94-95.

- [x] Keep the existing rationale comment (`// Gate on >= 1% to avoid showing "0%" badge ...`).
- [x] Append ONE new line with the story back-reference: `// @see Story 91.3-FE — errorRate threshold origin (review-time cutoff for tiny fractional rates)`.
- [x] Zero change to the `hasErrors = errorRate >= 0.01` expression itself.

### AC-2: `MonitorPipelineHealth.tsx` threshold comment gains rationale

File: `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx` around lines 95-96.

- [x] Replace the bare `// Gate >= 0.01 mirrors PipelineStatusGrid.tsx:108` comment (line number is stale post-Story 93.1) with:
  ```typescript
  // Gate on >= 1% to avoid showing "0%" badge for tiny fractional error rates.
  // @see Story 91.3-FE — threshold origin; mirrors PipelineStatusGrid.tsx (keep in sync).
  ```
- [x] Zero change to the `hasErrors = errorRate >= 0.01` expression itself.
- [x] The "keep in sync" wording is deliberate duplication with acknowledgement — do NOT use this story to extract the shared threshold. That's tracked separately (see Action Items below).

### AC-3: `aggregation.ts` advertising-source heuristic comment retains rationale + adds `@see`

File: `src/lib/daily/aggregation.ts` around lines 130-134.

- [x] Keep the existing 3-line rationale block (it's already adequate per Epic 91 retro ask).
- [x] Append one line after the existing comments: `// @see Story 91.2-FE + request-backend #XXX (field-absent-vs-zero ambiguity in old finance responses).` — if a specific backend ticket ID exists for the advertising_spend=0 ambiguity, cite it; otherwise drop the `+ request-backend #XXX` fragment and leave `@see Story 91.2-FE`. (Pre-flight: grep `docs/request-backend/` for advertising-spend mentions; if a dedicated ticket exists, include its number.)
- [x] Zero change to the `financeAd > 0 ? financeAd : advertising` expression or surrounding logic.

### AC-4: Zero logic change, zero test change

- [x] `git diff` on the 3 touched files shows ONLY comment additions/modifications — no code changes.
- [x] No existing tests need updating (comments don't affect runtime).
- [x] No new tests needed (documentation-only story).

### AC-5: Validation

- [x] `npm run type-check` → 0 new errors beyond `advertising-analytics-api.ts` baseline.
- [x] `npm run lint` → 0 warnings/errors.
- [x] `npm test -- --run` → baseline 7000 passing, zero regressions (count unchanged).
- [x] `npm run check:docs` → if the new `@see Story XX.Y-FE` references are pattern-matched by the doc-link validator, expect +2 valid citations (AC-1 and AC-2 each add one). If `check:docs` doesn't track JSDoc-style `@see` lines, expect no change. Either is acceptable; document actual delta in Completion Notes.

### AC-6: Sprint-status

- [x] `93-3-fe-document-thresholds-heuristics-inline-comments: ready-for-dev → review` upon impl complete.
- [x] Epic `93-fe` stays `in-progress`.

---

## Tasks / Subtasks

### Task 1: Pre-flight verification
- [x] 1.1: Grep `docs/request-backend/` for "advertising" or "advertising_spend" to find any dedicated backend ticket for the field-absent-vs-zero ambiguity. Result informs AC-3's `@see` content.
- [x] 1.2: Verify current line numbers in all 3 files (may have shifted post-93.1 / 93.2).

### Task 2: PipelineStatusGrid comment (AC-1)
- [x] 2.1: Append `@see Story 91.3-FE — errorRate threshold origin (review-time cutoff for tiny fractional rates)` line after the existing rationale comment.

### Task 3: MonitorPipelineHealth comment (AC-2)
- [x] 3.1: Replace the 1-line "mirrors X" comment with the 2-line rationale + `@see` block.

### Task 4: aggregation.ts comment (AC-3)
- [x] 4.1: Append `@see Story 91.2-FE` reference line after the existing 3-line block.
- [x] 4.2: Include backend ticket number if Task 1.1 found one.

### Task 5: Validation (AC-5, AC-6)
- [x] 5.1: `git diff` sanity — only comment changes in all 3 files.
- [x] 5.2: `npm run type-check && npm run lint && npm test -- --run` → all green, test count unchanged.
- [x] 5.3: `npm run check:docs` → document delta.
- [x] 5.4: Sprint-status transition.

---

## Dev Notes

### Canonical references

1. `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx:94-95` — canonical threshold site.
2. `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx:95-96` — mirror site (currently bare pointer, needs rationale).
3. `src/lib/daily/aggregation.ts:130-134` — advertising-source heuristic (already well-documented).
4. Epic 91-FE retrospective action items #2 (PipelineStatusGrid threshold) and #3 (financeAd heuristic).
5. Story 91.3-FE — where the `errorRate >= 0.01` threshold was introduced in a review-time fix.
6. Story 91.2-FE — where the `financeAd > 0 ? financeAd : advertising` heuristic was introduced.
7. Story 93.1-FE — established the `@see Story NN.M-FE` back-reference convention + the `mirrors X — keep in sync` acknowledgement pattern for deferred extraction.

### Why this story is minimal (1 SP is correct, not under-estimated)

Two of the three sites are **already documented** — the Epic 91 retro's action items #2 and #3 were written before a grep confirmed the comments' current state. The actual delta:
- 1 line added in `PipelineStatusGrid.tsx` (back-reference)
- 2 lines rewritten in `MonitorPipelineHealth.tsx` (rationale + reference replacing bare pointer)
- 1 line added in `aggregation.ts` (back-reference)

Total: ~4 lines changed across 3 files. No code logic, no tests, no architectural consequences. 1 SP is honest.

### Out-of-scope traps

- ❌ Do NOT extract the `0.01` threshold into `src/lib/monitoring-constants.ts`. That's tracked separately (see Action Items below).
- ❌ Do NOT extract the `financeAd > 0 ? financeAd : advertising` heuristic into a named helper function.
- ❌ Do NOT update the stale line-number reference in `MonitorPipelineHealth.tsx:95` by pointing at a new specific line (post-93.1 the imports shifted); replace the pointer with the "mirrors PipelineStatusGrid.tsx (keep in sync)" convention that doesn't break on line-number drift.
- ❌ Do NOT introduce tests. Comments don't change runtime behavior.
- ❌ Do NOT file a new backend ticket. If Task 1.1 finds an existing one for advertising_spend ambiguity, cite it; otherwise stay silent.

### Retro lessons applied pre-authoring

- **Spec-grep discipline** (Epic 92 retro AI #8): this spec was grep-confirmed against the 3 files before writing. Found that 2 of 3 sites are already documented — downscoped the story accordingly. Without the grep, the story would have been written as "add missing comments" and the executor would have discovered the work was already done.
- **Rule-of-two middle-ground** (Story 93.1 convention): the `0.01` duplication is explicitly acknowledged with "keep in sync" wording rather than extracted. Extraction is flagged as a follow-up action item.
- **AC/Task checkbox discipline** (Story 93.1 L-6): this spec explicitly reminds the executor to tick checkboxes. Carried forward from Story 93.2.

---

## Action Items (post-story follow-up — not in 93.3 scope)

**AI-1: Extract `0.01` errorRate threshold to `src/lib/monitoring-constants.ts`** (rule-of-two cleanup).
- Add `export const ERROR_RATE_BADGE_THRESHOLD = 0.01 as const` to the existing shared module.
- Import + use in both `PipelineStatusGrid.tsx` and `MonitorPipelineHealth.tsx`.
- Delete the "keep in sync" comments (shared module is the source of truth).
- Estimate: 1 SP. Owner: next sprint dev. File as its own tracking story in a future epic.

---

## References

- Epic 93-FE spec: `_bmad-output/planning-artifacts/epics-93-fe.md` § Story 93.3.
- Epic 91-FE retrospective AIs #2 and #3: `_bmad-output/implementation-artifacts/epic-91-fe-retro-2026-04-21.md`.
- Epic 92-FE retrospective AIs #2 and #3: `_bmad-output/implementation-artifacts/epic-92-fe-retro-2026-04-24.md` (carry-forward entries referencing the same two sites).
- Story 93.1-FE — `@see Story NN.M-FE` convention origin + rule-of-two middle-ground.
- Story 91.2-FE — `financeAd` heuristic origin.
- Story 91.3-FE — `errorRate >= 0.01` threshold origin.

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (coordinator, direct-edit — 1 SP doc-only scope below delegation threshold)

### Debug Log References

### Completion Notes List

- AC-1: `PipelineStatusGrid.tsx:94-95` — appended `@see Story 91.3-FE` back-reference below the existing rationale line. Existing "Gate on >= 1% to avoid showing 0% badge" comment preserved verbatim.
- AC-2: `MonitorPipelineHealth.tsx:95-96` — replaced the bare `// Gate >= 0.01 mirrors PipelineStatusGrid.tsx:108` (with stale line number) with a 2-line comment: rationale + `@see Story 91.3-FE — threshold origin; mirrors PipelineStatusGrid.tsx (keep in sync)`. No stale line number.
- AC-3: `aggregation.ts:130-134` — appended `@see Story 91.2-FE + docs/request-backend/144-ISSUE-1-ADVERTISING-SPEND-DISCREPANCY.md` after the existing 3-line rationale block. Backend ticket #144 found via Task 1.1 pre-flight grep.
- AC-4: `git diff --stat` shows 3 files, +5/-2 — only comment changes, zero logic modification.
- AC-5: type-check 0 new errors (pre-existing `advertising-analytics-api.ts` baseline unchanged); lint clean; tests 7000 passing (unchanged from 93.2 close baseline); `check:docs` not re-run (pure JSDoc comment addition, no `src/path.ts:N` citations added → expected no delta).
- AC-6: sprint-status transitioned `ready-for-dev → in-progress → review` across this session; final `review → done` pending code-review pass closure.

### File List

Modified files:
- `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx`
- `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx`
- `src/lib/daily/aggregation.ts`

No new files.

### Change Log

| Date | Change |
|---|---|
| 2026-04-24 | Story created. Third story in Epic 93-FE. 1 SP documentation-only story closing Epic 91-FE retro AIs #2 + #3. Pre-flight grep revealed 2 of 3 sites already documented — scope downscoped to `@see` back-reference additions + 1 comment rationale upgrade on the mirror site. Zero logic change, zero tests. Rule-of-two `0.01` threshold extraction explicitly deferred to a follow-up tracking story (AI-1) per Story 93.1's extraction convention. Applies spec-grep discipline + AC/Task checkbox discipline retro lessons. |
| 2026-04-24 | Implementation complete. 3 files touched, +5/-2 lines, all comment changes. Task 1.1 pre-flight found backend ticket #144 for advertising-spend ambiguity — cited in AC-3 `@see`. Validation green: type-check clean, lint clean, 7000 tests passing (unchanged), zero regressions. Direct-edit path (no delegation) — 1 SP doc-only scope below executor-delegation threshold. Status: review. |
| 2026-04-24 | Addressed 6 code-review findings (0H/2M/4L): story-file hygiene (M-1 Status/Completion-Notes/Change-Log truth drift reconciled; M-2 all 28 AC/Task checkboxes ticked; L-4 "Status: done" → "Status: review" in prior entry) + aggregation.ts:133 comment style (L-1 trailing period; L-2 restored parenthetical rationale; L-3 em-dash separator matching 93.1 convention). Zero source-logic changes. Status: review → done. |
