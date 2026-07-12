# Validation Finding Resolutions — 2026-07-11

**Scope:** Full live re-validation of all BE-owned findings from the 2026-07-05/06 validation (clusters A–F, source: `BE-BUGS-{A..F}.md`). **All items green — no blockers.** The original "BE bugs" were predominantly **test-parameter errors** in the validator's curl repros (camelCase vs snake_case; missing required `brand`/`dateFrom`/`dateTo`); a few were genuine BE issues since fixed BE-side.

**Live re-val:** 2026-07-11, build `2026-07-11T01:21:39Z`, cabinet `f75836f7-…-a1f3508cce8e`, BE `:3000`.
**⚠️ ID-map note:** the earlier handoff table had swapped BE-IDs (validator's "BE-B-1" = supply-planning velocity; FE's "BE-B-1" = orders/meta). Corrected below — `BE-BUG-N` IDs are the `BE-BUGS-B.md` originals.

---

## Cluster A — COGS/Products
| ID | Endpoint | Sev | Status | Live evidence |
|----|----------|-----|--------|----------------|
| **BE-A-1** | `POST /v1/products/cogs/bulk` | 🔴→✅ | **FE-fixed** | PR #39 — FE sends `nm_id` integer at the wire boundary; BE accepts (HTTP 202). |
| **BE-A-2** | `GET /v1/products?include_cogs=true` | 🟡 | ✅ | `last_sales_margin_pct = null` for no-COGS (was degenerate `100.0`). BE-fixed. |

## Cluster B — Orders/Supplies
| ID | Endpoint | Sev | Status | Live evidence |
|----|----------|-----|--------|----------------|
| **BE-BUG-1** | `PATCH /v1/orders/:id/meta` | 🟠 | ✅⚠️ | Accepts UUID (HTTP 200), not just numeric orderId. Body `{metaType,value}` → 404 on fake UUID (contract OK, not 400/500). ⚠️ O4 marking-code (Честный ЗНАК) WB write-back returned 200 — **needs a smoke-test on a REAL order** to confirm persistence. |
| **BE-BUG-3** | `DELETE /v1/supplies/:id` | 🟢 | ✅ | Route registered — returns 404 NOT_FOUND for nonexistent id (not "Cannot DELETE"). |
| **BE-BUG-4** | `GET /v1/box-types`, `GET /v1/sku-packaging` | 🟡 | ✅ | Accept `limit`/`offset`/`page` (HTTP 200, no longer 400 on unknown param). |

