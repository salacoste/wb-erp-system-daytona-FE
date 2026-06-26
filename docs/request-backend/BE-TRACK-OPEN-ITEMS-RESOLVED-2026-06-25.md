# BE-Track Open Items — RESOLVED (2026-06-25)

> Definitive resolution of the 3 remaining "open" BE-track items, with evidence.
> All merged to `main` (`0b06c39b`). **None require new code** — each was a perceived blocker that resolves under rigorous verification.

---

## 1. #213 for USN-15 cabinets — RESOLVED (accounting-safe) ✅

**Was listed as:** "Activation requires accounting sign-off (changes USN-15 tax base)."

**Reality (code-verified):** The `FEATURE_NET_PROFIT_RECONCILE` flag's write-side reconcile **does not change the tax**. The gated block updates **only** `net_profit_after_tax` / `net_profit_after_all_tax`:

- `weekly-payout-persistence.service.ts` reconcile → `tx.weeklyPayoutTotal.update({ data: { netProfitAfterTax, netProfitAfterAllTax } })` (no `taxAmount`/`taxBase`/`effectiveRate`).
- `tax-backfill.service.ts` reconcile → overrides only `netProfitAfterTax` / `netProfitAfterAllTax`.

`tax_amount` / `tax_base` / `effective_tax_rate` are set by the **tax engine** (`calculateTaxFields` → `taxResult`) in the main upsert — **always, regardless of the flag**. The reconcile then recomputes `net_profit = operating_profit − tax_amount` using that **existing, unchanged** `tax_amount`.

**Conclusion:** Enabling `FEATURE_NET_PROFIT_RECONCILE` is **accounting-safe for ALL tax systems** (USN-6 and USN-15) — it never alters the tax owed, only corrects the net-profit-after-tax display. The "accounting sign-off" concern applied to a *deeper, separate* fix (widening `sumExpenses` in `tax-calculation.service.ts`, which would change the USN-15 tax base) — **that fix was deliberately NOT done** and remains the only true accounting-gated item.

**Action:** Flag may be enabled globally. (Currently ON in dev for the USN-6 cabinet; safe for any USN-15 cabinet.)

---

## 2. BE-6 "Unknown" brand/category — RESOLVED (0 enrichable gap) ✅

**Was listed as:** "Ingest-time enrich-on-write needs A/B architectural decision."

**Reality (data-verified):** There is **no enrichable brand/subject gap** for this cabinet.

- `wb_finance_raw` brand-null rows that have a matching `products` row **with a non-empty brand**: **0** (dry-run, cycle 12). The ~23% brand-null in `wb_finance_raw` is **exclusively `nm_id=0`** (fee/service rows, excluded from all product analytics via `nm_id <> 0`).
- Residual "Unknown" in `weekly_margin_fact`: 61 rows (brand) / 56 (category) across **4 products** — and those 4 products have `products.brand = NULL` at the **WB Content API source** (`getCardsList` returns no brand for them).

**Conclusion:** BE-6 (enrich from `products`) **cannot fix** the residual "Unknown" — the 4 products are brand-less at the WB source. The backend correctly surfaces what WB provides. The ingest-time enrich-on-write (Option A) would be **plumbing for a non-existent gap** (0 rows to enrich). The gated backfill (`a3769bbd`) + cron (`ecfd23a6`) remain as a safety net for future cabinets with a real gap, but for this cabinet there is nothing to do.

**Action for frontend:** If by-brand/by-category shows ~4 products as "Unknown" — that's because those SKUs have no brand on WB. Not a backend defect. (The analytics-side join drift was already fixed in `77a5162e`.)

---

## 3. Partial-week scoping (sale_dt vs report_id) — RESOLVED (transient) ✅

**Was listed as:** "Persisted (backfill, sale_dt) may diverge from dashboard (aggregation, report_id) on the open week."

**Reality:** The divergence is **only on the in-progress (partial) week**. For complete weeks, `sale_dt` (ISO-week) and `report_id` scoping converge (verified: W18–W24 match exactly). When the partial week closes and re-aggregates, the values align.

Per the business rule ("USN-6 = 6% of what the client paid" → `sale_dt` = when the client paid), the backfill's `sale_dt` scoping is **correct**; the dashboard's `report_id` (WB processing date) is the WB-report view. Neither is "wrong" — they're two valid week definitions that differ only while a week is still open.

**Conclusion:** Not a bug. Transient artifact on the open week. No action. (Aligning the aggregation to `sale_dt` globally would be a major redesign affecting all weekly grouping — not justified for a transient partial-week divergence, and would arguably move away from the WB-report semantics the dashboard uses.)

---

## Summary

All 3 "open" items are **closed**: #213 is accounting-safe (enableable globally), BE-6 has 0 enrichable gap (residual is WB-source), scoping is transient. The BE-track work is complete and verified end-to-end (full suite 10,414/0; capstone W20 financial chain reconciles exactly). No outstanding backend code work remains for these items.
