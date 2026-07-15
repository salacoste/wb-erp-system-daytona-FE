# Request #227 — BE-BUG-1: O4 marking-code (Честный ЗНАК) write-back persistence

**Status:** ⚠️ Code and migrations complete; real WB PATCH→GET intentionally not executed under the read-only cabinet policy (2026-07-15). FE contract is available; the only remaining item is an explicitly authorized real WB write confirmation.
**Severity:** 🟠 non-blocking contract; user-facing feature depends on persisted write-back.
**Parent validation record:** [`226-validation-2026-07-be-status-and-outstanding.md`](./226-validation-2026-07-be-status-and-outstanding.md) §2.1 + "Update — BE verification results" (2026-07-13, BE-BUG-1).
**Endpoint:** `PATCH /v1/orders/:orderUuid/meta`

---

## 1. Problem

The O4 FE feature («Код маркировки» / Честный ЗНАК) writes a marking code to an order via `PATCH /v1/orders/:orderUuid/meta` with body `{ metaType: "IMEI" | "GTIN" | "SGTIN" | "UIN", value: string(1..200) }`.

The **write contract** is verified green (2026-07-11 live re-val + 2026-07-13 BE code re-val):
- accepts the UUID path param (not just the numeric WB orderId);
- validates the `{metaType, value}` body (a fake UUID yields 404, contract OK — not the original 400/500);
- proxies the write to the WB SDK and returns `{ updated: true }`;
- returns a diagnosable 502 on WB error.

**Persistence cannot be confirmed.** A PATCH → GET smoke-test cannot prove the marking code was actually saved, because:
1. BE proxies the write to Wildberries — there is **no local source-of-truth** for the marking code;
2. `GET /v1/orders/:id` does **not** return `metaType` / `value`, so the FE cannot read back what it wrote.

This is the **single remaining operational item** from the 2026-07 validation cycle (15/16 confirmed; this is the 16th).

## 2. Root cause

The marking code is treated as write-only (fire-and-forget to WB). There is no locally persisted copy and no read-back path, so the FE has no way to verify a successful save or to display the currently-saved marking code on subsequent views.

## 3. Impact

- **User-facing:** O4 is a shipped FE feature. Without confirmed persistence, the FE cannot confidently render "saved" state, and a user who re-opens an order cannot see the marking code they previously entered.
- **Silent-failure risk:** if WB silently rejects/drops the write, the FE shows success (`{ updated: true }`) while the marking code never persisted — undetectable today.

## 4. What we need from BE (one of)

1. **Preferred — persist locally as source-of-truth:** store `metaType` + `value` on the order record (DB) so the write is durable independent of WB, **and** return them in `GET /v1/orders/:id`. The FE can then read back and display the saved marking code.
2. **Alternative — echo in GET:** if WB remains the source of truth, include `metaType` + `value` in the `GET /v1/orders/:id` response (proxied read-back from WB) so the FE can verify persistence after write.

Either option unblocks confident FE ship of O4 with verified save state. A one-line reply suffices: *"real-order write-back persists — confirmed"* / *"still flaky, trace=…"* (see resolution template in #226).

## 5. Reproduction

```bash
BASE=http://localhost:3000
# TOKEN = owner JWT; CAB = cabinet id; H = "-H Authorization:Bearer $TOKEN -H X-Cabinet-Id:$CAB"
# (full env in parent record #226)

# 1. Write a marking code to a REAL order
curl -s -X PATCH $H -H 'Content-Type: application/json' \
  -d '{"metaType":"GTIN","value":"0123456789012"}' \
  $BASE/v1/orders/<real-order-uuid>/meta        # expect 200 {"updated":true}

# 2. Read it back — currently returns NO metaType/value (the gap)
curl -s $BASE/v1/orders/<real-order-uuid> $H     # metaType/value absent → cannot confirm persistence
```

## 6. Acceptance

- After PATCH, a subsequent `GET /v1/orders/:id` returns the `metaType` + `value` just written (option 1 or 2).
- A smoke-test on a real WB order confirms the round-trip end-to-end.

## 7. References

- Parent: [`226-validation-2026-07-be-status-and-outstanding.md`](./226-validation-2026-07-be-status-and-outstanding.md) §2.1 + "Update — BE verification results" (BE-BUG-1).
- FE write client: PATCH `/v1/orders/:orderUuid/meta` in `src/lib/api/orders-actions.ts` (`updateOrderMeta`); order UUID = `order.id` (OrderFbsItem), not the WB `orderId`.

---

## Current implementation addendum — 2026-07-13

**Current status:** ✅ **Code-complete locally; external validation remains.** The historical “no local source-of-truth” diagnosis above is superseded in the current worktree. The PATCH flow now validates and cabinet-scopes the order, encrypts the value before the external mutation, calls the type-specific WB SDK method, and after WB success persists only ciphertext through a cabinet-and-order-scoped write. `GET /v1/orders/:id` exposes the latest authorized value as nullable `markingMeta`; list and history routes do not select or decrypt it. Upstream, encryption, persistence, count-zero, corrupt-ciphertext, tenant-isolation, and secret-canary cases are covered by passing tests.

Governing evidence: [G003 — #227 encrypted persistence and #229 preservation](../../../.omx/ultragoal/evidence/G003-227-229-implementation.md) and the [canonical corpus ledger](./AUDIT-2026-07-13.md).

**Post-merge validation — 2026-07-15:** both marking migrations are already applied in the configured database, and the complete 43-migration chain deployed successfully to a disposable PostgreSQL database. The configured database currently contains zero plaintext `meta_details` rows and zero encrypted marking rows, so no existing marking value was available for a GET-only readback check.

**Still external:** a real WB marking mutation and PATCH→GET round-trip. This was deliberately **not** attempted: the available WB cabinet is restricted to read-only validation, and this endpoint writes both to WB and the database. Explicit write authorization is required before performing that final smoke test.
