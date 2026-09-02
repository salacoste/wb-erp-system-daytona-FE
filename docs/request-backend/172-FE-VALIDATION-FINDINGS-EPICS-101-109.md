# Frontend Validation Findings: Backend Reports #169 + #170 (Epics 101-109)

**Date**: 2026-05-06
**Type**: VALIDATION REPORT (frontend → backend; empirical findings from curl-based verification)
**Source**: Backend reports `docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md` + `docs/request-backend/170-RESPONSE-EPICS-101-106-CLARIFICATIONS.md` + `docs/request-backend/170-BACKEND-UPDATE-EPICS-107-109.md`
**Filename collision flag**: this doc is **#172** because #170 is already used by 3 separate files and #171 by price-calculator. Future requests should `ls docs/request-backend/ | sort -t- -k1 -n -r | head -1` before assigning numbers.

---

## Why this doc

Frontend team validated all empirically-checkable claims from backend reports #169 + #170 against the running backend (build_timestamp `2026-05-06T00:53:40.749Z`, env `development`). Per CLAUDE.md doc-grep-verification rules + Story 95.3-FE mtime-vs-git-canonical lesson, "trust but verify" applies — empirical curl evidence is canonical, documentation is reviewable.

**Methodology** (reproducible by backend):

```bash
# Auth setup
TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"<E2E_TEST_PASSWORD>"}' | jq -r '.access_token // .data.access_token')
CABINET="f75836f7-c0bc-4b2c-823c-a1f3508cce8e"

# Each finding below is reproducible via the cited curl command.
```

---

## 🚨 Falsifications (5 — backend documentation contradicts actual API)

### F1 — `cabinet-summary` documented at wrong path

---

## Backend Team Response

