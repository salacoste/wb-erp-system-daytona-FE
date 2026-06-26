# BE-6 — Brand/Subject Ingest Epic (Scope)

> Status: **Mechanism complete (2026-06-25); dry-run shows 0-impact for current cabinet data.** Gated backfill (`a3769bbd`) + daily cron (`ecfd23a6`) landed behind `ENABLE_FINANCE_BRAND_ENRICHMENT` (default OFF, byte-safe). **Dry-run 2026-06-25: 0 rows would fill** — the ~23% `wb_finance_raw` brand-null is EXCLUSIVELY `nm_id=0` fee/service rows (excluded by the backfill's `nm_id<>0` clause; not product rows), and the only eligible gap (40 rows) traces to 4 `products` that are brand-less at the WB Content API source (unenrichable). So BE-6 yields **zero** for THIS cabinet until data with an enrichable gap appears; the original "repair ~14.8k NULL rows" premise overcounted by including excluded `nm_id=0` rows. Ingest-time enrich-on-write + Excel parity still deferred pending the A-vs-B decision.
> Related: commit `77a5162e` (fixed the analytics-side `sku-financials` brand/category join drift — a JS bug; this epic closes the underlying **data gap** that commit explicitly defers).

## Problem
SKU-level brand/category analytics (`by-brand`, `by-category`, `sku-financials`) render "Unknown" for a large fraction of SKUs because brand/subject is sourced from `wb_finance_raw`, where the WB **Finances** API leaves them **NULL ~22–23%** of the time — even though the authoritative `products` table (populated from the WB **Content** API `getCardsList`) is near-complete (**0% subject-null, ~6% brand-null**).

## Coverage (local `wb_repricer`, read-only probe)

| Table | Rows | brand NULL | subject/category NULL |
|---|---|---|---|
| `products` | 68 | 4 (6%) | 0 (0%) |
| `wb_finance_raw` | 66,005 | 14,889 (23%) | 14,849 (22%) |
| `wb_finance_raw` (doc_type='sale') | 12,606 | 915 (7.3%) | 910 (7.2%) |
| `weekly_margin_fact` | 2,367 | 183 (8%) | 168 (7%) |

**Join reliability:** only **1** nm_id in `wb_finance_raw` is missing from `products`; 19 products have no finance activity. A `wb_finance_raw ↔ products` join on `(nm_id, cabinet_id)` closes the gap with near-zero row loss.

## Drift root cause (`git show 77a5162e`)
`getStorageOnlySkus` built `productInfoMap` from `$queryRaw` where bigint `nm_id` arrives as a **string at runtime** (despite the `number` TS annotation), then looked it up with a numeric `nmId` → every lookup missed → fallback to `null` ("Unknown · Unknown"). Fix was `Number()` coercion on both sides (`sku-financials-data.service.ts:196,200`). The commit message itself states the dominant remaining cause is the **data gap**: *"wb_finance_raw.brand/subject ~100% NULL at source … a true fix needs ingesting brand/subject from the WB Content/Products API (separate epic)."*

**Source of truth** = WB Content API `getCardsList` (the product master card), NOT the WB Finances API (a transaction feed that carries brand/subject inconsistently).

## WB source of truth
`sdk.products.getCardsList()` (`POST /content/v2/get/cards/list`) — already used by `ProductSyncService`.
- Card field paths (`WbProductCard`, `product-sync.helpers.ts:29-38`): **`card.brand`** + **`card.subjectName`**.
- Pitfalls: `nmID` (capital ID); `brand` (lowercase, NOT `brandName`); `subjectName` (NOT `subject`/`object`/`category` — `object` is always empty).
- Rate limit: 10 req/min, 6s between calls, batch 100 (`product-sync.service.ts:50,106`).
- Do NOT use `createProductsProduct` (Analytics v2) for this — heavier payload, different field names (`brandName`).

## Owner decision (blocks implementation): Option A vs B
- **Option A (recommended) — enrich `wb_finance_raw` on write + backfill.** Brand/subject fall back to the `products` value when the WB Finances row omits them. Fixes all 4 analytics surfaces (margin_fact, by-brand, by-category, sku-financials) with **zero analytics-side code changes**. Trade-off: `wb_finance_raw` diverges from a verbatim WB mirror.
- **Option B — join `products` at analytics read time** (`margin-calculation.service.ts:272-273`, sku-financials/by-brand/by-category SQL). Keeps `wb_finance_raw` a faithful WB copy. Trade-off: higher blast radius (4 query surfaces).

Choose A unless the owner requires `wb_finance_raw` to stay a verbatim WB copy.

## Proposed implementation (Option A)
1. **Ingest enrichment**: in the finance ingest processor that owns the Prisma tx, add a per-batch `products` lookup cache (nmId → {brand, subject}) and apply brand/subject fallback before `createMany`/upsert. (The pure transformer `wb-api-transformer.service.ts:149-150` has no DB access, so the fallback lives in the processor.)
2. **Excel parity**: apply the same fallback in `excel-parser.service.ts:385-386,444-445` (else Excel-sourced imports keep the gap).
3. **One-time gated backfill** for ~14.8k existing NULL rows — mirror the **gated-reconcile pattern** already in the codebase (`FEATURE_NET_PROFIT_RECONCILE` in `weekly-payout-persistence.service.ts` / `tax-backfill.service.ts`), behind a new flag e.g. `ENABLE_FINANCE_BRAND_ENRICHMENT` (precedent: `product-backfill.service.ts:398`). SQL-level UPDATE scoped by `cabinet_id`:
   ```sql
   UPDATE wb_finance_raw w
   SET brand = p.brand
   FROM products p
   WHERE w.nm_id = p.nm_id AND w.cabinet_id = p.cabinet_id
     AND (w.brand IS NULL OR w.brand = '') AND p.brand IS NOT NULL;
   -- repeat for subject = p.subject
   ```
4. **No new daily pipeline** — enrichment rides existing `finances_weekly_ingest`; `product_sync` already runs daily 07:00 MSK keeping `products` fresh.

## Schema / index
- No migration: `wb_finance_raw` already has `brand`/`subject`; `products` has `@@unique([nmId, cabinetId])` (`schema.prisma:157`) → join already indexed.
- No normalization (Russian subject names stored raw consistently — non-goal).

## Acceptance criteria
1. After a finance ingest with enrichment ON, `wb_finance_raw` brand/subject NULL rate drops from ~23% to ≤ `products` NULL rate (~6% brand / 0% subject).
2. For any nmId in `products`, a finance row whose WB payload omitted brand is persisted with `products.brand` (regression test).
3. `weekly_margin_fact` brand/category NULL rate drops 8% → ≤1% after a margin recalc.
4. `by-brand` / `by-category` show no "Unknown" bucket for nmIds present in `products`.
5. sku-financials storage-only SKUs no longer "Unknown · Unknown" for nmIds in `products`.
6. Backfill is idempotent (re-run → 0 updates) and flag-gated (disabled = no behavior change).
7. Existing finance-ingest + product-sync specs stay green; new unit test for the enrichment fallback.

## Risks / unknowns
- **Probe required (pre-implementation):** confirm `getCardsList` populates `brand`/`subjectName` for (near-)all nmIds in the live cabinet. The 4 brand-null `products` rows may be genuinely empty at WB source (unenrichable) or stale. Run: `SELECT nm_id, brand, subject, updated_at FROM products WHERE brand IS NULL OR brand='';` then a one-off `getCardsList` for those nmIds.
- **Cross-cabinet nm_id collision:** the fallback join MUST scope by `cabinet_id` (a product from cabinet X must not fill cabinet Y's finance row). The backfill SQL above already does; the ingest-time lookup must too.
- **BIGINT join pitfall (BE-3/BE-6 class):** any JS-side join on nm_id must `Number()`-coerce both sides (the exact bug `77a5162e` fixed). Prefer SQL-level join to avoid re-introducing the bigint-as-string hazard.
- **Excel ingest parity:** must apply fallback in both WB-API and Excel paths.
- **phantom rows:** exclude `nm_id=0` and `'UNKNOWN'` sa_name from enrichment (consistent with `sku-financials-data.service.ts:111` and `orphaned-product-backfill.ts`).

## Size: **M**
No schema migration, no new daily pipeline, authority source already wired. Work = (1) ingest-path enrichment + per-batch product cache, (2) gated idempotent backfill mirroring existing pattern, (3) Excel parity, (4) tests + verification probe. "M" (not "S") for the A-vs-B decision, cross-cabinet scoping care, and BIGINT-join hazard avoidance.

## References
- `prisma/schema.prisma:142-162` — Product model.
- `src/products/services/product-sync.service.ts:91-196,264` + `product-sync.helpers.ts:29-38,134-158` — `getCardsList` + `WbProductCard` mapping.
- `src/products/services/product-backfill.service.ts:148-156,205-336,398` — COGS backfill + `ENABLE_PRODUCT_ENRICHMENT` flag precedent.
- `src/imports/transformers/wb-api-transformer.service.ts:145-150` — wb_finance_raw brand/subject ingest (WB Finances API).
- `src/imports/parsers/excel-parser.service.ts:385-386,444-445` — excel brand/subject ingest (parity gap).
- `src/analytics/services/margin-calculation.service.ts:272-273`, `margin-revenue-query.service.ts:61-62,77-78`, `margin-expenses.service.ts:60-63,92-93` — brand/subject read from wb_finance_raw into weekly_margin_fact.
- `src/analytics/services/breakdown-analytics-query.service.ts:149,347` — by-brand/by-category GROUP BY.
- `src/analytics/services/sku-financials-data.service.ts:84-87,156-226` — sku-financials brand/subject + `77a5162e` bigint fix.
- `src/monitoring/pipeline-registry.ts:123-132`, `src/queue/queue.config.ts:135-153`, `src/monitoring/monitoring.types.ts:25` — `product_sync` already wired.
- `src/products/helpers/orphaned-product-backfill.ts` — orphaned nm_id detection pattern (reusable; note bigint nmId).
