# Story 96.5-FE: Add `commission_other` field to `CabinetSummaryTotals` interface

Status: done

<!-- 3 self-passes (during dev-story execution) found 0 fixes — flagged as suspicious per Story 96.3+96.4 empirical vindication that same-context 3-pass consistently misses defects fresh-context catches.
     STRONGLY RECOMMEND user invoke `/bmad:bmm:workflows:code-review 96.5` for fresh-context 4th-pass before considering production-ready. -->

## Story

As a **dashboard P&L author preparing Story 96.8's "Доп. сервисы WB" row**,
I want **the `commission_other` field to exist on the `CabinetSummaryTotals` TypeScript interface**,
so that **Story 96.8 can read `cabinet-summary.commission_other` from the typed response without further interface changes** — closing a real type-infrastructure gap (the field exists in backend response per Story 107.1 + #173 I1 but is missing from frontend types).

## Story Context — Why This Story Exists in Its Current Form

This is the **2nd genuine net-new story in Epic 96-FE** (alongside Story 96.3; vs Stories 96.1, 96.2, 96.4 which were Pattern 4 reframes). Pattern 4 spec-grep at create-story handoff confirmed:

- The original "source migration" headline scope is **VACUOUSLY satisfied** — `FinanceSummary` interface at `src/types/finance-summary.ts` does NOT contain `commission_other`; ZERO consumers read it from any source. Nothing to migrate.
- `commission_other` IS NOT in `CabinetSummaryTotals` interface (`src/types/analytics.ts:62-95`) either. **Real gap**: the field is missing entirely from frontend types.
- Only 1 reference to `commission_other` in `src/`: `src/hooks/sku-financials-types.ts:44` inside `BackendVisibility` interface — orthogonal scope (per-SKU financials, not cabinet-level).

**Backend canonical contract** (per `#173 § I1` + Story 107.1 confirmation):
- Endpoint: `GET /v1/analytics/weekly/cabinet-summary`
- Returns `commission_other` at top level
- Story 107.1 backend fix: extracts WB.Promotion + Dzham costs from `corrections.bonus_type_name` matching
- Empirical evidence (from coordination thread): `commission: 56020.02` vs `commission_other: 179700` (delta -123679.98) — distinct values, not aliases

This story prepares the type infrastructure so Story 96.8 can consume `commission_other` for the P&L "Доп. сервисы WB" row restoration without further interface changes. **Ordering matters**: type before consumer.

Source for the reframe rationale: `_bmad-output/planning-artifacts/epics-96-fe.md` § Story 96.5-FE (post-2026-05-08 reframe block).

## Acceptance Criteria

1. **AC-1 (G-1) — Type addition**: Add `commission_other?: number | null` to `CabinetSummaryTotals` interface in `src/types/analytics.ts` with JSDoc citing `#173 § I1` + Story 107.1 + Story 96.5-FE provenance.

2. **AC-2 (G-2) — Empirical curl verification**: Run from project root:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"[REDACTED-TEST-PASSWORD]"}' \
     | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token') or d.get('data',{}).get('access_token',''))")
   CABINET="f75836f7-c0bc-4b2c-823c-a1f3508cce8e"
   curl -s -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET" \
     'http://localhost:3000/v1/analytics/weekly/cabinet-summary?weeks=4' \
     | python3 -m json.tool 2>&1 | head -50
   ```
   Confirm response contains `commission_other` field at expected location. Capture top of response in Dev Notes § Backend response capture.

3. **AC-3 (G-3) — Document downstream consumer**: Dev Notes mentions Story 96.8 will be 1st consumer (P&L "Доп. сервисы WB" row).

4. **AC-4 (G-4) — Boundary Normalizer Pattern decision**: If `useCabinetSummary` is pure pass-through, document the structural-identity exception in Dev Notes (per Story 96.1 precedent). No normalizer or test added unless the pattern requires.

5. **AC-5 — Quality gates green at baselines** (per CLAUDE.md `### Accepted Baselines` after Stories 96.1+96.2+96.3 ratchets to 7019):
   - `bash scripts/check-doc-citations.sh` — exit 0 (baseline 13).
   - `npm run type-check` — 20 errors all in `advertising-analytics-api.ts`.
   - `npm run lint` — 0 errors, 0 warnings.
   - `npm test -- --run` — 0 failed; passing ≥ 7019.

