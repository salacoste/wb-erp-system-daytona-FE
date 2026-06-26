# 213 — finance-summary: `net_profit_after_tax` / `net_profit_after_all_tax` violate accounting invariants (dashboard «Чистая прибыль» overstates by ~457k)

**Status**: ✅ RESOLVED (dashboard path) — fixed + verified live 2026-06-24. Persistence/root-cause + sibling consumers tracked as follow-up below.
**Severity**: **CRITICAL** — the main dashboard hero «Чистая прибыль» tells the owner they earned **+445 588,51 ₽** when the same week's operating profit is **−11 584,91 ₽** (a loss). Direct, money-level data-trust failure for Owner & CFO.
**Found**: `/loop` UX validation (iter-7/8, 2026-06-24), Playwright capture of `GET /v1/analytics/weekly/finance-summary?week=2026-W25` against live backend :3000, test cabinet `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`.
**Endpoint**: `GET /v1/analytics/weekly/finance-summary?week=2026-W25`
**Related**: #63 (operating-profit formula — Resolved, does NOT cover the tax/net-profit fields); #212 (fbs-enhanced 500, unrelated)

## Problem

For week **2026-W25**, `summary_total` returns mutually inconsistent profit figures:

| Field                          | Value           | Role                                                                                                            |
| ------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------- |
| `operating_profit_analytical`  | **−11 584,91**  | full 9-expense operating profit (revenue − COGS − commission − logistics − storage − acquiring − penalties − …) |
| `operating_margin_pct`         | **−2,63 %**     | operating margin                                                                                                |
| `tax.net_profit_after_tax`     | **+303 878,81** | "profit after income tax"                                                                                       |
| `tax.net_profit_after_all_tax` | **+445 588,51** | "profit after УСН + НДС" — **this is what the dashboard «Чистая прибыль» hero shows** (cabinet is a VAT payer)  |
| `tax.tax_amount`               | 35 856,04       |                                                                                                                 |
| `tax.vat_payable`              | 29 880,03       |                                                                                                                 |
| `tax.revenue_excl_vat`         | 597 600,68      |                                                                                                                 |
| `tax.effective_tax_rate`       | 6               |                                                                                                                 |

**Three accounting-invariant violations:**

1. `net_profit_after_tax` (+303 878,81) **> `operating_profit_analytical` (−11 584,91)** — impossible: net = operating − tax ≤ operating.
2. `net_profit_after_all_tax` (+445 588,51) **> `operating_profit_analytical` (−11 584,91)** — same impossibility.
3. `net_profit_after_all_tax` (+445 588,51) **> `net_profit_after_tax` (+303 878,81)** — backwards: subtracting MORE tax (УСН **+** НДС) must yield ≤ subtracting less (УСН only).

Net profit exceeding operating profit by ~457 000 ₽ means the tax/net-profit fields are computed on a base that **omits the WB deductions** (commission, logistics, storage, acquiring, penalties, etc.) that `operating_profit_analytical` correctly subtracts.

## Root Cause (backend — to confirm)

