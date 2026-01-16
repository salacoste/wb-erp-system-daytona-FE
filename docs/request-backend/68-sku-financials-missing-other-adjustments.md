# Request #68: SKU Financials Missing other_adjustments

**Date**: 2025-12-21
**Status**: ✅ COMPLETED
**Completed**: 2025-12-21
**Priority**: HIGH
**Related**: Request #65, #66, #67 (Operating Margin Consistency)

## Problem

SKU page and Category page show **dramatically different** operating margins for the same period (W50):
- **SKU page**: 46.8% operating margin
- **Category page**: 21.82% operating margin

This is a **25 percentage point discrepancy** for the same data.

## Root Cause Analysis

### API Comparison

| Endpoint | operating_profit | other_adjustments | Formula |
|----------|------------------|-------------------|---------|
| `/v1/analytics/sku-financials` | 71,739₽ | **NOT included** | gross - (logistics + storage + penalties + paid_acceptance) |
| `/v1/analytics/weekly/by-category` | 33,427₽ | **38,469₽ included** | gross - (logistics + storage + penalties + paid_acceptance + other_adjustments) |

### Detailed Breakdown

**SKU Financials API (`/v1/analytics/sku-financials`)**:
```json
{
  "totals": {
    "revenue_net": 153188.49,
    "gross_profit": 99562.49,
    "total_operating_expenses": 27823.52,  // Missing other_adjustments!
    "operating_profit": 71738.97,
    "operating_margin_pct": 46.83
  }
}
```

**Category API (`/v1/analytics/weekly/by-category`)**:
```
total_revenue_net: 155,595.43
total_operating_profit: 33,426.92
total_other_adjustments: 38,469.01  ← This IS subtracted
calculated_margin: 21.48%
```

### Formula Inconsistency

The `other_adjustments` field (~38,469₽ for W50) represents "Прочие удержания" from WB:
- Corrections
- Other adjustments
- Various WB deductions

This is a **real expense** that should be included in operating profit calculation.

## Expected Behavior

Both endpoints should use the **same formula**:

```
operating_profit = revenue_net - cogs - logistics - storage - penalties - paid_acceptance - other_adjustments
```

Or equivalently:
```
operating_profit = gross_profit - total_operating_expenses
where:
  total_operating_expenses = logistics + storage + penalties + paid_acceptance + other_adjustments
```

## Impact

1. **User confusion**: Same products show different profitability on different pages
2. **Data integrity**: Management decisions based on inconsistent data
3. **Dashboard mismatch**: KPIs don't reconcile between views

## Suggested Fix

Update `sku-financials.service.ts` to include `other_adjustments` in `total_operating_expenses`:

```typescript
// Current (WRONG):
total_operating_expenses = logistics_cost + storage_cost + penalties + paid_acceptance

// Should be:
total_operating_expenses = logistics_cost + storage_cost + penalties + paid_acceptance + other_adjustments
```

## Implementation (2025-12-21)

### Backend Changes

**1. Response DTO** (`src/analytics/dto/response/sku-financials-response.dto.ts`):
- Added `other_adjustments` field to `ExpensesDto` (per-SKU)
- Added `other_adjustments` field to `SkuFinancialsTotalsDto` (totals)

**2. Service** (`src/analytics/services/sku-financials.service.ts`):
- Added `getCabinetLevelOtherAdjustments()` - fetches total from `weekly_payout_summary`
- Added `distributeOtherAdjustments()` - distributes proportionally by SKU revenue
- Updated `calculateSkuFinancials()` - includes `other_adjustments` in operating expenses
- Updated `calculateTotals()` - sums distributed `other_adjustments`

**Distribution Algorithm**:
```typescript
// Proportional distribution by revenue (same as margin-calculation.service.ts)
const totalRevenue = transactions.reduce((sum, tx) => sum + Math.abs(tx.net_for_pay), 0);
const otherAdjustments = (Math.abs(tx.net_for_pay) / totalRevenue) * cabinetOtherAdjustments;
```

### Frontend Changes

**1. Types** (`frontend/src/types/sku-financials.ts`):
- Added `otherAdjustments: number` to `SkuFinancialCosts` interface
- Updated `getTotalOperatingExpenses()` helper to include `otherAdjustments`

**2. Hook** (`frontend/src/hooks/useSkuFinancials.ts`):
- Added `other_adjustments` to `BackendExpenses` interface
- Updated transformation to map `other_adjustments` → `otherAdjustments`

### Formula After Fix

```
total_operating_expenses = logistics + storage + penalties + paid_acceptance + other_adjustments
operating_profit = gross_profit - total_operating_expenses
operating_margin_pct = (operating_profit / revenue_net) * 100
```

## Verification

After fix:
- SKU page margin ≈ Category page margin (for same period)
- Both should show ~21-22% for W50
- Difference attributable only to rounding and SKU-level COGS availability

## Related Documentation

- [Request #65: Operating Margin Consistency](./65-operating-margin-consistency-category-brand.md)
- [Request #66: Storage Source Unification](./66-storage-source-unification.md)
- [docs/63-operating-profit-formula-clarification.md](../docs/request-backend/63-operating-profit-formula-clarification.md)
