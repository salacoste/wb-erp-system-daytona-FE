# BE-BUGS-F.md — Cluster F (Settings/Monitoring/Auth/Onboarding + Automation) BE-owned bugs
**Validated:** 2026-07-06 · cabinet `f75836f7-…-a1f3508cce8e` · role=owner
**Scope:** BE-side contract drift / validation gaps surfaced during Cluster-F FE validation. FE-owned bugs (BD-FE-*) live in the per-page docs, not here.

---

## BE-BUG-F-001 — `PUT /v1/notifications/preferences` rejects `quiet_hours.timezone` (round-trip mismatch)
- **Endpoint:** `PUT /v1/notifications/preferences`
- **Request:** `{ "preferences": {...}, "language":"ru", "quiet_hours": {"enabled":false, "from":"23:00", "to":"07:00", "timezone":"Europe/Moscow"} }`
- **Response (400):**
  ```json
  {"error":{"code":"BAD_REQUEST","message":"Validation failed","details":[{"issue":"quiet_hours.property timezone should not exist","message":"quiet_hours.property timezone should not exist"}],"trace_id":"9dace82c-e9d2-4185-a030-797fdfd80087"}}
  ```
- **Expected:** Either accept `timezone` (it's in the GET response) or omit it from GET.
- **Actual:** GET returns `quiet_hours.timezone:"Europe/Moscow"`; PUT rejects the same field → round-trip impossible without FE stripping it.
- **Repro:** `curl -X PUT -H "Authorization: Bearer $T" -H "X-Cabinet-Id: $C" -H "Content-Type: application/json" -d '{"preferences":{"task_completed":true,"task_failed":true,"task_stalled":true,"daily_digest":false,"digest_time":"09:00"},"language":"ru","quiet_hours":{"enabled":false,"from":"23:00","to":"07:00","timezone":"Europe/Moscow"}}' http://localhost:3000/v1/notifications/preferences`
- **Workaround:** FE omits `timezone` → 200 (confirmed).
- **Impact:** Preferences form (Telegram-bound users) would fail to save if FE round-trips the GET shape. Currently masked because the FE preferences section is gated behind Telegram binding (unbound in this cabinet).
- **Trace:** `9dace82c-e9d2-4185-a030-797fdfd80087`

---

## BE-BUG-F-002 — `/v1/expenses*` serializes `amount` as raw Prisma `Decimal` JSON object (non-portable)
- **Endpoints:** `GET /v1/expenses?month=…`, `GET /v1/expenses/summary`, (write endpoints return the same shape)
- **Response sample:**
  ```json
  { "id":"…", "category":"rent", "amount": {"s":1,"e":4,"d":[15000]}, "month":"2026-07", … }
  ```
- **Expected:** `amount` as a JSON number or string (portable, per open-api contract).
- **Actual:** `amount` is the Prisma `Decimal.toJSON()` internal shape `{s:sign, e:exponent, d:digits[]}`. Same applies to `summary.total` and `summary.byCategory.*`.
- **Repro:** `curl -s -H "Authorization: Bearer $T" -H "X-Cabinet-Id: $C" "http://localhost:3000/v1/expenses/summary?from=2026-01&to=2026-06" | python3 -m json.tool`
- **Impact:** FE `toExpenseAmount` (`Number({s,e,d})`) → NaN → renders «не число ₽» (see BD-FE-003). Any non-Prisma client breaks.
- **Fix:** Configure Prisma to serialize Decimal as string, or run an output interceptor. (`Prisma.extendFieldType('Decimal', { stringify: true })` in newer Prisma, or a custom JSON interceptor.)

---

## BE-BUG-F-003 — `PUT /v1/cabinets/:id` rejects `vatRate:null` but GET returns null for non-VAT-payers
- **Endpoint:** `PUT /v1/cabinets/:id`
- **Request:** `{ "taxSystem":"usn15", "taxRate":15, "vatPayer":false, "vatRate":null }` (the exact GET shape for a non-VAT-payer)
- **Response (400):**
  ```json
  {"error":{"code":"BAD_REQUEST","message":"Validation failed","details":[{"field":"vatRate","issue":"be one of the following values: 0, 5, 20, 22"},{"field":"vatRate","issue":"be a number conforming to the specified constraints"}]}}
  ```
- **Expected:** PUT accepts `vatRate:null` when `vatPayer:false` (and stores null internally — which it already does).
- **Actual:** GET returns `vatRate:null`; PUT rejects null; round-trip broken for every non-VAT-payer cabinet (the default).
- **Repro:** `curl -X PUT -H "Authorization: Bearer $T" -H "X-Cabinet-Id: $C" -H "Content-Type: application/json" -d '{"taxSystem":"usn6","taxRate":6,"vatPayer":false,"vatRate":null}' http://localhost:3000/v1/cabinets/$C`
- **Workaround:** FE sends `vatRate:0` → 200, BE then stores null. (FE doesn't do this yet — see BD-FE-004.)
- **Impact:** Tax settings form cannot save in the default cabinet state (couples with BD-FE-004).
- **Trace:** `d2799089-ebc5-4fc5-ba9e-19fa6a1c313f`

---

## BE-BUG-F-004 — `PUT /v1/tariffs/settings` requires role `admin` (Owner rejected)
- **Endpoint:** `PUT /v1/tariffs/settings`
- **Request:** (any valid tariff-settings body)
- **Response (403):**
  ```json
  {"error":{"code":"INSUFFICIENT_PERMISSIONS","message":"Required roles: admin. User role: owner"}}
  ```
- **Expected:** Owner (cabinet admin) can update tariffs — OR the FE page is role-gated to exclude Owner.
- **Actual:** GET works for owner; PUT requires a separate `admin` role the Owner JWT lacks. FE page (`/settings/tariffs`) admits Owner (`user?.role === 'Owner'`), so the owner sees the full editable form but every save 403s.
- **Repro:** `curl -X PUT -H "Authorization: Bearer $T" -H "X-Cabinet-Id: $C" -H "Content-Type: application/json" -d '{...valid settings...}' http://localhost:3000/v1/tariffs/settings`
- **Impact:** Tariffs page unusable by Owner (the highest standard role). Audit log + history stay empty (no PUT ever succeeds).
- **Trace:** `463ccb66-feb9-42f6-bae2-1d419c9199dd`
- **Fix (BE):** accept `owner` for tariffs write; OR (FE) role-gate the page to hide it from Owner. Recommend BE — Owner is the de-facto cabinet admin.

---

## BE-BUG-F-005 — `/v1/admin/backfill/*` role contract unclear (Owner can GET; start endpoint likely also admin-only)
- **Endpoints:** `GET /v1/admin/backfill/status` (200 for owner), `POST /v1/admin/backfill/start` (not exercised — would enqueue 365-day job)
- **Expected:** If owner can view the page, owner should be able to start a backfill.
- **Actual:** GET works for owner; start endpoint role requirement unverified (skipped — non-destructive policy). Given tariffs (BE-BUG-F-004) requires `admin`, backfill start probably does too.
- **Impact:** If confirmed, the «Запустить бэкфилл» button would 403 for Owner same as tariffs.
- **Action:** BE to confirm whether `admin` is required for `POST /v1/admin/backfill/start`; if yes, decide policy (allow owner, or FE-hide the button for owner).

---

## Summary table
| ID | Endpoint | Severity | Status |
|---|---|---|---|
| BE-BUG-F-001 | PUT /v1/notifications/preferences (timezone) | Medium | round-trip gap, masked by Telegram gate |
| BE-BUG-F-002 | GET /v1/expenses* (Decimal shape) | High | breaks expense display entirely |
| BE-BUG-F-003 | PUT /v1/cabinets/:id (vatRate null) | High | tax form unsaveable by default |
| BE-BUG-F-004 | PUT /v1/tariffs/settings (admin role) | High | tariffs unsaveable by Owner |
| BE-BUG-F-005 | POST /v1/admin/backfill/start (role?) | Medium | likely same as F-004; unconfirmed |
