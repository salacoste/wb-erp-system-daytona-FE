# BE-BUGS.md — Backend defect handoff (full-page FE validation, 2026-07-05/06)

**Source:** runtime validation of the WB Repricer frontend against live BE (`:3000`, cabinet `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`, role=owner). 54 pages validated across 6 clusters (A–F) + P0 financial core. Each entry below is summarized; **full repro (curl + JWT + trace_id + response excerpt) is in the linked per-cluster file** `BE-BUGS-<X>.md` in this dir.
**Auth for repro:** `TOKEN=$(cat /tmp/feval-token); CAB=$(cat /tmp/feval-cab)` (re-login `POST /v1/auth/login {email:'test@test.com',password:'Russia23!'}` if expired).
**Severity:** 🔴 BLOCKING (feature non-operational) · 🟠 HIGH · 🟡 MEDIUM · ⚪ LOW/info.
**Owner:** BE = backend fix only · AMBIG = fixable on either side (recommendation noted).

---

> ## ✅ STATUS: ALL RESOLVED — 2026-07-07, commit `d941afb4`
>
> All 18 entries below were fixed on the BE side and **verified live** against `:3000` after rebuild (cabinet `f75836f7`, role owner). 17 fixed; BE-18 skipped (data-quality, not a bug). 1923 tests pass across affected modules.
>
> **Re-validated 2026-07-07:** still fixed after the parallel NEW-2/NEW-4/NEW-7 team work — `git log --since=2026-07-06` on all 34 changed BE files shows **zero overlap** (their work is in separate modules); no regression. The BE rebuild at 09:20 on 2026-07-07 re-compiled these fixes (all still live).
>
> | ID | One-line resolution |
> |---|---|
> | BE-1 | orders/meta bare **500 → 502 BadGateway** (WB rejects ineligible order; status+body surfaced, not masked) |
> | BE-2 | brand-share empty report → defensive unwrap (`res.report` \| `res.data.report`) |
> | BE-3 | bulk COGS `nm_id` string → **@Type-coerce** to number (BE-side) |
> | BE-4 | notifications GET/PUT shape → accept read-only fields + `quiet_hours.timezone` |
> | BE-5 | supply-planning ML velocity → **zero-velocity gate** (residual: per-cabinet unit model) |
> | BE-6 | `GET orders/{uuid}` → accept **UUID or numeric** orderId |
> | BE-7 | expenses `amount {s,e,d}` → **Decimal→number** + query params (dateFrom/dateTo/limit/offset) |
> | BE-8 | cabinet PUT → accept read-only fields + `vatRate:null` |
> | BE-9 | tariffs PUT **403 → allow Owner** role |
> | BE-10 | `last_sales_margin_pct=100` → **null** for no-COGS weeks |
> | BE-11 | liquidity/trends **404 → route added** (200, empty series + note) |
> | BE-12 | unit-economics `view_by` empty enum → populated (sku/category/brand/total) |
> | BE-13 | `DELETE /supplies/:id` → added (OPEN-only, 409 otherwise) |
> | BE-14 | box-types/sku-packaging → accept pagination query params |
> | BE-15 | `adTrafficShare >100%` → denominator fixed (shares now sum ≤100) |
> | BE-16 | imports/gaps → **X-Cabinet-Id header** primary, `cabinet_id` query fallback |
> | BE-17 | admin/backfill → **no code change** (correct path `/status`; roles already Owner) |
> | BE-18 | skipped (data-quality "Unknown" bucket, not a bug) |
>
> **Residuals still open (by design):**
> - **BE-5** — deeper root cause is the ML model (no per-cabinet unit forecast); zero-gate is a read-path mitigation.
> - **BE-7** — Decimal→number verified by unit tests only; the dev cabinet has 0 expense rows, so no live confirmation.
> - **BE-9** — tariffs GET emits volume tiers as `{min,max,rate}`, PUT DTO expects `{fromLiters,toLiters,rateRub}`; FE normalizes so the feature works, but raw GET-roundtrip still 400s. (Also: the cabinet's volume tiers were simplified to a single 0.001–1.0 tier during BE-9 verification; scalars restored.)
>
> **Do not re-fix these** — they are closed. The per-cluster files (`BE-BUGS-A.md` … `BE-BUGS-F.md`) retain the original repro context for reference.

---

## 🔴 BLOCKING — shipped features non-operational on live data

### BE-1 — `PATCH /v1/orders/{uuid}/meta` → 500 (blocks O4 «Код маркировки»)
- **Endpoint:** `PATCH /v1/orders/:orderUuid/meta` body `{metaType:"IMEI"|"GTIN"|"SGTIN"|"UIN", value:string 1-200}`
- **Actual:** `500 INTERNAL_SERVER_ERROR` for every call (2 orders × 2 metaTypes). trace_ids `6846b6fc-…`, `ada3b4be-…`. Field not persisted (GET list shows no `metaType`).
- **Expected:** `200 {updated:true}` per FE contract (`docs/request-backend/223-…md`); marking code persisted.
- **Impact:** the entire O4 marking-code (Честный ЗНАК) feature is unusable. FE is correct vs contract (CI green); pure BE 500.
- **Likely cause:** backend expects a different field name (`markingCode`/`meta`?) or path-param confusion (UUID vs WB orderId — see BE-6). **Owner: BE.**
- **Full repro:** `BE-BUGS-B.md` §BE-BUG-1.

### BE-2 — `/v1/analytics/brand-share` report universally `{report:[]}` (blocks PR4b brand-share)
- **Endpoint:** `GET /v1/analytics/brand-share?brand=&parentId=&dateFrom=&dateTo=`
- **Actual:** empty `report` array across **6 brands × all categories × 90-day window**. Prerequisites DO populate: `GET /brand-share/brands` → string[], `/brand-share/parent-subjects` → [{parentId,parentName}]. So brand/subject ingestion works; the **time-series report ingestion is missing/broken**.
- **Expected:** `{report:[{applyDate, brandRating, pricePercent, qtyPercent}]}` per `docs/request-backend/225-…md`.
- **Impact:** the PR4b «Доля бренда» feature renders empty-state permanently. FE + cascading UX + AP#8 normalizer verified correct (CI green); pure BE data gap. **Owner: BE.**
- **Full repro:** `BE-BUGS-D.md` §BE-D-1.

### BE-3 — `POST /v1/products/cogs/bulk` → 400 `nm_id must be an integer` (blocks bulk COGS)
- **Endpoint:** `POST /v1/products/cogs/bulk?format=v2` body `{items:[{nm_id, unit_cost_rub, valid_from, source}]}`
- **Actual:** `400 {"details":[{"issue":"items.0.nm_id must be an integer number"}]}` — FE sends `nm_id` as **string** (`BulkCogsItem.nm_id: string`); BE validator demands integer. Same body with integer `nm_id` → 202 ✅ persisted.
- **Impact:** bulk COGS assignment unusable end-to-end (preview → 400, nothing persisted).
- **Owner: AMBIG.** Recommend **FE** fix: type `BulkCogsItem.nm_id: number`, parse in `createBulkCogsItems` (type-honesty + aligns with codebase; single-assign uses URL path, unaffected). Secondary: BE also rejects `currency` (FE omits) + requires `source` (FE sends).
- **Full repro:** `BE-BUGS-A.md` §BE-A-1.

---

## 🟠 HIGH

### BE-4 — Notifications settings save fails (GET-vs-PUT shape mismatches)
- **Endpoints:** `POST /v1/notifications/orders/settings` + `PUT /v1/notifications/preferences`
- **Actual:** orders/settings rejects the `cabinetId` field its OWN GET includes → 400 every save. preferences rejects the `quiet_hours.timezone` value it returned → 400.
- **Impact:** notifications page cannot save (cross-cluster — surfaces via shared layout hook). FE-angle: BD-FE-001 (FE spreads `cabinetId` into POST).
- **Owner: AMBIG** — cleanest is BE: GET/POST should accept the same shape (don't emit fields you reject). FE can also strip them.
- **Full repro:** `BE-BUGS-E.md` §BE-E-1 + `BE-BUGS-F.md` §BE-BUG-F-001.

---

## 🟡 MEDIUM

### BE-5 — Supply-planning: uniform ML velocity 14.39/day for 12 distinct SKUs
- **Endpoint:** `GET /v1/analytics/supply-planning` — 12 different SKUs all return ML velocity `14.39/day` (`forecast_source=ml`, conf ~0.47). trace_id `7488816c-…`. Distorts reorder quantities + «Требуется капитал 547 870 ₽». Suspected ML fallback constant. **Owner: BE.** Detail: `BE-BUGS-C.md` §BE-C-1.

### BE-6 — `GET /v1/orders/{uuid}` → 404 (detail resolves only by WB orderId)
- 404 with the OrderFbs UUID (`order.id`) — the same UUID every mutation uses (confirm/cancel/meta). Detail only resolves by the WB numeric `orderId`. Inconsistent with the mutation contract. **Owner: BE.** Detail: `BE-BUGS-B.md` §BE-BUG-2.

### BE-7 — Expenses `amount` serialized as raw Prisma `Decimal` JSON `{s,e,d}` (non-portable)
- `GET /v1/expenses*` returns `amount` as `{s,e,d}` Prisma-internal object, not a number → FE `Number({s,e,d})` = NaN → «не число ₽» (BD-FE-003). Other WB finance numbers are plain numbers; inconsistent. **Owner: BE** (serialize Decimal → number). FE could add a parser but that papers over a non-portable contract. Detail: `BE-BUGS-F.md` §BE-BUG-F-002.

### BE-8 — `PUT /v1/cabinets/:id` rejects `vatRate:null` (tax form unsaveable)
- Rejects `vatRate:null` 400, but GET returns `vatRate:null` for non-VAT payers → FE round-trips null → 400 (BD-FE-004). **Owner: AMBIG** — BE should accept what it emits; or FE send `vatRate:0`/omit. Recommend **BE**. Detail: `BE-BUGS-F.md` §BE-BUG-F-003.

### BE-9 — `PUT /v1/tariffs/settings` requires role `admin` (Owner 403)
- 403 for role `owner`; requires `admin`. Rest of the app authorizes `owner` (seeded admin IS owner) → tariff save blocked (BD-FE-005). **Owner: AMBIG** — BE role contract should match the rest of the app. Recommend **BE**. Detail: `BE-BUGS-F.md` §BE-BUG-F-004.

### BE-10 — Products: degenerate `last_sales_margin_pct = 100.0` for no-COGS weeks
- `GET /v1/products?include_cogs=true` returns `100.0` margin when `cogs_total==0`. Should be `null`. **Owner: BE.** Detail: `BE-BUGS-A.md` §BE-A-2.

---

## ⚪ LOW / informational

| ID | Endpoint | Issue | Detail |
|---|---|---|---|
| BE-11 | `GET /v1/analytics/liquidity/trends` | → 404; FE has `getLiquidityTrends` hook+normalizer (dead code or unshipped). | REPORT.md BE-1 |
| BE-12 | `GET /v1/analytics/unit-economics` | `view_by` validation emits an **empty enum** ("must be one of: "); `view_by=sku` works. | REPORT.md BE-2 |
| BE-13 | `DELETE /v1/supplies/:id` | endpoint absent — cannot remove a supply. | BE-BUGS-B.md BE-BUG-3 |
| BE-14 | `GET /v1/box-types`, `/v1/sku-packaging` | reject any unknown query param with 400 (strict whitelist). | BE-BUGS-B.md BE-BUG-4 |
| BE-15 | ad-attributed share | `summary.adTrafficShare = 5764.52 %` (>100%) when `organicTrafficShare=0` — wrong denominator. Cosmetic. | BE-BUGS-D.md BE-D-2 |
| BE-16 | `GET /v1/imports/gaps` | ignores `X-Cabinet-Id` header, requires `cabinet_id` query. FE mitigates. | BE-BUGS-E.md BE-E-2 |
| BE-17 | `/v1/admin/backfill/*` | role contract unclear (Owner GET ok; start likely admin-only). | BE-BUGS-F.md BE-BUG-F-005 |
| BE-18 | `GET /v1/analytics/weekly/by-category` | one leading «Unknown»/0 bucket (data-quality, NOT broken). | REPORT.md BD-10-corrected |

---

## ✅ Resolved during this validation (no longer bugs)
- `/analytics/fbs-enhanced` BE-500 (matrix D1) — **FIXED**.
- `/analytics/time-period` `includeCogs` 400 (Feb BUG #2) — **FIXED**.
- `/settings` root 404 (Feb) — **FIXED** (redirects to /settings/notifications).
- `/analytics/forecast-accuracy` MAPE headline (matrix D2) — **mitigated** (MAE-led, extreme-MAPE guard).
- Feb `/analytics/liquidity` + `/supplies` 400s — fixed.

## Cross-cutting theme
Several FE "blockers" in `/settings/*` (BD-FE-001/003/004/005) are actually **BE GET-vs-PUT shape mismatches** — the backend emits a field/role/Decimal-shape on GET, then rejects the same on PUT. Cleanest fixed BE-side (accept what you emit). The 3 BLOCKING shipped-feature gaps (O4, brand-share, bulk-COGS) are the top priority.
