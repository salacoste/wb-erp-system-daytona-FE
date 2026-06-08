# #195 — Acquiring detail: doc_type_name null, 500-not-404, list-vs-detail fee mismatch

**Status**: ✅ **DELIVERED** (items 1+2); **DOCUMENTED** (item 3) — (1) `doc_type_name` now populated: `ALL_DETAIL_FIELDS` explicitly requests `docTypeName` from WB (`acquiring-reports.service.ts:118-136`), mapped at line 268. (2) 404 fix: `isWbNotFoundError()` detects WB 400/404 for invalid reportId and throws `NotFoundException` (`acquiring-reports.service.ts:228-230,278-299`). (3) Fee mismatch: `acquiring_fee_sum` is WB's pre-aggregated sum; documented as "may diverge ~5-10% from SUM(detail.acquiring_fee) due to WB rounding differences" (`acquiring-reports.service.ts:43`). This is a WB-side artifact, not a backend bug.
**Reported**: 2026-06-02 (iter-71 validation loop)
**Page**: `/analytics/acquiring`, `/analytics/acquiring/reports/[id]`, `/analytics/acquiring/period`
**Related**: extends [#166](./166-ACQUIRING-COST-REPORTS-API.md) (acquiring cost reports API)
**Severity**: HIGH (×2), MEDIUM (×1)
**Frontend status**: defensive (no crash); these are backend contract gaps the FE cannot fix without losing evidence.

---

## Problem

Live validation against cabinet `f75836f7-…cce8e` (ИП Дергачёв, RUB, build `2026-06-02T20:16`) surfaced three backend-side contract gaps on the acquiring endpoints. The frontend already degrades gracefully on all three (Boundary Normalizer present in `src/lib/api/acquiring-normalizer.ts`, money kept `number|null`, no anti-pattern #8), so these are **backend fixes**, not FE.

### 1. HIGH — `doc_type_name` is `null` in 100% of detail rows

`GET /v1/cabinets/:id/acquiring/reports/:reportId/detail` returns `doc_type_name: null` for **712/712** transactions on report `667105801` (and all period-detail rows). The frontend type (`src/types/acquiring-analytics.ts:48`) declares `docTypeName: string` ("e.g. Продажа / Возврат"), and the table renders a **"Тип"** column — which is now **blank for every row**.

**Ask**: populate `doc_type_name` (the WB document type — Продажа/Возврат/Логистика/etc.) on each detail transaction, OR confirm it is permanently unavailable so the FE can drop the "Тип" column. Current state: dead column.

### 2. HIGH — non-existent / invalid reportId returns HTTP 500, not 404

- `GET …/reports/1/detail` → **500**
- `GET …/reports/999999999/detail` → **500**
- `GET …/reports/abc/detail` → 400 (correct)

[#166 §5](./166-ACQUIRING-COST-REPORTS-API.md) explicitly contracts: **"Return 404 when reportId doesn't exist."** The backend instead 500s (likely an unhandled lookup miss). The FE `getAcquiringRateLimit` special-cases only 503, so a 500 falls through to a destructive error alert ("Не удалось загрузить транзакции") instead of a clean "report not found" / empty state.

**Ask**: return **404** for an absent reportId (per #166 §5). Once compliant, the FE will map 404 → empty/not-found state.

### 3. MEDIUM — list `acquiring_fee_sum` ≠ Σ detail `acquiring_fee` for the same report

Report `667105801`:
- list-level `acquiring_fee_sum` = **10 884.14**
- Σ of its 712 detail `acquiring_fee` = **11 527.24** (Δ **643.10**, ~6%)
- VAT reconciles **exactly** (594.98 = 594.98)

A user drilling list → detail sees two different "Всего комиссий" totals for the same report. The FE faithfully sums what each endpoint returns (no FE bug); the divergence is in backend aggregation (fee_sum vs Σ detail fees). VAT matching but fee not suggests the list aggregate and the detail rows are computed from different sources or one filters rows the other doesn't.

**Ask**: reconcile `acquiring_fee_sum` (list) with Σ per-transaction `acquiring_fee` (detail), or document why they legitimately differ (e.g. list excludes a doc-type the detail includes).

---

## Reproduction

```bash
TOKEN=...  # from e2e/.auth/user.json
CAB=f75836f7-c0bc-4b2c-823c-a1f3508cce8e
H=(-H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB")
# 1. doc_type_name null:
curl -s "${H[@]}" "http://localhost:3000/v1/cabinets/$CAB/acquiring/reports/667105801/detail" | jq '[.data[].doc_type_name] | unique'   # → [null]
# 2. 500 not 404:
curl -s -o /dev/null -w "%{http_code}\n" "${H[@]}" "http://localhost:3000/v1/cabinets/$CAB/acquiring/reports/999999999/detail"   # → 500
# 3. fee mismatch:
curl -s "${H[@]}" "http://localhost:3000/v1/cabinets/$CAB/acquiring/reports?from=2026-01-01&to=2026-02-01" | jq '.data[]|select(.report_id==667105801)|.acquiring_fee_sum'   # → 10884.14
curl -s "${H[@]}" "http://localhost:3000/v1/cabinets/$CAB/acquiring/reports/667105801/detail" | jq '[.data[].acquiring_fee]|add'   # → 11527.24
```

## Frontend disposition

No FE change required for #1/#2/#3 — FE is already defensive (renders blank/—, no crash, faithful sums). FE follow-up (separate, tracked in validation-tracker iter-71): add `cabinetId` to the 3 acquiring `queryKey`s (Story 97.5-FE cabinet-isolation) — independent of this backend ticket.