The `net_profit_after_tax` / `net_profit_after_all_tax` computation does not start from `operating_profit_analytical`. Hypothesis: it is computed as `revenue_excl_vat − cogs − (tax + vat)` (or similar narrow base), skipping the WB deduction expenses — so it "adds back" ~457 000 ₽ of deductions. The VAT-vs-income ordering (violation #3) also suggests the УСН/НДС branches are mis-sequenced or use different bases.

Service to inspect: the finance-summary / tax computation that emits `summary_total.tax.*` (likely in `src/analytics/services/` — finance-mapping / a tax service; cross-check against `operating_profit_analytical` from `margin-calculation.service.ts`/`cogs-calculation.service.ts`).

**Secondary**: the underlying figures also changed across captures minutes apart (e.g. `net_profit_after_all_tax` was 189 651,45 then 445 588,51; `operating_profit_analytical` 7 000,8 then −11 584,91) — the invariant holds in both, but the volatility suggests live re-processing/re-import during the session; verify idempotency separately.

## Impact

- **Owner sees «Чистая прибыль +445 588,51 ₽ · 74,6 %» on the main dashboard while actually operating at a ~−11 585 ₽ loss** — the single most important number in the product is wrong by ~457 000 ₽ and wrong in SIGN.
- CFO cannot reconcile the dashboard to the SKU/unit-economics operating-margin pages (which show negative margin). Every downstream surface trusting `net_profit_after_tax*` is affected.
- FE behavior is **correct** — `NetProfitCard` + `getNetProfit()` (`frontend/src/lib/tax-display-helpers.ts:45-46`) faithfully display `tax.net_profit_after_all_tax` for a VAT payer. No FE change needed once the backend field is correct.

## Reproduction

1. Login with a seeded test user (`<test-user-email>` / `<redacted-password>`) → cabinet auto-selected.
2. `GET http://localhost:3000/v1/analytics/weekly/finance-summary?week=2026-W25` with `Authorization: Bearer <jwt>` + `X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e`.
3. Compare `summary_total.tax.net_profit_after_all_tax` vs `summary_total.operating_profit_analytical` → observe net > operating (and net_after_all_tax > net_after_tax).
4. Open `/dashboard?week=2026-W25&type=week` → hero «Чистая прибыль» shows the inflated `net_profit_after_all_tax`.

## Fix Scope (backend)

1. Recompute `net_profit_after_tax` and `net_profit_after_all_tax` **starting from `operating_profit_analytical`**: `net_after_tax = operating − УСН`; `net_after_all_tax = operating − УСН − НДС`. Enforce `net_after_all_tax ≤ net_after_tax ≤ operating_profit`.
2. Add a unit/regression test asserting the invariant `net_after_all_tax ≤ net_after_tax ≤ operating_profit_analytical` (fails today).
3. Investigate the cross-capture volatility (idempotency of the tax calc under re-import).

## Resolution

**FIXED (dashboard finance-summary path) — 2026-06-24.** Net-profit-after-tax fields now
recompute at query time from `operating_profit_analytical` (full COGS + all WB deductions),
not the narrow persisted tax base. COGS-complete operating profit is only known at query
time (COGS assigned post-import), so the fix lives in the mapper, not persistence.

**Live verification** — `GET /v1/analytics/weekly/finance-summary?week=2026-W25`, cabinet
`f75836f7-…`, after `npm run rebuild`:

| Field | Before (bug) | After (fixed) |
|-------|-------------|---------------|
| `tax.net_profit_after_all_tax` | +445 588,51 | **−77 320,98** |
| `tax.net_profit_after_tax` | +303 878,81 | **−47 440,95** |
| `operating_profit_analytical` | −11 584,91 | −11 584,91 |

Invariant `net_after_all_tax ≤ net_after_tax ≤ operating_profit`: **holds**. Stable across
two captures ~20s apart (incidentally sidesteps BE-4 drift for these fields — recomputed
fresh per request).

**Changed code:**
- `src/analytics/services/margin-calculation.types.ts` — new pure `computeNetProfitAfterTaxes(operating, incomeTax, vatPayable)`.
- `src/analytics/services/finance-mapping.service.ts` — `mapTotalToDto()` recomputes both fields (top-level + `tax` block) from `operating_profit_analytical`; null-operating → persisted legacy fallback.
- Tests: `margin-calculation.types.spec.ts` (invariant regression with the exact #213 figures) + `finance-mapping.service.spec.ts` (VAT / non-VAT / null-operating mapper cases).

**QA gate:** tsc clean; ESLint clean; analytics+tax+aggregation sweep 142 suites / 2946 tests green; 2-pass adversarial review (fresh contexts) APPROVE.

**Follow-up (out of scope here — separate ticket):**
1. **Persistence / root cause** — `tax-calculation.service.ts` (`sumExpenses` omits commission/acquiring/loyalty/wb-services; `cogs:0`) still WRITES the buggy narrow-base value to `weekly_payout_total`. Fixing it at the source makes every consumer correct; note it also changes the USN-15 tax base ⇒ needs accounting sign-off.
2. **Sibling consumers still reading persisted value:**
   - ✅ `comparison-analytics.service.ts` (`GET /v1/analytics/weekly/comparison`) — **DONE (2026-06-24):** now sums `operating_profit_rub` and recomputes `net_profit_after_tax` via `computeNetProfitAfterTaxes`, gated to single-week periods (`start === end`; multi-week falls back to persisted because the tax fetch is single-week-scoped). Verified live (W25 net_after_tax −47 440,95 ≤ operating).
   - ⬜ `tax-preliminary.service.ts` (`net_profit_after_all_tax` preview) — **by-design limited, transparency improved (2026-06-25):** preliminary uses daily data with no `weekly_margin_fact` yet, so no authoritative operating base exists — `net_profit_after_all_tax` stays a rough estimate. Added `hasCommission: false` to `data_completeness` so the response explicitly flags that WB commission (the largest daily-unavailable expense) is excluded. No invariant fix possible without the weekly data.

The FE defensive indicator (FE-1, `isNetProfitConsistent()`) stays as belt-and-suspenders;
it will simply stop firing once data is consistent.
