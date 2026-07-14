# Validation Finding Resolutions — 2026-07-07

**Scope:** Two findings from `REPORT.md` (P0 financial pages, 2026-07-05) re-verified with live evidence and resolved as **non-bugs** (false premises). Source code is correct; only clarifying comments + this doc were added.

**Cabinet:** W26 (`f75836f7-…-a1f3508cce8e`) · **BE:** live `:3000` · **Date:** 2026-07-07

---

## BE-1 — `/v1/analytics/liquidity/trends` is NOT dead code

**Original claim:** endpoint → 404; FE `getLiquidityTrends` hook + normalizer are dead code or target an unshipped endpoint.

### Live evidence
- `GET /v1/analytics/liquidity/trends?period=30` → **HTTP 200**, body:
  ```json
  {"meta":{...},"trends":[],"insights":[{"type":"info","message":"Historical liquidity snapshots are not yet collected; the trend series is empty. Tracked by Story 29.4."}]}
  ```
- `test-api/API-INDEX.md:2569` — `LiquidityController_getLiquidityTrends` is registered (auth yes, cabinet yes).

### Conclusion
The endpoint is **live** and returns an empty series on purpose — daily liquidity snapshots are not yet persisted; backend **Story 29.4** tracks that work. The original "→ 404" was a misread (likely an unauthenticated 401 or stale build).

The FE stack is correct live-scaffolding, not dead code:
- `src/lib/api/liquidity.ts` — `getLiquidityTrends`
- `src/lib/api/liquidity-normalizer.ts` — normalizer
- `src/hooks/useLiquidity.ts` — `useLiquidityTrends` + `usePrefetchLiquidityTrends`

No UI component consumes the trends hook yet — by design, pending Story 29.4 data (only `useLiquidity` is consumed by `analytics/liquidity/page.tsx`).

### Action taken
- Added an informational comment above `useLiquidityTrends` and `usePrefetchLiquidityTrends` in `src/hooks/useLiquidity.ts` (no bare `TODO`).
- No code / mocks / tests removed.
- **Status → `verified — not dead code`.**

---

## BD-9-pending — «Прочие удержания (WB сервисы)» 0 ₽ is CORRECT

**Original claim:** the card shows 0 ₽, field binding unverified; the cited `wb_services_cost_total=47 281` "wasn't in live `finance-summary`."

### Live evidence (finance-summary, W26, summary_total scope)
| Field | Value |
|---|---|
| `wb_jam_cost_total` | `0` |
| `wb_other_services_cost_total` | `0` |
| `wb_promotion_cost_total` | `47 281` |
| `wb_services_cost_total` | `47 281` (= promotion + jam + other) |

The "47 281" figure the report couldn't locate **IS present** — as `wb_promotion_cost_total` (and the sum `wb_services_cost_total`). The original audit looked at the wrong field.

### Conclusion
The card `OtherDeductionsCard` (`src/components/custom/dashboard/OtherDeductionsCard.tsx`) **intentionally reads only** `jamCost` (`wb_jam_cost_total`) + `otherServicesCost` (`wb_other_services_cost_total`), **excluding promotion** — because promotion (47 281) is rendered in its **own** separate Promotion/Advertising card to avoid double-counting. Props are sourced at `src/app/(dashboard)/dashboard/components/dashboardGridProps.ts:53-54` (`wb_jam_cost_total ?? undefined`, `wb_other_services_cost_total ?? undefined`).

So the displayed **0 ₽ is a genuine, accurate zero** for W26 (no Jam, no other-service deductions; promotion lives elsewhere). Field binding is **correct**.

### Action taken
- Added an informational comment to the `OtherDeductionsCard.tsx` file header explaining the exclusion of promotion and that 0 ₽ is genuine.
- Rendering logic unchanged.
- **Status → `verified — not a bug`.**

---

## Files touched
- `src/hooks/useLiquidity.ts` — 2 clarifying comments (informational).
- `src/components/custom/dashboard/OtherDeductionsCard.tsx` — file-header clarifying comment.
- `.omc/validation/2026-07-05/REPORT.md` — BD-9-pending + BE-1 status cells updated.
- `.omc/validation/2026-07-05/RESOLUTIONS-2026-07-07.md` — this doc (new).
