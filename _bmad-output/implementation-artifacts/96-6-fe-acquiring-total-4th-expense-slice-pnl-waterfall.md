# Story 96.6-FE: Add `acquiring_total` field to `FinanceSummary` interface (type-only)

Status: done

## Story

As a **dashboard P&L author preparing for backend's Epic 101 `acquiring_total` field rollout**,
I want **the `acquiring_total` field to exist on the `FinanceSummary` TypeScript interface**,
so that **(a) the type contract reflects the backend canonical response shape per `#169 § 2.1`, AND (b) future consumer migration (switching `PnLWaterfall` from legacy `acquiring_fee` to canonical `acquiring_total`) doesn't require interface changes** — type-infrastructure prep, deferred consumer migration.

## Story Context

**4th Pattern 4 reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4 reframes; vs 96.3 + 96.5 genuine net-new). Spec-grep + curl confirmed:

- The 4th expense slice **already exists** in `PnLWaterfall`. `DeductionsSection.tsx:112-122` renders "Эквайринг" via legacy `data.acquiring_fee` field. `PnLWaterfall.tsx:51, 77, 147` compute `acquiringPct` and include it in the deduction sum. **The headline "add 4th slice" is shipped.**
- `FinanceSummary` interface has `acquiring_fee` + `acquiring_fee_total` (legacy fields) but **NOT** `acquiring_total` (new canonical field per Epic 101 / `#169 § 2.1`). Type gap.
- Empirical curl: `summary_total.acquiring_total: None` (NULL — backend graceful-degradation per `#169`); `acquiring_fee_total: 17115.12` is currently the populated field.

This story prepares the type infrastructure for when backend starts populating `acquiring_total` (currently null in response). Consumer migration in `PnLWaterfall` (switching from `acquiring_fee` to `acquiring_total`) is **DEFERRED** because:
- Backend always returns null for `acquiring_total` currently → migration would be untestable.
- Legacy `acquiring_fee` continues working; no production user impact.
- Type-only addition is the lowest-risk pattern (same as Story 96.5).

Source for the reframe: `_bmad-output/planning-artifacts/epics-96-fe.md` § Story 96.6-FE (post-2026-05-08 reframe).

## Acceptance Criteria

1. **AC-1 (G-1) — Type addition**: Add `acquiring_total?: number | null` field to `FinanceSummary` interface at `src/types/finance-summary.ts`. JSDoc must:
   - Cite `request-backend/169 § 2.1` as the backend canonical contract source.
   - Document the canonical-vs-legacy relationship: this is the new canonical field; `acquiring_fee_total` is the legacy Epic 26-era field; both currently coexist until backend deprecates the legacy.
   - Note that `null` means "no acquiring data available for this period" (graceful degradation per backend doctrine).

2. **AC-2 (G-3) — Empirical curl verification**: Run curl against `/v1/analytics/weekly/finance-summary?week=2026-W17` and confirm response contains BOTH `acquiring_total` (likely null) AND `acquiring_fee_total` (likely populated). Capture in Dev Notes § Backend response capture.

3. **AC-3 (G-2) — Deferred consumer migration documented**: Dev Notes explicitly states that `PnLWaterfall` consumer migration is DEFERRED. The JSDoc on the new field signals the expected migration path.

4. **AC-4 (G-4) — Boundary Normalizer Pattern decision**: Structural-identity exception applies (per Story 96.1 + 96.5 precedent — backend shape matches frontend type verbatim). No normalizer, no test required.

5. **AC-5 — Quality gates green at baselines**: check:docs 13/13, type-check 20 (all in `advertising-analytics-api.ts`), lint 0/0, tests ≥7019.

6. **AC-6 — Lessons-line discipline (Story 94.4-FE)**: final Change Log row has `**Lessons:**` ≤120 chars × 1-3.

7. **AC-7 — 4-pass review per established Epic 96-FE discipline**: 3 self-passes + **MANDATORY** fresh-context 4th-pass via `/bmad:bmm:workflows:code-review 96.6` (per Story 96.3+96.4+96.5 empirical vindication: 4th-pass found defects in 3/3 prior stories where it was invoked).

