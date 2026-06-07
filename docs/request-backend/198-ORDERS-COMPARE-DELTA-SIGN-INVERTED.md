# #198 — Orders /compare: delta sign + base inverted (growth shown as decline)

**Status**: RESOLVED (2026-06-06) — Delta now uses `current - previous` convention; percent divides by previous value (explicit #198 comment in code)
**Reported**: 2026-06-03 (iter-74 validation loop)
**Page**: `/analytics/orders` → Comparison tab (`ComparisonTable.tsx`)
**Severity**: CRITICAL (the Comparison tab shows the OPPOSITE trend direction to reality)
**Frontend status**: FE delta logic (green-up / red-down) is CORRECT given a correct sign — do NOT patch the FE to flip it (would erase evidence AND break the already-correct rows, see below).

---

## Problem

`GET /v1/analytics/orders/compare` computes period deltas with an inverted base and sign. Live evidence (cabinet `f75836f7-…cce8e`, current vs previous period):

- period1 (current) = **485** orders; period2 (previous) = **209** orders → the current period **GREW +132%**.
- Response: `ordersChange: -276`, `ordersChangePercent: -56.91`, `revenueChangePercent: -67.57`.
- The page renders a **RED ↓ −56,9%** (DeltaIndicator treats <0 as decline) — i.e. it shows a **decline** for a period that more than doubled.

The backend appears to compute `(period2 − period1) / period1` (previous minus current, over current) instead of the correct `(current − previous) / previous`.

### Internal inconsistency (do not "fix" in FE)

`avgOrderValueChange: -163` while `avgOrderValue` went 497 → 660 (**+163**). So the AOV delta is **correctly signed** (+) in magnitude but the change field is negative — meaning the response mixes conventions across fields. Flipping the sign in the FE would correct `ordersChange`/`revenueChange` but BREAK `avgOrderValueChange` (which is already directionally consistent with +163 magnitude). The defect must be fixed at the source so all fields share one convention.

## Ask

Compute every `*Change` / `*ChangePercent` as **`current − previous`** (absolute) and **`(current − previous) / previous × 100`** (percent), consistently across `orders`, `revenue`, and `avgOrderValue`. After the fix: 209→485 must yield `ordersChange: +276`, `ordersChangePercent: +132.06`.

## Reproduction

```bash
TOKEN=...  # from e2e/.auth/user.json
CAB=f75836f7-c0bc-4b2c-823c-a1f3508cce8e
H=(-H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB")
curl -s "${H[@]}" "http://localhost:3000/v1/analytics/orders/compare?...periods..." \
  | jq '{ordersChange, ordersChangePercent, revenueChangePercent, avgOrderValueChange}'
# → ordersChangePercent: -56.91  (should be +132.06 for 209→485)
```

## Frontend disposition

No FE change — `DeltaIndicator` (green-up/red-down) is correct for a correctly-signed delta. Once the backend uses `(current − previous)/previous` consistently, the Comparison tab renders the right direction with no FE edit. (Cosmetic NBSP/locale nits on the delta/percent labels are tracked separately in the validation tracker, not here.)
