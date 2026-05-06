# Frontend Clarifications: Backend Update #169 (Epics 101-106)

**Date**: 2026-05-03
**Type**: CLARIFICATION REQUEST (frontend → backend; questions blocking Epic 96-FE planning)
**Source**: Backend update report `docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md` (2026-05-03)
**Frontend Tracking Story**: TBD (Epic 96-FE not yet seeded)

---

## Context

Frontend team received `#169 Backend Update Report` covering Epics 101-106 (18 endpoints + 8 fields + 4 bug fixes + 2 pipelines + backfill confirmation). Before initiating Epic 96-FE integration work, we have **8 clarification questions** that block design decisions for specific stories.

**Recommended workflow**: Backend answers Q1 → Q8 inline (reply in this file or as separate `170-RESPONSE.md`). Frontend team initiates Epic 96-FE planning once critical questions (Q1, Q3, Q4, Q6, Q7) are answered.

---

## Q1 — Acquiring API: Relationship to Existing Frontend Epic 90-FE

**Background**: Frontend Epic 90-FE (Acquiring Cost Reports UI) shipped 2026-04-19 with full integration of acquiring endpoints under path **`/v1/acquiring/*`** (3 endpoints). Stories 90.1-90.5 closed. Backend's #166 ticket was marked closed.

Backend's #169 § 1.1 now lists **3 endpoints under different path** `/v1/analytics/acquiring/reports*`:
- `GET /v1/analytics/acquiring/reports?from=&to=`
- `GET /v1/analytics/acquiring/reports/:id/detail`
- `GET /v1/analytics/acquiring/detail?from=&to=`

**Question**: Are these:
- **(a) Renamed/migrated** versions of the Epic 90 endpoints (`/v1/acquiring/*` → `/v1/analytics/acquiring/*`)? If yes, when does the old path deprecate? Migration plan?
- **(b) New endpoints** existing alongside the Epic 90 ones (different feature)? If yes, what differentiates them — different data source, different aggregation, different consumer use case?

**Impact**: Either FE migrates existing hooks (Story 90.X-shipped code) OR adds parallel hooks. Critical for Cluster 1 of Epic 96-FE planning.

---

## Q2 — `acquiring_total` Field: Consistency With Acquiring Reports

**Background**: #169 § 2.1 adds `acquiring_total` to `GET /v1/analytics/weekly/finance-summary`. #169 § 1.1 provides per-report detail at `/v1/analytics/acquiring/reports*`.

Both surfaces describe the same underlying domain (acquiring cost) at different granularities — weekly summary vs per-report detail.

**Question**: For a given date range `[from, to]`:
- Should `summary.acquiring_total` (from finance-summary endpoint) **equal** the sum of `report.cost` over `/v1/analytics/acquiring/reports?from=X&to=Y`?
- If consistency is guaranteed: backend confirms this in tests / DTOs?
- If discrepancies are possible: what are the acceptable thresholds + reasons (e.g., timing of WB API ingestion, separate source tables)?

**Impact**: Determines whether FE can cross-validate at display time (Story 96.2 acquiring P&L slice). Per CLAUDE.md Defensive Frontend Principle, mismatches should surface as anomaly indicators rather than silent display.

---

## Q3 — `retail_price_total` Funnel Semantics + WB Discount Surfacing

**Background**: #169 § 2.2 says the new field enables the funnel: `retail_price_total → sales_gross → wb_sales_gross → net_payout`.

**Question**:
- **Q3.1**: What's the formula relating `retail_price_total` and `sales_gross`? Is it: `sales_gross = retail_price_total - WB_discount_total`?
- **Q3.2**: If yes — does backend return `WB_discount_total` (or equivalent) **as a separate field** so FE can render the funnel transition step explicitly? Or must FE compute it as a delta (`retail_price_total - sales_gross`)?
- **Q3.3**: For `summary_eaeu` does `retail_price_total` exist (or only RUS)? `summary_total.retail_price_total_combined` is mentioned, but `summary_rus` is the only sub-section shown. Confirm `summary_eaeu.retail_price_total` schema.

