# API Validation Report - Margin % and ROAS Data

**Date:** 2026-01-29
**Validation Method:** Direct API Testing
**Test Cabinet:** f75836f7-c0bc-4b2c-823c-a1f3508cce8e
**Test User:** test@test.com

---

## Executive Summary

### ✅ Finance Data: PRESENT
- Weekly finance summaries are available for weeks 2025-W45 through 2025-W49
- Sales revenue data is present (200K-300K RUB per week)
- **Issue:** COGS data is NULL → Margin % cannot be calculated

### ✅ Advertising Data: PRESENT
- 21 advertising campaigns found in database
- Total spend: 48,491.68 RUB
- Total revenue: 278,634 RUB
- Average ROAS: 5.75 (5.75x return on ad spend)
- **Issue:** Advertising analytics endpoint returns empty arrays for specific date ranges

---

## Detailed Findings

### 1. Finance Summary Data

#### Available Weeks (Last 5 Weeks)
```
Week       | Sale Gross Total | COGS Total | Gross Profit
-----------|------------------|------------|-------------
2025-W45   | 280,583.25 ₽     | NULL       | NULL
2025-W46   | 283,726.26 ₽     | NULL       | NULL
2025-W47   | 305,778.32 ₽     | NULL       | NULL
2025-W48   | 212,575.91 ₽     | NULL       | NULL
2025-W49   | 201,117.09 ₽     | NULL       | NULL
```

#### Key Fields Present (Week 2025-W47 Example)
```json
{
  "sale_gross_total": 305778.32,
  "to_pay_goods_total": 210052.51,
  "payout_total": 138981.68,
  "total_commission_rub_total": 96086.34,
  "logistics_cost_total": 36424.48,
  "storage_cost_total": 1763.35,
  "cogs_total": null,
  "gross_profit": null
}
```

**Issue:** `cogs_total` is NULL across all weeks → **Margin % cannot be calculated**

**Margin % Formula:**
```javascript
margin_pct = (gross_profit / sale_gross_total) * 100
gross_profit = sale_gross_total - cogs_total
```

Since `cogs_total` is NULL, `gross_profit` is NULL, and therefore `margin_pct` cannot be calculated.

### 2. Advertising Analytics Data

#### Overall Statistics (Year 2025)
```json
{
  "totalSpend": 48491.68,
  "totalRevenue": 278634,
  "totalProfit": 1804266.94,
  "totalProfitAfterAds": 1755775.26,
  "avgRoas": 5.75,
  "avgRoi": 36.21,
  "avgCtr": 6.15,
  "avgCpc": 16.57,
  "totalSales": 4115946.15,
  "totalOrganicSales": 3837312.15,
  "avgOrganicContribution": 93.23
}
```

#### Campaign Count
- **Total campaigns:** 21
- **Total spend:** 48,491.68 RUB
- **Average ROAS:** 5.75 (excellent efficiency)

#### Issue: Empty Response for Specific Date Ranges
```bash
# Request: Week 2025-W47 (Nov 18-24, 2025)
GET /v1/analytics/advertising?from=2025-11-18&to=2025-11-24&limit=1

Response:
{
  "items": [],
  "summary": {
    "totalSpend": 0,
    "totalRevenue": 0,
    "avgRoas": null
  }
}
```

**Problem:** Even though there are 21 campaigns with data, querying for specific weeks returns empty results.

### 3. Product Analytics Data

#### Products Table
- **Total products:** 57
- **Items returned:** 0 (pagination issue or data structure problem)

#### By-SKU Analytics (Week 2025-W47)
```bash
GET /v1/analytics/weekly/by-sku?week=2025-W47&includeCogs=true
Response:
{
  "items": [],
  "pagination": {
    "total": null
  }
}
```

**Problem:** No items returned despite having products in the database.

---

## Root Cause Analysis

### Issue 1: Margin % Not Showing
**Status:** ❌ **Backend Data Missing**

**Root Cause:**
1. COGS (Cost of Goods Sold) data has NOT been assigned to products
2. Without COGS, the backend cannot calculate:
   - `gross_profit` (sale_gross_total - cogs_total)
   - `margin_pct` (gross_profit / sale_gross_total * 100)

**Impact:** Dashboard cannot display Margin % metric

**Solution Required:**
1. Assign COGS to products via the COGS management UI
2. Trigger margin recalculation after COGS assignment
3. Backend will then populate `cogs_total` and `gross_profit` fields

### Issue 2: ROAS Showing "Нет данных за предыдущий период"
**Status:** ⚠️ **Backend Data Present, Query Issue**

**Root Cause:**
1. Advertising data EXISTS in the database (21 campaigns, 48K spend)
2. Advertising analytics endpoint returns empty arrays for specific date ranges
3. Possible causes:
   - Date range mismatch (ads might be from different weeks)
   - Campaign status filtering (only active campaigns?)
   - Data aggregation issue in the backend

**Impact:** Dashboard cannot display ROAS for the selected period

**Solution Required:**
1. Investigate advertising analytics endpoint query logic
2. Check date range filtering in `/v1/analytics/advertising`
3. Verify campaign status filtering (active vs all)
4. Check if advertising stats table has data for the queried weeks

---

## Recommendations

### For Margin % Issue
1. **Immediate:** Assign COGS to at least some products via COGS management UI
2. **Verification:** Re-query `/v1/analytics/weekly/finance-summary?week=2025-W47`
3. **Expected Result:** `cogs_total` should have a value, `gross_profit` should be calculated
4. **Dashboard:** Margin % should then appear on the dashboard

### For ROAS Issue
1. **Immediate:** Check advertising stats table for data by week
2. **Debug:** Test `/v1/analytics/advertising` with different date ranges
3. **Verify:** Confirm campaign date ranges align with queried weeks
4. **Backend:** May need to adjust query logic or date filtering

---

## Test Endpoints Used

```bash
# 1. Finance Summary
GET /v1/analytics/weekly/finance-summary?week=2025-W47
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}

# 2. Advertising Analytics
GET /v1/analytics/advertising?from=2025-11-18&to=2025-11-24
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}

# 3. By-SKU Analytics
GET /v1/analytics/weekly/by-sku?week=2025-W47&includeCogs=true
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}

# 4. Products
GET /v1/products?limit=5
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

---

## Conclusion

### Data Status on Backend

| Metric | Data Present | Issue | Action Required |
|--------|--------------|-------|-----------------|
| **Sales Revenue** | ✅ Yes | None | - |
| **COGS** | ❌ No | Not assigned to products | Assign COGS via UI |
| **Margin %** | ❌ No | Requires COGS | Assign COGS first |
| **Advertising Spend** | ✅ Yes | 48K spend across 21 campaigns | - |
| **ROAS (overall)** | ✅ Yes | 5.75 average | - |
| **ROAS (per week)** | ⚠️ Query Issue | Empty response for specific weeks | Fix backend query |

**Summary:**
- **Margin %:** Cannot be calculated because COGS data is missing from the database
- **ROAS:** Data exists but backend query is not returning results for specific date ranges

**Next Steps:**
1. Assign COGS to products to enable Margin % calculation
2. Debug advertising analytics endpoint for weekly ROAS display
3. Verify frontend is handling null/empty responses correctly
