# Request #221: FR-7 — Variant Breakdown (по Цветомодели / цвет / размер)

**Date**: 2026-06-30
**Priority**: Medium (strategic — the LAST WB competitor-parity gap)
**Status**: 🔵 OPEN — backend scoping needed
**Component**: Backend — Analytics (new aggregation dimension)
**Requester**: Frontend Team
**Related**: Competitor parity spec §3-A (fields F,G + лист «по Цветомодели»), FR-7

---

## Summary

The competitor offers a **«по Цветомодели»** (by variant) P&L breakdown — 39 rows, 57 fields — alongside the existing by-SKU / by-brand / by-category views. We have **no variant dimension** in the analytics model. WB orders already carry `chrtId` (the variant identifier — color/size), so the **raw data exists**; it needs to be aggregated into a new breakdown dimension.

## What the competitor shows

A variant-level breakdown (each row = a цветомодель / color-size combo), with the same P&L fields as by-SKU (revenue, profit, margin, COGS, expenses, + FR-2..FR-5 parity fields). This lets the owner see **which color/size variant drives profit** within a product card.

## Data source

- `chrtId` exists on `orders_fbs` (OrderFbs) + WB API order data. Each `chrtId` = a specific color/size variant within an `nmId` (product card).
- Variant metadata (color name, size name) may need to be fetched from the WB Products API (`getCardsList` / `getCardsListWarehouse`) — the `imtId` → `chrtId` → color/size mapping.
- The finance/margin data (`weekly_margin_fact`, `wb_finance_raw`) is currently aggregated by `nmId` (product card), NOT by `chrtId` (variant). The aggregation pipeline would need a `chrtId` dimension.

## Ask

Add a variant-level analytics breakdown:

```
GET /v1/analytics/weekly/by-variant?week=YYYY-Www
  → [{ chrtId, nmId, color, size, revenue_net, profit, margin_pct, ...same fields as by-sku }]
```

OR: extend the existing `/weekly/by-sku` with an optional `?group_by=variant` param that groups by `chrtId` instead of `nmId`.

## Open questions (for backend / PM)

1. **Variant metadata**: does the WB Products API (`getCardsList`) expose the `chrtId` → color/size mapping? Is it already stored (e.g., in a `products` table)? Or needs a one-time fetch + sync?
2. **Finance data at variant level**: `weekly_margin_fact` is keyed by `nmId`. Is per-`chrtId` revenue/cogs feasible (would the import pipeline need to split by `chrtId`)? OR can we approximate (split `nmId` totals by `chrtId` revenue share from orders)?
3. **Scope**: full variant P&L (all fields) vs just revenue/qty/sales by variant (lighter)?

## FE acceptance

Once the backend serves variant-level data, the FE adds a «По цветомоделям» tab/page (mirroring the existing by-brand/by-category table structure — the `MarginAggregatedTableRow` pattern). The variant dimension (chrtId/color/size) replaces brand/category as the row key. All FR-2..FR-5 columns would apply (they're already on the aggregated tables).

## Note

This is the **only remaining WB competitor-parity gap** (FR-1..FR-5 shipped; FR-6 multi-platform excluded; FR-7 = this). It's strategic (needs a variant data model) but the raw `chrtId` exists — it's a wiring/aggregation task, not new data collection.
