# Epic 64-FE: UI Validation & Business Logic Fixes

**Status**: ✅ Complete
**Priority**: P0
**Sprint**: Validation Sprint (2026-02-21)

## Summary

Fixes discovered during deep UI validation on 2026-02-21 (see `docs/VALIDATION-PLAN.md`).
Covers 3 API integration bugs, 2 critical business logic issues, 1 medium data source issue, and 1 low-priority label clarification.

## Stories

| # | Story | Severity | Status |
|---|-------|----------|--------|
| 64.1 | Fix liquidity API — remove `include_liquidation_scenarios` param | API Bug | ✅ |
| 64.2 | Fix time-period API — remove `includeCogs` param | API Bug | ✅ |
| 64.3 | Fix supplies API — remove `sort_by`/`sort_order` params | API Bug | ✅ |
| 64.4 | Fix Валовая прибыль formula (sale_gross → payout_total) | Critical | ✅ |
| 64.5 | Fix Маржинальность formula (same root cause as 64.4) | Critical | ✅ |
| 64.6 | Fix Выкупы шт — use finance-summary product_transactions | Medium | ✅ |
| 64.7 | Clarify Удержания WB tooltip — specify excluded items | Low | ✅ |

## Impact

- **3 broken pages unblocked**: liquidity, time-period, supplies
- **Critical profit display fixed**: W06 showed +137K profit when actual was -7.2K loss
- **Margin accuracy**: 70.1% → ~20% (actual operating margin)
- **Buyout count**: 167 → 187 (now includes FBS+EAEU)