**Impact**: P&L waterfall in `PnLWaterfall.tsx` (Story 96.3) needs explicit transition steps. Computing deltas is acceptable but increases drift risk when WB discount methodology changes.

---

## Q4 — `commission_other` Backfill Window for Historical Periods

**Background**: #169 § 2.3 introduces `commission_other` (~872K = WB.Promotion ~800K + Дзям ~72K) "previously hidden in `corrections`."

Frontend has historical period coverage from W01-W17 (Jan-Apr 2026) where the old `corrections` field carried this data.

**Question**:
- **Q4.1**: For pre-Epic-104 historical periods (e.g., W01-W17), does `commission_other` populate retroactively, or is it **null** for old periods?
- **Q4.2**: If null for historical: does `corrections` field still retain the legacy data, or has it been **moved** (zeroed out)?
- **Q4.3**: What's the recommended FE strategy for historical periods?
  - **Option A**: Dual-lookup (`commission_other ?? corrections.dop_servisy_wb`) per CLAUDE.md Boundary Normalizer pattern
  - **Option B**: Dual-display (show both fields when both populated)
  - **Option C**: Backend has migrated `corrections` → `commission_other` for ALL historical periods, so FE can rely on `commission_other` alone

**Impact**: Story 96.4 ("Restore Доп. сервисы WB row in PnLWaterfall") design depends on this. Currently `PnLWaterfall.tsx` has the row commented out with `// PENDING BACKEND` marker; this story closes that gap.

---

## Q5 — `latest_fcu` / `latest_dcu` Selector Semantics

**Background**: #169 § 2.4 adds `latest_fcu` and `latest_dcu` to `unit-economics` response. "Latest" needs precise definition.

**Question**:
- **Q5.1**: "Latest" selector for shipments — is it:
  - **Option A**: `MAX(shipment.confirmed_at)` (latest by confirmed timestamp)
  - **Option B**: `MAX(shipment.id)` (latest by primary key — typically same but not guaranteed)
  - **Option C**: Some other "latest event" definition (e.g., latest delivered shipment, latest paid shipment)
- **Q5.2**: For SKUs **without confirmed shipments**:
  - Returns `null`?
  - Or fallback to historical average / median?
- **Q5.3**: Period-affected: does `latest_fcu/dcu` ignore the request's `from/to` date range (always "latest ever")? Or scoped to the requested range?

**Impact**: Story 96.6 ("Wire latest_fcu + latest_dcu into UnitEconomicsTable") display strategy differs significantly between "all-time latest" vs "range-scoped latest." Affects e.g., comparison vs older period if user filters historical week.

---

## Q6 — FBS Analytics REST API: Wiring vs Migration

**Background**: Frontend already has FBS-related hooks (e.g., `useFbsAnalyticsByGroup`, `useFbsAnalyticsBySize`, etc. — Epic 57-FE / 77-FE shipped them). Backend's #112 retro previously claimed "endpoints existed all along; gap was documentation."

Backend's #169 § 1.2 now lists 7 NEW endpoints under `/v1/analytics/fbs/stock/*` + `/v1/analytics/fbs/enhanced`. This conflicts with the #112 framing.

**Question**:
- **Q6.1**: Are these 7 endpoints genuinely NEW (not present in any form before Epic 105), or are they renamed/refactored versions of pre-existing endpoints that frontend already consumes?
- **Q6.2**: If existing FE hooks are consuming OTHER endpoints currently — are those endpoints deprecated? When?
- **Q6.3**: Quick reference: what is the mapping (if any) between FE hook → old endpoint → new endpoint?

**Impact**: Cluster 4 (Stories 96.7 + 96.8 + 96.9) is significantly different work depending on whether this is "wire new endpoints to existing UI" vs "migrate hooks + verify nothing breaks."

---

## Q7 — Test Seeding Endpoints: Security Gating

**Background**: #169 § 1.4 introduces `POST /v1/test/seed/dbw-order` and `DELETE /v1/test/seed/dbw-order/:orderId`. "Only available when `NODE_ENV=development`."