6. **AC-6 — Lessons-line per Story 94.4-FE**: final Change Log row has `**Lessons:**` ≤120 chars × 1-3.

7. **AC-7 — 2-pass review (extended to 4-pass per Epic 96-FE established discipline)**: 1st-pass + 2nd-pass + 3rd-pass self-review + **STRONGLY RECOMMENDED** 4th-pass via explicit `/bmad:bmm:workflows:code-review 96.5` invocation per Story 96.3 + 96.4 empirical vindication.

## Tasks / Subtasks

- [x] **Task 1 — Add `commission_other` to `CabinetSummaryTotals`** (AC: #1) — added field with full JSDoc citing #173 § I1 + Story 107.1 + Story 96.5-FE provenance + empirical distinct-from-`commission` example.
- [x] **Task 2 — Curl verification** (AC: #2) — `GET /v1/analytics/weekly/cabinet-summary?weeks=4` returned populated response with `commission: 56020.02` AND `commission_other: 179700` (distinct values, delta 123679.98 matches Story 107.1 example). Captured in Dev Notes § Backend response capture.
- [x] **Task 3 — Document Story 96.8 consumer prep + Boundary Normalizer Pattern decision** (AC: #3, #4) — see Dev Notes below.
- [x] **Task 4 — Quality gates** (AC: #5) — all 4 green at baselines: check:docs 13/13, type-check 20 (all in `advertising-analytics-api.ts`), lint 0/0, vitest 7019/0 (no test count change for type-only addition).
- [x] **Task 5 — Change Log + Lessons-line** (AC: #6) — done.
- [x] **Task 6 — 3-pass self review** (AC: #7) — same-context discipline; **strongly recommend** user invoke `/bmad:bmm:workflows:code-review 96.5` for genuine 4th-pass per Story 96.3+96.4 empirical vindication.

## Dev Notes

### Backend response capture

**Captured 2026-05-08** — `GET /v1/analytics/weekly/cabinet-summary?weeks=4` (4-week aggregate, 2026-W15..W19):

```json
{
  "summary": {
    "period": { "start": "2026-W15", "end": "2026-W19", "weeks_count": 4 },
    "totals": {
      "sales_gross": 1969308.06,
      "sale_gross": 1946887.06,
      "total_commission_rub": 567035.07,
      "logistics_cost": 199014.16,
      "storage_cost": 20273.09,
      "wb_services_cost": 179700,
      "wb_services_breakdown": { "promotion": 70267, "jam": 22990, "other": 86443 },
      "revenue_net": 1338679.21,
      "cogs_total": 447152,
      "profit": 891527.21,
      "margin_pct": 66.6,
      "qty": 2293,
      "acquiring_fee": 55330.78,
      "loyalty_compensation": 1107.75,
      "other_adjustments": 179700.01,
      "commission": 56020.02,
      "commission_other": 179700,
      "total_expenses": 396916.52,
      "operating_profit": 494610.69,
      "operating_margin_pct": 36.95
    }
  }
}
```

**Confirmation**:
- ✅ `commission_other: 179700` present at `summary.totals` (the `CabinetSummaryTotals` type's location).
- ✅ Empirically distinct from `commission: 56020.02` (delta 123679.98) — proves Story 107.1's fix (extracting WB.Promotion + Dzham costs from `corrections.bonus_type_name` instead of aliasing `commission`) is shipped + working.
- ✅ Matches `wb_services_cost: 179700` exactly (it's the same set of costs aggregated). This is intentional per `#169 § 2.3` ("`commission_other` is supplemental — do NOT double-count against `total_commission_rub`").
- ✅ `wb_services_breakdown` reveals the components: `promotion: 70267 + jam: 22990 + other: 86443 = 179700`.

### Boundary Normalizer Pattern decision

`useCabinetSummary` hook is a **pure pass-through** (`return apiClient.get<CabinetSummaryResponse>(...)` — no field renaming, no shape coercion, no nullability collapse). Per CLAUDE.md `### Boundary Normalizer Pattern`, the **structural-identity exception** applies: backend response shape == frontend type shape verbatim, so no normalizer is required.

This is the same exception class as Story 96.1's `getPreliminaryTax` ("Backend returns `{ tax: TaxMetrics | null }`. API client types it as `PreliminaryTaxResponse = { tax: TaxMetrics | null }` — exact match. No casing migration needed (already snake_case both sides). No nullability collapse"). Documented exception, NOT pattern violation.

### Story 96.8 consumer prep

When Story 96.8 is implemented, it will:
1. Read `data.summary.totals.commission_other` from `useCabinetSummary` response.
2. Render it as a P&L row labeled "Доп. сервисы WB" (or equivalent — final UX-confirmed label).
3. Avoid double-counting against `total_commission_rub` per `#169 § 2.3`.

Story 96.5 unblocks this work by providing the typed field. No further interface changes needed in 96.8 for this specific consumption.

### References

- Backend canonical contract: `request-backend/173-BACKEND-RESPONSE-FE-VALIDATION-EPICS-101-109.md` § I1 (commission_other in cabinet-summary).
- Story 107.1 backend fix: `request-backend/170-RESPONSE-EPICS-101-106-CLARIFICATIONS.md` (extracts WB.Promotion + Dzham via bonus_type_name matching).
- Pattern 4 origin: CLAUDE.md `### Multi-Source Orchestration` § Pattern 4.
- Lessons-line: CLAUDE.md "Story Change Log Lessons (Story 94.4-FE)".
- Empirical state at handoff (2026-05-08):
  - `src/types/analytics.ts:62-95` (CabinetSummaryTotals — G-1 target; commission_other missing)
  - `src/types/finance-summary.ts:52` (FinanceSummary — confirmed NO commission_other; vacuous "migration")
  - `src/hooks/sku-financials-types.ts:44` (BackendVisibility — orthogonal scope)
  - `src/hooks/useCabinetSummary.ts` (pure pass-through hook — likely structural-identity exception)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) via direct execution lane.

### Debug Log References

- Type-check: `npx tsc --noEmit` → 20 errors all in `src/lib/api/advertising-analytics-api.ts` (baseline). No new errors after type addition.
- ESLint: clean on `src/types/analytics.ts`.
- Full vitest: `npm test -- --run` → 7019 passed, 0 failed (matches Story 96.3 floor; no new tests added — type-only addition).
- check:docs: `bash scripts/check-doc-citations.sh` → 13/13 baseline match.
- Curl: `GET /v1/analytics/weekly/cabinet-summary?weeks=4` → HTTP 200 with `commission_other: 179700` at `summary.totals`.

### Completion Notes List

- **G-1 type addition**: `commission_other?: number | null` added to `CabinetSummaryTotals` interface at `src/types/analytics.ts` with full JSDoc (10 lines) citing `#173 § I1`, Story 107.1 backend fix, Story 96.5-FE provenance, downstream Story 96.8 consumer, AND empirical distinct-from-`commission` example.
- **G-2 curl verification**: empirical confirmation that backend returns `commission_other` as expected. Captured response top in Dev Notes § Backend response capture.
- **G-3 documented**: Story 96.8 will be the first consumer; no further interface changes needed in 96.8 for this consumption.
- **G-4 Boundary Normalizer Pattern decision**: structural-identity exception applies (`useCabinetSummary` pure pass-through; same exception class as Story 96.1's `getPreliminaryTax`). No normalizer or test added.
- **2nd genuine net-new story in Epic 96-FE** (alongside 96.3); 4 of 5 stories so far were Pattern 4 reframes. Pattern 4 grep correctly distinguished "vacuous source-migration" from "genuine type-infrastructure prep".
- **Test count UNCHANGED at 7019**: type-only addition; Boundary Normalizer Pattern structural-identity exception means no new test required.

### File List

- **Modified** `src/types/analytics.ts` — added `commission_other?: number | null` field to `CabinetSummaryTotals` interface (lines 88-97 of post-edit file) with full JSDoc.
- **Modified** `_bmad-output/planning-artifacts/epics-96-fe.md` — Story 96.5 entry rewritten with reframe block + 7 ACs.
- **Modified** `_bmad-output/implementation-artifacts/96-5-fe-commission-other-source-migration-cabinet-summary.md` (this story file).
- **Modified** `_bmad-output/implementation-artifacts/sprint-status.yaml` — `96-5-fe-commission-other-source-migration-cabinet-summary` status flow.
- **NOT modified** `CLAUDE.md` — no test count change (type-only addition; structural-identity exception means no new tests needed).

### Post-4th-pass-review fixes (2026-05-08) — externally-invoked code-review

User invoked `/bmad:bmm:workflows:code-review 96.5` after dev-story completion (per Story 96.3+96.4 4th-pass empirical vindication recommending fresh-context review).

**Findings + remediations**:

**🟢 Q-1 (verified ✅, no fix needed): optional `?:` vs nullable `: number | null` choice for new field**

Initial adversarial concern: Story 96.4 explicitly tightened from `?: number` to `: number | null` (REQUIRED nullable). Did Story 96.5 follow that lesson? I added `commission_other?: number | null` (BOTH optional AND nullable) — superficially the same anti-pattern.

Verified by reading the surrounding `CabinetSummaryTotals` interface: ALL 8+ Epic 26 operating-expense fields use `?: number | null` pattern (`acquiring_fee?:`, `loyalty_fee?:`, `loyalty_compensation?:`, `other_adjustments?:`, `commission?:`, `total_expenses?:`, `operating_profit?:`, `operating_margin_pct?:`). My choice is **consistent with the established interface convention**. Different from Story 96.4 because that interface (`CostsPct`/`CostsRub`) had all-required fields except `delivery_to_warehouse`; cabinet-summary's Epic 26 expense slice is intentionally all-optional (backend may not always send these for older periods or different cabinet states). **No tightening warranted; consistency with neighbors wins**.

**🟡 R-1 (RESOLVED — drive-by fix): stale JSDoc path comment at `analytics.ts:177`**

Adversarial 4th-pass scan found pre-existing JSDoc at line 177 said `GET /v1/analytics/cabinet-summary` (without `weekly/` prefix). The actual path used by `useCabinetSummary.ts` is `/v1/analytics/weekly/cabinet-summary` (verified via my own AC-2 curl test in this story).

**This is the same drift class Story 96.2 caught in backend coordination** (#169 §2.3 path drift; #173 R2 backend correction confirmed `weekly/` prefix is canonical). Pre-existing tech debt but immediately adjacent to my new `commission_other` field — readers will land on this section to read the new JSDoc and see the stale path.

**Drive-by fix applied**: corrected `GET /v1/analytics/cabinet-summary` → `GET /v1/analytics/weekly/cabinet-summary` + added explanatory note citing #173 + Story 96.5-FE provenance.

**🟢 R-2 (verified ✅, no fix needed)**: `CabinetSummaryPeriod` interface (line 169) is just period METADATA (start/end/weeks_count), NOT per-period totals. The response shape is `summary.totals: CabinetSummaryTotals` (singular) + `summary.period: CabinetSummaryPeriod` (metadata). NO `periods[]` array. Confirmed via curl: top-level keys are `['summary', 'top_products', 'top_brands', 'meta']`; `summary.totals` is the only place `commission_other` belongs. ✅

**🟢 R-3 (verified ✅, no fix needed)**: `useCabinetSummary` hook (read full file at adversarial probe) is genuinely pure pass-through — `return apiClient.get<CabinetSummaryResponse>(...)`. No normalization layer; structural-identity exception holds (per Story 96.1 precedent). ✅

**🟢 R-4 (verified ✅, no fix needed)**: grep for `commission_other` consumers across `src/` returns only `sku-financials-types.ts:44` (orthogonal scope, BackendVisibility per-SKU). No cabinet-level consumers exist; my "ZERO consumers" assertion holds. ✅

**🟢 R-5 (verified ✅, no fix needed)**: JSDoc empirical example with specific numbers (`commission: 56020.02 vs commission_other: 179700`) is illustrative for future readers. Per Story 96.2 D-3 historical-snapshot precedent, specific values in JSDoc are acceptable when clearly framed as examples. The "per backend response 2026-W15..W19" framing makes this clear. ✅

**Verifications run** (after R-1 drive-by fix):
- `npx tsc --noEmit`: 20 errors all in `advertising-analytics-api.ts` (baseline). ✅
- `bash scripts/check-doc-citations.sh`: 13/13 baseline match. ✅

**Outcome**: 1 MEDIUM drive-by fix applied (R-1 stale JSDoc path). 4 verifications all clean. Q-1 surfaced a real adversarial concern but resolved via convention-consistency analysis. **Implementation passes 4th-pass review.**

**Story 94.3-FE 2-pass discipline empirically validated 3rd time in Epic 96-FE** (96.3 G-1 fixture pollution; 96.4 P-1 anti-pattern + P-2 stale name; **96.5 R-1 stale JSDoc + Q-1 false-alarm-resolved**). Fresh-context review consistently surfaces something the same-context 3-pass missed — even if "something" is sometimes a verified non-issue (Q-1) rather than a fixable defect, the adversarial scrutiny itself is load-bearing.

### Post-5th-pass-review fixes (2026-05-08) — extended scrutiny per "fix all issues even minors" mandate

User invoked another adversarial pass via "fix all issues even minors" message after 4th-pass closure.

**Findings + remediations**:

**🟡 S-1 (RESOLVED): JSDoc CLAUDE.md "Comment Policy" violations**

Per CLAUDE.md "Comment Policy":
> "Don't reference the current task, fix, or callers ('used by X', 'added for the Y flow'), since those belong in the PR description and rot as the codebase evolves."

My JSDoc additions had 3 such rot-prone references:
1. `commission_other` JSDoc: `Story 96.5-FE adds the type; Story 96.8-FE will be first consumer (P&L "Доп. сервисы WB" row restoration). Empirically distinct from \`commission\`: e.g. \`commission: 56020.02\` vs \`commission_other: 179700\` per backend response 2026-W15..W19.`
2. `CabinetSummaryResponse` JSDoc (R-1 drive-by fix): `Note: path includes \`weekly/\` prefix per backend canonical contract (request-backend/173 § Quick Reference; corrected via #169 R2 path drift fix). \`useCabinetSummary\` uses the correct path; this JSDoc was stale. Path drive-by fix in Story 96.5-FE 4th-pass review.`

**Trimmed to load-bearing constraints + load-bearing references**:
- `commission_other` JSDoc now: explains the WHY (extraction from corrections.bonus_type_name distinct from `weekly_margin_fact`), cites primary source (`request-backend/173 § I1`), notes hidden constraint (do-not-double-count), preserves nullability semantics. Removed: story-number metadata + specific empirical example (rots).
- `CabinetSummaryResponse` JSDoc now: states canonical endpoint with citation to backend canonical contract. Removed: drive-by-meta and self-referential commentary.

**🟢 S-2 (verified ✅, no fix needed)**: trimmed JSDoc still grep-discoverable for someone wanting Story 107.1 context — the `request-backend/173 § I1` citation IS the primary cross-reference; Story 107.1 is documented in `request-backend/170-RESPONSE-EPICS-101-106-CLARIFICATIONS.md` and #173 itself, so chasing the trail still works without explicit Story 107.1 mention in the type JSDoc. Load-bearing reference preserved at one hop. ✅

**🟢 S-3 (verified ✅, no fix needed)**: empirical example (`56020.02` vs `179700`) now lives only in story Dev Notes § Backend response capture (where it's clearly framed as a 2026-05-08 snapshot), NOT in JSDoc (where it would be timeless documentation that drifts). Right separation of concerns: JSDoc states the invariant; story file captures the empirical evidence. ✅

**Verifications run** (after S-1 trim):
- `npx tsc --noEmit`: 20 errors all in `advertising-analytics-api.ts` (baseline). ✅
- `bash scripts/check-doc-citations.sh`: 13/13 baseline match. ✅

**Outcome**: 1 LOW Comment-Policy violation fixed (S-1). 2 minor checks verified ✅.

**Reflection on Lessons**: this is the 4th adversarial pass on a SINGLE story (1st structural / 2nd narrative / 3rd extended / 4th fresh-context-via-code-review / **5th post-fresh-context "fix all minors"**). At pass 4 + 5, findings are diminishing-returns minor (a JSDoc trim, no production behavior change). But the precedent shows that EVERY pass that's actually genuinely adversarial finds at least one minor issue. The marginal value is real but small; the MAJORITY of value came from passes 1-4.

**Recommendation for Epic 96-FE retrospective**: codify "4-pass minimum (1st structural + 2nd narrative + 3rd extended + 4th fresh-context-via-code-review)" as the Epic 96-FE empirically-justified standard. 5th-pass returns are diminishing.

**All 5 passes complete**. Story 96.5 cleanly through 5-pass adversarial cycle.

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:dev-story 96.5` (combined create+dev). Pattern 4 spec-grep at handoff revealed: source-migration scope is VACUOUSLY satisfied (no consumers); real gap is MISSING-FROM-FRONTEND-TYPE. **2nd genuine net-new story in Epic 96-FE** (alongside 96.3). Status: backlog → in-progress. |
| 2026-05-08 | Implementation complete. `commission_other?: number | null` added to `CabinetSummaryTotals` with full JSDoc; empirical curl confirmed `commission: 56020.02` vs `commission_other: 179700` distinct values per #173 § I1 + Story 107.1. Boundary Normalizer Pattern structural-identity exception documented (no normalizer/test required for pure pass-through). All 4 gates green at baselines (test count unchanged 7019). Status: in-progress → review. |
| 2026-05-08 | **4th-pass externally-invoked code-review** (`/bmad:bmm:workflows:code-review 96.5` by user) found 1 MEDIUM drive-by (R-1 stale JSDoc at `analytics.ts:177` `GET /v1/analytics/cabinet-summary` → `GET /v1/analytics/weekly/cabinet-summary`; same drift class as Story 96.2 backend coordination R2 finding) + 1 verified-non-issue Q-1 (optional `?:` choice consistent with surrounding interface convention; not the same drift class as Story 96.4 `delivery_to_warehouse`). 4 minor checks verified ✅. Story 94.3-FE empirical vindication holds for 3rd time in Epic 96-FE. Status: review → done. |
| 2026-05-08 | **5th-pass extended scrutiny** ("fix all issues even minors") found 1 LOW Comment-Policy violation (S-1: JSDoc had 3 rot-prone story-number references — current task / forward caller / drive-by metadata — per CLAUDE.md "Comment Policy"). Trimmed to load-bearing constraint references only (`request-backend/173 § I1`, do-not-double-count, nullability). Status: unchanged at done. **Lessons:** (1) 2nd genuine net-new in Epic 96-FE (alongside 96.3) — vs 4 reframes; Pattern 4 grep distinguishes "vacuous source-migration" from "never-typed". (2) Optional `?:` vs nullable `:` choice depends on INTERFACE CONVENTION — Epic 26 fields in CabinetSummaryTotals are all `?:` intentionally; neighbors' patterns are signal. (3) JSDoc rot-prone metadata (story numbers / fix references) belongs in PR description / story file, NOT in type JSDoc per CLAUDE.md Comment Policy; load-bearing cross-references (backend ticket #s, hidden constraints) belong in the JSDoc. |
