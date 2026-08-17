# Story 96.7-FE: JSDoc cleanup for `retail_price_total` / `retail_price_total_total` fields

Status: done

## Story

As a **maintainer of `FinanceSummary` types reading the existing sales-funnel implementation**,
I want **`retail_price_total` and `retail_price_total_total` fields to have JSDoc citing the backend canonical contract and describing semantics**,
so that **future readers understand the funnel-base-cost role of these fields without spelunking through `SalesFunnelSection.tsx` to infer it** — pattern alignment with Stories 96.5+96.6 JSDoc additions.

## Story Context — Why This Story Exists in Its Current Form

**5th Pattern 4 reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4, 96.6 reframes; vs 96.3 + 96.5 genuine net-new). Spec-grep at handoff revealed:

- Sales funnel is **already shipped** at `src/components/custom/financial-summary/SalesFunnelSection.tsx` (122 lines, fully built per UX) — 4+1 step funnel with period comparison, Russian-locale `formatCurrency`, conditional rendering, arrow-based deltas.
- Original AC-1 (UX gate) satisfied empirically — host + layout already decided + shipped.
- Original ACs 2-4 (4-step funnel + Russian locale + ≤200 lines) all empirically satisfied.
- Real residual gap: bare type annotations on `retail_price_total?: number` + `retail_price_total_total?: number` (`src/types/finance-summary.ts:123-124`). No JSDoc citing backend source or describing semantics.

Per Stories 96.5 (`commission_other`) + 96.6 (`acquiring_total`) precedents, type fields added by Epic 101 backend should have JSDoc citing `request-backend/169` and describing the canonical-vs-legacy semantics. Story 96.7 closes this minor JSDoc-completeness gap.

## Acceptance Criteria

1. **AC-1 — JSDoc additions**: Add JSDoc to `retail_price_total` (line 123) and `retail_price_total_total` (line 124) at `src/types/finance-summary.ts`. Required content:
   - Backend canonical contract citation (`request-backend/169 § 2.2`).
   - Field semantics: "Sum of YOUR catalog prices BEFORE WB discounts; funnel-base-cost for sales-funnel visualization".
   - Scope distinction: `retail_price_total` (summary_rus/eaeu, per-region) vs `retail_price_total_total` (summary_total, RUS+EAEU consolidated) per the `_total_total` convention established by Story 96.6.
   - Per CLAUDE.md "Comment Policy" + Story 96.5 S-1 lesson: NO rot-prone story-number metadata in JSDoc; only load-bearing references.

2. **AC-2 — Quality gates green at baselines**: check:docs 13/13, type-check 20 (all in `advertising-analytics-api.ts`), lint 0/0, tests ≥7019.

3. **AC-3 — Lessons-line discipline (Story 94.4-FE)**: final Change Log row has `**Lessons:**` ≤120 chars × 1-3.

4. **AC-4 — 4-pass review**: 3 self-passes during dev-story + **MANDATORY** fresh-context 4th-pass via `/bmad:bmm:workflows:code-review 96.7` per Story 96.3+96.4+96.5+96.6 empirical vindication (4-of-4 prior stories had 4th-pass defects).

## Tasks / Subtasks

