# Story 64.4-FE: Fix Валовая прибыль Formula — Use payout_total

**Epic**: [64-FE UI Validation & Business Logic Fixes](./README.md)
**Status**: ✅ Complete
**Completed**: 2026-02-21
**Priority**: P0 (Critical)
**Points**: 3

---

## User Story

**As a** seller viewing the Dashboard
**I want** Валовая прибыль to show my actual profit after all WB deductions
**So that** I can make informed business decisions based on real numbers

---

## Background

The Dashboard "Валовая прибыль" metric used `sale_gross_total - cogs_total` (retail price minus COGS). This overstated profit by 3-5x because it ignored WB commissions (~68K), logistics (~24K), storage (~1.5K), and other deductions.

**Example (W06)**:
- Dashboard showed: +137,515₽ profit
- Reality: -7,231₽ (actual LOSS)
- Seller sees "profit" when they're losing money

The PnLWaterfall component already used the correct formula (`payout_total - cogs_total`).

---

## Acceptance Criteria

### AC1: Gross profit uses payout_total
Given the dashboard loads with finance data
When Валовая прибыль card is displayed
Then it shows `payout_total - cogs_total` (not `sale_gross_total - cogs_total`)

### AC2: Margin uses operating margin formula
Given the dashboard loads with finance data
When Маржинальность card is displayed
Then it shows `(payout_total - cogs_total) / sale_gross_total * 100`

---

## Technical Implementation

### File: `src/hooks-v1/financial/aggregation.ts`

Changed both single-week and multi-week aggregation:
- `gross_profit = payout_total - cogs_total` (was: `sale_gross_total - cogs_total`)
- `margin_pct = (payout_total - cogs_total) / sale_gross_total * 100` (was: `(sale_gross_total - cogs_total) / sale_gross_total * 100`)
- Added `payout_total != null` guard to conditions

### Files Modified
| File | Change |
|------|--------|
| `src/hooks-v1/financial/aggregation.ts` | Changed formula: `sale_gross` → `payout_total` for profit calculation |
| `src/components/custom/dashboard/GrossProfitCard.tsx` | Updated component comment |
| `src/components/custom/dashboard/MarginCard.tsx` | Updated tooltip to "Операционная маржа" |

---

## Definition of Done
- [x] Валовая прибыль = payout_total - cogs_total
- [x] Маржинальность = (payout_total - cogs_total) / sale_gross_total * 100
- [x] TypeScript compiles without errors
- [x] Consistent with PnLWaterfall calculation

*Created: 2026-02-21*