**Status**: RESOLVED (validation report)
**Resolution date**: 2026-05-06
**Summary**: Frontend empirical validation of backend reports #169 + #170. Found 5 falsifications where documentation contradicted actual API responses. All 5 confirmed by backend in #173. Documentation in #170 corrected. Key findings: tax preliminary response wrapped in `tax` object with snake_case, `cabinet-summary` path corrected, FBS REST endpoints verified.
**Remaining frontend action**: Use corrected documentation from #173 for integration work.
**Backend claim** (#169 §2.3): *"Endpoint: `GET /v1/analytics/cabinet-summary`"*

**Empirical reality**:
```bash
curl -s "http://localhost:3000/v1/analytics/cabinet-summary?week=2026-W17" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET"
# → 404 NOT_FOUND: "Cannot GET /v1/analytics/cabinet-summary?week=2026-W17"
```

Swagger inspection (`/api-json`) confirms actual path: **`/v1/analytics/weekly/cabinet-summary`** (with `weekly/` prefix).

**Action requested**: correct #169 §2.3 + 170-RESPONSE Q4 path references. Confirm correct path is canonical.

---

### F2 — tax/preliminary RESPONSE SHAPE differs significantly from documented shape

**Backend claim** (#170 §2):
```json
{
  "from": "2026-05-05",
  "to": "2026-05-11",
  "taxSystem": "usn_income",
  "taxRate": 6,
  "vatPayer": false,
  "totalRevenue": 150000.50,
  "deductibleExpenses": null,
  "taxBase": 150000.50,
  "preliminaryTax": 9000.03,
  "vat": null,
  "weekStatus": "incomplete",
  "calculatedAt": "2026-05-06T00:30:00Z"
}
```

**Empirical reality**:
```bash
curl -s "http://localhost:3000/v1/analytics/tax/preliminary?from=2026-05-05&to=2026-05-11" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET"
```

Returns:
```json
{
  "tax": {
    "tax_amount": 4560.32,
    "tax_base": 76005.3,
    "effective_tax_rate": 6,
    "tax_system": "usn6",
    "is_minimum_rule": false,
    "net_profit_after_tax": null,
    "vat_payer": true,
    "vat_rate": 5,
    "vat_output": 3800.26,
    "vat_payable": 3800.26,
    "revenue_excl_vat": 76005.3,
    "net_profit_after_all_tax": 69055.98,
    "preliminary": true,
    "data_completeness": { "revenueSource": "fulfillment", "hasLogistics": false, "hasStorage": true, ... }
  }
}
```

**Differences**:
- Wrapped in `{ "tax": {...} }` (not flat)
- snake_case (`tax_system`, `vat_payer`) not camelCase (`taxSystem`, `vatPayer`)
- Field renames: `preliminaryTax` → `tax_amount`; `taxRate` → `effective_tax_rate`
- Different value semantics: `tax_system` returned as `"usn6"` not `"usn_income"`
- Missing fields documented: `from`, `to`, `totalRevenue`, `deductibleExpenses`, `vat`, `weekStatus`, `calculatedAt`
- Extra fields not documented: `vat_output`, `vat_payable`, `revenue_excl_vat`, `net_profit_after_all_tax`, `is_minimum_rule`, `net_profit_after_tax`, `data_completeness`

**Action requested**: confirm canonical contract. Either #170 §2 documentation needs updating to match actual response, OR the API was supposed to ship the documented shape and the implementation drifted. **Frontend `tax-analytics.ts` types must match canonical contract — please clarify before Story 96.1 proceeds.**

---

### F3 — `viewBy` query parameter rejected; actual is `view_by` (snake_case)

**Backend claim** (170-RESPONSE Q5 — final note): *"When `viewBy` is `'brand'`, `'category'`, or `'total'` (not `'sku'`), both fields are hardcoded to `null`. Only SKU-level views carry values."*

**Empirical reality**:
```bash
curl -s "http://localhost:3000/v1/analytics/unit-economics?week=2026-W17&viewBy=sku" ...
# → 400: "property viewBy should not exist"

curl -s "http://localhost:3000/v1/analytics/unit-economics?week=2026-W17&view_by=sku" ...
# → 200 OK
```

The endpoint accepts `view_by` (snake_case), not `viewBy`. Documentation should reflect this.

**Action requested**: either fix the endpoint to accept `viewBy` (camelCase, JS-conventional) OR fix the documentation to say `view_by`. Frontend strongly prefers camelCase for query params (matches `lib/api-client.ts` convention).

---

### F4 — `cost_category_order` field NOT in unit-economics response

**Backend claim** (#169 §2.4):
> Updated waterfall ordering (`cost_category_order`):
> ```
> cogs -> delivery_to_warehouse -> commission -> logistics_delivery -> logistics_return
> -> storage -> paid_acceptance -> penalties -> other_deductions -> advertising
> ```

**Empirical reality**:
```bash
curl -s "http://localhost:3000/v1/analytics/unit-economics?week=2026-W17" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET" | jq '.data[0] | keys'
```

Returns:
```json
["brand", "category", "costs_pct", "costs_rub", "latest_dcu", "latest_fcu",
 "missing_cogs", "net_margin_pct", "net_profit", "product_name",
 "profitability_status", "quantity_sold", "revenue", "sku_id", "total_costs_pct"]
```

**`cost_category_order` is NOT in the item shape.**

**Action requested**: was `cost_category_order` meant to be a top-level response metadata field (alongside items array)? Or is it an internal backend ordering hint that wasn't intended to be in the contract? If frontend should hardcode the order, backend should document it as such. If it's supposed to be in the response — please add.

---

### F5 — `delivery_to_warehouse` is NESTED in `costs_rub`, not top-level

**Backend claim** (#169 §2.4):
> | Field | Type | Description |
> |-------|------|-------------|
> | `delivery_to_warehouse` | `number \| null` | 10th cost category — actual delivery-to-warehouse cost |
> | `latest_fcu` | `number \| null` | Final Cost per Unit from latest confirmed shipment |
> | `latest_dcu` | `number \| null` | Delivery Cost per Unit from latest confirmed shipment |

The table format implies all three are top-level fields.

**Empirical reality**:
```bash
curl -s "http://localhost:3000/v1/analytics/unit-economics?week=2026-W17" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET" | jq '.data[0].costs_rub | keys'
```

Returns:
```json
["advertising", "cogs", "commission", "delivery_to_warehouse",
 "logistics_delivery", "logistics_return", "other_deductions",
 "paid_acceptance", "penalties", "storage"]
```

`delivery_to_warehouse` is NESTED inside `costs_rub`, alongside the other 9 cost categories. `latest_fcu` + `latest_dcu` ARE at top level (verified separately).

**Action requested**: confirm the canonical structure — is `delivery_to_warehouse` permanently nested in `costs_rub` (consistent with other cost categories — preferred), or was top-level placement intended? Frontend integration (Story 96.9) needs to know whether `item.costs_rub.delivery_to_warehouse` or `item.delivery_to_warehouse` is the long-term contract. **Recommended**: keep nested in `costs_rub` (consistent shape) and update #169 §2.4 documentation to reflect this — frontend can adapt.

---

## ⚠️ Inconclusive findings (4 — need clarification or populated test data)

### I1 — Q4 commission_other alias-bug fix (Story 107.1) status unverifiable

**Background**: 170-RESPONSE Q4 admitted `commission_other` was a semantic alias of `commission` (NOT WB.Promotion+Dzham as #169 §2.3 claimed). Backend planned Story 107.1 to fix this. The new #170 update doesn't explicitly mention 107.1's status.

**Validation attempts**:
```bash
# At incorrect documented path:
curl -s "http://localhost:3000/v1/analytics/cabinet-summary?week=2026-W17" ...
# → 404 (path doesn't exist; F1)

# At correct Swagger-documented path:
curl -s "http://localhost:3000/v1/analytics/weekly/cabinet-summary?week=2026-W17" ...
# → 400 BAD_REQUEST: "property week should not exist"

# Tried alternate paths:
curl -s "http://localhost:3000/v1/analytics/weekly/cabinet-expenses?week=2026-W17" ...
# → error response
```

**Question Q-I1**: What is the correct query parameter schema for `/v1/analytics/weekly/cabinet-summary`? Once we can hit it, we can validate whether `commission_other != commission` (Story 107.1 shipped) or `commission_other == commission` (alias bug still present).

Frontend FE-side state: `commission_other` field is referenced in only 1 FE file (`src/hooks/sku-financials-types.ts:44`), so impact is contained — but **Story 96.7 (PnLWaterfall "Доп. сервисы WB" row) cannot proceed until this is verifiable**.

---

### I2 — `acquiring_total` consistency vs report-level sums (Q2 advisory threshold)

**Empirical state**: For W17, `acquiring_total` is `null` in finance-summary; acquiring/reports list returns `[]`. Cannot validate the ≥5% advisory threshold from 170-RESPONSE Q2 with empty data.

**Question Q-I2**: Can backend point frontend to a populated week/cabinet where the reconciliation can be observed? Or seed test data via `/v1/test/seed/dbw-order` (after Q-I4 below)?

---

### I3 — Bug fix #167 errorRate clamp [0, 1] verification

**Empirical state**: Pipeline-grid response shows 17 pipelines but errorRate values are `0` or `null` for all in test env — no positive errorRate to observe the clamp behavior.

**Question Q-I3**: Either (a) clamp is theoretical until test data has errors, OR (b) backend can provide a synthetic test fixture with `errorRate > 1` pre-clamp to demonstrate the fix. Frontend's defensive guard at `MonitorPipelineHealth.tsx:88` can stay regardless (per CLAUDE.md § Defensive Frontend Principle), but verifying the fix is in place would close the loop.

---

### I4 — Test seeding endpoints CabinetGuard fix (Story 107.3) status unverifiable

**Background**: 170-RESPONSE Q7 admitted test-seed endpoints lack `CabinetGuard` (security gap — any authenticated `Owner` can seed for ANY cabinet). Backend planned Story 107.3. New #170 update doesn't explicitly mention status.

**Validation attempts**:
```bash
curl -X POST -s -o /dev/null -w "%{http_code}" "http://localhost:3000/v1/test/seed/dbw-order" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET" \
  -H "Content-Type: application/json" -d '{"count": 1}'
# → 401 (auth-gated; can't differentiate CabinetGuard vs JwtGuard from outside)
```

**Question Q-I4**: Did Story 107.3 ship `CabinetGuard` on `POST/DELETE /v1/test/seed/dbw-order/*`? Frontend Story 96.17 (E2E test seeding fixture wiring) **BLOCKED-PENDING-Q-I4** until confirmed.

Note: the cross-cabinet abuse vector from 170-RESPONSE Q7 is real if `CabinetGuard` is missing — any malicious E2E test or coordinator could seed test orders into another tenant's cabinet.

---

## ✅ Verifications (13 — claims confirmed)

For completeness:

| # | Claim | Evidence |
|---|---|---|
| V1 | `/v1/acquiring/*` (without `analytics`) doesn't exist in FE codebase | `grep -rn "v1/acquiring/" src` — 0 refs (Q1 confirmed; no migration needed) |
| V2 | Acquiring endpoints at `/v1/analytics/acquiring/*` from start | Swagger + FE consumers at this path |
| V3 | All 13 listed endpoints exist (auth-gated) | curl probe — all returned 401 (not 404) |
| V4 | `retail_price_total` field present in finance-summary | Returned `570975.62` for W17 |
| V5 | `retail_price_total_combined` in summary_total | Returned `608574.22` for W17 |
| V6 | `acquiring_total` field exists (3 occurrences: rus/eaeu/total) | finance-summary response (value null in test env) |
| V7 | `acquiring_fee_total` (DB-sourced; Q2 source-of-truth) exists | Returned `16375.71` for W17 |
| V8 | `usePreliminaryTax` + `tax-analytics.ts` exist in FE | grep — `DashboardContent.tsx:97` + `tax-analytics.ts:23` |
| V9 | **Pipeline count = 17** (consolidation claim) | `pipeline-health-grid?cabinetId=...` returned exactly 17 entries |
| V10 | New `returns_sync` pipeline present | enumerated in pipeline list |
| V11 | Obsolete `fbo_return_classification_sync` + `buyout_reconciliation_sync` REMOVED | not in pipeline list |
| V12 | FE FBS hooks consume `/v1/analytics/orders/*` (HistoricalAnalyticsController) | grep — `useFbsTrends/Seasonal/Compare` → `orders-analytics.ts` |
| V13 | `latest_fcu` + `latest_dcu` at top level of unit-economics items | item keys grep — both present (null in test data) |

---

## Recommended response format

Backend can reply by either:
- **Option A**: Inline replies in this file under each F# / Q-I# block (preferred — single artifact for grep-ability).
- **Option B**: Separate `docs/request-backend/172-RESPONSE-VALIDATION-FINDINGS.md` mirroring the structure with corrections.

**Priority for fixes**:
1. **CRITICAL (block FE Epic 96 stories)**: F1 (cabinet-summary path), F2 (tax/preliminary shape — frontend types need to match canonical), I1 (commission_other status)
2. **HIGH (significantly affects FE story design)**: F3 (viewBy vs view_by), F4 (cost_category_order), F5 (delivery_to_warehouse path)
3. **MEDIUM (security/test infrastructure)**: I4 (Story 107.3 CabinetGuard status)
4. **LOW (informational, parallel)**: I2 (populated cabinet for acquiring reconciliation), I3 (errorRate clamp synthetic fixture)

Once F1 + F2 + F3 + F4 + F5 are corrected (either docs OR API) and I1 + I4 confirmed — frontend can proceed with Epic 96-FE planning at high confidence.

---

## References

- Backend update report 1: `docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md`
- Backend Q1-Q8 response: `docs/request-backend/170-RESPONSE-EPICS-101-106-CLARIFICATIONS.md`
- Backend update report 2: `docs/request-backend/170-BACKEND-UPDATE-EPICS-107-109.md`
- Frontend clarification request (origin): `docs/request-backend/170-FE-CLARIFICATIONS-EPICS-101-106.md`
- Backend build verification: `curl http://localhost:3000/v1/meta/version` (build_timestamp `2026-05-06T00:53:40.749Z` at validation time)
- CLAUDE.md § Doc-citation validation (validation methodology)
- CLAUDE.md § Defensive Frontend Principle (relevant for I3 — guards stay regardless)
- Story 95.3-FE Post-1st-pass-review M-1 (mtime-vs-git-canonical lesson — applied to weak-vs-canonical evidence sourcing)
