# Story 64.6-FE: Fix Выкупы шт — Use finance-summary Data

**Epic**: [64-FE UI Validation & Business Logic Fixes](./README.md)
**Status**: ✅ Complete
**Completed**: 2026-02-21
**Priority**: P1 (Medium)
**Points**: 2

---

## User Story

**As a** seller viewing the Dashboard
**I want** the buyout count to include all sales channels
**So that** I see the accurate number of products sold

---

## Background

Dashboard showed 167 buyouts using `fulfillment.fbo.salesCount` (FBO only). The actual number from finance-summary `product_transactions` was 187. The 20 missing items were EAEU + FBS sales that the fulfillment API didn't include.

---

## Acceptance Criteria

### AC1: Buyout count includes all channels
Given the dashboard loads
When "Выкупы, шт" is displayed
Then it shows `product_transactions` from finance-summary (all channels)

---

## Technical Implementation

### Files Modified
| File | Change |
|------|--------|
| `src/types/finance-summary.ts` | Added `product_transactions?: number` field |
| `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` | Changed `salesCount` from `fbo.salesCount + fbs.salesCount` to `product_transactions` from finance-summary |

---

## Definition of Done
- [x] Выкупы шт matches finance-summary product_transactions
- [x] TypeScript compiles without errors

*Created: 2026-02-21*