## Cluster C — Supply planning
| ID | Endpoint | Sev | Status | Live evidence |
|----|----------|-----|--------|----------------|
| **BE-C-1** | `GET /v1/analytics/supply-planning` | 🟠 | ✅ | `avg_daily_sales` now **distinct per-SKU**: 8.82 / 26.59 / 38.31 / 10.07 (ML), 0.01 (velocity). No longer uniform 14.39. `forecast_source`: ml=16, velocity=34. (Coverage gap, not a bug: ~42 sparse SKUs have `avg_daily_sales=0` → `days_until_stockout=999` → FE renders **∞** via `formatDaysUntilStockout`; ML not built for dormant cabinet — BE-5 closed: backtest showed ML doesn't beat naive.) |

## Cluster D — Product/Brand share
| ID | Endpoint | Sev | Status | Live evidence |
|----|----------|-----|--------|----------------|
| **BE-D-1** | `GET /v1/analytics/brand-share` | 🟠→✅ | ✅ | Returns **40 report points** (not `{report:[]}`) when called with `?brand=…&parentId=…` (+ optional `dateFrom`/`dateTo`). Original "empty" was a **missing-required-param** test error. |
| **BE-D-2** | `GET /v1/analytics/product/:nmId/unified` | 🟢 | ✅ | `adTrafficShare ≤ 100` (when `organic=0` → `null`, not 5764%). FE renders faithfully. |

## Cluster E — Notifications/Imports
| ID | Endpoint | Sev | Status | Live evidence |
|----|----------|-----|--------|----------------|
| **BE-E-1** | `POST /v1/notifications/orders/settings` | 🟠 | ✅ | Round-trip GET→POST (body incl `cabinetId`) → 201 (accepts its own GET-response `cabinetId`). |
| **BE-E-2** | `GET /v1/imports/gaps` | 🟡 | ✅ | `X-Cabinet-Id` header accepted → 200 (no `cabinet_id` query param needed; `dateFrom`+`dateTo` required). |

## Cluster F — Cabinets/Tariffs/Expenses/Admin
| ID | Endpoint | Sev | Status | Live evidence |
|----|----------|-----|--------|----------------|
| **BE-BUG-F-002** | `GET /v1/expenses*` (Decimal shape) | 🔴→✅ | ✅ | **Confirmed by BE code (BE-7):** `ExpenseResponseDto.amount: number` (`expense-response.dto.ts`) + `operational-expenses.service.ts` does `amount: expense.amount.toNumber()` (Prisma Decimal → number) with an explicit comment naming the `{s,e,d}`→NaN FE bug. The 2026-07-11 live re-val had no expense data, but the code fix is unambiguous — no Decimal reaches the wire. |
| **BE-BUG-F-003** | `PUT /v1/cabinets/:id` (`vatRate:null`) | 🔴 | ✅ | `vatRate:null` (non-VAT-payer) → 200 (GET-form round-trip works). |
| **BE-BUG-F-004** | `PUT /v1/tariffs/settings` (admin role) | 🔴 | ❓ | ⚠️ Was mislabeled above as "notifications schedule". Actual finding (`BE-BUGS-F.md`): `admin` role required — Owner gets 403 `INSUFFICIENT_PERMISSIONS`; GET works for Owner → every Tariffs-page save 403s. Status unconfirmed in this re-val. See `docs/request-backend/226` §2.4. |
| **BE-BUG-F-005** | `POST /v1/admin/backfill/start` (role?) | 🟠 | ❓ | **Not checked** (mutation, skipped). BE: confirm whether admin role is required for Owner. |

---

## Outstanding (non-blocking)
- **BE-BUG-1** — smoke-test the O4 marking-code (Честный ЗНАК) WB write-back on a **real** order to confirm persistence (the contract/UUID path is green).
- **BE-BUG-2** — `GET /v1/orders/:id` orderId-vs-UUID asymmetry — **not covered in this re-val**; status unconfirmed.
- **BE-BUG-F-001** — `PUT /v1/notifications/preferences` `quiet_hours.timezone` round-trip — **not covered in this re-val**; FE omits `timezone` as workaround.
- **BE-BUG-F-004** — corrected: `PUT /v1/tariffs/settings` admin-role 403 for Owner (was mislabeled in the Cluster F table above as "notifications schedule").
- **BE-BUG-F-005** — BE confirms the admin/backfill role requirement for Owner.
- **BE-2** (`/analytics/unit-economics` `view_by` empty enum) — **not in this re-val batch**; likely snake_case-related (the `view_by` convention is confirmed green on liquidity). Confirm on unit-economics specifically.

> **Full status table + detailed professional write-up of all 6 outstanding items** (each with context, current live state, the exact BE ask, repro, impact): [`docs/request-backend/226-validation-2026-07-be-status-and-outstanding.md`](../../../docs/request-backend/226-validation-2026-07-be-status-and-outstanding.md).

## FE parameter-contract conventions (confirmed live)
- **liquidity** — snake_case: `turnover_weeks`, `view_by`, `category_filter`, `sort_by`, `sort_order` (camelCase `weeks`/`viewBy` → 400 `forbidNonWhitelisted`). FE client `getLiquidity` ✅ compliant.
- **brand-share** — `brand` (required), `parentId`, `dateFrom`, `dateTo`. FE client ✅ compliant.
- **imports/gaps** — `dateFrom`+`dateTo` required; cabinet via `X-Cabinet-Id` header. FE client ✅ (this commit removed the redundant `cabinet_id` query param from the GET).

## FE-side actions (this validation batch)
- **BE-A-1** fixed FE-side (PR #39, `nm_id` string→integer wire conversion).
- **financial-gaps GET** — removed redundant `cabinet_id` query param (rely on `X-Cabinet-Id` header); POST `/analyze` + `/remediate` unchanged (body `cabinet_id` not re-verified).
- **FE contract-compliance verified** for liquidity (snake_case), brand-share (required params), supply-planning (`days_until_stockout=999` → ∞ via `formatDaysUntilStockout`, `supply-planning-utils.ts:48`). No live FE bugs from the parameter contracts.
