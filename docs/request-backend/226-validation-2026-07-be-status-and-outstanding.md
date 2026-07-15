# Request #226 — 2026-07 Validation: BE status (all clusters) + outstanding confirmation requests

**Status:** Informational handoff — **6 non-blocking BE confirmations outstanding; all 🔴 blockers resolved.**
**Source:** live re-validation 2026-07-11 (build `2026-07-11T01:21:39Z`, cabinet `f75836f7-…-a1f3508cce8e`, BE `:3000`, role=owner).
**Detailed per-item evidence:** `frontend/.omc/validation/2026-07-05/RESOLUTIONS-2026-07-11.md` + `BE-BUGS-{A..F}.md`.
**Related FE work:** PR #39 (merged) — BD-5 COGS-degenerate CTA, MissingCogsAlert tooltip, BE-A-1 bulk-COGS `nm_id` wire fix.
**Repro env (all `curl` examples):** `BASE=http://localhost:3000`; `TOKEN` = owner JWT; `CAB=f75836f7-…`; `H="-H Authorization:Bearer\ $TOKEN -H X-Cabinet-Id:$CAB"`.

## Context

A full FE→BE validation (2026-07-05/06, clusters A–F) originally surfaced ~16 BE-owned findings. A 2026-07-11 live re-validation confirmed **all 🔴 blockers resolved** — most original "bugs" were validator test-parameter errors (camelCase vs snake_case; missing required `brand` / `dateFrom` / `parentId`); a few were genuine BE defects now fixed BE-side:

- **BE-A-2** — `last_sales_margin_pct = null` for no-COGS (was degenerate `100.0`).
- **BE-C-1** — supply-planning `avg_daily_sales` now distinct per-SKU (was uniform `14.39/day` ML fallback).
- **BE-D-2** — `adTrafficShare ≤ 100` (was 5764% when organic=0).
- **SKU-margin** — correlated SQL subquery was binding `nm_id`/`sale_dt` to the `products` table, excluding sales entirely → wrong per-row margins; fixed + regression SQL test (W24 verified: lpw40_2 gross 74.88% / operating 47.87%, no nulls).
- **BE-BUG-F-002** — `amount` serialized as plain number via `expense.amount.toNumber()` (was raw Prisma Decimal `{s,e,d}`).

**6 items remain open as non-blocking confirmations** — detailed in §2. This doc is the single authoritative status table + the professional handoff for those 6.

## §1 — Status at a glance (all clusters)

