# 191 — Funnel `groupBy=day` returns flat byte-identical daily rows (fabricated granularity)

**Status**: OPEN
**Severity**: CRITICAL (data integrity — chart shows fabricated per-day trend)
**Filed**: 2026-06-02 (frontend validation iter-59)
**Endpoint**: `GET /v1/analytics/funnel?groupBy=day`
**Frontend page**: `/analytics/funnel` (Epic 68) — `FunnelOverlayChart` day-series overlay

---

## Problem

When the funnel endpoint is queried with `groupBy=day`, **every day in the range returns byte-identical metrics**. The frontend day-series chart (`FunnelPageContent.tsx` → `useFunnelTimeSeries` → `FunnelOverlayChart`, `funnel-overlay-config.ts:37-48`) plots these as a per-day trend line — but the line is perfectly flat because every point is the same value. This presents a fabricated daily granularity to the user: it looks like real per-day data but is the period aggregate stamped across each day.

## Evidence (live, cabinet `f75836f7-…`, range `2026-05-04..2026-06-02`)

- 28 days returned; **all 28 rows have identical** `openCard / orders / buyout / conversions` triples (`distinct count-triples: 1 of 28`).
- Each day: `openCard 2307, orders 140, buyout 131` — and `28 × 2307 = 64596` = the SUMMARY `openCard` exactly. So the backend is dividing/broadcasting the period total flatly, not computing real per-day values.
- By contrast `groupBy=product` returns correctly differentiated per-SKU rows (that path is fine).

## Impact

- The `/analytics/funnel` daily overlay chart is **misleading**: a flat line implies "no day-to-day variation," when in reality there is no daily breakdown at all.
- Users analysing funnel trends over time draw false conclusions (e.g. "conversion is perfectly stable").

## Secondary finding (MED, same endpoint)

`buyoutConversion` does **not** match its documented formula `buyoutCount / ordersCount * 100`:
- per-SKU nmId 887604577: backend `buyoutConversion = 94`, but `1423/1820 = 78.19%`.
- summary: backend `75.36`, but `3126/3920 = 79.74%`.
- day-row reports `93.57` (= `131/140`, matches the formula) — so the definition is **inconsistent between aggregation levels**.
All OTHER conversion fields (cart/order/total/cancelRate) match their formulas exactly. Not currently rendered in summary cards/table (only a sort key), so low visual impact — but the definition should be reconciled.

## Requested fix (backend)

1. `groupBy=day` must return genuine per-day funnel metrics (real daily `openCard/addToCart/orders/buyout` from the source daily data), OR — if daily granularity is genuinely unavailable — return an explicit marker (e.g. `dailyGranularityAvailable: false`) so the frontend can suppress the misleading flat chart and show an honest "daily breakdown unavailable" state instead.
2. Reconcile `buyoutConversion` to a single documented formula across summary / per-day / per-SKU aggregations.

## Frontend interim

The FE renders faithfully what the backend sends (no FE bug). Pending this fix, a defensive FE option is to detect all-identical day rows and render a "per-day data unavailable" notice instead of a fake-flat line — deferred pending the backend decision on (1) above.
