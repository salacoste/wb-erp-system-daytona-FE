# BE-BUGS-A.md — Cluster A validation (COGS/Products), 2026-07-05/06

Append-only handoff log of backend-owned defects from Cluster A (COGS/Products) validation against live BE (`:3000`, cabinet `f75836f7-…-a1f3508cce8e`). Self-contained for the BE team.

---

## BE-A-1 — Bulk COGS assignment unusable: `nm_id` rejected as string (must be integer)

- **Endpoint:** `POST /v1/products/cogs/bulk?format=v2`
- **Severity:** 🔴 **BLOCKING** — the entire bulk-COGS feature is unusable end-to-end. Preview «Подтвердить» → 400 every time; products NOT persisted; no redirect to /cogs; no success toast.
- **Repro:**
  ```bash
  TOKEN=$(cat /tmp/feval-token); CAB=$(cat /tmp/feval-cab)
  curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"nm_id":"202867769","unit_cost_rub":150,"valid_from":"2026-07-06","source":"manual"}]}' \
    "http://localhost:3000/v1/products/cogs/bulk?format=v2"
  ```
- **Response:**
  ```
  HTTP/1.1 400 BAD_REQUEST
  {"error":{"code":"BAD_REQUEST","details":[{"issue":"items.0.nm_id must be an integer number"}]}}
  ```
- **Expected:** `2xx` with persisted COGS (the same body with `nm_id:202867769` integer → 202 ✅, persisted — verified).
- **Actual:** 400 every time because FE sends `nm_id` as a **string** (`BulkCogsItem.nm_id: string`, `src/types/cogs/cogs-bulk.ts:16`); BE validator demands an integer.
- **Owner ambiguity (pick one):**
  - (a) **BE** widens the validator to accept string-or-integer `nm_id`; OR
  - (b) **FE** changes `BulkCogsItem.nm_id` to `number` + `createBulkCogsItems` parses (recommended — type-honesty + aligns with the codebase; single-assign uses the URL path so it's unaffected).
- **Secondary contract drift (informational, resolved in BE's favor):** BE also rejects `currency` ("property currency should not exist") and requires `source` (non-empty string). FE already sends `source:'manual'` and omits `currency` when undefined, so once `nm_id` type is fixed the payload is accepted.
- **✅ RESOLVED FE-side (2026-07-10) — option (b), refined:** FE converts `nm_id` string→integer at the POST wire boundary. Refinement on the doc's option (b): the FE domain model KEEPS `nm_id: string` everywhere (anti-pattern #10, `product.ts:7` "nm_id is STRING (not number)" — a global switch to `number` would break `Set<string>` selection + URL interpolation in 4+ bulk-COGS components). New wire types `BulkCogsWireItem`/`BulkCogsWireRequest` (`nm_id: number`) + pure converters `toBulkCogsWireItem`/`toBulkCogsWireRequest` in `useBulkCogsAssignment-utils.ts`, applied at the hook's `apiClient.post` (Boundary Normalizer Pattern). Single-assign path unaffected (nm_id in URL path). Converter unit tests + a hook-level test asserting the POST body carries numeric `nm_id`. 2-pass adversarial review (both APPROVE, 0 CRITICAL/HIGH); gates type-check 0 / eslint 0 / vitest 17207. **Option (a) (BE widens validator) is still welcome and not mutually exclusive**, but no longer blocking — bulk COGS is unblocked.

## BE-A-2 (candidate) — Degenerate `last_sales_margin_pct = 100.0` returned for no-COGS weeks

- **Endpoint:** `GET /v1/products?include_cogs=true` (COGS-coverage fields)
- **Severity:** 🟡 Low (FE-rendered as a «100,0 %» hint; the SKU/brand pages handle cogs=0 correctly with «—»).
- **Issue:** For weeks/products with no COGS assigned, the field returns `100.0` (margin with zero COGS → 100 %). Misleading if surfaced as a real margin. BE should return `null` when `cogs_total=0` (or `cogs_coverage_pct==0`), not a degenerate 100 %.
- **Repro:** any product with no COGS in the current week → `last_sales_margin_pct: 100.0`.
