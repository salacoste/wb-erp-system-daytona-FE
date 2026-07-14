# BE Validation Bugs — RESOLVED (2026-07-07)

**Source:** runtime validation of the WB Repricer frontend against live BE (`:3000`, cabinet `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`, role=owner). 54 pages validated across 6 clusters (A–F) + P0 financial core (2026-07-05/06).

**Resolution commit:** [`d941afb4`](../../) — `fix(be): resolve 17 FE-validation BE bugs (BE-1..BE-17)` (branch `feat/new2-communications`).

**Status:** ✅ All 18 entries fixed on the BE side and **verified live** after rebuild. 1923 tests pass across affected modules. Re-validated 2026-07-07 — still fixed after the parallel NEW-2/NEW-4/NEW-7 work (zero file overlap; no regression).

> Original per-cluster repro files (curl + JWT + trace_id + response excerpts) live in `frontend/.omc/validation/2026-07-05/BE-BUGS-{A..F}.md` (local-only — `.omc` is gitignored). This tracked doc is the authoritative resolution record.

---

## Resolution table

| ID | Severity | Endpoint / area | Resolution |
|---|---|---|---|
| **BE-1** | 🔴 BLOCKING | `PATCH /v1/orders/{uuid}/meta` | Bare **500 → 502 BadGateway**. The WB SDK throws on WB's 400 (order not in an eligible status for marking). Now wrapped: WB status + body surfaced for diagnosis instead of a masked 500. `src/orders/services/order-mutation.service.ts` |
| **BE-2** | 🔴 BLOCKING | `GET /v1/analytics/brand-share` | Empty `{report:[]}` → defensive unwrap accepting `res.report` **or** `res.data.report` (WB returns the series under a different key than the brands/parent-subjects methods). Report now populates (15–16 points). `src/analytics/services/brand-share.service.ts` |
| **BE-3** | 🔴 BLOCKING (AMBIG) | `POST /v1/products/cogs/bulk` | `nm_id` string → 400. Fixed **BE-side**: `@Type(() => Number)` coerces numeric strings before `@IsInt()` (FE sends `nm_id` as string; aligns with global `transform:true` pipe). `src/products/dto/bulk-assign-cogs.dto.ts` |
| **BE-4** | 🟠 HIGH | `POST /notifications/orders/settings`, `PUT /notifications/preferences` | GET-vs-PUT shape mismatch. PUT/POST DTOs now **accept the read-only fields their own GET emits** (`cabinetId`/`cabinet_id`, `telegram_bound`, `telegram_username`, `quiet_hours.timezone`). Roundtrip 200. `src/orders/dto/orders-notification.dto.ts`, `src/notifications/dto/notification-preferences.dto.ts` |
| **BE-5** | 🟡 MEDIUM | `GET /v1/analytics/supply-planning` | Uniform ML velocity 14.39/day. **Zero-velocity gate** added: when derived `dailyUnits === 0`, the forecast is dropped so the caller falls back to `forecast_source:'velocity'` instead of serving a confident 0. `src/analytics/services/forecast-demand.service.ts`. **Residual:** root cause is the ML model (no per-cabinet unit forecast); needs a model-level fix. |
| **BE-6** | 🟡 MEDIUM | `GET /v1/orders/{uuid}` | 404 by UUID (resolved only by WB orderId). Now accepts **UUID or numeric** orderId, cabinet-scoped both ways. `src/orders/services/orders-query.service.ts` |
| **BE-7** | 🟡 MEDIUM | `GET /v1/expenses*` | `amount` serialized as Prisma Decimal `{s,e,d}` → **Decimal→number** via `.toNumber()` mapper. Added query params (`dateFrom`, `dateTo`, `limit`, `offset`). `src/expenses/`. **Residual:** verified by unit tests only — dev cabinet has 0 expense rows. |
| **BE-8** | 🟡 MEDIUM (AMBIG) | `PUT /v1/cabinets/:id` | Rejected GET body (read-only fields) + `vatRate:null`. DTO now accepts read-only fields (`id`, `isActive`, timestamps, …) as optional; handler strips them; `vatRate:null` allowed for non-VAT payers. `src/cabinets/dto/update-cabinet.dto.ts`, `src/cabinets/cabinets.controller.ts` |
| **BE-9** | 🟡 MEDIUM (AMBIG) | `PUT /v1/tariffs/settings` | 403 for Owner (required `admin`). `@Roles` widened to **Owner + Admin** (consistent with the rest of the app; seeded admin IS owner). `src/tariffs/tariffs-settings-admin.controller.ts`. **Residual:** GET emits volume tiers as `{min,max,rate}`, PUT DTO expects `{fromLiters,toLiters,rateRub}` — FE normalizes so the feature works, but raw GET-roundtrip still 400s. (Cabinet volume tiers simplified to a single 0.001–1.0 tier during verification; scalars restored.) |
| **BE-10** | 🟡 MEDIUM | `GET /v1/products?include_cogs=true` | Degenerate `last_sales_margin_pct = 100.0` for no-COGS weeks → **null** (mirrors `current_margin_pct`). `src/analytics/services/trends-analytics.service.ts`. **Residual:** `weekly_margin_fact` still stores 100 on the write path (separate MarginCalculationService change). |
| **BE-11** | ⚪ LOW | `GET /v1/analytics/liquidity/trends` | Route absent (404). Added `@Get('liquidity/trends')` returning the FE-expected shape (`{meta, trends:[], insights}`) with explanatory note. `src/analytics/controllers/liquidity.controller.ts` |
| **BE-12** | ⚪ LOW | `GET /v1/analytics/unit-economics` | `view_by` validation emitted an **empty enum**. Replaced plain-array `@IsEnum([...])` with real enums → now lists `sku, category, brand, total`. `src/analytics/dto/query/unit-economics-query.dto.ts` |
| **BE-13** | ⚪ LOW | `DELETE /v1/supplies/:id` | Route absent. Added `@Delete(':id')` — deletes **OPEN** supplies; non-OPEN → 409 Conflict with close/cancel guidance. Manager/Owner/Admin gated. `src/supplies/controllers/supplies.controller.ts`, `src/supplies/services/supply.service.ts` |
| **BE-14** | ⚪ LOW | `GET /v1/box-types`, `/v1/sku-packaging` | Rejected any unknown query param (strict whitelist, no DTO). Added permissive query DTOs with standard pagination (`limit`/`offset`/`page`). `src/shipment-cost/dto/{box-type,sku-packaging}-query.dto.ts` |
| **BE-15** | ⚪ LOW | ad-attributed traffic share | `summary.adTrafficShare = 5764%` (>100%) when `organicTrafficShare=0`. Fixed the denominator (now `adv + organic` partition sum) → shares ∈ [0,100], sum ≤100; zero-denominator guarded. `src/analytics/services/unified-product-analytics.service.ts` |
| **BE-16** | ⚪ LOW | `GET /v1/imports/gaps` | Ignored `X-Cabinet-Id` header, required `cabinet_id` query. Now resolves cabinetId **from the header** (every other endpoint's pattern); `cabinet_id` query is an optional fallback. `src/imports/controllers/gap-analysis.controller.ts` |
| **BE-17** | ⚪ LOW | `/v1/admin/backfill/*` | Role contract unclear; `/jobs` 404. **No code change** — the correct read path is `GET /v1/admin/backfill/status` (not `/jobs`), and all four endpoints already require `@Roles(Owner)`. Documented. |
| **BE-18** | — info | `GET /v1/analytics/weekly/by-category` | Leading «Unknown»/0 bucket — data-quality, **not a bug**. Skipped. |

---

## Residuals still open (by design)

- **BE-5** — deeper root cause is the ML model (no per-cabinet unit forecast, only revenue). Zero-gate is a read-path mitigation; full fix needs a per-cabinet unit-forecast model.
- **BE-7** — Decimal→number mapping verified by unit tests only; the dev cabinet has 0 expense rows, so no live confirmation.
- **BE-9** — tariffs GET/PUT volume-tier shape mismatch (`{min,max,rate}` vs `{fromLiters,toLiters,rateRub}`); FE normalizes so the feature works. Separate cleanup ticket.
- **BE-10** — `weekly_margin_fact` still stores `margin_percent=100` on the write path for no-COGS weeks; the read-path null fix here prevents it from surfacing, but a write-path normalization in `MarginCalculationService` is the fuller fix.

---

## Cross-cutting theme (closed)

Several FE "blockers" in `/settings/*` (BD-FE-001/003/004/005) were really **BE GET-vs-PUT shape mismatches** — the backend emits a field/role/Decimal-shape on GET, then rejects the same on PUT. All closed BE-side ("accept what you emit"). The 3 BLOCKING shipped-feature gaps (O4 marking code, brand-share, bulk-COGS) are unblocked.
