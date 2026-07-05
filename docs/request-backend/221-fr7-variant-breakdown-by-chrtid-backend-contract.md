# Backend Contract — FR-7 Variant Breakdown on /v1/analytics/weekly/by-variant

**Status:** ✅ Backend LIVE on single-week `GET /v1/analytics/weekly/by-variant` (Request #221).
**Date:** 2026-06-30
**Implements:** #221 → unblocks the «По цветомоделям» (by variant) breakdown tab.
**For:** Frontend — start integration now (read "v1 boundaries" first).

> FR-7 ships a new breakdown dimension (variant = color × size, keyed by `chrt_id`). The nm-level P&L fields are **identical** in name / shape / nullability to contract **#219/#220** (already live on `/weekly/by-sku|by-brand|by-category` and `/sku-financials`) — they are simply carried from the variant's parent `nm_id`. No new field names were invented for the nm-level columns.
>
> Auth/isolation unchanged: `Authorization: Bearer <jwt>` + `X-Cabinet-Id: <uuid>` + ownership verified. Roles Manager/Owner/Analyst.

---

## Endpoint + flags

```
GET /v1/analytics/weekly/by-variant?week=YYYY-Www
```

Single-week only. Range mode (`weekStart`+`weekEnd`) returns **400** (`UNSUPPORTED_MODE` — "by-variant supports single-week queries only"); range parity is a documented Phase-1 boundary, not yet implemented. Cursor pagination (`?cursor=…&limit=…`, default 100, cap 1000). Optional `?report_type=` passthrough (defaults to `total` — one full-value row per nm/week; never SUM across report_type).

The variant dimension table (`product_variants`) is populated automatically by the existing product-sync from each WB card's `sizes[].chrtID` — **FE does not trigger sync**.

---

## ProductVariant model (FE-queryable metadata)

Source table `product_variants` (Phase 0, populated by product-sync):

| Column | Type | Meaning |
|---|---|---|
| `cabinetId` | UUID | Cabinet scope (strict isolation). |
| `nmId` | BigInt | Parent product card (nomenclature). |
| `chrtId` | Int | WB variant ID (= color × techSize combo). Unique per `(cabinetId, chrtId)`. |
| `imtId` | BigInt? | Card linking ID. |
| `techSize` | String? | Technical size (e.g. "42"). |
| `colorName` | String? | Color (e.g. "Чёрный"). Card-level, applied to every variant of the card. |
| `barcode` | String? | First non-empty barcode from WB `skus[]`. |

A variant with **no** `product_variants` row is still returned by the endpoint with `metadata_pending=true` and `color_name`/`tech_size` null — never dropped (grouping is on `orders_fbs.chrt_id`, not on the metadata table).

---

## Response fields (each `data[]` item — `VariantAnalyticsDto`)

### Variant identity + FBS revenue/units
| Field | Meaning | Notes |
|---|---|---|
| `chrt_id` | WB variant ID | number. Source: `orders_fbs.chrt_id`. |
| `nm_id` | Parent nomenclature ID | number (BigInt-coerced). Drives the nm-level margin LEFT JOIN. |
| `color_name` | Variant color | `string \| null`. Null when no metadata row. |
| `tech_size` | Variant technical size | `string \| null`. Null when no metadata row. |
| `metadata_pending` | No metadata row found | boolean. Row still returned (stale-name fallback). |
| `revenue_net` | Net revenue for the variant in-week, ₽ | number. `SUM(orders_fbs.sale_price) GROUP BY chrt_id`. FBS-sourced. |
| `total_units` | Units (orders) in-week | number. `COUNT(*)` per-order rows (qty=1 each). |

### nm-level P&L fields (carried from the parent nm via `weekly_margin_fact`, `report_type='total'`)
Identical to #219/#220 — `revenue_gross`, `profit`, `margin_pct`, `operating_profit`, `cogs`, `total_expenses`, `operating_margin_pct`, `has_revenue`. All `?: number \| null` — **null (never 0)** when no margin fact row exists for the nm in this week. Render `—` (anti-pattern #8).

### FR-7 Phase 2 — per-variant allocated profit/margin (APPROXIMATE / распределено)
| Field | Meaning | Notes |
|---|---|---|
| `profit_allocated_rub` | Variant profit allocated from the **nm-level** operating profit by the variant's revenue share | APPROXIMATE — `nm_operating_profit × (variant.revenue_net / Σ variant.revenue_net for the nm_id)`. Σ across variants ≈ nm `operating_profit`. Null when variant revenue ≤ 0 or nm has no operating profit. |
| `margin_allocated_pct` | `profit_allocated_rub / variant revenue_net × 100` | APPROXIMATE. Null when variant revenue ≤ 0. |

Allocation runs over the **FULL (unpaginated)** variant set BEFORE the cursor slice, so the per-nm revenue denominator is the whole cabinet (stable across pages). `nm_id=0` (cabinet-fee sentinel) and phantom nms are excluded from the denominator → their variants get null allocation.

---

## v1 boundaries (read before integrating)

1. **Single-week only.** `?week=YYYY-Www`. Range mode (`weekStart`+`weekEnd`) → 400 (`UNSUPPORTED_MODE`). No range parity yet.
2. **FBS-sourced revenue.** Variant revenue/units come from `orders_fbs.chrt_id` — **FBO-only nms have no variant rows and are naturally excluded** (the SQL only sees FBS chrt_ids). Do not interpret an absent variant as zero FBO demand.
3. **`margin_allocated_pct` / `profit_allocated_rub` are approximate (распределено).** Revenue-share heuristic from the nm-level operating profit — NOT audited exact finance. Σ across variants reconciles to the nm `operating_profit`; individual rows are an allocation, not a measured per-variant P&L.
4. **Variant metadata is sync-driven.** `color_name`/`tech_size` populate when product-sync runs (automatic, piggybacks the existing WB card fetch — no extra cron). Until first sync, variants surface as `metadata_pending=true` with null color/size.
5. **Money/ratio fields are null (never 0)** when N/A — render `—`, never `0,0 %` (anti-pattern #8).

---

## FE integration

With this endpoint live, FE can add the «По цветомоделям» tab mirroring the by-brand/by-category table structure (`MarginAggregatedTableRow` pattern). Row key = `chrt_id`; group columns: `color_name` / `tech_size`. Carry the nm-level parity columns (FR-2..FR-5) from #219/#220 unchanged, plus the two Phase-2 allocated columns (clearly labeled approximate/распределено). Cursor pagination reuses the existing `next_cursor` / `has_more` contract.

---

## Verification

- Backend: `npm run rebuild` GREEN; `src/analytics` jest suite GREEN (covers mapping, pagination, cursor tuple filter, null-not-0, Phase-2 revenue-share allocation Σ reconciliation, full-set-before-slice stability). Unit tests in `src/analytics/services/__tests__/variant-analytics.service.spec.ts`.
- The nm-level P&L math is NOT duplicated: `VariantAnalyticsService` LEFT JOINs `weekly_margin_fact` (report_type='total') — same source as `/weekly/by-sku`.
- Phase-0 variant extraction/upsert spec: `src/products/services/__tests__/product-sync-variants.spec.ts` (chrtId extraction, sentinel drop, idempotent upsert, cabinetId scoping).