## Tasks / Subtasks

- [x] **Task 1 — Add `acquiring_total` field** (AC: #1) — added `acquiring_total?: number | null` to `FinanceSummary` interface at `src/types/finance-summary.ts` next to legacy `acquiring_fee_total`/`acquiring_fee` fields. JSDoc cites `request-backend/169 § 2.1`, describes canonical-vs-legacy coexistence, notes `null` semantics.
- [x] **Task 2 — Curl verification** (AC: #2) — `GET /v1/analytics/weekly/finance-summary?week=2026-W17` confirmed `summary_total.acquiring_fee_total: 17115.12` (legacy populated) AND `summary_total.acquiring_total: None` (new canonical, null per backend graceful-degradation). Both fields coexist as expected.
- [x] **Task 3 — Document deferred consumer migration + Boundary Normalizer decision** (AC: #3, #4) — see Dev Notes below.
- [x] **Task 4 — Quality gates** (AC: #5) — all 4 green at baselines: check:docs 13/13, type-check 20 (all in `advertising-analytics-api.ts`), lint 0/0, vitest 7019/0 (no test count change for type-only addition).
- [x] **Task 5 — Change Log + Lessons-line** (AC: #6) — done.
- [ ] **Task 6 — 4-pass review** (AC: #7) — 3 self-passes done during dev-story; **MANDATORY 4th-pass via `/bmad:bmm:workflows:code-review 96.6`** per Story 96.3+96.4+96.5 empirical vindication (4th-pass found defects in 3/3 prior stories).

## Dev Notes

### Backend response capture

**Captured 2026-05-08** — `GET /v1/analytics/weekly/finance-summary?week=2026-W17`:

```
summary_total.acquiring_fee_total: 17115.12   (legacy Epic 26-era field, populated)
summary_total.acquiring_total: null           (new canonical field per #169 § 2.1, null per backend graceful-degradation)
```

Confirms:
- ✅ Both fields coexist as expected per backend canonical contract.
- ✅ `acquiring_total` field exists in response shape (returns `null` not undefined or omitted) — backend has shipped the field per Epic 101 but data isn't flowing yet.
- ✅ Legacy `acquiring_fee_total` is still the populated source — current consumers (PnLWaterfall) keep working.

### Deferred consumer migration

`PnLWaterfall` consumer migration (switching from `data.acquiring_fee` → `data.acquiring_total`) is **DEFERRED to a future story** because:
- Backend currently returns `null` for `acquiring_total` → migration would be untestable in production.
- Legacy `acquiring_fee` continues working; no production user impact.
- Type-only addition is the lowest-risk pattern (same approach as Story 96.5).

When backend starts populating `acquiring_total`, a future story will:
1. Update `DeductionsSection.tsx:114-122` to read `data.acquiring_total ?? data.acquiring_fee` (prefer new, fall back to legacy).
2. Update `PnLWaterfall.tsx:51, 77, 147` similarly.
3. Eventually drop the legacy fallback once backend deprecates `acquiring_fee_total`.

### Boundary Normalizer Pattern decision

Backend response shape matches frontend type verbatim — `acquiring_total: number | null` on both sides. No casing migration, no shape coercion, no nullability collapse. **Structural-identity exception applies** (per Story 96.1's `getPreliminaryTax` + Story 96.5's `commission_other` precedent). No normalizer or test required for this type-only addition.

### References

- Backend canonical contract: `request-backend/169-BACKEND-UPDATE-EPICS-101-106.md` § 2.1 (acquiring_total in finance-summary).
- Existing legacy fields: `src/types/finance-summary.ts:82-83` (`acquiring_fee_total`, `acquiring_fee`).
- Existing consumer (using legacy field): `src/components/custom/pnl-waterfall/DeductionsSection.tsx:114-122` + `PnLWaterfall.tsx:51, 77, 147`.
- Pattern 4 origin: CLAUDE.md `### Multi-Source Orchestration` § Pattern 4.
- Empirical state at handoff (2026-05-08):
  - `src/types/finance-summary.ts` (FinanceSummary — G-1 target; acquiring_total missing)
  - Backend response: `summary_total.acquiring_total: None`, `summary_total.acquiring_fee_total: 17115.12`
  - PnLWaterfall: 4th slice already shipped using legacy `acquiring_fee`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context).

### Debug Log References

- Type-check: `npx tsc --noEmit` → 20 errors all in `advertising-analytics-api.ts` (baseline). No new errors.
- Curl: `GET /v1/analytics/weekly/finance-summary?week=2026-W17` → confirmed `acquiring_total: null` + `acquiring_fee_total: 17115.12`.
- Full vitest: 7019 passed, 0 failed (matches floor; no test count change for type-only addition).
- check:docs: 13/13 baseline match.

### Completion Notes List

- Added `acquiring_total?: number | null` to `FinanceSummary` interface with JSDoc citing `#169 § 2.1`, describing canonical-vs-legacy coexistence, notes `null` graceful-degradation semantics.
- JSDoc applies CLAUDE.md "Comment Policy" lessons from Story 96.5 S-1: cites load-bearing references only (backend ticket, canonical-vs-legacy invariant); NO rot-prone story-number metadata in the type JSDoc.
- 4th Pattern 4 reframe in Epic 96-FE; type-only pattern matches Story 96.5.
- Test count UNCHANGED at 7019: structural-identity exception means no new tests needed for type-only addition.

### File List

- **Modified** `src/types/finance-summary.ts` — added `acquiring_total?: number | null` field with full JSDoc.
- **Modified** `_bmad-output/planning-artifacts/epics-96-fe.md` — Story 96.6 entry rewritten with reframe block + 7 ACs.
- **Modified** `_bmad-output/implementation-artifacts/96-6-fe-acquiring-total-4th-expense-slice-pnl-waterfall.md` (this story file).
- **Modified** `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status flow.
- **NOT modified** `CLAUDE.md` — no test count change.

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:create-story 96.6`. **4th Pattern 4 reframe in Epic 96-FE** (alongside 96.1, 96.2, 96.4). Spec-grep at handoff confirmed: 4th expense slice already shipped using legacy `acquiring_fee`; real gap is type-only addition for new canonical `acquiring_total` field (currently NULL in backend response). Consumer migration DEFERRED to future story when backend populates. Type-only pattern same as Story 96.5. Status: backlog → ready-for-dev. |
| 2026-05-08 | Implementation complete. `acquiring_total?: number | null` added to `FinanceSummary` with JSDoc citing #169 § 2.1; empirical curl confirmed `acquiring_total: null` + `acquiring_fee_total: 17115.12` coexist as expected. Boundary Normalizer Pattern structural-identity exception documented. All 4 gates green at baselines (test count unchanged 7019). Status: in-progress → review. |
| 2026-05-08 | **4th-pass externally-invoked code-review found T-1 (HIGH)**: convention check revealed that `FinanceSummary` has `_total_total` variants for fields whose base name ends in `_total` (e.g., `retail_price_total` + `retail_price_total_total`). My single `acquiring_total` addition missed the `acquiring_total_total` variant for summary_total scope mapping — same drift class as Story 96.4 cross-cutting fixture impact. Empirical curl verified all 3 scopes (`summary_total`, `summary_rus`, `summary_eaeu`) return `acquiring_total` field with SAME name; convention requires distinct type fields per scope. **T-1 fix applied**: added `acquiring_total_total?: number | null` with JSDoc explaining the `_total_total` convention. JSDoc on `acquiring_total` clarified to reference summary_rus/eaeu scope. All 4 gates remain green at baselines. Status: done → done. **Lessons:** (1) 4th Pattern 4 reframe in Epic 96-FE — type-only addition pattern matures across 96.5+96.6. (2) `FinanceSummary` `_total_total` convention applies when base field name ends in `_total` — easy to miss in single-field additions; precedent: `retail_price_total_total`. (3) Story 94.3-FE 4th-pass empirical vindication holds 4th time in Epic 96-FE — same-context self-review missed convention requirement that fresh-context found immediately. |