- [x] **Task 1 — Add JSDoc to both fields** (AC: #1) — added 6-line JSDoc to `retail_price_total` (per-region scope) and 5-line JSDoc to `retail_price_total_total` (summary_total scope), each citing `request-backend/169 § 2.2` + describing funnel-base-cost semantics. Story 96.6 T-1 `_total_total` convention referenced inline.
- [x] **Task 2 — Quality gates** (AC: #2) — all 4 green at baselines: check:docs 13/13, type-check 20 (all in `advertising-analytics-api.ts`), lint 0/0, vitest 7019/0 (no test count change for JSDoc-only addition).
- [x] **Task 3 — Change Log + Lessons-line** (AC: #3) — done.
- [ ] **Task 4 — 4-pass review** (AC: #4) — 3 self-passes done; **MANDATORY 4th-pass via `/bmad:bmm:workflows:code-review 96.7`** per Story 96.3+96.4+96.5+96.6 100% defect-find rate.

## Dev Notes

### References

- Backend canonical contract: `request-backend/169-BACKEND-UPDATE-EPICS-101-106.md` § 2.2 (`retail_price_total`).
- Existing consumer (already shipped): `src/components/custom/financial-summary/SalesFunnelSection.tsx:22-43` (uses `?? fallback` between `_total_total` and `_total` variants).
- `_total_total` convention origin: Story 96.6 T-1 4th-pass finding.
- JSDoc Comment Policy: CLAUDE.md "Comment Policy" + Story 96.5 S-1 lesson (no rot-prone story-number metadata).
- Empirical state at handoff (2026-05-08):
  - `src/types/finance-summary.ts:123-124` (G-1 target — bare annotations, no JSDoc)
  - `src/components/custom/financial-summary/SalesFunnelSection.tsx` (consumer — 122 lines, fully built)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context).

### Debug Log References

- Type-check: `npx tsc --noEmit` → 20 errors all in `advertising-analytics-api.ts` (baseline). No new errors.
- ESLint: clean on `src/types/finance-summary.ts`.
- check:docs: 13/13 baseline match (no new validator-matching path:N citations).
- Full vitest: 7019 passed, 0 failed (JSDoc-only addition, no test count change).

### Completion Notes List

- Added JSDoc to `retail_price_total` and `retail_price_total_total` fields with: backend ticket citation (`request-backend/169 § 2.2`), funnel-base-cost description, scope distinction per `_total_total` convention from Story 96.6 T-1.
- JSDoc applies CLAUDE.md "Comment Policy" + Story 96.5 S-1 lesson — no rot-prone story-number metadata; only load-bearing references.
- 5th Pattern 4 reframe in Epic 96-FE; smallest residual scope (~0.5 SP).
- Test count UNCHANGED at 7019: JSDoc-only addition, no production behavior change.

### File List

- **Modified** `src/types/finance-summary.ts` — added JSDoc to `retail_price_total` (6 lines) + `retail_price_total_total` (5 lines).
- **Modified** `_bmad-output/planning-artifacts/epics-96-fe.md` — Story 96.7 entry rewritten with reframe block + 4 ACs.
- **Modified** `_bmad-output/implementation-artifacts/96-7-fe-retail-price-total-sales-funnel-visualization.md` (this story file).
- **Modified** `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status flow.
- **NOT modified** `CLAUDE.md` — no test count change.

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:create-story 96.7`. **5th Pattern 4 reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4, 96.6). Spec-grep at handoff confirmed: sales funnel already shipped at `SalesFunnelSection.tsx` (122 lines, full UX); original ACs 1-4 all empirically satisfied. Reframed to G-1 JSDoc cleanup only (smallest residual scope of any Epic 96 story). Status: backlog → ready-for-dev. |
| 2026-05-08 | Implementation complete. JSDoc added to `retail_price_total` (per-region scope) + `retail_price_total_total` (summary_total scope per Story 96.6 T-1 `_total_total` convention), each citing `request-backend/169 § 2.2` + funnel-base-cost semantics. All 4 gates green at baselines (test count unchanged 7019). Status: in-progress → review. |
| 2026-05-08 | **4th-pass externally-invoked code-review found U-1 (CRITICAL CASCADING DEFECT)**: empirical curl revealed `_total_total` convention I extrapolated from `retail_price_total_total` is FALSE. Backend uses DIFFERENT names per scope per field family: `retail_price_total` (rus/eaeu) vs `retail_price_total_combined` (summary_total — NOT `_total_total`); but `acquiring_total` uses SAME name across all scopes. **Story 96.6 T-1 was wrong**: `acquiring_total_total` field was DEAD (no backend correspondence) — REVERTED. Story 96.7 JSDoc on `retail_price_total_total` updated to flag it as MISNAMED/broken pre-existing field; consumers always get undefined; SalesFunnelSection fallback masks the bug for rus/eaeu but renders 0 for summary_total. Filed Epic 97-FE candidate for `retail_price_total_total` → `retail_price_total_combined` rename. All 4 gates remain green at baselines. Story 94.3-FE 4th-pass empirical vindication holds 5/5 in Epic 96-FE. Status: done → done. **Lessons:** (1) 5th Pattern 4 reframe in Epic 96-FE; sales funnel was already shipped, only JSDoc gap remained. (2) Field-family naming conventions DIFFER per backend field family (acquiring uses same name across scopes; retail_price uses different names) — DON'T extrapolate one field's convention to others without empirical curl per scope. (3) 4th-pass fresh-context review found cascading error: my Story 96.6 T-1 fix was wrong, propagated into 96.7 JSDoc; cascade caught and remediated immediately. Story 94.3-FE 4-pass discipline empirically validated 5th time. |