Frontend wants to wire these into E2E test fixtures (Story 96.15). Before that, security review is needed.

**Question**:
- **Q7.1**: How is the `NODE_ENV=development` check enforced?
  - **Option A**: Hardcoded conditional registration in module imports (endpoints don't exist at all in production builds)
  - **Option B**: Runtime env-check on each request (endpoints exist but return 403/404 in non-dev)
  - **Option C**: Build-time conditional compilation (e.g., webpack DefinePlugin / NestJS module guard)
- **Q7.2**: What happens if `NODE_ENV` is accidentally set to `development` in production env? Is there a SECONDARY guard (API key, IP allowlist, tenant flag)?
- **Q7.3**: Auth: do these endpoints require JWT + CabinetGuard like the rest, or are they open to any authenticated user during development?

**Impact**: Story 96.15 (E2E fixture wiring) blocked until security model confirmed. Critical for production safety.

---

## Q8 — Open Items Priority + ETA

**Background**: #169 § 5 lists 5 open requests not yet implemented:
- `#148` Fulfillment returns count = 0 (MEDIUM)
- `#157` Daily finance breakdown endpoint (HIGH)
- `#159` Preliminary tax (LOW)
- `#165` Orders price/salePrice inversion (MEDIUM)
- `#150` Monitoring false alarms (LOW)

**Question**:
- **Q8.1**: For `#157` (HIGH priority) — is there an ETA? Frontend has a known gap: `useDailyMetrics` currently returns hardcoded `[]` for daily finance because no backend daily-finance endpoint exists (Story 87.2-FE workaround). Knowing ETA helps decide whether to wait or build interim solution.
- **Q8.2**: For `#148` — does backend have a root cause hypothesis for "fulfillment returns count always 0", or does this need fresh investigation?
- **Q8.3**: For `#150` (monitoring false alarms) — which 3/4 pipelines are showing false `critical`/`no_data`? Is this related to the 2 NEW pipelines from § 4 (`fbo_return_classification_sync` + `buyout_reconciliation_sync`), or separate from the new pipelines?

**Impact**: ETA on #157 gates Story 96.X (TBD) for daily finance integration. Other questions help frontend reflect current state to users accurately.

---

## Recommended Response Format

Backend can reply by either:
- **Option A**: Replying inline in this file under each question (preferred — keeps everything in one artifact for grep-ability).
- **Option B**: Creating `docs/request-backend/170-RESPONSE-EPICS-101-106-CLARIFICATIONS.md` mirroring the Q1 → Q8 structure with answers.

**Priority for answers** (sequenced by FE blocking impact):
1. **CRITICAL (block Epic 96-FE planning)**: Q1 (acquiring path migration), Q3 (retail_price_total funnel formula), Q6 (FBS endpoints relationship)
2. **HIGH (block specific stories)**: Q4 (commission_other backfill), Q7 (test-seed security)
3. **MEDIUM (design refinement)**: Q2 (acquiring consistency), Q5 (latest_fcu/dcu selector)
4. **LOW (informational)**: Q8 (ETAs)

Once Q1 + Q3 + Q6 are answered, frontend will draft `_bmad-output/planning-artifacts/epics-96-fe.md` and bootstrap sprint-planning. Open questions (Q2, Q4, Q5, Q7, Q8) can be answered in parallel — stories blocked on them will be marked BLOCKED-PENDING in the epic spec.

---

## References

- Backend update report: `docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md`
- Frontend Epic 90-FE (Acquiring): `_bmad-output/planning-artifacts/epics-90-fe.md` (closed 2026-04-19)
- Frontend Epic 92-FE (Monitor Dashboard): `_bmad-output/planning-artifacts/epics-92-fe.md` (closed 2026-04-24)
- CLAUDE.md § Defensive Frontend Principle (relevant for Q2 — anomaly indicators not silent transforms)
- CLAUDE.md § Boundary Normalizer Pattern (relevant for Q4 — dual-lookup for commission_other ↔ corrections)
- Frontend Epic 87-FE Story 87.2: `useDailyMetrics` hardcoded `[]` workaround (relevant for Q8.1 ETA on #157)
