# Story 96.8-FE: Cross-reference `commission_other` in `OtherAdjustmentsRows`

Status: done

## Story

As a **future maintainer of `OtherAdjustmentsRows.tsx` looking to understand WB-services breakdown sourcing**,
I want **an inline comment cross-referencing `data.commission_other` as the parallel Story 107.1 canonical source**,
so that **the relationship between `other_adjustments` (current consumer source) and `commission_other` (Story 96.5 type addition; Story 107.1 backend extraction via `corrections.bonus_type_name`) is documented inline** — informs future maintainers without changing production behavior.

## Story Context

**6th Pattern 4 reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4, 96.6, 96.7 reframes; vs 96.3 + 96.5 genuine net-new). Spec-grep at handoff confirmed:

- "Доп. сервисы WB" row is **already shipped** at `src/components/custom/pnl-waterfall/OtherAdjustmentsRows.tsx` (Request #56, predates Epic 96): 4-level hierarchical breakdown of "Прочие удержания" parent + "→ WB.Продвижение" / "→ Джем" / "→ Прочие сервисы" sub-rows.
- Empirical curl from Story 96.5: `other_adjustments: 179700.01` ≈ `commission_other: 179700` ≈ `wb_services_cost: 179700` — same value via different aggregation paths in backend.
- Consumer migration would provide NO user-facing change. Real residual is documentation-only.

**Smallest residual scope of any Epic 96 story so far** (~0.5 SP, comment-only).

## Acceptance Criteria

1. **AC-1 — Inline cross-reference comment** added near the row-construction block in `OtherAdjustmentsRows.tsx` noting:
   - `data.commission_other` (Story 96.5 type addition; backend extraction per `request-backend/173 § I1` + Story 107.1 `corrections.bonus_type_name`) is a parallel canonical source.
   - Current consumer uses `data.other_adjustments`; per backend curl 2026-05-08 they're empirically equivalent (179700 ± 0.01).
   - Per CLAUDE.md "Comment Policy" + Story 96.5 S-1 lesson: only load-bearing references; no rot-prone story-number metadata in body code (story numbers OK in this case because they pin the WHY — backend ticket dependencies).

2. **AC-2 — Quality gates green at baselines**: check:docs 13/13, type-check 20 (all in `advertising-analytics-api.ts`), lint 0/0, tests ≥7019.

3. **AC-3 — Lessons-line per Story 94.4-FE**: 1-3 patterns ≤120 chars.

4. **AC-4 — 4-pass review per Epic 96-FE established discipline** (5/5 4th-pass-found-defect rate): 3 self-passes + mandatory `/bmad:bmm:workflows:code-review 96.8`.

## Tasks / Subtasks

- [x] **Task 1 — Add inline cross-reference comment** (AC: #1) — added 7-line cross-reference paragraph in `OtherAdjustmentsRows.tsx` JSDoc citing `request-backend/173 § I1` + Story 107.1 backend extraction logic + empirical equivalence per 2026-05-08 curl + when-to-switch guidance.
- [x] **Task 2 — Quality gates** (AC: #2) — all 4 green: check:docs 13/13, type-check 20 (all in `advertising-analytics-api.ts`), lint 0/0, full vitest 7019/0 (1 transient failure on first run, clean on re-run; comment-only change can't cause real test failure).
- [x] **Task 3 — Change Log + Lessons-line** (AC: #3) — done.
- [ ] **Task 4 — 4-pass review** (AC: #4) — 3 self-passes done; **MANDATORY 4th-pass via `/bmad:bmm:workflows:code-review 96.8`** per Epic 96-FE 5/5 rate.

## Dev Notes

### References

- Existing consumer (already shipped): `src/components/custom/pnl-waterfall/OtherAdjustmentsRows.tsx`.
- `commission_other` type field (Story 96.5): `src/types/analytics.ts:88-95`.
- Backend canonical contract: `request-backend/173-BACKEND-RESPONSE-FE-VALIDATION-EPICS-101-109.md` § I1 + Story 107.1 fix.
- Empirical equivalence (Story 96.5 curl 2026-05-08): `other_adjustments: 179700.01`, `commission_other: 179700`, `wb_services_cost: 179700`.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context).

### Debug Log References

- Type-check: 20 errors all in `advertising-analytics-api.ts` (baseline). No new errors.
- ESLint: clean.
- Full vitest: 7019/0 (1 transient flake on first run for unrelated test; comment-only change is mathematically incapable of affecting test logic).
- check:docs: 13/13 baseline match.

### Completion Notes List

- Added cross-reference comment to `OtherAdjustmentsRows.tsx` JSDoc explaining `commission_other` (Story 96.5/107.1 canonical) is a parallel source for the same total. Includes empirical equivalence note (179700.01 vs 179700) + when-to-switch guidance.
- 6th Pattern 4 reframe in Epic 96-FE; smallest residual scope yet (single-file comment-only change).
- Test count UNCHANGED at 7019: comment-only addition cannot affect test logic.

### File List

- **Modified** `src/components/custom/pnl-waterfall/OtherAdjustmentsRows.tsx` — added 7-line cross-reference paragraph to JSDoc.
- **Modified** `_bmad-output/planning-artifacts/epics-96-fe.md` — Story 96.8 entry rewritten with reframe block + 4 ACs.
- **Modified** `_bmad-output/implementation-artifacts/96-8-fe-restore-dop-servisy-wb-row-pnl-waterfall.md` (this story file).
- **Modified** `_bmad-output/implementation-artifacts/sprint-status.yaml`.

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:create-story 96.8`. **6th Pattern 4 reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4, 96.6, 96.7). Spec-grep at handoff confirmed: row already shipped at `OtherAdjustmentsRows.tsx` per Request #56; consumer migration would produce no user-facing change (empirical values equivalent). Reframed to inline cross-reference comment only — smallest residual of any Epic 96 story (~0.5 SP). Status: backlog → ready-for-dev. |
| 2026-05-08 | Implementation complete. Cross-reference paragraph added to `OtherAdjustmentsRows.tsx` JSDoc explaining the parallel `commission_other` source (Story 96.5/107.1) + empirical equivalence + when-to-switch guidance. All 4 gates green at baselines (test count unchanged 7019). Status: in-progress → review. |
| 2026-05-08 | **4th-pass externally-invoked code-review found V-1 (LOW)**: my JSDoc embedded specific empirical values (`179700.01 vs 179700`) + specific date (`2026-05-08`) — same drift class as Story 96.5 S-1 (Comment Policy violation re: rot-prone metadata). Trimmed to "expected to be near-equivalent in normal operation"; specific values preserved in story Dev Notes per separation-of-concerns. V-2/V-3/V-8 verified ✅ (Russian Cyrillic correctness; forward-looking guidance is load-bearing about backend; no other consumers in same scope need cross-reference). Story 94.3-FE 4th-pass empirical vindication holds **6/6** in Epic 96-FE — 100% defect-find rate continues even on comment-only changes. Status: done → done. **Lessons:** (1) 6th Pattern 4 reframe in Epic 96-FE — smallest residual scope of any story (~0.3 SP comment-only). (2) Specific empirical values + dates rot in JSDoc; belong in story Dev Notes per Story 96.5 S-1 separation-of-concerns precedent. (3) 4th-pass fresh-context found 1 LOW even on comment-only change — Story 94.3-FE empirically validated 6/6 in Epic 96-FE; the rate is robust across story-scope size. |