| Cluster | ID | Endpoint | Status | Note |
|---|---|---|---|---|
| A | BE-A-1 | `POST /v1/products/cogs/bulk` | ✅ resolved | FE-fixed (PR #39, `nm_id` string→integer at wire); BE accepts int → 202. |
| A | BE-A-2 | `GET /v1/products?include_cogs=true` | ✅ resolved | BE: `last_sales_margin_pct=null` for no-COGS. |
| B | **BE-BUG-1** | `PATCH /v1/orders/:uuid/meta` (O4) | ⚠️ **confirm** | Contract green (UUID, `{metaType,value}`); needs real-order WB write-back smoke-test. → §2.1 |
| B | **BE-BUG-2** | `GET /v1/orders/:id` (orderId vs UUID) | ❓ **confirm** | NOT in the 2026-07-11 re-val doc; status unconfirmed. → §2.2 |
| B | BE-BUG-3 | `DELETE /v1/supplies/:id` | ✅ resolved | Route registered (404 for unknown id, not "Cannot DELETE"). |
| B | BE-BUG-4 | `GET /v1/box-types`, `/v1/sku-packaging` | ✅ resolved | Accept `limit`/`offset`/`page` (no 400 on unknown param). |
| C | BE-C-1 | `GET /v1/analytics/supply-planning` | ✅ resolved | `avg_daily_sales` distinct per-SKU (8.82/26.59/38.31/10.07 ML, 0.01 velocity). |
| D | BE-D-1 | `GET /v1/analytics/brand-share` | ✅ resolved | 40 report points with `brand`+`parentId` (was missing-param test error). |
| D | BE-D-2 | `GET /v1/analytics/product/:nmId/unified` | ✅ resolved | `adTrafficShare ≤ 100` (organic=0 → null). |
| E | BE-E-1 | `POST /v1/notifications/orders/settings` | ✅ resolved | Round-trip GET→POST → 201. |
| E | BE-E-2 | `GET /v1/imports/gaps` | ✅ resolved | `X-Cabinet-Id` header accepted (dateFrom+dateTo required). |
| F | **BE-BUG-F-001** | `PUT /v1/notifications/preferences` (timezone) | ❓ **confirm** | NOT in the re-val doc; FE omits `timezone` as workaround. → §2.3 |
| F | BE-BUG-F-002 | `GET /v1/expenses*` (Decimal) | ✅ resolved | Code-confirmed: `amount.toNumber()` + DTO `number` (BE-7). |
| F | BE-BUG-F-003 | `PUT /v1/cabinets/:id` (`vatRate:null`) | ✅ resolved | `vatRate:null` → 200. |
| F | **BE-BUG-F-004** | `PUT /v1/tariffs/settings` (admin role) | ❓ **confirm** | **Mislabeled** in re-val doc as "notifications schedule"; real issue = admin role for Owner (403). → §2.4 |
| F | **BE-BUG-F-005** | `POST /v1/admin/backfill/start` (role?) | ❓ **confirm** | Not exercised (mutation); likely admin-only like F-004. → §2.5 |
| — | **BE-2** | `GET /v1/analytics/unit-economics` (`view_by`) | ❓ **confirm** | Not in re-val batch; empty-enum validation message; confirm snake_case contract. → §2.6 |

**Tally:** 10 resolved ✅ · **6 outstanding confirmations** ❓/⚠️ · **0 blockers.**

---

## §2 — Outstanding confirmation requests (detailed)

### 2.1 BE-BUG-1 — O4 marking-code (Честный ЗНАК) real-order persistence
- **Endpoint:** `PATCH /v1/orders/:orderUuid/meta`
- **Severity:** non-blocking (contract green); the O4 FE feature depends on persisted write-back.
- **Current live state (2026-07-11):** the contract path is green — the endpoint accepts the UUID path param and the `{metaType:"IMEI"|"GTIN"|"SGTIN"|"UIN", value:string 1-200}` body; a fake UUID returns 404 (contract OK, not the original 400/500). This resolved the original 500.
- **What we need from BE:** a smoke-test on a **real** WB order — save a marking code, then `GET` the order and confirm the `metaType`+`value` persist. The contract shape is verified; only end-to-end persistence is unconfirmed.
- **Repro (real order):**
  ```bash
  curl -s -X PATCH $H -H 'Content-Type: application/json' \
    -d '{"metaType":"GTIN","value":"0123456789012"}' \
    $BASE/v1/orders/<real-order-uuid>/meta        # expect 200 {updated:true}
  curl -s $BASE/v1/orders/<real-order-uuid> $H     # expect metaType+value present
  ```
- **Impact:** O4 («Код маркировки») is a user-facing FE feature; without confirmed persistence the FE cannot ship it confidently.

### 2.2 BE-BUG-2 — Orders detail identity asymmetry (orderId vs UUID)
- **Endpoint:** `GET /v1/orders/:id`
- **Severity:** non-blocking (FE passes `orderId` for detail today); contract-consistency footgun.
- **Current state:** **not re-validated 2026-07-11.** Originally: `GET /v1/orders/<uuid>` → 404 `ORDER_NOT_FOUND`, while `GET /v1/orders/<wb-orderId>` → 200 — yet the mutation endpoints (`/confirm`, `/cancel`, `/meta`) all key on the UUID. The list returns both `id` (UUID) and `orderId`.
- **What we need from BE:** confirm whether the detail endpoint now accepts the UUID (preferred — unifies the identity field across the Orders API), or document that it requires `orderId`.
- **Repro:**
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" $BASE/v1/orders/<uuid> $H      # 404 or 200?
  curl -s -o /dev/null -w "%{http_code}\n" $BASE/v1/orders/<orderId> $H   # 200
  ```
- **Impact:** no current FE breakage (FE passes orderId for detail, UUID for mutations), but the asymmetry is a silent trap for any consumer assuming `/orders/{id}` takes the list's first `id` field.

### 2.3 BE-BUG-F-001 — notifications/preferences `quiet_hours.timezone` round-trip
- **Endpoint:** `PUT /v1/notifications/preferences`
- **Severity:** non-blocking (FE workaround: omit `timezone`; the preferences UI is also gated behind Telegram binding).
- **Current state:** **not re-validated 2026-07-11.** Originally: GET returns `quiet_hours.timezone:"Europe/Moscow"`; PUT rejects the same field with `forbidNonWhitelisted` 400 → round-trip impossible unless the FE strips it.
- **What we need from BE:** either accept `timezone` on PUT (round-trip safe) or omit it from the GET response. Confirm current behavior.
- **Repro:**
  ```bash
  curl -s -X PUT $H -H 'Content-Type: application/json' -d '{
    "preferences":{"task_completed":true,"task_failed":true,"task_stalled":true,"daily_digest":false,"digest_time":"09:00"},
    "language":"ru","quiet_hours":{"enabled":false,"from":"23:00","to":"07:00","timezone":"Europe/Moscow"}
  }' $BASE/v1/notifications/preferences     # 200 or 400?
  ```
- **Impact:** preferences save would fail for Telegram-bound users if the FE round-trips the GET shape; currently masked by the Telegram gate + the FE's `timezone`-strip workaround.

### 2.4 BE-BUG-F-004 — `PUT /v1/tariffs/settings` requires `admin` (Owner rejected) — ⚠️ mislabeled in re-val doc
- **Endpoint:** `PUT /v1/tariffs/settings`
- **Severity:** non-blocking for the validation, but **functionally blocks the Tariffs page for Owner** (the highest standard role).
- **Current state:** the 2026-07-11 re-val doc **mislabels this as "notifications schedule ✅"**. The actual finding (`BE-BUGS-F.md`): `PUT /v1/tariffs/settings` returns **403 `INSUFFICIENT_PERMISSIONS`** ("Required roles: admin. User role: owner"); GET works for Owner. The FE `/settings/tariffs` page admits Owner, so every save 403s.
- **What we need from BE:** confirm whether the admin-only gate was lifted for Owner (recommended — Owner is the de-facto cabinet admin), or whether the FE should role-gate the page.
- **Repro:**
  ```bash
  curl -s -X PUT $H -H 'Content-Type: application/json' -d '{...valid settings...}' \
    $BASE/v1/tariffs/settings -w "\n%{http_code}\n"   # 403 or 200?
  ```
- **Impact:** Tariffs page unusable by Owner; audit log/history stay empty (no PUT ever succeeds).

### 2.5 BE-BUG-F-005 — `POST /v1/admin/backfill/start` role contract
- **Endpoint:** `POST /v1/admin/backfill/start` (`GET .../status` works for Owner)
- **Severity:** non-blocking (not exercised — non-destructive policy; `start` would enqueue a 365-day job).
- **Current state:** not exercised 2026-07-11. Given F-004 (tariffs) requires `admin`, the backfill start likely does too → the «Запустить бэкфилл» button would 403 for Owner.
- **What we need from BE:** confirm the role requirement for `POST /v1/admin/backfill/start`; if admin-only, decide policy (allow Owner, or FE hides the button for Owner).
- **Impact:** if admin-only, the backfill UI action is dead for Owner (same defect class as F-004).

### 2.6 BE-2 — unit-economics `view_by` empty-enum validation
- **Endpoint:** `GET /v1/analytics/unit-economics` (`view_by` param)
- **Severity:** non-blocking (`view_by=sku` works); cosmetic validation-message defect.
- **Current state:** **not in the 2026-07-11 re-val batch.** Originally: the `view_by` validation emits an empty enum ("must be one of: "). The snake_case convention is confirmed green on liquidity; unit-economics specifically unconfirmed.
- **What we need from BE:** confirm the accepted `view_by` values on unit-economics (and that the validation message lists them, not an empty enum).
- **Repro:**
  ```bash
  curl -s "$BASE/v1/analytics/unit-economics?view_by=invalid" $H   # inspect the enum message
  ```
- **Impact:** minor; `view_by=sku` works, so no current FE breakage.

---

## §3 — Discrepancies in the 2026-07-11 re-val doc (corrected here)

For BE-team accuracy, the re-val doc (`RESOLUTIONS-2026-07-11.md`) has three gaps this request corrects:
1. **BE-BUG-2** (Cluster B, orderId/UUID) — omitted from the re-val table; status unconfirmed (§2.2).
2. **BE-BUG-F-001** (Cluster F, timezone round-trip) — omitted; status unconfirmed (§2.3).
3. **BE-BUG-F-004** — mislabeled as "notifications schedule"; actual = `PUT /v1/tariffs/settings` admin-role 403 (§2.4).

## Resolution template (for the BE team)

A one-line reply per item suffices:
- **BE-BUG-1** — "real-order write-back persists — confirmed" / "still flaky, trace=…"
- **BE-BUG-2** — "GET /orders/:uuid → 200 now" / "documented as orderId-only"
- **BE-BUG-F-001** — "timezone accepted on PUT" / "omitted from GET"
- **BE-BUG-F-004** — "owner allowed for tariffs" / "FE should role-gate"
- **BE-BUG-F-005** — "admin required" / "owner allowed"
- **BE-2** — "view_by enum = sku|brand|category (snake_case)" / "…"

---

## Update — BE verification results (2026-07-13)

The BE team verified all 6 outstanding items against current code, DTOs, RBAC, services, and fresh tests. **Result: 15/16 confirmed BE-side; 1 operational confirmation remains (BE-BUG-1 marking-code persistence); 0 blockers for normal FE development.** Verifications run: focused Jest 2× (9 suites, 124 tests, 0 failed/skipped), malformed-DTO 19/19, tsc 0 errors, eslint pass, production build pass, endpoint-drift 75/75, code-review APPROVE, architecture CLEAR, adversarial UltraQA PASS.

### Verdicts on the 6 outstanding items

| ID | Verdict | FE implication |
|----|---------|----------------|
| **BE-BUG-2** (orders detail UUID/orderId) | ✅ Fixed & confirmed — `GET /v1/orders/:id` accepts both the internal UUID and numeric WB `orderId`; lookup stays cabinet-scoped | FE **may standardize detail navigation on UUID** — the old "orderId-for-detail / UUID-for-mutations" split is no longer necessary (optional cleanup). |
| **BE-BUG-F-001** (timezone) | ✅ Fixed & confirmed — GET-shaped PUT no longer 400s; `timezone` is a top-level writable field; its absence does not reset the saved value | FE **`timezone`-strip workaround is no longer required** (optional cleanup). |
| **BE-BUG-F-004** (tariffs Owner) | ✅ Fixed & confirmed — `PUT /v1/tariffs/settings` allows Admin + Owner; Manager/Analyst → 403 | **No FE change** — the page already admitted Owner; the former 403 was the BE bug (no FE role-gate was ever added). |
| **BE-BUG-F-005** (backfill Owner) | ✅ **RESOLVED (2026-07-13 BE batch, build 09:35:56)** — Admin + Owner allowed within JWT `cabinet_ids`; `start` requires `cabinetId`; `status`/`pause`/`resume` protected; empty scope fail-closed | FE may **simplify** the launch UX — cabinet-scoping is now BE-enforced fail-closed (one-click safe; explicit scope display optional). See [`228-…`](./228-be-bug-f-005-backfill-admin-cabinet-scope-security.md) §5. |
| **BE-2** (unit-economics `view_by`) | ✅ Confirmed (part of 15/16; the snake_case `view_by` convention is green, matching liquidity) | **No FE change** — FE clients are already snake_case-compliant. |
| **BE-BUG-1** (O4 marking-code persistence) | ⚠️ **The one remaining operational confirmation** — write chain verified, but persistence cannot be live-confirmed | FE may integrate the PATCH contract; **cannot claim full live-confirmation** (see below). |

### BE-BUG-1 — why it can't be fully live-confirmed (the 1 remaining)
The marking-code write chain is verified up to the WB proxy (UUID path, `{metaType:"IMEI"|"GTIN"|"SGTIN"|"UIN", value:string 1–200}` body, exact WB SDK call, `{updated:true}` success, diagnosable 502 on WB error). A PATCH→GET smoke-test **cannot** prove persistence because:
- BE proxies the write to WB (no local source-of-truth for the marking code);
- `GET /v1/orders/:id` does not currently return `metaType`/`value`.

FE can integrate and use the PATCH contract; the O4 feature's persistence remains an **operational-confirmation item**, not a BE-contract blocker.

### F-005 backfill — scope/RBAC ✅ RESOLVED (2026-07-13 BE batch, build 09:35:56)
Filed as [`228-…`](./228-be-bug-f-005-backfill-admin-cabinet-scope-security.md) — now resolved BE-side:
- `Admin` + `Owner` are both allowed, strictly within the caller's JWT `cabinet_ids`;
- `POST /start` requires `cabinetId`; `status` / `pause` / `resume` are also protected;
- empty scope is **fail-closed** (no cross-cabinet blast radius).

**FE implication:** the prior defensive UX commitments (explicit scope confirmation, "do not promise current-cabinet-only") are no longer safety-critical — cabinet-scoping is now BE-enforced. FE may simplify the launch UX; an explicit scope display remains optional good practice.

### FE-actionable items now enabled by the BE fixes (all optional, non-blocking)
1. **Standardize Orders detail navigation on UUID** — ⚠️ **BLOCKED 2026-07-13 (live empirical check)**: the base `GET /v1/orders/:id` accepts both UUID and orderId (BE-BUG-2 confirmed — both → 200), but the three **history sub-routes** (`/history`, `/wb-history`, `/full-history`) **return HTTP 500 on UUID, 200 only on WB orderId**. The Orders detail modal shares its identifier with `OrderHistoryTabs` (which calls all three history sub-routes), so switching to UUID would load the detail but **500 every history tab**. FE correctly keeps `orderId` for the whole modal chain. This is filed as [`229-orders-history-endpoints-uuid-compat-500.md`](./229-orders-history-endpoints-uuid-compat-500.md) — the FE cleanup is unblocked only after BE makes the history sub-routes UUID-compatible (or 404-on-UUID).
2. **Notifications `timezone` strip workaround** — ✅ **verified ABSENT 2026-07-13 (FE source trace, no-op)**: the FE already round-trips `quiet_hours.timezone` in the PUT — `updateNotificationPreferences` (src/lib/api/notifications.ts) passes the body unchanged, and `useQuietHours` → `useNotificationPreferences` optimistic-merge includes `timezone`. A full-codebase grep for strip/omit/`delete timezone` patterns returned nothing. **No FE change needed.** (The 2026-07-05 "FE timezone-strip workaround" note in RESOLUTIONS-2026-07-11.md §2.3 was describing the *intended* defensive omission; it was never present in code.)
3. **(No tariffs role-gate to remove — the FE never added one; it admitted Owner throughout, so F-004's fix needs no FE change.)**
4. **Backfill launch-button UX** — ✅ F-005 resolved (2026-07-13): cabinet-scoping now BE-enforced fail-closed, so the prior "explicit scope confirmation / do not promise current-cabinet-only" caution is no longer safety-critical. FE may simplify (one-click launch is now safe; explicit scope display optional). See [`228-…`](./228-be-bug-f-005-backfill-admin-cabinet-scope-security.md) §5.

**Net: 0 blockers for normal FE development.** Open BE-side items: **BE-BUG-1** (O4 marking-code persistence — operational confirmation; ticket #227) and **#229** (orders history endpoints 500 on UUID — blocks the optional orderId→UUID cleanup; re-verified still 500 on build 09:35:56). **F-005 resolved** (2026-07-13); F-001 needs no FE change (no-op); F-004 needs no FE change.

---

## Canonical closure addendum — 2026-07-13 (after G002–G004)

This addendum preserves the validation chronology above but supersedes its current local-code status. The [canonical corpus ledger](./AUDIT-2026-07-13.md) governs conflicts.

| Scope | Current local state | External boundary |
|---|---|---|
| **#227 / BE-BUG-1** | ✅ Code/migrations complete: PATCH persists a cabinet-scoped encrypted copy and detail returns authorized `markingMeta`. Marking-only `maxRetries=0` has one-PUT timeout/429/500/503 proof. The 2026-07-15 read-only scan inspected 1,999/1,999 eligible rows across one cabinet and ended `SAFE_NO_CANDIDATE`; dispatch/WB/DB mutations were 0/0/0. See [safety evidence](../../../.omx/ultragoal/evidence/G227-marking-roundtrip-safety.md), [final review](../../../.omx/ultragoal/evidence/G227-code-reviewer.md), and [UltraQA](../../../.omx/ultragoal/evidence/G227-ultraqa-report.md). | Still `external-validation`, not resolved. Authorization is unconsumed; a real PATCH→GET may be validated only when a safe exact already-filled candidate exists. No real PATCH is claimed. |
| **#229** | ✅ Code-complete: UUID and numeric identifiers work for detail/history/WB-history/full-history; malformed, unknown, overflow, and foreign IDs return uniform non-leaking 404. See [G003](../../../.omx/ultragoal/evidence/G003-227-229-implementation.md). | Deployment and live reprobe remain external; the earlier live 500 evidence describes the older build. |
| **#228 / F-005** | ✅ Preserved and verified; cabinet scope/RBAC remains fail-closed. | Deployment state is not inferred from local tests. |
| **Notification timezone** | ✅ Preserved and verified for validation, persistence/defaulting, and round-trip compatibility. | Deployment/live validation remains external. |
| **#165** | ✅ Approved read-only check returned `anomaly_count=0`; no repair created. See [G004](../../../.omx/ultragoal/evidence/G004-165-price-anomaly.md). | A separate production scan is not claimed. |

Accordingly, #227 is no longer an open **local implementation** item but remains the sole `external-validation` item. #229 is runtime-resolved under the later canonical ledger. No real WB marking mutation was performed for #227.
