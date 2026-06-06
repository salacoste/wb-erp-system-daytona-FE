# #197 — Funnel: buyoutCount ≫ ordersCount → impossible >100% сквозная конверсия

**Status**: RESOLVED (2026-06-06) — Documented as WB attribution quirk (cross-source). Backend surfaces meta.totalConversionApproximate + meta.buyoutCrossSource flags. Frontend FunnelAnomalyIndicator handles it per Defensive Frontend Principle.
**Reported**: 2026-06-03 (iter-74 validation loop)
**Page**: `/analytics/funnel` (Marketing Funnel, Epic 68)
**Related**: distinct from [#191](./191-FUNNEL-DAY-SERIES-FLAT-IDENTICAL.md) (flat daily series + buyoutConversion formula) — this is the **monotonicity / >100% conversion** defect.
**Severity**: HIGH (impossible values surfaced in summary card + per-SKU table)
**Frontend status**: FE now INDICATES the anomaly (AlertTriangle + tooltip, raw value preserved — Defensive Frontend Principle, commit forthcoming). This ticket tracks the **backend** root cause.

---

## Problem

`GET /v1/analytics/funnel` returns `buyoutCount` aggregated on a different basis than `ordersCount` / `openCardCount`, producing an impossible non-monotonic funnel and >100% сквозная конверсия:

- **Summary** (range 2026-05-04..06-02): `{ openCardCount: 2307, ordersCount: 140, buyoutCount: 3141, totalConversion: 136.15 }` — `buyoutCount` is **22× ordersCount**, and `totalConversion = buyoutCount/openCardCount × 100 = 136.15%` (> 100%, impossible).
- **Per-product** (nmId 887604577): `{ ordersCount: 65, buyoutCount: 1428, totalConversion: 288.48 }` — 288% conversion.
- A healthy funnel must be monotonically decreasing: `openCardCount ≥ addToCartCount ≥ ordersCount ≥ buyoutCount`, and every conversion ≤ 100%. Here `buyoutCount > ordersCount` breaks monotonicity.

Live data shows `cartConversion` (16.25%) and `orderConversion` (6.07%) ARE sane — only the **buyout-derived** `totalConversion` is corrupt, confirming the defect is isolated to `buyoutCount` aggregation.

## Likely root cause

`buyoutCount` (and `buyoutSumRub`) appear to be aggregated over a wider window or joined at a different grain than `ordersCount` / `openCardCount` (which look single-period). The buyout figures are period-cumulative while orders/openings are not — so they don't share a denominator.

## Ask

1. Aggregate `buyoutCount` / `buyoutSumRub` on the **same basis** (period + grain) as `ordersCount` / `openCardCount`, so `buyoutCount ≤ ordersCount` and `totalConversion ≤ 100%`.
2. Confirm the canonical formula for `totalConversion` (buyout / openCard) and `buyoutConversion` (buyout / orders) — see #191 §formula-mismatch (the two tickets are adjacent; #191 covers the daily-series flatness + buyoutConversion formula inconsistency, this one covers the count inflation).

## Reproduction

```bash
TOKEN=...  # from e2e/.auth/user.json
CAB=f75836f7-c0bc-4b2c-823c-a1f3508cce8e
H=(-H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB")
curl -s "${H[@]}" "http://localhost:3000/v1/analytics/funnel?from=2026-05-04&to=2026-06-02" \
  | jq '{openCardCount,ordersCount,buyoutCount,totalConversion}'
# → buyoutCount 3141 > ordersCount 140; totalConversion 136.15 (>100)
```

## Frontend disposition

FE renders an AlertTriangle + tooltip next to `totalConversion` in the summary card and the SKU table when `totalConversion > 100 || buyoutCount > ordersCount`, preserving the raw value (never clamped) — `funnel-anomaly.ts` / `FunnelAnomalyIndicator.tsx`. **Deferred FE follow-up** (queued, not in this commit): the optional `FunnelOverlayChart` (behind the default-off "Показать график" toggle) visualizes `buyoutCount` as a stage taller than `ordersCount` (inverted funnel) with no indicator — add a chart-level banner when any rendered day is anomalous.
